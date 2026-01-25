import { MainLayout } from "@/components/layout/MainLayout";
import { GameCard } from "@/components/shared/GameCard";
import { CASINO_GAMES, ORIGINALS_GAMES } from "@/lib/mockData";
import { Rocket, Play } from "lucide-react";
import { Link } from "wouter";

export default function Originals() {
  return (
    <MainLayout>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-xl">
            <Rocket className="w-8 h-8 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-heading font-bold text-white">IN1BET Originals</h1>
            <p className="text-gray-400">Jogos exclusivos com a melhor experiência e RTP garantido.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ORIGINALS_GAMES.map((game) => (
            <Link key={game.id} href={`/games/${game.id}`}>
                <div className="group relative h-48 rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-all shadow-lg hover:shadow-primary/20 hover:-translate-y-1 duration-300 bg-gradient-to-br from-gray-800 to-black">
                    {/* Background */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                        <h3 className="text-3xl font-heading font-black text-white italic drop-shadow-md mb-2">{game.name}</h3>
                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-6 h-6 text-white ml-1" />
                        </div>
                    </div>
                </div>
            </Link>
        ))}
      </div>
    </MainLayout>
  );
}
