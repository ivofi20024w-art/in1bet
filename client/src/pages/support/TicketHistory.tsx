import { MainLayout } from "@/components/layout/MainLayout";
import { TICKETS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TicketHistory() {
  const [, setLocation] = useLocation();

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setLocation('/support')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-3xl font-heading font-bold text-white">Meus Tickets</h1>
            </div>
            <Link href="/support/tickets/new">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Ticket
                </Button>
            </Link>
        </div>

        <div className="bg-card border border-white/5 rounded-xl overflow-hidden">
            <Table>
                <TableHeader className="bg-secondary/50">
                    <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-gray-400 font-bold">ID</TableHead>
                        <TableHead className="text-gray-400 font-bold">Assunto</TableHead>
                        <TableHead className="text-gray-400 font-bold">Data</TableHead>
                        <TableHead className="text-gray-400 font-bold text-center">Status</TableHead>
                        <TableHead className="text-gray-400 font-bold text-right">Ação</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {TICKETS.map((ticket) => (
                        <TableRow key={ticket.id} className="border-white/5 hover:bg-white/5">
                            <TableCell className="font-mono text-xs text-muted-foreground">{ticket.id}</TableCell>
                            <TableCell className="font-medium text-white">{ticket.subject}</TableCell>
                            <TableCell className="text-gray-400">{ticket.date}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant="outline" className={`border-transparent ${
                                    ticket.status === 'Aberto' ? 'bg-blue-500/20 text-blue-500' : 
                                    ticket.status === 'Respondido' ? 'bg-green-500/20 text-green-500' :
                                    'bg-gray-500/20 text-gray-500'
                                }`}>
                                    {ticket.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button size="sm" variant="ghost" className="h-8 text-primary hover:text-white">Ver</Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>
    </MainLayout>
  );
}
