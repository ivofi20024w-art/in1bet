import { db } from "../../db";
import {
  bonuses,
  userBonuses,
  wallets,
  transactions,
  pixDeposits,
  welcomeBonusClaims,
  TransactionType,
  TransactionStatus,
  UserBonusStatus,
  BonusType,
  type Bonus,
  type UserBonus,
  type Wallet,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface BonusResult {
  success: boolean;
  error?: string;
  bonus?: Bonus;
  userBonus?: UserBonus;
}

export interface ApplyBonusResult {
  success: boolean;
  error?: string;
  bonusAmount?: number;
  rolloverTotal?: number;
  userBonus?: UserBonus;
}

export async function getActiveBonuses(): Promise<Bonus[]> {
  return await db
    .select()
    .from(bonuses)
    .where(eq(bonuses.isActive, true))
    .orderBy(desc(bonuses.createdAt));
}

export async function getAllBonuses(): Promise<Bonus[]> {
  return await db.select().from(bonuses).orderBy(desc(bonuses.createdAt));
}

export async function getBonusById(bonusId: string): Promise<Bonus | null> {
  const [bonus] = await db.select().from(bonuses).where(eq(bonuses.id, bonusId));
  return bonus || null;
}

export async function createBonus(data: {
  name: string;
  description?: string;
  type: string;
  percentage: number;
  maxValue: number;
  fixedAmount?: number;
  maxWithdrawal?: number;
  rolloverMultiplier: number;
  minDeposit?: number;
  isFirstDepositOnly?: boolean;
  validDays?: number;
}): Promise<BonusResult> {
  try {
    const [bonus] = await db
      .insert(bonuses)
      .values({
        name: data.name,
        description: data.description || null,
        type: data.type,
        percentage: data.percentage.toFixed(2),
        maxValue: data.maxValue.toFixed(2),
        fixedAmount: (data.fixedAmount || 0).toFixed(2),
        maxWithdrawal: (data.maxWithdrawal || 0).toFixed(2),
        rolloverMultiplier: data.rolloverMultiplier.toFixed(2),
        minDeposit: (data.minDeposit || 0).toFixed(2),
        isFirstDepositOnly: data.isFirstDepositOnly || false,
        validDays: (data.validDays || 30).toString(),
      })
      .returning();

    console.log(`Bonus created: ${bonus.id} - ${bonus.name}`);
    return { success: true, bonus };
  } catch (error: any) {
    console.error("Create bonus error:", error);
    return { success: false, error: "Erro ao criar bônus" };
  }
}

export async function updateBonus(
  bonusId: string,
  data: Partial<{
    name: string;
    description: string;
    type: string;
    percentage: number;
    maxValue: number;
    fixedAmount: number;
    maxWithdrawal: number;
    rolloverMultiplier: number;
    minDeposit: number;
    isFirstDepositOnly: boolean;
    validDays: number;
    isActive: boolean;
  }>
): Promise<BonusResult> {
  try {
    const updateData: any = { updatedAt: new Date() };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.percentage !== undefined) updateData.percentage = data.percentage.toFixed(2);
    if (data.maxValue !== undefined) updateData.maxValue = data.maxValue.toFixed(2);
    if (data.fixedAmount !== undefined) updateData.fixedAmount = data.fixedAmount.toFixed(2);
    if (data.maxWithdrawal !== undefined) updateData.maxWithdrawal = data.maxWithdrawal.toFixed(2);
    if (data.rolloverMultiplier !== undefined) updateData.rolloverMultiplier = data.rolloverMultiplier.toFixed(2);
    if (data.minDeposit !== undefined) updateData.minDeposit = data.minDeposit.toFixed(2);
    if (data.isFirstDepositOnly !== undefined) updateData.isFirstDepositOnly = data.isFirstDepositOnly;
    if (data.validDays !== undefined) updateData.validDays = data.validDays.toString();
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [bonus] = await db
      .update(bonuses)
      .set(updateData)
      .where(eq(bonuses.id, bonusId))
      .returning();

    return { success: true, bonus };
  } catch (error: any) {
    console.error("Update bonus error:", error);
    return { success: false, error: "Erro ao atualizar bônus" };
  }
}

export async function toggleBonusStatus(bonusId: string): Promise<BonusResult> {
  try {
    const bonus = await getBonusById(bonusId);
    if (!bonus) {
      return { success: false, error: "Bônus não encontrado" };
    }

    const [updated] = await db
      .update(bonuses)
      .set({ isActive: !bonus.isActive, updatedAt: new Date() })
      .where(eq(bonuses.id, bonusId))
      .returning();

    return { success: true, bonus: updated };
  } catch (error: any) {
    console.error("Toggle bonus error:", error);
    return { success: false, error: "Erro ao alterar status do bônus" };
  }
}

export async function getUserDepositCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pixDeposits)
    .where(and(eq(pixDeposits.userId, userId), eq(pixDeposits.status, "COMPLETED")));
  return result?.count || 0;
}

export async function getApplicableBonus(
  userId: string,
  depositAmount: number
): Promise<Bonus | null> {
  const depositCount = await getUserDepositCount(userId);
  const isFirstDeposit = depositCount === 0;

  const existingActiveBonuses = await getUserActiveBonuses(userId);
  if (existingActiveBonuses.length > 0) {
    console.log(`User ${userId} already has active bonus, skipping new bonus application`);
    return null;
  }

  const activeBonuses = await getActiveBonuses();

  for (const bonus of activeBonuses) {
    const minDeposit = parseFloat(bonus.minDeposit);
    
    if (depositAmount < minDeposit) continue;
    
    if (bonus.isFirstDepositOnly && !isFirstDeposit) continue;
    
    if (bonus.type === BonusType.FIRST_DEPOSIT && !isFirstDeposit) continue;
    
    if (bonus.type === BonusType.RELOAD && isFirstDeposit) continue;

    return bonus;
  }

  return null;
}

export async function applyBonusToDeposit(
  userId: string,
  depositId: string,
  depositAmount: number,
  bonus: Bonus
): Promise<ApplyBonusResult> {
  try {
    const percentage = parseFloat(bonus.percentage);
    const maxValue = parseFloat(bonus.maxValue);
    const rolloverMultiplier = parseFloat(bonus.rolloverMultiplier);
    const validDays = parseInt(bonus.validDays);

    let bonusAmount = (depositAmount * percentage) / 100;
    bonusAmount = Math.min(bonusAmount, maxValue);
    bonusAmount = Math.round(bonusAmount * 100) / 100;

    const rolloverTotal = bonusAmount * rolloverMultiplier;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validDays);

    const [userBonus] = await db
      .insert(userBonuses)
      .values({
        userId,
        bonusId: bonus.id,
        depositId,
        bonusAmount: bonusAmount.toFixed(2),
        rolloverTotal: rolloverTotal.toFixed(2),
        rolloverRemaining: rolloverTotal.toFixed(2),
        status: UserBonusStatus.ACTIVE,
        expiresAt,
      })
      .returning();

    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    
    if (!wallet) {
      return { success: false, error: "Carteira não encontrada" };
    }

    const currentBonusBalance = parseFloat(wallet.bonusBalance);
    const currentRolloverRemaining = parseFloat(wallet.rolloverRemaining);
    const currentRolloverTotal = parseFloat(wallet.rolloverTotal);

    await db
      .update(wallets)
      .set({
        bonusBalance: (currentBonusBalance + bonusAmount).toFixed(2),
        rolloverRemaining: (currentRolloverRemaining + rolloverTotal).toFixed(2),
        rolloverTotal: (currentRolloverTotal + rolloverTotal).toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    await db.insert(transactions).values({
      userId,
      walletId: wallet.id,
      type: TransactionType.BONUS_CREDIT,
      amount: bonusAmount.toFixed(2),
      balanceBefore: currentBonusBalance.toFixed(2),
      balanceAfter: (currentBonusBalance + bonusAmount).toFixed(2),
      status: TransactionStatus.COMPLETED,
      referenceId: `BONUS_${userBonus.id}`,
      description: `Bônus ${bonus.name} aplicado`,
      metadata: JSON.stringify({
        bonusId: bonus.id,
        bonusName: bonus.name,
        depositId,
        rolloverTotal,
        rolloverMultiplier,
      }),
    });

    console.log(
      `Bonus applied: ${bonus.name} - R$ ${bonusAmount} for user ${userId}, rollover: R$ ${rolloverTotal}`
    );

    return {
      success: true,
      bonusAmount,
      rolloverTotal,
      userBonus,
    };
  } catch (error: any) {
    console.error("Apply bonus error:", error);
    return { success: false, error: "Erro ao aplicar bônus" };
  }
}

export async function getUserActiveBonuses(userId: string): Promise<UserBonus[]> {
  return await db
    .select()
    .from(userBonuses)
    .where(and(eq(userBonuses.userId, userId), eq(userBonuses.status, UserBonusStatus.ACTIVE)))
    .orderBy(desc(userBonuses.createdAt));
}

export async function getUserBonusHistory(userId: string, limit: number = 20): Promise<UserBonus[]> {
  return await db
    .select()
    .from(userBonuses)
    .where(eq(userBonuses.userId, userId))
    .orderBy(desc(userBonuses.createdAt))
    .limit(limit);
}

export async function consumeRollover(
  userId: string,
  betAmount: number
): Promise<{ success: boolean; rolloverConsumed: number; rolloverRemaining: number }> {
  try {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    
    if (!wallet) {
      return { success: false, rolloverConsumed: 0, rolloverRemaining: 0 };
    }

    const currentRollover = parseFloat(wallet.rolloverRemaining);
    
    if (currentRollover <= 0) {
      return { success: true, rolloverConsumed: 0, rolloverRemaining: 0 };
    }

    const rolloverConsumed = Math.min(betAmount, currentRollover);
    const newRolloverRemaining = Math.max(0, currentRollover - betAmount);

    await db
      .update(wallets)
      .set({
        rolloverRemaining: newRolloverRemaining.toFixed(2),
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    const activeBonuses = await getUserActiveBonuses(userId);
    let remainingConsumption = rolloverConsumed;

    for (const ub of activeBonuses) {
      if (remainingConsumption <= 0) break;

      const ubRolloverRemaining = parseFloat(ub.rolloverRemaining);
      const consumed = Math.min(remainingConsumption, ubRolloverRemaining);
      const newUbRollover = ubRolloverRemaining - consumed;

      const updateData: any = {
        rolloverRemaining: newUbRollover.toFixed(2),
        updatedAt: new Date(),
      };

      if (newUbRollover <= 0) {
        updateData.status = UserBonusStatus.COMPLETED;
        updateData.completedAt = new Date();
      }

      await db
        .update(userBonuses)
        .set(updateData)
        .where(eq(userBonuses.id, ub.id));

      remainingConsumption -= consumed;
    }

    if (newRolloverRemaining <= 0) {
      await convertBonusToReal(userId);
    }

    console.log(
      `Rollover consumed: R$ ${rolloverConsumed} for user ${userId}, remaining: R$ ${newRolloverRemaining}`
    );

    return {
      success: true,
      rolloverConsumed,
      rolloverRemaining: newRolloverRemaining,
    };
  } catch (error: any) {
    console.error("Consume rollover error:", error);
    return { success: false, rolloverConsumed: 0, rolloverRemaining: 0 };
  }
}

/**
 * Convert bonus balance to real balance after rollover completion.
 * Respects maxWithdrawal limit from the bonus template.
 * 
 * IMPORTANT: This is called when rolloverRemaining reaches 0, before the
 * userBonus status is marked as COMPLETED. Therefore we look up ACTIVE
 * bonuses with rolloverRemaining = 0, not COMPLETED ones.
 */
export async function convertBonusToReal(userId: string): Promise<boolean> {
  try {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
    
    if (!wallet) return false;

    const bonusBalance = parseFloat(wallet.bonusBalance);
    const realBalance = parseFloat(wallet.balance);

    if (bonusBalance <= 0) return true;

    const activeBonusesWithZeroRollover = await db
      .select()
      .from(userBonuses)
      .where(and(
        eq(userBonuses.userId, userId),
        eq(userBonuses.status, UserBonusStatus.ACTIVE)
      ))
      .orderBy(desc(userBonuses.createdAt))
      .limit(1);

    let amountToConvert = bonusBalance;
    let discarded = 0;

    if (activeBonusesWithZeroRollover.length > 0) {
      const userBonus = activeBonusesWithZeroRollover[0];
      const [bonus] = await db.select().from(bonuses).where(eq(bonuses.id, userBonus.bonusId));
      
      if (bonus && parseFloat(bonus.maxWithdrawal) > 0) {
        const maxWithdrawal = parseFloat(bonus.maxWithdrawal);
        if (bonusBalance > maxWithdrawal) {
          amountToConvert = maxWithdrawal;
          discarded = bonusBalance - maxWithdrawal;
          console.log(`Bonus capped to max withdrawal: R$ ${maxWithdrawal}, discarded: R$ ${discarded}`);
        }
      }
    }

    await db
      .update(wallets)
      .set({
        balance: (realBalance + amountToConvert).toFixed(2),
        bonusBalance: "0.00",
        rolloverRemaining: "0.00",
        rolloverTotal: "0.00",
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId));

    await db.insert(transactions).values({
      userId,
      walletId: wallet.id,
      type: TransactionType.BONUS_CONVERT,
      amount: amountToConvert.toFixed(2),
      balanceBefore: realBalance.toFixed(2),
      balanceAfter: (realBalance + amountToConvert).toFixed(2),
      status: TransactionStatus.COMPLETED,
      referenceId: `BONUS_CONVERT_${userId}_${Date.now()}`,
      description: discarded > 0 
        ? `Bônus convertido em saldo real (R$ ${discarded.toFixed(2)} descartado por limite máximo)`
        : `Bônus convertido em saldo real após rollover`,
    });

    console.log(`Bonus converted to real: R$ ${amountToConvert} for user ${userId}`);

    return true;
  } catch (error: any) {
    console.error("Convert bonus error:", error);
    return false;
  }
}

export async function cancelUserBonus(
  userBonusId: string,
  adminId: string,
  reason: string
): Promise<BonusResult> {
  try {
    const [userBonus] = await db
      .select()
      .from(userBonuses)
      .where(eq(userBonuses.id, userBonusId));

    if (!userBonus) {
      return { success: false, error: "Bônus do usuário não encontrado" };
    }

    if (userBonus.status !== UserBonusStatus.ACTIVE) {
      return { success: false, error: "Bônus não está ativo" };
    }

    const bonusAmount = parseFloat(userBonus.bonusAmount);
    const rolloverRemaining = parseFloat(userBonus.rolloverRemaining);

    const [wallet] = await db
      .select()
      .from(wallets)
      .where(eq(wallets.userId, userBonus.userId));

    if (wallet) {
      const currentBonusBalance = parseFloat(wallet.bonusBalance);
      const currentRolloverRemaining = parseFloat(wallet.rolloverRemaining);
      const currentRolloverTotal = parseFloat(wallet.rolloverTotal);
      const rolloverTotal = parseFloat(userBonus.rolloverTotal);

      await db
        .update(wallets)
        .set({
          bonusBalance: Math.max(0, currentBonusBalance - bonusAmount).toFixed(2),
          rolloverRemaining: Math.max(0, currentRolloverRemaining - rolloverRemaining).toFixed(2),
          rolloverTotal: Math.max(0, currentRolloverTotal - rolloverTotal).toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userBonus.userId));
    }

    await db
      .update(userBonuses)
      .set({
        status: UserBonusStatus.CANCELLED,
        updatedAt: new Date(),
      })
      .where(eq(userBonuses.id, userBonusId));

    console.log(`User bonus cancelled: ${userBonusId} by admin ${adminId}, reason: ${reason}`);

    return { success: true };
  } catch (error: any) {
    console.error("Cancel user bonus error:", error);
    return { success: false, error: "Erro ao cancelar bônus" };
  }
}

export async function checkRolloverForWithdrawal(userId: string): Promise<{
  canWithdraw: boolean;
  rolloverRemaining: number;
  message?: string;
}> {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  
  if (!wallet) {
    return { canWithdraw: false, rolloverRemaining: 0, message: "Carteira não encontrada" };
  }

  const rolloverRemaining = parseFloat(wallet.rolloverRemaining);

  if (rolloverRemaining > 0) {
    return {
      canWithdraw: false,
      rolloverRemaining,
      message: `Você precisa apostar R$ ${rolloverRemaining.toFixed(2)} para liberar seu saque.`,
    };
  }

  return { canWithdraw: true, rolloverRemaining: 0 };
}

export async function getWalletBonusInfo(userId: string): Promise<{
  bonusBalance: number;
  rolloverRemaining: number;
  rolloverTotal: number;
  rolloverProgress: number;
} | null> {
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  
  if (!wallet) return null;

  const bonusBalance = parseFloat(wallet.bonusBalance);
  const rolloverRemaining = parseFloat(wallet.rolloverRemaining);
  const rolloverTotal = parseFloat(wallet.rolloverTotal);
  
  const rolloverProgress = rolloverTotal > 0 
    ? Math.round(((rolloverTotal - rolloverRemaining) / rolloverTotal) * 100)
    : 100;

  return {
    bonusBalance,
    rolloverRemaining,
    rolloverTotal,
    rolloverProgress,
  };
}

/**
 * Check if CPF already claimed welcome bonus (anti-fraud).
 */
export async function hasCPFClaimedWelcomeBonus(cpf: string): Promise<boolean> {
  const cleanCPF = cpf.replace(/\D/g, '');
  const [claim] = await db
    .select()
    .from(welcomeBonusClaims)
    .where(eq(welcomeBonusClaims.cpf, cleanCPF));
  return !!claim;
}

/**
 * Get active no-deposit welcome bonus.
 */
export async function getActiveWelcomeBonus(): Promise<Bonus | null> {
  const [bonus] = await db
    .select()
    .from(bonuses)
    .where(and(
      eq(bonuses.type, BonusType.NO_DEPOSIT),
      eq(bonuses.isActive, true)
    ))
    .limit(1);
  return bonus || null;
}

/**
 * Apply welcome bonus to new user registration.
 * Called automatically after user registration.
 * Uses a transaction to ensure consistency between bonus credit and anti-fraud tracking.
 */
export async function applyWelcomeBonus(
  userId: string,
  cpf: string
): Promise<ApplyBonusResult> {
  const cleanCPF = cpf.replace(/\D/g, '');

  try {
    const alreadyClaimed = await hasCPFClaimedWelcomeBonus(cleanCPF);
    if (alreadyClaimed) {
      console.log(`CPF ${cleanCPF} already claimed welcome bonus`);
      return { success: false, error: "CPF já recebeu bônus de boas-vindas" };
    }

    const existingBonuses = await getUserActiveBonuses(userId);
    if (existingBonuses.length > 0) {
      console.log(`User ${userId} already has active bonus`);
      return { success: false, error: "Usuário já possui bônus ativo" };
    }

    const welcomeBonus = await getActiveWelcomeBonus();
    if (!welcomeBonus) {
      console.log("No active welcome bonus found");
      return { success: false, error: "Bônus de boas-vindas não disponível" };
    }

    const bonusAmount = parseFloat(welcomeBonus.fixedAmount) > 0 
      ? parseFloat(welcomeBonus.fixedAmount)
      : parseFloat(welcomeBonus.maxValue);
    
    const rolloverMultiplier = parseFloat(welcomeBonus.rolloverMultiplier);
    const rolloverTotal = bonusAmount * rolloverMultiplier;
    const validDays = parseInt(welcomeBonus.validDays);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + validDays);

    const result = await db.transaction(async (tx) => {
      const [userBonus] = await tx
        .insert(userBonuses)
        .values({
          userId,
          bonusId: welcomeBonus.id,
          depositId: null,
          bonusAmount: bonusAmount.toFixed(2),
          rolloverTotal: rolloverTotal.toFixed(2),
          rolloverRemaining: rolloverTotal.toFixed(2),
          status: UserBonusStatus.ACTIVE,
          expiresAt,
        })
        .returning();

      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      
      if (!wallet) {
        throw new Error("Carteira não encontrada");
      }

      const currentBonusBalance = parseFloat(wallet.bonusBalance);
      const currentRolloverRemaining = parseFloat(wallet.rolloverRemaining);
      const currentRolloverTotal = parseFloat(wallet.rolloverTotal);

      await tx
        .update(wallets)
        .set({
          bonusBalance: (currentBonusBalance + bonusAmount).toFixed(2),
          rolloverRemaining: (currentRolloverRemaining + rolloverTotal).toFixed(2),
          rolloverTotal: (currentRolloverTotal + rolloverTotal).toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, userId));

      await tx.insert(transactions).values({
        userId,
        walletId: wallet.id,
        type: TransactionType.BONUS_CREDIT,
        amount: bonusAmount.toFixed(2),
        balanceBefore: currentBonusBalance.toFixed(2),
        balanceAfter: (currentBonusBalance + bonusAmount).toFixed(2),
        status: TransactionStatus.COMPLETED,
        referenceId: `WELCOME_BONUS_${userBonus.id}`,
        description: `Bônus de boas-vindas R$ ${bonusAmount.toFixed(2)} - Rollover ${rolloverMultiplier}x`,
        metadata: JSON.stringify({
          bonusId: welcomeBonus.id,
          bonusName: welcomeBonus.name,
          rolloverTotal,
          rolloverMultiplier,
          maxWithdrawal: parseFloat(welcomeBonus.maxWithdrawal),
        }),
      });

      await tx.insert(welcomeBonusClaims).values({
        cpf: cleanCPF,
        userId,
        bonusId: welcomeBonus.id,
        userBonusId: userBonus.id,
      });

      return userBonus;
    });

    console.log(
      `Welcome bonus applied: R$ ${bonusAmount} for user ${userId} (CPF: ${cleanCPF}), rollover: R$ ${rolloverTotal}`
    );

    return {
      success: true,
      bonusAmount,
      rolloverTotal,
      userBonus: result,
    };
  } catch (error: any) {
    console.error("Apply welcome bonus error:", error);
    return { success: false, error: "Erro ao aplicar bônus de boas-vindas" };
  }
}
