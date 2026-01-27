import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/hooks/useAuth";
import { LogIn } from "lucide-react";
import { Plinko2D } from "@/components/plinko/Plinko2D";

function LoginRequiredScreen() {
  return (
    <MainLayout>
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-card border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Login Necessário</h1>
            <p className="text-muted-foreground mb-6">
              Faça login ou crie uma conta para jogar Plinko
            </p>
            <p className="text-sm text-muted-foreground">
              Use os botões no topo da página para entrar
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function Plinko() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginRequiredScreen />;
  }

  return (
    <MainLayout>
      <div className="w-full">
        <Plinko2D />
      </div>
    </MainLayout>
  );
}
