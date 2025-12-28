import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CASINO_GAMES } from "@/lib/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import casinoHero from "@assets/generated_images/premium_3d_casino_chips_and_cards_with_neon_orange_lighting.png";

export default function Casino() {
  return (
    <MainLayout>
      <div className="relative h-64 rounded-2xl overflow-hidden mb-8">
        <img src={casinoHero} alt="Casino Banner" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-8">
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Casino Lobby</h1>
          <p className="text-gray-300">Milhares de jogos e prêmios instantâneos esperam por você.</p>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-secondary/50 p-1 rounded-xl mb-8 border border-white/5 h-auto flex-wrap justify-start">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2">Todos</TabsTrigger>
          <TabsTrigger value="slots" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2">Slots</TabsTrigger>
          <TabsTrigger value="live" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2">Ao Vivo</TabsTrigger>
          <TabsTrigger value="crash" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white px-6 py-2">Crash Games</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CASINO_GAMES.map(game => (
              <GameCard key={game.id} {...game} />
            ))}
             {CASINO_GAMES.map(game => (
              <GameCard key={`${game.id}-duplicate`} {...game} />
            ))}
             {CASINO_GAMES.map(game => (
              <GameCard key={`${game.id}-duplicate-2`} {...game} />
            ))}
          </div>
        </TabsContent>
         <TabsContent value="slots" className="mt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {CASINO_GAMES.filter(g => g.category === 'Slots').map(game => (
              <GameCard key={game.id} {...game} />
            ))}
          </div>
        </TabsContent>
        {/* Other tabs similar structure */}
      </Tabs>
    </MainLayout>
  );
}
