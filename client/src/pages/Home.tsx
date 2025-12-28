import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { OddsCard } from "@/components/shared/OddsCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CASINO_GAMES, SPORTS_MATCHES } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import casinoHero from "@assets/generated_images/premium_3d_casino_chips_and_cards_with_neon_orange_lighting.png";
import sportsHero from "@assets/generated_images/professional_soccer_stadium_night_scene_with_floodlights.png";

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group cursor-pointer">
          <img src={casinoHero} alt="Casino" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-8 flex flex-col justify-center items-start">
            <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full mb-4 animate-pulse">BÔNUS 100%</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2 leading-tight">CASINO <br/>PREMIUM</h2>
            <p className="text-gray-300 mb-6 max-w-xs">Jogue os melhores slots e jogos ao vivo com dealers reais.</p>
            <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-8 font-bold">JOGAR AGORA</Button>
          </div>
        </div>

        <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden group cursor-pointer">
          <img src={sportsHero} alt="Sports" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent p-8 flex flex-col justify-center items-start">
             <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">AO VIVO</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-2 leading-tight">APOSTAS <br/>ESPORTIVAS</h2>
            <p className="text-gray-300 mb-6 max-w-xs">As melhores odds do mercado para Brasileirão e Champions.</p>
            <Button className="bg-primary text-white hover:bg-primary/90 rounded-full px-8 font-bold border-none">APOSTAR</Button>
          </div>
        </div>
      </div>

      {/* Live Sports Section */}
      <section>
        <SectionHeader title="Destaques Ao Vivo" link="/sports" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SPORTS_MATCHES.map(match => (
            <OddsCard key={match.id} {...match} />
          ))}
        </div>
      </section>

      {/* Casino Highlights */}
      <section>
        <SectionHeader title="Jogos Populares" link="/casino" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CASINO_GAMES.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
