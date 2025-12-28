import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Search, Calendar, ChevronRight, Trophy, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock results data
const RESULTS = [
    { id: 1, date: "28/12", time: "16:00", league: "Premier League", home: "Man United", away: "Aston Villa", score: "3 - 2", status: "Encerrado" },
    { id: 2, date: "28/12", time: "14:30", league: "Premier League", home: "Chelsea", away: "Crystal Palace", score: "2 - 1", status: "Encerrado" },
    { id: 3, date: "28/12", time: "12:00", league: "Premier League", home: "Brentford", away: "Wolves", score: "1 - 4", status: "Encerrado" },
    { id: 4, date: "27/12", time: "21:30", league: "Brasileirão Série A", home: "Flamengo", away: "Fluminense", score: "1 - 1", status: "Encerrado" },
    { id: 5, date: "27/12", time: "19:00", league: "Brasileirão Série A", home: "Palmeiras", away: "São Paulo", score: "2 - 0", status: "Encerrado" },
    { id: 6, date: "27/12", time: "22:00", league: "NBA", home: "Lakers", away: "Celtics", score: "115 - 126", status: "Encerrado" },
    { id: 7, date: "27/12", time: "20:30", league: "NBA", home: "Nuggets", away: "Warriors", score: "120 - 114", status: "Encerrado" },
];

export default function SportsResults() {
  const [, setLocation] = useLocation();

  return (
    <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => setLocation('/sports')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white">Resultados</h1>
                    <p className="text-gray-400 text-sm">Confira os placares dos jogos encerrados</p>
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-card border-white/5 p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative col-span-1 md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Buscar time ou campeonato..." className="pl-9 bg-secondary/20 border-white/10" />
                </div>
                
                <Select defaultValue="futebol">
                    <SelectTrigger className="bg-secondary/20 border-white/10">
                        <SelectValue placeholder="Esporte" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="futebol">Futebol</SelectItem>
                        <SelectItem value="basquete">Basquete</SelectItem>
                        <SelectItem value="tenis">Tênis</SelectItem>
                        <SelectItem value="volei">Vôlei</SelectItem>
                    </SelectContent>
                </Select>

                <div className="flex gap-2">
                     <Button variant="outline" className="flex-1 border-white/10 text-gray-400">
                        <Calendar className="w-4 h-4 mr-2" /> Data
                    </Button>
                     <Button className="bg-primary hover:bg-primary/90 text-white w-12">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>
            </Card>

            {/* Results List */}
            <div className="space-y-4">
                {RESULTS.map((match) => (
                    <Card key={match.id} className="bg-card border border-white/5 hover:border-white/10 transition-all overflow-hidden group">
                        <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="flex flex-col items-center justify-center min-w-[60px] text-center border-r border-white/5 pr-4">
                                    <span className="text-xs font-bold text-gray-400">{match.date}</span>
                                    <span className="text-sm font-bold text-white">{match.time}</span>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Trophy className="w-3 h-3 text-primary" />
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{match.league}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between gap-8 min-w-[200px]">
                                            <span className="font-medium text-white">{match.home}</span>
                                            <span className="font-bold text-lg text-white">{match.score.split(' - ')[0]}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-8 min-w-[200px]">
                                            <span className="font-medium text-white">{match.away}</span>
                                            <span className="font-bold text-lg text-white">{match.score.split(' - ')[1]}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                                <Badge variant="outline" className="border-white/10 text-gray-400 bg-white/5">
                                    {match.status}
                                </Badge>
                                <Button variant="ghost" size="sm" className="text-primary hover:text-white group-hover:translate-x-1 transition-transform">
                                    Estatísticas <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
            
             <div className="mt-8 text-center">
                <Button variant="outline" className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 w-full md:w-auto">
                    Carregar Mais Resultados
                </Button>
            </div>
        </div>
    </MainLayout>
  );
}
