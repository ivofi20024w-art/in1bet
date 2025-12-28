import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { CASINO_GAMES } from "@/lib/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import casinoHero from "@assets/generated_images/premium_3d_casino_chips_and_cards_with_neon_orange_lighting.png";
import { Flame, Star, History, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

export default function Casino() {
  const [loading, setLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
      const timer = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(timer);
  }, []);

  return (
    <MainLayout>
      <div className="relative h-64 rounded-2xl overflow-hidden mb-8 group">
        <img src={casinoHero} alt="Casino Banner" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-8 animate-in slide-in-from-left-4 duration-700">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-primary px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg shadow-primary/20">NOVO</span>
            <span className="text-white/80 text-xs font-medium tracking-wider uppercase">Torneio Exclusivo</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2 text-shadow">Casino Lobby</h1>
          <p className="text-gray-200 font-medium max-w-md">Milhares de jogos, slots exclusivos e prêmios instantâneos esperam por você.</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-secondary/50 p-1 rounded-xl mb-8 border border-white/5 h-auto flex-wrap justify-start sticky top-[4.5rem] z-30 backdrop-blur-md">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 text-xs font-bold">Todos</TabsTrigger>
          <TabsTrigger value="slots" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 text-xs font-bold">Slots</TabsTrigger>
          <TabsTrigger value="live" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 text-xs font-bold">Ao Vivo</TabsTrigger>
          <TabsTrigger value="crash" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 text-xs font-bold">Crash</TabsTrigger>
          <TabsTrigger value="new" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-4 py-2 text-xs font-bold flex gap-1 items-center">
            <Sparkles className="w-3 h-3" /> Novos
          </TabsTrigger>
        </TabsList>
        
        {/* Recent Games Section (Logado) */}
        <section className="mb-8">
            <div className="flex items-center gap-2 mb-4 text-white">
                <History className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">Jogados Recentemente</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {CASINO_GAMES.slice(0, 4).map((game, i) => (
                    <GameCard key={`recent-${game.id}`} {...game} loading={loading} />
                ))}
            </div>
        </section>

        {/* Popular Section */}
        <section className="mb-4">
            <div className="flex items-center gap-2 mb-4 text-white">
                <Flame className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-lg">Populares da Semana</h3>
            </div>
            
            <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {CASINO_GAMES.map(game => (
                    <GameCard key={game.id} {...game} loading={loading} />
                ))}
                {CASINO_GAMES.map(game => (
                    <GameCard key={`${game.id}-duplicate`} {...game} loading={loading} />
                ))}
                {CASINO_GAMES.map(game => (
                    <GameCard key={`${game.id}-duplicate-2`} {...game} loading={loading} />
                ))}
            </div>
            </TabsContent>
            
            <TabsContent value="slots" className="mt-0">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
               {CASINO_GAMES.filter(g => g.category === 'Slots').map(game => (
                 <GameCard key={game.id} {...game} loading={loading} />
               ))}
             </div>
           </TabsContent>
           
        </section>
      </Tabs>
    </MainLayout>
  );
}
