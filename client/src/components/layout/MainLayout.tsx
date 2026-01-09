import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

import { MobileNav } from "./MobileNav";
import { AgeVerificationModal } from "../shared/AgeVerificationModal";
import { ChatWidget } from "../support/ChatWidget";
import { JackpotDisplay } from "../JackpotDisplay";

export function MainLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">
      <AgeVerificationModal />
      {/* Desktop Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 z-40">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden">
        {/* Mobile Header / Nav */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          
          <Link href="/">
            <h1 className="text-xl font-bold font-heading italic text-primary tracking-wide cursor-pointer hover:opacity-80 transition-opacity">
              IN1<span className="text-white">BET</span>
            </h1>
          </Link>

          <div className="w-10" /> {/* Spacer for balance */}
        </div>

        <Header />

        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)] max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <JackpotDisplay />
            {children}
          </div>
          <Footer />
        </main>
        
        <MobileNav />
      </div>
      
      <ChatWidget />
    </div>
  );
}
