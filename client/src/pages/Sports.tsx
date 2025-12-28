import { MainLayout } from "@/components/layout/MainLayout";
import { OddsCard } from "@/components/shared/OddsCard";
import { SPORTS_MATCHES } from "@/lib/mockData";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trophy, Search, ChevronRight, Ticket, Filter, Flame, Globe, Calendar, Star, Gamepad2, Swords, Timer } from "lucide-react";
import sportsHero from "@assets/generated_images/live_sports_stadium_atmosphere.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { BetSlip } from "@/components/betting/BetSlip";

// Mock Categories Structure
const SPORTS_NAV = [
    { id: "top", label: "Destaques", icon: Flame, active: true },
    { id: "live", label: "Ao Vivo", icon: Timer },
    { id: "soccer", label: "Futebol", icon: Trophy },
    { id: "basketball", label: "Basquete", icon: Trophy },
    { id: "tennis", label: "Tênis", icon: Trophy },
    { id: "esports", label: "eSports", icon: Gamepad2 },
    { id: "mma", label: "MMA", icon: Swords },
    { id: "favorites", label: "Favoritos", icon: Star },
];

const LEAGUES = [
    { id: "brazil", name: "Brasileirão Série A", country: "Brasil", count: 12 },
    { id: "libertadores", name: "Copa Libertadores", country: "América do Sul", count: 4 },
    { id: "champions", name: "Champions League", country: "Europa", count: 8 },
    { id: "premier", name: "Premier League", country: "Inglaterra", count: 10 },
    { id: "laliga", name: "La Liga", country: "Espanha", count: 5 },
    { id: "nba", name: "NBA", country: "EUA", count: 6 },
];

export default function Sports() {
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming'>('live');
  const [activeSport, setActiveSport] = useState("top");
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar: Sports Navigation (Desktop) */}
        <div className="hidden lg:block lg:col-span-2 space-y-6">
             <div className="bg-card border border-white/5 rounded-xl p-2 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
                <div className="space-y-1 mb-6">
                    {SPORTS_NAV.map(sport => (
                        <button
                            key={sport.id}
                            onClick={() => setActiveSport(sport.id)}
                            className={cn(
                                "flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all group",
                                activeSport === sport.id ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <sport.icon className={cn("w-4 h-4", activeSport === sport.id ? "text-white" : "text-gray-500 group-hover:text-primary")} />
                            {sport.label}
                        </button>
                    ))}
                </div>

                <div className="px-4 mb-2">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ligas Populares</h3>
                </div>
                <div className="space-y-1">
                    {LEAGUES.map(league => (
                        <div key={league.id} className="flex items-center justify-between px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer transition-colors group">
                             <div className="flex flex-col">
                                 <span className="font-medium">{league.name}</span>
                                 <span className="text-[10px] text-gray-600 group-hover:text-gray-500">{league.country}</span>
                             </div>
                             <span className="text-xs bg-secondary rounded px-1.5 py-0.5 text-muted-foreground group-hover:text-white">{league.count}</span>
                        </div>
                    ))}
                </div>
             </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-7 space-y-6">
            {/* Hero Section */}
            <div className="relative h-[200px] rounded-2xl overflow-hidden shadow-2xl border border-white/5 group">
                <img src={sportsHero} alt="Sports Banner" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0f1923] via-[#0f1923]/90 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-center p-8 max-w-lg animate-in slide-in-from-left-4 duration-700">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="border-green-500 text-green-400 font-bold px-2 py-0.5 bg-green-500/10 backdrop-blur-sm">CHAMPIONS LEAGUE</Badge>
                    </div>
                    <h1 className="text-3xl font-heading font-black text-white mb-2 italic leading-none">
                        APOSTE NOS <br/><span className="text-primary">MELHORES JOGOS</span>
                    </h1>
                    <p className="text-gray-400 text-sm mb-4 max-w-xs">Odds aumentadas para todos os jogos da Champions League hoje.</p>
                </div>
            </div>

            {/* Mobile Categories (Horizontal Scroll) */}
            <div className="lg:hidden">
                 <ScrollArea className="w-full whitespace-nowrap pb-2">
                    <div className="flex w-max space-x-2">
                      {SPORTS_NAV.map((sport) => (
                        <button
                          key={sport.id}
                          onClick={() => setActiveSport(sport.id)}
                          className={cn(
                              "flex items-center space-x-2 rounded-full px-4 py-2 text-xs font-bold transition-all border",
                              activeSport === sport.id ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-white/10"
                          )}
                        >
                          <sport.icon className="h-3 w-3" />
                          <span>{sport.label}</span>
                        </button>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="h-1" />
                  </ScrollArea>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card border border-white/5 p-2 rounded-xl">
                 <div className="flex bg-secondary/50 rounded-lg p-1 w-full sm:w-auto">
                     <button 
                        onClick={() => setActiveTab('live')}
                        className={cn(
                            "flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-bold transition-all",
                            activeTab === 'live' ? "bg-background text-white shadow-sm" : "text-muted-foreground hover:text-white"
                        )}
                     >
                        Ao Vivo
                     </button>
                     <button 
                        onClick={() => setActiveTab('upcoming')}
                         className={cn(
                            "flex-1 sm:flex-none px-6 py-2 rounded-md text-sm font-bold transition-all",
                            activeTab === 'upcoming' ? "bg-background text-white shadow-sm" : "text-muted-foreground hover:text-white"
                        )}
                     >
                        Próximos
                     </button>
                 </div>
                 
                 <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar time, liga ou país..." 
                        className="pl-9 bg-background/50 border-white/10 h-10 text-sm focus:bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
            </div>

            {/* Matches Feed */}
            <div className="space-y-3">
                 <div className="flex items-center gap-2 px-2 pb-2">
                    {activeTab === 'live' ? <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> : <Calendar className="w-4 h-4 text-primary" />}
                    <h3 className="font-heading font-bold text-white uppercase tracking-wide text-sm">
                        {activeTab === 'live' ? 'Principais Jogos Ao Vivo' : 'Próximos Destaques'}
                    </h3>
                 </div>
                 
                 {filteredMatches.length > 0 ? (
                     filteredMatches.map(match => (
                        <Link key={match.id} href={`/sports/match/${match.id}`}>
                            <OddsCard {...match} />
                        </Link>
                     ))
                 ) : (
                     <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center">
                        <Search className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
                        <p className="text-white font-bold">Nenhum jogo encontrado</p>
                        <p className="text-sm text-muted-foreground">Tente buscar por outro termo.</p>
                     </div>
                 )}
                 
                 {/* Duplication for scroll feel in prototype */}
                 {filteredMatches.length > 0 && (
                     <>
                        {filteredMatches.map(match => (
                             <Link key={`${match.id}-dup`} href={`/sports/match/${match.id}`}>
                                <OddsCard {...match} />
                            </Link>
                        ))}
                     </>
                 )}
            </div>
        </div>

        {/* Right Sidebar: BetSlip & Promotions */}
        <div className="hidden lg:block lg:col-span-3 space-y-6">
             <div className="sticky top-24 space-y-4">
                <div className="bg-card border border-white/5 rounded-xl overflow-hidden shadow-xl max-h-[600px] flex flex-col">
                     <BetSlip />
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-xl p-5 text-white relative overflow-hidden group cursor-pointer shadow-lg border border-white/10">
                    <div className="relative z-10">
                        <Badge className="bg-black/30 backdrop-blur-md text-white mb-2 border-none text-[10px]">CASHBACK VIP</Badge>
                        <h3 className="font-bold text-xl mb-1 font-heading italic">RETORNO <br/> GARANTIDO</h3>
                        <p className="text-xs opacity-80 mb-3 font-medium max-w-[150px]">Até 15% de cashback em perdas na NBA.</p>
                    </div>
                    <Globe className="absolute -bottom-4 -right-4 w-24 h-24 text-white opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-500" />
                </div>
             </div>
        </div>

      </div>
    </MainLayout>
  );
}
