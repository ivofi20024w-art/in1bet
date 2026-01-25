import { useEffect, useState, useCallback } from "react";
import { getStoredAuth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";

interface Deposit {
  id: string;
  externalId: string;
  amount: number;
  netAmount: number | null;
  status: string;
  createdAt: string;
  paidAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    cpf: string;
  } | null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCPF(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const auth = getStoredAuth();

  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/deposits?limit=100", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setDeposits(data.deposits || []);
      }
    } catch (error) {
      console.error("Error fetching deposits:", error);
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const filteredDeposits = deposits.filter((deposit) => {
    const matchesSearch =
      deposit.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.user?.cpf.includes(searchTerm.replace(/\D/g, "")) ||
      deposit.externalId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || deposit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-500/20 text-emerald-500">Pago</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Pendente</Badge>;
      case "EXPIRED":
        return <Badge className="bg-gray-500/20 text-gray-500">Expirado</Badge>;
      case "FAILED":
        return <Badge className="bg-red-500/20 text-red-500">Falhou</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-500">{status}</Badge>;
    }
  };

  const stats = {
    total: deposits.length,
    paid: deposits.filter((d) => d.status === "PAID").length,
    pending: deposits.filter((d) => d.status === "PENDING").length,
    totalValue: deposits
      .filter((d) => d.status === "PAID")
      .reduce((sum, d) => sum + d.amount, 0),
  };

  return (
    <AdminLayout title="Depósitos PIX">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Total Depósitos</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Pagos</p>
              <p className="text-2xl font-bold text-emerald-500">{stats.paid}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Total Valor</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(stats.totalValue)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CPF ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#111111] border-gray-800"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-[#111111] border-gray-800">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="PAID">Pago</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="EXPIRED">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDeposits}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <Card className="bg-[#111111] border-gray-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Usuário</TableHead>
                  <TableHead className="text-gray-400">CPF</TableHead>
                  <TableHead className="text-gray-400">Valor</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">ID Externo</TableHead>
                  <TableHead className="text-gray-400">Criado</TableHead>
                  <TableHead className="text-gray-400">Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDeposits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                      Nenhum depósito encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeposits.map((deposit) => (
                    <TableRow key={deposit.id} className="border-gray-800">
                      <TableCell>
                        {deposit.user ? (
                          <div>
                            <p className="text-white font-medium">{deposit.user.name}</p>
                            <p className="text-gray-500 text-sm">{deposit.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {deposit.user ? formatCPF(deposit.user.cpf) : "-"}
                      </TableCell>
                      <TableCell>
                        <span className="text-emerald-500 font-medium">
                          {formatCurrency(deposit.amount)}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(deposit.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs font-mono truncate max-w-[120px]">
                            {deposit.externalId}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(deposit.externalId)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {formatDate(deposit.createdAt)}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {deposit.paidAt ? formatDate(deposit.paidAt) : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
