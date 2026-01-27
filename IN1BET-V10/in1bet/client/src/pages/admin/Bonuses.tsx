import { useEffect, useState, useCallback } from "react";
import { getStoredAuth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Gift,
  RefreshCw,
  Plus,
  Edit,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface Bonus {
  id: string;
  name: string;
  description: string;
  type: string;
  percentage: number;
  maxValue: number;
  fixedAmount: number;
  maxWithdrawal: number;
  rolloverMultiplier: number;
  minDeposit: number;
  isActive: boolean;
  isFirstDepositOnly: boolean;
  validDays: number;
  createdAt: string;
}

interface UserBonus {
  id: string;
  bonusName: string;
  bonusAmount: number;
  rolloverTotal: number;
  rolloverRemaining: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface BonusFormData {
  name: string;
  description: string;
  type: string;
  percentage: number;
  maxValue: number;
  fixedAmount: number;
  maxWithdrawal: number;
  rolloverMultiplier: number;
  minDeposit: number;
  isFirstDepositOnly: boolean;
  validDays: number;
}

const initialFormData: BonusFormData = {
  name: "",
  description: "",
  type: "FIRST_DEPOSIT",
  percentage: 100,
  maxValue: 500,
  fixedAmount: 0,
  maxWithdrawal: 0,
  rolloverMultiplier: 35,
  minDeposit: 20,
  isFirstDepositOnly: false,
  validDays: 30,
};

const typeLabels: Record<string, string> = {
  FIRST_DEPOSIT: "Primeiro Depósito",
  RELOAD: "Recarga",
  CASHBACK: "Cashback",
  FREE_BET: "Aposta Grátis",
  VIP: "VIP",
  NO_DEPOSIT: "Sem Depósito",
};

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
  });
}

export default function AdminBonuses() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [userBonuses, setUserBonuses] = useState<UserBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUserBonuses, setLoadingUserBonuses] = useState(true);
  const [selectedUserBonus, setSelectedUserBonus] = useState<UserBonus | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
  const [formData, setFormData] = useState<BonusFormData>(initialFormData);
  const auth = getStoredAuth();

  const fetchBonuses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/bonuses", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setBonuses(data.bonuses || []);
      }
    } catch (error) {
      console.error("Error fetching bonuses:", error);
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  const fetchUserBonuses = useCallback(async () => {
    try {
      setLoadingUserBonuses(true);
      const response = await fetch("/api/admin/user-bonuses?limit=100", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUserBonuses(data.userBonuses || []);
      }
    } catch (error) {
      console.error("Error fetching user bonuses:", error);
    } finally {
      setLoadingUserBonuses(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    fetchBonuses();
    fetchUserBonuses();
  }, [fetchBonuses, fetchUserBonuses]);

  const handleToggleBonus = async (bonusId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/bonuses/${bonusId}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        fetchBonuses();
      } else {
        toast.error(data.error || "Erro ao alterar status");
      }
    } catch (error) {
      toast.error("Erro ao alterar status do bônus");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateBonus = async () => {
    if (!formData.name.trim()) {
      toast.error("Nome do bônus é obrigatório");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/bonuses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Promoção criada com sucesso!");
        setShowCreateDialog(false);
        setFormData(initialFormData);
        fetchBonuses();
      } else {
        toast.error(data.error || "Erro ao criar promoção");
      }
    } catch (error) {
      toast.error("Erro ao criar promoção");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditBonus = async () => {
    if (!selectedBonus || !formData.name.trim()) {
      toast.error("Nome do bônus é obrigatório");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/bonuses/${selectedBonus.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Promoção atualizada com sucesso!");
        setShowEditDialog(false);
        setSelectedBonus(null);
        setFormData(initialFormData);
        fetchBonuses();
      } else {
        toast.error(data.error || "Erro ao atualizar promoção");
      }
    } catch (error) {
      toast.error("Erro ao atualizar promoção");
    } finally {
      setActionLoading(false);
    }
  };

  const openEditDialog = (bonus: Bonus) => {
    setSelectedBonus(bonus);
    setFormData({
      name: bonus.name,
      description: bonus.description || "",
      type: bonus.type,
      percentage: bonus.percentage,
      maxValue: bonus.maxValue,
      fixedAmount: bonus.fixedAmount,
      maxWithdrawal: bonus.maxWithdrawal,
      rolloverMultiplier: bonus.rolloverMultiplier,
      minDeposit: bonus.minDeposit,
      isFirstDepositOnly: bonus.isFirstDepositOnly,
      validDays: bonus.validDays,
    });
    setShowEditDialog(true);
  };

  const handleCancelUserBonus = async () => {
    if (!selectedUserBonus || !cancelReason.trim()) {
      toast.error("Informe o motivo do cancelamento");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/user-bonuses/${selectedUserBonus.id}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ reason: cancelReason }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Bônus cancelado");
        setShowCancelDialog(false);
        setSelectedUserBonus(null);
        setCancelReason("");
        fetchUserBonuses();
      } else {
        toast.error(data.error || "Erro ao cancelar bônus");
      }
    } catch (error) {
      toast.error("Erro ao cancelar bônus");
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      FIRST_DEPOSIT: "bg-emerald-500/20 text-emerald-500",
      RELOAD: "bg-blue-500/20 text-blue-500",
      CASHBACK: "bg-purple-500/20 text-purple-500",
      FREE_BET: "bg-orange-500/20 text-orange-500",
      VIP: "bg-yellow-500/20 text-yellow-500",
      NO_DEPOSIT: "bg-pink-500/20 text-pink-500",
    };
    return (
      <Badge className={colors[type] || "bg-gray-500/20 text-gray-500"}>
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-emerald-500/20 text-emerald-500",
      COMPLETED: "bg-blue-500/20 text-blue-500",
      EXPIRED: "bg-gray-500/20 text-gray-500",
      CANCELLED: "bg-red-500/20 text-red-500",
    };
    return (
      <Badge className={colors[status] || "bg-gray-500/20 text-gray-500"}>
        {status}
      </Badge>
    );
  };

  const activeBonusesCount = userBonuses.filter((ub) => ub.status === "ACTIVE").length;
  const totalRolloverPending = userBonuses
    .filter((ub) => ub.status === "ACTIVE")
    .reduce((sum, ub) => sum + ub.rolloverRemaining, 0);

  const riskUsers = userBonuses.filter(
    (ub) => ub.status === "ACTIVE" && ub.rolloverRemaining > ub.rolloverTotal * 0.5
  );

  const BonusFormFields = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Bônus de Boas-Vindas"
            className="bg-[#0a0a0a] border-gray-800"
          />
        </div>
        <div className="space-y-2">
          <Label>Tipo *</Label>
          <Select
            value={formData.type}
            onValueChange={(v) => setFormData({ ...formData, type: v })}
          >
            <SelectTrigger className="bg-[#0a0a0a] border-gray-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FIRST_DEPOSIT">Primeiro Depósito</SelectItem>
              <SelectItem value="RELOAD">Recarga</SelectItem>
              <SelectItem value="CASHBACK">Cashback</SelectItem>
              <SelectItem value="FREE_BET">Aposta Grátis</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="NO_DEPOSIT">Sem Depósito</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Descrição da promoção"
          className="bg-[#0a0a0a] border-gray-800"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Percentual (%)</Label>
          <Input
            type="number"
            value={formData.percentage}
            onChange={(e) => setFormData({ ...formData, percentage: parseFloat(e.target.value) || 0 })}
            placeholder="100"
            className="bg-[#0a0a0a] border-gray-800"
          />
          <p className="text-xs text-gray-500">Percentual do depósito</p>
        </div>
        <div className="space-y-2">
          <Label>Valor Máximo (R$)</Label>
          <Input
            type="number"
            value={formData.maxValue}
            onChange={(e) => setFormData({ ...formData, maxValue: parseFloat(e.target.value) || 0 })}
            placeholder="500"
            className="bg-[#0a0a0a] border-gray-800"
          />
          <p className="text-xs text-gray-500">Limite do bônus</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valor Fixo (R$)</Label>
          <Input
            type="number"
            value={formData.fixedAmount}
            onChange={(e) => setFormData({ ...formData, fixedAmount: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="bg-[#0a0a0a] border-gray-800"
          />
          <p className="text-xs text-gray-500">0 = usar percentual</p>
        </div>
        <div className="space-y-2">
          <Label>Saque Máximo (R$)</Label>
          <Input
            type="number"
            value={formData.maxWithdrawal}
            onChange={(e) => setFormData({ ...formData, maxWithdrawal: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            className="bg-[#0a0a0a] border-gray-800"
          />
          <p className="text-xs text-gray-500">0 = ilimitado</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rollover (x)</Label>
          <Input
            type="number"
            value={formData.rolloverMultiplier}
            onChange={(e) => setFormData({ ...formData, rolloverMultiplier: parseFloat(e.target.value) || 1 })}
            placeholder="35"
            className="bg-[#0a0a0a] border-gray-800"
          />
          <p className="text-xs text-gray-500">Multiplicador de apostas</p>
        </div>
        <div className="space-y-2">
          <Label>Depósito Mínimo (R$)</Label>
          <Input
            type="number"
            value={formData.minDeposit}
            onChange={(e) => setFormData({ ...formData, minDeposit: parseFloat(e.target.value) || 0 })}
            placeholder="20"
            className="bg-[#0a0a0a] border-gray-800"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Validade (dias)</Label>
          <Input
            type="number"
            value={formData.validDays}
            onChange={(e) => setFormData({ ...formData, validDays: parseInt(e.target.value) || 30 })}
            placeholder="30"
            className="bg-[#0a0a0a] border-gray-800"
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch
            checked={formData.isFirstDepositOnly}
            onCheckedChange={(v) => setFormData({ ...formData, isFirstDepositOnly: v })}
          />
          <Label>Apenas primeiro depósito</Label>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout title="Promoções & Bônus">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Templates de Promoções</p>
              <p className="text-2xl font-bold text-white">{bonuses.length}</p>
              <p className="text-xs text-gray-500">
                {bonuses.filter((b) => b.isActive).length} ativos
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Bônus Ativos (usuários)</p>
              <p className="text-2xl font-bold text-emerald-500">{activeBonusesCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Rollover Pendente Total</p>
              <p className="text-2xl font-bold text-orange-500">
                {formatCurrency(totalRolloverPending)}
              </p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Gift className="h-8 w-8 text-purple-500" />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setFormData(initialFormData);
                    setShowCreateDialog(true);
                  }}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Nova Promoção
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="templates">
          <TabsList className="bg-[#111111]">
            <TabsTrigger value="templates">Templates de Promoções</TabsTrigger>
            <TabsTrigger value="active">Bônus de Usuários</TabsTrigger>
            <TabsTrigger value="alerts">Alertas de Risco</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-6">
            <Card className="bg-[#111111] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Templates de Promoções</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchBonuses}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400">Nome</TableHead>
                      <TableHead className="text-gray-400">Tipo</TableHead>
                      <TableHead className="text-gray-400">Valor</TableHead>
                      <TableHead className="text-gray-400">Rollover</TableHead>
                      <TableHead className="text-gray-400">Max Saque</TableHead>
                      <TableHead className="text-gray-400">Validade</TableHead>
                      <TableHead className="text-gray-400">Ativo</TableHead>
                      <TableHead className="text-gray-400 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : bonuses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                          Nenhuma promoção cadastrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      bonuses.map((bonus) => (
                        <TableRow key={bonus.id} className="border-gray-800">
                          <TableCell>
                            <div>
                              <p className="text-white font-medium">{bonus.name}</p>
                              <p className="text-gray-500 text-xs truncate max-w-[200px]">
                                {bonus.description}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>{getTypeBadge(bonus.type)}</TableCell>
                          <TableCell className="text-purple-500">
                            {bonus.fixedAmount > 0
                              ? formatCurrency(bonus.fixedAmount)
                              : `${bonus.percentage}% até ${formatCurrency(bonus.maxValue)}`}
                          </TableCell>
                          <TableCell className="text-white">
                            {bonus.rolloverMultiplier}x
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {bonus.maxWithdrawal > 0 ? formatCurrency(bonus.maxWithdrawal) : "Ilimitado"}
                          </TableCell>
                          <TableCell className="text-gray-400">
                            {bonus.validDays} dias
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={bonus.isActive}
                              onCheckedChange={() => handleToggleBonus(bonus.id)}
                              disabled={actionLoading}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(bonus)}
                              className="text-gray-400 hover:text-white hover:bg-white/10"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <Card className="bg-[#111111] border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Bônus de Usuários</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchUserBonuses}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Atualizar
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400">Usuário</TableHead>
                      <TableHead className="text-gray-400">Bônus</TableHead>
                      <TableHead className="text-gray-400">Valor</TableHead>
                      <TableHead className="text-gray-400">Rollover</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Expira</TableHead>
                      <TableHead className="text-gray-400 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingUserBonuses ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : userBonuses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                          Nenhum bônus de usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      userBonuses.map((ub) => (
                        <TableRow key={ub.id} className="border-gray-800">
                          <TableCell>
                            {ub.user ? (
                              <div>
                                <p className="text-white font-medium text-sm">{ub.user.name}</p>
                                <p className="text-gray-500 text-xs">{ub.user.email}</p>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-white">{ub.bonusName}</TableCell>
                          <TableCell className="text-purple-500">
                            {formatCurrency(ub.bonusAmount)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <span className="text-orange-500">
                                {formatCurrency(ub.rolloverRemaining)}
                              </span>
                              <span className="text-gray-500">
                                {" / "}
                                {formatCurrency(ub.rolloverTotal)}
                              </span>
                            </div>
                            <div className="w-full h-1 bg-gray-700 rounded mt-1">
                              <div
                                className="h-full bg-emerald-500 rounded"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    100 - (ub.rolloverRemaining / ub.rolloverTotal) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(ub.status)}</TableCell>
                          <TableCell className="text-gray-400 text-sm">
                            {formatDate(ub.expiresAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {ub.status === "ACTIVE" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                  setSelectedUserBonus(ub);
                                  setShowCancelDialog(true);
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="mt-6">
            <Card className="bg-[#111111] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Alertas de Risco (Alto Rollover Pendente)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riskUsers.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Nenhum alerta de risco no momento
                  </p>
                ) : (
                  <div className="space-y-4">
                    {riskUsers.map((ub) => (
                      <div
                        key={ub.id}
                        className="flex items-center justify-between p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg"
                      >
                        <div>
                          <p className="text-white font-medium">{ub.user?.name}</p>
                          <p className="text-gray-500 text-sm">{ub.user?.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-purple-500">
                            Bônus: {formatCurrency(ub.bonusAmount)}
                          </p>
                          <p className="text-orange-500 text-sm">
                            Rollover pendente: {formatCurrency(ub.rolloverRemaining)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#111111] border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Criar Nova Promoção
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Configure todos os detalhes da nova promoção
            </DialogDescription>
          </DialogHeader>
          <BonusFormFields />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setFormData(initialFormData);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateBonus}
              disabled={actionLoading || !formData.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Criar Promoção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[#111111] border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Editar Promoção
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Atualize os detalhes da promoção
            </DialogDescription>
          </DialogHeader>
          <BonusFormFields />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedBonus(null);
                setFormData(initialFormData);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditBonus}
              disabled={actionLoading || !formData.name.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-[#111111] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancelar Bônus
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Esta ação irá remover o bônus do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-400">
              Tem certeza que deseja cancelar o bônus de{" "}
              <span className="text-purple-500 font-bold">
                {selectedUserBonus && formatCurrency(selectedUserBonus.bonusAmount)}
              </span>
              ?
            </p>
            <p className="text-sm text-gray-500">
              O saldo de bônus e rollover serão zerados.
            </p>
            <Textarea
              placeholder="Motivo do cancelamento (obrigatório)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="bg-[#0a0a0a] border-gray-800"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason("");
              }}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelUserBonus}
              disabled={actionLoading || !cancelReason.trim()}
            >
              Cancelar Bônus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
