import { useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { JackpotBanner } from "@/components/JackpotBanner";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { GameIframeModal } from "@/components/shared/GameIframeModal";
import { GameSectionHeader } from "@/components/shared/GameSectionHeader";
import { WinsTicker } from "@/components/shared/WinsTicker";
import { Gamepad2, Flame, Play, Loader2, Zap, MessageCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { getStoredAuth } from "@/lib/auth";

import mainBanner from "@assets/ChatGPT_Image_11_01_2026,_05_27_36_1768109552475.png";
import crashmaniaImg from "@assets/image_1768079128068.png";
import doubleImg from "@assets/ChatGPT_Image_10_01_2026,_22_27_38_1768108766811.png";
import minesImg from "@assets/ChatGPT_Image_10_01_2026,_22_30_56_1768108766811.png";
import plinkoImg from "@assets/ChatGPT_Image_10_01_2026,_22_33_28_1768108766810.png";

interface SlotsgatewayGame {
  id: string;
  idHash: string;
  name: string;
  imageUrl: string | null;
  imageSquare: string | null;
  providerSlug: string;
  gameType: string | null;
  isNew: boolean;
}

const PROMO_BANNERS = [
  { id: 1, img: mainBanner, link: "/casino", title: "Bônus de Depósito", subtitle: "Até R$100 grátis!" },
];


const ORIGINALS = [
  { id: "aviator", name: "Aviator Mania", link: "/games/aviatormania", img: crashmaniaImg },
  { id: "double", name: "Double", link: "/games/double", img: doubleImg },
  { id: "mines", name: "Mines", link: "/games/mines", img: minesImg },
  { id: "plinko", name: "Plinko", link: "/games/plinko", img: plinkoImg },
];


async function fetchPopularGames(): Promise<SlotsgatewayGame[]> {
  const res = await fetch('/api/slotsgateway/games?type=video-slots&limit=12', { credentials: 'include' });
  const data = await res.json();
  if (!data.success) return [];
  return data.data || [];
}

const PROVIDER_IDS: Record<string, string> = {
  pragmaticslots: '615d6f88-6127-4c75-ad53-a3d00125640c',
  pgsoft: '36e80eda-5ba2-43cd-ad21-70cebc14acef',
  hacksaw: 'dea8a3ee-942a-4922-a8f6-3cac56cbdea1',
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
  const auth = getStoredAuth();
  
  if (!auth.accessToken) {
    throw new Error('Authentication required');
  }
  
  console.log('[LaunchGame] Launching game:', params.idHash);
  
  const res = await fetch('/api/slotsgateway/launch', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${auth.accessToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({ idHash: params.idHash }),
  });
  
  const data = await res.json();
  console.log('[LaunchGame] Response:', data);
  
  if (!data.success) {
    throw new Error(data.error || 'Falha ao iniciar jogo');
  }
  
  if (!data.data?.launchUrl) {
    throw new Error('URL do jogo não recebida');
  }
  
  return data.data;
}

function GameCard({ game, onPlay }: { game: SlotsgatewayGame; onPlay: () => void }) {
  return (
    <div 
      onClick={onPlay}
      className="group relative rounded-xl overflow-hidden bg-card border border-white/5 hover:border-primary/50 transition-all cursor-pointer shadow-lg hover:shadow-primary/20 hover:-translate-y-1 duration-300"
      data-testid={`game-card-${game.idHash}`}
    >
      <div className="aspect-square relative">
        <img 
          src={game.imageSquare || game.imageUrl || 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?w=400'} 
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
  const [chatVisible, setChatVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [currentGameName, setCurrentGameName] = useState<string>("");

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
    onMutate: () => {
      toast({
        title: "Iniciando jogo...",
        description: "Aguarde enquanto carregamos o jogo",
      });
    },
    onSuccess: (data) => {
      console.log('[Home] Opening game URL:', data.launchUrl);
      setGameUrl(data.launchUrl);
      setGameModalOpen(true);
    },
    onError: (error: Error) => {
      console.error('[Home] Launch error:', error);
      if (error.message.includes('Authentication') || error.message.includes('required')) {
        toast({ title: "Login necessário", description: "Faça login para jogar", variant: "destructive" });
        setLocation('/');
      } else {
        toast({ title: "Erro ao iniciar jogo", description: error.message, variant: "destructive" });
      }
    },
  });

  const handlePlayGame = (game: SlotsgatewayGame) => {
    const auth = getStoredAuth();
    if (!auth.accessToken) {
      toast({ title: "Login necessário", description: "Faça login para jogar", variant: "destructive" });
      setLocation('/');
      return;
    }
    
    console.log('[Home] Playing game:', game.name, game.idHash);
    setLocation(`/jogar/${encodeURIComponent(game.idHash)}`);
  };

  const handleCloseGameModal = useCallback(() => {
    setGameModalOpen(false);
    setGameUrl(null);
    setCurrentGameName("");
  }, []);

  return (
    <>
      <div className={`transition-all duration-300 ${chatVisible ? 'lg:pr-80' : ''}`}>
        <MainLayout>
      <section className="mb-4">
        <Link href={PROMO_BANNERS[0].link}>
          <div className="relative w-full overflow-hidden group cursor-pointer rounded-xl bg-gradient-to-r from-[#1a0a00] via-[#2d1200] to-[#1a0a00]">
            <img 
              src={PROMO_BANNERS[0].img} 
              alt={PROMO_BANNERS[0].title}
              className="w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
            />
          </div>
        </Link>
      </section>

      <WinsTicker className="mb-6" />

      <section id="originals" className="scroll-mt-24 mb-8 animate-fade-in-up">
        <GameSectionHeader
          title="BET Originals"
          titleHighlight="IN1"
          subtitle="Jogos exclusivos da casa"
          icon={Gamepad2}
          iconColor="orange"
          gameCount={ORIGINALS.length}
          showNavigation
          carouselId="originals-carousel"
        />
        <div 
          id="originals-carousel"
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
        >
          {ORIGINALS.map((game, index) => (
            <Link key={game.id} href={game.link} className="flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
              <div 
                className="group relative w-[200px] sm:w-[220px] md:w-[240px] aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer border-2 border-white/10 hover:border-orange-500/60 transition-all shadow-lg hover:shadow-[0_8px_40px_rgba(249,115,22,0.5)] hover:-translate-y-2 duration-300 bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12]" 
                data-testid={`original-${game.id}`}
              >
                <img 
                  src={game.img} 
                  alt={game.name}
                  className="absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-[0_4px_20px_rgba(249,115,22,0.5)] transform scale-0 group-hover:scale-100 transition-transform duration-300">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <JackpotBanner chatOpen={chatVisible} />

      <section className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <GameSectionHeader
          title="Slots Populares"
          subtitle="Os jogos mais quentes do momento"
          icon={Flame}
          iconColor="orange"
          gameCount={popularGames.length}
          viewAllLink="/casino"
        />
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : popularGames.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-white/10 rounded-xl">
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

      <section className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <GameSectionHeader
          title="Pragmatic Play"
          subtitle="Os melhores slots do mundo"
          icon={Flame}
          iconColor="red"
          gameCount={pragmaticGames.length}
          viewAllLink="/casino?provider=pragmaticslots"
          showNavigation
          carouselId="pragmatic-carousel"
        />
        {loadingPragmatic ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : pragmaticGames.length > 0 && (
          <div 
            id="pragmatic-carousel"
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {pragmaticGames.map(game => (
              <div key={game.id} className="flex-shrink-0 w-[160px] sm:w-[180px]" style={{ scrollSnapAlign: 'start' }}>
                <GameCard game={game} onPlay={() => handlePlayGame(game)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <GameSectionHeader
          title="PG Soft"
          subtitle="Jogos inovadores e divertidos"
          icon={Gamepad2}
          iconColor="purple"
          gameCount={pgsoftGames.length}
          viewAllLink="/casino?provider=pgsoft"
          showNavigation
          carouselId="pgsoft-carousel"
        />
        {loadingPgsoft ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : pgsoftGames.length > 0 && (
          <div 
            id="pgsoft-carousel"
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {pgsoftGames.map(game => (
              <div key={game.id} className="flex-shrink-0 w-[160px] sm:w-[180px]" style={{ scrollSnapAlign: 'start' }}>
                <GameCard game={game} onPlay={() => handlePlayGame(game)} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        <GameSectionHeader
          title="Hacksaw Gaming"
          subtitle="Alta volatilidade e grandes prêmios"
          icon={Zap}
          iconColor="green"
          gameCount={hacksawGames.length}
          viewAllLink="/casino?provider=hacksaw"
          showNavigation
          carouselId="hacksaw-carousel"
        />
        {loadingHacksaw ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : hacksawGames.length > 0 && (
          <div 
            id="hacksaw-carousel"
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
          >
            {hacksawGames.map(game => (
              <div key={game.id} className="flex-shrink-0 w-[160px] sm:w-[180px]" style={{ scrollSnapAlign: 'start' }}>
                <GameCard game={game} onPlay={() => handlePlayGame(game)} />
              </div>
            ))}
          </div>
        )}
      </section>
        </MainLayout>
      </div>

      {/* Chat Sidebar - Desktop (Fixed Position - Right Side) */}
      <div className={`hidden lg:block fixed top-0 right-0 h-full transition-all duration-300 z-40 ${chatVisible ? 'w-80' : 'w-0'}`}>
        {chatVisible && (
          <ChatWidget className="h-full" onClose={() => setChatVisible(false)} />
        )}
      </div>

      {/* Chat Toggle Box - Desktop (Right Side) */}
      {!chatVisible && (
        <div 
          className="hidden lg:flex fixed right-0 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-2 px-2 py-4 bg-secondary border border-r-0 border-secondary-border rounded-l-lg shadow-lg cursor-pointer hover:bg-secondary/80 transition-colors"
          onClick={() => setChatVisible(true)}
          data-testid="button-open-chat"
        >
          <MessageCircle className="h-5 w-5 text-foreground" />
          <span className="text-sm font-medium text-foreground [writing-mode:vertical-rl] [text-orientation:mixed]">Chat</span>
        </div>
      )}

      {/* Chat Toggle Button - Mobile (Right Side) - Positioned above support chat */}
      <Button
        onClick={() => setChatVisible(!chatVisible)}
        className="lg:hidden fixed bottom-36 right-4 h-14 w-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg z-40"
        data-testid="button-toggle-chat-mobile"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Modal - Mobile */}
      {chatVisible && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background">
          <ChatWidget className="h-full" onClose={() => setChatVisible(false)} />
        </div>
      )}

      <GameIframeModal 
        isOpen={gameModalOpen}
        onClose={handleCloseGameModal}
        gameUrl={gameUrl}
        gameName={currentGameName}
      />
    </>
  );
}
