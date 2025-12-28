import { useState, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Wallet, ArrowUpRight, ArrowDownLeft, History, CreditCard, Loader2, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWallet, getStoredAuth } from "@/lib/auth";
import { WalletModal } from "@/components/wallet/WalletModal";

interface WalletData {
  balance: number;
  lockedBalance: number;
  currency: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    const auth = getStoredAuth();
    
    if (auth.isAuthenticated) {
      const walletData = await getWallet();
      if (walletData) {
        setWallet(walletData);
      } else {
        setWallet({ balance: 0, lockedBalance: 0, currency: "BRL" });
      }
    } else {
      setWallet({ balance: 0, lockedBalance: 0, currency: "BRL" });
    }
    setLoading(false);
  }, []);

  const fetchTransactions = useCallback(async () => {
    const auth = getStoredAuth();
    if (!auth.accessToken) return;

    setLoadingTransactions(true);
    try {
      const response = await fetch("/api/wallet/transactions", {
        headers: { "Authorization": `Bearer ${auth.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error("Error fetching transactions:", e);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, [fetchWallet, fetchTransactions]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Hoje, ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    return date.toLocaleDateString('pt-BR');
  };

  const handleBalanceUpdate = () => {
    fetchWallet();
    fetchTransactions();
  };

  const balance = wallet?.balance || 0;
  const lockedBalance = wallet?.lockedBalance || 0;
  const totalBalance = balance + lockedBalance;
  const currency = "R$";

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Wallet className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-white">Minha Carteira</h1>
              <p className="text-gray-400">Gerencie seu saldo, depósitos e saques.</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleBalanceUpdate}
            className="text-muted-foreground hover:text-white"
            data-testid="button-refresh-wallet"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Saldo Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white" data-testid="text-total-balance">
                    {currency} {formatCurrency(totalBalance)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Saldo Disponível</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white" data-testid="text-available-balance">
                    {currency} {formatCurrency(balance)}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Saldo Bloqueado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white" data-testid="text-locked-balance">
                    {currency} {formatCurrency(lockedBalance)}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg">Ações Rápidas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <WalletModal onBalanceUpdate={handleBalanceUpdate}>
                    <Button className="h-24 flex flex-col gap-2 bg-green-600 hover:bg-green-500 text-white font-bold text-lg rounded-xl w-full" data-testid="button-deposit">
                      <ArrowDownLeft className="w-8 h-8" />
                      Depositar
                    </Button>
                  </WalletModal>
                  <WalletModal onBalanceUpdate={handleBalanceUpdate}>
                    <Button variant="outline" className="h-24 flex flex-col gap-2 border-white/10 hover:bg-white/5 text-white font-bold text-lg rounded-xl w-full" data-testid="button-withdraw">
                      <ArrowUpRight className="w-8 h-8" />
                      Sacar
                    </Button>
                  </WalletModal>
                </div>
              </div>
              
              <div className="bg-card border border-white/5 rounded-xl p-6">
                <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Método Principal
                </h3>
                <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <span className="text-green-500 font-bold text-xs">PIX</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">PIX</p>
                      <p className="text-xs text-gray-500">Instantâneo</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">ATIVO</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-400" />
                  Histórico Recente
                </h3>
              </div>
              
              {loadingTransactions ? (
                <Card className="bg-card border-white/5">
                  <CardContent className="p-6 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : transactions.length === 0 ? (
                <Card className="bg-card border-white/5">
                  <CardContent className="p-6 text-center text-gray-500">
                    <p>Nenhuma transação encontrada.</p>
                    <p className="text-sm mt-2">Faça seu primeiro depósito via PIX!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((tx) => (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-4 rounded-xl bg-card border border-white/5 hover:border-white/10 transition-colors"
                      data-testid={`transaction-${tx.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${
                          tx.type === 'DEPOSIT' || tx.type === 'WIN' || tx.type === 'BONUS' 
                            ? 'bg-green-500/10 text-green-500' 
                            : 'bg-red-500/10 text-red-500'
                        }`}>
                          {tx.type === 'DEPOSIT' || tx.type === 'WIN' || tx.type === 'BONUS' 
                            ? <ArrowDownLeft className="w-5 h-5" /> 
                            : <ArrowUpRight className="w-5 h-5" />
                          }
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">
                            {tx.type === 'DEPOSIT' ? 'Depósito PIX' : 
                             tx.type === 'WITHDRAW' ? 'Saque PIX' :
                             tx.type === 'BET' ? 'Aposta' :
                             tx.type === 'WIN' ? 'Ganho' :
                             tx.type === 'BONUS' ? 'Bônus' : tx.type}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          tx.type === 'DEPOSIT' || tx.type === 'WIN' || tx.type === 'BONUS' 
                            ? 'text-green-500' 
                            : 'text-white'
                        }`}>
                          {tx.type === 'DEPOSIT' || tx.type === 'WIN' || tx.type === 'BONUS' ? '+' : '-'} R$ {formatCurrency(tx.amount)}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          {tx.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                          {tx.status === 'PENDING' && <Clock className="w-3.5 h-3.5 text-yellow-500" />}
                          <span className={`text-[11px] font-medium ${
                            tx.status === 'COMPLETED' ? 'text-green-500' : 'text-yellow-500'
                          }`}>
                            {tx.status === 'COMPLETED' ? 'Confirmado' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
