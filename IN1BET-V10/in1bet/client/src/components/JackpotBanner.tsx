import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import jackpotBg from "@assets/ChatGPT_Image_10_01_2026,_23_38_48_1769032748300.png";

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
      R$ {intPart}<span className="text-[0.6em] opacity-80">,{decPart}</span>
    </span>
  );
}

interface JackpotBannerProps {
  chatOpen?: boolean;
}

export function JackpotBanner({ chatOpen = false }: JackpotBannerProps) {
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
      <div 
        className="relative w-full overflow-hidden rounded-xl"
        style={{
          backgroundImage: `url(${jackpotBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '120px',
          aspectRatio: '16 / 5',
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
          data-testid="jackpot-value"
        >
          <p 
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-none whitespace-nowrap"
            style={{
              textShadow: "0 2px 20px rgba(255, 122, 26, 0.6), 0 4px 40px rgba(0,0,0,0.8)",
            }}
          >
            <AnimatedValue value={currentAmount} />
          </p>
        </div>
        
        <div 
          className={`absolute top-[42%] -translate-y-1/2 flex items-center justify-center w-[85px] sm:w-[100px] md:w-[120px] lg:w-[180px] xl:w-[200px] right-[11%] sm:right-[12%] md:right-[13%] ${chatOpen ? 'lg:right-[8%] xl:right-[8%]' : 'lg:right-[10%] xl:right-[10%]'}`}
          data-testid="jackpot-last-winner"
        >
          <p 
            className="text-[10px] sm:text-xs md:text-sm lg:text-xl xl:text-2xl font-bold text-center w-full"
            style={{ color: "#FFD700" }}
            data-testid="jackpot-winner-name"
          >
            {lastWinner || "Seja o primeiro!"}
          </p>
        </div>
      </div>
    </section>
  );
}
