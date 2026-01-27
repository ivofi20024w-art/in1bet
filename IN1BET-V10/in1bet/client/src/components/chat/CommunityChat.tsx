import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { 
  Send, Users, Crown, Shield, ShieldCheck, Headphones, HelpCircle,
  Flag, Smile, MoreHorizontal, Mic, Paperclip, ArrowLeft, ChevronUp, ChevronDown,
  Reply, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { getStoredAuth } from "@/lib/auth";
import { useChatStore, type ChatMessage as StoreChatMessage, type TypingUser as StoreTypingUser } from "@/stores/chatStore";

interface ChatRoom {
  id: string;
  name: string;
  displayName: string;
  type: string;
  gameType: string | null;
  minVipLevel: string | null;
}

interface ChatUserCustomization {
  nameColor?: string;
  nameEffect?: string;
  messageColor?: string;
}

interface ChatUser {
  id: string;
  username?: string;
  name: string;
  vipLevel: string;
  level: number;
  role?: string;
  avatarUrl?: string | null;
  customization?: ChatUserCustomization | null;
}

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: ChatUser;
}

interface TypingUser {
  userId: string;
  userName: string;
}

interface CommunityChatProps {
  isVisible: boolean;
  onToggle: () => void;
}

const VIP_COLORS: Record<string, string> = {
  bronze: "text-orange-400",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  platinum: "text-cyan-400",
  diamond: "text-purple-400",
};

const VIP_BADGE_COLORS: Record<string, string> = {
  bronze: "bg-orange-900/50 text-orange-400 border-orange-500/30",
  silver: "bg-gray-800/50 text-gray-300 border-gray-500/30",
  gold: "bg-yellow-900/50 text-yellow-400 border-yellow-500/30",
  platinum: "bg-cyan-900/50 text-cyan-400 border-cyan-500/30",
  diamond: "bg-purple-900/50 text-purple-400 border-purple-500/30",
};

const ROLE_BADGES: Record<string, { icon: React.ReactNode; label: string; color: string; animation?: string }> = {
  ADMIN: { icon: <ShieldCheck className="h-3 w-3" />, label: "Admin", color: "bg-gradient-to-r from-red-900/50 to-red-700/50 text-red-400 border-red-500/50 shadow-red-500/20 shadow-[0_0_8px]", animation: "animate-pulse" },
  SUPPORT: { icon: <Headphones className="h-3 w-3" />, label: "Suporte", color: "bg-gradient-to-r from-blue-900/50 to-blue-700/50 text-blue-400 border-blue-500/50 shadow-blue-500/20 shadow-[0_0_8px]", animation: "animate-pulse" },
  INFLUENCER: { icon: <Crown className="h-3 w-3" />, label: "Influencer", color: "bg-gradient-to-r from-purple-900/50 to-pink-700/50 text-purple-400 border-purple-500/50 shadow-purple-500/20 shadow-[0_0_8px]", animation: "animate-pulse" },
  CHAT_MODERATOR: { icon: <Shield className="h-3 w-3" />, label: "Mod", color: "bg-gradient-to-r from-green-900/50 to-green-700/50 text-green-400 border-green-500/50 shadow-green-500/20 shadow-[0_0_8px]", animation: "animate-pulse" },
  HELPER: { icon: <HelpCircle className="h-3 w-3" />, label: "Helper", color: "bg-gradient-to-r from-yellow-900/50 to-yellow-700/50 text-yellow-400 border-yellow-500/50 shadow-yellow-500/20 shadow-[0_0_8px]", animation: "animate-pulse" },
};

const NAME_EFFECTS: Record<string, string> = {
  glow: "animate-pulse drop-shadow-[0_0_8px_currentColor]",
  rainbow: "effect-rainbow",
  italic: "italic",
  bold: "font-black",
  stars: "effect-stars",
  sparkles: "effect-sparkles",
  fire: "effect-fire",
  thunder: "effect-thunder",
  neon: "effect-neon",
  ice: "effect-ice",
  gold: "effect-gold",
  matrix: "effect-matrix",
  pulse: "effect-pulse",
  glitch: "effect-glitch",
  shadow: "effect-shadow",
  cosmic: "effect-cosmic",
  toxic: "effect-toxic",
  blood: "effect-blood",
  diamond: "effect-diamond",
};

const EMOJI_CATEGORIES = [
  { name: "Sorrisos", emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥"] },
  { name: "Gestos", emojis: ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🦾", "🙏", "🤝", "👏", "🙌"] },
  { name: "Jogos", emojis: ["🎰", "🎲", "🃏", "♠️", "♥️", "♦️", "♣️", "🎯", "🎮", "🕹️", "🎳", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🥊", "⛳", "🏆", "🥇", "🥈", "🥉", "🏅", "💰", "💵", "💸", "💳", "🤑"] },
  { name: "Celebração", emojis: ["🎉", "🎊", "🎈", "🎁", "🎀", "🎆", "🎇", "✨", "🌟", "⭐", "💥", "🔥", "💫", "🎵", "🎶", "🎤", "🎧", "🥂", "🍾", "🍻", "🍺", "🥃", "🍷", "🍸", "🍹"] },
  { name: "Corações", emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💝", "💘", "💌"] },
];

function getNameColorClass(color?: string): string {
  if (!color) return "";
  const colorMap: Record<string, string> = {
    red: "text-red-400",
    orange: "text-orange-400",
    yellow: "text-yellow-400",
    green: "text-green-400",
    cyan: "text-cyan-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    pink: "text-pink-400",
    white: "text-white",
  };
  return colorMap[color] || "";
}

function getMessageColorClass(color?: string): string {
  if (!color) return "text-gray-300";
  const colorMap: Record<string, string> = {
    red: "text-red-300",
    orange: "text-orange-300",
    yellow: "text-yellow-300",
    green: "text-green-300",
    cyan: "text-cyan-300",
    blue: "text-blue-300",
    purple: "text-purple-300",
    pink: "text-pink-300",
    white: "text-white",
  };
  return colorMap[color] || "text-gray-300";
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getAvatarUrl(userId: string, userName: string): string {
  const colors = ['f97316', 'ef4444', '22c55e', '3b82f6', 'a855f7', 'ec4899'];
  const colorIndex = userId.charCodeAt(0) % colors.length;
  const initial = userName.charAt(0).toUpperCase();
  return `https://ui-avatars.com/api/?name=${initial}&background=${colors[colorIndex]}&color=fff&size=40&bold=true`;
}

interface ReplyTo {
  id: string;
  username: string;
  content: string;
}

export default function CommunityChat({ isVisible, onToggle }: CommunityChatProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(0);
  const [replyTo, setReplyTo] = useState<ReplyTo | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastTypingSentRef = useRef<number>(0);
  
  const auth = getStoredAuth();
  
  const chatIsConnected = useChatStore((s) => s.isConnected);
  const chatOnlineCount = useChatStore((s) => s.onlineCount);
  const chatRooms = useChatStore((s) => s.rooms);
  const chatCurrentRoomId = useChatStore((s) => s.currentRoomId);
  const chatMessages = useChatStore((s) => s.messages);
  const chatTypingUsers = useChatStore((s) => s.typingUsers);
  const chatBlockedUsers = useChatStore((s) => s.blockedUsers);
  const chatMyRole = useChatStore((s) => s.myRole);
  const chatMyLevel = useChatStore((s) => s.myLevel);
  const chatMyCustomization = useChatStore((s) => s.myCustomization);
  const chatJoinRoom = useChatStore((s) => s.joinRoom);
  const chatSendMessage = useChatStore((s) => s.sendMessage);
  const chatSendTyping = useChatStore((s) => s.sendTyping);
  const chatBlockUser = useChatStore((s) => s.blockUser);
  const chatConnect = useChatStore((s) => s.connect);
  const chatGetRoomOnlineCount = useChatStore((s) => s.getRoomOnlineCount);
  const chatReportMessage = useChatStore((s) => s.reportMessage);
  
  const isConnected = chatIsConnected;
  const rooms = chatRooms;
  const myRole = chatMyRole;
  const myLevel = chatMyLevel;
  const myCustomization = chatMyCustomization;
  const blockedUsers = chatBlockedUsers;
  
  const currentRoom = useMemo(() => {
    if (!chatCurrentRoomId || rooms.length === 0) return null;
    return rooms.find(r => r.id === chatCurrentRoomId) || null;
  }, [chatCurrentRoomId, rooms]);
  
  const messages: ChatMessage[] = useMemo(() => {
    const roomId = chatCurrentRoomId || 'global';
    const storeMessages = chatMessages.get(roomId) || [];
    return storeMessages.filter(m => !blockedUsers.includes(m.user.id));
  }, [chatMessages, chatCurrentRoomId, blockedUsers]);
  
  const typingUsers: TypingUser[] = useMemo(() => {
    const roomId = chatCurrentRoomId || 'global';
    return chatTypingUsers.get(roomId) || [];
  }, [chatTypingUsers, chatCurrentRoomId]);
  
  const roomOnlineCount = useMemo(() => {
    if (!chatCurrentRoomId) return chatOnlineCount;
    return chatGetRoomOnlineCount(chatCurrentRoomId);
  }, [chatCurrentRoomId, chatOnlineCount, chatGetRoomOnlineCount]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);
  
  useEffect(() => {
    if (isVisible && auth.accessToken && !chatIsConnected) {
      chatConnect();
    }
  }, [isVisible, auth.accessToken, chatIsConnected, chatConnect]);
  
  useEffect(() => {
    if (chatIsConnected && chatRooms.length > 0 && !chatCurrentRoomId) {
      chatJoinRoom(chatRooms[0].id);
    }
  }, [chatIsConnected, chatRooms, chatCurrentRoomId, chatJoinRoom]);

  const sendTypingStatus = useCallback(() => {
    if (!isConnected) return;
    
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    
    lastTypingSentRef.current = now;
    chatSendTyping();
  }, [isConnected, chatSendTyping]);

  const sendMessage = useCallback(() => {
    if (!inputMessage.trim() || !isConnected) return;

    const replyToData = replyTo || undefined;
    chatSendMessage(inputMessage.trim(), replyToData);
    setInputMessage("");
    setReplyTo(null);
  }, [inputMessage, isConnected, replyTo, chatSendMessage]);

  const handleReply = (msg: ChatMessage) => {
    setReplyTo({
      id: msg.id,
      username: msg.user.username || msg.user.name,
      content: msg.message,
    });
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (e.target.value.length > 0) {
      sendTypingStatus();
    }
  };

  const blockUser = useCallback((userId: string) => {
    if (!isConnected) return;
    chatBlockUser(userId);
  }, [isConnected, chatBlockUser]);

  const reportMessage = useCallback((messageId: string, reason: string) => {
    chatReportMessage(messageId, reason);
    toast.success("Mensagem reportada");
  }, [chatReportMessage]);

  const renderVipBadge = (vipLevel: string) => {
    if (!vipLevel || vipLevel === "none") return null;
    const badgeColor = VIP_BADGE_COLORS[vipLevel] || VIP_BADGE_COLORS.bronze;
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
        {vipLevel.toUpperCase()}
      </span>
    );
  };

  const renderRoleBadge = (role?: string) => {
    if (!role || role === "NONE") return null;
    const badge = ROLE_BADGES[role];
    if (!badge) return null;
    
    return (
      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.color} ${badge.animation || ""}`}>
        {badge.icon}
        {badge.label}
      </span>
    );
  };

  const renderUserName = (user: ChatUser) => {
    const customColor = user.customization?.nameColor ? getNameColorClass(user.customization.nameColor) : "";
    const effectClass = user.customization?.nameEffect ? NAME_EFFECTS[user.customization.nameEffect] || "" : "";
    const defaultColor = VIP_COLORS[user.vipLevel] || "text-gray-300";
    
    return (
      <span className={`font-semibold text-sm ${customColor || defaultColor} ${effectClass}`}>
        {user.username || user.name}
      </span>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    const names = typingUsers.slice(0, 2).map(u => u.userName);
    let text = "";
    if (names.length === 1) {
      text = `${names[0]} está digitando...`;
    } else if (names.length === 2) {
      text = `${names[0]} e ${names[1]} estão digitando...`;
    } else {
      text = `${names.length} pessoas estão digitando...`;
    }

    return (
      <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
        {text}
      </div>
    );
  };

  if (!auth.accessToken) {
    return (
      <div className="flex flex-col h-full bg-[#0d0d12] border-l border-white/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Chat da Comunidade</span>
            <span className="text-primary">(0)</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-gray-400 text-sm text-center">Faça login para participar do chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#0d0d12] border-l border-white/10 shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0d0d12]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">Chat da Comunidade</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">{roomOnlineCount}</span>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#1a1a1f] border-white/10">
              <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white">
                Regras do chat
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-300 hover:text-white focus:text-white">
                Usuários bloqueados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8 text-gray-400 hover:text-white">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className="group flex gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors"
              data-testid={`chat-message-${msg.id}`}
            >
              <img 
                src={msg.user.avatarUrl || getAvatarUrl(msg.user.id, msg.user.username || msg.user.name)}
                alt={msg.user.username || msg.user.name}
                className="w-10 h-10 rounded-full flex-shrink-0 object-cover"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {renderRoleBadge(msg.user.role)}
                  {renderVipBadge(msg.user.vipLevel)}
                  {renderUserName(msg.user)}
                  <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className={`text-sm mt-1 break-words ${getMessageColorClass(msg.user.customization?.messageColor)}`}>
                  {msg.message}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white flex-shrink-0"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1f] border-white/10">
                  <DropdownMenuItem 
                    onClick={() => handleReply(msg)}
                    className="text-gray-300 hover:text-white focus:text-white"
                  >
                    <Reply className="h-3 w-3 mr-2" />
                    Responder
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => blockUser(msg.user.id)}
                    className="text-gray-300 hover:text-white focus:text-white"
                  >
                    Bloquear usuário
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => reportMessage(msg.id, "Conteúdo inadequado")}
                    className="text-red-400 hover:text-red-300 focus:text-red-300"
                  >
                    <Flag className="h-3 w-3 mr-2" />
                    Reportar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {renderTypingIndicator()}

      {replyTo && (
        <div className="px-3 py-2 border-t border-white/10 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="h-4 w-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-xs text-primary font-medium">Respondendo a {replyTo.username}</span>
              <p className="text-xs text-gray-400 truncate max-w-[200px]">{replyTo.content}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={cancelReply}
            className="h-6 w-6 text-gray-400 hover:text-white flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Input
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Digite sua mensagem..."
            maxLength={500}
            className="flex-1 h-10 bg-white/5 border-white/10 focus:border-primary/50 rounded-lg text-white placeholder:text-gray-500"
            disabled={!isConnected}
            data-testid="input-chat-message"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-gray-400 hover:text-white"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-gray-400 hover:text-white"
          >
            <Mic className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-400 hover:text-white"
                  data-testid="button-emoji-picker"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-0 bg-[#1a1a1f] border-white/10" 
                side="top" 
                align="start"
              >
                <div className="p-2 border-b border-white/10">
                  <div className="flex gap-1 overflow-x-auto scrollbar-none">
                    {EMOJI_CATEGORIES.map((cat, idx) => (
                      <button
                        key={cat.name}
                        onClick={() => setSelectedEmojiCategory(idx)}
                        className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                          selectedEmojiCategory === idx 
                            ? "bg-primary text-white" 
                            : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                  {EMOJI_CATEGORIES[selectedEmojiCategory].emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setInputMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-xl hover:bg-white/10 rounded transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-gray-400 hover:text-white"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>
          
          <Button
            onClick={sendMessage}
            disabled={!isConnected || !inputMessage.trim()}
            className="h-9 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg"
            data-testid="button-send-message"
          >
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
