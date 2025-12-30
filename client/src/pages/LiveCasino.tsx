import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { CASINO_GAMES } from "@/lib/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Video, Users, Mic2, MonitorPlay } from "lucide-react";
import casinoHero from "@assets/generated_images/premium_3d_casino_chips_and_cards_with_neon_orange_lighting.png";

export default function LiveCasino() {
  const liveGames = CASINO_GAMES.filter(g => g.category === 'Live');

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative h-[300px] md:h-[400px] rounded-b-3xl overflow-hidden mb-12 -mx-4 md:-mx-8 lg:-mx-0 md:rounded-3xl shadow-2xl">
        <img src={casinoHero} alt="Live Casino Banner" className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f15] via-black/40 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-8 z-10">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 backdrop-blur-md mb-6 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Ao Vivo em HD</span>
           </div>
           
           <h1 className="text-5xl md:text-7xl font-heading font-black text-white mb-6 drop-shadow-2xl">
                CASINO <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">AO VIVO</span>
           </h1>
           <p className="text-gray-200 text-lg md:text-xl max-w-2xl mb-8 font-medium leading-relaxed drop-shadow-md">
                Interaja com dealers profissionais e outros jogadores em tempo real. A experiência mais imersiva de Las Vegas diretamente na sua tela.
           </p>
           
           <div className="flex gap-4">
               <Button className="bg-white text-black hover:bg-gray-100 font-bold rounded-full px-8 h-12 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                    <Play className="w-5 h-5 mr-2 fill-black" /> Jogar Agora
               </Button>
           </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Categories Tabs */}
        <Tabs defaultValue="all" className="w-full">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 sticky top-20 z-20 bg-[#0f0f15]/80 backdrop-blur-xl py-4 -mx-4 px-4 md:mx-0 md:rounded-xl border-y md:border border-white/5">
                <TabsList className="bg-transparent h-auto p-0 gap-2 overflow-x-auto w-full md:w-auto justify-start scrollbar-none">
                    <TabsTrigger value="all" className="rounded-full border border-white/10 bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 font-bold transition-all hover:bg-white/10">Todos</TabsTrigger>
                    <TabsTrigger value="roulette" className="rounded-full border border-white/10 bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 font-bold transition-all hover:bg-white/10">Roleta</TabsTrigger>
                    <TabsTrigger value="blackjack" className="rounded-full border border-white/10 bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 font-bold transition-all hover:bg-white/10">Blackjack</TabsTrigger>
                    <TabsTrigger value="shows" className="rounded-full border border-white/10 bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 font-bold transition-all hover:bg-white/10">Game Shows</TabsTrigger>
                    <TabsTrigger value="baccarat" className="rounded-full border border-white/10 bg-white/5 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:border-primary px-6 py-2.5 font-bold transition-all hover:bg-white/10">Baccarat</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-4 text-sm text-gray-400 font-medium whitespace-nowrap hidden md:flex">
                    <span className="flex items-center gap-1"><Video className="w-4 h-4 text-primary" /> HD Streaming</span>
                    <span className="flex items-center gap-1"><Mic2 className="w-4 h-4 text-primary" /> Chat Ao Vivo</span>
                    <span className="flex items-center gap-1"><Users className="w-4 h-4 text-primary" /> Multiplayer</span>
                </div>
            </div>

            <TabsContent value="all" className="mt-0 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Popular Live Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Badge className="bg-red-600 hover:bg-red-500 text-white border-none animate-pulse">AO VIVO</Badge>
                        <h2 className="text-2xl font-bold text-white">Mais Jogados Agora</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {liveGames.map(game => (
                        <GameCard key={game.id} {...game} />
                        ))}
                         {/* Mock dupes for volume */}
                         {liveGames.map(game => (
                        <GameCard key={`${game.id}-dup`} {...game} />
                        ))}
                    </div>
                </section>
                
                 {/* VIP Tables */}
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
                        <Button variant="outline" className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400">Ver Todas</Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {liveGames.slice(0, 4).map(game => (
                        <GameCard key={`${game.id}-vip`} {...game} className="border-amber-500/30 shadow-lg shadow-amber-900/20" />
                        ))}
                    </div>
                </section>
                
                {/* All Tables */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6">Todas as Mesas</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                         {Array.from({length: 12}).map((_, i) => (
                             <GameCard 
                                key={i} 
                                id={100+i} 
                                title={`Mesa ${i+1}`} 
                                provider="Evolution" 
                                image="https://images.unsplash.com/photo-1518893494013-481c1d8ed3fd?auto=format&fit=crop&q=80&w=500"
                             />
                        ))}
                    </div>
                </section>
            </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
