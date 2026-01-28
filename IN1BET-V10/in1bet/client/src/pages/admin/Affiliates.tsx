import { useEffect, useState, useCallback } from "react";
import { getStoredAuth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Users,
  RefreshCw,
  Search,
  Eye,
  Ban,
  CheckCircle,
  DollarSign,
  Link2,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

interface Affiliate {
  id: string;
  userId: string;
  name: string;
  email: string;
  cpf: string | null;
  pixKey: string | null;
  status: string;
  commissionType: string;
  cpaValue: number;
  revSharePercent: number;
  hybridCpaValue: number;
  hybridRevSharePercent: number;
  totalReferrals: number;
  totalEarnings: number;
  balance: number;
  createdAt: string;
}

interface AffiliateConversion {
  id: string;
  affiliateId: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  status: string;
  commissionType: string;
  cpaAmount: number;
  revShareAmount: number;
  totalDeposited: number;
  totalWagered: number;
  netRevenue: number;
  fraudReason: string | null;
  createdAt: string;
}

interface AffiliatePayout {
  id: string;
  affiliateId: string;
  affiliateName?: string;
  amount: number;
  status: string;
  pixKey: string;
  requestedAt: string;
  processedAt: string | null;
  processedBy: string | null;
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

function getStatusBadge(status: string) {
  const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    ACTIVE: { variant: "default", label: "Ativo" },
    PENDING: { variant: "secondary", label: "Pendente" },
    SUSPENDED: { variant: "destructive", label: "Suspenso" },
    INACTIVE: { variant: "outline", label: "Inativo" },
    QUALIFIED: { variant: "default", label: "Qualificado" },
    FRAUD: { variant: "destructive", label: "Fraude" },
    APPROVED: { variant: "default", label: "Aprovado" },
    PAID: { variant: "default", label: "Pago" },
    REJECTED: { variant: "destructive", label: "Rejeitado" },
  };
  const config = variants[status] || { variant: "secondary", label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export default function AdminAffiliates() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [conversions, setConversions] = useState<AffiliateConversion[]>([]);
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({
    userId: "",
    commissionType: "CPA",
    cpaValue: "50.00",
    revSharePercent: "30",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<{ id: string; name: string; email: string; cpf: string | null; isAffiliate: boolean }[]>([]);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const auth = getStoredAuth();

  const fetchAffiliates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/affiliate/admin", {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setAffiliates(data.affiliates || []);
      }
    } catch (error) {
      console.error("Failed to fetch affiliates:", error);
      toast.error("Erro ao carregar afiliados");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchConversions = useCallback(async () => {
    try {
      const ids = affiliates.map(a => a.id);
      if (ids.length === 0) return;
      
      const allConversions: AffiliateConversion[] = [];
      for (const affiliateId of ids.slice(0, 10)) {
        try {
          const response = await fetch(`/api/affiliate/admin/${affiliateId}`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            if (data.conversions) {
              allConversions.push(...data.conversions);
            }
          }
        } catch (e) {
          console.error("Error fetching conversions for", affiliateId, e);
        }
      }
      setConversions(allConversions);
    } catch (error) {
      console.error("Failed to fetch conversions:", error);
    }
  }, [affiliates]);

  const fetchPayouts = useCallback(async () => {
    try {
      const ids = affiliates.map(a => a.id);
      if (ids.length === 0) return;
      
      const allPayouts: AffiliatePayout[] = [];
      for (const affiliateId of ids.slice(0, 10)) {
        try {
          const response = await fetch(`/api/affiliate/admin/${affiliateId}`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            if (data.payouts) {
              allPayouts.push(...data.payouts.map((p: any) => ({
                ...p,
                affiliateName: data.affiliate?.name,
              })));
            }
          }
        } catch (e) {
          console.error("Error fetching payouts for", affiliateId, e);
        }
      }
      setPayouts(allPayouts);
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
    }
  }, [affiliates]);

  useEffect(() => {
    fetchAffiliates();
    fetchConversions();
    fetchPayouts();
  }, [fetchAffiliates, fetchConversions, fetchPayouts]);

  useEffect(() => {
    const searchUsers = async () => {
      if (userSearch.length < 2) {
        setUserSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const response = await fetch(`/api/affiliate/admin/search-users?q=${encodeURIComponent(userSearch)}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUserSearchResults(data.users || []);
        }
      } catch (error) {
        console.error("User search failed:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [userSearch]);

  const createAffiliate = async () => {
    if (!newAffiliate.userId) {
      toast.error("Selecione um usuário");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch("/api/affiliate/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: newAffiliate.userId,
          commissionType: newAffiliate.commissionType,
          cpaValue: parseFloat(newAffiliate.cpaValue),
          revSharePercent: parseFloat(newAffiliate.revSharePercent),
        }),
      });

      if (response.ok) {
        toast.success("Afiliado criado com sucesso");
        setShowCreateModal(false);
        setNewAffiliate({
          userId: "",
          commissionType: "CPA",
          cpaValue: "50.00",
          revSharePercent: "30",
        });
        fetchAffiliates();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao criar afiliado");
      }
    } catch (error) {
      console.error("Failed to create affiliate:", error);
      toast.error("Erro ao criar afiliado");
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAffiliateStatus = async (affiliateId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";

    try {
      setActionLoading(true);
      const response = await fetch(`/api/affiliate/admin/${affiliateId}/toggle-status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(newStatus === "ACTIVE" ? "Afiliado ativado" : "Afiliado suspenso");
        fetchAffiliates();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao alterar status");
      }
    } catch (error) {
      console.error("Failed to toggle affiliate status:", error);
      toast.error("Erro ao alterar status do afiliado");
    } finally {
      setActionLoading(false);
    }
  };

  const approvePayout = async (payoutId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/affiliate/admin/payouts/${payoutId}/approve`, {
        method: "POST",
        credentials: 'include',
      });

      if (response.ok) {
        toast.success("Pagamento aprovado");
        fetchPayouts();
        fetchAffiliates();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao aprovar pagamento");
      }
    } catch (error) {
      console.error("Failed to approve payout:", error);
      toast.error("Erro ao aprovar pagamento");
    } finally {
      setActionLoading(false);
    }
  };

  const rejectPayout = async (payoutId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/affiliate/admin/payouts/${payoutId}/pay`, {
        method: "POST",
        credentials: 'include',
      });

      if (response.ok) {
        toast.success("Pagamento rejeitado");
        fetchPayouts();
        fetchAffiliates();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao rejeitar pagamento");
      }
    } catch (error) {
      console.error("Failed to reject payout:", error);
      toast.error("Erro ao rejeitar pagamento");
    } finally {
      setActionLoading(false);
    }
  };

  const markConversionAsFraud = async (conversionId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/affiliate/admin/conversions/${conversionId}/fraud`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ reason: "Marcado como fraude pelo admin" }),
      });

      if (response.ok) {
        toast.success("Conversão marcada como fraude");
        fetchConversions();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao marcar fraude");
      }
    } catch (error) {
      console.error("Failed to mark fraud:", error);
      toast.error("Erro ao marcar conversão como fraude");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAffiliates = affiliates.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingPayouts = payouts.filter((p) => p.status === "PENDING");
  const fraudConversions = conversions.filter((c) => c.status === "FRAUD");

  const stats = {
    totalAffiliates: affiliates.length,
    activeAffiliates: affiliates.filter((a) => a.status === "ACTIVE").length,
    totalEarnings: affiliates.reduce((sum, a) => sum + a.totalEarnings, 0),
    pendingPayouts: pendingPayouts.reduce((sum, p) => sum + p.amount, 0),
    totalReferrals: affiliates.reduce((sum, a) => sum + a.totalReferrals, 0),
    fraudCount: fraudConversions.length,
  };

  return (
    <AdminLayout title="Gestão de Afiliados">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              Gestão de Afiliados
            </h1>
            <p className="text-muted-foreground">
              Gerencie afiliados, conversões e pagamentos
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                fetchAffiliates();
                fetchConversions();
                fetchPayouts();
              }}
              disabled={loading}
              data-testid="button-refresh"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button onClick={() => setShowCreateModal(true)} data-testid="button-create-affiliate">
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Afiliado
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card data-testid="stat-total-affiliates">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Afiliados</p>
                  <p className="text-2xl font-bold">{stats.totalAffiliates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-active-affiliates">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-2xl font-bold">{stats.activeAffiliates}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-referrals">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Referências</p>
                  <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-total-earnings">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Ganhos</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.totalEarnings)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-pending-payouts">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Pagto Pendente</p>
                  <p className="text-xl font-bold">{formatCurrency(stats.pendingPayouts)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="stat-fraud-count">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Fraudes</p>
                  <p className="text-2xl font-bold">{stats.fraudCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="affiliates" className="space-y-4">
          <TabsList>
            <TabsTrigger value="affiliates" data-testid="tab-affiliates">
              <Users className="w-4 h-4 mr-2" />
              Afiliados
            </TabsTrigger>
            <TabsTrigger value="conversions" data-testid="tab-conversions">
              <TrendingUp className="w-4 h-4 mr-2" />
              Conversões
            </TabsTrigger>
            <TabsTrigger value="payouts" data-testid="tab-payouts">
              <Receipt className="w-4 h-4 mr-2" />
              Pagamentos
              {pendingPayouts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingPayouts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="affiliates" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Lista de Afiliados</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="input-search-affiliates"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Afiliado</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Comissão</TableHead>
                        <TableHead className="text-right">Referências</TableHead>
                        <TableHead className="text-right">Ganhos</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                          </TableCell>
                        </TableRow>
                      ) : filteredAffiliates.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Nenhum afiliado encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAffiliates.map((affiliate) => (
                          <TableRow key={affiliate.id} data-testid={`row-affiliate-${affiliate.id}`}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{affiliate.name}</p>
                                <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{affiliate.commissionType}</Badge>
                            </TableCell>
                            <TableCell>
                              {affiliate.commissionType === "CPA" && formatCurrency(affiliate.cpaValue)}
                              {affiliate.commissionType === "REV_SHARE" && `${affiliate.revSharePercent}%`}
                              {affiliate.commissionType === "HYBRID" && (
                                <span>
                                  {formatCurrency(affiliate.hybridCpaValue)} + {affiliate.hybridRevSharePercent}%
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">{affiliate.totalReferrals}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(affiliate.totalEarnings)}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(affiliate.balance)}</TableCell>
                            <TableCell>{getStatusBadge(affiliate.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setSelectedAffiliate(affiliate);
                                    setShowDetailModal(true);
                                  }}
                                  data-testid={`button-view-${affiliate.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => toggleAffiliateStatus(affiliate.id, affiliate.status)}
                                  disabled={actionLoading}
                                  data-testid={`button-toggle-${affiliate.id}`}
                                >
                                  {affiliate.status === "ACTIVE" ? (
                                    <Ban className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conversions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Conversões</CardTitle>
                <CardDescription>Todas as conversões de afiliados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">CPA</TableHead>
                        <TableHead className="text-right">RevShare</TableHead>
                        <TableHead className="text-right">Depósitos</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            Nenhuma conversão encontrada
                          </TableCell>
                        </TableRow>
                      ) : (
                        conversions.slice(0, 50).map((conversion) => (
                          <TableRow
                            key={conversion.id}
                            className={conversion.status === "FRAUD" ? "bg-red-50 dark:bg-red-950/20" : ""}
                            data-testid={`row-conversion-${conversion.id}`}
                          >
                            <TableCell className="text-sm">{formatDate(conversion.createdAt)}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{conversion.userName || "—"}</p>
                                <p className="text-sm text-muted-foreground">{conversion.userEmail || "—"}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{conversion.commissionType}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(conversion.cpaAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(conversion.revShareAmount)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(conversion.totalDeposited)}</TableCell>
                            <TableCell>
                              {getStatusBadge(conversion.status)}
                              {conversion.fraudReason && (
                                <p className="text-xs text-red-500 mt-1">{conversion.fraudReason}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              {conversion.status !== "FRAUD" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => markConversionAsFraud(conversion.id)}
                                  disabled={actionLoading}
                                  data-testid={`button-fraud-${conversion.id}`}
                                >
                                  <AlertTriangle className="w-4 h-4 text-red-500" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Solicitações de Pagamento</CardTitle>
                <CardDescription>Gerencie os pagamentos dos afiliados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Afiliado</TableHead>
                        <TableHead>Chave PIX</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhuma solicitação de pagamento
                          </TableCell>
                        </TableRow>
                      ) : (
                        payouts.map((payout) => (
                          <TableRow key={payout.id} data-testid={`row-payout-${payout.id}`}>
                            <TableCell className="text-sm">{formatDate(payout.requestedAt)}</TableCell>
                            <TableCell className="font-medium">{payout.affiliateName || payout.affiliateId}</TableCell>
                            <TableCell className="font-mono text-sm">{payout.pixKey}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(payout.amount)}</TableCell>
                            <TableCell>{getStatusBadge(payout.status)}</TableCell>
                            <TableCell>
                              {payout.status === "PENDING" && (
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => approvePayout(payout.id)}
                                    disabled={actionLoading}
                                    data-testid={`button-approve-payout-${payout.id}`}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => rejectPayout(payout.id)}
                                    disabled={actionLoading}
                                    data-testid={`button-reject-payout-${payout.id}`}
                                  >
                                    <Ban className="w-4 h-4 mr-1" />
                                    Rejeitar
                                  </Button>
                                </div>
                              )}
                              {payout.status === "APPROVED" && (
                                <span className="text-sm text-muted-foreground">
                                  Aguardando PIX
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showCreateModal} onOpenChange={(open) => {
          setShowCreateModal(open);
          if (!open) {
            setUserSearch("");
            setUserSearchResults([]);
            setSelectedUser(null);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Afiliado</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Buscar Usuário</Label>
                {selectedUser ? (
                  <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border">
                    <div>
                      <p className="font-medium">{selectedUser.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedUser(null);
                        setNewAffiliate({ ...newAffiliate, userId: "" });
                        setUserSearch("");
                      }}
                    >
                      Alterar
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="Digite nome, email ou CPF..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      data-testid="input-user-search"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-2.5">
                        <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {userSearchResults.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-popover border rounded-lg shadow-lg max-h-60 overflow-auto">
                        {userSearchResults.map((user) => (
                          <button
                            key={user.id}
                            className={`w-full px-4 py-3 text-left hover:bg-secondary flex items-center justify-between ${user.isAffiliate ? 'opacity-50' : ''}`}
                            onClick={() => {
                              if (!user.isAffiliate) {
                                setSelectedUser({ id: user.id, name: user.name, email: user.email });
                                setNewAffiliate({ ...newAffiliate, userId: user.id });
                                setUserSearchResults([]);
                                setUserSearch("");
                              }
                            }}
                            disabled={user.isAffiliate}
                          >
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                            {user.isAffiliate && (
                              <Badge variant="secondary">Já é afiliado</Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Tipo de Comissão</Label>
                <Select
                  value={newAffiliate.commissionType}
                  onValueChange={(value) => setNewAffiliate({ ...newAffiliate, commissionType: value })}
                >
                  <SelectTrigger data-testid="select-commission-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CPA">CPA (Custo por Aquisição)</SelectItem>
                    <SelectItem value="REV_SHARE">Revenue Share</SelectItem>
                    <SelectItem value="HYBRID">Híbrido (CPA + RevShare)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(newAffiliate.commissionType === "CPA" || newAffiliate.commissionType === "HYBRID") && (
                <div className="space-y-2">
                  <Label>Valor CPA (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newAffiliate.cpaValue}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, cpaValue: e.target.value })}
                    data-testid="input-cpa-value"
                  />
                </div>
              )}
              {(newAffiliate.commissionType === "REV_SHARE" || newAffiliate.commissionType === "HYBRID") && (
                <div className="space-y-2">
                  <Label>Revenue Share (%)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={newAffiliate.revSharePercent}
                    onChange={(e) => setNewAffiliate({ ...newAffiliate, revSharePercent: e.target.value })}
                    data-testid="input-revshare-percent"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancelar
              </Button>
              <Button onClick={createAffiliate} disabled={actionLoading} data-testid="button-confirm-create">
                Criar Afiliado
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Afiliado</DialogTitle>
            </DialogHeader>
            {selectedAffiliate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-medium">{selectedAffiliate.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{selectedAffiliate.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium">{selectedAffiliate.cpf || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Chave PIX</p>
                    <p className="font-medium font-mono">{selectedAffiliate.pixKey || "—"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo de Comissão</p>
                    <p className="font-medium">{selectedAffiliate.commissionType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    {getStatusBadge(selectedAffiliate.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Referências</p>
                    <p className="font-medium">{selectedAffiliate.totalReferrals}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Ganho</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(selectedAffiliate.totalEarnings)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                    <p className="font-medium">{formatCurrency(selectedAffiliate.balance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cadastrado em</p>
                    <p className="font-medium">{formatDate(selectedAffiliate.createdAt)}</p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
