import { Bell, Search, Wallet, ChevronDown, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { USER } from "@/lib/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { WalletModal } from "@/components/wallet/WalletModal";

export function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full max-w-sm hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Procurar jogos, desportos..." 
            className="pl-9 bg-secondary/50 border-transparent focus-visible:ring-primary/50 h-9 rounded-full text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white hover:bg-white/5 relative">
          <Bell className="w-5 h-5" />
          {USER.notifications > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
          )}
        </Button>

        <div className="h-6 w-px bg-white/10 mx-1" />

        <div className="flex items-center gap-2 bg-secondary/50 rounded-full pl-4 pr-1 py-1 border border-white/5 hover:border-primary/30 transition-colors cursor-pointer group">
          <div className="flex flex-col items-end leading-none mr-2">
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Saldo</span>
            <span className="text-sm font-bold text-primary tabular-nums group-hover:text-white transition-colors">
              {USER.currency} {USER.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <WalletModal>
            <Button size="sm" className="h-8 rounded-full px-4 bg-primary hover:bg-primary/90 text-white shadow-[0_0_15px_-3px_rgba(242,102,49,0.4)]">
              <Wallet className="w-4 h-4 mr-2" />
              Depósito
            </Button>
          </WalletModal>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0 overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all ml-2">
              <img src={USER.avatar} alt={USER.name} className="h-full w-full object-cover" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-card border-white/10 text-foreground">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="cursor-pointer focus:bg-white/5 focus:text-primary">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            
            <WalletModal>
              <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-white/5 focus:text-primary hover:bg-white/5 hover:text-primary w-full">
                <Wallet className="mr-2 h-4 w-4" />
                <span>Carteira</span>
              </div>
            </WalletModal>
            
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
