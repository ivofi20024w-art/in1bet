import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { FAQS } from "@/lib/mockData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle, Mail, Phone, Ticket, Search, ChevronRight, LifeBuoy, FileText, ArrowRight, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatWidget } from "@/components/support/ChatWidget";

export default function Support() {
  const [showChat, setShowChat] = useState(false);
  
  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="relative w-full bg-[#0f0f15] border-b border-white/5 py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/10 to-transparent" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none px-4 py-1.5 text-sm font-medium">Central de Ajuda 24/7</Badge>
            <h1 className="text-4xl md:text-6xl font-heading font-black text-white tracking-tight">
                Como podemos <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-400">ajudar você?</span>
            </h1>
            
            <div className="max-w-xl mx-auto relative group">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center">
                    <Search className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                        placeholder="Busque por dúvidas, problemas ou tutoriais..." 
                        className="pl-12 h-14 rounded-2xl bg-card border-white/10 shadow-2xl text-lg focus:border-primary/50 transition-all" 
                    />
                    <Button className="absolute right-2 h-10 rounded-xl px-6 font-bold">Buscar</Button>
                </div>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20 pb-24">
        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card className="bg-card border-white/5 shadow-xl hover:border-primary/50 transition-all cursor-pointer group hover:-translate-y-1 duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">Chat Ao Vivo</CardTitle>
                    <CardDescription className="text-gray-400">Resposta média: 2 min</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-gray-400 mb-6 px-4">Fale com nossos especialistas em tempo real para resolver problemas urgentes.</p>
                    <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl h-12" onClick={() => setShowChat(true)}>
                        Iniciar Chat
                    </Button>
                </CardContent>
            </Card>

             <Card className="bg-card border-white/5 shadow-xl hover:border-primary/50 transition-all cursor-pointer group hover:-translate-y-1 duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Ticket className="w-8 h-8 text-blue-500" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">Tickets</CardTitle>
                    <CardDescription className="text-gray-400">Para casos complexos</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-gray-400 mb-6 px-4">Acompanhe o status das suas solicitações ou abra um novo chamado.</p>
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/support/tickets/new" className="w-full">
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl">Novo</Button>
                        </Link>
                        <Link href="/support/tickets" className="w-full">
                            <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 rounded-xl">Meus Tickets</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

             <Card className="bg-card border-white/5 shadow-xl hover:border-primary/50 transition-all cursor-pointer group hover:-translate-y-1 duration-300">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <Mail className="w-8 h-8 text-purple-500" />
                    </div>
                    <CardTitle className="text-xl font-bold text-white">E-mail</CardTitle>
                    <CardDescription className="text-gray-400">Resposta em até 24h</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-gray-400 mb-6 px-4">Envie documentos, comprovantes ou dúvidas gerais para nossa equipe.</p>
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:text-white font-bold rounded-xl h-12">
                        suporte@in1bet.com.br
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* Categories Grid */}
        <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 pl-2 border-l-4 border-primary">Tópicos Populares</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                    { icon: FileText, label: "Depósitos e Saques", desc: "Métodos, prazos e limites", href: "/wallet" },
                    { icon: HelpCircle, label: "Minha Conta", desc: "Verificação, senha e segurança", href: "/profile/settings" },
                    { icon: Ticket, label: "Apostas Esportivas", desc: "Regras, cashout e tipos de aposta", href: "/sports" },
                    { icon: LifeBuoy, label: "Cassino", desc: "Jogos, erros técnicos e rodadas", href: "/casino" },
                    { icon: MessageCircle, label: "Bônus e Promoções", desc: "Rollover, termos e ativação", href: "/promotions" },
                    { icon: Phone, label: "Jogo Responsável", desc: "Limites e autoexclusão", href: "/responsible-gaming" },
                ].map((item, i) => (
                    <Link key={i} href={item.href}>
                        <div className="flex items-start gap-4 p-5 rounded-xl bg-secondary/20 border border-white/5 hover:bg-secondary/40 hover:border-primary/30 transition-all cursor-pointer group h-full">
                            <div className="p-3 bg-card rounded-lg group-hover:bg-primary/10 transition-colors">
                                <item.icon className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white mb-1 group-hover:text-primary transition-colors">{item.label}</h3>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-600 self-center group-hover:translate-x-1 transition-transform opacity-0 group-hover:opacity-100" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Perguntas Frequentes</h2>
            <Accordion type="single" collapsible className="space-y-4">
                {FAQS.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border border-white/5 rounded-xl bg-card px-2 hover:border-white/10 transition-colors">
                        <AccordionTrigger className="hover:no-underline hover:text-primary text-base font-medium px-4 py-4 [&[data-state=open]]:text-primary">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-gray-400 px-4 pb-4 leading-relaxed border-t border-white/5 pt-4 mt-2">
                            {faq.answer}
                        </AccordionContent>
                    </AccordionItem>
                ))}
                <AccordionItem value="item-more-1" className="border border-white/5 rounded-xl bg-card px-2 hover:border-white/10 transition-colors">
                    <AccordionTrigger className="hover:no-underline hover:text-primary text-base font-medium px-4 py-4 [&[data-state=open]]:text-primary">O que é Rollover de Bônus?</AccordionTrigger>
                    <AccordionContent className="text-gray-400 px-4 pb-4 leading-relaxed border-t border-white/5 pt-4 mt-2">
                        O rollover é a quantidade de vezes que você precisa apostar o valor do bônus antes de poder sacá-lo. Por exemplo, se você ganhar R$ 10 de bônus com rollover de 10x, precisará apostar R$ 100 no total.
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-more-2" className="border border-white/5 rounded-xl bg-card px-2 hover:border-white/10 transition-colors">
                    <AccordionTrigger className="hover:no-underline hover:text-primary text-base font-medium px-4 py-4 [&[data-state=open]]:text-primary">Posso cancelar um saque?</AccordionTrigger>
                    <AccordionContent className="text-gray-400 px-4 pb-4 leading-relaxed border-t border-white/5 pt-4 mt-2">
                        Sim, se o saque ainda estiver com status "Pendente", você pode cancelá-lo na página de Histórico ou Carteira e o valor retornará imediatamente ao seu saldo.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
      </div>
      
      {showChat && <ChatWidget />}
    </MainLayout>
  );
}
