import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Plus,
  Loader2,
  ArrowLeft,
  Clock,
  MessageSquare,
  Edit,
  Trash,
  Save,
} from "lucide-react";
import {
  useAdminDepartments,
  useAdminCreateDepartment,
  useAdminUpdateDepartment,
  useAdminCannedResponses,
  useAdminCreateCannedResponse,
  useAdminSLARules,
  useAdminCreateSLARule,
  type SLARule,
  type CannedResponse,
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

export default function AdminSupportDepartments() {
  const [, setLocation] = useLocation();
  const [showCreateDept, setShowCreateDept] = useState(false);
  const [showCreateCanned, setShowCreateCanned] = useState(false);
  const [showCreateSLA, setShowCreateSLA] = useState(false);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);

  const [deptName, setDeptName] = useState("");
  const [deptDesc, setDeptDesc] = useState("");

  const [cannedTitle, setCannedTitle] = useState("");
  const [cannedContent, setCannedContent] = useState("");
  const [cannedCategory, setCannedCategory] = useState("");

  const [slaPriority, setSLAPriority] = useState("NORMAL");
  const [slaResponse, setSLAResponse] = useState("60");
  const [slaResolution, setSLAResolution] = useState("1440");

  const { data: departments = [], isLoading: loadingDepts, refetch: refetchDepts } = useAdminDepartments();
  const { data: cannedResponses = [], isLoading: loadingCanned, refetch: refetchCanned } = useAdminCannedResponses(selectedDeptId || undefined);
  const { data: slaRules = [], isLoading: loadingSLA, refetch: refetchSLA } = useAdminSLARules(selectedDeptId || undefined);

  const createDepartment = useAdminCreateDepartment();
  const updateDepartment = useAdminUpdateDepartment();
  const createCannedResponse = useAdminCreateCannedResponse();
  const createSLARule = useAdminCreateSLARule();

  const handleCreateDept = async () => {
    if (!deptName.trim()) return;
    try {
      await createDepartment.mutateAsync({
        name: deptName.trim(),
        description: deptDesc.trim() || undefined,
      });
      setShowCreateDept(false);
      setDeptName("");
      setDeptDesc("");
      toast.success("Departamento criado");
      refetchDepts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar departamento");
    }
  };

  const handleToggleDept = async (deptId: string, isActive: boolean) => {
    try {
      await updateDepartment.mutateAsync({ departmentId: deptId, isActive: !isActive });
      toast.success(isActive ? "Departamento desativado" : "Departamento ativado");
      refetchDepts();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar departamento");
    }
  };

  const handleCreateCanned = async () => {
    if (!cannedTitle.trim() || !cannedContent.trim()) return;
    try {
      await createCannedResponse.mutateAsync({
        title: cannedTitle.trim(),
        content: cannedContent.trim(),
        departmentId: selectedDeptId || undefined,
        category: cannedCategory.trim() || undefined,
      });
      setShowCreateCanned(false);
      setCannedTitle("");
      setCannedContent("");
      setCannedCategory("");
      toast.success("Resposta pronta criada");
      refetchCanned();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar resposta pronta");
    }
  };

  const handleCreateSLA = async () => {
    try {
      await createSLARule.mutateAsync({
        priority: slaPriority,
        responseTimeMinutes: parseInt(slaResponse),
        resolutionTimeMinutes: parseInt(slaResolution),
        departmentId: selectedDeptId || undefined,
      });
      setShowCreateSLA(false);
      toast.success("Regra SLA criada");
      refetchSLA();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar regra SLA");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/support")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Configuração de Suporte</h1>
              <p className="text-gray-400 text-sm">Departamentos, respostas prontas e SLA</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="departments" className="space-y-4">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="departments">Departamentos</TabsTrigger>
            <TabsTrigger value="canned">Respostas Prontas</TabsTrigger>
            <TabsTrigger value="sla">Regras SLA</TabsTrigger>
          </TabsList>

          <TabsContent value="departments" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setShowCreateDept(true)} className="bg-primary">
                <Plus className="w-4 h-4 mr-2" />
                Novo Departamento
              </Button>
            </div>

            {loadingDepts ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <Card key={dept.id} className="bg-card border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{dept.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {dept.description || "Sem descrição"}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={dept.isActive ? "bg-green-500/10 text-green-500" : "bg-gray-500/10 text-gray-500"}
                      >
                        {dept.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Status:</span>
                          <Switch
                            checked={dept.isActive}
                            onCheckedChange={() => handleToggleDept(dept.id, dept.isActive)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDeptId(dept.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="canned" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <select
                  value={selectedDeptId || ""}
                  onChange={(e) => setSelectedDeptId(e.target.value || null)}
                  className="h-10 px-3 rounded-lg bg-secondary border border-white/10 text-white text-sm"
                >
                  <option value="">Todos os departamentos</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={() => setShowCreateCanned(true)} className="bg-primary">
                <Plus className="w-4 h-4 mr-2" />
                Nova Resposta
              </Button>
            </div>

            {loadingCanned ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : cannedResponses.length === 0 ? (
              <Card className="bg-card border-white/5">
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-30" />
                  <p className="text-gray-400">Nenhuma resposta pronta cadastrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {cannedResponses.map((resp) => (
                  <Card key={resp.id} className="bg-card border-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-white">{resp.title}</h4>
                            {resp.category && (
                              <Badge variant="outline" className="text-xs">
                                {resp.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 line-clamp-2">{resp.content}</p>
                          <p className="text-xs text-gray-500 mt-2">Usado {resp.usageCount} vezes</p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sla" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <select
                  value={selectedDeptId || ""}
                  onChange={(e) => setSelectedDeptId(e.target.value || null)}
                  className="h-10 px-3 rounded-lg bg-secondary border border-white/10 text-white text-sm"
                >
                  <option value="">Todos os departamentos</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={() => setShowCreateSLA(true)} className="bg-primary">
                <Plus className="w-4 h-4 mr-2" />
                Nova Regra
              </Button>
            </div>

            {loadingSLA ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : slaRules.length === 0 ? (
              <Card className="bg-card border-white/5">
                <CardContent className="text-center py-12">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-500 opacity-30" />
                  <p className="text-gray-400">Nenhuma regra SLA cadastrada</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {slaRules.map((rule) => (
                  <Card key={rule.id} className="bg-card border-white/5">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={cn(
                            rule.priority === "URGENT"
                              ? "bg-red-500/10 text-red-500"
                              : rule.priority === "HIGH"
                              ? "bg-orange-500/10 text-orange-500"
                              : rule.priority === "NORMAL"
                              ? "bg-blue-500/10 text-blue-500"
                              : "bg-gray-500/10 text-gray-500"
                          )}
                        >
                          {rule.priority}
                        </Badge>
                        <Badge variant="outline" className={rule.isActive ? "bg-green-500/10 text-green-500" : "bg-gray-500/10"}>
                          {rule.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Resposta:</span>
                        <span className="text-white">{rule.responseTimeMinutes} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Resolução:</span>
                        <span className="text-white">{rule.resolutionTimeMinutes} min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Nível escalonamento:</span>
                        <span className="text-white">{rule.escalationLevel}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showCreateDept} onOpenChange={setShowCreateDept}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Departamento</DialogTitle>
            <DialogDescription>Crie um novo departamento de suporte</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Nome</label>
              <Input
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                placeholder="Ex: Suporte Técnico"
                className="bg-secondary border-white/10 mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Descrição</label>
              <Textarea
                value={deptDesc}
                onChange={(e) => setDeptDesc(e.target.value)}
                placeholder="Descrição do departamento..."
                className="bg-secondary border-white/10 mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDept(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateDept}
              disabled={!deptName.trim() || createDepartment.isPending}
              className="bg-primary"
            >
              {createDepartment.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateCanned} onOpenChange={setShowCreateCanned}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Resposta Pronta</DialogTitle>
            <DialogDescription>Crie uma resposta para uso rápido</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Título</label>
              <Input
                value={cannedTitle}
                onChange={(e) => setCannedTitle(e.target.value)}
                placeholder="Ex: Boas-vindas"
                className="bg-secondary border-white/10 mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Categoria (opcional)</label>
              <Input
                value={cannedCategory}
                onChange={(e) => setCannedCategory(e.target.value)}
                placeholder="Ex: Saudações"
                className="bg-secondary border-white/10 mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Conteúdo</label>
              <Textarea
                value={cannedContent}
                onChange={(e) => setCannedContent(e.target.value)}
                placeholder="Texto da resposta..."
                className="bg-secondary border-white/10 mt-1 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCanned(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateCanned}
              disabled={!cannedTitle.trim() || !cannedContent.trim() || createCannedResponse.isPending}
              className="bg-primary"
            >
              {createCannedResponse.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateSLA} onOpenChange={setShowCreateSLA}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Regra SLA</DialogTitle>
            <DialogDescription>Defina os prazos de atendimento</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Prioridade</label>
              <select
                value={slaPriority}
                onChange={(e) => setSLAPriority(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-secondary border border-white/10 text-white mt-1"
              >
                <option value="LOW">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400">Tempo de resposta (minutos)</label>
              <Input
                type="number"
                value={slaResponse}
                onChange={(e) => setSLAResponse(e.target.value)}
                className="bg-secondary border-white/10 mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Tempo de resolução (minutos)</label>
              <Input
                type="number"
                value={slaResolution}
                onChange={(e) => setSLAResolution(e.target.value)}
                className="bg-secondary border-white/10 mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSLA(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateSLA}
              disabled={createSLARule.isPending}
              className="bg-primary"
            >
              {createSLARule.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
