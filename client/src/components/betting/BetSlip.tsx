import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// Mock initial bets for the prototype
const MOCK_BETS = [
    { id: 1, event: "Flamengo vs Palmeiras", selection: "Flamengo Vence", odds: 2.85, type: "Ao Vivo" },
    { id: 2, event: "Lakers vs Warriors", selection: "Over 220.5 Pontos", odds: 1.90, type: "Pré-Jogo" },
];

export function BetSlip() {
    const [bets, setBets] = useState(MOCK_BETS);
    const [stake, setStake] = useState("10");

    const totalOdds = bets.reduce((acc, bet) => acc * bet.odds, 1);
    const potentialReturn = (parseFloat(stake) * totalOdds).toFixed(2);
    const validStake = !isNaN(parseFloat(stake)) && parseFloat(stake) > 0;

    const removeBet = (id: number) => {
        setBets(bets.filter(b => b.id !== id));
    };

    const placeBet = () => {
        if (!validStake) return;
        toast.success("Aposta realizada com sucesso!");
        setBets([]);
        setStake("");
    };

    if (bets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center">
                    <FileTextIcon className="w-8 h-8 opacity-50" />
                </div>
                <p>Seu boletim está vazio</p>
                <p className="text-xs">Selecione odds para adicionar apostas aqui.</p>
                <Button variant="outline" className="mt-4 border-white/10 hover:bg-white/5" onClick={() => window.history.back()}>
                    Ver Jogos
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-card">
            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/20 p-1.5 rounded text-primary font-bold text-xs">{bets.length}</div>
                    <h3 className="font-heading font-bold text-white">Boletim de Apostas</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400" onClick={() => setBets([])}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                    {bets.map((bet) => (
                        <div key={bet.id} className="bg-secondary/20 border border-white/5 rounded-lg p-3 relative group hover:border-primary/30 transition-colors">
                            <button 
                                onClick={() => removeBet(bet.id)}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="pr-6">
                                <p className="text-sm font-bold text-primary mb-1">{bet.selection}</p>
                                <p className="text-xs text-white font-medium mb-0.5">{bet.event}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-xs font-bold bg-white/10 px-1.5 py-0.5 rounded text-white">{bet.odds.toFixed(2)}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{bet.type}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-white/5 space-y-4 bg-secondary/10">
                {bets.length > 1 && (
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Tipo de Aposta</span>
                        <span className="font-bold text-primary">Múltipla ({bets.length})</span>
                    </div>
                )}
                
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-white font-bold">Valor da Aposta</span>
                        <span className="text-xs text-muted-foreground">Saldo: R$ 2.450,50</span>
                    </div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                        <Input 
                            type="number" 
                            value={stake}
                            onChange={(e) => setStake(e.target.value)}
                            className="pl-10 bg-background border-white/10 font-bold focus-visible:ring-primary"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="flex justify-between items-center py-2 border-t border-white/5 border-dashed">
                    <span className="text-sm text-muted-foreground">Retorno Potencial</span>
                    <span className="text-lg font-bold text-green-500">R$ {potentialReturn}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Odds Totais: <strong className="text-white">{totalOdds.toFixed(2)}</strong></span>
                </div>

                <Button 
                    className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_-5px_rgba(242,102,49,0.4)]"
                    onClick={placeBet}
                    disabled={!validStake}
                >
                    APOSTAR
                </Button>
            </div>
        </div>
    );
}

function FileTextIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" x2="8" y1="13" y2="13" />
            <line x1="16" x2="8" y1="17" y2="17" />
            <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
    );
}
