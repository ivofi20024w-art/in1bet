import { Play, Gamepad2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useFavoritesStore } from "@/stores/favorites-store";

interface GameCardProps {
  id: number;
  title: string;
  provider: string;
  image: string;
  hot?: boolean;
  className?: string;
  loading?: boolean;
  idHash?: string;
  onClick?: () => void;
}

export function GameCard({ id, title, provider, image, hot, className, loading, idHash, onClick }: GameCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavoritesStore();
  const isFav = idHash ? isFavorite(idHash) : false;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (idHash) {
      toggleFavorite(idHash);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
    }
  };

  if (loading) {
      return (
          <div className={cn("rounded-xl overflow-hidden", className)}>
              <Skeleton className="w-full aspect-square bg-secondary/30" />
              <div className="p-2 bg-card">
                <Skeleton className="h-4 w-3/4 bg-secondary/30 mb-1" />
                <Skeleton className="h-3 w-1/2 bg-secondary/30" />
              </div>
          </div>
      )
  }

  return (
      <div 
        onClick={handleCardClick}
        className={cn(
          "group relative rounded-xl overflow-hidden bg-card border-2 border-white/5 transition-all duration-300 cursor-pointer",
          "hover:border-orange-500/70 hover:shadow-[0_0_30px_-5px_rgba(249,115,22,0.6)] hover:-translate-y-2",
          className
        )}>
        
        <div className="relative aspect-square overflow-hidden">
          {imageLoading && !imageError && (
            <div className="absolute inset-0 bg-secondary/30 animate-pulse" />
          )}
          
          {imageError ? (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center">
              <Gamepad2 className="w-12 h-12 text-muted-foreground/50" />
            </div>
          ) : (
            <img 
              src={image} 
              alt={title} 
              className={cn(
                "w-full h-full object-cover transition-all duration-500",
                "group-hover:scale-110 group-hover:brightness-110",
                imageLoading && "opacity-0"
              )}
              loading="lazy"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          )}
          
          {hot && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider z-10">
              Hot
            </div>
          )}
          
          {idHash && (
            <button 
              onClick={handleFavoriteClick}
              className={cn(
                "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20",
                isFav 
                  ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]" 
                  : "bg-black/60 text-white/80 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              )}
              data-testid={`favorite-btn-${idHash}`}
            >
              <Heart className={cn("w-4 h-4", isFav && "fill-current")} />
            </button>
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <div className="absolute inset-0 bg-gradient-to-t from-orange-600/40 via-orange-500/20 to-transparent" />
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.7)] transform scale-0 group-hover:scale-100 transition-all duration-300 border-2 border-white/30">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-3 bg-gradient-to-b from-[#1a1a1f] to-[#0f0f12] border-t border-white/5">
          <p className="text-white font-semibold truncate text-sm group-hover:text-orange-400 transition-colors duration-300">{title}</p>
          <p className="text-muted-foreground text-xs truncate capitalize">{provider}</p>
        </div>
      </div>
  );
}
