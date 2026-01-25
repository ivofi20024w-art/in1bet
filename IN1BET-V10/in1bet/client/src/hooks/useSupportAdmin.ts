import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { SupportChat, SupportChatMessage, SupportTicket, SupportTicketMessage, SupportDepartment } from "./useSupport";

export interface SupportStats {
  chatsInQueue: number;
  activeChats: number;
  openTickets: number;
  slaBreachedTickets: number;
  avgRating: number;
  resolvedToday: number;
}

export interface AdminChat extends SupportChat {
  user?: { id: string; username: string; email: string };
}

export interface AdminTicket extends SupportTicket {
  user?: { id: string; username: string; email: string };
  department?: { id: string; name: string };
}

export interface CannedResponse {
  id: string;
  departmentId: string | null;
  title: string;
  content: string;
  category: string | null;
  usageCount: number;
  isActive: boolean;
}

export interface SLARule {
  id: string;
  departmentId: string | null;
  priority: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationLevel: number;
  isActive: boolean;
}

export function useSupportStats() {
  return useQuery({
    queryKey: ["admin", "support", "stats"],
    queryFn: async () => {
      const [chatRes, ticketRes] = await Promise.all([
        apiRequest("GET", "/api/support/admin/chats/stats"),
        apiRequest("GET", "/api/support/admin/tickets/stats"),
      ]);
      const chatData = await chatRes.json();
      const ticketData = await ticketRes.json();
      return {
        chatsInQueue: chatData.stats?.waiting || 0,
        activeChats: chatData.stats?.active || 0,
        openTickets: ticketData.stats?.open || 0,
        slaBreachedTickets: ticketData.stats?.slaBreached || 0,
        avgRating: ticketData.stats?.avgRating || 0,
        resolvedToday: ticketData.stats?.resolvedToday || 0,
      } as SupportStats;
    },
    refetchInterval: 30000,
  });
}

export function useAdminChatsQueue() {
  return useQuery({
    queryKey: ["admin", "support", "chats", "queue"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/support/admin/chats/waiting");
      const data = await res.json();
      return (data.chats || []) as AdminChat[];
    },
    refetchInterval: 5000,
  });
}

export function useAdminMyChats() {
  return useQuery({
    queryKey: ["admin", "support", "chats", "mine"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/support/admin/chats/active");
      const data = await res.json();
      return (data.chats || []) as AdminChat[];
    },
    refetchInterval: 5000,
  });
}

export function useAdminChatMessages(chatId: string | null) {
  return useQuery({
    queryKey: ["admin", "support", "chats", chatId, "messages"],
    queryFn: async () => {
      if (!chatId) return [];
      const res = await apiRequest("GET", `/api/support/chats/${chatId}/messages`);
      const data = await res.json();
      return (data.messages || []) as SupportChatMessage[];
    },
    enabled: !!chatId,
    refetchInterval: 3000,
  });
}

export function useAdminAssignChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chatId: string) => {
      const res = await apiRequest("POST", `/api/support/chats/${chatId}/take`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "chats"] });
    },
  });
}

export function useAdminSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { chatId: string; message: string }) => {
      const res = await apiRequest("POST", "/api/support/chats/message", { chatId: data.chatId, message: data.message });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "chats", variables.chatId, "messages"] });
    },
  });
}

export function useAdminCloseChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { chatId: string; reason?: string }) => {
      const res = await apiRequest("POST", "/api/support/chats/close", { chatId: data.chatId, reason: data.reason });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "chats"] });
    },
  });
}

export function useAdminTransferChat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { chatId: string; departmentId?: string; adminId?: string; reason?: string }) => {
      const res = await apiRequest("POST", "/api/support/chats/transfer", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "chats"] });
    },
  });
}

export function useAdminConvertChatToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { chatId: string; subject: string }) => {
      const res = await apiRequest("POST", "/api/support/tickets", { 
        subject: data.subject, 
        message: `Ticket criado a partir do chat ${data.chatId}`,
        chatId: data.chatId 
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support"] });
    },
  });
}

export function useAdminTickets(filters?: { status?: string; departmentId?: string; priority?: string; slaBreached?: boolean }) {
  return useQuery({
    queryKey: ["admin", "support", "tickets", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters?.status === "sla-breached" || filters?.slaBreached) {
        params.set("slaBreached", "true");
        params.set("status", "open");
      } else if (filters?.status && filters.status !== "all") {
        params.set("status", filters.status);
      }
      
      if (filters?.priority && filters.priority !== "all") {
        params.set("priority", filters.priority);
      }
      if (filters?.departmentId && filters.departmentId !== "all") {
        params.set("departmentId", filters.departmentId);
      }
      
      const queryString = params.toString();
      const endpoint = queryString 
        ? `/api/support/admin/tickets?${queryString}` 
        : "/api/support/admin/tickets";
      
      const res = await apiRequest("GET", endpoint);
      const data = await res.json();
      return (data.tickets || []) as AdminTicket[];
    },
    refetchInterval: 30000,
  });
}

export function useAdminTicket(ticketId: string | null) {
  return useQuery({
    queryKey: ["admin", "support", "tickets", ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const res = await apiRequest("GET", `/api/support/admin/tickets/${ticketId}`);
      const data = await res.json();
      return data.ticket as AdminTicket;
    },
    enabled: !!ticketId,
  });
}

export function useAdminTicketMessages(ticketId: string | null) {
  return useQuery({
    queryKey: ["admin", "support", "tickets", ticketId, "messages"],
    queryFn: async () => {
      if (!ticketId) return [];
      const res = await apiRequest("GET", `/api/support/admin/tickets/${ticketId}/messages`);
      const data = await res.json();
      return (data.messages || []) as SupportTicketMessage[];
    },
    enabled: !!ticketId,
    refetchInterval: 10000,
  });
}

export function useAdminAssignTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ticketId: string; adminId?: string }) => {
      const res = await apiRequest("POST", `/api/support/tickets/${data.ticketId}/assign`, { adminId: data.adminId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
    },
  });
}

export function useAdminReplyToTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ticketId: string; message: string; isInternal?: boolean }) => {
      const res = await apiRequest("POST", "/api/support/tickets/reply", {
        ticketId: data.ticketId,
        message: data.message,
        isInternal: data.isInternal,
      });
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets", variables.ticketId] });
    },
  });
}

export function useAdminEscalateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ticketId: string; reason: string; level?: number }) => {
      const res = await apiRequest("POST", "/api/support/tickets/escalate", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
    },
  });
}

export function useAdminResolveTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ticketId: string; resolution: string }) => {
      const res = await apiRequest("POST", "/api/support/tickets/close", { 
        ticketId: data.ticketId,
        resolution: data.resolution,
        status: "RESOLVED"
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "tickets"] });
    },
  });
}

export function useAdminDepartments() {
  return useQuery({
    queryKey: ["admin", "support", "departments"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/support/departments?includeInactive=true");
      const data = await res.json();
      return (data.departments || []) as SupportDepartment[];
    },
  });
}

export function useAdminCreateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/support/departments", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "departments"] });
    },
  });
}

export function useAdminUpdateDepartment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { departmentId: string; name?: string; description?: string; isActive?: boolean }) => {
      if (data.isActive !== undefined) {
        const res = await apiRequest("POST", `/api/support/departments/${data.departmentId}/toggle`);
        return res.json();
      }
      const res = await apiRequest("PUT", `/api/support/departments/${data.departmentId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "departments"] });
    },
  });
}

export function useAdminCannedResponses(departmentId?: string) {
  return useQuery({
    queryKey: ["admin", "support", "canned-responses", departmentId],
    queryFn: async () => {
      const params = departmentId ? `?departmentId=${departmentId}` : "";
      const res = await apiRequest("GET", `/api/support/canned-responses${params}`);
      const data = await res.json();
      return (data.responses || []) as CannedResponse[];
    },
  });
}

export function useAdminCreateCannedResponse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; content: string; departmentId?: string; category?: string }) => {
      const res = await apiRequest("POST", "/api/support/canned-responses", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "canned-responses"] });
    },
  });
}

export function useAdminSLARules(departmentId?: string) {
  return useQuery({
    queryKey: ["admin", "support", "sla-rules", departmentId],
    queryFn: async () => {
      const params = departmentId ? `?departmentId=${departmentId}` : "";
      const res = await apiRequest("GET", `/api/support/sla-rules${params}`);
      const data = await res.json();
      return (data.rules || []) as SLARule[];
    },
  });
}

export function useAdminCreateSLARule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      priority: string;
      responseTimeMinutes: number;
      resolutionTimeMinutes: number;
      departmentId?: string;
      escalationLevel?: number;
    }) => {
      const res = await apiRequest("POST", "/api/support/sla-rules", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support", "sla-rules"] });
    },
  });
}
