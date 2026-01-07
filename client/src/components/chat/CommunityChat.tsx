import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MessageCircle, X, Send, Users, Crown, Shield,
  AlertTriangle, Flag, Smile, ChevronDown, Hash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface ChatUser {
  id: string;
  name: string;
  vipLevel: string;
  level: number;
}

interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  user: ChatUser;
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

export default function CommunityChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [showRooms, setShowRooms] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const auth = getStoredAuth();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

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
          if (data.rooms.length > 0 && !currentRoom) {
            ws.send(JSON.stringify({ type: "join_room", roomId: data.rooms[0].id }));
          }
          break;

        case "room_joined":
          const room = rooms.find(r => r.id === data.roomId);
          if (room) setCurrentRoom(room);
          setMessages(data.messages || []);
          setShowRooms(false);
          break;

        case "new_message":
          setMessages(prev => [...prev.slice(-99), data.message]);
          break;

        case "user_joined":
          break;

        case "user_left":
          break;

        case "online_count":
          setOnlineCount(data.count);
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
  }, [auth.accessToken, currentRoom, isOpen, rooms]);

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
  };

  const joinRoom = (room: ChatRoom) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "join_room", roomId: room.id }));
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                data-testid="button-close-chat"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

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
                        <span className={`font-medium text-sm truncate ${VIP_COLORS[msg.user.vipLevel] || "text-gray-300"}`}>
                          {msg.user.name}
                        </span>
                        <span className="text-[10px] px-1 py-0.5 rounded bg-gray-800 text-gray-500">
                          Lv.{msg.user.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-200 break-words mt-0.5">
                        {msg.message}
                      </p>
                    </div>
                    {msg.user.id !== "system" && (
                      <button
                        onClick={() => reportMessage(msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                        title="Denunciar"
                        data-testid={`button-report-${msg.id}`}
                      >
                        <Flag className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-800 bg-[#0d0d0d]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
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
