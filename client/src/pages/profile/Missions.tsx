import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Clock, Gift, CheckCircle2, Trophy, Star, Sparkles, Coins } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StreakCard } from "@/components/missions/StreakCard";

interface Mission {
  id: string;
  name: string;
  description: string;
  icon?: string;
  progress: number;
  target: number;
  progressPercent: number;
  status: "ACTIVE" | "COMPLETED" | "CLAIMED" | "EXPIRED";
  rewardType: "XP" | "BONUS_CASH" | "FREE_SPINS";
  rewardValue: number;
  periodEnd: string;
  completedAt?: string;
  claimedAt?: string;
}

interface MissionsData {
  daily: Mission[];
  weekly: Mission[];
}

interface MissionStats {
  completedToday: number;
  claimedThisWeek: number;
  totalXpEarned: number;
  totalCashEarned: number;
}

const getMissionIcon = (iconName?: string) => {
  switch (iconName) {
    case "trophy": return <Trophy className="h-5 w-5" />;
    case "star": return <Star className="h-5 w-5" />;
    default: return <Target className="h-5 w-5" />;
  }
};

const getRewardIcon = (type: string) => {
  switch (type) {
    case "XP": return <Sparkles className="h-4 w-4 text-purple-400" />;
    case "BONUS_CASH": return <Coins className="h-4 w-4 text-yellow-400" />;
    default: return <Gift className="h-4 w-4 text-green-400" />;
  }
};

const getRewardLabel = (type: string, value: number) => {
  switch (type) {
    case "XP": return `${value} XP`;
    case "BONUS_CASH": return `R$ ${value.toFixed(2)}`;
    default: return `${value}`;
  }
};

function MissionCard({ mission, onClaim, isClaiming }: { mission: Mission; onClaim: (id: string) => void; isClaiming: boolean }) {
  const isCompleted = mission.status === "COMPLETED";
  const isClaimed = mission.status === "CLAIMED";
  const isActive = mission.status === "ACTIVE";

  return (
    <Card className={`transition-all ${isCompleted ? 'border-green-500/50 bg-green-500/5' : ''} ${isClaimed ? 'opacity-60' : ''}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${isCompleted ? 'bg-green-500/20 text-green-400' : isClaimed ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
            {getMissionIcon(mission.icon)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate" data-testid={`text-mission-name-${mission.id}`}>{mission.name}</h3>
              {isClaimed && <CheckCircle2 className="h-4 w-4 text-green-400 flex-shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{mission.description}</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {mission.progress.toFixed(0)} / {mission.target.toFixed(0)}
                </span>
                <span className="font-medium">{mission.progressPercent.toFixed(0)}%</span>
              </div>
              <Progress value={mission.progressPercent} className="h-2" />
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                {getRewardIcon(mission.rewardType)}
                <span className="text-sm font-medium" data-testid={`text-mission-reward-${mission.id}`}>
                  {getRewardLabel(mission.rewardType, mission.rewardValue)}
                </span>
              </div>
              
              {isCompleted && !isClaimed ? (
                <Button 
                  size="sm" 
                  onClick={() => onClaim(mission.id)}
                  disabled={isClaiming}
                  data-testid={`button-claim-mission-${mission.id}`}
                >
                  <Gift className="h-4 w-4 mr-1" />
                  Resgatar
                </Button>
              ) : isActive ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(mission.periodEnd), { locale: ptBR })}
                </div>
              ) : isClaimed ? (
                <Badge variant="outline" className="text-green-400 border-green-400/30">
                  Resgatado
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Missions() {
  const queryClient = useQueryClient();

  const { data: missions, isLoading } = useQuery<MissionsData>({
    queryKey: ["/api/missions/active"],
  });

  const { data: stats } = useQuery<MissionStats>({
    queryKey: ["/api/missions/stats"],
  });

  const claimMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await apiRequest("POST", "/api/missions/claim", { assignmentId });
      return res.json();
    },
    onSuccess: (data) => {
      const rewardLabel = data.reward.type === "XP" 
        ? `${data.reward.value} XP` 
        : `R$ ${data.reward.value.toFixed(2)}`;
      toast.success(`Recompensa resgatada: ${rewardLabel}`);
      queryClient.invalidateQueries({ queryKey: ["/api/missions/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/missions/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/levels/info"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao resgatar recompensa");
    },
  });

  const completedDailyCount = missions?.daily.filter(m => m.status === "COMPLETED" || m.status === "CLAIMED").length || 0;
  const completedWeeklyCount = missions?.weekly.filter(m => m.status === "COMPLETED" || m.status === "CLAIMED").length || 0;
  const totalDailyCount = missions?.daily.length || 0;
  const totalWeeklyCount = missions?.weekly.length || 0;

  if (isLoading) {
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
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Target className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-missions-title">Missões</h1>
            <p className="text-muted-foreground">Complete desafios e ganhe recompensas</p>
          </div>
        </div>

        <StreakCard />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Completadas Hoje</p>
              <p className="text-2xl font-bold" data-testid="text-completed-today">
                {stats?.completedToday || completedDailyCount}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Resgatadas (Semana)</p>
              <p className="text-2xl font-bold" data-testid="text-claimed-week">
                {stats?.claimedThisWeek || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">XP Ganho</p>
              <p className="text-2xl font-bold text-purple-400" data-testid="text-xp-earned">
                {stats?.totalXpEarned || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-sm text-muted-foreground">Bônus Ganho</p>
              <p className="text-2xl font-bold text-yellow-400" data-testid="text-cash-earned">
                R$ {(stats?.totalCashEarned || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily" data-testid="tab-daily">
              Diárias 
              <Badge variant="secondary" className="ml-2">{completedDailyCount}/{totalDailyCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="weekly" data-testid="tab-weekly">
              Semanais 
              <Badge variant="secondary" className="ml-2">{completedWeeklyCount}/{totalWeeklyCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-3 mt-4">
            {missions?.daily && missions.daily.length > 0 ? (
              missions.daily.map((mission) => (
                <MissionCard 
                  key={mission.id} 
                  mission={mission} 
                  onClaim={(id) => claimMutation.mutate(id)}
                  isClaiming={claimMutation.isPending}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma missão diária disponível</p>
                  <p className="text-sm text-muted-foreground mt-1">Volte amanhã para novas missões!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="weekly" className="space-y-3 mt-4">
            {missions?.weekly && missions.weekly.length > 0 ? (
              missions.weekly.map((mission) => (
                <MissionCard 
                  key={mission.id} 
                  mission={mission} 
                  onClaim={(id) => claimMutation.mutate(id)}
                  isClaiming={claimMutation.isPending}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma missão semanal disponível</p>
                  <p className="text-sm text-muted-foreground mt-1">Volte na próxima semana!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Gift className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Dica de Missões</p>
                <p className="text-muted-foreground">
                  Quanto maior seu nível VIP, maiores as recompensas das missões! 
                  Continue subindo de nível para ganhar bônus maiores.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
