import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface HistoryItem {
  crashPoint: number;
  roundId: number;
}

interface HistoryBarProps {
  history: HistoryItem[];
}

export function HistoryBar({ history }: HistoryBarProps) {
  return (
    <div className="h-10 bg-black/40 flex items-center px-4 border-b border-white/5 gap-2 relative z-10">
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0 mr-2 border-r border-white/5 pr-4 h-full">
        <Clock className="w-3 h-3" />
        Historico
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto no-scrollbar mask-fade-right pb-4 mb-[-16px]">
          {history.map((item, i) => (
            <Badge
              key={item.roundId || i}
              variant="outline"
              className={cn(
                "font-mono border-0 px-2 py-0.5 h-6 text-xs min-w-[3rem] justify-center transition-all hover:scale-105 cursor-default",
                item.crashPoint < 2 
                  ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]" 
                  : item.crashPoint < 10 
                    ? "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]"
                    : "bg-primary/10 text-primary hover:bg-primary/20 shadow-[0_0_10px_rgba(244,114,182,0.1)]"
              )}
            >
              {item.crashPoint.toFixed(2)}x
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
