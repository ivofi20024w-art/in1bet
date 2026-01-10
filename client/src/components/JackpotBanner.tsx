import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
      R$ {intPart}<span className="text-[0.6em] opacity-80">,{decPart}</span>
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
      <div className="relative w-full overflow-hidden rounded-2xl">
        <img 
          src={jackpotBg}
          alt="Jackpot IN1BET"
          className="w-full h-auto object-contain"
        />
        
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            boxShadow: [
              "inset 0 0 60px 20px rgba(255, 122, 26, 0.0)",
              "inset 0 0 100px 40px rgba(255, 122, 26, 0.15)",
              "inset 0 0 60px 20px rgba(255, 122, 26, 0.0)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <div className="absolute inset-0 flex items-center">
          <div className="w-[45%]" />
          
          <div className="flex-1 flex flex-col justify-center pr-[15%] md:pr-[18%]">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[10px] sm:text-xs md:text-sm lg:text-base font-bold tracking-[0.2em] uppercase mb-1 md:mb-2"
              style={{
                background: "linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF7A1A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "0 0 30px rgba(255, 165, 0, 0.5)",
              }}
            >
              Jackpot IN1BET
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-lg sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white leading-none mb-1 md:mb-3"
              style={{
                textShadow: "0 0 40px rgba(255, 122, 26, 0.6), 0 4px 20px rgba(0,0,0,0.8)",
              }}
              data-testid="jackpot-value"
            >
              <AnimatedValue value={currentAmount} />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[8px] sm:text-[10px] md:text-xs lg:text-sm text-white/70 max-w-[200px] md:max-w-[300px] leading-tight"
            >
              O Jackpot cresce automaticamente conforme as apostas são realizadas.
            </motion.p>
          </div>
          
          <div className="absolute right-[4%] top-[18%] md:top-[20%] w-[20%] md:w-[16%]">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/50 backdrop-blur-md rounded-lg border border-primary/30 p-2 md:p-3 shadow-lg shadow-black/30"
              data-testid="jackpot-last-winner"
            >
              <p className="text-[7px] sm:text-[8px] md:text-[10px] lg:text-xs font-semibold text-white/90 uppercase tracking-wide mb-0.5 md:mb-1">
                Último Ganhador
              </p>
              <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-bold text-primary truncate" data-testid="jackpot-winner-name">
                {lastWinner || "Seja o primeiro!"}
              </p>
            </motion.div>
          </div>
        </div>
        
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 40% at 25% 50%, rgba(255, 200, 100, 0.15), transparent 60%)",
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </section>
  );
}
