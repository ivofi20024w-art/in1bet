import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCrashState, useCrashHistory, usePlaceCrashBet, useCrashCashout } from "@/hooks/useCrash";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import generatedBackground from "@assets/generated_images/futuristic_neon_cityscape_background_for_crash_game.png";

function getMultiplierColor(mult: number): string {
    if (mult >= 10) return "text-yellow-500";
    if (mult >= 2) return "text-green-500";
    if (mult >= 1.5) return "text-blue-500";
    return "text-gray-400";
}

export default function Crash() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [betAmount, setBetAmount] = useState<string>("10.00");
    const [autoCashout, setAutoCashout] = useState<string>("");
    
    const { user } = useAuth();
    const { data: crashData, isLoading } = useCrashState();
    const { data: history = [] } = useCrashHistory();
    const placeBet = usePlaceCrashBet();
    const cashout = useCrashCashout();
    
    const game = crashData?.game;
    const activeBet = crashData?.activeBet;
    const multiplier = game?.currentMultiplier ?? 1;
    const gameStatus = game?.status ?? "WAITING";
    const players = game?.players ?? [];

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (gameStatus === 'RUNNING' || gameStatus === 'CRASHED') {
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            
            const x = Math.min(canvas.width, (multiplier - 1) * 100);
            const y = canvas.height - Math.min(canvas.height, (multiplier - 1) * 50);
            
            ctx.quadraticCurveTo(x / 2, canvas.height, x, y);
            ctx.lineWidth = 4;
            ctx.strokeStyle = gameStatus === 'CRASHED' ? '#EF4444' : '#FF7A1A';
            ctx.stroke();
            
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, gameStatus === 'CRASHED' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 122, 26, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#fff';
            ctx.fill();
            ctx.shadowColor = gameStatus === 'CRASHED' ? '#EF4444' : '#FF7A1A';
            ctx.shadowBlur = 10;
        }
    }, [multiplier, gameStatus]);

    const handleBet = () => {
        if (!user) {
            toast.error("Faça login para apostar");
            return;
        }
        if (gameStatus !== 'WAITING') {
            toast.error("Aguarde a próxima rodada");
            return;
        }
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount < 1) {
            toast.error("Aposta mínima: R$ 1,00");
            return;
        }
        
        placeBet.mutate({
            betAmount: amount,
            autoCashout: autoCashout ? parseFloat(autoCashout) : undefined,
        }, {
            onSuccess: (data) => {
                if (data.success) {
                    toast.success("Aposta realizada!");
                } else {
                    toast.error(data.error || "Erro ao apostar");
                }
            },
            onError: (err: any) => {
                toast.error(err.message || "Erro ao apostar");
            },
        });
    };

    const handleCashout = () => {
        if (!activeBet?.betId) return;
        
        cashout.mutate(activeBet.betId, {
            onSuccess: (data) => {
                if (data.success) {
                    toast.success(`Saque realizado! ${data.multiplier}x - R$ ${data.winAmount?.toFixed(2)}`);
                } else {
                    toast.error(data.error || "Erro ao sacar");
                }
            },
            onError: (err: any) => {
                toast.error(err.message || "Erro ao sacar");
            },
        });
    };

    const hasBet = activeBet && activeBet.status === "ACTIVE";
    const cashedOut = activeBet && activeBet.status === "WON";
    const nextGameIn = game?.nextGameIn ?? 0;

    return (
        <MainLayout>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
                
                <div className="lg:col-span-1 space-y-4 flex flex-col">
                    <Card className="bg-card/50 border-white/5 flex-1 flex flex-col">
                        <Tabs defaultValue="manual" className="w-full">
                            <TabsList className="w-full bg-background/50 p-1">
                                <TabsTrigger value="manual" className="flex-1" data-testid="tab-manual">Manual</TabsTrigger>
                                <TabsTrigger value="auto" className="flex-1" data-testid="tab-auto">Auto</TabsTrigger>
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
                                        data-testid="input-bet-amount"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">BRL</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:bg-white/5" onClick={() => setBetAmount((parseFloat(betAmount) / 2).toFixed(2))} data-testid="button-half">½</Button>
                                    <Button variant="outline" size="sm" className="h-8 text-xs border-white/10 hover:bg-white/5" onClick={() => setBetAmount((parseFloat(betAmount) * 2).toFixed(2))} data-testid="button-double">2x</Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground uppercase">Auto Cashout (opcional)</Label>
                                <div className="relative">
                                    <Input 
                                        type="number" 
                                        value={autoCashout}
                                        onChange={e => setAutoCashout(e.target.value)}
                                        placeholder="Ex: 2.00"
                                        className="bg-background/50 border-white/10 pr-12 font-bold text-lg"
                                        data-testid="input-auto-cashout"
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
                                    disabled={gameStatus !== 'WAITING' || placeBet.isPending}
                                    data-testid="button-bet"
                                >
                                    {placeBet.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 
                                     gameStatus === 'RUNNING' ? 'Esperando...' : 
                                     gameStatus === 'CRASHED' ? `Próxima em ${Math.ceil(nextGameIn / 1000)}s` : 
                                     'Apostar'}
                                </Button>
                            ) : (
                                <Button 
                                    className="w-full h-16 text-2xl font-bold uppercase shadow-[0_0_20px_-5px_rgba(34,197,94,0.5)] bg-green-500 hover:bg-green-600 text-white"
                                    onClick={handleCashout}
                                    disabled={cashedOut || gameStatus !== 'RUNNING' || cashout.isPending}
                                    data-testid="button-cashout"
                                >
                                    {cashout.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> :
                                     cashedOut ? 'Saque Realizado' : 
                                     `Sacar R$ ${(parseFloat(betAmount) * multiplier).toFixed(2)}`}
                                </Button>
                            )}
                        </div>
                    </Card>
                    
                    <Card className="bg-card/50 border-white/5 p-4 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm">Jogadores ({players.length})</span>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {players.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">Nenhum jogador ainda</p>
                            ) : (
                                players.map((player, i) => (
                                    <div key={player.betId} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0" data-testid={`player-row-${i}`}>
                                        <span className="text-gray-400">{player.odataUsername}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-white">R$ {player.betAmount.toFixed(2)}</span>
                                            <span className={cn("w-16 text-right font-bold", 
                                                player.status === "WON" ? "text-green-500" : 
                                                player.status === "LOST" ? "text-red-500" : "text-gray-600")}>
                                                {player.status === "WON" ? `${player.cashoutMultiplier}x` : 
                                                 player.status === "LOST" ? "💥" : "-"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-3 flex flex-col gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
                        <div className="flex items-center gap-1 text-xs font-bold bg-background/50 px-2 py-1 rounded border border-white/5">
                            <History className="w-3 h-3 text-muted-foreground" />
                        </div>
                        {history.map((hist, i) => (
                            <Badge 
                                key={hist.gameId} 
                                variant="outline" 
                                className={cn("border-white/10 bg-background/50 font-mono", getMultiplierColor(hist.crashPoint))}
                                data-testid={`history-badge-${i}`}
                            >
                                {hist.crashPoint.toFixed(2)}x
                            </Badge>
                        ))}
                    </div>

                    <div className="relative flex-1 bg-[#0f0f15] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                        <div 
                            className="absolute inset-0 opacity-40 bg-cover bg-center"
                            style={{ backgroundImage: `url(${generatedBackground})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-transparent to-transparent" />
                        
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                            {isLoading && (
                                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                            )}
                            
                            {!isLoading && gameStatus === 'WAITING' && (
                                <div className="text-center">
                                    <h2 className="text-4xl font-heading italic font-bold text-white mb-2">APOSTAS ABERTAS</h2>
                                    <p className="text-muted-foreground">Faça sua aposta antes do foguete decolar!</p>
                                    <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mt-4">
                                        <div className="h-full bg-primary animate-pulse w-full" />
                                    </div>
                                </div>
                            )}

                            {!isLoading && gameStatus === 'RUNNING' && (
                                <div className="text-center">
                                    <h1 className="text-8xl md:text-9xl font-heading font-black text-white drop-shadow-[0_0_30px_rgba(249,115,22,0.6)] tabular-nums tracking-tighter" data-testid="text-multiplier">
                                        {multiplier.toFixed(2)}x
                                    </h1>
                                    <p className="text-xl font-bold text-primary animate-bounce mt-4">IN1BET CRASH</p>
                                </div>
                            )}

                            {!isLoading && gameStatus === 'CRASHED' && (
                                <div className="text-center animate-in zoom-in duration-300">
                                    <h1 className="text-6xl md:text-8xl font-heading font-black text-red-500 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)] tabular-nums mb-4">
                                        CRASHED!
                                    </h1>
                                    <h2 className="text-2xl font-bold text-white mb-6" data-testid="text-crash-point">@{game?.crashPoint?.toFixed(2)}x</h2>
                                    <p className="text-muted-foreground">Próxima rodada em {Math.ceil(nextGameIn / 1000)}s</p>
                                </div>
                            )}
                        </div>

                        <canvas ref={canvasRef} className="w-full h-full relative z-0" />
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
