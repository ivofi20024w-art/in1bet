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
          <div className={cn("rounded-2xl overflow-hidden", className)}>
              <Skeleton className="w-full aspect-square bg-secondary/30" />
          </div>
      )
  }

  return (
      <div 
        onClick={handleCardClick}
        className={cn(
          "group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300",
          "border-2 border-transparent hover:border-orange-500",
          "hover:shadow-[0_0_25px_rgba(249,115,22,0.5)]",
          className
        )}>
        
        <div className="relative aspect-square overflow-hidden bg-[#1a1a1f]">
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
                "w-full h-full object-cover transition-all duration-300",
                "group-hover:scale-105",
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
                "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 border border-white/20",
                isFav 
                  ? "bg-white/20 text-white" 
                  : "bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-white/20"
              )}
              data-testid={`favorite-btn-${idHash}`}
            >
              <Heart className={cn("w-4 h-4", isFav && "fill-current text-red-500")} />
            </button>
          )}

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-all duration-300">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <p className="text-white font-semibold truncate text-sm">{title}</p>
            <p className="text-orange-400 text-xs truncate capitalize">{provider}</p>
          </div>
        </div>
      </div>
  );
}
