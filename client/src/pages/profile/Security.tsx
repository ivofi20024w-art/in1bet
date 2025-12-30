import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Smartphone, Key, AlertTriangle, Fingerprint, History, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Link, useLocation } from "wouter";
import { LOGIN_HISTORY } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function Security() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("in1bet_token");
      if (!token) {
        setError("Você precisa estar logado para alterar a senha");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao alterar senha");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast({
        title: "Senha alterada!",
        description: "Você será redirecionado para fazer login novamente.",
      });

      localStorage.removeItem("in1bet_token");
      localStorage.removeItem("in1bet_refresh_token");
      localStorage.removeItem("in1bet_auth");
      
      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
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
          <div className="bg-gradient-to-r from-gray-800/40 to-gray-700/10 border border-gray-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gray-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            
            <div className="relative z-10 p-4 bg-gray-500/20 rounded-full shrink-0">
              <Shield className="w-8 h-8 text-gray-400" />
            </div>
            
            <div className="flex-1 text-center md:text-left relative z-10">
              <div className="flex items-center gap-2 mb-2 justify-center md:justify-start">
                <h3 className="text-xl font-bold text-white">Autenticação de Dois Fatores (2FA)</h3>
                <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                  <Clock className="w-3 h-3 mr-1" />
                  Em Breve
                </Badge>
              </div>
              <p className="text-gray-300 text-sm mb-4">Adicione uma camada extra de proteção à sua conta exigindo um código do Google Authenticator para fazer login.</p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <Button 
                  disabled
                  className="bg-gray-600 text-gray-300 font-bold border-0 shadow-lg cursor-not-allowed opacity-50"
                  data-testid="button-enable-2fa"
                >
                  <Smartphone className="w-4 h-4 mr-2" /> Ativar 2FA Agora
                </Button>
              </div>
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
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span data-testid="text-error">{error}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 p-3 rounded-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>Senha alterada com sucesso! Redirecionando...</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Senha Atual</Label>
                  <div className="relative">
                    <Input 
                      type={showCurrentPassword ? "text" : "password"}
                      className="bg-secondary/50 border-white/10 h-11 pr-10" 
                      placeholder="Digite sua senha atual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      data-testid="input-current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nova Senha</Label>
                    <div className="relative">
                      <Input 
                        type={showNewPassword ? "text" : "password"}
                        className="bg-secondary/50 border-white/10 h-11 pr-10" 
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                        data-testid="input-new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Nova Senha</Label>
                    <Input 
                      type={showNewPassword ? "text" : "password"}
                      className="bg-secondary/50 border-white/10 h-11" 
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 items-start mt-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-500/90 leading-relaxed">
                    Ao alterar sua senha, você será desconectado de todos os outros dispositivos por segurança.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button 
                    type="submit"
                    disabled={loading || success}
                    className="bg-primary hover:bg-primary/90 text-white font-bold min-w-[150px]"
                    data-testid="button-update-password"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Atualizando...
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
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <History className="w-5 h-5" />
                Dispositivos Ativos & Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {LOGIN_HISTORY.map((login, i) => (
                  <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg group">
                    <div className="flex items-center gap-4 mb-2 md:mb-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-green-500/20 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                        {i === 0 ? <Fingerprint className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm">{login.device}</p>
                          {i === 0 && <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/20">Atual</Badge>}
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {login.location} • <span className="font-mono">{login.ip}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pl-14 md:pl-0">
                      <span className="text-xs text-gray-400 font-medium">{login.date}</span>
                      {i !== 0 && (
                        <Button variant="ghost" size="sm" className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8">
                          Desconectar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-white/5 mt-4 text-center">
                <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full md:w-auto">
                  Desconectar de todos os dispositivos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
