import { MainLayout } from "@/components/layout/MainLayout";
import { GameSectionHeader } from "@/components/shared/GameSectionHeader";
import { Gamepad2, Play } from "lucide-react";
import { Link } from "wouter";

const crashmaniaImg = "/game-aviator.png";
const doubleImg = "/game-double.png";
const minesImg = "/game-mines.png";
const plinkoImg = "/game-plinko.png";

const ORIGINALS = [
  { id: "aviator", name: "Aviator Mania", link: "/games/aviatormania", img: crashmaniaImg },
  { id: "double", name: "Roletas", link: "/games/double", img: doubleImg },
  { id: "mines", name: "Minas", link: "/games/mines", img: minesImg },
  { id: "plinko", name: "Plinko", link: "/games/plinko", img: plinkoImg },
];

export default function Originals() {
  return (
    <MainLayout>
      <section className="mb-8 animate-fade-in-up">
        <GameSectionHeader
          title="BET Originals"
          titleHighlight="IN1"
          subtitle="Jogos exclusivos da casa"
          icon={Gamepad2}
          iconColor="orange"
          gameCount={ORIGINALS.length}
        />
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {ORIGINALS.map((game) => (
            <Link key={game.id} href={game.link}>
              <div 
                className="group relative aspect-[225/420] rounded-2xl overflow-hidden cursor-pointer border-2 border-white/10 hover:border-orange-500/70 transition-all duration-300 hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] hover:-translate-y-3" 
                data-testid={`original-${game.id}`}
              >
                <img 
                  src={game.img} 
                  alt={game.name}
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-orange-600/30 via-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.7)] transform scale-0 group-hover:scale-100 transition-all duration-300 border-2 border-white/30">
                    <Play className="w-7 h-7 text-white fill-white ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
