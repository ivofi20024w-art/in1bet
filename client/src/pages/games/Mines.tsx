import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Gem, Bomb, Coins, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import generatedBackground from "@assets/generated_images/mysterious_background_for_mines_casino_game.png";

type TileState = 'hidden' | 'gem' | 'mine' | 'loading';

interface GameState {
  betId: string;
  revealed: number[];
  mineCount: number;
  multiplier: number;
  nextMultiplier: number;
  status: "ACTIVE" | "WON" | "LOST";
  serverSeedHash?: string;
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

    useEffect(() => {
        if (isAuthenticated) {
            fetchBalance();
            checkActiveGame();
        }
    }, [isAuthenticated]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };
    };

    const fetchBalance = async () => {
        try {
            const res = await fetch('/api/bets/balance', { headers: getAuthHeaders() });
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
            const res = await fetch('/api/games/mines/active', { headers: getAuthHeaders() });
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

    const currentMultiplier = gameState?.multiplier || 1;
    const nextMultiplier = gameState?.nextMultiplier || 1;
    const revealedCount = gameState?.revealed?.length || 0;

    return (
        <MainLayout>
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
                
                {/* Left: Controls */}
                <div className="lg:col-span-1 space-y-4 flex flex-col">
                    <Card className="bg-card/50 border-white/5 flex-1 flex flex-col p-6 space-y-6">
                        {isAuthenticated && (
                            <div className="text-center py-2 bg-background/50 rounded-lg border border-white/5">
                                <span className="text-xs text-muted-foreground">Saldo Disponível</span>
                                <p className="text-xl font-bold text-primary">R$ {balance.toFixed(2)}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase">Valor da Aposta</Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    value={betAmount} 
                                    onChange={e => setBetAmount(e.target.value)}
                                    className="bg-background/50 border-white/10 pr-12 font-bold text-lg" 
                                    disabled={gameStatus === 'PLAYING' || gameStatus === 'LOADING'}
                                    data-testid="input-bet-amount"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">BRL</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    disabled={gameStatus === 'PLAYING' || gameStatus === 'LOADING'} 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs border-white/10 hover:bg-white/5" 
                                    onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                                    data-testid="button-half-bet"
                                >
                                    ½
                                </Button>
                                <Button 
                                    disabled={gameStatus === 'PLAYING' || gameStatus === 'LOADING'} 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs border-white/10 hover:bg-white/5" 
                                    onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                                    data-testid="button-double-bet"
                                >
                                    2x
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase">Número de Minas</Label>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 3, 5, 24].map(num => (
                                    <Button
                                        key={num}
                                        variant={mineCount === num ? "default" : "outline"}
                                        className={cn("h-10 font-bold", mineCount !== num && "border-white/10 bg-transparent")}
                                        onClick={() => setMineCount(num)}
                                        disabled={gameStatus === 'PLAYING' || gameStatus === 'LOADING'}
                                        data-testid={`button-mines-${num}`}
                                    >
                                        {num}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {gameState?.serverSeedHash && gameStatus === 'PLAYING' && (
                            <div className="text-xs text-muted-foreground bg-background/30 p-2 rounded border border-white/5">
                                <p className="font-mono break-all">
                                    Seed: {gameState.serverSeedHash.slice(0, 16)}...
                                </p>
                            </div>
                        )}

                        <div className="mt-auto pt-6 border-t border-white/5">
                            {gameStatus === 'PLAYING' ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Próximo:</span>
                                        <span className="text-green-400 font-bold">{nextMultiplier.toFixed(2)}x</span>
                                    </div>
                                    <Button 
                                        className="w-full h-14 text-xl font-bold uppercase shadow-[0_0_20px_-5px_rgba(34,197,94,0.5)] bg-green-500 hover:bg-green-600 text-white"
                                        onClick={cashout}
                                        disabled={revealedCount === 0 || loadingTile !== null}
                                        data-testid="button-cashout"
                                    >
                                        {loadingTile !== null ? (
                                            <Loader2 className="animate-spin mr-2" />
                                        ) : null}
                                        Sacar R$ {(parseFloat(betAmount) * currentMultiplier).toFixed(2)}
                                    </Button>
                                    <div className="text-center">
                                        <span className="text-xs text-muted-foreground">Multiplicador Atual: </span>
                                        <span className="text-lg font-bold text-primary">{currentMultiplier.toFixed(2)}x</span>
                                    </div>
                                </div>
                            ) : gameStatus === 'LOADING' ? (
                                <Button 
                                    className="w-full h-14 text-xl font-bold uppercase"
                                    disabled
                                >
                                    <Loader2 className="animate-spin mr-2" />
                                    Carregando...
                                </Button>
                            ) : (
                                <Button 
                                    className="w-full h-14 text-xl font-bold uppercase shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] bg-primary hover:bg-primary/90"
                                    onClick={startGame}
                                    disabled={!isAuthenticated}
                                    data-testid="button-start-game"
                                >
                                    {isAuthenticated ? 'Jogar' : 'Faça Login'}
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right: Game Grid */}
                <div className="lg:col-span-3 relative bg-[#0f0f15] rounded-2xl border border-white/5 overflow-hidden shadow-2xl flex items-center justify-center p-8">
                     {/* Background Image */}
                     <div 
                        className="absolute inset-0 opacity-40 bg-cover bg-center"
                        style={{ backgroundImage: `url(${generatedBackground})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-transparent to-transparent" />
                    
                    {!isAuthenticated && gameStatus === 'IDLE' && (
                        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-20">
                            <div className="text-center p-8">
                                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold text-white mb-2">Login Necessário</h2>
                                <p className="text-muted-foreground mb-4">Faça login para jogar Mines</p>
                            </div>
                        </div>
                    )}

                    <div className="relative z-10 grid grid-cols-5 gap-3 md:gap-4 w-full max-w-lg aspect-square">
                        {grid.map((tile, i) => (
                            <button
                                key={i}
                                disabled={gameStatus !== 'PLAYING' || tile !== 'hidden' || loadingTile !== null}
                                onClick={() => handleTileClick(i)}
                                className={cn(
                                    "rounded-xl transition-all duration-300 transform relative overflow-hidden group shadow-lg",
                                    tile === 'hidden' 
                                        ? "bg-secondary/40 hover:bg-secondary/60 hover:-translate-y-1 hover:shadow-primary/20 border border-white/5" 
                                        : "bg-[#0f0f15]/80 border border-white/10",
                                    tile === 'mine' && "bg-red-500/20 border-red-500/50",
                                    tile === 'gem' && "bg-green-500/20 border-green-500/50",
                                    tile === 'loading' && "bg-primary/20 border-primary/50"
                                )}
                                data-testid={`tile-${i}`}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {tile === 'gem' && (
                                        <Gem className="w-8 h-8 md:w-12 md:h-12 text-green-400 animate-in zoom-in spin-in-12 duration-500 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                                    )}
                                    {tile === 'mine' && (
                                        <Bomb className="w-8 h-8 md:w-12 md:h-12 text-red-500 animate-in zoom-in duration-300 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                    )}
                                    {tile === 'loading' && (
                                        <Loader2 className="w-8 h-8 md:w-12 md:h-12 text-primary animate-spin" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {gameStatus === 'GAMEOVER' && (
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in">
                            <div className="text-center p-8 bg-card border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
                                <Bomb className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                <h2 className="text-3xl font-heading font-bold text-white mb-2" data-testid="text-game-over">BOOM!</h2>
                                <p className="text-muted-foreground mb-2">Você encontrou uma mina.</p>
                                <p className="text-red-400 font-bold mb-6">-R$ {parseFloat(betAmount).toFixed(2)}</p>
                                <Button 
                                    size="lg" 
                                    className="w-full font-bold" 
                                    onClick={resetGame}
                                    data-testid="button-try-again"
                                >
                                    Tentar Novamente
                                </Button>
                            </div>
                        </div>
                    )}

                    {gameStatus === 'WON' && (
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in">
                            <div className="text-center p-8 bg-card border border-green-500/20 rounded-2xl shadow-2xl max-w-sm w-full mx-4 shadow-green-500/10">
                                <Coins className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                <h2 className="text-3xl font-heading font-bold text-white mb-2" data-testid="text-victory">VITÓRIA!</h2>
                                <p className="text-green-400 font-bold text-xl mb-2">+R$ {winAmount.toFixed(2)}</p>
                                <p className="text-muted-foreground mb-6 text-sm">
                                    Multiplicador: {currentMultiplier.toFixed(2)}x
                                </p>
                                <Button 
                                    size="lg" 
                                    className="w-full font-bold bg-green-500 hover:bg-green-600" 
                                    onClick={resetGame}
                                    data-testid="button-play-again"
                                >
                                    Jogar Novamente
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
