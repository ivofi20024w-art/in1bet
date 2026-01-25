import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

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
    <div className="bg-card border border-white/5 rounded-xl p-4 hover:border-primary/50 transition-all hover:bg-secondary/20 group cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md">
      {isLive && (
          <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full -mr-8 -mt-8 animate-pulse pointer-events-none" />
      )}
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
          )}
          <span className={cn("text-xs font-bold uppercase tracking-wider", isLive ? "text-red-400" : "text-muted-foreground")}>
            {isLive ? "Ao Vivo" : time}
          </span>
          <span className="text-xs text-muted-foreground border-l border-white/10 pl-2 ml-1">{league}</span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-white group-hover:text-primary transition-colors">{home}</span>
            {score && <span className="font-heading font-bold text-xl text-primary tabular-nums">{score.split(' - ')[0]}</span>}
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-white group-hover:text-primary transition-colors">{away}</span>
            {score && <span className="font-heading font-bold text-xl text-primary tabular-nums">{score.split(' - ')[1]}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 relative z-10" onClick={(e) => e.preventDefault()}>
        <button className="flex flex-col items-center justify-center bg-secondary/50 hover:bg-primary hover:text-white rounded-lg p-2 transition-all duration-200 group/btn border border-white/5 hover:border-primary">
          <span className="text-[10px] text-muted-foreground group-hover/btn:text-white/80 mb-0.5 font-medium">1</span>
          <div className="flex items-center gap-1">
            <span className="font-heading font-bold text-lg leading-none">{odds.home.toFixed(2)}</span>
            {/* Simulation of odds movement */}
            {Math.random() > 0.7 && <ArrowUp className="w-3 h-3 text-green-500 group-hover/btn:text-white" />}
          </div>
        </button>
        <button className="flex flex-col items-center justify-center bg-secondary/50 hover:bg-primary hover:text-white rounded-lg p-2 transition-all duration-200 group/btn border border-white/5 hover:border-primary">
          <span className="text-[10px] text-muted-foreground group-hover/btn:text-white/80 mb-0.5 font-medium">X</span>
          <span className="font-heading font-bold text-lg leading-none">{odds.draw ? odds.draw.toFixed(2) : '-'}</span>
        </button>
        <button className="flex flex-col items-center justify-center bg-secondary/50 hover:bg-primary hover:text-white rounded-lg p-2 transition-all duration-200 group/btn border border-white/5 hover:border-primary">
          <span className="text-[10px] text-muted-foreground group-hover/btn:text-white/80 mb-0.5 font-medium">2</span>
          <div className="flex items-center gap-1">
             <span className="font-heading font-bold text-lg leading-none">{odds.away.toFixed(2)}</span>
             {Math.random() > 0.8 && <ArrowDown className="w-3 h-3 text-red-500 group-hover/btn:text-white" />}
          </div>
        </button>
      </div>
    </div>
  );
}
