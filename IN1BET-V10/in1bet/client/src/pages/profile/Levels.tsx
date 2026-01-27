import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift, Star, Trophy, TrendingUp, Box, ChevronRight, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LevelInfo {
  level: number;
  xp: number;
  xpProgress: number;
  xpNeeded: number;
  progressPercent: number;
  totalWagered: number;
  dailyBox: {
    type: string;
    value: number;
    description: string;
  };
  canClaimDailyBox: boolean;
  nextMilestone: number;
  milestoneReward: {
    type: string;
    value: number;
    description: string;
  } | null;
  vipLevel: string;
}

interface LevelUpRecord {
  id: string;
  fromLevel: number;
  toLevel: number;
  xpGained: number;
  rewardClaimed: boolean;
  rewardValue: string;
  createdAt: string;
}

interface DailyBoxRecord {
  id: string;
  level: number;
  rewardType: string;
  rewardValue: string;
  claimedAt: string;
}

const VIP_TIERS = [
  { name: "Bronze", minLevel: 1, color: "text-amber-600", bgColor: "bg-amber-600/10" },
  { name: "Prata", minLevel: 50, color: "text-gray-300", bgColor: "bg-gray-300/10" },
  { name: "Ouro", minLevel: 100, color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
  { name: "Platina", minLevel: 300, color: "text-cyan-400", bgColor: "bg-cyan-400/10" },
  { name: "Diamante", minLevel: 500, color: "text-purple-400", bgColor: "bg-purple-400/10" },
];

export default function Levels() {
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);
  
  const { data: levelInfo, isLoading } = useQuery<LevelInfo>({
    queryKey: ["/api/levels/info"],
  });
  
  const { data: historyData } = useQuery<{ levelHistory: LevelUpRecord[], dailyBoxHistory: DailyBoxRecord[] }>({
    queryKey: ["/api/levels/history"],
  });
  
  const claimDailyBox = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/levels/daily-box/claim");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Você ganhou R$ ${data.reward.value.toFixed(2)}!`);
      queryClient.invalidateQueries({ queryKey: ["/api/levels/info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/levels/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      setClaiming(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao resgatar caixa diária");
      setClaiming(false);
    },
  });
  
  const handleClaimDailyBox = () => {
    setClaiming(true);
    claimDailyBox.mutate();
  };
  
  const getCurrentVipTier = (level: number) => {
    for (let i = VIP_TIERS.length - 1; i >= 0; i--) {
      if (level >= VIP_TIERS[i].minLevel) {
        return VIP_TIERS[i];
      }
    }
    return VIP_TIERS[0];
  };
  
  const getNextVipTier = (level: number) => {
    for (const tier of VIP_TIERS) {
      if (level < tier.minLevel) {
        return tier;
      }
    }
    return null;
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }
  
  const currentTier = levelInfo ? getCurrentVipTier(levelInfo.level) : VIP_TIERS[0];
  const nextTier = levelInfo ? getNextVipTier(levelInfo.level) : VIP_TIERS[1];
  
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-yellow-500 rounded-2xl mb-4 transform rotate-3">
            <Star className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-black text-white mb-2">
            NÍVEL <span className="text-primary">{levelInfo?.level || 1}</span>
          </h1>
          <p className="text-gray-400">
            Jogue e ganhe XP para subir de nível e desbloquear recompensas exclusivas
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-white/5 col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Progresso de Nível
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-400">Nível Atual</span>
                  <p className={`text-3xl font-bold ${currentTier.color}`}>
                    {levelInfo?.level || 1}
                  </p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-600" />
                <div className="text-right">
                  <span className="text-sm text-gray-400">Próximo Nível</span>
                  <p className="text-3xl font-bold text-white">
                    {(levelInfo?.level || 0) + 1}
                  </p>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">XP: {levelInfo?.xpProgress || 0}</span>
                  <span className="text-gray-400">{levelInfo?.xpNeeded || 100} XP</span>
                </div>
                <Progress value={levelInfo?.progressPercent || 0} className="h-3" />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
                <div>
                  <span className="text-sm text-gray-400">Total Apostado</span>
                  <p className="text-xl font-bold text-white">
                    R$ {(levelInfo?.totalWagered || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-400">XP Total</span>
                  <p className="text-xl font-bold text-primary">
                    {(levelInfo?.xp || 0).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
              
              <div className="text-sm text-gray-500 text-center">
                Ganhe 10 XP para cada R$ 1,00 apostado
              </div>
            </CardContent>
          </Card>
          
          <Card className={`bg-gradient-to-br from-card to-secondary/30 border-primary/20 ${claiming ? "animate-pulse" : ""}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-yellow-400" />
                Caixa Diária
              </CardTitle>
              <CardDescription>
                Resgate sua recompensa diária
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <Box className="w-24 h-24 text-yellow-500" />
                  <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-300 animate-pulse" />
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Recompensa do Nível {levelInfo?.level}</p>
                <p className="text-2xl font-bold text-white">
                  R$ {levelInfo?.dailyBox.value.toFixed(2)}
                </p>
              </div>
              
              <Button 
                className="w-full" 
                disabled={!levelInfo?.canClaimDailyBox || claiming}
                onClick={handleClaimDailyBox}
                data-testid="button-claim-daily-box"
              >
                {claiming ? "Resgatando..." : levelInfo?.canClaimDailyBox ? "Resgatar Caixa" : "Volte Amanhã"}
              </Button>
              
              {!levelInfo?.canClaimDailyBox && (
                <p className="text-xs text-center text-gray-500">
                  <Clock className="inline w-3 h-3 mr-1" />
                  Disponível novamente em 24 horas
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card className="bg-card border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Próximo Marco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="font-bold text-white">Nível {levelInfo?.nextMilestone}</p>
                  <p className="text-sm text-gray-400">
                    {levelInfo?.milestoneReward?.description || "Bônus especial"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Faltam</p>
                <p className="text-xl font-bold text-primary">
                  {(levelInfo?.nextMilestone || 10) - (levelInfo?.level || 0)} níveis
                </p>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-5 gap-2">
              {VIP_TIERS.map((tier, index) => {
                const isActive = levelInfo ? levelInfo.level >= tier.minLevel : false;
                const isCurrent = currentTier.name === tier.name;
                return (
                  <div
                    key={tier.name}
                    className={`p-3 rounded-lg text-center transition-all ${
                      isActive ? tier.bgColor : "bg-secondary/20"
                    } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                  >
                    <p className={`font-bold text-sm ${isActive ? tier.color : "text-gray-600"}`}>
                      {tier.name}
                    </p>
                    <p className="text-xs text-gray-500">Lv {tier.minLevel}+</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="level-ups" className="w-full">
          <TabsList className="w-full justify-start bg-card border-b border-white/5 rounded-none">
            <TabsTrigger value="level-ups">Subidas de Nível</TabsTrigger>
            <TabsTrigger value="daily-boxes">Caixas Resgatadas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="level-ups">
            <Card className="bg-card border-white/5">
              <CardContent className="p-0">
                {historyData?.levelHistory?.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Nenhuma subida de nível ainda. Jogue para ganhar XP!
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {historyData?.levelHistory?.map((record) => (
                      <div key={record.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              Nível {record.fromLevel} → {record.toLevel}
                            </p>
                            <p className="text-sm text-gray-400">
                              +{record.xpGained.toLocaleString()} XP
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {record.rewardClaimed && (
                            <Badge className="mb-1">+R$ {parseFloat(record.rewardValue).toFixed(2)}</Badge>
                          )}
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(record.createdAt), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="daily-boxes">
            <Card className="bg-card border-white/5">
              <CardContent className="p-0">
                {historyData?.dailyBoxHistory?.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Nenhuma caixa resgatada ainda. Resgate sua primeira caixa diária!
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {historyData?.dailyBoxHistory?.map((record) => (
                      <div key={record.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                            <Gift className="w-5 h-5 text-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              Caixa Diária - Nível {record.level}
                            </p>
                            <p className="text-sm text-gray-400">
                              Bônus de R$ {parseFloat(record.rewardValue).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(record.claimedAt), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
