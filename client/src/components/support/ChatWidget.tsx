import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Minimize2, Star, Loader2, User, Bot, Headphones } from "lucide-react";
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

  const { data: activeChat, isLoading: loadingChat } = useActiveChat();
  const { data: messages = [], isLoading: loadingMessages } = useChatMessages(activeChat?.id || null);
  const { data: departments = [] } = useDepartments();
  const startChat = useStartChat();
  const sendMessage = useSendChatMessage();
  const closeChat = useCloseChat();
  const rateChat = useRateChat();

  const isAuthenticated = localStorage.getItem("in1bet_auth") === "true";

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
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30 animate-pulse">
            Na fila - Posição #{activeChat.queuePosition || "1"}
          </Badge>
        );
      case "ACTIVE":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
            Em atendimento
          </Badge>
        );
      case "CLOSED":
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-500 border-gray-500/30">
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
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-green-600 to-emerald-500 shadow-lg shadow-green-500/30 flex items-center justify-center hover:scale-110 transition-transform"
          data-testid="button-open-support-chat"
        >
          <Headphones className="w-6 h-6 text-white" />
          {activeChat && activeChat.status !== "CLOSED" && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      )}

      {isOpen && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-50 bg-[#0f0f15] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden transition-all duration-300",
            isMinimized ? "w-80 h-14" : "w-96 h-[600px] max-h-[80vh]"
          )}
          data-testid="chat-widget"
        >
          <div
            className="flex items-center justify-between p-4 bg-gradient-to-r from-green-600 to-green-500 cursor-pointer"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Headphones className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Suporte IN1Bet</h3>
                <p className="text-white/70 text-xs">
                  {activeChat ? getStatusLabel() : "Online agora"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Minimize2 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
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
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : showRating ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
                  <h4 className="text-lg font-bold text-white">Como foi o atendimento?</h4>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                        data-testid={`button-rate-${star}`}
                      >
                        <Star
                          className={cn(
                            "w-8 h-8 transition-colors",
                            star <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-500"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder="Deixe um comentário (opcional)"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full bg-card border-white/10"
                    rows={3}
                    data-testid="input-rating-feedback"
                  />
                  <Button
                    onClick={handleRateChat}
                    disabled={rating === 0 || rateChat.isPending}
                    className="w-full bg-green-600 hover:bg-green-500"
                    data-testid="button-submit-rating"
                  >
                    {rateChat.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Avaliação"}
                  </Button>
                  <button
                    onClick={() => setShowRating(false)}
                    className="text-sm text-gray-400 hover:text-white"
                  >
                    Pular
                  </button>
                </div>
              ) : !activeChat || activeChat.status === "CLOSED" ? (
                <div className="flex-1 flex flex-col p-4 space-y-4">
                  <div className="text-center space-y-2 py-4">
                    <h4 className="text-lg font-bold text-white">Olá! Como podemos ajudar?</h4>
                    <p className="text-sm text-gray-400">
                      Inicie uma conversa e nossa equipe irá atendê-lo.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Departamento (opcional)</label>
                    <select
                      value={selectedDepartment || ""}
                      onChange={(e) => setSelectedDepartment(e.target.value || undefined)}
                      className="w-full h-10 px-3 rounded-lg bg-card border border-white/10 text-white text-sm"
                      data-testid="select-department"
                    >
                      <option value="">Selecione um departamento</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Textarea
                    placeholder="Descreva sua dúvida ou problema..."
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    className="flex-1 min-h-[120px] bg-card border-white/10 resize-none"
                    data-testid="input-initial-message"
                  />

                  <Button
                    onClick={handleStartChat}
                    disabled={!initialMessage.trim() || startChat.isPending}
                    className="w-full bg-green-600 hover:bg-green-500 h-12 font-bold"
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
                      <div className="text-center text-gray-400 text-sm py-8">
                        Nenhuma mensagem ainda
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex gap-2",
                            msg.senderType === "USER" ? "justify-end" : "justify-start"
                          )}
                          data-testid={`message-${msg.id}`}
                        >
                          {msg.senderType !== "USER" && (
                            <div
                              className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                msg.senderType === "ADMIN"
                                  ? "bg-green-500/20 text-green-500"
                                  : "bg-blue-500/20 text-blue-500"
                              )}
                            >
                              {renderMessageIcon(msg)}
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                              msg.senderType === "USER"
                                ? "bg-green-600 text-white rounded-br-md"
                                : msg.senderType === "ADMIN"
                                ? "bg-card border border-white/10 text-white rounded-bl-md"
                                : "bg-blue-500/10 border border-blue-500/20 text-blue-200 rounded-bl-md"
                            )}
                          >
                            {msg.message}
                            <div
                              className={cn(
                                "text-[10px] mt-1",
                                msg.senderType === "USER" ? "text-white/60" : "text-gray-500"
                              )}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {(activeChat.status === "WAITING" || activeChat.status === "ACTIVE" || activeChat.status === "TRANSFERRED") && (
                    <div className="p-3 border-t border-white/10">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Digite sua mensagem..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                          className="flex-1 bg-card border-white/10"
                          data-testid="input-chat-message"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!message.trim() || sendMessage.isPending}
                          className="bg-green-600 hover:bg-green-500 px-4"
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
                        className="w-full text-center text-xs text-gray-500 hover:text-red-400 mt-2 py-1"
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
      )}
    </>
  );
}
