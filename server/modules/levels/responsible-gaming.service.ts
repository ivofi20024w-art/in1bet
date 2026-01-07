import { db } from "../../db";
import { users, responsibleGamingLogs, sessionAlerts, pixDeposits, ResponsibleGamingActionType } from "@shared/schema";
import { eq, sql, and, gte } from "drizzle-orm";

export async function getResponsibleGamingSettings(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  const isSelfExcluded = user.permanentSelfExcluded || 
    (user.selfExcludedUntil && new Date(user.selfExcludedUntil) > new Date());
  
  return {
    dailyDepositLimit: user.dailyDepositLimit ? parseFloat(user.dailyDepositLimit) : null,
    weeklyDepositLimit: user.weeklyDepositLimit ? parseFloat(user.weeklyDepositLimit) : null,
    monthlyDepositLimit: user.monthlyDepositLimit ? parseFloat(user.monthlyDepositLimit) : null,
    maxBetLimit: user.maxBetLimit ? parseFloat(user.maxBetLimit) : null,
    sessionTimeLimit: user.sessionTimeLimit,
    selfExcludedUntil: user.selfExcludedUntil,
    permanentSelfExcluded: user.permanentSelfExcluded,
    selfExclusionReason: user.selfExclusionReason,
    isSelfExcluded,
    lastSessionStart: user.lastSessionStart,
  };
}

export async function setDepositLimits(
  userId: string,
  limits: { dailyLimit?: number; weeklyLimit?: number; monthlyLimit?: number }
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  const updates: Record<string, any> = { updatedAt: new Date() };
  const logs: { actionType: string; previousValue: string | null; newValue: string }[] = [];
  
  if (limits.dailyLimit !== undefined) {
    logs.push({
      actionType: ResponsibleGamingActionType.SET_DEPOSIT_LIMIT,
      previousValue: user.dailyDepositLimit,
      newValue: `daily:${limits.dailyLimit}`,
    });
    updates.dailyDepositLimit = limits.dailyLimit > 0 ? limits.dailyLimit.toFixed(2) : null;
  }
  
  if (limits.weeklyLimit !== undefined) {
    logs.push({
      actionType: ResponsibleGamingActionType.SET_DEPOSIT_LIMIT,
      previousValue: user.weeklyDepositLimit,
      newValue: `weekly:${limits.weeklyLimit}`,
    });
    updates.weeklyDepositLimit = limits.weeklyLimit > 0 ? limits.weeklyLimit.toFixed(2) : null;
  }
  
  if (limits.monthlyLimit !== undefined) {
    logs.push({
      actionType: ResponsibleGamingActionType.SET_DEPOSIT_LIMIT,
      previousValue: user.monthlyDepositLimit,
      newValue: `monthly:${limits.monthlyLimit}`,
    });
    updates.monthlyDepositLimit = limits.monthlyLimit > 0 ? limits.monthlyLimit.toFixed(2) : null;
  }
  
  await db.transaction(async (tx) => {
    await tx.update(users).set(updates).where(eq(users.id, userId));
    
    for (const log of logs) {
      await tx.insert(responsibleGamingLogs).values({
        userId,
        actionType: log.actionType,
        previousValue: log.previousValue,
        newValue: log.newValue,
        effectiveAt: new Date(),
      });
    }
  });
  
  return { success: true };
}

export async function setBetLimit(userId: string, maxBetLimit: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      maxBetLimit: maxBetLimit > 0 ? maxBetLimit.toFixed(2) : null,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    
    await tx.insert(responsibleGamingLogs).values({
      userId,
      actionType: ResponsibleGamingActionType.SET_BET_LIMIT,
      previousValue: user.maxBetLimit,
      newValue: maxBetLimit.toString(),
      effectiveAt: new Date(),
    });
  });
  
  return { success: true };
}

export async function setSessionTimeLimit(userId: string, sessionTimeLimit: number) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      sessionTimeLimit: sessionTimeLimit > 0 ? sessionTimeLimit : null,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    
    await tx.insert(responsibleGamingLogs).values({
      userId,
      actionType: ResponsibleGamingActionType.SET_SESSION_LIMIT,
      previousValue: user.sessionTimeLimit?.toString() || null,
      newValue: sessionTimeLimit.toString(),
      effectiveAt: new Date(),
    });
  });
  
  return { success: true };
}

export async function selfExclude(
  userId: string,
  duration: "24h" | "7d" | "30d" | "permanent",
  reason?: string
) {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    throw new Error("Usuário não encontrado");
  }
  
  if (user.permanentSelfExcluded) {
    throw new Error("Você já está permanentemente autoexcluído");
  }
  
  let excludedUntil: Date | null = null;
  let isPermanent = false;
  
  switch (duration) {
    case "24h":
      excludedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
      break;
    case "7d":
      excludedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      excludedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      break;
    case "permanent":
      isPermanent = true;
      break;
  }
  
  await db.transaction(async (tx) => {
    await tx.update(users).set({
      selfExcludedUntil: excludedUntil,
      permanentSelfExcluded: isPermanent,
      selfExclusionReason: reason || null,
      updatedAt: new Date(),
    }).where(eq(users.id, userId));
    
    await tx.insert(responsibleGamingLogs).values({
      userId,
      actionType: isPermanent 
        ? ResponsibleGamingActionType.SELF_EXCLUDE_PERMANENT 
        : ResponsibleGamingActionType.SELF_EXCLUDE_TEMP,
      previousValue: null,
      newValue: duration,
      reason,
      effectiveAt: new Date(),
    });
  });
  
  return { 
    success: true, 
    excludedUntil,
    isPermanent,
  };
}

export async function checkDepositLimit(userId: string, amount: number): Promise<{
  allowed: boolean;
  reason?: string;
  remainingDaily?: number;
  remainingWeekly?: number;
  remainingMonthly?: number;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return { allowed: false, reason: "Usuário não encontrado" };
  }
  
  if (user.permanentSelfExcluded || (user.selfExcludedUntil && new Date(user.selfExcludedUntil) > new Date())) {
    return { allowed: false, reason: "Você está autoexcluído" };
  }
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const deposits = await db
    .select({ amount: pixDeposits.amount, createdAt: pixDeposits.createdAt })
    .from(pixDeposits)
    .where(and(
      eq(pixDeposits.userId, userId),
      eq(pixDeposits.status, "PAID"),
      gte(pixDeposits.createdAt, startOfMonth)
    ));
  
  let dailyTotal = 0;
  let weeklyTotal = 0;
  let monthlyTotal = 0;
  
  for (const dep of deposits) {
    const depAmount = parseFloat(dep.amount);
    const depDate = new Date(dep.createdAt);
    
    if (depDate >= startOfDay) dailyTotal += depAmount;
    if (depDate >= startOfWeek) weeklyTotal += depAmount;
    monthlyTotal += depAmount;
  }
  
  const result: any = { allowed: true };
  
  if (user.dailyDepositLimit) {
    const limit = parseFloat(user.dailyDepositLimit);
    result.remainingDaily = Math.max(0, limit - dailyTotal);
    if (dailyTotal + amount > limit) {
      return { 
        ...result, 
        allowed: false, 
        reason: `Limite diário excedido. Restam R$ ${result.remainingDaily.toFixed(2)}` 
      };
    }
  }
  
  if (user.weeklyDepositLimit) {
    const limit = parseFloat(user.weeklyDepositLimit);
    result.remainingWeekly = Math.max(0, limit - weeklyTotal);
    if (weeklyTotal + amount > limit) {
      return { 
        ...result, 
        allowed: false, 
        reason: `Limite semanal excedido. Restam R$ ${result.remainingWeekly.toFixed(2)}` 
      };
    }
  }
  
  if (user.monthlyDepositLimit) {
    const limit = parseFloat(user.monthlyDepositLimit);
    result.remainingMonthly = Math.max(0, limit - monthlyTotal);
    if (monthlyTotal + amount > limit) {
      return { 
        ...result, 
        allowed: false, 
        reason: `Limite mensal excedido. Restam R$ ${result.remainingMonthly.toFixed(2)}` 
      };
    }
  }
  
  return result;
}

export async function checkBetLimit(userId: string, amount: number): Promise<{
  allowed: boolean;
  reason?: string;
  maxAllowed?: number;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user) {
    return { allowed: false, reason: "Usuário não encontrado" };
  }
  
  if (user.permanentSelfExcluded || (user.selfExcludedUntil && new Date(user.selfExcludedUntil) > new Date())) {
    return { allowed: false, reason: "Você está autoexcluído" };
  }
  
  if (user.maxBetLimit) {
    const limit = parseFloat(user.maxBetLimit);
    if (amount > limit) {
      return { 
        allowed: false, 
        reason: `Aposta excede seu limite máximo de R$ ${limit.toFixed(2)}`,
        maxAllowed: limit,
      };
    }
  }
  
  return { allowed: true };
}

export async function startSession(userId: string) {
  await db.update(users).set({
    lastSessionStart: new Date(),
    updatedAt: new Date(),
  }).where(eq(users.id, userId));
}

export async function checkSessionTime(userId: string): Promise<{
  sessionMinutes: number;
  alertNeeded: boolean;
  alertType?: string;
  limitExceeded: boolean;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  
  if (!user || !user.lastSessionStart) {
    return { sessionMinutes: 0, alertNeeded: false, limitExceeded: false };
  }
  
  const sessionMinutes = Math.floor(
    (new Date().getTime() - new Date(user.lastSessionStart).getTime()) / (60 * 1000)
  );
  
  let alertNeeded = false;
  let alertType: string | undefined;
  
  if (sessionMinutes >= 120 && sessionMinutes < 121) {
    alertNeeded = true;
    alertType = "2_HOURS";
  } else if (sessionMinutes >= 60 && sessionMinutes < 61) {
    alertNeeded = true;
    alertType = "1_HOUR";
  }
  
  const limitExceeded = user.sessionTimeLimit ? sessionMinutes >= user.sessionTimeLimit : false;
  
  if (limitExceeded) {
    alertNeeded = true;
    alertType = "LIMIT_EXCEEDED";
  }
  
  if (alertNeeded && alertType) {
    const existingAlert = await db
      .select()
      .from(sessionAlerts)
      .where(and(
        eq(sessionAlerts.userId, userId),
        eq(sessionAlerts.alertType, alertType),
        gte(sessionAlerts.createdAt, new Date(Date.now() - 60 * 60 * 1000))
      ))
      .limit(1);
    
    if (existingAlert.length === 0) {
      await db.insert(sessionAlerts).values({
        userId,
        alertType,
        sessionDurationMinutes: sessionMinutes,
      });
    } else {
      alertNeeded = false;
    }
  }
  
  return { sessionMinutes, alertNeeded, alertType, limitExceeded };
}

export async function acknowledgeSessionAlert(alertId: string, userId: string) {
  await db.update(sessionAlerts).set({
    acknowledged: true,
  }).where(and(
    eq(sessionAlerts.id, alertId),
    eq(sessionAlerts.userId, userId)
  ));
}

export async function getResponsibleGamingHistory(userId: string, limit = 20) {
  return await db
    .select()
    .from(responsibleGamingLogs)
    .where(eq(responsibleGamingLogs.userId, userId))
    .orderBy(sql`${responsibleGamingLogs.createdAt} DESC`)
    .limit(limit);
}
