import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";

interface RecentWinner {
  id: string;
  username: string;
  level: number;
  amount: number;
  gameName: string;
  createdAt: string;
}

const MOCK_NAMES = [
  "Lucas", "Fernanda", "Gabriel", "Ana", "Pedro", "Juliana", "Matheus", "Carla",
  "Rafael", "Amanda", "Bruno", "Patricia", "Diego", "Camila", "Thiago", "Mariana",
  "Felipe", "Beatriz", "Rodrigo", "Larissa"
];

const MOCK_GAMES = [
  "Fortune Tiger", "Sweet Bonanza", "Gates of Olympus", "Sugar Rush", 
  "Starlight Princess", "Big Bass Bonanza", "Wolf Gold", "Dog House",
  "Fruit Party", "Wild West Gold", "Book of Dead", "Money Train 3",
  "Wanted Dead or Wild", "Gems Bonanza", "Buffalo King", "Zeus vs Hades"
];

const MOCK_WINNERS: RecentWinner[] = Array.from({ length: 20 }, (_, i) => ({
  id: `mock-${i}`,
  username: MOCK_NAMES[i % MOCK_NAMES.length],
  level: [5, 12, 23, 8, 45, 67, 15, 32, 19, 55][i % 10],
  amount: ((i * 137 + 100) % 2000 + 100),
  gameName: MOCK_GAMES[i % MOCK_GAMES.length],
  createdAt: new Date().toISOString(),
}));

function getInitials(name: string): string {
  return name.substring(0, 2).toUpperCase();
}

export function WinsTicker({ className }: { className?: string }) {
  const { data: realWinners = [] } = useQuery({
    queryKey: ['recent-winners'],
    queryFn: async () => {
      const res = await fetch('/api/history/winners?limit=20');
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        return data.data as RecentWinner[];
      }
      return [];
    },
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  const winnersToDisplay = realWinners.length > 0 ? realWinners : MOCK_WINNERS;

  return (
    <div className={cn("relative", className)}>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div className="bg-gradient-to-r from-green-900/20 via-emerald-900/10 to-green-900/20 border-y border-green-500/20 -mx-4 md:-mx-8 py-3 overflow-hidden relative">
        <div className="flex items-center gap-6 whitespace-nowrap px-4" style={{ animation: 'marquee 40s linear infinite' }}>
          {[...winnersToDisplay, ...winnersToDisplay].map((winner, i) => {
            const levelColor = winner.level >= 50 ? 'from-yellow-500 to-amber-600' : 
                               winner.level >= 30 ? 'from-purple-500 to-violet-600' : 
                               winner.level >= 15 ? 'from-blue-500 to-cyan-600' : 
                               'from-gray-500 to-gray-600';
            return (
              <div key={`${winner.id}-${i}`} className="flex items-center gap-3 bg-black/40 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 flex-shrink-0 hover:border-green-500/30 transition-colors">
                <div className="relative">
                  <div className="w-7 h-7 rounded-full border-2 border-green-500/50 shadow-lg shadow-green-500/20 bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white">{getInitials(winner.username)}</span>
                  </div>
                  <div className={`absolute -bottom-1 -right-1 bg-gradient-to-r ${levelColor} text-[7px] text-white font-bold px-1.5 py-0.5 rounded-full shadow-md`}>
                    {winner.level}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-white text-[11px] font-semibold">{winner.username}</span>
                  <span className="text-gray-500 text-[9px]">{winner.gameName}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-green-400 font-bold text-sm">+R$ {winner.amount.toFixed(2)}</span>
                  <span className="text-gray-600 text-[8px]">agora</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
      </div>
    </div>
  );
}
