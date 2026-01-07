import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, X, Send, Users, Crown, Shield, ShieldCheck, Headphones, HelpCircle,
  AlertTriangle, Flag, Smile, ChevronDown, Hash, Ban, UserX, Settings, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { getStoredAuth } from "@/lib/auth";

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
  name: string;
  vipLevel: string;
  level: number;
  role?: string;
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

const VIP_COLORS: Record<string, string> = {
  bronze: "text-orange-400",
  silver: "text-gray-300",
  gold: "text-yellow-400",
  platinum: "text-cyan-400",
  diamond: "text-purple-400",
};

const VIP_BADGES: Record<string, string> = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
  diamond: "👑",
};

const ROLE_BADGES: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  ADMIN: { icon: <ShieldCheck className="h-3 w-3" />, label: "Admin", color: "text-red-400 bg-red-900/30" },
  SUPPORT: { icon: <Headphones className="h-3 w-3" />, label: "Suporte", color: "text-blue-400 bg-blue-900/30" },
  CHAT_MODERATOR: { icon: <Shield className="h-3 w-3" />, label: "Moderador", color: "text-green-400 bg-green-900/30" },
  HELPER: { icon: <HelpCircle className="h-3 w-3" />, label: "Helper", color: "text-yellow-400 bg-yellow-900/30" },
};

const NAME_EFFECTS: Record<string, string> = {
  glow: "animate-pulse drop-shadow-[0_0_8px_currentColor]",
  rainbow: "bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400 bg-clip-text text-transparent animate-gradient",
  shake: "animate-bounce",
  italic: "italic",
  bold: "font-black",
};

const COLOR_OPTIONS = [
  { value: "red", label: "Vermelho", class: "text-red-400" },
  { value: "orange", label: "Laranja", class: "text-orange-400" },
  { value: "yellow", label: "Amarelo", class: "text-yellow-400" },
  { value: "green", label: "Verde", class: "text-green-400" },
  { value: "cyan", label: "Ciano", class: "text-cyan-400" },
  { value: "blue", label: "Azul", class: "text-blue-400" },
  { value: "purple", label: "Roxo", class: "text-purple-400" },
  { value: "pink", label: "Rosa", class: "text-pink-400" },
  { value: "white", label: "Branco", class: "text-white" },
];

const EFFECT_OPTIONS = [
  { value: "", label: "Nenhum" },
  { value: "glow", label: "Brilho" },
  { value: "rainbow", label: "Arco-íris" },
  { value: "bold", label: "Negrito" },
  { value: "italic", label: "Itálico" },
];

const EMOJI_CATEGORIES = [
  { name: "Sorrisos", emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🤫", "🤔", "🤐", "🤨", "😐", "😑", "😶", "😏", "😒", "🙄", "😬", "🤥"] },
  { name: "Gestos", emojis: ["👍", "👎", "👊", "✊", "🤛", "🤜", "🤞", "✌️", "🤟", "🤘", "👌", "🤌", "🤏", "👈", "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖", "👋", "🤙", "💪", "🦾", "🙏", "🤝", "👏", "🙌"] },
  { name: "Jogos", emojis: ["🎰", "🎲", "🃏", "♠️", "♥️", "♦️", "♣️", "🎯", "🎮", "🕹️", "🎳", "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🥊", "⛳", "🏆", "🥇", "🥈", "🥉", "🏅", "💰", "💵", "💸", "💳", "🤑"] },
  { name: "Celebração", emojis: ["🎉", "🎊", "🎈", "🎁", "🎀", "🎆", "🎇", "✨", "🌟", "⭐", "💥", "🔥", "💫", "🎵", "🎶", "🎤", "🎧", "🥂", "🍾", "🍻", "🍺", "🥃", "🍷", "🍸", "🍹"] },
  { name: "Animais", emojis: ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🐔", "🐧", "🐦", "🐤", "🦄", "🐴", "🦋", "🐙", "🦈", "🐬", "🐳", "🦅", "🦆", "🦢", "🦚"] },
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
  if (!color) return "text-gray-200";
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
  return colorMap[color] || "text-gray-200";
}

export default function CommunityChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [roomOnlineCount, setRoomOnlineCount] = useState(0);
  const [showRooms, setShowRooms] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [myRole, setMyRole] = useState<string>("NONE");
  const [myLevel, setMyLevel] = useState<number>(1);
  const [myCustomization, setMyCustomization] = useState<ChatUserCustomization | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);
  
  const auth = getStoredAuth();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendTypingStatus = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    
    lastTypingSentRef.current = now;
    wsRef.current.send(JSON.stringify({ type: "typing" }));
  }, []);

  const connect = useCallback(() => {
    if (!auth.accessToken || wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "auth", token: auth.accessToken }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "authenticated":
          setIsConnected(true);
          setRooms(data.rooms);
          setMyRole(data.userRole || "NONE");
          setMyLevel(data.level || 1);
          setMyCustomization(data.customization);
          if (data.rooms.length > 0 && !currentRoom) {
            ws.send(JSON.stringify({ type: "join_room", roomId: data.rooms[0].id }));
          }
          break;

        case "room_joined":
          const room = rooms.find(r => r.id === data.roomId);
          if (room) setCurrentRoom(room);
          setMessages(data.messages || []);
          setRoomOnlineCount(data.onlineCount || 0);
          setTypingUsers([]);
          setShowRooms(false);
          break;

        case "new_message":
          if (!blockedUsers.includes(data.message.user.id)) {
            setMessages(prev => [...prev.slice(-99), data.message]);
          }
          break;

        case "user_joined":
          break;

        case "user_left":
          setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
          break;

        case "online_count":
          setOnlineCount(data.count);
          break;

        case "room_online_count":
          setRoomOnlineCount(data.count);
          break;

        case "typing_status":
          if (data.isTyping) {
            setTypingUsers(prev => {
              if (prev.find(u => u.userId === data.userId)) return prev;
              return [...prev, { userId: data.userId, userName: data.userName }];
            });
          } else {
            setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
          }
          break;

        case "user_blocked":
          setBlockedUsers(prev => [...prev, data.userId]);
          toast.success("Utilizador bloqueado");
          break;

        case "user_unblocked":
          setBlockedUsers(prev => prev.filter(id => id !== data.userId));
          toast.success("Utilizador desbloqueado");
          break;

        case "message_deleted":
          setMessages(prev => prev.filter(m => m.id !== data.messageId));
          break;

        case "system_message":
          setMessages(prev => [...prev.slice(-99), {
            id: `system-${Date.now()}`,
            message: data.message,
            createdAt: data.createdAt,
            user: { id: "system", name: "Sistema", vipLevel: "diamond", level: 99 },
          }]);
          break;

        case "message_error":
          toast.error(data.error);
          if (data.penalty) {
            const penaltyMsg = data.penalty.type === "WARNING" 
              ? "Aviso: Evite repetir essa ação"
              : data.penalty.type === "BAN"
              ? "Você foi banido do chat"
              : `Silenciado por ${data.penalty.type === "MUTE_5MIN" ? "5 minutos" : "1 hora"}`;
            toast.warning(penaltyMsg);
          }
          break;

        case "error":
          toast.error(data.error);
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (isOpen) {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [auth.accessToken, currentRoom, isOpen, rooms, blockedUsers]);

  useEffect(() => {
    if (isOpen && auth.accessToken) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, auth.accessToken, connect]);

  const sendMessage = () => {
    if (!inputMessage.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({
      type: "send_message",
      message: inputMessage.trim(),
    }));
    setInputMessage("");
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    if (e.target.value.length > 0) {
      sendTypingStatus();
    }
  };

  const joinRoom = (room: ChatRoom) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "join_room", roomId: room.id }));
  };

  const blockUser = (userId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "block_user", userId }));
  };

  const reportMessage = async (messageId: string) => {
    const reason = prompt("Motivo da denúncia:");
    if (!reason) return;

    try {
      const res = await fetch("/api/chat/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ messageId, reason }),
      });

      if (res.ok) {
        toast.success("Denúncia enviada");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao denunciar");
      }
    } catch {
      toast.error("Erro ao enviar denúncia");
    }
  };

  const saveCustomization = async (nameColor?: string, nameEffect?: string, messageColor?: string) => {
    try {
      const res = await fetch("/api/chat/customization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ nameColor, nameEffect, messageColor }),
      });

      if (res.ok) {
        setMyCustomization({ nameColor, nameEffect, messageColor });
        toast.success("Personalização salva!");
        setShowSettings(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao salvar");
      }
    } catch {
      toast.error("Erro ao salvar personalização");
    }
  };

  const insertEmoji = (emoji: string) => {
    setInputMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;
    
    const names = typingUsers.slice(0, 3).map(u => u.userName);
    let text = "";
    
    if (names.length === 1) {
      text = `${names[0]} está a escrever...`;
    } else if (names.length === 2) {
      text = `${names[0]} e ${names[1]} estão a escrever...`;
    } else {
      text = `${names[0]}, ${names[1]} e outros estão a escrever...`;
    }

    return (
      <div className="px-4 py-1 text-xs text-gray-400 italic flex items-center gap-2">
        <span className="flex gap-0.5">
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </span>
        {text}
      </div>
    );
  };

  const renderRoleBadge = (role?: string) => {
    if (!role || role === "NONE") return null;
    const badge = ROLE_BADGES[role];
    if (!badge) return null;
    
    return (
      <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium ${badge.color}`}>
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
      <span className={`font-medium text-sm truncate ${customColor || defaultColor} ${effectClass}`}>
        {user.name}
      </span>
    );
  };

  if (!auth.accessToken) return null;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 h-14 w-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 shadow-lg"
        data-testid="button-open-chat"
      >
        <MessageCircle className="h-6 w-6" />
        {onlineCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center">
            {onlineCount > 99 ? "99+" : onlineCount}
          </span>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[#0a0a0a] border-l border-gray-800 z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gradient-to-r from-green-900/30 to-emerald-900/30">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-green-400" />
                <div>
                  <h3 className="font-bold text-white">Chat da Comunidade</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                    <span>{isConnected ? `${onlineCount} online` : "Desconectado"}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {myLevel >= 50 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                    data-testid="button-chat-settings"
                    className="h-8 w-8"
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  data-testid="button-close-chat"
                  className="h-8 w-8"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <AnimatePresence>
              {showSettings && myLevel >= 50 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#111] border-b border-gray-800 p-4 overflow-hidden"
                >
                  <h4 className="text-sm font-medium text-white mb-3">Personalizar Chat (Lv.50+)</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Cor do Nome</label>
                      <div className="flex flex-wrap gap-1">
                        {COLOR_OPTIONS.map(c => (
                          <button
                            key={c.value}
                            onClick={() => setMyCustomization(prev => ({ ...prev, nameColor: c.value }))}
                            className={`w-6 h-6 rounded ${c.class} border ${myCustomization?.nameColor === c.value ? "border-white" : "border-gray-700"}`}
                            title={c.label}
                          >
                            ●
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Efeito do Nome</label>
                      <div className="flex flex-wrap gap-1">
                        {EFFECT_OPTIONS.map(e => (
                          <button
                            key={e.value}
                            onClick={() => setMyCustomization(prev => ({ ...prev, nameEffect: e.value }))}
                            className={`px-2 py-1 text-xs rounded ${myCustomization?.nameEffect === e.value ? "bg-green-600" : "bg-gray-800"} text-white`}
                          >
                            {e.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Cor da Mensagem</label>
                      <div className="flex flex-wrap gap-1">
                        {COLOR_OPTIONS.map(c => (
                          <button
                            key={c.value}
                            onClick={() => setMyCustomization(prev => ({ ...prev, messageColor: c.value }))}
                            className={`w-6 h-6 rounded ${c.class} border ${myCustomization?.messageColor === c.value ? "border-white" : "border-gray-700"}`}
                            title={c.label}
                          >
                            ●
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => saveCustomization(myCustomization?.nameColor, myCustomization?.nameEffect, myCustomization?.messageColor)}
                      className="w-full bg-green-600 hover:bg-green-500"
                      size="sm"
                    >
                      Salvar
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {currentRoom && (
              <button
                onClick={() => setShowRooms(!showRooms)}
                className="flex items-center justify-between px-4 py-2 bg-[#111] border-b border-gray-800 hover:bg-[#1a1a1a] transition-colors"
                data-testid="button-select-room"
              >
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-white">{currentRoom.displayName}</span>
                  {currentRoom.type === "VIP" && <Crown className="h-4 w-4 text-yellow-400" />}
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {roomOnlineCount}
                  </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showRooms ? "rotate-180" : ""}`} />
              </button>
            )}

            <AnimatePresence>
              {showRooms && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-[#0d0d0d] border-b border-gray-800 overflow-hidden"
                >
                  {rooms.map(room => (
                    <button
                      key={room.id}
                      onClick={() => joinRoom(room)}
                      className={`w-full flex items-center gap-2 px-4 py-2 hover:bg-[#1a1a1a] transition-colors ${
                        currentRoom?.id === room.id ? "bg-green-900/20 border-l-2 border-green-500" : ""
                      }`}
                      data-testid={`button-room-${room.name}`}
                    >
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-300">{room.displayName}</span>
                      {room.type === "VIP" && <Crown className="h-3 w-3 text-yellow-400" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="group flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-gray-500">
                          {VIP_BADGES[msg.user.vipLevel] || ""}
                        </span>
                        {renderRoleBadge(msg.user.role)}
                        {renderUserName(msg.user)}
                        <span className="text-[10px] px-1 py-0.5 rounded bg-gray-800 text-gray-500">
                          Lv.{msg.user.level}
                        </span>
                      </div>
                      <p className={`text-sm break-words mt-0.5 ${msg.user.customization?.messageColor ? getMessageColorClass(msg.user.customization.messageColor) : "text-gray-200"}`}>
                        {msg.message}
                      </p>
                    </div>
                    {msg.user.id !== "system" && (
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                        <button
                          onClick={() => blockUser(msg.user.id)}
                          className="p-1 text-gray-500 hover:text-orange-400 transition-all"
                          title="Bloquear"
                          data-testid={`button-block-${msg.id}`}
                        >
                          <UserX className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => reportMessage(msg.id)}
                          className="p-1 text-gray-500 hover:text-red-400 transition-all"
                          title="Denunciar"
                          data-testid={`button-report-${msg.id}`}
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {renderTypingIndicator()}

            <div className="p-4 border-t border-gray-800 bg-[#0d0d0d]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0"
                      data-testid="button-emoji-picker"
                    >
                      <Smile className="h-5 w-5 text-gray-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-2 bg-[#1a1a1a] border-gray-700" side="top" align="start">
                    <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
                      {EMOJI_CATEGORIES.map((cat, i) => (
                        <button
                          key={cat.name}
                          onClick={() => setSelectedEmojiCategory(i)}
                          className={`px-2 py-1 text-xs rounded whitespace-nowrap ${selectedEmojiCategory === i ? "bg-green-600 text-white" : "bg-gray-800 text-gray-300"}`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
                      {EMOJI_CATEGORIES[selectedEmojiCategory].emojis.map((emoji, i) => (
                        <button
                          key={i}
                          onClick={() => insertEmoji(emoji)}
                          className="text-xl p-1 hover:bg-gray-700 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  value={inputMessage}
                  onChange={handleInputChange}
                  placeholder="Digite sua mensagem..."
                  maxLength={500}
                  className="flex-1 bg-[#1a1a1a] border-gray-700 focus:border-green-500"
                  disabled={!isConnected}
                  data-testid="input-chat-message"
                />
                <Button
                  type="submit"
                  disabled={!isConnected || !inputMessage.trim()}
                  className="bg-green-600 hover:bg-green-500"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              <p className="text-[10px] text-gray-500 mt-2 text-center">
                Links, contatos e linguagem inadequada são bloqueados
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
