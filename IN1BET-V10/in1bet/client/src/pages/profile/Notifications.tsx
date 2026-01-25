import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bell, Settings, Trash2, CheckCheck, Trophy, Gift, TrendingUp, 
  Coins, Target, Shield, MessageSquare, Megaphone 
} from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

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

interface NotificationPreferences {
  id: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  promotions: boolean;
  bets: boolean;
  levels: boolean;
  missions: boolean;
  security: boolean;
  news: boolean;
  quiet_start?: string;
  quiet_end?: string;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "BET_WIN":
    case "BIG_WIN":
      return <Trophy className="h-5 w-5 text-yellow-400" />;
    case "BONUS_RECEIVED":
    case "RAKEBACK":
      return <Gift className="h-5 w-5 text-green-400" />;
    case "LEVEL_UP":
    case "VIP_UPGRADE":
      return <TrendingUp className="h-5 w-5 text-purple-400" />;
    case "DEPOSIT_CONFIRMED":
    case "WITHDRAWAL_APPROVED":
      return <Coins className="h-5 w-5 text-emerald-400" />;
    case "MISSION_COMPLETED":
      return <Target className="h-5 w-5 text-blue-400" />;
    case "SECURITY":
    case "PASSWORD_CHANGE":
    case "LOGIN_NEW_DEVICE":
      return <Shield className="h-5 w-5 text-red-400" />;
    case "PROMOTION":
      return <Megaphone className="h-5 w-5 text-orange-400" />;
    default:
      return <MessageSquare className="h-5 w-5 text-muted-foreground" />;
  }
};

const getPriorityBorder = (priority: string) => {
  switch (priority) {
    case "URGENT": return "border-l-4 border-l-red-500";
    case "HIGH": return "border-l-4 border-l-orange-500";
    default: return "border-l-4 border-l-transparent";
  }
};

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: feed, isLoading: feedLoading } = useQuery<NotificationFeed>({
    queryKey: ["/api/notifications/feed"],
  });

  const { data: preferences, isLoading: prefsLoading } = useQuery<NotificationPreferences>({
    queryKey: ["/api/notifications/preferences"],
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
      toast.success("Todas notificações marcadas como lidas");
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

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      const res = await apiRequest("PUT", "/api/notifications/preferences", updates);
      return res.json();
    },
    onSuccess: () => {
      toast.success("Preferências atualizadas");
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/preferences"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar preferências");
    },
  });

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferencesMutation.mutate({ [key]: value });
  };

  const notifications = feed?.notifications || [];
  const unreadCount = feed?.unreadCount || 0;

  if (feedLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-notifications-title">Notificações</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Todas lidas'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={() => markAllReadMutation.mutate()}
              data-testid="button-mark-all-read"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas
            </Button>
          )}
        </div>

        <Tabs defaultValue="inbox" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inbox" data-testid="tab-inbox">
              Caixa de Entrada
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="mt-4">
            {notifications.length > 0 ? (
              <Card>
                <ScrollArea className="h-[500px]">
                  <div className="divide-y">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-muted/30 transition-colors ${getPriorityBorder(notification.priority)} ${!notification.isRead ? 'bg-primary/5' : ''}`}
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </p>
                              {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground/70 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: ptBR })}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => markReadMutation.mutate([notification.id])}
                                title="Marcar como lida"
                              >
                                <CheckCheck className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteMutation.mutate(notification.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">Caixa vazia</p>
                  <p className="text-muted-foreground mt-1">
                    Suas notificações aparecerão aqui
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Canais de Notificação</CardTitle>
                <CardDescription>Escolha como deseja receber notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="push">Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">Receba alertas no navegador</p>
                  </div>
                  <Switch
                    id="push"
                    checked={preferences?.pushEnabled ?? false}
                    onCheckedChange={(checked) => handlePreferenceChange('pushEnabled', checked)}
                    data-testid="switch-push"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email">Notificações por E-mail</Label>
                    <p className="text-sm text-muted-foreground">Receba resumos por e-mail</p>
                  </div>
                  <Switch
                    id="email"
                    checked={preferences?.emailEnabled ?? false}
                    onCheckedChange={(checked) => handlePreferenceChange('emailEnabled', checked)}
                    data-testid="switch-email"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categorias</CardTitle>
                <CardDescription>Personalize quais notificações deseja receber</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-orange-400" />
                    <div className="space-y-0.5">
                      <Label htmlFor="promotions">Promoções</Label>
                      <p className="text-sm text-muted-foreground">Bônus, ofertas e campanhas</p>
                    </div>
                  </div>
                  <Switch
                    id="promotions"
                    checked={preferences?.promotions ?? true}
                    onCheckedChange={(checked) => handlePreferenceChange('promotions', checked)}
                    data-testid="switch-promotions"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    <div className="space-y-0.5">
                      <Label htmlFor="bets">Apostas</Label>
                      <p className="text-sm text-muted-foreground">Vitórias e resultados de jogos</p>
                    </div>
                  </div>
                  <Switch
                    id="bets"
                    checked={preferences?.bets ?? true}
                    onCheckedChange={(checked) => handlePreferenceChange('bets', checked)}
                    data-testid="switch-bets"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-400" />
                    <div className="space-y-0.5">
                      <Label htmlFor="levels">Níveis e VIP</Label>
                      <p className="text-sm text-muted-foreground">Progressão e recompensas de nível</p>
                    </div>
                  </div>
                  <Switch
                    id="levels"
                    checked={preferences?.levels ?? true}
                    onCheckedChange={(checked) => handlePreferenceChange('levels', checked)}
                    data-testid="switch-levels"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-blue-400" />
                    <div className="space-y-0.5">
                      <Label htmlFor="missions">Missões</Label>
                      <p className="text-sm text-muted-foreground">Progresso e conclusão de missões</p>
                    </div>
                  </div>
                  <Switch
                    id="missions"
                    checked={preferences?.missions ?? true}
                    onCheckedChange={(checked) => handlePreferenceChange('missions', checked)}
                    data-testid="switch-missions"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-red-400" />
                    <div className="space-y-0.5">
                      <Label htmlFor="security">Segurança</Label>
                      <p className="text-sm text-muted-foreground">Login, senha e verificações</p>
                    </div>
                  </div>
                  <Switch
                    id="security"
                    checked={preferences?.security ?? true}
                    onCheckedChange={(checked) => handlePreferenceChange('security', checked)}
                    data-testid="switch-security"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
