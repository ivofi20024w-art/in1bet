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
          <div className={cn("aspect-[4/3] rounded-lg overflow-hidden", className)}>
              <Skeleton className="w-full h-full bg-secondary/30" />
          </div>
      )
  }

  return (
      <div 
        onClick={handleCardClick}
        className={cn("group relative rounded-lg overflow-hidden aspect-[4/3] bg-card border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_15px_-5px_rgba(249,115,22,0.3)] hover:-translate-y-0.5 cursor-pointer", className)}>
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
              "w-full h-full object-cover transition-transform duration-500 group-hover:scale-110",
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
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
        
        {/* Badges */}
        {hot && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">
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
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white font-bold truncate text-xs">{title}</p>
          <p className="text-muted-foreground text-[10px] truncate group-hover:text-primary transition-colors capitalize">{provider}</p>
        </div>
      </div>
  );
}
