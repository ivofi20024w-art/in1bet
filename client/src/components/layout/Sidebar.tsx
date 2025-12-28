import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { CASINO_MENU, SPORTS_MENU } from "@/lib/mockData";
import { HelpCircle, ShieldCheck, Gamepad2 } from "lucide-react";

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();

  const renderMenuItem = (item: any) => {
      const isActive = location === item.path;
      return (
        <Link key={item.path} href={item.path}>
          <a className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
            isActive 
              ? "bg-primary text-white shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)]" 
              : "text-muted-foreground hover:text-white hover:bg-white/5"
          )}>
            <item.icon className={cn("w-4 h-4", isActive ? "text-white" : "text-muted-foreground group-hover:text-white")} />
            {item.label}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
            )}
          </a>
        </Link>
      );
  };

  return (
    <aside className={cn("flex flex-col h-full w-[240px] bg-sidebar border-r border-white/5 py-6 px-3", className)}>
      <div className="mb-8 px-4">
        <h1 className="text-2xl font-bold font-heading italic text-primary tracking-wide">
          IN1<span className="text-white">BET</span>
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-6">
          {/* Casino Section */}
          <div className="space-y-1">
              <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Casino</h3>
              {CASINO_MENU.map(renderMenuItem)}
              
              {/* Originals Sub-menu Simulation */}
              <div className="pl-11 pr-4 space-y-1">
                 <Link href="/games/crash">
                    <a className="block text-xs text-muted-foreground hover:text-white py-1 font-bold text-primary">🚀 Crashmania</a>
                 </Link>
                 <Link href="/originals/double">
                    <a className="block text-xs text-muted-foreground hover:text-white py-1">Double</a>
                 </Link>
                 <Link href="/originals/mines">
                    <a className="block text-xs text-muted-foreground hover:text-white py-1">Mines</a>
                 </Link>
              </div>
          </div>

          {/* Sports Section */}
          <div className="space-y-1">
              <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Esportes</h3>
              {SPORTS_MENU.map(renderMenuItem)}
          </div>
      </div>

      <div className="mt-auto space-y-1 pt-6 border-t border-white/5">
        <Link href="/support">
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
            <HelpCircle className="w-5 h-5" />
            Suporte
          </a>
        </Link>
        <Link href="/responsible-gaming">
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
            <ShieldCheck className="w-5 h-5" />
            Jogo Responsável
          </a>
        </Link>
      </div>
    </aside>
  );
}
