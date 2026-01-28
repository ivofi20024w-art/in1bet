import { useEffect, useState, useCallback } from "react";
import { getStoredAuth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Settings2,
  RefreshCw,
  Zap,
  Users,
  History,
  Search,
  ToggleLeft,
  ToggleRight,
  CreditCard,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface GlobalSetting {
  key: string;
  value: string;
  updatedAt: string;
}

interface UserAutoWithdrawSetting {
  userId: string;
  userName: string;
  userEmail: string;
  autoWithdrawAllowed: boolean;
  updatedAt: string;
}

interface OndaPayStatus {
  configured: boolean;
  fields: {
    clientId: boolean;
    clientSecret: boolean;
    webhookSecret: boolean;
    webhookUrl: boolean;
  };
  webhookUrl: string | null;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminSettings() {
  const [globalAutoWithdraw, setGlobalAutoWithdraw] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserAutoWithdrawSetting[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const auth = getStoredAuth();

  const [ondapayStatus, setOndapayStatus] = useState<OndaPayStatus | null>(null);
  const [loadingOndapay, setLoadingOndapay] = useState(true);
  const [savingOndapay, setSavingOndapay] = useState(false);
  const [testingOndapay, setTestingOndapay] = useState(false);
  const [ondapayForm, setOndapayForm] = useState({
    clientId: "",
    clientSecret: "",
    webhookSecret: "",
    webhookUrl: "",
  });
  const [showSecrets, setShowSecrets] = useState({
    clientId: false,
    clientSecret: false,
    webhookSecret: false,
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings", {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const autoWithdrawSetting = data.settings?.find(
          (s: GlobalSetting) => s.key === "PIX_AUTO_WITHDRAW_GLOBAL"
        );
        setGlobalAutoWithdraw(autoWithdrawSetting?.value === "true");
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/admin/users", {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const usersWithAutoWithdraw = data.users.map((user: any) => ({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          autoWithdrawAllowed: user.autoWithdrawAllowed ?? true,
          updatedAt: user.updatedAt || user.createdAt,
        }));
        setUsers(usersWithAutoWithdraw);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const fetchOndapayStatus = useCallback(async () => {
    try {
      setLoadingOndapay(true);
      const response = await fetch("/api/admin/settings/ondapay-status", {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOndapayStatus(data);
        if (data.webhookUrl) {
          setOndapayForm(prev => ({ ...prev, webhookUrl: data.webhookUrl }));
        }
      }
    } catch (error) {
      console.error("Failed to fetch OndaPay status:", error);
    } finally {
      setLoadingOndapay(false);
    }
  }, []);

  const saveOndapaySettings = async () => {
    const hasChanges = ondapayForm.clientId || ondapayForm.clientSecret || 
                       ondapayForm.webhookSecret || ondapayForm.webhookUrl;
    
    if (!hasChanges) {
      toast.error("Preencha pelo menos um campo para atualizar");
      return;
    }

    try {
      setSavingOndapay(true);
      const response = await fetch("/api/admin/settings/ondapay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(ondapayForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Configurações atualizadas com sucesso");
        setOndapayForm({
          clientId: "",
          clientSecret: "",
          webhookSecret: "",
          webhookUrl: "",
        });
        fetchOndapayStatus();
      } else {
        toast.error(data.error || "Erro ao atualizar configurações");
      }
    } catch (error) {
      console.error("Failed to save OndaPay settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSavingOndapay(false);
    }
  };

  const testOndapayConnection = async () => {
    try {
      setTestingOndapay(true);
      const response = await fetch("/api/admin/settings/ondapay/test", {
        method: "POST",
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Conexão estabelecida com sucesso!");
      } else {
        toast.error(data.error || "Falha na conexão");
      }
    } catch (error) {
      console.error("Failed to test OndaPay connection:", error);
      toast.error("Erro ao testar conexão");
    } finally {
      setTestingOndapay(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchUsers();
    fetchOndapayStatus();
  }, [fetchSettings, fetchUsers, fetchOndapayStatus]);

  const toggleGlobalAutoWithdraw = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/settings/pix-auto-withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ enabled: !globalAutoWithdraw }),
      });

      if (response.ok) {
        setGlobalAutoWithdraw(!globalAutoWithdraw);
        toast.success(
          !globalAutoWithdraw
            ? "Saque automático ativado globalmente"
            : "Saque automático desativado globalmente"
        );
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao atualizar configuração");
      }
    } catch (error) {
      console.error("Failed to toggle global setting:", error);
      toast.error("Erro ao atualizar configuração");
    } finally {
      setSaving(false);
    }
  };

  const toggleUserAutoWithdraw = async (userId: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/auto-withdraw`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ enabled: !currentValue }),
      });

      if (response.ok) {
        setUsers((prev) =>
          prev.map((u) =>
            u.userId === userId
              ? { ...u, autoWithdrawAllowed: !currentValue, updatedAt: new Date().toISOString() }
              : u
          )
        );
        toast.success(
          !currentValue
            ? "Saque automático ativado para o usuário"
            : "Saque automático desativado para o usuário"
        );
      } else {
        const data = await response.json();
        toast.error(data.error || "Erro ao atualizar permissão");
      }
    } catch (error) {
      console.error("Failed to toggle user setting:", error);
      toast.error("Erro ao atualizar permissão do usuário");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout title="Configurações">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">
              Configurações
            </h1>
            <p className="text-muted-foreground">
              Gerencie as configurações da plataforma
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              fetchSettings();
              fetchUsers();
            }}
            disabled={loading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        <Card data-testid="card-global-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="w-5 h-5" />
              Configurações Globais
            </CardTitle>
            <CardDescription>
              Configurações que afetam toda a plataforma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">Saque Automático PIX</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quando ativado, saques elegíveis serão processados automaticamente sem aprovação manual
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={globalAutoWithdraw ? "default" : "secondary"}>
                  {globalAutoWithdraw ? "Ativado" : "Desativado"}
                </Badge>
                <Switch
                  checked={globalAutoWithdraw}
                  onCheckedChange={toggleGlobalAutoWithdraw}
                  disabled={saving || loading}
                  data-testid="switch-global-auto-withdraw"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-ondapay-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Configurações OndaPay (PIX)
            </CardTitle>
            <CardDescription>
              Configure as credenciais da integração com OndaPay para pagamentos PIX
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loadingOndapay ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 p-4 rounded-lg border bg-card">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {ondapayStatus?.configured ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="font-medium">
                        Status: {ondapayStatus?.configured ? "Configurado" : "Incompleto"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant={ondapayStatus?.fields.clientId ? "default" : "secondary"}>
                        {ondapayStatus?.fields.clientId ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                        Client ID
                      </Badge>
                      <Badge variant={ondapayStatus?.fields.clientSecret ? "default" : "secondary"}>
                        {ondapayStatus?.fields.clientSecret ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                        Client Secret
                      </Badge>
                      <Badge variant={ondapayStatus?.fields.webhookSecret ? "default" : "secondary"}>
                        {ondapayStatus?.fields.webhookSecret ? <Check className="w-3 h-3 mr-1" /> : <X className="w-3 h-3 mr-1" />}
                        Webhook Secret
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={testOndapayConnection}
                    disabled={testingOndapay || !ondapayStatus?.fields.clientId}
                  >
                    {testingOndapay ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 mr-2" />
                    )}
                    Testar Conexão
                  </Button>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Preencha os campos abaixo para atualizar as credenciais. Deixe em branco para manter o valor atual.
                    Por segurança, os valores atuais nunca são exibidos.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="ondapay-client-id">Client ID</Label>
                    <div className="relative">
                      <Input
                        id="ondapay-client-id"
                        type={showSecrets.clientId ? "text" : "password"}
                        placeholder={ondapayStatus?.fields.clientId ? "••••••••••••••••" : "Insira o Client ID"}
                        value={ondapayForm.clientId}
                        onChange={(e) => setOndapayForm(prev => ({ ...prev, clientId: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowSecrets(prev => ({ ...prev, clientId: !prev.clientId }))}
                      >
                        {showSecrets.clientId ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ondapay-client-secret">Client Secret</Label>
                    <div className="relative">
                      <Input
                        id="ondapay-client-secret"
                        type={showSecrets.clientSecret ? "text" : "password"}
                        placeholder={ondapayStatus?.fields.clientSecret ? "••••••••••••••••" : "Insira o Client Secret"}
                        value={ondapayForm.clientSecret}
                        onChange={(e) => setOndapayForm(prev => ({ ...prev, clientSecret: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowSecrets(prev => ({ ...prev, clientSecret: !prev.clientSecret }))}
                      >
                        {showSecrets.clientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ondapay-webhook-secret">Webhook Secret</Label>
                    <div className="relative">
                      <Input
                        id="ondapay-webhook-secret"
                        type={showSecrets.webhookSecret ? "text" : "password"}
                        placeholder={ondapayStatus?.fields.webhookSecret ? "••••••••••••••••" : "Insira o Webhook Secret"}
                        value={ondapayForm.webhookSecret}
                        onChange={(e) => setOndapayForm(prev => ({ ...prev, webhookSecret: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowSecrets(prev => ({ ...prev, webhookSecret: !prev.webhookSecret }))}
                      >
                        {showSecrets.webhookSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ondapay-webhook-url">Webhook URL</Label>
                    <Input
                      id="ondapay-webhook-url"
                      type="url"
                      placeholder="https://seu-dominio.com/api/webhook/ondapay"
                      value={ondapayForm.webhookUrl}
                      onChange={(e) => setOndapayForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      URL que o OndaPay usará para notificar sobre pagamentos. Deve começar com https://
                    </p>
                  </div>

                  <Button
                    onClick={saveOndapaySettings}
                    disabled={savingOndapay}
                    className="w-full"
                  >
                    {savingOndapay ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Salvar Configurações
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-user-settings">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Permissões por Usuário
            </CardTitle>
            <CardDescription>
              Configure permissões de saque automático por usuário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-users"
                />
              </div>
            </div>

            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Saque Automático</TableHead>
                    <TableHead>Atualizado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.slice(0, 50).map((user) => (
                      <TableRow key={user.userId} data-testid={`row-user-${user.userId}`}>
                        <TableCell className="font-medium">{user.userName}</TableCell>
                        <TableCell>{user.userEmail}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={user.autoWithdrawAllowed}
                              onCheckedChange={() =>
                                toggleUserAutoWithdraw(user.userId, user.autoWithdrawAllowed)
                              }
                              data-testid={`switch-auto-withdraw-${user.userId}`}
                            />
                            {user.autoWithdrawAllowed ? (
                              <ToggleRight className="w-4 h-4 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(user.updatedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filteredUsers.length > 50 && (
              <p className="text-sm text-muted-foreground mt-2">
                Mostrando 50 de {filteredUsers.length} usuários
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
