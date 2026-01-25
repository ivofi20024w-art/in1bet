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

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
        },
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
  }, [auth?.accessToken]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
        },
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
  }, [auth?.accessToken]);

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, [fetchSettings, fetchUsers]);

  const toggleGlobalAutoWithdraw = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/admin/settings/pix-auto-withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth?.accessToken}`,
        },
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
          Authorization: `Bearer ${auth?.accessToken}`,
        },
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
