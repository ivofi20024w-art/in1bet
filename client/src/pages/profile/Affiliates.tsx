import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Users, 
  Copy, 
  TrendingUp, 
  DollarSign, 
  MousePointerClick, 
  UserPlus, 
  ArrowUpRight, 
  ArrowDownRight,
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
  ExternalLink,
  Crown,
  Gem,
  Award,
  Star,
  Zap,
  Shield,
  Gift,
  Percent,
  Eye,
  QrCode,
  Settings,
  Calendar,
  TrendingDown,
  CircleDot,
  Activity,
  PiggyBank,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Line, LineChart } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

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

const TIERS = [
  { name: "Bronze", icon: Award, color: "#CD7F32", minReferrals: 0, cpaBonus: 0, revShareBonus: 0, benefits: ["R$ 30 CPA", "20% RevShare", "Suporte padrão"] },
  { name: "Prata", icon: Shield, color: "#C0C0C0", minReferrals: 10, cpaBonus: 10, revShareBonus: 5, benefits: ["R$ 40 CPA", "25% RevShare", "Suporte prioritário"] },
  { name: "Ouro", icon: Star, color: "#FFD700", minReferrals: 50, cpaBonus: 20, revShareBonus: 10, benefits: ["R$ 50 CPA", "30% RevShare", "Gerente dedicado"] },
  { name: "Platina", icon: Gem, color: "#E5E4E2", minReferrals: 200, cpaBonus: 30, revShareBonus: 15, benefits: ["R$ 60 CPA", "35% RevShare", "Bônus exclusivos"] },
  { name: "Diamante", icon: Crown, color: "#B9F2FF", minReferrals: 500, cpaBonus: 50, revShareBonus: 20, benefits: ["R$ 80 CPA", "40% RevShare", "Condições personalizadas"] },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatCompactNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function getStatusConfig(status: string) {
  const config: Record<string, { color: string; bgColor: string; label: string; icon: any }> = {
    PENDING: { color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "Pendente", icon: Clock },
    APPROVED: { color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Aprovado", icon: CheckCircle },
    QUALIFIED: { color: "text-green-500", bgColor: "bg-green-500/10", label: "Qualificado", icon: CheckCircle },
    PAID: { color: "text-emerald-500", bgColor: "bg-emerald-500/10", label: "Pago", icon: CheckCircle },
    CANCELLED: { color: "text-gray-500", bgColor: "bg-gray-500/10", label: "Cancelado", icon: XCircle },
    FRAUD: { color: "text-red-500", bgColor: "bg-red-500/10", label: "Fraude", icon: AlertTriangle },
    REJECTED: { color: "text-red-500", bgColor: "bg-red-500/10", label: "Rejeitado", icon: XCircle },
  };
  return config[status] || { color: "text-gray-500", bgColor: "bg-gray-500/10", label: status, icon: Clock };
}

function MiniSparkline({ data, color = "#f97316", height = 32 }: { data: number[]; color?: string; height?: number }) {
  const chartData = data.map((value, index) => ({ value, index }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color} 
          strokeWidth={2} 
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TierBadge({ tier, size = "md" }: { tier: typeof TIERS[0]; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { badge: "h-5 px-2 text-[10px]", icon: "w-3 h-3" },
    md: { badge: "h-7 px-3 text-xs", icon: "w-4 h-4" },
    lg: { badge: "h-9 px-4 text-sm", icon: "w-5 h-5" },
  };
  const Icon = tier.icon;
  return (
    <div 
      className={`inline-flex items-center gap-1.5 rounded-full font-bold ${sizes[size].badge}`}
      style={{ 
        background: `linear-gradient(135deg, ${tier.color}20, ${tier.color}40)`,
        border: `1px solid ${tier.color}60`,
        color: tier.color,
      }}
    >
      <Icon className={sizes[size].icon} />
      {tier.name}
    </div>
  );
}

function KPICard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  iconColor,
  trend,
  trendLabel,
  sparklineData,
  onClick,
}: { 
  title: string; 
  value: string | number;
  subtitle?: string;
  icon: any; 
  iconColor: string;
  trend?: number;
  trendLabel?: string;
  sparklineData?: number[];
  onClick?: () => void;
}) {
  const hasTrend = trend !== undefined && trend !== 0;
  const isPositive = trend && trend > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`relative overflow-hidden bg-gradient-to-br from-card/80 to-card border-white/5 backdrop-blur-xl group ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between mb-3">
            <div 
              className="p-2.5 rounded-xl transition-all duration-300 group-hover:scale-110"
              style={{ backgroundColor: `${iconColor}15` }}
            >
              <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            
            {hasTrend && (
              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                isPositive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(trend).toFixed(1)}%
              </div>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          
          {sparklineData && sparklineData.length > 0 && (
            <div className="mt-3 -mx-1">
              <MiniSparkline data={sparklineData} color={iconColor} />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TierProgressSection({ referrals, currentTier, nextTier }: { referrals: number; currentTier: typeof TIERS[0]; nextTier?: typeof TIERS[0] }) {
  const progress = nextTier 
    ? ((referrals - currentTier.minReferrals) / (nextTier.minReferrals - currentTier.minReferrals)) * 100
    : 100;

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <TierBadge tier={currentTier} size="lg" />
          <div>
            <p className="text-sm text-muted-foreground">Seu tier atual</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentTier.benefits[0]} • {currentTier.benefits[1]}
            </p>
          </div>
        </div>
        
        {nextTier && (
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Próximo tier</p>
            <TierBadge tier={nextTier} size="sm" />
          </div>
        )}
      </div>
      
      <div className="relative h-3 bg-secondary/50 rounded-full overflow-hidden">
        <motion.div 
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ 
            background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier?.color || currentTier.color})`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <div 
          className="absolute inset-y-0 left-0 rounded-full opacity-50 blur-sm"
          style={{ 
            background: `linear-gradient(90deg, ${currentTier.color}, ${nextTier?.color || currentTier.color})`,
            width: `${Math.min(progress, 100)}%`,
          }}
        />
      </div>
      
      {nextTier && (
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span>{referrals} indicações qualificadas</span>
          <span>Faltam {nextTier.minReferrals - referrals} para {nextTier.name}</span>
        </div>
      )}
    </div>
  );
}

function LinkCard({ link, onCopy }: { link: AffiliateData['links'][0]; onCopy: (url: string) => void }) {
  const [showQR, setShowQR] = useState(false);
  const fullUrl = `${window.location.origin}/ref/${link.code}`;
  const convRate = link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(1) : "0.0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <Card className="bg-gradient-to-br from-card/90 to-card border-white/5 hover:border-primary/30 transition-all duration-300">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Link2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-white truncate">{link.name || link.code}</p>
                  {!link.isActive && (
                    <Badge variant="outline" className="text-[10px] h-4 mt-0.5">Inativo</Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-4">
                <code className="text-xs text-muted-foreground bg-black/30 px-3 py-1.5 rounded-lg flex-1 truncate">
                  {fullUrl}
                </code>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 shrink-0"
                        onClick={() => onCopy(`/ref/${link.code}`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copiar link</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 shrink-0"
                        onClick={() => setShowQR(!showQR)}
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Ver QR Code</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-secondary/30">
                  <p className="text-lg font-bold text-white">{formatCompactNumber(link.clicks)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Cliques</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-secondary/30">
                  <p className="text-lg font-bold text-white">{link.registrations}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Cadastros</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-green-500/10">
                  <p className="text-lg font-bold text-green-500">{link.conversions}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Conversões</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-primary/10">
                  <p className="text-lg font-bold text-primary">{convRate}%</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Taxa Conv.</p>
                </div>
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-white/5"
              >
                <div className="flex items-center justify-center p-4 bg-white rounded-xl">
                  <div className="w-32 h-32 bg-black/10 flex items-center justify-center rounded">
                    <QrCode className="w-24 h-24 text-black" />
                  </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Escaneie para acessar seu link
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ConversionTimeline({ conversions }: { conversions: AffiliateData['recentConversions'] }) {
  if (conversions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 rounded-full bg-secondary/30 mb-4">
          <Activity className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground mb-2">Nenhuma conversão registrada</p>
        <p className="text-xs text-muted-foreground max-w-sm">
          Compartilhe seus links para começar a ganhar comissões!
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />
      
      <div className="space-y-4">
        {conversions.map((conv, index) => {
          const status = getStatusConfig(conv.status);
          const StatusIcon = status.icon;
          
          return (
            <motion.div
              key={conv.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-14"
            >
              <div 
                className={`absolute left-4 w-5 h-5 rounded-full flex items-center justify-center ${status.bgColor}`}
                style={{ top: "50%", transform: "translateY(-50%)" }}
              >
                <CircleDot className={`w-3 h-3 ${status.color}`} />
              </div>
              
              <Card className="bg-card/50 border-white/5 hover:border-white/10 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-sm font-bold text-primary">
                        {conv.user?.name?.substring(0, 2).toUpperCase() || "??"}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{conv.user?.name || "Usuário"}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(conv.createdAt)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-muted-foreground">Depósitos</p>
                        <p className="font-semibold text-white">{formatCurrency(parseFloat(conv.depositAmount))}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Comissão</p>
                        <p className="font-bold text-green-500">{formatCurrency(parseFloat(conv.commissionValue))}</p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${status.bgColor} ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function FinancialOverview({ stats, payouts }: { stats: AffiliateData['stats']; payouts: AffiliateData['recentPayouts'] }) {
  const totalPaid = payouts
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2 bg-gradient-to-br from-card/90 to-card border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PiggyBank className="w-5 h-5 text-primary" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
              <p className="text-xs text-green-400/80 mb-1">Ganhos Totais</p>
              <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalEarnings)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <p className="text-xs text-primary/80 mb-1">Disponível</p>
              <p className="text-2xl font-bold text-primary">{formatCurrency(stats.pendingBalance)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
              <p className="text-xs text-blue-400/80 mb-1">Já Sacado</p>
              <p className="text-2xl font-bold text-blue-500">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan', value: 0 },
                { name: 'Fev', value: stats.totalEarnings * 0.1 },
                { name: 'Mar', value: stats.totalEarnings * 0.3 },
                { name: 'Abr', value: stats.totalEarnings * 0.5 },
                { name: 'Mai', value: stats.totalEarnings * 0.7 },
                { name: 'Jun', value: stats.totalEarnings },
              ]}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                <RechartsTooltip 
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#888' }}
                />
                <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-br from-card/90 to-card border-white/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="w-5 h-5 text-primary" />
            Últimos Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {payouts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhum pagamento ainda
            </div>
          ) : (
            payouts.slice(0, 5).map((payout) => {
              const status = getStatusConfig(payout.status);
              return (
                <div key={payout.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20">
                  <div>
                    <p className="font-semibold text-white">{formatCurrency(parseFloat(payout.amount))}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(payout.createdAt)}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${status.color}`}>
                    <status.icon className="w-3 h-3" />
                    {status.label}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
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
  const [activeTab, setActiveTab] = useState("overview");

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

  const { currentTier, nextTier } = useMemo(() => {
    if (!data) return { currentTier: TIERS[0], nextTier: TIERS[1] };
    const referrals = data.stats.qualifiedReferrals;
    let current = TIERS[0];
    let next: typeof TIERS[0] | undefined = TIERS[1];
    
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (referrals >= TIERS[i].minReferrals) {
        current = TIERS[i];
        next = TIERS[i + 1];
        break;
      }
    }
    return { currentTier: current, nextTier: next };
  }, [data]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
            </div>
            <p className="text-muted-foreground">Carregando painel...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent rounded-3xl blur-3xl opacity-30" />
            
            <Card className="relative overflow-hidden bg-gradient-to-br from-card via-card to-card/50 border-white/10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-yellow-500/5 to-transparent" />
              
              <CardContent className="relative p-8 md:p-12">
                <div className="flex flex-col lg:flex-row gap-8 items-center">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                      <Zap className="w-4 h-4" />
                      PROGRAMA DE PARCEIROS
                    </div>
                    
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
                      Ganhe dinheiro<br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-500 to-primary">
                        indicando amigos
                      </span>
                    </h1>
                    
                    <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                      Torne-se um afiliado e receba comissões sobre todas as apostas dos seus indicados. É rápido, fácil e gratuito.
                    </p>
                    
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90 text-white font-bold px-8 h-12 text-base"
                      onClick={() => becomeAffiliateMutation.mutate()}
                      disabled={becomeAffiliateMutation.isPending}
                      data-testid="button-become-affiliate"
                    >
                      {becomeAffiliateMutation.isPending ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <UserPlus className="w-5 h-5 mr-2" />
                      )}
                      Quero ser Afiliado
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
                      <DollarSign className="w-10 h-10 text-green-500 mb-3" />
                      <p className="text-2xl font-bold text-white">R$ 80</p>
                      <p className="text-xs text-muted-foreground">por indicação</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
                      <Percent className="w-10 h-10 text-blue-500 mb-3" />
                      <p className="text-2xl font-bold text-white">40%</p>
                      <p className="text-xs text-muted-foreground">RevShare vitalício</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
                      <Crown className="w-10 h-10 text-purple-500 mb-3" />
                      <p className="text-2xl font-bold text-white">5 Tiers</p>
                      <p className="text-xs text-muted-foreground">com bônus progressivos</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                      <Wallet className="w-10 h-10 text-primary mb-3" />
                      <p className="text-2xl font-bold text-white">PIX</p>
                      <p className="text-xs text-muted-foreground">Saque instantâneo</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </MainLayout>
    );
  }

  const { affiliate, stats, links, recentConversions, recentPayouts } = data;
  const totalClicks = links.reduce((sum, l) => sum + l.clicks, 0);

  const sparklineEarnings = [0, stats.totalEarnings * 0.2, stats.totalEarnings * 0.4, stats.totalEarnings * 0.6, stats.totalEarnings * 0.8, stats.totalEarnings];
  const sparklineReferrals = [0, 1, 2, stats.totalReferrals * 0.5, stats.totalReferrals * 0.8, stats.totalReferrals];

  return (
    <MainLayout>
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16162a] to-[#0f0f1a] border border-white/5 p-8"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent opacity-50" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-yellow-500/5 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent opacity-30" />
          
          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <TierBadge tier={currentTier} size="lg" />
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                  {affiliate.status === 'ACTIVE' ? 'Ativo' : affiliate.status}
                </Badge>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Olá, {affiliate.name.split(" ")[0]}!
              </h1>
              <p className="text-lg text-muted-foreground">
                {affiliate.commissionType === "CPA" && (
                  <span>Você ganha <span className="text-primary font-bold">R$ {affiliate.cpaValue.toFixed(0)}</span> por cada indicação qualificada</span>
                )}
                {affiliate.commissionType === "REVSHARE" && (
                  <span>Você ganha <span className="text-primary font-bold">{affiliate.revsharePercentage}%</span> de RevShare vitalício</span>
                )}
                {affiliate.commissionType === "HYBRID" && (
                  <span>Você ganha <span className="text-primary font-bold">R$ {affiliate.cpaValue.toFixed(0)}</span> + <span className="text-primary font-bold">{affiliate.revsharePercentage}%</span> RevShare</span>
                )}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-white/10 hover:bg-white/5"
                onClick={() => setShowCreateLinkModal(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Link
              </Button>
              <Button
                className="bg-gradient-to-r from-primary to-yellow-500 hover:from-primary/90 hover:to-yellow-500/90"
                onClick={() => setShowWithdrawModal(true)}
                disabled={stats.pendingBalance < 50}
                data-testid="button-withdraw"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Sacar {formatCurrency(stats.pendingBalance)}
              </Button>
            </div>
          </div>
          
          <div className="relative mt-8">
            <TierProgressSection 
              referrals={stats.qualifiedReferrals} 
              currentTier={currentTier}
              nextTier={nextTier}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Ganhos Totais"
            value={formatCurrency(stats.totalEarnings)}
            subtitle="Desde o início"
            icon={DollarSign}
            iconColor="#22c55e"
            trend={stats.totalEarnings > 0 ? 12.5 : 0}
            sparklineData={sparklineEarnings}
          />
          <KPICard
            title="Total Indicados"
            value={stats.totalReferrals}
            subtitle={`${stats.qualifiedReferrals} qualificados`}
            icon={Users}
            iconColor="#3b82f6"
            trend={stats.totalReferrals > 0 ? 8.3 : 0}
            sparklineData={sparklineReferrals}
          />
          <KPICard
            title="Cliques nos Links"
            value={formatCompactNumber(totalClicks)}
            subtitle={`${stats.conversionRate.toFixed(1)}% de conversão`}
            icon={MousePointerClick}
            iconColor="#8b5cf6"
          />
          <KPICard
            title="Disponível"
            value={formatCurrency(stats.pendingBalance)}
            subtitle="Para saque"
            icon={Wallet}
            iconColor="#f97316"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/50 border border-white/5 p-1 h-auto">
            <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Link2 className="w-4 h-4" />
              Meus Links
            </TabsTrigger>
            <TabsTrigger value="conversions" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <TrendingUp className="w-4 h-4" />
              Conversões
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <PiggyBank className="w-4 h-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-primary" />
                    Sistema de Tiers
                  </CardTitle>
                  <CardDescription>Suba de nível e ganhe mais</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {TIERS.map((tier, index) => {
                    const isActive = tier.name === currentTier.name;
                    const isLocked = tier.minReferrals > stats.qualifiedReferrals;
                    const Icon = tier.icon;
                    
                    return (
                      <div 
                        key={tier.name}
                        className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                          isActive 
                            ? 'bg-gradient-to-r from-primary/10 to-transparent border border-primary/30' 
                            : isLocked 
                              ? 'bg-secondary/20 opacity-50' 
                              : 'bg-secondary/30'
                        }`}
                      >
                        <div 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: `${tier.color}20` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: tier.color }} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white">{tier.name}</p>
                            {isActive && <Badge className="bg-primary/20 text-primary text-[10px]">Atual</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {tier.minReferrals === 0 ? 'Inicial' : `${tier.minReferrals}+ indicações`}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-green-500 font-semibold">R$ {30 + tier.cpaBonus} CPA</p>
                          <p className="text-muted-foreground">{20 + tier.revShareBonus}% Rev</p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Atividade Recente
                  </CardTitle>
                  <CardDescription>Últimas conversões</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentConversions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Nenhuma conversão ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentConversions.slice(0, 5).map((conv) => {
                        const status = getStatusConfig(conv.status);
                        return (
                          <div key={conv.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {conv.user?.name?.substring(0, 2).toUpperCase() || "??"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{conv.user?.name || "Usuário"}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(conv.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-green-500">{formatCurrency(parseFloat(conv.commissionValue))}</p>
                              <p className={`text-[10px] ${status.color}`}>{status.label}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="links" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Seus Links de Indicação</h2>
                <p className="text-muted-foreground text-sm">Compartilhe para ganhar comissões</p>
              </div>
              <Button onClick={() => setShowCreateLinkModal(true)} className="gap-2" data-testid="button-create-link">
                <Plus className="w-4 h-4" />
                Novo Link
              </Button>
            </div>
            
            {links.length === 0 ? (
              <Card className="bg-card/50 border-white/5">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="p-4 rounded-full bg-secondary/30 mb-4">
                    <Link2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">Você ainda não tem links</p>
                  <Button variant="outline" onClick={() => setShowCreateLinkModal(true)}>
                    Criar primeiro link
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {links.map((link) => (
                  <LinkCard key={link.id} link={link} onCopy={copyLink} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="conversions" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Histórico de Conversões</h2>
              <p className="text-muted-foreground text-sm">Acompanhe suas indicações</p>
            </div>
            
            <Card className="bg-card/50 border-white/5">
              <CardContent className="p-6">
                <ConversionTimeline conversions={recentConversions} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Painel Financeiro</h2>
              <p className="text-muted-foreground text-sm">Seus ganhos e pagamentos</p>
            </div>
            
            <FinancialOverview stats={stats} payouts={recentPayouts} />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Solicitar Saque
            </DialogTitle>
            <DialogDescription>
              Saldo disponível: <span className="font-bold text-primary">{formatCurrency(stats.pendingBalance)}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Valor do saque</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0,00"
                  className="pl-10"
                  min={50}
                  max={stats.pendingBalance}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Mínimo: R$ 50,00</p>
            </div>
            <div>
              <Label>Tipo de chave PIX</Label>
              <Select value={pixKeyType} onValueChange={setPixKeyType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CPF">CPF</SelectItem>
                  <SelectItem value="CNPJ">CNPJ</SelectItem>
                  <SelectItem value="EMAIL">E-mail</SelectItem>
                  <SelectItem value="PHONE">Telefone</SelectItem>
                  <SelectItem value="RANDOM">Chave aleatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chave PIX</Label>
              <Input
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Digite sua chave PIX"
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
            >
              {withdrawMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Solicitar Saque
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateLinkModal} onOpenChange={setShowCreateLinkModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-primary" />
              Criar Novo Link
            </DialogTitle>
            <DialogDescription>
              Crie links personalizados para suas campanhas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome do link (opcional)</Label>
              <Input
                value={newLinkName}
                onChange={(e) => setNewLinkName(e.target.value)}
                placeholder="Ex: Instagram, YouTube, Blog..."
              />
            </div>
            <div>
              <Label>Código personalizado (opcional)</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">/ref/</span>
                <Input
                  value={newLinkCode}
                  onChange={(e) => setNewLinkCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                  placeholder="MEUCODIGO"
                  className="uppercase"
                  maxLength={15}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Deixe vazio para gerar automaticamente</p>
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
            >
              {createLinkMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
