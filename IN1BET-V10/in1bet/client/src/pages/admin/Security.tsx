import { useState, useCallback, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  FileText,
  User,
  AlertTriangle,
  Loader2,
  ZoomIn,
} from "lucide-react";
import { getStoredAuth } from "@/lib/auth";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KycVerification {
  id: string;
  userId: string;
  cpf: string;
  documentType: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
    cpf: string;
    phone?: string;
    createdAt: string;
    isBlocked: boolean;
  };
  stats?: {
    totalDeposits: number;
    totalWithdrawals: number;
    activeBonuses: number;
  };
}

interface SecurityLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  userId?: string;
  reason?: string;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
  };
}

interface KycStats {
  pending: number;
  approved: number;
  rejected: number;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export default function AdminSecurity() {
  const [activeTab, setActiveTab] = useState("pending");
  const [stats, setStats] = useState<KycStats | null>(null);
  const [pendingKyc, setPendingKyc] = useState<KycVerification[]>([]);
  const [approvedKyc, setApprovedKyc] = useState<KycVerification[]>([]);
  const [rejectedKyc, setRejectedKyc] = useState<KycVerification[]>([]);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKyc, setSelectedKyc] = useState<KycVerification | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const auth = getStoredAuth();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [statsRes, pendingRes, approvedRes, rejectedRes, logsRes] = await Promise.all([
        fetch("/api/admin/security/stats", { credentials: "include" }),
        fetch("/api/admin/security/kyc/pending", { credentials: "include" }),
        fetch("/api/admin/security/kyc/approved", { credentials: "include" }),
        fetch("/api/admin/security/kyc/rejected", { credentials: "include" }),
        fetch("/api/admin/security/logs", { credentials: "include" }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingKyc(data.verifications || []);
      }
      if (approvedRes.ok) {
        const data = await approvedRes.json();
        setApprovedKyc(data.verifications || []);
      }
      if (rejectedRes.ok) {
        const data = await rejectedRes.json();
        setRejectedKyc(data.verifications || []);
      }
      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching security data:", error);
      toast.error("Erro ao carregar dados de segurança");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (kycId: string) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/security/kyc/${kycId}/approve`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("KYC aprovado com sucesso!");
        setSelectedKyc(null);
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao aprovar KYC");
      }
    } catch (error) {
      toast.error("Erro ao aprovar KYC");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKyc || !rejectionReason.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/security/kyc/${selectedKyc.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (response.ok) {
        toast.success("KYC rejeitado");
        setSelectedKyc(null);
        setShowRejectDialog(false);
        setRejectionReason("");
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao rejeitar KYC");
      }
    } catch (error) {
      toast.error("Erro ao rejeitar KYC");
    } finally {
      setActionLoading(false);
    }
  };

  const filterKyc = (list: KycVerification[]) => {
    if (!searchTerm) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (k) =>
        k.user.name.toLowerCase().includes(term) ||
        k.user.email.toLowerCase().includes(term) ||
        k.cpf.includes(term)
    );
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      KYC_APPROVE: "KYC Aprovado",
      KYC_REJECT: "KYC Rejeitado",
      KYC_SUBMIT: "KYC Submetido",
      FRAUD_FLAG: "Flag Antifraude",
      FRAUD_CLEAR: "Flag Removida",
    };
    return labels[action] || action;
  };

  if (loading) {
    return (
      <AdminLayout title="Segurança">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Segurança">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-yellow-500/10 border-yellow-500/20" data-testid="card-pending">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-yellow-500/20">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-yellow-400/80">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats?.pending || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-500/10 border-green-500/20" data-testid="card-approved">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-green-400/80">Aprovados</p>
                  <p className="text-2xl font-bold text-green-400">{stats?.approved || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-500/10 border-red-500/20" data-testid="card-rejected">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-red-500/20">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-red-400/80">Rejeitados</p>
                  <p className="text-2xl font-bold text-red-400">{stats?.rejected || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800/50 border border-gray-700">
            <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400" data-testid="tab-pending">
              <Clock className="w-4 h-4 mr-2" />
              Pendentes ({stats?.pending || 0})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400" data-testid="tab-approved">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Aprovados
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400" data-testid="tab-rejected">
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitados
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400" data-testid="tab-logs">
              <FileText className="w-4 h-4 mr-2" />
              Logs de Segurança
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, email ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700"
                data-testid="input-search"
              />
            </div>
          </div>

          <TabsContent value="pending" className="mt-0">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-yellow-500" />
                  KYC Pendentes
                </CardTitle>
                <CardDescription>Verificações aguardando análise da equipe de segurança</CardDescription>
              </CardHeader>
              <CardContent>
                {filterKyc(pendingKyc).length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma verificação pendente</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">Usuário</TableHead>
                        <TableHead className="text-gray-400">CPF</TableHead>
                        <TableHead className="text-gray-400">Documento</TableHead>
                        <TableHead className="text-gray-400">Data</TableHead>
                        <TableHead className="text-gray-400">Perfil</TableHead>
                        <TableHead className="text-gray-400 text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterKyc(pendingKyc).map((kyc) => (
                        <TableRow key={kyc.id} className="border-gray-800" data-testid={`row-kyc-${kyc.id}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{kyc.user.name}</p>
                              <p className="text-sm text-gray-400">{kyc.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{kyc.cpf}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                              {kyc.documentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">{formatDate(kyc.createdAt)}</TableCell>
                          <TableCell>
                            <div className="text-xs text-gray-400">
                              <p>Dep: {formatCurrency(kyc.stats?.totalDeposits || 0)}</p>
                              <p>Saq: {formatCurrency(kyc.stats?.totalWithdrawals || 0)}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedKyc(kyc)}
                              className="border-gray-700 hover:bg-gray-800"
                              data-testid={`button-view-${kyc.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Analisar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="approved" className="mt-0">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  KYC Aprovados
                </CardTitle>
                <CardDescription>Histórico de verificações aprovadas</CardDescription>
              </CardHeader>
              <CardContent>
                {filterKyc(approvedKyc).length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>Nenhuma verificação aprovada encontrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">Usuário</TableHead>
                        <TableHead className="text-gray-400">CPF</TableHead>
                        <TableHead className="text-gray-400">Documento</TableHead>
                        <TableHead className="text-gray-400">Aprovado em</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterKyc(approvedKyc).map((kyc) => (
                        <TableRow key={kyc.id} className="border-gray-800">
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{kyc.user.name}</p>
                              <p className="text-sm text-gray-400">{kyc.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{kyc.cpf}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                              {kyc.documentType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {kyc.reviewedAt ? formatDate(kyc.reviewedAt) : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Aprovado
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rejected" className="mt-0">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  KYC Rejeitados
                </CardTitle>
                <CardDescription>Histórico de verificações rejeitadas</CardDescription>
              </CardHeader>
              <CardContent>
                {filterKyc(rejectedKyc).length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>Nenhuma verificação rejeitada encontrada</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">Usuário</TableHead>
                        <TableHead className="text-gray-400">CPF</TableHead>
                        <TableHead className="text-gray-400">Rejeitado em</TableHead>
                        <TableHead className="text-gray-400">Motivo</TableHead>
                        <TableHead className="text-gray-400">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterKyc(rejectedKyc).map((kyc) => (
                        <TableRow key={kyc.id} className="border-gray-800">
                          <TableCell>
                            <div>
                              <p className="font-medium text-white">{kyc.user.name}</p>
                              <p className="text-sm text-gray-400">{kyc.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">{kyc.cpf}</TableCell>
                          <TableCell className="text-gray-300">
                            {kyc.reviewedAt ? formatDate(kyc.reviewedAt) : "-"}
                          </TableCell>
                          <TableCell className="text-red-400 max-w-[200px] truncate">
                            {kyc.rejectionReason}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                              Rejeitado
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-0">
            <Card className="bg-gray-900/50 border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Logs de Segurança
                </CardTitle>
                <CardDescription>Histórico de ações da equipe de segurança</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>Nenhum log de segurança encontrado</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-transparent">
                        <TableHead className="text-gray-400">Data/Hora</TableHead>
                        <TableHead className="text-gray-400">Ação</TableHead>
                        <TableHead className="text-gray-400">Admin</TableHead>
                        <TableHead className="text-gray-400">Alvo</TableHead>
                        <TableHead className="text-gray-400">Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} className="border-gray-800">
                          <TableCell className="text-gray-300">{formatDate(log.createdAt)}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                log.action.includes("APPROVE")
                                  ? "bg-green-500/20 text-green-400"
                                  : log.action.includes("REJECT")
                                  ? "bg-red-500/20 text-red-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }
                            >
                              {getActionLabel(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">{log.admin.name}</TableCell>
                          <TableCell className="text-gray-400 text-xs font-mono">
                            {log.targetType}: {log.targetId.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="text-gray-400 max-w-[200px] truncate">
                            {log.reason || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedKyc} onOpenChange={(open) => !open && setSelectedKyc(null)}>
        <DialogContent className="max-w-4xl bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-500" />
              Análise de KYC
            </DialogTitle>
            <DialogDescription>
              Verifique os documentos e aprove ou rejeite a verificação
            </DialogDescription>
          </DialogHeader>

          {selectedKyc && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Informações do Usuário</h4>
                  <div className="space-y-2">
                    <p className="text-white font-medium">{selectedKyc.user.name}</p>
                    <p className="text-gray-300 text-sm">{selectedKyc.user.email}</p>
                    <p className="text-gray-300 text-sm">CPF: {selectedKyc.cpf}</p>
                    <p className="text-gray-400 text-xs">
                      Cadastro: {formatDate(selectedKyc.user.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Histórico Financeiro</h4>
                  <div className="space-y-2">
                    <p className="text-green-400">
                      Depósitos: {formatCurrency(selectedKyc.stats?.totalDeposits || 0)}
                    </p>
                    <p className="text-red-400">
                      Saques: {formatCurrency(selectedKyc.stats?.totalWithdrawals || 0)}
                    </p>
                    <p className="text-blue-400">
                      Bônus Ativos: {selectedKyc.stats?.activeBonuses || 0}
                    </p>
                    {selectedKyc.user.isBlocked && (
                      <Badge className="bg-red-500/20 text-red-400">Conta Bloqueada</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Documentos Enviados</h4>
                <div className="grid grid-cols-3 gap-4">
                  {selectedKyc.documentFrontUrl && (
                    <div
                      className="relative aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setViewingImage(selectedKyc.documentFrontUrl!)}
                      data-testid="image-document-front"
                    >
                      <img
                        src={selectedKyc.documentFrontUrl}
                        alt="Frente do documento"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                      <span className="absolute bottom-2 left-2 text-xs bg-black/70 px-2 py-1 rounded text-white">
                        Frente
                      </span>
                    </div>
                  )}
                  {selectedKyc.documentBackUrl && (
                    <div
                      className="relative aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setViewingImage(selectedKyc.documentBackUrl!)}
                      data-testid="image-document-back"
                    >
                      <img
                        src={selectedKyc.documentBackUrl}
                        alt="Verso do documento"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                      <span className="absolute bottom-2 left-2 text-xs bg-black/70 px-2 py-1 rounded text-white">
                        Verso
                      </span>
                    </div>
                  )}
                  {selectedKyc.selfieUrl && (
                    <div
                      className="relative aspect-[4/3] bg-gray-800 rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => setViewingImage(selectedKyc.selfieUrl!)}
                      data-testid="image-selfie"
                    >
                      <img
                        src={selectedKyc.selfieUrl}
                        alt="Selfie"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ZoomIn className="w-8 h-8 text-white" />
                      </div>
                      <span className="absolute bottom-2 left-2 text-xs bg-black/70 px-2 py-1 rounded text-white">
                        Selfie
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedKyc.status === "PENDING" && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-400">Verificação Pendente</h4>
                      <p className="text-sm text-yellow-400/80 mt-1">
                        Analise cuidadosamente os documentos antes de tomar uma decisão. Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedKyc(null)}
              className="border-gray-700"
              data-testid="button-close-modal"
            >
              Fechar
            </Button>
            {selectedKyc?.status === "PENDING" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                  disabled={actionLoading}
                  data-testid="button-reject"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(selectedKyc.id)}
                  disabled={actionLoading}
                  data-testid="button-approve"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Aprovar KYC
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <XCircle className="w-5 h-5" />
              Rejeitar Verificação
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição. O usuário poderá enviar novos documentos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Motivo da rejeição..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="bg-gray-800 border-gray-700 min-h-[100px]"
              data-testid="input-rejection-reason"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              className="border-gray-700"
              data-testid="button-cancel-reject"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              data-testid="button-confirm-reject"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
        <DialogContent className="max-w-5xl bg-gray-900 border-gray-800 p-2">
          {viewingImage && (
            <img
              src={viewingImage}
              alt="Documento"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
