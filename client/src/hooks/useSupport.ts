import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
      const res = await apiRequest("GET", "/api/support/departments");
      const data = await res.json();
      return data.departments as SupportDepartment[];
    },
  });
}

export function useActiveChat() {
  return useQuery({
    queryKey: ["support", "chat", "active"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/support/chats/active");
      const data = await res.json();
      return data.chat as SupportChat | null;
    },
    refetchInterval: 5000,
  });
}

export function useChatMessages(chatId: string | null) {
  return useQuery({
    queryKey: ["support", "chat", "messages", chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const res = await apiRequest("GET", `/api/support/chats/${chatId}/messages`);
      const data = await res.json();
      return data.messages as SupportChatMessage[];
    },
    enabled: !!chatId,
    refetchInterval: 3000,
  });
}

export function useChatHistory() {
  return useQuery({
    queryKey: ["support", "chat", "history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/support/chats/history");
      const data = await res.json();
      return data.chats as SupportChat[];
    },
  });
}

export function useStartChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { departmentId?: string; category?: string; initialMessage: string }) => {
      const res = await apiRequest("POST", "/api/support/chats", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "chat"] });
    },
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { chatId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/support/chats/message", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support", "chat", "messages", variables.chatId] });
    },
  });
}

export function useCloseChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { chatId: string; reason?: string }) => {
      const res = await apiRequest("POST", "/api/support/chats/close", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "chat"] });
    },
  });
}

export function useRateChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { chatId: string; rating: number; feedback?: string }) => {
      const res = await apiRequest("POST", "/api/support/chats/rate", data);
      return res.json();
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
      const res = await apiRequest("GET", "/api/support/tickets");
      const data = await res.json();
      return data.tickets as SupportTicket[];
    },
  });
}

export function useTicket(ticketId: string | null) {
  return useQuery({
    queryKey: ["support", "tickets", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const res = await apiRequest("GET", `/api/support/tickets/${ticketId}`);
      const data = await res.json();
      return data.ticket as SupportTicket;
    },
    enabled: !!ticketId,
  });
}

export function useTicketMessages(ticketId: string | null) {
  return useQuery({
    queryKey: ["support", "tickets", ticketId, "messages"],
    queryFn: async () => {
      if (!ticketId) return [];
      const res = await apiRequest("GET", `/api/support/tickets/${ticketId}/messages`);
      const data = await res.json();
      return data.messages as SupportTicketMessage[];
    },
    enabled: !!ticketId,
    refetchInterval: 10000,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { subject: string; message: string; departmentId?: string; category?: string; priority?: string }) => {
      const res = await apiRequest("POST", "/api/support/tickets", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
    },
  });
}

export function useReplyToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ticketId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/support/tickets/reply", data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets", variables.ticketId] });
    },
  });
}

export function useCloseTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ticketId: string; resolution?: string }) => {
      const res = await apiRequest("POST", "/api/support/tickets/close", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
    },
  });
}

export function useRateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ticketId: string; rating: number; feedback?: string }) => {
      const res = await apiRequest("POST", "/api/support/tickets/rate", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets"] });
    },
  });
}
