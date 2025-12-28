import { MainLayout } from "@/components/layout/MainLayout";
import { FAQS } from "@/lib/mockData";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MessageCircle, Mail, Phone, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Support() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-4xl font-heading font-bold text-white mb-8 text-center">Central de Ajuda</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            <div className="bg-card border border-white/5 p-6 rounded-xl flex flex-col items-center text-center hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white mb-2">Chat Ao Vivo</h3>
                <p className="text-xs text-gray-400 mb-4">Tempo médio: 2 min</p>
                <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary hover:text-white" onClick={() => alert("Simulando abertura do JivoChat...")}>Iniciar</Button>
            </div>

             <div className="bg-card border border-white/5 p-6 rounded-xl flex flex-col items-center text-center hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <Ticket className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white mb-2">Tickets</h3>
                <p className="text-xs text-gray-400 mb-4">Problemas complexos</p>
                <Link href="/support/tickets">
                    <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary hover:text-white">Meus Tickets</Button>
                </Link>
            </div>

             <div className="bg-card border border-white/5 p-6 rounded-xl flex flex-col items-center text-center hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white mb-2">Email</h3>
                <p className="text-xs text-gray-400 mb-4">suporte@primebet.com</p>
                <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary hover:text-white">Copiar</Button>
            </div>

            <div className="bg-card border border-white/5 p-6 rounded-xl flex flex-col items-center text-center hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white mb-2">Telefone</h3>
                <p className="text-xs text-gray-400 mb-4">0800 123 4567</p>
                <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary hover:text-white">Ligar</Button>
            </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Perguntas Frequentes</h2>
        <Accordion type="single" collapsible className="space-y-4">
            {FAQS.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-white/5 rounded-xl bg-card px-4">
                    <AccordionTrigger className="hover:no-underline hover:text-primary text-lg">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-gray-400">
                        {faq.answer}
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      </div>
    </MainLayout>
  );
}
