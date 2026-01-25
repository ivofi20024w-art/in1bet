import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { useSession } from "@/contexts/SessionContext";
import { Clock, LogOut, RefreshCw } from "lucide-react";

export default function SessionTimeoutModal() {
  const { isSessionWarningVisible, warningSecondsLeft, stayActive, logoutNow } = useSession();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}s`;
  };

  return (
    <Dialog open={isSessionWarningVisible}>
      <DialogContent className="sm:max-w-[420px] p-0 gap-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f] border-white/10 overflow-hidden" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Aviso de sessão expirando</DialogTitle>
        </VisuallyHidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">
            Sessão expirando
          </h2>
          
          <p className="text-muted-foreground text-sm mb-4">
            Sua sessão será encerrada por inatividade em:
          </p>
          
          <div className="text-5xl font-bold text-yellow-500 mb-6 tabular-nums">
            {formatTime(warningSecondsLeft)}
          </div>
          
          <p className="text-xs text-muted-foreground mb-6">
            Clique em "Permanecer ativo" para continuar usando a plataforma.
          </p>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={logoutNow}
              className="flex-1 h-12 border-white/10 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
              data-testid="btn-logout-session"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
            <Button
              onClick={stayActive}
              className="flex-1 h-12 bg-primary hover:bg-primary/90 font-bold shadow-[0_0_20px_-5px_rgba(242,102,49,0.5)]"
              data-testid="btn-stay-active"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Permanecer ativo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
