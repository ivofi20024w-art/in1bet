import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getStoredAuthState } from "@/lib/authTokens";

interface TwoFactorStatus {
  enabled: boolean;
  backupCodesRemaining: number;
}

interface SetupData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export function TwoFactorSettings() {
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [regenerateCode, setRegenerateCode] = useState("");
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [step, setStep] = useState(1);

  const getAuthHeaders = () => {
    return {
      "Content-Type": "application/json",
    };
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/2fa/status", {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to fetch 2FA status:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const startSetup = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/2fa/setup", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSetupData(data);
        setStep(1);
        setShowSetupDialog(true);
      } else {
        const error = await res.json();
        toast.error(error.error || "Erro ao iniciar configuração do 2FA");
      }
    } catch (error) {
      toast.error("Erro ao iniciar configuração do 2FA");
    }
    setSubmitting(false);
  };

  const confirmEnable = async () => {
    if (!setupData || verificationCode.length !== 6) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/2fa/enable", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          secret: setupData.secret,
          token: verificationCode,
          backupCodes: setupData.backupCodes,
        }),
      });

      if (res.ok) {
        toast.success("2FA ativado com sucesso!");
        setShowSetupDialog(false);
        setSetupData(null);
        setVerificationCode("");
        fetchStatus();
      } else {
        const error = await res.json();
        toast.error(error.error || "Código inválido");
      }
    } catch (error) {
      toast.error("Erro ao ativar 2FA");
    }
    setSubmitting(false);
  };

  const confirmDisable = async () => {
    if (disableCode.length < 6) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/2fa/disable", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ token: disableCode }),
      });

      if (res.ok) {
        toast.success("2FA desativado com sucesso");
        setShowDisableDialog(false);
        setDisableCode("");
        fetchStatus();
      } else {
        const error = await res.json();
        toast.error(error.error || "Código inválido");
      }
    } catch (error) {
      toast.error("Erro ao desativar 2FA");
    }
    setSubmitting(false);
  };

  const regenerateBackupCodes = async () => {
    if (regenerateCode.length !== 6) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/2fa/regenerate-backup-codes", {
        method: "POST",
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ token: regenerateCode }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewBackupCodes(data.backupCodes);
        setRegenerateCode("");
        fetchStatus();
        toast.success("Códigos de backup regenerados!");
      } else {
        const error = await res.json();
        toast.error(error.error || "Código inválido");
      }
    } catch (error) {
      toast.error("Erro ao regenerar códigos");
    }
    setSubmitting(false);
  };

  const copyBackupCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopiedCodes(true);
    toast.success("Códigos copiados!");
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-white/10">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card/50 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status?.enabled ? "bg-green-500/20" : "bg-yellow-500/20"}`}>
                {status?.enabled ? (
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                ) : (
                  <Shield className="w-5 h-5 text-yellow-500" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg" data-testid="text-2fa-title">Autenticação de Dois Fatores</CardTitle>
                <CardDescription>
                  {status?.enabled
                    ? "Sua conta está protegida com 2FA"
                    : "Adicione uma camada extra de segurança"}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant={status?.enabled ? "default" : "secondary"}
              className={status?.enabled ? "bg-green-500/20 text-green-400" : ""}
              data-testid="badge-2fa-status"
            >
              {status?.enabled ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.enabled ? (
            <>
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Códigos de Backup</p>
                  <p className="text-xs text-muted-foreground">
                    {status.backupCodesRemaining} códigos restantes
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackupCodesDialog(true)}
                  data-testid="button-manage-backup-codes"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerenciar
                </Button>
              </div>

              {status.backupCodesRemaining <= 2 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <p className="text-sm text-yellow-500">
                    Você tem poucos códigos de backup. Considere regenerá-los.
                  </p>
                </div>
              )}

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowDisableDialog(true)}
                data-testid="button-disable-2fa"
              >
                <ShieldOff className="w-4 h-4 mr-2" />
                Desativar 2FA
              </Button>
            </>
          ) : (
            <Button
              className="w-full"
              onClick={startSetup}
              disabled={submitting}
              data-testid="button-enable-2fa"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 mr-2" />
              )}
              Ativar 2FA
            </Button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="max-w-md bg-background/95 backdrop-blur">
          <DialogHeader>
            <DialogTitle>Configurar Autenticação de Dois Fatores</DialogTitle>
            <DialogDescription>
              {step === 1 && "Escaneie o código QR com seu aplicativo autenticador"}
              {step === 2 && "Salve seus códigos de backup em um local seguro"}
              {step === 3 && "Confirme a configuração com um código do app"}
            </DialogDescription>
          </DialogHeader>

          {step === 1 && setupData && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={setupData.qrCode} alt="QR Code" className="w-48 h-48" data-testid="img-qr-code" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xs text-muted-foreground">Chave manual:</p>
                <code className="block p-2 bg-secondary/50 rounded text-xs break-all">
                  {setupData.secret}
                </code>
              </div>
              <Button className="w-full" onClick={() => setStep(2)} data-testid="button-next-step">
                Próximo
              </Button>
            </div>
          )}

          {step === 2 && setupData && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-400 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Importante: Salve estes códigos
                </p>
                <p className="text-xs text-muted-foreground">
                  Use estes códigos se perder acesso ao seu aplicativo autenticador.
                  Cada código só pode ser usado uma vez.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 p-3 bg-secondary/30 rounded-lg">
                {setupData.backupCodes.map((code, i) => (
                  <code key={i} className="text-sm font-mono" data-testid={`text-backup-code-${i}`}>
                    {code}
                  </code>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => copyBackupCodes(setupData.backupCodes)}
                data-testid="button-copy-codes"
              >
                {copiedCodes ? (
                  <Check className="w-4 h-4 mr-2 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 mr-2" />
                )}
                {copiedCodes ? "Copiado!" : "Copiar Códigos"}
              </Button>
              <Button className="w-full" onClick={() => setStep(3)} data-testid="button-next-step-2">
                Próximo
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Código de Verificação</Label>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  data-testid="input-verification-code"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Digite o código de 6 dígitos do seu aplicativo autenticador
                </p>
              </div>
              <Button
                className="w-full"
                onClick={confirmEnable}
                disabled={verificationCode.length !== 6 || submitting}
                data-testid="button-confirm-enable"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4 mr-2" />
                )}
                Ativar 2FA
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent className="max-w-sm bg-background/95 backdrop-blur">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <ShieldOff className="w-5 h-5" />
              Desativar 2FA
            </DialogTitle>
            <DialogDescription>
              Para desativar a autenticação de dois fatores, digite o código do seu aplicativo autenticador ou um código de backup.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Código de Verificação</Label>
              <Input
                type="text"
                placeholder="000000"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="text-center text-xl tracking-widest"
                maxLength={8}
                data-testid="input-disable-code"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisableDialog(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDisable}
              disabled={disableCode.length < 6 || submitting}
              data-testid="button-confirm-disable"
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBackupCodesDialog} onOpenChange={setShowBackupCodesDialog}>
        <DialogContent className="max-w-sm bg-background/95 backdrop-blur">
          <DialogHeader>
            <DialogTitle>Códigos de Backup</DialogTitle>
            <DialogDescription>
              Regenere seus códigos de backup se você perdeu os anteriores ou usou a maioria deles.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {newBackupCodes.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 p-3 bg-secondary/30 rounded-lg">
                  {newBackupCodes.map((code, i) => (
                    <code key={i} className="text-sm font-mono" data-testid={`text-new-backup-code-${i}`}>
                      {code}
                    </code>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => copyBackupCodes(newBackupCodes)}
                  data-testid="button-copy-new-codes"
                >
                  {copiedCodes ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copiedCodes ? "Copiado!" : "Copiar Códigos"}
                </Button>
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowBackupCodesDialog(false);
                    setNewBackupCodes([]);
                  }}
                  data-testid="button-close-backup-dialog"
                >
                  Concluído
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Código do Autenticador</Label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={regenerateCode}
                    onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="text-center text-xl tracking-widest"
                    maxLength={6}
                    data-testid="input-regenerate-code"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={regenerateBackupCodes}
                  disabled={regenerateCode.length !== 6 || submitting}
                  data-testid="button-regenerate-codes"
                >
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerar Códigos
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
