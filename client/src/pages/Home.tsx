import { MainLayout } from "@/components/layout/MainLayout";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Rocket, Gamepad2, Trophy, Flame, Play, Star, Sparkles, TrendingUp, Zap, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import Autoplay from "embla-carousel-autoplay";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import welcomeBanner from "@assets/ChatGPT_Image_9_01_2026,_00_04_04_1767917091901.png";
import cashbackBanner from "@assets/ChatGPT_Image_9_01_2026,_00_05_38_1767917230006.png";
import dropsBanner from "@assets/ChatGPT_Image_9_01_2026,_00_06_58_1767917234350.png";

interface PlayfiversGame {
  id: string;
  gameCode: string;
  name: string;
  imageUrl: string | null;
  providerName: string;
  isOriginal: boolean;
  gameType: string | null;
}

const BANNERS = [
  { id: 1, img: welcomeBanner, title: "BÔNUS DE BOAS-VINDAS", subtitle: "100% até R$ 500 no primeiro depósito", cta: "PEGAR BÔNUS", link: "/promotions" },
  { id: 2, img: cashbackBanner, title: "CASHBACK SEMANAL", subtitle: "Receba até 10% das suas perdas de volta", cta: "SAIBA MAIS", link: "/promotions" },
  { id: 3, img: dropsBanner, title: "DROPS & WINS", subtitle: "Prêmios diários e torneios semanais", cta: "PARTICIPAR", link: "/casino" },
];

const ORIGINALS = [
  { id: "crash", name: "Crashmania", link: "/games/crash", gradient: "from-[#FF6B1A] via-[#FF4D00] to-[#CC3D00]", icon: Rocket },
  { id: "double", name: "Double", link: "/games/double", gradient: "from-[#FF8C42] via-[#E06C20] to-[#B85518]", icon: Zap },
  { id: "mines", name: "Mines", link: "/games/mines", gradient: "from-[#FFA234] via-[#E87A10] to-[#C55A00]", icon: Star },
  { id: "plinko", name: "Plinko", link: "/games/plinko", gradient: "from-[#FFB347] via-[#FF8F00] to-[#D46A00]", icon: Gamepad2 },
];

const CATEGORIES = [
  { id: "lobby", label: "Lobby", icon: Gamepad2, link: "/" },
  { id: "slots", label: "Slots", icon: Flame, link: "/casino" },
  { id: "live", label: "Ao Vivo", icon: Play, link: "/live-casino" },
  { id: "originals", label: "Originais", icon: Rocket, link: "/originals" },
  { id: "favorites", label: "Favoritos", icon: Star, link: "/casino" },
];

async function fetchPopularGames(): Promise<PlayfiversGame[]> {
  const res = await fetch('/api/playfivers/games', { credentials: 'include' });
  const data = await res.json();
  if (!data.success) return [];
  return (data.data || []).slice(0, 12);
}

async function launchGame(params: { gameCode: string; providerName: string; isOriginal: boolean }): Promise<{ launchUrl: string }> {
  const res = await fetch('/api/playfivers/launch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Erro ao iniciar jogo");
  return data.data;
}

function GameCard({ game, onPlay }: { game: PlayfiversGame; onPlay: () => void }) {
  return (
    <div 
      onClick={onPlay}
      className="group relative rounded-xl overflow-hidden bg-card border border-white/5 hover:border-primary/50 transition-all cursor-pointer shadow-lg hover:shadow-primary/20 hover:-translate-y-1 duration-300"
      data-testid={`game-card-${game.gameCode}`}
    >
      <div className="aspect-[4/3] relative">
        <img 
          src={game.imageUrl || 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400'} 
          alt={game.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-bold text-white text-sm truncate">{game.name}</h3>
        <p className="text-xs text-muted-foreground truncate">{game.providerName}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: popularGames = [], isLoading } = useQuery({
    queryKey: ['playfivers-popular-games'],
    queryFn: fetchPopularGames,
    staleTime: 5 * 60 * 1000,
  });

  const launchMutation = useMutation({
    mutationFn: launchGame,
    onSuccess: (data) => {
      window.open(data.launchUrl, '_blank');
    },
    onError: (error: Error) => {
      if (error.message.includes('Authentication')) {
        toast({ title: "Login necessário", description: "Faça login para jogar", variant: "destructive" });
        setLocation('/login');
      } else {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      }
    },
  });

  const handlePlayGame = (game: PlayfiversGame) => {
    launchMutation.mutate({
      gameCode: game.gameCode,
      providerName: game.providerName,
      isOriginal: game.isOriginal,
    });
  };

  return (
    <MainLayout>
      <section className="mb-8">
        <Carousel className="w-full" opts={{ loop: true }} plugins={[Autoplay({ delay: 5000 })]}>
          <CarouselContent>
            {BANNERS.map((banner) => (
              <CarouselItem key={banner.id}>
                <Link href={banner.link}>
                  <div className="relative h-[250px] md:h-[400px] w-full rounded-2xl overflow-hidden group shadow-2xl cursor-pointer">
                    <img 
                      src={banner.img} 
                      alt={banner.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    />
                    <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10">
                      <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 h-12 md:h-14 font-bold text-lg shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all hover:scale-105">
                        {banner.cta}
                      </Button>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="left-4 bg-black/30 backdrop-blur border-none text-white hover:bg-primary h-12 w-12" />
            <CarouselNext className="right-4 bg-black/30 backdrop-blur border-none text-white hover:bg-primary h-12 w-12" />
          </div>
        </Carousel>
      </section>

      <section className="mb-10 overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-3 min-w-max">
          {CATEGORIES.map((cat) => (
            <Link key={cat.id} href={cat.link}>
              <Button 
                variant="outline" 
                className="h-12 rounded-xl border-white/10 bg-white/5 hover:bg-primary hover:border-primary hover:text-white transition-all gap-2 px-6 font-bold"
                data-testid={`category-${cat.id}`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </Button>
            </Link>
          ))}
        </div>
      </section>

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
            <Link href="/originals" className="text-sm font-bold text-primary hover:text-white transition-colors">Ver todos</Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ORIGINALS.map((game) => (
            <Link key={game.id} href={game.link}>
                <div className="group relative h-48 md:h-64 rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-orange-400/50 transition-all shadow-lg hover:shadow-[0_8px_40px_rgba(249,115,22,0.4)] hover:-translate-y-2 duration-300" data-testid={`original-${game.id}`}>
                    {/* Main gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} transition-all duration-500`} />
                    
                    {/* Animated shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    {/* Subtle pattern overlay */}
                    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }} />
                    
                    {/* Dark vignette for depth */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    {/* Large decorative icon */}
                    <game.icon className="absolute -bottom-6 -right-6 w-36 h-36 text-white/10 group-hover:text-white/15 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" />
                    
                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                        {/* Icon container with glow */}
                        <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-lg border border-white/30 group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300">
                            <game.icon className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                        
                        <h3 className="text-xl md:text-2xl font-heading font-black text-white italic drop-shadow-lg mb-2">{game.name}</h3>
                        
                        {/* RTP Badge */}
                        <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
                            <span className="text-[11px] font-bold text-white/90">99% RTP</span>
                        </div>
                        
                        {/* Hover button */}
                        <Button size="sm" className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-full px-6 shadow-lg">
                            JOGAR
                        </Button>
                    </div>
                </div>
            </Link>
          ))}
        </div>
      </section>

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
            <Link href="/casino" className="text-sm font-bold text-primary hover:text-white transition-colors">Ver todos</Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : popularGames.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Jogos serão exibidos quando a integração PlayFivers estiver configurada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {popularGames.map(game => (
              <GameCard key={game.id} game={game} onPlay={() => handlePlayGame(game)} />
            ))}
          </div>
        )}
      </section>

       <section className="mb-12">
        <Link href="/live-casino">
          <div className="relative h-56 md:h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-card via-card/95 to-card border border-primary/20 shadow-2xl group cursor-pointer hover:border-primary/40 transition-all">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 opacity-50" />
              <div className="absolute inset-0 flex items-center justify-between p-8 md:p-12 z-10">
                  <div className="max-w-lg space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                          <span className="flex h-3 w-3 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                          <span className="text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded">Ao Vivo Agora</span>
                      </div>
                      <h3 className="text-3xl md:text-5xl font-heading font-black text-white italic leading-none">CASINO <span className="text-primary">AO VIVO</span></h3>
                      <p className="text-muted-foreground max-w-sm text-sm md:text-base font-medium">Sinta a emoção de Las Vegas na palma da sua mão com dealers reais 24/7.</p>
                      <Button className="bg-primary hover:bg-primary/90 text-white rounded-full font-bold px-8 h-12 shadow-[0_0_20px_rgba(249,115,22,0.3)] group-hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all">
                          <Play className="w-5 h-5 mr-2 fill-white" /> JOGAR AGORA
                      </Button>
                  </div>
                  
                  <div className="hidden lg:block">
                      <div className="w-48 h-48 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 opacity-50 blur-3xl absolute right-20 top-1/2 -translate-y-1/2" />
                  </div>
              </div>
          </div>
        </Link>
      </section>
    </MainLayout>
  );
}
