import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { 
    Users, 
    Copy, 
    TrendingUp, 
    DollarSign, 
    MousePointerClick, 
    UserPlus, 
    ArrowUpRight, 
    Share2, 
    BarChart3, 
    Target,
    Wallet,
    Plus,
    Link2,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2,
    Receipt,
    ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import affiliateHeader from "@assets/generated_images/affiliate_dashboard_header_with_3d_coins_and_network_connections.png";

interface AffiliateData {
  affiliate: {
    id: string;
    name: string;
    email: string;
    status: string;
    commissionType: string;
    cpaValue: number;
    revsharePercentage: number;
  };
  stats: {
    totalReferrals: number;
    qualifiedReferrals: number;
    pendingBalance: number;
    paidBalance: number;
    totalEarnings: number;
    conversionRate: number;
  };
  links: {
    id: string;
    code: string;
    name: string | null;
    url: string;
    clicks: number;
    registrations: number;
    conversions: number;
    isActive: boolean;
  }[];
  recentConversions: {
    id: string;
    userId: string;
    status: string;
    depositAmount: string;
    wagerAmount: string;
    commissionValue: string;
    createdAt: string;
    user: { name: string; email: string };
  }[];
  recentPayouts: {
    id: string;
    amount: string;
    status: string;
    pixKey: string;
    createdAt: string;
    paidAt: string | null;
  }[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getStatusBadge(status: string) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; icon: any }> = {
    PENDING: { variant: "secondary", label: "Pendente", icon: Clock },
    APPROVED: { variant: "default", label: "Aprovado", icon: CheckCircle },
    PAID: { variant: "default", label: "Pago", icon: CheckCircle },
    CANCELLED: { variant: "outline", label: "Cancelado", icon: XCircle },
    FRAUD: { variant: "destructive", label: "Fraude", icon: AlertTriangle },
    REJECTED: { variant: "destructive", label: "Rejeitado", icon: XCircle },
  };
  const c = config[status] || { variant: "secondary", label: status, icon: Clock };
  return (
    <Badge variant={c.variant} className="gap-1">
      <c.icon className="w-3 h-3" />
      {c.label}
    </Badge>
  );
}

export default function Affiliates() {
  const queryClient = useQueryClient();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCreateLinkModal, setShowCreateLinkModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("CPF");
  const [newLinkName, setNewLinkName] = useState("");
  const [newLinkCode, setNewLinkCode] = useState("");

  const { data, isLoading, error } = useQuery<AffiliateData>({
    queryKey: ["/api/affiliate/dashboard"],
    retry: false,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (payload: { amount: number; pixKey: string; pixKeyType: string }) => {
      return await apiRequest("POST", "/api/affiliate/payouts/request", payload);
    },
    onSuccess: () => {
      toast.success("Solicitação de saque enviada!");
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      setPixKey("");
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao solicitar saque");
    },
  });

  const createLinkMutation = useMutation({
    mutationFn: async (payload: { name?: string; code?: string }) => {
      return await apiRequest("POST", "/api/affiliate/links", payload);
    },
    onSuccess: () => {
      toast.success("Link criado com sucesso!");
      setShowCreateLinkModal(false);
      setNewLinkName("");
      setNewLinkCode("");
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao criar link");
    },
  });

  const becomeAffiliateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/affiliate/become", {});
    },
    onSuccess: () => {
      toast.success("Parabéns! Você agora é um afiliado!");
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao se tornar afiliado");
    },
  });

  const copyLink = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copiado!");
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 50) {
      toast.error("Valor mínimo para saque é R$ 50,00");
      return;
    }
    if (!pixKey.trim()) {
      toast.error("Informe a chave PIX");
      return;
    }
    withdrawMutation.mutate({ amount, pixKey, pixKeyType });
  };

  const handleCreateLink = () => {
    createLinkMutation.mutate({ 
      name: newLinkName || undefined, 
      code: newLinkCode || undefined 
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <div className="relative h-64 rounded-2xl overflow-hidden mb-8 border border-white/10 shadow-2xl">
            <img src={affiliateHeader} alt="Affiliate" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center p-8">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary px-3 py-1 rounded-full text-xs font-bold w-fit mb-4 backdrop-blur-sm">
                <Users className="w-3 h-3" />
                PROGRAMA DE PARCEIROS
              </div>
              <h1 className="text-4xl font-heading font-bold text-white mb-4">
                Ganhe dinheiro indicando amigos!
              </h1>
              <p className="text-gray-300 text-lg mb-6 max-w-lg">
                Torne-se um afiliado e receba comissões sobre todas as apostas dos seus indicados.
              </p>
            </div>
          </div>
          <Card className="bg-card border-white/10 p-8">
            <CardContent className="space-y-6 pt-6">
              <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                <h3 className="text-xl font-bold text-white mb-2">Você ainda não é um afiliado</h3>
                <p className="text-muted-foreground mb-4">
                  Clique no botão abaixo para se tornar um parceiro e começar a ganhar comissões hoje mesmo!
                </p>
                <Button 
                  className="bg-primary hover:bg-primary/90 font-bold"
                  onClick={() => becomeAffiliateMutation.mutate()}
                  disabled={becomeAffiliateMutation.isPending}
                  data-testid="button-become-affiliate"
                >
                  {becomeAffiliateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  Quero ser Afiliado
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-secondary/20 rounded-xl">
                  <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-bold text-white">Até R$ 50</p>
                  <p className="text-xs text-muted-foreground">por indicação</p>
                </div>
                <div className="p-4 bg-secondary/20 rounded-xl">
                  <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-bold text-white">30%</p>
                  <p className="text-xs text-muted-foreground">RevShare vitalício</p>
                </div>
                <div className="p-4 bg-secondary/20 rounded-xl">
                  <Wallet className="w-8 h-8 text-primary mx-auto mb-2" />
                  <p className="font-bold text-white">PIX</p>
                  <p className="text-xs text-muted-foreground">Saque rápido</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { affiliate, stats, links, recentConversions, recentPayouts } = data;
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);

  return (
    <MainLayout>
      <div className="relative h-64 rounded-2xl overflow-hidden mb-8 border border-white/10 shadow-2xl">
        <img src={affiliateHeader} alt="Affiliate Dashboard" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center p-8 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary px-3 py-1 rounded-full text-xs font-bold w-fit mb-4 backdrop-blur-sm">
            <Users className="w-3 h-3" />
            PROGRAMA DE PARCEIROS
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4 leading-tight">
            Olá, {affiliate.name.split(" ")[0]}! <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-400">
              {affiliate.commissionType === "CPA" && `R$ ${affiliate.cpaValue.toFixed(0)} por indicação`}
              {affiliate.commissionType === "REVSHARE" && `${affiliate.revsharePercentage}% RevShare`}
              {affiliate.commissionType === "HYBRID" && `R$ ${affiliate.cpaValue.toFixed(0)} + ${affiliate.revsharePercentage}%`}
            </span>
          </h1>
          <p className="text-gray-300 text-lg max-w-lg">
            Acompanhe suas indicações e comissões em tempo real.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              {stats.totalEarnings > 0 && (
                <span className="text-xs font-bold text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm mb-1">Ganhos Totais</p>
            <h3 className="text-2xl font-bold text-white" data-testid="text-total-earnings">
              {formatCurrency(stats.totalEarnings)}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">
                {stats.conversionRate.toFixed(1)}% conv.
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-1">Total de Indicados</p>
            <h3 className="text-2xl font-bold text-white" data-testid="text-total-referrals">
              {stats.totalReferrals}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                <MousePointerClick className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <p className="text-muted-foreground text-sm mb-1">Cliques nos Links</p>
            <h3 className="text-2xl font-bold text-white" data-testid="text-total-clicks">
              {totalClicks}
            </h3>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <Button 
                size="sm" 
                className="h-7 text-xs font-bold bg-primary hover:bg-primary/90"
                onClick={() => setShowWithdrawModal(true)}
                disabled={stats.pendingBalance < 50}
                data-testid="button-withdraw"
              >
                Sacar
              </Button>
            </div>
            <p className="text-muted-foreground text-sm mb-1">Disponível para Saque</p>
            <h3 className="text-2xl font-bold text-white" data-testid="text-available-balance">
              {formatCurrency(stats.pendingBalance)}
            </h3>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="links" className="space-y-6">
        <TabsList className="bg-secondary/30">
          <TabsTrigger value="links" className="gap-2">
            <Link2 className="w-4 h-4" />
            Meus Links
          </TabsTrigger>
          <TabsTrigger value="conversions" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Conversões
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <Receipt className="w-4 h-4" />
            Pagamentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="links" className="space-y-4">
          <Card className="bg-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Links de Indicação
                </CardTitle>
                <CardDescription>Compartilhe seus links para ganhar comissões</CardDescription>
              </div>
              <Button onClick={() => setShowCreateLinkModal(true)} className="gap-2" data-testid="button-create-link">
                <Plus className="w-4 h-4" />
                Novo Link
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {links.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Você ainda não tem links de indicação.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setShowCreateLinkModal(true)}>
                    Criar primeiro link
                  </Button>
                </div>
              ) : (
                links.map((link) => (
                  <div 
                    key={link.id} 
                    className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                    data-testid={`link-item-${link.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-white">{link.name || link.code}</p>
                        {!link.isActive && <Badge variant="outline">Inativo</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs text-muted-foreground bg-black/20 px-2 py-1 rounded">
                          {window.location.origin}/ref/{link.code}
                        </code>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6"
                          onClick={() => copyLink(`/ref/${link.code}`)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-6 text-center">
                      <div>
                        <p className="text-lg font-bold text-white">{link.clicks}</p>
                        <p className="text-[10px] text-muted-foreground">Cliques</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-white">{link.registrations}</p>
                        <p className="text-[10px] text-muted-foreground">Cadastros</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-500">{link.conversions}</p>
                        <p className="text-[10px] text-muted-foreground">Conversões</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversions" className="space-y-4">
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Histórico de Conversões
              </CardTitle>
              <CardDescription>Acompanhe o status das suas indicações</CardDescription>
            </CardHeader>
            <CardContent>
              {recentConversions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma conversão registrada ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentConversions.map((conv) => (
                    <div 
                      key={conv.id} 
                      className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-white/5"
                      data-testid={`conversion-item-${conv.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                          {conv.user?.name?.substring(0, 2).toUpperCase() || "??"}
                        </div>
                        <div>
                          <p className="font-bold text-white">{conv.user?.name || "Usuário"}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(conv.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Depósitos</p>
                          <p className="font-bold text-white">{formatCurrency(parseFloat(conv.depositAmount))}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Comissão</p>
                          <p className="font-bold text-green-500">{formatCurrency(parseFloat(conv.commissionValue))}</p>
                        </div>
                        {getStatusBadge(conv.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Histórico de Pagamentos
              </CardTitle>
              <CardDescription>Seus saques solicitados e pagos</CardDescription>
            </CardHeader>
            <CardContent>
              {recentPayouts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum pagamento solicitado ainda.</p>
                  {stats.pendingBalance >= 50 && (
                    <Button variant="outline" className="mt-4" onClick={() => setShowWithdrawModal(true)}>
                      Solicitar primeiro saque
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPayouts.map((payout) => (
                    <div 
                      key={payout.id} 
                      className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-white/5"
                      data-testid={`payout-item-${payout.id}`}
                    >
                      <div>
                        <p className="font-bold text-white">{formatCurrency(parseFloat(payout.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          Solicitado em {formatDate(payout.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Chave PIX</p>
                          <p className="text-sm text-white">{payout.pixKey.substring(0, 15)}...</p>
                        </div>
                        {getStatusBadge(payout.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Solicitar Saque
            </DialogTitle>
            <DialogDescription>
              Saldo disponível: {formatCurrency(stats.pendingBalance)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Valor do Saque</Label>
              <Input
                type="number"
                placeholder="Mínimo R$ 50,00"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-secondary/30 border-white/10"
                data-testid="input-withdraw-amount"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Chave PIX</Label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger className="bg-secondary/30 border-white/10" data-testid="select-pix-key-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="PHONE">Telefone</SelectItem>
                  <SelectItem value="RANDOM">Chave Aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chave PIX</Label>
              <Input
                placeholder="Digite sua chave PIX"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="bg-secondary/30 border-white/10"
                data-testid="input-pix-key"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleWithdraw} 
              disabled={withdrawMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-confirm-withdraw"
            >
              {withdrawMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Solicitar Saque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateLinkModal} onOpenChange={setShowCreateLinkModal}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Criar Novo Link
            </DialogTitle>
            <DialogDescription>
              Crie um link personalizado para rastrear suas campanhas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Campanha (opcional)</Label>
              <Input
                placeholder="Ex: Instagram Stories"
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                className="bg-secondary/30 border-white/10"
                data-testid="input-link-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Código Personalizado (opcional)</Label>
              <Input
                placeholder="Ex: MEUCOD1GO"
                value={newLinkCode}
                onChange={(e) => setNewLinkCode(e.target.value.toUpperCase())}
                className="bg-secondary/30 border-white/10"
                data-testid="input-link-code"
              />
              <p className="text-xs text-muted-foreground">
                Deixe vazio para gerar automaticamente
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateLinkModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateLink} 
              disabled={createLinkMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-confirm-create-link"
            >
              {createLinkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
