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
import { Search, RefreshCw, ArrowRight } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
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

const transactionTypes = [
  { value: "all", label: "Todos" },
  { value: "DEPOSIT", label: "Depósito" },
  { value: "WITHDRAW", label: "Saque" },
  { value: "WITHDRAW_RESERVE", label: "Reserva Saque" },
  { value: "WITHDRAW_RELEASE", label: "Liberação Saque" },
  { value: "BET", label: "Aposta" },
  { value: "WIN", label: "Ganho" },
  { value: "BONUS_CREDIT", label: "Crédito Bônus" },
  { value: "BONUS_CONVERT", label: "Conversão Bônus" },
  { value: "ROLLOVER_CONSUME", label: "Consumo Rollover" },
];

function getTypeBadge(type: string) {
  const colors: Record<string, string> = {
    DEPOSIT: "bg-emerald-500/20 text-emerald-500",
    WITHDRAW: "bg-orange-500/20 text-orange-500",
    WITHDRAW_RESERVE: "bg-yellow-500/20 text-yellow-500",
    WITHDRAW_RELEASE: "bg-blue-500/20 text-blue-500",
    BET: "bg-red-500/20 text-red-500",
    WIN: "bg-emerald-500/20 text-emerald-500",
    BONUS_CREDIT: "bg-purple-500/20 text-purple-500",
    BONUS_CONVERT: "bg-indigo-500/20 text-indigo-500",
    ROLLOVER_CONSUME: "bg-cyan-500/20 text-cyan-500",
  };

  return (
    <Badge className={colors[type] || "bg-gray-500/20 text-gray-500"}>
      {type}
    </Badge>
  );
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const auth = getStoredAuth();

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: "200" });
      if (typeFilter !== "all") {
        params.append("type", typeFilter);
      }
      const response = await fetch(`/api/admin/transactions?${params}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = transactions.filter((tx) => {
    return (
      tx.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user?.cpf.includes(searchTerm.replace(/\D/g, "")) ||
      tx.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <AdminLayout title="Transações (Ledger)">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por usuário ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#111111] border-gray-800"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48 bg-[#111111] border-gray-800">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransactions}
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
                  <TableHead className="text-gray-400">Tipo</TableHead>
                  <TableHead className="text-gray-400">Usuário</TableHead>
                  <TableHead className="text-gray-400">Valor</TableHead>
                  <TableHead className="text-gray-400">Saldo</TableHead>
                  <TableHead className="text-gray-400">Descrição</TableHead>
                  <TableHead className="text-gray-400">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((tx) => (
                    <TableRow key={tx.id} className="border-gray-800">
                      <TableCell>{getTypeBadge(tx.type)}</TableCell>
                      <TableCell>
                        {tx.user ? (
                          <div>
                            <p className="text-white font-medium text-sm">{tx.user.name}</p>
                            <p className="text-gray-500 text-xs">{tx.user.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            tx.type.includes("WIN") ||
                            tx.type.includes("DEPOSIT") ||
                            tx.type.includes("BONUS") ||
                            tx.type.includes("RELEASE")
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {tx.type.includes("WIN") ||
                          tx.type.includes("DEPOSIT") ||
                          tx.type.includes("BONUS") ||
                          tx.type.includes("RELEASE")
                            ? "+"
                            : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-400">{formatCurrency(tx.balanceBefore)}</span>
                          <ArrowRight className="h-3 w-3 text-gray-600" />
                          <span className="text-white">{formatCurrency(tx.balanceAfter)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm max-w-[200px] truncate">
                        {tx.description || tx.referenceId || "-"}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {formatDate(tx.createdAt)}
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
