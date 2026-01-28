import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Volume2, VolumeX, Shield, ExternalLink, Loader2, Copy, Check, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getStoredAuthState } from "@/lib/authTokens";

import mineIcon from "@/assets/mines/mine-v4.png";
import gemIcon from "@/assets/mines/gold-v3.png";

type TileState = 'hidden' | 'gem' | 'mine' | 'loading';

interface GameState {
  betId: string;
  revealed: number[];
  mineCount: number;
  multiplier: number;
  nextMultiplier: number;
  status: "ACTIVE" | "WON" | "LOST";
  serverSeedHash?: string;
  serverSeed?: string;
  clientSeed?: string;
  nonce?: number;
}

function ProvablyFairModal({ gameState }: { gameState: GameState | null }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
          <Shield className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-white/10 max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Provably Fair - Mines
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Verifique a integridade e justiça de cada jogo usando criptografia.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Server Seed Hash (Atual)</Label>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] bg-black/40 p-2 rounded border border-white/5 text-white/70 break-all font-mono">
                {gameState?.serverSeedHash || "Inicie um jogo para ver"}
              </code>
              {gameState?.serverSeedHash && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 h-8 w-8"
                  onClick={() => copyToClipboard(gameState.serverSeedHash!, 'hash')}
                >
                  {copied === 'hash' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              )}
            </div>
          </div>

          {gameState?.serverSeed && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Server Seed (Última Rodada)</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] bg-black/40 p-2 rounded border border-white/5 text-white/70 break-all font-mono">
                  {gameState.serverSeed}
                </code>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 h-8 w-8"
                  onClick={() => copyToClipboard(gameState.serverSeed!, 'seed')}
                >
                  {copied === 'seed' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {gameState?.clientSeed && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Client Seed</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-[10px] bg-black/40 p-2 rounded border border-white/5 text-white/70 break-all font-mono">
                  {gameState.clientSeed}
                </code>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 h-8 w-8"
                  onClick={() => copyToClipboard(gameState.clientSeed!, 'client')}
                >
                  {copied === 'client' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}

          {gameState?.nonce !== undefined && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nonce</Label>
              <code className="block text-sm bg-black/40 p-2 rounded border border-white/5 text-white/70 font-mono">
                {gameState.nonce}
              </code>
            </div>
          )}

          <div className="pt-4 border-t border-white/5">
            <a
              href="https://provablyfair.io/mines"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Verificar Externamente
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
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

export default function Mines() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [mineCount, setMineCount] = useState(3);
  const [betAmount, setBetAmount] = useState("10.00");
  const [gameStatus, setGameStatus] = useState<'IDLE' | 'LOADING' | 'PLAYING' | 'GAMEOVER' | 'WON'>('IDLE');
  const [grid, setGrid] = useState<TileState[]>(Array(25).fill('hidden'));
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [winAmount, setWinAmount] = useState<number>(0);
  const [minePositions, setMinePositions] = useState<number[]>([]);
  const [loadingTile, setLoadingTile] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBalance();
      checkActiveGame();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <LoginRequiredScreen gameName="Mines" />;
  }

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
    };
  };

  const fetchBalance = async () => {
    try {
      const res = await fetch('/api/bets/balance', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance + data.bonusBalance);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const checkActiveGame = async () => {
    try {
      const res = await fetch('/api/games/mines/active', { headers: getAuthHeaders(), credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.active && data.game) {
          setGameState(data.game);
          setGameStatus('PLAYING');
          setBetAmount(data.betAmount || "10.00");
          setMineCount(data.game.mineCount);
          const newGrid = Array(25).fill('hidden') as TileState[];
          data.game.revealed.forEach((idx: number) => {
            newGrid[idx] = 'gem';
          });
          setGrid(newGrid);
        }
      }
    } catch (error) {
      console.error('Failed to check active game:', error);
    }
  };

  const startGame = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login necessário",
        description: "Faça login para jogar",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 1) {
      toast({
        title: "Valor inválido",
        description: "Aposta mínima é R$ 1,00",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "Saldo insuficiente",
        description: "Deposite mais para continuar jogando",
        variant: "destructive",
      });
      return;
    }

    setGameStatus('LOADING');
    setGrid(Array(25).fill('hidden'));
    setMinePositions([]);
    setWinAmount(0);

    try {
      const res = await fetch('/api/games/mines/start', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          betAmount: amount,
          mineCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Erro",
          description: data.error || "Erro ao iniciar jogo",
          variant: "destructive",
        });
        setGameStatus('IDLE');
        return;
      }

      setGameState(data.game);
      setGameStatus('PLAYING');
      fetchBalance();
    } catch (error) {
      console.error('Start game error:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
      setGameStatus('IDLE');
    }
  };

  const handleTileClick = async (index: number) => {
    if (gameStatus !== 'PLAYING' || !gameState || grid[index] !== 'hidden' || loadingTile !== null) return;

    setLoadingTile(index);
    const newGrid = [...grid];
    newGrid[index] = 'loading';
    setGrid(newGrid);

    try {
      const res = await fetch('/api/games/mines/reveal', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          betId: gameState.betId,
          tileIndex: index,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Erro",
          description: data.error || "Erro ao revelar campo",
          variant: "destructive",
        });
        newGrid[index] = 'hidden';
        setGrid(newGrid);
        setLoadingTile(null);
        return;
      }

      const game = data.game;

      if (game.hitMine) {
        newGrid[index] = 'mine';
        if (game.revealedMines) {
          game.revealedMines.forEach((mineIdx: number) => {
            if (mineIdx !== index) {
              newGrid[mineIdx] = 'mine';
            }
          });
          setMinePositions(game.revealedMines);
        }
        setGrid(newGrid);
        setGameState({ ...gameState, ...game });
        setGameStatus('GAMEOVER');
        fetchBalance();
      } else {
        newGrid[index] = 'gem';
        setGrid(newGrid);
        setGameState({ ...gameState, ...game });

        if (game.status === 'WON') {
          const amount = parseFloat(betAmount);
          setWinAmount(amount * game.multiplier);
          if (game.revealedMines) {
            game.revealedMines.forEach((mineIdx: number) => {
              newGrid[mineIdx] = 'mine';
            });
            setMinePositions(game.revealedMines);
          }
          setGrid(newGrid);
          setGameStatus('WON');
          fetchBalance();
        }
      }
    } catch (error) {
      console.error('Reveal tile error:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
      newGrid[index] = 'hidden';
      setGrid(newGrid);
    }

    setLoadingTile(null);
  };

  const cashout = async () => {
    if (!gameState) return;

    setGameStatus('LOADING');

    try {
      const res = await fetch('/api/games/mines/cashout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          betId: gameState.betId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Erro",
          description: data.error || "Erro ao sacar",
          variant: "destructive",
        });
        setGameStatus('PLAYING');
        return;
      }

      setWinAmount(data.winAmount);
      if (data.minePositions) {
        const newGrid = [...grid];
        data.minePositions.forEach((mineIdx: number) => {
          if (newGrid[mineIdx] === 'hidden') {
            newGrid[mineIdx] = 'mine';
          }
        });
        setMinePositions(data.minePositions);
        setGrid(newGrid);
      }
      setGameStatus('WON');
      fetchBalance();

      toast({
        title: "Parabéns!",
        description: `Você ganhou R$ ${data.winAmount.toFixed(2)}!`,
      });
    } catch (error) {
      console.error('Cashout error:', error);
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
      setGameStatus('PLAYING');
    }
  };

  const resetGame = () => {
    setGameStatus('IDLE');
    setGrid(Array(25).fill('hidden'));
    setGameState(null);
    setMinePositions([]);
    setWinAmount(0);
  };

  const adjustBet = (type: "half" | "double" | "max") => {
    if (gameStatus === 'PLAYING' || gameStatus === 'LOADING') return;
    const current = parseFloat(betAmount) || 10;
    if (type === "half") setBetAmount(Math.max(1, current / 2).toFixed(2));
    if (type === "double") setBetAmount(Math.min(balance, current * 2).toFixed(2));
    if (type === "max") setBetAmount(balance.toFixed(2));
  };

  const currentMultiplier = gameState?.multiplier || 1;
  const nextMultiplier = gameState?.nextMultiplier || 1;
  const revealedCount = gameState?.revealed?.length || 0;

  return (
    <MainLayout>
      <div className="w-full max-w-[1400px] mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white tracking-tight">Mines</h1>
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

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-72 bg-card rounded-2xl p-4 flex flex-col gap-4 border border-white/5 shrink-0">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Valor da Aposta</Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</div>
                <Input 
                  type="number" 
                  value={betAmount} 
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="pl-8 bg-black/40 border-white/5 text-white font-mono h-10 text-sm focus-visible:ring-primary focus-visible:border-primary"
                  disabled={gameStatus === 'PLAYING' || gameStatus === 'LOADING'}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => adjustBet("half")} 
                    disabled={gameStatus === 'PLAYING' || gameStatus === 'LOADING'} 
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-white"
                  >
                    ½
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => adjustBet("double")} 
                    disabled={gameStatus === 'PLAYING' || gameStatus === 'LOADING'} 
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-white"
                  >
                    2x
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Minas</Label>
                <span className="font-mono text-white bg-black/40 px-2 py-0.5 rounded text-xs border border-white/5">{mineCount}</span>
              </div>
              <Slider
                value={[mineCount]}
                onValueChange={([val]) => setMineCount(val)}
                min={1}
                max={24}
                step={1}
                disabled={gameStatus === 'PLAYING' || gameStatus === 'LOADING'}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>1</span>
                <span>24</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {[1, 3, 5, 10].map(num => (
                <Button
                  key={num}
                  variant={mineCount === num ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 text-xs font-bold",
                    mineCount === num 
                      ? "bg-primary text-primary-foreground" 
                      : "border-white/10 bg-black/40 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                  onClick={() => setMineCount(num)}
                  disabled={gameStatus === 'PLAYING' || gameStatus === 'LOADING'}
                >
                  {num}
                </Button>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Gemas para Ganhar</span>
                <span className="text-white font-mono">{25 - mineCount}</span>
              </div>
              {gameStatus === 'PLAYING' && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Multiplicador Atual</span>
                    <span className="text-primary font-bold font-mono">{currentMultiplier.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Próximo</span>
                    <span className="text-green-400 font-bold font-mono">{nextMultiplier.toFixed(2)}x</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-auto pt-4">
              {gameStatus === 'PLAYING' ? (
                <Button 
                  className="w-full h-12 text-lg font-bold uppercase bg-green-500 hover:bg-green-600 text-white shadow-[0_0_20px_-5px_rgba(34,197,94,0.5)]"
                  onClick={cashout}
                  disabled={revealedCount === 0 || loadingTile !== null}
                >
                  {loadingTile !== null ? (
                    <Loader2 className="animate-spin mr-2 w-5 h-5" />
                  ) : null}
                  Sacar R$ {(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
                </Button>
              ) : gameStatus === 'LOADING' ? (
                <Button className="w-full h-12 text-lg font-bold uppercase" disabled>
                  <Loader2 className="animate-spin mr-2 w-5 h-5" />
                  Carregando...
                </Button>
              ) : (
                <Button 
                  className="w-full h-12 text-lg font-bold uppercase bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)]"
                  onClick={startGame}
                  disabled={!isAuthenticated}
                >
                  {isAuthenticated ? 'APOSTAR' : 'Faça Login'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex-1 relative">
            <div className="bg-card rounded-2xl border border-white/5 p-4 md:p-6 relative overflow-hidden">
              <div className="grid grid-cols-5 gap-2 md:gap-3 max-w-lg mx-auto aspect-square">
                {grid.map((tile, i) => (
                  <motion.button
                    key={i}
                    whileHover={tile === 'hidden' && gameStatus === 'PLAYING' ? { scale: 1.05 } : {}}
                    whileTap={tile === 'hidden' && gameStatus === 'PLAYING' ? { scale: 0.95 } : {}}
                    disabled={gameStatus !== 'PLAYING' || tile !== 'hidden' || loadingTile !== null}
                    onClick={() => handleTileClick(i)}
                    className={cn(
                      "rounded-xl transition-all duration-200 relative overflow-hidden aspect-square",
                      "flex items-center justify-center",
                      tile === 'hidden' 
                        ? "bg-secondary/60 hover:bg-secondary/80 border-2 border-white/10 hover:border-primary/50 cursor-pointer shadow-lg hover:shadow-primary/20" 
                        : "bg-black/60 border-2",
                      tile === 'mine' && "border-red-500/50 bg-red-500/10",
                      tile === 'gem' && "border-green-500/50 bg-green-500/10",
                      tile === 'loading' && "border-primary/50 bg-primary/10"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {tile === 'gem' && (
                        <motion.img
                          key="gem"
                          src={gemIcon}
                          alt="Gem"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="w-3/4 h-3/4 object-contain drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]"
                        />
                      )}
                      {tile === 'mine' && (
                        <motion.img
                          key="mine"
                          src={mineIcon}
                          alt="Mine"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                          className="w-3/4 h-3/4 object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]"
                        />
                      )}
                      {tile === 'loading' && (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                ))}
              </div>

              <AnimatePresence>
                {gameStatus === 'WON' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl"
                  >
                    <div className="bg-card border border-green-500/30 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full mx-4">
                      <div className="text-5xl font-bold text-green-500">{currentMultiplier.toFixed(2)}x</div>
                      <div className="text-xl text-white font-medium">Você ganhou R$ {winAmount.toFixed(2)}</div>
                      <Button 
                        onClick={resetGame} 
                        className="bg-green-500 hover:bg-green-600 text-white w-full h-12 text-lg font-bold"
                      >
                        JOGAR NOVAMENTE
                      </Button>
                    </div>
                  </motion.div>
                )}
                {gameStatus === 'GAMEOVER' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl"
                  >
                    <div className="bg-card border border-red-500/30 p-8 rounded-2xl flex flex-col items-center gap-4 shadow-2xl max-w-sm w-full mx-4">
                      <motion.img
                        src={mineIcon}
                        alt="Boom"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="w-20 h-20 object-contain drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                      />
                      <div className="text-3xl font-bold text-red-500">BOOM!</div>
                      <div className="text-muted-foreground">Você encontrou uma mina</div>
                      <Button 
                        onClick={resetGame} 
                        variant="secondary" 
                        className="w-full h-12 text-lg font-bold bg-secondary hover:bg-secondary/80"
                      >
                        TENTAR NOVAMENTE
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="text-muted-foreground hover:text-white"
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </Button>
                <ProvablyFairModal gameState={gameState} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
