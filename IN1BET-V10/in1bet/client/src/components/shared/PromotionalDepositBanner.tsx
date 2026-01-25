import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/stores/authModalStore";
import { useLocation } from "wouter";
import depositBannerImage from "@assets/image_1767985827021.png";

export function PromotionalDepositBanner() {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [, setLocation] = useLocation();

  const handleClick = () => {
    if (isAuthenticated) {
      setLocation("/wallet?tab=deposit");
    } else {
      openLogin();
    }
  };

  return (
    <div 
      className="relative w-full rounded-xl overflow-hidden cursor-pointer group"
      onClick={handleClick}
      data-testid="promotional-deposit-banner"
    >
      <img 
        src={depositBannerImage} 
        alt="Deposite todos os dias e desbloqueie bônus exclusivos" 
        className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
    </div>
  );
}
