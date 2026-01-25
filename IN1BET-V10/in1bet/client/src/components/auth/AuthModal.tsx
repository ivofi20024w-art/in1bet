import { useState } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, LogIn, ChevronLeft, Mail, Loader2 } from "lucide-react";
import { IMaskInput } from "react-imask";
import { cpf } from "cpf-cnpj-validator";
import { useToast } from "@/hooks/use-toast";
import { login, register } from "@/lib/auth";
import { useAuthModal } from "@/stores/authModalStore";
import { apiRequest } from "@/lib/queryClient";

export default function AuthModal() {
  const { isOpen, activeTab, close, setTab, referralCode, clearReferralCode } = useAuthModal();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState("");

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
    setShowForgotPassword(false);
    setForgotEmail("");
    setForgotLoading(false);
    setForgotSuccess(false);
    setForgotError("");
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError("");

    try {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { identifier: forgotEmail });
      const data = await res.json();
      
      if (!res.ok) {
        setForgotError(data.error || "Erro ao processar solicitação");
        return;
      }

      setForgotSuccess(true);
      toast({
        title: "Solicitação enviada",
        description: "Se o email/CPF estiver cadastrado, você receberá instruções.",
      });
    } catch (err: any) {
      setForgotError("Erro de conexão. Tente novamente.");
    } finally {
      setForgotLoading(false);
    }
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
        referralCode: referralCode || undefined,
      });

      clearReferralCode();
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
      <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto p-0 gap-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f] border-white/10" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>Autenticação</DialogTitle>
        </VisuallyHidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 p-4 sm:p-5">
          <div className="text-center mb-3">
            <h1 className="text-xl sm:text-2xl font-heading font-bold italic text-primary tracking-wide">
              IN1<span className="text-white">BET</span>
            </h1>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setTab(v as 'login' | 'register')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-0.5 rounded-lg mb-3 h-8">
              <TabsTrigger 
                value="login" 
                className="rounded-md text-xs h-7 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold"
                data-testid="tab-login"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="rounded-md text-xs h-7 data-[state=active]:bg-primary data-[state=active]:text-white font-semibold"
                data-testid="tab-register"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              {!showForgotPassword ? (
                <form onSubmit={handleLogin} className="space-y-3">
                  {loginError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                      {loginError}
                    </div>
                  )}
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs">CPF ou Email</Label>
                    <Input 
                      placeholder="Digite seu CPF ou email" 
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      className="h-9 bg-background/50 border-white/10 text-sm"
                      data-testid="modal-input-identifier"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs">Senha</Label>
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(true)}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-9 bg-background/50 border-white/10 text-sm"
                      data-testid="modal-input-password"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loginLoading}
                    className="w-full h-10 text-sm font-bold shadow-[0_0_20px_-5px_rgba(242,102,49,0.5)]"
                    data-testid="modal-button-login"
                  >
                    {loginLoading ? "Entrando..." : "Entrar"}
                    {!loginLoading && <LogIn className="w-4 h-4 ml-2" />}
                  </Button>
                </form>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotError(""); }}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    Voltar ao login
                  </button>

                  {!forgotSuccess ? (
                    <form onSubmit={handleForgotPassword} className="space-y-3">
                      <div className="text-center mb-2">
                        <h3 className="text-sm font-bold text-white">Recuperar Senha</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Digite seu email ou CPF para receber o link de recuperação.
                        </p>
                      </div>

                      {forgotError && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-2 rounded-lg">
                          {forgotError}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs">Email ou CPF</Label>
                        <Input 
                          placeholder="Digite seu email ou CPF" 
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          className="h-9 bg-background/50 border-white/10 text-sm"
                          required
                          data-testid="modal-input-forgot-email"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        disabled={forgotLoading || !forgotEmail}
                        className="w-full h-10 text-sm font-bold shadow-[0_0_20px_-5px_rgba(242,102,49,0.5)]"
                        data-testid="modal-button-forgot-submit"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Enviar Link
                          </>
                        )}
                      </Button>
                    </form>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1">Email Enviado!</h3>
                      <p className="text-[11px] text-muted-foreground mb-4">
                        Se o email/CPF estiver cadastrado, você receberá as instruções de recuperação.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { setShowForgotPassword(false); setForgotSuccess(false); setForgotEmail(""); }}
                        className="text-xs"
                      >
                        Voltar ao Login
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              <div className="space-y-3">
                {registerApiError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg">
                    {registerApiError}
                  </div>
                )}

                <div className="flex items-center justify-between mb-1">
                  {registerStep > 1 ? (
                    <Button variant="ghost" size="icon" onClick={() => setRegisterStep(registerStep - 1)} className="h-6 w-6">
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                  ) : <div className="w-6" />}
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1 w-6 rounded-full transition-colors ${registerStep >= i ? 'bg-primary' : 'bg-white/10'}`} />
                    ))}
                  </div>
                  <div className="w-6" />
                </div>

                <h3 className="text-sm font-bold text-center text-white mb-2">
                  {registerStep === 1 && "Dados de Acesso"}
                  {registerStep === 2 && "Dados Pessoais"}
                  {registerStep === 3 && "Contato e Bônus"}
                </h3>

                {registerStep === 1 && (
                  <div className="space-y-2.5 animate-in slide-in-from-right duration-300">
                    <div className="space-y-1">
                      <Label className="text-xs">E-mail</Label>
                      <Input 
                        type="email" 
                        placeholder="seu@email.com" 
                        value={registerFormData.email}
                        onChange={e => setRegisterFormData({...registerFormData, email: e.target.value})}
                        className={`h-9 bg-background/50 border-white/10 text-sm ${registerErrors.email ? "border-red-500" : ""}`}
                        data-testid="modal-input-email"
                      />
                      {registerErrors.email && <span className="text-[10px] text-red-500">{registerErrors.email}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Senha</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={registerFormData.password}
                        onChange={e => setRegisterFormData({...registerFormData, password: e.target.value})}
                        className={`h-9 bg-background/50 border-white/10 text-sm ${registerErrors.password ? "border-red-500" : ""}`}
                        data-testid="modal-input-reg-password"
                      />
                      {registerErrors.password && <span className="text-[10px] text-red-500">{registerErrors.password}</span>}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Confirmar Senha</Label>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        value={registerFormData.confirmPassword}
                        onChange={e => setRegisterFormData({...registerFormData, confirmPassword: e.target.value})}
                        className={`h-9 bg-background/50 border-white/10 text-sm ${registerErrors.confirmPassword ? "border-red-500" : ""}`}
                        data-testid="modal-input-confirm-password"
                      />
                      {registerErrors.confirmPassword && <span className="text-[10px] text-red-500">{registerErrors.confirmPassword}</span>}
                    </div>
                    <label className="flex items-start gap-2 p-2 rounded-lg border border-white/5 bg-secondary/20 cursor-pointer hover:bg-secondary/40 transition-colors">
                      <input 
                        type="checkbox" 
                        className="mt-0.5 rounded border-white/20 bg-transparent text-primary focus:ring-primary h-3.5 w-3.5"
                        checked={registerFormData.terms}
                        onChange={e => setRegisterFormData({...registerFormData, terms: e.target.checked})}
                        data-testid="modal-checkbox-terms"
                      />
                      <div className="text-[10px] text-muted-foreground leading-relaxed">
                        Li e concordo com os <span className="text-primary underline">Termos e Condições</span>. Confirmo que tenho mais de 18 anos.
                      </div>
                    </label>
                    {registerErrors.terms && <span className="text-[10px] text-red-500 block text-center">{registerErrors.terms}</span>}
                  </div>
                )}

                {registerStep === 2 && (
                  <div className="space-y-2.5 animate-in slide-in-from-right duration-300">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-lg flex gap-2 items-start">
                      <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-yellow-200/80">O CPF deve ser do titular da conta para garantir saques rápidos via PIX.</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Nome Completo</Label>
                      <Input 
                        placeholder="Como no documento" 
                        value={registerFormData.name}
                        onChange={e => setRegisterFormData({...registerFormData, name: e.target.value})}
                        className={`h-9 bg-background/50 border-white/10 text-sm ${registerErrors.name ? "border-red-500" : ""}`}
                        data-testid="modal-input-name"
                      />
                      {registerErrors.name && <span className="text-[10px] text-red-500">{registerErrors.name}</span>}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">CPF</Label>
                      <IMaskInput
                        mask="000.000.000-00"
                        value={registerFormData.cpf}
                        onAccept={(value) => setRegisterFormData({...registerFormData, cpf: value})}
                        className={`flex h-9 w-full rounded-lg border border-input bg-background/50 px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:border-white/20 ${registerErrors.cpf ? "border-red-500" : "border-white/10"}`}
                        placeholder="000.000.000-00"
                        data-testid="modal-input-cpf"
                      />
                      {registerErrors.cpf && <span className="text-[10px] text-red-500">{registerErrors.cpf}</span>}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Data de Nascimento</Label>
                      <Input 
                        type="date"
                        value={registerFormData.birthDate}
                        onChange={e => setRegisterFormData({...registerFormData, birthDate: e.target.value})}
                        className={`h-9 bg-background/50 border-white/10 text-sm ${registerErrors.birthDate ? "border-red-500" : ""}`}
                        data-testid="modal-input-birthdate"
                      />
                      {registerErrors.birthDate && <span className="text-[10px] text-red-500">{registerErrors.birthDate}</span>}
                    </div>
                  </div>
                )}

                {registerStep === 3 && (
                  <div className="space-y-2.5 animate-in slide-in-from-right duration-300">
                    <div className="space-y-1">
                      <Label className="text-xs">Celular</Label>
                      <IMaskInput
                        mask="(00) 00000-0000"
                        value={registerFormData.phone}
                        onAccept={(value) => setRegisterFormData({...registerFormData, phone: value})}
                        className="flex h-9 w-full rounded-lg border border-white/10 bg-background/50 px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 hover:border-white/20"
                        placeholder="(11) 99999-9999"
                        data-testid="modal-input-phone"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Código Promocional (Opcional)</Label>
                      <Input 
                        placeholder="Ex: BONUS100" 
                        value={registerFormData.promoCode}
                        onChange={e => setRegisterFormData({...registerFormData, promoCode: e.target.value.toUpperCase()})}
                        className="h-9 bg-background/50 border-white/10 text-sm"
                        data-testid="modal-input-promo"
                      />
                    </div>

                    <div className="bg-green-500/10 border border-green-500/20 p-2 rounded-lg">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                        <h3 className="font-bold text-white text-xs">Bônus de Boas-vindas</h3>
                      </div>
                      <p className="text-[10px] text-gray-400">100% de bônus até R$ 500 no primeiro depósito.</p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={handleRegisterNext} 
                  disabled={registerLoading}
                  className="w-full h-10 text-sm font-bold shadow-[0_0_20px_-5px_rgba(242,102,49,0.5)]"
                  data-testid="modal-button-next"
                >
                  {registerLoading ? "Criando conta..." : registerStep === 3 ? "Finalizar Cadastro" : "Continuar"}
                  {!registerLoading && registerStep < 3 && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center gap-4 mt-4 opacity-50">
            <ShieldCheck className="w-4 h-4 text-gray-500" />
            <div className="border border-gray-600 rounded px-1.5 py-0.5 text-[10px] text-gray-400 font-bold">18+</div>
            <div className="border border-gray-600 rounded px-1.5 py-0.5 text-[10px] text-gray-400 font-bold">SSL</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
