import { Home, PlayCircle, FileText, Gamepad2, Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useState } from "react";

export function MobileNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Ao Vivo", icon: PlayCircle, path: "/live-betting" },
    { label: "Boletim", icon: FileText, path: "/betslip", special: true }, // Mock path
    { label: "Casino", icon: Gamepad2, path: "/casino" },
  ];

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-xl border-t border-white/10 z-50 px-2 pb-safe">
        <div className="flex items-center justify-around h-full">
          {navItems.map((item) => {
            const isActive = location === item.path;
            
            if (item.special) {
              return (
                <div key={item.label} className="relative -top-5">
                  <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_-5px_rgba(242,102,49,0.6)] border-4 border-background cursor-pointer hover:scale-105 transition-transform">
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <Link key={item.path} href={item.path} className={cn(
                "flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-all",
                isActive ? "text-primary" : "text-muted-foreground hover:text-white"
              )}>
                  <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl text-muted-foreground hover:text-white transition-all">
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-medium">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 border-l border-white/10 bg-sidebar w-[280px]">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* Spacer to prevent content from being hidden behind the bar */}
      <div className="lg:hidden h-16" />
    </>
  );
}
