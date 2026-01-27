import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "wouter";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Users, 
  ShieldCheck, 
  Crown, 
  Gamepad2,
  Gift,
  Zap,
  Smile,
  X,
  MessageSquare,
  Settings,
  MoreVertical,
  Reply,
  CornerDownRight,
  Play,
  Loader2,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Clock,
  Trash2,
  Ban,
  VolumeOff,
  LogIn,
  Star,
  Lock,
  Headphones
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getStoredAuth } from "@/lib/auth";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useAuthModal } from "@/stores/authModalStore";
import { useChatStore, type ChatMessage as StoreChatMessage } from "@/stores/chatStore";

// --- Types ---
interface User {
  id: string;
  username: string;
  avatar?: string;
  rank: 'admin' | 'suporte' | 'influencer' | 'vip' | 'platinum' | 'gold' | 'user';
  level: number;
  color: string;
  role?: string;
}

interface Message {
  id: string;
  user: User;
  content: string;
  timestamp: Date;
  type: 'chat' | 'win' | 'system' | 'rain' | 'casino_bet';
  reactions: Record<string, number>;
  userReaction?: string;
  replyTo?: {
    id: string;
    username: string;
    content: string;
  };
  meta?: {
    amount?: number;
    game?: string;
    multiplier?: number;
    currency?: string;
    isBonusBuy?: boolean;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  displayName: string;
  type: string;
}

interface UserStats {
  totalWagered: number;
  totalWins: number;
  totalGames: number;
  ranking: number;
  favoriteGame: string;
  favoriteGameRounds: number;
  recentWins: Array<{
    game: string;
    multiplier: number;
    amount: number;
    createdAt: string;
  }>;
}

interface ChatSettings {
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  compactMode: boolean;
  showTimestamps: boolean;
}

const DEFAULT_SETTINGS: ChatSettings = {
  soundEnabled: true,
  notificationsEnabled: true,
  compactMode: false,
  showTimestamps: true,
};

// --- Helper Functions ---
const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
];

function getUserColor(userId: string): string {
  const index = userId.charCodeAt(0) % COLORS.length;
  return COLORS[index];
}

function mapVipToRank(vipLevel: string, isAdmin: boolean, role?: string): User['rank'] {
  if (isAdmin || role === 'ADMIN') return 'admin';
  if (role === 'SUPORTE') return 'suporte';
  if (role === 'INFLUENCER') return 'influencer';
  switch (vipLevel?.toLowerCase()) {
    case 'diamond':
    case 'platinum': return 'platinum';
    case 'gold': return 'gold';
    case 'vip': return 'vip';
    default: return 'user';
  }
}

function getRankBadge(rank: User['rank'], role?: string) {
  if (role === 'ADMIN' || rank === 'admin') {
    return (
      <span 
        className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-red-500/20 text-red-400 border border-red-500/30"
        style={{
          animation: 'adminPulse 2s ease-in-out infinite',
          boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
        }}
      >
        ADMIN
      </span>
    );
  }
  if (role === 'SUPORTE' || rank === 'suporte') {
    return (
      <span 
        className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-blue-500/20 text-blue-400 border border-blue-500/30"
        style={{
          animation: 'supportGlow 2s ease-in-out infinite',
          boxShadow: '0 0 8px rgba(59, 130, 246, 0.4)'
        }}
      >
        SUPORTE
      </span>
    );
  }
  if (role === 'INFLUENCER' || rank === 'influencer') {
    return (
      <span 
        className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-purple-500/20 text-purple-400 border border-purple-500/30"
        style={{
          animation: 'influencerShine 2s ease-in-out infinite',
          boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)'
        }}
      >
        INFLUENCER
      </span>
    );
  }
  switch (rank) {
    case 'vip': return <Crown className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/10" />;
    case 'platinum': return <Zap className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400/10" />;
    case 'gold': return <Crown className="w-3.5 h-3.5 text-orange-400 fill-orange-400/10" />;
    default: return null;
  }
}

function getLevelStyle(level: number) {
  if (level >= 90) return "bg-gradient-to-r from-cyan-500 to-blue-600 ring-cyan-500/50";
  if (level >= 70) return "bg-gradient-to-r from-yellow-400 to-orange-500 ring-yellow-500/50";
  if (level >= 50) return "bg-gradient-to-r from-slate-400 to-slate-600 ring-slate-400/50";
  if (level >= 30) return "bg-gradient-to-r from-emerald-400 to-emerald-600 ring-emerald-400/50";
  return "bg-white/10 ring-white/20";
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR');
}

const GAME_URL_MAP: Record<string, string> = {
  'Aviator Mania': '/games/aviatormania',
  'Aviator': '/games/aviatormania',
  'Double': '/games/double',
  'Mines': '/games/mines',
  'Plinko': '/games/plinko',
  'Crash': '/games/crash',
};

interface CasinoWinInfo {
  amount: number;
  gameName: string;
  multiplier?: number;
  gameUrl: string | null;
}

function parseCasinoWinMessage(content: string): CasinoWinInfo | null {
  const match = content.match(/Ganhou R\$ ([\d.,]+) no ([^\s(]+(?:\s+\w+)?)(?: \(([\d.]+)x\))?/);
  if (!match) return null;
  
  const amountStr = match[1].replace(/\./g, '').replace(',', '.');
  const amount = parseFloat(amountStr);
  const gameName = match[2].trim();
  const multiplier = match[3] ? parseFloat(match[3]) : undefined;
  const gameUrl = GAME_URL_MAP[gameName] || null;
  
  return { amount, gameName, multiplier, gameUrl };
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  return `${diffDays}d atrás`;
}

// --- CSS Keyframes for animations ---
const animationStyles = `
@keyframes adminPulse {
  0%, 100% { 
    box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 16px rgba(239, 68, 68, 0.7);
    transform: scale(1.02);
  }
}
@keyframes supportGlow {
  0%, 100% { 
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
    opacity: 1;
  }
  50% { 
    box-shadow: 0 0 14px rgba(59, 130, 246, 0.6);
    opacity: 0.9;
  }
}
@keyframes influencerShine {
  0%, 100% { 
    box-shadow: 0 0 8px rgba(168, 85, 247, 0.4);
    filter: brightness(1);
  }
  50% { 
    box-shadow: 0 0 14px rgba(168, 85, 247, 0.6);
    filter: brightness(1.1);
  }
}
`;

// --- Draggable Message Item ---
function DraggableMessageItem({ 
  msg, 
  currentUser, 
  onReply, 
  onReaction, 
  setSelectedUser,
  isAdmin,
  onAdminAction,
  showTimestamps,
  compactMode
}: { 
  msg: Message; 
  currentUser: User; 
  onReply: (msg: Message) => void;
  onReaction: (id: string, emoji: string) => void;
  setSelectedUser: (user: User) => void;
  isAdmin: boolean;
  onAdminAction?: (action: 'ban' | 'mute' | 'delete', msg: Message) => void;
  showTimestamps?: boolean;
  compactMode?: boolean;
}) {
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, 50, 100], [0, 1, 0]);
  const scale = useTransform(x, [0, 50], [0.5, 1]);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="relative overflow-hidden group"
    >
      <motion.div 
        style={{ opacity, scale, x: -20 }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-0 flex items-center gap-2 text-muted-foreground"
      >
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
          <Reply className="w-4 h-4 text-accent" />
        </div>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.1}
        dragSnapToOrigin={true}
        onDragEnd={(_, info) => {
          if (info.offset.x > 60) {
            onReply(msg);
          }
        }}
        style={{ x }}
        className={cn(
          "relative z-10 pl-2 pr-2 py-1.5 rounded-md hover:bg-[#1A1D29] transition-colors border border-transparent hover:border-white/5",
          msg.type === 'win' && "my-2 bg-[#1A1D29]/50 border-white/5 shadow-sm",
          msg.type === 'casino_bet' && "my-2 bg-blue-500/5 border-blue-500/10",
          currentUser.id === msg.user.id && "flex flex-row-reverse",
          compactMode && "py-0.5"
        )}
      >
        {/* Context Actions (Hover) */}
        <div className={cn(
          "absolute top-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-[#2D3142] rounded-md shadow-lg border border-white/10 p-1 z-10",
          currentUser.id === msg.user.id ? "left-2" : "right-2"
        )}>
          <button 
             onClick={() => onReply(msg)}
             className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-white"
             title="Responder"
          >
             <Reply className="w-3 h-3" />
          </button>
          <div className="w-px h-3 bg-white/10 mx-0.5" />
          {["❤️", "🔥", "😂", "😮", "💸"].map(emoji => (
            <button 
              key={emoji}
              onClick={() => onReaction(msg.id, emoji)}
              className={cn(
                "w-6 h-6 flex items-center justify-center hover:bg-white/10 rounded transition-colors text-sm",
                msg.userReaction === emoji && "bg-white/10"
              )}
            >
              {emoji}
            </button>
          ))}
          <div className="w-px h-3 bg-white/10 mx-0.5" />
          
          {/* Admin Actions */}
          {isAdmin && currentUser.id !== msg.user.id && (
            <div className="relative">
              <button 
                onClick={() => setShowAdminMenu(!showAdminMenu)}
                className="p-1 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300"
                title="Ações de Admin"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
              
              {showAdminMenu && (
                <div className="absolute right-0 top-full mt-1 bg-[#1A1D29] border border-white/10 rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                  <button 
                    onClick={() => {
                      onAdminAction?.('delete', msg);
                      setShowAdminMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-left hover:bg-white/5 flex items-center gap-2 text-muted-foreground hover:text-white"
                  >
                    <Trash2 className="w-3 h-3" /> Apagar mensagem
                  </button>
                  <button 
                    onClick={() => {
                      onAdminAction?.('mute', msg);
                      setShowAdminMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-left hover:bg-white/5 flex items-center gap-2 text-orange-400 hover:text-orange-300"
                  >
                    <VolumeOff className="w-3 h-3" /> Mutar usuário
                  </button>
                  <button 
                    onClick={() => {
                      onAdminAction?.('ban', msg);
                      setShowAdminMenu(false);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-left hover:bg-white/5 flex items-center gap-2 text-red-400 hover:text-red-300"
                  >
                    <Ban className="w-3 h-3" /> Banir usuário
                  </button>
                </div>
              )}
            </div>
          )}
          
          {!isAdmin && (
            <button className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-white">
              <MoreVertical className="w-3 h-3" />
            </button>
          )}
        </div>

        {msg.type === 'win' ? (
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center justify-center shrink-0">
              <Crown className="w-5 h-5 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                 <span 
                   className="text-sm font-bold text-white hover:underline cursor-pointer"
                   onClick={() => setSelectedUser(msg.user)}
                 >
                   {msg.user.username}
                 </span>
                 <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-bold font-mono">
                   {msg.meta?.multiplier}x
                 </span>
              </div>
              <div className="text-xs text-muted-foreground truncate">
                ganhou <span className="text-green-400 font-bold font-mono">R${formatCurrency(msg.meta?.amount || 0)}</span> no <span className="text-white">{msg.meta?.game}</span>
              </div>
            </div>
          </div>
        ) : msg.type === 'casino_bet' ? (
          <div className="flex items-start gap-3 p-2 bg-[#252836]/30 border border-white/5 rounded-lg group hover:bg-[#252836] transition-colors">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg border border-white/10 shrink-0 cursor-pointer overflow-hidden relative"
              style={{
                background: `linear-gradient(135deg, ${msg.user.color}20, ${msg.user.color}05)`,
                color: msg.user.color
              }}
              onClick={() => setSelectedUser(msg.user)}
            >
              <div className="absolute inset-0 bg-white/5 opacity-50" />
              <span className="relative z-10">{msg.user.username.charAt(0).toUpperCase()}</span>
            </div>

            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                 <span 
                   className="text-[13px] font-bold hover:underline cursor-pointer"
                   style={{ color: msg.user.color }}
                   onClick={() => setSelectedUser(msg.user)}
                 >
                   {msg.user.username}
                 </span>
                 <div className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center justify-center shadow-sm select-none",
                    getLevelStyle(msg.user.level)
                  )}>
                  {msg.user.level}
                </div>
                {getRankBadge(msg.user.rank, msg.user.role)}
                {showTimestamps && (
                  <span className="text-[10px] text-muted-foreground/40 font-mono ml-auto">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
               </div>

               <div className="text-[13px] text-white leading-tight">
                  Ganhou <span className="text-[#00E701] font-bold">R$ {formatCurrency(msg.meta?.amount || 0)}</span> no <span className="font-medium text-white/90">{msg.meta?.game}</span>
               </div>

               <div className="flex items-center gap-2 mt-2">
                 <div className="flex items-center gap-1 bg-[#00E701]/10 px-2 py-0.5 rounded border border-[#00E701]/20">
                   <span className="text-[10px] font-bold text-[#00E701] font-mono">{msg.meta?.multiplier}x</span>
                 </div>
                 
                 {msg.meta?.isBonusBuy && (
                   <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                     <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Bonus Buy</span>
                   </div>
                 )}

                 <Button size="sm" variant="ghost" className="h-5 ml-auto px-2 text-[10px] text-muted-foreground hover:text-white hover:bg-white/5 gap-1">
                    <Play className="w-3 h-3 fill-current text-orange-500" /> <span className="text-orange-500 font-bold">Jogar</span>
                 </Button>
               </div>
            </div>
          </div>
        ) : msg.type === 'rain' ? (
          <div className="flex flex-col items-center justify-center p-3 my-2 bg-blue-500/5 border border-blue-500/20 rounded-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <div className="flex items-center gap-2 z-10">
              <Gift className="w-4 h-4 text-blue-400 animate-bounce" />
              <span className="text-xs font-bold text-blue-100 uppercase tracking-widest">Chuva de Prêmios</span>
              <Gift className="w-4 h-4 text-blue-400 animate-bounce delay-75" />
            </div>
            <p className="text-[11px] text-blue-200/80 mt-1 text-center max-w-[90%] z-10">{msg.content}</p>
            <Button size="sm" className="h-6 mt-2 bg-blue-500 text-white hover:bg-blue-600 text-[10px] w-full max-w-[120px]">
              Resgatar
            </Button>
          </div>
        ) : (
          <div className={cn(
            "flex items-start gap-3 p-1.5 -mx-1.5 rounded-lg transition-all",
            msg.content.includes(`@${currentUser.username}`) && "bg-amber-500/10 border border-amber-500/20 shadow-[inset_4px_0_0_0_#f59e0b]",
            currentUser.id === msg.user.id && "flex-row-reverse bg-[#252836]/50"
          )}>
            {!compactMode && (
              <div className="mt-0.5 flex flex-col items-center gap-1 shrink-0">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg border border-white/10 transition-all group-hover:scale-105 group-hover:rotate-3 select-none relative overflow-hidden cursor-pointer"
                  style={{
                    background: `linear-gradient(135deg, ${msg.user.color}20, ${msg.user.color}05)`,
                    color: msg.user.color,
                    boxShadow: `0 4px 12px -2px ${msg.user.color}20`
                  }}
                  onClick={() => setSelectedUser(msg.user)}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-50" />
                  <span className="relative z-10 drop-shadow-sm font-display tracking-wide">
                    {msg.user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className={cn(
                "flex items-center gap-2 mb-0.5 flex-wrap",
                currentUser.id === msg.user.id && "flex-row-reverse"
              )}>
                <span 
                  className="text-[13px] font-bold hover:underline cursor-pointer transition-colors"
                  style={{ color: msg.user.color }}
                  onClick={() => setSelectedUser(msg.user)}
                >
                  {msg.user.username}
                </span>

                <div 
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-bold border flex items-center justify-center shadow-sm select-none cursor-help",
                    getLevelStyle(msg.user.level)
                  )}
                  title={`Level ${msg.user.level}`}
                >
                  {msg.user.level}
                </div>

                {getRankBadge(msg.user.rank, msg.user.role)}
                
                {showTimestamps && (
                  <span className="text-[10px] text-muted-foreground/30 font-mono ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              
              {msg.replyTo && (
                <div className={cn(
                  "mb-1 flex items-center gap-2 border-l-2 border-white/10",
                  currentUser.id === msg.user.id ? "pr-2 border-l-0 border-r-2 justify-end text-right" : "pl-2"
                )}>
                  <div className="text-[10px] text-muted-foreground/50 truncate max-w-[200px]">
                    <span className="font-bold text-muted-foreground/70 mr-1">{msg.replyTo.username}:</span>
                    {msg.replyTo.content}
                  </div>
                </div>
              )}

              {(() => {
                const winInfo = parseCasinoWinMessage(msg.content);
                if (winInfo) {
                  return (
                    <div className="space-y-2">
                      <div className={cn(
                        "text-[13px] text-gray-300 font-medium leading-normal break-words",
                        currentUser.id === msg.user.id && "text-right"
                      )}>
                        Ganhou <span className="text-[#00E701] font-bold">R$ {formatCurrency(winInfo.amount)}</span> no <span className="text-white font-medium">{winInfo.gameName}</span>
                        {winInfo.multiplier && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#00E701]/10 text-[#00E701] border border-[#00E701]/20 font-bold font-mono">
                            {winInfo.multiplier.toFixed(2)}x
                          </span>
                        )}
                      </div>
                      {winInfo.gameUrl && (
                        <Link href={winInfo.gameUrl}>
                          <Button size="sm" variant="ghost" className="h-6 px-3 text-[11px] text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 gap-1.5 border border-orange-500/20">
                            <Play className="w-3 h-3 fill-current" /> Jogar
                          </Button>
                        </Link>
                      )}
                    </div>
                  );
                }
                return (
                  <div className={cn(
                    "text-[13px] text-gray-300 font-medium leading-normal break-words shadow-sm",
                    currentUser.id === msg.user.id && "text-right"
                  )}>
                    {msg.content}
                  </div>
                );
              })()}

              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div className={cn(
                  "flex flex-wrap gap-1 mt-1.5",
                  currentUser.id === msg.user.id && "justify-end"
                )}>
                  {Object.entries(msg.reactions).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => onReaction(msg.id, emoji)}
                      className={cn(
                        "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors border",
                        msg.userReaction === emoji 
                          ? "bg-blue-500/20 text-blue-200 border-blue-500/30 hover:bg-blue-500/30" 
                          : "bg-[#252836] text-muted-foreground border-white/5 hover:border-white/10 hover:bg-[#2D3142]"
                      )}
                    >
                      <span>{emoji}</span>
                      <span>{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        </motion.div>
    </motion.div>
  );
}

// --- User Stats Fetch ---
async function fetchUserStats(userId: string): Promise<UserStats | null> {
  try {
    const auth = getStoredAuth();
    const res = await fetch(`/api/user/${userId}/stats`, {
      headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
      credentials: 'include'
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

// --- Main Chat Widget ---
interface ChatWidgetProps {
  className?: string;
  onClose?: () => void;
}

export function ChatWidget({ className, onClose }: ChatWidgetProps) {
  const [inputValue, setInputValue] = useState("");
  const [activeTab, setActiveTab] = useState<'global' | 'highrollers' | 'casino'>('global');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'wins' | 'stats'>('overview');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [highRollerError, setHighRollerError] = useState<string | null>(null);
  
  const { openLogin, openRegister } = useAuthModal();
  const { isAuthenticated } = useAuth();
  
  const chatIsConnected = useChatStore((s) => s.isConnected);
  const chatOnlineCount = useChatStore((s) => s.onlineCount);
  const chatRooms = useChatStore((s) => s.rooms);
  const chatCurrentRoomId = useChatStore((s) => s.currentRoomId);
  const chatMessages = useChatStore((s) => s.messages);
  const chatMyUserId = useChatStore((s) => s.myUserId);
  const chatMyUserName = useChatStore((s) => s.myUserName);
  const chatMyRole = useChatStore((s) => s.myRole);
  const chatMyLevel = useChatStore((s) => s.myLevel);
  const chatMyVipLevel = useChatStore((s) => s.myVipLevel);
  const chatIsAdmin = useChatStore((s) => s.isAdmin);
  const chatJoinRoom = useChatStore((s) => s.joinRoom);
  const chatSendMessage = useChatStore((s) => s.sendMessage);
  const chatAdminDeleteMessage = useChatStore((s) => s.adminDeleteMessage);
  const chatAdminMuteUser = useChatStore((s) => s.adminMuteUser);
  const chatAdminBanUser = useChatStore((s) => s.adminBanUser);
  const chatConnect = useChatStore((s) => s.connect);
  const chatGetRoomOnlineCount = useChatStore((s) => s.getRoomOnlineCount);
  
  const accessToken = getStoredAuth().accessToken;
  const isConnected = chatIsConnected;
  const isAdmin = chatIsAdmin;
  const userLevel = chatMyLevel;
  
  const currentUser: User | null = chatMyUserId ? {
    id: chatMyUserId,
    username: chatMyUserName || 'Jogador',
    rank: mapVipToRank(chatMyVipLevel, chatIsAdmin, chatMyRole),
    level: chatMyLevel,
    color: getUserColor(chatMyUserId),
    role: chatMyRole
  } : null;
  
  const messages: Message[] = useMemo(() => {
    const roomId = chatCurrentRoomId || 'global';
    const storeMessages = chatMessages.get(roomId) || [];
    return storeMessages.map((m: StoreChatMessage) => ({
      id: m.id,
      user: {
        id: m.user.id,
        username: m.user.name,
        rank: mapVipToRank(m.user.vipLevel, m.user.role === 'ADMIN', m.user.role),
        level: m.user.level || 1,
        color: getUserColor(m.user.id),
        role: m.user.role
      },
      content: m.message,
      timestamp: new Date(m.createdAt),
      type: 'chat' as const,
      reactions: {},
      replyTo: m.replyTo
    }));
  }, [chatMessages, chatCurrentRoomId]);
  
  useEffect(() => {
    if (isAuthenticated && !chatIsConnected) {
      chatConnect();
    }
  }, [isAuthenticated, chatIsConnected, chatConnect]);
  
  useEffect(() => {
    if (chatIsConnected && chatRooms.length > 0 && !chatCurrentRoomId) {
      const roomId = activeTab === 'highrollers' ? 'highrollers' : activeTab === 'casino' ? 'casino' : 'global';
      chatJoinRoom(roomId);
    }
  }, [chatIsConnected, chatRooms, chatCurrentRoomId, activeTab, chatJoinRoom]);
  
  // Settings state
  const [chatSettings, setChatSettings] = useState<ChatSettings>(() => {
    try {
      const saved = localStorage.getItem('chat_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messageAudioRef = useRef<HTMLAudioElement | null>(null);
  const mentionAudioRef = useRef<HTMLAudioElement | null>(null);
  const prevMessageCountRef = useRef<number>(0);
  
  const [unauthOnlineCount, setUnauthOnlineCount] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      const fetchOnlineCount = async () => {
        try {
          const res = await fetch('/api/chat/online-count');
          if (res.ok) {
            const data = await res.json();
            setUnauthOnlineCount(data.count || 0);
          }
        } catch {}
      };
      fetchOnlineCount();
      const interval = setInterval(fetchOnlineCount, 30000);
      return () => clearInterval(interval);
    }
  }, [accessToken]);
  
  const roomOnlineCount = useMemo(() => {
    if (!chatCurrentRoomId) return chatOnlineCount;
    return chatGetRoomOnlineCount(chatCurrentRoomId);
  }, [chatCurrentRoomId, chatOnlineCount, chatGetRoomOnlineCount]);
  
  const displayOnlineCount = accessToken ? roomOnlineCount : unauthOnlineCount;

  // Initialize audio elements
  useEffect(() => {
    messageAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    messageAudioRef.current.volume = 0.3;
    mentionAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3');
    mentionAudioRef.current.volume = 0.5;
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('chat_settings', JSON.stringify(chatSettings));
  }, [chatSettings]);

  const updateSetting = (key: keyof ChatSettings, value: boolean) => {
    setChatSettings(prev => ({ ...prev, [key]: value }));
  };

  // Play sound for new messages
  const playMessageSound = useCallback((isMention: boolean = false) => {
    if (!chatSettings.soundEnabled) return;
    try {
      if (isMention && mentionAudioRef.current) {
        mentionAudioRef.current.currentTime = 0;
        mentionAudioRef.current.play().catch(() => {});
      } else if (messageAudioRef.current) {
        messageAudioRef.current.currentTime = 0;
        messageAudioRef.current.play().catch(() => {});
      }
    } catch {}
  }, [chatSettings.soundEnabled]);

  // Fetch user stats when profile is opened
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['user-stats', selectedUser?.id],
    queryFn: () => selectedUser ? fetchUserStats(selectedUser.id) : null,
    enabled: !!selectedUser,
  });

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addEmoji = (emoji: string) => {
    setInputValue(prev => prev + emoji);
  };

  const handleAdminAction = useCallback((action: 'ban' | 'mute' | 'delete', msg: Message) => {
    if (!isConnected) return;
    
    switch (action) {
      case 'delete':
        chatAdminDeleteMessage(msg.id);
        toast.success('Mensagem apagada');
        break;
      case 'mute':
        chatAdminMuteUser(msg.user.id, 5);
        toast.success(`${msg.user.username} foi mutado por 5 minutos`);
        break;
      case 'ban':
        chatAdminBanUser(msg.user.id, 'Banned from chat');
        toast.success(`${msg.user.username} foi banido do chat`);
        break;
    }
  }, [isConnected, chatAdminDeleteMessage, chatAdminMuteUser, chatAdminBanUser]);

  const handleTabChange = useCallback((tab: 'global' | 'highrollers' | 'casino') => {
    if (tab === 'highrollers' && userLevel < 50) {
      setHighRollerError('Você precisa ser Nível 50+ para acessar a sala High Rollers');
      return;
    }
    setHighRollerError(null);
    setActiveTab(tab);
    
    if (isConnected) {
      let roomId = 'global';
      if (tab === 'highrollers') roomId = 'highrollers';
      else if (tab === 'casino') roomId = 'casino';
      chatJoinRoom(roomId);
    }
  }, [userLevel, isConnected, chatJoinRoom]);

  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      const isNewMessage = messages.length > 0;
      const lastMessage = messages[messages.length - 1];
      const isOwnMessage = lastMessage?.user?.id === currentUser?.id;
      
      if (isNewMessage && !isOwnMessage && prevMessageCountRef.current > 0) {
        const isMention = currentUser?.username && lastMessage?.content?.includes(`@${currentUser.username}`);
        playMessageSound(!!isMention);
      }
    }
    prevMessageCountRef.current = messages.length;
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages, currentUser, playMessageSound]);

  const sendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !isConnected) return;

    const replyToData = replyingTo ? {
      id: replyingTo.id,
      username: replyingTo.user.username,
      content: replyingTo.content.substring(0, 100)
    } : undefined;

    chatSendMessage(inputValue.trim(), replyToData);
    setInputValue("");
    setReplyingTo(null);
  }, [inputValue, isConnected, replyingTo, chatSendMessage]);

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
  };

  const handleReaction = useCallback((_messageId: string, _emoji: string) => {
    // Reações ainda não implementadas no WebSocket - funcionalidade futura
  }, []);

  // If not authenticated, show login prompt
  if (!accessToken) {
    return (
      <div className={cn("flex flex-col h-full bg-gradient-to-b from-[#13151C] to-[#0D0F14] rounded-xl border border-white/5 overflow-hidden", className)}>
        <style>{animationStyles}</style>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0F1115]/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-white">Chat ao Vivo</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="p-1 text-muted-foreground hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Unauthenticated State - Redesigned */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 flex items-center justify-center mb-6 shadow-xl">
            <MessageSquare className="w-10 h-10 text-orange-500" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">
            Junte-se à Conversa!
          </h3>
          
          <p className="text-sm text-muted-foreground mb-6 max-w-[280px] leading-relaxed">
            Faça login para participar do chat ao vivo, trocar ideias com outros jogadores e acompanhar as grandes vitórias em tempo real.
          </p>
          
          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            <Button 
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/25"
              onClick={openLogin}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Fazer Login
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full border-white/10 text-muted-foreground hover:text-white hover:bg-white/5"
              onClick={openRegister}
            >
              <Star className="w-4 h-4 mr-2" />
              Criar Conta
            </Button>
          </div>
          
          <div className="mt-8 flex items-center gap-4 text-xs text-muted-foreground/50">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{displayOnlineCount} online</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Chat ao vivo</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-gradient-to-b from-[#13151C] to-[#0D0F14] rounded-xl border border-white/5 overflow-hidden relative", className)}>
      <style>{animationStyles}</style>
      
      {/* --- Header --- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0F1115]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#13151C] animate-pulse" />
          </div>
          <span className="font-bold text-white">Chat</span>
          <div className="flex items-center gap-1 ml-2 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span className="font-mono">{displayOnlineCount}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-muted-foreground hover:text-white rounded-full hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-white rounded-full hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* --- Tabs --- */}
      <div className="flex gap-1 px-2 py-2 border-b border-white/5 bg-[#0F1115]/50">
        <button
          onClick={() => handleTabChange('global')}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all",
            activeTab === 'global' 
              ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" 
              : "text-muted-foreground hover:text-white hover:bg-white/5"
          )}
        >
          <Gamepad2 className="w-3 h-3 inline mr-1" />
          Global
        </button>
        <button
          onClick={() => handleTabChange('highrollers')}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all relative",
            activeTab === 'highrollers' 
              ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" 
              : "text-muted-foreground hover:text-white hover:bg-white/5",
            userLevel < 50 && "opacity-70"
          )}
        >
          <Crown className="w-3 h-3 inline mr-1" />
          High Rollers
          {userLevel < 50 && <Lock className="w-2.5 h-2.5 inline ml-1 text-muted-foreground" />}
        </button>
        <button
          onClick={() => handleTabChange('casino')}
          className={cn(
            "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all",
            activeTab === 'casino' 
              ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" 
              : "text-muted-foreground hover:text-white hover:bg-white/5"
          )}
        >
          <Gift className="w-3 h-3 inline mr-1" />
          Casino
        </button>
      </div>

      {/* High Roller Error Banner */}
      {highRollerError && (
        <div className="mx-2 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-400 text-xs">
            <Lock className="w-4 h-4" />
            <span>{highRollerError}</span>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Seu nível atual: <span className="font-bold text-white">{userLevel}</span> | Nível necessário: <span className="font-bold text-yellow-400">50</span>
          </div>
        </div>
      )}

      {/* --- Messages --- */}
      <ScrollArea ref={scrollRef} className="flex-1 px-2 py-2">
        <div className="space-y-0.5">
          {messages.map((msg) => (
            <DraggableMessageItem 
              key={msg.id}
              msg={msg}
              currentUser={currentUser || { id: '', username: '', rank: 'user', level: 1, color: '#fff' }}
              onReply={handleReply}
              onReaction={handleReaction}
              setSelectedUser={setSelectedUser}
              isAdmin={isAdmin}
              onAdminAction={handleAdminAction}
              showTimestamps={chatSettings.showTimestamps}
              compactMode={chatSettings.compactMode}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* --- User Profile Modal --- */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#13151C] border border-white/10 rounded-xl shadow-2xl w-full max-w-xs overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile Header */}
              <div className="relative h-24 bg-gradient-to-br from-orange-500/20 via-amber-500/10 to-transparent">
                <div className="absolute -bottom-8 left-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-xl border-4 border-[#13151C]"
                    style={{ 
                      background: `linear-gradient(135deg, ${selectedUser.color}40, ${selectedUser.color}10)`,
                      color: selectedUser.color
                    }}
                  >
                    {selectedUser.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="absolute top-2 right-2 p-1.5 bg-black/30 hover:bg-black/50 rounded-full text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Profile Info */}
              <div className="pt-10 px-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-bold" style={{ color: selectedUser.color }}>
                    {selectedUser.username}
                  </h3>
                  {getRankBadge(selectedUser.rank, selectedUser.role)}
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                  <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold",
                    getLevelStyle(selectedUser.level)
                  )}>
                    Nível {selectedUser.level}
                  </div>
                </div>

                {/* Stats Tabs */}
                <div className="flex gap-1 mb-4">
                  {(['overview', 'wins', 'stats'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setProfileTab(tab)}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-bold rounded transition-all",
                        profileTab === tab 
                          ? "bg-white/10 text-white" 
                          : "text-muted-foreground hover:text-white hover:bg-white/5"
                      )}
                    >
                      {tab === 'overview' ? 'Visão Geral' : tab === 'wins' ? 'Vitórias' : 'Stats'}
                    </button>
                  ))}
                </div>

                {/* Stats Content */}
                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  </div>
                ) : userStats ? (
                  <div className="space-y-3">
                    {profileTab === 'overview' && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-[10px] text-muted-foreground uppercase">Total Apostado</div>
                            <div className="text-sm font-bold text-white">R$ {formatCurrency(userStats.totalWagered)}</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="text-[10px] text-muted-foreground uppercase">Ganhos</div>
                            <div className="text-sm font-bold text-green-400">R$ {formatCurrency(userStats.totalWins)}</div>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3">
                          <div className="text-[10px] text-muted-foreground uppercase mb-1">Jogo Favorito</div>
                          <div className="flex items-center gap-2">
                            <Gamepad2 className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-bold text-white">{userStats.favoriteGame}</span>
                            <span className="text-xs text-muted-foreground ml-auto">{userStats.favoriteGameRounds} partidas</span>
                          </div>
                        </div>
                      </>
                    )}
                    {profileTab === 'wins' && userStats.recentWins && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {userStats.recentWins.map((win, i) => (
                          <div key={i} className="flex items-center gap-2 bg-white/5 rounded-lg p-2">
                            <div className="text-sm font-bold text-green-400">R$ {formatCurrency(win.amount)}</div>
                            <div className="text-[10px] text-yellow-500 font-mono">{win.multiplier}x</div>
                            <div className="text-xs text-muted-foreground ml-auto">{win.game}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {profileTab === 'stats' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-xs text-muted-foreground">Total de Jogos</span>
                          <span className="text-sm font-bold text-white">{userStats.totalGames}</span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                          <span className="text-xs text-muted-foreground">Ranking</span>
                          <span className="text-sm font-bold text-orange-500">#{userStats.ranking}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Estatísticas não disponíveis
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Input Area --- */}
      <div className="p-3 border-t border-white/5 bg-[#0F1115]/80">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="mb-2 flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
            <CornerDownRight className="w-3 h-3 text-orange-500" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-orange-500 font-bold">Respondendo a {replyingTo.user.username}</span>
              <p className="text-[11px] text-muted-foreground truncate">{replyingTo.content}</p>
            </div>
            <button 
              onClick={() => setReplyingTo(null)}
              className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        <form onSubmit={sendMessage} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="w-full bg-[#1A1D29] border-white/5 rounded-xl h-10 pr-10 text-sm placeholder:text-muted-foreground/50 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20"
              disabled={!isConnected}
            />
          </div>
          
          <div className="relative" ref={emojiPickerRef}>
             <Button
               type="button"
               size="icon"
               variant="ghost"
               onClick={() => setShowEmojiPicker(!showEmojiPicker)}
               className="h-9 w-9 text-muted-foreground hover:text-yellow-400"
             >
               <Smile className="w-4 h-4" />
             </Button>
             
             <AnimatePresence>
               {showEmojiPicker && (
                 <motion.div
                   initial={{ opacity: 0, y: 10, scale: 0.95 }}
                   animate={{ opacity: 1, y: 0, scale: 1 }}
                   exit={{ opacity: 0, y: 10, scale: 0.95 }}
                   className="absolute bottom-12 right-0 w-64 bg-[#1A1D29] border border-white/10 rounded-xl shadow-2xl p-2 z-50 overflow-hidden"
                 >
                   <div className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 mb-1">Emojis</div>
                   <div className="grid grid-cols-6 gap-1 h-48 overflow-y-auto pr-1">
                     {["😀","😃","😄","😁","😆","😅","😂","🤣","🥲","🥹","☺️","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥸","🤩","🥳","😏","😒","🔥","❤️","💰","💸","🎰","🎲","🃏","♠️","♥️","♦️","♣️","🎯","🎮","🕹️","🏆","🥇","👍","👎","👊","✊","🤞","✌️","🤟","🤘","👌","👏","🙌","💪"].map(emoji => (
                       <button
                         key={emoji}
                         type="button"
                         onClick={() => addEmoji(emoji)}
                         className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-lg transition-colors"
                       >
                         {emoji}
                       </button>
                     ))}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           
           <div className="w-px h-6 bg-white/10 mx-1" />
           <Button 
             type="submit" 
             size="icon" 
             disabled={!inputValue.trim() || !isConnected}
             className={cn(
               "h-9 w-9 rounded-lg transition-all",
               inputValue.trim() 
                 ? "bg-orange-500 text-white hover:bg-orange-600 shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
                 : "bg-[#2A2E3B] text-muted-foreground"
             )}
           >
             <Send className="w-4 h-4" />
           </Button>
        </form>
        
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex items-center gap-3">
             {isAdmin && (
               <button className="text-[10px] font-semibold text-muted-foreground hover:text-white transition-colors flex items-center gap-1">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                 Admin
               </button>
             )}
             <button 
               className="text-[10px] font-semibold text-muted-foreground hover:text-orange-500 transition-colors"
               onClick={() => setShowRules(true)}
             >
               Regras do Chat
             </button>
          </div>
          <span className="text-[10px] text-muted-foreground/50">Slow mode: 2s</span>
        </div>
      </div>

      {/* --- Rules Modal --- */}
      {showRules && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#13151C] border border-white/10 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden relative max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0F1115]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-orange-500" /> Regras do Chat
              </h3>
              <button 
                onClick={() => setShowRules(false)}
                className="p-1.5 text-muted-foreground hover:text-white rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 text-sm text-gray-300">
                <p className="text-white/60 text-xs italic">
                  Para manter nossa comunidade divertida e segura, siga estas regras.
                </p>
                
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <span className="bg-red-500/10 text-red-400 font-bold h-6 w-6 rounded flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase mb-0.5">Sem mendigar</h4>
                      <p className="text-xs leading-relaxed">Não peça dinheiro, empréstimos ou gorjetas.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <span className="bg-red-500/10 text-red-400 font-bold h-6 w-6 rounded flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase mb-0.5">Respeito acima de tudo</h4>
                      <p className="text-xs leading-relaxed">Sem racismo, sexismo ou discurso de ódio.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="bg-red-500/10 text-red-400 font-bold h-6 w-6 rounded flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase mb-0.5">Sem Spam ou Promoção</h4>
                      <p className="text-xs leading-relaxed">Não divulgue links externos ou outros sites.</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="bg-red-500/10 text-red-400 font-bold h-6 w-6 rounded flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase mb-0.5">Proteja seus dados</h4>
                      <p className="text-xs leading-relaxed">Nunca compartilhe senhas ou dados pessoais.</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            
            <div className="p-4 border-t border-white/5 bg-[#0F1115]">
              <Button onClick={() => setShowRules(false)} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold">
                Entendi e Concordo
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* --- Settings Modal --- */}
      {showSettings && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#13151C] border border-white/10 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden relative">
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#0F1115]">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-orange-500" /> Configurações
              </h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-1.5 text-muted-foreground hover:text-white rounded-full hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {chatSettings.soundEnabled ? <Volume2 className="w-4 h-4 text-orange-500" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <div className="text-sm font-bold text-white">Sons do Chat</div>
                    <div className="text-xs text-muted-foreground">Notificar novas mensagens</div>
                  </div>
                </div>
                <Switch 
                  checked={chatSettings.soundEnabled}
                  onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {chatSettings.notificationsEnabled ? <Bell className="w-4 h-4 text-orange-500" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <div className="text-sm font-bold text-white">Notificações</div>
                    <div className="text-xs text-muted-foreground">Alertas de menções</div>
                  </div>
                </div>
                <Switch 
                  checked={chatSettings.notificationsEnabled}
                  onCheckedChange={(checked) => updateSetting('notificationsEnabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-bold text-white">Mostrar Horário</div>
                    <div className="text-xs text-muted-foreground">Exibir timestamps nas mensagens</div>
                  </div>
                </div>
                <Switch 
                  checked={chatSettings.showTimestamps}
                  onCheckedChange={(checked) => updateSetting('showTimestamps', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-bold text-white">Modo Compacto</div>
                    <div className="text-xs text-muted-foreground">Menos espaço entre mensagens</div>
                  </div>
                </div>
                <Switch 
                  checked={chatSettings.compactMode}
                  onCheckedChange={(checked) => updateSetting('compactMode', checked)}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-[#0F1115]">
              <Button 
                onClick={() => setShowSettings(false)} 
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
              >
                Salvar Configurações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatWidget;
