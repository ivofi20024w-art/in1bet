import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Percent, Coins, RefreshCw, Clock, Loader2, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

import welcomeBanner from "@assets/generated_images/casino_welcome_bonus_banner_with_neon_lights.png";
import cashbackBanner from "@assets/generated_images/weekly_cashback_promo_banner.png";
import dropsBanner from "@assets/generated_images/drops_and_wins_tournament_banner.png";

interface AvailableBonus {
  id: string;
  name: string;
  description: string | null;
  type: string;
  percentage: number;
  maxValue: number;
  rolloverMultiplier: number;
  minDeposit: number;
  isFirstDepositOnly: boolean;
}

interface UserBonus {
  id: string;
  bonusName: string;
  bonusAmount: number;
  rolloverTotal: number;
  rolloverRemaining: number;
  rolloverProgress: number;
  status: string;
  expiresAt: string | null;
  createdAt: string;
}

const PROMO_IMAGES: Record<string, string> = {
  "FIRST_DEPOSIT": welcomeBanner,
  "DEPOSIT": cashbackBanner,
  "NO_DEPOSIT": dropsBanner,
  "RELOAD": cashbackBanner,
};

const TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  "FIRST_DEPOSIT": { label: "Primeiro Depósito", color: "bg-green-500", icon: Gift },
  "DEPOSIT": { label: "Depósito", color: "bg-blue-500", icon: Coins },
  "NO_DEPOSIT": { label: "Sem Depósito", color: "bg-purple-500", icon: Star },
  "RELOAD": { label: "Recarga", color: "bg-orange-500", icon: RefreshCw },
  "CASHBACK": { label: "Cashback", color: "bg-yellow-500", icon: Percent },
};

async function fetchAvailableBonuses(): Promise<AvailableBonus[]> {
  const res = await fetch('/api/bonus/available', { credentials: 'include' });
  const data = await res.json();
  return data.bonuses || [];
}

async function fetchMyBonuses(): Promise<UserBonus[]> {
  const res = await fetch('/api/bonus/my-bonuses', { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.bonuses || [];
}

function BonusCard({ bonus }: { bonus: AvailableBonus }) {
  const typeConfig = TYPE_LABELS[bonus.type] || TYPE_LABELS["DEPOSIT"];
  const image = PROMO_IMAGES[bonus.type] || cashbackBanner;
  const Icon = typeConfig.icon;
  
  return (
    <div className="bg-card border border-white/5 rounded-xl overflow-hidden hover:border-primary/50 transition-all group" data-testid={`bonus-card-${bonus.id}`}>
      <div className="h-48 overflow-hidden relative">
        <img src={image} alt={bonus.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        <Badge className={cn("absolute top-3 left-3", typeConfig.color, "text-white border-none")}>
          <Icon className="w-3 h-3 mr-1" />
          {typeConfig.label}
        </Badge>
        {bonus.isFirstDepositOnly && (
          <Badge className="absolute top-3 right-3 bg-yellow-500 text-black border-none">
            <Zap className="w-3 h-3 mr-1" />
            Exclusivo
          </Badge>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2">{bonus.name}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{bonus.description || "Aproveite esta oferta especial!"}</p>
        
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Bônus</span>
            <span className="text-white font-bold">{bonus.percentage}% até R$ {bonus.maxValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Depósito mínimo</span>
            <span className="text-white">R$ {bonus.minDeposit.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Rollover</span>
            <span className="text-white">{bonus.rolloverMultiplier}x</span>
          </div>
        </div>
        
        <Button asChild className="w-full bg-primary hover:bg-primary/90">
          <Link href="/wallet">
            Depositar e Ativar
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ActiveBonusCard({ bonus }: { bonus: UserBonus }) {
  const isExpiringSoon = bonus.expiresAt && new Date(bonus.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  return (
    <Card className="bg-card/50 border-primary/30" data-testid={`active-bonus-${bonus.id}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{bonus.bonusName}</CardTitle>
          <Badge variant={bonus.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {bonus.status === 'ACTIVE' ? 'Ativo' : bonus.status}
          </Badge>
        </div>
        <CardDescription>R$ {bonus.bonusAmount.toFixed(2)} em bônus</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progresso do Rollover</span>
            <span className="text-white font-medium">{bonus.rolloverProgress}%</span>
          </div>
          <Progress value={bonus.rolloverProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            R$ {(bonus.rolloverTotal - bonus.rolloverRemaining).toFixed(2)} / R$ {bonus.rolloverTotal.toFixed(2)}
          </p>
        </div>
        
        {bonus.expiresAt && (
          <div className={cn("flex items-center gap-2 text-sm", isExpiringSoon ? "text-red-400" : "text-muted-foreground")}>
            <Clock className="w-4 h-4" />
            <span>Expira em {new Date(bonus.expiresAt).toLocaleDateString('pt-BR')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Promotions() {
  const { isAuthenticated } = useAuth();
  
  const { data: availableBonuses = [], isLoading: loadingAvailable } = useQuery({
    queryKey: ['available-bonuses'],
    queryFn: fetchAvailableBonuses,
    staleTime: 5 * 60 * 1000,
  });
  
  const { data: myBonuses = [], isLoading: loadingMy } = useQuery({
    queryKey: ['my-bonuses'],
    queryFn: fetchMyBonuses,
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
  
  const activeBonuses = myBonuses.filter(b => b.status === 'ACTIVE');

  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-white mb-2">Promoções & Bônus</h1>
        <p className="text-gray-400">Aproveite as melhores ofertas para aumentar suas chances de ganhar.</p>
      </div>

      {isAuthenticated && activeBonuses.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Seus Bônus Ativos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeBonuses.map((bonus) => (
              <ActiveBonusCard key={bonus.id} bonus={bonus} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          Ofertas Disponíveis
        </h2>
        
        {loadingAvailable ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : availableBonuses.length === 0 ? (
          <div className="text-center py-12 bg-card/30 rounded-xl border border-white/5">
            <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma promoção disponível</h3>
            <p className="text-muted-foreground">Volte em breve para conferir novas ofertas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableBonuses.map((bonus) => (
              <BonusCard key={bonus.id} bonus={bonus} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-12 bg-gradient-to-r from-primary/20 to-transparent rounded-2xl p-8 border border-primary/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Programa de Rakeback</h2>
            <p className="text-gray-400 max-w-lg">
              Receba de volta uma porcentagem das suas apostas toda semana. Quanto mais você joga, mais você recebe!
            </p>
          </div>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 rounded-full px-8">
            <Link href="/profile/rakeback">
              Ver Rakeback
            </Link>
          </Button>
        </div>
      </section>

      <section className="mt-8 bg-gradient-to-r from-purple-900/30 to-transparent rounded-2xl p-8 border border-purple-500/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Missões Diárias</h2>
            <p className="text-gray-400 max-w-lg">
              Complete missões e ganhe XP, bônus e recompensas exclusivas todos os dias!
            </p>
          </div>
          <Button asChild size="lg" variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 rounded-full px-8">
            <Link href="/profile/missions">
              Ver Missões
            </Link>
          </Button>
        </div>
      </section>
    </MainLayout>
  );
}
