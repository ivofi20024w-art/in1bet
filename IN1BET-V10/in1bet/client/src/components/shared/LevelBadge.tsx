import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useId } from "react";

interface LevelBadgeProps {
  level: number;
  progressPercent: number;
  xpProgress?: number;
  xpNeeded?: number;
  className?: string;
}

type TierInfo = {
  name: string;
  colorFrom: string;
  colorTo: string;
  glowColor: string;
  bgGradient: string;
  textColor: string;
};

function getTierInfo(level: number): TierInfo {
  if (level >= 500) {
    return {
      name: "DIAMANTE",
      colorFrom: "#60a5fa",
      colorTo: "#3b82f6",
      glowColor: "rgba(96, 165, 250, 0.5)",
      bgGradient: "from-blue-500/20 via-blue-400/10 to-blue-500/20",
      textColor: "text-blue-400",
    };
  }
  if (level >= 300) {
    return {
      name: "PLATINA",
      colorFrom: "#a78bfa",
      colorTo: "#8b5cf6",
      glowColor: "rgba(167, 139, 250, 0.5)",
      bgGradient: "from-violet-500/20 via-violet-400/10 to-violet-500/20",
      textColor: "text-violet-400",
    };
  }
  if (level >= 100) {
    return {
      name: "OURO",
      colorFrom: "#fbbf24",
      colorTo: "#f59e0b",
      glowColor: "rgba(251, 191, 36, 0.5)",
      bgGradient: "from-amber-500/20 via-yellow-400/10 to-amber-500/20",
      textColor: "text-amber-400",
    };
  }
  if (level >= 50) {
    return {
      name: "PRATA",
      colorFrom: "#e2e8f0",
      colorTo: "#94a3b8",
      glowColor: "rgba(226, 232, 240, 0.4)",
      bgGradient: "from-slate-300/20 via-slate-200/10 to-slate-300/20",
      textColor: "text-slate-300",
    };
  }
  return {
    name: "BRONZE",
    colorFrom: "#f97316",
    colorTo: "#ea580c",
    glowColor: "rgba(249, 115, 22, 0.5)",
    bgGradient: "from-orange-500/20 via-orange-400/10 to-orange-500/20",
    textColor: "text-orange-400",
  };
}

function CircularProgress({ 
  progress, 
  size, 
  strokeWidth,
  colorFrom,
  colorTo,
  glowColor,
  uniqueId,
}: { 
  progress: number; 
  size: number; 
  strokeWidth: number;
  colorFrom: string;
  colorTo: string;
  glowColor: string;
  uniqueId: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const gradientId = `level-gradient-${uniqueId}`;

  return (
    <svg
      width={size}
      height={size}
      className="absolute inset-0 -rotate-90 transform"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={colorFrom} />
          <stop offset="100%" stopColor={colorTo} />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        filter="url(#glow)"
        className="transition-all duration-700 ease-out"
        style={{
          filter: `drop-shadow(0 0 6px ${glowColor})`,
        }}
      />
    </svg>
  );
}

export function LevelBadge({ level, progressPercent, xpProgress, xpNeeded, className }: LevelBadgeProps) {
  const tier = getTierInfo(level);
  const uniqueId = useId();

  return (
    <Link href="/profile/levels" className={cn("group", className)}>
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div 
          className={cn(
            "relative flex items-center justify-center",
            "transition-transform duration-300 group-hover:scale-105"
          )}
        >
          <div className="relative w-11 h-11 flex items-center justify-center">
            <CircularProgress
              progress={Math.min(progressPercent, 100)}
              size={44}
              strokeWidth={3}
              colorFrom={tier.colorFrom}
              colorTo={tier.colorTo}
              glowColor={tier.glowColor}
              uniqueId={uniqueId}
            />
            <div 
              className="absolute inset-0 flex items-center justify-center"
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center bg-background border border-white/10"
                style={{
                  boxShadow: `inset 0 0 8px ${tier.glowColor}`,
                }}
              >
                <span 
                  className={cn(
                    "text-sm font-bold tabular-nums leading-none",
                    tier.textColor
                  )}
                  style={{
                    textShadow: `0 0 8px ${tier.glowColor}`,
                  }}
                >
                  {level}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span 
              className={cn(
                "text-[11px] font-bold uppercase tracking-widest",
                tier.textColor
              )}
            >
              {tier.name}
            </span>
            <span className="text-[10px] text-white/40">•</span>
            <span className="text-[11px] font-semibold text-white/70">
              Nível {level}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative h-1.5 w-20 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(progressPercent, 100)}%`,
                  background: `linear-gradient(90deg, ${tier.colorFrom}, ${tier.colorTo})`,
                  boxShadow: `0 0 8px ${tier.glowColor}`,
                }}
              />
            </div>
            <span className="text-[10px] text-white/40 tabular-nums">
              {Math.round(progressPercent)}%
            </span>
          </div>
          
          {xpProgress !== undefined && xpNeeded !== undefined && (
            <span className="text-[9px] text-white/30">
              {xpProgress.toLocaleString('pt-BR')} / {xpNeeded.toLocaleString('pt-BR')} XP
            </span>
          )}
        </div>

        <div className="sm:hidden">
          <span 
            className={cn(
              "text-[10px] font-bold",
              tier.textColor
            )}
          >
            {Math.round(progressPercent)}%
          </span>
        </div>
      </div>
    </Link>
  );
}
