import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface JackpotInfo {
  currentAmount: number;
  minimumAmount: number;
  isActive: boolean;
  lastWonAt: string | null;
  lastWonBy: string | null;
  lastWonAmount: number | null;
  recentWins: Array<{
    id: string;
    userName: string;
    amount: string;
    gameType: string;
    createdAt: string;
  }>;
}

export function JackpotDisplay() {
  const [displayAmount, setDisplayAmount] = useState(1000);
  const [isAnimating, setIsAnimating] = useState(false);

  const { data } = useQuery<{ success: boolean; data: JackpotInfo }>({
    queryKey: ["/api/jackpot/info"],
    refetchInterval: 3000,
  });

  const jackpot = data?.data;

  useEffect(() => {
    if (jackpot?.currentAmount) {
      const targetAmount = jackpot.currentAmount;
      const diff = targetAmount - displayAmount;
      
      if (Math.abs(diff) > 0.01) {
        setIsAnimating(true);
        const step = diff / 30;
        let current = displayAmount;
        
        const interval = setInterval(() => {
          current += step;
          if ((step > 0 && current >= targetAmount) || (step < 0 && current <= targetAmount)) {
            setDisplayAmount(targetAmount);
            setIsAnimating(false);
            clearInterval(interval);
          } else {
            setDisplayAmount(current);
          }
        }, 50);
        
        return () => {
          clearInterval(interval);
          setIsAnimating(false);
        };
      } else {
        setIsAnimating(false);
      }
    }
  }, [jackpot?.currentAmount]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  if (!jackpot?.isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-card via-card/95 to-card border border-primary/20"
      data-testid="jackpot-display"
    >
      {/* Animated glow on border */}
      <motion.div
        className="absolute inset-0 rounded-xl pointer-events-none"
        animate={{
          boxShadow: [
            "inset 0 0 0 1px rgba(249, 115, 22, 0.1), 0 0 20px rgba(249, 115, 22, 0.05)",
            "inset 0 0 0 1px rgba(249, 115, 22, 0.4), 0 0 40px rgba(249, 115, 22, 0.2)",
            "inset 0 0 0 1px rgba(249, 115, 22, 0.1), 0 0 20px rgba(249, 115, 22, 0.05)",
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent pointer-events-none"
        animate={{
          x: ["-100%", "200%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          repeatDelay: 2,
        }}
        style={{ width: "50%" }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-between px-3 py-2.5 md:px-5 md:py-4 gap-2 md:gap-4">
        {/* Left side: Trophy + Text */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
          {/* Trophy with spinning rings - loader style */}
          <div className="relative flex-shrink-0">
            {/* Outer spinning ring */}
            <motion.div
              className="absolute inset-[-6px] md:inset-[-8px] border-2 border-transparent border-t-primary border-r-primary/30 rounded-full"
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            {/* Inner spinning ring - reverse */}
            <motion.div
              className="absolute inset-[-3px] md:inset-[-4px] border border-transparent border-b-primary/50 border-l-primary/20 rounded-full"
              animate={{ rotate: -360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            {/* Trophy container with glow */}
            <motion.div
              className="relative w-9 h-9 md:w-12 md:h-12 rounded-full bg-card flex items-center justify-center border border-primary/30"
              animate={{
                boxShadow: [
                  "0 0 15px rgba(249, 115, 22, 0.2)",
                  "0 0 30px rgba(249, 115, 22, 0.4)",
                  "0 0 15px rgba(249, 115, 22, 0.2)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Trophy className="w-4 h-4 md:w-6 md:h-6 text-primary" />
            </motion.div>
            
            {/* Pulse effect when animating */}
            <AnimatePresence>
              {isAnimating && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-2 border-primary"
                />
              )}
            </AnimatePresence>
          </div>
          
          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider font-medium mb-0.5">
              <span>Jackpot IN1BET</span>
            </div>
            
            <motion.div
              className="flex items-baseline gap-1"
              animate={{ scale: isAnimating ? [1, 1.02, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.span 
                className="text-lg md:text-3xl font-bold text-white tabular-nums" 
                data-testid="jackpot-amount"
                animate={{
                  textShadow: [
                    "0 0 10px rgba(249, 115, 22, 0)",
                    "0 0 20px rgba(249, 115, 22, 0.3)",
                    "0 0 10px rgba(249, 115, 22, 0)",
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {formatCurrency(displayAmount)}
              </motion.span>
            </motion.div>
            
            {/* Explanation message - split in two lines on mobile */}
            <p className="text-[9px] md:text-[11px] text-muted-foreground mt-0.5 md:mt-1 leading-tight">
              <span className="md:hidden">O Jackpot cresce automaticamente<br/>conforme as apostas são realizadas.</span>
              <span className="hidden md:inline">O Jackpot cresce automaticamente conforme as apostas são realizadas.</span>
            </p>
          </div>
        </div>

        {/* Right side: Last winner section */}
        <div className="flex items-center gap-2 md:gap-6 flex-shrink-0">
          {jackpot.lastWonBy ? (
            <div className="flex flex-col items-end bg-white/5 rounded-lg px-2 py-1.5 md:px-4 md:py-2 border border-white/5">
              <div className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5 md:mb-1">
                Último Ganhador
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <User className="w-3 h-3 md:w-4 md:h-4 text-primary" />
                <span className="text-[11px] md:text-sm font-medium text-white">{jackpot.lastWonBy}</span>
              </div>
              {jackpot.lastWonAmount && (
                <motion.div 
                  className="text-[11px] md:text-sm font-bold text-green-500"
                  animate={{
                    textShadow: [
                      "0 0 5px rgba(34, 197, 94, 0)",
                      "0 0 10px rgba(34, 197, 94, 0.5)",
                      "0 0 5px rgba(34, 197, 94, 0)",
                    ],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {formatCurrency(jackpot.lastWonAmount)}
                </motion.div>
              )}
              {jackpot.lastWonAt && (
                <div className="hidden md:flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(jackpot.lastWonAt)}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-end bg-white/5 rounded-lg px-2 py-1.5 md:px-4 md:py-2 border border-white/5">
              <div className="text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5 md:mb-1">
                Último Ganhador
              </div>
              <div className="text-[10px] md:text-xs text-primary italic whitespace-nowrap">
                Seja o primeiro!
              </div>
            </div>
          )}
          
          {/* Animated dots - loader style */}
          <div className="hidden md:flex flex-col gap-1">
            <motion.span 
              className="w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0 }}
            />
            <motion.span 
              className="w-1.5 h-1.5 bg-white/50 rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
            />
            <motion.span 
              className="w-1.5 h-1.5 bg-primary rounded-full"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      </div>

      {/* Animated bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent"
        animate={{
          opacity: [0.3, 0.8, 0.3],
          scaleX: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </motion.div>
  );
}

export function JackpotWinNotification({ 
  amount, 
  userName,
  onClose 
}: { 
  amount: number; 
  userName: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50, scale: 0.9 }}
        animate={{ y: 0, scale: 1 }}
        className="relative bg-card rounded-2xl p-8 border border-primary/30 text-center max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        
        {/* Shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent pointer-events-none"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          style={{ width: "50%" }}
        />
        
        {/* Trophy with spinning rings */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <motion.div
            className="absolute inset-[-12px] border-[3px] border-transparent border-t-primary border-r-primary/30 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute inset-[-6px] border-2 border-transparent border-b-primary/50 border-l-primary/20 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{ duration: 0.6, repeat: 2 }}
            className="relative w-full h-full"
          >
            <div className="w-full h-full rounded-full bg-card flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(249,115,22,0.3)]">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
          </motion.div>
        </div>
        
        <h2 className="text-3xl font-bold text-primary mb-2 relative">JACKPOT!</h2>
        <p className="text-muted-foreground mb-4 relative">
          <span className="text-white font-medium">{userName}</span> ganhou o jackpot!
        </p>
        <motion.div
          className="text-4xl font-bold text-white mb-6 relative"
          animate={{ 
            scale: [1, 1.05, 1],
            textShadow: [
              "0 0 20px rgba(249, 115, 22, 0.3)",
              "0 0 40px rgba(249, 115, 22, 0.6)",
              "0 0 20px rgba(249, 115, 22, 0.3)",
            ],
          }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)}
        </motion.div>
        
        {/* Animated dots */}
        <div className="flex justify-center gap-2 mb-4">
          <motion.span 
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
          />
          <motion.span 
            className="w-2 h-2 bg-white/50 rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
          />
          <motion.span 
            className="w-2 h-2 bg-primary rounded-full"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
          />
        </div>
        
        <button
          onClick={onClose}
          className="relative px-8 py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl transition-colors"
          data-testid="close-jackpot-notification"
        >
          Fechar
        </button>
      </motion.div>
    </motion.div>
  );
}
