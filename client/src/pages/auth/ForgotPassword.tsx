import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao processar solicitação");
        setLoading(false);
        return;
      }

      setSent(true);
      toast({
        title: "Solicitação enviada",
        description: "Verifique sua caixa de entrada para redefinir a senha.",
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
            <Link href="/login">
              <Button variant="ghost" size="sm" className="w-fit -ml-2 mb-2 text-muted-foreground" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
              </Button>
            </Link>
            <CardTitle className="text-xl">Recuperar Senha</CardTitle>
            <CardDescription>
              Digite seu CPF ou e-mail cadastrado para receber o link de redefinição.
            </CardDescription>
          </CardHeader>
          
          {!sent ? (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span data-testid="text-error">{error}</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>CPF ou Email</Label>
                  <Input 
                    placeholder="Digite aqui..." 
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="bg-background/50 border-white/10"
                    required
                    data-testid="input-identifier"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading} className="w-full font-bold" data-testid="button-submit">
                  {loading ? "Enviando..." : "Enviar Link de Recuperação"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="text-center py-8">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Verifique seu Email</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Enviamos as instruções de recuperação para o email associado à sua conta.
              </p>
              <Button variant="outline" className="w-full" onClick={() => setSent(false)} data-testid="button-try-again">
                Tentar outro email
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
