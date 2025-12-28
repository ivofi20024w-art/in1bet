import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MENU_ITEMS } from "@/lib/mockData";
import { LogOut, HelpCircle, ShieldCheck } from "lucide-react";

export function Sidebar({ className }: { className?: string }) {
  const [location] = useLocation();

  return (
    <aside className={cn("flex flex-col h-full w-[240px] bg-sidebar border-r border-white/5 py-6 px-3", className)}>
      <div className="mb-8 px-4">
        <h1 className="text-2xl font-bold font-heading italic text-primary tracking-wide">
          PRIME<span className="text-white">BET</span>
        </h1>
      </div>

      <nav className="flex-1 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <a className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                isActive 
                  ? "bg-primary text-white shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)]" 
                  : "text-muted-foreground hover:text-white hover:bg-white/5"
              )}>
                <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground group-hover:text-white")} />
                {item.label}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent pointer-events-none" />
                )}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 pt-6 border-t border-white/5">
        <Link href="/support">
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
            <HelpCircle className="w-5 h-5" />
            Suporte 24/7
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
