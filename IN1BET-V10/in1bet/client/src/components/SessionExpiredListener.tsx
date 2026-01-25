import { useEffect } from "react";
import { toast } from "sonner";

export function SessionExpiredListener() {
  useEffect(() => {
    const handleSessionExpired = () => {
      toast.error("Sessão expirada", {
        description: "Faça login novamente para continuar.",
        duration: 5000,
        id: "session-expired",
      });
    };

    window.addEventListener("session-expired", handleSessionExpired);
    
    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, []);

  return null;
}
