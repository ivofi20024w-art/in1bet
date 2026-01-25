import { useState, useEffect, type ComponentType } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  Rocket,
  Zap,
  Bomb,
  Target,
  Dices,
  Gamepad2,
  Flame,
  PlayCircle,
  Trophy,
  Star,
  Headphones,
  Gift,
  HelpCircle,
  ShieldCheck,
  Volleyball,
  Timer,
  CircleDot
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  isNew?: boolean;
}

interface MenuSection {
  id: string;
  title: string;
  items: MenuItem[];
  defaultOpen?: boolean;
}

const ORIGINALS_MENU: MenuItem[] = [
  { id: "recent", label: "Jogado Recentemente", path: "/recent", icon: Clock },
  { id: "aviator", label: "Aviator Mania", path: "/games/aviatormania", icon: Rocket },
  { id: "double", label: "Double", path: "/games/double", icon: CircleDot },
  { id: "mines", label: "Mines", path: "/games/mines", icon: Bomb },
  { id: "plinko", label: "Plinko", path: "/games/plinko", icon: Target },
  { id: "dice", label: "Dice", path: "/games/dice", icon: Dices },
];

const CASINO_MENU: MenuItem[] = [
  { id: "slots", label: "Slots", path: "/casino", icon: Gamepad2 },
  { id: "popular", label: "Populares", path: "/casino?filter=popular", icon: Flame },
  { id: "live", label: "Ao Vivo", path: "/live-casino", icon: PlayCircle },
  { id: "jackpots", label: "Jackpots", path: "/casino?filter=jackpot", icon: Trophy },
  { id: "new", label: "Novos", path: "/casino?filter=new", icon: Star, isNew: true },
];

const SPORTS_MENU: MenuItem[] = [
  { id: "futebol", label: "Futebol", path: "/sports/futebol", icon: CircleDot },
  { id: "ao-vivo", label: "Ao Vivo", path: "/sports?live=true", icon: Timer },
  { id: "volei", label: "Vôlei", path: "/sports/volei", icon: Volleyball },
];

const MENU_SECTIONS: MenuSection[] = [
  { id: "originals", title: "ORIGINAIS DA IN1BET", items: ORIGINALS_MENU, defaultOpen: true },
  { id: "casino", title: "CASSINO", items: CASINO_MENU, defaultOpen: false },
  // SPORTS DISABLED - Uncomment to re-enable
  // { id: "sports", title: "ESPORTES", items: SPORTS_MENU, defaultOpen: false },
];

const FOOTER_MENU: MenuItem[] = [
  { id: "support", label: "Suporte Ao Vivo", path: "/support", icon: Headphones },
  { id: "promotions", label: "Promoções", path: "/promotions", icon: Gift },
  { id: "help", label: "Central de Apoio", path: "/help", icon: HelpCircle },
  { id: "responsible", label: "Jogo Responsável", path: "/responsible-gaming", icon: ShieldCheck },
];

function SidebarItem({ 
  item, 
  isCompact, 
  isActive 
}: { 
  item: MenuItem; 
  isCompact: boolean; 
  isActive: boolean;
}) {
  const linkContent = (
    <Link 
      href={item.path} 
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
        isCompact && "justify-center px-2",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:text-white hover:bg-white/5"
      )}
    >
      <item.icon className={cn(
        "w-5 h-5 flex-shrink-0",
        isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
      )} />
      
      {!isCompact && (
        <>
          <span className="truncate">{item.label}</span>
          {item.isNew && (
            <span className="ml-auto text-[10px] font-bold text-primary bg-primary/20 px-1.5 py-0.5 rounded">
              Novo!
            </span>
          )}
        </>
      )}
      
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
      )}
    </Link>
  );

  if (isCompact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {linkContent}
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-[#1a1a2e] text-white border border-white/20 shadow-lg">
          <span>{item.label}</span>
          {item.isNew && <span className="ml-2 text-primary text-xs">Novo!</span>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

function CollapsibleSection({ 
  section, 
  isOpen, 
  onToggle, 
  isCompact,
  location 
}: { 
  section: MenuSection; 
  isOpen: boolean; 
  onToggle: () => void;
  isCompact: boolean;
  location: string;
}) {
  if (isCompact) {
    return (
      <div className="space-y-1 py-2 border-b border-white/5 last:border-0">
        {section.items.map((item) => (
          <SidebarItem 
            key={item.id} 
            item={item} 
            isCompact={isCompact} 
            isActive={location === item.path || location.startsWith(item.path + '/')} 
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hover:text-white transition-colors"
      >
        <span>{section.title}</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen ? "" : "-rotate-90"
        )} />
      </button>
      
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="space-y-0.5 pb-2">
          {section.items.map((item) => (
            <SidebarItem 
              key={item.id} 
              item={item} 
              isCompact={isCompact} 
              isActive={location === item.path || location.startsWith(item.path + '/')} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface SidebarProps {
  className?: string;
  isMobile?: boolean;
}

export function Sidebar({ className, isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window !== 'undefined' && !isMobile) {
      return localStorage.getItem('sidebar-compact') === 'true';
    }
    return false;
  });
  
  const effectiveCompact = isMobile ? false : isCompact;
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MENU_SECTIONS.forEach(section => {
      initial[section.id] = section.defaultOpen ?? false;
    });
    return initial;
  });

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebar-compact', String(isCompact));
    }
  }, [isCompact, isMobile]);

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className={cn(
        "relative flex flex-col h-full bg-sidebar border-r border-white/5 py-4 transition-all duration-300 ease-in-out",
        isMobile ? "w-full" : (effectiveCompact ? "w-[72px]" : "w-[260px]"),
        className
      )}>
        {/* Logo - only show on mobile sidebar */}
        {isMobile && (
          <div className="mb-4 px-4">
            <Link href="/">
              <h1 className="text-2xl font-bold font-heading italic text-primary tracking-wide cursor-pointer hover:opacity-80 transition-opacity">
                IN1<span className="text-white">BET</span>
              </h1>
            </Link>
          </div>
        )}
        
        {/* Desktop Logo with Toggle Button */}
        {!isMobile && (
          <div className={cn(
            "mb-4 px-3 flex items-center gap-2",
            effectiveCompact ? "flex-col" : "justify-between"
          )}>
            <Link href="/">
              {effectiveCompact ? (
                <span className="text-xl font-bold font-heading italic text-primary">
                  IN1
                </span>
              ) : (
                <h1 className="text-2xl font-bold font-heading italic text-primary tracking-wide cursor-pointer hover:opacity-80 transition-opacity">
                  IN1<span className="text-white">BET</span>
                </h1>
              )}
            </Link>
            
            {/* Toggle Button - Inside sidebar */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setIsCompact(!isCompact)}
                  className={cn(
                    "flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-white/5 transition-all",
                    effectiveCompact ? "w-10 h-10 mt-2" : "w-8 h-8"
                  )}
                >
                  {effectiveCompact ? (
                    <ChevronRight className="w-5 h-5" />
                  ) : (
                    <ChevronLeft className="w-5 h-5" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#1a1a2e] text-white border border-white/20 shadow-lg">
                {effectiveCompact ? "Expandir menu" : "Recolher menu"}
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Main Menu Sections */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-2 space-y-1">
          {MENU_SECTIONS.map((section) => (
            <CollapsibleSection
              key={section.id}
              section={section}
              isOpen={openSections[section.id]}
              onToggle={() => toggleSection(section.id)}
              isCompact={effectiveCompact}
              location={location}
            />
          ))}
        </div>

        {/* Footer Menu */}
        <div className="mt-auto pt-4 px-2 border-t border-white/5 space-y-0.5">
          {FOOTER_MENU.map((item) => (
            <SidebarItem 
              key={item.id} 
              item={item} 
              isCompact={effectiveCompact} 
              isActive={location === item.path} 
            />
          ))}
        </div>
      </aside>
    </TooltipProvider>
  );
}
