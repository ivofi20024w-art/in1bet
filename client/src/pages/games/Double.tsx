import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, User, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import generatedBackground from "@assets/generated_images/elegant_background_for_double_casino_game.png";

type Color = "red" | "black" | "white";

interface RollHistory {
    color: Color;
    number: number;
}

const DOUBLE_HISTORY: RollHistory[] = [
    { color: "red", number: 4 },
    { color: "black", number: 11 },
    { color: "red", number: 2 },
    { color: "white", number: 0 },
    { color: "black", number: 8 },
    { color: "black", number: 13 },
    { color: "red", number: 5 },
    { color: "red", number: 7 },
    { color: "black", number: 10 },
    { color: "white", number: 0 },
];

const PLAYERS = [
    { name: "joao***12", bet: 25.00, color: "red" },
    { name: "mari***99", bet: 100.00, color: "black" },
    { name: "pedr***55", bet: 10.00, color: "white" },
    { name: "lucy***23", bet: 50.00, color: "red" },
    { name: "carl***00", bet: 200.00, color: "black" },
];

export default function Double() {
    const [gameState, setGameState] = useState<'IDLE' | 'SPINNING' | 'RESULT'>('IDLE');
    const [betAmount, setBetAmount] = useState<string>("5.00");
    const [selectedColor, setSelectedColor] = useState<Color | null>(null);
    const [lastRoll, setLastRoll] = useState<number | null>(null);
    const [rollRotation, setRollRotation] = useState(0);

    const handleBet = (color: Color) => {
        if (gameState !== 'IDLE') return;
        setSelectedColor(color);
    };

    const spin = () => {
        if (gameState !== 'IDLE') return;
        setGameState('SPINNING');
        
        // Random spin simulation
        const randomRoll = Math.floor(Math.random() * 15); // 0-14
        const rotation = 3600 + (randomRoll * (360/15)); // 10 full spins + result
        
        setRollRotation(rotation);
        
        setTimeout(() => {
            setLastRoll(randomRoll);
            setGameState('RESULT');
            
            setTimeout(() => {
                setGameState('IDLE');
                setRollRotation(0);
                setSelectedColor(null);
            }, 3000);
        }, 5000); // 5s spin
    };

    const getColor = (num: number): Color => {
        if (num === 0) return "white";
        if (num >= 1 && num <= 7) return "red";
        return "black";
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
                                <Label className="text-xs text-muted-foreground uppercase mb-2 block">Selecione a Cor</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button 
                                        className={cn("h-16 border-2 relative overflow-hidden", selectedColor === 'red' ? "border-white ring-2 ring-red-500 ring-offset-2 ring-offset-background" : "border-red-600 bg-red-600/20 hover:bg-red-600/30")}
                                        onClick={() => handleBet('red')}
                                        disabled={gameState !== 'IDLE'}
                                    >
                                        <div className="absolute inset-0 bg-red-600 opacity-20" />
                                        <span className="font-bold z-10 text-red-500">2x</span>
                                    </Button>
                                    <Button 
                                        className={cn("h-16 border-2 relative overflow-hidden", selectedColor === 'white' ? "border-white ring-2 ring-white ring-offset-2 ring-offset-background" : "border-white/50 bg-white/10 hover:bg-white/20")}
                                        onClick={() => handleBet('white')}
                                        disabled={gameState !== 'IDLE'}
                                    >
                                        <div className="absolute inset-0 bg-white opacity-20" />
                                        <span className="font-bold z-10 text-white">14x</span>
                                    </Button>
                                    <Button 
                                        className={cn("h-16 border-2 relative overflow-hidden", selectedColor === 'black' ? "border-white ring-2 ring-gray-500 ring-offset-2 ring-offset-background" : "border-gray-600 bg-gray-800 hover:bg-gray-700")}
                                        onClick={() => handleBet('black')}
                                        disabled={gameState !== 'IDLE'}
                                    >
                                         <div className="absolute inset-0 bg-black opacity-40" />
                                        <span className="font-bold z-10 text-gray-400">2x</span>
                                    </Button>
                                </div>
                            </div>
                        </div>

                         <div className="p-4 border-t border-white/5">
                            <Button 
                                className="w-full h-14 text-xl font-bold uppercase shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] bg-primary hover:bg-primary/90"
                                onClick={spin}
                                disabled={gameState !== 'IDLE' || !selectedColor}
                            >
                                {gameState === 'SPINNING' ? 'Girando...' : 'Apostar'}
                            </Button>
                        </div>
                    </Card>

                    <Card className="bg-card/50 border-white/5 p-4 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm">Apostas da Rodada</span>
                        </div>
                         <div className="space-y-2 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                            {PLAYERS.map((player, i) => (
                                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                                    <span className="text-gray-400">{player.name}</span>
                                    <div className="flex items-center gap-2">
                                        <div className={cn("w-3 h-3 rounded-full", player.color === 'red' ? 'bg-red-500' : player.color === 'white' ? 'bg-white' : 'bg-gray-800')} />
                                        <span className="text-white">R$ {player.bet.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Center: Game Area */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                     {/* History Bar */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
                        <div className="flex items-center gap-1 text-xs font-bold bg-background/50 px-2 py-1 rounded border border-white/5">
                            <History className="w-3 h-3 text-muted-foreground" />
                        </div>
                        {DOUBLE_HISTORY.map((hist, i) => (
                            <div 
                                key={i} 
                                className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-lg border border-white/10 shrink-0",
                                    hist.color === 'red' && "bg-gradient-to-br from-red-500 to-red-700 text-white",
                                    hist.color === 'black' && "bg-gradient-to-br from-gray-800 to-black text-white",
                                    hist.color === 'white' && "bg-gradient-to-br from-white to-gray-300 text-black",
                                )}
                            >
                                {hist.number}
                            </div>
                        ))}
                    </div>

                    <div className="relative flex-1 bg-[#0f0f15] rounded-2xl border border-white/5 overflow-hidden shadow-2xl flex flex-col items-center justify-center">
                         {/* Background Image */}
                        <div 
                            className="absolute inset-0 opacity-30 bg-cover bg-center"
                            style={{ backgroundImage: `url(${generatedBackground})` }}
                        />
                         <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-transparent to-transparent" />
                        
                        {/* Roulette Wheel Simulation (CSS-only for prototype) */}
                        <div className="relative z-10 scale-150 md:scale-[2]">
                            <div className="w-[800px] h-12 bg-gray-900 border-y-4 border-yellow-500 overflow-hidden relative shadow-2xl">
                                <div 
                                    className="absolute inset-y-0 left-0 flex items-center"
                                    style={{
                                        transform: `translateX(${gameState === 'SPINNING' ? -2000 : -100}px)`,
                                        transition: gameState === 'SPINNING' ? 'transform 5s cubic-bezier(0.1, 0, 0.1, 1)' : 'none'
                                    }}
                                >
                                     {/* Repeated strip for spinning illusion */}
                                    {Array.from({ length: 100 }).map((_, i) => {
                                        const num = i % 15;
                                        const color = getColor(num);
                                        return (
                                            <div 
                                                key={i} 
                                                className={cn(
                                                    "w-[80px] h-full flex items-center justify-center text-lg font-black border-r border-black/20",
                                                    color === 'red' && "bg-red-600 text-white",
                                                    color === 'black' && "bg-gray-900 text-white",
                                                    color === 'white' && "bg-white text-black",
                                                )}
                                            >
                                                {num}
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Pointer */}
                                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-yellow-400 z-20 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-500 rotate-45 z-20" />
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-500 rotate-45 z-20" />
                            </div>
                        </div>

                        {gameState === 'IDLE' && (
                             <div className="absolute bottom-20 text-center animate-pulse">
                                <h2 className="text-xl font-bold text-muted-foreground uppercase tracking-[0.5em] mb-2">Aguardando Apostas</h2>
                                <div className="w-64 h-1 bg-white/10 mx-auto rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-full animate-progress-indeterminate-slow" />
                                </div>
                            </div>
                        )}
                        
                         {gameState === 'RESULT' && lastRoll !== null && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 animate-in fade-in duration-300 backdrop-blur-sm">
                                <div className="text-center scale-150">
                                    <div 
                                        className={cn(
                                            "w-32 h-32 rounded-2xl flex items-center justify-center text-6xl font-black shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-4 animate-in zoom-in spin-in-12 duration-500",
                                            getColor(lastRoll) === 'red' && "bg-red-600 text-white shadow-red-500/50",
                                            getColor(lastRoll) === 'black' && "bg-gray-900 text-white shadow-gray-500/50",
                                            getColor(lastRoll) === 'white' && "bg-white text-black shadow-white/50",
                                        )}
                                    >
                                        {lastRoll}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest">{getColor(lastRoll) === 'white' ? 'BRANCO!' : getColor(lastRoll) === 'red' ? 'VERMELHO!' : 'PRETO!'}</h2>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
