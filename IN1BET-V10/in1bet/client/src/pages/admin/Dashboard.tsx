import { useEffect, useState, useCallback } from "react";
import { getStoredAuth } from "@/lib/auth";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  TrendingDown,
  ArrowDownToLine,
  ArrowUpFromLine,
  Gift,
  Wallet,
  Clock,
  AlertCircle,
  RefreshCw,
  Trophy,
  Gamepad2,
  Radio,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  users: {
    total: number;
    today: number;
    week: number;
    month: number;
  };
  deposits: {
    today: number;
    week: number;
    month: number;
  };
  withdrawals: {
    today: number;
    week: number;
    month: number;
    pending: { count: number; total: number };
    approved: { count: number; total: number };
  };
  profit: {
    today: number;
    week: number;
    month: number;
  };
  bonuses: {
    totalGiven: number;
    totalConverted: number;
    activeCount: number;
  };
  platform: {
    totalRealBalance: number;
    totalBonusBalance: number;
    totalLockedBalance: number;
  };
  sports?: {
    pendingBets: number;
    pendingStake: number;
    liveMatches: number;
    todayBets: number;
    todayStake: number;
    todayPotentialPayout: number;
  };
  casino?: {
    todayGames: number;
    todayVolume: number;
  };
  chartData: { date: string; deposits: number; withdrawals: number }[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getStoredAuth();

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/dashboard-stats", {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading || !stats) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      </AdminLayout>
    );
  }

  const statCards = [
    {
      title: "Total Usuários",
      value: stats.users.total.toString(),
      subtitle: `+${stats.users.today} hoje`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Depósitos (30 dias)",
      value: formatCurrency(stats.deposits.month),
      subtitle: `Hoje: ${formatCurrency(stats.deposits.today)}`,
      icon: ArrowDownToLine,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Saques (30 dias)",
      value: formatCurrency(stats.withdrawals.month),
      subtitle: `Hoje: ${formatCurrency(stats.withdrawals.today)}`,
      icon: ArrowUpFromLine,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
    {
      title: "Lucro Bruto (30 dias)",
      value: formatCurrency(stats.profit.month),
      subtitle: `Hoje: ${formatCurrency(stats.profit.today)}`,
      icon: stats.profit.month >= 0 ? TrendingUp : TrendingDown,
      color: stats.profit.month >= 0 ? "text-emerald-500" : "text-red-500",
      bg: stats.profit.month >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
  ];

  const alertCards = [
    {
      title: "Saques Pendentes",
      value: stats.withdrawals.pending.count.toString(),
      subtitle: formatCurrency(stats.withdrawals.pending.total),
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      urgent: stats.withdrawals.pending.count > 0,
    },
    {
      title: "Saques Aprovados",
      value: stats.withdrawals.approved.count.toString(),
      subtitle: formatCurrency(stats.withdrawals.approved.total),
      icon: AlertCircle,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      urgent: stats.withdrawals.approved.count > 0,
    },
    {
      title: "Bônus Ativos",
      value: stats.bonuses.activeCount.toString(),
      subtitle: `Dado: ${formatCurrency(stats.bonuses.totalGiven)}`,
      icon: Gift,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      urgent: false,
    },
    {
      title: "Saldo Total Plataforma",
      value: formatCurrency(stats.platform.totalRealBalance),
      subtitle: `Bônus: ${formatCurrency(stats.platform.totalBonusBalance)}`,
      icon: Wallet,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      urgent: false,
    },
  ];

  const sportsCards = stats.sports ? [
    {
      title: "Apostas Pendentes",
      value: stats.sports.pendingBets.toString(),
      subtitle: `Stake: ${formatCurrency(stats.sports.pendingStake)}`,
      icon: Ticket,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
    },
    {
      title: "Partidas Ao Vivo",
      value: stats.sports.liveMatches.toString(),
      subtitle: "Em andamento",
      icon: Radio,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Apostas (Hoje)",
      value: stats.sports.todayBets.toString(),
      subtitle: `Volume: ${formatCurrency(stats.sports.todayStake)}`,
      icon: Trophy,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
    },
    {
      title: "Payout Potencial",
      value: formatCurrency(stats.sports.todayPotentialPayout),
      subtitle: "Apostas pendentes",
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ] : [];

  const casinoCards = stats.casino ? [
    {
      title: "Jogos (Hoje)",
      value: stats.casino.todayGames.toString(),
      subtitle: `Volume: ${formatCurrency(stats.casino.todayVolume)}`,
      icon: Gamepad2,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
    },
  ] : [];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">
              Visão geral da plataforma
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, i) => (
            <Card key={i} className="bg-[#111111] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {alertCards.map((alert, i) => (
            <Card
              key={i}
              className={`bg-[#111111] border-gray-800 ${
                alert.urgent ? "ring-1 ring-yellow-500/50" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{alert.title}</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {alert.value}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{alert.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${alert.bg}`}>
                    <alert.icon className={`h-6 w-6 ${alert.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(sportsCards.length > 0 || casinoCards.length > 0) && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Apostas & Jogos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[...sportsCards, ...casinoCards].map((card, i) => (
                <Card key={i} className="bg-[#111111] border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">{card.title}</p>
                        <p className="text-2xl font-bold text-white mt-1">
                          {card.value}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${card.bg}`}>
                        <card.icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#111111] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                Entradas vs Saídas (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="date"
                      stroke="#666"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      stroke="#666"
                      tickFormatter={(v) => `R$ ${v / 1000}k`}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Legend />
                    <Bar
                      dataKey="deposits"
                      name="Depósitos"
                      fill="#10b981"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="withdrawals"
                      name="Saques"
                      fill="#FF7A1A"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                Fluxo de Caixa Acumulado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={stats.chartData.map((item, i, arr) => {
                      const cumulative = arr
                        .slice(0, i + 1)
                        .reduce((sum, d) => sum + (d.deposits - d.withdrawals), 0);
                      return { ...item, cumulative };
                    })}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="date"
                      stroke="#666"
                      tickFormatter={formatDate}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      stroke="#666"
                      tickFormatter={(v) => `R$ ${v / 1000}k`}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1a1a",
                        border: "1px solid #333",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => formatDate(label)}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      name="Lucro Acumulado"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-[#111111] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Resumo 7 Dias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Depósitos</span>
                <span className="text-emerald-500 font-medium">
                  {formatCurrency(stats.deposits.week)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Saques</span>
                <span className="text-orange-500 font-medium">
                  {formatCurrency(stats.withdrawals.week)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-800 pt-3">
                <span className="text-white font-medium">Lucro</span>
                <span
                  className={`font-bold ${
                    stats.profit.week >= 0 ? "text-emerald-500" : "text-red-500"
                  }`}
                >
                  {formatCurrency(stats.profit.week)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Novos Cadastros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Hoje</span>
                <span className="text-blue-500 font-medium">
                  {stats.users.today}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">7 dias</span>
                <span className="text-blue-500 font-medium">
                  {stats.users.week}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">30 dias</span>
                <span className="text-blue-500 font-medium">
                  {stats.users.month}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111111] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white text-base">Bônus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Concedido</span>
                <span className="text-purple-500 font-medium">
                  {formatCurrency(stats.bonuses.totalGiven)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Convertido</span>
                <span className="text-emerald-500 font-medium">
                  {formatCurrency(stats.bonuses.totalConverted)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-800 pt-3">
                <span className="text-white font-medium">Em Rollover</span>
                <span className="text-yellow-500 font-bold">
                  {stats.bonuses.activeCount}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
