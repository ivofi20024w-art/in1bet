import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2, CheckCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useCreateTicket, useDepartments } from "@/hooks/useSupport";
import { toast } from "sonner";

const categories = [
  { value: "WITHDRAWAL", label: "Saque" },
  { value: "DEPOSIT", label: "Depósito" },
  { value: "KYC", label: "Verificação de Conta" },
  { value: "BONUS", label: "Bônus e Promoções" },
  { value: "TECHNICAL", label: "Problema Técnico" },
  { value: "ACCOUNT", label: "Minha Conta" },
  { value: "GAME", label: "Jogos" },
  { value: "OTHER", label: "Outro" },
];

const priorities = [
  { value: "LOW", label: "Baixa", description: "Dúvida geral ou sugestão" },
  { value: "NORMAL", label: "Normal", description: "Problema que não impede o uso" },
  { value: "HIGH", label: "Alta", description: "Problema que afeta minha experiência" },
  { value: "URGENT", label: "Urgente", description: "Problema crítico que precisa de atenção imediata" },
];

export default function CreateTicket() {
  const [, setLocation] = useLocation();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [departmentId, setDepartmentId] = useState("");
  const [success, setSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  const { data: departments = [] } = useDepartments();
  const createTicket = useCreateTicket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const result = await createTicket.mutateAsync({
        subject: subject.trim(),
        message: message.trim(),
        category: category || undefined,
        priority,
        departmentId: departmentId || undefined,
      });

      if (result.success && result.ticket) {
        setTicketNumber(result.ticket.ticketNumber);
        setSuccess(true);
        toast.success("Ticket criado com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar ticket");
    }
  };

  if (success) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="bg-card border-white/5 text-center">
            <CardContent className="pt-12 pb-8 space-y-6">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Ticket Criado!</h2>
                <p className="text-gray-400">
                  Seu ticket foi aberto com sucesso. Nossa equipe irá analisá-lo em breve.
                </p>
              </div>
              <div className="bg-secondary/50 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-1">Número do Ticket</p>
                <p className="text-2xl font-mono font-bold text-primary" data-testid="text-ticket-number">
                  {ticketNumber}
                </p>
              </div>
              <div className="flex gap-4 justify-center pt-4">
                <Link href="/support/tickets">
                  <Button variant="outline" className="border-white/10">
                    Ver Meus Tickets
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setSubject("");
                    setMessage("");
                    setCategory("");
                    setPriority("NORMAL");
                    setDepartmentId("");
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  Abrir Outro Ticket
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/support")}
            className="pl-0 hover:bg-transparent hover:text-primary mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Ajuda
          </Button>
          <h1 className="text-3xl font-heading font-bold text-white">Abrir Novo Ticket</h1>
          <p className="text-gray-400 text-sm mt-1">
            Preencha as informações abaixo para criar uma solicitação de suporte
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle>Informações do Ticket</CardTitle>
              <CardDescription>Quanto mais detalhes, melhor poderemos ajudá-lo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Assunto *</label>
                <Input
                  placeholder="Descreva brevemente o problema..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-secondary/50 border-white/10"
                  data-testid="input-ticket-subject"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-white/10 text-white text-sm"
                    data-testid="select-ticket-category"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">Departamento</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-secondary/50 border border-white/10 text-white text-sm"
                    data-testid="select-ticket-department"
                  >
                    <option value="">Automático</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Prioridade</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        priority === p.value
                          ? "bg-primary/10 border-primary/50 text-primary"
                          : "bg-secondary/30 border-white/10 text-gray-400 hover:border-white/20"
                      }`}
                      data-testid={`button-priority-${p.value}`}
                    >
                      <span className="font-bold text-sm block">{p.label}</span>
                      <span className="text-xs opacity-70">{p.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Descrição do Problema *</label>
                <Textarea
                  placeholder="Descreva o problema em detalhes. Inclua informações como: quando começou, o que você tentou fazer, mensagens de erro, etc."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-secondary/50 border-white/10 min-h-[200px] resize-none"
                  data-testid="input-ticket-message"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Link href="/support">
                  <Button type="button" variant="outline" className="border-white/10">
                    Cancelar
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={!subject.trim() || !message.trim() || createTicket.isPending}
                  className="bg-primary hover:bg-primary/90 min-w-[160px]"
                  data-testid="button-submit-ticket"
                >
                  {createTicket.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Ticket
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
}
