import { useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameIframeModal } from "@/components/shared/GameIframeModal";
import { Play, Video, Users, Search, Loader2, Crown, ChevronDown, Heart, Flame, Dice5 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { getStoredAuth } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/stores/authModalStore";
import { useFavoritesStore } from "@/stores/favorites-store";
import depositBannerImage from "@assets/tigre1_1767994256497.jpeg";

interface SlotsgatewayGame {
  id: string;
  idHash: string;
  name: string;
  imageUrl: string | null;
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
  "Rafael", "Amanda", "Bruno", "Patricia", "Diego", "Camila", "Thiago", "Mariana"
];

const MOCK_WINNERS: RecentWinner[] = Array.from({ length: 16 }, (_, i) => ({
  id: `mock-${i}`,
  username: MOCK_NAMES[i % MOCK_NAMES.length],
  level: [5, 12, 23, 8, 45, 67, 15, 32][i % 8],
  amount: ((i * 137 + 100) % 2000 + 100),
  gameName: ['Roleta Live', 'Blackjack VIP', 'Baccarat', 'Crazy Time', 'Mega Ball', 'Lightning Dice'][i % 6],
  createdAt: new Date().toISOString(),
}));

const GAME_CATEGORIES = [
  { id: "all", label: "Todos", icon: Dice5 },
  { id: "favorites", label: "Favoritos", icon: Heart },
  { id: "roulette", label: "Roleta", icon: Flame },
  { id: "blackjack", label: "Blackjack", icon: Users },
  { id: "baccarat", label: "Baccarat", icon: Crown },
  { id: "shows", label: "Game Shows", icon: Video },
];

async function fetchLiveGames(): Promise<SlotsgatewayGame[]> {
  const res = await fetch('/api/slotsgateway/games?type=live', { credentials: 'include' });
  const data = await res.json();
  if (!data.success) return [];
  return data.data || [];
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
      className="relative h-[140px] md:h-[160px] cursor-pointer group"
      data-testid="carousel-deposit-banner"
    >
      <img 
        src={depositBannerImage} 
        alt="Deposite e ganhe bônus" 
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
    </div>
  );
}

function GameCard({ game, onPlay, isLaunching, isFavorite, onToggleFavorite }: { 
  game: SlotsgatewayGame; 
  onPlay: () => void; 
  isLaunching: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}) {
  return (
    <div 
      className="group relative rounded-xl overflow-hidden bg-card border border-white/5 hover:border-primary/50 transition-all cursor-pointer shadow-lg hover:shadow-primary/20 hover:-translate-y-1 duration-300"
      onClick={onPlay}
      data-testid={`game-card-${game.idHash}`}
    >
      <div className="aspect-[4/3] relative">
        <img 
          src={game.imageUrl || 'https://images.unsplash.com/photo-1518893494013-481c1d8ed3fd?auto=format&fit=crop&q=80&w=500'} 
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {isLaunching ? (
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
              <Play className="w-6 h-6 text-white fill-white ml-1" />
            </div>
          )}
        </div>
        <div className="absolute top-2 left-2">
          <Badge className="bg-red-600/90 text-white text-[10px] font-bold border-none">
            <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
            AO VIVO
          </Badge>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <Heart className={cn("w-4 h-4", isFavorite ? "fill-red-500 text-red-500" : "text-white")} />
        </button>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-white text-sm truncate">{game.name}</h3>
        <p className="text-xs text-muted-foreground truncate capitalize">{game.providerSlug}</p>
      </div>
    </div>
  );
}

export default function LiveCasino() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [currentGameName, setCurrentGameName] = useState<string>("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { favorites, addFavorite, removeFavorite } = useFavoritesStore();

  const { data: liveGames = [], isLoading } = useQuery({
    queryKey: ['slotsgateway-live-games'],
    queryFn: fetchLiveGames,
    staleTime: 5 * 60 * 1000,
  });

  const { data: realWinners = [] } = useQuery({
    queryKey: ['recent-winners-live'],
    queryFn: async () => {
      const res = await fetch('/api/history/winners?limit=16');
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

  const handlePlayGame = (game: SlotsgatewayGame) => {
    const auth = getStoredAuth();
    if (!auth.isAuthenticated) {
      toast({ title: "Login necessário", description: "Faça login para jogar", variant: "destructive" });
      setLocation('/');
      return;
    }
    
    setLocation(`/jogar/${encodeURIComponent(game.idHash)}`);
  };

  const handleCloseGameModal = useCallback(() => {
    setGameModalOpen(false);
    setGameUrl(null);
    setCurrentGameName("");
  }, []);

  const toggleFavorite = (game: SlotsgatewayGame) => {
    if (favorites.includes(game.idHash)) {
      removeFavorite(game.idHash);
      toast({ title: "Removido dos favoritos" });
    } else {
      addFavorite(game.idHash);
      toast({ title: "Adicionado aos favoritos" });
    }
  };

  const filteredGames = liveGames.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.providerSlug.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === "all") return matchesSearch;
    if (activeCategory === "favorites") return matchesSearch && favorites.includes(game.idHash);
    if (activeCategory === "roulette") return matchesSearch && (game.name.toLowerCase().includes('roulette') || game.name.toLowerCase().includes('roleta'));
    if (activeCategory === "blackjack") return matchesSearch && game.name.toLowerCase().includes('blackjack');
    if (activeCategory === "shows") return matchesSearch && (game.name.toLowerCase().includes('show') || game.name.toLowerCase().includes('crazy') || game.name.toLowerCase().includes('mega'));
    if (activeCategory === "baccarat") return matchesSearch && game.name.toLowerCase().includes('baccarat');
    
    return matchesSearch;
  });

  const popularGames = filteredGames.slice(0, 12);
  const vipGames = filteredGames.filter(g => g.name.toLowerCase().includes('vip') || g.name.toLowerCase().includes('salon')).slice(0, 6);
  const allGames = filteredGames;

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
      <div className="bg-gradient-to-r from-red-900/20 via-orange-900/10 to-red-900/20 border-y border-red-500/20 -mx-4 md:-mx-8 py-3 mb-6 overflow-hidden relative">
        <div className="flex items-center gap-6 whitespace-nowrap px-4" style={{ animation: 'marquee 40s linear infinite' }}>
          {[...winnersToDisplay, ...winnersToDisplay].map((winner, i) => {
            const levelColor = winner.level >= 50 ? 'from-yellow-500 to-amber-600' : 
                               winner.level >= 30 ? 'from-purple-500 to-violet-600' : 
                               winner.level >= 15 ? 'from-blue-500 to-cyan-600' : 
                               'from-gray-500 to-gray-600';
            return (
              <div key={`${winner.id}-${i}`} className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 flex-shrink-0 hover:border-red-500/30 transition-colors">
                <div className="relative">
                  <img src={`https://i.pravatar.cc/150?u=${winner.username}`} alt="Winner" className="w-7 h-7 rounded-full border-2 border-red-500/50 shadow-lg shadow-red-500/20" />
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

      <div className="flex items-center gap-2 mb-6">
        <Badge className="bg-red-600 hover:bg-red-500 text-white border-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-pulse" />
          AO VIVO
        </Badge>
        <h1 className="text-xl md:text-2xl font-bold text-white">Casino Ao Vivo</h1>
        <span className="text-muted-foreground text-sm ml-2">({liveGames.length} mesas)</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 flex-shrink-0 space-y-4">
          <div className="sticky top-24 space-y-4">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Buscar mesas..." 
                className="pl-10 bg-secondary/30 border-white/10 h-11 focus:bg-secondary/50 focus:border-primary/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-live"
              />
            </div>

            <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
              <button 
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="flex items-center justify-between w-full p-4 hover:bg-white/5 transition-colors group"
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

            <Link href="/casino">
              <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border border-orange-500/20 rounded-xl p-4 hover:border-orange-500/40 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center border border-orange-500/30">
                    <Dice5 className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Casino</div>
                    <div className="text-[10px] text-orange-400">Slots e mais</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0 space-y-10">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : filteredGames.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-muted-foreground">
                {activeCategory === "favorites" ? "Nenhum jogo favorito encontrado" : "Nenhum jogo ao vivo encontrado"}
              </p>
              {activeCategory !== "favorites" && (
                <p className="text-sm text-muted-foreground mt-2">Os jogos ao vivo serão carregados quando a integração estiver configurada.</p>
              )}
            </div>
          ) : (
            <>
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Badge className="bg-red-600 hover:bg-red-500 text-white border-none animate-pulse">AO VIVO</Badge>
                  <h2 className="text-xl font-bold text-white">Mais Jogados Agora</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {popularGames.map(game => (
                    <GameCard 
                      key={game.id} 
                      game={game} 
                      onPlay={() => handlePlayGame(game)}
                      isLaunching={launchingGame === game.idHash}
                      isFavorite={favorites.includes(game.idHash)}
                      onToggleFavorite={() => toggleFavorite(game)}
                    />
                  ))}
                </div>
              </section>
              
              {vipGames.length > 0 && (
                <section className="bg-gradient-to-r from-amber-900/20 to-transparent p-6 rounded-2xl border border-amber-500/20">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                        <Crown className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Salas VIP</h2>
                        <p className="text-amber-500/80 text-sm">Limites altos e tratamento exclusivo</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {vipGames.map(game => (
                      <GameCard 
                        key={game.id} 
                        game={game} 
                        onPlay={() => handlePlayGame(game)}
                        isLaunching={launchingGame === game.idHash}
                        isFavorite={favorites.includes(game.idHash)}
                        onToggleFavorite={() => toggleFavorite(game)}
                      />
                    ))}
                  </div>
                </section>
              )}
              
              {allGames.length > 12 && (
                <section>
                  <h2 className="text-xl font-bold text-white mb-6">Todas as Mesas ({allGames.length})</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {allGames.slice(12).map(game => (
                      <GameCard 
                        key={game.id} 
                        game={game} 
                        onPlay={() => handlePlayGame(game)}
                        isLaunching={launchingGame === game.idHash}
                        isFavorite={favorites.includes(game.idHash)}
                        onToggleFavorite={() => toggleFavorite(game)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
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
