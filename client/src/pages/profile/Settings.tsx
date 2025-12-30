import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Globe, Moon, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

interface UserSettings {
  language: string;
  oddsFormat: string;
  emailMarketing: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState<UserSettings>({
    language: "pt-BR",
    oddsFormat: "decimal",
    emailMarketing: false,
    pushNotifications: true,
    smsNotifications: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem("in1bet_token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/users/settings", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError("");

    try {
      const token = localStorage.getItem("in1bet_token");
      if (!token) {
        setError("Você precisa estar logado para salvar as configurações");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/users/settings", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erro ao salvar configurações");
        setSaving(false);
        return;
      }

      toast({
        title: "Configurações salvas!",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold text-white">Preferências</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span data-testid="text-error">{error}</span>
              </div>
            )}

            <Card className="bg-card border-white/5 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Globe className="w-5 h-5" />
                  Regionalização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select 
                      value={settings.language} 
                      onValueChange={(value) => setSettings({ ...settings, language: value })}
                    >
                      <SelectTrigger className="bg-secondary/30 border-white/10 h-11" data-testid="select-language">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                        <SelectItem value="en">🇺🇸 English</SelectItem>
                        <SelectItem value="es">🇪🇸 Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Moeda</Label>
                    <Select defaultValue="brl" disabled>
                      <SelectTrigger className="bg-secondary/30 border-white/10 h-11 opacity-70">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brl">R$ Real Brasileiro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Formato de Odds</Label>
                  <RadioGroup 
                    value={settings.oddsFormat} 
                    onValueChange={(value) => setSettings({ ...settings, oddsFormat: value })}
                    className="grid grid-cols-3 gap-4"
                    data-testid="radio-odds-format"
                  >
                    <div>
                      <RadioGroupItem value="decimal" id="decimal" className="peer sr-only" />
                      <Label
                        htmlFor="decimal"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all bg-secondary/20"
                      >
                        <span className="text-xl font-bold mb-1">2.50</span>
                        <span className="text-xs text-muted-foreground">Decimal</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="fractional" id="fractional" className="peer sr-only" />
                      <Label
                        htmlFor="fractional"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all bg-secondary/20"
                      >
                        <span className="text-xl font-bold mb-1">3/2</span>
                        <span className="text-xs text-muted-foreground">Fracionária</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="american" id="american" className="peer sr-only" />
                      <Label
                        htmlFor="american"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all bg-secondary/20"
                      >
                        <span className="text-xl font-bold mb-1">+150</span>
                        <span className="text-xs text-muted-foreground">Americano</span>
                      </Label>
                    </div>
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
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold text-white cursor-pointer">Email Marketing</Label>
                    <p className="text-sm text-gray-500">Receber ofertas exclusivas, bônus e novidades por email</p>
                  </div>
                  <Switch 
                    checked={settings.emailMarketing}
                    onCheckedChange={(checked) => setSettings({ ...settings, emailMarketing: checked })}
                    data-testid="switch-email-marketing"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold text-white cursor-pointer">Notificações Push</Label>
                    <p className="text-sm text-gray-500">Alertas em tempo real sobre resultados das suas apostas</p>
                  </div>
                  <Switch 
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, pushNotifications: checked })}
                    data-testid="switch-push-notifications"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="text-base font-bold text-white cursor-pointer">SMS</Label>
                    <p className="text-sm text-gray-500">Códigos de segurança e alertas importantes de conta</p>
                  </div>
                  <Switch 
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, smsNotifications: checked })}
                    data-testid="switch-sms-notifications"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-lg opacity-50 pointer-events-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <Moon className="w-5 h-5" />
                  Aparência (Em Breve)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Modo Escuro</Label>
                    <p className="text-sm text-gray-500">Alternar entre tema claro e escuro</p>
                  </div>
                  <Switch defaultChecked disabled />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={saveSettings}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 shadow-lg shadow-primary/20"
                data-testid="button-save-settings"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
