import { db } from "../../db";
import {
  supportTickets,
  supportTicketMessages,
  supportTicketEscalations,
  supportDepartments,
  supportSlaRules,
  supportAuditLogs,
  users,
  SupportTicketStatus,
  SupportTicketPriority,
  SupportSenderType,
  type SupportTicket,
  type SupportTicketMessage,
  type CreateSupportTicket,
  type ReplyToTicket,
  type EscalateTicket,
  type CloseTicket,
  type RateTicket,
} from "@shared/schema";
import { eq, and, desc, sql, gte, lte, isNull, or } from "drizzle-orm";
import { getTriageRules, getSlaRules } from "./department.service";

export interface TicketResult {
  success: boolean;
  ticket?: SupportTicket;
  error?: string;
}

export interface TicketMessageResult {
  success: boolean;
  message?: SupportTicketMessage;
  error?: string;
}

async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(gte(supportTickets.createdAt, new Date(`${year}-01-01`)));

  const nextNumber = (result?.count || 0) + 1;
  return `SUP-${year}-${String(nextNumber).padStart(5, "0")}`;
}

async function classifyTicket(message: string): Promise<{ category?: string; priority?: string; departmentId?: string }> {
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
      };
    }
  }

  return { category: "OTHER", priority: "NORMAL" };
}

async function calculateSlaDeadline(priority: string, departmentId?: string): Promise<Date | null> {
  let slaRules = await getSlaRules(departmentId);
  
  if (slaRules.length === 0) {
    slaRules = await getSlaRules();
  }

  const matchingRule = slaRules.find(rule => rule.priority === priority);
  
  if (!matchingRule) {
    return null;
  }

  const resolutionMinutes = parseInt(matchingRule.resolutionMinutes);
  const deadline = new Date();
  deadline.setMinutes(deadline.getMinutes() + resolutionMinutes);
  
  return deadline;
}

export async function createTicket(
  userId: string,
  data: CreateSupportTicket
): Promise<TicketResult> {
  try {
    const classification = await classifyTicket(data.message);
    
    const category = data.category || classification.category || "OTHER";
    const priority = data.priority || classification.priority || SupportTicketPriority.NORMAL;
    const departmentId = data.departmentId || classification.departmentId || null;

    const ticketNumber = await generateTicketNumber();
    const slaDeadline = await calculateSlaDeadline(priority, departmentId || undefined);

    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const userPriority = user?.vipLevel === "platinum" || user?.vipLevel === "gold" 
      ? SupportTicketPriority.VIP 
      : priority;

    const [ticket] = await db
      .insert(supportTickets)
      .values({
        ticketNumber,
        userId,
        departmentId,
        subject: data.subject,
        status: SupportTicketStatus.OPEN,
        priority: userPriority,
        category,
        slaDeadline,
      })
      .returning();

    const [message] = await db
      .insert(supportTicketMessages)
      .values({
        ticketId: ticket.id,
        senderType: SupportSenderType.USER,
        senderId: userId,
        message: data.message,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      })
      .returning();

    await db.insert(supportAuditLogs).values({
      entityType: "TICKET",
      entityId: ticket.id,
      action: "CREATED",
      userId,
      dataAfter: JSON.stringify(ticket),
    });

    console.log(`[SUPPORT] Ticket created: ${ticketNumber} - User: ${userId}`);
    return { success: true, ticket };
  } catch (error: any) {
    console.error("Create ticket error:", error);
    return { success: false, error: "Erro ao criar ticket" };
  }
}

export async function getTicketById(ticketId: string): Promise<SupportTicket | null> {
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, ticketId));
  return ticket || null;
}

export async function getTicketByNumber(ticketNumber: string): Promise<SupportTicket | null> {
  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.ticketNumber, ticketNumber));
  return ticket || null;
}

export async function getUserTickets(userId: string): Promise<SupportTicket[]> {
  return await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.createdAt));
}

export async function getTicketMessages(ticketId: string, includeInternal = false): Promise<SupportTicketMessage[]> {
  if (includeInternal) {
    return await db
      .select()
      .from(supportTicketMessages)
      .where(eq(supportTicketMessages.ticketId, ticketId))
      .orderBy(supportTicketMessages.createdAt);
  }

  return await db
    .select()
    .from(supportTicketMessages)
    .where(
      and(
        eq(supportTicketMessages.ticketId, ticketId),
        eq(supportTicketMessages.isInternal, false)
      )
    )
    .orderBy(supportTicketMessages.createdAt);
}

export async function replyToTicket(
  senderId: string,
  senderType: "USER" | "ADMIN" | "SYSTEM",
  data: ReplyToTicket
): Promise<TicketMessageResult> {
  try {
    const ticket = await getTicketById(data.ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket não encontrado" };
    }

    if (ticket.status === SupportTicketStatus.CLOSED) {
      return { success: false, error: "Ticket está fechado" };
    }

    const [message] = await db
      .insert(supportTicketMessages)
      .values({
        ticketId: data.ticketId,
        senderType,
        senderId,
        message: data.message,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        isInternal: data.isInternal || false,
      })
      .returning();

    const updateData: any = { updatedAt: new Date() };

    if (senderType === SupportSenderType.ADMIN && !ticket.firstResponseAt) {
      updateData.firstResponseAt = new Date();
    }

    if (senderType === SupportSenderType.ADMIN) {
      updateData.status = SupportTicketStatus.WAITING_USER;
      updateData.assignedAdminId = senderId;
    } else if (senderType === SupportSenderType.USER) {
      if (ticket.status === SupportTicketStatus.WAITING_USER) {
        updateData.status = SupportTicketStatus.OPEN;
      }
    }

    await db
      .update(supportTickets)
      .set(updateData)
      .where(eq(supportTickets.id, data.ticketId));

    await db.insert(supportAuditLogs).values({
      entityType: "TICKET",
      entityId: data.ticketId,
      action: "MESSAGE_ADDED",
      adminId: senderType === "ADMIN" ? senderId : null,
      userId: senderType === "USER" ? senderId : null,
      dataAfter: JSON.stringify({ messageId: message.id, isInternal: data.isInternal }),
    });

    return { success: true, message };
  } catch (error: any) {
    console.error("Reply to ticket error:", error);
    return { success: false, error: "Erro ao responder ticket" };
  }
}

export async function escalateTicket(
  adminId: string,
  data: EscalateTicket
): Promise<TicketResult> {
  try {
    const ticket = await getTicketById(data.ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket não encontrado" };
    }

    const currentLevel = parseInt(ticket.escalationLevel);
    const newLevel = currentLevel + 1;

    const [escalation] = await db
      .insert(supportTicketEscalations)
      .values({
        ticketId: data.ticketId,
        fromLevel: String(currentLevel),
        toLevel: String(newLevel),
        fromAdminId: ticket.assignedAdminId || null,
        toAdminId: data.toAdminId || null,
        escalatedBy: adminId,
        reason: data.reason,
        isAutomatic: false,
      })
      .returning();

    const [updatedTicket] = await db
      .update(supportTickets)
      .set({
        escalationLevel: String(newLevel),
        status: SupportTicketStatus.ESCALATED,
        assignedAdminId: data.toAdminId || null,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, data.ticketId))
      .returning();

    await db.insert(supportTicketMessages).values({
      ticketId: data.ticketId,
      senderType: SupportSenderType.SYSTEM,
      message: `Ticket escalonado para nível ${newLevel}. Motivo: ${data.reason}`,
      isInternal: true,
    });

    await db.insert(supportAuditLogs).values({
      entityType: "TICKET",
      entityId: data.ticketId,
      action: "ESCALATED",
      adminId,
      dataBefore: JSON.stringify({ escalationLevel: currentLevel }),
      dataAfter: JSON.stringify({ escalationLevel: newLevel, reason: data.reason }),
    });

    console.log(`[SUPPORT] Ticket ${ticket.ticketNumber} escalated to level ${newLevel}`);
    return { success: true, ticket: updatedTicket };
  } catch (error: any) {
    console.error("Escalate ticket error:", error);
    return { success: false, error: "Erro ao escalonar ticket" };
  }
}

export async function closeTicket(
  closedBy: string,
  data: CloseTicket,
  isAdmin = false
): Promise<TicketResult> {
  try {
    const ticket = await getTicketById(data.ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket não encontrado" };
    }

    if (ticket.status === SupportTicketStatus.CLOSED) {
      return { success: false, error: "Ticket já está fechado" };
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set({
        status: SupportTicketStatus.CLOSED,
        closedAt: new Date(),
        closedBy,
        resolvedAt: isAdmin ? new Date() : null,
        resolvedBy: isAdmin ? closedBy : null,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, data.ticketId))
      .returning();

    if (data.resolution) {
      await db.insert(supportTicketMessages).values({
        ticketId: data.ticketId,
        senderType: isAdmin ? SupportSenderType.ADMIN : SupportSenderType.SYSTEM,
        senderId: isAdmin ? closedBy : null,
        message: `Ticket fechado. ${data.resolution ? `Resolução: ${data.resolution}` : ""}`,
        isInternal: true,
      });
    }

    await db.insert(supportAuditLogs).values({
      entityType: "TICKET",
      entityId: data.ticketId,
      action: "CLOSED",
      adminId: isAdmin ? closedBy : null,
      userId: !isAdmin ? closedBy : null,
      dataBefore: JSON.stringify({ status: ticket.status }),
      dataAfter: JSON.stringify({ status: "CLOSED", resolution: data.resolution }),
    });

    console.log(`[SUPPORT] Ticket ${ticket.ticketNumber} closed`);
    return { success: true, ticket: updatedTicket };
  } catch (error: any) {
    console.error("Close ticket error:", error);
    return { success: false, error: "Erro ao fechar ticket" };
  }
}

export async function rateTicket(
  userId: string,
  data: RateTicket
): Promise<TicketResult> {
  try {
    const ticket = await getTicketById(data.ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket não encontrado" };
    }

    if (ticket.userId !== userId) {
      return { success: false, error: "Você não pode avaliar este ticket" };
    }

    if (ticket.userRating) {
      return { success: false, error: "Ticket já foi avaliado" };
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set({
        userRating: String(data.rating),
        userFeedback: data.feedback || null,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, data.ticketId))
      .returning();

    await db.insert(supportAuditLogs).values({
      entityType: "TICKET",
      entityId: data.ticketId,
      action: "RATED",
      userId,
      dataAfter: JSON.stringify({ rating: data.rating, feedback: data.feedback }),
    });

    return { success: true, ticket: updatedTicket };
  } catch (error: any) {
    console.error("Rate ticket error:", error);
    return { success: false, error: "Erro ao avaliar ticket" };
  }
}

export async function assignTicket(
  ticketId: string,
  adminId: string,
  assignedBy?: string
): Promise<TicketResult> {
  try {
    const ticket = await getTicketById(ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket não encontrado" };
    }

    const [updatedTicket] = await db
      .update(supportTickets)
      .set({
        assignedAdminId: adminId,
        status: SupportTicketStatus.WAITING_INTERNAL,
        updatedAt: new Date(),
      })
      .where(eq(supportTickets.id, ticketId))
      .returning();

    await db.insert(supportAuditLogs).values({
      entityType: "TICKET",
      entityId: ticketId,
      action: "ASSIGNED",
      adminId: assignedBy || adminId,
      dataBefore: JSON.stringify({ assignedAdminId: ticket.assignedAdminId }),
      dataAfter: JSON.stringify({ assignedAdminId: adminId }),
    });

    return { success: true, ticket: updatedTicket };
  } catch (error: any) {
    console.error("Assign ticket error:", error);
    return { success: false, error: "Erro ao atribuir ticket" };
  }
}

export async function getDepartmentTickets(
  departmentId: string,
  status?: string
): Promise<SupportTicket[]> {
  if (status) {
    return await db
      .select()
      .from(supportTickets)
      .where(
        and(
          eq(supportTickets.departmentId, departmentId),
          eq(supportTickets.status, status)
        )
      )
      .orderBy(desc(supportTickets.createdAt));
  }

  return await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.departmentId, departmentId))
    .orderBy(desc(supportTickets.createdAt));
}

export async function getOpenTickets(): Promise<SupportTicket[]> {
  return await db
    .select()
    .from(supportTickets)
    .where(
      or(
        eq(supportTickets.status, SupportTicketStatus.OPEN),
        eq(supportTickets.status, SupportTicketStatus.WAITING_INTERNAL),
        eq(supportTickets.status, SupportTicketStatus.ESCALATED)
      )
    )
    .orderBy(desc(supportTickets.priority), supportTickets.createdAt);
}

export async function getAllTickets(filters?: { 
  status?: string; 
  priority?: string;
  departmentId?: string;
  slaBreached?: boolean;
}): Promise<(SupportTicket & { user?: { id: string; username: string; email: string } | null; department?: { id: string; name: string } | null })[]> {
  const conditions = [];
  
  if (filters?.status === "open") {
    conditions.push(
      or(
        eq(supportTickets.status, SupportTicketStatus.OPEN),
        eq(supportTickets.status, SupportTicketStatus.WAITING_USER),
        eq(supportTickets.status, SupportTicketStatus.WAITING_INTERNAL)
      )
    );
  } else if (filters?.status && filters.status !== "all") {
    conditions.push(eq(supportTickets.status, filters.status));
  }
  
  if (filters?.priority && filters.priority !== "all") {
    conditions.push(eq(supportTickets.priority, filters.priority));
  }
  
  if (filters?.departmentId) {
    conditions.push(eq(supportTickets.departmentId, filters.departmentId));
  }
  
  if (filters?.slaBreached) {
    conditions.push(eq(supportTickets.slaBreached, true));
  }
  
  let whereClause;
  if (conditions.length === 1) {
    whereClause = conditions[0];
  } else if (conditions.length > 1) {
    whereClause = and(...conditions);
  }
  
  const baseQuery = db
    .select({
      ticket: supportTickets,
      user: {
        id: users.id,
        username: users.username,
        email: users.email,
      },
      department: {
        id: supportDepartments.id,
        name: supportDepartments.name,
      },
    })
    .from(supportTickets)
    .leftJoin(users, eq(supportTickets.userId, users.id))
    .leftJoin(supportDepartments, eq(supportTickets.departmentId, supportDepartments.id));
  
  const results = whereClause 
    ? await baseQuery.where(whereClause).orderBy(desc(supportTickets.createdAt))
    : await baseQuery.orderBy(desc(supportTickets.createdAt));
  
  return results.map(r => ({
    ...r.ticket,
    user: r.user,
    department: r.department,
  }));
}

export async function getBreachedSlaTickets(): Promise<SupportTicket[]> {
  return await db
    .select()
    .from(supportTickets)
    .where(
      and(
        eq(supportTickets.slaBreached, true),
        or(
          eq(supportTickets.status, SupportTicketStatus.OPEN),
          eq(supportTickets.status, SupportTicketStatus.WAITING_INTERNAL),
          eq(supportTickets.status, SupportTicketStatus.ESCALATED)
        )
      )
    )
    .orderBy(supportTickets.createdAt);
}

export async function checkAndUpdateSlaBreaches(): Promise<number> {
  const now = new Date();
  
  const result = await db
    .update(supportTickets)
    .set({
      slaBreached: true,
      updatedAt: new Date(),
    })
    .where(
      and(
        lte(supportTickets.slaDeadline, now),
        eq(supportTickets.slaBreached, false),
        or(
          eq(supportTickets.status, SupportTicketStatus.OPEN),
          eq(supportTickets.status, SupportTicketStatus.WAITING_INTERNAL),
          eq(supportTickets.status, SupportTicketStatus.WAITING_USER)
        )
      )
    )
    .returning();

  if (result.length > 0) {
    console.log(`[SUPPORT] ${result.length} tickets marked as SLA breached`);
  }

  return result.length;
}

export async function getTicketStats(): Promise<{
  total: number;
  open: number;
  resolved: number;
  slaBreached: number;
  avgResolutionMinutes: number;
}> {
  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportTickets);

  const [openResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(
      or(
        eq(supportTickets.status, SupportTicketStatus.OPEN),
        eq(supportTickets.status, SupportTicketStatus.WAITING_INTERNAL),
        eq(supportTickets.status, SupportTicketStatus.WAITING_USER),
        eq(supportTickets.status, SupportTicketStatus.ESCALATED)
      )
    );

  const [resolvedResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(eq(supportTickets.status, SupportTicketStatus.RESOLVED));

  const [slaBreachedResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(supportTickets)
    .where(eq(supportTickets.slaBreached, true));

  const [avgResult] = await db
    .select({
      avg: sql<number>`EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60`,
    })
    .from(supportTickets)
    .where(
      and(
        eq(supportTickets.status, SupportTicketStatus.RESOLVED),
        sql`resolved_at IS NOT NULL`
      )
    );

  return {
    total: totalResult?.count || 0,
    open: openResult?.count || 0,
    resolved: resolvedResult?.count || 0,
    slaBreached: slaBreachedResult?.count || 0,
    avgResolutionMinutes: Math.round(avgResult?.avg || 0),
  };
}
