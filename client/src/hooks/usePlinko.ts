import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export type PlinkoRisk = "LOW" | "MEDIUM" | "HIGH";
export type PlinkoRows = 8 | 12 | 16;

export interface PlinkoBet {
  betId: string;
  userId: string;
  username: string;
  betAmount: number;
  risk: PlinkoRisk;
  rows: PlinkoRows;
  path: number[];
  bucket: number;
  multiplier: number;
  winAmount: number;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  createdAt: string;
}

export function usePlinkoMultipliers(risk: PlinkoRisk, rows: PlinkoRows) {
  return useQuery({
    queryKey: ["plinko", "multipliers", risk, rows],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/games/plinko/multipliers?risk=${risk}&rows=${rows}`);
      const data = await res.json();
      return data.multipliers as number[];
    },
  });
}

export function usePlinkoHistory() {
  return useQuery({
    queryKey: ["plinko", "history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/games/plinko/history");
      const data = await res.json();
      return (data.history || []) as PlinkoBet[];
    },
    refetchInterval: 5000,
  });
}

export function usePlayPlinko() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { betAmount: number; risk: PlinkoRisk; rows: PlinkoRows; clientSeed?: string }) => {
      const res = await apiRequest("POST", "/api/games/plinko/play", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plinko", "history"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
}
