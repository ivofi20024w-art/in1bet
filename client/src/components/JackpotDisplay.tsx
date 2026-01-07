import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Sparkles } from "lucide-react";
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
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-600/20 via-amber-500/20 to-yellow-600/20 border border-yellow-500/30 p-4"
      data-testid="jackpot-display"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-amber-400/10 to-yellow-500/5" />
      
      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Trophy className="w-8 h-8 text-yellow-400" />
            <AnimatePresence>
              {isAnimating && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div>
            <div className="text-xs text-yellow-400/80 uppercase tracking-wider font-medium">
              Jackpot Progressivo
            </div>
            <motion.div
              className="text-2xl font-bold text-yellow-400"
              animate={{ scale: isAnimating ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 0.3 }}
              data-testid="jackpot-amount"
            >
              {formatCurrency(displayAmount)}
            </motion.div>
          </div>
        </div>

        {jackpot.lastWonBy && (
          <div className="text-right">
            <div className="text-xs text-gray-400">Último vencedor</div>
            <div className="text-sm text-yellow-400">{jackpot.lastWonBy}</div>
            {jackpot.lastWonAmount && (
              <div className="text-xs text-green-400">
                {formatCurrency(jackpot.lastWonAmount)}
              </div>
            )}
          </div>
        )}
      </div>

      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
        animate={{
          opacity: [0.3, 0.7, 0.3],
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="relative bg-gradient-to-b from-yellow-600/40 to-amber-900/40 rounded-2xl p-8 border border-yellow-500/50 text-center max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{ duration: 0.5, repeat: 3 }}
        >
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
        </motion.div>
        
        <h2 className="text-3xl font-bold text-yellow-400 mb-2">JACKPOT!</h2>
        <p className="text-gray-300 mb-4">
          {userName} acaba de ganhar o
        </p>
        <motion.div
          className="text-4xl font-bold text-yellow-300 mb-6"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(amount)}
        </motion.div>
        
        <button
          onClick={onClose}
          className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors"
          data-testid="close-jackpot-notification"
        >
          Fechar
        </button>
      </motion.div>
    </motion.div>
  );
}
