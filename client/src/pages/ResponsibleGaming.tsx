import { MainLayout } from "@/components/layout/MainLayout";
import { ShieldCheck, AlertTriangle, Clock, Ban, Phone, Globe, ExternalLink, HeartHandshake, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResponsibleGaming() {
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-16 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-900/20 transform rotate-3">
                <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-black text-white mb-4 tracking-tight">
                JOGO <span className="text-green-500">RESPONSÁVEL</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                Acreditamos que o entretenimento deve ser seguro. Estamos comprometidos em fornecer um ambiente protegido para todos os nossos jogadores.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <Card className="bg-card border-white/5 shadow-xl hover:border-green-500/30 transition-all group">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Scale className="w-6 h-6 text-primary" />
                        </div>
                        Manter o Controle
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-400 text-sm leading-relaxed">
                        O jogo online deve ser visto como uma forma de lazer e não como uma maneira de ganhar dinheiro. Mantenha o controle do tempo e dinheiro gastos.
                    </p>
                    <ul className="space-y-2">
                        {["Jogue apenas por diversão", "Não tente recuperar perdas", "Conheça seus limites", "Faça pausas frequentes"].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-xl hover:border-red-500/30 transition-all group">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                            <HeartHandshake className="w-6 h-6 text-red-500" />
                        </div>
                        Sinais de Alerta
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-gray-400 text-sm leading-relaxed">
                        É importante estar atento aos sinais de que o jogo pode estar deixando de ser uma diversão.
                    </p>
                    <ul className="space-y-2">
                        {["Gastar mais do que pode", "Pedir dinheiro emprestado para jogar", "Esconder o jogo de familiares", "Deixar de pagar contas para jogar"].map((item, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>

        <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                Ferramentas de Proteção
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-secondary/20 rounded-xl p-6 border border-white/5 hover:bg-secondary/30 transition-all">
                    <Clock className="w-8 h-8 text-blue-400 mb-4" />
                    <h3 className="font-bold text-white text-lg mb-2">Limites de Tempo</h3>
                    <p className="text-sm text-gray-400 mb-6">Configure alertas ou limites rígidos para controlar o tempo das suas sessões.</p>
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:text-white">Configurar</Button>
                </div>

                <div className="bg-secondary/20 rounded-xl p-6 border border-white/5 hover:bg-secondary/30 transition-all">
                    <AlertTriangle className="w-8 h-8 text-yellow-400 mb-4" />
                    <h3 className="font-bold text-white text-lg mb-2">Limites de Depósito</h3>
                    <p className="text-sm text-gray-400 mb-6">Defina um valor máximo para depósitos diários, semanais ou mensais.</p>
                    <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:text-white">Configurar</Button>
                </div>

                <div className="bg-secondary/20 rounded-xl p-6 border border-white/5 hover:bg-secondary/30 transition-all">
                    <Ban className="w-8 h-8 text-red-400 mb-4" />
                    <h3 className="font-bold text-white text-lg mb-2">Autoexclusão</h3>
                    <p className="text-sm text-gray-400 mb-6">Bloqueie seu acesso à conta por um período determinado ou permanentemente.</p>
                    <Button variant="outline" className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-400">Solicitar</Button>
                </div>
            </div>
        </div>

        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 md:p-12 border border-white/10 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
            
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Precisa de Ajuda Profissional?</h2>
                    <p className="text-gray-300 mb-8 leading-relaxed">
                        Existem organizações independentes que oferecem suporte gratuito e confidencial para pessoas afetadas pelo jogo.
                    </p>
                    <div className="flex flex-col gap-4">
                        <a href="https://www.gamblingtherapy.org/pt-br/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5 group">
                            <div className="flex items-center gap-3">
                                <Globe className="w-5 h-5 text-green-400" />
                                <span className="font-bold text-white">Gambling Therapy</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                        </a>
                        <a href="https://www.jogadoresanonimos.com.br/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5 group">
                            <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-blue-400" />
                                <span className="font-bold text-white">Jogadores Anônimos</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                        </a>
                    </div>
                </div>
                
                <div className="flex flex-col items-center justify-center text-center p-8 bg-black/20 rounded-xl border border-white/5">
                    <div className="w-16 h-16 border-4 border-red-500 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl font-black text-red-500">18+</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Proibido para Menores</h3>
                    <p className="text-sm text-gray-400 mb-6">
                        É ilegal para menores de 18 anos abrir uma conta ou jogar em nosso site. Realizamos verificações rigorosas de idade.
                    </p>
                    <div className="flex gap-2">
                        <Badge variant="outline" className="border-white/10 text-gray-400">Proteção ao Menor</Badge>
                        <Badge variant="outline" className="border-white/10 text-gray-400">Verificação de Identidade</Badge>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </MainLayout>
  );
}
