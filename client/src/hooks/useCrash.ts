import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface CrashPlayer {
  odataUserId: string;
  odataUsername: string;
  betId: string;
  betAmount: number;
  cashoutMultiplier: number | null;
  winAmount: number | null;
  status: "ACTIVE" | "WON" | "LOST";
}

export interface CrashGameState {
  gameId: string;
  status: "WAITING" | "RUNNING" | "CRASHED";
  startTime: number | null;
  crashPoint: number | null;
  currentMultiplier: number;
  players: CrashPlayer[];
  serverSeedHash: string;
  nextGameIn: number;
}

export interface CrashHistory {
  gameId: string;
  crashPoint: number;
  createdAt: string;
}

export function useCrashState() {
  return useQuery({
    queryKey: ["crash", "state"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/games/crash/state");
      const data = await res.json();
      return {
        game: data.game as CrashGameState | null,
        activeBet: data.activeBet as CrashPlayer | null,
      };
    },
    refetchInterval: 100,
  });
}

export function useCrashHistory() {
  return useQuery({
    queryKey: ["crash", "history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/games/crash/history");
      const data = await res.json();
      return (data.history || []) as CrashHistory[];
    },
    refetchInterval: 5000,
  });
}

export function usePlaceCrashBet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { betAmount: number; autoCashout?: number; clientSeed?: string }) => {
      const res = await apiRequest("POST", "/api/games/crash/bet", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crash", "state"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}

export function useCrashCashout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (betId: string) => {
      const res = await apiRequest("POST", "/api/games/crash/cashout", { betId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crash", "state"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
