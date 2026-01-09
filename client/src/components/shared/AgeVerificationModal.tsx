import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Shield } from "lucide-react";

export function AgeVerificationModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem("in1bet_age_verified");
    if (!verified) {
      setOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem("in1bet_age_verified", "true");
    setOpen(false);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="relative bg-gradient-to-br from-[#1a1520] via-[#0f0f15] to-[#0a0a0f] border-orange-500/20 max-w-md backdrop-blur-xl shadow-2xl p-0 overflow-hidden rounded-3xl">
        {/* Animated glow orbs */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-32 h-32 bg-red-500/15 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(249,115,22,0.3) 1px, transparent 0)', 
          backgroundSize: '20px 20px' 
        }} />
        
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
        
        <div className="relative p-8 pt-12 flex flex-col items-center text-center">
          {/* Premium 18+ Badge */}
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl blur-xl opacity-50 animate-pulse" />
            <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(249,115,22,0.5)] transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <div className="absolute inset-1 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
              <span className="text-4xl font-heading font-black text-white drop-shadow-lg">18+</span>
            </div>
            {/* Shield decorative icon */}
            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#0f0f15] border border-orange-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4 text-orange-400" />
            </div>
          </div>
          
          <AlertDialogHeader className="space-y-4">
            <AlertDialogTitle className="text-3xl md:text-4xl font-heading font-black text-white tracking-wide">
              ACESSO <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">RESTRITO</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400 text-base leading-relaxed max-w-sm mx-auto">
              Este site oferece jogos de apostas com dinheiro real e é restrito para menores de idade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="mt-8 w-full space-y-4">
            <AlertDialogAction 
              onClick={handleConfirm}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-red-600 text-white font-bold h-14 text-lg uppercase tracking-wider shadow-[0_0_30px_rgba(249,115,22,0.4)] rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] border border-orange-400/30"
            >
              Sou maior de 18 anos
            </AlertDialogAction>
            
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-white/5 py-3 px-4 rounded-xl border border-white/5 backdrop-blur-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-500/80" />
              <span className="font-medium">Jogo Responsável</span>
            </div>
          </div>
        </div>
        
        {/* Bottom decorative line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
      </AlertDialogContent>
    </AlertDialog>
  );
}
