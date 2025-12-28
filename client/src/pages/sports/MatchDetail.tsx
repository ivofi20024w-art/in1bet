import { MainLayout } from "@/components/layout/MainLayout";
import { ArrowLeft, Clock, Info, Shield, Share2, Star, TrendingUp, BarChart2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BetSlip } from "@/components/betting/BetSlip";
import { useRoute } from "wouter";
import { SPORTS_MATCHES } from "@/lib/mockData";

export default function MatchDetail() {
  const [match, params] = useRoute("/sports/match/:id");
  const id = params?.id;
  
  // Find match or use default for prototype
  const gameData = SPORTS_MATCHES.find(m => m.id.toString() === id) || SPORTS_MATCHES[0];

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          
          {/* Back Navigation */}
          <div className="flex items-center gap-4">
             <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-white/10" onClick={() => window.history.back()}>
                <ArrowLeft className="w-5 h-5" />
             </Button>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Esportes</span>
                <span>/</span>
                <span>{gameData.league}</span>
                <span>/</span>
                <span className="text-white font-medium">{gameData.home} vs {gameData.away}</span>
             </div>
          </div>

          {/* Match Header / Scoreboard */}
          <div className="bg-card border border-white/5 rounded-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f1923] via-[#1a2c3d] to-[#0f1923] z-0" />
            
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0" />
            
            <div className="relative z-10 p-6 md:p-8">
                <div className="flex justify-between items-start mb-8">
                    <Badge variant="outline" className="bg-white/5 border-white/10 text-muted-foreground gap-1.5 pl-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {gameData.isLive ? "AO VIVO" : "Hoje, 16:00"}
                    </Badge>
                    
                    <div className="flex gap-2">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-white rounded-full bg-white/5">
                            <BarChart2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-yellow-400 rounded-full bg-white/5">
                            <Star className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="flex flex-col items-center gap-4 flex-1">
                        <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full p-4 shadow-lg shadow-black/20 flex items-center justify-center">
                            <span className="text-2xl md:text-3xl font-bold text-black">{gameData.home.substring(0, 1)}</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white text-center leading-tight">{gameData.home}</h2>
                    </div>

                    {/* Score / VS */}
                    <div className="flex flex-col items-center px-4 md:px-12">
                        {gameData.isLive ? (
                            <>
                                <div className="text-4xl md:text-6xl font-heading font-black text-white tracking-widest tabular-nums mb-2">
                                    {gameData.score || "0 - 0"}
                                </div>
                                <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-500 text-xs font-bold animate-pulse flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                    {gameData.time}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-4xl font-heading font-bold text-white/20">VS</span>
                                <span className="text-sm font-medium text-muted-foreground">Começa em 2h</span>
                            </div>
                        )}
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-col items-center gap-4 flex-1">
                         <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full p-4 shadow-lg shadow-black/20 flex items-center justify-center">
                            <span className="text-2xl md:text-3xl font-bold text-black">{gameData.away.substring(0, 1)}</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white text-center leading-tight">{gameData.away}</h2>
                    </div>
                </div>
            </div>

            {/* Markets Navigation */}
            <div className="bg-black/20 border-t border-white/5 px-4">
                <Tabs defaultValue="main" className="w-full">
                    <TabsList className="bg-transparent h-14 p-0 gap-6 w-full justify-start overflow-x-auto scrollbar-none">
                        <TabsTrigger value="main" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-bold text-muted-foreground transition-all">
                            Principais
                        </TabsTrigger>
                        <TabsTrigger value="goals" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-bold text-muted-foreground transition-all">
                            Gols
                        </TabsTrigger>
                        <TabsTrigger value="half" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-bold text-muted-foreground transition-all">
                            1º / 2º Tempo
                        </TabsTrigger>
                        <TabsTrigger value="corners" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-bold text-muted-foreground transition-all">
                            Escanteios
                        </TabsTrigger>
                         <TabsTrigger value="players" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-2 font-bold text-muted-foreground transition-all">
                            Jogadores
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
          </div>

          {/* Markets Content */}
          <div className="space-y-4">
            
            {/* 1x2 Market */}
            <Card className="bg-card border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        Resultado Final
                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                    </h3>
                    <Badge variant="outline" className="border-white/10 text-xs">Tempo Regulamentar</Badge>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <Button variant="outline" className="h-14 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white hover:border-primary flex flex-col items-center justify-center gap-1 group">
                        <span className="text-xs text-muted-foreground group-hover:text-white/80">{gameData.home}</span>
                        <span className="text-lg font-bold">{gameData.odds.home.toFixed(2)}</span>
                    </Button>
                    <Button variant="outline" className="h-14 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white hover:border-primary flex flex-col items-center justify-center gap-1 group">
                        <span className="text-xs text-muted-foreground group-hover:text-white/80">Empate</span>
                        <span className="text-lg font-bold">{gameData.odds.draw ? gameData.odds.draw.toFixed(2) : '-'}</span>
                    </Button>
                     <Button variant="outline" className="h-14 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white hover:border-primary flex flex-col items-center justify-center gap-1 group">
                        <span className="text-xs text-muted-foreground group-hover:text-white/80">{gameData.away}</span>
                        <span className="text-lg font-bold">{gameData.odds.away.toFixed(2)}</span>
                    </Button>
                </div>
            </Card>

            {/* Over/Under */}
             <Card className="bg-card border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Total de Gols</h3>
                </div>
                <div className="space-y-2">
                    {[1.5, 2.5, 3.5].map((goals) => (
                        <div key={goals} className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-2 text-sm font-bold text-muted-foreground text-center bg-secondary/20 py-3 rounded-lg border border-white/5">
                                {goals}
                            </div>
                            <Button variant="outline" className="col-span-5 h-12 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white flex justify-between px-4 group">
                                <span className="text-xs text-muted-foreground group-hover:text-white/80">Mais de</span>
                                <span className="font-bold text-base">{(1.5 + Math.random()).toFixed(2)}</span>
                            </Button>
                             <Button variant="outline" className="col-span-5 h-12 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white flex justify-between px-4 group">
                                <span className="text-xs text-muted-foreground group-hover:text-white/80">Menos de</span>
                                <span className="font-bold text-base">{(1.5 + Math.random()).toFixed(2)}</span>
                            </Button>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Both Teams To Score */}
            <Card className="bg-card border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Ambas Marcam</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="h-12 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white flex justify-between px-4 group">
                        <span className="text-xs text-muted-foreground group-hover:text-white/80">Sim</span>
                        <span className="font-bold text-base">1.75</span>
                    </Button>
                    <Button variant="outline" className="h-12 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white flex justify-between px-4 group">
                        <span className="text-xs text-muted-foreground group-hover:text-white/80">Não</span>
                        <span className="font-bold text-base">2.05</span>
                    </Button>
                </div>
            </Card>

             {/* Double Chance */}
            <Card className="bg-card border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Dupla Chance</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <Button variant="outline" className="h-12 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white flex flex-col items-center justify-center gap-0 group">
                        <span className="text-[10px] text-muted-foreground group-hover:text-white/80">{gameData.home} / Empate</span>
                        <span className="font-bold text-base">1.22</span>
                    </Button>
                    <Button variant="outline" className="h-12 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white flex flex-col items-center justify-center gap-0 group">
                        <span className="text-[10px] text-muted-foreground group-hover:text-white/80">{gameData.home} / {gameData.away}</span>
                        <span className="font-bold text-base">1.30</span>
                    </Button>
                     <Button variant="outline" className="h-12 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white flex flex-col items-center justify-center gap-0 group">
                        <span className="text-[10px] text-muted-foreground group-hover:text-white/80">Empate / {gameData.away}</span>
                        <span className="font-bold text-base">1.55</span>
                    </Button>
                </div>
            </Card>

            {/* Correct Score (Grid) */}
             <Card className="bg-card border-white/5 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-white">Placar Exato</h3>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {["1-0", "2-0", "2-1", "0-1", "0-2", "1-2", "0-0", "1-1", "2-2", "3-0", "3-1", "Outros"].map(score => (
                        <Button key={score} variant="outline" className="h-12 border-white/10 bg-secondary/30 hover:bg-primary hover:text-white flex flex-col items-center justify-center gap-0 group">
                            <span className="text-[10px] text-muted-foreground group-hover:text-white/80">{score}</span>
                            <span className="font-bold text-sm">{(5 + Math.random() * 10).toFixed(2)}</span>
                        </Button>
                    ))}
                </div>
            </Card>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block lg:col-span-4 space-y-6">
             <div className="sticky top-24 space-y-6">
                <div className="bg-card border border-white/5 rounded-xl overflow-hidden shadow-xl">
                    <BetSlip />
                </div>
                
                {/* Match Stats Mini */}
                <Card className="bg-card border-white/5 p-4 rounded-xl">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Estatísticas ao Vivo
                    </h3>
                    <div className="space-y-4">
                         <div className="space-y-1">
                             <div className="flex justify-between text-xs">
                                 <span>{gameData.home}</span>
                                 <span className="text-muted-foreground">Posse de Bola</span>
                                 <span>{gameData.away}</span>
                             </div>
                             <div className="flex gap-1 h-2">
                                 <div className="bg-primary rounded-l-full" style={{ width: '45%' }} />
                                 <div className="bg-gray-700 rounded-r-full flex-1" />
                             </div>
                             <div className="flex justify-between text-xs font-bold">
                                 <span>45%</span>
                                 <span>55%</span>
                             </div>
                         </div>

                         <div className="space-y-1">
                             <div className="flex justify-between text-xs">
                                 <span>{gameData.home}</span>
                                 <span className="text-muted-foreground">Ataques Perigosos</span>
                                 <span>{gameData.away}</span>
                             </div>
                             <div className="flex gap-1 h-2">
                                 <div className="bg-blue-500 rounded-l-full" style={{ width: '30%' }} />
                                 <div className="bg-gray-700 rounded-r-full flex-1" />
                             </div>
                              <div className="flex justify-between text-xs font-bold">
                                 <span>12</span>
                                 <span>28</span>
                             </div>
                         </div>
                    </div>
                </Card>
             </div>
        </div>
      </div>
    </MainLayout>
  );
}
