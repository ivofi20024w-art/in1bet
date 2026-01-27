import { db } from "../../db";
import { 
  notifications,
  userNotifications,
  notificationPreferences,
  pushSubscriptions,
  NotificationType,
  NotificationPriority,
  users,
} from "@shared/schema";
import { eq, sql, and, desc, isNull } from "drizzle-orm";
import webpush from "web-push";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:contato@in1bet.com";

let vapidConfigured = false;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    console.log("[WebPush] VAPID keys configured successfully");
  } catch (error) {
    console.error("[WebPush] Failed to configure VAPID keys:", error);
  }
} else {
  console.log("[WebPush] VAPID keys not configured - push notifications disabled");
}

export function getVapidPublicKey(): string | null {
  return VAPID_PUBLIC_KEY || null;
}

export function isWebPushEnabled(): boolean {
  return vapidConfigured;
}

export async function sendPushNotification(userId: string, payload: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}) {
  if (!vapidConfigured) {
    return { sent: 0, failed: 0, reason: "VAPID not configured" };
  }
  
  const subs = await db.select().from(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.userId, userId),
      eq(pushSubscriptions.isActive, true)
    ));
  
  if (subs.length === 0) {
    return { sent: 0, failed: 0, reason: "No active subscriptions" };
  }
  
  let sent = 0;
  let failed = 0;
  
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/icon-192.png",
          badge: payload.badge || "/badge-72.png",
          data: {
            url: payload.url || "/",
          },
          tag: payload.tag,
        })
      );
      
      await db.update(pushSubscriptions).set({
        lastUsedAt: new Date(),
      }).where(eq(pushSubscriptions.id, sub.id));
      
      sent++;
    } catch (error: any) {
      console.error(`[WebPush] Failed to send to ${sub.id}:`, error.message);
      
      if (error.statusCode === 404 || error.statusCode === 410) {
        await db.update(pushSubscriptions).set({
          isActive: false,
        }).where(eq(pushSubscriptions.id, sub.id));
      }
      
      failed++;
    }
  }
  
  return { sent, failed };
}

export async function createNotification(data: {
  type: string;
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  imageUrl?: string;
  priority?: string;
  targetAudience?: string;
  targetVipTiers?: string[];
  expiresAt?: Date;
}) {
  const [notification] = await db.insert(notifications).values({
    type: data.type,
    title: data.title,
    message: data.message,
    icon: data.icon,
    actionUrl: data.actionUrl,
    imageUrl: data.imageUrl,
    priority: data.priority || NotificationPriority.NORMAL,
    targetAudience: data.targetAudience || "ALL",
    targetVipTiers: data.targetVipTiers?.join(","),
    expiresAt: data.expiresAt,
  }).returning();
  
  return notification;
}

export async function sendNotificationToUser(
  userId: string,
  data: {
    type: string;
    title: string;
    message: string;
    icon?: string;
    actionUrl?: string;
    priority?: string;
    notificationId?: string;
  }
) {
  const prefs = await getOrCreateUserPreferences(userId);
  
  const category = getCategoryFromType(data.type);
  const shouldSendInApp = shouldSendByChannel(prefs, category, "inApp");
  
  if (!shouldSendInApp) {
    return null;
  }
  
  const [userNotification] = await db.insert(userNotifications).values({
    userId,
    notificationId: data.notificationId || null,
    type: data.type,
    title: data.title,
    message: data.message,
    icon: data.icon,
    actionUrl: data.actionUrl,
    priority: data.priority || NotificationPriority.NORMAL,
  }).returning();
  
  const shouldPush = shouldSendByChannel(prefs, category, "push");
  if (shouldPush && vapidConfigured) {
    sendPushNotification(userId, {
      title: data.title,
      body: data.message,
      icon: data.icon,
      url: data.actionUrl,
      tag: data.type,
    }).catch(err => console.error("[Push] Error sending push to user", userId, err));
  }
  
  return userNotification;
}

export async function sendBroadcastNotification(notificationId: string) {
  const [notification] = await db.select().from(notifications)
    .where(eq(notifications.id, notificationId));
  
  if (!notification) {
    throw new Error("Notificação não encontrada");
  }
  
  let targetUsers = await db.select({ id: users.id, vipLevel: users.vipLevel }).from(users);
  
  if (notification.targetVipTiers) {
    const tiers = notification.targetVipTiers.split(",").map(t => t.trim().toLowerCase());
    targetUsers = targetUsers.filter(u => tiers.includes((u.vipLevel || "bronze").toLowerCase()));
  }
  
  let sent = 0;
  for (const user of targetUsers) {
    await sendNotificationToUser(user.id, {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      icon: notification.icon || undefined,
      actionUrl: notification.actionUrl || undefined,
      priority: notification.priority,
      notificationId: notification.id,
    });
    sent++;
  }
  
  return { sent };
}

export async function getUserNotifications(userId: string, limit = 50, unreadOnly = false) {
  let query = db.select().from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt))
    .limit(limit);
  
  if (unreadOnly) {
    const result = await db.select().from(userNotifications)
      .where(and(
        eq(userNotifications.userId, userId),
        eq(userNotifications.isRead, false)
      ))
      .orderBy(desc(userNotifications.createdAt))
      .limit(limit);
    return result;
  }
  
  return await query;
}

export async function getUnreadCount(userId: string) {
  const [result] = await db.select({
    count: sql<number>`COUNT(*)`,
  }).from(userNotifications)
    .where(and(
      eq(userNotifications.userId, userId),
      eq(userNotifications.isRead, false)
    ));
  
  return result?.count || 0;
}

export async function markAsRead(userId: string, notificationIds: string[]) {
  if (notificationIds.length === 0) return;
  
  for (const id of notificationIds) {
    await db.update(userNotifications).set({
      isRead: true,
      readAt: new Date(),
    }).where(and(
      eq(userNotifications.id, id),
      eq(userNotifications.userId, userId)
    ));
  }
}

export async function markAllAsRead(userId: string) {
  await db.update(userNotifications).set({
    isRead: true,
    readAt: new Date(),
  }).where(and(
    eq(userNotifications.userId, userId),
    eq(userNotifications.isRead, false)
  ));
}

export async function deleteNotification(userId: string, notificationId: string) {
  await db.delete(userNotifications).where(and(
    eq(userNotifications.id, notificationId),
    eq(userNotifications.userId, userId)
  ));
}

export async function getOrCreateUserPreferences(userId: string) {
  const [existing] = await db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId));
  
  if (existing) return existing;
  
  const [created] = await db.insert(notificationPreferences).values({
    userId,
  }).returning();
  
  return created;
}

export async function updateUserPreferences(userId: string, updates: Record<string, boolean>) {
  const existing = await getOrCreateUserPreferences(userId);
  
  await db.update(notificationPreferences).set({
    ...updates,
    updatedAt: new Date(),
  }).where(eq(notificationPreferences.userId, userId));
  
  return await getOrCreateUserPreferences(userId);
}

export async function savePushSubscription(userId: string, subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}) {
  const existing = await db.select().from(pushSubscriptions)
    .where(and(
      eq(pushSubscriptions.userId, userId),
      eq(pushSubscriptions.endpoint, subscription.endpoint)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    await db.update(pushSubscriptions).set({
      isActive: true,
      lastUsedAt: new Date(),
    }).where(eq(pushSubscriptions.id, existing[0].id));
    return existing[0];
  }
  
  const [newSub] = await db.insert(pushSubscriptions).values({
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    userAgent: subscription.userAgent,
  }).returning();
  
  return newSub;
}

export async function removePushSubscription(userId: string, endpoint: string) {
  await db.update(pushSubscriptions).set({
    isActive: false,
  }).where(and(
    eq(pushSubscriptions.userId, userId),
    eq(pushSubscriptions.endpoint, endpoint)
  ));
}

function getCategoryFromType(type: string): string {
  switch (type) {
    case NotificationType.PROMOTION:
      return "promotions";
    case NotificationType.BET_RESULT:
      return "betResults";
    case NotificationType.LEVEL_UP:
      return "levelUp";
    case NotificationType.DAILY_BOX:
      return "dailyBox";
    case NotificationType.RAKEBACK:
      return "rakeback";
    case NotificationType.DEPOSIT:
      return "deposits";
    case NotificationType.WITHDRAWAL:
      return "withdrawals";
    case NotificationType.SECURITY:
      return "security";
    case NotificationType.MISSION:
      return "missions";
    default:
      return "promotions";
  }
}

function shouldSendByChannel(
  prefs: any,
  category: string,
  channel: "inApp" | "push" | "email"
): boolean {
  const key = `${category}${channel.charAt(0).toUpperCase() + channel.slice(1)}`;
  return prefs[key] !== false;
}

export async function sendSystemNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  actionUrl?: string
) {
  return await sendNotificationToUser(userId, {
    type,
    title,
    message,
    actionUrl,
    priority: NotificationPriority.HIGH,
  });
}

export async function notifyLevelUp(userId: string, newLevel: number, rewards?: string) {
  await sendNotificationToUser(userId, {
    type: NotificationType.LEVEL_UP,
    title: `Parabéns! Nível ${newLevel}`,
    message: rewards ? `Você subiu para o nível ${newLevel} e ganhou ${rewards}!` : `Você subiu para o nível ${newLevel}!`,
    icon: "star",
    actionUrl: "/levels",
    priority: NotificationPriority.HIGH,
  });
}

export async function notifyDailyBoxAvailable(userId: string) {
  await sendNotificationToUser(userId, {
    type: NotificationType.DAILY_BOX,
    title: "Caixa Diária Disponível",
    message: "Sua caixa diária está pronta para ser resgatada!",
    icon: "gift",
    actionUrl: "/levels",
    priority: NotificationPriority.NORMAL,
  });
}

export async function notifyRakebackAvailable(userId: string, amount: number) {
  await sendNotificationToUser(userId, {
    type: NotificationType.RAKEBACK,
    title: "Rakeback Disponível",
    message: `Você tem R$ ${amount.toFixed(2)} de rakeback para resgatar!`,
    icon: "dollar-sign",
    actionUrl: "/profile/rakeback",
    priority: NotificationPriority.HIGH,
  });
}

export async function notifyMissionCompleted(userId: string, missionName: string, rewardValue: number, rewardType: string) {
  await sendNotificationToUser(userId, {
    type: NotificationType.MISSION,
    title: "Missão Completada!",
    message: `Você completou "${missionName}" e ganhou ${rewardType === "XP" ? `${rewardValue} XP` : `R$ ${rewardValue.toFixed(2)}`}!`,
    icon: "target",
    actionUrl: "/profile/missions",
    priority: NotificationPriority.HIGH,
  });
}

export async function notifyDepositConfirmed(userId: string, amount: number) {
  await sendNotificationToUser(userId, {
    type: NotificationType.DEPOSIT,
    title: "Depósito Confirmado",
    message: `Seu depósito de R$ ${amount.toFixed(2)} foi confirmado!`,
    icon: "check-circle",
    actionUrl: "/wallet",
    priority: NotificationPriority.HIGH,
  });
}

export async function notifyWithdrawalStatus(userId: string, amount: number, status: "approved" | "rejected" | "paid") {
  const statusMessages = {
    approved: "aprovado",
    rejected: "rejeitado",
    paid: "pago",
  };
  
  await sendNotificationToUser(userId, {
    type: NotificationType.WITHDRAWAL,
    title: `Saque ${statusMessages[status].charAt(0).toUpperCase() + statusMessages[status].slice(1)}`,
    message: `Seu saque de R$ ${amount.toFixed(2)} foi ${statusMessages[status]}!`,
    icon: status === "rejected" ? "x-circle" : "check-circle",
    actionUrl: "/wallet",
    priority: NotificationPriority.HIGH,
  });
}
