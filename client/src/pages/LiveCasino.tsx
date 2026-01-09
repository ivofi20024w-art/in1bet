import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Video, Users, Mic2, Search, Loader2, Sparkles, Crown, Zap } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

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

async function fetchLiveGames(): Promise<SlotsgatewayGame[]> {
  const res = await fetch('/api/slotsgateway/games?type=live', { credentials: 'include' });
  const data = await res.json();
  if (!data.success) return [];
  return data.data || [];
}

async function launchGame(params: { idHash: string }): Promise<{ launchUrl: string }> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch('/api/slotsgateway/launch', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ idHash: params.idHash }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data;
}

function GameCard({ game, onPlay, isLaunching }: { game: SlotsgatewayGame; onPlay: () => void; isLaunching: boolean }) {
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
          <Badge className="bg-red-600/90 text-white text-[10px] font-bold border-none animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white mr-1 animate-ping" />
            AO VIVO
          </Badge>
        </div>
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
  const [activeTab, setActiveTab] = useState("all");
  const [launchingGame, setLaunchingGame] = useState<string | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: liveGames = [], isLoading } = useQuery({
    queryKey: ['slotsgateway-live-games'],
    queryFn: fetchLiveGames,
    staleTime: 5 * 60 * 1000,
  });

  const launchMutation = useMutation({
    mutationFn: launchGame,
    onSuccess: (data) => {
      window.open(data.launchUrl, '_blank');
      setLaunchingGame(null);
    },
    onError: (error: Error) => {
      setLaunchingGame(null);
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

  const handlePlayGame = (game: SlotsgatewayGame) => {
    setLaunchingGame(game.idHash);
    launchMutation.mutate({
      idHash: game.idHash,
    });
  };

  const filteredGames = liveGames.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          game.providerSlug.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "roulette") return matchesSearch && (game.name.toLowerCase().includes('roulette') || game.name.toLowerCase().includes('roleta'));
    if (activeTab === "blackjack") return matchesSearch && game.name.toLowerCase().includes('blackjack');
    if (activeTab === "shows") return matchesSearch && (game.name.toLowerCase().includes('show') || game.name.toLowerCase().includes('crazy') || game.name.toLowerCase().includes('mega'));
    if (activeTab === "baccarat") return matchesSearch && game.name.toLowerCase().includes('baccarat');
    
    return matchesSearch;
  });

  const popularGames = filteredGames.slice(0, 12);
  const vipGames = filteredGames.filter(g => g.name.toLowerCase().includes('vip') || g.name.toLowerCase().includes('salon')).slice(0, 4);
  const allGames = filteredGames;

  return (
    <MainLayout>
      {/* Premium Hero Section */}
      <div className="relative min-h-[280px] md:min-h-[320px] rounded-2xl overflow-hidden mb-8">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950 via-[#1a0f0a] to-[#0f0f15]" />
        
        {/* Animated pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249,115,22,0.3) 1px, transparent 0)', 
          backgroundSize: '24px 24px' 
        }} />
        
        {/* Animated glow orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/15 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Decorative casino elements */}
        <div className="absolute top-4 right-4 md:top-8 md:right-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.5)] animate-pulse">
              <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </div>
            <div className="hidden md:block">
              <div className="text-[10px] text-orange-400 uppercase tracking-wider font-bold">Streaming</div>
              <div className="text-white font-bold">4K Ultra HD</div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 px-6 py-10 md:px-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            {/* Left content */}
            <div className="flex-1">
              {/* Live badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-600/30 border border-red-500/50 backdrop-blur-sm mb-4">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-red-300 uppercase tracking-widest">Ao Vivo Agora</span>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-heading font-black text-white mb-3 leading-tight">
                CASINO <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">AO VIVO</span>
              </h1>
              
              <p className="text-gray-300 text-sm md:text-base max-w-lg mb-6 leading-relaxed">
                Dealers profissionais, mesas 24/7 e a emoção de Las Vegas na palma da sua mão.
              </p>
              
              {/* Feature badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Video className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs text-white font-medium">HD Streaming</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Mic2 className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs text-white font-medium">Chat Ao Vivo</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                  <Users className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs text-white font-medium">Multiplayer</span>
                </div>
              </div>
              
              <Button 
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-full px-8 h-12 shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] hover:scale-105"
                onClick={() => popularGames[0] && handlePlayGame(popularGames[0])}
                disabled={isLoading || !popularGames.length}
                data-testid="button-play-featured"
              >
                <Play className="w-5 h-5 mr-2 fill-white" /> Jogar Agora
              </Button>
            </div>
            
            {/* Right side - Stats cards */}
            <div className="flex md:flex-col gap-3">
              <div className="flex-1 md:flex-none bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-orange-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center border border-orange-500/30">
                    <Crown className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{liveGames.length}+</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Mesas Ao Vivo</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 md:flex-none bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:border-orange-500/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center border border-green-500/30">
                    <Zap className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">24/7</div>
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Disponível</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-60" />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 sticky top-20 z-20 bg-[#0f0f15]/80 backdrop-blur-xl py-4 -mx-4 px-4 md:mx-0 md:rounded-xl border-y md:border border-white/5">
                <TabsList className="bg-transparent h-auto p-0 gap-2 overflow-x-auto w-full md:w-auto justify-start scrollbar-none">
                    <TabsTrigger value="all" className="rounded-full border border-white/10 bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 font-bold transition-all hover:bg-white/10" data-testid="tab-all">Todos</TabsTrigger>
                    <TabsTrigger value="roulette" className="rounded-full border border-white/10 bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 font-bold transition-all hover:bg-white/10" data-testid="tab-roulette">Roleta</TabsTrigger>
                    <TabsTrigger value="blackjack" className="rounded-full border border-white/10 bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 font-bold transition-all hover:bg-white/10" data-testid="tab-blackjack">Blackjack</TabsTrigger>
                    <TabsTrigger value="shows" className="rounded-full border border-white/10 bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 font-bold transition-all hover:bg-white/10" data-testid="tab-shows">Game Shows</TabsTrigger>
                    <TabsTrigger value="baccarat" className="rounded-full border border-white/10 bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 font-bold transition-all hover:bg-white/10" data-testid="tab-baccarat">Baccarat</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar mesas..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-secondary/30 border-white/10 h-10 w-48"
                      data-testid="input-search-live"
                    />
                  </div>
                  <div className="hidden md:flex items-center gap-4 text-sm text-gray-400 font-medium whitespace-nowrap">
                      <span className="flex items-center gap-1"><Video className="w-4 h-4 text-primary" /> HD Streaming</span>
                      <span className="flex items-center gap-1"><Mic2 className="w-4 h-4 text-primary" /> Chat Ao Vivo</span>
                      <span className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" /> Multiplayer</span>
                  </div>
                </div>
            </div>

            <TabsContent value={activeTab} className="mt-0 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  </div>
                ) : filteredGames.length === 0 ? (
                  <div className="text-center py-20">
                    <p className="text-muted-foreground">Nenhum jogo ao vivo encontrado</p>
                    <p className="text-sm text-muted-foreground mt-2">Os jogos ao vivo serão carregados quando a integração SlotsGateway estiver configurada.</p>
                  </div>
                ) : (
                  <>
                    <section>
                        <div className="flex items-center gap-2 mb-6">
                            <Badge className="bg-red-600 hover:bg-red-500 text-white border-none animate-pulse">AO VIVO</Badge>
                            <h2 className="text-2xl font-bold text-white">Mais Jogados Agora</h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {popularGames.map(game => (
                              <GameCard 
                                key={game.id} 
                                game={game} 
                                onPlay={() => handlePlayGame(game)}
                                isLaunching={launchingGame === game.idHash}
                              />
                            ))}
                        </div>
                    </section>
                    
                    {vipGames.length > 0 && (
                      <section className="bg-gradient-to-r from-amber-900/20 to-transparent p-6 rounded-2xl border border-amber-500/20">
                          <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
                                      <Users className="w-6 h-6 text-amber-500" />
                                  </div>
                                  <div>
                                      <h2 className="text-2xl font-bold text-white">Salas VIP</h2>
                                      <p className="text-amber-500/80 text-sm">Limites altos e tratamento exclusivo</p>
                                  </div>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                              {vipGames.map(game => (
                                <GameCard 
                                  key={game.id} 
                                  game={game} 
                                  onPlay={() => handlePlayGame(game)}
                                  isLaunching={launchingGame === game.idHash}
                                />
                              ))}
                          </div>
                      </section>
                    )}
                    
                    {allGames.length > 12 && (
                      <section>
                          <h2 className="text-2xl font-bold text-white mb-6">Todas as Mesas ({allGames.length})</h2>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                              {allGames.slice(12).map(game => (
                                <GameCard 
                                  key={game.id} 
                                  game={game} 
                                  onPlay={() => handlePlayGame(game)}
                                  isLaunching={launchingGame === game.idHash}
                                />
                              ))}
                          </div>
                      </section>
                    )}
                  </>
                )}
            </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
