import { useState, useEffect, useRef, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import plinkoBg from "@assets/generated_images/neon_plinko_game_background_with_pyramid_structure.png";
import { Play, RotateCw, Loader2, History, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePlinkoMultipliers, usePlinkoHistory, usePlayPlinko, PlinkoRisk, PlinkoRows, PlinkoBet } from "@/hooks/usePlinko";

const COLORS = {
    LOW: "from-green-500 to-green-700",
    MEDIUM: "from-yellow-500 to-yellow-700",
    HIGH: "from-red-500 to-red-700"
};

interface AnimatedBall {
    id: string;
    path: number[];
    currentStep: number;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    color: string;
    finalBucket: number;
    multiplier: number;
    winAmount: number;
    complete: boolean;
}

export default function Plinko() {
    const { user, isAuthenticated } = useAuth();
    const [betAmount, setBetAmount] = useState("10.00");
    const [risk, setRisk] = useState<PlinkoRisk>("MEDIUM");
    const [rows, setRows] = useState<PlinkoRows>(8);
    const [animatedBalls, setAnimatedBalls] = useState<AnimatedBall[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    
    const { data: multipliers = [] } = usePlinkoMultipliers(risk, rows);
    const { data: history = [] } = usePlinkoHistory();
    const playPlinko = usePlayPlinko();
    
    const getCanvasDimensions = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return { width: 800, height: 600, startY: 60, gapX: 50, gapY: 45 };
        
        const width = canvas.width;
        const height = canvas.height;
        const startY = 60;
        const gapX = Math.min(50, (width - 100) / rows);
        const gapY = Math.min(45, (height - startY - 100) / rows);
        
        return { width, height, startY, gapX, gapY };
    }, [rows]);
    
    const getPinPosition = useCallback((row: number, col: number) => {
        const { width, startY, gapX, gapY } = getCanvasDimensions();
        const x = (width / 2) - (row * gapX / 2) + (col * gapX);
        const y = startY + (row * gapY);
        return { x, y };
    }, [getCanvasDimensions]);
    
    const handlePlay = async () => {
        if (!isAuthenticated) {
            toast.error("Faça login para jogar");
            return;
        }
        
        const bet = parseFloat(betAmount);
        if (isNaN(bet) || bet < 1) {
            toast.error("Aposta mínima: R$ 1,00");
            return;
        }
        
        if (bet > 10000) {
            toast.error("Aposta máxima: R$ 10.000,00");
            return;
        }
        
        setIsPlaying(true);
        
        try {
            const result = await playPlinko.mutateAsync({ betAmount: bet, risk, rows });
            
            if (result.success && result.bet) {
                const bet = result.bet as PlinkoBet;
                const { width, startY, gapX } = getCanvasDimensions();
                
                const newBall: AnimatedBall = {
                    id: bet.betId,
                    path: bet.path,
                    currentStep: -1,
                    x: width / 2,
                    y: 20,
                    targetX: width / 2,
                    targetY: 20,
                    color: risk === "HIGH" ? "#ef4444" : risk === "MEDIUM" ? "#eab308" : "#22c55e",
                    finalBucket: bet.bucket,
                    multiplier: bet.multiplier,
                    winAmount: bet.winAmount,
                    complete: false,
                };
                
                setAnimatedBalls(prev => [...prev, newBall]);
                
                if (bet.multiplier >= 1) {
                    setTimeout(() => {
                        toast.success(`Ganhou R$ ${bet.winAmount.toFixed(2)}! (${bet.multiplier}x)`);
                    }, (bet.path.length + 1) * 150);
                } else {
                    setTimeout(() => {
                        toast.error(`Perdeu! Multiplicador: ${bet.multiplier}x`);
                    }, (bet.path.length + 1) * 150);
                }
            } else {
                toast.error(result.error || "Erro ao jogar");
            }
        } catch (error: any) {
            toast.error(error.message || "Erro ao jogar");
        } finally {
            setIsPlaying(false);
        }
    };
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        const { width, height, startY, gapX, gapY } = getCanvasDimensions();
        
        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
            const pinRadius = 5;
            
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c <= r; c++) {
                    const { x, y } = getPinPosition(r, c);
                    ctx.beginPath();
                    ctx.arc(x, y, pinRadius, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            
            setAnimatedBalls(prevBalls => {
                return prevBalls.map(ball => {
                    if (ball.complete) return ball;
                    
                    const dx = ball.targetX - ball.x;
                    const dy = ball.targetY - ball.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < 2) {
                        if (ball.currentStep < ball.path.length - 1) {
                            const nextStep = ball.currentStep + 1;
                            const direction = ball.path[nextStep];
                            
                            let positionAtRow = 0;
                            for (let i = 0; i <= nextStep; i++) {
                                positionAtRow += ball.path[i];
                            }
                            
                            const { x: targetX, y: targetY } = getPinPosition(nextStep, positionAtRow);
                            
                            return {
                                ...ball,
                                currentStep: nextStep,
                                targetX: targetX + (direction === 0 ? -gapX/4 : gapX/4),
                                targetY: targetY + gapY * 0.7,
                            };
                        } else if (!ball.complete) {
                            return { ...ball, complete: true };
                        }
                    }
                    
                    const speed = 0.15;
                    return {
                        ...ball,
                        x: ball.x + dx * speed,
                        y: ball.y + dy * speed,
                    };
                }).filter(ball => {
                    if (ball.complete) {
                        return Date.now() - parseInt(ball.id.split("-")[0] || "0") < 3000;
                    }
                    return true;
                });
            });
            
            animatedBalls.forEach(ball => {
                ctx.beginPath();
                ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
                ctx.fillStyle = ball.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = ball.color;
                ctx.fill();
                ctx.shadowBlur = 0;
            });
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animationRef.current = requestAnimationFrame(animate);
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [rows, animatedBalls, getCanvasDimensions, getPinPosition]);
    
    const renderMultipliers = () => {
        if (!multipliers.length) return null;
        
        return (
            <div className="flex justify-center gap-1 mt-2 relative z-10 px-4">
                {multipliers.map((m, i) => (
                    <div 
                        key={i} 
                        data-testid={`multiplier-bucket-${i}`}
                        className={cn(
                            "flex items-center justify-center rounded-md font-bold text-[10px] md:text-xs text-black shadow-lg transition-transform hover:scale-110 cursor-default",
                            "h-8 md:h-10 flex-1 min-w-[24px] max-w-[50px]",
                            `bg-gradient-to-b ${COLORS[risk]}`
                        )}
                    >
                        {m}x
                    </div>
                ))}
            </div>
        );
    };
    
    const recentWins = history.slice(0, 10);

    return (
        <MainLayout>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
                
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
                                    data-testid="input-bet-amount"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">BRL</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs border-white/10 hover:bg-white/5" 
                                    onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}
                                    data-testid="button-half"
                                >
                                    ½
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 text-xs border-white/10 hover:bg-white/5" 
                                    onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}
                                    data-testid="button-double"
                                >
                                    2x
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase">Risco</Label>
                            <div className="bg-secondary/30 p-1 rounded-lg grid grid-cols-3 gap-1">
                                <button 
                                    onClick={() => setRisk("LOW")}
                                    data-testid="button-risk-low"
                                    className={cn("text-xs font-bold py-2 rounded-md transition-all", risk === "LOW" ? "bg-green-500 text-black shadow-md" : "text-muted-foreground hover:text-white")}
                                >
                                    Baixo
                                </button>
                                <button 
                                    onClick={() => setRisk("MEDIUM")}
                                    data-testid="button-risk-medium"
                                    className={cn("text-xs font-bold py-2 rounded-md transition-all", risk === "MEDIUM" ? "bg-yellow-500 text-black shadow-md" : "text-muted-foreground hover:text-white")}
                                >
                                    Médio
                                </button>
                                <button 
                                    onClick={() => setRisk("HIGH")}
                                    data-testid="button-risk-high"
                                    className={cn("text-xs font-bold py-2 rounded-md transition-all", risk === "HIGH" ? "bg-red-500 text-white shadow-md" : "text-muted-foreground hover:text-white")}
                                >
                                    Alto
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase">Linhas ({rows})</Label>
                            <div className="bg-secondary/30 p-1 rounded-lg grid grid-cols-3 gap-1">
                                {([8, 12, 16] as PlinkoRows[]).map(r => (
                                    <button 
                                        key={r}
                                        onClick={() => setRows(r)}
                                        data-testid={`button-rows-${r}`}
                                        className={cn(
                                            "text-xs font-bold py-2 rounded-md transition-all",
                                            rows === r ? "bg-primary text-white shadow-md" : "text-muted-foreground hover:text-white"
                                        )}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5">
                            <Button 
                                className="w-full h-14 text-xl font-bold uppercase shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] bg-primary hover:bg-primary/90"
                                onClick={handlePlay}
                                disabled={isPlaying || playPlinko.isPending}
                                data-testid="button-play"
                            >
                                {isPlaying || playPlinko.isPending ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        <Play className="w-5 h-5 mr-2" />
                                        Jogar
                                    </>
                                )}
                            </Button>
                        </div>
                    </Card>
                    
                    <Card className="bg-card/50 border-white/5 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <History className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Histórico</span>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {recentWins.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-2">Sem apostas recentes</p>
                            ) : (
                                recentWins.map((bet, i) => (
                                    <div 
                                        key={i} 
                                        className="flex items-center justify-between text-xs bg-background/30 rounded px-2 py-1"
                                        data-testid={`history-item-${i}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-muted-foreground" />
                                            <span className="text-muted-foreground">{bet.username}</span>
                                        </div>
                                        <span className={cn(
                                            "font-bold",
                                            bet.multiplier >= 5 ? "text-yellow-400" : 
                                            bet.multiplier >= 1 ? "text-green-400" : "text-red-400"
                                        )}>
                                            {bet.multiplier}x
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-3 relative bg-[#0f0f15] rounded-2xl border border-white/5 overflow-hidden shadow-2xl flex flex-col">
                    <div 
                        className="absolute inset-0 opacity-30 bg-cover bg-center"
                        style={{ backgroundImage: `url(${plinkoBg})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-transparent to-transparent" />
                    
                    <div className="relative z-20 h-10 border-b border-white/5 flex items-center px-4 overflow-hidden gap-2 bg-black/20 backdrop-blur-sm">
                        <RotateCw className="w-3 h-3 text-muted-foreground animate-spin" style={{ animationDuration: "3s" }} />
                        <div className="flex gap-2 overflow-x-auto">
                            {recentWins.slice(0, 8).map((bet, i) => (
                                <div 
                                    key={i} 
                                    className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold border",
                                        bet.multiplier >= 10 ? "bg-yellow-500/20 border-yellow-500/50 text-yellow-400" :
                                        bet.multiplier >= 1 ? "bg-green-500/20 border-green-500/50 text-green-400" :
                                        "bg-white/5 border-white/10 text-gray-300"
                                    )}
                                >
                                    {bet.multiplier}x
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex-1 flex flex-col items-center justify-center p-4 min-h-[500px]">
                        <canvas 
                            ref={canvasRef} 
                            width={700} 
                            height={500} 
                            className="w-full h-full max-w-[700px] object-contain"
                            data-testid="plinko-canvas"
                        />
                        {renderMultipliers()}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
