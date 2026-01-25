import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLocation, Link, useRoute } from "wouter";
import {
  useTicket,
  useTicketMessages,
  useReplyToTicket,
  useCloseTicket,
  useRateTicket,
} from "@/hooks/useSupport";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Send,
  Loader2,
  User,
  Headphones,
  Bot,
  Clock,
  AlertTriangle,
  CheckCircle,
  Star,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: "Aberto", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: Clock },
  WAITING_USER: { label: "Aguardando Resposta", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", icon: Clock },
  WAITING_INTERNAL: { label: "Em Análise", color: "bg-purple-500/10 text-purple-500 border-purple-500/30", icon: Clock },
  ESCALATED: { label: "Escalonado", color: "bg-orange-500/10 text-orange-500 border-orange-500/30", icon: AlertTriangle },
  RESOLVED: { label: "Resolvido", color: "bg-green-500/10 text-green-500 border-green-500/30", icon: CheckCircle },
  CLOSED: { label: "Fechado", color: "bg-gray-500/10 text-gray-500 border-gray-500/30", icon: XCircle },
};

export default function TicketDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/support/tickets/:id");
  const ticketId = params?.id || "";
  const [message, setMessage] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const { data: ticket, isLoading: loadingTicket } = useTicket(ticketId);
  const { data: messages = [], isLoading: loadingMessages } = useTicketMessages(ticketId);
  const replyToTicket = useReplyToTicket();
  const closeTicket = useCloseTicket();
  const rateTicket = useRateTicket();

  const handleReply = async () => {
    if (!message.trim() || !ticket) return;
    try {
      await replyToTicket.mutateAsync({
        ticketId: ticket.id,
        message: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.error("Error replying:", error);
    }
  };

  const handleClose = async () => {
    if (!ticket) return;
    try {
      await closeTicket.mutateAsync({ ticketId: ticket.id });
    } catch (error) {
      console.error("Error closing:", error);
    }
  };

  const handleRate = async () => {
    if (!ticket || rating === 0) return;
    try {
      await rateTicket.mutateAsync({
        ticketId: ticket.id,
        rating,
        feedback: feedback.trim() || undefined,
      });
      setShowRating(false);
    } catch (error) {
      console.error("Error rating:", error);
    }
  };

  const status = ticket ? statusConfig[ticket.status] || statusConfig.OPEN : statusConfig.OPEN;
  const StatusIcon = status.icon;

  if (loadingTicket) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!ticket) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-bold text-white mb-2">Ticket não encontrado</h2>
          <Link href="/support/tickets">
            <Button variant="outline">Voltar para Tickets</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/support/tickets">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white" data-testid="text-ticket-number">
              {ticket.ticketNumber}
            </h1>
            <p className="text-gray-400 text-sm">{ticket.subject}</p>
          </div>
          <Badge variant="outline" className={status.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-400 uppercase">Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-bold text-white">{ticket.priority}</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-400 uppercase">Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-bold text-white">{ticket.category || "Geral"}</span>
            </CardContent>
          </Card>
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-400 uppercase">Criado em</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="font-bold text-white">
                {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
              </span>
            </CardContent>
          </Card>
          <Card className="bg-card border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-400 uppercase">SLA</CardTitle>
            </CardHeader>
            <CardContent>
              {ticket.slaBreached ? (
                <span className="font-bold text-red-500">Violado</span>
              ) : ticket.slaDeadline ? (
                <span className="font-bold text-green-500">
                  {new Date(ticket.slaDeadline).toLocaleString("pt-BR")}
                </span>
              ) : (
                <span className="text-gray-500">-</span>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Mensagens</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
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
                    msg.senderType === "USER" ? "justify-end" : "justify-start"
                  )}
                  data-testid={`message-${msg.id}`}
                >
                  {msg.senderType !== "USER" && (
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        msg.senderType === "ADMIN"
                          ? "bg-green-500/20 text-green-500"
                          : "bg-blue-500/20 text-blue-500"
                      )}
                    >
                      {msg.senderType === "ADMIN" ? (
                        <Headphones className="w-5 h-5" />
                      ) : (
                        <Bot className="w-5 h-5" />
                      )}
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] px-4 py-3 rounded-2xl",
                      msg.senderType === "USER"
                        ? "bg-primary text-white rounded-br-md"
                        : "bg-secondary border border-white/5 rounded-bl-md"
                    )}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <p
                      className={cn(
                        "text-xs mt-2",
                        msg.senderType === "USER" ? "text-white/60" : "text-gray-500"
                      )}
                    >
                      {new Date(msg.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {msg.senderType === "USER" && (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {ticket.status !== "CLOSED" && ticket.status !== "RESOLVED" ? (
          <Card className="bg-card border-white/5">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Digite sua resposta..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 bg-secondary border-white/10 min-h-[100px]"
                  data-testid="input-ticket-reply"
                />
              </div>
              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={closeTicket.isPending}
                  className="text-gray-400 hover:text-red-400"
                  data-testid="button-close-ticket"
                >
                  Fechar Ticket
                </Button>
                <Button
                  onClick={handleReply}
                  disabled={!message.trim() || replyToTicket.isPending}
                  className="bg-primary hover:bg-primary/80"
                  data-testid="button-send-reply"
                >
                  {replyToTicket.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !ticket.userRating ? (
          <Card className="bg-card border-white/5">
            <CardContent className="pt-6 text-center space-y-4">
              <h3 className="text-lg font-bold text-white">Como foi o atendimento?</h3>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                    data-testid={`button-rate-${star}`}
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors",
                        star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-500"
                      )}
                    />
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Deixe um comentário (opcional)"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="bg-secondary border-white/10"
                rows={3}
                data-testid="input-rating-feedback"
              />
              <Button
                onClick={handleRate}
                disabled={rating === 0 || rateTicket.isPending}
                className="bg-primary hover:bg-primary/80"
                data-testid="button-submit-rating"
              >
                {rateTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Avaliação"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-white/5">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "w-6 h-6",
                      star <= parseInt(ticket.userRating || "0")
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-500"
                    )}
                  />
                ))}
              </div>
              <p className="text-gray-400 text-sm">Você avaliou este atendimento</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
