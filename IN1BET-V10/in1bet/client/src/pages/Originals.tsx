import { MainLayout } from "@/components/layout/MainLayout";
import { Rocket, Play, Bomb, Target, CircleDot, Zap, TrendingUp, Shield, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

const crashmaniaImg = "/game-aviator.png";
const doubleImg = "/game-double.png";
const minesImg = "/game-mines.png";
const plinkoImg = "/game-plinko.png";

const ORIGINALS = [
  { 
    id: "aviatormania", 
    name: "Aviator Mania", 
    link: "/games/aviatormania", 
    img: crashmaniaImg,
    description: "Voe alto e multiplique seus ganhos antes do avião decolar!",
    icon: Rocket,
    gradient: "from-orange-500 via-red-500 to-pink-500",
    rtp: "97%",
    volatility: "Alta",
    maxWin: "10.000x",
    tag: "Mais Jogado"
  },
  { 
    id: "mines", 
    name: "Minas", 
    link: "/games/mines", 
    img: minesImg,
    description: "Encontre as estrelas e evite as bombas para multiplicar seus ganhos!",
    icon: Bomb,
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    rtp: "97%",
    volatility: "Média",
    maxWin: "5.000x",
    tag: "Popular"
  },
  { 
    id: "double", 
    name: "Roletas", 
    link: "/games/double", 
    img: doubleImg,
    description: "Aposte nas cores e duplique ou triplique seus ganhos!",
    icon: CircleDot,
    gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
    rtp: "98%",
    volatility: "Baixa",
    maxWin: "14x",
    tag: "Clássico"
  },
  { 
    id: "plinko", 
    name: "Plinko", 
    link: "/games/plinko", 
    img: plinkoImg,
    description: "Solte a bola e veja ela cair para multiplicadores incríveis!",
    icon: Target,
    gradient: "from-amber-500 via-yellow-500 to-lime-500",
    rtp: "99%",
    volatility: "Média",
    maxWin: "1.000x",
    tag: "Novo"
  },
];

export default function Originals() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20">
              <Rocket className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-white">
                IN1BET <span className="text-primary">Originais</span>
              </h1>
              <p className="text-gray-400 mt-1">
                Jogos exclusivos com a melhor experiência e RTP garantido
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">Provably Fair</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Exclusivos</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ORIGINALS.map((game) => (
            <Link key={game.id} href={game.link}>
              <div className="group relative h-72 rounded-3xl overflow-hidden cursor-pointer border border-white/10 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/20">
                <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-500`} />
                
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                
                <img 
                  src={game.img} 
                  alt={game.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-700"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                
                <Badge 
                  className={`absolute top-4 right-4 bg-gradient-to-r ${game.gradient} text-white border-0 shadow-lg`}
                >
                  {game.tag}
                </Badge>
                
                <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${game.gradient} shadow-lg`}>
                      <game.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-heading font-black text-white drop-shadow-lg">
                      {game.name}
                    </h3>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {game.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4 text-xs">
                      <div className="flex flex-col">
                        <span className="text-gray-500">RTP</span>
                        <span className="text-white font-bold">{game.rtp}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Volatilidade</span>
                        <span className="text-white font-bold">{game.volatility}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-500">Max Win</span>
                        <span className="text-primary font-bold">{game.maxWin}</span>
                      </div>
                    </div>
                    
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Play className="w-7 h-7 text-white ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-transparent to-primary/10 border border-primary/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Por que jogar nossos originais?</h3>
                <p className="text-gray-400 text-sm">RTP superior, resultados verificáveis e a melhor experiência de jogo</p>
              </div>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">97-99%</div>
                <div className="text-xs text-gray-500">RTP Médio</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">100%</div>
                <div className="text-xs text-gray-500">Provably Fair</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">24/7</div>
                <div className="text-xs text-gray-500">Disponível</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
