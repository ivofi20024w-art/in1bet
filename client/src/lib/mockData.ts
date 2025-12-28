import { Trophy, Flame, Play, LayoutGrid, CircleDollarSign, Gamepad2, Search, Menu, User, Bell, ChevronDown, Wallet, LogOut, Settings, History } from "lucide-react";

export const USER = {
  name: "João Silva",
  username: "joaosilva88",
  balance: 2450.50,
  currency: "R$",
  avatar: "https://github.com/shadcn.png",
  vipLevel: "Gold",
  notifications: 3
};

export const MENU_ITEMS = [
  { icon: LayoutGrid, label: "Lobby", path: "/" },
  { icon: Flame, label: "Populares", path: "/casino" },
  { icon: Trophy, label: "Desportos", path: "/sports" },
  { icon: CircleDollarSign, label: "Ao Vivo", path: "/live" },
  { icon: Gamepad2, label: "Slots", path: "/slots" },
];

export const CASINO_GAMES = [
  { id: 1, title: "Gates of Olympus", provider: "Pragmatic Play", image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=500", hot: true, category: "Slots" },
  { id: 2, title: "Sweet Bonanza", provider: "Pragmatic Play", image: "https://images.unsplash.com/photo-1605218427306-633ba87c9759?auto=format&fit=crop&q=80&w=500", hot: false, category: "Slots" },
  { id: 3, title: "Aviator", provider: "Spribe", image: "https://images.unsplash.com/photo-1559969143-b2def2575d2d?auto=format&fit=crop&q=80&w=500", hot: true, category: "Crash" },
  { id: 4, title: "Roleta Brasileira", provider: "Evolution", image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=500", hot: true, category: "Live" },
  { id: 5, title: "Fortune Tiger", provider: "PG Soft", image: "https://images.unsplash.com/photo-1629248456637-2f741542f70b?auto=format&fit=crop&q=80&w=500", hot: true, category: "Slots" },
  { id: 6, title: "Blackjack VIP", provider: "Evolution", image: "https://images.unsplash.com/photo-1517487299092-23c3167b0798?auto=format&fit=crop&q=80&w=500", hot: false, category: "Live" },
];

export const SPORTS_MATCHES = [
  { 
    id: 1, 
    league: "Brasileirão Série A", 
    home: "Flamengo", 
    away: "Palmeiras", 
    time: "Ao Vivo 65'", 
    score: "1 - 1", 
    odds: { home: 2.85, draw: 3.10, away: 2.50 },
    isLive: true 
  },
  { 
    id: 2, 
    league: "Premier League", 
    home: "Man City", 
    away: "Liverpool", 
    time: "Hoje 16:00", 
    score: null, 
    odds: { home: 1.95, draw: 3.60, away: 3.80 },
    isLive: false 
  },
  { 
    id: 3, 
    league: "NBA", 
    home: "Lakers", 
    away: "Warriors", 
    time: "Amanhã 21:00", 
    score: null, 
    odds: { home: 1.85, draw: null, away: 1.95 },
    isLive: false 
  },
];
