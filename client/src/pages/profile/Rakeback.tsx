import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Percent, TrendingUp, Clock, Wallet, Gift, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RakebackSummary {
  currentPeriod: {
    totalWagered: number;
    totalLosses: number;
    potentialRakeback: number;
    percentage: number;
    periodStart: string;
    periodEnd: string;
    daysRemaining: number;
  };
  pendingPayouts: {
    id: string;
    grossAmount: number;
    netAmount: number;
    rolloverRequired: number;
    rolloverProgress: number;
    canWithdraw: boolean;
    createdAt: string;
    expiresAt: string;
  }[];
  totals: {
    totalEarned: number;
    totalClaimed: number;
    totalPending: number;
  };
  vipLevel: string;
  currentPercentage: number;
}

interface RakebackHistoryItem {
  id: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  netAmount: number;
  claimedAmount: number;
  status: string;
  createdAt: string;
}

const VIP_RAKEBACK = {
  bronze: { name: "Bronze", percentage: 5, color: "text-amber-600", bgColor: "bg-amber-600/10" },
  silver: { name: "Silver", percentage: 7, color: "text-gray-300", bgColor: "bg-gray-300/10" },
  gold: { name: "Gold", percentage: 10, color: "text-yellow-400", bgColor: "bg-yellow-400/10" },
  platinum: { name: "Platinum", percentage: 12, color: "text-cyan-400", bgColor: "bg-cyan-400/10" },
  diamond: { name: "Diamond", percentage: 15, color: "text-purple-400", bgColor: "bg-purple-400/10" },
};

export default function Rakeback() {
  const queryClient = useQueryClient();

  const { data: summary, isLoading } = useQuery<RakebackSummary>({
    queryKey: ["/api/rakeback/summary"],
  });

  const { data: historyData } = useQuery<{ history: RakebackHistoryItem[] }>({
    queryKey: ["/api/rakeback/history"],
  });

  const claimMutation = useMutation({
    mutationFn: async (payoutId: string) => {
      const res = await apiRequest("POST", "/api/rakeback/claim", { payoutId });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Rakeback resgatado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["/api/rakeback/summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rakeback/history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao resgatar rakeback");
    },
  });

  const getVipInfo = (level: string) => {
    return VIP_RAKEBACK[level.toLowerCase() as keyof typeof VIP_RAKEBACK] || VIP_RAKEBACK.bronze;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge className="bg-green-500/20 text-green-400">Disponível</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/20 text-yellow-400">Pendente</Badge>;
      case "CLAIMED":
        return <Badge className="bg-blue-500/20 text-blue-400">Resgatado</Badge>;
      case "EXPIRED":
        return <Badge className="bg-red-500/20 text-red-400">Expirado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  const vipInfo = summary ? getVipInfo(summary.vipLevel) : VIP_RAKEBACK.bronze;

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-green-500/10">
            <Percent className="h-6 w-6 text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-rakeback-title">Rakeback</h1>
            <p className="text-muted-foreground">Receba de volta parte das suas perdas semanais</p>
          </div>
        </div>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className={vipInfo.color}>{vipInfo.name}</span>
                  <Badge variant="outline">{summary?.currentPercentage || vipInfo.percentage}% Rakeback</Badge>
                </CardTitle>
                <CardDescription className="mt-1">
                  Quanto maior seu nível VIP, maior a porcentagem de rakeback
                </CardDescription>
              </div>
              <div className={`p-4 rounded-full ${vipInfo.bgColor}`}>
                <TrendingUp className={`h-8 w-8 ${vipInfo.color}`} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(VIP_RAKEBACK).map(([key, tier]) => (
                <div 
                  key={key}
                  className={`p-3 rounded-lg text-center transition-all ${
                    summary?.vipLevel.toLowerCase() === key 
                      ? `${tier.bgColor} ring-2 ring-${tier.color.replace('text-', '')}/50`
                      : 'bg-muted/20'
                  }`}
                >
                  <p className={`font-semibold ${tier.color}`}>{tier.name}</p>
                  <p className="text-2xl font-bold">{tier.percentage}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current" data-testid="tab-current">Período Atual</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              Disponível 
              {(summary?.pendingPayouts?.length ?? 0) > 0 && (
                <Badge variant="secondary" className="ml-2">{summary?.pendingPayouts.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Período Semanal
                </CardTitle>
                {summary?.currentPeriod && (
                  <CardDescription>
                    {format(new Date(summary.currentPeriod.periodStart), "dd/MM", { locale: ptBR })} - {format(new Date(summary.currentPeriod.periodEnd), "dd/MM/yyyy", { locale: ptBR })}
                    <span className="ml-2 text-primary">({summary.currentPeriod.daysRemaining} dias restantes)</span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">Total Apostado</p>
                    <p className="text-xl font-bold" data-testid="text-total-wagered">
                      R$ {(summary?.currentPeriod?.totalWagered || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-red-500/10">
                    <p className="text-sm text-muted-foreground">Perdas no Período</p>
                    <p className="text-xl font-bold text-red-400" data-testid="text-total-losses">
                      R$ {(summary?.currentPeriod?.totalLosses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10">
                    <p className="text-sm text-muted-foreground">Rakeback Potencial</p>
                    <p className="text-xl font-bold text-green-400" data-testid="text-potential-rakeback">
                      R$ {(summary?.currentPeriod?.potentialRakeback || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/20 border border-muted">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Como funciona o rakeback?</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>O rakeback é calculado semanalmente (toda segunda-feira)</li>
                        <li>Receba {summary?.currentPercentage || 5}% das suas perdas líquidas de volta</li>
                        <li>Perdas mínimas de R$ 100 para receber rakeback</li>
                        <li>Cumpra o rollover de 2x antes de sacar</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {summary?.pendingPayouts && summary.pendingPayouts.length > 0 ? (
              summary.pendingPayouts.map((payout) => (
                <Card key={payout.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Gift className="h-5 w-5 text-green-400" />
                          <span className="font-semibold text-lg" data-testid={`text-payout-amount-${payout.id}`}>
                            R$ {payout.netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Criado {formatDistanceToNow(new Date(payout.createdAt), { addSuffix: true, locale: ptBR })}
                        </p>
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Rollover: R$ {payout.rolloverProgress.toFixed(2)} / R$ {payout.rolloverRequired.toFixed(2)}</span>
                            <span className="font-medium">{Math.min(100, (payout.rolloverProgress / payout.rolloverRequired * 100)).toFixed(0)}%</span>
                          </div>
                          <Progress 
                            value={Math.min(100, (payout.rolloverProgress / payout.rolloverRequired * 100))} 
                            className="h-2" 
                          />
                        </div>

                        {payout.expiresAt && (
                          <p className="text-xs text-muted-foreground">
                            Expira em {formatDistanceToNow(new Date(payout.expiresAt), { locale: ptBR })}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        onClick={() => claimMutation.mutate(payout.id)}
                        disabled={!payout.canWithdraw || claimMutation.isPending}
                        className="w-full sm:w-auto"
                        data-testid={`button-claim-${payout.id}`}
                      >
                        {payout.canWithdraw ? (
                          <>
                            <Wallet className="h-4 w-4 mr-2" />
                            Resgatar
                          </>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 mr-2" />
                            Cumpra Rollover
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum rakeback disponível no momento</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Continue apostando para acumular rakeback semanal
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4 mt-4">
            {historyData?.history && historyData.history.length > 0 ? (
              <Card>
                <CardContent className="divide-y divide-border">
                  {historyData.history.map((item) => (
                    <div key={item.id} className="py-4 first:pt-6 last:pb-6 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            R$ {item.claimedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Período: {format(new Date(item.periodStart), "dd/MM", { locale: ptBR })} - {format(new Date(item.periodEnd), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <CheckCircle2 className={`h-5 w-5 ${item.status === 'CLAIMED' ? 'text-green-400' : 'text-muted-foreground'}`} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum histórico de rakeback</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Ganho</p>
                <p className="text-lg font-bold text-green-400" data-testid="text-total-earned">
                  R$ {(summary?.totals?.totalEarned || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Já Resgatado</p>
                <p className="text-lg font-bold" data-testid="text-total-claimed">
                  R$ {(summary?.totals?.totalClaimed || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendente</p>
                <p className="text-lg font-bold text-yellow-400" data-testid="text-total-pending">
                  R$ {(summary?.totals?.totalPending || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
