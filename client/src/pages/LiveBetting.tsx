import { MainLayout } from "@/components/layout/MainLayout";
import { OddsCard } from "@/components/shared/OddsCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SPORTS_MATCHES } from "@/lib/mockData";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trophy, Clock } from "lucide-react";
import sportsHero from "@assets/generated_images/professional_soccer_stadium_night_scene_with_floodlights.png";

export default function LiveBetting() {
  const liveMatches = SPORTS_MATCHES.filter(m => m.isLive);

  return (
    <MainLayout>
      <div className="relative h-64 rounded-2xl overflow-hidden mb-8">
        <img src={sportsHero} alt="Live Betting Banner" className="absolute inset-0 w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-8">
          <div className="flex items-center gap-2 mb-2">
             <span className="bg-red-500 animate-pulse w-3 h-3 rounded-full" />
             <span className="text-red-400 font-bold uppercase tracking-widest text-sm">Ao Vivo</span>
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Apostas em Tempo Real</h1>
          <p className="text-gray-300">Acompanhe e aposte enquanto a ação acontece.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <SectionHeader title="Eventos Ao Vivo" />
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

        <div className="space-y-6">
          <div className="bg-card border border-white/5 rounded-xl p-6 sticky top-24">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Boletim Rápido
            </h3>
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed border-white/5 rounded-lg bg-secondary/20">
              <p className="text-sm">Selecione uma odd</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
