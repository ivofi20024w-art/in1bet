import { MainLayout } from "@/components/layout/MainLayout";
import { OddsCard } from "@/components/shared/OddsCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SPORTS_MATCHES } from "@/lib/mockData";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MonitorPlay, Trophy } from "lucide-react";
import virtualHero from "@assets/generated_images/virtual_soccer_match_computer_graphics_style.png";

export default function VirtualSports() {
  // Mock virtual matches based on sports matches
  const virtualMatches = SPORTS_MATCHES.map(m => ({
      ...m, 
      id: m.id + 100, 
      league: "Copa Virtual", 
      time: "Virtual 12'",
      isLive: true
  }));

  return (
    <MainLayout>
      <div className="relative h-64 rounded-2xl overflow-hidden mb-8">
        <img src={virtualHero} alt="Virtual Sports Banner" className="absolute inset-0 w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-8">
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Desportos Virtuais</h1>
          <p className="text-gray-300">Jogos a cada 3 minutos. Resultados instantâneos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative group">
                {/* Mock Video Player */}
                <img src={virtualHero} className="w-full h-full object-cover opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <MonitorPlay className="w-16 h-16 text-white/50" />
                </div>
                <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded text-white font-mono text-sm">
                    AO VIVO: COPA VIRTUAL
                </div>
            </div>

          <section>
            <SectionHeader title="Próximos Eventos Virtuais" />
            <div className="space-y-4">
              {virtualMatches.map(match => (
                <OddsCard key={match.id} {...match} />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-white/5 rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              Ligas Virtuais
            </h3>
            <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 rounded-lg bg-primary/10 text-primary border border-primary/20 font-medium">Futebol Virtual</button>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">Corrida de Cavalos</button>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">Greyhounds</button>
                <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/5 transition-colors">Speedway</button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
