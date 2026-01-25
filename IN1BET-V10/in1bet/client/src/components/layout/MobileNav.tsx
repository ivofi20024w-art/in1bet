import { Home, Gamepad2, Menu, Wallet, Gift } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/stores/authModalStore";

export function MobileNav() {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();

  const handleWalletClick = () => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
  };

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Jogos", icon: Gamepad2, path: "/casino" },
    { label: "Carteira", icon: Wallet, path: "/wallet", special: true },
    { label: "Promoções", icon: Gift, path: "/promotions" },
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
                  <Link 
                    href={isAuthenticated ? item.path : "#"}
                    onClick={!isAuthenticated ? handleWalletClick : undefined}
                    className="block"
                  >
                    <div 
                      className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_0_20px_-5px_rgba(242,102,49,0.6)] border-4 border-background cursor-pointer hover-elevate active-elevate-2"
                      data-testid="button-wallet-mobile"
                    >
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                  </Link>
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <Link 
                key={item.path} 
                href={item.path} 
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
                data-testid={`link-nav-${item.label.toLowerCase()}`}
              >
                  <item.icon className={cn("w-5 h-5", isActive && "fill-current")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button 
                className="flex flex-col items-center justify-center gap-1 w-12 h-12 rounded-xl text-muted-foreground transition-colors"
                data-testid="button-menu-mobile"
              >
                <Menu className="w-5 h-5" />
                <span className="text-[10px] font-medium">Menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 border-l border-white/10 bg-sidebar w-[280px]">
              <SheetTitle className="sr-only">Menu Principal</SheetTitle>
              <Sidebar isMobile />
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {/* Spacer to prevent content from being hidden behind the bar */}
      <div className="lg:hidden h-16" />
    </>
  );
}
