import { db } from "../../db";
import {
  promoCodes,
  promoCodeUses,
  wallets,
  transactions,
  users,
  TransactionType,
  TransactionStatus,
  type PromoCode,
  type PromoCodeUse,
} from "@shared/schema";
import { eq, and, desc, sql, gte, lte, ilike, or } from "drizzle-orm";

export interface PromoCodeResult {
  success: boolean;
  error?: string;
  promoCode?: PromoCode;
}

export interface UsePromoCodeResult {
  success: boolean;
  error?: string;
  bonusAmount?: number;
  rolloverTotal?: number;
  promoCode?: PromoCode;
}

export interface PromoCodeStats {
  totalUses: number;
  uniqueUsers: number;
  totalBonusGiven: number;
  recentUses: Array<{
    userName: string;
    userEmail: string;
    bonusAmount: number;
    usedAt: Date;
  }>;
}

export async function createPromoCode(
  data: {
    code: string;
    description?: string;
    type: string;
    value: number;
    minDeposit?: number | null;
    maxUses?: number | null;
    maxUsesPerUser?: number;
    startsAt: string | Date;
    expiresAt: string | Date;
    rolloverMultiplier?: number;
  },
  adminId: string
): Promise<PromoCodeResult> {
  try {
    const existingCode = await db
      .select()
      .from(promoCodes)
      .where(eq(promoCodes.code, data.code.toUpperCase()));

    if (existingCode.length > 0) {
      return { success: false, error: "Código promocional já existe" };
    }

    const [promoCode] = await db
      .insert(promoCodes)
      .values({
        code: data.code.toUpperCase(),
        description: data.description || null,
        type: data.type,
        value: data.value.toFixed(2),
        minDeposit: data.minDeposit ? data.minDeposit.toFixed(2) : null,
        maxUses: data.maxUses || null,
        maxUsesPerUser: data.maxUsesPerUser || 1,
        startsAt: new Date(data.startsAt),
        expiresAt: new Date(data.expiresAt),
        rolloverMultiplier: (data.rolloverMultiplier || 1).toFixed(2),
        createdBy: adminId,
      })
      .returning();

    console.log(`Promo code created: ${promoCode.code} by admin ${adminId}`);
    return { success: true, promoCode };
  } catch (error: any) {
    console.error("Create promo code error:", error);
    return { success: false, error: "Erro ao criar código promocional" };
  }
}

export async function getPromoCodes(options?: {
  page?: number;
  limit?: number;
  status?: "active" | "inactive" | "expired" | "all";
  type?: string;
  search?: string;
}): Promise<{ promoCodes: PromoCode[]; total: number }> {
  const page = options?.page || 1;
  const limit = options?.limit || 20;
  const offset = (page - 1) * limit;
  const now = new Date();

  let conditions: any[] = [];

  if (options?.status === "active") {
    conditions.push(
      and(
        eq(promoCodes.isActive, true),
        lte(promoCodes.startsAt, now),
        gte(promoCodes.expiresAt, now)
      )
    );
  } else if (options?.status === "inactive") {
    conditions.push(eq(promoCodes.isActive, false));
  } else if (options?.status === "expired") {
    conditions.push(lte(promoCodes.expiresAt, now));
  }

  if (options?.type) {
    conditions.push(eq(promoCodes.type, options.type));
  }

  if (options?.search) {
    conditions.push(
      or(
        ilike(promoCodes.code, `%${options.search}%`),
        ilike(promoCodes.description, `%${options.search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [codesResult, countResult] = await Promise.all([
    db
      .select()
      .from(promoCodes)
      .where(whereClause)
      .orderBy(desc(promoCodes.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(promoCodes)
      .where(whereClause),
  ]);

  return {
    promoCodes: codesResult,
    total: countResult[0]?.count || 0,
  };
}

export async function getPromoCodeByCode(code: string): Promise<PromoCode | null> {
  const [promoCode] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code.toUpperCase()));
  return promoCode || null;
}

export async function getPromoCodeById(id: string): Promise<PromoCode | null> {
  const [promoCode] = await db.select().from(promoCodes).where(eq(promoCodes.id, id));
  return promoCode || null;
}

export async function validatePromoCode(
  code: string,
  userId: string,
  depositAmount?: number
): Promise<{ valid: boolean; error?: string; promoCode?: PromoCode }> {
  const promoCode = await getPromoCodeByCode(code);

  if (!promoCode) {
    return { valid: false, error: "Código promocional não encontrado" };
  }

  if (!promoCode.isActive) {
    return { valid: false, error: "Código promocional está desativado" };
  }

  const now = new Date();

  if (now < new Date(promoCode.startsAt)) {
    return { valid: false, error: "Código promocional ainda não está ativo" };
  }

  if (now > new Date(promoCode.expiresAt)) {
    return { valid: false, error: "Código promocional expirou" };
  }

  if (promoCode.maxUses !== null && promoCode.usesCount >= promoCode.maxUses) {
    return { valid: false, error: "Código promocional atingiu o limite de usos" };
  }

  const userUses = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(promoCodeUses)
    .where(
      and(
        eq(promoCodeUses.promoCodeId, promoCode.id),
        eq(promoCodeUses.userId, userId)
      )
    );

  if (userUses[0].count >= promoCode.maxUsesPerUser) {
    return { valid: false, error: "Você já utilizou este código promocional" };
  }

  if (promoCode.minDeposit && depositAmount !== undefined) {
    const minDeposit = parseFloat(promoCode.minDeposit);
    if (depositAmount < minDeposit) {
      return {
        valid: false,
        error: `Depósito mínimo de R$ ${minDeposit.toFixed(2)} necessário`,
      };
    }
  }

  return { valid: true, promoCode };
}

export async function usePromoCode(
  code: string,
  userId: string,
  depositAmount?: number,
  depositId?: string
): Promise<UsePromoCodeResult> {
  const validation = await validatePromoCode(code, userId, depositAmount);

  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const promoCode = validation.promoCode!;
  const value = parseFloat(promoCode.value);
  const rolloverMultiplier = parseFloat(promoCode.rolloverMultiplier);

  let bonusAmount: number;

  switch (promoCode.type) {
    case "BONUS_FIXED":
    case "FREE_BET":
      bonusAmount = value;
      break;
    case "BONUS_PERCENT":
      if (!depositAmount || depositAmount <= 0) {
        return { success: false, error: "Valor de depósito necessário para bônus percentual" };
      }
      bonusAmount = (depositAmount * value) / 100;
      break;
    case "CASHBACK":
      bonusAmount = value;
      break;
    default:
      bonusAmount = value;
  }

  bonusAmount = Math.round(bonusAmount * 100) / 100;
  const rolloverTotal = bonusAmount * rolloverMultiplier;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(promoCodeUses).values({
        promoCodeId: promoCode.id,
        userId,
        depositId: depositId || null,
        bonusAmount: bonusAmount.toFixed(2),
      });

      await tx
        .update(promoCodes)
        .set({
          usesCount: sql`${promoCodes.usesCount} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(promoCodes.id, promoCode.id));

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
        balanceBefore: wallet.bonusBalance,
        balanceAfter: (currentBonusBalance + bonusAmount).toFixed(2),
        status: TransactionStatus.COMPLETED,
        referenceId: `PROMO-${promoCode.code}-${Date.now()}`,
        description: `Código promocional: ${promoCode.code}`,
      });
    });

    console.log(`Promo code ${code} used by user ${userId}, bonus: ${bonusAmount}`);
    return {
      success: true,
      bonusAmount,
      rolloverTotal,
      promoCode,
    };
  } catch (error: any) {
    console.error("Use promo code error:", error);
    return { success: false, error: "Erro ao aplicar código promocional" };
  }
}

export async function updatePromoCode(
  id: string,
  data: Partial<{
    description: string;
    value: number;
    minDeposit: number | null;
    maxUses: number | null;
    maxUsesPerUser: number;
    startsAt: string | Date;
    expiresAt: string | Date;
    isActive: boolean;
    rolloverMultiplier: number;
  }>
): Promise<PromoCodeResult> {
  try {
    const updateData: any = { updatedAt: new Date() };

    if (data.description !== undefined) updateData.description = data.description;
    if (data.value !== undefined) updateData.value = data.value.toFixed(2);
    if (data.minDeposit !== undefined) {
      updateData.minDeposit = data.minDeposit ? data.minDeposit.toFixed(2) : null;
    }
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses;
    if (data.maxUsesPerUser !== undefined) updateData.maxUsesPerUser = data.maxUsesPerUser;
    if (data.startsAt !== undefined) updateData.startsAt = new Date(data.startsAt);
    if (data.expiresAt !== undefined) updateData.expiresAt = new Date(data.expiresAt);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.rolloverMultiplier !== undefined) {
      updateData.rolloverMultiplier = data.rolloverMultiplier.toFixed(2);
    }

    const [promoCode] = await db
      .update(promoCodes)
      .set(updateData)
      .where(eq(promoCodes.id, id))
      .returning();

    return { success: true, promoCode };
  } catch (error: any) {
    console.error("Update promo code error:", error);
    return { success: false, error: "Erro ao atualizar código promocional" };
  }
}

export async function deactivatePromoCode(id: string): Promise<PromoCodeResult> {
  try {
    const [promoCode] = await db
      .update(promoCodes)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(promoCodes.id, id))
      .returning();

    return { success: true, promoCode };
  } catch (error: any) {
    console.error("Deactivate promo code error:", error);
    return { success: false, error: "Erro ao desativar código promocional" };
  }
}

export async function togglePromoCodeStatus(id: string): Promise<PromoCodeResult> {
  try {
    const promoCode = await getPromoCodeById(id);
    if (!promoCode) {
      return { success: false, error: "Código promocional não encontrado" };
    }

    const [updated] = await db
      .update(promoCodes)
      .set({ isActive: !promoCode.isActive, updatedAt: new Date() })
      .where(eq(promoCodes.id, id))
      .returning();

    return { success: true, promoCode: updated };
  } catch (error: any) {
    console.error("Toggle promo code error:", error);
    return { success: false, error: "Erro ao alterar status do código" };
  }
}

export async function getPromoCodeStats(id: string): Promise<PromoCodeStats | null> {
  const promoCode = await getPromoCodeById(id);
  if (!promoCode) return null;

  const [usageStats] = await db
    .select({
      totalUses: sql<number>`count(*)::int`,
      uniqueUsers: sql<number>`count(distinct ${promoCodeUses.userId})::int`,
      totalBonusGiven: sql<number>`coalesce(sum(${promoCodeUses.bonusAmount}::numeric), 0)::float`,
    })
    .from(promoCodeUses)
    .where(eq(promoCodeUses.promoCodeId, id));

  const recentUses = await db
    .select({
      userName: users.name,
      userEmail: users.email,
      bonusAmount: promoCodeUses.bonusAmount,
      usedAt: promoCodeUses.usedAt,
    })
    .from(promoCodeUses)
    .innerJoin(users, eq(promoCodeUses.userId, users.id))
    .where(eq(promoCodeUses.promoCodeId, id))
    .orderBy(desc(promoCodeUses.usedAt))
    .limit(20);

  return {
    totalUses: usageStats.totalUses,
    uniqueUsers: usageStats.uniqueUsers,
    totalBonusGiven: usageStats.totalBonusGiven,
    recentUses: recentUses.map((u) => ({
      userName: u.userName,
      userEmail: u.userEmail,
      bonusAmount: parseFloat(u.bonusAmount),
      usedAt: u.usedAt,
    })),
  };
}

export async function getUserPromoCodeHistory(userId: string): Promise<
  Array<{
    code: string;
    type: string;
    bonusAmount: number;
    usedAt: Date;
  }>
> {
  const history = await db
    .select({
      code: promoCodes.code,
      type: promoCodes.type,
      bonusAmount: promoCodeUses.bonusAmount,
      usedAt: promoCodeUses.usedAt,
    })
    .from(promoCodeUses)
    .innerJoin(promoCodes, eq(promoCodeUses.promoCodeId, promoCodes.id))
    .where(eq(promoCodeUses.userId, userId))
    .orderBy(desc(promoCodeUses.usedAt));

  return history.map((h) => ({
    code: h.code,
    type: h.type,
    bonusAmount: parseFloat(h.bonusAmount),
    usedAt: h.usedAt,
  }));
}
