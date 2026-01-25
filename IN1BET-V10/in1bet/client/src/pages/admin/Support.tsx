import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Ticket,
  Clock,
  AlertTriangle,
  Star,
  CheckCircle,
  Users,
  TrendingUp,
  Loader2,
  Headphones,
  ArrowRight,
} from "lucide-react";
import { useSupportStats, useAdminChatsQueue, useAdminTickets } from "@/hooks/useSupportAdmin";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function AdminSupport() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: loadingStats } = useSupportStats();
  const { data: queueChats = [], isLoading: loadingQueue } = useAdminChatsQueue();
  const { data: openTickets = [], isLoading: loadingTickets } = useAdminTickets({ status: "OPEN" });

  const statCards = [
    {
      title: "Chats na Fila",
      value: stats?.chatsInQueue || 0,
      icon: MessageCircle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      trend: queueChats.length > 5 ? "Alto volume" : "Normal",
    },
    {
      title: "Chats Ativos",
      value: stats?.activeChats || 0,
      icon: Headphones,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Tickets Abertos",
      value: stats?.openTickets || 0,
      icon: Ticket,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "SLA Violado",
      value: stats?.slaBreachedTickets || 0,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      alert: (stats?.slaBreachedTickets || 0) > 0,
    },
    {
      title: "Avaliação Média",
      value: stats?.avgRating?.toFixed(1) || "0.0",
      icon: Star,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      suffix: "/5",
    },
    {
      title: "Resolvidos Hoje",
      value: stats?.resolvedToday || 0,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Central de Suporte</h1>
            <p className="text-gray-400 mt-1">Gerenciamento de atendimento ao cliente</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setLocation("/admin/support/chats")}
              className="bg-green-600 hover:bg-green-500"
              data-testid="button-go-chats"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Atender Chats
            </Button>
            <Button
              onClick={() => setLocation("/admin/support/tickets")}
              variant="outline"
              className="border-white/10"
              data-testid="button-go-tickets"
            >
              <Ticket className="w-4 h-4 mr-2" />
              Ver Tickets
            </Button>
          </div>
        </div>

        {loadingStats ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {statCards.map((stat, index) => (
              <Card
                key={index}
                className={cn(
                  "bg-card border-white/5",
                  stat.alert && "border-red-500/50 animate-pulse"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                      <stat.icon className={cn("w-5 h-5", stat.color)} />
                    </div>
                    {stat.trend && (
                      <Badge variant="outline" className="text-xs">
                        {stat.trend}
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {stat.value}
                    {stat.suffix && <span className="text-sm text-gray-400">{stat.suffix}</span>}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{stat.title}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Fila de Chats</CardTitle>
                <CardDescription>Aguardando atendimento</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/admin/support/chats")}
              >
                Ver todos <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingQueue ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : queueChats.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum chat na fila</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queueChats.slice(0, 5).map((chat) => (
                    <div
                      key={chat.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => setLocation("/admin/support/chats")}
                      data-testid={`queue-chat-${chat.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm">
                            {chat.user?.username || "Usuário"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {chat.category || "Geral"} • Posição {chat.queuePosition}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            chat.priority === "HIGH" || chat.priority === "URGENT"
                              ? "bg-red-500/10 text-red-500 border-red-500/30"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                          )}
                        >
                          {chat.priority}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(chat.createdAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Tickets Recentes</CardTitle>
                <CardDescription>Últimos tickets abertos</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/admin/support/tickets")}
              >
                Ver todos <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {loadingTickets ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : openTickets.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Ticket className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum ticket aberto</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {openTickets.slice(0, 5).map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => setLocation(`/admin/support/tickets/${ticket.id}`)}
                      data-testid={`recent-ticket-${ticket.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center",
                            ticket.slaBreached ? "bg-red-500/20" : "bg-blue-500/20"
                          )}
                        >
                          {ticket.slaBreached ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Ticket className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm truncate max-w-[200px]">
                            {ticket.subject}
                          </p>
                          <p className="text-xs text-gray-400">
                            {ticket.ticketNumber} • {ticket.user?.username || "Usuário"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            ticket.priority === "URGENT"
                              ? "bg-red-500/10 text-red-500 border-red-500/30"
                              : ticket.priority === "HIGH"
                              ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                              : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                          )}
                        >
                          {ticket.priority}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(ticket.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-white/10 hover:bg-primary/10 hover:border-primary/30"
                onClick={() => setLocation("/admin/support/chats")}
              >
                <MessageCircle className="w-6 h-6 text-green-500" />
                <span>Atender Chats</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-white/10 hover:bg-primary/10 hover:border-primary/30"
                onClick={() => setLocation("/admin/support/tickets")}
              >
                <Ticket className="w-6 h-6 text-blue-500" />
                <span>Gerenciar Tickets</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-white/10 hover:bg-primary/10 hover:border-primary/30"
                onClick={() => setLocation("/admin/support/departments")}
              >
                <Users className="w-6 h-6 text-purple-500" />
                <span>Departamentos</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2 border-white/10 hover:bg-primary/10 hover:border-primary/30"
                onClick={() => setLocation("/admin/support/settings")}
              >
                <TrendingUp className="w-6 h-6 text-yellow-500" />
                <span>Relatórios</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
