import { create } from "zustand";

export interface PlinkoState {
  money: number;
  totalWins: number;
  activeBalls: number;
  betAmount: number;
  autoDrop: boolean;
  isJackpot: boolean;
  showBigWin: boolean;
  lastWin: number;
  isLoading: boolean;
  error: string | null;
  
  setMoney: (money: number) => void;
  incrementActiveBalls: () => boolean;
  decrementActiveBalls: () => void;
  setLastWin: (amount: number, isJackpot: boolean) => void;
  toggleAutoDrop: () => void;
  setBetAmount: (amount: number) => void;
  resetGame: () => void;
  hideBigWin: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const MAX_BALLS = 15;

export const usePlinko = create<PlinkoState>()((set, get) => ({
  money: 0,
  totalWins: 0,
  activeBalls: 0,
  betAmount: 10,
  autoDrop: false,
  isJackpot: false,
  showBigWin: false,
  lastWin: 0,
  isLoading: false,
  error: null,
  
  setMoney: (money: number) => set({ money }),
  
  incrementActiveBalls: () => {
    const { activeBalls } = get();
    if (activeBalls >= MAX_BALLS) {
      return false;
    }
    set((state) => ({
      activeBalls: state.activeBalls + 1,
    }));
    return true;
  },
  
  decrementActiveBalls: () => {
    set((state) => ({
      activeBalls: Math.max(0, state.activeBalls - 1),
    }));
  },
  
  setLastWin: (amount: number, isJackpot: boolean) => {
    set({
      lastWin: amount,
      totalWins: get().totalWins + amount,
      isJackpot: isJackpot,
      showBigWin: isJackpot,
    });
    
    if (isJackpot) {
      setTimeout(() => {
        set({ showBigWin: false, isJackpot: false });
      }, 2500);
    }
  },
  
  toggleAutoDrop: () => {
    set((state) => ({ autoDrop: !state.autoDrop }));
  },
  
  setBetAmount: (amount: number) => {
    const validAmount = Math.max(0.10, Math.min(1000, amount));
    set({ betAmount: validAmount });
  },
  
  resetGame: () => {
    set({
      totalWins: 0,
      activeBalls: 0,
      autoDrop: false,
      isJackpot: false,
      showBigWin: false,
      lastWin: 0,
      error: null,
    });
  },
  
  hideBigWin: () => {
    set({ showBigWin: false, isJackpot: false });
  },
  
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  
  setError: (error: string | null) => set({ error }),
}));
