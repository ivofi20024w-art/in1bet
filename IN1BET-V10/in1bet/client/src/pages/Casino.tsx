import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { ORIGINALS_GAMES } from "@/lib/mockData";
import casinoHero from "@assets/generated_images/casino_lobby_luxurious_background.png";
import slotsTournamentBanner from "@assets/generated_images/promotional_banner_for_slots_tournament.png";
import depositBannerImage from "@assets/tigre1_1767994256497.jpeg";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/stores/authModalStore";
import { Flame, Star, Heart, History, Rocket, Search, Filter, Play, Crown, Trophy, Users, Zap, Dice5, Timer, ChevronDown, Loader2 } from "lucide-react";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { GameIframeModal } from "@/components/shared/GameIframeModal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation, useSearch } from "wouter";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getStoredAuth } from "@/lib/auth";

interface SlotsgatewayProvider {
  id: string;
  externalId: string;
  name: string;
  imageUrl: string | null;
  status: string;
}

interface SlotsgatewayGame {
  id: string;
  idHash: string;
  name: string;
  imageUrl: string | null;
  imageSquare: string | null;
  providerId: string | null;
  providerSlug: string;
  gameType: string | null;
  isNew: boolean;
  status: string;
}

interface RecentWinner {
  id: string;
  username: string;
  level: number;
  amount: number;
  gameName: string;
  createdAt: string;
}

const MOCK_NAMES = [
  "Lucas", "Fernanda", "Gabriel", "Ana", "Pedro", "Juliana", "Matheus", "Carla",
  "Rafael", "Amanda", "Bruno", "Patricia", "Diego", "Camila", "Thiago", "Mariana",
  "Felipe", "Beatriz", "Rodrigo", "Larissa"
];

const MOCK_WINNERS: RecentWinner[] = Array.from({ length: 20 }, (_, i) => ({
  id: `mock-${i}`,
  username: MOCK_NAMES[i % MOCK_NAMES.length],
  level: [5, 12, 23, 8, 45, 67, 15, 32, 19, 55][i % 10],
  amount: ((i * 137 + 100) % 2000 + 100),
  gameName: ['Fortune Tiger', 'Mines', 'Aviator', 'Roleta', 'Gates', 'Crash', 'Double', 'Plinko'][i % 8],
  createdAt: new Date().toISOString(),
}));

const GAME_CATEGORIES = [
    { id: "all", label: "Todos", icon: Dice5 },
    { id: "favorites", label: "Favoritos", icon: Heart },
    { id: "slots", label: "Slots", icon: Flame },
    { id: "live", label: "Ao Vivo", icon: Users },
    { id: "originals", label: "Originais", icon: Rocket, isLink: true, link: "/originals" },
];

function DiscIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

function ClubIcon(props: any) {
    return (
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <path d="M12 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
            <path d="M7 11a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
            <path d="M17 11a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
            <path d="M12 17v5" />
            <path d="M12 17a3 3 0 0 0-3-3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3Z" />
         </svg>
    )
}

function TableIcon(props: any) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
            <rect width="20" height="14" x="2" y="3" rx="2" />
            <line x1="2" x2="22" y1="9" y2="9" />
            <line x1="12" x2="12" y1="21" y2="9" />
        </svg>
    )
}

function DepositBannerSlide() {
    const { isAuthenticated } = useAuth();
    const { openLogin } = useAuthModal();
    const [, setLocation] = useLocation();

    const handleClick = () => {
        if (isAuthenticated) {
            setLocation("/wallet?tab=deposit");
        } else {
            openLogin();
        }
    };

    return (
        <div 
            onClick={handleClick}
            className="relative h-auto md:h-[160px] cursor-pointer group"
            data-testid="carousel-deposit-banner"
        >
            <img 
                src={depositBannerImage} 
                alt="Deposite e ganhe bônus" 
                className="w-full h-auto md:h-full object-contain md:object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>
    );
}

async function fetchProviders(): Promise<SlotsgatewayProvider[]> {
  const res = await fetch('/api/slotsgateway/providers');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

interface GamesResponse {
  games: SlotsgatewayGame[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

async function fetchGames(params: {
  providerId?: string;
  gameType?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<GamesResponse> {
  const queryParams = new URLSearchParams();
  if (params.providerId) queryParams.set('providerId', params.providerId);
  if (params.gameType) queryParams.set('type', params.gameType);
  if (params.search) queryParams.set('search', params.search);
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.offset) queryParams.set('offset', params.offset.toString());
  
  const url = `/api/slotsgateway/games?${queryParams.toString()}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return {
    games: data.data,
    total: data.total || data.data?.length || 0,
    hasMore: data.hasMore || false,
    limit: data.limit || params.limit || 20,
    offset: data.offset || params.offset || 0,
  };
}

async function launchGame(params: { idHash: string }): Promise<{ launchUrl: string }> {
  const auth = getStoredAuth();
  
  if (!auth.accessToken) {
    throw new Error('Authentication required');
  }
  
  console.log('[LaunchGame] Launching game:', params.idHash);
  
  const res = await fetch('/api/slotsgateway/launch', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({ idHash: params.idHash }),
  });
  
  const data = await res.json();
  console.log('[LaunchGame] Response:', data);
  
  if (!data.success) {
    throw new Error(data.error || 'Falha ao iniciar jogo');
  }
  
  if (!data.data?.launchUrl) {
    throw new Error('URL do jogo não recebida');
  }
  
  return data.data;
}

const GAMES_PER_PAGE = 20;

export default function Casino() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialCategory = urlParams.get('category') || 'all';
  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isProvidersOpen, setIsProvidersOpen] = useState(false);
  const [games, setGames] = useState<SlotsgatewayGame[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [currentGameName, setCurrentGameName] = useState<string>("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { favorites } = useFavoritesStore();
  
  useEffect(() => {
    const newCategory = urlParams.get('category') || 'all';
    if (newCategory !== activeCategory) {
      setActiveCategory(newCategory);
    }
  }, [searchString]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setGames([]);
    setOffset(0);
    setHasMore(false);
  }, [activeCategory, selectedProvider, debouncedSearch]);

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['slotsgateway-providers'],
    queryFn: fetchProviders,
    staleTime: 5 * 60 * 1000,
  });

  const { data: realWinners = [] } = useQuery({
    queryKey: ['recent-winners'],
    queryFn: async () => {
      const res = await fetch('/api/history/winners?limit=20');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        return data.data as RecentWinner[];
      }
      return [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const winnersToDisplay = realWinners.length > 0 ? realWinners : MOCK_WINNERS;

  const getCategoryFilters = (category: string): { gameType?: string } => {
    switch (category) {
      case 'slots':
        return { gameType: 'video-slots' };
      case 'live':
        return { gameType: 'live' };
      default:
        return {};
    }
  };

  const categoryFilters = getCategoryFilters(activeCategory);

  const { isLoading: loadingGames, refetch } = useQuery({
    queryKey: ['slotsgateway-games', selectedProvider, activeCategory, debouncedSearch, favorites],
    queryFn: async () => {
      if (activeCategory === 'favorites') {
        if (favorites.length === 0) {
          setGames([]);
          setTotalGames(0);
          setHasMore(false);
          return { games: [], total: 0, hasMore: false, limit: 0, offset: 0 };
        }
        const result = await fetchGames({
          providerId: selectedProvider || undefined,
          search: debouncedSearch || undefined,
          limit: 500,
          offset: 0,
        });
        const favoriteGames = result.games.filter(g => favorites.includes(g.idHash));
        setGames(favoriteGames);
        setTotalGames(favoriteGames.length);
        setHasMore(false);
        setOffset(0);
        return { ...result, games: favoriteGames, total: favoriteGames.length, hasMore: false };
      }
      
      const result = await fetchGames({
        providerId: selectedProvider || undefined,
        gameType: categoryFilters.gameType,
        search: debouncedSearch || undefined,
        limit: GAMES_PER_PAGE,
        offset: 0,
      });
      setGames(result.games);
      setTotalGames(result.total);
      setHasMore(result.hasMore);
      setOffset(GAMES_PER_PAGE);
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });

  const loadMoreGames = async () => {
    setIsLoadingMore(true);
    try {
      const result = await fetchGames({
        providerId: selectedProvider || undefined,
        gameType: categoryFilters.gameType,
        search: debouncedSearch || undefined,
        limit: GAMES_PER_PAGE,
        offset,
      });
      setGames(prev => [...prev, ...result.games]);
      setHasMore(result.hasMore);
      setOffset(prev => prev + GAMES_PER_PAGE);
    } catch (error) {
      console.error('Failed to load more games:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const launchMutation = useMutation({
    mutationFn: launchGame,
    onMutate: () => {
      toast({
        title: "Iniciando jogo...",
        description: "Aguarde enquanto carregamos o jogo",
      });
    },
    onSuccess: (data) => {
      console.log('[Casino] Opening game URL:', data.launchUrl);
      setGameUrl(data.launchUrl);
      setGameModalOpen(true);
    },
    onError: (error: Error) => {
      console.error('[Casino] Launch error:', error);
      if (error.message.includes('Authentication') || error.message.includes('required')) {
        toast({
          title: "Login necessário",
          description: "Faça login para jogar",
          variant: "destructive",
        });
        setLocation('/');
      } else {
        toast({
          title: "Erro ao iniciar jogo",
          description: error.message || "Falha ao iniciar jogo",
          variant: "destructive",
        });
      }
    },
  });

  const handlePlayGame = (game: SlotsgatewayGame) => {
    const auth = getStoredAuth();
    if (!auth.accessToken) {
      toast({
        title: "Login necessário",
        description: "Faça login para jogar",
        variant: "destructive",
      });
      setLocation('/');
      return;
    }
    
    console.log('[Casino] Playing game:', game.name, game.idHash);
    setLocation(`/jogar/${encodeURIComponent(game.idHash)}`);
  };

  const handleCloseGameModal = useCallback(() => {
    setGameModalOpen(false);
    setGameUrl(null);
    setCurrentGameName("");
  }, []);

  const loading = loadingProviders || loadingGames;

  const convertToGameCard = (game: SlotsgatewayGame, index: number) => ({
    id: index,
    title: game.name,
    provider: game.providerSlug,
    image: game.imageSquare || game.imageUrl || 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400',
    idHash: game.idHash,
  });

  return (
    <MainLayout>
      <div className="relative h-[140px] md:h-[160px] rounded-xl overflow-hidden mb-4 group shadow-lg">
          <DepositBannerSlide />
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="bg-gradient-to-r from-green-900/20 via-emerald-900/10 to-green-900/20 border-y border-green-500/20 -mx-4 md:-mx-8 py-3 mb-6 overflow-hidden relative">
          <div className="flex items-center gap-6 whitespace-nowrap px-4" style={{ animation: 'marquee 40s linear infinite' }}>
              {[...winnersToDisplay, ...winnersToDisplay].map((winner, i) => {
                const levelColor = winner.level >= 50 ? 'from-yellow-500 to-amber-600' : 
                                   winner.level >= 30 ? 'from-purple-500 to-violet-600' : 
                                   winner.level >= 15 ? 'from-blue-500 to-cyan-600' : 
                                   'from-gray-500 to-gray-600';
                return (
                  <div key={`${winner.id}-${i}`} className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 flex-shrink-0 hover:border-green-500/30 transition-colors">
                      <div className="relative">
                          <img src={`https://i.pravatar.cc/150?u=${winner.username}`} alt="Winner" className="w-7 h-7 rounded-full border-2 border-green-500/50 shadow-lg shadow-green-500/20" />
                          <div className={`absolute -bottom-1 -right-1 bg-gradient-to-r ${levelColor} text-[7px] text-white font-bold px-1.5 py-0.5 rounded-full shadow-md`}>
                            {winner.level}
                          </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-white text-[11px] font-semibold">{winner.username}</span>
                        <span className="text-gray-500 text-[9px]">{winner.gameName}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-green-400 font-bold text-sm">+R$ {winner.amount.toFixed(2)}</span>
                        <span className="text-gray-600 text-[8px]">agora</span>
                      </div>
                  </div>
                );
              })}
          </div>
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
      </div>

      <div className="flex gap-3 mb-10 overflow-x-auto pb-4 scrollbar-none snap-x px-1">
          <Link href="/games/mines" className="snap-start">
            <img src="/casino-mines.png" alt="Minas" className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[125px] md:h-[160px] rounded-xl object-cover cursor-pointer border-2 border-transparent hover:border-orange-500 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
          </Link>
          <Link href="/games/double" className="snap-start">
            <img src="/casino-double.png" alt="Roletas" className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[125px] md:h-[160px] rounded-xl object-cover cursor-pointer border-2 border-transparent hover:border-orange-500 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
          </Link>
          <Link href="/games/aviatormania" className="snap-start">
            <img src="/casino-aviator.png" alt="Aviator Mania" className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[125px] md:h-[160px] rounded-xl object-cover cursor-pointer border-2 border-transparent hover:border-orange-500 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
          </Link>
          <Link href="/games/plinko" className="snap-start">
            <img src="/casino-plinko.png" alt="Plinko" className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[125px] md:h-[160px] rounded-xl object-cover cursor-pointer border-2 border-transparent hover:border-orange-500 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]" />
          </Link>
          <Link href="/vip" className="snap-start">
            <img src="/btn-vip.png" alt="VIP Recompensas" className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] md:w-[125px] md:h-[160px] rounded-xl object-cover cursor-pointer border-2 border-transparent hover:border-yellow-500 hover:scale-105 transition-all duration-300 hover:shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
          </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0 space-y-4">
            <div className="sticky top-24 space-y-4">
                
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Buscar jogos..." 
                        className="pl-10 bg-secondary/30 border-white/10 h-11 focus:bg-secondary/50 focus:border-primary/50 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        data-testid="input-search-games"
                    />
                </div>

                <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
                    <button 
                        onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                        className="flex items-center justify-between w-full p-4 hover:bg-white/5 transition-colors group"
                        data-testid="button-toggle-categories"
                    >
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors">Categorias</h3>
                        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-300", isCategoriesOpen ? "rotate-180" : "")} />
                    </button>
                    
                    {isCategoriesOpen && (
                        <div className="p-2 pt-0 space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {GAME_CATEGORIES.map(cat => 
                                cat.isLink ? (
                                  <Link key={cat.id} href={cat.link || "/"}>
                                    <div
                                        data-testid={`button-category-${cat.id}`}
                                        className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all group text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <cat.icon className="w-4 h-4 text-gray-500 group-hover:text-primary" />
                                            {cat.label}
                                        </div>
                                    </div>
                                  </Link>
                                ) : (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    data-testid={`button-category-${cat.id}`}
                                    className={cn(
                                        "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                                        activeCategory === cat.id ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <cat.icon className={cn("w-4 h-4", activeCategory === cat.id ? "text-white" : "text-gray-500 group-hover:text-primary")} />
                                        {cat.label}
                                    </div>
                                    {activeCategory === cat.id && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                </button>
                                )
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
                     <button 
                        onClick={() => setIsProvidersOpen(!isProvidersOpen)}
                        className="flex items-center justify-between w-full p-4 hover:bg-white/5 transition-colors group"
                        data-testid="button-toggle-providers"
                     >
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider group-hover:text-primary transition-colors flex items-center">
                            Provedores
                            {selectedProvider && <span className="ml-2 text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">1 Selecionado</span>}
                        </h3>
                        <div className="flex items-center gap-2">
                             {selectedProvider && (
                                <span 
                                    className="text-[10px] text-red-400 hover:text-red-300 hover:underline px-2 py-1 cursor-pointer" 
                                    onClick={(e) => { e.stopPropagation(); setSelectedProvider(null); }}
                                    data-testid="button-clear-provider"
                                >
                                    Limpar
                                </span>
                             )}
                            <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-300", isProvidersOpen ? "rotate-180" : "")} />
                        </div>
                     </button>
                     
                     {isProvidersOpen && (
                        <div className="p-2 pt-0 animate-in slide-in-from-top-2 duration-200">
                            {loadingProviders ? (
                              <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              </div>
                            ) : providers.length === 0 ? (
                              <p className="text-center text-muted-foreground text-sm py-4">Nenhum provedor disponível</p>
                            ) : (
                              <ScrollArea className="h-[250px] pr-2">
                                  <div className="space-y-1">
                                      {providers.map(provider => (
                                          <button
                                              key={provider.id}
                                              onClick={() => setSelectedProvider(selectedProvider === provider.id ? null : provider.id)}
                                              data-testid={`button-provider-${provider.name}`}
                                              className={cn(
                                                  "flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all group border border-transparent",
                                                  selectedProvider === provider.id ? "bg-secondary text-white border-white/10" : "text-gray-400 hover:bg-white/5 hover:text-white"
                                              )}
                                          >
                                              <div className="flex items-center gap-2">
                                                {provider.imageUrl && (
                                                  <img src={provider.imageUrl} alt={provider.name} className="w-5 h-5 rounded object-contain" />
                                                )}
                                                {provider.name}
                                              </div>
                                              {selectedProvider === provider.id && <CheckIcon className="w-3 h-3 text-primary" />}
                                          </button>
                                      ))}
                                  </div>
                              </ScrollArea>
                            )}
                        </div>
                     )}
                </div>
            </div>
        </aside>

        <div className="flex-1 min-w-0">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                 <div className="flex items-center gap-2">
                    <div className="p-2 bg-secondary/50 rounded-lg border border-white/5">
                        {activeCategory === 'all' ? <Dice5 className="w-5 h-5 text-primary" /> : <Filter className="w-5 h-5 text-primary" />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white leading-none mb-1" data-testid="text-games-title">
                            {searchQuery ? `Resultados para "${searchQuery}"` : 
                            GAME_CATEGORIES.find(c => c.id === activeCategory)?.label}
                        </h2>
                         <p className="text-xs text-muted-foreground">Mostrando os melhores jogos do mercado</p>
                    </div>
                 </div>
                 <span className="text-sm text-muted-foreground font-medium bg-secondary/30 px-3 py-1 rounded-full border border-white/5 whitespace-nowrap" data-testid="text-games-count">
                     {games.length} de {totalGames} jogos
                 </span>
             </div>

             <div className="space-y-8">
                 {loading ? (
                   <div className="flex flex-col items-center justify-center py-24">
                     <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
                     <p className="text-muted-foreground">Carregando jogos...</p>
                   </div>
                 ) : games.length > 0 ? (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {games.map((game, index) => (
                              <GameCard 
                                key={game.id} 
                                {...convertToGameCard(game, index)} 
                                loading={false} 
                                onClick={() => handlePlayGame(game)}
                                data-testid={`card-game-${game.idHash}`}
                              />
                          ))}
                      </div>

                      {hasMore && (
                        <div className="flex justify-center pt-4">
                          <Button
                            onClick={loadMoreGames}
                            disabled={isLoadingMore}
                            size="lg"
                            className="rounded-full font-bold px-8 bg-primary hover:bg-primary/90"
                            data-testid="button-load-more"
                          >
                            {isLoadingMore ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Carregando...
                              </>
                            ) : (
                              <>
                                Carregar mais jogos
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                 ) : (
                    <div className="flex flex-col items-center justify-center py-24 border border-dashed border-white/10 rounded-2xl bg-white/5">
                        <Search className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum jogo encontrado</h3>
                        <p className="text-muted-foreground max-w-xs text-center">
                          {totalGames === 0 
                            ? "Os jogos ainda não foram sincronizados. Aguarde a configuração da API."
                            : "Não encontramos jogos com os filtros selecionados. Tente buscar por outro termo."}
                        </p>
                        {totalGames > 0 && (
                          <Button 
                              variant="link" 
                              className="mt-4 text-primary"
                              onClick={() => { setSearchQuery(""); setSelectedProvider(null); setActiveCategory("all"); }}
                              data-testid="button-clear-filters"
                          >
                              Limpar todos os filtros
                          </Button>
                        )}
                    </div>
                 )}
             </div>
             
             {games.length > 0 && (
                 <div className="mt-12 text-center pb-8">
                     <p className="text-muted-foreground text-xs mb-4">Exibindo {games.length} de {totalGames} jogos</p>
                     <div className="w-full max-w-xs mx-auto h-1 bg-secondary rounded-full overflow-hidden mb-6">
                         <div 
                           className="h-full bg-primary rounded-full transition-all duration-300" 
                           style={{ width: `${Math.min((games.length / totalGames) * 100, 100)}%` }}
                         />
                     </div>
                 </div>
             )}
        </div>
      </div>
      
      <GameIframeModal 
        isOpen={gameModalOpen}
        onClose={handleCloseGameModal}
        gameUrl={gameUrl}
        gameName={currentGameName}
      />
    </MainLayout>
  );
}

function CheckIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    )
  }
