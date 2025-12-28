import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import plinkoBg from "@assets/generated_images/neon_plinko_game_background_with_pyramid_structure.png";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RotateCw } from "lucide-react";
import { toast } from "sonner";

// Plinko Constants
const ROWS = 16;
const PIN_SIZE = 4;
const BALL_SIZE = 8;
const GRAVITY = 0.5;
const FRICTION = 0.99; // Less friction for better movement
const BOUNCE = 0.6; // Bounciness

const MULTIPLIERS = {
    low: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    medium: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    high: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
};

// Colors for multipliers
const COLORS = {
    low: "from-green-500 to-green-700",
    medium: "from-yellow-500 to-yellow-700",
    high: "from-red-500 to-red-700"
};

type RiskLevel = 'low' | 'medium' | 'high';

interface Ball {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    path: {x: number, y: number}[];
}

export default function Plinko() {
    const [betAmount, setBetAmount] = useState("10.00");
    const [risk, setRisk] = useState<RiskLevel>('medium');
    const [rows, setRows] = useState(8); // Simplified rows for prototype
    const [balls, setBalls] = useState<Ball[]>([]);
    const [recentWins, setRecentWins] = useState<{val: number, risk: RiskLevel}[]>([]);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>(0);
    
    // Get current multipliers based on risk and rows
    // For this prototype we will simplify and just use the predefined arrays mapped to a subset
    const currentMultipliers = (() => {
        // For this prototype we will simplify and just use the predefined arrays mapped to a subset
        const source = MULTIPLIERS[risk];
        // Ensure we have enough multipliers for the buckets (rows + 1)
        // This is a mock simplification
        return source;
    })();

    const addBall = () => {
        const bet = parseFloat(betAmount);
        if (isNaN(bet) || bet <= 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const newBall: Ball = {
            id: Date.now(),
            x: canvas.width / 2 + (Math.random() * 2 - 1), // Slight random offset
            y: 20,
            vx: (Math.random() - 0.5) * 2, // Random initial velocity
            vy: 0,
            color: risk === 'high' ? '#ef4444' : risk === 'medium' ? '#eab308' : '#22c55e',
            path: []
        };
        
        setBalls(prev => [...prev, newBall]);
        toast.dismiss(); // Clear prev toasts
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Setup physics loop
        const update = () => {
            if (!canvas) return;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Pins (Pyramid)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            const startY = 100;
            const gapX = 40;
            const gapY = 35;
            
            const pins: {x: number, y: number}[] = [];

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c <= r; c++) {
                    const x = (canvas.width / 2) - (r * gapX / 2) + (c * gapX);
                    const y = startY + (r * gapY);
                    
                    ctx.beginPath();
                    ctx.arc(x, y, PIN_SIZE, 0, Math.PI * 2);
                    ctx.fill();
                    pins.push({x, y});
                }
            }

            // Update and Draw Balls
            setBalls(prevBalls => {
                const nextBalls = prevBalls.map(ball => {
                    // Physics
                    ball.vy += GRAVITY;
                    ball.vx *= FRICTION;
                    ball.vy *= FRICTION;
                    
                    ball.x += ball.vx;
                    ball.y += ball.vy;

                    // Collision with Pins
                    pins.forEach(pin => {
                        const dx = ball.x - pin.x;
                        const dy = ball.y - pin.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < PIN_SIZE + BALL_SIZE) {
                            // Simple bounce response
                            const angle = Math.atan2(dy, dx);
                            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
                            
                            // Add some randomness to the bounce to simulate peg physics
                            const randomAngle = angle + (Math.random() - 0.5) * 0.5;
                            
                            ball.vx = Math.cos(randomAngle) * speed * BOUNCE + (Math.random() - 0.5); // Add noise
                            ball.vy = Math.sin(randomAngle) * speed * BOUNCE;
                            
                            // Push out
                            const overlap = (PIN_SIZE + BALL_SIZE) - distance;
                            ball.x += Math.cos(angle) * overlap;
                            ball.y += Math.sin(angle) * overlap;
                        }
                    });

                    // Draw Ball
                    if (ctx) {
                        ctx.beginPath();
                        ctx.arc(ball.x, ball.y, BALL_SIZE, 0, Math.PI * 2);
                        ctx.fillStyle = ball.color;
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = ball.color;
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }

                    return ball;
                });

                // Remove balls that fell through
                const activeBalls = nextBalls.filter(b => b.y < canvas.height + 50);
                
                // Check for completion (mock bucket logic based on x position)
                nextBalls.forEach(b => {
                    if (b.y > startY + (rows * gapY) + 20 && b.y < startY + (rows * gapY) + 40) {
                        // Calculate bucket index roughly
                        // This is a visual approximation for prototype
                        // In real game, server determines outcome
                    }
                });
                
                return activeBalls;
            });

            requestRef.current = requestAnimationFrame(update);
        };

        requestRef.current = requestAnimationFrame(update);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [rows, balls.length]); // Re-bind when balls change count to keep state fresh in closure

    // Multiplier Buckets (HTML Overlay)
    const renderMultipliers = () => {
        return (
            <div className="flex justify-center gap-1 mt-[-20px] relative z-10 px-8">
                {currentMultipliers.map((m, i) => (
                    <div 
                        key={i} 
                        className={cn(
                            "flex items-center justify-center rounded-[4px] font-bold text-[10px] md:text-xs text-black shadow-lg transition-transform hover:scale-110 cursor-default animate-in slide-in-from-bottom-2 duration-500",
                            "h-8 md:h-10 flex-1 min-w-[24px] max-w-[40px]",
                            `bg-gradient-to-b ${COLORS[risk]}`
                        )}
                        style={{ animationDelay: `${i * 50}ms` }}
                    >
                        {m}x
                    </div>
                ))}
            </div>
        );
    };

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
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">BRL</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:bg-white/5" onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))}>½</Button>
                                <Button variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:bg-white/5" onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))}>2x</Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase">Risco</Label>
                            <div className="bg-secondary/30 p-1 rounded-lg grid grid-cols-3 gap-1">
                                <button 
                                    onClick={() => setRisk('low')}
                                    className={cn("text-xs font-bold py-2 rounded-md transition-all", risk === 'low' ? "bg-green-500 text-black shadow-md" : "text-muted-foreground hover:text-white")}
                                >
                                    Baixo
                                </button>
                                <button 
                                    onClick={() => setRisk('medium')}
                                    className={cn("text-xs font-bold py-2 rounded-md transition-all", risk === 'medium' ? "bg-yellow-500 text-black shadow-md" : "text-muted-foreground hover:text-white")}
                                >
                                    Médio
                                </button>
                                <button 
                                    onClick={() => setRisk('high')}
                                    className={cn("text-xs font-bold py-2 rounded-md transition-all", risk === 'high' ? "bg-red-500 text-white shadow-md" : "text-muted-foreground hover:text-white")}
                                >
                                    Alto
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase">Linhas ({rows})</Label>
                            <div className="space-y-4 pt-2">
                                <div className="flex justify-between text-xs text-muted-foreground px-1">
                                    <span>8</span>
                                    <span>16</span>
                                </div>
                                <input 
                                    type="range" 
                                    min="8" 
                                    max="16" 
                                    step="1"
                                    value={rows}
                                    onChange={(e) => setRows(parseInt(e.target.value))}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5">
                            <Button 
                                className="w-full h-14 text-xl font-bold uppercase shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] bg-primary hover:bg-primary/90"
                                onClick={addBall}
                            >
                                Jogar
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right: Game Board */}
                <div className="lg:col-span-3 relative bg-[#0f0f15] rounded-2xl border border-white/5 overflow-hidden shadow-2xl flex flex-col">
                     {/* Background Image */}
                     <div 
                        className="absolute inset-0 opacity-30 bg-cover bg-center"
                        style={{ backgroundImage: `url(${plinkoBg})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-transparent to-transparent" />
                    
                    {/* Recent Wins Ticker */}
                    <div className="relative z-20 h-10 border-b border-white/5 flex items-center px-4 overflow-hidden gap-2 bg-black/20 backdrop-blur-sm">
                        <RotateCw className="w-3 h-3 text-muted-foreground animate-spin-slow" />
                        <div className="flex gap-2">
                            {[130, 26, 1.2, 0.4, 13, 1.5].map((win, i) => (
                                <div key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-gray-300">
                                    {win}x
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative flex-1 flex flex-col items-center justify-center p-4 min-h-[500px]">
                        <canvas 
                            ref={canvasRef} 
                            width={800} 
                            height={600} 
                            className="w-full h-full max-w-[800px] object-contain"
                        />
                        {renderMultipliers()}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
