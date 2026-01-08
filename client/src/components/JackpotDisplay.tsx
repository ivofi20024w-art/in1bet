import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Sparkles, Star, Coins } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

function GlowingParticle({ delay, duration, left }: { delay: number; duration: number; left: string }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-yellow-300"
      style={{ left, bottom: 0 }}
      initial={{ opacity: 0, y: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-5, -40, -60, -80],
        scale: [0, 1.5, 1, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
}

function FloatingStar({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute text-yellow-400/60"
      style={{ left: `${x}%`, top: '50%' }}
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 0.8, 0],
        scale: [0.5, 1, 0.5],
        rotate: [0, 180, 360],
        y: [-10, -20, -10],
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Star className={`w-${size} h-${size}`} style={{ width: size * 4, height: size * 4 }} fill="currentColor" />
    </motion.div>
  );
}

export function JackpotDisplay() {
  const [displayAmount, setDisplayAmount] = useState(1000);
  const [isAnimating, setIsAnimating] = useState(false);

  const { data } = useQuery<{ success: boolean; data: JackpotInfo }>({
    queryKey: ["/api/jackpot/info"],
    refetchInterval: 3000,
  });

  const jackpot = data?.data;

  const particles = useMemo(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      delay: i * 0.3,
      duration: 2 + Math.random() * 1.5,
      left: `${5 + i * 8}%`,
    })), []
  );

  const stars = useMemo(() => 
    Array.from({ length: 5 }, (_, i) => ({
      id: i,
      delay: i * 0.8,
      x: 10 + i * 20,
      size: 2 + Math.random() * 2,
    })), []
  );

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
        
        return () => clearInterval(interval);
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

  if (!jackpot?.isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl"
      data-testid="jackpot-display"
    >
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-r from-amber-900 via-yellow-700 to-amber-900"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ backgroundSize: "200% 100%" }}
      />
      
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
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

      {/* Dark overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <GlowingParticle key={p.id} delay={p.delay} duration={p.duration} left={p.left} />
        ))}
      </div>

      {/* Floating stars */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stars.map((s) => (
          <FloatingStar key={s.id} delay={s.delay} x={s.x} size={s.size} />
        ))}
      </div>

      {/* Glowing border */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        style={{
          boxShadow: "inset 0 0 0 2px rgba(251, 191, 36, 0.5)",
        }}
        animate={{
          boxShadow: [
            "inset 0 0 0 2px rgba(251, 191, 36, 0.3), 0 0 20px rgba(251, 191, 36, 0.2)",
            "inset 0 0 0 2px rgba(251, 191, 36, 0.6), 0 0 40px rgba(251, 191, 36, 0.4)",
            "inset 0 0 0 2px rgba(251, 191, 36, 0.3), 0 0 20px rgba(251, 191, 36, 0.2)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Content */}
      <div className="relative flex items-center justify-between p-5 md:p-6">
        <div className="flex items-center gap-4">
          {/* Animated trophy icon */}
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <Trophy className="w-10 h-10 md:w-12 md:h-12 text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]" />
              
              {/* Trophy glow */}
              <motion.div
                className="absolute inset-0 blur-md"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Trophy className="w-10 h-10 md:w-12 md:h-12 text-yellow-400" />
              </motion.div>
            </motion.div>
            
            {/* Sparkle effects around trophy */}
            <AnimatePresence>
              {isAnimating && (
                <>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-200" />
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: 0.1 }}
                    className="absolute -bottom-1 -left-2"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Coins icon */}
            <motion.div
              className="absolute -bottom-1 -right-1"
              animate={{
                y: [0, -3, 0],
                rotate: [0, 10, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            >
              <Coins className="w-5 h-5 text-yellow-200" />
            </motion.div>
          </div>
          
          {/* Text content */}
          <div>
            <motion.div 
              className="text-xs md:text-sm text-yellow-100/90 uppercase tracking-[0.2em] font-bold flex items-center gap-2"
              animate={{
                textShadow: [
                  "0 0 10px rgba(253,224,71,0.3)",
                  "0 0 20px rgba(253,224,71,0.5)",
                  "0 0 10px rgba(253,224,71,0.3)",
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
              Jackpot Progressivo
              <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
            </motion.div>
            
            {/* Jackpot amount with glow */}
            <motion.div
              className="relative"
              animate={{ scale: isAnimating ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-200"
                data-testid="jackpot-amount"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ 
                  backgroundSize: "200% 100%",
                  textShadow: "0 0 30px rgba(253,224,71,0.5), 0 2px 4px rgba(0,0,0,0.3)",
                  WebkitTextStroke: "1px rgba(253,224,71,0.3)",
                }}
              >
                {formatCurrency(displayAmount)}
              </motion.div>
              
              {/* Glow layer behind text */}
              <motion.div
                className="absolute inset-0 text-3xl md:text-4xl font-black text-yellow-400 blur-md opacity-50 pointer-events-none"
                aria-hidden="true"
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {formatCurrency(displayAmount)}
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Last winner section */}
        {jackpot.lastWonBy && (
          <motion.div 
            className="text-right hidden sm:block"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-xs text-yellow-200/60 uppercase tracking-wider">Último vencedor</div>
            <div className="text-sm md:text-base font-bold text-yellow-100">{jackpot.lastWonBy}</div>
            {jackpot.lastWonAmount && (
              <motion.div 
                className="text-sm font-bold text-green-400"
                animate={{
                  textShadow: [
                    "0 0 5px rgba(74,222,128,0.3)",
                    "0 0 15px rgba(74,222,128,0.5)",
                    "0 0 5px rgba(74,222,128,0.3)",
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
          </motion.div>
        )}
      </div>

      {/* Animated bottom glow line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
        animate={{
          opacity: [0.5, 1, 0.5],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-400/50 rounded-tl-2xl" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-400/50 rounded-tr-2xl" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-400/50 rounded-bl-2xl" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-yellow-400/50 rounded-br-2xl" />
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="relative bg-gradient-to-b from-yellow-600/40 to-amber-900/40 rounded-2xl p-8 border border-yellow-500/50 text-center max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background shimmer */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "50%" }}
        />
        
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_20px_rgba(253,224,71,0.5)]" />
        </motion.div>
        
        <motion.h2 
          className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-2"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ backgroundSize: "200% 100%" }}
        >
          JACKPOT!
        </motion.h2>
        <p className="text-gray-300 mb-4">
          {userName} acaba de ganhar o
        </p>
        <motion.div
          className="text-5xl font-black text-yellow-300 mb-6"
          animate={{ 
            scale: [1, 1.1, 1],
            textShadow: [
              "0 0 20px rgba(253,224,71,0.5)",
              "0 0 40px rgba(253,224,71,0.8)",
              "0 0 20px rgba(253,224,71,0.5)",
            ],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)}
        </motion.div>
        
        <button
          onClick={onClose}
          className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold rounded-xl transition-all shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50"
          data-testid="close-jackpot-notification"
        >
          Fechar
        </button>
      </motion.div>
    </motion.div>
  );
}
