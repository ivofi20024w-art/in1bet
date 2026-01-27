import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DollarSign, 
  MousePointerClick, 
  UserPlus, 
  ArrowUpRight, 
  Wallet,
  Plus,
  Link2,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Zap,
  Percent,
  Activity,
  ChevronRight,
  HandCoins,
  TrendingUp,
  CreditCard,
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";

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

const COMMISSION_TIERS = [
  { level: 1, name: "Iniciante", minReferrals: 0, cpa: 30, revshare: 20 },
  { level: 2, name: "Bronze", minReferrals: 10, cpa: 40, revshare: 25 },
  { level: 3, name: "Prata", minReferrals: 50, cpa: 50, revshare: 30 },
  { level: 4, name: "Ouro", minReferrals: 150, cpa: 65, revshare: 35 },
  { level: 5, name: "Diamante", minReferrals: 500, cpa: 80, revshare: 40 },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function getStatusConfig(status: string) {
  const config: Record<string, { color: string; bg: string; label: string; icon: any }> = {
    PENDING: { color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20", label: "Pendente", icon: Clock },
    APPROVED: { color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20", label: "Aprovado", icon: CheckCircle },
    QUALIFIED: { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", label: "Qualificado", icon: CheckCircle },
    PAID: { color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20", label: "Pago", icon: CheckCircle },
    CANCELLED: { color: "text-zinc-400", bg: "bg-zinc-400/10 border-zinc-400/20", label: "Cancelado", icon: XCircle },
    FRAUD: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", label: "Fraude", icon: AlertTriangle },
    REJECTED: { color: "text-red-400", bg: "bg-red-400/10 border-red-400/20", label: "Rejeitado", icon: XCircle },
  };
  return config[status] || { color: "text-zinc-400", bg: "bg-zinc-400/10 border-zinc-400/20", label: status, icon: Clock };
}

function StatCard({ icon: Icon, label, value, subValue, trend, accent = false }: { 
  icon: any; 
  label: string; 
  value: string | number; 
  subValue?: string;
  trend?: number;
  accent?: boolean;
}) {
  return (
    <div className={`relative p-5 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
      accent 
        ? "bg-gradient-to-br from-[#FF7A1A]/10 via-[#FF7A1A]/5 to-transparent border-[#FF7A1A]/30" 
        : "bg-[#151518] border-white/5 hover:border-white/10"
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${accent ? "bg-[#FF7A1A]/20" : "bg-white/5"}`}>
          <Icon className={`w-4 h-4 ${accent ? "text-[#FF7A1A]" : "text-zinc-400"}`} />
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
            <ArrowUpRight className={`w-3 h-3 ${trend < 0 ? "rotate-90" : ""}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-[#FF7A1A]" : "text-white"}`}>{value}</p>
      {subValue && <p className="text-xs text-zinc-500 mt-1">{subValue}</p>}
    </div>
  );
}

function LinkRow({ link, onCopy }: { link: AffiliateData['links'][0]; onCopy: (code: string) => void }) {
  const fullUrl = `${window.location.origin}/ref/${link.code}`;
  const convRate = link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : "0";
  
  return (
    <div className="group p-4 bg-[#151518] rounded-xl border border-white/5 hover:border-[#FF7A1A]/30 transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">{link.name || link.code}</span>
            {!link.isActive && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">Inativo</span>
            )}
          </div>
          <code className="text-xs text-zinc-500 block truncate">{fullUrl}</code>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-center hidden sm:block">
            <p className="text-sm font-bold text-white">{link.clicks}</p>
            <p className="text-[10px] text-zinc-500">Cliques</p>
          </div>
          <div className="text-center hidden sm:block">
            <p className="text-sm font-bold text-white">{link.registrations}</p>
            <p className="text-[10px] text-zinc-500">Cadastros</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-emerald-400">{link.conversions}</p>
            <p className="text-[10px] text-zinc-500">Conversões</p>
          </div>
          <div className="text-center hidden md:block">
            <p className="text-sm font-bold text-[#FF7A1A]">{convRate}%</p>
            <p className="text-[10px] text-zinc-500">Taxa</p>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 hover:bg-[#FF7A1A]/10 hover:text-[#FF7A1A]"
            onClick={() => onCopy(link.code)}
          >
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function ConversionRow({ conversion }: { conversion: AffiliateData['recentConversions'][0] }) {
  const status = getStatusConfig(conversion.status);
  const StatusIcon = status.icon;
  
  return (
    <div className="flex items-center gap-4 p-4 bg-[#151518] rounded-xl border border-white/5">
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF7A1A]/20 to-[#FF7A1A]/5 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-[#FF7A1A]">
          {((conversion.user as any)?.username || conversion.user?.name || "??").substring(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{(conversion.user as any)?.username || "Usuário"}</p>
        <p className="text-xs text-zinc-500">{formatDate(conversion.createdAt)}</p>
      </div>
      <div className="text-right hidden sm:block">
        <p className="text-xs text-zinc-500">Depósito</p>
        <p className="text-sm font-medium text-white">{formatCurrency(parseFloat(conversion.depositAmount))}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-zinc-500">Comissão</p>
        <p className="text-sm font-bold text-emerald-400">{formatCurrency(parseFloat(conversion.commissionValue))}</p>
      </div>
      <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${status.bg} ${status.color}`}>
        <StatusIcon className="w-3 h-3" />
        <span className="hidden sm:inline">{status.label}</span>
      </div>
    </div>
  );
}

function LandingSection({ onBecomeAffiliate, isPending }: { onBecomeAffiliate: () => void; isPending: boolean }) {
  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="relative overflow-hidden rounded-2xl bg-[#0D0D0F] border border-white/5">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF7A1A]/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#FF7A1A]/5 rounded-full blur-[100px]" />
        
        <div className="relative p-8 md:p-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#FF7A1A]/10 border border-[#FF7A1A]/20 text-[#FF7A1A] px-3 py-1.5 rounded-full text-sm font-semibold mb-6">
                <Zap className="w-4 h-4" />
                PROGRAMA DE AFILIADOS
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
                Monetize sua<br />
                <span className="text-[#FF7A1A]">audiência</span>
              </h1>
              
              <p className="text-lg text-zinc-400 mb-8 leading-relaxed">
                Ganhe comissões indicando jogadores para a IN1Bet. 
                Pagamentos via PIX, sem burocracia.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Cadastro gratuito
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Comissão vitalícia
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Saque a partir de R$ 50
                </div>
              </div>
              
              <Button 
                size="lg"
                className="bg-[#FF7A1A] hover:bg-[#FF7A1A]/90 text-white font-bold px-8 h-12"
                onClick={onBecomeAffiliate}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="w-5 h-5 mr-2" />
                )}
                Começar agora
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-xl bg-[#151518] border border-white/5">
                <DollarSign className="w-8 h-8 text-emerald-400 mb-3" />
                <p className="text-2xl font-bold text-white">R$ 80</p>
                <p className="text-sm text-zinc-500">por indicação (CPA)</p>
              </div>
              <div className="p-6 rounded-xl bg-[#151518] border border-white/5">
                <Percent className="w-8 h-8 text-blue-400 mb-3" />
                <p className="text-2xl font-bold text-white">40%</p>
                <p className="text-sm text-zinc-500">RevShare vitalício</p>
              </div>
              <div className="p-6 rounded-xl bg-[#151518] border border-white/5">
                <TrendingUp className="w-8 h-8 text-purple-400 mb-3" />
                <p className="text-2xl font-bold text-white">5 níveis</p>
                <p className="text-sm text-zinc-500">de comissão</p>
              </div>
              <div className="p-6 rounded-xl bg-[#151518] border border-white/5">
                <CreditCard className="w-8 h-8 text-[#FF7A1A] mb-3" />
                <p className="text-2xl font-bold text-white">PIX</p>
                <p className="text-sm text-zinc-500">Saque rápido</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 grid md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl bg-[#0D0D0F] border border-white/5">
          <div className="w-10 h-10 rounded-lg bg-[#FF7A1A]/10 flex items-center justify-center mb-4">
            <span className="text-lg font-bold text-[#FF7A1A]">1</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Cadastre-se</h3>
          <p className="text-sm text-zinc-400">Clique em "Começar agora" e receba seu link de afiliado imediatamente.</p>
        </div>
        <div className="p-6 rounded-xl bg-[#0D0D0F] border border-white/5">
          <div className="w-10 h-10 rounded-lg bg-[#FF7A1A]/10 flex items-center justify-center mb-4">
            <span className="text-lg font-bold text-[#FF7A1A]">2</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Divulgue</h3>
          <p className="text-sm text-zinc-400">Compartilhe seu link nas redes sociais, YouTube, grupos ou onde preferir.</p>
        </div>
        <div className="p-6 rounded-xl bg-[#0D0D0F] border border-white/5">
          <div className="w-10 h-10 rounded-lg bg-[#FF7A1A]/10 flex items-center justify-center mb-4">
            <span className="text-lg font-bold text-[#FF7A1A]">3</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Ganhe</h3>
          <p className="text-sm text-zinc-400">Receba comissões por cada jogador que se cadastrar e jogar através do seu link.</p>
        </div>
      </div>
    </div>
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
  const [activeTab, setActiveTab] = useState("dashboard");

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
    mutationFn: async (payload: { affiliateId: string; name?: string; code?: string }) => {
      return await apiRequest("POST", "/api/affiliate/links", payload);
    },
    onSuccess: () => {
      toast.success("Link criado!");
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
      toast.success("Bem-vindo ao programa de afiliados!");
      queryClient.invalidateQueries({ queryKey: ["/api/affiliate/dashboard"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao se tornar afiliado");
    },
  });

  const copyLink = (code: string) => {
    const fullUrl = `${window.location.origin}/ref/${code}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copiado!");
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 50) {
      toast.error("Valor mínimo é R$ 50,00");
      return;
    }
    if (!pixKey.trim()) {
      toast.error("Informe a chave PIX");
      return;
    }
    withdrawMutation.mutate({ amount, pixKey, pixKeyType });
  };

  const handleCreateLink = () => {
    if (!data?.affiliate?.id) {
      toast.error("Erro: ID de afiliado não encontrado");
      return;
    }
    createLinkMutation.mutate({ 
      affiliateId: data.affiliate.id,
      name: newLinkName || undefined, 
      code: newLinkCode || undefined 
    });
  };

  const currentTier = useMemo(() => {
    if (!data) return COMMISSION_TIERS[0];
    const referrals = data.stats.qualifiedReferrals;
    for (let i = COMMISSION_TIERS.length - 1; i >= 0; i--) {
      if (referrals >= COMMISSION_TIERS[i].minReferrals) {
        return COMMISSION_TIERS[i];
      }
    }
    return COMMISSION_TIERS[0];
  }, [data]);

  const nextTier = useMemo(() => {
    const idx = COMMISSION_TIERS.findIndex(t => t.level === currentTier.level);
    return COMMISSION_TIERS[idx + 1];
  }, [currentTier]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#FF7A1A]/30 border-t-[#FF7A1A] rounded-full animate-spin" />
            <p className="text-zinc-500">Carregando...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <LandingSection 
          onBecomeAffiliate={() => becomeAffiliateMutation.mutate()} 
          isPending={becomeAffiliateMutation.isPending}
        />
      </MainLayout>
    );
  }

  const { affiliate, stats, links, recentConversions, recentPayouts } = data;
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);

  const chartData = [
    { name: 'Jan', value: 0 },
    { name: 'Fev', value: stats.totalEarnings * 0.1 },
    { name: 'Mar', value: stats.totalEarnings * 0.25 },
    { name: 'Abr', value: stats.totalEarnings * 0.45 },
    { name: 'Mai', value: stats.totalEarnings * 0.7 },
    { name: 'Hoje', value: stats.totalEarnings },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Painel de Afiliado</h1>
            <p className="text-zinc-500">Olá, {affiliate.name.split(" ")[0]}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="border-white/10 hover:bg-white/5 hover:border-white/20"
              onClick={() => setShowCreateLinkModal(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Link
            </Button>
            <Button
              className="bg-[#FF7A1A] hover:bg-[#FF7A1A]/90"
              onClick={() => setShowWithdrawModal(true)}
              disabled={stats.pendingBalance < 50}
            >
              <Wallet className="w-4 h-4 mr-2" />
              Sacar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="Ganhos Totais"
            value={formatCurrency(stats.totalEarnings)}
            accent
          />
          <StatCard
            icon={HandCoins}
            label="Disponível"
            value={formatCurrency(stats.pendingBalance)}
            subValue="para saque"
          />
          <StatCard
            icon={Users}
            label="Indicações"
            value={stats.totalReferrals}
            subValue={`${stats.qualifiedReferrals} qualificadas`}
          />
          <StatCard
            icon={MousePointerClick}
            label="Cliques"
            value={totalClicks}
            subValue={`${stats.conversionRate.toFixed(1)}% conversão`}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-[#0D0D0F] border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF7A1A]" />
                Evolução de Ganhos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF7A1A" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#FF7A1A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="name" 
                      stroke="#3f3f46" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#3f3f46" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(v) => `R$${v}`}
                    />
                    <RechartsTooltip
                      contentStyle={{ 
                        background: '#151518', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'Ganhos']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#FF7A1A" 
                      strokeWidth={2}
                      fill="url(#colorEarnings)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0D0D0F] border-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF7A1A]" />
                Seu Nível
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#FF7A1A]/10 to-transparent border border-[#FF7A1A]/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-bold text-white">{currentTier.name}</span>
                  <Badge className="bg-[#FF7A1A]/20 text-[#FF7A1A] border-0">Nível {currentTier.level}</Badge>
                </div>
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">CPA:</span>
                    <span className="text-white ml-1 font-medium">R$ {currentTier.cpa}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">RevShare:</span>
                    <span className="text-white ml-1 font-medium">{currentTier.revshare}%</span>
                  </div>
                </div>
              </div>
              
              {nextTier && (
                <div className="p-3 rounded-lg bg-[#151518] border border-white/5">
                  <p className="text-xs text-zinc-500 mb-2">Próximo nível: {nextTier.name}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-400">
                      {stats.qualifiedReferrals}/{nextTier.minReferrals} indicações
                    </span>
                    <ChevronRight className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#FF7A1A] rounded-full transition-all"
                      style={{ width: `${Math.min((stats.qualifiedReferrals / nextTier.minReferrals) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#0D0D0F] border border-white/5 p-1">
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-[#FF7A1A]/10 data-[state=active]:text-[#FF7A1A]"
            >
              <Link2 className="w-4 h-4 mr-2" />
              Links
            </TabsTrigger>
            <TabsTrigger 
              value="conversions"
              className="data-[state=active]:bg-[#FF7A1A]/10 data-[state=active]:text-[#FF7A1A]"
            >
              <Users className="w-4 h-4 mr-2" />
              Conversões
            </TabsTrigger>
            <TabsTrigger 
              value="payouts"
              className="data-[state=active]:bg-[#FF7A1A]/10 data-[state=active]:text-[#FF7A1A]"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Pagamentos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-6 space-y-3">
            {links.length === 0 ? (
              <div className="text-center py-12 bg-[#0D0D0F] rounded-xl border border-white/5">
                <Link2 className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                <p className="text-zinc-400 mb-4">Nenhum link criado ainda</p>
                <Button onClick={() => setShowCreateLinkModal(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeiro link
                </Button>
              </div>
            ) : (
              links.map((link) => (
                <LinkRow key={link.id} link={link} onCopy={copyLink} />
              ))
            )}
          </TabsContent>

          <TabsContent value="conversions" className="mt-6 space-y-3">
            {recentConversions.length === 0 ? (
              <div className="text-center py-12 bg-[#0D0D0F] rounded-xl border border-white/5">
                <Users className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                <p className="text-zinc-400">Nenhuma conversão registrada</p>
                <p className="text-xs text-zinc-600 mt-1">Compartilhe seus links para começar a ganhar!</p>
              </div>
            ) : (
              recentConversions.map((conversion) => (
                <ConversionRow key={conversion.id} conversion={conversion} />
              ))
            )}
          </TabsContent>

          <TabsContent value="payouts" className="mt-6 space-y-3">
            {recentPayouts.length === 0 ? (
              <div className="text-center py-12 bg-[#0D0D0F] rounded-xl border border-white/5">
                <Wallet className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                <p className="text-zinc-400">Nenhum pagamento solicitado</p>
              </div>
            ) : (
              recentPayouts.map((payout) => {
                const status = getStatusConfig(payout.status);
                const StatusIcon = status.icon;
                return (
                  <div key={payout.id} className="flex items-center justify-between p-4 bg-[#151518] rounded-xl border border-white/5">
                    <div>
                      <p className="font-semibold text-white">{formatCurrency(parseFloat(payout.amount))}</p>
                      <p className="text-xs text-zinc-500">{formatDate(payout.createdAt)}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.bg} ${status.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="bg-[#0D0D0F] border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Wallet className="w-5 h-5 text-[#FF7A1A]" />
              Solicitar Saque
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Disponível: <span className="font-semibold text-[#FF7A1A]">{formatCurrency(stats.pendingBalance)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-zinc-300">Valor</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">R$</span>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0,00"
                  className="pl-10 bg-[#151518] border-white/10"
                  min={50}
                  max={stats.pendingBalance}
                />
              </div>
              <p className="text-xs text-zinc-600 mt-1">Mínimo: R$ 50,00</p>
            </div>
            <div>
              <Label className="text-zinc-300">Tipo de chave PIX</Label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger className="mt-1.5 bg-[#151518] border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#151518] border-white/10">
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="EMAIL">E-mail</SelectItem>
                  <SelectItem value="PHONE">Telefone</SelectItem>
                  <SelectItem value="RANDOM">Chave aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-300">Chave PIX</Label>
              <Input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Digite sua chave PIX"
                className="mt-1.5 bg-[#151518] border-white/10"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawModal(false)} className="border-white/10">
              Cancelar
            </Button>
            <Button 
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending}
              className="bg-[#FF7A1A] hover:bg-[#FF7A1A]/90"
            >
              {withdrawMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Solicitar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateLinkModal} onOpenChange={setShowCreateLinkModal}>
        <DialogContent className="bg-[#0D0D0F] border-white/10 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Link2 className="w-5 h-5 text-[#FF7A1A]" />
              Criar Link
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Crie links personalizados para suas campanhas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-zinc-300">Nome (opcional)</Label>
              <Input
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                placeholder="Ex: Instagram, YouTube..."
                className="mt-1.5 bg-[#151518] border-white/10"
              />
            </div>
            <div>
              <Label className="text-zinc-300">Código (opcional)</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-zinc-500">/ref/</span>
                <Input
                  value={newLinkCode}
                  onChange={(e) => setNewLinkCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="MEUCODIGO"
                  className="uppercase bg-[#151518] border-white/10"
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-zinc-600 mt-1">Deixe vazio para gerar automaticamente</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateLinkModal(false)} className="border-white/10">
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateLink}
              disabled={createLinkMutation.isPending}
              className="bg-[#FF7A1A] hover:bg-[#FF7A1A]/90"
            >
              {createLinkMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
