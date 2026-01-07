import { MainLayout } from "@/components/layout/MainLayout";
import { OddsCard } from "@/components/shared/OddsCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trophy, Search, ChevronRight, Ticket, Filter, Flame, Globe, Calendar, Star, Gamepad2, Swords, Timer, Loader2 } from "lucide-react";
import sportsHero from "@assets/generated_images/live_sports_stadium_atmosphere.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { BetSlip } from "@/components/betting/BetSlip";
import { useMatches, usePopularLeagues, type SportsMatch, type SportsOdd } from "@/hooks/use-sports";
import { useBetSlipStore } from "@/stores/betslip-store";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const SPORTS_NAV = [
    { id: "all", label: "Destaques", icon: Flame, sport: undefined },
    { id: "live", label: "Ao Vivo", icon: Timer, live: true },
    { id: "FOOTBALL", label: "Futebol", icon: Trophy, sport: "FOOTBALL" },
    { id: "BASKETBALL", label: "Basquete", icon: Trophy, sport: "BASKETBALL" },
    { id: "TENNIS", label: "Tênis", icon: Trophy, sport: "TENNIS" },
    { id: "ESPORTS", label: "eSports", icon: Gamepad2, sport: "ESPORTS" },
    { id: "MMA", label: "MMA", icon: Swords, sport: "MMA" },
];

function MatchCard({ match, onSelectOdd }: { match: SportsMatch; onSelectOdd: (match: SportsMatch, odd: SportsOdd) => void }) {
  const { hasSelection } = useBetSlipStore();
  const matchWinnerOdds = match.odds.filter(o => o.marketType === "MATCH_WINNER");
  const homeOdd = matchWinnerOdds.find(o => o.selection === "HOME");
  const drawOdd = matchWinnerOdds.find(o => o.selection === "DRAW");
  const awayOdd = matchWinnerOdds.find(o => o.selection === "AWAY");

  const startsAt = new Date(match.startsAt);
  const timeDisplay = match.isLive 
    ? (match.minute ? `${match.minute}'` : "AO VIVO")
    : format(startsAt, "HH:mm", { locale: ptBR });
  const dateDisplay = match.isLive 
    ? null 
    : format(startsAt, "dd/MM", { locale: ptBR });

  return (
    <div className="bg-card border border-white/5 rounded-xl p-4 hover:border-primary/30 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {match.isLive && (
            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px]">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1" />
              AO VIVO
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{match.league.name}</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-white">{timeDisplay}</span>
          {dateDisplay && <span className="text-[10px] text-muted-foreground ml-1">{dateDisplay}</span>}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-white">{match.homeTeam.name}</span>
            {match.homeScore !== null && (
              <span className="text-sm font-bold text-primary">{match.homeScore}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{match.awayTeam.name}</span>
            {match.awayScore !== null && (
              <span className="text-sm font-bold text-primary">{match.awayScore}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {homeOdd && (
          <button
            onClick={(e) => { e.preventDefault(); onSelectOdd(match, homeOdd); }}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-lg border transition-all",
              hasSelection(homeOdd.id)
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary/30 border-white/10 hover:border-primary/50 hover:bg-primary/10"
            )}
            data-testid={`odd-home-${match.id}`}
          >
            <span className="text-[10px] text-muted-foreground mb-0.5">{match.homeTeam.shortName || "1"}</span>
            <span className="text-sm font-bold text-white">{parseFloat(homeOdd.odds).toFixed(2)}</span>
          </button>
        )}
        {drawOdd && (
          <button
            onClick={(e) => { e.preventDefault(); onSelectOdd(match, drawOdd); }}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-lg border transition-all",
              hasSelection(drawOdd.id)
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary/30 border-white/10 hover:border-primary/50 hover:bg-primary/10"
            )}
            data-testid={`odd-draw-${match.id}`}
          >
            <span className="text-[10px] text-muted-foreground mb-0.5">X</span>
            <span className="text-sm font-bold text-white">{parseFloat(drawOdd.odds).toFixed(2)}</span>
          </button>
        )}
        {awayOdd && (
          <button
            onClick={(e) => { e.preventDefault(); onSelectOdd(match, awayOdd); }}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-3 rounded-lg border transition-all",
              hasSelection(awayOdd.id)
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary/30 border-white/10 hover:border-primary/50 hover:bg-primary/10"
            )}
            data-testid={`odd-away-${match.id}`}
          >
            <span className="text-[10px] text-muted-foreground mb-0.5">{match.awayTeam.shortName || "2"}</span>
            <span className="text-sm font-bold text-white">{parseFloat(awayOdd.odds).toFixed(2)}</span>
          </button>
        )}
      </div>

      <Link href={`/sports/match/${match.id}`} className="block mt-3">
        <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary">
          +{match.odds.length - 3} mercados <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </Link>
    </div>
  );
}

export default function Sports() {
  const [activeSport, setActiveSport] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { addSelection } = useBetSlipStore();

  const selectedNav = SPORTS_NAV.find(n => n.id === activeSport);
  const isLiveFilter = selectedNav?.id === "live";

  const { data: matches, isLoading } = useMatches({
    sport: selectedNav?.sport,
    live: isLiveFilter ? true : undefined,
    featured: activeSport === "all" ? true : undefined,
  });

  const { data: leagues } = usePopularLeagues();

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (!searchQuery) return matches;
    
    const query = searchQuery.toLowerCase();
    return matches.filter(m => 
      m.homeTeam.name.toLowerCase().includes(query) ||
      m.awayTeam.name.toLowerCase().includes(query) ||
      m.league.name.toLowerCase().includes(query)
    );
  }, [matches, searchQuery]);

  const handleSelectOdd = (match: SportsMatch, odd: SportsOdd) => {
    addSelection(match, odd);
  };

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
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
                  data-testid={`sport-nav-${sport.id}`}
                >
                  <sport.icon className={cn("w-4 h-4", activeSport === sport.id ? "text-white" : "text-gray-500 group-hover:text-primary")} />
                  {sport.label}
                </button>
              ))}
            </div>

            {leagues && leagues.length > 0 && (
              <>
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ligas Populares</h3>
                </div>
                <div className="space-y-1">
                  {leagues.map(league => (
                    <div 
                      key={league.id} 
                      className="flex items-center justify-between px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white cursor-pointer transition-colors group"
                      data-testid={`league-${league.id}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{league.name}</span>
                        <span className="text-[10px] text-gray-600 group-hover:text-gray-500">{league.country}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="relative h-[200px] rounded-2xl overflow-hidden shadow-2xl border border-white/5 group">
            <img src={sportsHero} alt="Sports Banner" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f1923] via-[#0f1923]/90 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-8 max-w-lg animate-in slide-in-from-left-4 duration-700">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="border-green-500 text-green-400 font-bold px-2 py-0.5 bg-green-500/10 backdrop-blur-sm">ESPORTES</Badge>
              </div>
              <h1 className="text-3xl font-heading font-black text-white mb-2 italic leading-none">
                APOSTE NOS <br/><span className="text-primary">MELHORES JOGOS</span>
              </h1>
              <p className="text-gray-400 text-sm mb-4 max-w-xs">As melhores odds do mercado para todos os esportes.</p>
            </div>
          </div>

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
                    data-testid={`sport-nav-mobile-${sport.id}`}
                  >
                    <sport.icon className="h-3 w-3" />
                    <span>{sport.label}</span>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="h-1" />
            </ScrollArea>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card border border-white/5 p-2 rounded-xl">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar time, liga ou país..." 
                className="pl-9 bg-background/50 border-white/10 h-10 text-sm focus:bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-sports"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2 pb-2">
              {isLiveFilter ? <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> : <Calendar className="w-4 h-4 text-primary" />}
              <h3 className="font-heading font-bold text-white uppercase tracking-wide text-sm">
                {isLiveFilter ? 'Jogos Ao Vivo' : 'Próximos Jogos'}
              </h3>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredMatches.length > 0 ? (
              <div className="grid gap-3">
                {filteredMatches.map(match => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    onSelectOdd={handleSelectOdd}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center">
                <Search className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
                <p className="text-white font-bold">Nenhum jogo encontrado</p>
                <p className="text-sm text-muted-foreground">Tente buscar por outro termo.</p>
              </div>
            )}
          </div>
        </div>

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
