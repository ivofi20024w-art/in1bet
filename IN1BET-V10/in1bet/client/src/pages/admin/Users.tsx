import { useEffect, useState, useCallback } from "react";
import { getStoredAuth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog as ConfirmDialog,
  DialogContent as ConfirmDialogContent,
  DialogHeader as ConfirmDialogHeader,
  DialogTitle as ConfirmDialogTitle,
  DialogFooter as ConfirmDialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  RefreshCw,
  Eye,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  FileText,
  Ban,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  kycStatus: string;
  vipLevel: number;
  isVerified: boolean;
  isBlocked: boolean;
  blockReason?: string;
  createdAt: string;
  balance: number;
  lockedBalance: number;
}

interface UserDetail {
  user: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    phone: string | null;
    kycStatus: string;
    vipLevel: number;
    isVerified: boolean;
    isAdmin: boolean;
    createdAt: string;
  };
  wallet: {
    balance: number;
    bonusBalance: number;
    lockedBalance: number;
    rolloverRemaining: number;
    rolloverTotal: number;
  } | null;
  stats: {
    totalDeposited: number;
    totalWithdrawn: number;
    bonusesReceived: number;
  };
  transactions: any[];
  deposits: any[];
  withdrawals: any[];
  bonuses: any[];
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

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const auth = getStoredAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users?limit=100", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUserDetail = async (userId: string) => {
    setLoadingDetail(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/wallet`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
        setShowUserModal(true);
      }
    } catch (error) {
      console.error("Error fetching user detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cpf.includes(searchTerm.replace(/\D/g, ""))
  );

  const getKycBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-emerald-500/20 text-emerald-500">Verificado</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Pendente</Badge>;
      case "rejected":
        return <Badge className="bg-red-500/20 text-red-500">Rejeitado</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-500">{status}</Badge>;
    }
  };

  const handleBlockUser = async () => {
    if (!userToBlock || !blockReason.trim()) {
      toast.error("Motivo do bloqueio é obrigatório");
      return;
    }
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userToBlock.id}/block`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ reason: blockReason }),
      });
      if (response.ok) {
        toast.success("Usuário bloqueado com sucesso");
        setShowBlockDialog(false);
        setBlockReason("");
        setUserToBlock(null);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao bloquear usuário");
      }
    } catch (error) {
      toast.error("Erro ao bloquear usuário");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockUser = async (user: User) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/unblock`, {
        method: "POST",
        credentials: 'include',
      });
      if (response.ok) {
        toast.success("Usuário desbloqueado com sucesso");
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao desbloquear usuário");
      }
    } catch (error) {
      toast.error("Erro ao desbloquear usuário");
    } finally {
      setActionLoading(false);
    }
  };

  const openBlockDialog = (user: User) => {
    setUserToBlock(user);
    setBlockReason("");
    setShowBlockDialog(true);
  };

  return (
    <AdminLayout title="Usuários">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-[#111111] border-gray-800"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
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
                  <TableHead className="text-gray-400">Nome</TableHead>
                  <TableHead className="text-gray-400">CPF</TableHead>
                  <TableHead className="text-gray-400">Saldo</TableHead>
                  <TableHead className="text-gray-400">KYC</TableHead>
                  <TableHead className="text-gray-400">VIP</TableHead>
                  <TableHead className="text-gray-400">Cadastro</TableHead>
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
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-gray-800">
                      <TableCell>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-gray-500 text-sm">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {formatCPF(user.cpf)}
                      </TableCell>
                      <TableCell>
                        <span className="text-emerald-500 font-medium">
                          {formatCurrency(user.balance)}
                        </span>
                        {user.lockedBalance > 0 && (
                          <span className="text-yellow-500 text-xs block">
                            +{formatCurrency(user.lockedBalance)} bloqueado
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getKycBadge(user.kycStatus)}</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-500/20 text-purple-500">
                          {user.vipLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchUserDetail(user.id)}
                          disabled={loadingDetail}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#111111] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              Detalhes do Usuário
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-[#0a0a0a] border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-400">Informações</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Nome</span>
                      <span className="text-white">{selectedUser.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email</span>
                      <span className="text-white">{selectedUser.user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CPF</span>
                      <span className="text-white font-mono">{formatCPF(selectedUser.user.cpf)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">KYC</span>
                      {getKycBadge(selectedUser.user.kycStatus)}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Admin</span>
                      <span className={selectedUser.user.isAdmin ? "text-emerald-500" : "text-gray-500"}>
                        {selectedUser.user.isAdmin ? "Sim" : "Não"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0a0a0a] border-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-gray-400">Carteira</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedUser.wallet ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Saldo Real</span>
                          <span className="text-emerald-500 font-medium">
                            {formatCurrency(selectedUser.wallet.balance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Saldo Bônus</span>
                          <span className="text-purple-500 font-medium">
                            {formatCurrency(selectedUser.wallet.bonusBalance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Saldo Bloqueado</span>
                          <span className="text-yellow-500 font-medium">
                            {formatCurrency(selectedUser.wallet.lockedBalance)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rollover Pendente</span>
                          <span className="text-orange-500 font-medium">
                            {formatCurrency(selectedUser.wallet.rolloverRemaining)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-gray-500">Carteira não encontrada</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-[#0a0a0a] border-gray-800">
                  <CardContent className="pt-6 text-center">
                    <ArrowDownToLine className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(selectedUser.stats.totalDeposited)}
                    </p>
                    <p className="text-xs text-gray-400">Total Depositado</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#0a0a0a] border-gray-800">
                  <CardContent className="pt-6 text-center">
                    <ArrowUpFromLine className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(selectedUser.stats.totalWithdrawn)}
                    </p>
                    <p className="text-xs text-gray-400">Total Sacado</p>
                  </CardContent>
                </Card>
                <Card className="bg-[#0a0a0a] border-gray-800">
                  <CardContent className="pt-6 text-center">
                    <Gift className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-white">
                      {selectedUser.stats.bonusesReceived}
                    </p>
                    <p className="text-xs text-gray-400">Bônus Recebidos</p>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="transactions">
                <TabsList className="bg-[#0a0a0a]">
                  <TabsTrigger value="transactions">Transações</TabsTrigger>
                  <TabsTrigger value="deposits">Depósitos</TabsTrigger>
                  <TabsTrigger value="withdrawals">Saques</TabsTrigger>
                  <TabsTrigger value="bonuses">Bônus</TabsTrigger>
                </TabsList>

                <TabsContent value="transactions" className="mt-4">
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Tipo</TableHead>
                          <TableHead className="text-gray-400">Valor</TableHead>
                          <TableHead className="text-gray-400">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.transactions.slice(0, 20).map((tx) => (
                          <TableRow key={tx.id} className="border-gray-800">
                            <TableCell>
                              <Badge className="bg-gray-700">{tx.type}</Badge>
                            </TableCell>
                            <TableCell className="text-white">
                              {formatCurrency(tx.amount)}
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {formatDate(tx.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="deposits" className="mt-4">
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Valor</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.deposits.map((d) => (
                          <TableRow key={d.id} className="border-gray-800">
                            <TableCell className="text-emerald-500 font-medium">
                              {formatCurrency(d.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge className={d.status === "PAID" ? "bg-emerald-500/20 text-emerald-500" : "bg-yellow-500/20 text-yellow-500"}>
                                {d.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {formatDate(d.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="withdrawals" className="mt-4">
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Valor</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.withdrawals.map((w) => (
                          <TableRow key={w.id} className="border-gray-800">
                            <TableCell className="text-orange-500 font-medium">
                              {formatCurrency(w.amount)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  w.status === "PAID"
                                    ? "bg-emerald-500/20 text-emerald-500"
                                    : w.status === "REJECTED"
                                    ? "bg-red-500/20 text-red-500"
                                    : "bg-yellow-500/20 text-yellow-500"
                                }
                              >
                                {w.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {formatDate(w.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="bonuses" className="mt-4">
                  <div className="max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Bônus</TableHead>
                          <TableHead className="text-gray-400">Valor</TableHead>
                          <TableHead className="text-gray-400">Rollover</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.bonuses.map((b) => (
                          <TableRow key={b.id} className="border-gray-800">
                            <TableCell className="text-white">{b.bonusName}</TableCell>
                            <TableCell className="text-purple-500">
                              {formatCurrency(b.bonusAmount)}
                            </TableCell>
                            <TableCell className="text-gray-400">
                              {formatCurrency(b.rolloverRemaining)} / {formatCurrency(b.rolloverTotal)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  b.status === "ACTIVE"
                                    ? "bg-emerald-500/20 text-emerald-500"
                                    : b.status === "COMPLETED"
                                    ? "bg-blue-500/20 text-blue-500"
                                    : "bg-gray-500/20 text-gray-500"
                                }
                              >
                                {b.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
