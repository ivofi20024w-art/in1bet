import { useState, useEffect, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Send,
  Loader2,
  User,
  Headphones,
  ArrowLeft,
  X,
  RefreshCw,
  Clock,
  ArrowRightLeft,
  Ticket,
} from "lucide-react";
import {
  useAdminChatsQueue,
  useAdminMyChats,
  useAdminChatMessages,
  useAdminAssignChat,
  useAdminSendChatMessage,
  useAdminCloseChat,
  useAdminTransferChat,
  useAdminConvertChatToTicket,
  useAdminDepartments,
  type AdminChat,
} from "@/hooks/useSupportAdmin";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function AdminSupportChats() {
  const [, setLocation] = useLocation();
  const [selectedChat, setSelectedChat] = useState<AdminChat | null>(null);
  const [message, setMessage] = useState("");
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [transferDeptId, setTransferDeptId] = useState("");
  const [ticketSubject, setTicketSubject] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: queueChats = [], isLoading: loadingQueue, refetch: refetchQueue } = useAdminChatsQueue();
  const { data: myChats = [], isLoading: loadingMy, refetch: refetchMy } = useAdminMyChats();
  const { data: messages = [], isLoading: loadingMessages } = useAdminChatMessages(selectedChat?.id || null);
  const { data: departments = [] } = useAdminDepartments();

  const assignChat = useAdminAssignChat();
  const sendMessage = useAdminSendChatMessage();
  const closeChat = useAdminCloseChat();
  const transferChat = useAdminTransferChat();
  const convertToTicket = useAdminConvertChatToTicket();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAssign = async (chat: AdminChat) => {
    try {
      await assignChat.mutateAsync(chat.id);
      setSelectedChat(chat);
      toast.success("Chat atribuído a você");
      refetchQueue();
      refetchMy();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atribuir chat");
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedChat) return;
    try {
      await sendMessage.mutateAsync({ chatId: selectedChat.id, message: message.trim() });
      setMessage("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar mensagem");
    }
  };

  const handleClose = async () => {
    if (!selectedChat) return;
    try {
      await closeChat.mutateAsync({ chatId: selectedChat.id });
      setSelectedChat(null);
      toast.success("Chat encerrado");
      refetchMy();
    } catch (error: any) {
      toast.error(error.message || "Erro ao encerrar chat");
    }
  };

  const handleTransfer = async () => {
    if (!selectedChat || !transferDeptId) return;
    try {
      await transferChat.mutateAsync({ chatId: selectedChat.id, departmentId: transferDeptId });
      setSelectedChat(null);
      setShowTransferDialog(false);
      setTransferDeptId("");
      toast.success("Chat transferido");
      refetchMy();
    } catch (error: any) {
      toast.error(error.message || "Erro ao transferir chat");
    }
  };

  const handleConvert = async () => {
    if (!selectedChat || !ticketSubject.trim()) return;
    try {
      await convertToTicket.mutateAsync({ chatId: selectedChat.id, subject: ticketSubject.trim() });
      setSelectedChat(null);
      setShowConvertDialog(false);
      setTicketSubject("");
      toast.success("Chat convertido em ticket");
      refetchMy();
    } catch (error: any) {
      toast.error(error.message || "Erro ao converter chat");
    }
  };

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-120px)]">
        <div className="w-80 border-r border-white/5 flex flex-col">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/support")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                refetchQueue();
                refetchMy();
              }}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              <h3 className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Na Fila ({queueChats.length})
              </h3>
              {loadingQueue ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : queueChats.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Fila vazia</p>
              ) : (
                <div className="space-y-2">
                  {queueChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => handleAssign(chat)}
                      data-testid={`queue-chat-${chat.id}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-white">
                          {chat.user?.username || "Usuário"}
                        </span>
                        <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                          #{chat.queuePosition}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">{chat.category || "Geral"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/5">
              <h3 className="text-xs font-medium text-gray-400 uppercase mb-2 flex items-center gap-2">
                <Headphones className="w-3 h-3" />
                Meus Chats ({myChats.length})
              </h3>
              {loadingMy ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              ) : myChats.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum chat ativo</p>
              ) : (
                <div className="space-y-2">
                  {myChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-colors",
                        selectedChat?.id === chat.id
                          ? "bg-primary/20 border border-primary/30"
                          : "bg-secondary/30 hover:bg-secondary/50"
                      )}
                      onClick={() => setSelectedChat(chat)}
                      data-testid={`my-chat-${chat.id}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-white">
                          {chat.user?.username || "Usuário"}
                        </span>
                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/30">
                          Ativo
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">{chat.category || "Geral"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium text-white mb-2">Nenhum chat selecionado</h3>
                <p className="text-sm">Selecione um chat da fila ou dos seus chats ativos</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{selectedChat.user?.username || "Usuário"}</h3>
                    <p className="text-xs text-gray-400">
                      {selectedChat.user?.email} • {selectedChat.category || "Geral"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTransferDialog(true)}
                    className="border-white/10"
                  >
                    <ArrowRightLeft className="w-4 h-4 mr-1" />
                    Transferir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTicketSubject(selectedChat.category || "Suporte via Chat");
                      setShowConvertDialog(true);
                    }}
                    className="border-white/10"
                  >
                    <Ticket className="w-4 h-4 mr-1" />
                    Criar Ticket
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClose}
                    disabled={closeChat.isPending}
                    className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Encerrar
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">Nenhuma mensagem</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2",
                        msg.senderType === "ADMIN" ? "justify-end" : "justify-start"
                      )}
                    >
                      {msg.senderType !== "ADMIN" && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[70%] px-4 py-2.5 rounded-2xl text-sm",
                          msg.senderType === "ADMIN"
                            ? "bg-green-600 text-white rounded-br-md"
                            : "bg-card border border-white/10 rounded-bl-md"
                        )}
                      >
                        {msg.message}
                        <div
                          className={cn(
                            "text-[10px] mt-1",
                            msg.senderType === "ADMIN" ? "text-white/60" : "text-gray-500"
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

              <div className="p-4 border-t border-white/5">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="flex-1 bg-secondary/50 border-white/10"
                    data-testid="input-admin-message"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!message.trim() || sendMessage.isPending}
                    className="bg-green-600 hover:bg-green-500"
                    data-testid="button-send-admin-message"
                  >
                    {sendMessage.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir Chat</DialogTitle>
            <DialogDescription>Selecione o departamento para transferência</DialogDescription>
          </DialogHeader>
          <select
            value={transferDeptId}
            onChange={(e) => setTransferDeptId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-secondary border border-white/10 text-white"
          >
            <option value="">Selecione um departamento</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={!transferDeptId || transferChat.isPending}
              className="bg-primary"
            >
              {transferChat.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transferir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter em Ticket</DialogTitle>
            <DialogDescription>Crie um ticket a partir desta conversa</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Assunto do ticket"
            value={ticketSubject}
            onChange={(e) => setTicketSubject(e.target.value)}
            className="bg-secondary border-white/10"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConvert}
              disabled={!ticketSubject.trim() || convertToTicket.isPending}
              className="bg-primary"
            >
              {convertToTicket.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar Ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
