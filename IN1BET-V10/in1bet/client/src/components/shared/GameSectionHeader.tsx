import { LucideIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";

interface GameSectionHeaderProps {
  title: string;
  titleHighlight?: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor?: string;
  gameCount?: number;
  showNavigation?: boolean;
  carouselId?: string;
  viewAllLink?: string;
  className?: string;
}

export function GameSectionHeader({
  title,
  titleHighlight,
  subtitle,
  icon: Icon,
  iconColor = "orange",
  gameCount,
  showNavigation = false,
  carouselId,
  viewAllLink,
  className,
}: GameSectionHeaderProps) {
  const colorClasses: Record<string, { bg: string; text: string; glow: string; border: string }> = {
    orange: {
      bg: "bg-gradient-to-br from-orange-500/30 to-orange-600/10",
      text: "text-orange-500",
      glow: "shadow-[0_0_20px_rgba(249,115,22,0.4)]",
      border: "border-orange-500/30",
    },
    red: {
      bg: "bg-gradient-to-br from-red-500/30 to-red-600/10",
      text: "text-red-500",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
      border: "border-red-500/30",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-500/30 to-purple-600/10",
      text: "text-purple-500",
      glow: "shadow-[0_0_20px_rgba(168,85,247,0.4)]",
      border: "border-purple-500/30",
    },
    green: {
      bg: "bg-gradient-to-br from-green-500/30 to-green-600/10",
      text: "text-green-500",
      glow: "shadow-[0_0_20px_rgba(34,197,94,0.4)]",
      border: "border-green-500/30",
    },
    blue: {
      bg: "bg-gradient-to-br from-blue-500/30 to-blue-600/10",
      text: "text-blue-500",
      glow: "shadow-[0_0_20px_rgba(59,130,246,0.4)]",
      border: "border-blue-500/30",
    },
  };

  const colors = colorClasses[iconColor] || colorClasses.orange;

  const handleScroll = (direction: "left" | "right") => {
    if (!carouselId) return;
    const container = document.getElementById(carouselId);
    if (container) {
      const scrollAmount = direction === "left" ? -280 : 280;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative p-2.5 rounded-xl border backdrop-blur-sm transition-all duration-500",
            colors.bg,
            colors.border,
            colors.glow,
            "animate-pulse-glow"
          )}
        >
          <Icon className={cn("w-6 h-6", colors.text)} />
          <div
            className={cn(
              "absolute inset-0 rounded-xl opacity-50 blur-md -z-10",
              colors.bg
            )}
          />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-heading font-bold leading-none">
              {titleHighlight ? (
                <>
                  <span className={colors.text}>{titleHighlight}</span>
                  <span className="text-white">{title}</span>
                </>
              ) : (
                <span className="text-white">{title}</span>
              )}
            </h2>
            {gameCount !== undefined && gameCount > 0 && (
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider",
                  colors.bg,
                  colors.text,
                  "border",
                  colors.border
                )}
              >
                {gameCount} jogos
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {showNavigation && carouselId && (
          <>
            <button
              onClick={() => handleScroll("left")}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
                "hover:scale-105 active:scale-95"
              )}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-white/80" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300",
                "bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20",
                "hover:scale-105 active:scale-95"
              )}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-white/80" />
            </button>
          </>
        )}
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className={cn(
              "text-sm font-semibold transition-all duration-300 px-3 py-1.5 rounded-lg",
              "hover:bg-white/5",
              colors.text,
              "hover:text-white"
            )}
          >
            Ver todos
          </Link>
        )}
      </div>
    </div>
  );
}
