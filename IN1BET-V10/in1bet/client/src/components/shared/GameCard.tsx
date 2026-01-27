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
        className={cn("group relative rounded-xl overflow-hidden bg-card border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)] hover:-translate-y-1 cursor-pointer", className)}>
        
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden rounded-t-xl">
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
                "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
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
          
          {/* Badges */}
          {hot && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider z-10">
              Hot
            </div>
          )}
          
          {/* Favorite Button */}
          {idHash && (
            <button 
              onClick={handleFavoriteClick}
              className={cn(
                "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-20",
                isFav 
                  ? "bg-red-500/90 text-white" 
                  : "bg-black/50 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/70 hover:text-red-400"
              )}
              data-testid={`favorite-btn-${idHash}`}
            >
              <Heart className={cn("w-3.5 h-3.5", isFav && "fill-current")} />
            </button>
          )}

          {/* Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 bg-black/30">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>

        {/* Info - Below Image */}
        <div className="p-2.5 bg-card">
          <p className="text-white font-semibold truncate text-sm">{title}</p>
          <p className="text-muted-foreground text-xs truncate capitalize">{provider}</p>
        </div>
      </div>
  );
}
