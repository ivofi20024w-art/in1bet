import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Search, Calendar, ChevronRight, Trophy, Star, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { OddsCard } from "@/components/shared/OddsCard";
import { SPORTS_MATCHES } from "@/lib/mockData";

export default function Prematch() {
  const [, setLocation] = useLocation();

  // Mock data for prematch - using existing matches but filtering/modifying
  const upcomingMatches = [
      ...SPORTS_MATCHES.filter(m => !m.isLive).map(m => ({...m, time: "Hoje 20:00"})),
      ...SPORTS_MATCHES.map(m => ({...m, id: m.id + 10, isLive: false, time: "Amanhã 16:00"})),
      ...SPORTS_MATCHES.map(m => ({...m, id: m.id + 20, isLive: false, time: "Sab 14:30"})),
  ];

  const LEAGUES = [
      "Brasileirão Série A", "Premier League", "La Liga", "Serie A", "Bundesliga", "Champions League", "NBA", "UFC"
  ];

  return (
    <MainLayout>
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Button variant="ghost" size="icon" onClick={() => setLocation('/sports')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-heading font-bold text-white">Pré-Jogo</h1>
                        <p className="text-gray-400 text-sm">Aposte antes da partida começar e garanta as melhores odds</p>
                    </div>
                </div>
                
                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Buscar evento..." className="pl-9 bg-secondary/20 border-white/10" />
                    </div>
                    <Button variant="outline" size="icon" className="border-white/10 shrink-0">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Leagues */}
                <div className="hidden lg:block space-y-4">
                    <Card className="bg-card border-white/5 p-4">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-primary" /> Principais Ligas
                        </h3>
                        <div className="space-y-1">
                            {LEAGUES.map((league, i) => (
                                <button key={i} className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-sm group">
                                    {league}
                                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                            ))}
                        </div>
                    </Card>
                    
                    <Card className="bg-card border-white/5 p-4">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary" /> Por Horário
                        </h3>
                        <div className="space-y-1">
                            {["Próxima 1h", "Próximas 3h", "Próximas 6h", "Hoje", "Amanhã", "Fim de Semana"].map((time, i) => (
                                <button key={i} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-sm">
                                    {time}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Featured Match */}
                    <div className="relative h-48 rounded-xl overflow-hidden group cursor-pointer border border-white/5 shadow-lg">
                        <img src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent p-6 flex flex-col justify-center">
                            <Badge className="w-fit bg-primary mb-3">DESTAQUE DO DIA</Badge>
                            <div className="flex items-center gap-4 text-white mb-2">
                                <span className="text-2xl font-bold">Real Madrid</span>
                                <span className="text-xl text-gray-400">vs</span>
                                <span className="text-2xl font-bold">Barcelona</span>
                            </div>
                            <p className="text-gray-300 text-sm mb-4">La Liga • Hoje 16:00</p>
                            <div className="flex gap-3">
                                <Button className="bg-white text-black hover:bg-gray-200 font-bold">
                                    Real Madrid (2.10)
                                </Button>
                                <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                                    Empate (3.40)
                                </Button>
                                <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">
                                    Barcelona (3.10)
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Matches List */}
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="bg-transparent border-b border-white/5 w-full justify-start rounded-none h-auto p-0 mb-6 gap-6">
                            <TabsTrigger value="all" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-bold">Todos</TabsTrigger>
                            <TabsTrigger value="soccer" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-bold">Futebol</TabsTrigger>
                            <TabsTrigger value="basketball" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-bold">Basquete</TabsTrigger>
                            <TabsTrigger value="tennis" className="bg-transparent rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 font-bold">Tênis</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-4">
                            {upcomingMatches.map((match) => (
                                <OddsCard key={match.id} {...match} />
                            ))}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    </MainLayout>
  );
}
