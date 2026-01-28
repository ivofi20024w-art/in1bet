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
import { Progress } from "@/components/ui/progress";
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
  Target,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Search,
  BarChart3,
  Trophy,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  TrendingUp,
  Gift,
} from "lucide-react";
import { toast } from "sonner";

interface MissionTemplate {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  cadence: string;
  requirementType: string;
  requirementTarget: string;
  requirementMetadata: string | null;
  rewardType: string;
  rewardValue: string;
  rewardMetadata: string | null;
  minVipLevel: string;
  vipRewardMultiplier: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserMission {
  id: string;
  name: string;
  description: string;
  cadence: string;
  progress: number;
  target: number;
  progressPercent: number;
  status: string;
  rewardType: string;
  rewardValue: number;
  periodStart: string;
  periodEnd: string;
  completedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
}

interface UserMissionResult {
  user: {
    id: string;
    name: string;
    email: string;
  };
  missions: UserMission[];
}

interface MissionStats {
  completedToday: number;
  completedWeek: number;
  completedMonth: number;
  rewardsDistributed: {
    xp: number;
    cash: number;
  };
  popularMissions: Array<{
    name: string;
    cadence: string;
    completedCount: number;
    totalAssigned: number;
    completionRate: string;
  }>;
  completionRateByCadence: Array<{
    cadence: string;
    completed: number;
    total: number;
    rate: string;
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

const cadenceLabels: Record<string, string> = {
  DAILY: "Diária",
  WEEKLY: "Semanal",
  EVENT: "Evento",
};

const requirementTypeLabels: Record<string, string> = {
  BET_COUNT: "Qtd. Apostas",
  BET_AMOUNT: "Valor Apostado",
  WIN_COUNT: "Qtd. Vitórias",
  WIN_AMOUNT: "Valor Ganho",
  PLAY_GAME: "Jogar Jogo",
  PLAY_GAME_TYPE: "Tipo de Jogo",
  DEPOSIT: "Depósito",
  CLAIM_DAILY_BOX: "Caixa Diária",
  LEVEL_UP: "Subir Nível",
  LOGIN_STREAK: "Login Sequencial",
};

const rewardTypeLabels: Record<string, string> = {
  XP: "XP",
  BONUS_CASH: "Bônus em Dinheiro",
  FREE_SPINS: "Giros Grátis",
  DAILY_BOX_MULTIPLIER: "Multiplicador Caixa",
  RAKEBACK_BOOST: "Boost Rakeback",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Ativa",
  COMPLETED: "Completa",
  CLAIMED: "Resgatada",
  EXPIRED: "Expirada",
};

export default function AdminMissions() {
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [userMissionsResults, setUserMissionsResults] = useState<UserMissionResult[]>([]);
  const [stats, setStats] = useState<MissionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingUserMissions, setLoadingUserMissions] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MissionTemplate | null>(null);
  const auth = getStoredAuth();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
    cadence: "DAILY",
    requirementType: "BET_COUNT",
    requirementTarget: 5,
    requirementMetadata: "",
    rewardType: "XP",
    rewardValue: 100,
    rewardMetadata: "",
    minVipLevel: "bronze",
    vipRewardMultiplier: 1,
    sortOrder: 0,
    isActive: true,
  });

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/missions/admin/templates", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const response = await fetch("/api/missions/admin/stats", {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const handleSearchUserMissions = async () => {
    if (!searchTerm.trim()) {
      toast.error("Digite um email ou nome para buscar");
      return;
    }
    
    try {
      setLoadingUserMissions(true);
      const response = await fetch(`/api/missions/admin/user-missions?search=${encodeURIComponent(searchTerm)}`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setUserMissionsResults(data.results || []);
        if (data.results?.length === 0) {
          toast.info("Nenhum usuário encontrado");
        }
      }
    } catch (error) {
      console.error("Error searching user missions:", error);
      toast.error("Erro ao buscar missões de usuário");
    } finally {
      setLoadingUserMissions(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchStats();
  }, [fetchTemplates, fetchStats]);

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/missions/admin/templates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) {
        toast.success(currentStatus ? "Template desativado" : "Template ativado");
        fetchTemplates();
      } else {
        toast.error("Erro ao alterar status");
      }
    } catch (error) {
      toast.error("Erro ao alterar status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name || !formData.description) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/missions/admin/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Template criado com sucesso!");
        setShowCreateModal(false);
        resetForm();
        fetchTemplates();
      } else {
        toast.error(data.error || "Erro ao criar template");
      }
    } catch (error) {
      toast.error("Erro ao criar template");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/missions/admin/templates/${selectedTemplate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          icon: formData.icon || undefined,
          requirementTarget: formData.requirementTarget,
          rewardValue: formData.rewardValue,
          sortOrder: formData.sortOrder,
          isActive: formData.isActive,
        }),
      });
      if (response.ok) {
        toast.success("Template atualizado!");
        setShowEditModal(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        toast.error("Erro ao atualizar template");
      }
    } catch (error) {
      toast.error("Erro ao atualizar template");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/missions/admin/templates/${selectedTemplate.id}`, {
        method: "DELETE",
        credentials: 'include',
      });
      if (response.ok) {
        toast.success("Template excluído!");
        setShowDeleteModal(false);
        setSelectedTemplate(null);
        fetchTemplates();
      } else {
        toast.error("Erro ao excluir template");
      }
    } catch (error) {
      toast.error("Erro ao excluir template");
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceComplete = async (assignmentId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/missions/admin/force-complete/${assignmentId}`, {
        method: "POST",
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Missão completada manualmente!");
        handleSearchUserMissions();
      } else {
        toast.error(data.error || "Erro ao completar missão");
      }
    } catch (error) {
      toast.error("Erro ao completar missão");
    } finally {
      setActionLoading(false);
    }
  };

  const handleInitialize = async () => {
    setActionLoading(true);
    try {
      const response = await fetch("/api/missions/admin/initialize", {
        method: "POST",
        credentials: 'include',
      });
      if (response.ok) {
        toast.success("Missões inicializadas!");
        fetchTemplates();
      } else {
        toast.error("Erro ao inicializar");
      }
    } catch (error) {
      toast.error("Erro ao inicializar");
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      icon: "",
      cadence: "DAILY",
      requirementType: "BET_COUNT",
      requirementTarget: 5,
      requirementMetadata: "",
      rewardType: "XP",
      rewardValue: 100,
      rewardMetadata: "",
      minVipLevel: "bronze",
      vipRewardMultiplier: 1,
      sortOrder: 0,
      isActive: true,
    });
  };

  const openEditModal = (template: MissionTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      icon: template.icon || "",
      cadence: template.cadence,
      requirementType: template.requirementType,
      requirementTarget: parseFloat(template.requirementTarget),
      requirementMetadata: template.requirementMetadata || "",
      rewardType: template.rewardType,
      rewardValue: parseFloat(template.rewardValue),
      rewardMetadata: template.rewardMetadata || "",
      minVipLevel: template.minVipLevel || "bronze",
      vipRewardMultiplier: parseFloat(template.vipRewardMultiplier || "1"),
      sortOrder: template.sortOrder,
      isActive: template.isActive,
    });
    setShowEditModal(true);
  };

  const getCadenceBadge = (cadence: string) => {
    const colors: Record<string, string> = {
      DAILY: "bg-blue-500/20 text-blue-500",
      WEEKLY: "bg-purple-500/20 text-purple-500",
      EVENT: "bg-orange-500/20 text-orange-500",
    };
    return (
      <Badge className={colors[cadence] || "bg-gray-500/20 text-gray-500"}>
        {cadenceLabels[cadence] || cadence}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-yellow-500/20 text-yellow-500",
      COMPLETED: "bg-emerald-500/20 text-emerald-500",
      CLAIMED: "bg-blue-500/20 text-blue-500",
      EXPIRED: "bg-gray-500/20 text-gray-500",
    };
    return (
      <Badge className={colors[status] || "bg-gray-500/20 text-gray-500"}>
        {statusLabels[status] || status}
      </Badge>
    );
  };

  return (
    <AdminLayout title="Gerenciamento de Missões">
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="bg-[#1a1a1a] border border-gray-800">
          <TabsTrigger value="templates" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500">
            <Target className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="user-missions" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500">
            <Users className="h-4 w-4 mr-2" />
            Missões de Usuários
          </TabsTrigger>
          <TabsTrigger value="statistics" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500">
            <BarChart3 className="h-4 w-4 mr-2" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Templates */}
        <TabsContent value="templates">
          <Card className="bg-[#111111] border-gray-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-500" />
                Templates de Missões
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInitialize}
                  disabled={actionLoading}
                  className="border-gray-700"
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Inicializar Padrões
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTemplates}
                  disabled={loading}
                  className="border-gray-700"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Template
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum template de missão encontrado</p>
                  <Button
                    variant="outline"
                    className="mt-4 border-gray-700"
                    onClick={handleInitialize}
                  >
                    Inicializar Templates Padrões
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Nome</TableHead>
                      <TableHead className="text-gray-400">Tipo</TableHead>
                      <TableHead className="text-gray-400">Requisito</TableHead>
                      <TableHead className="text-gray-400">Alvo</TableHead>
                      <TableHead className="text-gray-400">Recompensa</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Ordem</TableHead>
                      <TableHead className="text-gray-400 text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templates.map((template) => (
                      <TableRow key={template.id} className="border-gray-800">
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{template.name}</p>
                            <p className="text-xs text-gray-500 max-w-[200px] truncate">
                              {template.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getCadenceBadge(template.cadence)}</TableCell>
                        <TableCell className="text-gray-300">
                          {requirementTypeLabels[template.requirementType] || template.requirementType}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {parseFloat(template.requirementTarget).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Gift className="h-4 w-4 text-emerald-500" />
                            <span className="text-white">
                              {parseFloat(template.rewardValue).toLocaleString("pt-BR")}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {rewardTypeLabels[template.rewardType] || template.rewardType}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={template.isActive}
                            onCheckedChange={() => handleToggleStatus(template.id, template.isActive)}
                            disabled={actionLoading}
                          />
                        </TableCell>
                        <TableCell className="text-gray-300">{template.sortOrder}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditModal(template)}
                              className="hover:bg-gray-800"
                            >
                              <Edit className="h-4 w-4 text-gray-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedTemplate(template);
                                setShowDeleteModal(true);
                              }}
                              className="hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: User Missions */}
        <TabsContent value="user-missions">
          <Card className="bg-[#111111] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-500" />
                Missões de Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Buscar por email ou nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchUserMissions()}
                    className="pl-9 bg-[#1a1a1a] border-gray-700 text-white"
                  />
                </div>
                <Button
                  onClick={handleSearchUserMissions}
                  disabled={loadingUserMissions}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {loadingUserMissions ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {loadingUserMissions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
              ) : userMissionsResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Busque um usuário para ver suas missões</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {userMissionsResults.map((result) => (
                    <Card key={result.user.id} className="bg-[#1a1a1a] border-gray-700">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <span className="text-emerald-500 font-medium">
                              {result.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white">{result.user.name}</p>
                            <p className="text-sm text-gray-400">{result.user.email}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {result.missions.length === 0 ? (
                          <p className="text-gray-500 text-sm">Nenhuma missão encontrada</p>
                        ) : (
                          <div className="space-y-3">
                            {result.missions.map((mission) => (
                              <div
                                key={mission.id}
                                className="flex items-center justify-between p-3 bg-[#111111] rounded-lg border border-gray-800"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-white">{mission.name}</span>
                                    {getCadenceBadge(mission.cadence)}
                                    {getStatusBadge(mission.status)}
                                  </div>
                                  <p className="text-xs text-gray-500 mb-2">{mission.description}</p>
                                  <div className="flex items-center gap-4">
                                    <div className="flex-1 max-w-[200px]">
                                      <Progress value={mission.progressPercent} className="h-2" />
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {mission.progress.toLocaleString("pt-BR")} / {mission.target.toLocaleString("pt-BR")}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      Recompensa: {mission.rewardValue.toLocaleString("pt-BR")} {rewardTypeLabels[mission.rewardType] || mission.rewardType}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                  {mission.status === "ACTIVE" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleForceComplete(mission.id)}
                                      disabled={actionLoading}
                                      className="border-emerald-600 text-emerald-500 hover:bg-emerald-600/10"
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-1" />
                                      Completar
                                    </Button>
                                  )}
                                  {mission.completedAt && (
                                    <span className="text-xs text-gray-500">
                                      Completada: {formatDateTime(mission.completedAt)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Statistics */}
        <TabsContent value="statistics">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-[#111111] border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Hoje</p>
                      <p className="text-2xl font-bold text-white">
                        {loadingStats ? "..." : stats?.completedToday || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#111111] border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Esta Semana</p>
                      <p className="text-2xl font-bold text-white">
                        {loadingStats ? "..." : stats?.completedWeek || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#111111] border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                      <Trophy className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Este Mês</p>
                      <p className="text-2xl font-bold text-white">
                        {loadingStats ? "..." : stats?.completedMonth || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#111111] border-gray-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                      <Gift className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Recompensas (Mês)</p>
                      <p className="text-lg font-bold text-white">
                        {loadingStats ? "..." : (
                          <>
                            {formatCurrency(stats?.rewardsDistributed.cash || 0)}
                            <span className="text-xs text-gray-500 ml-1">
                              + {(stats?.rewardsDistributed.xp || 0).toLocaleString("pt-BR")} XP
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[#111111] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-emerald-500" />
                    Missões Mais Populares
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500"></div>
                    </div>
                  ) : stats?.popularMissions && stats.popularMissions.length > 0 ? (
                    <div className="space-y-3">
                      {stats.popularMissions.map((mission, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                            <div>
                              <p className="font-medium text-white">{mission.name}</p>
                              <p className="text-xs text-gray-500">
                                {mission.completedCount} completadas de {mission.totalAssigned}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            {getCadenceBadge(mission.cadence)}
                            <p className="text-sm text-emerald-500 mt-1">{mission.completionRate}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Sem dados disponíveis</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#111111] border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-500" />
                    Taxa de Conclusão por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-emerald-500"></div>
                    </div>
                  ) : stats?.completionRateByCadence && stats.completionRateByCadence.length > 0 ? (
                    <div className="space-y-4">
                      {stats.completionRateByCadence.map((item) => (
                        <div key={item.cadence} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white">
                              {cadenceLabels[item.cadence] || item.cadence}
                            </span>
                            <span className="text-emerald-500">{item.rate}%</span>
                          </div>
                          <Progress value={parseFloat(item.rate)} className="h-2" />
                          <p className="text-xs text-gray-500">
                            {item.completed} completadas de {item.total} atribuídas
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Sem dados disponíveis</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={fetchStats}
                disabled={loadingStats}
                className="border-gray-700"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? "animate-spin" : ""}`} />
                Atualizar Estatísticas
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Template Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#111111] border-gray-800 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Criar Novo Template de Missão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  placeholder="Ex: Apostador Diário"
                />
              </div>
              <div>
                <Label className="text-gray-400">Ícone</Label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  placeholder="Ex: 🎯"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-400">Descrição *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#1a1a1a] border-gray-700 text-white"
                placeholder="Faça 5 apostas hoje"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Cadência *</Label>
                <Select
                  value={formData.cadence}
                  onValueChange={(v) => setFormData({ ...formData, cadence: v })}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    <SelectItem value="DAILY">Diária</SelectItem>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="EVENT">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Tipo de Requisito *</Label>
                <Select
                  value={formData.requirementType}
                  onValueChange={(v) => setFormData({ ...formData, requirementType: v })}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    <SelectItem value="BET_COUNT">Quantidade de Apostas</SelectItem>
                    <SelectItem value="BET_AMOUNT">Valor Apostado</SelectItem>
                    <SelectItem value="WIN_COUNT">Quantidade de Vitórias</SelectItem>
                    <SelectItem value="WIN_AMOUNT">Valor Ganho</SelectItem>
                    <SelectItem value="DEPOSIT">Depósito</SelectItem>
                    <SelectItem value="CLAIM_DAILY_BOX">Caixa Diária</SelectItem>
                    <SelectItem value="PLAY_GAME">Jogar Jogo</SelectItem>
                    <SelectItem value="LEVEL_UP">Subir Nível</SelectItem>
                    <SelectItem value="LOGIN_STREAK">Login Sequencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Alvo (quantidade/valor) *</Label>
                <Input
                  type="number"
                  value={formData.requirementTarget}
                  onChange={(e) => setFormData({ ...formData, requirementTarget: parseFloat(e.target.value) || 0 })}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  min={1}
                />
              </div>
              <div>
                <Label className="text-gray-400">Tipo de Recompensa *</Label>
                <Select
                  value={formData.rewardType}
                  onValueChange={(v) => setFormData({ ...formData, rewardType: v })}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    <SelectItem value="XP">XP</SelectItem>
                    <SelectItem value="BONUS_CASH">Bônus em Dinheiro</SelectItem>
                    <SelectItem value="FREE_SPINS">Giros Grátis</SelectItem>
                    <SelectItem value="DAILY_BOX_MULTIPLIER">Multiplicador Caixa</SelectItem>
                    <SelectItem value="RAKEBACK_BOOST">Boost Rakeback</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-gray-400">Valor da Recompensa *</Label>
                <Input
                  type="number"
                  value={formData.rewardValue}
                  onChange={(e) => setFormData({ ...formData, rewardValue: parseFloat(e.target.value) || 0 })}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  min={1}
                />
              </div>
              <div>
                <Label className="text-gray-400">Nível VIP Mínimo</Label>
                <Select
                  value={formData.minVipLevel}
                  onValueChange={(v) => setFormData({ ...formData, minVipLevel: v })}
                >
                  <SelectTrigger className="bg-[#1a1a1a] border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-gray-700">
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Prata</SelectItem>
                    <SelectItem value="gold">Ouro</SelectItem>
                    <SelectItem value="platinum">Platina</SelectItem>
                    <SelectItem value="diamond">Diamante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-gray-400">Ordem de Exibição</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
              />
              <Label className="text-gray-400">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-gray-700">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateTemplate}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading ? "Criando..." : "Criar Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-[#111111] border-gray-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Editar Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-400">Nome</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-400">Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#1a1a1a] border-gray-700 text-white"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Alvo</Label>
                <Input
                  type="number"
                  value={formData.requirementTarget}
                  onChange={(e) => setFormData({ ...formData, requirementTarget: parseFloat(e.target.value) || 0 })}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-400">Valor Recompensa</Label>
                <Input
                  type="number"
                  value={formData.rewardValue}
                  onChange={(e) => setFormData({ ...formData, rewardValue: parseFloat(e.target.value) || 0 })}
                  className="bg-[#1a1a1a] border-gray-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-gray-400">Ordem de Exibição</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                className="bg-[#1a1a1a] border-gray-700 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(v) => setFormData({ ...formData, isActive: v })}
              />
              <Label className="text-gray-400">Ativo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="border-gray-700">
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateTemplate}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="bg-[#111111] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p className="text-gray-400">
            Tem certeza que deseja excluir o template <strong className="text-white">{selectedTemplate?.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="border-gray-700">
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteTemplate}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
