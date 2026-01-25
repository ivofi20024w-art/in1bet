import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPassword() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const tokenParam = params.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (!token) {
      setError("Token inválido. Solicite um novo link de recuperação.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao redefinir senha");
        setLoading(false);
        return;
      }

      setSuccess(true);
      toast({
        title: "Senha redefinida!",
        description: "Você já pode fazer login com sua nova senha.",
      });
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-8">
        <Card className="border-white/5 bg-card/50 backdrop-blur-xl">
          <CardHeader>
            <Link href="/">
              <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2 text-muted-foreground" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Login
              </Button>
            </Link>
            <CardTitle className="text-xl">Redefinir Senha</CardTitle>
            <CardDescription>
              Digite sua nova senha abaixo.
            </CardDescription>
          </CardHeader>
          
          {!success ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span data-testid="text-error">{error}</span>
                  </div>
                )}

                {!token && (
                  <div className="flex items-center gap-2 text-yellow-500 text-sm bg-yellow-500/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span>Token não encontrado. Verifique o link enviado por email.</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Nova Senha</Label>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Digite sua nova senha" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-background/50 border-white/10 pr-10"
                      required
                      minLength={6}
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confirmar Nova Senha</Label>
                  <Input 
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-background/50 border-white/10"
                    required
                    minLength={6}
                    data-testid="input-confirm-password"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  disabled={loading || !token} 
                  className="w-full font-bold" 
                  data-testid="button-submit"
                >
                  {loading ? "Redefinindo..." : "Redefinir Senha"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Senha Redefinida!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Sua senha foi alterada com sucesso. Você já pode fazer login.
              </p>
              <Button className="w-full font-bold" onClick={() => setLocation("/")} data-testid="button-go-to-login">
                Ir para Login
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
