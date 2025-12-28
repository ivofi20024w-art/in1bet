import { MainLayout } from "@/components/layout/MainLayout";
import { TICKETS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Search, Filter, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function TicketHistory() {
  const [, setLocation] = useLocation();

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'Aberto': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
          case 'Respondido': return 'bg-green-500/10 text-green-500 border-green-500/20';
          case 'Fechado': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
          default: return 'bg-gray-500/10 text-gray-500';
      }
  };

  const getStatusIcon = (status: string) => {
      switch(status) {
          case 'Aberto': return <Clock className="w-3.5 h-3.5" />;
          case 'Respondido': return <MessageSquare className="w-3.5 h-3.5" />;
          case 'Fechado': return <CheckCircle2 className="w-3.5 h-3.5" />;
          default: return <AlertCircle className="w-3.5 h-3.5" />;
      }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
                <Button variant="ghost" size="sm" onClick={() => setLocation('/support')} className="pl-0 hover:bg-transparent hover:text-primary mb-2">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Ajuda
                </Button>
                <h1 className="text-3xl font-heading font-bold text-white">Meus Tickets</h1>
                <p className="text-gray-400 text-sm mt-1">Gerencie suas solicitações de suporte</p>
            </div>
            
            <Link href="/support/tickets/new">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-6 shadow-lg shadow-primary/20">
                    <Plus className="w-5 h-5 mr-2" />
                    Abrir Novo Ticket
                </Button>
            </Link>
        </div>

        {/* Filters Bar */}
        <div className="bg-card border border-white/5 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar tickets por ID ou assunto..." className="pl-10 bg-secondary/20 border-white/10 focus:bg-secondary/40 transition-colors" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                <Button variant="outline" className="border-white/10 bg-primary/10 text-primary border-primary/20">Todos</Button>
                <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-400">Abertos</Button>
                <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-400">Respondidos</Button>
                <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-400">Fechados</Button>
            </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
            {TICKETS.length > 0 ? (
                TICKETS.map((ticket) => (
                    <Card key={ticket.id} className="group border-white/5 bg-card hover:border-primary/30 transition-all cursor-pointer overflow-hidden">
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                    ticket.status === 'Aberto' ? 'bg-blue-500/10' : 
                                    ticket.status === 'Respondido' ? 'bg-green-500/10' : 
                                    'bg-gray-500/10'
                                }`}>
                                    {ticket.status === 'Aberto' ? <Clock className="w-6 h-6 text-blue-500" /> : 
                                     ticket.status === 'Respondido' ? <MessageSquare className="w-6 h-6 text-green-500" /> :
                                     <CheckCircle2 className="w-6 h-6 text-gray-500" />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="font-mono text-xs font-bold text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">#{ticket.id}</span>
                                        <Badge variant="outline" className={`gap-1.5 ${getStatusColor(ticket.status)}`}>
                                            {getStatusIcon(ticket.status)}
                                            {ticket.status}
                                        </Badge>
                                    </div>
                                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{ticket.subject}</h3>
                                    <p className="text-sm text-gray-400 mt-1">Última atualização: {ticket.date}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 pl-16 md:pl-0">
                                <div className="hidden md:block w-px h-10 bg-white/5" />
                                <Button variant="ghost" className="text-sm font-bold text-primary hover:text-white group-hover:translate-x-1 transition-all">
                                    Ver Detalhes <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                                </Button>
                            </div>
                        </div>
                        {ticket.status === 'Respondido' && (
                            <div className="bg-green-500/5 border-t border-green-500/10 px-6 py-3 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-medium text-green-500">Nova resposta do suporte aguardando leitura</span>
                            </div>
                        )}
                    </Card>
                ))
            ) : (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum ticket encontrado</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-6">Você ainda não tem solicitações de suporte registradas.</p>
                    <Link href="/support/tickets/new">
                        <Button className="bg-primary hover:bg-primary/90 text-white">Criar Primeiro Ticket</Button>
                    </Link>
                </div>
            )}
        </div>
      </div>
    </MainLayout>
  );
}
