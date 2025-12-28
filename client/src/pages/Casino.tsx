import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { CASINO_GAMES, PROVIDERS, ORIGINALS_GAMES } from "@/lib/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import casinoHero from "@assets/generated_images/casino_lobby_luxurious_background.png";
import { Flame, Star, History, Sparkles, Search, Filter, Play, Rocket, Zap, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Casino() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // Simulate loading state
  useEffect(() => {
      const timer = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(timer);
  }, []);

  const filteredGames = CASINO_GAMES.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            game.provider.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesProvider = selectedProvider ? game.provider === selectedProvider : true;
      return matchesSearch && matchesProvider;
  });

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative h-[300px] rounded-2xl overflow-hidden mb-8 group shadow-2xl">
        <img src={casinoHero} alt="Casino Lobby" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-12 max-w-2xl animate-in slide-in-from-left-4 duration-700">
          <Badge className="w-fit mb-4 bg-yellow-500 text-black hover:bg-yellow-400 font-bold px-3 py-1">CASINO PREMIUM</Badge>
          <h1 className="text-4xl md:text-6xl font-heading font-black text-white mb-4 leading-tight drop-shadow-lg">
            O Melhor do <br/> <span className="text-primary italic">iGaming Mundial</span>
          </h1>
          <p className="text-gray-200 text-lg mb-8 max-w-md drop-shadow-md">
            Milhares de jogos, jackpots milionários e a melhor experiência de casino ao vivo do Brasil.
          </p>
          <div className="flex gap-4">
             <Button size="lg" className="rounded-full font-bold text-lg bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                Jogar Agora
             </Button>
             <Button size="lg" variant="outline" className="rounded-full font-bold text-lg border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                Ver Promoções
             </Button>
          </div>
        </div>
      </div>

      {/* IN1Bet Originals Section */}
      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-primary/20 rounded-lg">
                <Rocket className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h3 className="font-heading font-bold text-2xl text-white">IN1Bet Originals</h3>
                <p className="text-sm text-gray-400">Jogos exclusivos com RTP de 99%</p>
            </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
            {ORIGINALS_GAMES.map(game => (
                <Link key={game.id} href={`/games/${game.id}`}>
                    <div className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/20">
                         {/* Placeholder colorful gradients for original games */}
                         <div className={`absolute inset-0 bg-gradient-to-br ${
                             game.id === 'mines' ? 'from-blue-600 to-blue-900' : 
                             game.id === 'crash' ? 'from-red-600 to-red-900' : 
                             game.id === 'double' ? 'from-purple-600 to-purple-900' :
                             game.id === 'plinko' ? 'from-green-600 to-green-900' :
                             'from-gray-700 to-gray-900'
                         } transition-transform group-hover:scale-110 duration-500`} />
                         
                         <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                             {game.id === 'mines' && <div className="w-16 h-16 mb-2 text-white opacity-80"><Zap className="w-full h-full" /></div>}
                             {game.id === 'crash' && <div className="w-16 h-16 mb-2 text-white opacity-80"><Rocket className="w-full h-full" /></div>}
                             {game.id === 'double' && <div className="w-16 h-16 mb-2 text-white opacity-80"><div className="text-4xl font-black">2x</div></div>}
                             {game.id === 'plinko' && <div className="w-16 h-16 mb-2 text-white opacity-80"><div className="text-4xl font-black">●</div></div>}
                             
                             <h4 className="font-heading font-bold text-xl text-white uppercase tracking-wider">{game.name}</h4>
                             <Badge variant="secondary" className="mt-2 bg-black/30 backdrop-blur-md text-white border-white/10">ORIGINAL</Badge>
                         </div>
                    </div>
                </Link>
            ))}
        </div>
      </section>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 sticky top-20 z-30 bg-background/80 backdrop-blur-xl p-4 rounded-xl border border-white/5 shadow-lg">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
                placeholder="Buscar jogos, provedores..." 
                className="pl-10 h-12 bg-secondary/50 border-white/10 focus:border-primary/50 text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
             <Button variant="outline" className="h-12 border-white/10 gap-2 bg-secondary/30">
                <Filter className="w-4 h-4" /> Filtros
             </Button>
             {PROVIDERS.map(provider => (
                 <Button 
                    key={provider.id}
                    variant={selectedProvider === provider.name ? "default" : "outline"}
                    className={`h-12 border-white/10 whitespace-nowrap ${selectedProvider === provider.name ? "bg-primary text-white" : "bg-secondary/30"}`}
                    onClick={() => setSelectedProvider(selectedProvider === provider.name ? null : provider.name)}
                 >
                    {provider.name}
                 </Button>
             ))}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-transparent p-0 mb-8 h-auto flex-wrap justify-start gap-2">
          <TabsTrigger value="all" className="rounded-full border border-white/10 bg-secondary/30 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 text-sm font-bold transition-all">
            Todos
          </TabsTrigger>
          <TabsTrigger value="slots" className="rounded-full border border-white/10 bg-secondary/30 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 text-sm font-bold transition-all flex items-center gap-2">
            <Flame className="w-4 h-4" /> Slots
          </TabsTrigger>
          <TabsTrigger value="live" className="rounded-full border border-white/10 bg-secondary/30 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 text-sm font-bold transition-all flex items-center gap-2">
            <Play className="w-4 h-4" /> Ao Vivo
          </TabsTrigger>
          <TabsTrigger value="crash" className="rounded-full border border-white/10 bg-secondary/30 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 text-sm font-bold transition-all flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Crash
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-0 space-y-12">
            
            {/* Recent Section */}
            {!searchQuery && !selectedProvider && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 text-white">
                            <div className="p-2 bg-white/10 rounded-lg">
                                <History className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="font-heading font-bold text-2xl">Jogados Recentemente</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {CASINO_GAMES.slice(0, 4).map((game, i) => (
                            <GameCard key={`recent-${game.id}`} {...game} loading={loading} />
                        ))}
                    </div>
                </section>
            )}

            {/* Main Grid */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2 text-white">
                        <div className="p-2 bg-white/10 rounded-lg">
                            <Star className="w-5 h-5 text-yellow-500" />
                        </div>
                        <h3 className="font-heading font-bold text-2xl">
                            {searchQuery ? "Resultados da Busca" : "Todos os Jogos"}
                        </h3>
                    </div>
                    <span className="text-muted-foreground text-sm font-medium">
                        {filteredGames.length} jogos encontrados
                    </span>
                </div>
                
                {filteredGames.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {filteredGames.map(game => (
                            <GameCard key={game.id} {...game} loading={loading} />
                        ))}
                        {/* Mock duplicates to fill grid */}
                        {!searchQuery && !selectedProvider && CASINO_GAMES.map(game => (
                            <GameCard key={`${game.id}-dup1`} {...game} loading={loading} />
                        ))}
                        {!searchQuery && !selectedProvider && CASINO_GAMES.map(game => (
                            <GameCard key={`${game.id}-dup2`} {...game} loading={loading} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhum jogo encontrado</h3>
                        <p className="text-muted-foreground">Tente buscar por outro termo ou limpe os filtros.</p>
                        <Button 
                            variant="link" 
                            onClick={() => { setSearchQuery(""); setSelectedProvider(null); }}
                            className="mt-4 text-primary"
                        >
                            Limpar Filtros
                        </Button>
                    </div>
                )}
            </section>
        </TabsContent>
        
        <TabsContent value="slots" className="mt-0">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {CASINO_GAMES.filter(g => g.category === 'Slots').map(game => (
                 <GameCard key={game.id} {...game} loading={loading} />
               ))}
             </div>
       </TabsContent>

       <TabsContent value="live" className="mt-0">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {CASINO_GAMES.filter(g => g.category === 'Live').map(game => (
                 <GameCard key={game.id} {...game} loading={loading} />
               ))}
             </div>
       </TabsContent>

       <TabsContent value="crash" className="mt-0">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {CASINO_GAMES.filter(g => g.category === 'Crash').map(game => (
                 <GameCard key={game.id} {...game} loading={loading} />
               ))}
             </div>
       </TabsContent>
           
      </Tabs>
    </MainLayout>
  );
}
