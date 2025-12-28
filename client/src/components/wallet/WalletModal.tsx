import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wallet, QrCode, ArrowUpRight, ArrowDownLeft, Copy, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

const TRANSACTIONS = [
    { id: 1, type: "Depósito", amount: 50.00, date: "Hoje, 10:30", status: "Concluído" },
    { id: 2, type: "Saque", amount: 200.00, date: "Ontem, 15:45", status: "Pendente" },
    { id: 3, type: "Depósito", amount: 100.00, date: "26/12/2025", status: "Concluído" },
    { id: 4, type: "Saque", amount: 500.00, date: "20/12/2025", status: "Recusado" },
];

export function WalletModal({ children }: { children: React.ReactNode }) {
  const [amount, setAmount] = useState("50");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-white max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
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

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <TabsContent value="deposit" className="space-y-4 mt-0 animate-in slide-in-from-left-4 duration-300">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                <QrCode className="w-8 h-8 text-green-500" />
                <div>
                    <p className="font-bold text-green-500 text-sm">PIX Instantâneo</p>
                    <p className="text-xs text-muted-foreground">Processamento em segundos</p>
                </div>
                </div>

                <div className="space-y-2">
                <Label>Valor do Depósito (R$)</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                    <Input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 bg-secondary/50 border-white/10 focus-visible:ring-primary font-bold text-lg" 
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

                <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 text-lg shadow-[0_0_20px_-5px_rgba(22,163,74,0.5)] transition-all hover:scale-[1.02]">
                GERAR PIX QR CODE
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                <ShieldIcon className="w-3 h-3" />
                Pagamento processado via Ondapay
                </div>
            </TabsContent>

            <TabsContent value="withdraw" className="space-y-4 mt-0 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-secondary/30 rounded-xl p-4 text-center border border-white/5">
                <p className="text-muted-foreground text-sm mb-1">Saldo Disponível</p>
                <h2 className="text-3xl font-bold font-heading text-white">R$ 2.450,50</h2>
                </div>

                <div className="space-y-2">
                <Label>Chave PIX (CPF/Email/Tel)</Label>
                <Input placeholder="Digite sua chave PIX" className="bg-secondary/50 border-white/10 focus-visible:ring-primary" />
                </div>

                <div className="space-y-2">
                <Label>Valor do Saque</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">R$</span>
                    <Input type="number" placeholder="0,00" className="pl-10 bg-secondary/50 border-white/10 focus-visible:ring-primary" />
                </div>
                </div>

                <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 mt-2 shadow-[0_0_15px_-3px_rgba(242,102,49,0.4)] transition-all hover:scale-[1.02]">
                SOLICITAR SAQUE
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                Saques processados em até 1 hora.
                </p>
            </TabsContent>
            
            <TabsContent value="history" className="mt-0 animate-in fade-in duration-300">
                <div className="space-y-3">
                    {TRANSACTIONS.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-white/5">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${tx.type === 'Depósito' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                    {tx.type === 'Depósito' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-white">{tx.type}</p>
                                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold text-sm ${tx.type === 'Depósito' ? 'text-green-500' : 'text-white'}`}>
                                    {tx.type === 'Depósito' ? '+' : '-'} R$ {tx.amount.toFixed(2)}
                                </p>
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                    {tx.status === 'Concluído' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                    {tx.status === 'Pendente' && <Clock className="w-3 h-3 text-yellow-500" />}
                                    {tx.status === 'Recusado' && <XCircle className="w-3 h-3 text-red-500" />}
                                    <span className={`text-[10px] ${
                                        tx.status === 'Concluído' ? 'text-green-500' :
                                        tx.status === 'Pendente' ? 'text-yellow-500' :
                                        'text-red-500'
                                    }`}>{tx.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
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
