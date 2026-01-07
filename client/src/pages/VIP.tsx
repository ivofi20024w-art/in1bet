import { MainLayout } from "@/components/layout/MainLayout";
import { Progress } from "@/components/ui/progress";
import { Crown, Star, Check, Gift, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import vipHero from "@assets/generated_images/vip_program_luxury_gold_and_black_card.png";

interface LevelInfo {
  level: number;
  xp: number;
  xpProgress: number;
  xpNeeded: number;
  progressPercent: number;
  totalWagered: number;
  vipLevel: string;
  dailyBox: {
    type: string;
    value: number;
    description: string;
  };
  canClaimDailyBox: boolean;
}

const VIP_LEVELS = [
  {
    level: "Bronze",
    minLevel: 1,
    color: "text-amber-600",
    benefits: [
      "Caixa diária básica",
      "Bônus de nível a cada 10 níveis",
      "Atendimento padrão",
      "Apostas em todos os jogos",
    ],
  },
  {
    level: "Silver",
    minLevel: 50,
    color: "text-gray-300",
    benefits: [
      "Caixa diária 2x maior",
      "Cashback semanal 5%",
      "Saques prioritários",
      "Gerente de conta",
    ],
  },
  {
    level: "Gold",
    minLevel: 100,
    color: "text-yellow-400",
    benefits: [
      "Caixa diária 3x maior",
      "Cashback semanal 10%",
      "Bônus exclusivos mensais",
      "Limites de saque maiores",
    ],
  },
  {
    level: "Platinum",
    minLevel: 300,
    color: "text-cyan-400",
    benefits: [
      "Caixa diária 5x maior",
      "Cashback semanal 15%",
      "Convites para eventos VIP",
      "Atendimento 24/7 exclusivo",
    ],
  },
  {
    level: "Diamond",
    minLevel: 500,
    color: "text-purple-400",
    benefits: [
      "Caixa diária 10x maior",
      "Cashback semanal 20%",
      "Viagens e experiências exclusivas",
      "Sem limites de saque",
    ],
  },
];

export default function VIP() {
  const { data: levelInfo, isLoading } = useQuery<LevelInfo>({
    queryKey: ["/api/levels/info"],
    retry: false,
  });
  
  const getCurrentVipTier = (level: number) => {
    for (let i = VIP_LEVELS.length - 1; i >= 0; i--) {
      if (level >= VIP_LEVELS[i].minLevel) {
        return VIP_LEVELS[i];
      }
    }
    return VIP_LEVELS[0];
  };
  
  const getNextVipTier = (level: number) => {
    for (const tier of VIP_LEVELS) {
      if (level < tier.minLevel) {
        return tier;
      }
    }
    return null;
  };
  
  const currentLevel = levelInfo?.level || 1;
  const currentTier = getCurrentVipTier(currentLevel);
  const nextTier = getNextVipTier(currentLevel);
  const levelsToNext = nextTier ? nextTier.minLevel - currentLevel : 0;
  const progressToNext = nextTier 
    ? ((currentLevel - (VIP_LEVELS.find(v => v.level === currentTier.level)?.minLevel || 1)) / 
       (nextTier.minLevel - (VIP_LEVELS.find(v => v.level === currentTier.level)?.minLevel || 1))) * 100
    : 100;
  
  return (
    <MainLayout>
      <div className="relative h-80 rounded-2xl overflow-hidden mb-12">
        <img src={vipHero} alt="VIP Banner" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
          <Crown className="w-16 h-16 text-yellow-500 mb-4 animate-pulse" />
          <h1 className="text-5xl font-heading font-bold text-white mb-4 tracking-wider">CLUBE VIP</h1>
          <p className="text-gray-300 max-w-lg text-lg">Desbloqueie recompensas exclusivas, atendimento prioritário e experiências únicas.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-card border border-white/10 rounded-2xl p-8 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Star className="w-64 h-64" />
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-muted-foreground mb-1">Seu Nível</p>
                <div className="flex items-center gap-3">
                  <h2 className={`text-3xl font-bold ${currentTier.color}`}>
                    {currentTier.level}
                  </h2>
                  <span className="text-2xl font-bold text-white">
                    (Lv. {currentLevel})
                  </span>
                </div>
              </div>
              {nextTier && (
                <div className="text-right">
                  <p className="text-muted-foreground mb-1">Próximo Nível VIP</p>
                  <h2 className={`text-xl font-bold ${nextTier.color}`}>{nextTier.level}</h2>
                </div>
              )}
            </div>
            
            <Progress value={progressToNext} className="h-4 bg-secondary" />
            
            {nextTier ? (
              <p className="text-xs text-muted-foreground mt-2 text-right">
                Faltam {levelsToNext} níveis para {nextTier.level}
              </p>
            ) : (
              <p className="text-xs text-primary mt-2 text-right font-bold">
                Você está no nível máximo!
              </p>
            )}
            
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link href="/levels">
                <Button className="w-full sm:w-auto" data-testid="link-view-levels">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Ver Progresso Completo
                </Button>
              </Link>
              
              {levelInfo?.canClaimDailyBox && (
                <Link href="/levels">
                  <Button variant="outline" className="w-full sm:w-auto border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10">
                    <Gift className="w-4 h-4 mr-2" />
                    Resgatar Caixa Diária
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">Níveis VIP e Benefícios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {VIP_LEVELS.map((level) => {
            const isActive = currentLevel >= level.minLevel;
            const isCurrent = currentTier.level === level.level;
            return (
              <div 
                key={level.level} 
                className={`bg-card border border-white/5 rounded-xl p-6 hover:border-white/20 transition-colors ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`text-xl font-heading font-bold ${isActive ? level.color : 'text-gray-600'}`}>
                    {level.level}
                  </h3>
                  {isCurrent && <Crown className="w-4 h-4 text-yellow-500" />}
                </div>
                <p className="text-xs text-gray-500 mb-4">Nível {level.minLevel}+</p>
                <ul className="space-y-2">
                  {level.benefits.map((benefit, i) => (
                    <li key={i} className={`flex items-start gap-2 text-xs ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>
                      <Check className={`w-3 h-3 shrink-0 mt-0.5 ${isActive ? 'text-primary' : 'text-gray-600'}`} />
                      {benefit}
                    </li>
                  ))}
                </ul>
                {isCurrent && (
                  <div className="mt-4 text-center text-xs font-bold text-primary bg-primary/10 py-2 rounded">
                    SEU NÍVEL
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-12 bg-gradient-to-r from-primary/20 to-yellow-500/20 rounded-2xl p-8 border border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Como Subir de Nível?</h3>
              <p className="text-gray-400">
                Jogue seus jogos favoritos e ganhe XP automaticamente. Cada R$ 1,00 apostado = 10 XP.
              </p>
            </div>
            <Link href="/casino">
              <Button size="lg" className="whitespace-nowrap">
                Jogar Agora
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
