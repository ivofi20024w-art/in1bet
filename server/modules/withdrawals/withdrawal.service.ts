import { db } from "../../db";
import { 
  pixWithdrawals, 
  users, 
  wallets,
  TransactionType,
  WithdrawalStatus,
  type PixWithdrawal,
  type User,
} from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { 
  processBalanceChange, 
  clearLockedBalance,
  getWalletBalance,
} from "../wallet/wallet.service";

const MIN_WITHDRAWAL_AMOUNT = 20;

export interface WithdrawalResult {
  success: boolean;
  withdrawal?: PixWithdrawal;
  error?: string;
}

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

  if (user.kycStatus !== "verified") {
    return { success: false, error: "É necessário validar seus dados (KYC) antes de sacar" };
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
