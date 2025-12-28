import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, ChevronLeft } from "lucide-react";
import { IMaskInput } from "react-imask";
import { cpf } from "cpf-cnpj-validator";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
    name: "",
    cpf: "",
    birthDate: "",
    phone: "",
    promoCode: ""
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNext = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
        if (!formData.email) newErrors.email = "Email é obrigatório";
        if (!formData.password) newErrors.password = "Senha é obrigatória";
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Senhas não conferem";
        if (!formData.terms) newErrors.terms = "Você deve aceitar os termos";
    }

    if (step === 2) {
        if (!formData.name) newErrors.name = "Nome completo é obrigatório";
        if (!formData.cpf) newErrors.cpf = "CPF é obrigatório";
        else if (!cpf.isValid(formData.cpf)) newErrors.cpf = "CPF inválido";
        
        if (!formData.birthDate) newErrors.birthDate = "Data de nascimento é obrigatória";
        else {
             // Mock age validation
             const year = parseInt(formData.birthDate.split('-')[0]);
             if (new Date().getFullYear() - year < 18) newErrors.birthDate = "Você deve ter mais de 18 anos";
        }
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setErrors({});
    if (step < 3) setStep(step + 1);
    else handleRegister();
  };

  const handleRegister = () => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
          setLoading(false);
          localStorage.setItem("primebet_auth", "true");
          toast({
              title: "Conta criada com sucesso!",
              description: "Bem-vindo ao IN1Bet.",
          });
          setLocation("/");
      }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
        
        <div className="w-full max-w-md relative z-10 space-y-8">
            <div className="text-center">
                <h1 className="text-4xl font-heading font-bold italic text-primary tracking-wide mb-2">
                    IN1<span className="text-white">BET</span>
                </h1>
                <p className="text-muted-foreground">Crie sua conta em segundos</p>
            </div>

            <Card className="border-white/5 bg-card/50 backdrop-blur-xl">
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                         {step > 1 ? (
                            <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)} className="h-8 w-8 -ml-2">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                         ) : <div className="w-8" />}
                         <div className="flex gap-2">
                             {[1, 2, 3].map(i => (
                                 <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${step >= i ? 'bg-primary' : 'bg-white/10'}`} />
                             ))}
                         </div>
                         <div className="w-8" />
                    </div>
                    <CardTitle className="text-xl text-center">
                        {step === 1 && "Dados de Acesso"}
                        {step === 2 && "Dados Pessoais"}
                        {step === 3 && "Contato e Bônus"}
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                            <div className="space-y-2">
                                <Label>E-mail</Label>
                                <Input 
                                    type="email" 
                                    placeholder="seu@email.com" 
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                    className={errors.email ? "border-red-500" : ""}
                                />
                                {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                            </div>
                            <div className="space-y-2">
                                <Label>Senha</Label>
                                <Input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                    className={errors.password ? "border-red-500" : ""}
                                />
                                {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
                            </div>
                            <div className="space-y-2">
                                <Label>Confirmar Senha</Label>
                                <Input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    value={formData.confirmPassword}
                                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                    className={errors.confirmPassword ? "border-red-500" : ""}
                                />
                                {errors.confirmPassword && <span className="text-xs text-red-500">{errors.confirmPassword}</span>}
                            </div>
                            <label className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="mt-1 rounded border-white/20 bg-transparent text-primary focus:ring-primary"
                                    checked={formData.terms}
                                    onChange={e => setFormData({...formData, terms: e.target.checked})}
                                />
                                <div className="text-xs text-muted-foreground leading-relaxed">
                                    Li e concordo com os <span className="text-primary underline">Termos e Condições</span>. Confirmo que tenho mais de 18 anos.
                                </div>
                            </label>
                            {errors.terms && <span className="text-xs text-red-500 block text-center">{errors.terms}</span>}
                        </div>
                    )}

                    {step === 2 && (
                         <div className="space-y-4 animate-in slide-in-from-right duration-300">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 items-start">
                                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-yellow-200/80">O CPF deve ser do titular da conta para garantir saques rápidos via PIX.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Nome Completo</Label>
                                <Input 
                                    placeholder="Como no documento" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                            </div>

                            <div className="space-y-2">
                                <Label>CPF</Label>
                                <IMaskInput
                                    mask="000.000.000-00"
                                    value={formData.cpf}
                                    onAccept={(value) => setFormData({...formData, cpf: value})}
                                    className={`flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300 hover:border-white/20 ${errors.cpf ? "border-red-500" : ""}`}
                                    placeholder="000.000.000-00"
                                />
                                {errors.cpf && <span className="text-xs text-red-500">{errors.cpf}</span>}
                            </div>

                            <div className="space-y-2">
                                <Label>Data de Nascimento</Label>
                                <Input 
                                    type="date"
                                    value={formData.birthDate}
                                    onChange={e => setFormData({...formData, birthDate: e.target.value})}
                                    className={errors.birthDate ? "border-red-500" : ""}
                                />
                                {errors.birthDate && <span className="text-xs text-red-500">{errors.birthDate}</span>}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-in slide-in-from-right duration-300">
                             <div className="space-y-2">
                                <Label>Celular</Label>
                                <IMaskInput
                                    mask="(00) 00000-0000"
                                    value={formData.phone}
                                    onAccept={(value) => setFormData({...formData, phone: value})}
                                    className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300 hover:border-white/20"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Código Promocional (Opcional)</Label>
                                <Input 
                                    placeholder="Ex: BONUS100" 
                                    value={formData.promoCode}
                                    onChange={e => setFormData({...formData, promoCode: e.target.value.toUpperCase()})}
                                />
                            </div>

                            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl mt-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    <h3 className="font-bold text-white text-sm">Bônus de Boas-vindas</h3>
                                </div>
                                <p className="text-xs text-gray-400">Ao criar sua conta, você está elegível para receber 100% de bônus até R$ 500 no primeiro depósito.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                
                <CardFooter className="flex flex-col gap-4">
                    <Button 
                        onClick={handleNext} 
                        disabled={loading}
                        className="w-full h-12 text-lg font-bold shadow-[0_0_20px_-5px_rgba(242,102,49,0.5)]"
                    >
                        {loading ? "Criando conta..." : step === 3 ? "Finalizar Cadastro" : "Continuar"}
                        {!loading && step < 3 && <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>
                    
                    <p className="text-center text-sm text-muted-foreground">
                        Já tem uma conta? <Link href="/login"><a className="text-primary hover:underline font-bold">Entrar</a></Link>
                    </p>
                </CardFooter>
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
