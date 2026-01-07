import { db } from "../../db";
import { 
  users, 
  wallets, 
  transactions, 
  rakebackSettings, 
  rakebackPeriods, 
  rakebackPayouts,
  TransactionType,
  RakebackStatus,
} from "@shared/schema";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";

const DEFAULT_RAKEBACK_SETTINGS = [
  { vipTier: "bronze", percentLoss: "5.00", minLossThreshold: "100.00", maxRakebackPercent: "15.00", rolloverMultiple: 3 },
  { vipTier: "silver", percentLoss: "7.50", minLossThreshold: "100.00", maxRakebackPercent: "17.50", rolloverMultiple: 3 },
  { vipTier: "gold", percentLoss: "10.00", minLossThreshold: "50.00", maxRakebackPercent: "20.00", rolloverMultiple: 3 },
  { vipTier: "platinum", percentLoss: "12.50", minLossThreshold: "50.00", maxRakebackPercent: "22.50", rolloverMultiple: 2 },
  { vipTier: "diamond", percentLoss: "15.00", minLossThreshold: "0.00", maxRakebackPercent: "25.00", rolloverMultiple: 2 },
];

export async function initializeRakebackSettings() {
  const existing = await db.select().from(rakebackSettings).limit(1);
  if (existing.length > 0) return;
  
  for (const setting of DEFAULT_RAKEBACK_SETTINGS) {
    await db.insert(rakebackSettings).values(setting);
  }
  console.log("[RAKEBACK] Default settings initialized");
}

export async function getRakebackSettings() {
  return await db.select().from(rakebackSettings).orderBy(sql`
    CASE vip_tier 
      WHEN 'bronze' THEN 1 
      WHEN 'silver' THEN 2 
      WHEN 'gold' THEN 3 
      WHEN 'platinum' THEN 4 
      WHEN 'diamond' THEN 5 
    END
  `);
}

export async function getRakebackSettingForTier(vipTier: string) {
  const [setting] = await db.select().from(rakebackSettings)
    .where(eq(rakebackSettings.vipTier, vipTier.toLowerCase()));
  return setting;
}

export async function getUserRakebackSummary(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) throw new Error("Usuário não encontrado");
  
  const vipTier = user.vipLevel || "bronze";
  const setting = await getRakebackSettingForTier(vipTier);
  
  const now = new Date();
  const startOfWeek = getWeekStart(now);
  const endOfWeek = getWeekEnd(now);
  
  const weeklyStats = await calculateUserLossesForPeriod(userId, startOfWeek, endOfWeek);
  
  const pendingPeriods = await db.select().from(rakebackPeriods)
    .where(and(
      eq(rakebackPeriods.userId, userId),
      eq(rakebackPeriods.status, RakebackStatus.CALCULATED)
    ));
  
  const pendingAmount = pendingPeriods.reduce((sum, p) => sum + parseFloat(p.rakebackAmount), 0);
  
  const paidPayouts = await db.select().from(rakebackPayouts)
    .where(eq(rakebackPayouts.userId, userId))
    .orderBy(desc(rakebackPayouts.paidAt))
    .limit(10);
  
  const totalPaid = await db.select({
    total: sql<string>`COALESCE(SUM(amount::numeric), 0)`,
  }).from(rakebackPayouts)
    .where(eq(rakebackPayouts.userId, userId));
  
  let potentialRakeback = 0;
  if (weeklyStats.netLoss > 0 && setting) {
    const percent = parseFloat(setting.percentLoss);
    potentialRakeback = weeklyStats.netLoss * (percent / 100);
    const maxPercent = parseFloat(setting.maxRakebackPercent);
    const maxAmount = weeklyStats.totalWagered * (maxPercent / 100);
    potentialRakeback = Math.min(potentialRakeback, maxAmount);
  }
  
  const pendingPayoutsFormatted = pendingPeriods.map(p => ({
    id: p.id,
    grossAmount: parseFloat(p.rakebackAmount),
    netAmount: parseFloat(p.rakebackAmount),
    rolloverRequired: parseFloat(p.rolloverRequired || "0"),
    rolloverProgress: parseFloat(p.rolloverProgress || "0"),
    canWithdraw: parseFloat(p.rolloverProgress || "0") >= parseFloat(p.rolloverRequired || "0"),
    createdAt: p.calculatedAt || p.periodEnd,
    expiresAt: null,
  }));
  
  return {
    vipLevel: vipTier,
    currentPercentage: setting ? parseFloat(setting.percentLoss) : 5,
    currentPeriod: {
      periodStart: startOfWeek,
      periodEnd: endOfWeek,
      totalWagered: weeklyStats.totalWagered,
      totalLosses: weeklyStats.netLoss,
      potentialRakeback,
      percentage: setting ? parseFloat(setting.percentLoss) : 5,
      daysRemaining: Math.ceil((endOfWeek.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    },
    pendingPayouts: pendingPayoutsFormatted,
    totals: {
      totalEarned: pendingAmount + parseFloat(totalPaid[0]?.total || "0"),
      totalClaimed: parseFloat(totalPaid[0]?.total || "0"),
      totalPending: pendingAmount,
    },
  };
}

export async function getUserRakebackHistory(userId: string, limit = 20) {
  const periods = await db.select().from(rakebackPeriods)
    .where(eq(rakebackPeriods.userId, userId))
    .orderBy(desc(rakebackPeriods.periodEnd))
    .limit(limit);
  
  return periods;
}

export async function claimPendingRakeback(userId: string, periodId?: string): Promise<{
  success: boolean;
  amount?: number;
  error?: string;
}> {
  let pendingPeriods;
  
  if (periodId) {
    const [period] = await db.select().from(rakebackPeriods)
      .where(and(
        eq(rakebackPeriods.id, periodId),
        eq(rakebackPeriods.userId, userId),
        eq(rakebackPeriods.status, RakebackStatus.CALCULATED)
      ));
    
    if (!period) {
      return { success: false, error: "Período de rakeback não encontrado ou já resgatado" };
    }
    pendingPeriods = [period];
  } else {
    pendingPeriods = await db.select().from(rakebackPeriods)
      .where(and(
        eq(rakebackPeriods.userId, userId),
        eq(rakebackPeriods.status, RakebackStatus.CALCULATED)
      ));
  }
  
  if (pendingPeriods.length === 0) {
    return { success: false, error: "Nenhum rakeback pendente para resgatar" };
  }
  
  const totalAmount = pendingPeriods.reduce((sum, p) => sum + parseFloat(p.rakebackAmount), 0);
  
  if (totalAmount <= 0) {
    return { success: false, error: "Valor de rakeback inválido" };
  }
  
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  if (!wallet) {
    return { success: false, error: "Carteira não encontrada" };
  }
  
  const setting = await getRakebackSettingForTier(pendingPeriods[0].vipTierAtCalculation);
  const rolloverMultiple = setting?.rolloverMultiple || 3;
  const rolloverRequired = totalAmount * rolloverMultiple;
  
  const newBalance = parseFloat(wallet.balance) + totalAmount;
  
  await db.transaction(async (tx) => {
    await tx.update(wallets).set({
      balance: newBalance.toFixed(2),
      updatedAt: new Date(),
    }).where(eq(wallets.userId, userId));
    
    const [transaction] = await tx.insert(transactions).values({
      userId,
      walletId: wallet.id,
      type: TransactionType.RAKEBACK,
      amount: totalAmount.toFixed(2),
      balanceBefore: wallet.balance,
      balanceAfter: newBalance.toFixed(2),
      status: "COMPLETED",
      description: `Rakeback - ${pendingPeriods.length} período(s)`,
    }).returning();
    
    for (const period of pendingPeriods) {
      await tx.update(rakebackPeriods).set({
        status: RakebackStatus.PAID,
        processedAt: new Date(),
      }).where(eq(rakebackPeriods.id, period.id));
      
      await tx.insert(rakebackPayouts).values({
        periodId: period.id,
        userId,
        amount: period.rakebackAmount,
        transactionId: transaction.id,
        rolloverRequired: (parseFloat(period.rakebackAmount) * rolloverMultiple).toFixed(2),
        rolloverCompleted: "0.00",
        rolloverStatus: "PENDING",
      });
    }
  });
  
  return { success: true, amount: totalAmount };
}

export async function calculateWeeklyRakeback() {
  console.log("[RAKEBACK] Starting weekly rakeback calculation...");
  
  const now = new Date();
  const lastWeekEnd = getWeekStart(now);
  lastWeekEnd.setMilliseconds(lastWeekEnd.getMilliseconds() - 1);
  const lastWeekStart = getWeekStart(lastWeekEnd);
  
  const allUsers = await db.select({ id: users.id, vipLevel: users.vipLevel })
    .from(users);
  
  let processed = 0;
  let qualified = 0;
  
  for (const user of allUsers) {
    const existingPeriod = await db.select().from(rakebackPeriods)
      .where(and(
        eq(rakebackPeriods.userId, user.id),
        eq(rakebackPeriods.periodStart, lastWeekStart),
        eq(rakebackPeriods.periodEnd, lastWeekEnd)
      ))
      .limit(1);
    
    if (existingPeriod.length > 0) continue;
    
    const vipTier = user.vipLevel || "bronze";
    const setting = await getRakebackSettingForTier(vipTier);
    if (!setting || !setting.isActive) continue;
    
    const stats = await calculateUserLossesForPeriod(user.id, lastWeekStart, lastWeekEnd);
    
    const minThreshold = parseFloat(setting.minLossThreshold);
    if (stats.netLoss < minThreshold) {
      await db.insert(rakebackPeriods).values({
        userId: user.id,
        periodStart: lastWeekStart,
        periodEnd: lastWeekEnd,
        periodType: "WEEKLY",
        vipTierAtCalculation: vipTier,
        totalWagered: stats.totalWagered.toFixed(2),
        totalWins: stats.totalWins.toFixed(2),
        netLoss: stats.netLoss.toFixed(2),
        rakebackPercent: setting.percentLoss,
        rakebackAmount: "0.00",
        status: RakebackStatus.SKIPPED,
      });
      processed++;
      continue;
    }
    
    const percent = parseFloat(setting.percentLoss);
    let rakebackAmount = stats.netLoss * (percent / 100);
    
    const maxPercent = parseFloat(setting.maxRakebackPercent);
    const maxAmount = stats.totalWagered * (maxPercent / 100);
    rakebackAmount = Math.min(rakebackAmount, maxAmount);
    
    await db.insert(rakebackPeriods).values({
      userId: user.id,
      periodStart: lastWeekStart,
      periodEnd: lastWeekEnd,
      periodType: "WEEKLY",
      vipTierAtCalculation: vipTier,
      totalWagered: stats.totalWagered.toFixed(2),
      totalWins: stats.totalWins.toFixed(2),
      netLoss: stats.netLoss.toFixed(2),
      rakebackPercent: setting.percentLoss,
      rakebackAmount: rakebackAmount.toFixed(2),
      status: RakebackStatus.CALCULATED,
    });
    
    processed++;
    qualified++;
  }
  
  console.log(`[RAKEBACK] Calculation complete. Processed: ${processed}, Qualified: ${qualified}`);
  return { processed, qualified };
}

async function calculateUserLossesForPeriod(
  userId: string, 
  startDate: Date, 
  endDate: Date
): Promise<{ totalWagered: number; totalWins: number; netLoss: number }> {
  const result = await db.select({
    type: transactions.type,
    total: sql<string>`SUM(ABS(amount::numeric))`,
  })
    .from(transactions)
    .where(and(
      eq(transactions.userId, userId),
      eq(transactions.status, "COMPLETED"),
      gte(transactions.createdAt, startDate),
      lte(transactions.createdAt, endDate)
    ))
    .groupBy(transactions.type);
  
  let totalWagered = 0;
  let totalWins = 0;
  
  for (const row of result) {
    const amount = parseFloat(row.total || "0");
    if (row.type === TransactionType.BET || row.type === "BET") {
      totalWagered += amount;
    } else if (row.type === TransactionType.WIN || row.type === "WIN") {
      totalWins += amount;
    }
  }
  
  const netLoss = Math.max(0, totalWagered - totalWins);
  
  return { totalWagered, totalWins, netLoss };
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export async function updateRakebackRollover(userId: string, wagerAmount: number) {
  const pendingRollovers = await db.select().from(rakebackPayouts)
    .where(and(
      eq(rakebackPayouts.userId, userId),
      eq(rakebackPayouts.rolloverStatus, "PENDING")
    ));
  
  let remainingWager = wagerAmount;
  
  for (const payout of pendingRollovers) {
    if (remainingWager <= 0) break;
    
    const required = parseFloat(payout.rolloverRequired);
    const completed = parseFloat(payout.rolloverCompleted);
    const remaining = required - completed;
    
    if (remaining <= 0) {
      await db.update(rakebackPayouts).set({
        rolloverStatus: "COMPLETED",
      }).where(eq(rakebackPayouts.id, payout.id));
      continue;
    }
    
    const toApply = Math.min(remainingWager, remaining);
    const newCompleted = completed + toApply;
    
    await db.update(rakebackPayouts).set({
      rolloverCompleted: newCompleted.toFixed(2),
      rolloverStatus: newCompleted >= required ? "COMPLETED" : "PENDING",
    }).where(eq(rakebackPayouts.id, payout.id));
    
    remainingWager -= toApply;
  }
}

export async function getAdminRakebackStats() {
  const totalPaidResult = await db.select({
    total: sql<string>`COALESCE(SUM(amount::numeric), 0)`,
  }).from(rakebackPayouts);
  
  const pendingResult = await db.select({
    total: sql<string>`COALESCE(SUM(rakeback_amount::numeric), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(rakebackPeriods)
    .where(eq(rakebackPeriods.status, RakebackStatus.CALCULATED));
  
  const thisWeekResult = await db.select({
    total: sql<string>`COALESCE(SUM(rakeback_amount::numeric), 0)`,
    count: sql<number>`COUNT(*)`,
  }).from(rakebackPeriods)
    .where(and(
      eq(rakebackPeriods.status, RakebackStatus.PAID),
      gte(rakebackPeriods.processedAt, getWeekStart(new Date()))
    ));
  
  return {
    totalPaidAllTime: parseFloat(totalPaidResult[0]?.total || "0"),
    pendingAmount: parseFloat(pendingResult[0]?.total || "0"),
    pendingCount: pendingResult[0]?.count || 0,
    paidThisWeek: parseFloat(thisWeekResult[0]?.total || "0"),
    paidThisWeekCount: thisWeekResult[0]?.count || 0,
  };
}
