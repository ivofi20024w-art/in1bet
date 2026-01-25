import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { SpinWheel } from "@/components/double/SpinWheel";
import { ResultsStrip } from "@/components/double/ResultsStrip";
import { BetControls } from "@/components/double/BetControls";
import { BettingColumns } from "@/components/double/BettingColumns";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";
import { Loader2, AlertCircle, Wallet, Shield, Clock, Trophy, Zap, ExternalLink, LogIn } from "lucide-react";
import type { DoubleBetType, DoubleGameState, DoubleSpinState, DoubleGamePhase } from "@shared/schema";
import { multipliers } from "@/lib/game-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type ExtendedGameState = DoubleGameState & DoubleSpinState;

function GamePhaseStatus({ gamePhase, bettingTimeRemaining, canBet, lastResult }: { 
  gamePhase: DoubleGamePhase; 
  bettingTimeRemaining: number; 
  canBet: boolean;
  lastResult: DoubleBetType | null;
}) {
  const colorNames: Record<DoubleBetType, string> = {
    red: "Vermelho",
    green: "Verde", 
    black: "Preto",
    crown: "Coroa"
  };
  
  const colorClasses: Record<DoubleBetType, string> = {
    red: "text-red-500",
    green: "text-green-500",
    black: "text-white",
    crown: "text-yellow-500"
  };
  
  const bgColorClasses: Record<DoubleBetType, string> = {
    red: "from-red-500/20 via-red-600/10 to-red-500/20 border-red-500/40",
    green: "from-green-500/20 via-green-600/10 to-green-500/20 border-green-500/40",
    black: "from-gray-500/20 via-gray-600/10 to-gray-500/20 border-gray-400/40",
    crown: "from-yellow-500/20 via-yellow-600/10 to-yellow-500/20 border-yellow-500/40"
  };

  if (gamePhase === "SHOWING_RESULT" && lastResult) {
    return (
      <div className={`relative overflow-hidden flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r ${bgColorClasses[lastResult]} border shadow-lg`}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
        <Trophy className="w-5 h-5 text-yellow-400" />
        <span className="text-base font-bold tracking-wide">
          <span className={`${colorClasses[lastResult]} drop-shadow-lg`}>{colorNames[lastResult]}</span>
          <span className="text-white/80 ml-1.5">venceu!</span>
        </span>
      </div>
    );
  }

  if (gamePhase === "BETTING") {
    const isLocked = !canBet;
    return (
      <div className={`relative overflow-hidden flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl border shadow-lg ${
        isLocked 
          ? "bg-gradient-to-r from-red-500/15 via-orange-500/10 to-red-500/15 border-red-500/40"
          : "bg-gradient-to-r from-green-500/15 via-emerald-500/10 to-green-500/15 border-green-500/40"
      }`}>
        {!isLocked && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent" />}
        <Clock className={`w-5 h-5 ${isLocked ? "text-red-400" : "text-green-400"}`} />
        {isLocked ? (
          <span className="text-base font-bold text-red-400 tracking-wide">Apostas encerradas</span>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-green-400">Façam as suas apostas...</span>
            <span className="text-xl font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-lg">{bettingTimeRemaining}s</span>
          </div>
        )}
      </div>
    );
  }

  if (gamePhase === "SPINNING") {
    return (
      <div className="relative overflow-hidden flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-500/15 via-pink-500/10 to-purple-500/15 border border-purple-500/40 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/10 to-transparent animate-pulse" />
        <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-base font-bold text-purple-300 tracking-wide">Girando...</span>
      </div>
    );
  }

  return null;
}

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

function ProvablyFairModal({ gameState }: { gameState: ExtendedGameState }) {
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
            <h4 className="font-bold text-white mb-2">Rodada Atual</h4>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Server Seed Hash:</span>
                <code className="block mt-1 p-2 rounded bg-black/30 text-xs text-green-400 break-all">
                  {gameState.serverSeedHash || "Aguardando..."}
                </code>
              </div>
            </div>
          </div>
          
          {gameState.previousServerSeed && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="font-bold text-white mb-2">Última Rodada (Verificável)</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-muted-foreground">Server Seed:</span>
                  <code className="block mt-1 p-2 rounded bg-black/30 text-xs text-yellow-400 break-all">
                    {gameState.previousServerSeed}
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground">Client Seed:</span>
                  <code className="block mt-1 p-2 rounded bg-black/30 text-xs text-blue-400 break-all">
                    {gameState.previousClientSeed}
                  </code>
                </div>
                <div>
                  <span className="text-muted-foreground">Nonce:</span>
                  <code className="block mt-1 p-2 rounded bg-black/30 text-xs text-purple-400">
                    {gameState.previousNonce}
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
              <li>Converta para número decimal</li>
              <li>Divida por 99 (tamanho da roda) - o resto é o índice vencedor</li>
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

export default function Double() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [betAmount, setBetAmount] = useState(10);
  const lastCompletedSpinRef = useRef<string | null>(null);
  
  const { data: gameState, isLoading, error } = useQuery<ExtendedGameState>({
    queryKey: ["double", "game"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/games/double/game");
      return res.json();
    },
    refetchInterval: 500,
  });
  
  const { data: walletData } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/wallet");
      return res.json();
    },
    enabled: !!user,
  });
  
  const balance = walletData?.wallet?.balance ? parseFloat(walletData.wallet.balance) : 0;
  
  const handleSpinComplete = () => {
    if (gameState?.spinId) {
      lastCompletedSpinRef.current = gameState.spinId;
    }
    queryClient.invalidateQueries({ queryKey: ["double", "game"] });
    queryClient.invalidateQueries({ queryKey: ["wallet"] });
  };
  
  const placeBetMutation = useMutation({
    mutationFn: async ({ type, amount }: { type: DoubleBetType; amount: number }) => {
      const response = await apiRequest("POST", "/api/games/double/bet", { type, amount });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["double", "game"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      const multiplier = multipliers[variables.type];
      const typeNames: Record<DoubleBetType, string> = {
        red: "Vermelho",
        green: "Verde",
        black: "Preto",
        crown: "Coroa"
      };
      toast.success(`Aposta em ${typeNames[variables.type]}`, {
        description: `R$ ${variables.amount.toFixed(2)} a ${multiplier}x`,
      });
    },
    onError: (error: Error) => {
      toast.error("Aposta falhou", {
        description: error.message || "Não foi possível fazer a aposta",
      });
    },
  });
  
  const handlePlaceBet = (type: DoubleBetType) => {
    if (!user) {
      toast.error("Faça login para apostar");
      return;
    }
    
    if (!gameState) return;
    
    if (!gameState.canBet) {
      toast.error("Apostas fechadas", {
        description: "Aguarde a próxima rodada para apostar.",
      });
      return;
    }
    
    if (betAmount > balance) {
      toast.error("Saldo insuficiente", {
        description: "Você não tem saldo suficiente para esta aposta.",
      });
      return;
    }
    
    if (betAmount < 0.01) {
      toast.error("Aposta inválida", {
        description: "Aposta mínima é R$ 0,01",
      });
      return;
    }
    
    placeBetMutation.mutate({ type, amount: betAmount });
  };
  
  if (!isAuthenticated) {
    return <LoginRequiredScreen gameName="Double" />;
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
            <span className="text-muted-foreground">Carregando o jogo...</span>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (error || !gameState) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-xl font-bold text-white">Erro ao carregar o jogo</h2>
            <p className="text-muted-foreground">Por favor, atualize a página.</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Double</h1>
          <div className="flex items-center gap-3">
            <ProvablyFairModal gameState={gameState} />
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
        
        <div className="mb-4">
          <GamePhaseStatus 
            gamePhase={gameState.gamePhase}
            bettingTimeRemaining={gameState.bettingTimeRemaining}
            canBet={gameState.canBet}
            lastResult={gameState.lastResult}
          />
        </div>
        
        <SpinWheel 
          isSpinning={gameState.isSpinning}
          winningType={gameState.pendingResult}
          stopIndex={gameState.stopIndex}
          spinId={gameState.spinId}
          spinStartTime={gameState.spinStartTime}
          spinDuration={gameState.spinDuration}
          onSpinComplete={handleSpinComplete}
        />
        
        <div className="mt-4">
          <ResultsStrip 
            previousRounds={gameState.previousRounds} 
            last100Stats={gameState.last100Stats} 
          />
        </div>
        
        <BetControls 
          betAmount={betAmount} 
          onBetAmountChange={setBetAmount}
          balance={balance}
          disabled={!gameState.canBet}
        />
        
        <BettingColumns 
          bets={gameState.bets} 
          onPlaceBet={handlePlaceBet}
          disabled={!gameState.canBet}
        />
      </div>
    </MainLayout>
  );
}
