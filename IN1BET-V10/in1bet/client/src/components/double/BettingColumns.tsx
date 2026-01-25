import type { DoubleBetType, DoubleBet } from "@shared/schema";
import { BettingColumn } from "./BettingColumn";

interface BettingColumnsProps {
  bets: {
    red: DoubleBet[];
    green: DoubleBet[];
    black: DoubleBet[];
    crown: DoubleBet[];
  };
  onPlaceBet: (type: DoubleBetType) => void;
  disabled?: boolean;
}

export function BettingColumns({ bets, onPlaceBet, disabled = false }: BettingColumnsProps) {
  const columns: DoubleBetType[] = ["red", "black", "green", "crown"];
  
  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5" data-testid="betting-columns">
      {columns.map((type) => (
        <BettingColumn
          key={type}
          type={type}
          bets={bets[type]}
          onPlaceBet={onPlaceBet}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
