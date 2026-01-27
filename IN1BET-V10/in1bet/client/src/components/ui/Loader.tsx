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
      <div className="relative mb-16">
        {/* Spinner rings - increased spacing and size */}
        <div className="absolute inset-[-40px] border-[3px] border-transparent border-t-primary border-r-primary/30 rounded-full animate-spin duration-[1.5s]" />
        <div className="absolute inset-[-20px] border-2 border-transparent border-b-secondary border-l-secondary/30 rounded-full animate-spin duration-[2s] direction-reverse" />
        
        {/* Central Typographic Logo - refined styles */}
        <div className="relative z-10 flex items-center justify-center w-36 h-36 rounded-full bg-background/80 backdrop-blur-md border border-white/5 shadow-[0_0_50px_rgba(249,115,22,0.15)]">
            <span className="text-5xl font-heading font-black italic text-white tracking-tighter drop-shadow-lg">
                IN1<span className="text-primary">BET</span>
            </span>
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-xs font-bold text-muted-foreground/60 tracking-[0.5em] uppercase animate-pulse">Carregando</h2>
        <div className="flex gap-2 mt-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
