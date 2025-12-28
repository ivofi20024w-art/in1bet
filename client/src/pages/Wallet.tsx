import { MainLayout } from "@/components/layout/MainLayout";
import { Wallet, ArrowUpRight, ArrowDownLeft, History, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { USER } from "@/lib/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WalletPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
                <Wallet className="w-8 h-8 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-heading font-bold text-white">Minha Carteira</h1>
                <p className="text-gray-400">Gerencie seu saldo, depósitos e saques.</p>
            </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Saldo Total</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white">{USER.currency} {(USER.balance + (USER.locked_balance || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </CardContent>
            </Card>
            <Card className="bg-card border-white/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Saldo Disponível</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white">{USER.currency} {USER.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </CardContent>
            </Card>
            <Card className="bg-card border-white/5">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Saldo Bloqueado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-white">{USER.currency} {(USER.locked_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                </CardContent>
            </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="font-bold text-white text-lg">Ações Rápidas</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Button className="h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-xl">
                        <ArrowDownLeft className="w-8 h-8" />
                        Depositar
                    </Button>
                    <Button variant="outline" className="h-24 flex flex-col gap-2 border-white/10 hover:bg-white/5 text-white font-bold text-lg rounded-xl">
                        <ArrowUpRight className="w-8 h-8" />
                        Sacar
                    </Button>
                </div>
            </div>
            
            <div className="bg-card border border-white/5 rounded-xl p-6">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Método Principal
                </h3>
                <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo%E2%80%94pix_powered_by_Banco_Central_%28Brazil%2C_2020%29.svg" className="h-6 w-6 opacity-80" />
                        <div>
                            <p className="font-bold text-white text-sm">PIX</p>
                            <p className="text-xs text-gray-500">Instantâneo</p>
                        </div>
                    </div>
                    <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">ATIVO</span>
                </div>
            </div>
        </div>

        {/* Transaction History Mock */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-gray-400" />
                    Histórico Recente
                </h3>
                <Button variant="link" className="text-primary text-sm">Ver tudo</Button>
            </div>
            
            <Card className="bg-card border-white/5">
                <CardContent className="p-0">
                    {[1,2,3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${i === 2 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                    {i === 2 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{i === 2 ? 'Saque PIX' : 'Depósito PIX'}</p>
                                    <p className="text-xs text-gray-500">Hoje, 14:30</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-bold text-sm ${i === 2 ? 'text-white' : 'text-green-500'}`}>
                                    {i === 2 ? '-' : '+'} R$ {i * 50},00
                                </p>
                                <span className="text-[10px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded">Concluído</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>
    </MainLayout>
  );
}
