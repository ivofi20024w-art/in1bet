import { MainLayout } from "@/components/layout/MainLayout";
import { VIP_LEVELS, USER } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";
import { Crown, Star, Check } from "lucide-react";
import vipHero from "@assets/generated_images/vip_program_luxury_gold_and_black_card.png";

export default function VIP() {
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
                        <p className="text-muted-foreground mb-1">Nível Atual</p>
                        <h2 className="text-3xl font-bold text-primary">{USER.vipLevel}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-muted-foreground mb-1">Próximo Nível</p>
                        <h2 className="text-xl font-bold text-white">Platina</h2>
                    </div>
                </div>
                
                <Progress value={65} className="h-4 bg-secondary" />
                <p className="text-xs text-muted-foreground mt-2 text-right">Faltam 350 pontos para subir de nível</p>
             </div>
        </div>

        <h2 className="text-2xl font-bold mb-6 text-center">Níveis e Benefícios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {VIP_LEVELS.map((level) => (
                <div key={level.level} className={`bg-card border border-white/5 rounded-xl p-6 hover:border-white/20 transition-colors ${level.level === USER.vipLevel ? 'ring-2 ring-primary' : ''}`}>
                    <h3 className={`text-2xl font-heading font-bold mb-4 ${level.color}`}>{level.level}</h3>
                    <ul className="space-y-3">
                        {level.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                                <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                {benefit}
                            </li>
                        ))}
                    </ul>
                    {level.level === USER.vipLevel && (
                        <div className="mt-6 text-center text-xs font-bold text-primary bg-primary/10 py-2 rounded">SEU NÍVEL</div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </MainLayout>
  );
}
