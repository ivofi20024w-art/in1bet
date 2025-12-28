import { useEffect, useState, useCallback } from "react";
import { useLocation } from "wouter";
import { getStoredAuth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Loader2,
  Users,
  CreditCard,
  BarChart3,
  CheckCircle2,
  XCircle,
  Banknote,
  Clock,
  RefreshCw,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  pendingWithdrawals: number;
}

interface WithdrawalUser {
  id: string;
  name: string;
  email: string;
  cpf: string;
}

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
  user: WithdrawalUser;
}

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  kycStatus: string;
  vipLevel: number;
  isVerified: boolean;
  createdAt: string;
  balance: number;
  lockedBalance: number;
}

export default function AdminPanel() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("PENDING");

  const auth = getStoredAuth();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.accessToken || !auth.user) {
        setLocation("/login");
        return;
      }

      try {
        const response = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        });
        
        if (response.status === 403) {
          setLocation("/");
          toast.error("Acesso negado");
          return;
        }

        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setIsAdmin(true);
        } else {
          setLocation("/");
          toast.error("Acesso negado");
          return;
        }
      } catch (error) {
        setLocation("/");
        toast.error("Erro ao verificar permissões");
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, [auth.accessToken, auth.user, setLocation]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [auth.accessToken]);

  const fetchWithdrawals = useCallback(async () => {
    setLoadingWithdrawals(true);
    try {
      const url = filterStatus 
        ? `/api/admin/withdrawals?status=${filterStatus}` 
        : "/api/admin/withdrawals";
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoadingWithdrawals(false);
    }
  }, [auth.accessToken, filterStatus]);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchWithdrawals();
    }
  }, [isAdmin, fetchStats, fetchWithdrawals]);

  const handleApprove = async (withdrawal: Withdrawal) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Saque aprovado!");
        fetchWithdrawals();
        fetchStats();
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
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Saque rejeitado");
        setShowRejectDialog(false);
        setSelectedWithdrawal(null);
        setRejectReason("");
        fetchWithdrawals();
        fetchStats();
      } else {
        toast.error(data.error || "Erro ao rejeitar");
      }
    } catch (error) {
      toast.error("Erro ao rejeitar saque");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async (withdrawal: Withdrawal) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/withdrawals/${withdrawal.id}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Saque marcado como pago!");
        fetchWithdrawals();
        fetchStats();
      } else {
        toast.error(data.error || "Erro ao marcar como pago");
      }
    } catch (error) {
      toast.error("Erro ao marcar como pago");
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectDialog = (withdrawal: Withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setRejectReason("");
    setShowRejectDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-500">Pendente</span>;
      case "APPROVED":
        return <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-500">Aprovado</span>;
      case "REJECTED":
        return <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-500">Rejeitado</span>;
      case "PAID":
        return <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-500">Pago</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs bg-gray-500/20 text-gray-500">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-heading text-white mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">Gerencie usuários e solicitações de saque</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-yellow-500/20">
                <CreditCard className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saques Pendentes</p>
                <p className="text-2xl font-bold text-white">{stats?.pendingWithdrawals || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/20">
                <BarChart3 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sistema</p>
                <p className="text-2xl font-bold text-green-500">Ativo</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="bg-secondary/50 mb-6">
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-primary" data-testid="tab-admin-withdrawals">
              Saques
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="data-[state=active]:bg-primary" 
              data-testid="tab-admin-users"
              onClick={() => fetchUsers()}
            >
              Usuários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="withdrawals">
            <div className="bg-card border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-bold text-white">Solicitações de Saque</h2>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                  >
                    <option value="PENDING">Pendentes</option>
                    <option value="APPROVED">Aprovados</option>
                    <option value="PAID">Pagos</option>
                    <option value="REJECTED">Rejeitados</option>
                    <option value="">Todos</option>
                  </select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchWithdrawals()}
                  disabled={loadingWithdrawals}
                  className="border-white/10"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingWithdrawals ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
              </div>

              {loadingWithdrawals ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : withdrawals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum saque encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawals.map((w) => (
                    <div
                      key={w.id}
                      className="bg-secondary/20 border border-white/5 rounded-xl p-4"
                      data-testid={`withdrawal-${w.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-white">{w.user.name}</h3>
                            {getStatusBadge(w.status)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Valor</p>
                              <p className="font-bold text-white">R$ {w.amount.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Chave PIX ({w.pixKeyType})</p>
                              <p className="text-white text-xs break-all">{w.pixKey}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">CPF</p>
                              <p className="text-white">{w.user.cpf}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Data</p>
                              <p className="text-white text-xs">{formatDate(w.createdAt)}</p>
                            </div>
                          </div>
                          {w.rejectionReason && (
                            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                              <p className="text-xs text-red-400">Motivo: {w.rejectionReason}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 shrink-0">
                          {w.status === "PENDING" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-500"
                                onClick={() => handleApprove(w)}
                                disabled={actionLoading}
                                data-testid={`approve-${w.id}`}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Aprovar
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectDialog(w)}
                                disabled={actionLoading}
                                data-testid={`reject-${w.id}`}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejeitar
                              </Button>
                            </>
                          )}
                          {w.status === "APPROVED" && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-500"
                              onClick={() => handleMarkPaid(w)}
                              disabled={actionLoading}
                              data-testid={`pay-${w.id}`}
                            >
                              <Banknote className="w-4 h-4 mr-1" />
                              Marcar Pago
                            </Button>
                          )}
                          {w.status === "PAID" && (
                            <div className="flex items-center gap-2 text-green-500">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="text-sm font-medium">Pago</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="bg-card border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Usuários</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers()}
                  disabled={loadingUsers}
                  className="border-white/10"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loadingUsers ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
              </div>

              {loadingUsers ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum usuário encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-3 text-muted-foreground text-sm font-medium">Nome</th>
                        <th className="text-left p-3 text-muted-foreground text-sm font-medium">Email</th>
                        <th className="text-left p-3 text-muted-foreground text-sm font-medium">CPF</th>
                        <th className="text-left p-3 text-muted-foreground text-sm font-medium">KYC</th>
                        <th className="text-right p-3 text-muted-foreground text-sm font-medium">Saldo</th>
                        <th className="text-right p-3 text-muted-foreground text-sm font-medium">Bloqueado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5" data-testid={`user-${u.id}`}>
                          <td className="p-3 text-white">{u.name}</td>
                          <td className="p-3 text-white text-sm">{u.email}</td>
                          <td className="p-3 text-white text-sm">{u.cpf}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                              u.kycStatus === "verified" 
                                ? "bg-green-500/20 text-green-500" 
                                : "bg-yellow-500/20 text-yellow-500"
                            }`}>
                              {u.kycStatus === "verified" ? "Verificado" : "Pendente"}
                            </span>
                          </td>
                          <td className="p-3 text-right text-white font-mono">R$ {u.balance.toFixed(2)}</td>
                          <td className="p-3 text-right text-yellow-500 font-mono">R$ {u.lockedBalance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Rejeitar Saque</DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O saldo será devolvido ao usuário.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-secondary/50 border-white/10"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rejeitar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
