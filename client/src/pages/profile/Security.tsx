import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Key, AlertTriangle, Loader2, CheckCircle2, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { getStoredAuth, logout } from "@/lib/auth";

export default function Security() {
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("A nova senha deve ter no mínimo 8 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setIsChangingPassword(true);
    
    try {
      const auth = getStoredAuth();
      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Senha alterada com sucesso!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        setTimeout(async () => {
          await logout();
          setLocation("/login");
        }, 2000);
      } else {
        toast.error(data.error || "Erro ao alterar senha");
      }
    } catch (error) {
      toast.error("Erro ao conectar com o servidor");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Link href="/profile">
                <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full" data-testid="button-back">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold text-white">Segurança da Conta</h1>
        </div>

        <div className="grid grid-cols-1 gap-6">
            <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/20 border border-gray-600/30 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gray-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                
                <div className="relative z-10 p-4 bg-gray-500/20 rounded-full shrink-0">
                    <Shield className="w-8 h-8 text-gray-400" />
                </div>
                
                <div className="flex-1 text-center md:text-left relative z-10">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                        <h3 className="text-xl font-bold text-white">Autenticação de Dois Fatores (2FA)</h3>
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> EM BREVE
                        </span>
                    </div>
                    <p className="text-gray-400 text-sm">
                        Estamos trabalhando para adicionar autenticação de dois fatores (2FA) via Google Authenticator para aumentar a segurança da sua conta.
                    </p>
                </div>
            </div>

            <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                        <Key className="w-5 h-5" />
                        Alterar Senha
                    </CardTitle>
                    <CardDescription>Recomendamos usar uma senha forte e única para esta conta.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Senha Atual</Label>
                            <Input 
                                id="current-password"
                                type="password" 
                                className="bg-secondary/50 border-white/10 h-11" 
                                placeholder="Digite sua senha atual"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                disabled={isChangingPassword}
                                data-testid="input-current-password"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Nova Senha</Label>
                                <Input 
                                    id="new-password"
                                    type="password" 
                                    className="bg-secondary/50 border-white/10 h-11" 
                                    placeholder="Mínimo 8 caracteres"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    disabled={isChangingPassword}
                                    data-testid="input-new-password"
                                />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                <Input 
                                    id="confirm-password"
                                    type="password" 
                                    className="bg-secondary/50 border-white/10 h-11" 
                                    placeholder="Repita a nova senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={isChangingPassword}
                                    data-testid="input-confirm-password"
                                />
                            </div>
                        </div>
                        
                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 items-start mt-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-yellow-500/90 leading-relaxed">
                                Ao alterar sua senha, você será desconectado de todos os dispositivos por segurança.
                            </p>
                        </div>

                        <div className="pt-2 flex justify-end">
                            <Button 
                                type="submit"
                                className="bg-primary hover:bg-primary/90 text-white font-bold min-w-[150px]"
                                disabled={isChangingPassword}
                                data-testid="button-change-password"
                            >
                                {isChangingPassword ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Alterando...
                                    </>
                                ) : (
                                    "Atualizar Senha"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-500">
                        <CheckCircle2 className="w-5 h-5" />
                        Dicas de Segurança
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3 text-sm text-gray-400">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            Use uma senha única que você não usa em outros sites
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            Combine letras maiúsculas, minúsculas, números e símbolos
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            Nunca compartilhe sua senha com terceiros
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                            Atualize sua senha periodicamente
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </MainLayout>
  );
}
