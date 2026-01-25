import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Calendar, ChevronDown, Trophy, Ticket, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useMyBets, type SportsBetSlip } from "@/hooks/use-sports";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function MyBets() {
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: bets, isLoading } = useMyBets(statusFilter, isAuthenticated);

  if (!isAuthLoading && !isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
            <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold text-white mb-2">Faça login para ver suas apostas</h3>
            <p className="text-gray-400 mb-6">Você precisa estar logado para acessar suas apostas.</p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-white" data-testid="login-button">
                Fazer Login
              </Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'WON': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'LOST': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'VOID': return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
      case 'CASHOUT': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'WON': return 'Ganho';
      case 'LOST': return 'Perdido';
      case 'PENDING': return 'Pendente';
      case 'VOID': return 'Cancelado';
      case 'CASHOUT': return 'Cashout';
      default: return status;
    }
  };

  const filteredBets = bets?.filter(bet => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return bet.selections.some(sel => 
      sel.match.homeTeam.name.toLowerCase().includes(query) ||
      sel.match.awayTeam.name.toLowerCase().includes(query) ||
      sel.selectionName.toLowerCase().includes(query)
    ) || bet.betNumber.toLowerCase().includes(query);
  });

  const filters = [
    { label: "Todas", value: undefined },
    { label: "Pendentes", value: "PENDING" },
    { label: "Ganhas", value: "WON" },
    { label: "Perdidas", value: "LOST" },
  ];

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/sports')} data-testid="back-to-sports">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-heading font-bold text-white">Minhas Apostas</h1>
        </div>

        <Card className="bg-card border-white/5 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {filters.map(filter => (
                <Button 
                  key={filter.label}
                  variant={statusFilter === filter.value ? "secondary" : "ghost"}
                  className={cn(
                    statusFilter === filter.value 
                      ? "bg-primary text-white hover:bg-primary/90" 
                      : "text-gray-400 hover:text-white"
                  )}
                  onClick={() => setStatusFilter(filter.value)}
                  data-testid={`filter-${filter.label.toLowerCase()}`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar aposta..." 
                  className="pl-9 w-full md:w-64 bg-secondary/20 border-white/10" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="search-bets"
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredBets && filteredBets.length > 0 ? (
            filteredBets.map((bet) => (
              <BetCard key={bet.id} bet={bet} getStatusColor={getStatusColor} getStatusLabel={getStatusLabel} />
            ))
          ) : (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
              <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhuma aposta encontrada</h3>
              <p className="text-gray-400 mb-6">
                {statusFilter ? "Nenhuma aposta com este status." : "Você ainda não realizou nenhuma aposta esportiva."}
              </p>
              <Link href="/sports">
                <Button className="bg-primary hover:bg-primary/90 text-white" data-testid="go-to-sports">
                  Ir para Esportes
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

function BetCard({ 
  bet, 
  getStatusColor, 
  getStatusLabel 
}: { 
  bet: SportsBetSlip; 
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const mainSelection = bet.selections[0];
  const eventName = mainSelection 
    ? `${mainSelection.match.homeTeam.name} vs ${mainSelection.match.awayTeam.name}`
    : "Aposta Múltipla";

  const totalOdds = parseFloat(bet.totalOdds);
  const stake = parseFloat(bet.stake);
  const potentialWin = parseFloat(bet.potentialWin);
  const actualWin = bet.actualWin ? parseFloat(bet.actualWin) : 0;

  return (
    <Card className="bg-card border border-white/5 overflow-hidden hover:border-white/10 transition-all group" data-testid={`bet-card-${bet.id}`}>
      <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-secondary/30 flex items-center justify-center shrink-0 border border-white/5">
            <Trophy className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <span className="font-bold text-white text-lg">{eventName}</span>
              <Badge variant="outline" className={`border ${getStatusColor(bet.status)}`}>
                {getStatusLabel(bet.status)}
              </Badge>
              {bet.selections.length > 1 && (
                <Badge variant="outline" className="border-primary/30 text-primary">
                  {bet.selections.length} seleções
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap">
              <span>{format(new Date(bet.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>{bet.betType === "SINGLE" ? "Simples" : "Múltipla"}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>#{bet.betNumber}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8 bg-secondary/10 p-3 rounded-xl md:bg-transparent md:p-0">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">Aposta</p>
            <p className="font-bold text-white">R$ {stake.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">Odds</p>
            <p className="font-bold text-yellow-500">{totalOdds.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-0.5 uppercase tracking-wider">
              {bet.status === "WON" ? "Ganho" : bet.status === "LOST" ? "Perdido" : "Retorno Pot."}
            </p>
            <p className={cn(
              "font-bold text-lg",
              bet.status === "WON" ? "text-green-500" : 
              bet.status === "LOST" ? "text-red-500" : "text-white"
            )}>
              R$ {bet.status === "WON" 
                ? actualWin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                : potentialWin.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
              }
            </p>
          </div>
        </div>
      </div>
      
      <div 
        className="px-4 md:px-6 py-3 bg-secondary/20 border-t border-white/5 flex justify-between items-center text-xs text-gray-400 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span>
          {mainSelection?.selectionName || "Ver detalhes"}
        </span>
        <Button variant="ghost" size="sm" className="h-6 text-xs hover:text-white p-0">
          {expanded ? "Ocultar" : "Ver Detalhes"} 
          <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform", expanded && "rotate-180")} />
        </Button>
      </div>

      {expanded && (
        <div className="px-4 md:px-6 py-4 bg-secondary/10 border-t border-white/5 space-y-3">
          {bet.selections.map((selection, index) => (
            <div key={selection.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div>
                <p className="text-sm font-medium text-white">
                  {selection.match.homeTeam.name} vs {selection.match.awayTeam.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {selection.selectionName}
                </p>
              </div>
              <div className="text-right">
                <Badge 
                  variant="outline" 
                  className={cn(
                    "border text-xs",
                    selection.status === "WON" ? "text-green-500 bg-green-500/10 border-green-500/20" :
                    selection.status === "LOST" ? "text-red-500 bg-red-500/10 border-red-500/20" :
                    "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
                  )}
                >
                  {selection.status === "WON" ? "Ganho" : 
                   selection.status === "LOST" ? "Perdido" : "Pendente"}
                </Badge>
                <p className="text-sm font-bold text-white mt-1">{parseFloat(selection.odds).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
