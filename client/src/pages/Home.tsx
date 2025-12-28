import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CASINO_GAMES } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Rocket, Gamepad2, Trophy, Flame, Play, Star } from "lucide-react";
import { Link } from "wouter";

// Images
import welcomeBanner from "@assets/generated_images/casino_welcome_bonus_banner_with_neon_lights.png";
import cashbackBanner from "@assets/generated_images/weekly_cashback_promo_banner.png";
import dropsBanner from "@assets/generated_images/drops_and_wins_tournament_banner.png";

const BANNERS = [
  { id: 1, img: welcomeBanner, title: "BÔNUS DE BOAS-VINDAS", subtitle: "100% até R$ 500 no primeiro depósito", cta: "PEGAR BÔNUS", link: "/promotions" },
  { id: 2, img: cashbackBanner, title: "CASHBACK SEMANAL", subtitle: "Receba até 10% das suas perdas de volta", cta: "SAIBA MAIS", link: "/promotions" },
  { id: 3, img: dropsBanner, title: "DROPS & WINS", subtitle: "Prêmios diários e torneios semanais", cta: "PARTICIPAR", link: "/casino" },
];

const ORIGINALS = [
  { id: "crash", name: "Crashmania", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop", link: "/games/crash", color: "from-orange-500 to-red-600" },
  { id: "double", name: "Double", image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=600&auto=format&fit=crop", link: "/games/double", color: "from-red-600 to-black" },
  { id: "mines", name: "Mines", image: "https://images.unsplash.com/photo-1615858603610-8356165d496e?q=80&w=600&auto=format&fit=crop", link: "/games/mines", color: "from-blue-500 to-indigo-600" },
];

const CATEGORIES = [
  { id: "lobby", label: "Lobby", icon: Gamepad2 },
  { id: "slots", label: "Slots", icon: Flame },
  { id: "live", label: "Ao Vivo", icon: Play },
  { id: "originals", label: "Originais", icon: Rocket },
  { id: "favorites", label: "Favoritos", icon: Star },
];

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Carousel */}
      <section className="mb-8">
        <Carousel className="w-full" opts={{ loop: true }}>
          <CarouselContent>
            {BANNERS.map((banner) => (
              <CarouselItem key={banner.id}>
                <div className="relative h-[200px] md:h-[350px] w-full rounded-2xl overflow-hidden group">
                  <img 
                    src={banner.img} 
                    alt={banner.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent p-6 md:p-12 flex flex-col justify-center items-start">
                    <Badge className="bg-primary text-white mb-4 animate-pulse px-3 py-1">NOVIDADE</Badge>
                    <h2 className="text-3xl md:text-5xl font-heading font-black text-white mb-2 leading-tight drop-shadow-lg max-w-lg">
                      {banner.title}
                    </h2>
                    <p className="text-gray-200 mb-6 max-w-md text-sm md:text-lg font-medium drop-shadow-md">
                      {banner.subtitle}
                    </p>
                    <Link href={banner.link}>
                      <Button className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-12 font-bold shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        {banner.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="left-4 bg-black/50 border-none text-white hover:bg-primary" />
            <CarouselNext className="right-4 bg-black/50 border-none text-white hover:bg-primary" />
          </div>
        </Carousel>
      </section>

      {/* Quick Navigation / Categories */}
      <section className="mb-8 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-3 min-w-max">
          {CATEGORIES.map((cat) => (
            <Button 
              key={cat.id} 
              variant="outline" 
              className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-primary hover:border-primary hover:text-white transition-all gap-2 px-6"
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </Button>
          ))}
        </div>
      </section>

      {/* IN1Bet Originals */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-6">
          <Rocket className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-heading font-bold italic text-white">IN1BET <span className="text-primary">ORIGINALS</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ORIGINALS.map((game) => (
            <Link key={game.id} href={game.link}>
              <div className={`relative h-48 rounded-2xl overflow-hidden cursor-pointer group bg-gradient-to-br ${game.color} p-1`}>
                 <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10" />
                 
                 {/* Content */}
                 <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                    <h3 className="text-4xl font-heading font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] italic transform -rotate-3 group-hover:scale-110 transition-transform duration-300">
                        {game.name}
                    </h3>
                    <Button size="sm" className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-black font-bold rounded-full">
                        JOGAR AGORA
                    </Button>
                 </div>

                 {/* Background Effect */}
                 <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: `url(${game.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Slots */}
      <section className="mb-10">
        <SectionHeader title="Slots Populares" link="/casino" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CASINO_GAMES.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

       {/* Live Casino Banner */}
       <section className="mb-10">
        <div className="relative h-48 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900 to-indigo-900 border border-white/10">
            <div className="absolute inset-0 flex items-center justify-between p-8 md:p-12">
                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Ao Vivo Agora</span>
                    </div>
                    <h3 className="text-3xl font-heading font-bold text-white mb-4">Experiência Real de Casino</h3>
                    <p className="text-gray-300 mb-6 max-w-xs text-sm">Jogue Roleta, Blackjack e Baccarat com dealers profissionais em tempo real.</p>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold rounded-full px-6">Entrar no Lobby</Button>
                </div>
                {/* Decorative Elements */}
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[url('https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mask-fade-left" />
            </div>
        </div>
      </section>
      
      {/* Recent Big Wins (Mock Ticker) */}
      <section className="bg-white/5 border-y border-white/5 -mx-4 md:-mx-8 py-3 mb-8 overflow-hidden">
        <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
            {[1,2,3,4,5,6,7,8].map((i) => (
                <div key={i} className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-400 text-xs font-bold">joao***99</span>
                    <span className="text-green-400 font-bold text-sm">ganhou R$ {(Math.random() * 5000).toFixed(2)}</span>
                    <span className="text-gray-600 text-xs">em Sweet Bonanza</span>
                </div>
            ))}
        </div>
      </section>

    </MainLayout>
  );
}
