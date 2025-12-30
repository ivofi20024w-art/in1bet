import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    Users, 
    Copy, 
    DollarSign, 
    MousePointerClick, 
    UserPlus, 
    Share2, 
    BarChart3, 
    Target,
    Wallet,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Clock
} from "lucide-react";
import { toast } from "sonner";
import { getStoredAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

interface AffiliateStats {
  totalClicks: number;
  totalRegistrations: number;
  totalConversions: number;
  pendingBalance: number;
  availableBalance: number;
  paidBalance: number;
  conversionRate: number;
}

interface AffiliateLink {
  id: string;
  code: string;
  name: string;
  url: string;
  clicks: number;
  registrations: number;
  conversions: number;
  isActive: boolean;
}

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
  stats: AffiliateStats;
  links: AffiliateLink[];
  recentConversions: any[];
  recentPayouts: any[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function Affiliates() {
  const queryClient = useQueryClient();
  const auth = getStoredAuth();

  const { data, isLoading, error } = useQuery<AffiliateData>({
    queryKey: ["/api/affiliate/dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/affiliate/dashboard", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao carregar dados");
      }
      return response.json();
    },
    enabled: !!auth.accessToken,
  });

  const copyLink = (url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Link copiado!");
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-card border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-4">
              Programa de Afiliados
            </h2>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Você ainda não está cadastrado como afiliado. Entre em contato com nosso suporte para saber como participar do programa e ganhar comissões por indicações.
            </p>
            <Button 
              onClick={() => window.location.href = "/support"}
              className="bg-primary hover:bg-primary/90 text-white font-bold"
              data-testid="button-contact-support"
            >
              Falar com Suporte
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const { affiliate, stats, links } = data;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-heading font-bold text-white">
              Programa de Afiliados
            </h1>
            <Badge 
              className={affiliate.status === "ACTIVE" 
                ? "bg-green-500/20 text-green-400" 
                : "bg-yellow-500/20 text-yellow-400"
              }
            >
              {affiliate.status === "ACTIVE" ? "Ativo" : "Pendente"}
            </Badge>
          </div>
          <p className="text-gray-400">
            Olá, {affiliate.name}! Acompanhe suas indicações e comissões.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition-colors">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">Disponível para Saque</p>
              <h3 className="text-2xl font-bold text-white" data-testid="text-available-balance">
                {formatCurrency(stats.availableBalance)}
              </h3>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 transition-colors">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">Saldo Pendente</p>
              <h3 className="text-2xl font-bold text-white" data-testid="text-pending-balance">
                {formatCurrency(stats.pendingBalance)}
              </h3>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">Conversões Qualificadas</p>
              <h3 className="text-2xl font-bold text-white" data-testid="text-conversions">
                {stats.totalConversions}
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
              <p className="text-muted-foreground text-sm mb-1">Total de Cliques</p>
              <h3 className="text-2xl font-bold text-white" data-testid="text-clicks">
                {stats.totalClicks}
              </h3>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-primary" />
                  Seus Links de Indicação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {links.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Share2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <p>Nenhum link de indicação ainda.</p>
                    <p className="text-sm">Entre em contato com o suporte para criar seus links.</p>
                  </div>
                ) : (
                  links.map((link) => (
                    <div 
                      key={link.id} 
                      className="bg-secondary/30 rounded-xl p-4 border border-white/5"
                      data-testid={`affiliate-link-${link.id}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{link.name}</span>
                          {link.isActive ? (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">Ativo</Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 text-xs">Inativo</Badge>
                          )}
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-primary hover:text-primary/80"
                          onClick={() => copyLink(link.url)}
                          data-testid={`button-copy-link-${link.id}`}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Input 
                          value={`${window.location.origin}${link.url}`}
                          readOnly 
                          className="bg-background/50 border-white/10 text-sm font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <p className="text-gray-400">Cliques</p>
                          <p className="font-bold text-white">{link.clicks}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Registros</p>
                          <p className="font-bold text-white">{link.registrations}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Conversões</p>
                          <p className="font-bold text-white">{link.conversions}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Sua Comissão
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                  <p className="text-sm text-gray-400 mb-1">Modelo</p>
                  <p className="text-lg font-bold text-white">
                    {affiliate.commissionType === "CPA" && "CPA (Custo por Aquisição)"}
                    {affiliate.commissionType === "REV_SHARE" && "Revenue Share"}
                    {affiliate.commissionType === "HYBRID" && "Híbrido (CPA + RevShare)"}
                  </p>
                </div>

                {(affiliate.commissionType === "CPA" || affiliate.commissionType === "HYBRID") && (
                  <div className="bg-secondary/30 rounded-xl p-4 border border-white/5">
                    <p className="text-sm text-gray-400 mb-1">Valor CPA</p>
                    <p className="text-xl font-bold text-green-400">
                      {formatCurrency(affiliate.cpaValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">por conversão qualificada</p>
                  </div>
                )}

                {(affiliate.commissionType === "REV_SHARE" || affiliate.commissionType === "HYBRID") && (
                  <div className="bg-secondary/30 rounded-xl p-4 border border-white/5">
                    <p className="text-sm text-gray-400 mb-1">Revenue Share</p>
                    <p className="text-xl font-bold text-blue-400">
                      {affiliate.revsharePercentage}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">do lucro líquido</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Resumo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">Total Registros</span>
                  <span className="font-bold text-white">{stats.totalRegistrations}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">Total Conversões</span>
                  <span className="font-bold text-white">{stats.totalConversions}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-400">Taxa de Conversão</span>
                  <span className="font-bold text-white">{stats.conversionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Total Pago</span>
                  <span className="font-bold text-green-400">{formatCurrency(stats.paidBalance)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
