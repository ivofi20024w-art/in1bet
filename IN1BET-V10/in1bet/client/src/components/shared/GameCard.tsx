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
          "group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300",
          "bg-card border border-white/5 hover:border-primary/50",
          "shadow-lg hover:shadow-primary/20 hover:-translate-y-1",
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
                "w-full h-full object-cover transition-transform duration-500",
                "group-hover:scale-110",
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
            <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-lg uppercase tracking-wider z-10">
              Hot
            </div>
          )}
          
          {idHash && (
            <button 
              onClick={handleFavoriteClick}
              className={cn(
                "absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all z-20",
                isFav 
                  ? "bg-white/20 backdrop-blur-sm text-white" 
                  : "bg-black/50 backdrop-blur-sm text-white/70 opacity-0 group-hover:opacity-100 hover:bg-white/20"
              )}
              data-testid={`favorite-btn-${idHash}`}
            >
              <Heart className={cn("w-3.5 h-3.5", isFav && "fill-current text-red-500")} />
            </button>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>

        <div className="p-3">
          <h3 className="font-bold text-white text-sm truncate">{title}</h3>
          <p className="text-xs text-muted-foreground truncate capitalize">{provider}</p>
        </div>
      </div>
  );
}
