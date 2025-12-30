import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Search, Clock, CheckCircle2, AlertCircle, MessageSquare, Loader2, AlertTriangle, XCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useUserTickets } from "@/hooks/useSupport";
import { cn } from "@/lib/utils";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  OPEN: { label: "Aberto", color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: Clock },
  WAITING_USER: { label: "Aguardando Resposta", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: MessageSquare },
  WAITING_INTERNAL: { label: "Em Análise", color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Clock },
  ESCALATED: { label: "Escalonado", color: "bg-orange-500/10 text-orange-500 border-orange-500/20", icon: AlertTriangle },
  RESOLVED: { label: "Resolvido", color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2 },
  CLOSED: { label: "Fechado", color: "bg-gray-500/10 text-gray-500 border-gray-500/20", icon: XCircle },
};

export default function TicketHistory() {
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: tickets = [], isLoading } = useUserTickets();

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticketNumber.toLowerCase().includes(search.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(search.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "open") return matchesSearch && (ticket.status === "OPEN" || ticket.status === "WAITING_USER" || ticket.status === "WAITING_INTERNAL");
    if (filter === "resolved") return matchesSearch && ticket.status === "RESOLVED";
    if (filter === "closed") return matchesSearch && ticket.status === "CLOSED";
    return matchesSearch;
  });

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/support")}
              className="pl-0 hover:bg-transparent hover:text-primary mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Ajuda
            </Button>
            <h1 className="text-3xl font-heading font-bold text-white">Meus Tickets</h1>
            <p className="text-gray-400 text-sm mt-1">Gerencie suas solicitações de suporte</p>
          </div>

          <Link href="/support/tickets/new">
            <Button
              className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-6 shadow-lg shadow-primary/20"
              data-testid="button-new-ticket"
            >
              <Plus className="w-5 h-5 mr-2" />
              Abrir Novo Ticket
            </Button>
          </Link>
        </div>

        <div className="bg-card border border-white/5 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tickets por ID ou assunto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-secondary/20 border-white/10 focus:bg-secondary/40 transition-colors"
              data-testid="input-search-tickets"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Button
              variant="outline"
              onClick={() => setFilter("all")}
              className={cn(
                "border-white/10",
                filter === "all" ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-white/5 text-gray-400"
              )}
            >
              Todos
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilter("open")}
              className={cn(
                "border-white/10",
                filter === "open" ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-white/5 text-gray-400"
              )}
            >
              Abertos
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilter("resolved")}
              className={cn(
                "border-white/10",
                filter === "resolved" ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-white/5 text-gray-400"
              )}
            >
              Resolvidos
            </Button>
            <Button
              variant="outline"
              onClick={() => setFilter("closed")}
              className={cn(
                "border-white/10",
                filter === "closed" ? "bg-primary/10 text-primary border-primary/20" : "hover:bg-white/5 text-gray-400"
              )}
            >
              Fechados
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredTickets.length === 0 ? (
            <Card className="border-white/5 bg-card p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Nenhum ticket encontrado</h3>
              <p className="text-gray-400 mb-6">
                {search ? "Nenhum ticket corresponde à sua busca." : "Você ainda não abriu nenhum ticket."}
              </p>
              <Link href="/support/tickets/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Abrir Novo Ticket
                </Button>
              </Link>
            </Card>
          ) : (
            filteredTickets.map((ticket) => {
              const status = statusConfig[ticket.status] || statusConfig.OPEN;
              const StatusIcon = status.icon;

              return (
                <Card
                  key={ticket.id}
                  className="group border-white/5 bg-card hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
                  onClick={() => setLocation(`/support/tickets/${ticket.id}`)}
                  data-testid={`ticket-card-${ticket.id}`}
                >
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                          status.color.split(" ")[0]
                        )}
                      >
                        <StatusIcon className={cn("w-6 h-6", status.color.split(" ")[1])} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-500 font-mono">{ticket.ticketNumber}</span>
                          <Badge variant="outline" className={status.color}>
                            {status.label}
                          </Badge>
                          {ticket.slaBreached && (
                            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                              SLA Violado
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">
                          {ticket.subject}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {ticket.category || "Geral"} • Prioridade: {ticket.priority}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                      <p className="text-xs text-gray-600">
                        {new Date(ticket.createdAt).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}
