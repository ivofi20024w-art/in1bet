import { useState, useEffect, useCallback, useRef } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageCircle, Users, Flag, Ban, AlertTriangle,
  Shield, Plus, Trash2, Check, X, RefreshCw, Settings,
  Eye, EyeOff, Crown, UserCheck, Volume2, Clock, Hash,
  Edit, Power, MessageSquare, Send, Smile, Star, Award
} from "lucide-react";
import { toast } from "sonner";
import { getStoredAuth } from "@/lib/auth";

interface ChatStats {
  totalMessages: number;
  todayMessages: number;
  activeBans: number;
  pendingReports: number;
  onlineUsers: number;
}

interface ChatReport {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  messageContent: string;
  reporterName: string;
  authorName: string;
}

interface ChatPenalty {
  id: string;
  penaltyType: string;
  violationType: string;
  reason: string;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  userName: string;
  userId: string;
}

interface BadWord {
  id: string;
  word: string;
  severity: number;
  isActive: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  displayName: string;
  type: string;
  minVipLevel: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface ChatModerator {
  id: string;
  name: string;
  email: string;
  chatModeratorRole: string;
  level: number;
  vipLevel: string;
}

interface LiveMessage {
  id: string;
  content: string;
  userName: string;
  userLevel: number;
  timestamp: Date;
  roomId: string;
}

export default function AdminChat() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [reports, setReports] = useState<ChatReport[]>([]);
  const [penalties, setPenalties] = useState<ChatPenalty[]>([]);
  const [badWords, setBadWords] = useState<BadWord[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [moderators, setModerators] = useState<ChatModerator[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(true);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [showModeratorDialog, setShowModeratorDialog] = useState(false);
  const [liveMessages, setLiveMessages] = useState<LiveMessage[]>([]);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const auth = getStoredAuth();
  
  const [newRoom, setNewRoom] = useState({
    name: "",
    displayName: "",
    type: "GLOBAL",
    minVipLevel: "",
  });
  
  const [newModeratorId, setNewModeratorId] = useState("");
  const [newModeratorRole, setNewModeratorRole] = useState("HELPER");
  
  const [chatSettings, setChatSettings] = useState({
    slowModeSeconds: 2,
    maxMessageLength: 500,
    motd: "",
    enableEmojis: true,
    enableMentions: true,
    enableRain: true,
    minLevelToChat: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const opts = { credentials: 'include' as RequestCredentials };
      
      const [statsRes, reportsRes, penaltiesRes, wordsRes, roomsRes, modsRes] = await Promise.all([
        fetch("/api/chat/admin/stats", opts),
        fetch("/api/chat/admin/reports?status=PENDING", opts),
        fetch("/api/chat/admin/penalties", opts),
        fetch("/api/chat/admin/bad-words", opts),
        fetch("/api/chat/rooms", opts),
        fetch("/api/chat/admin/chat-moderators", opts),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (penaltiesRes.ok) setPenalties(await penaltiesRes.json());
      if (wordsRes.ok) setBadWords(await wordsRes.json());
      if (roomsRes.ok) setRooms(await roomsRes.json());
      if (modsRes.ok) setModerators(await modsRes.json());
    } catch (error) {
      console.error("Error fetching chat data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  useEffect(() => {
    if (isLiveMonitoring && auth.isAuthenticated) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
      wsRef.current = ws;
      
      ws.onopen = () => {
        ws.send(JSON.stringify({ type: "auth" }));
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "authenticated") {
          ws.send(JSON.stringify({ type: "join_room", roomId: "global" }));
        }
        if (data.type === "new_message") {
          const msg = data.message;
          setLiveMessages(prev => [...prev.slice(-99), {
            id: msg.id,
            content: msg.message,
            userName: msg.user.name,
            userLevel: msg.user.level,
            timestamp: new Date(msg.createdAt),
            roomId: "global"
          }]);
        }
      };
      
      return () => {
        ws.close();
      };
    }
  }, [isLiveMonitoring, auth.isAuthenticated]);

  const handleReportAction = async (reportId: string, action: "approve" | "reject", penaltyType?: string) => {
    try {
      const res = await fetch(`/api/chat/admin/reports/${reportId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ action, penaltyType }),
      });

      if (res.ok) {
        toast.success(action === "approve" ? "Denuncia aprovada" : "Denuncia rejeitada");
        setReports(prev => prev.filter(r => r.id !== reportId));
        fetchData();
      } else {
        toast.error("Erro ao processar denuncia");
      }
    } catch {
      toast.error("Erro ao processar denuncia");
    }
  };

  const handleRemovePenalty = async (penaltyId: string) => {
    try {
      const res = await fetch(`/api/chat/admin/penalty/${penaltyId}`, {
        method: "DELETE",
        credentials: 'include' as RequestCredentials,
      });

      if (res.ok) {
        toast.success("Penalidade removida");
        setPenalties(prev => prev.map(p => 
          p.id === penaltyId ? { ...p, isActive: false } : p
        ));
      } else {
        toast.error("Erro ao remover penalidade");
      }
    } catch {
      toast.error("Erro ao remover penalidade");
    }
  };

  const handleAddBadWord = async () => {
    if (!newWord.trim()) return;

    try {
      const res = await fetch("/api/chat/admin/bad-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ word: newWord.trim() }),
      });

      if (res.ok) {
        toast.success("Palavra adicionada");
        setNewWord("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao adicionar palavra");
      }
    } catch {
      toast.error("Erro ao adicionar palavra");
    }
  };

  const handleRemoveBadWord = async (wordId: string) => {
    try {
      const res = await fetch(`/api/chat/admin/bad-words/${wordId}`, {
        method: "DELETE",
        credentials: 'include' as RequestCredentials,
      });

      if (res.ok) {
        toast.success("Palavra removida");
        setBadWords(prev => prev.filter(w => w.id !== wordId));
      } else {
        toast.error("Erro ao remover palavra");
      }
    } catch {
      toast.error("Erro ao remover palavra");
    }
  };
  
  const handleCreateRoom = async () => {
    if (!newRoom.name.trim() || !newRoom.displayName.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    
    try {
      const res = await fetch("/api/chat/admin/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({
          name: newRoom.name.toLowerCase().replace(/\s/g, "-"),
          displayName: newRoom.displayName,
          type: newRoom.type,
          minVipLevel: newRoom.minVipLevel || null,
          sortOrder: rooms.length,
        }),
      });
      
      if (res.ok) {
        toast.success("Sala criada");
        setShowRoomDialog(false);
        setNewRoom({ name: "", displayName: "", type: "GLOBAL", minVipLevel: "" });
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao criar sala");
      }
    } catch {
      toast.error("Erro ao criar sala");
    }
  };
  
  const handleToggleRoom = async (roomId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/chat/admin/rooms/${roomId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ isActive }),
      });
      
      if (res.ok) {
        toast.success(isActive ? "Sala ativada" : "Sala desativada");
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, isActive } : r));
      }
    } catch {
      toast.error("Erro ao atualizar sala");
    }
  };
  
  const handleSetModeratorRole = async () => {
    if (!newModeratorId.trim()) {
      toast.error("Informe o ID do usuario");
      return;
    }
    
    try {
      const res = await fetch("/api/chat/admin/set-moderator-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({
          userId: newModeratorId,
          role: newModeratorRole,
        }),
      });
      
      if (res.ok) {
        toast.success("Role atualizado");
        setShowModeratorDialog(false);
        setNewModeratorId("");
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao definir role");
      }
    } catch {
      toast.error("Erro ao definir role");
    }
  };
  
  const handleRemoveModeratorRole = async (userId: string) => {
    try {
      const res = await fetch("/api/chat/admin/set-moderator-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include' as RequestCredentials,
        body: JSON.stringify({ userId, role: "NONE" }),
      });
      
      if (res.ok) {
        toast.success("Moderador removido");
        setModerators(prev => prev.filter(m => m.id !== userId));
      }
    } catch {
      toast.error("Erro ao remover moderador");
    }
  };

  const penaltyLabel = (type: string) => {
    switch (type) {
      case "WARNING": return "Aviso";
      case "MUTE_5MIN": return "Mute 5min";
      case "MUTE_1HOUR": return "Mute 1h";
      case "BAN": return "Banido";
      default: return type;
    }
  };
  
  const roleLabel = (role: string) => {
    switch (role) {
      case "HELPER": return { label: "Helper", color: "bg-blue-500" };
      case "CHAT_MODERATOR": return { label: "Moderador", color: "bg-green-500" };
      case "SUPPORT": return { label: "Suporte", color: "bg-cyan-500" };
      case "ADMIN": return { label: "Admin", color: "bg-red-500" };
      default: return { label: role, color: "bg-gray-500" };
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Chat">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Chat da Comunidade">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-[#111] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Mensagens Hoje</p>
                  <p className="text-xl font-bold text-white">{stats?.todayMessages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Online Agora</p>
                  <p className="text-xl font-bold text-white">{stats?.onlineUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Flag className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Denuncias</p>
                  <p className="text-xl font-bold text-white">{stats?.pendingReports || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Ban className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Bans Ativos</p>
                  <p className="text-xl font-bold text-white">{stats?.activeBans || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#111] border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Shield className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Mensagens</p>
                  <p className="text-xl font-bold text-white">{stats?.totalMessages || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="live" className="space-y-4">
          <TabsList className="bg-[#111] flex-wrap">
            <TabsTrigger value="live" className="gap-1">
              <Eye className="h-4 w-4" />
              Ao Vivo
            </TabsTrigger>
            <TabsTrigger value="reports">
              Denuncias {reports.length > 0 && <Badge className="ml-2 bg-yellow-500">{reports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="penalties">Penalidades</TabsTrigger>
            <TabsTrigger value="rooms" className="gap-1">
              <Hash className="h-4 w-4" />
              Salas
            </TabsTrigger>
            <TabsTrigger value="moderators" className="gap-1">
              <UserCheck className="h-4 w-4" />
              Moderadores
            </TabsTrigger>
            <TabsTrigger value="badwords">Palavras Bloqueadas</TabsTrigger>
            <TabsTrigger value="settings" className="gap-1">
              <Settings className="h-4 w-4" />
              Config
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="live">
            <Card className="bg-[#111] border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Monitoramento em Tempo Real
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isLiveMonitoring ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                    <Switch
                      checked={isLiveMonitoring}
                      onCheckedChange={setIsLiveMonitoring}
                    />
                    <Label className="text-gray-400">
                      {isLiveMonitoring ? "Conectado" : "Desconectado"}
                    </Label>
                  </div>
                </div>
                <CardDescription className="text-gray-500">
                  Visualize as mensagens do chat em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                  {!isLiveMonitoring ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <EyeOff className="h-12 w-12 mb-4 opacity-50" />
                      <p>Ative o monitoramento para ver as mensagens</p>
                    </div>
                  ) : liveMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                      <p>Aguardando mensagens...</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {liveMessages.map(msg => (
                        <div key={msg.id} className="flex items-start gap-3 p-2 rounded hover:bg-white/5 transition-colors group">
                          <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {msg.userLevel}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{msg.userName}</span>
                              <span className="text-[10px] text-gray-500">
                                {msg.timestamp.toLocaleTimeString("pt-BR")}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300 break-words">{msg.content}</p>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-yellow-500 hover:bg-yellow-500/10">
                              <AlertTriangle className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:bg-red-500/10">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card className="bg-[#111] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Denuncias Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Nenhuma denuncia pendente</p>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {reports.map(report => (
                        <div key={report.id} className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="text-sm text-gray-400">
                                <span className="text-white font-medium">{report.reporterName}</span> denunciou{" "}
                                <span className="text-white font-medium">{report.authorName}</span>
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(report.createdAt).toLocaleString("pt-BR")}
                              </p>
                            </div>
                          </div>
                          
                          <div className="bg-[#0a0a0a] p-3 rounded mb-3">
                            <p className="text-sm text-gray-300">{report.messageContent}</p>
                          </div>
                          
                          <p className="text-sm text-gray-400 mb-3">
                            <span className="text-yellow-400">Motivo:</span> {report.reason}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-600 text-green-400 hover:bg-green-600/10"
                              onClick={() => handleReportAction(report.id, "approve")}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600/10"
                              onClick={() => handleReportAction(report.id, "approve", "MUTE_5MIN")}
                            >
                              <AlertTriangle className="h-4 w-4 mr-1" />
                              Aprovar + Mute
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-400 hover:bg-gray-600/10"
                              onClick={() => handleReportAction(report.id, "reject")}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="penalties">
            <Card className="bg-[#111] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Ban className="h-5 w-5" />
                  Historico de Penalidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {penalties.map(penalty => (
                      <div 
                        key={penalty.id} 
                        className={`p-4 rounded-lg border ${
                          penalty.isActive ? "bg-[#1a1a1a] border-gray-800" : "bg-[#0d0d0d] border-gray-900 opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-white">{penalty.userName}</span>
                              <Badge 
                                className={
                                  penalty.penaltyType === "BAN" ? "bg-red-500" :
                                  penalty.penaltyType === "WARNING" ? "bg-yellow-500" :
                                  "bg-orange-500"
                                }
                              >
                                {penaltyLabel(penalty.penaltyType)}
                              </Badge>
                              {!penalty.isActive && <Badge variant="outline">Expirado</Badge>}
                            </div>
                            <p className="text-sm text-gray-400">{penalty.reason}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(penalty.createdAt).toLocaleString("pt-BR")}
                              {penalty.expiresAt && ` - Expira: ${new Date(penalty.expiresAt).toLocaleString("pt-BR")}`}
                            </p>
                          </div>
                          {penalty.isActive && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-red-400"
                              onClick={() => handleRemovePenalty(penalty.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rooms">
            <Card className="bg-[#111] border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Gerenciar Salas
                  </CardTitle>
                  <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-500">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Sala
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111] border-gray-800">
                      <DialogHeader>
                        <DialogTitle className="text-white">Criar Nova Sala</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-400">Nome (slug)</Label>
                          <Input
                            value={newRoom.name}
                            onChange={(e) => setNewRoom(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="ex: vip-platinum"
                            className="bg-[#1a1a1a] border-gray-700"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Nome de Exibicao</Label>
                          <Input
                            value={newRoom.displayName}
                            onChange={(e) => setNewRoom(prev => ({ ...prev, displayName: e.target.value }))}
                            placeholder="ex: Sala VIP Platinum"
                            className="bg-[#1a1a1a] border-gray-700"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Tipo</Label>
                          <Select value={newRoom.type} onValueChange={(v) => setNewRoom(prev => ({ ...prev, type: v }))}>
                            <SelectTrigger className="bg-[#1a1a1a] border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GLOBAL">Global</SelectItem>
                              <SelectItem value="VIP">VIP</SelectItem>
                              <SelectItem value="GAME">Jogo</SelectItem>
                              <SelectItem value="PRIVATE">Privado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-400">VIP Minimo (opcional)</Label>
                          <Select value={newRoom.minVipLevel} onValueChange={(v) => setNewRoom(prev => ({ ...prev, minVipLevel: v }))}>
                            <SelectTrigger className="bg-[#1a1a1a] border-gray-700">
                              <SelectValue placeholder="Sem restricao" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Sem restricao</SelectItem>
                              <SelectItem value="bronze">Bronze</SelectItem>
                              <SelectItem value="silver">Silver</SelectItem>
                              <SelectItem value="gold">Gold</SelectItem>
                              <SelectItem value="platinum">Platinum</SelectItem>
                              <SelectItem value="diamond">Diamond</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRoomDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateRoom} className="bg-green-600 hover:bg-green-500">
                          Criar Sala
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rooms.map(room => (
                    <div
                      key={room.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        room.isActive ? "bg-[#1a1a1a] border-gray-800" : "bg-[#0d0d0d] border-gray-900 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${room.type === "VIP" ? "bg-yellow-500/10" : room.type === "GAME" ? "bg-blue-500/10" : "bg-green-500/10"}`}>
                          {room.type === "VIP" ? <Crown className="h-5 w-5 text-yellow-500" /> :
                           room.type === "GAME" ? <MessageSquare className="h-5 w-5 text-blue-500" /> :
                           <MessageCircle className="h-5 w-5 text-green-500" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{room.displayName}</h4>
                            <Badge variant="outline" className="text-xs">{room.name}</Badge>
                            <Badge className={room.type === "VIP" ? "bg-yellow-500" : room.type === "GAME" ? "bg-blue-500" : "bg-green-500"}>
                              {room.type}
                            </Badge>
                          </div>
                          {room.minVipLevel && (
                            <p className="text-xs text-gray-500">VIP minimo: {room.minVipLevel}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={room.isActive}
                          onCheckedChange={(checked) => handleToggleRoom(room.id, checked)}
                        />
                        <span className={`text-xs ${room.isActive ? "text-green-400" : "text-gray-500"}`}>
                          {room.isActive ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="moderators">
            <Card className="bg-[#111] border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <UserCheck className="h-5 w-5" />
                    Moderadores do Chat
                  </CardTitle>
                  <Dialog open={showModeratorDialog} onOpenChange={setShowModeratorDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-500">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Moderador
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#111] border-gray-800">
                      <DialogHeader>
                        <DialogTitle className="text-white">Adicionar Moderador</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-400">ID do Usuario</Label>
                          <Input
                            value={newModeratorId}
                            onChange={(e) => setNewModeratorId(e.target.value)}
                            placeholder="Cole o ID do usuario"
                            className="bg-[#1a1a1a] border-gray-700"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-400">Role</Label>
                          <Select value={newModeratorRole} onValueChange={setNewModeratorRole}>
                            <SelectTrigger className="bg-[#1a1a1a] border-gray-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HELPER">Helper</SelectItem>
                              <SelectItem value="CHAT_MODERATOR">Moderador</SelectItem>
                              <SelectItem value="SUPPORT">Suporte</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModeratorDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleSetModeratorRole} className="bg-green-600 hover:bg-green-500">
                          Adicionar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {moderators.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Nenhum moderador configurado</p>
                ) : (
                  <div className="space-y-3">
                    {moderators.map(mod => {
                      const role = roleLabel(mod.chatModeratorRole);
                      return (
                        <div
                          key={mod.id}
                          className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-gray-800"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                              {mod.level}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-white">{mod.name}</h4>
                                <Badge className={role.color}>{role.label}</Badge>
                              </div>
                              <p className="text-xs text-gray-500">{mod.email}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-red-400"
                            onClick={() => handleRemoveModeratorRole(mod.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="badwords">
            <Card className="bg-[#111] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Palavras Bloqueadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Adicionar palavra..."
                    className="bg-[#1a1a1a] border-gray-700"
                  />
                  <Button onClick={handleAddBadWord} className="bg-green-600 hover:bg-green-500">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>

                <ScrollArea className="h-[350px]">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {badWords.map(word => (
                      <div
                        key={word.id}
                        className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded border border-gray-800"
                      >
                        <span className="text-sm text-gray-300 truncate">{word.word}</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-gray-400 hover:text-red-400"
                          onClick={() => handleRemoveBadWord(word.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="bg-[#111] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuracoes do Chat
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Configure as regras e comportamento do chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-gray-400 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Slow Mode (segundos)
                      </Label>
                      <Input
                        type="number"
                        value={chatSettings.slowModeSeconds}
                        onChange={(e) => setChatSettings(prev => ({ ...prev, slowModeSeconds: parseInt(e.target.value) || 0 }))}
                        className="bg-[#1a1a1a] border-gray-700 mt-2"
                        min={0}
                        max={60}
                      />
                      <p className="text-xs text-gray-500 mt-1">0 = desativado</p>
                    </div>
                    
                    <div>
                      <Label className="text-gray-400 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Tamanho maximo da mensagem
                      </Label>
                      <Input
                        type="number"
                        value={chatSettings.maxMessageLength}
                        onChange={(e) => setChatSettings(prev => ({ ...prev, maxMessageLength: parseInt(e.target.value) || 200 }))}
                        className="bg-[#1a1a1a] border-gray-700 mt-2"
                        min={50}
                        max={1000}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-gray-400 flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Level minimo para chatear
                      </Label>
                      <Input
                        type="number"
                        value={chatSettings.minLevelToChat}
                        onChange={(e) => setChatSettings(prev => ({ ...prev, minLevelToChat: parseInt(e.target.value) || 0 }))}
                        className="bg-[#1a1a1a] border-gray-700 mt-2"
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                      <div className="flex items-center gap-3">
                        <Smile className="h-5 w-5 text-yellow-500" />
                        <div>
                          <p className="font-medium text-white">Emojis</p>
                          <p className="text-xs text-gray-500">Permitir emojis nas mensagens</p>
                        </div>
                      </div>
                      <Switch
                        checked={chatSettings.enableEmojis}
                        onCheckedChange={(checked) => setChatSettings(prev => ({ ...prev, enableEmojis: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-white">Mencoes (@)</p>
                          <p className="text-xs text-gray-500">Permitir mencoes de usuarios</p>
                        </div>
                      </div>
                      <Switch
                        checked={chatSettings.enableMentions}
                        onCheckedChange={(checked) => setChatSettings(prev => ({ ...prev, enableMentions: checked }))}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-gray-800">
                      <div className="flex items-center gap-3">
                        <Award className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium text-white">Rain (Chuva de dinheiro)</p>
                          <p className="text-xs text-gray-500">Permitir comando /rain para admins</p>
                        </div>
                      </div>
                      <Switch
                        checked={chatSettings.enableRain}
                        onCheckedChange={(checked) => setChatSettings(prev => ({ ...prev, enableRain: checked }))}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Label className="text-gray-400">Mensagem do Dia (MOTD)</Label>
                  <Textarea
                    value={chatSettings.motd}
                    onChange={(e) => setChatSettings(prev => ({ ...prev, motd: e.target.value }))}
                    placeholder="Mensagem exibida para todos os usuarios ao entrar no chat..."
                    className="bg-[#1a1a1a] border-gray-700 mt-2 h-24"
                  />
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    Salvar Configuracoes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
