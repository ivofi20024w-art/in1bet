import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Rocket, Coins, User } from "lucide-react";
import { cn } from "@/lib/utils";
import generatedBackground from "@assets/generated_images/futuristic_neon_cityscape_background_for_crash_game.png";

const CRASH_HISTORY = [
    { multiplier: 1.00, color: "text-gray-400" },
    { multiplier: 2.50, color: "text-green-500" },
    { multiplier: 1.12, color: "text-blue-500" },
    { multiplier: 10.45, color: "text-yellow-500" },
    { multiplier: 5.30, color: "text-green-500" },
    { multiplier: 1.05, color: "text-gray-400" },
    { multiplier: 3.20, color: "text-green-500" },
    { multiplier: 1.80, color: "text-blue-500" },
    { multiplier: 88.00, color: "text-yellow-500" },
    { multiplier: 2.10, color: "text-green-500" },
];

const PLAYERS = [
    { name: "joao***12", bet: 10.00, cashout: 2.5, win: 25.00 },
    { name: "mari***99", bet: 50.00, cashout: null, win: 0 },
    { name: "pedr***55", bet: 100.00, cashout: 1.5, win: 150.00 },
    { name: "lucy***23", bet: 25.00, cashout: null, win: 0 },
    { name: "carl***00", bet: 5.00, cashout: 10.0, win: 50.00 },
    { name: "bruno***1", bet: 200.00, cashout: null, win: 0 },
];

export default function Crash() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [multiplier, setMultiplier] = useState(1.00);
    const [gameState, setGameState] = useState<'IDLE' | 'STARTING' | 'FLYING' | 'CRASHED'>('IDLE');
    const [betAmount, setBetAmount] = useState<string>("10.00");
    const [autoCashout, setAutoCashout] = useState<string>("2.00");
    const [hasBet, setHasBet] = useState(false);
    const [cashedOut, setCashedOut] = useState(false);
    
    // Animation Loop
    useEffect(() => {
        let animationFrame: number;
        let startTime: number;
        
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            
            if (gameState === 'FLYING') {
                // Exponential growth simulation
                const nextMult = 1 + Math.pow(progress / 1000, 2) * 0.1;
                setMultiplier(nextMult);
                
                // Random crash logic (mock)
                if (Math.random() < 0.005 && progress > 1000) {
                     setGameState('CRASHED');
                     setHasBet(false);
                } else {
                    animationFrame = requestAnimationFrame(animate);
                }
            } else if (gameState === 'STARTING') {
                // Countdown or prep time
                 setTimeout(() => {
                     setGameState('FLYING');
                     startTime = 0; // Reset for flight
                 }, 3000);
            }
        };

        if (gameState === 'FLYING') {
            animationFrame = requestAnimationFrame(animate);
        }

        return () => cancelAnimationFrame(animationFrame);
    }, [gameState]);

    // Draw Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (gameState === 'FLYING' || gameState === 'CRASHED') {
            // Draw Curve
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            
            // Bezier curve based on multiplier
            const x = Math.min(canvas.width, (multiplier - 1) * 100);
            const y = canvas.height - Math.min(canvas.height, (multiplier - 1) * 50);
            
            ctx.quadraticCurveTo(x / 2, canvas.height, x, y);
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#F97316'; // Primary Orange
            ctx.stroke();
            
            // Gradient fill
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(249, 115, 22, 0.2)');
            gradient.addColorStop(1, 'rgba(249, 115, 22, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Rocket / Dot
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.shadowColor = '#F97316';
            ctx.shadowBlur = 10;
        }

    }, [multiplier, gameState]);

    const handleBet = () => {
        if (gameState !== 'IDLE' && gameState !== 'STARTING') return;
        setHasBet(true);
        setCashedOut(false);
    };

    const handleCashout = () => {
        if (gameState === 'FLYING') {
            setCashedOut(true);
            setHasBet(false);
            // Add win logic mock
        }
    };

    return (
        <MainLayout>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
                
                {/* Left: Betting Controls */}
                <div className="lg:col-span-1 space-y-4 flex flex-col">
                    <Card className="bg-card/50 border-white/5 flex-1 flex flex-col">
                        <Tabs defaultValue="manual" className="w-full">
                            <TabsList className="w-full bg-background/50 p-1">
                                <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
                                <TabsTrigger value="auto" className="flex-1">Auto</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        
                        <div className="p-4 space-y-4 flex-1">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase">Valor da Aposta</Label>
                                <div className="relative">
                                    <Input 
                                        type="number" 
                                        value={betAmount} 
                                        onChange={e => setBetAmount(e.target.value)}
                                        className="bg-background/50 border-white/10 pr-12 font-bold text-lg" 
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">BRL</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:bg-white/5" onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}>½</Button>
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:bg-white/5" onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}>2x</Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase">Auto Cashout</Label>
                                <div className="relative">
                                    <Input 
                                        type="number" 
                                        value={autoCashout}
                                        onChange={e => setAutoCashout(e.target.value)}
                                        className="bg-background/50 border-white/10 pr-12 font-bold text-lg" 
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">X</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/5">
                            {!hasBet ? (
                                <Button 
                                    className="w-full h-16 text-2xl font-bold uppercase shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] bg-primary hover:bg-primary/90"
                                    onClick={handleBet}
                                    disabled={gameState === 'FLYING'}
                                >
                                    {gameState === 'FLYING' ? 'Esperando Próxima' : 'Apostar'}
                                </Button>
                            ) : (
                                <Button 
                                    className="w-full h-16 text-2xl font-bold uppercase shadow-[0_0_20px_-5px_rgba(34,197,94,0.5)] bg-green-500 hover:bg-green-600 text-white"
                                    onClick={handleCashout}
                                    disabled={cashedOut || gameState !== 'FLYING'}
                                >
                                    {cashedOut ? 'Saque Realizado' : `Sacar R$ ${(parseFloat(betAmount) * multiplier).toFixed(2)}`}
                                </Button>
                            )}
                        </div>
                    </Card>
                    
                     <Card className="bg-card/50 border-white/5 p-4 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm">Jogadores (432)</span>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {PLAYERS.map((player, i) => (
                                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                                    <span className="text-gray-400">{player.name}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-white">R$ {player.bet.toFixed(2)}</span>
                                        <span className={cn("w-16 text-right font-bold", player.win > 0 ? "text-green-500" : "text-gray-600")}>
                                            {player.win > 0 ? `${player.cashout}x` : "-"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Center: Game Canvas */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                     {/* History Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
                        <div className="flex items-center gap-1 text-xs font-bold bg-background/50 px-2 py-1 rounded border border-white/5">
                            <History className="w-3 h-3 text-muted-foreground" />
                        </div>
                        {CRASH_HISTORY.map((hist, i) => (
                            <Badge 
                                key={i} 
                                variant="outline" 
                                className={cn("border-white/10 bg-background/50 font-mono", hist.color)}
                            >
                                {hist.multiplier.toFixed(2)}x
                            </Badge>
                        ))}
                    </div>

                    <div className="relative flex-1 bg-[#0f0f15] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                        {/* Background Image */}
                        <div 
                            className="absolute inset-0 opacity-40 bg-cover bg-center"
                            style={{ backgroundImage: `url(${generatedBackground})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-transparent to-transparent" />
                        
                        {/* Game Status Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                            {gameState === 'STARTING' && (
                                <div className="text-center animate-pulse">
                                    <h2 className="text-4xl font-heading italic font-bold text-white mb-2">PREPARANDO</h2>
                                    <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary animate-progress-indeterminate" />
                                    </div>
                                </div>
                            )}

                            {gameState === 'FLYING' && (
                                <div className="text-center">
                                    <h1 className="text-8xl md:text-9xl font-heading font-black text-white drop-shadow-[0_0_30px_rgba(249,115,22,0.6)] tabular-nums tracking-tighter">
                                        {multiplier.toFixed(2)}x
                                    </h1>
                                    <p className="text-xl font-bold text-primary animate-bounce mt-4">IN1BET CRASHMANIA</p>
                                </div>
                            )}

                            {gameState === 'CRASHED' && (
                                <div className="text-center animate-in zoom-in duration-300">
                                    <h1 className="text-6xl md:text-8xl font-heading font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] tabular-nums mb-4">
                                        CRASHED
                                    </h1>
                                    <h2 className="text-2xl font-bold text-white mb-6">@{multiplier.toFixed(2)}x</h2>
                                    <Button 
                                        size="lg" 
                                        onClick={() => setGameState('STARTING')} 
                                        className="bg-white text-black hover:bg-gray-200 font-bold pointer-events-auto"
                                    >
                                        Próxima Rodada
                                    </Button>
                                </div>
                            )}
                            
                            {gameState === 'IDLE' && (
                                <Button 
                                    size="lg" 
                                    onClick={() => setGameState('STARTING')} 
                                    className="bg-primary text-white hover:bg-primary/90 font-bold text-xl px-12 py-8 rounded-full shadow-[0_0_40px_-5px_rgba(249,115,22,0.6)] pointer-events-auto animate-pulse"
                                >
                                    INICIAR JOGO
                                </Button>
                            )}
                        </div>

                        <canvas ref={canvasRef} className="w-full h-full relative z-0" />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
