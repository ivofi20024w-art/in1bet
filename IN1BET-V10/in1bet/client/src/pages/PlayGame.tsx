import { useRoute, useLocation } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/stores/authModalStore";
import { getStoredAuth } from "@/lib/auth";
import { 
  ArrowLeft, 
  Maximize2, 
  Minimize2, 
  Volume2, 
  VolumeX, 
  Heart, 
  RefreshCw,
  Home,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavoritesStore } from "@/stores/favorites-store";
import { cn } from "@/lib/utils";
import logoImage from "@assets/ChatGPT_Image_10_01_2026,_22_30_56_1768108766811.png";

interface WalletData {
  balance: string;
  lockedBalance: string;
}

async function fetchWallet(): Promise<WalletData> {
  const auth = getStoredAuth();
  if (!auth.isAuthenticated) throw new Error('Not authenticated');
  
  const res = await fetch('/api/wallet', {
    credentials: 'include',
  });
  const data = await res.json();
  if (!data.wallet) throw new Error(data.error || 'Wallet not found');
  return {
    balance: String(data.wallet.balance),
    lockedBalance: String(data.wallet.lockedBalance || 0),
  };
}

async function launchGame(idHash: string): Promise<{ launchUrl: string }> {
  const auth = getStoredAuth();
  if (!auth.isAuthenticated) throw new Error('Authentication required');
  
  const res = await fetch('/api/slotsgateway/launch', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ idHash }),
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Falha ao iniciar jogo');
  if (!data.data?.launchUrl) throw new Error('URL do jogo não recebida');
  
  return data.data;
}

async function fetchGameInfo(idHash: string) {
  const res = await fetch(`/api/slotsgateway/games?search=${encodeURIComponent(idHash)}&limit=1`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error);
  return data.data?.[0] || null;
}

export default function PlayGame() {
  const [match, params] = useRoute("/jogar/:idHash");
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLogin } = useAuthModal();
  const { favorites, toggleFavorite } = useFavoritesStore();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  const idHash = params?.idHash ? decodeURIComponent(params.idHash) : '';
  const isFavorite = favorites.includes(idHash);

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet-playgame'],
    queryFn: fetchWallet,
    enabled: isAuthenticated,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const { data: gameInfo } = useQuery({
    queryKey: ['game-info', idHash],
    queryFn: () => fetchGameInfo(idHash),
    enabled: !!idHash,
    staleTime: 60000,
  });

  const launchMutation = useMutation({
    mutationFn: () => launchGame(idHash),
    onSuccess: (data) => {
      setGameUrl(data.launchUrl);
    },
    onError: (error: Error) => {
      console.error('[PlayGame] Launch error:', error);
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openLogin();
      setLocation('/casino');
      return;
    }
    
    if (isAuthenticated && idHash && !gameUrl && !launchMutation.isPending) {
      launchMutation.mutate();
    }
  }, [isAuthenticated, authLoading, idHash, gameUrl]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => setShowControls(false), 3000);
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  useEffect(() => {
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [controlsTimeout]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
  };

  const handleRefresh = () => {
    setIsIframeLoading(true);
    setGameUrl(null);
    launchMutation.mutate();
  };

  const handleBack = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    setLocation('/casino');
  };

  const formatBalance = (balance: string | undefined) => {
    if (!balance) return 'R$ 0,00';
    return `R$ ${parseFloat(balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const gameName = gameInfo?.name || idHash.split('/').pop()?.replace(/-/g, ' ') || 'Carregando...';
  const providerName = gameInfo?.providerSlug || idHash.split('/')[0] || '';

  if (authLoading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black flex flex-col"
      onMouseMove={handleMouseMove}
    >
      <header 
        className={cn(
          "absolute top-0 left-0 right-0 z-50 transition-all duration-300",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
        )}
      >
        <div className="bg-gradient-to-b from-black/90 via-black/70 to-transparent px-4 py-3">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-white/80 hover:text-white hover:bg-white/10 gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
              
              <div className="hidden sm:block h-8 w-px bg-white/20" />
              
              <div className="flex items-center gap-3">
                <img 
                  src={logoImage} 
                  alt="IN1Bet" 
                  className="h-7 w-auto"
                />
                <div className="hidden md:block">
                  <h1 className="text-white font-bold text-sm leading-tight capitalize">
                    {gameName}
                  </h1>
                  <p className="text-white/50 text-xs capitalize">{providerName}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-white font-bold text-sm">
                    {formatBalance(wallet?.balance)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(idHash)}
                  className={cn(
                    "text-white/60 hover:text-white hover:bg-white/10",
                    isFavorite && "text-red-500 hover:text-red-400"
                  )}
                >
                  <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={launchMutation.isPending}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className={cn("w-5 h-5", launchMutation.isPending && "animate-spin")} />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white/60 hover:text-white hover:bg-white/10"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-5 h-5" />
                  ) : (
                    <Maximize2 className="w-5 h-5" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="text-white/60 hover:text-white hover:bg-white/10 sm:hidden"
                >
                  <Home className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 relative">
        {(launchMutation.isPending || isIframeLoading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-40">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <img 
                src={logoImage} 
                alt="IN1Bet" 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-auto"
              />
            </div>
            <h2 className="text-white font-bold text-xl mb-2 capitalize">{gameName}</h2>
            <p className="text-white/50 text-sm">Carregando jogo...</p>
          </div>
        )}

        {launchMutation.isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-40">
            <div className="text-center max-w-md px-4">
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">😔</span>
              </div>
              <h2 className="text-white font-bold text-xl mb-2">Erro ao carregar jogo</h2>
              <p className="text-white/50 text-sm mb-6">
                {launchMutation.error?.message || 'Não foi possível iniciar o jogo. Tente novamente.'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleRefresh} variant="default" className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Tentar novamente
                </Button>
                <Button onClick={handleBack} variant="outline">
                  Voltar ao Casino
                </Button>
              </div>
            </div>
          </div>
        )}

        {gameUrl && (
          <iframe
            src={gameUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; microphone"
            allowFullScreen
            onLoad={handleIframeLoad}
            style={{ display: isIframeLoading ? 'none' : 'block' }}
          />
        )}
      </main>

      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 z-50 transition-all duration-300",
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none"
        )}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent px-4 py-3">
          <div className="flex items-center justify-center gap-4 text-white/40 text-xs">
            <span>Jogue com responsabilidade</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">+18</span>
          </div>
        </div>
      </div>
    </div>
  );
}
