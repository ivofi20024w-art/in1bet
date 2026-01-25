import { MainLayout } from "@/components/layout/MainLayout";
import { OddsCard } from "@/components/shared/OddsCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trophy, Search, ChevronRight, Ticket, Filter, Flame, Globe, Calendar, Star, Gamepad2, Swords, Timer, Loader2, BarChart3, TrendingUp } from "lucide-react";
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
import { WidgetConfig, GamesWidget, StandingsWidget, GameWidget } from "@/components/sports/ApiSportsWidgets";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SPORTS_NAV = [
    { id: "all", label: "Destaques", icon: Flame, sport: undefined },
    { id: "live", label: "Ao Vivo", icon: Timer, live: true },
    { id: "FOOTBALL", label: "Futebol", icon: Trophy, sport: "FOOTBALL" },
    { id: "BASKETBALL", label: "Basquete", icon: Trophy, sport: "BASKETBALL" },
    { id: "TENNIS", label: "Tênis", icon: Trophy, sport: "TENNIS" },
    { id: "ESPORTS", label: "eSports", icon: Gamepad2, sport: "ESPORTS" },
    { id: "MMA", label: "MMA", icon: Swords, sport: "MMA" },
];

function TeamLogo({ logo, name, size = "md" }: { logo: string | null; name: string; size?: "sm" | "md" | "lg" }) {
  const [imageError, setImageError] = useState(false);
  const sizeClasses = {
    sm: "w-6 h-6 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-sm"
  };
  
  const fallback = (
    <div className={cn(sizeClasses[size], "rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary border border-primary/20")}>
      {name.substring(0, 2).toUpperCase()}
    </div>
  );
  
  if (!logo || imageError) {
    return fallback;
  }
  
  return (
    <img 
      src={logo} 
      alt={name} 
      className={cn(sizeClasses[size], "object-contain rounded-lg bg-white/5 p-1")}
      onError={() => setImageError(true)}
    />
  );
}

function MatchCard({ match, onSelectOdd }: { match: SportsMatch; onSelectOdd: (match: SportsMatch, odd: SportsOdd) => void }) {
  const { hasSelection } = useBetSlipStore();
  const [statsOpen, setStatsOpen] = useState(false);
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

  const externalId = match.externalId ? match.externalId.replace('apifootball_', '') : null;

  return (
    <div className="bg-card border border-white/5 rounded-xl overflow-hidden hover:border-primary/30 transition-all group">
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-white/5 to-transparent border-b border-white/5">
        <div className="flex items-center gap-2">
          {match.league.logo && (
            <img src={match.league.logo} alt={match.league.name} className="w-4 h-4 object-contain" />
          )}
          <span className="text-xs text-muted-foreground font-medium">{match.league.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {match.isLive && (
            <Badge variant="destructive" className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] px-1.5">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse mr-1" />
              {timeDisplay}
            </Badge>
          )}
          {!match.isLive && (
            <div className="text-right">
              <span className="text-xs font-bold text-white">{timeDisplay}</span>
              {dateDisplay && <span className="text-[10px] text-muted-foreground ml-1.5">{dateDisplay}</span>}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <TeamLogo logo={match.homeTeam.logo} name={match.homeTeam.name} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{match.homeTeam.name}</p>
              <p className="text-[10px] text-muted-foreground">Casa</p>
            </div>
            {match.homeScore !== null && (
              <span className="text-2xl font-black text-white tabular-nums">{match.homeScore}</span>
            )}
          </div>
          
          <div className="px-3 text-center">
            {match.isLive ? (
              <div className="text-primary font-bold text-sm">VS</div>
            ) : (
              <div className="text-muted-foreground text-xs">VS</div>
            )}
          </div>

          <div className="flex items-center gap-3 flex-1 flex-row-reverse">
            <TeamLogo logo={match.awayTeam.logo} name={match.awayTeam.name} />
            <div className="flex-1 min-w-0 text-right">
              <p className="text-sm font-medium text-white truncate">{match.awayTeam.name}</p>
              <p className="text-[10px] text-muted-foreground">Fora</p>
            </div>
            {match.awayScore !== null && (
              <span className="text-2xl font-black text-white tabular-nums">{match.awayScore}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {homeOdd && (
            <button
              onClick={(e) => { e.preventDefault(); onSelectOdd(match, homeOdd); }}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 px-3 rounded-lg border transition-all",
                hasSelection(homeOdd.id)
                  ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20"
                  : "bg-secondary/30 border-white/10 hover:border-primary/50 hover:bg-primary/10"
              )}
              data-testid={`odd-home-${match.id}`}
            >
              <span className="text-[10px] text-muted-foreground mb-0.5 font-medium">1</span>
              <span className="text-sm font-bold text-white">{parseFloat(homeOdd.odds).toFixed(2)}</span>
            </button>
          )}
          {drawOdd && (
            <button
              onClick={(e) => { e.preventDefault(); onSelectOdd(match, drawOdd); }}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 px-3 rounded-lg border transition-all",
                hasSelection(drawOdd.id)
                  ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20"
                  : "bg-secondary/30 border-white/10 hover:border-primary/50 hover:bg-primary/10"
              )}
              data-testid={`odd-draw-${match.id}`}
            >
              <span className="text-[10px] text-muted-foreground mb-0.5 font-medium">X</span>
              <span className="text-sm font-bold text-white">{parseFloat(drawOdd.odds).toFixed(2)}</span>
            </button>
          )}
          {awayOdd && (
            <button
              onClick={(e) => { e.preventDefault(); onSelectOdd(match, awayOdd); }}
              className={cn(
                "flex flex-col items-center justify-center py-2.5 px-3 rounded-lg border transition-all",
                hasSelection(awayOdd.id)
                  ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20"
                  : "bg-secondary/30 border-white/10 hover:border-primary/50 hover:bg-primary/10"
              )}
              data-testid={`odd-away-${match.id}`}
            >
              <span className="text-[10px] text-muted-foreground mb-0.5 font-medium">2</span>
              <span className="text-sm font-bold text-white">{parseFloat(awayOdd.odds).toFixed(2)}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/sports/match/${match.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs border-white/10 hover:border-primary/50 hover:bg-primary/10">
              <TrendingUp className="w-3 h-3 mr-1.5" />
              {match.odds.length > 3 ? `+${match.odds.length - 3} mercados` : "Ver detalhes"}
            </Button>
          </Link>
          
          {externalId && (
            <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary">
                  <BarChart3 className="w-3.5 h-3.5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Estatísticas do Jogo
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <GameWidget gameId={Number(externalId)} className="min-h-[400px]" />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sports() {
  const [activeSport, setActiveSport] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [displayLimit, setDisplayLimit] = useState(10);
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
    
    let filtered = matches;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = matches.filter(m => 
        m.homeTeam.name.toLowerCase().includes(query) ||
        m.awayTeam.name.toLowerCase().includes(query) ||
        m.league.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [matches, searchQuery]);

  const displayedMatches = useMemo(() => {
    return filteredMatches.slice(0, displayLimit);
  }, [filteredMatches, displayLimit]);

  const hasMoreMatches = filteredMatches.length > displayLimit;

  const handleSelectOdd = (match: SportsMatch, odd: SportsOdd) => {
    addSelection(match, odd);
  };

  return (
    <MainLayout>
      <WidgetConfig sport="football" theme="IN1Bet" lang="pt" />
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

          <Tabs defaultValue="betting" className="w-full">
            <TabsList className="w-full bg-card border border-white/5 p-1 mb-4">
              <TabsTrigger value="betting" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                <Ticket className="w-4 h-4 mr-2" />
                Apostas
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                Estatísticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="betting" className="space-y-4 mt-0">
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-2 pb-2">
                  {isLiveFilter ? <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> : <Calendar className="w-4 h-4 text-primary" />}
                  <h3 className="font-heading font-bold text-white uppercase tracking-wide text-sm">
                    {isLiveFilter ? 'Jogos Ao Vivo' : 'Próximos Jogos'} 
                  </h3>
                  <span className="text-xs text-muted-foreground">({filteredMatches.length} jogos)</span>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : displayedMatches.length > 0 ? (
                  <>
                    <div className="grid gap-3">
                      {displayedMatches.map(match => (
                        <MatchCard 
                          key={match.id} 
                          match={match} 
                          onSelectOdd={handleSelectOdd}
                        />
                      ))}
                    </div>
                    {hasMoreMatches && (
                      <Button 
                        variant="outline" 
                        className="w-full mt-4 border-white/10 hover:border-primary/50"
                        onClick={() => setDisplayLimit(prev => prev + 10)}
                        data-testid="load-more-matches"
                      >
                        Carregar mais jogos ({filteredMatches.length - displayLimit} restantes)
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 border border-dashed border-white/10 rounded-xl bg-white/5 flex flex-col items-center">
                    <Search className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
                    <p className="text-white font-bold">Nenhum jogo encontrado</p>
                    <p className="text-sm text-muted-foreground">Tente buscar por outro termo ou selecione outra categoria.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4 mt-0">
              <div className="bg-card border border-white/5 rounded-xl p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-primary" />
                  <h3 className="font-heading font-bold text-white uppercase tracking-wide">Partidas e Resultados</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Veja estatísticas detalhadas, escalações, e histórico de confrontos.</p>
                <GamesWidget sport="football" className="min-h-[400px]" />
              </div>

              <div className="bg-card border border-white/5 rounded-xl p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-heading font-bold text-white uppercase tracking-wide">Classificação - Brasileirão</h3>
                </div>
                <StandingsWidget leagueId={71} className="min-h-[300px]" />
              </div>
            </TabsContent>
          </Tabs>
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
