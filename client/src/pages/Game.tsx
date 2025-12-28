import { MainLayout } from "@/components/layout/MainLayout";
import { useRoute, useLocation } from "wouter";
import { CASINO_GAMES } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Maximize2, Heart, Info, ChevronLeft, Play } from "lucide-react";

export default function Game() {
  const [match, params] = useRoute("/game/:id");
  const [, setLocation] = useLocation();
  const id = params ? parseInt(params.id) : 0;
  const game = CASINO_GAMES.find(g => g.id === id);

  if (!game) {
    return (
        <MainLayout>
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <h2 className="text-2xl font-bold text-white mb-4">Jogo não encontrado</h2>
                <Button onClick={() => setLocation('/casino')}>Voltar ao Casino</Button>
            </div>
        </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/casino')}>
              <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
              <h1 className="text-2xl font-bold text-white leading-none">{game.title}</h1>
              <span className="text-sm text-gray-400">{game.provider}</span>
          </div>
      </div>

      {/* Game Launcher Area */}
      <div className="bg-black aspect-video rounded-xl overflow-hidden relative border border-white/10 shadow-2xl mb-6 group">
          <img src={game.image} className="w-full h-full object-cover opacity-30 blur-sm group-hover:blur-md transition-all duration-700" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
               <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-[0_0_40px_-5px_rgba(242,102,49,0.6)] cursor-pointer hover:scale-110 transition-transform mb-4">
                  <Play className="w-8 h-8 text-white ml-1" />
               </div>
               <p className="text-white font-bold text-lg">Clique para Jogar</p>
          </div>
          
          <div className="absolute bottom-4 right-4 flex gap-2 z-20">
              <Button size="icon" variant="secondary" className="bg-black/50 hover:bg-black/80 text-white border-white/10">
                  <Maximize2 className="w-4 h-4" />
              </Button>
          </div>
      </div>

      {/* Quick Actions & Info */}
      <div className="flex items-center justify-between bg-card border border-white/5 p-4 rounded-xl">
          <div className="flex gap-4">
              <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300 hover:text-white gap-2">
                  <Heart className="w-4 h-4" /> Favorito
              </Button>
              <Button variant="outline" className="border-white/10 hover:bg-white/5 text-gray-300 hover:text-white gap-2">
                  <Info className="w-4 h-4" /> Regras
              </Button>
          </div>
          <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider">RTP</p>
              <p className="font-bold text-primary">96.5%</p>
          </div>
      </div>
    </MainLayout>
  );
}
