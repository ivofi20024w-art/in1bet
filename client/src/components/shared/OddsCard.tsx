import { cn } from "@/lib/utils";

interface MatchOddsProps {
  home: number;
  draw?: number | null;
  away: number;
}

interface OddsCardProps {
  league: string;
  home: string;
  away: string;
  time: string;
  score?: string | null;
  odds: MatchOddsProps;
  isLive?: boolean;
}

export function OddsCard({ league, home, away, time, score, odds, isLive }: OddsCardProps) {
  return (
    <div className="bg-card border border-white/5 rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          )}
          <span className={cn("text-xs font-medium uppercase tracking-wider", isLive ? "text-red-400" : "text-muted-foreground")}>
            {isLive ? "Ao Vivo" : time}
          </span>
          <span className="text-xs text-muted-foreground">• {league}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between w-32 md:w-40">
            <span className="font-semibold text-sm">{home}</span>
            {score && <span className="font-heading font-bold text-lg text-primary">{score.split(' - ')[0]}</span>}
          </div>
          <div className="flex items-center justify-between w-32 md:w-40">
            <span className="font-semibold text-sm">{away}</span>
            {score && <span className="font-heading font-bold text-lg text-primary">{score.split(' - ')[1]}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <button className="flex flex-col items-center justify-center bg-secondary/50 hover:bg-primary hover:text-white rounded-lg p-2 transition-colors group">
          <span className="text-[10px] text-muted-foreground group-hover:text-white/80 mb-0.5">1</span>
          <span className="font-heading font-bold text-lg leading-none">{odds.home.toFixed(2)}</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-secondary/50 hover:bg-primary hover:text-white rounded-lg p-2 transition-colors group">
          <span className="text-[10px] text-muted-foreground group-hover:text-white/80 mb-0.5">X</span>
          <span className="font-heading font-bold text-lg leading-none">{odds.draw ? odds.draw.toFixed(2) : '-'}</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-secondary/50 hover:bg-primary hover:text-white rounded-lg p-2 transition-colors group">
          <span className="text-[10px] text-muted-foreground group-hover:text-white/80 mb-0.5">2</span>
          <span className="font-heading font-bold text-lg leading-none">{odds.away.toFixed(2)}</span>
        </button>
      </div>
    </div>
  );
}
