import { useState, useEffect } from "react";

interface BetControlsProps {
  betAmount: number;
  onBetAmountChange: (amount: number) => void;
  balance: number;
  disabled?: boolean;
}

export function BetControls({ betAmount, onBetAmountChange, balance, disabled = false }: BetControlsProps) {
  const [inputValue, setInputValue] = useState(betAmount.toString());
  
  useEffect(() => {
    setInputValue(betAmount.toString());
  }, [betAmount]);
  
  const handleInputChange = (value: string) => {
    setInputValue(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onBetAmountChange(parsed);
    }
  };
  
  const handleQuickBet = (action: string) => {
    let newAmount = betAmount;
    switch (action) {
      case "+1":
        newAmount = betAmount + 1;
        break;
      case "+10":
        newAmount = betAmount + 10;
        break;
      case "+50":
        newAmount = betAmount + 50;
        break;
      case "+100":
        newAmount = betAmount + 100;
        break;
      case "2x":
        newAmount = betAmount * 2;
        break;
      case "max":
        newAmount = balance;
        break;
    }
    newAmount = Math.min(newAmount, balance);
    newAmount = Math.max(0.01, newAmount);
    newAmount = parseFloat(newAmount.toFixed(2));
    setInputValue(newAmount.toString());
    onBetAmountChange(newAmount);
  };
  
  const quickButtons = ["+1", "+10", "+50", "+100", "2x"];
  
  return (
    <div className={`mt-4 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] shadow-lg overflow-hidden ${disabled ? "opacity-50" : ""}`} data-testid="bet-controls-panel">
      <div className="p-4">
        <div className="flex items-center justify-between text-muted-foreground text-[13px] mb-2.5">
          <span>Valor da Aposta</span>
          {disabled && <span className="text-red-400 text-xs">Apostas fechadas</span>}
        </div>
        
        <div className="flex gap-3 items-center">
          <div className={`flex-1 flex items-center gap-2.5 px-3 py-3 rounded-xl border border-white/10 bg-black/20 ${disabled ? "opacity-60" : ""}`}>
            <span className="text-green-500 font-bold text-sm">R$</span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full bg-transparent border-0 outline-none text-white text-base font-medium"
              placeholder="0.00"
              data-testid="input-bet-amount"
              disabled={disabled}
            />
          </div>
          
          <button
            onClick={() => !disabled && handleQuickBet("max")}
            disabled={disabled}
            className={`px-4 py-3 rounded-xl border border-green-500/50 bg-white/[0.03] text-white font-medium transition-all ${
              disabled ? "cursor-not-allowed opacity-60" : "hover:bg-white/[0.06] active:scale-95"
            }`}
            data-testid="button-max-bet"
          >
            Máx
          </button>
        </div>
        
        <div className="flex gap-2.5 mt-3 flex-wrap">
          {quickButtons.map((btn, index) => (
            <button
              key={`${btn}-${index}`}
              onClick={() => !disabled && handleQuickBet(btn)}
              disabled={disabled}
              className={`min-w-[80px] px-3 py-2.5 rounded-xl border border-white/10 text-muted-foreground transition-all ${
                disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-white/[0.06] active:scale-95"
              } ${index === 0 && !disabled ? "bg-gradient-to-r from-green-500/30 to-yellow-500/30 text-white/90" : "bg-white/[0.03]"}`}
              data-testid={`button-quick-bet-${index}`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
