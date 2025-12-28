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
import { ShieldAlert, ShieldCheck } from "lucide-react";

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
      <AlertDialogContent className="bg-[#0f0f15] border-white/10 max-w-md">
        <AlertDialogHeader className="items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <span className="text-2xl font-black text-red-500 font-heading">18+</span>
          </div>
          <AlertDialogTitle className="text-2xl font-bold text-white">
            Verificação de Idade
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Este site contém conteúdo adulto e jogos de azar envolvendo dinheiro real.
            <br /><br />
            Para continuar, você deve confirmar que tem mais de 18 anos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center mt-6">
          <AlertDialogAction 
            onClick={handleConfirm}
            className="w-full sm:w-auto bg-primary text-white hover:bg-primary/90 font-bold px-8 h-12 text-lg shadow-[0_0_20px_-5px_rgba(249,115,22,0.5)]"
          >
            <ShieldCheck className="w-5 h-5 mr-2" />
            Sim, tenho mais de 18 anos
          </AlertDialogAction>
        </AlertDialogFooter>
        <div className="text-center mt-4">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                Jogue com Responsabilidade
            </p>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
