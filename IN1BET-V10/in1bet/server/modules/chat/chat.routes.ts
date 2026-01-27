import { Router, Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { 
  chatRooms, chatMessages, chatPenalties, chatReports, 
  chatBadWords, chatUserCustomization, users,
  createChatRoomSchema, addBadWordSchema, issuePenaltySchema, reportMessageSchema
} from "@shared/schema";
import { eq, desc, and, count, gte, sql } from "drizzle-orm";
import { authMiddleware } from "../auth/auth.middleware";

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
    return res.status(500).json({ error: "Erro ao verificar permissões" });
  }
};
import { 
  getChatRooms, 
  reportMessage, 
  deleteMessage, 
  getOnlineUsers,
  initializeChatRooms
} from "./chat.service";
import { applyPenalty, invalidateBadWordsCache } from "./chat.moderation";
import { deleteMessageFromClients, getOnlineCount } from "./chat.websocket";

const router = Router();

router.get("/rooms", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userVipLevel = req.user?.vipLevel || "bronze";
    const rooms = await getChatRooms(userVipLevel);
    res.json(rooms);
  } catch (error) {
    console.error("[CHAT] Error fetching rooms:", error);
    res.status(500).json({ error: "Erro ao buscar salas" });
  }
});

router.get("/online-count", async (req: Request, res: Response) => {
  try {
    res.json({ count: getOnlineCount() });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar contagem" });
  }
});

router.get("/online-users/:roomId", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const users = await getOnlineUsers(roomId);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar usuários online" });
  }
});

router.get("/customization", authMiddleware, async (req: Request, res: Response) => {
  try {
    const [customization] = await db.select().from(chatUserCustomization).where(eq(chatUserCustomization.userId, req.user!.id));
    res.json({ customization: customization || null });
  } catch (error) {
    console.error("[CHAT] Error fetching customization:", error);
    res.status(500).json({ error: "Erro ao buscar personalização" });
  }
});

router.post("/customization", authMiddleware, async (req: Request, res: Response) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    if (!user || user.level < 50) {
      res.status(403).json({ error: "Nível 50+ necessário para personalização" });
      return;
    }

    const { nameColor, nameEffect, messageColor } = req.body;
    
    const validColors = ["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink", "white", ""];
    const validEffects = [
      "glow", "rainbow", "bold", "italic",
      "stars", "sparkles", "fire", "thunder", "neon", "ice", "gold",
      "matrix", "pulse", "glitch", "shadow", "cosmic", "toxic", "blood", "diamond",
      ""
    ];
    
    if (nameColor && !validColors.includes(nameColor)) {
      res.status(400).json({ error: "Cor de nome inválida" });
      return;
    }
    if (nameEffect && !validEffects.includes(nameEffect)) {
      res.status(400).json({ error: "Efeito de nome inválido" });
      return;
    }
    if (messageColor && !validColors.includes(messageColor)) {
      res.status(400).json({ error: "Cor de mensagem inválida" });
      return;
    }
    
    const existing = await db.select().from(chatUserCustomization).where(eq(chatUserCustomization.userId, req.user!.id));
    
    if (existing.length > 0) {
      await db.update(chatUserCustomization)
        .set({ 
          nameColor: nameColor || null, 
          nameEffect: nameEffect || null, 
          messageColor: messageColor || null,
          updatedAt: new Date()
        })
        .where(eq(chatUserCustomization.userId, req.user!.id));
    } else {
      await db.insert(chatUserCustomization).values({
        userId: req.user!.id,
        nameColor: nameColor || null,
        nameEffect: nameEffect || null,
        messageColor: messageColor || null,
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("[CHAT] Error saving customization:", error);
    res.status(500).json({ error: "Erro ao salvar personalização" });
  }
});

router.post("/report", authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = reportMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos" });
      return;
    }

    const { messageId, reason } = parsed.data;
    const result = await reportMessage(messageId, req.user!.id, reason);

    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }

    res.json({ success: true, message: "Denúncia enviada" });
  } catch (error) {
    console.error("[CHAT] Error reporting message:", error);
    res.status(500).json({ error: "Erro ao enviar denúncia" });
  }
});

router.get("/admin/stats", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [totalMessages] = await db
      .select({ count: count() })
      .from(chatMessages);

    const [todayMessages] = await db
      .select({ count: count() })
      .from(chatMessages)
      .where(gte(chatMessages.createdAt, today));

    const [activeBans] = await db
      .select({ count: count() })
      .from(chatPenalties)
      .where(
        and(
          eq(chatPenalties.isActive, true),
          eq(chatPenalties.penaltyType, "BAN")
        )
      );

    const [pendingReports] = await db
      .select({ count: count() })
      .from(chatReports)
      .where(eq(chatReports.status, "PENDING"));

    res.json({
      totalMessages: totalMessages.count,
      todayMessages: todayMessages.count,
      activeBans: activeBans.count,
      pendingReports: pendingReports.count,
      onlineUsers: getOnlineCount(),
    });
  } catch (error) {
    console.error("[CHAT ADMIN] Error fetching stats:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

router.get("/admin/reports", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string || "PENDING";
    
    const reports = await db
      .select({
        id: chatReports.id,
        reason: chatReports.reason,
        status: chatReports.status,
        createdAt: chatReports.createdAt,
        messageId: chatReports.messageId,
        messageContent: chatMessages.message,
        reporterName: sql<string>`(SELECT name FROM users WHERE id = ${chatReports.reporterId})`,
        authorName: sql<string>`(SELECT name FROM users WHERE id = ${chatMessages.userId})`,
      })
      .from(chatReports)
      .innerJoin(chatMessages, eq(chatReports.messageId, chatMessages.id))
      .where(eq(chatReports.status, status))
      .orderBy(desc(chatReports.createdAt))
      .limit(50);

    res.json(reports);
  } catch (error) {
    console.error("[CHAT ADMIN] Error fetching reports:", error);
    res.status(500).json({ error: "Erro ao buscar denúncias" });
  }
});

router.post("/admin/reports/:id/action", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action, penaltyType } = req.body;

    const [report] = await db
      .select()
      .from(chatReports)
      .where(eq(chatReports.id, id));

    if (!report) {
      res.status(404).json({ error: "Denúncia não encontrada" });
      return;
    }

    const [message] = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.id, report.messageId));

    let appliedPenalty: { type: string; expiresAt?: Date } | null = null;

    if (action === "approve") {
      await deleteMessage(report.messageId, req.user!.id, "Removido por violação");
      deleteMessageFromClients(message.roomId, message.id);

      if (penaltyType) {
        let expiresAt: Date | null = null;
        if (penaltyType === "MUTE_5MIN") {
          expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        } else if (penaltyType === "MUTE_1HOUR") {
          expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        }

        await db.insert(chatPenalties).values({
          userId: message.userId,
          roomId: message.roomId || null,
          penaltyType,
          violationType: "MANUAL",
          reason: `Denúncia aprovada: ${report.reason}`,
          messageContent: message.message?.substring(0, 500),
          expiresAt,
          isActive: true,
          issuedBy: req.user!.id,
        });

        appliedPenalty = { type: penaltyType, expiresAt: expiresAt || undefined };
      }
    }

    await db
      .update(chatReports)
      .set({
        status: action === "approve" ? "APPROVED" : "REJECTED",
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
        actionTaken: action === "approve" 
          ? `Mensagem removida${penaltyType ? `, penalidade aplicada: ${penaltyType}` : ""}`
          : "Denúncia rejeitada",
      })
      .where(eq(chatReports.id, id));

    res.json({ success: true, penalty: appliedPenalty });
  } catch (error) {
    console.error("[CHAT ADMIN] Error processing report:", error);
    res.status(500).json({ error: "Erro ao processar denúncia" });
  }
});

router.get("/admin/penalties", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const penalties = await db
      .select({
        id: chatPenalties.id,
        penaltyType: chatPenalties.penaltyType,
        violationType: chatPenalties.violationType,
        reason: chatPenalties.reason,
        expiresAt: chatPenalties.expiresAt,
        isActive: chatPenalties.isActive,
        createdAt: chatPenalties.createdAt,
        userName: users.name,
        userId: chatPenalties.userId,
      })
      .from(chatPenalties)
      .innerJoin(users, eq(chatPenalties.userId, users.id))
      .orderBy(desc(chatPenalties.createdAt))
      .limit(100);

    res.json(penalties);
  } catch (error) {
    console.error("[CHAT ADMIN] Error fetching penalties:", error);
    res.status(500).json({ error: "Erro ao buscar penalidades" });
  }
});

router.post("/admin/penalty", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const parsed = issuePenaltySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos" });
      return;
    }

    const { userId, roomId, penaltyType, reason } = parsed.data;

    let expiresAt: Date | null = null;
    if (penaltyType === "MUTE_5MIN") {
      expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    } else if (penaltyType === "MUTE_1HOUR") {
      expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    }

    await db.insert(chatPenalties).values({
      userId,
      roomId: roomId || null,
      penaltyType,
      violationType: "MANUAL",
      reason,
      expiresAt,
      isActive: true,
      issuedBy: req.user!.id,
    });

    res.json({ success: true, message: "Penalidade aplicada" });
  } catch (error) {
    console.error("[CHAT ADMIN] Error issuing penalty:", error);
    res.status(500).json({ error: "Erro ao aplicar penalidade" });
  }
});

router.delete("/admin/penalty/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db
      .update(chatPenalties)
      .set({ isActive: false })
      .where(eq(chatPenalties.id, id));

    res.json({ success: true, message: "Penalidade removida" });
  } catch (error) {
    console.error("[CHAT ADMIN] Error removing penalty:", error);
    res.status(500).json({ error: "Erro ao remover penalidade" });
  }
});

router.get("/admin/bad-words", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const words = await db
      .select()
      .from(chatBadWords)
      .orderBy(desc(chatBadWords.createdAt));

    res.json(words);
  } catch (error) {
    console.error("[CHAT ADMIN] Error fetching bad words:", error);
    res.status(500).json({ error: "Erro ao buscar palavras bloqueadas" });
  }
});

router.post("/admin/bad-words", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const parsed = addBadWordSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos" });
      return;
    }

    const { word, severity } = parsed.data;

    await db.insert(chatBadWords).values({
      word: word.toLowerCase(),
      severity: severity || 1,
    });

    invalidateBadWordsCache();

    res.json({ success: true, message: "Palavra adicionada" });
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(400).json({ error: "Palavra já existe" });
      return;
    }
    console.error("[CHAT ADMIN] Error adding bad word:", error);
    res.status(500).json({ error: "Erro ao adicionar palavra" });
  }
});

router.delete("/admin/bad-words/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db
      .delete(chatBadWords)
      .where(eq(chatBadWords.id, id));

    invalidateBadWordsCache();

    res.json({ success: true, message: "Palavra removida" });
  } catch (error) {
    console.error("[CHAT ADMIN] Error removing bad word:", error);
    res.status(500).json({ error: "Erro ao remover palavra" });
  }
});

router.post("/admin/rooms", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const parsed = createChatRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Dados inválidos" });
      return;
    }

    const [room] = await db
      .insert(chatRooms)
      .values(parsed.data)
      .returning();

    res.json(room);
  } catch (error: any) {
    if (error.code === "23505") {
      res.status(400).json({ error: "Sala já existe" });
      return;
    }
    console.error("[CHAT ADMIN] Error creating room:", error);
    res.status(500).json({ error: "Erro ao criar sala" });
  }
});

router.patch("/admin/rooms/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive, displayName, minVipLevel, sortOrder } = req.body;

    const [updated] = await db
      .update(chatRooms)
      .set({
        ...(isActive !== undefined && { isActive }),
        ...(displayName && { displayName }),
        ...(minVipLevel !== undefined && { minVipLevel }),
        ...(sortOrder !== undefined && { sortOrder }),
      })
      .where(eq(chatRooms.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error("[CHAT ADMIN] Error updating room:", error);
    res.status(500).json({ error: "Erro ao atualizar sala" });
  }
});

router.post("/admin/ban-from-casino", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { userId, reason, permanent, days } = req.body;

    if (!userId || typeof userId !== "string") {
      res.status(400).json({ error: "ID do utilizador obrigatório" });
      return;
    }

    if (!reason || typeof reason !== "string" || reason.length < 5) {
      res.status(400).json({ error: "Motivo obrigatório (mínimo 5 caracteres)" });
      return;
    }

    const isPermanent = permanent === true;
    const banDays = typeof days === "number" ? days : 0;

    if (!isPermanent && (banDays < 1 || banDays > 365)) {
      res.status(400).json({ error: "Escolha banimento permanente ou especifique duração (1-365 dias)" });
      return;
    }

    const [targetUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!targetUser) {
      res.status(404).json({ error: "Utilizador não encontrado" });
      return;
    }

    if (targetUser.isAdmin) {
      res.status(403).json({ error: "Não é possível banir um administrador" });
      return;
    }

    const blockedAt = new Date();
    
    await db.update(users)
      .set({
        isBlocked: true,
        blockReason: reason,
        blockedAt,
        blockedBy: req.user!.id,
      })
      .where(eq(users.id, userId));

    await db.insert(chatPenalties).values({
      userId,
      penaltyType: "BAN",
      violationType: "MANUAL",
      reason: `Banido do casino: ${reason}`,
      isActive: true,
      issuedBy: req.user!.id,
      expiresAt: isPermanent ? null : new Date(Date.now() + banDays * 24 * 60 * 60 * 1000),
    });

    console.log(`[CHAT ADMIN] User ${userId} banned from casino by ${req.user!.id}. Reason: ${reason}. Permanent: ${isPermanent}`);

    res.json({ 
      success: true, 
      message: isPermanent ? "Utilizador banido permanentemente do casino" : `Utilizador banido por ${banDays} dia(s)` 
    });
  } catch (error) {
    console.error("[CHAT ADMIN] Error banning from casino:", error);
    res.status(500).json({ error: "Erro ao banir do casino" });
  }
});

router.post("/admin/set-moderator-role", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;

    if (!userId) {
      res.status(400).json({ error: "ID do utilizador obrigatório" });
      return;
    }

    const validRoles = ["NONE", "HELPER", "CHAT_MODERATOR", "SUPPORT", "ADMIN"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Role inválido" });
      return;
    }

    const [targetUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!targetUser) {
      res.status(404).json({ error: "Utilizador não encontrado" });
      return;
    }

    await db.update(users)
      .set({ chatModeratorRole: role })
      .where(eq(users.id, userId));

    res.json({ success: true, message: `Role atualizado para ${role}` });
  } catch (error) {
    console.error("[CHAT ADMIN] Error setting moderator role:", error);
    res.status(500).json({ error: "Erro ao definir role" });
  }
});

router.get("/admin/chat-moderators", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const moderators = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        chatModeratorRole: users.chatModeratorRole,
        level: users.level,
        vipLevel: users.vipLevel,
      })
      .from(users)
      .where(
        sql`${users.chatModeratorRole} IS NOT NULL AND ${users.chatModeratorRole} != 'NONE'`
      )
      .orderBy(users.chatModeratorRole);

    res.json(moderators);
  } catch (error) {
    console.error("[CHAT ADMIN] Error fetching moderators:", error);
    res.status(500).json({ error: "Erro ao buscar moderadores" });
  }
});

export { router as chatRoutes, initializeChatRooms };
