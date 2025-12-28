import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wallet, ArrowUpRight, ArrowDownLeft, Copy, Clock, CheckCircle2, XCircle, Loader2, Check, AlertCircle, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import pixQrCode from "@assets/generated_images/qr_code_for_pix_payment.png";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const TRANSACTIONS = [
    { id: 1, type: "Depósito", amount: 50.00, date: "Hoje, 10:30", status: "Concluído" },
    { id: 2, type: "Saque", amount: 200.00, date: "Ontem, 15:45", status: "Pendente" },
    { id: 3, type: "Depósito", amount: 100.00, date: "26/12/2025", status: "Concluído" },
    { id: 4, type: "Saque", amount: 500.00, date: "20/12/2025", status: "Recusado" },
];

const PIX_COPY_CODE = "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913IN1BET LTDA6008SAO PAULO62070503***6304E2CA";

export function WalletModal({ children }: { children: React.ReactNode }) {
  const [amount, setAmount] = useState("50");
  const [depositStep, setDepositStep] = useState<'input' | 'loading' | 'payment' | 'success'>('input');
  const [timer, setTimer] = useState(600); // 10 minutes in seconds
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens/closes (controlled by parent usually, but here we just reset on mount if needed or useEffect)
  useEffect(() => {
    if (depositStep === 'payment') {
        const interval = setInterval(() => {
            setTimer((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [depositStep]);

  const handleGeneratePix = () => {
    if (!amount || parseFloat(amount) < 1) {
        toast.error("O valor mínimo de depósito é R$ 1,00");
        return;
    }
    setDepositStep('loading');
    setTimeout(() => {
        setDepositStep('payment');
        setTimer(600);
    }, 1500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(PIX_COPY_CODE);
    setCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const simulatePaymentSuccess = () => {
    setDepositStep('loading');
    setTimeout(() => {
        setDepositStep('success');
        toast.success(`Depósito de R$ ${amount} confirmado!`);
    }, 2000);
  };

  const resetDeposit = () => {
    setDepositStep('input');
    setAmount("50");
  };

  return (
    <Dialog onOpenChange={(open) => !open && setTimeout(() => resetDeposit(), 300)}>
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
            </DialogHeader>
        </div>

        <Tabs defaultValue="deposit" className="w-full flex-1 flex flex-col min-h-0">
          <div className="px-6 pb-4">
              <TabsList className="grid w-full grid-cols-3 bg-secondary/50 p-1 rounded-xl">
                <TabsTrigger value="deposit" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs font-bold">Depósito</TabsTrigger>
                <TabsTrigger value="withdraw" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs font-bold">Saque</TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-xs font-bold">Histórico</TabsTrigger>
              </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
            <TabsContent value="deposit" className="space-y-4 mt-0 animate-in slide-in-from-left-4 duration-300">
                {depositStep === 'input' && (
                    <>
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500 w-5 h-5"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
                            </div>
                            <div>
                                <p className="font-bold text-green-500 text-sm">PIX Instantâneo</p>
                                <p className="text-xs text-muted-foreground">Aprovado em segundos, 24/7</p>
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
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                        {["20", "50", "100", "200", "500", "1000"].map((val) => (
                            <Button 
                            key={val} 
                            variant="outline" 
                            className={`border-white/10 hover:bg-primary hover:text-white hover:border-primary transition-all ${amount === val ? 'bg-primary/20 border-primary text-primary' : ''}`}
                            onClick={() => setAmount(val)}
                            >
                            R$ {val}
                            </Button>
                        ))}
                        </div>

                        <div className="pt-2">
                            <Button 
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 text-lg shadow-[0_0_20px_-5px_rgba(22,163,74,0.5)] transition-all hover:scale-[1.02]"
                                onClick={handleGeneratePix}
                            >
                                GERAR PIX QR CODE
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

                {depositStep === 'payment' && (
                    <div className="space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="text-center space-y-1">
                            <p className="text-sm text-muted-foreground">Total a pagar</p>
                            <h2 className="text-3xl font-bold text-white">R$ {parseFloat(amount).toFixed(2)}</h2>
                        </div>

                        <div className="bg-white p-4 rounded-xl mx-auto w-fit shadow-lg shadow-white/5 relative group">
                            <img src={pixQrCode} alt="QR Code PIX" className="w-48 h-48 mix-blend-multiply" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-sm">
                                <span className="text-white text-xs font-bold">Use o app do seu banco</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-muted-foreground px-1">
                                <span>Pix Copia e Cola</span>
                                <span className="text-red-400 font-mono font-bold flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> {formatTime(timer)}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-secondary/50 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-muted-foreground truncate select-all">
                                    {PIX_COPY_CODE}
                                </div>
                                <Button size="icon" variant="outline" className="shrink-0 border-white/10 hover:bg-primary hover:text-white" onClick={handleCopyCode}>
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        <div className="pt-2 space-y-3">
                            <Button 
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 shadow-[0_0_20px_-5px_rgba(22,163,74,0.5)]"
                                onClick={simulatePaymentSuccess}
                            >
                                JÁ FIZ O PAGAMENTO
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="w-full text-xs text-muted-foreground hover:text-white"
                                onClick={() => setDepositStep('input')}
                            >
                                Cancelar transação
                            </Button>
                        </div>
                    </div>
                )}

                {depositStep === 'success' && (
                    <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                            <CheckCircle2 className="w-12 h-12 text-green-500" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-white">Pagamento Confirmado!</h2>
                            <p className="text-muted-foreground max-w-[250px] mx-auto">Seu depósito de <span className="text-white font-bold">R$ {parseFloat(amount).toFixed(2)}</span> já está disponível na sua conta.</p>
                        </div>
                        <Button 
                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 mt-4"
                            onClick={resetDeposit}
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
                <div className="bg-secondary/30 rounded-xl p-6 text-center border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                    <p className="text-muted-foreground text-sm mb-1 uppercase tracking-wider">Saldo Disponível</p>
                    <h2 className="text-4xl font-bold font-heading text-white">R$ 2.450,50</h2>
                    <div className="text-xs text-emerald-400 flex items-center justify-center gap-1 mt-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         Disponível para saque
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tipo de Chave PIX</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" size="sm" className="bg-primary/20 border-primary text-primary hover:bg-primary/30">CPF</Button>
                            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">E-mail</Button>
                            <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">Telefone</Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Chave PIX</Label>
                        <Input placeholder="000.000.000-00" className="bg-secondary/50 border-white/10 focus-visible:ring-primary h-12" />
                    </div>

                    <div className="space-y-2">
                        <Label>Valor do Saque</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                            <Input type="number" placeholder="0,00" className="pl-10 bg-secondary/50 border-white/10 focus-visible:ring-primary h-12 font-bold" />
                            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-bold hover:text-white transition-colors">
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

                    <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 shadow-[0_0_15px_-3px_rgba(242,102,49,0.4)] transition-all hover:scale-[1.02]">
                        SOLICITAR SAQUE
                    </Button>
                </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-0 animate-in fade-in duration-300">
                <div className="space-y-3">
                    {TRANSACTIONS.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-white/5 hover:border-white/10 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${tx.type === 'Depósito' ? 'bg-green-500/10 text-green-500 group-hover:bg-green-500/20' : 'bg-red-500/10 text-red-500 group-hover:bg-red-500/20'} transition-colors`}>
                                    {tx.type === 'Depósito' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">{tx.type} PIX</p>
                                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold ${tx.type === 'Depósito' ? 'text-green-500' : 'text-white'}`}>
                                    {tx.type === 'Depósito' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                                </p>
                                <div className="flex items-center justify-end gap-1.5 mt-1">
                                    {tx.status === 'Concluído' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                    {tx.status === 'Pendente' && <Clock className="w-3.5 h-3.5 text-yellow-500" />}
                                    {tx.status === 'Recusado' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                    <span className={`text-[11px] font-medium ${
                                        tx.status === 'Concluído' ? 'text-green-500' :
                                        tx.status === 'Pendente' ? 'text-yellow-500' :
                                        'text-red-500'
                                    }`}>{tx.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    <Button variant="ghost" className="w-full text-xs text-muted-foreground hover:text-white py-4">
                        Carregar mais transações <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                </div>
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
