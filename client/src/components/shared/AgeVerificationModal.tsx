import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

export function AgeVerificationModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if age verified in localStorage
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
      <AlertDialogContent className="bg-[#0f0f15]/95 border-white/10 max-w-md backdrop-blur-xl shadow-2xl p-0 overflow-hidden rounded-2xl">
        <div className="relative p-6 pt-10 flex flex-col items-center text-center z-10">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent z-0" />
            
            <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(220,38,38,0.3)] mb-6 transform rotate-3">
                <span className="text-3xl font-heading font-black text-white italic">18+</span>
            </div>
            
            <AlertDialogHeader className="space-y-3 relative z-10">
              <AlertDialogTitle className="text-3xl font-heading font-bold text-white tracking-wide">
                ACESSO RESTRITO
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400 text-base leading-relaxed max-w-sm mx-auto">
                Este site oferece jogos de apostas com dinheiro real e é restrito para menores de idade.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="mt-8 w-full space-y-3 relative z-10">
                <AlertDialogAction 
                    onClick={handleConfirm}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 text-lg uppercase tracking-wide shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)] rounded-xl transition-all hover:scale-[1.02]"
                >
                    Sou maior de 18 anos
                </AlertDialogAction>
                
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-white/5 py-2 rounded-lg border border-white/5">
                    <AlertTriangle className="w-3 h-3 text-yellow-500" />
                    <span>Jogo Responsável</span>
                </div>
            </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
