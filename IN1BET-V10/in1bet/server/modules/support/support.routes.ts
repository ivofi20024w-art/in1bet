import { Router, Request, Response } from "express";
import { authMiddleware } from "../auth/auth.middleware";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import {
  createSupportDepartmentSchema,
  updateSupportDepartmentSchema,
  assignAdminToDepartmentSchema,
  createSupportChatSchema,
  sendChatMessageSchema,
  transferChatSchema,
  closeChatSchema,
  rateChatSchema,
  createSupportTicketSchema,
  replyToTicketSchema,
  escalateTicketSchema,
  closeTicketSchema,
  rateTicketSchema,
  createCannedResponseSchema,
  createSlaRuleSchema,
  createTriageRuleSchema,
} from "@shared/schema";
import * as DepartmentService from "./department.service";
import * as TicketService from "./ticket.service";
import * as ChatService from "./chat.service";

const router = Router();

const adminCheck = async (req: Request, res: Response, next: Function) => {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado" });
  }

  const [user] = await db.select().from(users).where(eq(users.id, req.user.id));
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "Acesso negado" });
  }

  next();
};

router.get("/departments", authMiddleware, async (req: Request, res: Response) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const departments = await DepartmentService.getAllDepartments(includeInactive);
    res.json({ success: true, departments });
  } catch (error: any) {
    console.error("Get departments error:", error);
    res.status(500).json({ error: "Erro ao buscar departamentos" });
  }
});

router.get("/departments/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const department = await DepartmentService.getDepartmentById(req.params.id);
    if (!department) {
      return res.status(404).json({ error: "Departamento não encontrado" });
    }
    res.json({ success: true, department });
  } catch (error: any) {
    console.error("Get department error:", error);
    res.status(500).json({ error: "Erro ao buscar departamento" });
  }
});

router.post("/departments", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = createSupportDepartmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await DepartmentService.createDepartment(validation.data, req.user!.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ success: true, department: result.department });
  } catch (error: any) {
    console.error("Create department error:", error);
    res.status(500).json({ error: "Erro ao criar departamento" });
  }
});

router.put("/departments/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = updateSupportDepartmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await DepartmentService.updateDepartment(req.params.id, validation.data, req.user!.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, department: result.department });
  } catch (error: any) {
    console.error("Update department error:", error);
    res.status(500).json({ error: "Erro ao atualizar departamento" });
  }
});

router.post("/departments/:id/toggle", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const result = await DepartmentService.toggleDepartmentStatus(req.params.id, req.user!.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, department: result.department });
  } catch (error: any) {
    console.error("Toggle department error:", error);
    res.status(500).json({ error: "Erro ao alterar status do departamento" });
  }
});

router.get("/departments/:id/agents", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const agents = await DepartmentService.getDepartmentAgents(req.params.id);
    res.json({ success: true, agents });
  } catch (error: any) {
    console.error("Get department agents error:", error);
    res.status(500).json({ error: "Erro ao buscar agentes" });
  }
});

router.post("/agents/assign", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = assignAdminToDepartmentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await DepartmentService.assignAdminToDepartment(validation.data, req.user!.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ success: true, adminDepartment: result.adminDepartment });
  } catch (error: any) {
    console.error("Assign admin error:", error);
    res.status(500).json({ error: "Erro ao vincular agente" });
  }
});

router.delete("/agents/:adminId/departments/:departmentId", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const result = await DepartmentService.removeAdminFromDepartment(
      req.params.adminId,
      req.params.departmentId,
      req.user!.id
    );
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Remove admin error:", error);
    res.status(500).json({ error: "Erro ao remover agente" });
  }
});

router.post("/agents/availability", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { departmentId, isAvailable } = req.body;
    const result = await DepartmentService.updateAgentAvailability(req.user!.id, departmentId, isAvailable);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Update availability error:", error);
    res.status(500).json({ error: "Erro ao atualizar disponibilidade" });
  }
});

router.get("/agents/my-departments", authMiddleware, async (req: Request, res: Response) => {
  try {
    const departments = await DepartmentService.getAdminDepartments(req.user!.id);
    res.json({ success: true, departments });
  } catch (error: any) {
    console.error("Get my departments error:", error);
    res.status(500).json({ error: "Erro ao buscar departamentos" });
  }
});

router.post("/chats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = createSupportChatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await ChatService.startChat(req.user!.id, validation.data);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ success: true, chat: result.chat });
  } catch (error: any) {
    console.error("Start chat error:", error);
    res.status(500).json({ error: "Erro ao iniciar chat" });
  }
});

router.get("/chats/active", authMiddleware, async (req: Request, res: Response) => {
  try {
    const chat = await ChatService.getUserActiveChat(req.user!.id);
    res.json({ success: true, chat });
  } catch (error: any) {
    console.error("Get active chat error:", error);
    res.status(500).json({ error: "Erro ao buscar chat ativo" });
  }
});

router.get("/chats/history", authMiddleware, async (req: Request, res: Response) => {
  try {
    const chats = await ChatService.getUserChatHistory(req.user!.id);
    res.json({ success: true, chats });
  } catch (error: any) {
    console.error("Get chat history error:", error);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

router.get("/chats/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const chat = await ChatService.getChatById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat não encontrado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    if (chat.userId !== req.user!.id && !user?.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    res.json({ success: true, chat });
  } catch (error: any) {
    console.error("Get chat error:", error);
    res.status(500).json({ error: "Erro ao buscar chat" });
  }
});

router.get("/chats/:id/messages", authMiddleware, async (req: Request, res: Response) => {
  try {
    const chat = await ChatService.getChatById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat não encontrado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    if (chat.userId !== req.user!.id && !user?.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const messages = await ChatService.getChatMessages(req.params.id);
    res.json({ success: true, messages });
  } catch (error: any) {
    console.error("Get chat messages error:", error);
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});

router.post("/chats/message", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = sendChatMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const chat = await ChatService.getChatById(validation.data.chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat não encontrado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    const senderType = user?.isAdmin && chat.assignedAdminId === req.user!.id ? "ADMIN" : "USER";

    if (senderType === "USER" && chat.userId !== req.user!.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const result = await ChatService.sendMessage(req.user!.id, senderType, validation.data);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: result.message, triageResponse: result.triageResponse });
  } catch (error: any) {
    console.error("Send message error:", error);
    res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
});

router.post("/chats/:id/read", authMiddleware, async (req: Request, res: Response) => {
  try {
    const chat = await ChatService.getChatById(req.params.id);
    if (!chat) {
      return res.status(404).json({ error: "Chat não encontrado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    const isAdmin = !!(user?.isAdmin && chat.assignedAdminId === req.user!.id);

    const result = await ChatService.markMessagesAsRead(req.params.id, req.user!.id, isAdmin);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error("Mark read error:", error);
    res.status(500).json({ error: "Erro ao marcar mensagens" });
  }
});

router.post("/chats/transfer", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = transferChatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await ChatService.transferChat(req.user!.id, validation.data);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, chat: result.chat });
  } catch (error: any) {
    console.error("Transfer chat error:", error);
    res.status(500).json({ error: "Erro ao transferir chat" });
  }
});

router.post("/chats/close", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = closeChatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const chat = await ChatService.getChatById(validation.data.chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat não encontrado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    const isAdmin = !!(user?.isAdmin && (chat.assignedAdminId === req.user!.id || !chat.assignedAdminId));

    if (!isAdmin && chat.userId !== req.user!.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const result = await ChatService.closeChat(req.user!.id, validation.data, isAdmin);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, chat: result.chat });
  } catch (error: any) {
    console.error("Close chat error:", error);
    res.status(500).json({ error: "Erro ao fechar chat" });
  }
});

router.post("/chats/rate", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = rateChatSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await ChatService.rateChat(req.user!.id, validation.data);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, chat: result.chat });
  } catch (error: any) {
    console.error("Rate chat error:", error);
    res.status(500).json({ error: "Erro ao avaliar chat" });
  }
});

router.post("/chats/:id/take", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.body;
    const result = await ChatService.takeChat(req.user!.id, req.params.id, departmentId);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, chat: result.chat });
  } catch (error: any) {
    console.error("Take chat error:", error);
    res.status(500).json({ error: "Erro ao pegar chat" });
  }
});

router.get("/admin/chats/waiting", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId as string | undefined;
    const chats = await ChatService.getWaitingChats(departmentId);
    res.json({ success: true, chats });
  } catch (error: any) {
    console.error("Get waiting chats error:", error);
    res.status(500).json({ error: "Erro ao buscar chats na fila" });
  }
});

router.get("/admin/chats/active", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const chats = await ChatService.getAdminActiveChats(req.user!.id);
    res.json({ success: true, chats });
  } catch (error: any) {
    console.error("Get admin active chats error:", error);
    res.status(500).json({ error: "Erro ao buscar chats ativos" });
  }
});

router.get("/admin/chats/stats", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const stats = await ChatService.getChatStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error("Get chat stats error:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

router.post("/tickets", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = createSupportTicketSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await TicketService.createTicket(req.user!.id, validation.data);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ success: true, ticket: result.ticket });
  } catch (error: any) {
    console.error("Create ticket error:", error);
    res.status(500).json({ error: "Erro ao criar ticket" });
  }
});

router.get("/tickets", authMiddleware, async (req: Request, res: Response) => {
  try {
    const tickets = await TicketService.getUserTickets(req.user!.id);
    res.json({ success: true, tickets });
  } catch (error: any) {
    console.error("Get tickets error:", error);
    res.status(500).json({ error: "Erro ao buscar tickets" });
  }
});

router.get("/tickets/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const ticket = await TicketService.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket não encontrado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    if (ticket.userId !== req.user!.id && !user?.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    res.json({ success: true, ticket });
  } catch (error: any) {
    console.error("Get ticket error:", error);
    res.status(500).json({ error: "Erro ao buscar ticket" });
  }
});

router.get("/tickets/:id/messages", authMiddleware, async (req: Request, res: Response) => {
  try {
    const ticket = await TicketService.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket não encontrado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    const includeInternal = user?.isAdmin || false;

    if (ticket.userId !== req.user!.id && !user?.isAdmin) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const messages = await TicketService.getTicketMessages(req.params.id, includeInternal);
    res.json({ success: true, messages });
  } catch (error: any) {
    console.error("Get ticket messages error:", error);
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});

router.post("/tickets/reply", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = replyToTicketSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const ticket = await TicketService.getTicketById(validation.data.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket não encontrado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    const senderType = user?.isAdmin ? "ADMIN" : "USER";

    if (senderType === "USER" && ticket.userId !== req.user!.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const result = await TicketService.replyToTicket(req.user!.id, senderType, validation.data);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, message: result.message });
  } catch (error: any) {
    console.error("Reply ticket error:", error);
    res.status(500).json({ error: "Erro ao responder ticket" });
  }
});

router.post("/tickets/escalate", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = escalateTicketSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await TicketService.escalateTicket(req.user!.id, validation.data);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, ticket: result.ticket });
  } catch (error: any) {
    console.error("Escalate ticket error:", error);
    res.status(500).json({ error: "Erro ao escalonar ticket" });
  }
});

router.post("/tickets/close", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = closeTicketSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const ticket = await TicketService.getTicketById(validation.data.ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket não encontrado" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id));
    const isAdmin = user?.isAdmin || false;

    if (!isAdmin && ticket.userId !== req.user!.id) {
      return res.status(403).json({ error: "Acesso negado" });
    }

    const result = await TicketService.closeTicket(req.user!.id, validation.data, isAdmin);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, ticket: result.ticket });
  } catch (error: any) {
    console.error("Close ticket error:", error);
    res.status(500).json({ error: "Erro ao fechar ticket" });
  }
});

router.post("/tickets/rate", authMiddleware, async (req: Request, res: Response) => {
  try {
    const validation = rateTicketSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await TicketService.rateTicket(req.user!.id, validation.data);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, ticket: result.ticket });
  } catch (error: any) {
    console.error("Rate ticket error:", error);
    res.status(500).json({ error: "Erro ao avaliar ticket" });
  }
});

router.post("/tickets/:id/assign", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const { adminId } = req.body;
    const result = await TicketService.assignTicket(req.params.id, adminId || req.user!.id, req.user!.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, ticket: result.ticket });
  } catch (error: any) {
    console.error("Assign ticket error:", error);
    res.status(500).json({ error: "Erro ao atribuir ticket" });
  }
});

router.get("/admin/tickets/open", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const tickets = await TicketService.getOpenTickets();
    res.json({ success: true, tickets });
  } catch (error: any) {
    console.error("Get open tickets error:", error);
    res.status(500).json({ error: "Erro ao buscar tickets" });
  }
});

router.get("/admin/tickets", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    let status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;
    const departmentId = req.query.departmentId as string | undefined;
    const slaBreached = req.query.slaBreached === "true";
    
    if (slaBreached && !status) {
      status = "open";
    }
    
    const tickets = await TicketService.getAllTickets({ status, priority, departmentId, slaBreached });
    res.json({ success: true, tickets });
  } catch (error: any) {
    console.error("Get all tickets error:", error);
    res.status(500).json({ error: "Erro ao buscar tickets" });
  }
});

router.get("/admin/tickets/sla-breached", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const tickets = await TicketService.getAllTickets({ slaBreached: true, status: "open" });
    res.json({ success: true, tickets });
  } catch (error: any) {
    console.error("Get breached tickets error:", error);
    res.status(500).json({ error: "Erro ao buscar tickets" });
  }
});

router.get("/admin/tickets/:id", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const ticket = await TicketService.getTicketById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket não encontrado" });
    }
    
    let user = null;
    if (ticket.userId) {
      const [userResult] = await db
        .select({ id: users.id, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, ticket.userId));
      user = userResult || null;
    }
    
    let department = null;
    if (ticket.departmentId) {
      department = await DepartmentService.getDepartmentById(ticket.departmentId);
    }
    
    res.json({ 
      success: true, 
      ticket: { 
        ...ticket, 
        user: user || { id: null, username: "Usuário Desconhecido", email: null },
        department: department || { id: null, name: "Sem Departamento" }
      } 
    });
  } catch (error: any) {
    console.error("Get admin ticket error:", error);
    res.status(500).json({ error: "Erro ao buscar ticket" });
  }
});

router.get("/admin/tickets/:id/messages", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const messages = await TicketService.getTicketMessages(req.params.id, true);
    res.json({ success: true, messages });
  } catch (error: any) {
    console.error("Get admin ticket messages error:", error);
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});

router.get("/admin/tickets/stats", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const stats = await TicketService.getTicketStats();
    res.json({ success: true, stats });
  } catch (error: any) {
    console.error("Get ticket stats error:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
});

router.get("/admin/tickets/department/:departmentId", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const tickets = await TicketService.getDepartmentTickets(req.params.departmentId, status);
    res.json({ success: true, tickets });
  } catch (error: any) {
    console.error("Get department tickets error:", error);
    res.status(500).json({ error: "Erro ao buscar tickets" });
  }
});

router.post("/sla-rules", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = createSlaRuleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await DepartmentService.createSlaRule(validation.data, req.user!.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ success: true, slaRule: result.slaRule });
  } catch (error: any) {
    console.error("Create SLA rule error:", error);
    res.status(500).json({ error: "Erro ao criar regra SLA" });
  }
});

router.get("/sla-rules", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId as string | undefined;
    const rules = await DepartmentService.getSlaRules(departmentId);
    res.json({ success: true, rules });
  } catch (error: any) {
    console.error("Get SLA rules error:", error);
    res.status(500).json({ error: "Erro ao buscar regras SLA" });
  }
});

router.post("/triage-rules", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = createTriageRuleSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await DepartmentService.createTriageRule(validation.data, req.user!.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ success: true, triageRule: result.triageRule });
  } catch (error: any) {
    console.error("Create triage rule error:", error);
    res.status(500).json({ error: "Erro ao criar regra de triagem" });
  }
});

router.get("/triage-rules", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly !== "false";
    const rules = await DepartmentService.getTriageRules(activeOnly);
    res.json({ success: true, rules });
  } catch (error: any) {
    console.error("Get triage rules error:", error);
    res.status(500).json({ error: "Erro ao buscar regras de triagem" });
  }
});

router.post("/canned-responses", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const validation = createCannedResponseSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors[0]?.message });
    }

    const result = await DepartmentService.createCannedResponse(validation.data, req.user!.id);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({ success: true, cannedResponse: result.cannedResponse });
  } catch (error: any) {
    console.error("Create canned response error:", error);
    res.status(500).json({ error: "Erro ao criar resposta pré-definida" });
  }
});

router.get("/canned-responses", authMiddleware, adminCheck, async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId as string | undefined;
    const responses = await DepartmentService.getCannedResponses(departmentId);
    res.json({ success: true, responses });
  } catch (error: any) {
    console.error("Get canned responses error:", error);
    res.status(500).json({ error: "Erro ao buscar respostas" });
  }
});

export default router;
