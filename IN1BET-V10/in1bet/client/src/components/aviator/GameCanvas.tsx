import { useEffect, useRef, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import planeImage from "@/assets/plane.png";
import crashImage from "@/assets/plane-crash.png";

interface GameCanvasProps {
  gameState: "IDLE" | "BETTING" | "FLYING" | "CRASHED";
  multiplier: number;
  countdown?: number;
  showCrashMessage?: boolean;
}

export function GameCanvas({ gameState, multiplier, countdown = 15, showCrashMessage = false }: GameCanvasProps) {
  const controls = useAnimation();
  
  const progress = useMemo(() => {
     if (gameState !== "FLYING" && gameState !== "CRASHED") return 0;
     const maxVal = 10; 
     const p = Math.min(1, Math.log(multiplier) / Math.log(maxVal));
     return Math.max(0.05, p); 
  }, [multiplier, gameState]);

  return (
    <div className="relative w-full h-full bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" />
      
      <div className="absolute inset-0 overflow-hidden">
        {gameState === "FLYING" && (
           <div className="absolute inset-0 animate-slide-left opacity-30">
              {Array.from({length: 20}).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute bg-orange-500/30 rounded-full"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: Math.random() * 3 + 'px',
                    height: '1px',
                    animation: `shoot ${Math.random() * 2 + 0.5}s linear infinite`
                  }}
                />
              ))}
           </div>
        )}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
        {gameState === "BETTING" && (
           <div className="flex flex-col items-center animate-pulse">
             <div className="text-primary font-bold text-lg mb-2 uppercase tracking-widest">Iniciando em</div>
             <div className="text-6xl font-black text-white font-mono countdown-nums">
               {countdown}s
             </div>
             <div className="h-1 w-32 bg-white/10 mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${(countdown / 15) * 100}%`, transition: 'width 1s linear' }} />
             </div>
           </div>
        )}

        {(gameState === "FLYING" || gameState === "CRASHED") && (
          <div className="relative">
             <div className="text-[6rem] md:text-[8rem] font-black font-mono leading-none tracking-tighter drop-shadow-[0_0_30px_rgba(255,102,0,0.3)] transition-colors duration-300"
                style={{ color: gameState === "CRASHED" ? "hsl(var(--destructive))" : "white" }}
             >
               {multiplier.toFixed(2)}x
             </div>
             {gameState === "CRASHED" && showCrashMessage && (
               <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-destructive text-white font-bold px-4 py-1 rounded text-sm uppercase tracking-widest animate-bounce whitespace-nowrap">
                 EXPLODIU!
               </div>
             )}
          </div>
        )}
      </div>

      <div className="absolute inset-0 z-10 w-full h-full">
        <svg 
          viewBox="0 0 1000 500" 
          preserveAspectRatio="xMinYMax meet" 
          className="w-full h-full overflow-hidden"
        >
          <defs>
            <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(24, 100%, 50%)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="hsl(24, 100%, 50%)" stopOpacity="0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {(gameState === "FLYING" || gameState === "CRASHED") && (
            <>
              <path 
                d={`M 0,500 Q ${progress * 500},500 ${progress * 1000},${500 - (progress * 400)} V 500 H 0 Z`}
                fill="url(#gradientArea)"
                className="opacity-50"
              />
              
              <path 
                d={`M 0,500 Q ${progress * 500},500 ${progress * 1000},${500 - (progress * 400)}`} 
                fill="none" 
                stroke="hsl(24, 100%, 50%)"
                strokeWidth="4"
                strokeLinecap="round"
                filter="url(#glow)"
              />

              <image
                href={gameState === "CRASHED" ? crashImage : planeImage}
                x={(progress * 1000) - 120} 
                y={(500 - (progress * 400)) - 67}
                width="240"
                height="135"
                preserveAspectRatio="xMidYMid meet"
                style={{ 
                   transition: gameState === "CRASHED" ? 'none' : 'x 0.2s linear, y 0.2s linear' 
                }}
              />
            </>
          )}
        </svg>
      </div>

      <div className="absolute left-2 bottom-2 top-2 flex flex-col justify-between text-[10px] text-muted-foreground font-mono py-8 pointer-events-none select-none">
         <span>100x</span>
         <span>50x</span>
         <span>10x</span>
         <span>2x</span>
         <span>1x</span>
      </div>
      <div className="absolute left-2 right-2 bottom-2 flex justify-between text-[10px] text-muted-foreground font-mono px-8 pointer-events-none select-none">
         <span>0s</span>
         <span>5s</span>
         <span>10s</span>
         <span>15s</span>
         <span>20s</span>
      </div>
    </div>
  );
}
