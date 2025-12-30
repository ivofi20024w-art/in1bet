import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import History from "@/pages/History";
import Support from "@/pages/Support";
import ResponsibleGaming from "@/pages/ResponsibleGaming";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import AML from "@/pages/AML";
import Cookies from "@/pages/Cookies";
import Profile from "@/pages/profile/Profile";
import Security from "@/pages/profile/Security";
import Verification from "@/pages/profile/Verification";
import Affiliates from "@/pages/profile/Affiliates";
import WalletPage from "@/pages/Wallet";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Mines from "@/pages/games/Mines";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminDeposits from "@/pages/admin/Deposits";
import AdminWithdrawals from "@/pages/admin/Withdrawals";
import AdminTransactions from "@/pages/admin/Transactions";
import AdminBonuses from "@/pages/admin/Bonuses";
import AdminSecurity from "@/pages/admin/Security";
import AdminSettings from "@/pages/admin/Settings";
import AdminAffiliates from "@/pages/admin/Affiliates";
import AdminAudit from "@/pages/admin/Audit";
import { useEffect, useState } from "react";
import { Loader } from "@/components/ui/Loader";

// Mock Auth Context for Prototype
function AuthGuard({ children }: { children: React.ReactNode }) {
    const [location, setLocation] = useLocation();
    // Simulate auth state - for prototype we default to true, 
    // but specific actions might check this
    const isAuthenticated = localStorage.getItem("in1bet_auth") === "true";

    return <>{children}</>;
}

function Router() {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [loadType, setLoadType] = useState<"initial" | "page">("initial");

  useEffect(() => {
    // Determine load time
    // Initial load or Casino/Home: 3-5 seconds
    // Page transition: 1-2 seconds
    let minTime = 1000;
    let maxTime = 2000;

    if (loadType === "initial") {
        minTime = 3000;
        maxTime = 5000;
    } else if (location === "/casino" || location === "/") {
        // Use longer load for heavy pages if desired, or keep random 1-2s for navigation
        // User requested: "opening the casino 3-5 seconds"
        // If navigating TO casino:
        if (location === "/casino") {
             minTime = 3000;
             maxTime = 5000;
        }
    }

    const duration = Math.floor(Math.random() * (maxTime - minTime + 1)) + minTime;

    setIsLoading(true);
    const timer = setTimeout(() => {
        setIsLoading(false);
        if (loadType === "initial") setLoadType("page"); // Switch to page mode after first load
    }, duration);

    return () => clearTimeout(timer);
  }, [location]); // Trigger on location change

  return (
    <>
      <Loader isLoading={isLoading} type={loadType} />
      <Switch>
        {/* Public Routes */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/forgot-password" component={ForgotPassword} />

        {/* Main Routes */}
        <Route path="/" component={Home} />
        <Route path="/games/mines" component={Mines} />
        
        {/* Legal Pages */}
        <Route path="/responsible-gaming" component={ResponsibleGaming} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/aml" component={AML} />
        <Route path="/cookies" component={Cookies} />
        
        {/* Account Routes - Functional Only */}
        <Route path="/history" component={History} />
        <Route path="/support" component={Support} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/security" component={Security} />
        <Route path="/profile/verification" component={Verification} />
        <Route path="/affiliates" component={Affiliates} />
        <Route path="/wallet" component={WalletPage} />

        {/* Redirects for removed routes */}
        <Route path="/casino">{() => <Redirect to="/games/mines" />}</Route>
        <Route path="/originals">{() => <Redirect to="/games/mines" />}</Route>
        <Route path="/games/crash">{() => <Redirect to="/games/mines" />}</Route>
        <Route path="/games/double">{() => <Redirect to="/games/mines" />}</Route>
        <Route path="/games/plinko">{() => <Redirect to="/games/mines" />}</Route>
        <Route path="/sports">{() => <Redirect to="/" />}</Route>
        <Route path="/live-betting">{() => <Redirect to="/" />}</Route>
        <Route path="/live-casino">{() => <Redirect to="/" />}</Route>
        <Route path="/profile/settings">{() => <Redirect to="/profile" />}</Route>

        {/* Admin Routes - All Functional */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/users" component={AdminUsers} />
        <Route path="/admin/deposits" component={AdminDeposits} />
        <Route path="/admin/withdrawals" component={AdminWithdrawals} />
        <Route path="/admin/transactions" component={AdminTransactions} />
        <Route path="/admin/bonuses" component={AdminBonuses} />
        <Route path="/admin/security" component={AdminSecurity} />
        <Route path="/admin/settings" component={AdminSettings} />
        <Route path="/admin/affiliates" component={AdminAffiliates} />
        <Route path="/admin/audit" component={AdminAudit} />
        
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
