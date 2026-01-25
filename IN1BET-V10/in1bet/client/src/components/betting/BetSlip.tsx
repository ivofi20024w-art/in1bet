import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, X, Loader2 } from "lucide-react";
import { useBetSlipStore } from "@/stores/betslip-store";
import { usePlaceBet } from "@/hooks/use-sports";
import { useAuth } from "@/hooks/useAuth";
import { getWallet } from "@/lib/auth";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function BetSlip() {
  const { items, stake, setStake, removeSelection, clearSlip, getTotalOdds, getPotentialWin } = useBetSlipStore();
  const { user, isAuthenticated } = useAuth();
  const placeBetMutation = usePlaceBet();
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchWallet = async () => {
      if (isAuthenticated) {
        const wallet = await getWallet();
        if (wallet) {
          setWalletBalance(wallet.balance);
        }
      }
    };
    fetchWallet();
    const interval = setInterval(fetchWallet, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const totalOdds = getTotalOdds();
  const potentialWin = getPotentialWin();
  const validStake = stake >= 1;
  const hasBalance = walletBalance >= stake;

  const handlePlaceBet = async () => {
    if (!user) return;
    if (!validStake || !hasBalance) return;
    if (items.length === 0) return;

    const betType = items.length === 1 ? "SINGLE" : "MULTIPLE";
    
    await placeBetMutation.mutateAsync({
      selections: items.map(item => ({
        matchId: item.matchId,
        oddId: item.oddId,
        odds: item.odds,
      })),
      stake,
      betType,
    });

    clearSlip();
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-4">
        <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center">
          <FileTextIcon className="w-8 h-8 opacity-50" />
        </div>
        <p>Seu boletim está vazio</p>
        <p className="text-xs">Selecione odds para adicionar apostas aqui.</p>
        <Link href="/sports">
          <Button variant="outline" className="mt-4 border-white/10 hover:bg-white/5">
            Ver Jogos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="px-3 py-2.5 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary/20 px-1.5 py-1 rounded text-primary font-bold text-xs">{items.length}</div>
          <h3 className="font-heading font-bold text-white text-sm">Boletim de Apostas</h3>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-muted-foreground hover:text-red-400" 
          onClick={clearSlip}
          data-testid="clear-betslip"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-2">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="bg-secondary/20 border border-white/5 rounded-lg p-2.5 relative group hover:border-primary/30 transition-colors"
            >
              <button 
                onClick={() => removeSelection(item.oddId)}
                className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-white opacity-70 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                data-testid={`remove-selection-${item.oddId}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="pr-5">
                {item.match?.homeTeam?.name && item.match?.awayTeam?.name ? (
                  <>
                    <p className="text-[10px] text-muted-foreground mb-0.5 truncate">
                      {item.match.league?.name || "Futebol"}
                    </p>
                    <p className="text-xs font-bold text-white mb-0.5 truncate">
                      {item.match.homeTeam.name} vs {item.match.awayTeam.name}
                    </p>
                  </>
                ) : null}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold bg-white/10 px-1 py-0.5 rounded text-white">{item.odds.toFixed(2)}</span>
                  <span className="text-[9px] text-muted-foreground uppercase">
                    {item.match?.isLive ? "AO VIVO" : "Pré-Jogo"}
                  </span>
                </div>
                <p className="text-xs font-bold text-primary mt-0.5">{item.selectionName}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="px-3 py-2.5 border-t border-white/5 space-y-2.5 bg-secondary/10">
        {items.length > 1 && (
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Tipo de Aposta</span>
            <span className="font-bold text-primary">Múltipla ({items.length})</span>
          </div>
        )}
        
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs text-white font-bold">Valor da Aposta</span>
            {isAuthenticated && (
              <span className="text-[10px] text-muted-foreground">
                Saldo: R$ {walletBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">R$</span>
            <Input 
              type="number" 
              value={stake}
              onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
              className="pl-9 h-9 bg-background border-white/10 font-bold focus-visible:ring-primary text-sm"
              placeholder="0.00"
              min={1}
              data-testid="stake-input"
            />
          </div>
          {!hasBalance && isAuthenticated && stake > 0 && (
            <p className="text-[10px] text-red-400">Saldo insuficiente</p>
          )}
        </div>

        <div className="flex justify-between items-center py-1.5 border-t border-white/5 border-dashed">
          <span className="text-xs text-muted-foreground">Retorno Potencial</span>
          <span className="text-base font-bold text-green-500">
            R$ {potentialWin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
          <span>Odds Totais: <strong className="text-white">{totalOdds.toFixed(2)}</strong></span>
        </div>

        {!isAuthenticated ? (
          <Link href="/auth">
            <Button 
              className="w-full h-10 text-sm font-bold bg-primary hover:bg-primary/90 text-white"
              data-testid="login-to-bet"
            >
              FAÇA LOGIN PARA APOSTAR
            </Button>
          </Link>
        ) : (
          <Button 
            className={cn(
              "w-full h-10 text-sm font-bold text-white",
              hasBalance && validStake 
                ? "bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(242,102,49,0.4)]"
                : "bg-muted cursor-not-allowed"
            )}
            onClick={handlePlaceBet}
            disabled={!validStake || !hasBalance || placeBetMutation.isPending}
            data-testid="place-bet-button"
          >
            {placeBetMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                PROCESSANDO...
              </>
            ) : (
              "APOSTAR"
            )}
          </Button>
        )}
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
