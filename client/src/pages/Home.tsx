import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { CASINO_GAMES } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Rocket, Gamepad2, Trophy, Flame, Play, Star, Sparkles, TrendingUp, Zap } from "lucide-react";
import { Link } from "wouter";
import Autoplay from "embla-carousel-autoplay";

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
  { id: "crash", name: "Crashmania", image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop", link: "/games/crash", color: "from-orange-500 to-red-600", icon: Rocket },
  { id: "double", name: "Double", image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?q=80&w=600&auto=format&fit=crop", link: "/games/double", color: "from-red-600 to-black", icon: Zap },
  { id: "mines", name: "Mines", image: "https://images.unsplash.com/photo-1615858603610-8356165d496e?q=80&w=600&auto=format&fit=crop", link: "/games/mines", color: "from-blue-500 to-indigo-600", icon: Star },
  { id: "plinko", name: "Plinko", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop", link: "/games/plinko", color: "from-green-500 to-green-700", icon: Gamepad2 },
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
        <Carousel className="w-full" opts={{ loop: true }} plugins={[Autoplay({ delay: 5000 })]}>
          <CarouselContent>
            {BANNERS.map((banner) => (
              <CarouselItem key={banner.id}>
                <div className="relative h-[250px] md:h-[400px] w-full rounded-2xl overflow-hidden group shadow-2xl">
                  <img 
                    src={banner.img} 
                    alt={banner.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent p-6 md:p-12 flex flex-col justify-center items-start">
                    <Badge className="bg-primary text-white mb-4 animate-pulse px-3 py-1 font-bold tracking-wider">NOVIDADE</Badge>
                    <h2 className="text-3xl md:text-6xl font-heading font-black text-white mb-2 leading-tight drop-shadow-lg max-w-lg italic">
                      {banner.title}
                    </h2>
                    <p className="text-gray-200 mb-8 max-w-md text-sm md:text-xl font-medium drop-shadow-md">
                      {banner.subtitle}
                    </p>
                    <Button asChild className="bg-white text-black hover:bg-gray-200 rounded-full px-8 h-12 md:h-14 font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all hover:scale-105">
                      <Link href={banner.link}>
                        {banner.cta}
                      </Link>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="left-4 bg-black/30 backdrop-blur border-none text-white hover:bg-primary h-12 w-12" />
            <CarouselNext className="right-4 bg-black/30 backdrop-blur border-none text-white hover:bg-primary h-12 w-12" />
          </div>
        </Carousel>
      </section>

      {/* Quick Navigation / Categories */}
      <section className="mb-10 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-3 min-w-max">
          {CATEGORIES.map((cat) => (
            <Button 
              key={cat.id} 
              variant="outline" 
              className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-primary hover:border-primary hover:text-white transition-all gap-2 px-6 font-bold"
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </Button>
          ))}
        </div>
      </section>

      {/* IN1Bet Originals - Revamped */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/20 rounded-lg">
                    <Rocket className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-heading font-bold italic text-white leading-none">IN1BET <span className="text-primary">ORIGINALS</span></h2>
                    <p className="text-xs text-muted-foreground">Jogos exclusivos com RTP de 99%</p>
                </div>
            </div>
            <Link href="/casino" className="text-sm font-bold text-primary hover:text-white transition-colors">Ver todos</Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ORIGINALS.map((game) => (
            <Link key={game.id} href={game.link}>
                <div className="group relative h-48 md:h-64 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-1 duration-300">
                    {/* Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.color} transition-transform duration-500 opacity-80 group-hover:opacity-100`} />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                    
                    {/* Icon Bg */}
                    <game.icon className="absolute -bottom-8 -right-8 w-40 h-40 text-black/20 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                        <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-3 shadow-inner border border-white/20 group-hover:scale-110 transition-transform">
                            <game.icon className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-heading font-black text-white italic drop-shadow-md mb-1">{game.name}</h3>
                        <Badge variant="secondary" className="bg-black/30 backdrop-blur-md text-white border-none text-[10px]">99% RTP</Badge>
                        
                        <Button size="sm" className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-black hover:bg-gray-100 font-bold rounded-full px-6">
                            JOGAR
                        </Button>
                    </div>
                </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Slots */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Flame className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-heading font-bold text-white leading-none">Slots Populares</h2>
                    <p className="text-xs text-muted-foreground">Os jogos mais quentes do momento</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-white/10 hover:bg-white/10"><Sparkles className="w-4 h-4" /></Button>
            </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {CASINO_GAMES.map(game => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </section>

       {/* Live Casino Banner */}
       <section className="mb-12">
        <div className="relative h-56 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900 to-indigo-900 border border-white/10 shadow-2xl group cursor-pointer">
            <div className="absolute inset-0 flex items-center justify-between p-8 md:p-12 z-10">
                <div className="max-w-lg space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded">Ao Vivo Agora</span>
                    </div>
                    <h3 className="text-3xl md:text-5xl font-heading font-black text-white italic leading-none">CASINO <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">AO VIVO</span></h3>
                    <p className="text-gray-300 max-w-sm text-sm md:text-base font-medium">Sinta a emoção de Las Vegas na palma da sua mão com dealers reais 24/7.</p>
                    <Button className="bg-white text-purple-900 hover:bg-gray-100 font-bold rounded-full px-8 h-12 shadow-lg transition-transform hover:scale-105">
                        Entrar no Lobby
                    </Button>
                </div>
            </div>
            
            {/* Background Image / Decorative */}
            <div className="absolute right-0 top-0 bottom-0 w-2/3 md:w-1/2 bg-[url('https://images.unsplash.com/photo-1605901309584-818e25960b8f?q=80&w=1000')] bg-cover bg-center opacity-30 mask-fade-left transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      </section>
      
      {/* Recent Big Wins */}
      <section className="bg-card/50 border border-white/5 rounded-xl p-4 mb-8 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="font-bold text-sm text-white">Últimos Ganhadores</span>
        </div>
        <div className="overflow-hidden relative h-8">
            <div className="flex items-center gap-8 animate-marquee whitespace-nowrap absolute top-0">
                {[1,2,3,4,5,6,7,8,9,10].map((i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px]">👑</span>
                        <span className="text-gray-400 font-bold">user***{i}9</span>
                        <span className="text-green-400 font-bold bg-green-500/10 px-1.5 rounded">R$ {(Math.random() * 5000 + 100).toFixed(2)}</span>
                        <span className="text-gray-600 text-xs">- Sweet Bonanza</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

    </MainLayout>
  );
}
