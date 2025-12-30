import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Ticket,
  Search,
  Loader2,
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Send,
  ArrowUp,
  User,
  Headphones,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import {
  useAdminTickets,
  useAdminTicket,
  useAdminTicketMessages,
  useAdminAssignTicket,
  useAdminReplyToTicket,
  useAdminEscalateTicket,
  useAdminResolveTicket,
  useAdminDepartments,
  type AdminTicket,
} from "@/hooks/useSupportAdmin";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: "Aberto", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: Clock },
  WAITING_USER: { label: "Aguardando Usuário", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", icon: Clock },
  WAITING_INTERNAL: { label: "Em Análise", color: "bg-purple-500/10 text-purple-500 border-purple-500/30", icon: Clock },
  ESCALATED: { label: "Escalonado", color: "bg-orange-500/10 text-orange-500 border-orange-500/30", icon: AlertTriangle },
  RESOLVED: { label: "Resolvido", color: "bg-green-500/10 text-green-500 border-green-500/30", icon: CheckCircle },
  CLOSED: { label: "Fechado", color: "bg-gray-500/10 text-gray-500 border-gray-500/30", icon: XCircle },
};

export default function AdminSupportTickets() {
  const [, setLocation] = useLocation();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [resolution, setResolution] = useState("");

  const { data: tickets = [], isLoading: loadingTickets, refetch } = useAdminTickets({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
  });
  const { data: selectedTicket, isLoading: loadingTicket } = useAdminTicket(selectedTicketId);
  const { data: messages = [], isLoading: loadingMessages } = useAdminTicketMessages(selectedTicketId);
  const { data: departments = [] } = useAdminDepartments();

  const assignTicket = useAdminAssignTicket();
  const replyToTicket = useAdminReplyToTicket();
  const escalateTicket = useAdminEscalateTicket();
  const resolveTicket = useAdminResolveTicket();

  const filteredTickets = tickets.filter((ticket) =>
    ticket.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
    ticket.subject.toLowerCase().includes(search.toLowerCase()) ||
    ticket.user?.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedTicketId) return;
    try {
      await assignTicket.mutateAsync({ ticketId: selectedTicketId });
      toast.success("Ticket atribuído a você");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atribuir ticket");
    }
  };

  const handleReply = async () => {
    if (!message.trim() || !selectedTicketId) return;
    try {
      await replyToTicket.mutateAsync({
        ticketId: selectedTicketId,
        message: message.trim(),
        isInternal,
      });
      setMessage("");
      toast.success(isInternal ? "Nota interna adicionada" : "Resposta enviada");
    } catch (error: any) {
      toast.error(error.message || "Erro ao responder");
    }
  };

  const handleEscalate = async () => {
    if (!selectedTicketId || !escalateReason.trim()) return;
    try {
      await escalateTicket.mutateAsync({
        ticketId: selectedTicketId,
        reason: escalateReason.trim(),
      });
      setShowEscalateDialog(false);
      setEscalateReason("");
      toast.success("Ticket escalonado");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao escalonar ticket");
    }
  };

  const handleResolve = async () => {
    if (!selectedTicketId || !resolution.trim()) return;
    try {
      await resolveTicket.mutateAsync({
        ticketId: selectedTicketId,
        resolution: resolution.trim(),
      });
      setShowResolveDialog(false);
      setResolution("");
      toast.success("Ticket resolvido");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao resolver ticket");
    }
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-120px)]">
        <div className="w-96 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/support")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-secondary/50 border-white/10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="flex-1 bg-secondary/50 border-white/10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="OPEN">Abertos</SelectItem>
                  <SelectItem value="WAITING_USER">Aguardando</SelectItem>
                  <SelectItem value="ESCALATED">Escalonados</SelectItem>
                  <SelectItem value="RESOLVED">Resolvidos</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="flex-1 bg-secondary/50 border-white/10">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="URGENT">Urgente</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="LOW">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingTickets ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum ticket encontrado</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {filteredTickets.map((ticket) => {
                  const status = statusConfig[ticket.status] || statusConfig.OPEN;
                  const StatusIcon = status.icon;

                  return (
                    <div
                      key={ticket.id}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors",
                        selectedTicketId === ticket.id
                          ? "bg-primary/20 border border-primary/30"
                          : "bg-secondary/30 hover:bg-secondary/50"
                      )}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      data-testid={`ticket-item-${ticket.id}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-mono">{ticket.ticketNumber}</span>
                          {ticket.slaBreached && (
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <Badge variant="outline" className={cn("text-xs", status.color)}>
                          {status.label}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm text-white truncate mb-1">{ticket.subject}</h4>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{ticket.user?.username || "Usuário"}</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedTicketId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Ticket className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium text-white mb-2">Nenhum ticket selecionado</h3>
                <p className="text-sm">Selecione um ticket da lista para visualizar</p>
              </div>
            </div>
          ) : loadingTicket ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : !selectedTicket ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-400">Ticket não encontrado</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500 font-mono">{selectedTicket.ticketNumber}</span>
                      <Badge variant="outline" className={statusConfig[selectedTicket.status]?.color}>
                        {statusConfig[selectedTicket.status]?.label}
                      </Badge>
                      {selectedTicket.slaBreached && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
                          SLA Violado
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {selectedTicket.user?.username} ({selectedTicket.user?.email})
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!selectedTicket.assignedAdminId && (
                      <Button
                        size="sm"
                        onClick={handleAssign}
                        disabled={assignTicket.isPending}
                        className="bg-primary"
                      >
                        Assumir
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowEscalateDialog(true)}
                      className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10"
                    >
                      <ArrowUp className="w-4 h-4 mr-1" />
                      Escalonar
                    </Button>
                    {selectedTicket.status !== "RESOLVED" && selectedTicket.status !== "CLOSED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowResolveDialog(true)}
                        className="border-green-500/30 text-green-500 hover:bg-green-500/10"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-400">
                    Prioridade: <span className="text-white">{selectedTicket.priority}</span>
                  </span>
                  <span className="text-gray-400">
                    Categoria: <span className="text-white">{selectedTicket.category || "Geral"}</span>
                  </span>
                  <span className="text-gray-400">
                    Departamento: <span className="text-white">{selectedTicket.department?.name || "Não definido"}</span>
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Nenhuma mensagem</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3",
                        msg.senderType === "ADMIN" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.senderType !== "ADMIN" && (
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[70%] px-4 py-3 rounded-2xl",
                          msg.senderType === "ADMIN"
                            ? msg.isInternal
                              ? "bg-yellow-500/10 border border-yellow-500/30 rounded-br-md"
                              : "bg-green-600 text-white rounded-br-md"
                            : "bg-card border border-white/10 rounded-bl-md"
                        )}
                      >
                        {msg.isInternal && (
                          <div className="flex items-center gap-1 text-xs text-yellow-500 mb-1">
                            <EyeOff className="w-3 h-3" />
                            Nota interna
                          </div>
                        )}
                        <p className="text-sm">{msg.message}</p>
                        <p className={cn("text-xs mt-2", msg.senderType === "ADMIN" && !msg.isInternal ? "text-white/60" : "text-gray-500")}>
                          {new Date(msg.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      {msg.senderType === "ADMIN" && (
                        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Headphones className="w-5 h-5 text-green-500" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {selectedTicket.status !== "CLOSED" && selectedTicket.status !== "RESOLVED" && (
                <div className="p-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Button
                      variant={isInternal ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsInternal(!isInternal)}
                      className={isInternal ? "bg-yellow-600 hover:bg-yellow-500" : "border-white/10"}
                    >
                      {isInternal ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                      {isInternal ? "Nota Interna" : "Resposta Pública"}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder={isInternal ? "Adicionar nota interna..." : "Digite sua resposta..."}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 bg-secondary/50 border-white/10 min-h-[80px]"
                      data-testid="input-ticket-reply"
                    />
                    <Button
                      onClick={handleReply}
                      disabled={!message.trim() || replyToTicket.isPending}
                      className={isInternal ? "bg-yellow-600 hover:bg-yellow-500" : "bg-green-600 hover:bg-green-500"}
                      data-testid="button-send-ticket-reply"
                    >
                      {replyToTicket.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escalonar Ticket</DialogTitle>
            <DialogDescription>Informe o motivo do escalonamento</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Motivo do escalonamento..."
            value={escalateReason}
            onChange={(e) => setEscalateReason(e.target.value)}
            className="bg-secondary border-white/10"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEscalate}
              disabled={!escalateReason.trim() || escalateTicket.isPending}
              className="bg-orange-600 hover:bg-orange-500"
            >
              {escalateTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Escalonar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Ticket</DialogTitle>
            <DialogDescription>Descreva a resolução do problema</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Descrição da resolução..."
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
            className="bg-secondary border-white/10"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleResolve}
              disabled={!resolution.trim() || resolveTicket.isPending}
              className="bg-green-600 hover:bg-green-500"
            >
              {resolveTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Resolver"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
