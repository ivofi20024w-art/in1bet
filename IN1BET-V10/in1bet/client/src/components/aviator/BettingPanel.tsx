import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface BettingPanelProps {
  id: number;
  gameState: "IDLE" | "BETTING" | "FLYING" | "CRASHED";
  onBet: (amount: number, autoCashoutAt?: number) => void;
  onCashout: () => void;
  isBetting: boolean;
  cashedOutAt: number | null;
  currentMultiplier: number;
  balance: number;
}

const MIN_BET = 0.10;
const QUICK_AMOUNTS = [0.10, 1, 5, 10];

export function BettingPanel({ 
  id, 
  gameState, 
  onBet, 
  onCashout,
  isBetting,
  cashedOutAt,
  currentMultiplier,
  balance
}: BettingPanelProps) {
  const [amount, setAmount] = useState(10.00);
  const [autoBet, setAutoBet] = useState(false);
  const [autoCashout, setAutoCashout] = useState(false);
  const [autoRounds, setAutoRounds] = useState(10);
  const [autoRoundsRemaining, setAutoRoundsRemaining] = useState(0);
  const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState(2.00);
  const [lastGameState, setLastGameState] = useState<string>("");

  useEffect(() => {
    if (autoBet && autoRoundsRemaining > 0 && gameState === "BETTING" && lastGameState === "CRASHED" && !isBetting) {
      if (amount <= balance && amount >= MIN_BET) {
        onBet(amount, autoCashout ? autoCashoutMultiplier : undefined);
        setAutoRoundsRemaining(prev => prev - 1);
      }
    }
    setLastGameState(gameState);
  }, [gameState, autoBet, autoRoundsRemaining, isBetting, amount, balance, autoCashout, autoCashoutMultiplier]);

  useEffect(() => {
    if (autoBet && autoRoundsRemaining === 0) {
      setAutoRoundsRemaining(autoRounds);
    }
  }, [autoBet]);

  useEffect(() => {
    if (!autoBet) {
      setAutoRoundsRemaining(0);
    }
  }, [autoBet]);

  const adjustAmount = (delta: number) => {
    setAmount(prev => Math.max(MIN_BET, prev + delta));
  };

  const handleAction = () => {
    if (gameState === "FLYING" && isBetting && !cashedOutAt) {
      onCashout();
    } else if ((gameState === "IDLE" || gameState === "BETTING") && !isBetting) {
      if (amount > balance) {
        return;
      }
      if (amount < MIN_BET) {
        return;
      }
      onBet(amount, autoCashout ? autoCashoutMultiplier : undefined);
    }
  };

  const getButtonState = () => {
    if (gameState === "FLYING" && isBetting && !cashedOutAt) {
      return {
        text: (
          <div className="flex flex-col items-center leading-tight">
            <span className="text-sm font-bold opacity-80">SACAR</span>
            <span className="text-xl font-mono">{(amount * currentMultiplier).toFixed(2)}</span>
          </div>
        ),
        color: "bg-secondary hover:bg-secondary/90 text-black border-secondary/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
      };
    }
    
    if (isBetting && !cashedOutAt) {
      return {
        text: (
          <div className="flex flex-col items-center leading-tight">
            <span className="text-sm font-bold opacity-80">AGUARDANDO</span>
            <span className="text-sm font-bold">PROXIMA RODADA</span>
          </div>
        ),
        color: "bg-destructive/50 text-white/50 cursor-not-allowed border-destructive/20"
      };
    }

    if (cashedOutAt) {
       return {
        text: (
          <div className="flex flex-col items-center leading-tight">
            <span className="text-sm font-bold opacity-80">SACADO</span>
            <span className="text-xl font-mono">{(amount * cashedOutAt).toFixed(2)}</span>
          </div>
        ),
        color: "bg-muted text-muted-foreground border-white/5 cursor-default"
      };
    }

    return {
      text: (
        <div className="flex flex-col items-center leading-tight">
          <span className="text-xl font-bold tracking-widest">APOSTAR</span>
          <div className="text-xs font-normal opacity-70 flex gap-1">
            <span className="font-mono">{amount.toFixed(2)}</span> BRL
          </div>
        </div>
      ),
      color: "bg-primary hover:bg-primary/90 text-white border-primary/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
    };
  };

  const btnState = getButtonState();
  const isDisabled = gameState === "CRASHED" || (amount > balance && !isBetting) || (amount < MIN_BET && !isBetting);

  return (
    <div className="bg-card rounded-xl border border-white/5 p-2 flex flex-col gap-2 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex flex-col gap-2 px-1">
        <div className="flex gap-4 text-[10px] text-muted-foreground">
           <div className="flex items-center gap-2">
            <Switch 
              id={`autobet-${id}`} 
              checked={autoBet}
              onCheckedChange={setAutoBet}
              className="scale-75" 
            />
            <Label htmlFor={`autobet-${id}`} className="cursor-pointer font-bold">Auto</Label>
           </div>
           <div className="flex items-center gap-2">
            <Switch 
              id={`autocash-${id}`} 
              checked={autoCashout}
              onCheckedChange={setAutoCashout}
              className="scale-75" 
            />
            <Label htmlFor={`autocash-${id}`} className="cursor-pointer font-bold">Saque Auto</Label>
           </div>
        </div>
        
        {(autoBet || autoCashout) && (
          <div className="flex gap-2 text-[10px]">
            {autoBet && (
              <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-white/10">
                <span className="text-muted-foreground">Rodadas:</span>
                <Input 
                  type="number"
                  value={autoRounds}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(100, Number(e.target.value)));
                    setAutoRounds(val);
                    setAutoRoundsRemaining(val);
                  }}
                  min={1}
                  max={100}
                  className="h-5 w-12 text-center font-mono text-xs bg-transparent border-none focus-visible:ring-0 p-0"
                />
                {autoRoundsRemaining > 0 && (
                  <span className="text-secondary font-bold">({autoRoundsRemaining})</span>
                )}
              </div>
            )}
            {autoCashout && (
              <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-white/10">
                <span className="text-muted-foreground">Sacar em:</span>
                <Input 
                  type="number"
                  value={autoCashoutMultiplier}
                  onChange={(e) => setAutoCashoutMultiplier(Math.max(1.01, Number(e.target.value)))}
                  min={1.01}
                  step={0.1}
                  className="h-5 w-14 text-center font-mono text-xs bg-transparent border-none focus-visible:ring-0 p-0"
                />
                <span className="text-muted-foreground">x</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <div className="bg-black/40 rounded-lg p-1.5 border border-white/5 flex flex-col gap-1">
          <div className="flex justify-between items-center px-1">
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10"
                onClick={() => adjustAmount(-1)}
              >
               <Minus className="h-3 w-3" />
             </Button>
             <div className="text-center">
                <Input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(Math.max(MIN_BET, Number(e.target.value)))}
                  min={MIN_BET}
                  step={0.10}
                  className="h-8 w-24 text-center font-mono font-bold text-lg bg-transparent border-none focus-visible:ring-0 p-0"
                />
             </div>
             <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full bg-white/5 hover:bg-white/10"
                onClick={() => adjustAmount(1)}
              >
               <Plus className="h-3 w-3" />
             </Button>
          </div>
          <div className="grid grid-cols-4 gap-1 px-1">
             {QUICK_AMOUNTS.map(val => (
               <button 
                key={val}
                onClick={() => setAmount(val)}
                className="text-[10px] bg-white/5 hover:bg-white/10 rounded py-0.5 font-mono text-muted-foreground transition-colors"
               >
                 {val < 1 ? val.toFixed(2) : val.toFixed(0)}
               </button>
             ))}
          </div>
        </div>

        <Button 
          className={cn(
            "w-32 h-full rounded-lg border-2 text-lg font-bold transition-all duration-100 active:scale-95",
            btnState.color
          )}
          onClick={handleAction}
          disabled={isDisabled}
        >
          {btnState.text}
        </Button>
      </div>
    </div>
  );
}
