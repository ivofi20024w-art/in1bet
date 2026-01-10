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
      <div className="relative w-full overflow-hidden rounded-xl">
        <img 
          src={jackpotBg}
          alt="Jackpot IN1BET"
          className="w-full h-auto"
        />
        
        <div 
          className="absolute inset-0 flex items-center justify-between"
          style={{
            paddingLeft: 'calc(40% + 40px)',
            paddingRight: '5%',
          }}
        >
          <div className="flex-shrink-0" style={{ maxWidth: '40%' }}>
            <h2
              className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold tracking-[0.15em] uppercase text-left"
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF7A1A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                marginBottom: '10px',
              }}
            >
              Jackpot IN1BET
            </h2>
            
            <div
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-none text-left"
              style={{
                textShadow: "0 2px 20px rgba(255, 122, 26, 0.4), 0 4px 40px rgba(0,0,0,0.8)",
                marginBottom: '14px',
              }}
              data-testid="jackpot-value"
            >
              <AnimatedValue value={currentAmount} />
            </div>
            
            <p className="text-[10px] sm:text-xs md:text-sm text-white/75 leading-relaxed text-left">
              O Jackpot cresce automaticamente conforme as apostas são realizadas.
            </p>
          </div>
          
        </div>
        
        <div 
          className="absolute flex flex-col items-center justify-center"
          style={{
            top: '32%',
            right: '10%',
            width: '18%',
            height: '22%',
          }}
          data-testid="jackpot-last-winner"
        >
          <p className="text-[8px] sm:text-[10px] md:text-xs font-semibold text-white/80 uppercase tracking-wider mb-1 text-center">
            Último Ganhador
          </p>
          <p 
            className="text-[10px] sm:text-xs md:text-sm font-bold text-center"
            style={{ color: "#FF7A1A" }}
            data-testid="jackpot-winner-name"
          >
            {lastWinner || "Seja o primeiro!"}
          </p>
        </div>
      </div>
    </section>
  );
}
