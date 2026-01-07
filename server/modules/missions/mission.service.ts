import { db } from "../../db";
import { 
  missionTemplates,
  missionInstances,
  missionAssignments,
  missionProgressLogs,
  users,
  wallets,
  transactions,
  MissionCadence,
  MissionStatus,
  MissionRewardType,
  TransactionType,
} from "@shared/schema";
import { eq, sql, and, gte, lte, desc, inArray } from "drizzle-orm";
import { notifyMissionCompleted } from "../notifications/notification.service";
import { addXpFromWager } from "../levels/level.service";

const DEFAULT_DAILY_MISSIONS = [
  { 
    name: "Apostador Diário", 
    description: "Faça 5 apostas hoje", 
    cadence: "DAILY",
    requirementType: "BET_COUNT",
    requirementTarget: "5",
    rewardType: "XP",
    rewardValue: "100",
    sortOrder: 1,
  },
  { 
    name: "Aposta Alta", 
    description: "Aposte um total de R$ 50 hoje", 
    cadence: "DAILY",
    requirementType: "BET_AMOUNT",
    requirementTarget: "50",
    rewardType: "XP",
    rewardValue: "150",
    sortOrder: 2,
  },
  { 
    name: "Sortudo", 
    description: "Ganhe 3 apostas hoje", 
    cadence: "DAILY",
    requirementType: "WIN_COUNT",
    requirementTarget: "3",
    rewardType: "BONUS_CASH",
    rewardValue: "2",
    sortOrder: 3,
  },
  { 
    name: "Caixa do Dia", 
    description: "Resgate sua caixa diária", 
    cadence: "DAILY",
    requirementType: "CLAIM_DAILY_BOX",
    requirementTarget: "1",
    rewardType: "XP",
    rewardValue: "50",
    sortOrder: 4,
  },
];

const DEFAULT_WEEKLY_MISSIONS = [
  { 
    name: "Maratonista", 
    description: "Faça 50 apostas esta semana", 
    cadence: "WEEKLY",
    requirementType: "BET_COUNT",
    requirementTarget: "50",
    rewardType: "BONUS_CASH",
    rewardValue: "10",
    sortOrder: 1,
  },
  { 
    name: "Alto Apostador", 
    description: "Aposte um total de R$ 500 esta semana", 
    cadence: "WEEKLY",
    requirementType: "BET_AMOUNT",
    requirementTarget: "500",
    rewardType: "BONUS_CASH",
    rewardValue: "25",
    sortOrder: 2,
  },
  { 
    name: "Grande Vencedor", 
    description: "Ganhe 20 apostas esta semana", 
    cadence: "WEEKLY",
    requirementType: "WIN_COUNT",
    requirementTarget: "20",
    rewardType: "BONUS_CASH",
    rewardValue: "15",
    sortOrder: 3,
  },
  { 
    name: "Jackpot Semanal", 
    description: "Ganhe um total de R$ 200 esta semana", 
    cadence: "WEEKLY",
    requirementType: "WIN_AMOUNT",
    requirementTarget: "200",
    rewardType: "XP",
    rewardValue: "500",
    sortOrder: 4,
  },
  { 
    name: "Colecionador de Caixas", 
    description: "Resgate 5 caixas diárias esta semana", 
    cadence: "WEEKLY",
    requirementType: "CLAIM_DAILY_BOX",
    requirementTarget: "5",
    rewardType: "BONUS_CASH",
    rewardValue: "5",
    sortOrder: 5,
  },
];

export async function initializeMissionTemplates() {
  const existing = await db.select().from(missionTemplates).limit(1);
  if (existing.length > 0) return;
  
  for (const mission of [...DEFAULT_DAILY_MISSIONS, ...DEFAULT_WEEKLY_MISSIONS]) {
    await db.insert(missionTemplates).values(mission);
  }
  console.log("[MISSIONS] Default templates initialized");
}

export async function createMissionInstances() {
  const now = new Date();
  
  const dailyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dailyEnd = new Date(dailyStart);
  dailyEnd.setDate(dailyEnd.getDate() + 1);
  dailyEnd.setMilliseconds(dailyEnd.getMilliseconds() - 1);
  
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  
  const templates = await db.select().from(missionTemplates)
    .where(eq(missionTemplates.isActive, true));
  
  for (const template of templates) {
    const periodStart = template.cadence === MissionCadence.DAILY ? dailyStart : weekStart;
    const periodEnd = template.cadence === MissionCadence.DAILY ? dailyEnd : weekEnd;
    
    const existing = await db.select().from(missionInstances)
      .where(and(
        eq(missionInstances.templateId, template.id),
        eq(missionInstances.periodStart, periodStart)
      ))
      .limit(1);
    
    if (existing.length === 0) {
      await db.insert(missionInstances).values({
        templateId: template.id,
        periodStart,
        periodEnd,
        isActive: true,
      });
    }
  }
}

export async function getUserMissions(userId: string) {
  const now = new Date();
  
  await createMissionInstances();
  await ensureUserAssignments(userId);
  
  const dailyStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = getWeekStart(now);
  
  const assignments = await db
    .select({
      assignment: missionAssignments,
      instance: missionInstances,
      template: missionTemplates,
    })
    .from(missionAssignments)
    .innerJoin(missionInstances, eq(missionAssignments.instanceId, missionInstances.id))
    .innerJoin(missionTemplates, eq(missionInstances.templateId, missionTemplates.id))
    .where(and(
      eq(missionAssignments.userId, userId),
      gte(missionInstances.periodEnd, now)
    ))
    .orderBy(missionTemplates.sortOrder);
  
  const daily = assignments
    .filter(a => a.template.cadence === MissionCadence.DAILY)
    .map(formatMissionResponse);
  
  const weekly = assignments
    .filter(a => a.template.cadence === MissionCadence.WEEKLY)
    .map(formatMissionResponse);
  
  return { daily, weekly };
}

function formatMissionResponse(a: any) {
  return {
    id: a.assignment.id,
    name: a.template.name,
    description: a.template.description,
    icon: a.template.icon,
    progress: parseFloat(a.assignment.progress),
    target: parseFloat(a.assignment.target),
    progressPercent: Math.min((parseFloat(a.assignment.progress) / parseFloat(a.assignment.target)) * 100, 100),
    status: a.assignment.status,
    rewardType: a.assignment.rewardType,
    rewardValue: parseFloat(a.assignment.rewardValue),
    periodEnd: a.instance.periodEnd,
    completedAt: a.assignment.completedAt,
    claimedAt: a.assignment.claimedAt,
  };
}

async function ensureUserAssignments(userId: string) {
  const now = new Date();
  
  const activeInstances = await db.select().from(missionInstances)
    .where(and(
      eq(missionInstances.isActive, true),
      gte(missionInstances.periodEnd, now)
    ));
  
  const existingAssignments = await db.select()
    .from(missionAssignments)
    .where(and(
      eq(missionAssignments.userId, userId),
      inArray(missionAssignments.instanceId, activeInstances.map(i => i.id))
    ));
  
  const existingInstanceIds = new Set(existingAssignments.map(a => a.instanceId));
  
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const vipLevel = user?.vipLevel || "bronze";
  
  for (const instance of activeInstances) {
    if (existingInstanceIds.has(instance.id)) continue;
    
    const [template] = await db.select().from(missionTemplates)
      .where(eq(missionTemplates.id, instance.templateId));
    
    if (!template) continue;
    
    const vipMultiplier = parseFloat(template.vipRewardMultiplier || "1");
    const baseReward = parseFloat(template.rewardValue);
    const adjustedReward = getVipAdjustedReward(baseReward, vipLevel, vipMultiplier);
    
    await db.insert(missionAssignments).values({
      userId,
      instanceId: instance.id,
      progress: "0",
      target: template.requirementTarget,
      status: MissionStatus.ACTIVE,
      rewardType: template.rewardType,
      rewardValue: adjustedReward.toFixed(2),
    });
  }
}

function getVipAdjustedReward(baseReward: number, vipLevel: string, multiplier: number): number {
  const vipBonus: Record<string, number> = {
    bronze: 1,
    silver: 1.1,
    gold: 1.2,
    platinum: 1.3,
    diamond: 1.5,
  };
  
  const levelBonus = vipBonus[vipLevel.toLowerCase()] || 1;
  return baseReward * levelBonus * multiplier;
}

export async function updateMissionProgress(
  userId: string,
  eventType: string,
  value: number,
  sourceId?: string
) {
  const now = new Date();
  
  const assignments = await db
    .select({
      assignment: missionAssignments,
      instance: missionInstances,
      template: missionTemplates,
    })
    .from(missionAssignments)
    .innerJoin(missionInstances, eq(missionAssignments.instanceId, missionInstances.id))
    .innerJoin(missionTemplates, eq(missionInstances.templateId, missionTemplates.id))
    .where(and(
      eq(missionAssignments.userId, userId),
      eq(missionAssignments.status, MissionStatus.ACTIVE),
      gte(missionInstances.periodEnd, now)
    ));
  
  for (const a of assignments) {
    if (a.template.requirementType !== eventType) continue;
    
    const currentProgress = parseFloat(a.assignment.progress);
    const target = parseFloat(a.assignment.target);
    const newProgress = Math.min(currentProgress + value, target);
    
    await db.update(missionAssignments).set({
      progress: newProgress.toFixed(2),
      updatedAt: new Date(),
      status: newProgress >= target ? MissionStatus.COMPLETED : MissionStatus.ACTIVE,
      completedAt: newProgress >= target ? new Date() : null,
    }).where(eq(missionAssignments.id, a.assignment.id));
    
    await db.insert(missionProgressLogs).values({
      assignmentId: a.assignment.id,
      sourceEvent: eventType,
      sourceId,
      progressDelta: value.toFixed(2),
      progressAfter: newProgress.toFixed(2),
    });
    
    if (newProgress >= target && currentProgress < target) {
      await notifyMissionCompleted(userId, a.template.name, parseFloat(a.assignment.rewardValue), a.assignment.rewardType);
    }
  }
}

export async function claimMissionReward(userId: string, assignmentId: string): Promise<{
  success: boolean;
  reward?: { type: string; value: number };
  error?: string;
}> {
  const [assignment] = await db.select().from(missionAssignments)
    .where(and(
      eq(missionAssignments.id, assignmentId),
      eq(missionAssignments.userId, userId)
    ));
  
  if (!assignment) {
    return { success: false, error: "Missão não encontrada" };
  }
  
  if (assignment.status !== MissionStatus.COMPLETED) {
    return { success: false, error: "Missão ainda não foi completada" };
  }
  
  if (assignment.claimedAt) {
    return { success: false, error: "Recompensa já foi resgatada" };
  }
  
  const rewardValue = parseFloat(assignment.rewardValue);
  const rewardType = assignment.rewardType;
  
  await db.transaction(async (tx) => {
    await tx.update(missionAssignments).set({
      status: MissionStatus.CLAIMED,
      claimedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(missionAssignments.id, assignmentId));
    
    if (rewardType === MissionRewardType.XP) {
    } else if (rewardType === MissionRewardType.BONUS_CASH) {
      const [wallet] = await tx.select().from(wallets).where(eq(wallets.userId, userId));
      if (wallet) {
        const newBalance = parseFloat(wallet.balance) + rewardValue;
        await tx.update(wallets).set({
          balance: newBalance.toFixed(2),
          updatedAt: new Date(),
        }).where(eq(wallets.userId, userId));
        
        await tx.insert(transactions).values({
          userId,
          walletId: wallet.id,
          type: TransactionType.MISSION_REWARD,
          amount: rewardValue.toFixed(2),
          balanceBefore: wallet.balance,
          balanceAfter: newBalance.toFixed(2),
          status: "COMPLETED",
          description: `Recompensa de missão`,
        });
      }
    }
  });
  
  return { success: true, reward: { type: rewardType, value: rewardValue } };
}

export async function getMissionStats(userId: string) {
  const completedToday = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(missionAssignments)
    .innerJoin(missionInstances, eq(missionAssignments.instanceId, missionInstances.id))
    .innerJoin(missionTemplates, eq(missionInstances.templateId, missionTemplates.id))
    .where(and(
      eq(missionAssignments.userId, userId),
      eq(missionTemplates.cadence, MissionCadence.DAILY),
      inArray(missionAssignments.status, [MissionStatus.COMPLETED, MissionStatus.CLAIMED])
    ));
  
  const claimedThisWeek = await db.select({
    count: sql<number>`COUNT(*)`,
    totalXp: sql<string>`COALESCE(SUM(CASE WHEN reward_type = 'XP' THEN reward_value::numeric ELSE 0 END), 0)`,
    totalCash: sql<string>`COALESCE(SUM(CASE WHEN reward_type = 'BONUS_CASH' THEN reward_value::numeric ELSE 0 END), 0)`,
  }).from(missionAssignments)
    .where(and(
      eq(missionAssignments.userId, userId),
      eq(missionAssignments.status, MissionStatus.CLAIMED),
      gte(missionAssignments.claimedAt, getWeekStart(new Date()))
    ));
  
  return {
    completedToday: completedToday[0]?.count || 0,
    claimedThisWeek: claimedThisWeek[0]?.count || 0,
    totalXpEarned: parseFloat(claimedThisWeek[0]?.totalXp || "0"),
    totalCashEarned: parseFloat(claimedThisWeek[0]?.totalCash || "0"),
  };
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

export async function getAdminMissionTemplates() {
  return await db.select().from(missionTemplates)
    .orderBy(missionTemplates.cadence, missionTemplates.sortOrder);
}

export async function createMissionTemplate(data: {
  name: string;
  description: string;
  icon?: string;
  cadence: string;
  requirementType: string;
  requirementTarget: number;
  requirementMetadata?: string;
  rewardType: string;
  rewardValue: number;
  rewardMetadata?: string;
  minVipLevel?: string;
  vipRewardMultiplier?: number;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const [template] = await db.insert(missionTemplates).values({
    name: data.name,
    description: data.description,
    icon: data.icon,
    cadence: data.cadence,
    requirementType: data.requirementType,
    requirementTarget: data.requirementTarget.toString(),
    requirementMetadata: data.requirementMetadata,
    rewardType: data.rewardType,
    rewardValue: data.rewardValue.toString(),
    rewardMetadata: data.rewardMetadata,
    minVipLevel: data.minVipLevel || "bronze",
    vipRewardMultiplier: (data.vipRewardMultiplier || 1).toString(),
    sortOrder: data.sortOrder || 0,
    isActive: data.isActive !== false,
  }).returning();
  
  return template;
}

export async function updateMissionTemplate(id: string, data: Partial<{
  name: string;
  description: string;
  icon: string;
  requirementTarget: number;
  rewardValue: number;
  sortOrder: number;
  isActive: boolean;
}>) {
  const updates: any = { updatedAt: new Date() };
  
  if (data.name) updates.name = data.name;
  if (data.description) updates.description = data.description;
  if (data.icon !== undefined) updates.icon = data.icon;
  if (data.requirementTarget) updates.requirementTarget = data.requirementTarget.toString();
  if (data.rewardValue) updates.rewardValue = data.rewardValue.toString();
  if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;
  if (data.isActive !== undefined) updates.isActive = data.isActive;
  
  await db.update(missionTemplates).set(updates).where(eq(missionTemplates.id, id));
  
  const [template] = await db.select().from(missionTemplates).where(eq(missionTemplates.id, id));
  return template;
}
