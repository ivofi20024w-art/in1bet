import { MainLayout } from "@/components/layout/MainLayout";
import { BET_HISTORY } from "@/lib/mockData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function History() {
  return (
    <MainLayout>
      <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Histórico de Apostas</h1>
          <p className="text-gray-400">Consulte todas as suas atividades de jogo.</p>
      </div>

      <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-secondary/50">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-gray-400 font-bold">Data</TableHead>
              <TableHead className="text-gray-400 font-bold">Tipo</TableHead>
              <TableHead className="text-gray-400 font-bold">Evento / Jogo</TableHead>
              <TableHead className="text-gray-400 font-bold text-right">Aposta</TableHead>
              <TableHead className="text-gray-400 font-bold text-right">Retorno</TableHead>
              <TableHead className="text-gray-400 font-bold text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {BET_HISTORY.map((bet) => (
              <TableRow key={bet.id} className="border-white/5 hover:bg-white/5">
                <TableCell className="font-medium text-gray-300">{bet.date}</TableCell>
                <TableCell>{bet.type}</TableCell>
                <TableCell className="text-white">{bet.event}</TableCell>
                <TableCell className="text-right">R$ {bet.stake.toFixed(2)}</TableCell>
                <TableCell className={cn("text-right font-bold", bet.return > 0 ? "text-green-500" : "text-gray-500")}>
                    R$ {bet.return.toFixed(2)}
                </TableCell>
                <TableCell className="text-center">
                    <Badge variant="outline" className={cn(
                        "border-transparent",
                        bet.status === "Ganho" && "bg-green-500/20 text-green-500",
                        bet.status === "Perdido" && "bg-red-500/20 text-red-500",
                        bet.status === "Pendente" && "bg-yellow-500/20 text-yellow-500",
                    )}>
                        {bet.status}
                    </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </MainLayout>
  );
}
