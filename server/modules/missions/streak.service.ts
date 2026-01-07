import { db } from "../../db";
import {
  userStreaks,
  streakRewards,
  streakRewardClaims,
  users,
  wallets,
  transactions,
  TransactionType,
  StreakRewardType,
  type UserStreak,
  type StreakReward,
} from "@shared/schema";
import { eq, and, lte } from "drizzle-orm";
import { processBalanceChange } from "../wallet/wallet.service";
import { sendNotificationToUser } from "../notifications/notification.service";

const DEFAULT_STREAK_REWARDS = [
  { streakDay: 1, rewardType: StreakRewardType.XP, rewardValue: 50 },
  { streakDay: 3, rewardType: StreakRewardType.XP, rewardValue: 100 },
  { streakDay: 7, rewardType: StreakRewardType.BONUS_CASH, rewardValue: 5 },
  { streakDay: 14, rewardType: StreakRewardType.STREAK_PROTECTION, rewardValue: 1 },
  { streakDay: 21, rewardType: StreakRewardType.XP, rewardValue: 300 },
  { streakDay: 30, rewardType: StreakRewardType.BONUS_CASH, rewardValue: 20 },
  { streakDay: 60, rewardType: StreakRewardType.STREAK_PROTECTION, rewardValue: 2 },
  { streakDay: 90, rewardType: StreakRewardType.BONUS_CASH, rewardValue: 50 },
];

export async function initializeStreakRewards() {
  const existing = await db.select().from(streakRewards).limit(1);
  if (existing.length > 0) return;

  for (const reward of DEFAULT_STREAK_REWARDS) {
    await db.insert(streakRewards).values({
      streakDay: reward.streakDay,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue.toString(),
      isActive: true,
    });
  }
  console.log("[STREAK] Default streak rewards initialized");
}

export async function getOrCreateUserStreak(userId: string): Promise<UserStreak> {
  const [existing] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(userStreaks)
    .values({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      streakProtections: 0,
      totalMissionsCompleted: 0,
    })
    .returning();

  return created;
}

export async function getUserStreak(userId: string): Promise<{
  streak: UserStreak;
  availableRewards: StreakReward[];
  claimedDays: number[];
}> {
  const streak = await getOrCreateUserStreak(userId);
  await checkAndResetStreak(userId);
  
  const [updatedStreak] = await db.select().from(userStreaks).where(eq(userStreaks.userId, userId));

  const allRewards = await db
    .select()
    .from(streakRewards)
    .where(eq(streakRewards.isActive, true));

  const claims = await db
    .select()
    .from(streakRewardClaims)
    .where(eq(streakRewardClaims.userId, userId));

  const claimedDays = claims.map((c) => c.streakDay);

  const availableRewards = allRewards.filter(
    (r) => r.streakDay <= updatedStreak.currentStreak && !claimedDays.includes(r.streakDay)
  );

  return {
    streak: updatedStreak,
    availableRewards,
    claimedDays,
  };
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isYesterday(date: Date, today: Date): boolean {
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

export async function updateStreak(userId: string): Promise<{
  success: boolean;
  streakIncremented: boolean;
  newStreak: number;
  error?: string;
}> {
  const streak = await getOrCreateUserStreak(userId);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (streak.lastCompletionDate && isSameDay(streak.lastCompletionDate, today)) {
    await db
      .update(userStreaks)
      .set({
        totalMissionsCompleted: streak.totalMissionsCompleted + 1,
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.userId, userId));

    return {
      success: true,
      streakIncremented: false,
      newStreak: streak.currentStreak,
    };
  }

  let newCurrentStreak = streak.currentStreak;
  let usedProtection = false;

  if (streak.lastCompletionDate) {
    if (isYesterday(streak.lastCompletionDate, today)) {
      newCurrentStreak = streak.currentStreak + 1;
    } else {
      newCurrentStreak = 1;
    }
  } else {
    newCurrentStreak = 1;
  }

  const newLongestStreak = Math.max(streak.longestStreak, newCurrentStreak);

  await db
    .update(userStreaks)
    .set({
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      lastCompletionDate: today,
      totalMissionsCompleted: streak.totalMissionsCompleted + 1,
      updatedAt: new Date(),
    })
    .where(eq(userStreaks.userId, userId));

  if (newCurrentStreak > streak.currentStreak) {
    await sendNotificationToUser(userId, {
      type: "MISSION",
      title: "Streak Atualizado!",
      message: `Parabéns! Você está em uma sequência de ${newCurrentStreak} dias!`,
      icon: "flame",
      actionUrl: "/missions",
    });
  }

  return {
    success: true,
    streakIncremented: newCurrentStreak > streak.currentStreak,
    newStreak: newCurrentStreak,
  };
}

export async function checkAndResetStreak(userId: string): Promise<{
  wasReset: boolean;
  usedProtection: boolean;
}> {
  const streak = await getOrCreateUserStreak(userId);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (!streak.lastCompletionDate || streak.currentStreak === 0) {
    return { wasReset: false, usedProtection: false };
  }

  if (isSameDay(streak.lastCompletionDate, today) || isYesterday(streak.lastCompletionDate, today)) {
    return { wasReset: false, usedProtection: false };
  }

  const daysSinceLastCompletion = Math.floor(
    (today.getTime() - streak.lastCompletionDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastCompletion <= 1) {
    return { wasReset: false, usedProtection: false };
  }

  if (daysSinceLastCompletion === 2 && streak.streakProtections > 0) {
    await db
      .update(userStreaks)
      .set({
        streakProtections: streak.streakProtections - 1,
        lastCompletionDate: new Date(today.getTime() - 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      })
      .where(eq(userStreaks.userId, userId));

    await sendNotificationToUser(userId, {
      type: "MISSION",
      title: "Proteção de Streak Usada!",
      message: `Sua proteção foi usada automaticamente para manter seu streak de ${streak.currentStreak} dias!`,
      icon: "shield",
      actionUrl: "/missions",
    });

    return { wasReset: false, usedProtection: true };
  }

  await db
    .update(userStreaks)
    .set({
      currentStreak: 0,
      updatedAt: new Date(),
    })
    .where(eq(userStreaks.userId, userId));

  await sendNotificationToUser(userId, {
    type: "MISSION",
    title: "Streak Perdido",
    message: `Você perdeu sua sequência de ${streak.currentStreak} dias. Complete uma missão hoje para começar novamente!`,
    icon: "alert-circle",
    actionUrl: "/missions",
  });

  return { wasReset: true, usedProtection: false };
}

export async function getStreakRewards(): Promise<StreakReward[]> {
  return await db
    .select()
    .from(streakRewards)
    .where(eq(streakRewards.isActive, true));
}

export async function claimStreakReward(
  userId: string,
  streakDay: number
): Promise<{
  success: boolean;
  reward?: { type: string; value: number };
  error?: string;
}> {
  const streak = await getOrCreateUserStreak(userId);

  if (streak.currentStreak < streakDay) {
    return {
      success: false,
      error: `Você precisa de ${streakDay} dias de streak para resgatar esta recompensa. Streak atual: ${streak.currentStreak}`,
    };
  }

  const [reward] = await db
    .select()
    .from(streakRewards)
    .where(and(eq(streakRewards.streakDay, streakDay), eq(streakRewards.isActive, true)));

  if (!reward) {
    return { success: false, error: "Recompensa não encontrada" };
  }

  const existingClaim = await db
    .select()
    .from(streakRewardClaims)
    .where(
      and(
        eq(streakRewardClaims.userId, userId),
        eq(streakRewardClaims.streakDay, streakDay)
      )
    );

  if (existingClaim.length > 0) {
    return { success: false, error: "Recompensa já foi resgatada" };
  }

  const rewardValue = parseFloat(reward.rewardValue);

  await db.transaction(async (tx) => {
    await tx.insert(streakRewardClaims).values({
      userId,
      streakRewardId: reward.id,
      streakDay: reward.streakDay,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue,
    });

    if (reward.rewardType === StreakRewardType.BONUS_CASH) {
      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      if (wallet) {
        const newBalance = parseFloat(wallet.balance) + rewardValue;
        await tx
          .update(wallets)
          .set({
            balance: newBalance.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, userId));

        await tx.insert(transactions).values({
          userId,
          walletId: wallet.id,
          type: TransactionType.MISSION_REWARD,
          amount: rewardValue.toFixed(2),
          balanceBefore: wallet.balance,
          balanceAfter: newBalance.toFixed(2),
          status: "COMPLETED",
          description: `Recompensa de streak - Dia ${streakDay}`,
        });
      }
    } else if (reward.rewardType === StreakRewardType.STREAK_PROTECTION) {
      await tx
        .update(userStreaks)
        .set({
          streakProtections: streak.streakProtections + Math.floor(rewardValue),
          updatedAt: new Date(),
        })
        .where(eq(userStreaks.userId, userId));
    } else if (reward.rewardType === StreakRewardType.XP) {
      await tx
        .update(users)
        .set({
          xp: streak.totalMissionsCompleted + Math.floor(rewardValue),
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    }
  });

  await sendNotificationToUser(userId, {
    type: "MISSION",
    title: "Recompensa de Streak Resgatada!",
    message:
      reward.rewardType === StreakRewardType.BONUS_CASH
        ? `Você ganhou R$ ${rewardValue.toFixed(2)} por ${streakDay} dias de streak!`
        : reward.rewardType === StreakRewardType.XP
        ? `Você ganhou ${Math.floor(rewardValue)} XP por ${streakDay} dias de streak!`
        : `Você ganhou ${Math.floor(rewardValue)} proteção(ões) de streak!`,
    icon: "gift",
    actionUrl: "/missions",
  });

  return {
    success: true,
    reward: { type: reward.rewardType, value: rewardValue },
  };
}

export async function useStreakProtection(userId: string): Promise<{
  success: boolean;
  remainingProtections?: number;
  error?: string;
}> {
  const streak = await getOrCreateUserStreak(userId);

  if (streak.streakProtections <= 0) {
    return { success: false, error: "Você não tem proteções de streak disponíveis" };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (streak.lastCompletionDate && isSameDay(streak.lastCompletionDate, today)) {
    return { success: false, error: "Você já completou uma missão hoje" };
  }

  const newProtections = streak.streakProtections - 1;

  await db
    .update(userStreaks)
    .set({
      streakProtections: newProtections,
      lastCompletionDate: today,
      updatedAt: new Date(),
    })
    .where(eq(userStreaks.userId, userId));

  await sendNotificationToUser(userId, {
    type: "MISSION",
    title: "Proteção Ativada!",
    message: `Sua proteção de streak foi usada para manter sua sequência de ${streak.currentStreak} dias.`,
    icon: "shield",
    actionUrl: "/missions",
  });

  return {
    success: true,
    remainingProtections: newProtections,
  };
}
