import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SportsMatch, SportsOdd } from "@/hooks/use-sports";

export interface BetSlipItem {
  id: string;
  matchId: string;
  oddId: string;
  odds: number;
  match: {
    id: string;
    homeTeam: { name: string; shortName: string | null };
    awayTeam: { name: string; shortName: string | null };
    startsAt: string;
    isLive: boolean;
    league: { name: string };
  };
  selection: string;
  selectionName: string;
  marketType: string;
}

interface BetSlipState {
  items: BetSlipItem[];
  stake: number;
  addSelection: (match: SportsMatch, odd: SportsOdd) => void;
  removeSelection: (oddId: string) => void;
  clearSlip: () => void;
  setStake: (stake: number) => void;
  hasSelection: (oddId: string) => boolean;
  getTotalOdds: () => number;
  getPotentialWin: () => number;
}

export const useBetSlipStore = create<BetSlipState>()(
  persist(
    (set, get) => ({
      items: [],
      stake: 10,
      
      addSelection: (match: SportsMatch, odd: SportsOdd) => {
        const state = get();
        
        const existingIndex = state.items.findIndex(item => item.matchId === match.id);
        
        const newItem: BetSlipItem = {
          id: `${match.id}-${odd.id}`,
          matchId: match.id,
          oddId: odd.id,
          odds: parseFloat(odd.odds),
          match: {
            id: match.id,
            homeTeam: { name: match.homeTeam.name, shortName: match.homeTeam.shortName },
            awayTeam: { name: match.awayTeam.name, shortName: match.awayTeam.shortName },
            startsAt: match.startsAt,
            isLive: match.isLive,
            league: { name: match.league.name },
          },
          selection: odd.selection,
          selectionName: odd.selectionName,
          marketType: odd.marketType,
        };
        
        if (existingIndex >= 0) {
          const updatedItems = [...state.items];
          updatedItems[existingIndex] = newItem;
          set({ items: updatedItems });
        } else {
          set({ items: [...state.items, newItem] });
        }
      },
      
      removeSelection: (oddId: string) => {
        set(state => ({
          items: state.items.filter(item => item.oddId !== oddId),
        }));
      },
      
      clearSlip: () => set({ items: [], stake: 10 }),
      
      setStake: (stake: number) => set({ stake }),
      
      hasSelection: (oddId: string) => {
        return get().items.some(item => item.oddId === oddId);
      },
      
      getTotalOdds: () => {
        const items = get().items;
        if (items.length === 0) return 0;
        return items.reduce((acc, item) => acc * item.odds, 1);
      },
      
      getPotentialWin: () => {
        const state = get();
        const totalOdds = state.getTotalOdds();
        return state.stake * totalOdds;
      },
    }),
    {
      name: "betslip-storage",
    }
  )
);
