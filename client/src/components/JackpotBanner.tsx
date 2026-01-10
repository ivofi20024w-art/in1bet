import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import jackpotBg from "@assets/jackpot-banner-bg.png";

interface JackpotInfo {
  currentAmount: number;
  minimumAmount: number;
  isActive: boolean;
  lastWonAt: string | null;
  lastWonBy: string | null;
  lastWonAmount: number | null;
}

function AnimatedValue({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);
  
  useEffect(() => {
    if (prevValue.current === value) return;
    
    const startValue = prevValue.current;
    const diff = value - startValue;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = startValue + diff * easeOut;
      setDisplayValue(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevValue.current = value;
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, duration]);
  
  const formatCurrency = (val: number) => {
    const [intPart, decPart] = val.toFixed(2).split('.');
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return { intPart: formattedInt, decPart };
  };
  
  const { intPart, decPart } = formatCurrency(displayValue);
  
  return (
    <span className="tabular-nums">
      R$ {intPart}<span className="text-[0.65em] opacity-90">,{decPart}</span>
    </span>
  );
}

export function JackpotBanner() {
  const { data } = useQuery<{ success: boolean; data: JackpotInfo }>({
    queryKey: ["/api/jackpot/info"],
    refetchInterval: 3000,
  });

  const jackpot = data?.data;
  const currentAmount = jackpot?.currentAmount ?? 1000;
  const lastWinner = jackpot?.lastWonBy;
  
  if (!jackpot?.isActive) return null;

  return (
    <section className="mb-8" data-testid="jackpot-banner">
      <div className="relative w-full">
        <img 
          src={jackpotBg}
          alt="Jackpot IN1BET"
          className="w-full h-auto"
        />
        
        <div className="absolute inset-0">
          <div 
            className="absolute flex flex-col justify-center"
            style={{
              left: '44%',
              top: '20%',
              width: '38%',
              height: '60%',
            }}
          >
            <h2
              className="text-[8px] xs:text-[10px] sm:text-xs md:text-sm lg:text-base font-bold tracking-[0.15em] uppercase mb-0.5 sm:mb-1 md:mb-2"
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF7A1A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Jackpot IN1BET
            </h2>
            
            <div
              className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-none mb-0.5 sm:mb-1 md:mb-2"
              style={{
                textShadow: "0 2px 10px rgba(0,0,0,0.8)",
              }}
              data-testid="jackpot-value"
            >
              <AnimatedValue value={currentAmount} />
            </div>
            
            <p className="text-[6px] xs:text-[7px] sm:text-[9px] md:text-xs lg:text-sm text-white/60 leading-tight">
              O Jackpot cresce automaticamente conforme as apostas são realizadas.
            </p>
          </div>
          
          <div 
            className="absolute flex items-center justify-center"
            style={{
              right: '6.8%',
              top: '24.5%',
              width: '17%',
              height: '50%',
            }}
          >
            <div
              className="w-full text-center"
              data-testid="jackpot-last-winner"
            >
              <p className="text-[6px] xs:text-[7px] sm:text-[8px] md:text-[10px] lg:text-xs font-semibold text-white/90 uppercase tracking-wide mb-0.5 md:mb-1">
                Último Ganhador
              </p>
              <p className="text-[7px] xs:text-[8px] sm:text-[10px] md:text-xs lg:text-sm font-bold text-primary truncate px-1" data-testid="jackpot-winner-name">
                {lastWinner || "Seja o primeiro!"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
