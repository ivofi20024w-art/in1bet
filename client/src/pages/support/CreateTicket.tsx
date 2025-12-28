import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function CreateTicket() {
  const [, setLocation] = useLocation();

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/support')}>
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-3xl font-heading font-bold text-white">Novo Ticket</h1>
        </div>

        <div className="bg-card border border-white/5 rounded-xl p-8">
            <form className="space-y-6">
                <div className="space-y-2">
                    <Label>Assunto</Label>
                    <Input placeholder="Resumo do problema" className="bg-secondary/50 border-white/10" />
                </div>

                <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Select>
                        <SelectTrigger className="bg-secondary/50 border-white/10">
                            <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="finance">Financeiro / Saques</SelectItem>
                            <SelectItem value="tech">Técnico / Jogos</SelectItem>
                            <SelectItem value="verify">Verificação de Conta</SelectItem>
                            <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label>Mensagem</Label>
                    <Textarea 
                        placeholder="Descreva seu problema detalhadamente..." 
                        className="bg-secondary/50 border-white/10 min-h-[150px]" 
                    />
                </div>

                <div className="pt-4 flex gap-4">
                    <Button type="button" variant="outline" className="w-full border-white/10 hover:bg-white/5" onClick={() => setLocation('/support')}>Cancelar</Button>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold">
                        <Send className="w-4 h-4 mr-2" />
                        Enviar Ticket
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </MainLayout>
  );
}
