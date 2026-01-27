import { Trophy, Flame, Play, LayoutGrid, CircleDollarSign, Gamepad2, Search, Menu, User, Bell, ChevronDown, Wallet, LogOut, Settings, History, MonitorPlay, Gift, Crown, HelpCircle, ShieldCheck, Dice5, TowerControl, TrendingUp, Clock, Dna, Rocket, Swords, Ticket, Lock, FileCheck, Users, Share2, BarChart3, Banknote, Target, MousePointerClick, Percent, Star } from "lucide-react";

export const USER = {
  name: "João Silva",
  username: "joaosilva88",
  email: "joao.silva@email.com",
  phone: "+55 11 99999-9999",
  balance: 2450.50,
  locked_balance: 500.00, // Bonus/Locked funds
  currency: "R$",
  avatar: "https://github.com/shadcn.png",
  vipLevel: "Gold",
  notifications: 3,
  kycStatus: "Pendente", // Verificada, Pendente, Rejeitada
  joinDate: "15/05/2024",
  referralCode: "IN1BET88"
};

export const CASINO_MENU = [
  { icon: Flame, label: "Casino", path: "/casino" },
  { icon: CircleDollarSign, label: "Casino Ao Vivo", path: "/live-casino" },
  { icon: Rocket, label: "Originais", path: "/originais" },
  { icon: TrendingUp, label: "Populares", path: "/casino/popular" },
  { icon: History, label: "Recentes", path: "/casino/recent" },
];

export const SPORTS_MENU = [
  { icon: Trophy, label: "Esportes", path: "/sports" },
  { icon: MonitorPlay, label: "Ao Vivo", path: "/live-betting" },
  { icon: Clock, label: "Pré-Jogo", path: "/sports/prematch" },
  { icon: Ticket, label: "Minhas Apostas", path: "/sports/my-bets" },
  { icon: Swords, label: "Resultados", path: "/sports/results" },
];

export const PROFILE_MENU_ITEMS = [
  { icon: User, label: "Minha Conta", path: "/profile" },
  { icon: Wallet, label: "Carteira", path: "/wallet" },
  { icon: Star, label: "Níveis", path: "/levels" },
  { icon: Target, label: "Missões", path: "/perfil/missoes" },
  { icon: Percent, label: "Rakeback", path: "/perfil/rakeback" },
  { icon: Users, label: "Afiliados", path: "/affiliates" },
  { icon: History, label: "Histórico", path: "/history" },
  { icon: Settings, label: "Preferências", path: "/profile/settings" },
  { icon: Gift, label: "Recompensas", path: "/vip" },
  { icon: FileCheck, label: "Verificação", path: "/profile/verification" },
  { icon: Lock, label: "Segurança", path: "/profile/security" },
  { icon: HelpCircle, label: "Suporte", path: "/support" },
];

export const ORIGINALS_GAMES = [
    { id: "plinko", name: "Plinko" },
    { id: "crash", name: "Crash" },
    { id: "double", name: "Double" },
    { id: "mines", name: "Mines" },
    { id: "limbo", name: "Limbo" },
    { id: "dice", name: "Dice" },
    { id: "tower", name: "Tower" },
    { id: "slide", name: "Slide" },
];

export const PROVIDERS = [
  { id: "pragmatic", name: "Pragmatic Play" },
  { id: "evolution", name: "Evolution" },
  { id: "pgsoft", name: "PG Soft" },
  { id: "spribe", name: "Spribe" },
  { id: "playtech", name: "Playtech" },
  { id: "hacksaw", name: "Hacksaw Gaming" },
  { id: "nolimit", name: "NoLimit City" },
  { id: "relax", name: "Relax Gaming" },
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
  { id: "BET-1019", date: "25/12/2025", type: "Esportes", event: "Man City vs Arsenal", stake: 75.00, return: 0, status: "Perdido" },
  { id: "BET-1018", date: "24/12/2025", type: "Casino", event: "Aviator", stake: 10.00, return: 25.50, status: "Ganho" },
];

export const FAQS = [
  { 
    question: "Como faço um depósito na IN1Bet?", 
    answer: "Para depositar, clique no botão 'Depositar' no canto superior direito da tela. Oferecemos PIX como forma de pagamento principal — é instantâneo e sem taxas. Basta informar o valor desejado, escanear o QR Code ou copiar o código PIX e pagar pelo app do seu banco. O crédito aparece na sua conta em segundos." 
  },
  { 
    question: "Qual o prazo para receber meu saque?", 
    answer: "Saques via PIX são processados em até 1 hora para contas com verificação completa (KYC). Se sua conta ainda não foi verificada, o primeiro saque pode levar até 24 horas enquanto nossa equipe analisa seus documentos. Após aprovação, os próximos saques serão instantâneos." 
  },
  { 
    question: "A IN1Bet é segura e confiável?", 
    answer: "Sim, a IN1Bet opera com os mais altos padrões de segurança. Utilizamos criptografia SSL de 256 bits para proteger todas as transações e dados pessoais. Além disso, seguimos as diretrizes da LGPD (Lei Geral de Proteção de Dados) e nossos jogos são auditados para garantir resultados justos e aleatórios." 
  },
  { 
    question: "O que acontece se meu depósito não aparecer?", 
    answer: "Se o seu depósito via PIX não aparecer em até 10 minutos, primeiro verifique se o pagamento foi realmente concluído no app do seu banco. Caso positivo, entre em contato com nosso suporte pelo chat ao vivo — disponível 24 horas — e envie o comprovante de pagamento. Nossa equipe resolverá a situação rapidamente." 
  },
  { 
    question: "Como funciona o bônus de boas-vindas?", 
    answer: "O bônus de boas-vindas é creditado automaticamente após seu primeiro depósito qualificado. Cada bônus tem um requisito de apostas (rollover) que precisa ser cumprido antes do saque. Por exemplo, um bônus de R$ 100 com rollover 10x significa que você precisa apostar R$ 1.000 no total para liberar o valor." 
  },
];

export const TICKETS = [
    { id: "TCK-001", subject: "Depósito não caiu", status: "Aberto", date: "Hoje 10:30" },
    { id: "TCK-002", subject: "Dúvida sobre bônus", status: "Respondido", date: "Ontem 15:45" },
    { id: "TCK-003", subject: "Erro no jogo Aviator", status: "Fechado", date: "20/12/2025" },
];

export const LOGIN_HISTORY = [
    { date: "Hoje 10:00", device: "Chrome / Windows 10", ip: "189.12.34.56", location: "São Paulo, BR" },
    { date: "Ontem 18:30", device: "Safari / iPhone 13", ip: "177.34.56.78", location: "São Paulo, BR" },
    { date: "26/12/2025", device: "Chrome / Windows 10", ip: "189.12.34.56", location: "São Paulo, BR" },
];

export const AFFILIATE_DATA = {
    totalEarnings: 1250.80,
    availableBalance: 450.50,
    totalReferrals: 128,
    activeReferrals: 45,
    todayClicks: 342,
    todaySignups: 12,
    todayEarnings: 85.20,
    commissionRate: 30, // Percentage
    referralLink: "https://in1bet.com/r/joaosilva88",
    campaigns: [
        { id: 1, name: "Instagram Bio", clicks: 1240, signups: 85, earnings: 850.50 },
        { id: 2, name: "Youtube Video", clicks: 540, signups: 32, earnings: 320.00 },
        { id: 3, name: "Telegram Group", clicks: 120, signups: 11, earnings: 80.30 },
    ],
    recentReferrals: [
        { id: 1, user: "marcos_12", date: "Hoje, 10:23", status: "Active", commission: 12.50 },
        { id: 2, user: "ana_clara", date: "Hoje, 09:15", status: "Active", commission: 8.20 },
        { id: 3, user: "pedro_games", date: "Ontem, 22:40", status: "Inactive", commission: 0.00 },
        { id: 4, user: "lucas_bet", date: "Ontem, 18:20", status: "Active", commission: 25.00 },
    ]
};
