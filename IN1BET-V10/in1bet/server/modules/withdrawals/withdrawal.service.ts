import { db } from "../../db";
import { 
  pixWithdrawals, 
  users, 
  wallets,
  adminAuditLogs,
  TransactionType,
  WithdrawalStatus,
  AdminAction,
  type PixWithdrawal,
  type User,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { 
  processBalanceChange, 
  clearLockedBalance,
  getWalletBalance,
} from "../wallet/wallet.service";
import { checkRolloverForWithdrawal } from "../bonus/bonus.service";
import { isAutoWithdrawGlobalEnabled, getMaxAutoWithdrawAmount } from "../settings/settings.service";
import { 
  logAutoWithdrawLimitExceeded, 
  logAutoWithdrawFailed, 
  logAutoWithdrawSuccess 
} from "../../utils/operationalLog";

const MIN_WITHDRAWAL_AMOUNT = 20;

/**
 * Check if a user is eligible for automatic PIX withdrawal.
 * Auto-withdraw is enabled if:
 * 1. User has KYC verified
 * 2. No pending rollover
 * 3. Either global auto-withdraw is enabled OR user has individual permission
 * 4. Amount does not exceed maxAutoWithdrawAmount
 */
export async function isAutoWithdrawEligible(
  userId: string,
  amount?: number
): Promise<{
  eligible: boolean;
  reason?: string;
  maxAmount?: number;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return { eligible: false, reason: "Usuário não encontrado" };
  }

  if (user.kycStatus !== "verified") {
    return { eligible: false, reason: "KYC não verificado" };
  }

  const rolloverCheck = await checkRolloverForWithdrawal(userId);
  if (!rolloverCheck.canWithdraw) {
    return { eligible: false, reason: "Rollover pendente" };
  }

  const globalEnabled = await isAutoWithdrawGlobalEnabled();
  const userAllowed = user.autoWithdrawAllowed;
  
  if (!globalEnabled && !userAllowed) {
    return { eligible: false, reason: "Saque automático não habilitado" };
  }

  const maxAutoWithdraw = await getMaxAutoWithdrawAmount();
  
  if (amount !== undefined && amount > maxAutoWithdraw) {
    return { 
      eligible: false, 
      reason: `Valor excede limite automático de R$ ${maxAutoWithdraw.toFixed(2)}`,
      maxAmount: maxAutoWithdraw,
    };
  }

  return { eligible: true, maxAmount: maxAutoWithdraw };
}

/**
 * Process automatic withdrawal (approve + pay in one step).
 * Only called when user is eligible for auto-withdraw.
 */
async function processAutoWithdrawal(
  withdrawal: PixWithdrawal
): Promise<{ success: boolean; error?: string }> {
  const amount = parseFloat(withdrawal.amount);
  
  const [approvedWithdrawal] = await db
    .update(pixWithdrawals)
    .set({
      status: WithdrawalStatus.APPROVED,
      approvedBy: "SYSTEM_AUTO",
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pixWithdrawals.id, withdrawal.id))
    .returning();

  const referenceId = `WITHDRAW_AUTO_PAID_${withdrawal.id}_${Date.now()}`;
  
  const clearResult = await clearLockedBalance(
    withdrawal.userId,
    amount,
    referenceId,
    `Saque PIX automático - ${withdrawal.pixKey}`
  );

  if (!clearResult.success) {
    console.error(`Auto-withdraw clear balance failed for ${withdrawal.id}:`, clearResult.error);
    return { success: false, error: clearResult.error };
  }

  await db
    .update(pixWithdrawals)
    .set({
      status: WithdrawalStatus.PAID,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pixWithdrawals.id, withdrawal.id));

  await db.insert(adminAuditLogs).values({
    adminId: "SYSTEM_AUTO",
    action: AdminAction.WITHDRAWAL_AUTO_PAY,
    targetType: "WITHDRAWAL",
    targetId: withdrawal.id,
    dataBefore: JSON.stringify({ status: "PENDING", userId: withdrawal.userId }),
    dataAfter: JSON.stringify({ status: "PAID", amount: withdrawal.amount }),
  });

  console.log(`[AUTO-WITHDRAW] Withdrawal ${withdrawal.id} auto-processed for user ${withdrawal.userId}, amount R$ ${amount}`);

  return { success: true };
}

export interface WithdrawalResult {
  success: boolean;
  withdrawal?: PixWithdrawal;
  error?: string;
}

/**
 * Request a PIX withdrawal.
 * 
 * IMPORTANT INVARIANT: Withdrawals are only created when rolloverRemaining = 0.
 * This is enforced by checkRolloverForWithdrawal() before any balance reservation.
 * Therefore, when a withdrawal is rejected/released, no bonus rollback is needed
 * since the bonus was already completed before the withdrawal was created.
 */
export async function requestWithdrawal(
  userId: string,
  amount: number,
  pixKey: string,
  pixKeyType: string
): Promise<WithdrawalResult> {
  if (amount < MIN_WITHDRAWAL_AMOUNT) {
    return { success: false, error: `Valor mínimo de saque é R$ ${MIN_WITHDRAWAL_AMOUNT},00` };
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return { success: false, error: "Usuário não encontrado" };
  }

  if (user.isBlocked) {
    return { success: false, error: "Sua conta está bloqueada. Entre em contato com o suporte." };
  }

  if (user.kycStatus !== "verified") {
    return { success: false, error: "É necessário validar seus dados (KYC) antes de sacar" };
  }

  const rolloverCheck = await checkRolloverForWithdrawal(userId);
  if (!rolloverCheck.canWithdraw) {
    return { success: false, error: rolloverCheck.message || "Rollover pendente" };
  }

  const walletBalance = await getWalletBalance(userId);
  
  if (!walletBalance) {
    return { success: false, error: "Carteira não encontrada" };
  }

  if (walletBalance.balance < amount) {
    return { success: false, error: "Saldo insuficiente" };
  }

  const referenceId = `WITHDRAW_${userId}_${Date.now()}`;

  const reserveResult = await processBalanceChange(
    userId,
    amount,
    TransactionType.WITHDRAW_RESERVE,
    `Reserva para saque PIX - ${pixKey}`,
    referenceId,
    { pixKey, pixKeyType }
  );

  if (!reserveResult.success) {
    return { success: false, error: reserveResult.error || "Erro ao reservar saldo" };
  }

  try {
    const [withdrawal] = await db
      .insert(pixWithdrawals)
      .values({
        userId,
        amount: amount.toFixed(2),
        pixKey,
        pixKeyType,
        transactionId: reserveResult.transaction?.id,
      })
      .returning();

    console.log(`Withdrawal requested: ${withdrawal.id} for user ${userId}, amount R$ ${amount}`);

    const autoEligibility = await isAutoWithdrawEligible(userId, amount);
    
    if (autoEligibility.eligible) {
      console.log(`[AUTO-WITHDRAW] User ${userId} eligible for auto-withdraw, processing...`);
      
      const autoResult = await processAutoWithdrawal(withdrawal);
      
      if (autoResult.success) {
        logAutoWithdrawSuccess(userId, withdrawal.id, amount);
        
        const [paidWithdrawal] = await db
          .select()
          .from(pixWithdrawals)
          .where(eq(pixWithdrawals.id, withdrawal.id));
        
        return { success: true, withdrawal: paidWithdrawal };
      } else {
        logAutoWithdrawFailed(userId, withdrawal.id, autoResult.error || "Unknown error");
        console.error(`[AUTO-WITHDRAW] Failed for ${withdrawal.id}: ${autoResult.error}`);
      }
    } else if (autoEligibility.maxAmount !== undefined && amount > autoEligibility.maxAmount) {
      logAutoWithdrawLimitExceeded(userId, withdrawal.id, amount, autoEligibility.maxAmount);
      
      await db.insert(adminAuditLogs).values({
        adminId: "SYSTEM_AUTO",
        action: AdminAction.AUTO_WITHDRAW_LIMIT_EXCEEDED,
        targetType: "WITHDRAWAL",
        targetId: withdrawal.id,
        dataAfter: JSON.stringify({ 
          amount, 
          maxAmount: autoEligibility.maxAmount,
          reason: "Valor excede limite de saque automático" 
        }),
      });
    }

    return { success: true, withdrawal };
  } catch (error: any) {
    console.error("Withdrawal request error:", error);
    
    const releaseReferenceId = `WITHDRAW_FAILED_${userId}_${Date.now()}`;
    try {
      const releaseResult = await processBalanceChange(
        userId,
        amount,
        TransactionType.WITHDRAW_RELEASE,
        `Falha ao criar saque - saldo liberado`,
        releaseReferenceId,
        { error: "insert_failed" }
      );
      
      if (!releaseResult.success) {
        console.error(`CRITICAL: Failed to release locked balance for user ${userId}, amount R$ ${amount}. Manual intervention required.`);
      }
    } catch (releaseError) {
      console.error(`CRITICAL: Exception releasing locked balance for user ${userId}, amount R$ ${amount}:`, releaseError);
    }
    
    return { success: false, error: "Erro ao criar solicitação de saque" };
  }
}

export async function getUserWithdrawals(
  userId: string,
  limit: number = 20
): Promise<PixWithdrawal[]> {
  return await db
    .select()
    .from(pixWithdrawals)
    .where(eq(pixWithdrawals.userId, userId))
    .orderBy(desc(pixWithdrawals.createdAt))
    .limit(limit);
}

export async function getWithdrawalById(
  withdrawalId: string,
  userId?: string
): Promise<PixWithdrawal | null> {
  const conditions = userId 
    ? and(eq(pixWithdrawals.id, withdrawalId), eq(pixWithdrawals.userId, userId))
    : eq(pixWithdrawals.id, withdrawalId);

  const [withdrawal] = await db
    .select()
    .from(pixWithdrawals)
    .where(conditions);

  return withdrawal || null;
}

export async function getAllPendingWithdrawals(): Promise<(PixWithdrawal & { user: User })[]> {
  const withdrawals = await db
    .select()
    .from(pixWithdrawals)
    .where(eq(pixWithdrawals.status, WithdrawalStatus.PENDING))
    .orderBy(desc(pixWithdrawals.createdAt));

  const result = [];
  for (const w of withdrawals) {
    const [user] = await db.select().from(users).where(eq(users.id, w.userId));
    if (user) {
      result.push({ ...w, user });
    }
  }

  return result;
}

export async function getAllWithdrawals(limit: number = 50): Promise<(PixWithdrawal & { user: User })[]> {
  const withdrawals = await db
    .select()
    .from(pixWithdrawals)
    .orderBy(desc(pixWithdrawals.createdAt))
    .limit(limit);

  const result = [];
  for (const w of withdrawals) {
    const [user] = await db.select().from(users).where(eq(users.id, w.userId));
    if (user) {
      result.push({ ...w, user });
    }
  }

  return result;
}

export async function approveWithdrawal(
  withdrawalId: string,
  adminId: string
): Promise<WithdrawalResult> {
  const withdrawal = await getWithdrawalById(withdrawalId);

  if (!withdrawal) {
    return { success: false, error: "Saque não encontrado" };
  }

  if (withdrawal.status !== WithdrawalStatus.PENDING) {
    return { success: false, error: "Saque não está pendente" };
  }

  const [updatedWithdrawal] = await db
    .update(pixWithdrawals)
    .set({
      status: WithdrawalStatus.APPROVED,
      approvedBy: adminId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pixWithdrawals.id, withdrawalId))
    .returning();

  console.log(`Withdrawal approved: ${withdrawalId} by admin ${adminId}`);

  return { success: true, withdrawal: updatedWithdrawal };
}

export async function rejectWithdrawal(
  withdrawalId: string,
  adminId: string,
  reason: string
): Promise<WithdrawalResult> {
  const withdrawal = await getWithdrawalById(withdrawalId);

  if (!withdrawal) {
    return { success: false, error: "Saque não encontrado" };
  }

  if (withdrawal.status !== WithdrawalStatus.PENDING) {
    return { success: false, error: "Saque não está pendente" };
  }

  const amount = parseFloat(withdrawal.amount);
  const referenceId = `WITHDRAW_REJECT_${withdrawalId}_${Date.now()}`;

  const releaseResult = await processBalanceChange(
    withdrawal.userId,
    amount,
    TransactionType.WITHDRAW_RELEASE,
    `Saque rejeitado: ${reason}`,
    referenceId,
    { withdrawalId, reason }
  );

  if (!releaseResult.success) {
    return { success: false, error: releaseResult.error || "Erro ao liberar saldo" };
  }

  const [updatedWithdrawal] = await db
    .update(pixWithdrawals)
    .set({
      status: WithdrawalStatus.REJECTED,
      rejectionReason: reason,
      approvedBy: adminId,
      updatedAt: new Date(),
    })
    .where(eq(pixWithdrawals.id, withdrawalId))
    .returning();

  console.log(`Withdrawal rejected: ${withdrawalId} by admin ${adminId}, reason: ${reason}`);

  return { success: true, withdrawal: updatedWithdrawal };
}

export async function markWithdrawalAsPaid(
  withdrawalId: string,
  adminId: string
): Promise<WithdrawalResult> {
  const withdrawal = await getWithdrawalById(withdrawalId);

  if (!withdrawal) {
    return { success: false, error: "Saque não encontrado" };
  }

  if (withdrawal.status !== WithdrawalStatus.APPROVED) {
    return { success: false, error: "Saque precisa estar aprovado para ser pago" };
  }

  const amount = parseFloat(withdrawal.amount);
  const referenceId = `WITHDRAW_PAID_${withdrawalId}_${Date.now()}`;

  const clearResult = await clearLockedBalance(
    withdrawal.userId,
    amount,
    referenceId,
    `Saque PIX pago - ${withdrawal.pixKey}`
  );

  if (!clearResult.success) {
    return { success: false, error: clearResult.error || "Erro ao processar pagamento" };
  }

  const [updatedWithdrawal] = await db
    .update(pixWithdrawals)
    .set({
      status: WithdrawalStatus.PAID,
      paidAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(pixWithdrawals.id, withdrawalId))
    .returning();

  console.log(`Withdrawal paid: ${withdrawalId} by admin ${adminId}`);

  return { success: true, withdrawal: updatedWithdrawal };
}
