import { ReactNode, useState, useEffect } from "react";
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

export function MainLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [sidebarWidth, setSidebarWidth] = useState('260px');

  useEffect(() => {
    // Get initial sidebar state
    const isCompact = localStorage.getItem('sidebar-compact') === 'true';
    setSidebarWidth(isCompact ? '72px' : '260px');
    
    // Listen for CSS variable changes
    const observer = new MutationObserver(() => {
      const width = getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim();
      if (width) setSidebarWidth(width);
    });
    
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden font-sans">
      <AgeVerificationModal />
      {/* Desktop Sidebar - Fixed position */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-40">
        <Sidebar />
      </div>

      {/* Main content with left margin for sidebar (uses CSS variable for dynamic width) */}
      <div 
        className="flex-1 flex flex-col min-h-screen min-w-0 overflow-hidden transition-all duration-300"
        style={{ marginLeft: isMobile ? '0' : sidebarWidth }}
      >
        <Header />

        <main className="flex-1 overflow-y-auto scroll-smooth">
          <div className="p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)] max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            {children}
          </div>
          <Footer />
        </main>
        
        <MobileNav />
      </div>
    </div>
  );
}
