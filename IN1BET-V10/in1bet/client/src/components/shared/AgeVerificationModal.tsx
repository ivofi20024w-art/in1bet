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
      <AlertDialogContent className="bg-gradient-to-br from-[#1a1520] via-[#0f0f15] to-[#0a0a0f] border border-orange-500/30 max-w-md shadow-2xl shadow-orange-500/10 overflow-hidden rounded-3xl p-0">
        {/* Top gradient accent */}
        <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-orange-400 to-red-500" />
        
        <div className="p-8 pt-10 flex flex-col items-center text-center">
          {/* Premium 18+ Badge */}
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 flex items-center justify-center border border-white/20 shadow-[0_0_40px_rgba(249,115,22,0.5)] transform rotate-3">
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
            
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 bg-white/5 py-3 px-4 rounded-xl border border-white/5">
              <AlertTriangle className="w-4 h-4 text-yellow-500/80" />
              <span className="font-medium">Jogo Responsável</span>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
