import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wallet, QrCode, ArrowUpRight, ArrowDownLeft, Copy } from "lucide-react";
import { useState } from "react";

export function WalletModal({ children }: { children: React.ReactNode }) {
  const [amount, setAmount] = useState("50");

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-heading tracking-wide">
            <Wallet className="w-5 h-5 text-primary" />
            Carteira
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 rounded-xl mb-6">
            <TabsTrigger value="deposit" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">Depósito</TabsTrigger>
            <TabsTrigger value="withdraw" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg">Saque</TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4">
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

            <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold h-12 text-lg shadow-[0_0_20px_-5px_rgba(22,163,74,0.5)]">
              GERAR PIX QR CODE
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
              <ShieldIcon className="w-3 h-3" />
              Pagamento processado via Ondapay
            </div>
          </TabsContent>

          <TabsContent value="withdraw" className="space-y-4">
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

            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 mt-2">
              SOLICITAR SAQUE
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Saques processados em até 1 hora.
            </p>
          </TabsContent>
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
