import { db } from "../../db";
import { users, levelRewards, dailyBoxClaims, levelUpHistory, wallets, transactions, TransactionType } from "@shared/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

const XP_PER_REAL_WAGERED = 10;
const BASE_XP_PER_LEVEL = 100;
const XP_MULTIPLIER = 1.15;

export function getXpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(BASE_XP_PER_LEVEL * Math.pow(XP_MULTIPLIER, level - 1));
}

export function getTotalXpForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i <= level; i++) {
    total += getXpRequiredForLevel(i);
  }
  return total;
}

export function getLevelFromTotalXp(totalXp: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (xpNeeded + getXpRequiredForLevel(level + 1) <= totalXp) {
    xpNeeded += getXpRequiredForLevel(level + 1);
    level++;
    if (level >= 999) break;
  }
  return Math.min(level, 999);
}

export function getDailyBoxReward(level: number): { type: string; value: number; description: string } {
  const tier = Math.floor(level / 10);
  const baseValue = 1 + tier * 0.5;
  
  if (level >= 900) {
    return { type: "BONUS", value: baseValue * 10, description: `Bônus de R$ ${(baseValue * 10).toFixed(2)}` };
  } else if (level >= 700) {
    return { type: "BONUS", value: baseValue * 7, description: `Bônus de R$ ${(baseValue * 7).toFixed(2)}` };
  } else if (level >= 500) {
    return { type: "BONUS", value: baseValue * 5, description: `Bônus de R$ ${(baseValue * 5).toFixed(2)}` };
  } else if (level >= 300) {
    return { type: "BONUS", value: baseValue * 3, description: `Bônus de R$ ${(baseValue * 3).toFixed(2)}` };
  } else if (level >= 100) {
    return { type: "BONUS", value: baseValue * 2, description: `Bônus de R$ ${(baseValue * 2).toFixed(2)}` };
  } else {
    return { type: "BONUS", value: baseValue, description: `Bônus de R$ ${baseValue.toFixed(2)}` };
  }
}

export function getMilestoneReward(level: number): { type: string; value: number; description: string } | null {
  if (level % 10 !== 0) return null;
  
  const milestone = level / 10;
  const baseValue = 5 * milestone;
  
  if (level >= 100 && level % 100 === 0) {
    return { type: "BONUS", value: baseValue * 5, description: `Bônus especial de R$ ${(baseValue * 5).toFixed(2)} pelo nível ${level}!` };
  }
  
  return { type: "BONUS", value: baseValue, description: `Bônus de R$ ${baseValue.toFixed(2)} pelo nível ${level}!` };
}

export async function getUserLevelInfo(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  const currentLevel = user.level;
  const currentXp = user.xp;
  const xpForCurrentLevel = getTotalXpForLevel(currentLevel);
  const xpForNextLevel = getTotalXpForLevel(currentLevel + 1);
  const xpProgress = currentXp - xpForCurrentLevel;
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const progressPercent = xpNeeded > 0 ? Math.min((xpProgress / xpNeeded) * 100, 100) : 100;
  
  const dailyBox = getDailyBoxReward(currentLevel);
  const canClaimDailyBox = !user.lastDailyBoxClaim || 
    new Date().getTime() - new Date(user.lastDailyBoxClaim).getTime() > 24 * 60 * 60 * 1000;
  
  const nextMilestone = Math.ceil(currentLevel / 10) * 10;
  const milestoneReward = getMilestoneReward(nextMilestone);
  
  return {
    level: currentLevel,
    xp: currentXp,
    xpProgress,
    xpNeeded,
    progressPercent,
    totalWagered: parseFloat(user.totalWagered),
    dailyBox,
    canClaimDailyBox,
    nextMilestone,
    milestoneReward,
    vipLevel: user.vipLevel,
  };
}

export async function addXpFromWager(userId: string, wagerAmount: number): Promise<{
  xpGained: number;
  leveledUp: boolean;
  newLevel?: number;
  rewards?: { type: string; value: number; description: string }[];
}> {
  const xpGained = Math.floor(wagerAmount * XP_PER_REAL_WAGERED);
  
  if (xpGained <= 0) {
    return { xpGained: 0, leveledUp: false };
  }
  
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  const oldLevel = user.level;
  const newXp = user.xp + xpGained;
  const newTotalWagered = parseFloat(user.totalWagered) + wagerAmount;
  const newLevel = Math.min(getLevelFromTotalXp(newXp), 999);
  
  await db.update(users).set({
    xp: newXp,
    level: newLevel,
    totalWagered: newTotalWagered.toFixed(2),
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
  
  const rewards: { type: string; value: number; description: string }[] = [];
  
  if (newLevel > oldLevel) {
    for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
      const milestone = getMilestoneReward(lvl);
      if (milestone) {
        rewards.push(milestone);
        
        const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
        if (wallet) {
          const newBalance = parseFloat(wallet.balance) + milestone.value;
          await db.update(wallets).set({
            balance: newBalance.toFixed(2),
            updatedAt: new Date(),
          }).where(eq(wallets.userId, userId));
          
          await db.insert(transactions).values({
            userId,
            walletId: wallet.id,
            type: TransactionType.BONUS,
            amount: milestone.value.toFixed(2),
            balanceBefore: wallet.balance,
            balanceAfter: newBalance.toFixed(2),
            status: "COMPLETED",
            description: `Recompensa nível ${lvl}`,
          });
        }
      }
    }
    
    await db.insert(levelUpHistory).values({
      userId,
      fromLevel: oldLevel,
      toLevel: newLevel,
      xpGained,
      rewardClaimed: rewards.length > 0,
      rewardValue: rewards.reduce((sum, r) => sum + r.value, 0).toFixed(2),
    });
    
    let vipLevel = user.vipLevel;
    if (newLevel >= 500) vipLevel = "diamond";
    else if (newLevel >= 300) vipLevel = "platinum";
    else if (newLevel >= 100) vipLevel = "gold";
    else if (newLevel >= 50) vipLevel = "silver";
    
    if (vipLevel !== user.vipLevel) {
      await db.update(users).set({ vipLevel, updatedAt: new Date() }).where(eq(users.id, userId));
    }
  }
  
  return {
    xpGained,
    leveledUp: newLevel > oldLevel,
    newLevel: newLevel > oldLevel ? newLevel : undefined,
    rewards: rewards.length > 0 ? rewards : undefined,
  };
}

export async function claimDailyBox(userId: string): Promise<{
  success: boolean;
  reward?: { type: string; value: number; description: string };
  error?: string;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return { success: false, error: "Usuário não encontrado" };
  }
  
  if (user.lastDailyBoxClaim) {
    const timeSinceLastClaim = new Date().getTime() - new Date(user.lastDailyBoxClaim).getTime();
    if (timeSinceLastClaim < 24 * 60 * 60 * 1000) {
      const hoursRemaining = Math.ceil((24 * 60 * 60 * 1000 - timeSinceLastClaim) / (60 * 60 * 1000));
      return { success: false, error: `Volte em ${hoursRemaining} horas` };
    }
  }
  
  const reward = getDailyBoxReward(user.level);
  
  const [wallet] = await db.select().from(wallets).where(eq(wallets.userId, userId));
  if (!wallet) {
    return { success: false, error: "Carteira não encontrada" };
  }
  
  const newBalance = parseFloat(wallet.balance) + reward.value;
  
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      lastDailyBoxClaim: new Date(),
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    
    await tx.update(wallets).set({
      balance: newBalance.toFixed(2),
      updatedAt: new Date(),
    }).where(eq(wallets.userId, userId));
    
    await tx.insert(transactions).values({
      userId,
      walletId: wallet.id,
      type: TransactionType.BONUS,
      amount: reward.value.toFixed(2),
      balanceBefore: wallet.balance,
      balanceAfter: newBalance.toFixed(2),
      status: "COMPLETED",
      description: `Caixa diária - Nível ${user.level}`,
    });
    
    await tx.insert(dailyBoxClaims).values({
      userId,
      level: user.level,
      rewardType: reward.type,
      rewardValue: reward.value.toFixed(2),
    });
  });
  
  return { success: true, reward };
}

export async function getLevelHistory(userId: string, limit = 20) {
  return await db
    .select()
    .from(levelUpHistory)
    .where(eq(levelUpHistory.userId, userId))
    .orderBy(sql`${levelUpHistory.createdAt} DESC`)
    .limit(limit);
}

export async function getDailyBoxHistory(userId: string, limit = 20) {
  return await db
    .select()
    .from(dailyBoxClaims)
    .where(eq(dailyBoxClaims.userId, userId))
    .orderBy(sql`${dailyBoxClaims.claimedAt} DESC`)
    .limit(limit);
}
