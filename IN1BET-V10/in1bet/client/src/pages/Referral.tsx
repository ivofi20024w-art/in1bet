import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuthModal, REFERRAL_CODE_KEY } from "@/stores/authModalStore";
import { Loader2 } from "lucide-react";

export default function Referral() {
  const [, params] = useRoute("/ref/:code");
  const [, setLocation] = useLocation();
  const { openRegister } = useAuthModal();

  useEffect(() => {
    const code = params?.code;
    if (code) {
      try {
        localStorage.setItem(REFERRAL_CODE_KEY, code);
      } catch {}
      setLocation("/");
      setTimeout(() => {
        openRegister(code);
      }, 100);
    } else {
      setLocation("/");
    }
  }, [params?.code, setLocation, openRegister]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}
