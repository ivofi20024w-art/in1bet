import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionExpiredListener } from "@/components/SessionExpiredListener";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Casino from "@/pages/Casino";
// SPORTS DISABLED - Uncomment to re-enable
// import Sports from "@/pages/Sports";
import LiveBetting from "@/pages/LiveBetting";
import LiveCasino from "@/pages/LiveCasino";
import Promotions from "@/pages/Promotions";
import VIP from "@/pages/VIP";
import History from "@/pages/History";
import Support from "@/pages/Support";
import CreateTicket from "@/pages/support/CreateTicket";
import TicketHistory from "@/pages/support/TicketHistory";
import TicketDetail from "@/pages/support/TicketDetail";
import ResponsibleGaming from "@/pages/ResponsibleGaming";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import AML from "@/pages/AML";
import Cookies from "@/pages/Cookies";
import Profile from "@/pages/profile/Profile";
import Settings from "@/pages/profile/Settings";
import Security from "@/pages/profile/Security";
import Verification from "@/pages/profile/Verification";
import Affiliates from "@/pages/profile/Affiliates";
import Levels from "@/pages/profile/Levels";
import Rakeback from "@/pages/profile/Rakeback";
import Missions from "@/pages/profile/Missions";
import NotificationsPage from "@/pages/profile/Notifications";
import ResponsibleGamingSettings from "@/pages/profile/ResponsibleGaming";
import Originals from "@/pages/Originals";
import WalletPage from "@/pages/Wallet";
import Game from "@/pages/Game";
import PlayGame from "@/pages/PlayGame";
import ResetPassword from "@/pages/auth/ResetPassword";
import Referral from "@/pages/Referral";
import Recent from "@/pages/Recent";
import Double from "@/pages/games/Double";
import Mines from "@/pages/games/Mines";
import Plinko from "@/pages/games/Plinko";
import AviatorMania from "@/pages/games/AviatorMania";
// SPORTS DISABLED - Uncomment to re-enable
// import MatchDetail from "@/pages/sports/MatchDetail";
// import MyBets from "@/pages/sports/MyBets";
// import SportsResults from "@/pages/sports/Results";
// import Prematch from "@/pages/sports/Prematch";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminDeposits from "@/pages/admin/Deposits";
import AdminWithdrawals from "@/pages/admin/Withdrawals";
import AdminTransactions from "@/pages/admin/Transactions";
import AdminBonuses from "@/pages/admin/Bonuses";
import AdminPromoCodes from "@/pages/admin/PromoCodes";
import AdminSecurity from "@/pages/admin/Security";
import AdminSettings from "@/pages/admin/Settings";
import AdminAffiliates from "@/pages/admin/Affiliates";
import AdminAudit from "@/pages/admin/Audit";
import AdminGames from "@/pages/admin/Games";
import AdminSupport from "@/pages/admin/Support";
import AdminSupportChats from "@/pages/admin/SupportChats";
import AdminSupportTickets from "@/pages/admin/SupportTickets";
import AdminSupportDepartments from "@/pages/admin/SupportDepartments";
import AdminChat from "@/pages/admin/Chat";
import AdminMissions from "@/pages/admin/Missions";
import AuthModal from "@/components/auth/AuthModal";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/stores/authModalStore";
import { SessionProvider } from "@/contexts/SessionContext";
import SessionTimeoutModal from "@/components/session/SessionTimeoutModal";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [, setLocation] = useLocation();
    const { isAuthenticated, isLoading } = useAuth();
    const { openLogin } = useAuthModal();
    const [hasRedirected, setHasRedirected] = useState(false);

    useEffect(() => {
        if (!isLoading && !isAuthenticated && !hasRedirected) {
            setHasRedirected(true);
            openLogin();
            setLocation("/");
        }
    }, [isAuthenticated, isLoading, setLocation, openLogin, hasRedirected]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
    const [, setLocation] = useLocation();
    const { isAuthenticated, isLoading, user } = useAuth();
    const { openLogin } = useAuthModal();
    const [hasRedirected, setHasRedirected] = useState(false);

    useEffect(() => {
        if (!isLoading && !hasRedirected) {
            if (!isAuthenticated) {
                setHasRedirected(true);
                openLogin();
                setLocation("/");
            } else if (!user?.isAdmin) {
                setHasRedirected(true);
                setLocation("/");
            }
        }
    }, [isAuthenticated, isLoading, user, setLocation, openLogin, hasRedirected]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !user?.isAdmin) {
        return null;
    }

    return <>{children}</>;
}

function Router() {
  return (
    <>
      <Switch>
        {/* Public Routes */}
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/ref/:code" component={Referral} />

        {/* Protected Routes (Mock Guard) */}
        <Route path="/" component={Home} />
        <Route path="/casino" component={Casino} />
        {/* SPORTS DISABLED - Uncomment to re-enable
        <Route path="/sports" component={Sports} />
        <Route path="/sports/match/:id" component={MatchDetail} />
        <Route path="/sports/my-bets">{() => <ProtectedRoute><MyBets /></ProtectedRoute>}</Route>
        <Route path="/sports/results" component={SportsResults} />
        <Route path="/sports/prematch" component={Prematch} />
        */}
        <Route path="/live-betting" component={LiveBetting} />
        <Route path="/live-casino" component={LiveCasino} />
        <Route path="/promotions" component={Promotions} />
        <Route path="/vip">{() => <ProtectedRoute><VIP /></ProtectedRoute>}</Route>
        <Route path="/responsible-gaming" component={ResponsibleGaming} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/aml" component={AML} />
        <Route path="/cookies" component={Cookies} />
        <Route path="/game/:id" component={Game} />
        <Route path="/games/double" component={Double} />
        <Route path="/games/mines" component={Mines} />
        <Route path="/games/plinko" component={Plinko} />
        <Route path="/games/aviatormania" component={AviatorMania} />
        <Route path="/jogar/:idHash" component={PlayGame} />
        
        {/* Account Routes - Protected */}
        <Route path="/history">{() => <ProtectedRoute><History /></ProtectedRoute>}</Route>
        <Route path="/support" component={Support} />
        <Route path="/support/tickets">{() => <ProtectedRoute><TicketHistory /></ProtectedRoute>}</Route>
        <Route path="/support/tickets/new">{() => <ProtectedRoute><CreateTicket /></ProtectedRoute>}</Route>
        <Route path="/support/tickets/:id">{() => <ProtectedRoute><TicketDetail /></ProtectedRoute>}</Route>
        <Route path="/profile">{() => <ProtectedRoute><Profile /></ProtectedRoute>}</Route>
        <Route path="/profile/settings">{() => <ProtectedRoute><Settings /></ProtectedRoute>}</Route>
        <Route path="/profile/security">{() => <ProtectedRoute><Security /></ProtectedRoute>}</Route>
        <Route path="/profile/verification">{() => <ProtectedRoute><Verification /></ProtectedRoute>}</Route>
        <Route path="/affiliates">{() => <ProtectedRoute><Affiliates /></ProtectedRoute>}</Route>
        <Route path="/levels">{() => <ProtectedRoute><Levels /></ProtectedRoute>}</Route>
        <Route path="/profile/levels">{() => <ProtectedRoute><Levels /></ProtectedRoute>}</Route>
        <Route path="/profile/rakeback">{() => <ProtectedRoute><Rakeback /></ProtectedRoute>}</Route>
        <Route path="/perfil/rakeback">{() => <ProtectedRoute><Rakeback /></ProtectedRoute>}</Route>
        <Route path="/profile/missions">{() => <ProtectedRoute><Missions /></ProtectedRoute>}</Route>
        <Route path="/perfil/missoes">{() => <ProtectedRoute><Missions /></ProtectedRoute>}</Route>
        <Route path="/missions">{() => <ProtectedRoute><Missions /></ProtectedRoute>}</Route>
        <Route path="/rakeback">{() => <ProtectedRoute><Rakeback /></ProtectedRoute>}</Route>
        <Route path="/profile/notifications">{() => <ProtectedRoute><NotificationsPage /></ProtectedRoute>}</Route>
        <Route path="/perfil/notificacoes">{() => <ProtectedRoute><NotificationsPage /></ProtectedRoute>}</Route>
        <Route path="/profile/responsible-gaming">{() => <ProtectedRoute><ResponsibleGamingSettings /></ProtectedRoute>}</Route>
        <Route path="/originals" component={Originals} />
        <Route path="/wallet">{() => <ProtectedRoute><WalletPage /></ProtectedRoute>}</Route>
        <Route path="/casino/popular" component={Casino} />
        <Route path="/casino/recent" component={Casino} />
        <Route path="/recent" component={Recent} />
        
        {/* Admin Routes - Protected + Admin Only */}
        <Route path="/admin">{() => <AdminRoute><AdminDashboard /></AdminRoute>}</Route>
        <Route path="/admin/users">{() => <AdminRoute><AdminUsers /></AdminRoute>}</Route>
        <Route path="/admin/games">{() => <AdminRoute><AdminGames /></AdminRoute>}</Route>
        <Route path="/admin/deposits">{() => <AdminRoute><AdminDeposits /></AdminRoute>}</Route>
        <Route path="/admin/withdrawals">{() => <AdminRoute><AdminWithdrawals /></AdminRoute>}</Route>
        <Route path="/admin/transactions">{() => <AdminRoute><AdminTransactions /></AdminRoute>}</Route>
        <Route path="/admin/bonuses">{() => <AdminRoute><AdminBonuses /></AdminRoute>}</Route>
        <Route path="/admin/promo-codes">{() => <AdminRoute><AdminPromoCodes /></AdminRoute>}</Route>
        <Route path="/admin/security">{() => <AdminRoute><AdminSecurity /></AdminRoute>}</Route>
        <Route path="/admin/settings">{() => <AdminRoute><AdminSettings /></AdminRoute>}</Route>
        <Route path="/admin/affiliates">{() => <AdminRoute><AdminAffiliates /></AdminRoute>}</Route>
        <Route path="/admin/audit">{() => <AdminRoute><AdminAudit /></AdminRoute>}</Route>
        <Route path="/admin/support">{() => <AdminRoute><AdminSupport /></AdminRoute>}</Route>
        <Route path="/admin/support/chats">{() => <AdminRoute><AdminSupportChats /></AdminRoute>}</Route>
        <Route path="/admin/support/tickets">{() => <AdminRoute><AdminSupportTickets /></AdminRoute>}</Route>
        <Route path="/admin/support/tickets/:id">{() => <AdminRoute><AdminSupportTickets /></AdminRoute>}</Route>
        <Route path="/admin/support/departments">{() => <AdminRoute><AdminSupportDepartments /></AdminRoute>}</Route>
        <Route path="/admin/chat">{() => <AdminRoute><AdminChat /></AdminRoute>}</Route>
        <Route path="/admin/missions">{() => <AdminRoute><AdminMissions /></AdminRoute>}</Route>
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SessionProvider>
          <Toaster />
          <SessionExpiredListener />
          <Router />
          <AuthModal />
          <SessionTimeoutModal />
        </SessionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
