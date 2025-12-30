import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { HelpCircle, ShieldCheck, Gamepad2, Bomb } from "lucide-react";

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();

  return (
    <aside className={cn("flex flex-col h-full w-[240px] bg-sidebar border-r border-white/5 py-6 px-3", className)}>
      <div className="mb-8 px-4">
        <h1 className="text-2xl font-bold font-heading italic text-primary tracking-wide">
          IN1<span className="text-white">BET</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6">
          <div className="space-y-1">
              <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Jogos</h3>
              
              <Link href="/games/mines" className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                location === "/games/mines"
                  ? "bg-primary text-white shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)]" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}>
                <Bomb className={cn("w-4 h-4", location === "/games/mines" ? "text-white" : "text-blue-400")} />
                <span>Mines</span>
                <span className="ml-auto text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">AO VIVO</span>
              </Link>
          </div>
      </div>

      <div className="mt-auto space-y-1 pt-6 border-t border-white/5">
        <Link href="/support" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
            <HelpCircle className="w-5 h-5" />
            Suporte
        </Link>
        <Link href="/responsible-gaming" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
            <ShieldCheck className="w-5 h-5" />
            Jogo Responsável
        </Link>
      </div>
    </aside>
  );
}
