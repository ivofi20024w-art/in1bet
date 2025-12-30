import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Rocket, Star } from "lucide-react";
import { Link } from "wouter";
import Autoplay from "embla-carousel-autoplay";

// Images
import welcomeBanner from "@assets/generated_images/casino_welcome_bonus_banner_with_neon_lights.png";
import cashbackBanner from "@assets/generated_images/weekly_cashback_promo_banner.png";
import dropsBanner from "@assets/generated_images/drops_and_wins_tournament_banner.png";

const BANNERS = [
  { id: 1, img: welcomeBanner, title: "BÔNUS DE BOAS-VINDAS", subtitle: "100% até R$ 500 no primeiro depósito", cta: "PEGAR BÔNUS", link: "/wallet" },
  { id: 2, img: cashbackBanner, title: "CASHBACK SEMANAL", subtitle: "Receba até 10% das suas perdas de volta", cta: "SAIBA MAIS", link: "/wallet" },
  { id: 3, img: dropsBanner, title: "JOGAR MINES", subtitle: "Jogo exclusivo IN1Bet com dinheiro real", cta: "JOGAR AGORA", link: "/games/mines" },
];

const ORIGINALS = [
  { id: "mines", name: "Mines", image: "https://images.unsplash.com/photo-1615858603610-8356165d496e?q=80&w=600&auto=format&fit=crop", link: "/games/mines", color: "from-blue-500 to-indigo-600", icon: Star },
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

      {/* Quick Navigation */}
      <section className="mb-10">
        <div className="flex gap-3">
          <Link href="/games/mines">
            <Button className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-white transition-all gap-2 px-8 font-bold shadow-lg shadow-primary/20">
              <Star className="w-4 h-4" />
              Jogar Mines
            </Button>
          </Link>
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

      {/* Call to Action */}
      <section className="mb-12">
        <div className="relative h-56 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-900 to-indigo-900 border border-white/10 shadow-2xl group">
            <div className="absolute inset-0 flex items-center justify-between p-8 md:p-12 z-10">
                <div className="max-w-lg space-y-4">
                    <h3 className="text-3xl md:text-5xl font-heading font-black text-white italic leading-none">JOGUE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">MINES</span></h3>
                    <p className="text-gray-300 max-w-sm text-sm md:text-base font-medium">Nosso jogo exclusivo com dinheiro real, provably fair e 99% de RTP.</p>
                    <Link href="/games/mines">
                      <Button className="bg-white text-blue-900 hover:bg-gray-100 font-bold rounded-full px-8 h-12 shadow-lg transition-transform hover:scale-105">
                          Jogar Agora
                      </Button>
                    </Link>
                </div>
            </div>
            
            <Star className="absolute -bottom-12 -right-12 w-64 h-64 text-white/5" />
        </div>
      </section>

    </MainLayout>
  );
}
