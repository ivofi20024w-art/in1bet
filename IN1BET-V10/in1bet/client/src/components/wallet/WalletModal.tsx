import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wallet, ArrowUpRight, ArrowDownLeft, Copy, Clock, CheckCircle2, XCircle, Loader2, Check, AlertCircle, RefreshCw, User } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { getStoredAuth, getWallet } from "@/lib/auth";
import { httpGet, httpPost } from "@/lib/httpClient";

interface PixDepositResponse {
  success: boolean;
  externalId: string;
  qrCode: string;
  qrCodeBase64: string;
  amount: number;
  expiresIn: string;
}

interface PixStatusResponse {
  externalId: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

interface PixHistoryItem {
  externalId: string;
  amount: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

interface WithdrawalHistoryItem {
  id: string;
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: string;
  rejectionReason: string | null;
  createdAt: string;
  paidAt: string | null;
}

interface WalletBalance {
  balance: number;
  lockedBalance: number;
  bonusBalance: number;
  rolloverRemaining: number;
  rolloverTotal: number;
  rolloverProgress: number;
  currency: string;
}

interface KycStatus {
  kycStatus: string;
  name: string;
  cpf: string | null;
  isVerified: boolean;
}

type WithdrawStep = 'input' | 'kyc' | 'loading' | 'success' | 'error';
type PixKeyType = 'CPF' | 'EMAIL' | 'PHONE';

export function WalletModal({ children, onBalanceUpdate }: { children: React.ReactNode; onBalanceUpdate?: () => void }) {
  const [amount, setAmount] = useState("50");
  const [depositStep, setDepositStep] = useState<'input' | 'loading' | 'payment' | 'success' | 'error'>('input');
  const [timer, setTimer] = useState(1800);
  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState<PixDepositResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [history, setHistory] = useState<PixHistoryItem[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>('input');
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('CPF');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  
  const [kycName, setKycName] = useState("");
  const [kycCpf, setKycCpf] = useState("");
  const [kycLoading, setKycLoading] = useState(false);

  useEffect(() => {
    if (depositStep === 'payment' && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [depositStep, timer]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
    if (depositStep === 'payment' && pixData?.externalId && isPolling) {
      pollInterval = setInterval(async () => {
        try {
          const status = await checkPixStatus(pixData.externalId);
          if (status?.status === 'COMPLETED') {
            setDepositStep('success');
            setIsPolling(false);
            toast.success(`Depósito de R$ ${pixData.amount.toFixed(2)} confirmado!`);
            onBalanceUpdate?.();
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 5000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [depositStep, pixData?.externalId, isPolling, onBalanceUpdate]);

  const fetchHistory = useCallback(async () => {
    const auth = getStoredAuth();
    if (!auth.isAuthenticated) return;

    setLoadingHistory(true);
    try {
      const [depositResult, withdrawResult] = await Promise.all([
        httpGet<{ deposits: PixHistoryItem[] }>("/api/payments/pix/history"),
        httpGet<{ withdrawals: WithdrawalHistoryItem[] }>("/api/withdrawals/history"),
      ]);
      
      if (depositResult.data?.deposits) {
        setHistory(depositResult.data.deposits);
      }
      if (withdrawResult.data?.withdrawals) {
        setWithdrawalHistory(withdrawResult.data.withdrawals);
      }
    } catch (e) {
      console.error("Error fetching history:", e);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const fetchWalletBalance = useCallback(async () => {
    const data = await getWallet();
    if (data) {
      setWalletBalance(data);
    }
  }, []);

  const fetchKycStatus = useCallback(async () => {
    const auth = getStoredAuth();
    if (!auth.isAuthenticated) return;

    try {
      const { data } = await httpGet<KycStatus>("/api/kyc/status");
      if (data) {
        setKycStatus(data);
        if (data.name) setKycName(data.name);
      }
    } catch (e) {
      console.error("Error fetching KYC status:", e);
    }
  }, []);

  const checkPixStatus = async (externalId: string): Promise<PixStatusResponse | null> => {
    const auth = getStoredAuth();
    if (!auth.isAuthenticated) return null;

    try {
      const { data } = await httpGet<PixStatusResponse>(`/api/payments/pix/status/${externalId}`);
      return data;
    } catch (e) {
      console.error("Error checking status:", e);
    }
    return null;
  };

  const handleGeneratePix = async () => {
    const amountNum = parseFloat(amount);
    if (!amount || amountNum < 20) {
      toast.error("O valor mínimo de depósito é R$ 20,00");
      return;
    }

    const auth = getStoredAuth();
    if (!auth.isAuthenticated) {
      toast.error("Você precisa estar logado para fazer um depósito");
      return;
    }

    setDepositStep('loading');
    setError(null);

    try {
      const { data, error } = await httpPost<PixDepositResponse>("/api/payments/pix/create", { 
        amount: Math.round(amountNum * 100) 
      });

      if (error || !data) {
        throw new Error(error || "Erro ao gerar PIX");
      }

      setPixData(data);
      setDepositStep('payment');
      setTimer(1800);
      setIsPolling(true);
    } catch (e: any) {
      console.error("Error generating PIX:", e);
      setError(e.message || "Erro ao gerar código PIX");
      setDepositStep('error');
      toast.error(e.message || "Erro ao gerar código PIX");
    }
  };

  const handleCopyCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      toast.success("Código PIX copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdrawRequest = async () => {
    const amountNum = parseFloat(withdrawAmount);
    if (!withdrawAmount || amountNum < 20) {
      toast.error("O valor mínimo de saque é R$ 20,00");
      return;
    }

    if (!pixKey.trim()) {
      toast.error("Informe a chave PIX");
      return;
    }

    if (walletBalance && amountNum > walletBalance.balance) {
      toast.error("Saldo insuficiente");
      return;
    }

    const auth = getStoredAuth();
    if (!auth.isAuthenticated) {
      toast.error("Você precisa estar logado");
      return;
    }

    if (kycStatus?.kycStatus !== 'verified') {
      setWithdrawStep('kyc');
      return;
    }

    setWithdrawStep('loading');
    setWithdrawError(null);

    try {
      const { data, error } = await httpPost("/api/withdrawals/request", { 
        amount: amountNum, 
        pixKey: pixKey.trim(), 
        pixKeyType 
      });

      if (error) {
        throw new Error(error);
      }

      setWithdrawStep('success');
      toast.success("Saque solicitado com sucesso!");
      onBalanceUpdate?.();
      fetchWalletBalance();
    } catch (e: any) {
      console.error("Error requesting withdrawal:", e);
      setWithdrawError(e.message || "Erro ao solicitar saque");
      setWithdrawStep('error');
      toast.error(e.message || "Erro ao solicitar saque");
    }
  };

  const handleKycSubmit = async () => {
    if (!kycName.trim() || kycName.trim().length < 3) {
      toast.error("Nome deve ter pelo menos 3 caracteres");
      return;
    }

    if (!kycCpf.trim()) {
      toast.error("Informe o CPF");
      return;
    }

    const auth = getStoredAuth();
    if (!auth.isAuthenticated) return;

    setKycLoading(true);

    try {
      const response = await fetch("/api/kyc/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          fullName: kycName.trim(), 
          cpf: kycCpf.trim() 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao validar dados");
      }

      toast.success("Dados verificados com sucesso!");
      await fetchKycStatus();
      setWithdrawStep('input');
    } catch (e: any) {
      toast.error(e.message || "Erro ao validar dados");
    } finally {
      setKycLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return "Ontem";
    return date.toLocaleDateString('pt-BR');
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const resetDeposit = () => {
    setDepositStep('input');
    setAmount("50");
    setPixData(null);
    setError(null);
    setIsPolling(false);
  };

  const resetWithdraw = () => {
    setWithdrawStep('input');
    setWithdrawAmount("");
    setPixKey("");
    setWithdrawError(null);
  };

  const handleTabChange = (tab: string) => {
    if (tab === 'history') {
      fetchHistory();
    }
    if (tab === 'withdraw') {
      fetchWalletBalance();
      fetchKycStatus();
    }
  };

  const getWithdrawalStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'Pendente', color: 'text-yellow-500' };
      case 'APPROVED': return { label: 'Aprovado', color: 'text-blue-500' };
      case 'REJECTED': return { label: 'Rejeitado', color: 'text-red-500' };
      case 'PAID': return { label: 'Pago', color: 'text-green-500' };
      default: return { label: status, color: 'text-gray-500' };
    }
  };

  const allHistory = [
    ...history.map(h => ({ ...h, type: 'deposit' as const, id: h.externalId })),
    ...withdrawalHistory.map(w => ({ ...w, type: 'withdrawal' as const, externalId: w.id })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Dialog onOpenChange={(open) => {
      if (!open) {
        setTimeout(() => {
          resetDeposit();
          resetWithdraw();
        }, 300);
      }
      if (open) {
        fetchWalletBalance();
        fetchKycStatus();
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-white max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="p-6 pb-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-heading tracking-wide">
              <Wallet className="w-5 h-5 text-primary" />
              Minha Carteira
            </DialogTitle>
            <DialogDescription className="sr-only">
              Gerencie seus depósitos, saques e histórico de transações
            </DialogDescription>
          </DialogHeader>
        </div>

        <Tabs defaultValue="deposit" className="w-full flex-1 flex flex-col min-h-0" onValueChange={handleTabChange}>
          <div className="px-6 pb-4">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger value="deposit" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs font-bold" data-testid="tab-deposit">Depósito</TabsTrigger>
              <TabsTrigger value="withdraw" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs font-bold" data-testid="tab-withdraw">Saque</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs font-bold" data-testid="tab-history">Histórico</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
            <TabsContent value="deposit" className="space-y-4 mt-0 animate-in slide-in-from-left-4 duration-300">
              {depositStep === 'input' && (
                <>
                  <div className="bg-secondary/50 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-black/50 flex items-center justify-center shrink-0 border border-white/5">
                      <svg viewBox="0 0 512 512" className="w-7 h-7" fill="#32BCAD">
                        <path d="M112.57 391.19c20.056 0 38.928-7.808 53.12-22l76.693-76.692c5.385-5.404 14.765-5.384 20.15 0l76.989 76.989c14.191 14.172 33.045 21.98 53.12 21.98h15.098l-97.138 97.139c-30.326 30.344-79.505 30.344-109.85 0l-97.415-97.416h9.232zm280.068-271.096c-20.056 0-38.929 7.809-53.12 22l-76.97 76.99c-5.551 5.55-14.599 5.55-20.15 0l-76.711-76.693c-14.192-14.191-33.046-21.999-53.12-21.999h-9.234l97.416-97.416c30.344-30.344 79.523-30.344 109.867 0l97.138 97.138-15.116-.02zm-280.068 73.27c-12.287 0-23.861 4.782-32.56 13.463l-50.614 50.632c-17.957 17.957-17.957 47.071 0 65.028l50.614 50.596c8.7 8.7 20.273 13.5 32.56 13.5h9.234l-9.234 9.234c-42.622 42.622-42.622 111.794 0 154.416l9.234 9.234H112.57c-12.287 0-23.861-4.8-32.56-13.5l-50.614-50.596c-17.957-17.957-17.957-47.071 0-65.028l50.614-50.632c8.7-8.681 20.273-13.463 32.56-13.463h9.234l9.234-9.234-9.234-9.234c-42.622-42.622-42.622-111.794 0-154.416l-9.234 9.234v.02zm280.068 199.586c12.287 0 23.861-4.8 32.56-13.5l50.633-50.614c17.956-17.957 17.956-47.071 0-65.028l-50.633-50.632c-8.7-8.681-20.273-13.463-32.56-13.463h-15.098l15.098-15.098c42.622-42.622 42.622-111.794 0-154.416l-15.098-15.098h15.098c12.287 0 23.861 4.818 32.56 13.5l50.633 50.632c17.956 17.957 17.956 47.071 0 65.028l-50.633 50.614c-8.7 8.7-20.273 13.5-32.56 13.5h-15.098l15.098 15.098c42.622 42.622 42.622 111.794 0 154.416l15.098-15.098v.159z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white text-base">PIX</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Depósitos e saques instantâneos.</p>
                      <p className="text-xs text-muted-foreground">Disponível 24 horas, 7 dias por semana.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Valor do Depósito (R$)</Label>
                    <div className="relative group">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold group-focus-within:text-primary transition-colors">R$</span>
                      <Input 
                        type="number" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-10 bg-secondary/50 border-white/10 focus-visible:ring-primary font-bold text-xl h-12" 
                        data-testid="input-deposit-amount"
                        min="20"
                        step="1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {["20", "50", "100", "200"].map((val) => (
                      <Button 
                        key={val} 
                        variant="outline" 
                        className={`border-white/10 hover:bg-primary hover:text-white hover:border-primary transition-all ${amount === val ? 'bg-primary/20 border-primary text-primary' : ''}`}
                        onClick={() => setAmount(val)}
                        data-testid={`button-preset-${val}`}
                      >
                        R$ {val}
                      </Button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 text-lg shadow-[0_0_20px_-5px_rgba(22,163,74,0.5)] transition-all hover:scale-[1.02]"
                      onClick={handleGeneratePix}
                      data-testid="button-generate-pix"
                    >
                      GERAR PIX
                    </Button>
                  </div>
                </>
              )}

              {depositStep === 'loading' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-muted-foreground animate-pulse">Gerando código PIX...</p>
                </div>
              )}

              {depositStep === 'error' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-6">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-white">Erro ao gerar PIX</h2>
                    <p className="text-muted-foreground text-sm">{error}</p>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12"
                    onClick={resetDeposit}
                    data-testid="button-try-again"
                  >
                    TENTAR NOVAMENTE
                  </Button>
                </div>
              )}

              {depositStep === 'payment' && pixData && (
                <div className="space-y-5 animate-in zoom-in-95 duration-300">
                  <div className="text-center space-y-1">
                    <p className="text-sm text-muted-foreground">Total a pagar</p>
                    <h2 className="text-3xl font-bold text-white" data-testid="text-pix-amount">R$ {pixData.amount.toFixed(2)}</h2>
                  </div>

                  <div className="bg-white p-3 rounded-xl mx-auto w-fit shadow-lg shadow-white/5 relative">
                    <img 
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                      alt="QR Code PIX" 
                      className="w-44 h-44"
                      data-testid="img-qr-code"
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-sm">
                    <RefreshCw className={`w-4 h-4 ${isPolling ? 'animate-spin text-green-500' : 'text-muted-foreground'}`} />
                    <span className={isPolling ? 'text-green-500' : 'text-muted-foreground'}>
                      {isPolling ? 'Aguardando pagamento...' : 'Verificação pausada'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground px-1">
                      <span>PIX Copia e Cola</span>
                      <span className="text-yellow-400 font-mono font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTime(timer)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-secondary/50 border border-white/10 rounded-lg px-3 py-2.5 text-xs font-mono text-muted-foreground truncate select-all" data-testid="text-pix-code">
                        {pixData.qrCode.substring(0, 50)}...
                      </div>
                      <Button 
                        size="icon" 
                        variant="outline" 
                        className="shrink-0 border-white/10 hover:bg-primary hover:text-white h-10 w-10" 
                        onClick={handleCopyCode}
                        data-testid="button-copy-pix"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                    <p className="text-xs text-blue-400">
                      O pagamento via PIX é instantâneo. Seu saldo será atualizado automaticamente após a confirmação.
                    </p>
                  </div>

                  <Button 
                    variant="ghost" 
                    className="w-full text-xs text-muted-foreground hover:text-white"
                    onClick={resetDeposit}
                    data-testid="button-cancel-pix"
                  >
                    Cancelar e voltar
                  </Button>
                </div>
              )}

              {depositStep === 'success' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Depósito Confirmado!</h2>
                    <p className="text-muted-foreground max-w-[250px] mx-auto">
                      Seu depósito de <span className="text-white font-bold">R$ {pixData?.amount.toFixed(2)}</span> já está disponível na sua conta.
                    </p>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 mt-4"
                    onClick={resetDeposit}
                    data-testid="button-new-deposit"
                  >
                    FAZER NOVO DEPÓSITO
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-6 pt-4 border-t border-white/5">
                <ShieldIcon className="w-3 h-3" />
                Pagamento 100% seguro via PIX
              </div>
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4 mt-0 animate-in slide-in-from-right-4 duration-300">
              {withdrawStep === 'input' && (
                <>
                  <div className="bg-secondary/30 rounded-xl p-6 text-center border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                    <p className="text-muted-foreground text-sm mb-1 uppercase tracking-wider">Saldo Disponível</p>
                    <h2 className="text-4xl font-bold font-heading text-white" data-testid="text-withdraw-balance">
                      R$ {walletBalance ? walletBalance.balance.toFixed(2).replace('.', ',') : '0,00'}
                    </h2>
                    {walletBalance && walletBalance.balance >= 20 && walletBalance.rolloverRemaining <= 0 && (
                      <div className="text-xs text-emerald-400 flex items-center justify-center gap-1 mt-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Disponível para saque
                      </div>
                    )}
                    {walletBalance && walletBalance.balance < 20 && walletBalance.balance > 0 && (
                      <div className="text-xs text-yellow-400 flex items-center justify-center gap-1 mt-2">
                        Mínimo para saque: R$ 20,00
                      </div>
                    )}
                  </div>

                  {walletBalance && (walletBalance.bonusBalance > 0 || walletBalance.rolloverRemaining > 0) && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-purple-300 font-medium">Saldo de Bônus</span>
                        <span className="text-lg font-bold text-white">
                          R$ {walletBalance.bonusBalance.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                      {walletBalance.rolloverRemaining > 0 && (
                        <>
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-muted-foreground">Rollover Restante</span>
                            <span className="text-yellow-400">
                              R$ {walletBalance.rolloverRemaining.toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-secondary/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                              style={{ width: `${walletBalance.rolloverProgress}%` }}
                            />
                          </div>
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            {walletBalance.rolloverProgress}% concluído
                          </p>
                          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mt-3 flex gap-2 items-center">
                            <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
                            <p className="text-xs text-yellow-500/90">
                              Complete o rollover para liberar saques
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de Chave PIX</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['CPF', 'EMAIL', 'PHONE'] as PixKeyType[]).map((type) => (
                          <Button 
                            key={type}
                            variant="outline" 
                            size="sm" 
                            className={pixKeyType === type 
                              ? "bg-primary/20 border-primary text-primary hover:bg-primary/30" 
                              : "border-white/10 hover:bg-white/5"
                            }
                            onClick={() => setPixKeyType(type)}
                          >
                            {type === 'CPF' ? 'CPF' : type === 'EMAIL' ? 'E-mail' : 'Telefone'}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Chave PIX</Label>
                      <Input 
                        placeholder={
                          pixKeyType === 'CPF' ? "000.000.000-00" : 
                          pixKeyType === 'EMAIL' ? "email@exemplo.com" : 
                          "(00) 00000-0000"
                        }
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="bg-secondary/50 border-white/10 focus-visible:ring-primary h-12" 
                        data-testid="input-pix-key" 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Valor do Saque</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                        <Input 
                          type="number" 
                          placeholder="0,00" 
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          className="pl-10 bg-secondary/50 border-white/10 focus-visible:ring-primary h-12 font-bold" 
                          data-testid="input-withdraw-amount"
                          min="20"
                        />
                        <button 
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-bold hover:text-white transition-colors"
                          onClick={() => setWithdrawAmount(walletBalance?.balance.toString() || "")}
                        >
                          MÁXIMO
                        </button>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                      <p className="text-xs text-yellow-500/90 leading-relaxed">
                        A conta de destino deve ser da mesma titularidade (mesmo CPF) da conta cadastrada no site.
                      </p>
                    </div>

                    <Button 
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-[0_0_15px_-3px_rgba(242,102,49,0.4)] transition-all hover:scale-[1.02]"
                      onClick={handleWithdrawRequest}
                      disabled={!walletBalance || walletBalance.balance < 20 || walletBalance.rolloverRemaining > 0}
                      data-testid="button-request-withdraw"
                    >
                      {walletBalance && walletBalance.rolloverRemaining > 0 ? 'ROLLOVER PENDENTE' : 'SOLICITAR SAQUE'}
                    </Button>
                  </div>
                </>
              )}

              {withdrawStep === 'kyc' && (
                <div className="space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-500 text-sm">Verificação de Dados</p>
                      <p className="text-xs text-muted-foreground">Confirme seus dados para continuar</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      <Input 
                        placeholder="Seu nome completo"
                        value={kycName}
                        onChange={(e) => setKycName(e.target.value)}
                        className="bg-secondary/50 border-white/10 focus-visible:ring-primary h-12" 
                        data-testid="input-kyc-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>CPF</Label>
                      <Input 
                        placeholder="000.000.000-00"
                        value={kycCpf}
                        onChange={(e) => setKycCpf(formatCpf(e.target.value))}
                        className="bg-secondary/50 border-white/10 focus-visible:ring-primary h-12" 
                        data-testid="input-kyc-cpf"
                        maxLength={14}
                      />
                    </div>

                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12"
                      onClick={handleKycSubmit}
                      disabled={kycLoading}
                      data-testid="button-kyc-submit"
                    >
                      {kycLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "VERIFICAR DADOS"}
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="w-full text-xs text-muted-foreground hover:text-white"
                      onClick={() => setWithdrawStep('input')}
                    >
                      Voltar
                    </Button>
                  </div>
                </div>
              )}

              {withdrawStep === 'loading' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  <p className="text-muted-foreground animate-pulse">Processando saque...</p>
                </div>
              )}

              {withdrawStep === 'success' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in zoom-in-95 duration-500">
                  <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Saque Solicitado!</h2>
                    <p className="text-muted-foreground max-w-[250px] mx-auto">
                      Seu saque está em análise e será processado em breve.
                    </p>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 mt-4"
                    onClick={resetWithdraw}
                    data-testid="button-new-withdraw"
                  >
                    FAZER NOVO SAQUE
                  </Button>
                </div>
              )}

              {withdrawStep === 'error' && (
                <div className="flex flex-col items-center justify-center py-8 space-y-6">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-white">Erro ao solicitar saque</h2>
                    <p className="text-muted-foreground text-sm">{withdrawError}</p>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12"
                    onClick={resetWithdraw}
                  >
                    TENTAR NOVAMENTE
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-0 animate-in fade-in duration-300">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : allHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-sm">Nenhuma transação encontrada.</p>
                  <p className="text-xs mt-2">Faça seu primeiro depósito via PIX!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allHistory.map((tx) => (
                    <div 
                      key={tx.id || tx.externalId} 
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-white/5 hover:border-white/10 transition-colors group" 
                      data-testid={`transaction-${tx.id || tx.externalId}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          tx.type === 'deposit' 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'
                        } group-hover:opacity-80 transition-colors`}>
                          {tx.type === 'deposit' 
                            ? <ArrowDownLeft className="w-5 h-5" /> 
                            : <ArrowUpRight className="w-5 h-5" />
                          }
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">
                            {tx.type === 'deposit' ? 'Depósito PIX' : 'Saque PIX'}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.type === 'deposit' ? 'text-green-500' : 'text-white'}`}>
                          {tx.type === 'deposit' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          {tx.type === 'deposit' ? (
                            <>
                              {tx.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                              {tx.status === 'PENDING' && <Clock className="w-3.5 h-3.5 text-yellow-500" />}
                              <span className={`text-[11px] font-medium ${
                                tx.status === 'COMPLETED' ? 'text-green-500' : 'text-yellow-500'
                              }`}>
                                {tx.status === 'COMPLETED' ? 'Confirmado' : 'Pendente'}
                              </span>
                            </>
                          ) : (
                            <span className={`text-[11px] font-medium ${getWithdrawalStatusLabel(tx.status).color}`}>
                              {getWithdrawalStatusLabel(tx.status).label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
