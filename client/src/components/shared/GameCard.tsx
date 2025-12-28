import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface GameCardProps {
  id: number;
  title: string;
  provider: string;
  image: string;
  hot?: boolean;
  className?: string;
  loading?: boolean;
}

export function GameCard({ id, title, provider, image, hot, className, loading }: GameCardProps) {
  if (loading) {
      return (
          <div className={cn("aspect-[3/4] rounded-xl overflow-hidden", className)}>
              <Skeleton className="w-full h-full bg-secondary/30" />
          </div>
      )
  }

  return (
    <Link href={`/game/${id}`}>
      <div className={cn("group relative rounded-xl overflow-hidden aspect-[3/4] bg-card border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] hover:-translate-y-1 cursor-pointer", className)}>
        <img 
          src={image} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
        
        {/* Badges */}
        {hot && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">
            Hot
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 text-white fill-white ml-1" />
          </div>
        </div>

        {/* Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-white font-bold truncate text-sm">{title}</p>
          <p className="text-muted-foreground text-xs truncate group-hover:text-primary transition-colors">{provider}</p>
        </div>
      </div>
    </Link>
  );
}
