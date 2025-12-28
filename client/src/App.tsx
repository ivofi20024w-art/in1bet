import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Casino from "@/pages/Casino";
import Sports from "@/pages/Sports";
import LiveBetting from "@/pages/LiveBetting";
import LiveCasino from "@/pages/LiveCasino";
import VirtualSports from "@/pages/VirtualSports";
import Promotions from "@/pages/Promotions";
import VIP from "@/pages/VIP";
import History from "@/pages/History";
import Support from "@/pages/Support";
import CreateTicket from "@/pages/support/CreateTicket";
import TicketHistory from "@/pages/support/TicketHistory";
import ResponsibleGaming from "@/pages/ResponsibleGaming";
import Profile from "@/pages/profile/Profile";
import Settings from "@/pages/profile/Settings";
import Security from "@/pages/profile/Security";
import Verification from "@/pages/profile/Verification";
import Affiliates from "@/pages/profile/Affiliates";
import Game from "@/pages/Game";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import Crash from "@/pages/games/Crash";
import Double from "@/pages/games/Double";
import Mines from "@/pages/games/Mines";
import Plinko from "@/pages/games/Plinko";
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

        {/* Protected Routes (Mock Guard) */}
        <Route path="/" component={Home} />
        <Route path="/casino" component={Casino} />
        <Route path="/sports" component={Sports} />
        <Route path="/live-betting" component={LiveBetting} />
        <Route path="/live-casino" component={LiveCasino} />
        <Route path="/virtual-sports" component={VirtualSports} />
        <Route path="/promotions" component={Promotions} />
        <Route path="/vip" component={VIP} />
        <Route path="/responsible-gaming" component={ResponsibleGaming} />
        <Route path="/game/:id" component={Game} />
        <Route path="/games/crash" component={Crash} />
        <Route path="/games/double" component={Double} />
        <Route path="/games/mines" component={Mines} />
        <Route path="/games/plinko" component={Plinko} />
        
        {/* Account Routes */}
        <Route path="/history" component={History} />
        <Route path="/support" component={Support} />
        <Route path="/support/tickets" component={TicketHistory} />
        <Route path="/support/tickets/new" component={CreateTicket} />
        <Route path="/profile" component={Profile} />
        <Route path="/profile/settings" component={Settings} />
        <Route path="/profile/security" component={Security} />
        <Route path="/profile/verification" component={Verification} />
        <Route path="/affiliates" component={Affiliates} />
        
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
