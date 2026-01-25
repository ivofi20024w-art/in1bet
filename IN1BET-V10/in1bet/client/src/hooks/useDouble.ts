import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type DoubleColor = "RED" | "BLACK" | "WHITE";
export type DoubleStatus = "WAITING" | "SPINNING" | "FINISHED";

export interface DoubleBet {
  odataUserId: string;
  odataUsername: string;
  betId: string;
  betAmount: number;
  color: DoubleColor;
  winAmount: number | null;
  status: "PENDING" | "WON" | "LOST";
}

export interface DoubleGame {
  gameId: string;
  status: DoubleStatus;
  result: number | null;
  resultColor: DoubleColor | null;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  bets: DoubleBet[];
  startTime: number | null;
  spinTime: number | null;
  nextGameIn: number;
}

export interface DoubleHistory {
  gameId: string;
  result: number;
  resultColor: DoubleColor;
  createdAt: string;
}

export function useDoubleState() {
  return useQuery({
    queryKey: ["double", "state"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/games/double/state");
      const data = await res.json();
      return {
        game: data.game as DoubleGame | null,
        activeBets: data.activeBets as DoubleBet[],
      };
    },
    refetchInterval: 200,
  });
}

export function useDoubleHistory() {
  return useQuery({
    queryKey: ["double", "history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/games/double/history");
      const data = await res.json();
      return (data.history || []) as DoubleHistory[];
    },
    refetchInterval: 5000,
  });
}

export function usePlaceDoubleBet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { betAmount: number; color: DoubleColor; clientSeed?: string }) => {
      const res = await apiRequest("POST", "/api/games/double/bet", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["double", "state"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
