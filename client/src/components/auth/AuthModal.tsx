import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, LogIn, ChevronLeft, Sparkles } from "lucide-react";
import { IMaskInput } from "react-imask";
import { cpf } from "cpf-cnpj-validator";
import { useToast } from "@/hooks/use-toast";
import { login, register } from "@/lib/auth";
import { useAuthModal } from "@/stores/authModalStore";

export default function AuthModal() {
  const { isOpen, activeTab, close, setTab } = useAuthModal();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [registerStep, setRegisterStep] = useState(1);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerApiError, setRegisterApiError] = useState("");
  const [registerFormData, setRegisterFormData] = useState({
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
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  const resetForms = () => {
    setLoginIdentifier("");
    setLoginPassword("");
    setLoginError("");
    setRegisterStep(1);
    setRegisterApiError("");
    setRegisterFormData({
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
    setRegisterErrors({});
  };

  const handleClose = () => {
    resetForms();
    close();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      await login(loginIdentifier, loginPassword);
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo ao IN1Bet!",
      });
      handleClose();
      setLocation("/");
    } catch (err: any) {
      setLoginError(err.message || "Erro ao fazer login");
      toast({
        title: "Erro no login",
        description: err.message || "Verifique suas credenciais.",
        variant: "destructive"
      });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterNext = () => {
    const newErrors: Record<string, string> = {};

    if (registerStep === 1) {
      if (!registerFormData.email) newErrors.email = "Email é obrigatório";
      if (!registerFormData.password) newErrors.password = "Senha é obrigatória";
      if (registerFormData.password.length < 6) newErrors.password = "Senha deve ter pelo menos 6 caracteres";
      if (registerFormData.password !== registerFormData.confirmPassword) newErrors.confirmPassword = "Senhas não conferem";
      if (!registerFormData.terms) newErrors.terms = "Você deve aceitar os termos";
    }

    if (registerStep === 2) {
      if (!registerFormData.name) newErrors.name = "Nome completo é obrigatório";
      if (registerFormData.name.length < 3) newErrors.name = "Nome deve ter pelo menos 3 caracteres";
      if (!registerFormData.cpf) newErrors.cpf = "CPF é obrigatório";
      else if (!cpf.isValid(registerFormData.cpf)) newErrors.cpf = "CPF inválido";
      
      if (!registerFormData.birthDate) newErrors.birthDate = "Data de nascimento é obrigatória";
      else {
        const year = parseInt(registerFormData.birthDate.split('-')[0]);
        if (new Date().getFullYear() - year < 18) newErrors.birthDate = "Você deve ter mais de 18 anos";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setRegisterErrors(newErrors);
      return;
    }

    setRegisterErrors({});
    if (registerStep < 3) setRegisterStep(registerStep + 1);
    else handleRegister();
  };

  const handleRegister = async () => {
    setRegisterLoading(true);
    setRegisterApiError("");

    try {
      await register({
        name: registerFormData.name,
        email: registerFormData.email,
        cpf: registerFormData.cpf,
        password: registerFormData.password,
        phone: registerFormData.phone || undefined,
        birthDate: registerFormData.birthDate || undefined,
      });

      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao IN1Bet.",
      });
      handleClose();
      setLocation("/profile");
    } catch (err: any) {
      setRegisterApiError(err.message || "Erro ao criar conta");
      toast({
        title: "Erro no cadastro",
        description: err.message || "Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 gap-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f] border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-6">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-heading font-bold italic text-primary tracking-wide mb-1">
              IN1<span className="text-white">BET</span>
            </h1>
            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>A melhor experiência de apostas</span>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setTab(v as 'login' | 'register')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 rounded-xl mb-6">
              <TabsTrigger 
                value="login" 
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold"
                data-testid="tab-login"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-bold"
                data-testid="tab-register"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                    {loginError}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>CPF ou Email</Label>
                  <Input 
                    placeholder="Digite seu CPF ou email" 
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="h-11 bg-background/50 border-white/10"
                    data-testid="modal-input-identifier"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Senha</Label>
                    <button type="button" className="text-xs text-primary hover:underline">
                      Esqueceu a senha?
                    </button>
                  </div>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="h-11 bg-background/50 border-white/10"
                    data-testid="modal-input-password"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loginLoading}
                  className="w-full h-12 text-lg font-bold shadow-[0_0_20px_-5px_rgba(242,102,49,0.5)]"
                  data-testid="modal-button-login"
                >
                  {loginLoading ? "Entrando..." : "Entrar"}
                  {!loginLoading && <LogIn className="w-5 h-5 ml-2" />}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <div className="space-y-4">
                {registerApiError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                    {registerApiError}
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  {registerStep > 1 ? (
                    <Button variant="ghost" size="icon" onClick={() => setRegisterStep(registerStep - 1)} className="h-8 w-8">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  ) : <div className="w-8" />}
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${registerStep >= i ? 'bg-primary' : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <div className="w-8" />
                </div>

                <h3 className="text-lg font-bold text-center text-white mb-4">
                  {registerStep === 1 && "Dados de Acesso"}
                  {registerStep === 2 && "Dados Pessoais"}
                  {registerStep === 3 && "Contato e Bônus"}
                </h3>

                {registerStep === 1 && (
                  <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="space-y-2">
                      <Label>E-mail</Label>
                      <Input 
                        type="email" 
                        placeholder="seu@email.com" 
                        value={registerFormData.email}
                        onChange={e => setRegisterFormData({...registerFormData, email: e.target.value})}
                        className={`h-11 bg-background/50 border-white/10 ${registerErrors.email ? "border-red-500" : ""}`}
                        data-testid="modal-input-email"
                      />
                      {registerErrors.email && <span className="text-xs text-red-500">{registerErrors.email}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label>Senha</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={registerFormData.password}
                        onChange={e => setRegisterFormData({...registerFormData, password: e.target.value})}
                        className={`h-11 bg-background/50 border-white/10 ${registerErrors.password ? "border-red-500" : ""}`}
                        data-testid="modal-input-reg-password"
                      />
                      {registerErrors.password && <span className="text-xs text-red-500">{registerErrors.password}</span>}
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmar Senha</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={registerFormData.confirmPassword}
                        onChange={e => setRegisterFormData({...registerFormData, confirmPassword: e.target.value})}
                        className={`h-11 bg-background/50 border-white/10 ${registerErrors.confirmPassword ? "border-red-500" : ""}`}
                        data-testid="modal-input-confirm-password"
                      />
                      {registerErrors.confirmPassword && <span className="text-xs text-red-500">{registerErrors.confirmPassword}</span>}
                    </div>
                    <label className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors">
                      <input 
                        type="checkbox" 
                        className="mt-1 rounded border-white/20 bg-transparent text-primary focus:ring-primary"
                        checked={registerFormData.terms}
                        onChange={e => setRegisterFormData({...registerFormData, terms: e.target.checked})}
                        data-testid="modal-checkbox-terms"
                      />
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        Li e concordo com os <span className="text-primary underline">Termos e Condições</span>. Confirmo que tenho mais de 18 anos.
                      </div>
                    </label>
                    {registerErrors.terms && <span className="text-xs text-red-500 block text-center">{registerErrors.terms}</span>}
                  </div>
                )}

                {registerStep === 2 && (
                  <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 items-start">
                      <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-200/80">O CPF deve ser do titular da conta para garantir saques rápidos via PIX.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input 
                        placeholder="Como no documento" 
                        value={registerFormData.name}
                        onChange={e => setRegisterFormData({...registerFormData, name: e.target.value})}
                        className={`h-11 bg-background/50 border-white/10 ${registerErrors.name ? "border-red-500" : ""}`}
                        data-testid="modal-input-name"
                      />
                      {registerErrors.name && <span className="text-xs text-red-500">{registerErrors.name}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <IMaskInput
                        mask="000.000.000-00"
                        value={registerFormData.cpf}
                        onAccept={(value) => setRegisterFormData({...registerFormData, cpf: value})}
                        className={`flex h-11 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300 hover:border-white/20 ${registerErrors.cpf ? "border-red-500" : "border-white/10"}`}
                        placeholder="000.000.000-00"
                        data-testid="modal-input-cpf"
                      />
                      {registerErrors.cpf && <span className="text-xs text-red-500">{registerErrors.cpf}</span>}
                    </div>

                    <div className="space-y-2">
                      <Label>Data de Nascimento</Label>
                      <Input 
                        type="date"
                        value={registerFormData.birthDate}
                        onChange={e => setRegisterFormData({...registerFormData, birthDate: e.target.value})}
                        className={`h-11 bg-background/50 border-white/10 ${registerErrors.birthDate ? "border-red-500" : ""}`}
                        data-testid="modal-input-birthdate"
                      />
                      {registerErrors.birthDate && <span className="text-xs text-red-500">{registerErrors.birthDate}</span>}
                    </div>
                  </div>
                )}

                {registerStep === 3 && (
                  <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="space-y-2">
                      <Label>Celular</Label>
                      <IMaskInput
                        mask="(00) 00000-0000"
                        value={registerFormData.phone}
                        onAccept={(value) => setRegisterFormData({...registerFormData, phone: value})}
                        className="flex h-11 w-full rounded-lg border border-white/10 bg-background/50 px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300 hover:border-white/20"
                        placeholder="(11) 99999-9999"
                        data-testid="modal-input-phone"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Código Promocional (Opcional)</Label>
                      <Input 
                        placeholder="Ex: BONUS100" 
                        value={registerFormData.promoCode}
                        onChange={e => setRegisterFormData({...registerFormData, promoCode: e.target.value.toUpperCase()})}
                        className="h-11 bg-background/50 border-white/10"
                        data-testid="modal-input-promo"
                      />
                    </div>

                    <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <h3 className="font-bold text-white text-sm">Bônus de Boas-vindas</h3>
                      </div>
                      <p className="text-xs text-gray-400">Ao criar sua conta, você está elegível para receber 100% de bônus até R$ 500 no primeiro depósito.</p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleRegisterNext} 
                  disabled={registerLoading}
                  className="w-full h-12 text-lg font-bold shadow-[0_0_20px_-5px_rgba(242,102,49,0.5)]"
                  data-testid="modal-button-next"
                >
                  {registerLoading ? "Criando conta..." : registerStep === 3 ? "Finalizar Cadastro" : "Continuar"}
                  {!registerLoading && registerStep < 3 && <ArrowRight className="w-5 h-5 ml-2" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center gap-6 mt-6 opacity-50">
            <ShieldCheck className="w-5 h-5 text-gray-500" />
            <div className="border border-gray-600 rounded px-2 py-0.5 text-xs text-gray-400 font-bold">18+</div>
            <div className="border border-gray-600 rounded px-2 py-0.5 text-xs text-gray-400 font-bold">SSL</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
