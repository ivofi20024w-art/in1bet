import { Search, Wallet, ChevronDown, User as UserIcon, LogOut, LogIn, X, Gamepad2, Loader2, Star, Zap } from "lucide-react";
import { NotificationBell } from "@/components/notifications/NotificationBell";
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
import { GameIframeModal } from "@/components/shared/GameIframeModal";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
import { getStoredAuth, logout as authLogout, getWallet, type User } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuthModal } from "@/stores/authModalStore";

interface SearchGame {
  id: string;
  idHash: string;
  name: string;
  imageUrl: string | null;
  providerSlug: string;
}

export function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [location, setLocation] = useLocation();
  
  const isGamePage = location.startsWith('/double') || 
                     location.startsWith('/crash') || 
                     location.startsWith('/mines') || 
                     location.startsWith('/plinko') ||
                     location.startsWith('/slots') ||
                     location.startsWith('/aviator');
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [currentGameName, setCurrentGameName] = useState<string>("");
  const searchRef = useRef<HTMLDivElement>(null);
  const { openLogin, openRegister } = useAuthModal();

  const { data: searchResults = [], isLoading: isSearching } = useQuery<SearchGame[]>({
    queryKey: ['search-games', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];
      const res = await fetch(`/api/slotsgateway/games?search=${encodeURIComponent(searchQuery)}&limit=10`, { 
        credentials: 'include' 
      });
      const data = await res.json();
      if (!data.success) return [];
      return data.data || [];
    },
    enabled: searchQuery.length >= 2,
    staleTime: 30000,
  });

  interface LevelInfo {
    level: number;
    xp: number;
    xpProgress: number;
    xpNeeded: number;
    progressPercent: number;
  }

  const { data: levelInfo } = useQuery<LevelInfo>({
    queryKey: ['user-level'],
    queryFn: async () => {
      const auth = getStoredAuth();
      if (!auth.accessToken) return null;
      const res = await fetch('/api/levels/info', {
        headers: { 'Authorization': `Bearer ${auth.accessToken}` },
        credentials: 'include',
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAuthenticated,
    staleTime: 60000,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setLocation("/");
  };

  const handleGameClick = async (game: SearchGame) => {
    setShowResults(false);
    setSearchQuery("");
    setCurrentGameName(game.name);
    
    try {
      const auth = getStoredAuth();
      const res = await fetch('/api/slotsgateway/launch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(auth.accessToken ? { 'Authorization': `Bearer ${auth.accessToken}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          idHash: game.idHash,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGameUrl(data.data.launchUrl);
        setGameModalOpen(true);
      } else if (data.error?.includes('Authentication')) {
        setLocation('/');
      }
    } catch (error) {
      console.error('Failed to launch game:', error);
    }
  };

  const handleCloseGameModal = useCallback(() => {
    setGameModalOpen(false);
    setGameUrl(null);
    setCurrentGameName("");
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        {/* Mobile Logo - only on small screens */}
        <Link href="/" className="md:hidden flex-shrink-0">
          <h1 className="text-xl font-bold font-heading italic text-primary tracking-wide cursor-pointer hover:opacity-80 transition-opacity">
            IN1<span className="text-white">BET</span>
          </h1>
        </Link>
        
        {/* Search - visible on md+ screens */}
        <div ref={searchRef} className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar jogos, provedores..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="pl-9 pr-9 bg-secondary/30 border-white/5 focus-visible:ring-primary/50 h-10 rounded-xl text-sm w-full transition-all focus:bg-secondary/50"
            data-testid="search-input"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(""); setShowResults(false); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {showResults && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-[400px] overflow-y-auto">
              {isSearching ? (
                <div className="p-6 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Gamepad2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum jogo encontrado para "{searchQuery}"</p>
                </div>
              ) : (
                <div className="py-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
                  </div>
                  {searchResults.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => handleGameClick(game)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                      data-testid={`search-result-${game.idHash}`}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                        {game.imageUrl ? (
                          <img src={game.imageUrl} alt={game.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{game.name}</p>
                        <p className="text-xs text-muted-foreground truncate capitalize">{game.providerSlug}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-3">
        {!isAuthenticated ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
                <Button 
                    variant="ghost" 
                    className="font-bold text-muted-foreground hover:text-white"
                    onClick={openLogin}
                    data-testid="header-btn-login"
                >
                    Entrar
                </Button>
                <Button 
                    className="font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white rounded-xl"
                    onClick={() => openRegister()}
                    data-testid="header-btn-register"
                >
                    Criar Conta
                </Button>
            </div>
        ) : (
            <>
                <NotificationBell />

                {levelInfo && (
                  <Link href="/profile/levels" className="group">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-primary/20 to-orange-500/10 rounded-full pl-2 pr-2 sm:pr-3 py-1.5 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer">
                      <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_16px_rgba(249,115,22,0.6)] transition-shadow flex-shrink-0">
                        <Star className="w-4 h-4 text-white fill-white" />
                        <span className="absolute -bottom-0.5 -right-0.5 bg-background text-[9px] font-bold text-primary rounded-full w-4 h-4 flex items-center justify-center border border-primary/30">
                          {levelInfo.level}
                        </span>
                      </div>
                      <div className="hidden sm:flex flex-col gap-0.5 min-w-[60px]">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider whitespace-nowrap">Nível {levelInfo.level}</span>
                        <div className="relative h-1.5 w-16 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-orange-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(levelInfo.progressPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                          {Math.round(levelInfo.progressPercent)}% para nível {levelInfo.level + 1}
                        </span>
                      </div>
                      <span className="sm:hidden text-[10px] font-bold text-primary">Lv.{levelInfo.level}</span>
                    </div>
                  </Link>
                )}

                <div className="hidden sm:block h-6 w-px bg-white/10 mx-1" />

                <div className="flex items-center gap-1 sm:gap-2 bg-secondary/50 rounded-full pl-2 sm:pl-4 pr-1 py-1 border border-white/5 hover:border-primary/30 transition-colors cursor-pointer group">
                <div className="flex flex-col items-end leading-none mr-1 sm:mr-2">
                    <span className="hidden sm:block text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Saldo</span>
                    <span className="text-xs sm:text-sm font-bold text-primary tabular-nums group-hover:text-white transition-colors">
                    {isGamePage ? (
                      <span className="text-muted-foreground">R$ ••••••</span>
                    ) : (
                      <>R$ {walletBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                    )}
                    </span>
                </div>
                
                <WalletModal>
                    <Button size="sm" className="h-7 sm:h-8 rounded-full px-2 sm:px-4 bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_-3px_rgba(242,102,49,0.4)]">
                    <Wallet className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Depósito</span>
                    </Button>
                </WalletModal>
                </div>

                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full p-0 overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all ml-1 sm:ml-2 bg-primary/20 flex-shrink-0">
                    <span className="text-primary font-bold text-xs sm:text-sm">{getInitials()}</span>
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
                                    <DropdownMenuItem className="cursor-pointer focus:bg-white/5 focus:text-primary" onSelect={(e) => e.preventDefault()}>
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </DropdownMenuItem>
                                </WalletModal>
                            )
                        }
                        return (
                            <Link key={item.path} href={item.path}>
                                <DropdownMenuItem className="cursor-pointer focus:bg-white/5 focus:text-primary">
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.label}</span>
                                </DropdownMenuItem>
                            </Link>
                        )
                    })}
                    
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    Sair
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            </>
        )}
      </div>

      <GameIframeModal 
        isOpen={gameModalOpen}
        onClose={handleCloseGameModal}
        gameUrl={gameUrl}
        gameName={currentGameName}
      />
    </header>
  );
}
