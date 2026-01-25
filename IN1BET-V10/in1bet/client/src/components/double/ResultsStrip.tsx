import type { DoubleRoundResult, DoubleGameStats } from "@shared/schema";
import { ResultTile } from "./ResultTile";
import { Dices, Rotate3D, Crown, Square } from "lucide-react";

interface ResultsStripProps {
  previousRounds: DoubleRoundResult[];
  last100Stats: DoubleGameStats;
}

export function ResultsStrip({ previousRounds, last100Stats }: ResultsStripProps) {
  const historyRounds = previousRounds.slice(-8).reverse();
  
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-white/[0.02] shadow-lg overflow-hidden p-4" data-testid="results-panel">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-[13px]">Rodadas anteriores</span>
          <div className="flex gap-2 flex-wrap" data-testid="previous-rounds">
            {historyRounds.map((round, index) => (
              <ResultTile key={`history-${round.id}-${index}`} type={round.type} size="small" />
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-[13px]">Últimas 100</span>
          <div className="flex gap-2 flex-wrap" data-testid="last-100-stats">
            <StatChip icon={Square} value={last100Stats.black} color="white" testId="stat-black" />
            <StatChip icon={Dices} value={last100Stats.red} color="#ea3f37" testId="stat-red" />
            <StatChip icon={Rotate3D} value={last100Stats.green} color="#3fc858" testId="stat-green" />
            <StatChip icon={Crown} value={last100Stats.crown} color="#fac945" testId="stat-crown" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatChipProps {
  icon: React.ElementType;
  value: number;
  color: string;
  testId: string;
}

function StatChip({ icon: Icon, value, color, testId }: StatChipProps) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-[10px] border border-white/10 bg-white/[0.03] text-muted-foreground text-[13px]" data-testid={testId}>
      <Icon className="w-4 h-4 opacity-90" style={{ color }} />
      <span>{value}</span>
    </div>
  );
}
