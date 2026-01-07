import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Flame, Shield, Gift, Trophy, Lock, Check, Sparkles, Coins } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StreakReward {
  id: string;
  streakDay: number;
  rewardType: "XP" | "BONUS_CASH" | "STREAK_PROTECTION";
  rewardValue: number;
  isActive: boolean;
}

interface UserStreak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletionDate: string | null;
  streakProtections: number;
  totalMissionsCompleted: number;
}

interface StreakApiResponse {
  success: boolean;
  data: {
    currentStreak: number;
    longestStreak: number;
    lastCompletionDate: string | null;
    streakProtections: number;
    totalMissionsCompleted: number;
    availableRewards: Array<{
      streakDay: number;
      rewardType: string;
      rewardValue: number;
    }>;
    claimedDays: number[];
  };
}

interface AllRewardsResponse {
  success: boolean;
  data: StreakReward[];
}

const getRewardIcon = (type: string) => {
  switch (type) {
    case "XP":
      return <Sparkles className="h-4 w-4 text-purple-400" />;
    case "BONUS_CASH":
      return <Coins className="h-4 w-4 text-yellow-400" />;
    case "STREAK_PROTECTION":
      return <Shield className="h-4 w-4 text-blue-400" />;
    default:
      return <Gift className="h-4 w-4 text-green-400" />;
  }
};

const getRewardLabel = (type: string, value: number) => {
  switch (type) {
    case "XP":
      return `${value} XP`;
    case "BONUS_CASH":
      return `R$ ${value.toFixed(2)}`;
    case "STREAK_PROTECTION":
      return `${value} Proteção${value > 1 ? "ões" : ""}`;
    default:
      return `${value}`;
  }
};

function StreakDayBadge({
  day,
  currentStreak,
  isClaimed,
  reward,
  isAvailable,
  onClaim,
  isClaiming,
}: {
  day: number;
  currentStreak: number;
  isClaimed: boolean;
  reward?: StreakReward | { streakDay: number; rewardType: string; rewardValue: number };
  isAvailable: boolean;
  onClaim: () => void;
  isClaiming: boolean;
}) {
  const isReached = currentStreak >= day;
  const isLocked = !isReached;
  const canClaim = isAvailable && !isClaimed;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all",
        isLocked && "bg-muted/20 border-white/5 opacity-50",
        isReached && !isClaimed && !canClaim && "bg-primary/10 border-primary/30",
        isClaimed && "bg-green-500/10 border-green-500/30",
        canClaim && "bg-yellow-500/10 border-yellow-500/50 ring-2 ring-yellow-500/30 animate-pulse"
      )}
    >
      {reward && (
        <div className="absolute -top-2 -right-2">
          <div
            className={cn(
              "p-1 rounded-full",
              isClaimed ? "bg-green-500" : canClaim ? "bg-yellow-500" : isReached ? "bg-primary" : "bg-muted"
            )}
          >
            {isClaimed ? (
              <Check className="h-3 w-3 text-white" />
            ) : isLocked ? (
              <Lock className="h-3 w-3 text-muted-foreground" />
            ) : (
              getRewardIcon(reward.rewardType)
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 mb-1">
        <Flame
          className={cn(
            "h-4 w-4",
            isReached ? "text-orange-500" : "text-muted-foreground"
          )}
        />
        <span
          className={cn(
            "text-lg font-bold",
            isReached ? "text-white" : "text-muted-foreground"
          )}
        >
          {day}
        </span>
      </div>

      {reward && (
        <div className="text-xs text-center">
          <div className={cn("font-medium", isLocked ? "text-muted-foreground" : "text-white")}>
            {getRewardLabel(reward.rewardType, parseFloat(reward.rewardValue.toString()))}
          </div>
        </div>
      )}

      {canClaim && (
        <Button
          size="sm"
          variant="default"
          className="mt-2 h-6 text-xs px-2 bg-yellow-500 hover:bg-yellow-600"
          onClick={onClaim}
          disabled={isClaiming}
          data-testid={`button-claim-streak-${day}`}
        >
          <Gift className="h-3 w-3 mr-1" />
          Resgatar
        </Button>
      )}
    </div>
  );
}

export function StreakCard() {
  const queryClient = useQueryClient();

  const { data: streakResponse, isLoading } = useQuery<StreakApiResponse>({
    queryKey: ["/api/missions/streak"],
    refetchInterval: 30000,
  });

  const { data: allRewardsResponse } = useQuery<AllRewardsResponse>({
    queryKey: ["/api/missions/streak/rewards"],
  });

  const claimMutation = useMutation({
    mutationFn: async (streakDay: number) => {
      const res = await apiRequest("POST", "/api/missions/streak/claim", { streakDay });
      return res.json();
    },
    onSuccess: (data) => {
      const label = getRewardLabel(data.reward?.type || data.rewardType, data.reward?.value || data.rewardValue);
      toast.success(`Recompensa de streak resgatada: ${label}`);
      queryClient.invalidateQueries({ queryKey: ["/api/missions/streak"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/levels/info"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao resgatar recompensa");
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
        <CardContent className="p-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="h-16 w-16 bg-muted rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-32"></div>
              <div className="h-3 bg-muted rounded w-48"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!streakResponse?.success || !streakResponse.data) {
    return null;
  }

  const streakData = streakResponse.data;
  const allRewards = allRewardsResponse?.data || [];
  const displayDays = [1, 3, 7, 14, 21, 30, 60, 90];

  const streak = {
    currentStreak: streakData.currentStreak,
    longestStreak: streakData.longestStreak,
    streakProtections: streakData.streakProtections,
    totalMissionsCompleted: streakData.totalMissionsCompleted,
  };
  const availableRewards = streakData.availableRewards;
  const claimedDays = streakData.claimedDays;

  return (
    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg shadow-orange-500/20">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl" data-testid="text-streak-count">
                {streak.currentStreak} Dias de Streak
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Recorde: {streak.longestStreak} dias
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {streak.streakProtections > 0 && (
              <div className="flex items-center gap-2 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-500/20">
                <Shield className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400" data-testid="text-streak-protections">
                  {streak.streakProtections} Proteção{streak.streakProtections > 1 ? "ões" : ""}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-2 rounded-lg border border-purple-500/20">
              <Trophy className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-400" data-testid="text-total-missions">
                {streak.totalMissionsCompleted} Missões
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Recompensas de Streak
          </h4>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {displayDays.map((day) => {
              const reward = allRewards?.find((r) => r.streakDay === day);
              const isClaimed = claimedDays.includes(day);
              const isAvailable = availableRewards.some((r) => r.streakDay === day);

              return (
                <StreakDayBadge
                  key={day}
                  day={day}
                  currentStreak={streak.currentStreak}
                  isClaimed={isClaimed}
                  reward={reward}
                  isAvailable={isAvailable}
                  onClaim={() => claimMutation.mutate(day)}
                  isClaiming={claimMutation.isPending}
                />
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <p className="text-xs text-muted-foreground">
            Complete missões diariamente para manter seu streak ativo
          </p>
          {availableRewards.length > 0 && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 animate-pulse">
              {availableRewards.length} recompensa{availableRewards.length > 1 ? "s" : ""} disponível
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
