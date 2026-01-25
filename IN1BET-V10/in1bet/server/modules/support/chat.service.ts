import { db } from "../../db";
import {
  supportChats,
  supportChatMessages,
  supportChatTransfers,
  supportTickets,
  supportTicketMessages,
  supportAuditLogs,
  adminDepartments,
  users,
  SupportChatStatus,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportSenderType,
  type SupportChat,
  type SupportChatMessage,
  type CreateSupportChat,
  type SendChatMessage,
  type TransferChat,
  type CloseChat,
  type RateChat,
} from "@shared/schema";
import { eq, and, desc, sql, isNull, or, lt } from "drizzle-orm";
import { getTriageRules, getDepartmentById } from "./department.service";

export interface ChatResult {
  success: boolean;
  chat?: SupportChat;
  error?: string;
}

export interface ChatMessageResult {
  success: boolean;
  message?: SupportChatMessage;
  triageResponse?: string;
  error?: string;
}

async function classifyMessage(message: string): Promise<{
  category?: string;
  priority?: string;
  departmentId?: string;
  autoResponse?: string;
  canAutoResolve?: boolean;
}> {
  const triageRules = await getTriageRules(true);
  const lowerMessage = message.toLowerCase();

  for (const rule of triageRules) {
    const keywords = JSON.parse(rule.keywords) as string[];
    const matched = keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));

    if (matched) {
      return {
        category: rule.category,
        priority: rule.priority,
        departmentId: rule.departmentId || undefined,
        autoResponse: rule.autoResponse || undefined,
        canAutoResolve: rule.canAutoResolve,
      };
    }
  }

  return { category: "OTHER", priority: "NORMAL" };
}

async function calculateQueuePosition(departmentId: string | null, priority: string): Promise<number> {
  const priorityWeights: Record<string, number> = {
    VIP: 0,
    URGENT: 1,
    HIGH: 2,
    NORMAL: 3,
    LOW: 4,
  };

  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportChats)
    .where(
      and(
        eq(supportChats.status, SupportChatStatus.WAITING),
        departmentId ? eq(supportChats.departmentId, departmentId) : isNull(supportChats.departmentId)
      )
    );

  return (result?.count || 0) + 1 + (priorityWeights[priority] || 3);
}

async function findAvailableAgent(departmentId: string): Promise<string | null> {
  const agents = await db
    .select({
      adminId: adminDepartments.adminId,
      maxConcurrentChats: adminDepartments.maxConcurrentChats,
      activeChats: sql<number>`(
        SELECT COUNT(*) FROM support_chats 
        WHERE assigned_admin_id = ${adminDepartments.adminId} 
        AND status = 'ACTIVE'
      )::int`,
    })
    .from(adminDepartments)
    .where(
      and(
        eq(adminDepartments.departmentId, departmentId),
        eq(adminDepartments.isAvailable, true)
      )
    );

  for (const agent of agents) {
    const maxChats = parseInt(agent.maxConcurrentChats);
    if (agent.activeChats < maxChats) {
      return agent.adminId;
    }
  }

  return null;
}

export async function startChat(
  userId: string,
  data: CreateSupportChat
): Promise<ChatResult> {
  try {
    const [existingActive] = await db
      .select()
      .from(supportChats)
      .where(
        and(
          eq(supportChats.userId, userId),
          or(
            eq(supportChats.status, SupportChatStatus.WAITING),
            eq(supportChats.status, SupportChatStatus.ACTIVE)
          )
        )
      );

    if (existingActive) {
      return { success: true, chat: existingActive };
    }

    const classification = await classifyMessage(data.initialMessage);
    const category = data.category || classification.category || "OTHER";
    const departmentId = data.departmentId || classification.departmentId || null;
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const priority = user?.vipLevel === "platinum" || user?.vipLevel === "gold"
      ? SupportTicketPriority.VIP
      : classification.priority || SupportTicketPriority.NORMAL;

    const queuePosition = await calculateQueuePosition(departmentId, priority);

    let assignedAdminId: string | null = null;
    let chatStatus: typeof SupportChatStatus[keyof typeof SupportChatStatus] = SupportChatStatus.WAITING;

    if (departmentId) {
      const department = await getDepartmentById(departmentId);
      if (department?.autoAssign) {
        assignedAdminId = await findAvailableAgent(departmentId);
        if (assignedAdminId) {
          chatStatus = SupportChatStatus.ACTIVE;
        }
      }
    }

    const [chat] = await db
      .insert(supportChats)
      .values({
        userId,
        departmentId,
        assignedAdminId,
        status: chatStatus,
        priority,
        category,
        queuePosition: String(queuePosition),
        triageCompleted: !!classification.autoResponse,
        triageResponse: classification.autoResponse ? JSON.stringify(classification) : null,
        startedAt: assignedAdminId ? new Date() : null,
      })
      .returning();

    await db.insert(supportChatMessages).values({
      chatId: chat.id,
      senderType: SupportSenderType.USER,
      senderId: userId,
      message: data.initialMessage,
    });

    if (classification.autoResponse) {
      await db.insert(supportChatMessages).values({
        chatId: chat.id,
        senderType: SupportSenderType.BOT,
        message: classification.autoResponse,
      });
    }

    await db.insert(supportAuditLogs).values({
      entityType: "CHAT",
      entityId: chat.id,
      action: "CREATED",
      userId,
      dataAfter: JSON.stringify(chat),
    });

    console.log(`[SUPPORT] Chat started: ${chat.id} - User: ${userId} - Queue: ${queuePosition}`);
    return { success: true, chat };
  } catch (error: any) {
    console.error("Start chat error:", error);
    return { success: false, error: "Erro ao iniciar chat" };
  }
}

export async function getChatById(chatId: string): Promise<SupportChat | null> {
  const [chat] = await db
    .select()
    .from(supportChats)
    .where(eq(supportChats.id, chatId));
  return chat || null;
}

export async function getUserActiveChat(userId: string): Promise<SupportChat | null> {
  const [chat] = await db
    .select()
    .from(supportChats)
    .where(
      and(
        eq(supportChats.userId, userId),
        or(
          eq(supportChats.status, SupportChatStatus.WAITING),
          eq(supportChats.status, SupportChatStatus.ACTIVE)
        )
      )
    );
  return chat || null;
}

export async function getChatMessages(chatId: string): Promise<SupportChatMessage[]> {
  return await db
    .select()
    .from(supportChatMessages)
    .where(eq(supportChatMessages.chatId, chatId))
    .orderBy(supportChatMessages.createdAt);
}

export async function sendMessage(
  senderId: string,
  senderType: "USER" | "ADMIN" | "SYSTEM" | "BOT",
  data: SendChatMessage
): Promise<ChatMessageResult> {
  try {
    const chat = await getChatById(data.chatId);
    if (!chat) {
      return { success: false, error: "Chat não encontrado" };
    }

    if (chat.status === SupportChatStatus.CLOSED) {
      return { success: false, error: "Chat está fechado" };
    }

    const [message] = await db
      .insert(supportChatMessages)
      .values({
        chatId: data.chatId,
        senderType,
        senderId: senderType !== SupportSenderType.BOT && senderType !== SupportSenderType.SYSTEM ? senderId : null,
        message: data.message,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      })
      .returning();

    if (senderType === SupportSenderType.ADMIN && chat.status === SupportChatStatus.WAITING) {
      await db
        .update(supportChats)
        .set({
          status: SupportChatStatus.ACTIVE,
          assignedAdminId: senderId,
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(supportChats.id, data.chatId));
    } else {
      await db
        .update(supportChats)
        .set({ updatedAt: new Date() })
        .where(eq(supportChats.id, data.chatId));
    }

    let triageResponse: string | undefined;

    if (senderType === SupportSenderType.USER && !chat.triageCompleted) {
      const classification = await classifyMessage(data.message);
      if (classification.autoResponse) {
        const [botMessage] = await db
          .insert(supportChatMessages)
          .values({
            chatId: data.chatId,
            senderType: SupportSenderType.BOT,
            message: classification.autoResponse,
          })
          .returning();

        triageResponse = classification.autoResponse;

        await db
          .update(supportChats)
          .set({
            triageCompleted: true,
            triageResponse: JSON.stringify(classification),
            category: classification.category || chat.category,
            priority: classification.priority || chat.priority,
            departmentId: classification.departmentId || chat.departmentId,
            updatedAt: new Date(),
          })
          .where(eq(supportChats.id, data.chatId));
      }
    }

    return { success: true, message, triageResponse };
  } catch (error: any) {
    console.error("Send message error:", error);
    return { success: false, error: "Erro ao enviar mensagem" };
  }
}

export async function markMessagesAsRead(
  chatId: string,
  readBy: string,
  isAdmin: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const senderTypesToMark = isAdmin
      ? [SupportSenderType.USER, SupportSenderType.BOT, SupportSenderType.SYSTEM]
      : [SupportSenderType.ADMIN, SupportSenderType.BOT, SupportSenderType.SYSTEM];

    await db
      .update(supportChatMessages)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(supportChatMessages.chatId, chatId),
          eq(supportChatMessages.isRead, false),
          or(...senderTypesToMark.map(type => eq(supportChatMessages.senderType, type)))
        )
      );

    return { success: true };
  } catch (error: any) {
    console.error("Mark messages as read error:", error);
    return { success: false, error: "Erro ao marcar mensagens como lidas" };
  }
}

export async function transferChat(
  adminId: string,
  data: TransferChat
): Promise<ChatResult> {
  try {
    const chat = await getChatById(data.chatId);
    if (!chat) {
      return { success: false, error: "Chat não encontrado" };
    }

    if (chat.status === SupportChatStatus.CLOSED) {
      return { success: false, error: "Chat está fechado" };
    }

    const toDepartment = await getDepartmentById(data.toDepartmentId);
    if (!toDepartment) {
      return { success: false, error: "Departamento de destino não encontrado" };
    }

    let newAssignedAdminId: string | null = data.toAdminId || null;
    
    if (!newAssignedAdminId && toDepartment.autoAssign) {
      newAssignedAdminId = await findAvailableAgent(data.toDepartmentId);
    }

    await db.insert(supportChatTransfers).values({
      chatId: data.chatId,
      fromDepartmentId: chat.departmentId,
      toDepartmentId: data.toDepartmentId,
      fromAdminId: chat.assignedAdminId,
      toAdminId: newAssignedAdminId,
      transferredByAdminId: adminId,
      reason: data.reason,
    });

    const [updatedChat] = await db
      .update(supportChats)
      .set({
        departmentId: data.toDepartmentId,
        assignedAdminId: newAssignedAdminId,
        status: newAssignedAdminId ? SupportChatStatus.ACTIVE : SupportChatStatus.WAITING,
        updatedAt: new Date(),
      })
      .where(eq(supportChats.id, data.chatId))
      .returning();

    await db.insert(supportChatMessages).values({
      chatId: data.chatId,
      senderType: SupportSenderType.SYSTEM,
      message: `Chat transferido para ${toDepartment.name}. Motivo: ${data.reason}`,
    });

    await db.insert(supportAuditLogs).values({
      entityType: "CHAT",
      entityId: data.chatId,
      action: "TRANSFERRED",
      adminId,
      dataBefore: JSON.stringify({ departmentId: chat.departmentId, assignedAdminId: chat.assignedAdminId }),
      dataAfter: JSON.stringify({ departmentId: data.toDepartmentId, assignedAdminId: newAssignedAdminId }),
    });

    console.log(`[SUPPORT] Chat ${data.chatId} transferred to department ${data.toDepartmentId}`);
    return { success: true, chat: updatedChat };
  } catch (error: any) {
    console.error("Transfer chat error:", error);
    return { success: false, error: "Erro ao transferir chat" };
  }
}

export async function closeChat(
  closedBy: string,
  data: CloseChat,
  isAdmin = false
): Promise<ChatResult> {
  try {
    const chat = await getChatById(data.chatId);
    if (!chat) {
      return { success: false, error: "Chat não encontrado" };
    }

    if (chat.status === SupportChatStatus.CLOSED) {
      return { success: false, error: "Chat já está fechado" };
    }

    if (data.convertToTicket) {
      const messages = await getChatMessages(data.chatId);
      const initialMessage = messages.find(m => m.senderType === SupportSenderType.USER);

      const [ticket] = await db
        .insert(supportTickets)
        .values({
          ticketNumber: `SUP-${Date.now()}`,
          userId: chat.userId,
          departmentId: chat.departmentId,
          fromChatId: data.chatId,
          subject: `Continuação do chat ${data.chatId.slice(0, 8)}`,
          status: SupportTicketStatus.OPEN,
          priority: chat.priority,
          category: chat.category,
        })
        .returning();

      for (const msg of messages) {
        await db.insert(supportTicketMessages).values({
          ticketId: ticket.id,
          senderType: msg.senderType,
          senderId: msg.senderId,
          message: msg.message,
          attachments: msg.attachments,
        });
      }

      await db.insert(supportChatMessages).values({
        chatId: data.chatId,
        senderType: SupportSenderType.SYSTEM,
        message: `Chat convertido para ticket ${ticket.ticketNumber}`,
      });
    }

    const [updatedChat] = await db
      .update(supportChats)
      .set({
        status: SupportChatStatus.CLOSED,
        closedAt: new Date(),
        closedBy,
        closeReason: data.reason || null,
        updatedAt: new Date(),
      })
      .where(eq(supportChats.id, data.chatId))
      .returning();

    await db.insert(supportChatMessages).values({
      chatId: data.chatId,
      senderType: SupportSenderType.SYSTEM,
      message: isAdmin ? "Chat encerrado pelo atendente." : "Chat encerrado pelo usuário.",
    });

    await db.insert(supportAuditLogs).values({
      entityType: "CHAT",
      entityId: data.chatId,
      action: "CLOSED",
      adminId: isAdmin ? closedBy : null,
      userId: !isAdmin ? closedBy : null,
      dataBefore: JSON.stringify({ status: chat.status }),
      dataAfter: JSON.stringify({ status: "CLOSED", reason: data.reason }),
    });

    console.log(`[SUPPORT] Chat ${data.chatId} closed`);
    return { success: true, chat: updatedChat };
  } catch (error: any) {
    console.error("Close chat error:", error);
    return { success: false, error: "Erro ao fechar chat" };
  }
}

export async function rateChat(
  userId: string,
  data: RateChat
): Promise<ChatResult> {
  try {
    const chat = await getChatById(data.chatId);
    if (!chat) {
      return { success: false, error: "Chat não encontrado" };
    }

    if (chat.userId !== userId) {
      return { success: false, error: "Você não pode avaliar este chat" };
    }

    if (chat.userRating) {
      return { success: false, error: "Chat já foi avaliado" };
    }

    const [updatedChat] = await db
      .update(supportChats)
      .set({
        userRating: String(data.rating),
        userFeedback: data.feedback || null,
        updatedAt: new Date(),
      })
      .where(eq(supportChats.id, data.chatId))
      .returning();

    await db.insert(supportAuditLogs).values({
      entityType: "CHAT",
      entityId: data.chatId,
      action: "RATED",
      userId,
      dataAfter: JSON.stringify({ rating: data.rating, feedback: data.feedback }),
    });

    return { success: true, chat: updatedChat };
  } catch (error: any) {
    console.error("Rate chat error:", error);
    return { success: false, error: "Erro ao avaliar chat" };
  }
}

export async function takeChat(
  adminId: string,
  chatId: string,
  departmentId: string
): Promise<ChatResult> {
  try {
    const chat = await getChatById(chatId);
    if (!chat) {
      return { success: false, error: "Chat não encontrado" };
    }

    if (chat.status !== SupportChatStatus.WAITING) {
      return { success: false, error: "Chat não está na fila" };
    }

    const [admin] = await db.select().from(users).where(eq(users.id, adminId));
    const isSuperAdmin = admin?.isAdmin === true;

    if (!isSuperAdmin) {
      const [adminDept] = await db
        .select()
        .from(adminDepartments)
        .where(
          and(
            eq(adminDepartments.adminId, adminId),
            eq(adminDepartments.departmentId, departmentId)
          )
        );

      if (!adminDept) {
        return { success: false, error: "Você não pertence a este departamento" };
      }
    }

    const [updatedChat] = await db
      .update(supportChats)
      .set({
        status: SupportChatStatus.ACTIVE,
        assignedAdminId: adminId,
        departmentId,
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(supportChats.id, chatId))
      .returning();

    await db.insert(supportChatMessages).values({
      chatId,
      senderType: SupportSenderType.SYSTEM,
      message: "Você está sendo atendido por um agente.",
    });

    await db.insert(supportAuditLogs).values({
      entityType: "CHAT",
      entityId: chatId,
      action: "TAKEN",
      adminId,
      dataAfter: JSON.stringify({ assignedAdminId: adminId, status: "ACTIVE" }),
    });

    console.log(`[SUPPORT] Chat ${chatId} taken by admin ${adminId}`);
    return { success: true, chat: updatedChat };
  } catch (error: any) {
    console.error("Take chat error:", error);
    return { success: false, error: "Erro ao pegar chat" };
  }
}

export async function getWaitingChats(departmentId?: string): Promise<SupportChat[]> {
  if (departmentId) {
    return await db
      .select()
      .from(supportChats)
      .where(
        and(
          eq(supportChats.status, SupportChatStatus.WAITING),
          eq(supportChats.departmentId, departmentId)
        )
      )
      .orderBy(supportChats.queuePosition, supportChats.createdAt);
  }

  return await db
    .select()
    .from(supportChats)
    .where(eq(supportChats.status, SupportChatStatus.WAITING))
    .orderBy(supportChats.queuePosition, supportChats.createdAt);
}

export async function getAdminActiveChats(adminId: string): Promise<SupportChat[]> {
  return await db
    .select()
    .from(supportChats)
    .where(
      and(
        eq(supportChats.assignedAdminId, adminId),
        eq(supportChats.status, SupportChatStatus.ACTIVE)
      )
    )
    .orderBy(desc(supportChats.updatedAt));
}

export async function getUserChatHistory(userId: string): Promise<SupportChat[]> {
  return await db
    .select()
    .from(supportChats)
    .where(eq(supportChats.userId, userId))
    .orderBy(desc(supportChats.createdAt));
}

export async function getChatStats(): Promise<{
  waiting: number;
  active: number;
  closedToday: number;
  avgWaitMinutes: number;
  avgRating: number;
}> {
  const [waitingResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportChats)
    .where(eq(supportChats.status, SupportChatStatus.WAITING));

  const [activeResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportChats)
    .where(eq(supportChats.status, SupportChatStatus.ACTIVE));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [closedTodayResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportChats)
    .where(
      and(
        eq(supportChats.status, SupportChatStatus.CLOSED),
        sql`closed_at >= ${todayStart}`
      )
    );

  const [avgWaitResult] = await db
    .select({
      avg: sql<number>`EXTRACT(EPOCH FROM (started_at - created_at)) / 60`,
    })
    .from(supportChats)
    .where(sql`started_at IS NOT NULL`);

  const [avgRatingResult] = await db
    .select({ avg: sql<number>`AVG(user_rating::numeric)` })
    .from(supportChats)
    .where(sql`user_rating IS NOT NULL`);

  return {
    waiting: waitingResult?.count || 0,
    active: activeResult?.count || 0,
    closedToday: closedTodayResult?.count || 0,
    avgWaitMinutes: Math.round(avgWaitResult?.avg || 0),
    avgRating: Math.round((avgRatingResult?.avg || 0) * 10) / 10,
  };
}
