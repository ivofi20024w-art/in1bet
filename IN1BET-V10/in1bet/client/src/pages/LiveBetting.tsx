import { MainLayout } from "@/components/layout/MainLayout";
import { OddsCard } from "@/components/shared/OddsCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SPORTS_MATCHES } from "@/lib/mockData";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trophy, Clock, Signal, Radio } from "lucide-react";
import sportsHero from "@assets/generated_images/professional_soccer_stadium_night_scene_with_floodlights.png";
import { BetSlip } from "@/components/betting/BetSlip";

export default function LiveBetting() {
  const liveMatches = SPORTS_MATCHES.filter(m => m.isLive);

  return (
    <MainLayout>
      <div className="relative h-64 rounded-2xl overflow-hidden mb-8 shadow-2xl">
        <img src={sportsHero} alt="Live Betting Banner" className="absolute inset-0 w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-8">
          <div className="flex items-center gap-3 mb-2">
             <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded text-white text-xs font-bold uppercase tracking-wider animate-pulse">
                <Radio className="w-3 h-3" /> Ao Vivo
             </div>
             <span className="text-white/80 text-sm font-bold flex items-center gap-1">
                <Signal className="w-3 h-3 text-green-500" /> Conexão Estável
             </span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Apostas em Tempo Real</h1>
          <p className="text-gray-300 max-w-lg">Acompanhe estatísticas dinâmicas e aposte enquanto a ação acontece com odds atualizadas a cada segundo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex items-center justify-between mb-6">
                <SectionHeader title="Eventos Ao Vivo" />
                <div className="flex gap-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">Futebol (4)</span>
                    <span className="text-xs font-bold text-muted-foreground hover:text-white bg-secondary/30 px-2 py-1 rounded cursor-pointer">Basquete (0)</span>
                    <span className="text-xs font-bold text-muted-foreground hover:text-white bg-secondary/30 px-2 py-1 rounded cursor-pointer">Tênis (0)</span>
                </div>
            </div>
            
            <div className="space-y-4">
              {liveMatches.length > 0 ? (
                liveMatches.map(match => (
                  <OddsCard key={match.id} {...match} />
                ))
              ) : (
                <div className="text-center py-12 bg-card border border-white/5 rounded-xl">
                    <p className="text-muted-foreground">Nenhum evento ao vivo no momento.</p>
                </div>
              )}
               {/* Duplicating for mock volume */}
               {liveMatches.map(match => (
                  <OddsCard key={`${match.id}-dup`} {...match} />
                ))}
            </div>
          </section>
        </div>

        <div className="hidden lg:block space-y-6">
          <div className="bg-card border border-white/5 rounded-xl sticky top-24 overflow-hidden shadow-xl h-[calc(100vh-8rem)]">
            <BetSlip />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
