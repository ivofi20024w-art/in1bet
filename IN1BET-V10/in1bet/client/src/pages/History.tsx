import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarRange, Filter, ChevronDown, Loader2, TrendingUp, TrendingDown, Wallet, X, Gamepad2, DollarSign, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { getStoredAuthState } from "@/lib/authTokens";

interface HistoryItem {
  id: string;
  type: "transaction" | "bet" | "withdrawal" | "deposit" | "bonus";
  category: string;
  description: string;
  amount: number;
  profit?: number;
  status: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface UserStats {
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  netProfit: number;
  biggestWin: number;
  totalDeposits: number;
  totalWithdrawals: number;
}

export default function History() {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [gameTypeFilter, setGameTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const getAuthHeaders = () => {
    return {
      'Content-Type': 'application/json',
    };
  };

  const fetchHistory = async (reset: boolean = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      params.append("limit", "50");
      params.append("offset", String(currentOffset));
      
      if (filter !== "all") params.append("type", filter);
      if (filter === "bets") {
        if (gameTypeFilter) params.append("gameType", gameTypeFilter);
        if (statusFilter) params.append("status", statusFilter);
        if (startDate) params.append("startDate", startDate);
        if (endDate) params.append("endDate", endDate);
        if (minAmount) params.append("minAmount", minAmount);
        if (maxAmount) params.append("maxAmount", maxAmount);
      }

      const endpoint = filter === "bets" ? `/api/history/bets?${params}` : `/api/history?${params}`;
      const res = await fetch(endpoint, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setItems(data.items);
        } else {
          setItems(prev => [...prev, ...data.items]);
        }
        setHasMore(data.hasMore);
        setOffset(currentOffset + data.items.length);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  const fetchStats = async () => {
    if (!isAuthenticated) return;

    try {
      const res = await fetch('/api/history/stats', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchHistory(true);
    fetchStats();
  }, [isAuthenticated, filter, gameTypeFilter, statusFilter, startDate, endDate, minAmount, maxAmount]);

  const clearAdvancedFilters = () => {
    setGameTypeFilter("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setMinAmount("");
    setMaxAmount("");
  };

  const hasActiveFilters = gameTypeFilter || statusFilter || startDate || endDate || minAmount || maxAmount;

  const gameTypes = [
    { value: "", label: "Todos os Jogos" },
    { value: "MINES", label: "Mines" },
    { value: "CRASH", label: "Crash" },
    { value: "DOUBLE", label: "Double" },
    { value: "PLINKO", label: "Plinko" },
    { value: "SLOTS", label: "Slots" },
    { value: "SPORTS", label: "Esportes" },
  ];

  const statusOptions = [
    { value: "", label: "Todos os Status" },
    { value: "WON", label: "Ganho" },
    { value: "LOST", label: "Perdido" },
    { value: "ACTIVE", label: "Em Andamento" },
    { value: "PENDING", label: "Pendente" },
    { value: "CANCELLED", label: "Cancelado" },
  ];

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setOffset(0);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ganho':
      case 'won':
      case 'confirmado':
      case 'paid':
      case 'pago':
      case 'aprovado':
        return "bg-green-500/10 text-green-500";
      case 'perdido':
      case 'lost':
      case 'rejeitado':
        return "bg-red-500/10 text-red-500";
      case 'pendente':
      case 'pending':
      case 'em andamento':
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  const getAmountColor = (item: HistoryItem) => {
    if (item.type === 'bet' && item.profit !== undefined) {
      return item.profit > 0 ? "text-green-500" : item.profit < 0 ? "text-red-500" : "text-gray-400";
    }
    if (item.type === 'withdrawal') {
      return "text-red-400";
    }
    if (item.type === 'deposit' || item.type === 'bonus') {
      return "text-green-500";
    }
    return item.amount >= 0 ? "text-green-500" : "text-red-500";
  };

  const filterLabels: Record<string, string> = {
    all: "Todos",
    bets: "Apostas",
    deposits: "Depósitos",
    withdrawals: "Saques",
    transactions: "Transações",
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold text-white mb-4">Login Necessário</h2>
          <p className="text-muted-foreground">Faça login para ver seu histórico</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2" data-testid="text-history-title">Histórico</h1>
          <p className="text-gray-400">Consulte todas as suas atividades de jogo e transações.</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card/50 border-white/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Apostas Ganhas</span>
            </div>
            <p className="text-xl font-bold text-white" data-testid="stat-wins">{stats.totalWins}</p>
          </Card>
          <Card className="bg-card/50 border-white/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground">Apostas Perdidas</span>
            </div>
            <p className="text-xl font-bold text-white" data-testid="stat-losses">{stats.totalLosses}</p>
          </Card>
          <Card className="bg-card/50 border-white/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Lucro/Prejuízo</span>
            </div>
            <p className={cn("text-xl font-bold", stats.netProfit >= 0 ? "text-green-500" : "text-red-500")} data-testid="stat-profit">
              {stats.netProfit >= 0 ? "+" : ""}R$ {stats.netProfit.toFixed(2)}
            </p>
          </Card>
          <Card className="bg-card/50 border-white/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Maior Ganho</span>
            </div>
            <p className="text-xl font-bold text-green-400" data-testid="stat-biggest-win">R$ {stats.biggestWin.toFixed(2)}</p>
          </Card>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="border-white/10 bg-card" data-testid="dropdown-filter">
                <Filter className="w-4 h-4 mr-2 text-primary" /> 
                {filterLabels[filter]} 
                <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {Object.entries(filterLabels).map(([key, label]) => (
                <DropdownMenuItem 
                  key={key} 
                  onClick={() => handleFilterChange(key)}
                  data-testid={`filter-${key}`}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {filter === "bets" && (
            <>
              <Button 
                variant={showAdvancedFilters ? "secondary" : "outline"}
                className="border-white/10"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                data-testid="toggle-advanced-filters"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avançados
                {hasActiveFilters && (
                  <Badge className="ml-2 bg-primary text-white">Ativo</Badge>
                )}
              </Button>

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearAdvancedFilters}
                  className="text-red-400 hover:text-red-300"
                  data-testid="clear-filters"
                >
                  <X className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
              )}
            </>
          )}
        </div>

        {filter === "bets" && showAdvancedFilters && (
          <Card className="bg-card/50 border-white/10 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" /> Tipo de Jogo
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between border-white/10" data-testid="dropdown-game-type">
                      {gameTypes.find(g => g.value === gameTypeFilter)?.label || "Todos os Jogos"}
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {gameTypes.map((type) => (
                      <DropdownMenuItem
                        key={type.value}
                        onClick={() => setGameTypeFilter(type.value)}
                        data-testid={`game-type-${type.value || 'all'}`}
                      >
                        {type.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Resultado
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between border-white/10" data-testid="dropdown-status">
                      {statusOptions.find(s => s.value === statusFilter)?.label || "Todos os Status"}
                      <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {statusOptions.map((status) => (
                      <DropdownMenuItem
                        key={status.value}
                        onClick={() => setStatusFilter(status.value)}
                        data-testid={`status-${status.value || 'all'}`}
                      >
                        {status.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarRange className="w-4 h-4" /> Período
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-secondary/30 border-white/10"
                    placeholder="Início"
                    data-testid="input-start-date"
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-secondary/30 border-white/10"
                    placeholder="Fim"
                    data-testid="input-end-date"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Valor da Aposta (R$)
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={minAmount}
                    onChange={(e) => setMinAmount(e.target.value)}
                    className="bg-secondary/30 border-white/10"
                    placeholder="Mínimo"
                    min="0"
                    step="0.01"
                    data-testid="input-min-amount"
                  />
                  <Input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(e.target.value)}
                    className="bg-secondary/30 border-white/10"
                    placeholder="Máximo"
                    min="0"
                    step="0.01"
                    data-testid="input-max-amount"
                  />
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="bg-card border border-white/5 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <CalendarRange className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum registro encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-secondary/30">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-gray-400 font-bold">Data</TableHead>
                <TableHead className="text-gray-400 font-bold">Tipo</TableHead>
                <TableHead className="text-gray-400 font-bold">Descrição</TableHead>
                <TableHead className="text-gray-400 font-bold text-right">Valor</TableHead>
                <TableHead className="text-gray-400 font-bold text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow 
                  key={item.id} 
                  className="border-white/5 hover:bg-white/5 transition-colors group"
                  data-testid={`row-history-${item.id}`}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs text-muted-foreground mb-0.5">
                        {item.id.slice(0, 8)}...
                      </span>
                      <span className="font-medium text-white text-sm">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground hover:bg-secondary/70">
                      {item.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {item.description}
                    {item.metadata?.multiplier && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({item.metadata.multiplier}x)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={cn("text-right font-bold", getAmountColor(item))}>
                    {item.type === 'bet' && item.profit !== undefined ? (
                      <>
                        {item.profit >= 0 ? "+" : ""}R$ {Math.abs(item.profit).toFixed(2)}
                      </>
                    ) : (
                      <>
                        {item.amount >= 0 ? "+" : ""}R$ {Math.abs(item.amount).toFixed(2)}
                      </>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn("border-transparent font-bold", getStatusColor(item.status))}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      
      {hasMore && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-white"
            onClick={() => fetchHistory(false)}
            disabled={loadingMore}
            data-testid="button-load-more"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Carregando...
              </>
            ) : (
              "Carregar mais"
            )}
          </Button>
        </div>
      )}
    </MainLayout>
  );
}
