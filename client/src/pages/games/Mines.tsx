import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Gem, Bomb, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import generatedBackground from "@assets/generated_images/mysterious_background_for_mines_casino_game.png";

type TileState = 'hidden' | 'gem' | 'mine';

export default function Mines() {
    const [mineCount, setMineCount] = useState(3);
    const [betAmount, setBetAmount] = useState("10.00");
    const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER' | 'WON'>('IDLE');
    const [grid, setGrid] = useState<TileState[]>(Array(25).fill('hidden'));
    const [revealedCount, setRevealedCount] = useState(0);

    const startGame = () => {
        setGameState('PLAYING');
        setGrid(Array(25).fill('hidden'));
        setRevealedCount(0);
    };

    const handleTileClick = (index: number) => {
        if (gameState !== 'PLAYING' || grid[index] !== 'hidden') return;

        // Mock logic: 80% chance of gem if not pre-determined
        const isMine = Math.random() < (mineCount / 25);
        
        const newGrid = [...grid];
        if (isMine) {
            newGrid[index] = 'mine';
            setGameState('GAMEOVER');
            // Reveal all other mines
            setGrid(prev => prev.map((t, i) => i === index ? 'mine' : (Math.random() < mineCount/25 ? 'mine' : 'gem'))); 
        } else {
            newGrid[index] = 'gem';
            setRevealedCount(prev => prev + 1);
        }
        setGrid(newGrid);
    };

    const cashout = () => {
        setGameState('WON');
    };

    const currentMultiplier = (1 + (revealedCount * (mineCount * 0.1))).toFixed(2);
    const nextMultiplier = (1 + ((revealedCount + 1) * (mineCount * 0.1))).toFixed(2);

    return (
        <MainLayout>
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
                
                {/* Left: Controls */}
                <div className="lg:col-span-1 space-y-4 flex flex-col">
                    <Card className="bg-card/50 border-white/5 flex-1 flex flex-col p-6 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase">Valor da Aposta</Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    value={betAmount} 
                                    onChange={e => setBetAmount(e.target.value)}
                                    className="bg-background/50 border-white/10 pr-12 font-bold text-lg" 
                                    disabled={gameState === 'PLAYING'}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">BRL</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button disabled={gameState === 'PLAYING'} variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:bg-white/5" onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}>½</Button>
                                <Button disabled={gameState === 'PLAYING'} variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:bg-white/5" onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}>2x</Button>
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
                                        disabled={gameState === 'PLAYING'}
                                    >
                                        {num}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5">
                            {gameState === 'PLAYING' ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Próximo:</span>
                                        <span className="text-green-400 font-bold">{nextMultiplier}x</span>
                                    </div>
                                    <Button 
                                        className="w-full h-14 text-xl font-bold uppercase shadow-[0_0_20px_-5px_rgba(34,197,94,0.5)] bg-green-500 hover:bg-green-600 text-white"
                                        onClick={cashout}
                                    >
                                        Sacar R$ {(parseFloat(betAmount) * parseFloat(currentMultiplier)).toFixed(2)}
                                    </Button>
                                    <div className="text-center">
                                        <span className="text-xs text-muted-foreground">Multiplicador Atual: </span>
                                        <span className="text-lg font-bold text-primary">{currentMultiplier}x</span>
                                    </div>
                                </div>
                            ) : (
                                <Button 
                                    className="w-full h-14 text-xl font-bold uppercase shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] bg-primary hover:bg-primary/90"
                                    onClick={startGame}
                                >
                                    Jogar
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
                    
                    <div className="relative z-10 grid grid-cols-5 gap-3 md:gap-4 w-full max-w-lg aspect-square">
                        {grid.map((tile, i) => (
                            <button
                                key={i}
                                disabled={gameState !== 'PLAYING' || tile !== 'hidden'}
                                onClick={() => handleTileClick(i)}
                                className={cn(
                                    "rounded-xl transition-all duration-300 transform relative overflow-hidden group shadow-lg",
                                    tile === 'hidden' 
                                        ? "bg-secondary/40 hover:bg-secondary/60 hover:-translate-y-1 hover:shadow-primary/20 border border-white/5" 
                                        : "bg-[#0f0f15]/80 border border-white/10",
                                    tile === 'mine' && "bg-red-500/20 border-red-500/50",
                                    tile === 'gem' && "bg-green-500/20 border-green-500/50"
                                )}
                            >
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {tile === 'gem' && (
                                        <Gem className="w-8 h-8 md:w-12 md:h-12 text-green-400 animate-in zoom-in spin-in-12 duration-500 drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                                    )}
                                    {tile === 'mine' && (
                                        <Bomb className="w-8 h-8 md:w-12 md:h-12 text-red-500 animate-in zoom-in duration-300 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {gameState === 'GAMEOVER' && (
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in">
                            <div className="text-center p-8 bg-card border border-white/10 rounded-2xl shadow-2xl max-w-sm w-full mx-4">
                                <Bomb className="w-16 h-16 text-red-500 mx-auto mb-4" />
                                <h2 className="text-3xl font-heading font-bold text-white mb-2">BOOM!</h2>
                                <p className="text-muted-foreground mb-6">Você encontrou uma mina.</p>
                                <Button size="lg" className="w-full font-bold" onClick={() => setGameState('IDLE')}>Tentar Novamente</Button>
                            </div>
                        </div>
                    )}

                    {gameState === 'WON' && (
                         <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20 animate-in fade-in">
                            <div className="text-center p-8 bg-card border border-green-500/20 rounded-2xl shadow-2xl max-w-sm w-full mx-4 shadow-green-500/10">
                                <Coins className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                                <h2 className="text-3xl font-heading font-bold text-white mb-2">VITÓRIA!</h2>
                                <p className="text-green-400 font-bold text-xl mb-6">R$ {(parseFloat(betAmount) * parseFloat(currentMultiplier)).toFixed(2)}</p>
                                <Button size="lg" className="w-full font-bold bg-green-500 hover:bg-green-600" onClick={() => setGameState('IDLE')}>Jogar Novamente</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
