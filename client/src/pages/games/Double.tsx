import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDoubleState, useDoubleHistory, usePlaceDoubleBet, DoubleColor } from "@/hooks/useDouble";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import generatedBackground from "@assets/generated_images/elegant_background_for_double_casino_game.png";

type Color = "RED" | "BLACK" | "WHITE";

function getColorDisplay(color: DoubleColor): { bg: string; text: string; label: string } {
    switch (color) {
        case "RED":
            return { bg: "bg-red-600", text: "text-white", label: "VERMELHO" };
        case "BLACK":
            return { bg: "bg-gray-900", text: "text-white", label: "PRETO" };
        case "WHITE":
            return { bg: "bg-white", text: "text-black", label: "BRANCO" };
    }
}

function numberToColor(num: number): Color {
    if (num === 0) return "WHITE";
    if (num % 2 === 1) return "RED";
    return "BLACK";
}

export default function Double() {
    const [betAmount, setBetAmount] = useState<string>("5.00");
    const [selectedColor, setSelectedColor] = useState<Color | null>(null);
    
    const { user } = useAuth();
    const { data: doubleData, isLoading } = useDoubleState();
    const { data: history = [] } = useDoubleHistory();
    const placeBet = usePlaceDoubleBet();
    
    const game = doubleData?.game;
    const activeBets = doubleData?.activeBets || [];
    const gameStatus = game?.status ?? "WAITING";
    const allBets = game?.bets ?? [];
    const result = game?.result;
    const resultColor = game?.resultColor;
    const nextGameIn = game?.nextGameIn ?? 0;

    const handleBet = (color: Color) => {
        if (!user) {
            toast.error("Faça login para apostar");
            return;
        }
        if (gameStatus !== "WAITING") {
            toast.error("Apostas fechadas");
            return;
        }
        
        const amount = parseFloat(betAmount);
        if (isNaN(amount) || amount < 1) {
            toast.error("Aposta mínima: R$ 1,00");
            return;
        }
        
        placeBet.mutate({ betAmount: amount, color }, {
            onSuccess: (data) => {
                if (data.success) {
                    toast.success(`Aposta de R$ ${amount.toFixed(2)} em ${color} realizada!`);
                    setSelectedColor(color);
                } else {
                    toast.error(data.error || "Erro ao apostar");
                }
            },
            onError: (err: any) => {
                toast.error(err.message || "Erro ao apostar");
            },
        });
    };

    const hasUserBet = activeBets.length > 0;
    const spinOffset = gameStatus === "SPINNING" && result !== null && result !== undefined
        ? -2000 - (result * 80) + 400
        : -100;

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
                                <Label className="text-xs text-muted-foreground uppercase mb-2 block">Selecione a Cor</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button 
                                        className={cn("h-16 border-2 relative overflow-hidden", 
                                            hasUserBet && activeBets[0]?.color === 'RED' ? "border-white ring-2 ring-red-500 ring-offset-2 ring-offset-background" : "border-red-600 bg-red-600/20 hover:bg-red-600/30")}
                                        onClick={() => handleBet('RED')}
                                        disabled={gameStatus !== 'WAITING' || placeBet.isPending}
                                        data-testid="button-red"
                                    >
                                        <div className="absolute inset-0 bg-red-600 opacity-20" />
                                        <span className="font-bold z-10 text-red-500">2x</span>
                                    </Button>
                                    <Button 
                                        className={cn("h-16 border-2 relative overflow-hidden", 
                                            hasUserBet && activeBets[0]?.color === 'WHITE' ? "border-white ring-2 ring-white ring-offset-2 ring-offset-background" : "border-white/50 bg-white/10 hover:bg-white/20")}
                                        onClick={() => handleBet('WHITE')}
                                        disabled={gameStatus !== 'WAITING' || placeBet.isPending}
                                        data-testid="button-white"
                                    >
                                        <div className="absolute inset-0 bg-white opacity-20" />
                                        <span className="font-bold z-10 text-white">14x</span>
                                    </Button>
                                    <Button 
                                        className={cn("h-16 border-2 relative overflow-hidden", 
                                            hasUserBet && activeBets[0]?.color === 'BLACK' ? "border-white ring-2 ring-gray-500 ring-offset-2 ring-offset-background" : "border-gray-600 bg-gray-800 hover:bg-gray-700")}
                                        onClick={() => handleBet('BLACK')}
                                        disabled={gameStatus !== 'WAITING' || placeBet.isPending}
                                        data-testid="button-black"
                                    >
                                        <div className="absolute inset-0 bg-black opacity-40" />
                                        <span className="font-bold z-10 text-gray-400">2x</span>
                                    </Button>
                                </div>
                            </div>
                            
                            {gameStatus === "WAITING" && (
                                <div className="text-center text-sm text-muted-foreground">
                                    Apostas abertas - {Math.ceil(nextGameIn / 1000)}s
                                </div>
                            )}
                            {gameStatus === "SPINNING" && (
                                <div className="text-center text-sm text-yellow-500 animate-pulse">
                                    Girando...
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-white/5">
                            {placeBet.isPending && (
                                <Button className="w-full h-14" disabled>
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card className="bg-card/50 border-white/5 p-4 flex-1">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-bold text-sm">Apostas da Rodada ({allBets.length})</span>
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                            {allBets.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma aposta ainda</p>
                            ) : (
                                allBets.map((bet, i) => (
                                    <div key={bet.betId} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0" data-testid={`bet-row-${i}`}>
                                        <span className="text-gray-400">{bet.odataUsername}</span>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-3 h-3 rounded-full", 
                                                bet.color === 'RED' ? 'bg-red-500' : 
                                                bet.color === 'WHITE' ? 'bg-white' : 'bg-gray-800')} />
                                            <span className="text-white">R$ {bet.betAmount.toFixed(2)}</span>
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
                        {history.map((hist, i) => {
                            const colorInfo = getColorDisplay(hist.resultColor);
                            return (
                                <div 
                                    key={hist.gameId} 
                                    className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-lg border border-white/10 shrink-0",
                                        colorInfo.bg, colorInfo.text
                                    )}
                                    data-testid={`history-item-${i}`}
                                >
                                    {hist.result}
                                </div>
                            );
                        })}
                    </div>

                    <div className="relative flex-1 bg-[#0f0f15] rounded-2xl border border-white/5 overflow-hidden shadow-2xl flex flex-col items-center justify-center">
                        <div 
                            className="absolute inset-0 opacity-30 bg-cover bg-center"
                            style={{ backgroundImage: `url(${generatedBackground})` }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-transparent to-transparent" />
                        
                        <div className="relative z-10 scale-150 md:scale-[2]">
                            <div className="w-[800px] h-12 bg-gray-900 border-y-4 border-yellow-500 overflow-hidden relative shadow-2xl">
                                <div 
                                    className="absolute inset-y-0 left-0 flex items-center"
                                    style={{
                                        transform: `translateX(${spinOffset}px)`,
                                        transition: gameStatus === 'SPINNING' ? 'transform 7s cubic-bezier(0.1, 0, 0.1, 1)' : 'none'
                                    }}
                                >
                                    {Array.from({ length: 100 }).map((_, i) => {
                                        const num = i % 15;
                                        const color = numberToColor(num);
                                        const colorInfo = getColorDisplay(color);
                                        return (
                                            <div 
                                                key={i} 
                                                className={cn(
                                                    "w-[80px] h-full flex items-center justify-center text-lg font-black border-r border-black/20",
                                                    colorInfo.bg, colorInfo.text
                                                )}
                                            >
                                                {num}
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-yellow-400 z-20 shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-500 rotate-45 z-20" />
                                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-500 rotate-45 z-20" />
                            </div>
                        </div>

                        {gameStatus === 'WAITING' && (
                            <div className="absolute bottom-20 text-center animate-pulse">
                                <h2 className="text-xl font-bold text-muted-foreground uppercase tracking-[0.5em] mb-2">Aguardando Apostas</h2>
                                <div className="text-lg text-white font-mono">{Math.ceil(nextGameIn / 1000)}s</div>
                            </div>
                        )}
                        
                        {gameStatus === 'FINISHED' && resultColor && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 animate-in fade-in duration-300 backdrop-blur-sm">
                                <div className="text-center scale-150">
                                    <div 
                                        className={cn(
                                            "w-32 h-32 rounded-2xl flex items-center justify-center text-6xl font-black shadow-[0_0_50px_rgba(0,0,0,0.5)] mb-4 animate-in zoom-in duration-500",
                                            getColorDisplay(resultColor).bg, getColorDisplay(resultColor).text
                                        )}
                                    >
                                        {result}
                                    </div>
                                    <h2 className="text-2xl font-bold text-white uppercase tracking-widest" data-testid="text-result">
                                        {getColorDisplay(resultColor).label}!
                                    </h2>
                                    <p className="text-muted-foreground mt-2">Próxima em {Math.ceil(nextGameIn / 1000)}s</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
