import { db } from "../../db";
import { jackpotConfig, jackpotWins, jackpotContributions, users, wallets, transactions } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { cache, CACHE_KEYS, CACHE_TTL } from "../../utils/cache";
import { createLogger } from "../../utils/logger";

const logger = createLogger("jackpot");

const JACKPOT_MINIMUM = 1000;
const CONTRIBUTION_RATE = 0.002;
const JACKPOT_WIN_CHANCE_BASE = 0.00001;
const JACKPOT_WIN_CHANCE_PER_REAL = 0.000001;

async function getOrCreateJackpot() {
  const existing = await db.select().from(jackpotConfig).limit(1);
  if (existing.length > 0) {
    return existing[0];
  }
  
  const [newJackpot] = await db.insert(jackpotConfig).values({
    name: "Global Jackpot",
    currentAmount: String(JACKPOT_MINIMUM),
    minimumAmount: String(JACKPOT_MINIMUM),
    contributionRate: String(CONTRIBUTION_RATE),
    isActive: true,
    totalPaidOut: "0.00",
  }).returning();
  
  return newJackpot;
}

export async function getJackpotInfo() {
  const cached = cache.get<any>(CACHE_KEYS.JACKPOT_INFO);
  if (cached) {
    return cached;
  }

  const jackpot = await getOrCreateJackpot();
  
  const recentWins = await db.select({
    id: jackpotWins.id,
    userName: jackpotWins.userName,
    amount: jackpotWins.amount,
    gameType: jackpotWins.gameType,
    createdAt: jackpotWins.createdAt,
  })
  .from(jackpotWins)
  .orderBy(desc(jackpotWins.createdAt))
  .limit(10);
  
  const result = {
    currentAmount: parseFloat(jackpot.currentAmount),
    minimumAmount: parseFloat(jackpot.minimumAmount),
    contributionRate: parseFloat(jackpot.contributionRate),
    isActive: jackpot.isActive,
    lastWonAt: jackpot.lastWonAt,
    lastWonBy: jackpot.lastWonBy,
    lastWonAmount: jackpot.lastWonAmount ? parseFloat(jackpot.lastWonAmount) : null,
    totalPaidOut: parseFloat(jackpot.totalPaidOut),
    recentWins,
  };

  cache.set(CACHE_KEYS.JACKPOT_INFO, result, CACHE_TTL.SHORT);
  return result;
}

export function invalidateJackpotCache() {
  cache.delete(CACHE_KEYS.JACKPOT_INFO);
}

export async function contributeToJackpot(
  userId: string,
  betAmount: number,
  gameType: string,
  betId?: string
): Promise<{ contributed: number; won: boolean; wonAmount?: number }> {
  const jackpot = await getOrCreateJackpot();
  
  if (!jackpot.isActive) {
    return { contributed: 0, won: false };
  }
  
  const contribution = betAmount * parseFloat(jackpot.contributionRate);
  const newAmount = parseFloat(jackpot.currentAmount) + contribution;
  
  await db.update(jackpotConfig)
    .set({
      currentAmount: String(newAmount),
      updatedAt: new Date(),
    })
    .where(eq(jackpotConfig.id, jackpot.id));
  
  await db.insert(jackpotContributions).values({
    userId,
    betId,
    gameType,
    betAmount: String(betAmount),
    contribution: String(contribution),
  });
  
  const winChance = JACKPOT_WIN_CHANCE_BASE + (betAmount * JACKPOT_WIN_CHANCE_PER_REAL);
  const cappedChance = Math.min(winChance, 0.001);
  const roll = Math.random();
  
  if (roll < cappedChance) {
    const wonAmount = await triggerJackpotWin(userId, gameType, betAmount, betId);
    invalidateJackpotCache();
    return { contributed: contribution, won: true, wonAmount };
  }
  
  invalidateJackpotCache();
  return { contributed: contribution, won: false };
}

async function triggerJackpotWin(
  userId: string,
  gameType: string,
  betAmount: number,
  gameId?: string
): Promise<number> {
  const jackpot = await getOrCreateJackpot();
  const wonAmount = parseFloat(jackpot.currentAmount);
  
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const userName = user?.name || "Jogador";
  
  await db.insert(jackpotWins).values({
    userId,
    userName,
    amount: String(wonAmount),
    gameType,
    gameId,
    betAmount: String(betAmount),
  });
  
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  if (wallet) {
    const oldBalance = parseFloat(wallet.balance);
    const newBalance = oldBalance + wonAmount;
    await db.update(wallets)
      .set({ balance: String(newBalance), updatedAt: new Date() })
      .where(eq(wallets.id, wallet.id));
    
    await db.insert(transactions).values({
      userId,
      walletId: wallet.id,
      type: "JACKPOT_WIN",
      amount: String(wonAmount),
      balanceBefore: String(oldBalance),
      balanceAfter: String(newBalance),
      description: `Jackpot Progressivo - ${gameType}`,
      status: "COMPLETED",
    });
  }
  
  await db.update(jackpotConfig)
    .set({
      currentAmount: String(JACKPOT_MINIMUM),
      lastWonAt: new Date(),
      lastWonBy: userName,
      lastWonAmount: String(wonAmount),
      totalPaidOut: String(parseFloat(jackpot.totalPaidOut) + wonAmount),
      updatedAt: new Date(),
    })
    .where(eq(jackpotConfig.id, jackpot.id));
  
  logger.info("Jackpot win triggered", {
    userId,
    data: { userName, wonAmount, gameType, betAmount },
  });
  
  return wonAmount;
}

export async function updateJackpotSettings(settings: {
  minimumAmount?: number;
  contributionRate?: number;
  isActive?: boolean;
}) {
  const jackpot = await getOrCreateJackpot();
  
  const updates: any = { updatedAt: new Date() };
  
  if (settings.minimumAmount !== undefined) {
    updates.minimumAmount = String(settings.minimumAmount);
    if (parseFloat(jackpot.currentAmount) < settings.minimumAmount) {
      updates.currentAmount = String(settings.minimumAmount);
    }
  }
  
  if (settings.contributionRate !== undefined) {
    updates.contributionRate = String(settings.contributionRate);
  }
  
  if (settings.isActive !== undefined) {
    updates.isActive = settings.isActive;
  }
  
  await db.update(jackpotConfig)
    .set(updates)
    .where(eq(jackpotConfig.id, jackpot.id));
  
  return getJackpotInfo();
}

export async function getJackpotStats() {
  const jackpot = await getOrCreateJackpot();
  
  const wins = await db.select().from(jackpotWins).orderBy(desc(jackpotWins.createdAt));
  
  const totalContributions = await db.select().from(jackpotContributions);
  const totalContributed = totalContributions.reduce(
    (sum, c) => sum + parseFloat(c.contribution),
    0
  );
  
  return {
    currentAmount: parseFloat(jackpot.currentAmount),
    totalPaidOut: parseFloat(jackpot.totalPaidOut),
    totalContributed,
    totalWins: wins.length,
    averageWinAmount: wins.length > 0 
      ? wins.reduce((sum, w) => sum + parseFloat(w.amount), 0) / wins.length 
      : 0,
    recentWins: wins.slice(0, 20).map(w => ({
      id: w.id,
      userName: w.userName,
      amount: parseFloat(w.amount),
      gameType: w.gameType,
      betAmount: parseFloat(w.betAmount),
      createdAt: w.createdAt,
    })),
  };
}
