import { useEffect, useState, useCallback } from "react";
import { getStoredAuth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Shield, AlertTriangle } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  dataBefore: any;
  dataAfter: any;
  reason: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string;
    email: string;
  } | null;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getActionBadge(action: string) {
  const colors: Record<string, string> = {
    USER_BLOCK: "bg-red-500/20 text-red-500",
    USER_UNBLOCK: "bg-emerald-500/20 text-emerald-500",
    WITHDRAWAL_APPROVE: "bg-blue-500/20 text-blue-500",
    WITHDRAWAL_REJECT: "bg-red-500/20 text-red-500",
    WITHDRAWAL_PAY: "bg-emerald-500/20 text-emerald-500",
    BONUS_CREATE: "bg-purple-500/20 text-purple-500",
    BONUS_UPDATE: "bg-blue-500/20 text-blue-500",
    BONUS_TOGGLE: "bg-yellow-500/20 text-yellow-500",
    USER_BONUS_CANCEL: "bg-orange-500/20 text-orange-500",
    USER_MAKE_ADMIN: "bg-purple-500/20 text-purple-500",
    USER_REMOVE_ADMIN: "bg-gray-500/20 text-gray-500",
  };

  const labels: Record<string, string> = {
    USER_BLOCK: "Usuário Bloqueado",
    USER_UNBLOCK: "Usuário Desbloqueado",
    WITHDRAWAL_APPROVE: "Saque Aprovado",
    WITHDRAWAL_REJECT: "Saque Rejeitado",
    WITHDRAWAL_PAY: "Saque Pago",
    BONUS_CREATE: "Bônus Criado",
    BONUS_UPDATE: "Bônus Atualizado",
    BONUS_TOGGLE: "Status Bônus",
    USER_BONUS_CANCEL: "Bônus Cancelado",
    USER_MAKE_ADMIN: "Admin Adicionado",
    USER_REMOVE_ADMIN: "Admin Removido",
  };

  return (
    <Badge className={colors[action] || "bg-gray-500/20 text-gray-500"}>
      {labels[action] || action}
    </Badge>
  );
}

function getTargetTypeBadge(targetType: string) {
  const labels: Record<string, string> = {
    user: "Usuário",
    withdrawal: "Saque",
    bonus: "Bônus",
    user_bonus: "Bônus Usuário",
  };

  return (
    <span className="text-xs text-gray-400">
      {labels[targetType] || targetType}
    </span>
  );
}

export default function AdminAudit() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const auth = getStoredAuth();

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/audit-logs?limit=200", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <AdminLayout title="Logs de Auditoria">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-500" />
            <p className="text-gray-400">
              Registro de todas as ações administrativas
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <Card className="bg-[#111111] border-gray-800">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Data/Hora</TableHead>
                  <TableHead className="text-gray-400">Administrador</TableHead>
                  <TableHead className="text-gray-400">Ação</TableHead>
                  <TableHead className="text-gray-400">Alvo</TableHead>
                  <TableHead className="text-gray-400">Detalhes</TableHead>
                  <TableHead className="text-gray-400">Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-400">
                      Nenhum log de auditoria encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="border-gray-800">
                      <TableCell className="text-gray-300 text-sm font-mono">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        {log.admin ? (
                          <div>
                            <p className="text-white text-sm">{log.admin.name}</p>
                            <p className="text-gray-500 text-xs">{log.admin.email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div>
                          {getTargetTypeBadge(log.targetType)}
                          <p className="text-white text-xs font-mono truncate max-w-[120px]">
                            {log.targetId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-400 text-xs max-w-[200px]">
                        {log.dataBefore && log.dataAfter && (
                          <div className="space-y-1">
                            <div className="text-red-400">
                              - {JSON.stringify(log.dataBefore).substring(0, 50)}
                            </div>
                            <div className="text-emerald-400">
                              + {JSON.stringify(log.dataAfter).substring(0, 50)}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-400 text-sm max-w-[150px] truncate">
                        {log.reason || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-[#111111] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Importante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-gray-400 text-sm space-y-2">
              <li>Todas as ações administrativas são registradas automaticamente</li>
              <li>Os logs não podem ser editados ou excluídos</li>
              <li>Cada registro mostra quem fez, o que fez, e quando fez</li>
              <li>Os dados "antes/depois" permitem auditoria completa das mudanças</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
