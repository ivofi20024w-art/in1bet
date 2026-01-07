import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, DollarSign, Clock, Ban, AlertTriangle, History, Check, X } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ResponsibleGamingSettings {
  dailyDepositLimit: number | null;
  weeklyDepositLimit: number | null;
  monthlyDepositLimit: number | null;
  maxBetLimit: number | null;
  sessionTimeLimit: number | null;
  selfExcludedUntil: string | null;
  permanentSelfExcluded: boolean;
  selfExclusionReason: string | null;
  isSelfExcluded: boolean;
  lastSessionStart: string | null;
}

interface HistoryRecord {
  id: string;
  actionType: string;
  previousValue: string | null;
  newValue: string;
  reason: string | null;
  createdAt: string;
}

export default function ResponsibleGamingSettings() {
  const queryClient = useQueryClient();
  const [depositLimits, setDepositLimits] = useState({
    dailyLimit: "",
    weeklyLimit: "",
    monthlyLimit: "",
  });
  const [betLimit, setBetLimit] = useState("");
  const [sessionLimit, setSessionLimit] = useState("");
  const [exclusionDuration, setExclusionDuration] = useState<"24h" | "7d" | "30d" | "permanent">("24h");
  const [exclusionReason, setExclusionReason] = useState("");
  
  const { data: settings, isLoading } = useQuery<ResponsibleGamingSettings>({
    queryKey: ["/api/levels/responsible-gaming"],
  });
  
  const { data: historyData } = useQuery<{ history: HistoryRecord[] }>({
    queryKey: ["/api/levels/responsible-gaming/history"],
  });
  
  const updateDepositLimits = useMutation({
    mutationFn: async (data: { dailyLimit?: number; weeklyLimit?: number; monthlyLimit?: number }) => {
      const res = await apiRequest("POST", "/api/levels/responsible-gaming/deposit-limits", data);
      return res.json();
    },
    onSuccess: () => {
      toast.success("Limites de depósito atualizados");
      queryClient.invalidateQueries({ queryKey: ["/api/levels/responsible-gaming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/levels/responsible-gaming/history"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar limites");
    },
  });
  
  const updateBetLimit = useMutation({
    mutationFn: async (maxBetLimit: number) => {
      const res = await apiRequest("POST", "/api/levels/responsible-gaming/bet-limit", { maxBetLimit });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Limite de aposta atualizado");
      queryClient.invalidateQueries({ queryKey: ["/api/levels/responsible-gaming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/levels/responsible-gaming/history"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar limite");
    },
  });
  
  const updateSessionLimit = useMutation({
    mutationFn: async (sessionTimeLimit: number) => {
      const res = await apiRequest("POST", "/api/levels/responsible-gaming/session-limit", { sessionTimeLimit });
      return res.json();
    },
    onSuccess: () => {
      toast.success("Limite de sessão atualizado");
      queryClient.invalidateQueries({ queryKey: ["/api/levels/responsible-gaming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/levels/responsible-gaming/history"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar limite");
    },
  });
  
  const selfExclude = useMutation({
    mutationFn: async (data: { duration: string; reason?: string }) => {
      const res = await apiRequest("POST", "/api/levels/responsible-gaming/self-exclude", data);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.isPermanent) {
        toast.success("Autoexclusão permanente ativada");
      } else {
        toast.success("Autoexclusão temporária ativada");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/levels/responsible-gaming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/levels/responsible-gaming/history"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao aplicar autoexclusão");
    },
  });
  
  const handleDepositLimits = () => {
    const data: { dailyLimit?: number; weeklyLimit?: number; monthlyLimit?: number } = {};
    if (depositLimits.dailyLimit) data.dailyLimit = parseFloat(depositLimits.dailyLimit);
    if (depositLimits.weeklyLimit) data.weeklyLimit = parseFloat(depositLimits.weeklyLimit);
    if (depositLimits.monthlyLimit) data.monthlyLimit = parseFloat(depositLimits.monthlyLimit);
    
    if (Object.keys(data).length === 0) {
      toast.error("Informe pelo menos um limite");
      return;
    }
    
    updateDepositLimits.mutate(data);
  };
  
  const handleBetLimit = () => {
    if (!betLimit) {
      toast.error("Informe o limite de aposta");
      return;
    }
    updateBetLimit.mutate(parseFloat(betLimit));
  };
  
  const handleSessionLimit = () => {
    if (!sessionLimit) {
      toast.error("Informe o limite de sessão");
      return;
    }
    updateSessionLimit.mutate(parseInt(sessionLimit));
  };
  
  const handleSelfExclude = () => {
    selfExclude.mutate({ duration: exclusionDuration, reason: exclusionReason || undefined });
  };
  
  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case "SET_DEPOSIT_LIMIT": return "Limite de Depósito";
      case "SET_BET_LIMIT": return "Limite de Aposta";
      case "SET_SESSION_LIMIT": return "Limite de Sessão";
      case "SELF_EXCLUDE_TEMP": return "Autoexclusão Temporária";
      case "SELF_EXCLUDE_PERMANENT": return "Autoexclusão Permanente";
      case "REMOVE_LIMIT": return "Remoção de Limite";
      default: return type;
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
  
  if (settings?.isSelfExcluded) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-16 px-4 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Ban className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Conta Autoexcluída</h1>
          <p className="text-gray-400 mb-6">
            {settings.permanentSelfExcluded
              ? "Sua conta está permanentemente autoexcluída. Esta decisão é irreversível."
              : `Sua conta está autoexcluída até ${format(new Date(settings.selfExcludedUntil!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`}
          </p>
          {settings.selfExclusionReason && (
            <div className="bg-secondary/30 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-400">Motivo informado:</p>
              <p className="text-white">{settings.selfExclusionReason}</p>
            </div>
          )}
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl mb-4 transform rotate-3">
            <ShieldCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-black text-white mb-2">
            JOGO <span className="text-green-500">RESPONSÁVEL</span>
          </h1>
          <p className="text-gray-400">
            Configure limites e ferramentas de proteção para sua conta
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-400">Limite Diário</p>
                  <p className="font-bold text-white">
                    {settings?.dailyDepositLimit ? `R$ ${settings.dailyDepositLimit.toFixed(2)}` : "Sem limite"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-xs text-gray-400">Limite Semanal</p>
                  <p className="font-bold text-white">
                    {settings?.weeklyDepositLimit ? `R$ ${settings.weeklyDepositLimit.toFixed(2)}` : "Sem limite"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-xs text-gray-400">Limite Mensal</p>
                  <p className="font-bold text-white">
                    {settings?.monthlyDepositLimit ? `R$ ${settings.monthlyDepositLimit.toFixed(2)}` : "Sem limite"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-xs text-gray-400">Limite por Aposta</p>
                  <p className="font-bold text-white">
                    {settings?.maxBetLimit ? `R$ ${settings.maxBetLimit.toFixed(2)}` : "Sem limite"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="w-full justify-start bg-card border-b border-white/5 rounded-none">
            <TabsTrigger value="deposit">Limites de Depósito</TabsTrigger>
            <TabsTrigger value="bet">Limite de Aposta</TabsTrigger>
            <TabsTrigger value="session">Limite de Sessão</TabsTrigger>
            <TabsTrigger value="exclusion">Autoexclusão</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="deposit">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Limites de Depósito
                </CardTitle>
                <CardDescription>
                  Defina valores máximos para depósitos em diferentes períodos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dailyLimit">Limite Diário (R$)</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      placeholder={settings?.dailyDepositLimit?.toString() || "Sem limite"}
                      value={depositLimits.dailyLimit}
                      onChange={(e) => setDepositLimits({ ...depositLimits, dailyLimit: e.target.value })}
                      data-testid="input-daily-limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weeklyLimit">Limite Semanal (R$)</Label>
                    <Input
                      id="weeklyLimit"
                      type="number"
                      placeholder={settings?.weeklyDepositLimit?.toString() || "Sem limite"}
                      value={depositLimits.weeklyLimit}
                      onChange={(e) => setDepositLimits({ ...depositLimits, weeklyLimit: e.target.value })}
                      data-testid="input-weekly-limit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyLimit">Limite Mensal (R$)</Label>
                    <Input
                      id="monthlyLimit"
                      type="number"
                      placeholder={settings?.monthlyDepositLimit?.toString() || "Sem limite"}
                      value={depositLimits.monthlyLimit}
                      onChange={(e) => setDepositLimits({ ...depositLimits, monthlyLimit: e.target.value })}
                      data-testid="input-monthly-limit"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm text-blue-300">
                    <strong>Nota:</strong> Os limites serão aplicados imediatamente. Deixe em branco para remover um limite.
                  </p>
                </div>
                
                <Button onClick={handleDepositLimits} disabled={updateDepositLimits.isPending} data-testid="button-save-deposit-limits">
                  {updateDepositLimits.isPending ? "Salvando..." : "Salvar Limites"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="bet">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-400" />
                  Limite de Aposta
                </CardTitle>
                <CardDescription>
                  Defina o valor máximo que você pode apostar por vez
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="max-w-sm space-y-2">
                  <Label htmlFor="betLimit">Limite por Aposta (R$)</Label>
                  <Input
                    id="betLimit"
                    type="number"
                    placeholder={settings?.maxBetLimit?.toString() || "Sem limite"}
                    value={betLimit}
                    onChange={(e) => setBetLimit(e.target.value)}
                    data-testid="input-bet-limit"
                  />
                </div>
                
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <p className="text-sm text-orange-300">
                    <strong>Nota:</strong> Apostas acima deste valor serão bloqueadas automaticamente.
                  </p>
                </div>
                
                <Button onClick={handleBetLimit} disabled={updateBetLimit.isPending} data-testid="button-save-bet-limit">
                  {updateBetLimit.isPending ? "Salvando..." : "Salvar Limite"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="session">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  Limite de Sessão
                </CardTitle>
                <CardDescription>
                  Defina o tempo máximo de sessão contínua na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="max-w-sm space-y-2">
                  <Label htmlFor="sessionLimit">Limite de Sessão (minutos)</Label>
                  <Input
                    id="sessionLimit"
                    type="number"
                    placeholder={settings?.sessionTimeLimit?.toString() || "Sem limite"}
                    value={sessionLimit}
                    onChange={(e) => setSessionLimit(e.target.value)}
                    data-testid="input-session-limit"
                  />
                  <p className="text-xs text-gray-500">
                    Exemplos: 60 (1 hora), 120 (2 horas), 180 (3 horas)
                  </p>
                </div>
                
                {settings?.sessionTimeLimit && (
                  <div className="bg-secondary/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400">
                      Limite atual: <span className="text-white font-bold">{settings.sessionTimeLimit} minutos</span>
                    </p>
                  </div>
                )}
                
                <Button onClick={handleSessionLimit} disabled={updateSessionLimit.isPending} data-testid="button-save-session-limit">
                  {updateSessionLimit.isPending ? "Salvando..." : "Salvar Limite"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="exclusion">
            <Card className="bg-card border-red-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-400">
                  <Ban className="w-5 h-5" />
                  Autoexclusão
                </CardTitle>
                <CardDescription>
                  Bloqueie seu acesso à conta por um período determinado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-sm text-red-300 mb-2">
                    <strong>Atenção:</strong> A autoexclusão é uma ação séria e não pode ser revertida antes do término do período.
                  </p>
                  <p className="text-sm text-red-300">
                    A autoexclusão permanente é <strong>irreversível</strong>.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Período de Exclusão</Label>
                    <Select value={exclusionDuration} onValueChange={(v) => setExclusionDuration(v as any)}>
                      <SelectTrigger data-testid="select-exclusion-duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 horas</SelectItem>
                        <SelectItem value="7d">7 dias</SelectItem>
                        <SelectItem value="30d">30 dias</SelectItem>
                        <SelectItem value="permanent">Permanente (irreversível)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exclusionReason">Motivo (opcional)</Label>
                    <Textarea
                      id="exclusionReason"
                      placeholder="Por que você está solicitando a autoexclusão?"
                      value={exclusionReason}
                      onChange={(e) => setExclusionReason(e.target.value)}
                      data-testid="textarea-exclusion-reason"
                    />
                  </div>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" data-testid="button-self-exclude">
                      <Ban className="w-4 h-4 mr-2" />
                      Solicitar Autoexclusão
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmar Autoexclusão</AlertDialogTitle>
                      <AlertDialogDescription>
                        {exclusionDuration === "permanent" ? (
                          <span className="text-red-400">
                            Você está prestes a se excluir permanentemente. Esta ação é IRREVERSÍVEL e você nunca mais poderá acessar sua conta.
                          </span>
                        ) : (
                          <span>
                            Você está prestes a se excluir por {exclusionDuration === "24h" ? "24 horas" : exclusionDuration === "7d" ? "7 dias" : "30 dias"}. Durante este período, você não poderá acessar sua conta ou jogar.
                          </span>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSelfExclude}
                        className="bg-red-600 hover:bg-red-700"
                        data-testid="button-confirm-exclude"
                      >
                        Confirmar Exclusão
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  Histórico de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {historyData?.history?.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Nenhuma alteração registrada ainda.
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {historyData?.history?.map((record) => (
                      <div key={record.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                            {record.actionType.includes("EXCLUDE") ? (
                              <Ban className="w-5 h-5 text-red-400" />
                            ) : record.actionType.includes("LIMIT") ? (
                              <AlertTriangle className="w-5 h-5 text-primary" />
                            ) : (
                              <ShieldCheck className="w-5 h-5 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-white">
                              {getActionTypeLabel(record.actionType)}
                            </p>
                            <p className="text-sm text-gray-400">
                              {record.previousValue ? `${record.previousValue} → ` : ""}{record.newValue}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(record.createdAt), { addSuffix: true, locale: ptBR })}
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
