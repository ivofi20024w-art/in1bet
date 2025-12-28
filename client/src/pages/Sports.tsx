import { MainLayout } from "@/components/layout/MainLayout";
import { OddsCard } from "@/components/shared/OddsCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SPORTS_MATCHES } from "@/lib/mockData";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trophy, Clock, CalendarDays, Search, Filter, ChevronRight, X, Ticket } from "lucide-react";
import sportsHero from "@assets/generated_images/live_sports_stadium_atmosphere.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState } from "react";

const CATEGORIES = [
  { id: 'soccer', name: 'Futebol', icon: Trophy, active: true },
  { id: 'basketball', name: 'Basquete', icon: Trophy },
  { id: 'tennis', name: 'Tênis', icon: Trophy },
  { id: 'esports', name: 'eSports', icon: Trophy },
  { id: 'volleyball', name: 'Vôlei', icon: Trophy },
  { id: 'mma', name: 'MMA', icon: Trophy },
];

export default function Sports() {
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMatches = SPORTS_MATCHES.filter(m => {
      const matchesTab = activeTab === 'live' ? m.isLive : !m.isLive;
      const matchesSearch = m.home.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.away.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            m.league.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
  });

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative h-[250px] rounded-2xl overflow-hidden mb-8 shadow-2xl border border-white/5">
        <img src={sportsHero} alt="Sports Banner" className="absolute inset-0 w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-r from-[#0f1923] via-[#0f1923]/80 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 max-w-xl animate-in slide-in-from-left-4 duration-700">
          <div className="flex items-center gap-2 mb-3">
             <Badge variant="outline" className="border-green-500 text-green-400 font-bold px-3 py-1 bg-green-500/10 backdrop-blur-sm animate-pulse">AO VIVO AGORA</Badge>
             <span className="text-gray-400 text-xs font-bold tracking-widest uppercase">Champions League</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4 italic leading-none">
            APOSTAS <span className="text-primary">ESPORTIVAS</span>
          </h1>
          <p className="text-gray-300 font-medium text-lg max-w-sm mb-6">As melhores odds para os maiores eventos do mundo com pagamentos instantâneos.</p>
          <div className="flex gap-3">
             <Button className="rounded-full font-bold bg-white text-black hover:bg-gray-200">Ver Jogos de Hoje</Button>
          </div>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="sticky top-20 z-20 bg-background/95 backdrop-blur-xl border-y border-white/5 -mx-4 md:-mx-8 px-4 md:px-8 py-2 mb-8">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex w-max space-x-2 py-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  className={`flex items-center space-x-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${category.active ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-secondary/50 text-muted-foreground hover:text-white hover:bg-white/10"}`}
                >
                  <category.icon className="h-4 w-4" />
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-1.5" />
          </ScrollArea>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Matches */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-white/5 p-4 rounded-xl">
             <div className="flex p-1 bg-secondary/50 rounded-lg">
                 <button 
                    onClick={() => setActiveTab('live')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-background text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                 >
                    Ao Vivo
                 </button>
                 <button 
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-background text-white shadow-sm' : 'text-muted-foreground hover:text-white'}`}
                 >
                    Próximos
                 </button>
             </div>
             
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar time, liga..." 
                    className="pl-9 bg-background border-white/10 h-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
          </div>

          {/* Matches List */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 mb-2 px-2">
                <div className={`w-2 h-2 rounded-full ${activeTab === 'live' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                <h3 className="font-heading font-bold text-lg text-white uppercase tracking-wide">
                    {activeTab === 'live' ? 'Jogos em Andamento' : 'Destaques de Amanhã'}
                </h3>
             </div>
             
             {filteredMatches.length > 0 ? (
                 filteredMatches.map(match => (
                    <OddsCard key={match.id} {...match} />
                 ))
             ) : (
                 <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-muted-foreground font-medium">Nenhum jogo encontrado.</p>
                 </div>
             )}
             
             {/* Mock duplication for scroll feel */}
             {activeTab === 'upcoming' && filteredMatches.length > 0 && (
                 <>
                    {filteredMatches.map(match => (
                        <OddsCard key={`${match.id}-dup1`} {...match} />
                    ))}
                    {filteredMatches.map(match => (
                        <OddsCard key={`${match.id}-dup2`} {...match} />
                    ))}
                 </>
             )}
          </div>
        </div>

        {/* Right Column: Betslip & Promo */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-white/10 rounded-xl overflow-hidden sticky top-24 shadow-2xl">
            <div className="bg-secondary/50 p-4 border-b border-white/5 flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2 text-white">
                  <Ticket className="w-5 h-5 text-primary" />
                  Boletim de Apostas
                </h3>
                <Badge variant="outline" className="bg-primary/20 text-primary border-primary/20 font-mono">0</Badge>
            </div>
            
            <div className="p-6 flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Ticket className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-white font-bold mb-1">Seu boletim está vazio</p>
              <p className="text-xs text-muted-foreground max-w-[200px]">Selecione as odds dos jogos para adicionar apostas aqui.</p>
            </div>
            
            <div className="p-4 bg-secondary/30 border-t border-white/5">
                <div className="flex justify-between items-center text-sm mb-4">
                    <span className="text-muted-foreground">Odds Totais</span>
                    <span className="font-bold text-white font-mono">--</span>
                </div>
                <Button disabled className="w-full font-bold bg-primary/50 text-white/50 cursor-not-allowed">
                    Apostar
                </Button>
            </div>
          </div>
          
           <div className="bg-gradient-to-br from-green-600 to-emerald-800 rounded-xl p-6 text-white relative overflow-hidden group cursor-pointer shadow-lg">
            <div className="relative z-10">
                <Badge className="bg-black/30 backdrop-blur-md text-white mb-3 border-none">Promoção</Badge>
                <h3 className="font-bold text-2xl mb-2 font-heading italic">MÚLTIPLA <br/> TURBINADA</h3>
                <p className="text-sm opacity-90 mb-4 font-medium max-w-[200px]">Aumente seus ganhos em até 50% nas apostas combinadas.</p>
                <button className="bg-white text-emerald-800 font-bold py-2.5 px-6 rounded-lg text-sm hover:bg-emerald-50 transition-colors shadow-lg">
                  Ver Detalhes
                </button>
            </div>
            <Trophy className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
