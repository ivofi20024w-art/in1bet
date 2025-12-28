import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  isLoading: boolean;
  type: "initial" | "page";
}

export function Loader({ isLoading, type }: LoaderProps) {
  const [show, setShow] = useState(isLoading);

  useEffect(() => {
    if (isLoading) {
      setShow(true);
    } else {
      const timer = setTimeout(() => setShow(false), 500); // Fade out duration
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-3xl transition-opacity duration-500",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <div className="relative mb-6">
        {/* Spinner rings - adjusted size since image is gone */}
        <div className="absolute inset-[-30px] border-4 border-transparent border-t-primary border-r-primary/50 rounded-full animate-spin duration-1000" />
        <div className="absolute inset-[-15px] border-2 border-transparent border-b-secondary border-l-secondary/50 rounded-full animate-spin duration-[1.5s] direction-reverse" />
        
        {/* Central Typographic Logo */}
        <div className="relative z-10 flex items-center justify-center w-32 h-32 rounded-full bg-background/50 backdrop-blur-sm border border-white/5 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
            <span className="text-4xl font-heading font-black italic text-white tracking-tighter transform -rotate-3">
                IN1<span className="text-primary">BET</span>
            </span>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-sm font-bold text-muted-foreground tracking-[0.3em] uppercase animate-pulse">Carregando</h2>
        <div className="flex gap-1.5 mt-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
