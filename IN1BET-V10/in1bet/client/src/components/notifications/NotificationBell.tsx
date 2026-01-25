import { useState } from "react";
import { Bell, Check, CheckCheck, Trash2, Settings, MessageSquare, Trophy, Gift, Shield, TrendingUp, Coins, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl?: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationFeed {
  notifications: Notification[];
  unreadCount: number;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "BET_WIN":
    case "BIG_WIN":
      return <Trophy className="h-4 w-4 text-yellow-400" />;
    case "BONUS_RECEIVED":
    case "RAKEBACK":
      return <Gift className="h-4 w-4 text-green-400" />;
    case "LEVEL_UP":
    case "VIP_UPGRADE":
      return <TrendingUp className="h-4 w-4 text-purple-400" />;
    case "DEPOSIT_CONFIRMED":
    case "WITHDRAWAL_APPROVED":
      return <Coins className="h-4 w-4 text-emerald-400" />;
    case "MISSION_COMPLETED":
      return <Target className="h-4 w-4 text-blue-400" />;
    case "SECURITY":
    case "PASSWORD_CHANGE":
    case "LOGIN_NEW_DEVICE":
      return <Shield className="h-4 w-4 text-red-400" />;
    default:
      return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "URGENT": return "border-l-red-500";
    case "HIGH": return "border-l-orange-500";
    default: return "border-l-transparent";
  }
};

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: feed } = useQuery<NotificationFeed>({
    queryKey: ["/api/notifications/feed"],
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const res = await apiRequest("POST", "/api/notifications/read", { notificationIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/feed"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/notifications/read-all");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/feed"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/notifications/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/feed"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markReadMutation.mutate([notification.id]);
    }
    if (notification.actionUrl) {
      setOpen(false);
    }
  };

  const unreadCount = feed?.unreadCount || 0;
  const notifications = feed?.notifications || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs bg-red-500 text-white border-0"
              data-testid="badge-notification-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notificações</h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => markAllReadMutation.mutate()}
                title="Marcar todas como lidas"
                data-testid="button-mark-all-read"
              >
                <CheckCheck className="h-4 w-4" />
              </Button>
            )}
            <Link href="/perfil/notificacoes">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Configurações">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.slice(0, 20).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors border-l-2 ${getPriorityColor(notification.priority)} ${!notification.isRead ? 'bg-primary/5' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-item-${notification.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notification.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Link href="/perfil/notificacoes">
              <Button variant="ghost" className="w-full text-sm" onClick={() => setOpen(false)}>
                Ver todas as notificações
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
