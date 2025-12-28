import { MainLayout } from "@/components/layout/MainLayout";
import { AFFILIATE_DATA } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Download
} from "lucide-react";
import { toast } from "sonner";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import affiliateHeader from "@assets/generated_images/affiliate_dashboard_header_with_3d_coins_and_network_connections.png";

// Mock chart data
const CHART_DATA = [
  { name: 'Seg', earnings: 120, referrals: 2 },
  { name: 'Ter', earnings: 180, referrals: 5 },
  { name: 'Qua', earnings: 150, referrals: 3 },
  { name: 'Qui', earnings: 240, referrals: 8 },
  { name: 'Sex', earnings: 300, referrals: 12 },
  { name: 'Sáb', earnings: 450, referrals: 15 },
  { name: 'Dom', earnings: 380, referrals: 10 },
];

export default function Affiliates() {
  const copyLink = () => {
    navigator.clipboard.writeText(AFFILIATE_DATA.referralLink);
    toast.success("Link de convite copiado!");
  };

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
            Indique Amigos e <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-400">Ganhe até {AFFILIATE_DATA.commissionRate}%</span>
          </h1>
          <p className="text-gray-300 text-lg mb-6 max-w-lg">
            Construa sua rede de afiliados e receba comissões vitalícias sobre todas as apostas dos seus indicados.
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                        <DollarSign className="w-6 h-6 text-green-500" />
                    </div>
                    <span className="text-xs font-bold text-green-500 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                        +12.5% <ArrowUpRight className="w-3 h-3" />
                    </span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">Ganhos Totais</p>
                <h3 className="text-2xl font-bold text-white">R$ {AFFILIATE_DATA.totalEarnings.toFixed(2)}</h3>
            </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                        <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <span className="text-xs font-bold text-blue-500 flex items-center gap-1 bg-blue-500/10 px-2 py-1 rounded">
                        +5 hoje
                    </span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">Total de Indicados</p>
                <h3 className="text-2xl font-bold text-white">{AFFILIATE_DATA.totalReferrals}</h3>
            </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                        <MousePointerClick className="w-6 h-6 text-purple-500" />
                    </div>
                    <span className="text-xs font-bold text-purple-500 flex items-center gap-1 bg-purple-500/10 px-2 py-1 rounded">
                        3.5% Conv.
                    </span>
                </div>
                <p className="text-muted-foreground text-sm mb-1">Cliques no Link</p>
                <h3 className="text-2xl font-bold text-white">{AFFILIATE_DATA.todayClicks}</h3>
            </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <Wallet className="w-6 h-6 text-primary" />
                    </div>
                    <Button size="sm" className="h-7 text-xs font-bold bg-primary hover:bg-primary/90">
                        Sacar
                    </Button>
                </div>
                <p className="text-muted-foreground text-sm mb-1">Disponível para Saque</p>
                <h3 className="text-2xl font-bold text-white">R$ {AFFILIATE_DATA.availableBalance.toFixed(2)}</h3>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (Charts & Link) */}
        <div className="lg:col-span-2 space-y-8">
            {/* Referral Link Section */}
            <Card className="bg-card border-white/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-primary" />
                        Seu Link de Indicação
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Input 
                                value={AFFILIATE_DATA.referralLink} 
                                readOnly 
                                className="bg-secondary/50 border-white/10 pr-12 font-mono text-sm" 
                            />
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="absolute right-0 top-0 h-full text-muted-foreground hover:text-white"
                                onClick={copyLink}
                            >
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                        <Button className="font-bold gap-2 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                            <Download className="w-4 h-4" />
                            Baixar Banners
                        </Button>
                    </div>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-primary" />
                            <span>Comissão: <strong className="text-white">{AFFILIATE_DATA.commissionRate}%</strong></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <UserPlus className="w-4 h-4 text-primary" />
                            <span>Cookies: <strong className="text-white">30 dias</strong></span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card className="bg-card border-white/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Desempenho Semanal
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={CHART_DATA}>
                                <defs>
                                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#ffffff50" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                />
                                <YAxis 
                                    stroke="#ffffff50" 
                                    fontSize={12} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    tickFormatter={(value) => `R$${value}`} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f0f15', borderColor: '#ffffff10', borderRadius: '8px', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="earnings" 
                                    stroke="#f97316" 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill="url(#colorEarnings)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

             {/* Campaigns Table */}
             <Card className="bg-card border-white/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        Campanhas Ativas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {AFFILIATE_DATA.campaigns.map((campaign) => (
                            <div key={campaign.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                <div>
                                    <p className="font-bold text-white">{campaign.name}</p>
                                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3" /> {campaign.clicks} cliques</span>
                                        <span className="flex items-center gap-1"><UserPlus className="w-3 h-3" /> {campaign.signups} cadastros</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-500">R$ {campaign.earnings.toFixed(2)}</p>
                                    <p className="text-xs text-muted-foreground">Lucro Total</p>
                                </div>
                            </div>
                        ))}
                         <Button variant="outline" className="w-full border-dashed border-white/20 text-muted-foreground hover:text-white hover:bg-white/5 hover:border-white/40">
                            + Criar Nova Campanha
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Sidebar (Recent Activity & Tips) */}
        <div className="space-y-8">
            <Card className="bg-card border-white/5 h-fit">
                <CardHeader>
                    <CardTitle className="text-lg">Últimos Indicados</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {AFFILIATE_DATA.recentReferrals.map((referral) => (
                            <div key={referral.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                                        {referral.user.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{referral.user}</p>
                                        <p className="text-xs text-muted-foreground">{referral.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-500">+ R$ {referral.commission.toFixed(2)}</p>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${referral.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {referral.status === 'Active' ? 'Ativo' : 'Inativo'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-2xl p-6 border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/30 rounded-full blur-3xl" />
                
                <h3 className="text-xl font-heading font-bold text-white mb-3 relative z-10">Dica Pro 🚀</h3>
                <p className="text-sm text-gray-300 mb-4 relative z-10">
                    Afiliados que compartilham seus links no Instagram Stories têm 3x mais conversão!
                </p>
                <Button size="sm" className="w-full bg-white text-black hover:bg-white/90 font-bold relative z-10">
                    Baixar Stories Prontos
                </Button>
            </div>
        </div>
      </div>
    </MainLayout>
  );
}
