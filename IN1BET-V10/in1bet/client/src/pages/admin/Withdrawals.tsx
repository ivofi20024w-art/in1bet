import { useEffect, useState, useCallback } from "react";
import { getStoredAuth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Banknote,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Withdrawal {
  id: string;
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  approvedAt: string | null;
  paidAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
    cpf: string;
  };
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

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const auth = getStoredAuth();

  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter !== "all" 
        ? `/api/admin/withdrawals?status=${statusFilter}&limit=100`
        : "/api/admin/withdrawals?limit=100";
      const response = await fetch(url, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleApprove = async (withdrawal: Withdrawal) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}/approve`, {
        method: "POST",
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Saque aprovado!");
        fetchWithdrawals();
      } else {
        toast.error(data.error || "Erro ao aprovar");
      }
    } catch (error) {
      toast.error("Erro ao aprovar saque");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Saque rejeitado");
        setShowRejectDialog(false);
        setSelectedWithdrawal(null);
        setRejectReason("");
        fetchWithdrawals();
      } else {
        toast.error(data.error || "Erro ao rejeitar");
      }
    } catch (error) {
      toast.error("Erro ao rejeitar saque");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedWithdrawal) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${selectedWithdrawal.id}/pay`, {
        method: "POST",
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Saque marcado como pago!");
        setShowPayDialog(false);
        setSelectedWithdrawal(null);
        fetchWithdrawals();
      } else {
        toast.error(data.error || "Erro ao marcar como pago");
      }
    } catch (error) {
      toast.error("Erro ao processar pagamento");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    return (
      withdrawal.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.user?.cpf.includes(searchTerm.replace(/\D/g, "")) ||
      withdrawal.pixKey.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return <Badge className="bg-emerald-500/20 text-emerald-500">Pago</Badge>;
      case "APPROVED":
        return <Badge className="bg-blue-500/20 text-blue-500">Aprovado</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Pendente</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500/20 text-red-500">Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-500">{status}</Badge>;
    }
  };

  const stats = {
    pending: withdrawals.filter((w) => w.status === "PENDING").length,
    approved: withdrawals.filter((w) => w.status === "APPROVED").length,
    pendingValue: withdrawals
      .filter((w) => w.status === "PENDING")
      .reduce((sum, w) => sum + w.amount, 0),
    approvedValue: withdrawals
      .filter((w) => w.status === "APPROVED")
      .reduce((sum, w) => sum + w.amount, 0),
  };

  return (
    <AdminLayout title="Saques PIX">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#111111] border-gray-800 ring-1 ring-yellow-500/30">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-xs text-gray-500">{formatCurrency(stats.pendingValue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800 ring-1 ring-blue-500/30">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Aprovados (aguardando)</p>
              <p className="text-2xl font-bold text-blue-500">{stats.approved}</p>
              <p className="text-xs text-gray-500">{formatCurrency(stats.approvedValue)}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Total na Fila</p>
              <p className="text-2xl font-bold text-white">{stats.pending + stats.approved}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Valor Total na Fila</p>
              <p className="text-2xl font-bold text-orange-500">
                {formatCurrency(stats.pendingValue + stats.approvedValue)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, CPF ou chave PIX..."
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
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="APPROVED">Aprovado</SelectItem>
                <SelectItem value="PAID">Pago</SelectItem>
                <SelectItem value="REJECTED">Rejeitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchWithdrawals}
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
                  <TableHead className="text-gray-400">Chave PIX</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Criado</TableHead>
                  <TableHead className="text-gray-400 text-right">Ações</TableHead>
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
                ) : filteredWithdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                      Nenhum saque encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWithdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id} className="border-gray-800">
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{withdrawal.user.name}</p>
                          <p className="text-gray-500 text-sm">{withdrawal.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {formatCPF(withdrawal.user.cpf)}
                      </TableCell>
                      <TableCell>
                        <span className="text-orange-500 font-bold">
                          {formatCurrency(withdrawal.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-gray-300 text-sm truncate max-w-[150px]">
                              {withdrawal.pixKey}
                            </p>
                            <p className="text-gray-500 text-xs">{withdrawal.pixKeyType}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(withdrawal.pixKey)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(withdrawal.status)}
                        {withdrawal.rejectionReason && (
                          <p className="text-red-400 text-xs mt-1 truncate max-w-[100px]">
                            {withdrawal.rejectionReason}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {formatDate(withdrawal.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {withdrawal.status === "PENDING" && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() => handleApprove(withdrawal)}
                                disabled={actionLoading}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                  setSelectedWithdrawal(withdrawal);
                                  setShowRejectDialog(true);
                                }}
                                disabled={actionLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {withdrawal.status === "APPROVED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setShowPayDialog(true);
                              }}
                              disabled={actionLoading}
                            >
                              <Banknote className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-[#111111] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Rejeitar Saque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-400">
              Tem certeza que deseja rejeitar este saque de{" "}
              <span className="text-orange-500 font-bold">
                {selectedWithdrawal && formatCurrency(selectedWithdrawal.amount)}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500">
              O saldo será devolvido para a carteira do usuário.
            </p>
            <Textarea
              placeholder="Motivo da rejeição (obrigatório)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-[#0a0a0a] border-gray-800"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              Rejeitar Saque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="bg-[#111111] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Banknote className="h-5 w-5 text-emerald-500" />
              Marcar como Pago
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-400">
              Confirma que o pagamento de{" "}
              <span className="text-orange-500 font-bold">
                {selectedWithdrawal && formatCurrency(selectedWithdrawal.amount)}
              </span>{" "}
              foi realizado?
            </p>
            {selectedWithdrawal && (
              <div className="bg-[#0a0a0a] p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Chave PIX:</span>
                  <span className="text-white font-mono">{selectedWithdrawal.pixKey}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tipo:</span>
                  <span className="text-white">{selectedWithdrawal.pixKeyType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Usuário:</span>
                  <span className="text-white">{selectedWithdrawal.user.name}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handlePay}
              disabled={actionLoading}
            >
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
