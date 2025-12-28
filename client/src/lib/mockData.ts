import { Trophy, Flame, Play, LayoutGrid, CircleDollarSign, Gamepad2, Search, Menu, User, Bell, ChevronDown, Wallet, LogOut, Settings, History, MonitorPlay, Gift, Crown, HelpCircle, ShieldCheck } from "lucide-react";

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
  { icon: Flame, label: "Casino", path: "/casino" },
  { icon: CircleDollarSign, label: "Casino Ao Vivo", path: "/live-casino" },
  { icon: Trophy, label: "Desportos", path: "/sports" },
  { icon: MonitorPlay, label: "Apostas Ao Vivo", path: "/live-betting" },
  { icon: Gamepad2, label: "Virtuais", path: "/virtual-sports" },
  { icon: Gift, label: "Promoções", path: "/promotions" },
  { icon: Crown, label: "Clube VIP", path: "/vip" },
  { icon: History, label: "Histórico", path: "/history" },
];

export const CASINO_GAMES = [
  { id: 1, title: "Gates of Olympus", provider: "Pragmatic Play", image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=500", hot: true, category: "Slots" },
  { id: 2, title: "Sweet Bonanza", provider: "Pragmatic Play", image: "https://images.unsplash.com/photo-1605218427306-633ba87c9759?auto=format&fit=crop&q=80&w=500", hot: false, category: "Slots" },
  { id: 3, title: "Aviator", provider: "Spribe", image: "https://images.unsplash.com/photo-1559969143-b2def2575d2d?auto=format&fit=crop&q=80&w=500", hot: true, category: "Crash" },
  { id: 4, title: "Roleta Brasileira", provider: "Evolution", image: "https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&q=80&w=500", hot: true, category: "Live" },
  { id: 5, title: "Fortune Tiger", provider: "PG Soft", image: "https://images.unsplash.com/photo-1629248456637-2f741542f70b?auto=format&fit=crop&q=80&w=500", hot: true, category: "Slots" },
  { id: 6, title: "Blackjack VIP", provider: "Evolution", image: "https://images.unsplash.com/photo-1517487299092-23c3167b0798?auto=format&fit=crop&q=80&w=500", hot: false, category: "Live" },
  { id: 7, title: "Crazy Time", provider: "Evolution", image: "https://images.unsplash.com/photo-1518893494013-481c1d8ed3fd?auto=format&fit=crop&q=80&w=500", hot: true, category: "Live" },
  { id: 8, title: "Sugar Rush", provider: "Pragmatic Play", image: "https://images.unsplash.com/photo-1581553634938-16328399e539?auto=format&fit=crop&q=80&w=500", hot: false, category: "Slots" },
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
  { 
    id: 4, 
    league: "Champions League", 
    home: "Real Madrid", 
    away: "Bayern", 
    time: "Ao Vivo 23'", 
    score: "0 - 1", 
    odds: { home: 3.50, draw: 3.20, away: 2.10 },
    isLive: true 
  },
];

export const PROMOTIONS = [
  {
    id: 1,
    title: "Bônus de Boas-Vindas",
    description: "100% até R$ 500 no seu primeiro depósito para Casino ou Esportes.",
    image: "https://images.unsplash.com/photo-1605218427306-633ba87c9759?auto=format&fit=crop&q=80&w=500",
    cta: "Resgatar"
  },
  {
    id: 2,
    title: "Cashback Semanal",
    description: "Receba 10% de volta em todas as suas perdas líquidas de segunda a domingo.",
    image: "https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&q=80&w=500",
    cta: "Ativar"
  },
  {
    id: 3,
    title: "Múltipla Turbinada",
    description: "Aumente seus ganhos em até 50% nas apostas múltiplas.",
    image: "https://images.unsplash.com/photo-1559969143-b2def2575d2d?auto=format&fit=crop&q=80&w=500",
    cta: "Apostar"
  }
];

export const VIP_LEVELS = [
  { level: "Bronze", benefits: ["Suporte Básico", "Saques em 24h"], color: "text-orange-700" },
  { level: "Prata", benefits: ["Cashback 2%", "Gerente de Conta", "Saques em 12h"], color: "text-gray-400" },
  { level: "Ouro", benefits: ["Cashback 5%", "Bônus de Aniversário", "Saques em 1h"], color: "text-yellow-500" },
  { level: "Platina", benefits: ["Cashback 10%", "Convites Exclusivos", "Saques Instantâneos"], color: "text-blue-300" },
];

export const BET_HISTORY = [
  { id: "BET-1023", date: "28/12/2025", type: "Esportes", event: "Flamengo vs Palmeiras", stake: 50.00, return: 0, status: "Pendente" },
  { id: "BET-1022", date: "27/12/2025", type: "Casino", event: "Gates of Olympus", stake: 20.00, return: 450.00, status: "Ganho" },
  { id: "BET-1021", date: "27/12/2025", type: "Esportes", event: "Lakers vs Warriors", stake: 100.00, return: 0, status: "Perdido" },
  { id: "BET-1020", date: "26/12/2025", type: "Casino", event: "Roleta Brasileira", stake: 200.00, return: 400.00, status: "Ganho" },
];

export const FAQS = [
  { question: "Como faço um depósito?", answer: "Clique no botão 'Depósito' no topo da página, escolha o método PIX e siga as instruções." },
  { question: "Quanto tempo demora o saque?", answer: "Saques via PIX são processados em até 1 hora para contas verificadas." },
  { question: "É seguro apostar aqui?", answer: "Sim, somos licenciados e utilizamos criptografia SSL para proteger seus dados." },
];
