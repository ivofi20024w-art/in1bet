import { MainLayout } from "@/components/layout/MainLayout";
import { OddsCard } from "@/components/shared/OddsCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { SPORTS_MATCHES } from "@/lib/mockData";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Trophy, Clock, CalendarDays } from "lucide-react";
import sportsHero from "@assets/generated_images/professional_soccer_stadium_night_scene_with_floodlights.png";

const CATEGORIES = [
  { id: 'soccer', name: 'Futebol', icon: Trophy },
  { id: 'basketball', name: 'Basquete', icon: Trophy },
  { id: 'tennis', name: 'Tênis', icon: Trophy },
  { id: 'esports', name: 'eSports', icon: Trophy },
];

export default function Sports() {
  return (
    <MainLayout>
      <div className="relative h-64 rounded-2xl overflow-hidden mb-8">
        <img src={sportsHero} alt="Sports Banner" className="absolute inset-0 w-full h-full object-cover" />
         <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 p-8">
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Sportsbook</h1>
          <p className="text-gray-300">As melhores odds para os maiores eventos do mundo.</p>
        </div>
      </div>

      <ScrollArea className="w-full whitespace-nowrap mb-8">
        <div className="flex w-max space-x-4">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              className="flex items-center space-x-2 rounded-xl border border-white/10 bg-card px-6 py-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <category.icon className="h-4 w-4" />
              <span>{category.name}</span>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <SectionHeader title="Ao Vivo Agora" />
            <div className="space-y-4">
              {SPORTS_MATCHES.filter(m => m.isLive).map(match => (
                <OddsCard key={match.id} {...match} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader title="Próximos Jogos" />
            <div className="space-y-4">
              {SPORTS_MATCHES.filter(m => !m.isLive).map(match => (
                <OddsCard key={match.id} {...match} />
              ))}
               {SPORTS_MATCHES.filter(m => !m.isLive).map(match => (
                <OddsCard key={`${match.id}-dup`} {...match} />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-white/5 rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Boletim de Apostas
            </h3>
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed border-white/5 rounded-lg bg-secondary/20">
              <p className="text-sm">Seu boletim está vazio</p>
              <p className="text-xs mt-1">Selecione odds para começar</p>
            </div>
          </div>
          
           <div className="bg-gradient-to-br from-primary to-orange-600 rounded-xl p-6 text-white">
            <h3 className="font-bold text-xl mb-2 font-heading">Oferta de Boas-vindas</h3>
            <p className="text-sm opacity-90 mb-4">Deposite agora e ganhe 100% de bônus até R$500.</p>
            <button className="w-full bg-white text-primary font-bold py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors">
              Resgatar Agora
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
