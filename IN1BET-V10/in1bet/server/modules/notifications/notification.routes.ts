import { Router, Request, Response, NextFunction } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users, updateNotificationPreferencesSchema, pushSubscriptionSchema, markNotificationsReadSchema } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getOrCreateUserPreferences,
  updateUserPreferences,
  savePushSubscription,
  removePushSubscription,
  createNotification,
  sendBroadcastNotification,
  getVapidPublicKey,
  isWebPushEnabled,
  sendPushNotification,
} from "./notification.service";

const router = Router();

router.get("/push/vapid-public-key", (req: Request, res: Response) => {
  const publicKey = getVapidPublicKey();
  const enabled = isWebPushEnabled();
  res.json({ publicKey, enabled });
});

const adminCheck = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({ error: "Erro ao verificar permissões" });
  }
};

router.get("/feed", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;
    const unreadOnly = req.query.unread === "true";
    
    const notifications = await getUserNotifications(userId, limit, unreadOnly);
    const unreadCount = await getUnreadCount(userId);
    
    res.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error("Notification feed error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar notificações" });
  }
});

router.get("/count", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const count = await getUnreadCount(userId);
    res.json({ count });
  } catch (error: any) {
    console.error("Notification count error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar contagem" });
  }
});

router.post("/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = markNotificationsReadSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
    }
    
    await markAsRead(userId, validation.data.notificationIds);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: error.message || "Erro ao marcar como lida" });
  }
});

router.post("/read-all", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    await markAllAsRead(userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Mark all read error:", error);
    res.status(500).json({ error: error.message || "Erro ao marcar todas como lidas" });
  }
});

router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await deleteNotification(userId, id);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Delete notification error:", error);
    res.status(500).json({ error: error.message || "Erro ao deletar notificação" });
  }
});

router.get("/preferences", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const preferences = await getOrCreateUserPreferences(userId);
    res.json(preferences);
  } catch (error: any) {
    console.error("Get preferences error:", error);
    res.status(500).json({ error: error.message || "Erro ao buscar preferências" });
  }
});

router.put("/preferences", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = updateNotificationPreferencesSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
    }
    
    const preferences = await updateUserPreferences(userId, validation.data);
    res.json(preferences);
  } catch (error: any) {
    console.error("Update preferences error:", error);
    res.status(500).json({ error: error.message || "Erro ao atualizar preferências" });
  }
});

router.post("/push/subscribe", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validation = pushSubscriptionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message || "Dados inválidos" });
    }
    
    const subscription = await savePushSubscription(userId, {
      ...validation.data,
      userAgent: req.headers["user-agent"],
    });
    
    res.json({ success: true, subscriptionId: subscription.id });
  } catch (error: any) {
    console.error("Push subscribe error:", error);
    res.status(500).json({ error: error.message || "Erro ao registrar notificações push" });
  }
});

router.post("/push/unsubscribe", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { endpoint } = req.body;
    
    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint é obrigatório" });
    }
    
    await removePushSubscription(userId, endpoint);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Push unsubscribe error:", error);
    res.status(500).json({ error: error.message || "Erro ao remover notificações push" });
  }
});

router.post("/admin/broadcast", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { type, title, message, actionUrl, priority, targetVipTiers } = req.body;
    
    if (!type || !title || !message) {
      return res.status(400).json({ error: "type, title e message são obrigatórios" });
    }
    
    const notification = await createNotification({
      type,
      title,
      message,
      actionUrl,
      priority,
      targetVipTiers,
    });
    
    const result = await sendBroadcastNotification(notification.id);
    
    res.json({ success: true, notificationId: notification.id, ...result });
  } catch (error: any) {
    console.error("Broadcast error:", error);
    res.status(500).json({ error: error.message || "Erro ao enviar notificação" });
  }
});

export default router;
