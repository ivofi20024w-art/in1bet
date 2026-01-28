import { useEffect, useState, useCallback } from "react";
import { getStoredAuth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Ticket,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  Search,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  minDeposit: number | null;
  maxUses: number | null;
  maxUsesPerUser: number;
  usesCount: number;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
  rolloverMultiplier: number;
  createdAt: string;
}

interface PromoCodeStats {
  totalUses: number;
  uniqueUsers: number;
  totalBonusGiven: number;
  recentUses: Array<{
    userName: string;
    userEmail: string;
    bonusAmount: number;
    usedAt: string;
  }>;
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
  });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const typeLabels: Record<string, string> = {
  BONUS_FIXED: "Bônus Fixo",
  BONUS_PERCENT: "Bônus %",
  FREE_BET: "Aposta Grátis",
  CASHBACK: "Cashback",
};

export default function AdminPromoCodes() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoCode | null>(null);
  const [promoStats, setPromoStats] = useState<PromoCodeStats | null>(null);
  const auth = getStoredAuth();

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "BONUS_FIXED",
    value: 0,
    minDeposit: 0,
    maxUses: "",
    maxUsesPerUser: 1,
    startsAt: "",
    expiresAt: "",
    rolloverMultiplier: 1,
  });

  const fetchPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/promo-codes?${params}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.promoCodes || []);
      }
    } catch (error) {
      console.error("Error fetching promo codes:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchTerm]);

  useEffect(() => {
    fetchPromoCodes();
  }, [fetchPromoCodes]);

  const handleToggleStatus = async (id: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/promo-codes/${id}/toggle`, {
        method: "POST",
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message);
        fetchPromoCodes();
      } else {
        toast.error(data.error || "Erro ao alterar status");
      }
    } catch (error) {
      toast.error("Erro ao alterar status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePromo = async () => {
    if (!formData.code || !formData.startsAt || !formData.expiresAt) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/admin/promo-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Código promocional criado!");
        setShowCreateModal(false);
        resetForm();
        fetchPromoCodes();
      } else {
        toast.error(data.error || "Erro ao criar código");
      }
    } catch (error) {
      toast.error("Erro ao criar código promocional");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePromo = async () => {
    if (!selectedPromo) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/promo-codes/${selectedPromo.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          description: formData.description,
          value: formData.value,
          minDeposit: formData.minDeposit || null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          maxUsesPerUser: formData.maxUsesPerUser,
          startsAt: formData.startsAt,
          expiresAt: formData.expiresAt,
          rolloverMultiplier: formData.rolloverMultiplier,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Código atualizado!");
        setShowEditModal(false);
        setSelectedPromo(null);
        fetchPromoCodes();
      } else {
        toast.error(data.error || "Erro ao atualizar");
      }
    } catch (error) {
      toast.error("Erro ao atualizar código");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewStats = async (promo: PromoCode) => {
    setSelectedPromo(promo);
    setShowStatsModal(true);
    try {
      const response = await fetch(`/api/admin/promo-codes/${promo.id}/stats`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPromoStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const openEditModal = (promo: PromoCode) => {
    setSelectedPromo(promo);
    setFormData({
      code: promo.code,
      description: promo.description || "",
      type: promo.type,
      value: promo.value,
      minDeposit: promo.minDeposit || 0,
      maxUses: promo.maxUses?.toString() || "",
      maxUsesPerUser: promo.maxUsesPerUser,
      startsAt: new Date(promo.startsAt).toISOString().slice(0, 16),
      expiresAt: new Date(promo.expiresAt).toISOString().slice(0, 16),
      rolloverMultiplier: promo.rolloverMultiplier,
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      type: "BONUS_FIXED",
      value: 0,
      minDeposit: 0,
      maxUses: "",
      maxUsesPerUser: 1,
      startsAt: "",
      expiresAt: "",
      rolloverMultiplier: 1,
    });
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      BONUS_FIXED: "bg-emerald-500/20 text-emerald-500",
      BONUS_PERCENT: "bg-blue-500/20 text-blue-500",
      FREE_BET: "bg-orange-500/20 text-orange-500",
      CASHBACK: "bg-purple-500/20 text-purple-500",
    };
    return (
      <Badge className={colors[type] || "bg-gray-500/20 text-gray-500"}>
        {typeLabels[type] || type}
      </Badge>
    );
  };

  const getStatusBadge = (promo: PromoCode) => {
    const now = new Date();
    const startsAt = new Date(promo.startsAt);
    const expiresAt = new Date(promo.expiresAt);

    if (!promo.isActive) {
      return <Badge className="bg-gray-500/20 text-gray-500">Inativo</Badge>;
    }
    if (now < startsAt) {
      return <Badge className="bg-yellow-500/20 text-yellow-500">Agendado</Badge>;
    }
    if (now > expiresAt) {
      return <Badge className="bg-red-500/20 text-red-500">Expirado</Badge>;
    }
    if (promo.maxUses && promo.usesCount >= promo.maxUses) {
      return <Badge className="bg-red-500/20 text-red-500">Esgotado</Badge>;
    }
    return <Badge className="bg-emerald-500/20 text-emerald-500">Ativo</Badge>;
  };

  const activeCount = promoCodes.filter((p) => {
    const now = new Date();
    return p.isActive && new Date(p.startsAt) <= now && new Date(p.expiresAt) >= now;
  }).length;

  const totalUses = promoCodes.reduce((sum, p) => sum + p.usesCount, 0);

  return (
    <AdminLayout title="Códigos Promocionais">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Total de Códigos</p>
              <p className="text-2xl font-bold text-white">{promoCodes.length}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Códigos Ativos</p>
              <p className="text-2xl font-bold text-emerald-500">{activeCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-400">Total de Usos</p>
              <p className="text-2xl font-bold text-blue-500">{totalUses}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111111] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Ticket className="h-8 w-8 text-purple-500" />
                <Button
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4" />
                  Novo Código
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#111111] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-white">Códigos Promocionais</CardTitle>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-[#0a0a0a] border-gray-800 w-[200px]"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px] bg-[#0a0a0a] border-gray-800">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px] bg-[#0a0a0a] border-gray-800">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="BONUS_FIXED">Bônus Fixo</SelectItem>
                  <SelectItem value="BONUS_PERCENT">Bônus %</SelectItem>
                  <SelectItem value="FREE_BET">Aposta Grátis</SelectItem>
                  <SelectItem value="CASHBACK">Cashback</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPromoCodes}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Código</TableHead>
                  <TableHead className="text-gray-400">Tipo</TableHead>
                  <TableHead className="text-gray-400">Valor</TableHead>
                  <TableHead className="text-gray-400">Usos</TableHead>
                  <TableHead className="text-gray-400">Período</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
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
                ) : promoCodes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400">
                      Nenhum código promocional encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  promoCodes.map((promo) => (
                    <TableRow key={promo.id} className="border-gray-800">
                      <TableCell>
                        <div>
                          <p className="text-white font-mono font-bold">{promo.code}</p>
                          {promo.description && (
                            <p className="text-gray-500 text-xs truncate max-w-[200px]">
                              {promo.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(promo.type)}</TableCell>
                      <TableCell className="text-purple-500 font-medium">
                        {promo.type === "BONUS_PERCENT"
                          ? `${promo.value}%`
                          : formatCurrency(promo.value)}
                      </TableCell>
                      <TableCell>
                        <span className="text-white">{promo.usesCount}</span>
                        <span className="text-gray-500">
                          {promo.maxUses ? ` / ${promo.maxUses}` : " / ∞"}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm">
                        <div>{formatDate(promo.startsAt)}</div>
                        <div className="text-xs">até {formatDate(promo.expiresAt)}</div>
                      </TableCell>
                      <TableCell>{getStatusBadge(promo)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={promo.isActive}
                          onCheckedChange={() => handleToggleStatus(promo.id)}
                          disabled={actionLoading}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStats(promo)}
                            className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(promo)}
                            className="text-gray-400 hover:text-white hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#111111] border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Criar Código Promocional
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  placeholder="EX: WELCOME50"
                  className="bg-[#0a0a0a] border-gray-800 font-mono"
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
                    <SelectItem value="BONUS_FIXED">Bônus Fixo (R$)</SelectItem>
                    <SelectItem value="BONUS_PERCENT">Bônus Percentual</SelectItem>
                    <SelectItem value="FREE_BET">Aposta Grátis</SelectItem>
                    <SelectItem value="CASHBACK">Cashback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do código promocional"
                className="bg-[#0a0a0a] border-gray-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {formData.type === "BONUS_PERCENT" ? "Percentual (%)" : "Valor (R$)"}
                </Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Depósito Mínimo</Label>
                <Input
                  type="number"
                  value={formData.minDeposit}
                  onChange={(e) =>
                    setFormData({ ...formData, minDeposit: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Usos Total (vazio = ilimitado)</Label>
                <Input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="Ilimitado"
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Usos por Usuário</Label>
                <Input
                  type="number"
                  value={formData.maxUsesPerUser}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 1 })
                  }
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início *</Label>
                <Input
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Expiração *</Label>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Multiplicador de Rollover</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.rolloverMultiplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rolloverMultiplier: parseFloat(e.target.value) || 1,
                  })
                }
                className="bg-[#0a0a0a] border-gray-800"
              />
              <p className="text-xs text-gray-500">
                Ex: 3x significa que o valor do bônus precisa ser apostado 3 vezes
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePromo}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Criar Código
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-[#111111] border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Editar Código: {selectedPromo?.code}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#0a0a0a] border-gray-800"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {formData.type === "BONUS_PERCENT" ? "Percentual (%)" : "Valor (R$)"}
                </Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Depósito Mínimo</Label>
                <Input
                  type="number"
                  value={formData.minDeposit}
                  onChange={(e) =>
                    setFormData({ ...formData, minDeposit: parseFloat(e.target.value) || 0 })
                  }
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Usos Total</Label>
                <Input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  placeholder="Ilimitado"
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Usos por Usuário</Label>
                <Input
                  type="number"
                  value={formData.maxUsesPerUser}
                  onChange={(e) =>
                    setFormData({ ...formData, maxUsesPerUser: parseInt(e.target.value) || 1 })
                  }
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="datetime-local"
                  value={formData.startsAt}
                  onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Expiração</Label>
                <Input
                  type="datetime-local"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="bg-[#0a0a0a] border-gray-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Multiplicador de Rollover</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.rolloverMultiplier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rolloverMultiplier: parseFloat(e.target.value) || 1,
                  })
                }
                className="bg-[#0a0a0a] border-gray-800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdatePromo}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent className="bg-[#111111] border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-500" />
              Estatísticas: {selectedPromo?.code}
            </DialogTitle>
          </DialogHeader>
          {promoStats ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#0a0a0a] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{promoStats.totalUses}</p>
                  <p className="text-xs text-gray-400">Total de Usos</p>
                </div>
                <div className="bg-[#0a0a0a] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-500">{promoStats.uniqueUsers}</p>
                  <p className="text-xs text-gray-400">Usuários Únicos</p>
                </div>
                <div className="bg-[#0a0a0a] p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-500">
                    {formatCurrency(promoStats.totalBonusGiven)}
                  </p>
                  <p className="text-xs text-gray-400">Total Distribuído</p>
                </div>
              </div>
              <div>
                <h4 className="text-white font-medium mb-2">Últimos Usos</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {promoStats.recentUses.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Nenhum uso registrado</p>
                  ) : (
                    promoStats.recentUses.map((use, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded"
                      >
                        <div>
                          <p className="text-white text-sm">{use.userName}</p>
                          <p className="text-gray-500 text-xs">{use.userEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-purple-500 font-medium">
                            {formatCurrency(use.bonusAmount)}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {formatDateTime(use.usedAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatsModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
