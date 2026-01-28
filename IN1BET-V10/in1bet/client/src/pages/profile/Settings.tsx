import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Globe, Loader2, User, Save, Mail, Smartphone, Ticket, CheckCircle, XCircle, Gift, Palette, Sparkles, Lock } from "lucide-react";
import { Link } from "wouter";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TwoFactorSettings } from "@/components/TwoFactorSettings";
import { getStoredAuth } from "@/lib/auth";

const NAME_COLORS = [
  { id: "", label: "Padrão", class: "text-gray-400" },
  { id: "red", label: "Vermelho", class: "text-red-400" },
  { id: "orange", label: "Laranja", class: "text-orange-400" },
  { id: "yellow", label: "Amarelo", class: "text-yellow-400" },
  { id: "green", label: "Verde", class: "text-green-400" },
  { id: "cyan", label: "Ciano", class: "text-cyan-400" },
  { id: "blue", label: "Azul", class: "text-blue-400" },
  { id: "purple", label: "Roxo", class: "text-purple-400" },
  { id: "pink", label: "Rosa", class: "text-pink-400" },
  { id: "white", label: "Branco", class: "text-white" },
];

const NAME_EFFECTS = [
  { id: "", label: "Nenhum", icon: "—" },
  { id: "glow", label: "Brilho", icon: "✨" },
  { id: "stars", label: "Estrelas", icon: "⭐" },
  { id: "sparkles", label: "Faíscas", icon: "💫" },
  { id: "fire", label: "Fogo", icon: "🔥" },
  { id: "thunder", label: "Trovão", icon: "⚡" },
  { id: "ice", label: "Gelo", icon: "❄️" },
  { id: "neon", label: "Neon", icon: "💡" },
  { id: "gold", label: "Dourado", icon: "🏆" },
  { id: "rainbow", label: "Arco-íris", icon: "🌈" },
  { id: "matrix", label: "Matrix", icon: "💻" },
  { id: "pulse", label: "Pulso", icon: "💓" },
  { id: "glitch", label: "Glitch", icon: "📺" },
  { id: "cosmic", label: "Cósmico", icon: "🌌" },
  { id: "toxic", label: "Tóxico", icon: "☢️" },
  { id: "blood", label: "Sangue", icon: "🩸" },
  { id: "diamond", label: "Diamante", icon: "💎" },
  { id: "shadow", label: "Sombra", icon: "🌑" },
];

interface UserSettings {
  language: string;
  oddsFormat: string;
  emailMarketing: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoResult, setPromoResult] = useState<{success?: boolean; message?: string; bonusAmount?: number} | null>(null);
  const auth = getStoredAuth();
  const [settings, setSettings] = useState<UserSettings>({
    language: "pt-BR",
    oddsFormat: "decimal",
    emailMarketing: false,
    pushNotifications: true,
    smsNotifications: true,
  });

  const { data: settingsData, isLoading } = useQuery<{ settings: UserSettings }>({
    queryKey: ["/api/users/settings"],
  });

  const [selectedNameColor, setSelectedNameColor] = useState("");
  const [selectedNameEffect, setSelectedNameEffect] = useState("");
  const [savingCustomization, setSavingCustomization] = useState(false);

  const { data: customizationData } = useQuery<{ customization: { nameColor?: string; nameEffect?: string; messageColor?: string } }>({
    queryKey: ["/api/chat/customization"],
  });

  useEffect(() => {
    if (customizationData?.customization) {
      setSelectedNameColor(customizationData.customization.nameColor || "");
      setSelectedNameEffect(customizationData.customization.nameEffect || "");
    }
  }, [customizationData]);

  const handleSaveCustomization = async () => {
    if (!user || (user.level || 0) < 50) {
      toast({ variant: "destructive", title: "Erro", description: "Você precisa ser nível 50+ para personalizar" });
      return;
    }
    
    if (!auth.isAuthenticated) {
      toast({ variant: "destructive", title: "Erro", description: "Sessão expirada. Faça login novamente." });
      return;
    }
    
    setSavingCustomization(true);
    try {
      const response = await fetch("/api/chat/customization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          nameColor: selectedNameColor || null,
          nameEffect: selectedNameEffect || null,
        }),
      });
      
      if (response.ok) {
        toast({ title: "Personalização salva!", description: "Seu estilo de nome foi atualizado." });
        queryClient.invalidateQueries({ queryKey: ["/api/chat/customization"] });
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Erro", description: data.error || "Falha ao salvar" });
      }
    } catch (error) {
      console.error("[Settings] Error saving customization:", error);
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar personalização" });
    } finally {
      setSavingCustomization(false);
    }
  };

  useEffect(() => {
    if (settingsData) {
      setSettings(settingsData.settings);
    }
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
    }
  }, [settingsData, user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      return await apiRequest("PATCH", "/api/users/profile", data);
    },
    onSuccess: () => {
      toast({ title: "Perfil atualizado!", description: "Seus dados foram salvos com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao atualizar", description: error.message });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: UserSettings) => {
      return await apiRequest("POST", "/api/users/settings", data);
    },
    onSuccess: () => {
      toast({ title: "Configurações salvas!", description: "Suas preferências foram atualizadas." });
      queryClient.invalidateQueries({ queryKey: ["/api/users/settings"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name, phone });
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateSettingsMutation.mutate(newSettings);
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoResult({ success: false, message: "Digite um código promocional" });
      return;
    }

    setPromoLoading(true);
    setPromoResult(null);

    try {
      const response = await fetch("/api/promo/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ code: promoCode.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setPromoResult({
          success: true,
          message: data.message,
          bonusAmount: data.bonusAmount,
        });
        setPromoCode("");
        queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      } else {
        setPromoResult({ success: false, message: data.error || "Erro ao aplicar código" });
      }
    } catch (error) {
      setPromoResult({ success: false, message: "Erro ao processar código promocional" });
    } finally {
      setPromoLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-white">Configurações</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-card border-white/5 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <User className="w-5 h-5" />
                  Dados Pessoais
                </CardTitle>
                <CardDescription>Mantenha suas informações de contato atualizadas.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      className="bg-secondary/30 border-white/10 h-11" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      value={user?.email || ""} 
                      disabled 
                      className="bg-secondary/10 border-white/5 text-muted-foreground cursor-not-allowed h-11" 
                    />
                    <p className="text-[10px] text-muted-foreground">O email não pode ser alterado por segurança.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="bg-secondary/30 border-white/10 h-11" 
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                    className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold h-11"
                  >
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Salvar Alterações
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-8">
              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-primary">
                    <Globe className="w-5 h-5" />
                    Regionalização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select 
                      value={settings.language} 
                      onValueChange={(value) => handleSettingChange("language", value)}
                    >
                      <SelectTrigger className="bg-secondary/30 border-white/10 h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Formato de Odds</Label>
                    <RadioGroup 
                      value={settings.oddsFormat} 
                      onValueChange={(value) => handleSettingChange("oddsFormat", value)}
                      className="grid grid-cols-3 gap-4"
                    >
                      {["decimal", "fractional", "american"].map((format) => (
                        <div key={format}>
                          <RadioGroupItem value={format} id={format} className="peer sr-only" />
                          <Label
                            htmlFor={format}
                            className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all bg-secondary/20"
                          >
                            <span className="text-xl font-bold mb-1">
                              {format === "decimal" ? "2.50" : format === "fractional" ? "3/2" : "+150"}
                            </span>
                            <span className="text-[10px] text-muted-foreground capitalize">{format}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-primary">
                    <Bell className="w-5 h-5" />
                    Notificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: "emailMarketing", label: "Email Marketing", icon: Mail, desc: "Ofertas e bônus por email" },
                    { key: "pushNotifications", label: "Notificações Push", icon: Bell, desc: "Alertas em tempo real" },
                    { key: "smsNotifications", label: "SMS", icon: Smartphone, desc: "Alertas de segurança" },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <item.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <Label className="text-sm font-bold text-white">{item.label}</Label>
                          <p className="text-[10px] text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                      <Switch 
                        checked={settings[item.key as keyof UserSettings] as boolean}
                        onCheckedChange={(checked) => handleSettingChange(item.key as keyof UserSettings, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <TwoFactorSettings />

              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-primary">
                    <Palette className="w-5 h-5" />
                    Personalização do Chat
                  </CardTitle>
                  <CardDescription>
                    {(user?.level || 0) >= 50 
                      ? "Personalize a cor e efeito do seu nome no chat da comunidade"
                      : "Desbloqueie no nível 50 para personalizar seu nome no chat"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {(user?.level || 0) < 50 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-amber-500" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Você está no nível <span className="font-bold text-white">{user?.level || 1}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Faltam <span className="font-bold text-amber-400">{50 - (user?.level || 1)}</span> níveis para desbloquear
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <Palette className="w-4 h-4" />
                          Cor do Nome
                        </Label>
                        <div className="grid grid-cols-5 gap-2">
                          {NAME_COLORS.map((color) => (
                            <button
                              key={color.id}
                              onClick={() => setSelectedNameColor(color.id)}
                              className={`p-2 rounded-lg border-2 transition-all hover:scale-105 ${
                                selectedNameColor === color.id
                                  ? "border-primary bg-primary/10"
                                  : "border-white/10 bg-secondary/20 hover:border-white/20"
                              }`}
                              title={color.label}
                            >
                              <span className={`text-sm font-bold ${color.class}`}>Aa</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Efeito do Nome
                        </Label>
                        <div className="grid grid-cols-3 gap-2">
                          {NAME_EFFECTS.map((effect) => (
                            <button
                              key={effect.id}
                              onClick={() => setSelectedNameEffect(effect.id)}
                              className={`p-3 rounded-lg border-2 transition-all hover:scale-105 flex flex-col items-center gap-1 ${
                                selectedNameEffect === effect.id
                                  ? "border-primary bg-primary/10"
                                  : "border-white/10 bg-secondary/20 hover:border-white/20"
                              }`}
                            >
                              <span className="text-lg">{effect.icon}</span>
                              <span className="text-[10px] text-muted-foreground">{effect.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-lg bg-secondary/30 border border-white/5">
                        <Label className="text-xs text-muted-foreground mb-2 block">Pré-visualização</Label>
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 rounded bg-primary/20 text-primary text-xs font-bold">
                            {user?.level || 50}
                          </div>
                          <span 
                            className={`font-bold ${
                              selectedNameColor ? NAME_COLORS.find(c => c.id === selectedNameColor)?.class || "" : "text-white"
                            } ${
                              selectedNameEffect ? `effect-${selectedNameEffect}` : ""
                            }`}
                          >
                            {user?.username || user?.name || "SeuNome"}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleSaveCustomization}
                        disabled={savingCustomization}
                        className="w-full bg-primary hover:bg-primary/90"
                      >
                        {savingCustomization ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Salvar Personalização
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-primary">
                    <Ticket className="w-5 h-5" />
                    Código Promocional
                  </CardTitle>
                  <CardDescription>Insira um código promocional para receber bônus</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value.toUpperCase());
                        setPromoResult(null);
                      }}
                      placeholder="Digite seu código"
                      className="bg-secondary/30 border-white/10 h-11 font-mono uppercase"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleApplyPromoCode();
                      }}
                    />
                    <Button
                      onClick={handleApplyPromoCode}
                      disabled={promoLoading || !promoCode.trim()}
                      className="bg-primary hover:bg-primary/90 h-11 px-6"
                    >
                      {promoLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {promoResult && (
                    <div
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        promoResult.success
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-red-500/10 border border-red-500/20"
                      }`}
                    >
                      {promoResult.success ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      )}
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            promoResult.success ? "text-emerald-500" : "text-red-500"
                          }`}
                        >
                          {promoResult.message}
                        </p>
                        {promoResult.bonusAmount && (
                          <p className="text-xs text-emerald-400">
                            Bônus de R$ {promoResult.bonusAmount.toFixed(2)} adicionado!
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
