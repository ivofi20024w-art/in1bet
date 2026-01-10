import { MainLayout } from "@/components/layout/MainLayout";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { JackpotBanner } from "@/components/JackpotBanner";
import { Rocket, Gamepad2, Flame, Play, Star, Zap, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import Autoplay from "embla-carousel-autoplay";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

import mainBanner from "@assets/main1_1767994256496.png";
import crashmaniaImg from "@assets/image_1768058310823.png";
import doubleImg from "@assets/image_1768058350806.png";
import minesImg from "@assets/image_1768058360882.png";
import plinkoImg from "@assets/image_1768058372829.png";
import originalsLogo from "@assets/2ea89e20-86ec-41bb-b928-c95da2e5e2d0_1768077965099.png";

interface SlotsgatewayGame {
  id: string;
  idHash: string;
  name: string;
  imageUrl: string | null;
  providerSlug: string;
  gameType: string | null;
  isNew: boolean;
}

const BANNERS = [
  { id: 1, img: mainBanner, link: "/casino" },
];

const ORIGINALS = [
  { id: "crash", name: "Crashmania", link: "/games/crash", img: crashmaniaImg },
  { id: "double", name: "Double", link: "/games/double", img: doubleImg },
  { id: "mines", name: "Mines", link: "/games/mines", img: minesImg },
  { id: "plinko", name: "Plinko", link: "/games/plinko", img: plinkoImg },
];

const CATEGORIES = [
  { id: "lobby", label: "Lobby", icon: Gamepad2, link: "/#originals" },
  { id: "slots", label: "Slots", icon: Flame, link: "/casino?category=slots" },
  { id: "live", label: "Ao Vivo", icon: Play, link: "/live-casino" },
  { id: "originals", label: "Originais", icon: Rocket, link: "/#originals" },
  { id: "favorites", label: "Favoritos", icon: Star, link: "/casino?category=favorites" },
];

async function fetchPopularGames(): Promise<SlotsgatewayGame[]> {
  const res = await fetch('/api/slotsgateway/games?type=video-slots&limit=12', { credentials: 'include' });
  const data = await res.json();
  if (!data.success) return [];
  return data.data || [];
}

const PROVIDER_IDS: Record<string, string> = {
  pragmaticslots: '6c841f79-cd1b-4af4-ba5b-f3b9a6888410',
  pgsoft: 'f05c6248-d8b6-4d4b-bfb8-b9a44df6238a',
  hacksaw: 'f3a3e603-a7b4-4897-b67d-d8a32197dce0',
};

async function fetchProviderGames(providerSlug: string): Promise<SlotsgatewayGame[]> {
  const providerId = PROVIDER_IDS[providerSlug];
  if (!providerId) return [];
  const res = await fetch(`/api/slotsgateway/games?providerId=${providerId}&type=video-slots&limit=10`, { credentials: 'include' });
  const data = await res.json();
  if (!data.success) return [];
  return data.data || [];
}

async function launchGame(params: { idHash: string }): Promise<{ launchUrl: string }> {
  const token = localStorage.getItem('accessToken');
  const res = await fetch('/api/slotsgateway/launch', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: JSON.stringify({ idHash: params.idHash }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Erro ao iniciar jogo");
  return data.data;
}

function GameCard({ game, onPlay }: { game: SlotsgatewayGame; onPlay: () => void }) {
  return (
    <div 
      onClick={onPlay}
      className="group relative rounded-xl overflow-hidden bg-card border border-white/5 hover:border-primary/50 transition-all cursor-pointer shadow-lg hover:shadow-primary/20 hover:-translate-y-1 duration-300"
      data-testid={`game-card-${game.idHash}`}
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
        <p className="text-xs text-muted-foreground truncate capitalize">{game.providerSlug}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: popularGames = [], isLoading } = useQuery({
    queryKey: ['slotsgateway-popular-games'],
    queryFn: fetchPopularGames,
    staleTime: 5 * 60 * 1000,
  });

  const { data: pragmaticGames = [], isLoading: loadingPragmatic } = useQuery({
    queryKey: ['slotsgateway-pragmatic-games'],
    queryFn: () => fetchProviderGames('pragmaticslots'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: pgsoftGames = [], isLoading: loadingPgsoft } = useQuery({
    queryKey: ['slotsgateway-pgsoft-games'],
    queryFn: () => fetchProviderGames('pgsoft'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: hacksawGames = [], isLoading: loadingHacksaw } = useQuery({
    queryKey: ['slotsgateway-hacksaw-games'],
    queryFn: () => fetchProviderGames('hacksaw'),
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

  const handlePlayGame = (game: SlotsgatewayGame) => {
    launchMutation.mutate({
      idHash: game.idHash,
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
                  <div className="relative w-full overflow-hidden group cursor-pointer rounded-xl md:rounded-2xl bg-gradient-to-r from-[#1a0a00] via-[#2d1200] to-[#1a0a00]">
                    <img 
                      src={banner.img} 
                      alt="Banner promocional"
                      className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
                    />
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="left-4 bg-black/40 backdrop-blur-sm border-none text-white hover:bg-primary h-10 w-10" />
            <CarouselNext className="right-4 bg-black/40 backdrop-blur-sm border-none text-white hover:bg-primary h-10 w-10" />
          </div>
        </Carousel>
      </section>

      <section className="mb-10 overflow-x-auto pb-2 scrollbar-none md:overflow-visible">
        <div className="flex gap-3 min-w-max md:min-w-0 md:w-full md:justify-center">
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

      <section id="originals" className="mb-12 scroll-mt-24">
        <div className="flex items-center justify-center mb-3">
          <img 
            src={originalsLogo} 
            alt="IN1BET ORIGINALS" 
            className="h-36 md:h-52 w-auto object-contain"
          />
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ORIGINALS.map((game) => (
            <Link key={game.id} href={game.link}>
                <div className="group relative h-48 md:h-64 rounded-2xl overflow-hidden cursor-pointer border border-white/10 hover:border-orange-400/50 transition-all shadow-lg hover:shadow-[0_8px_40px_rgba(249,115,22,0.4)] hover:-translate-y-2 duration-300" data-testid={`original-${game.id}`}>
                    <img 
                      src={game.img} 
                      alt={game.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
            </Link>
          ))}
        </div>
      </section>

      <JackpotBanner />

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
            <p>Jogos serão exibidos quando a integração SlotsGateway estiver configurada.</p>
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Flame className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-white leading-none">Pragmatic Play</h2>
              <p className="text-xs text-muted-foreground">Os melhores slots do mundo</p>
            </div>
          </div>
          <Link href="/casino?provider=pragmaticslots" className="text-sm font-bold text-primary hover:text-white transition-colors">Ver todos</Link>
        </div>
        {loadingPragmatic ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : pragmaticGames.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pragmaticGames.map(game => (
              <GameCard key={game.id} game={game} onPlay={() => handlePlayGame(game)} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Gamepad2 className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-white leading-none">PG Soft</h2>
              <p className="text-xs text-muted-foreground">Jogos inovadores e divertidos</p>
            </div>
          </div>
          <Link href="/casino?provider=pgsoft" className="text-sm font-bold text-primary hover:text-white transition-colors">Ver todos</Link>
        </div>
        {loadingPgsoft ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : pgsoftGames.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {pgsoftGames.map(game => (
              <GameCard key={game.id} game={game} onPlay={() => handlePlayGame(game)} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-white leading-none">Hacksaw Gaming</h2>
              <p className="text-xs text-muted-foreground">Alta volatilidade e grandes prêmios</p>
            </div>
          </div>
          <Link href="/casino?provider=hacksaw" className="text-sm font-bold text-primary hover:text-white transition-colors">Ver todos</Link>
        </div>
        {loadingHacksaw ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : hacksawGames.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {hacksawGames.map(game => (
              <GameCard key={game.id} game={game} onPlay={() => handlePlayGame(game)} />
            ))}
          </div>
        )}
      </section>
    </MainLayout>
  );
}
