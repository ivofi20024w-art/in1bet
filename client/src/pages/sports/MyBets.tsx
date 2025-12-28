import { MainLayout } from "@/components/layout/MainLayout";
import { BET_HISTORY } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Filter, Search, Calendar, ChevronDown, Trophy, CircleDollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyBets() {
  const [, setLocation] = useLocation();

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Ganho': return 'text-green-500 bg-green-500/10 border-green-500/20';
          case 'Perdido': return 'text-red-500 bg-red-500/10 border-red-500/20';
          case 'Pendente': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
          default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      }
  };

  const sportsBets = BET_HISTORY.filter(bet => bet.type === 'Esportes');

  return (
    <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => setLocation('/sports')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-3xl font-heading font-bold text-white">Minhas Apostas</h1>
            </div>

            <Card className="bg-card border-white/5 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                        <Button variant="secondary" className="bg-primary text-white hover:bg-primary/90">Todas</Button>
                        <Button variant="ghost" className="text-gray-400 hover:text-white">Pendentes</Button>
                        <Button variant="ghost" className="text-gray-400 hover:text-white">Resolvidas</Button>
                        <Button variant="ghost" className="text-gray-400 hover:text-white">Ganhas</Button>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input placeholder="Buscar aposta..." className="pl-9 w-full md:w-64 bg-secondary/20 border-white/10" />
                        </div>
                        <Button variant="outline" size="icon" className="border-white/10">
                            <Calendar className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="space-y-4">
                {sportsBets.length > 0 ? (
                    sportsBets.map((bet, index) => (
                        <Card key={index} className="bg-card border border-white/5 overflow-hidden hover:border-white/10 transition-all group">
                            <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center shrink-0 border border-white/5">
                                        <Trophy className="w-6 h-6 text-gray-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-bold text-white text-lg">{bet.event}</span>
                                            <Badge variant="outline" className={`border ${getStatusColor(bet.status)}`}>
                                                {bet.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-400">
                                            <span>{bet.date}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                                            <span>Aposta Simples</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                                            <span>ID: {bet.id}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 bg-secondary/10 p-3 rounded-xl md:bg-transparent md:p-0">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">Aposta</p>
                                        <p className="font-bold text-white">R$ {bet.stake.toFixed(2)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">Odds</p>
                                        <p className="font-bold text-yellow-500">2.10</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">Retorno</p>
                                        <p className={`font-bold text-lg ${bet.return > 0 ? 'text-green-500' : 'text-white'}`}>
                                            R$ {bet.return > 0 ? bet.return.toFixed(2) : (bet.stake * 2.10).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Accordion-like details (Mock) */}
                            <div className="px-4 md:px-6 py-3 bg-secondary/20 border-t border-white/5 flex justify-between items-center text-xs text-gray-400">
                                <span>Mercado: Vencedor da Partida (1x2) - {bet.event.split(' vs ')[0]}</span>
                                <Button variant="ghost" size="sm" className="h-6 text-xs hover:text-white p-0">Ver Detalhes <ChevronDown className="w-3 h-3 ml-1" /></Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
                        <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <h3 className="text-xl font-bold text-white mb-2">Nenhuma aposta encontrada</h3>
                        <p className="text-gray-400 mb-6">Você ainda não realizou nenhuma aposta esportiva.</p>
                        <Link href="/sports">
                            <Button className="bg-primary hover:bg-primary/90 text-white">Ir para Esportes</Button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    </MainLayout>
  );
}
