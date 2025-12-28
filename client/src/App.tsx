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
import Game from "@/pages/Game";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import { useEffect, useState } from "react";

// Mock Auth Context for Prototype
function AuthGuard({ children }: { children: React.ReactNode }) {
    const [location, setLocation] = useLocation();
    // Simulate auth state - for prototype we default to true, 
    // but specific actions might check this
    const isAuthenticated = localStorage.getItem("primebet_auth") === "true";

    return <>{children}</>;
}

function Router() {
  return (
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
      
      {/* Account Routes */}
      <Route path="/history" component={History} />
      <Route path="/support" component={Support} />
      <Route path="/support/tickets" component={TicketHistory} />
      <Route path="/support/tickets/new" component={CreateTicket} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/settings" component={Settings} />
      <Route path="/profile/security" component={Security} />
      <Route path="/profile/verification" component={Verification} />
      
      <Route component={NotFound} />
    </Switch>
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
