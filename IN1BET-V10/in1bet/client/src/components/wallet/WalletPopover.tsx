import { useState, useEffect, ReactNode } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Wallet, ArrowDownLeft, Lock, Gift, TrendingUp } from "lucide-react";
import { getWallet } from "@/lib/auth";
import { WalletModal } from "./WalletModal";
import { Link } from "wouter";

interface WalletData {
  balance: number;
  lockedBalance: number;
  bonusBalance: number;
  rolloverRemaining: number;
  rolloverTotal: number;
  rolloverProgress: number;
  currency: string;
}

interface WalletPopoverProps {
  children: ReactNode;
  currentBalance: number;
  isGamePage?: boolean;
}

export function WalletPopover({ children, currentBalance, isGamePage }: WalletPopoverProps) {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      const data = await getWallet();
      if (data) {
        setWalletData(data);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchWalletData();
    }
  }, [isOpen]);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const totalBalance = (walletData?.balance || 0) + (walletData?.bonusBalance || 0);
  const hasBonus = (walletData?.bonusBalance || 0) > 0;
  const hasRollover = (walletData?.rolloverTotal || 0) > 0 && (walletData?.rolloverProgress || 0) < 100;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        sideOffset={8}
        className="w-80 p-0 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary/20 to-orange-600/10 px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/20 rounded-lg">
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-white">Resumo da Carteira</span>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-500/10 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <span className="text-sm text-muted-foreground">Saldo Disponível</span>
            </div>
            <span className="text-lg font-bold text-green-500">
              R$ {formatCurrency(walletData?.balance || currentBalance)}
            </span>
          </div>

          {hasBonus && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-orange-500/10 rounded-lg">
                  <Gift className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm text-muted-foreground">Saldo Bônus</span>
              </div>
              <span className="text-lg font-bold text-orange-500">
                R$ {formatCurrency(walletData?.bonusBalance || 0)}
              </span>
            </div>
          )}

          {(walletData?.lockedBalance || 0) > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-yellow-500/10 rounded-lg">
                  <Lock className="w-4 h-4 text-yellow-500" />
                </div>
                <span className="text-sm text-muted-foreground">Saldo Bloqueado</span>
              </div>
              <span className="text-lg font-bold text-yellow-500">
                R$ {formatCurrency(walletData?.lockedBalance || 0)}
              </span>
            </div>
          )}

          {hasRollover && (
            <div className="bg-white/5 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progresso do Rollover</span>
                <span className="text-primary font-semibold">{walletData?.rolloverProgress?.toFixed(0) || 0}%</span>
              </div>
              <Progress value={walletData?.rolloverProgress || 0} className="h-2" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Faltam: R$ {formatCurrency(walletData?.rolloverRemaining || 0)}</span>
                <span>Total: R$ {formatCurrency(walletData?.rolloverTotal || 0)}</span>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white font-medium">Saldo Total</span>
              <span className="text-xl font-bold text-white">
                R$ {formatCurrency(totalBalance)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <WalletModal>
                <Button 
                  className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <ArrowDownLeft className="w-4 h-4 mr-2" />
                  Depositar
                </Button>
              </WalletModal>
              
              <Link href="/wallet" onClick={() => setIsOpen(false)}>
                <Button 
                  variant="outline" 
                  className="w-full h-10 border-white/10 hover:bg-white/5 text-white font-semibold rounded-xl"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Carteira
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
