import { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle, Users, Flag, Ban, AlertTriangle,
  Shield, Plus, Trash2, Check, X, RefreshCw
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

export default function AdminChat() {
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [reports, setReports] = useState<ChatReport[]>([]);
  const [penalties, setPenalties] = useState<ChatPenalty[]>([]);
  const [badWords, setBadWords] = useState<BadWord[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(true);
  const auth = getStoredAuth();

  const fetchData = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${auth.accessToken}` };
      
      const [statsRes, reportsRes, penaltiesRes, wordsRes] = await Promise.all([
        fetch("/api/chat/admin/stats", { headers }),
        fetch("/api/chat/admin/reports?status=PENDING", { headers }),
        fetch("/api/chat/admin/penalties", { headers }),
        fetch("/api/chat/admin/bad-words", { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (reportsRes.ok) setReports(await reportsRes.json());
      if (penaltiesRes.ok) setPenalties(await penaltiesRes.json());
      if (wordsRes.ok) setBadWords(await wordsRes.json());
    } catch (error) {
      console.error("Error fetching chat data:", error);
    } finally {
      setLoading(false);
    }
  }, [auth.accessToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReportAction = async (reportId: string, action: "approve" | "reject", penaltyType?: string) => {
    try {
      const res = await fetch(`/api/chat/admin/reports/${reportId}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ action, penaltyType }),
      });

      if (res.ok) {
        toast.success(action === "approve" ? "Denúncia aprovada" : "Denúncia rejeitada");
        setReports(prev => prev.filter(r => r.id !== reportId));
        fetchData();
      } else {
        toast.error("Erro ao processar denúncia");
      }
    } catch {
      toast.error("Erro ao processar denúncia");
    }
  };

  const handleRemovePenalty = async (penaltyId: string) => {
    try {
      const res = await fetch(`/api/chat/admin/penalty/${penaltyId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`,
        },
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
        headers: { Authorization: `Bearer ${auth.accessToken}` },
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

  const penaltyLabel = (type: string) => {
    switch (type) {
      case "WARNING": return "Aviso";
      case "MUTE_5MIN": return "Mute 5min";
      case "MUTE_1HOUR": return "Mute 1h";
      case "BAN": return "Banido";
      default: return type;
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
                  <p className="text-sm text-gray-400">Denúncias</p>
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

        <Tabs defaultValue="reports" className="space-y-4">
          <TabsList className="bg-[#111]">
            <TabsTrigger value="reports">
              Denúncias {reports.length > 0 && <Badge className="ml-2 bg-yellow-500">{reports.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="penalties">Penalidades</TabsTrigger>
            <TabsTrigger value="badwords">Palavras Bloqueadas</TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card className="bg-[#111] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Denúncias Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Nenhuma denúncia pendente</p>
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
                  Histórico de Penalidades
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
                              {penalty.expiresAt && ` • Expira: ${new Date(penalty.expiresAt).toLocaleString("pt-BR")}`}
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
        </Tabs>
      </div>
    </AdminLayout>
  );
}
