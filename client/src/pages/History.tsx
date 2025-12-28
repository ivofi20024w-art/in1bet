import { MainLayout } from "@/components/layout/MainLayout";
import { BET_HISTORY } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarRange, Filter, Search, ArrowDownToLine, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function History() {
  return (
    <MainLayout>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-2">Histórico de Apostas</h1>
              <p className="text-gray-400">Consulte todas as suas atividades de jogo e transações.</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="border-white/10 text-muted-foreground hover:text-white">
                <ArrowDownToLine className="w-4 h-4 mr-2" /> Exportar CSV
             </Button>
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por ID ou Jogo..." className="pl-9 bg-card border-white/5 focus-visible:ring-primary" />
        </div>
        <div className="flex gap-2">
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-white/10 bg-card">
                        <Filter className="w-4 h-4 mr-2 text-primary" /> 
                        Todos os Tipos 
                        <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Todos</DropdownMenuItem>
                    <DropdownMenuItem>Casino</DropdownMenuItem>
                    <DropdownMenuItem>Esportes</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="border-white/10 bg-card">
                        <CalendarRange className="w-4 h-4 mr-2 text-primary" /> 
                        Últimos 30 dias 
                        <ChevronDown className="w-3 h-3 ml-2 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>Hoje</DropdownMenuItem>
                    <DropdownMenuItem>Esta Semana</DropdownMenuItem>
                    <DropdownMenuItem>Este Mês</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>

      <div className="bg-card border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-secondary/30">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-gray-400 font-bold">ID / Data</TableHead>
              <TableHead className="text-gray-400 font-bold">Tipo</TableHead>
              <TableHead className="text-gray-400 font-bold">Evento / Jogo</TableHead>
              <TableHead className="text-gray-400 font-bold text-right">Aposta</TableHead>
              <TableHead className="text-gray-400 font-bold text-right">Retorno</TableHead>
              <TableHead className="text-gray-400 font-bold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BET_HISTORY.map((bet) => (
              <TableRow key={bet.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-mono text-xs text-muted-foreground mb-0.5">{bet.id}</span>
                        <span className="font-medium text-white text-sm">{bet.date}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="secondary" className="bg-secondary/50 text-muted-foreground hover:bg-secondary/70">
                        {bet.type}
                    </Badge>
                </TableCell>
                <TableCell className="text-white font-medium group-hover:text-primary transition-colors cursor-pointer">{bet.event}</TableCell>
                <TableCell className="text-right text-gray-300">R$ {bet.stake.toFixed(2)}</TableCell>
                <TableCell className={cn("text-right font-bold", bet.return > 0 ? "text-green-500" : "text-gray-500")}>
                    R$ {bet.return.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                    <Badge variant="outline" className={cn(
                        "border-transparent font-bold",
                        bet.status === "Ganho" && "bg-green-500/10 text-green-500",
                        bet.status === "Perdido" && "bg-red-500/10 text-red-500",
                        bet.status === "Pendente" && "bg-yellow-500/10 text-yellow-500",
                    )}>
                        {bet.status}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex justify-center mt-6">
        <Button variant="ghost" className="text-muted-foreground hover:text-white">Carregar mais</Button>
      </div>
    </MainLayout>
  );
}
