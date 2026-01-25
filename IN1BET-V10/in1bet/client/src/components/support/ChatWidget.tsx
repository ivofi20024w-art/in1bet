import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Minimize2, Star, Loader2, User, Bot, Headphones, Sparkles, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  useActiveChat,
  useChatMessages,
  useStartChat,
  useSendChatMessage,
  useCloseChat,
  useRateChat,
  useDepartments,
  type SupportChatMessage,
} from "@/hooks/useSupport";
import { useAuth } from "@/hooks/useAuth";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [initialMessage, setInitialMessage] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isAuthenticated } = useAuth();
  const { data: activeChat, isLoading: loadingChat } = useActiveChat();
  const { data: messages = [], isLoading: loadingMessages } = useChatMessages(activeChat?.id || null);
  const { data: departments = [] } = useDepartments();
  const startChat = useStartChat();
  const sendMessage = useSendChatMessage();
  const closeChat = useCloseChat();
  const rateChat = useRateChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const [previousStatus, setPreviousStatus] = useState<string | null>(null);
  
  useEffect(() => {
    if (activeChat) {
      if (previousStatus === "ACTIVE" && activeChat.status === "CLOSED" && !activeChat.userRating) {
        setShowRating(true);
      }
      setPreviousStatus(activeChat.status);
    } else if (previousStatus === "ACTIVE" || previousStatus === "WAITING") {
      setShowRating(true);
    }
  }, [activeChat, previousStatus]);

  const handleStartChat = async () => {
    if (!initialMessage.trim()) return;
    try {
      await startChat.mutateAsync({
        initialMessage: initialMessage.trim(),
        departmentId: selectedDepartment,
      });
      setInitialMessage("");
    } catch (error) {
      console.error("Error starting chat:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat) return;
    try {
      await sendMessage.mutateAsync({
        chatId: activeChat.id,
        message: message.trim(),
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleCloseChat = async () => {
    if (!activeChat) return;
    try {
      await closeChat.mutateAsync({ chatId: activeChat.id });
    } catch (error) {
      console.error("Error closing chat:", error);
    }
  };

  const [lastChatId, setLastChatId] = useState<string | null>(null);
  
  useEffect(() => {
    if (activeChat?.id) {
      setLastChatId(activeChat.id);
    }
  }, [activeChat?.id]);
  
  const handleRateChat = async () => {
    const chatIdToRate = activeChat?.id || lastChatId;
    if (!chatIdToRate || rating === 0) return;
    try {
      await rateChat.mutateAsync({
        chatId: chatIdToRate,
        rating,
        feedback: feedback.trim() || undefined,
      });
      setShowRating(false);
      setRating(0);
      setFeedback("");
      setLastChatId(null);
    } catch (error) {
      console.error("Error rating chat:", error);
    }
  };

  const getStatusLabel = () => {
    if (!activeChat) return null;
    switch (activeChat.status) {
      case "WAITING":
        return (
          <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse text-[10px] font-bold">
            Fila #{activeChat.queuePosition || "1"}
          </Badge>
        );
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/30 text-[10px] font-bold">
            Em atendimento
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline" className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-[10px] font-bold">
            Encerrado
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderMessageIcon = (msg: SupportChatMessage) => {
    switch (msg.senderType) {
      case "USER":
        return <User className="w-4 h-4" />;
      case "ADMIN":
        return <Headphones className="w-4 h-4" />;
      case "BOT":
      case "SYSTEM":
        return <Bot className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 group"
            data-testid="button-open-support-chat"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-500 rounded-full blur-lg opacity-60 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary via-orange-500 to-amber-500 shadow-[0_0_30px_rgba(249,115,22,0.4)] group-hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] flex items-center justify-center transition-all group-hover:scale-110">
                <Headphones className="w-6 h-6 text-white" />
              </div>
              {activeChat && activeChat.status !== "CLOSED" && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-rose-500 rounded-full animate-pulse flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full" />
                </span>
              )}
              <Sparkles className="absolute -bottom-1 -left-1 h-4 w-4 text-yellow-300 animate-pulse" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 overflow-hidden transition-all duration-300",
              isMinimized ? "w-72 sm:w-80 h-16" : "w-[calc(100%-2rem)] sm:w-[400px] h-[70vh] sm:h-[600px] max-h-[80vh]"
            )}
            data-testid="chat-widget"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d0d14] to-[#0a0a0f] rounded-2xl" />
            <div className="absolute inset-0 rounded-2xl bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none rounded-t-2xl" />
            
            <div className="relative h-full flex flex-col border border-primary/20 rounded-2xl shadow-2xl shadow-black/50">
              <div
                className="relative flex items-center justify-between p-4 cursor-pointer bg-gradient-to-r from-primary/10 via-orange-500/5 to-transparent backdrop-blur-sm rounded-t-2xl border-b border-primary/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 rounded-xl blur-md" />
                    <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg">
                      <Headphones className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0a0a0f] shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      Suporte IN1Bet
                      <Zap className="h-3 w-3 text-primary" />
                    </h3>
                    <div className="text-xs flex items-center gap-2">
                      {activeChat ? getStatusLabel() : (
                        <span className="text-green-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Online agora
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMinimized(!isMinimized);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <ChevronDown className={cn("w-4 h-4 text-white transition-transform", isMinimized && "rotate-180")} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                    }}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    data-testid="button-close-chat"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>

              {!isMinimized && (
                <>
                  {loadingChat ? (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="relative">
                          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                          <Loader2 className="w-10 h-10 text-primary animate-spin relative" />
                        </div>
                        <span className="text-sm text-gray-400">Carregando...</span>
                      </div>
                    </div>
                  ) : showRating ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-5">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/10 flex items-center justify-center">
                        <Star className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-bold text-white">Como foi o atendimento?</h4>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="p-1.5 hover:scale-125 transition-transform"
                            data-testid={`button-rate-${star}`}
                          >
                            <Star
                              className={cn(
                                "w-9 h-9 transition-all",
                                star <= rating 
                                  ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" 
                                  : "text-gray-600"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Deixe um comentário (opcional)"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        className="w-full bg-white/5 border-white/10 focus:border-primary/50 rounded-xl resize-none"
                        rows={3}
                        data-testid="input-rating-feedback"
                      />
                      <Button
                        onClick={handleRateChat}
                        disabled={rating === 0 || rateChat.isPending}
                        className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 h-12 font-bold rounded-xl shadow-lg shadow-primary/30"
                        data-testid="button-submit-rating"
                      >
                        {rateChat.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Enviar Avaliação
                          </>
                        )}
                      </Button>
                      <button
                        onClick={() => setShowRating(false)}
                        className="text-sm text-gray-500 hover:text-white transition-colors"
                      >
                        Pular
                      </button>
                    </div>
                  ) : !activeChat || activeChat.status === "CLOSED" ? (
                    <div className="flex-1 flex flex-col p-5 space-y-4 overflow-y-auto">
                      <div className="text-center space-y-3 py-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/10 flex items-center justify-center">
                          <MessageCircle className="w-8 h-8 text-primary" />
                        </div>
                        <h4 className="text-lg font-bold text-white">Olá! Como podemos ajudar?</h4>
                        <p className="text-sm text-gray-400">
                          Inicie uma conversa e nossa equipe irá atendê-lo.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 font-medium">Departamento (opcional)</label>
                        <select
                          value={selectedDepartment || ""}
                          onChange={(e) => setSelectedDepartment(e.target.value || undefined)}
                          className="w-full h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors"
                          data-testid="select-department"
                        >
                          <option value="" className="bg-[#0a0a0f]">Selecione um departamento</option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.id} className="bg-[#0a0a0f]">
                              {dept.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <Textarea
                        placeholder="Descreva sua dúvida ou problema..."
                        value={initialMessage}
                        onChange={(e) => setInitialMessage(e.target.value)}
                        className="flex-1 min-h-[120px] bg-white/5 border-white/10 focus:border-primary/50 resize-none rounded-xl"
                        data-testid="input-initial-message"
                      />

                      <Button
                        onClick={handleStartChat}
                        disabled={!initialMessage.trim() || startChat.isPending}
                        className="w-full bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 h-12 font-bold rounded-xl shadow-lg shadow-primary/30"
                        data-testid="button-start-chat"
                      >
                        {startChat.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Iniciar Conversa
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {loadingMessages ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                          </div>
                        ) : messages.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-orange-500/10 flex items-center justify-center mb-3">
                              <MessageCircle className="w-7 h-7 text-primary/50" />
                            </div>
                            <p className="text-gray-500 text-sm">Aguardando mensagens...</p>
                          </div>
                        ) : (
                          messages.map((msg) => (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={cn(
                                "flex gap-2",
                                msg.senderType === "USER" ? "justify-end" : "justify-start"
                              )}
                              data-testid={`message-${msg.id}`}
                            >
                              {msg.senderType !== "USER" && (
                                <div
                                  className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg",
                                    msg.senderType === "ADMIN"
                                      ? "bg-gradient-to-br from-primary to-orange-500 text-white"
                                      : "bg-gradient-to-br from-blue-500 to-indigo-500 text-white"
                                  )}
                                >
                                  {renderMessageIcon(msg)}
                                </div>
                              )}
                              <div
                                className={cn(
                                  "max-w-[75%] px-4 py-3 rounded-2xl text-sm",
                                  msg.senderType === "USER"
                                    ? "bg-gradient-to-r from-primary to-orange-500 text-white rounded-br-md shadow-lg shadow-primary/20"
                                    : msg.senderType === "ADMIN"
                                    ? "bg-white/5 border border-white/10 text-white rounded-bl-md"
                                    : "bg-blue-500/10 border border-blue-500/20 text-blue-200 rounded-bl-md"
                                )}
                              >
                                {msg.message}
                                <div
                                  className={cn(
                                    "text-[10px] mt-1.5",
                                    msg.senderType === "USER" ? "text-white/60" : "text-gray-500"
                                  )}
                                >
                                  {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          ))
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {(activeChat.status === "WAITING" || activeChat.status === "ACTIVE" || activeChat.status === "TRANSFERRED") && (
                        <div className="p-4 border-t border-primary/20 bg-gradient-to-t from-black/30 to-transparent">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Digite sua mensagem..."
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                              className="flex-1 h-11 bg-white/5 border-white/10 focus:border-primary/50 rounded-xl"
                              data-testid="input-chat-message"
                            />
                            <Button
                              onClick={handleSendMessage}
                              disabled={!message.trim() || sendMessage.isPending}
                              className="h-11 w-11 rounded-xl bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90 shadow-lg shadow-primary/30"
                              data-testid="button-send-message"
                            >
                              {sendMessage.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <button
                            onClick={handleCloseChat}
                            className="w-full text-center text-xs text-gray-500 hover:text-red-400 mt-3 py-1 transition-colors"
                            data-testid="button-end-chat"
                          >
                            Encerrar conversa
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
