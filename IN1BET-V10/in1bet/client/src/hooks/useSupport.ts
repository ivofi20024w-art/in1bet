import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { httpGet, httpPost } from "@/lib/httpClient";

export interface SupportDepartment {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

export interface SupportChat {
  id: string;
  userId: string;
  departmentId: string | null;
  assignedAdminId: string | null;
  status: "WAITING" | "ACTIVE" | "TRANSFERRED" | "CLOSED";
  priority: string;
  category: string | null;
  queuePosition: string | null;
  triageCompleted: boolean;
  userRating: string | null;
  userFeedback: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface SupportChatMessage {
  id: string;
  chatId: string;
  senderType: "USER" | "ADMIN" | "SYSTEM" | "BOT";
  senderId: string | null;
  message: string;
  attachments: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  departmentId: string | null;
  assignedAdminId: string | null;
  subject: string;
  status: "OPEN" | "WAITING_USER" | "WAITING_INTERNAL" | "ESCALATED" | "RESOLVED" | "CLOSED";
  priority: string;
  category: string | null;
  slaDeadline: string | null;
  slaBreached: boolean;
  userRating: string | null;
  userFeedback: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface SupportTicketMessage {
  id: string;
  ticketId: string;
  senderType: "USER" | "ADMIN" | "SYSTEM";
  senderId: string | null;
  message: string;
  attachments: string | null;
  isInternal: boolean;
  isRead: boolean;
  createdAt: string;
}

export function useDepartments() {
  return useQuery({
    queryKey: ["support", "departments"],
    queryFn: async () => {
      const { data, error } = await httpGet<{ departments: SupportDepartment[] }>("/api/support/departments");
      if (error || !data) throw new Error(error || "Erro ao buscar departamentos");
      return data.departments;
    },
  });
}

export function useActiveChat() {
  return useQuery({
    queryKey: ["support", "chat", "active"],
    queryFn: async () => {
      const { data, error } = await httpGet<{ chat: SupportChat | null }>("/api/support/chats/active");
      if (error || !data) throw new Error(error || "Erro ao buscar chat ativo");
      return data.chat;
    },
    refetchInterval: 5000,
  });
}

export function useChatMessages(chatId: string | null) {
  return useQuery({
    queryKey: ["support", "chat", "messages", chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const { data, error } = await httpGet<{ messages: SupportChatMessage[] }>(`/api/support/chats/${chatId}/messages`);
      if (error || !data) throw new Error(error || "Erro ao buscar mensagens");
      return data.messages;
    },
    enabled: !!chatId,
    refetchInterval: 3000,
  });
}

export function useChatHistory() {
  return useQuery({
    queryKey: ["support", "chat", "history"],
    queryFn: async () => {
      const { data, error } = await httpGet<{ chats: SupportChat[] }>("/api/support/chats/history");
      if (error || !data) throw new Error(error || "Erro ao buscar histórico");
      return data.chats;
    },
  });
}

export function useStartChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { departmentId?: string; category?: string; initialMessage: string }) => {
      const { data, error } = await httpPost<{ chat: SupportChat }>("/api/support/chats", payload);
      if (error || !data) throw new Error(error || "Erro ao iniciar chat");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "chat"] });
    },
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { chatId: string; message: string }) => {
      const { data, error } = await httpPost<{ message: SupportChatMessage }>("/api/support/chats/message", payload);
      if (error || !data) throw new Error(error || "Erro ao enviar mensagem");
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support", "chat", "messages", variables.chatId] });
    },
  });
}

export function useCloseChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { chatId: string; reason?: string }) => {
      const { data, error } = await httpPost<{ chat: SupportChat }>("/api/support/chats/close", payload);
      if (error || !data) throw new Error(error || "Erro ao fechar chat");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "chat"] });
    },
  });
}

export function useRateChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { chatId: string; rating: number; feedback?: string }) => {
      const { data, error } = await httpPost<{ chat: SupportChat }>("/api/support/chats/rate", payload);
      if (error || !data) throw new Error(error || "Erro ao avaliar chat");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "chat"] });
    },
  });
}

export function useUserTickets() {
  return useQuery({
    queryKey: ["support", "tickets"],
    queryFn: async () => {
      const { data, error } = await httpGet<{ tickets: SupportTicket[] }>("/api/support/tickets");
      if (error || !data) throw new Error(error || "Erro ao buscar tickets");
      return data.tickets;
    },
  });
}

export function useTicket(ticketId: string | null) {
  return useQuery({
    queryKey: ["support", "tickets", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await httpGet<{ ticket: SupportTicket }>(`/api/support/tickets/${ticketId}`);
      if (error || !data) throw new Error(error || "Erro ao buscar ticket");
      return data.ticket;
    },
    enabled: !!ticketId,
  });
}

export function useTicketMessages(ticketId: string | null) {
  return useQuery({
    queryKey: ["support", "tickets", ticketId, "messages"],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await httpGet<{ messages: SupportTicketMessage[] }>(`/api/support/tickets/${ticketId}/messages`);
      if (error || !data) throw new Error(error || "Erro ao buscar mensagens");
      return data.messages;
    },
    enabled: !!ticketId,
    refetchInterval: 10000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { subject: string; message: string; departmentId?: string; category?: string; priority?: string }) => {
      const { data, error } = await httpPost<{ ticket: SupportTicket }>("/api/support/tickets", payload);
      if (error || !data) throw new Error(error || "Erro ao criar ticket");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
    },
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ticketId: string; message: string }) => {
      const { data, error } = await httpPost<{ message: SupportTicketMessage }>("/api/support/tickets/reply", payload);
      if (error || !data) throw new Error(error || "Erro ao responder ticket");
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets", variables.ticketId] });
    },
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ticketId: string; resolution?: string }) => {
      const { data, error } = await httpPost<{ ticket: SupportTicket }>("/api/support/tickets/close", payload);
      if (error || !data) throw new Error(error || "Erro ao fechar ticket");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
    },
  });
}

export function useRateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { ticketId: string; rating: number; feedback?: string }) => {
      const { data, error } = await httpPost<{ ticket: SupportTicket }>("/api/support/tickets/rate", payload);
      if (error || !data) throw new Error(error || "Erro ao avaliar ticket");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
    },
  });
}
