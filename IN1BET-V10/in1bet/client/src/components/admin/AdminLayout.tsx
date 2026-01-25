import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { getStoredAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Shield,
  Wallet,
  TrendingUp,
  Gamepad2,
  Headphones,
  MessageCircle,
  Ticket,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuários", icon: Users },
  { href: "/admin/games", label: "Jogos", icon: Gamepad2 },
  { href: "/admin/deposits", label: "Depósitos PIX", icon: ArrowDownToLine },
  { href: "/admin/withdrawals", label: "Saques PIX", icon: ArrowUpFromLine },
  { href: "/admin/transactions", label: "Transações", icon: FileText },
  { href: "/admin/bonuses", label: "Bônus", icon: Gift },
  { href: "/admin/promo-codes", label: "Códigos Promo", icon: Ticket },
  { href: "/admin/missions", label: "Missões", icon: Target },
  { href: "/admin/affiliates", label: "Afiliados", icon: TrendingUp },
  { href: "/admin/support", label: "Suporte", icon: Headphones },
  { href: "/admin/chat", label: "Chat", icon: MessageCircle },
  { href: "/admin/security", label: "Segurança", icon: Shield },
  { href: "/admin/settings", label: "Configurações", icon: Settings },
  { href: "/admin/audit", label: "Auditoria", icon: FileText },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const auth = getStoredAuth();

  useEffect(() => {
    const checkAdmin = async () => {
      if (!auth.accessToken || !auth.user) {
        setLoading(false);
        setLocation("/");
        return;
      }

      try {
        const response = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${auth.accessToken}` },
        });

        if (response.status === 403 || !response.ok) {
          setLoading(false);
          setLocation("/");
          toast.error("Acesso negado");
          return;
        }

        setIsAdmin(true);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        setLocation("/");
        toast.error("Erro ao verificar permissões");
        return;
      }
    };

    checkAdmin();
  }, [auth.accessToken, auth.user, setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("auth");
    setLocation("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-gray-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-emerald-500" />
              <span className="font-bold text-white text-lg">IN1Bet Admin</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location === item.href || 
                (item.href !== "/admin" && location.startsWith(item.href));
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-500"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-800 space-y-2">
            <Link href="/">
              <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors">
                <ChevronLeft className="h-5 w-5" />
                Voltar ao Site
              </a>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 bg-[#111111] border-b border-gray-800 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-white">{title}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">
              {auth.user?.name}
            </span>
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <span className="text-emerald-500 text-sm font-medium">
                {auth.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
