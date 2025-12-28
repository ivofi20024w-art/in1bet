import { MainLayout } from "@/components/layout/MainLayout";
import { FAQS } from "@/lib/mockData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle, Mail, Phone, Ticket, Search, ChevronRight, LifeBuoy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

export default function Support() {
  return (
    <MainLayout>
      <div className="relative h-64 w-full bg-secondary/20 -mt-8 mb-8 flex flex-col items-center justify-center border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-2xl px-6 animate-in slide-in-from-bottom-4 duration-700">
             <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-lg shadow-primary/10">
                <LifeBuoy className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-4">Como podemos ajudar?</h1>
            <div className="relative max-w-lg mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                    placeholder="Busque por 'saque', 'bônus', 'verificação'..." 
                    className="pl-12 h-14 rounded-full bg-card/80 border-white/10 backdrop-blur-md shadow-xl text-lg focus-visible:ring-primary" 
                />
            </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 -mt-16 relative z-20">
            <Card className="bg-card border-white/5 hover:border-primary/50 transition-all cursor-pointer group shadow-xl hover:-translate-y-1 duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-500 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Chat Ao Vivo</h3>
                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">Converse com nossos especialistas em tempo real. Disponível 24/7.</p>
                    <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold" onClick={() => alert("Simulando abertura do JivoChat...")}>
                        Iniciar Conversa
                    </Button>
                </CardContent>
            </Card>

             <Card className="bg-card border-white/5 hover:border-primary/50 transition-all cursor-pointer group shadow-xl hover:-translate-y-1 duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                        <Ticket className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Abrir Ticket</h3>
                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">Para questões mais complexas que exigem análise detalhada.</p>
                    <Link href="/support/tickets" className="w-full">
                        <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:border-primary/50 hover:text-primary">
                            Meus Tickets
                        </Button>
                    </Link>
                </CardContent>
            </Card>

             <Card className="bg-card border-white/5 hover:border-primary/50 transition-all cursor-pointer group shadow-xl hover:-translate-y-1 duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-purple-500/10 rounded-full flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                        <Mail className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Email</h3>
                    <p className="text-sm text-gray-400 mb-6 leading-relaxed">Envie documentos ou dúvidas gerais para nossa equipe.</p>
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:border-primary/50 hover:text-primary">
                        suporte@primebet.com
                    </Button>
                </CardContent>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
            <div className="lg:col-span-2">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" />
                    Perguntas Frequentes
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                    {FAQS.map((faq, index) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border border-white/5 rounded-xl bg-card px-2 hover:border-white/10 transition-colors">
                            <AccordionTrigger className="hover:no-underline hover:text-primary text-base font-medium px-4 py-4">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-gray-400 px-4 pb-4 leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                    <AccordionItem value="item-more-1" className="border border-white/5 rounded-xl bg-card px-2 hover:border-white/10 transition-colors">
                        <AccordionTrigger className="hover:no-underline hover:text-primary text-base font-medium px-4 py-4">O que é Rollover de Bônus?</AccordionTrigger>
                        <AccordionContent className="text-gray-400 px-4 pb-4 leading-relaxed">
                            O rollover é a quantidade de vezes que você precisa apostar o valor do bônus antes de poder sacá-lo. Por exemplo, se você ganhar R$ 10 de bônus com rollover de 10x, precisará apostar R$ 100 no total.
                        </AccordionContent>
                    </AccordionItem>
                     <AccordionItem value="item-more-2" className="border border-white/5 rounded-xl bg-card px-2 hover:border-white/10 transition-colors">
                        <AccordionTrigger className="hover:no-underline hover:text-primary text-base font-medium px-4 py-4">Posso cancelar um saque?</AccordionTrigger>
                        <AccordionContent className="text-gray-400 px-4 pb-4 leading-relaxed">
                            Sim, se o saque ainda estiver com status "Pendente", você pode cancelá-lo na página de Histórico ou Carteira e o valor retornará imediatamente ao seu saldo.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>

            <div className="space-y-6">
                <h3 className="font-bold text-white text-lg">Categorias Populares</h3>
                <div className="space-y-2">
                    {["Depósitos e Saques", "Minha Conta", "Bônus e Promoções", "Regras de Apostas", "Jogo Responsável", "Problemas Técnicos"].map((category) => (
                        <div key={category} className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-white/5 hover:bg-white/5 hover:border-primary/30 transition-all cursor-pointer group">
                            <span className="text-sm font-medium text-gray-300 group-hover:text-white">{category}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </MainLayout>
  );
}
