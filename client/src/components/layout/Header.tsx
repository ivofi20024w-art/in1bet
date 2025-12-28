import { Bell, Search, Wallet, ChevronDown, User as UserIcon, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PROFILE_MENU_ITEMS } from "@/lib/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { WalletModal } from "@/components/wallet/WalletModal";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { getStoredAuth, logout as authLogout, getWallet, type User } from "@/lib/auth";

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const auth = getStoredAuth();
      setIsAuthenticated(auth.isAuthenticated);
      setUser(auth.user);
      
      if (auth.isAuthenticated && auth.accessToken) {
        const wallet = await getWallet();
        if (wallet) {
          setWalletBalance(wallet.balance);
        }
      } else {
        setWalletBalance(0);
      }
    };
    
    checkAuth();
    
    const handleStorageChange = () => checkAuth();
    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(checkAuth, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const getDisplayName = () => {
    if (!user?.name) return "Usuário";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    return parts[0];
  };

  const getInitials = () => {
    if (!user?.name) return "U";
    const parts = user.name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const handleLogout = async () => {
      await authLogout();
      setIsAuthenticated(false);
      setUser(null);
      setWalletBalance(0);
      setLocation("/login");
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar jogos, provedores, eventos..." 
            className="pl-9 bg-secondary/30 border-white/5 focus-visible:ring-primary/50 h-10 rounded-xl text-sm w-full transition-all focus:bg-secondary/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isAuthenticated ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
                <Link href="/login">
                    <Button variant="ghost" className="font-bold text-muted-foreground hover:text-white">
                        Entrar
                    </Button>
                </Link>
                <Link href="/register">
                    <Button className="font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white rounded-xl">
                        Criar Conta
                    </Button>
                </Link>
            </div>
        ) : (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/5 relative">
                        <Bell className="w-5 h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    {/* Notification content same as before... */}
                    <DropdownMenuContent align="end" className="w-80 bg-card border-white/10 text-foreground p-0">
                        <div className="p-4 border-b border-white/5">
                            <h4 className="font-bold text-sm">Notificações</h4>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            <div className="p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5">
                                <p className="text-sm font-bold text-white mb-1">Bônus Creditado!</p>
                                <p className="text-xs text-muted-foreground">Seu bônus de depósito de R$ 50,00 foi creditado.</p>
                            </div>
                        </div>
                         <div className="p-2 text-center">
                            <Button variant="ghost" size="sm" className="text-xs text-primary w-full">Marcar como lidas</Button>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-6 w-px bg-white/10 mx-1" />

                <div className="flex items-center gap-2 bg-secondary/50 rounded-full pl-4 pr-1 py-1 border border-white/5 hover:border-primary/30 transition-colors cursor-pointer group">
                <div className="flex flex-col items-end leading-none mr-2">
                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Saldo</span>
                    <span className="text-sm font-bold text-primary tabular-nums group-hover:text-white transition-colors">
                    R$ {walletBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                </div>
                
                <WalletModal>
                    <Button size="sm" className="h-8 rounded-full px-4 bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_-3px_rgba(242,102,49,0.4)]">
                    <Wallet className="w-4 h-4 mr-2" />
                    Depósito
                    </Button>
                </WalletModal>
                </div>

                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all ml-2 bg-primary/20">
                    <span className="text-primary font-bold text-sm">{getInitials()}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-card border-white/10 text-foreground p-2">
                    <div className="px-2 py-1.5 mb-2">
                        <p className="font-bold text-sm text-white">{getDisplayName()}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    
                    <DropdownMenuSeparator className="bg-white/10" />
                    
                    {PROFILE_MENU_ITEMS.map((item) => {
                        if (item.label === 'Carteira') {
                            return (
                                <WalletModal key={item.path}>
                                    <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-white/5 focus:text-primary hover:bg-white/5 hover:text-primary w-full">
                                        <item.icon className="mr-2 h-4 w-4" />
                                        <span>{item.label}</span>
                                    </div>
                                </WalletModal>
                            )
                        }
                        return (
                            <Link key={item.path} href={item.path}>
                                <DropdownMenuItem className="cursor-pointer focus:bg-white/5 focus:text-primary">
                                    <item.icon className="mr-2 h-4 w-4" />
                                    <span>{item.label}</span>
                                </DropdownMenuItem>
                            </Link>
                        )
                    })}
                    
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </>
        )}
      </div>
    </header>
  );
}
