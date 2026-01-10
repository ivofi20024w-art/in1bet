import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";

export interface SportsLeague {
  id: string;
  name: string;
  country: string | null;
  countryCode: string | null;
  sport: string;
  logo: string | null;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface SportsTeam {
  id: string;
  name: string;
  shortName: string | null;
  logo: string | null;
  country: string | null;
  sport: string;
}

export interface SportsOdd {
  id: string;
  matchId: string;
  marketType: string;
  selection: string;
  selectionName: string;
  odds: string;
  line: string | null;
  isActive: boolean;
  isSuspended: boolean;
}

export interface SportsMatch {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  sport: string;
  startsAt: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  period: string | null;
  minute: number | null;
  isLive: boolean;
  isFeatured: boolean;
  streamUrl: string | null;
  result: string | null;
  externalId: string | null;
  league: SportsLeague;
  homeTeam: SportsTeam;
  awayTeam: SportsTeam;
  odds: SportsOdd[];
}

export interface BetSelection {
  matchId: string;
  oddId: string;
  odds: number;
  match?: SportsMatch;
  odd?: SportsOdd;
}

export interface SportsBetSlip {
  id: string;
  betNumber: string;
  userId: string;
  betType: string;
  totalOdds: string;
  stake: string;
  potentialWin: string;
  actualWin: string | null;
  status: string;
  usedBonus: boolean;
  settledAt: string | null;
  createdAt: string;
  selections: Array<{
    id: string;
    matchId: string;
    oddId: string;
    marketType: string;
    selection: string;
    selectionName: string;
    odds: string;
    status: string;
    result: string | null;
    match: SportsMatch & { homeTeam: SportsTeam; awayTeam: SportsTeam };
  }>;
}

export function useLeagues(sport?: string) {
  return useQuery({
    queryKey: ["sports", "leagues", sport],
    queryFn: async () => {
      const url = sport ? `/api/sports/leagues?sport=${sport}` : "/api/sports/leagues";
      const res = await fetch(url);
      const data = await res.json();
      return data.data as SportsLeague[];
    },
  });
}

export function usePopularLeagues() {
  return useQuery({
    queryKey: ["sports", "leagues", "popular"],
    queryFn: async () => {
      const res = await fetch("/api/sports/leagues/popular");
      const data = await res.json();
      return data.data as SportsLeague[];
    },
  });
}

export function useMatches(filters?: {
  sport?: string;
  leagueId?: string;
  live?: boolean;
  featured?: boolean;
  limit?: number;
}) {
  return useQuery({
    queryKey: ["sports", "matches", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.sport) params.set("sport", filters.sport);
      if (filters?.leagueId) params.set("leagueId", filters.leagueId);
      if (filters?.live !== undefined) params.set("live", String(filters.live));
      if (filters?.featured) params.set("featured", "true");
      if (filters?.limit) params.set("limit", String(filters.limit));
      
      const res = await fetch(`/api/sports/matches?${params.toString()}`);
      const data = await res.json();
      return data.data as SportsMatch[];
    },
    refetchInterval: 30000,
  });
}

export function useLiveMatches() {
  return useQuery({
    queryKey: ["sports", "matches", "live"],
    queryFn: async () => {
      const res = await fetch("/api/sports/matches/live");
      const data = await res.json();
      return data.data as SportsMatch[];
    },
    refetchInterval: 10000,
  });
}

export function useFeaturedMatches() {
  return useQuery({
    queryKey: ["sports", "matches", "featured"],
    queryFn: async () => {
      const res = await fetch("/api/sports/matches/featured");
      const data = await res.json();
      return data.data as SportsMatch[];
    },
    refetchInterval: 30000,
  });
}

export function useMatch(id: string) {
  return useQuery({
    queryKey: ["sports", "match", id],
    queryFn: async () => {
      const res = await fetch(`/api/sports/matches/${id}`);
      const data = await res.json();
      return data.data as SportsMatch;
    },
    enabled: !!id,
    refetchInterval: 15000,
  });
}

export function useMyBets(status?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["sports", "my-bets", status],
    queryFn: async () => {
      const url = status ? `/api/sports/my-bets?status=${status}` : "/api/sports/my-bets";
      const res = await apiRequest("GET", url);
      const data = await res.json();
      return data.data as SportsBetSlip[];
    },
    staleTime: 10000,
    enabled,
  });
}

export function usePlaceBet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      selections: BetSelection[];
      stake: number;
      betType: "SINGLE" | "MULTIPLE";
      useBonus?: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/sports/bet", {
        selections: data.selections.map(s => ({
          matchId: s.matchId,
          oddId: s.oddId,
          odds: s.odds,
        })),
        stake: data.stake,
        betType: data.betType,
        useBonus: data.useBonus,
      });
      const result = await res.json();
      if (!result.success) {
        throw new Error(result.error || "Erro ao realizar aposta");
      }
      return result.data as SportsBetSlip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sports", "my-bets"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success("Aposta realizada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao realizar aposta");
    },
  });
}
