import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { GameCanvas, BettingPanel, HistoryBar } from "@/components/aviator";
import { useAuth } from "@/hooks/useAuth";
import { useAviatorWebSocket, ProvablyFairData } from "@/hooks/useAviatorWebSocket";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Wallet, Loader2, AlertCircle, ExternalLink, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Crown, Users } from "lucide-react";

type GameState = "IDLE" | "BETTING" | "FLYING" | "CRASHED";

interface ActiveBet {
  id: number;
  panelId: number;
  betId: number;
  amount: number;
}

interface RoundBet {
  id: number;
  betAmount: string;
  cashedOutAt: string | null;
  profit: string | null;
  status: string;
  userName: string | null;
  userLevel: number | null;
}

interface TopWin {
  id: number;
  betAmount: string;
  cashedOutAt: string | null;
  profit: string | null;
  status: string;
  userName: string | null;
  userLevel: number | null;
}

const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : "??";
const maskName = (name: string) => {
  if (!name || name.length < 3) return name || "Anônimo";
  return name.slice(0, 3) + "***";
};

function LoginRequiredScreen({ gameName }: { gameName: string }) {
  return (
    <MainLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-card border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Login Necessário</h1>
            <p className="text-muted-foreground mb-6">
              Faça login ou crie uma conta para jogar {gameName}
            </p>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Use os botões no topo da página para entrar
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function ProvablyFairModal({ provablyFair, nextServerSeedHash }: { provablyFair: ProvablyFairData | null; nextServerSeedHash: string | null }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Shield className="w-4 h-4" />
          Provably Fair
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Provably Fair - Verificação
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <h4 className="font-bold text-white mb-2">Próxima Rodada</h4>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Server Seed Hash:</span>
                <code className="block mt-1 p-2 rounded bg-black/30 text-xs text-green-400 break-all">
                  {nextServerSeedHash || "Aguardando..."}
                </code>
              </div>
            </div>
          </div>
          
          {provablyFair?.serverSeed && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="font-bold text-white mb-2">Última Rodada (Verificável)</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">Server Seed:</span>
                  <code className="block mt-1 p-2 rounded bg-black/30 text-xs text-yellow-400 break-all">
                    {provablyFair.serverSeed}
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground">Client Seed:</span>
                  <code className="block mt-1 p-2 rounded bg-black/30 text-xs text-blue-400 break-all">
                    {provablyFair.clientSeed || "N/A"}
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground">Nonce:</span>
                  <code className="block mt-1 p-2 rounded bg-black/30 text-xs text-purple-400">
                    {provablyFair.nonce ?? "N/A"}
                  </code>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <h4 className="font-bold text-green-400 mb-2">Como Verificar?</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
              <li>Copie o Server Seed, Client Seed e Nonce da última rodada</li>
              <li>Calcule: HMAC-SHA256(serverSeed, clientSeed:nonce)</li>
              <li>Pegue os primeiros 8 caracteres do hash</li>
              <li>Converta para número decimal e divida por 2^32</li>
              <li>O crash point é: 0.99 / (resultado - 0.01)</li>
            </ol>
          </div>
          
          <a 
            href="https://www.provablyfair.org/verify-bets?utm_source=chatgpt.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-600 hover:to-emerald-700 transition-all active:scale-[0.98]"
          >
            <ExternalLink className="w-4 h-4" />
            Verifica Agora!
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AviatorMania() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { multiplier, gameStatus, roundId, countdown, crashPoint, connected, showCrashMessage, history, provablyFair, nextServerSeedHash } = useAviatorWebSocket();
  const [gameState, setGameState] = useState<GameState>("BETTING");
  const [activeBets, setActiveBets] = useState<ActiveBet[]>([]);
  const [cashedOutBets, setCashedOutBets] = useState<{id: number, at: number}[]>([]);
  
  const { toast } = useToast();

  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/wallet");
      return res.json();
    },
    enabled: !!user,
  });

  const balance = walletData?.wallet?.balance ? parseFloat(walletData.wallet.balance) : 0;

  const { data: roundBets = [] } = useQuery<RoundBet[]>({
    queryKey: ["aviator-round-bets", roundId],
    queryFn: async () => {
      const res = await fetch("/api/games/aviator/round-bets");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 2000,
  });

  const { data: topWins = [] } = useQuery<TopWin[]>({
    queryKey: ["aviator-top-wins"],
    queryFn: async () => {
      const res = await fetch("/api/games/aviator/top-wins");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 30000,
  });

  const refreshBalance = () => {
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
  };

  useEffect(() => {
    if (gameStatus === "waiting") {
      setGameState("BETTING");
      setActiveBets([]);
      setCashedOutBets([]);
    } else if (gameStatus === "running") {
      setGameState("FLYING");
    } else if (gameStatus === "crashed") {
      setGameState("CRASHED");
    }
  }, [gameStatus]);

  const handleBet = async (panelId: number, amount: number) => {
    if (!user) {
      toast({
        title: "Login Necessário",
        description: "Faça login para apostar",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/games/aviator/bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Falha ao apostar");
      }

      setActiveBets(prev => [...prev, { 
        id: Date.now(), 
        panelId, 
        betId: data.bet.id,
        amount 
      }]);
      
      refreshBalance();
      
      toast({
        title: "Aposta Realizada",
        description: `R$ ${amount.toFixed(2)} no Aviator`,
        duration: 1500,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao realizar aposta",
        variant: "destructive",
      });
    }
  };

  const handleCashout = async (panelId: number) => {
    const bet = activeBets.find(b => b.panelId === panelId);
    if (!bet) return;

    try {
      const response = await fetch("/api/games/aviator/cashout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ betId: bet.betId }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Falha ao sacar");
      }

      setCashedOutBets(prev => [...prev, { id: panelId, at: parseFloat(data.multiplier) }]);
      
      refreshBalance();
      
      const winAmount = parseFloat(data.winAmount);
      toast({
        title: "SAQUE REALIZADO!",
        description: `Você ganhou R$ ${winAmount.toFixed(2)}`,
        className: "bg-secondary text-black font-bold border-none"
      });
      
      setActiveBets(prev => prev.filter(b => b.panelId !== panelId));
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Falha ao sacar",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return <LoginRequiredScreen gameName="Aviator Mania" />;
  }

  if (!connected) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <span className="text-muted-foreground">Conectando ao jogo...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Aviator Mania</h1>
          <div className="flex items-center gap-3">
            <ProvablyFairModal provablyFair={provablyFair} nextServerSeedHash={nextServerSeedHash} />
            {user && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03]">
                <Wallet className="w-4 h-4 text-green-500" />
                <span className="text-green-500 font-bold text-sm">R$</span>
                <span className="font-bold text-white">
                  {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-4">
            <HistoryBar history={history} />
            
            <div className="min-h-[280px] w-full relative aspect-[16/9] max-h-[45vh] bg-card rounded-2xl overflow-hidden border border-white/5">
              <GameCanvas gameState={gameState} multiplier={multiplier} countdown={countdown} showCrashMessage={showCrashMessage} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BettingPanel 
                id={1} 
                gameState={gameState} 
                currentMultiplier={multiplier}
                isBetting={activeBets.some(b => b.panelId === 1)}
                cashedOutAt={cashedOutBets.find(b => b.id === 1)?.at || null}
                onBet={(amount) => handleBet(1, amount)}
                onCashout={() => handleCashout(1)}
                balance={balance}
              />
              <BettingPanel 
                id={2} 
                gameState={gameState} 
                currentMultiplier={multiplier}
                isBetting={activeBets.some(b => b.panelId === 2)}
                cashedOutAt={cashedOutBets.find(b => b.id === 2)?.at || null}
                onBet={(amount) => handleBet(2, amount)}
                onCashout={() => handleCashout(2)}
                balance={balance}
              />
            </div>
          </div>

          <div className="w-full lg:w-80 bg-card rounded-2xl border border-white/5 flex flex-col min-h-[500px]">
            <Tabs defaultValue="all" className="flex-1 flex flex-col w-full">
              <div className="px-3 pt-3 pb-0 bg-card z-10 rounded-t-2xl">
                <TabsList className="w-full bg-black/40 border border-white/5 h-10 p-1 grid grid-cols-2">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-card data-[state=active]:text-foreground text-xs font-bold uppercase tracking-wider h-8"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Apostas
                  </TabsTrigger>
                  <TabsTrigger 
                    value="top" 
                    className="data-[state=active]:bg-card data-[state=active]:text-foreground text-xs font-bold uppercase tracking-wider h-8"
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    Top Ganhos
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="px-4 py-2 flex justify-between text-[10px] text-muted-foreground font-bold uppercase tracking-widest border-b border-white/5 bg-card/50">
                <span className="w-24">Usuário</span>
                <div className="flex gap-2 flex-1 justify-end">
                   <span className="w-14 text-right">Aposta</span>
                   <span className="w-14 text-right">Mult.</span>
                   <span className="w-16 text-right">Lucro</span>
                </div>
              </div>

              <TabsContent value="all" className="flex-1 mt-0 relative overflow-hidden">
                <ScrollArea className="h-full w-full">
                  <div className="flex flex-col pb-4">
                    {roundBets.length === 0 ? (
                      <div className="flex items-center justify-center px-4 py-8 text-sm text-muted-foreground">
                        Nenhuma aposta nesta rodada
                      </div>
                    ) : (
                      roundBets.map((bet) => (
                        <div 
                          key={bet.id} 
                          className={cn(
                            "flex justify-between items-center px-4 py-1.5 text-sm border-b border-white/5 transition-colors group hover:bg-white/5",
                            bet.status === "won" ? "bg-secondary/5 border-secondary/10" : "bg-transparent"
                          )}
                        >
                          <div className="flex items-center gap-2 w-24 overflow-hidden">
                            <Avatar className="w-6 h-6 rounded-full border border-white/10 shrink-0">
                              <AvatarFallback className="text-[9px] font-bold bg-green-600 text-white rounded-full">
                                {getInitials(bet.userName || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <span className="text-white font-bold text-xs truncate">{maskName(bet.userName || "")}</span>
                              <span className="text-[9px] text-muted-foreground">Nv. {bet.userLevel || 1}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-1 justify-end items-center">
                             <span className="font-mono text-white/60 text-[10px] w-14 text-right truncate">
                               {parseFloat(bet.betAmount).toFixed(2)}
                             </span>
                             <span className={cn(
                               "font-mono text-[10px] w-14 text-right font-bold truncate", 
                               bet.cashedOutAt ? "text-secondary" : "text-muted-foreground/30"
                             )}>
                               {bet.cashedOutAt ? `${parseFloat(bet.cashedOutAt).toFixed(2)}x` : "-"}
                             </span>
                             <span className={cn(
                               "font-mono text-[10px] w-16 text-right font-bold truncate",
                               bet.profit ? "text-white" : "text-muted-foreground/30"
                             )}>
                                {bet.profit ? parseFloat(bet.profit).toFixed(2) : "-"}
                             </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="top" className="flex-1 mt-0 relative overflow-hidden">
                 <ScrollArea className="h-full w-full">
                  <div className="flex flex-col pb-4">
                    {topWins.length === 0 ? (
                      <div className="flex items-center justify-center px-4 py-8 text-sm text-muted-foreground">
                        Nenhum ganho registrado ainda
                      </div>
                    ) : (
                      topWins.map((win, index) => {
                         let crownColor = "text-muted-foreground";
                         if (index === 0) crownColor = "text-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.5)]";
                         else if (index === 1) crownColor = "text-slate-300 drop-shadow-[0_0_5px_rgba(203,213,225,0.5)]";
                         else if (index === 2) crownColor = "text-orange-400 drop-shadow-[0_0_5px_rgba(251,146,60,0.5)]";
                         else crownColor = "text-white/20";

                         return (
                          <div 
                            key={win.id} 
                            className="flex justify-between items-center px-4 py-2 text-sm border-b border-white/5 bg-secondary/5 hover:bg-secondary/10 transition-colors"
                          >
                            <div className="flex items-center gap-2 w-24 overflow-hidden">
                              <div className="relative shrink-0 pt-2 pr-1">
                                <Avatar className={cn("w-7 h-7 rounded-full shrink-0", index < 3 ? "ring-2 ring-offset-1 ring-offset-black/50" : "", 
                                   index === 0 ? "ring-yellow-400" : index === 1 ? "ring-slate-300" : index === 2 ? "ring-orange-400" : "")}>
                                  <AvatarFallback className="text-[10px] font-bold bg-green-600 text-white rounded-full">
                                    {getInitials(win.userName || "")}
                                  </AvatarFallback>
                                </Avatar>
                                {index < 3 && (
                                  <Crown className={cn("absolute -top-0.5 -right-0.5 w-4 h-4 fill-current rotate-12", crownColor)} />
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-white font-bold text-xs truncate">{maskName(win.userName || "")}</span>
                                <span className="text-[9px] text-muted-foreground">Nv. {win.userLevel || 1}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 flex-1 justify-end items-center">
                               <span className="font-mono text-white/60 text-[10px] w-14 text-right truncate">
                                 {parseFloat(win.betAmount).toFixed(2)}
                               </span>
                               <span className="font-mono text-[10px] w-14 text-right font-bold text-yellow-500 truncate">
                                 {win.cashedOutAt ? `${parseFloat(win.cashedOutAt).toFixed(2)}x` : "-"}
                               </span>
                               <span className="font-mono text-[10px] w-16 text-right font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] truncate">
                                  {win.profit ? parseFloat(win.profit).toFixed(2) : "-"}
                               </span>
                            </div>
                          </div>
                         );
                      })
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
