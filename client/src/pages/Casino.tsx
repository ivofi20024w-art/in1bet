import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { ORIGINALS_GAMES } from "@/lib/mockData";
import casinoHero from "@assets/generated_images/casino_lobby_luxurious_background.png";
import slotsTournamentBanner from "@assets/generated_images/promotional_banner_for_slots_tournament.png";
import { Flame, Star, History, Rocket, Search, Filter, Play, Crown, Trophy, Users, Zap, Dice5, Timer, ChevronDown, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface PlayfiversProvider {
  id: string;
  externalId: string;
  name: string;
  imageUrl: string | null;
  status: string;
}

interface PlayfiversGame {
  id: string;
  gameCode: string;
  name: string;
  imageUrl: string | null;
  providerId: string | null;
  providerName: string;
  isOriginal: boolean;
  supportsFreeRounds: boolean;
  gameType: string | null;
  status: string;
}

const GAME_CATEGORIES = [
    { id: "all", label: "Todos", icon: Dice5 },
    { id: "slots", label: "Slots", icon: Flame },
    { id: "live", label: "Ao Vivo", icon: Users },
    { id: "crash", label: "Crash", icon: Rocket },
    { id: "roulette", label: "Roleta", icon: DiscIcon },
    { id: "blackjack", label: "Blackjack", icon: ClubIcon },
    { id: "table", label: "Jogos de Mesa", icon: TableIcon },
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

async function fetchProviders(): Promise<PlayfiversProvider[]> {
  const res = await fetch('/api/playfivers/providers');
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

interface GamesResponse {
  games: PlayfiversGame[];
  total: number;
  hasMore: boolean;
  limit: number;
  offset: number;
}

async function fetchGames(params: {
  providerId?: string;
  providerName?: string;
  gameType?: string;
  search?: string;
  namePatterns?: string[];
  includeGameType?: boolean;
  limit?: number;
  offset?: number;
}): Promise<GamesResponse> {
  const queryParams = new URLSearchParams();
  if (params.providerId) queryParams.set('providerId', params.providerId);
  if (params.providerName) queryParams.set('provider', params.providerName);
  if (params.gameType) queryParams.set('type', params.gameType);
  if (params.search) queryParams.set('search', params.search);
  if (params.namePatterns && params.namePatterns.length > 0) {
    queryParams.set('namePatterns', params.namePatterns.join(','));
  }
  if (params.includeGameType) queryParams.set('includeGameType', 'true');
  if (params.limit) queryParams.set('limit', params.limit.toString());
  if (params.offset) queryParams.set('offset', params.offset.toString());
  
  const url = `/api/playfivers/games?${queryParams.toString()}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return {
    games: data.data,
    total: data.total,
    hasMore: data.hasMore,
    limit: data.limit,
    offset: data.offset,
  };
}

async function launchGame(params: { gameCode: string; providerName: string; isOriginal: boolean }): Promise<{ launchUrl: string; sessionId: string }> {
  const res = await fetch('/api/playfivers/launch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

const GAMES_PER_PAGE = 20;

export default function Casino() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [isProvidersOpen, setIsProvidersOpen] = useState(true);
  const [games, setGames] = useState<PlayfiversGame[]>([]);
  const [totalGames, setTotalGames] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: providers = [], isLoading: loadingProviders } = useQuery({
    queryKey: ['playfivers-providers'],
    queryFn: fetchProviders,
    staleTime: 5 * 60 * 1000,
  });

  const getCategoryFilters = (category: string): { gameType?: string; namePatterns?: string[]; includeGameType?: boolean } => {
    switch (category) {
      case 'slots':
        return { gameType: 'slot' };
      case 'live':
        return { gameType: 'live' };
      case 'crash':
        return { gameType: 'crash' };
      case 'roulette':
        return { namePatterns: ['roleta', 'roulette'] };
      case 'blackjack':
        return { namePatterns: ['blackjack', '21'] };
      case 'table':
        return { gameType: 'table', namePatterns: ['poker', 'baccarat', 'bacara', 'craps', 'sic bo'], includeGameType: true };
      default:
        return {};
    }
  };

  const categoryFilters = getCategoryFilters(activeCategory);

  const { isLoading: loadingGames, refetch } = useQuery({
    queryKey: ['playfivers-games', selectedProvider, activeCategory, debouncedSearch],
    queryFn: async () => {
      const result = await fetchGames({
        providerId: selectedProvider || undefined,
        gameType: categoryFilters.gameType,
        namePatterns: categoryFilters.namePatterns,
        includeGameType: categoryFilters.includeGameType,
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
        namePatterns: categoryFilters.namePatterns,
        includeGameType: categoryFilters.includeGameType,
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
    onSuccess: (data) => {
      window.open(data.launchUrl, '_blank');
    },
    onError: (error: Error) => {
      if (error.message.includes('Authentication')) {
        toast({
          title: "Login necessário",
          description: "Faça login para jogar",
          variant: "destructive",
        });
        setLocation('/login');
      } else {
        toast({
          title: "Erro",
          description: error.message || "Falha ao iniciar jogo",
          variant: "destructive",
        });
      }
    },
  });

  const handlePlayGame = (game: PlayfiversGame) => {
    launchMutation.mutate({
      gameCode: game.gameCode,
      providerName: game.providerName,
      isOriginal: game.isOriginal,
    });
  };

  const loading = loadingProviders || loadingGames;

  const convertToGameCard = (game: PlayfiversGame, index: number) => ({
    id: index,
    title: game.name,
    provider: game.providerName,
    image: game.imageUrl || 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400',
  });

  return (
    <MainLayout>
      <div className="relative h-[300px] md:h-[400px] rounded-2xl overflow-hidden mb-6 group shadow-2xl">
          <Carousel className="w-full h-full" opts={{ loop: true }} plugins={[Autoplay({ delay: 5000 })]}>
              <CarouselContent>
                  <CarouselItem>
                      <div className="relative h-[300px] md:h-[400px]">
                        <img src={casinoHero} alt="Casino Lobby" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
                        
                        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl">
                        <Badge className="w-fit mb-4 bg-yellow-500 text-black hover:bg-yellow-400 font-bold px-3 py-1 animate-pulse">JACKPOT DIÁRIO</Badge>
                        <h1 className="text-4xl md:text-7xl font-heading font-black text-white mb-4 leading-tight drop-shadow-lg">
                            R$ 150.000 <br/> <span className="text-primary italic">EM PRÊMIOS</span>
                        </h1>
                        <p className="text-gray-200 text-lg mb-8 max-w-md drop-shadow-md">
                            Participe do torneio Drops & Wins e concorra a prêmios em dinheiro todos os dias.
                        </p>
                        <div className="flex gap-4">
                            <Button size="lg" className="rounded-full font-bold text-lg bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(249,115,22,0.4)] px-8">
                                Participar Agora
                            </Button>
                        </div>
                        </div>
                      </div>
                  </CarouselItem>
                  <CarouselItem>
                      <div className="relative h-[300px] md:h-[400px] bg-[#0f0f15]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=1200')] bg-cover bg-center opacity-40" />
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 to-transparent" />
                         <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl">
                            <Badge className="w-fit mb-4 bg-purple-500 text-white font-bold px-3 py-1">NOVIDADE</Badge>
                            <h1 className="text-4xl md:text-7xl font-heading font-black text-white mb-4 leading-tight drop-shadow-lg">
                                GATES OF <br/> <span className="text-purple-400 italic">OLYMPUS 1000</span>
                            </h1>
                            <p className="text-gray-200 text-lg mb-8 max-w-md drop-shadow-md">
                                O multiplicador máximo aumentou! Jogue agora e busque o 15.000x.
                            </p>
                            <div className="flex gap-4">
                                <Button size="lg" className="rounded-full font-bold text-lg bg-white text-purple-900 hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.2)] px-8">
                                    Jogar Agora
                                </Button>
                            </div>
                        </div>
                      </div>
                  </CarouselItem>
              </CarouselContent>
          </Carousel>
      </div>

      <div className="bg-white/5 border-y border-white/5 -mx-4 md:-mx-8 py-2 mb-8 overflow-hidden relative">
          <div className="flex items-center gap-8 animate-marquee whitespace-nowrap px-4">
              {[...Array(10)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 bg-black/20 rounded-full px-4 py-1.5 border border-white/5">
                      <div className="relative">
                          <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Winner" className="w-6 h-6 rounded-full border border-white/10" />
                          <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-[8px] text-black font-bold px-1 rounded-full">VIP</div>
                      </div>
                      <span className="text-gray-300 text-xs font-medium">user***{i}9</span>
                      <span className="text-green-400 font-bold text-sm">R$ {(Math.random() * 2000 + 100).toFixed(2)}</span>
                      <span className="text-gray-500 text-[10px] uppercase">{['Fortune Tiger', 'Mines', 'Aviator', 'Roleta'][i % 4]}</span>
                  </div>
              ))}
          </div>
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
      </div>

      <div className="flex gap-4 mb-10 overflow-x-auto pb-4 scrollbar-none snap-x px-1">
          {ORIGINALS_GAMES.slice(0, 4).map((game) => (
             <Link key={game.id} href={`/games/${game.id}`}>
                <div className="min-w-[160px] h-24 rounded-xl relative overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/50 transition-all snap-start shadow-lg hover:shadow-primary/20 hover:-translate-y-1 duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${
                         game.id === 'mines' ? 'from-blue-600 to-blue-900' : 
                         game.id === 'crash' ? 'from-red-600 to-red-900' : 
                         game.id === 'double' ? 'from-purple-600 to-purple-900' :
                         game.id === 'plinko' ? 'from-green-600 to-green-900' :
                         'from-gray-700 to-gray-900'
                    } transition-transform group-hover:scale-110 duration-500`} />
                    <div className="absolute inset-0 flex items-center justify-between p-4">
                        <span className="font-heading font-bold text-lg text-white italic shadow-black drop-shadow-md">{game.name}</span>
                        <Play className="w-8 h-8 text-white/80 fill-white/80 group-hover:scale-110 transition-transform" />
                    </div>
                </div>
             </Link>
          ))}
          
           <div className="min-w-[160px] h-24 rounded-xl bg-gradient-to-br from-yellow-600 to-yellow-800 relative overflow-hidden group cursor-pointer border border-white/5 hover:border-white/30 transition-all snap-start shadow-lg hover:-translate-y-1 duration-300">
                <div className="absolute inset-0 flex items-center justify-between p-4">
                    <div className="flex flex-col">
                        <span className="font-heading font-bold text-lg text-white italic">VIP</span>
                        <span className="text-[10px] font-medium text-yellow-200">Recompensas</span>
                    </div>
                    <Crown className="w-8 h-8 text-yellow-300 group-hover:rotate-12 transition-transform" />
                </div>
            </div>
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
                            {GAME_CATEGORIES.map(cat => (
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
                            ))}
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
                              <div 
                                key={game.id} 
                                onClick={() => handlePlayGame(game)}
                                className="cursor-pointer"
                                data-testid={`card-game-${game.gameCode}`}
                              >
                                <GameCard {...convertToGameCard(game, index)} loading={false} />
                              </div>
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
