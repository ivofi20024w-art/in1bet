import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { ORIGINALS_GAMES } from "@/lib/mockData";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/stores/authModalStore";
import { History, Loader2, Clock, Play, Gamepad2 } from "lucide-react";
import { useState } from "react";
import { GameIframeModal } from "@/components/shared/GameIframeModal";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getStoredAuth } from "@/lib/auth";
import { httpGet } from "@/lib/httpClient";

import crashImg from "@assets/generated_images/futuristic_neon_cityscape_background_for_crash_game.png";
import minesImg from "@assets/generated_images/mysterious_background_for_mines_casino_game.png";
import doubleImg from "@assets/generated_images/elegant_background_for_double_casino_game.png";
import plinkoImg from "@assets/generated_images/neon_plinko_game_background_with_pyramid_structure.png";

interface SlotsgatewayGame {
  id: string;
  idHash: string;
  name: string;
  imageUrl: string | null;
  providerId: string | null;
  providerSlug: string;
  gameType: string | null;
  isNew: boolean;
  status: string;
}

interface RecentGame {
  gameType: string;
  gameId: string | null;
  gameName: string;
  lastPlayedAt: string;
  totalBets: number;
}

const GAME_IMAGES: Record<string, string> = {
  crash: crashImg,
  mines: minesImg,
  double: doubleImg,
  plinko: plinkoImg,
};

const GAME_ROUTES: Record<string, string> = {
  crash: "/games/aviatormania",
  aviator: "/games/aviatormania",
  mines: "/games/mines",
  double: "/games/double",
  plinko: "/games/plinko",
};

async function launchGame(params: { idHash: string }): Promise<{ launchUrl: string }> {
  const auth = getStoredAuth();
  
  if (!auth.accessToken) {
    throw new Error('Authentication required');
  }
  
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
  
  if (!data.success) {
    throw new Error(data.error || 'Falha ao iniciar jogo');
  }
  
  if (!data.data?.launchUrl) {
    throw new Error('URL do jogo não recebida');
  }
  
  return data.data;
}

export default function Recent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { openLogin } = useAuthModal();
  const [, setLocation] = useLocation();
  const [gameModalOpen, setGameModalOpen] = useState(false);
  const [gameUrl, setGameUrl] = useState<string | null>(null);
  const [currentGameName, setCurrentGameName] = useState<string>("");
  const { toast } = useToast();

  const { data: recentBets = [], isLoading: loadingRecent } = useQuery({
    queryKey: ['recent-games'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const { data, error } = await httpGet<{ items: any[] }>('/api/history/bets?limit=50');
      if (error || !data) return [];
      
      const uniqueGames = new Map<string, RecentGame>();
      data?.items?.forEach((bet: any) => {
        const key = bet.metadata?.gameId || bet.category;
        if (!uniqueGames.has(key)) {
          uniqueGames.set(key, {
            gameType: bet.category,
            gameId: bet.metadata?.gameId || null,
            gameName: bet.category,
            lastPlayedAt: bet.createdAt,
            totalBets: 1,
          });
        } else {
          const existing = uniqueGames.get(key)!;
          existing.totalBets++;
        }
      });
      
      return Array.from(uniqueGames.values());
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const { data: slotsGames = [] } = useQuery({
    queryKey: ['slotsgateway-games-recent'],
    queryFn: async () => {
      const res = await fetch('/api/slotsgateway/games?limit=50');
      const data = await res.json();
      if (!data.success) return [];
      return data.data as SlotsgatewayGame[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const launchMutation = useMutation({
    mutationFn: launchGame,
    onSuccess: (data) => {
      setGameUrl(data.launchUrl);
      setGameModalOpen(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao abrir jogo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOriginalGameClick = (gameId: string) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    const route = GAME_ROUTES[gameId];
    if (route) {
      setLocation(route);
    }
  };

  const handleSlotsGameClick = (game: SlotsgatewayGame) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }
    setCurrentGameName(game.name);
    launchMutation.mutate({ idHash: game.idHash });
  };

  const isLoading = authLoading || loadingRecent;

  return (
    <MainLayout>
      <div className="min-h-screen">
        <div className="relative overflow-hidden bg-gradient-to-b from-primary/20 via-background to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
          
          <div className="relative container mx-auto px-3 md:px-4 py-8 md:py-12">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/20 rounded-lg">
                <History className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Jogos Recentes</h1>
            </div>
            <p className="text-zinc-400 text-sm md:text-base">
              Continue de onde parou - seus jogos recentemente jogados
            </p>
          </div>
        </div>

        <div className="container mx-auto px-3 md:px-4 py-6 space-y-8">
          {!isAuthenticated && !authLoading && (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="p-4 bg-primary/10 rounded-full mb-4">
                <Gamepad2 className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Faça login para ver seus jogos recentes</h2>
              <p className="text-zinc-400 mb-6 max-w-md">
                Entre na sua conta para acessar seu histórico de jogos e continuar de onde parou.
              </p>
              <Button onClick={() => openLogin()} className="gap-2">
                <Play className="w-4 h-4" />
                Entrar agora
              </Button>
            </div>
          )}

          {isAuthenticated && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {recentBets.length > 0 && (
                    <section>
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-white">Jogos Originais Recentes</h2>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {recentBets.map((recentGame, index) => {
                          const gameId = recentGame.gameType.toLowerCase();
                          const image = GAME_IMAGES[gameId];
                          if (!image) return null;
                          return (
                            <GameCard
                              key={`recent-${index}`}
                              id={index}
                              title={recentGame.gameType}
                              provider="IN1Bet Originais"
                              image={image}
                              onClick={() => handleOriginalGameClick(gameId)}
                            />
                          );
                        })}
                      </div>
                    </section>
                  )}

                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Gamepad2 className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-white">Jogos Originais IN1Bet</h2>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                      {ORIGINALS_GAMES.filter(g => GAME_IMAGES[g.id]).map((game, index) => (
                        <GameCard
                          key={game.id}
                          id={index}
                          title={game.name}
                          provider="IN1Bet Originais"
                          image={GAME_IMAGES[game.id]}
                          onClick={() => handleOriginalGameClick(game.id)}
                        />
                      ))}
                    </div>
                  </section>

                  {slotsGames.length > 0 && (
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Play className="w-5 h-5 text-primary" />
                          <h2 className="text-lg font-semibold text-white">Mais Jogos</h2>
                        </div>
                        <Link href="/casino" className="text-primary text-sm hover:underline">
                          Ver todos
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {slotsGames.slice(0, 12).map((game, index) => (
                          <GameCard
                            key={game.id}
                            id={index}
                            idHash={game.idHash}
                            title={game.name}
                            provider={game.providerSlug}
                            image={game.imageUrl || ""}
                            onClick={() => handleSlotsGameClick(game)}
                          />
                        ))}
                      </div>
                    </section>
                  )}

                  {recentBets.length === 0 && slotsGames.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                      <div className="p-4 bg-zinc-800/50 rounded-full mb-4">
                        <History className="w-12 h-12 text-zinc-500" />
                      </div>
                      <h2 className="text-xl font-semibold text-white mb-2">Nenhum jogo recente</h2>
                      <p className="text-zinc-400 mb-6 max-w-md">
                        Você ainda não jogou nenhum jogo. Explore nossa seleção de jogos e comece a jogar!
                      </p>
                      <Link href="/casino">
                        <Button className="gap-2">
                          <Play className="w-4 h-4" />
                          Explorar Jogos
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <GameIframeModal
        isOpen={gameModalOpen}
        onClose={() => {
          setGameModalOpen(false);
          setGameUrl(null);
          setCurrentGameName("");
        }}
        gameUrl={gameUrl || ""}
        gameName={currentGameName}
      />
    </MainLayout>
  );
}
