import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import loadingLogo from "@assets/IN1BET_loading_screen_(1)_1767992129344.png";

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
        
        {/* Central Logo */}
        <div className="relative z-10 flex items-center justify-center w-40 h-20 rounded-lg bg-background/80 backdrop-blur-md border border-white/5 shadow-[0_0_50px_rgba(249,115,22,0.15)] px-4">
            <img 
              src={loadingLogo} 
              alt="IN1BET" 
              className="max-h-14 w-auto object-contain"
            />
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
