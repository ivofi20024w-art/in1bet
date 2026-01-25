import type { DoubleBetType, DoubleBet } from "@shared/schema";
import { multipliers } from "@/lib/game-data";
import { Dices, Rotate3D, Crown, User } from "lucide-react";

interface BettingColumnProps {
  type: DoubleBetType;
  bets: DoubleBet[];
  onPlaceBet: (type: DoubleBetType) => void;
  disabled?: boolean;
}

const columnConfig: Record<DoubleBetType, { 
  label: string; 
  icon: React.ElementType; 
  headerBgClass: string;
  textColorClass: string;
  badgeTextColorClass: string;
}> = {
  red: { 
    label: "Vermelho", 
    icon: Dices, 
    headerBgClass: "bg-red-500",
    textColorClass: "text-white",
    badgeTextColorClass: "text-white/85"
  },
  green: { 
    label: "Verde", 
    icon: Rotate3D, 
    headerBgClass: "bg-green-500",
    textColorClass: "text-white",
    badgeTextColorClass: "text-white/85"
  },
  black: { 
    label: "Preto", 
    icon: Dices, 
    headerBgClass: "bg-zinc-800",
    textColorClass: "text-white",
    badgeTextColorClass: "text-white/85"
  },
  crown: { 
    label: "Coroa", 
    icon: Crown, 
    headerBgClass: "bg-yellow-500",
    textColorClass: "text-black/75",
    badgeTextColorClass: "text-black/70"
  },
};

export function BettingColumn({ type, bets, onPlaceBet, disabled = false }: BettingColumnProps) {
  const config = columnConfig[type];
  const Icon = config.icon;
  const multiplier = multipliers[type];
  const totalBets = bets.length;
  const totalAmount = bets.reduce((sum, bet) => sum + bet.amount, 0);
  
  const handleClick = () => {
    if (disabled) return;
    onPlaceBet(type);
  };

  return (
    <div 
      className={`rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] transition-all ${
        disabled 
          ? "opacity-50 cursor-not-allowed" 
          : "cursor-pointer hover:bg-white/[0.04] active:scale-[0.98]"
      }`}
      onClick={handleClick}
      data-testid={`button-bet-${type}`}
      aria-disabled={disabled}
    >
      <div 
        className={`px-3.5 py-3 flex items-center justify-between border-b border-white/10 ${config.headerBgClass}`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-[18px] h-[18px] opacity-90 ${config.textColorClass}`} />
          <span className={`font-bold ${config.textColorClass}`}>{config.label}</span>
        </div>
        <span className={`font-bold ${config.badgeTextColorClass}`} data-testid={`text-multiplier-${type}`}>
          x{multiplier}
        </span>
      </div>
      
      <div className="flex items-center justify-between px-3.5 py-2.5 text-muted-foreground text-[13px]">
        <span data-testid={`text-bets-count-${type}`}>{totalBets} Apostas</span>
        <div className="flex items-center gap-2">
          <span className="text-green-500 font-bold text-xs">R$</span>
          <span data-testid={`text-total-amount-${type}`}>{totalAmount.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="px-2.5 pb-3 max-h-[200px] overflow-y-auto">
        {bets.map((bet, index) => (
          <div 
            key={bet.id}
            className="flex items-center justify-between px-2.5 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors"
            data-testid={`row-bet-${type}-${index}`}
          >
            <div className="flex items-center gap-2.5 text-white/80 text-[13px]">
              <User className="w-4 h-4 opacity-75" />
              <span data-testid={`text-username-${type}-${index}`}>{bet.username}</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 text-[13px]">
              <span className="text-green-500 font-bold text-xs">R$</span>
              <span data-testid={`text-bet-amount-${type}-${index}`}>{bet.amount.toFixed(2)}</span>
            </div>
          </div>
        ))}
        
        {bets.length === 0 && (
          <div className="px-2.5 py-4 text-center text-muted-foreground/50 text-[13px]" data-testid={`text-no-bets-${type}`}>
            Sem apostas ainda
          </div>
        )}
      </div>
    </div>
  );
}
