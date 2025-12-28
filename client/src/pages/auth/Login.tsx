import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock login simulation
    setTimeout(() => {
        setLoading(false);
        if (identifier && password) {
            localStorage.setItem("in1bet_auth", "true");
            toast({
                title: "Login realizado com sucesso",
                description: "Redirecionando para o lobby...",
            });
            setLocation("/");
        } else {
            toast({
                title: "Erro no login",
                description: "Verifique suas credenciais.",
                variant: "destructive"
            });
        }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10 space-y-8">
            <div className="text-center">
                <Link href="/">
                    <h1 className="text-4xl font-heading font-bold italic text-primary tracking-wide mb-2 cursor-pointer hover:scale-105 transition-transform">
                        IN1<span className="text-white">BET</span>
                    </h1>
                </Link>
                <p className="text-muted-foreground">Acesse sua conta para jogar</p>
            </div>

            <Card className="border-white/5 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                    <CardTitle className="text-xl text-center">Bem-vindo de volta</CardTitle>
                </CardHeader>
                
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>CPF ou Email</Label>
                            <Input 
                                placeholder="Digite seu CPF ou email" 
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="h-11 bg-background/50 border-white/10"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label>Senha</Label>
                                <Link href="/forgot-password">
                                    <a className="text-xs text-primary hover:underline">Esqueceu a senha?</a>
                                </Link>
                            </div>
                            <Input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-11 bg-background/50 border-white/10"
                            />
                        </div>
                    </CardContent>
                    
                    <CardFooter className="flex flex-col gap-4">
                        <Button 
                            type="submit" 
                            disabled={loading}
                            className="w-full h-12 text-lg font-bold shadow-[0_0_20px_-5px_rgba(242,102,49,0.5)]"
                        >
                            {loading ? "Entrando..." : "Entrar"}
                            {!loading && <LogIn className="w-5 h-5 ml-2" />}
                        </Button>
                        
                        <div className="relative w-full text-center">
                             <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                             </div>
                             <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">ou</span>
                             </div>
                        </div>

                        <p className="text-center text-sm text-muted-foreground">
                            Não tem uma conta? <Link href="/register"><a className="text-primary hover:underline font-bold">Cadastre-se</a></Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>

            <div className="flex justify-center gap-6 opacity-50">
                <ShieldCheck className="w-6 h-6 text-gray-500" />
                <div className="border border-gray-600 rounded px-2 py-0.5 text-xs text-gray-400 font-bold">18+</div>
                <div className="border border-gray-600 rounded px-2 py-0.5 text-xs text-gray-400 font-bold">SSL</div>
            </div>
        </div>
    </div>
  );
}
