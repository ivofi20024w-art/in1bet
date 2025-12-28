import { Switch, Route } from "wouter";
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
import ResponsibleGaming from "@/pages/ResponsibleGaming";
import Game from "@/pages/Game";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/casino" component={Casino} />
      <Route path="/sports" component={Sports} />
      <Route path="/live-betting" component={LiveBetting} />
      <Route path="/live-casino" component={LiveCasino} />
      <Route path="/virtual-sports" component={VirtualSports} />
      <Route path="/promotions" component={Promotions} />
      <Route path="/vip" component={VIP} />
      <Route path="/history" component={History} />
      <Route path="/support" component={Support} />
      <Route path="/responsible-gaming" component={ResponsibleGaming} />
      <Route path="/game/:id" component={Game} />
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
