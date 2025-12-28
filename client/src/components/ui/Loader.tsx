import { useEffect, useState } from "react";
import logo from "@assets/generated_images/modern_abstract_casino_logo_with_neon_gradient.png";
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
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full animate-pulse" />
        <img 
          src={logo} 
          alt="Loading..." 
          className={cn(
            "w-24 h-24 md:w-32 md:h-32 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]",
            "animate-in zoom-in-50 duration-500",
            isLoading && "animate-pulse" 
          )} 
        />
        {/* Spinner ring */}
        <div className="absolute inset-[-20px] border-4 border-transparent border-t-primary border-r-primary/50 rounded-full animate-spin duration-1000" />
        <div className="absolute inset-[-10px] border-2 border-transparent border-b-secondary border-l-secondary/50 rounded-full animate-spin duration-[1.5s] direction-reverse" />
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="text-2xl font-heading font-bold text-white tracking-widest animate-pulse">PRIMEBET</h2>
        <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
