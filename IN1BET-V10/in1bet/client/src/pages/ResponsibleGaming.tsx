import { MainLayout } from "@/components/layout/MainLayout";
import { ShieldCheck, AlertTriangle, Clock, Ban, Phone, Globe, ExternalLink, HeartHandshake, Scale, Users, Lightbulb, PieChart, Timer, Settings, Brain, Heart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function ResponsibleGaming() {
  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="text-center mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <ShieldCheck className="w-4 h-4" />
            Seu bem-estar é nossa prioridade
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-white mb-6 tracking-tight">
            JOGO <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">RESPONSÁVEL</span>
          </h1>
          
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Jogar deve ser divertido. Estamos comprometidos em oferecer um ambiente seguro 
            e as ferramentas necessárias para você manter o controle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:bg-emerald-500/20 transition-colors">
                  <Scale className="w-6 h-6 text-emerald-400" />
                </div>
                Jogar com equilíbrio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-zinc-400 leading-relaxed">
                O jogo online é uma forma de entretenimento, não uma maneira de ganhar dinheiro. 
                Assim como ir ao cinema ou jantar fora, defina um orçamento específico para isso.
              </p>
              <div className="space-y-3">
                {[
                  { icon: Heart, text: "Jogue apenas por diversão, nunca por necessidade" },
                  { icon: PieChart, text: "Defina um orçamento mensal e respeite-o" },
                  { icon: Timer, text: "Faça pausas regulares durante as sessões" },
                  { icon: Brain, text: "Nunca jogue sob efeito de álcool ou estresse" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                    <item.icon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-zinc-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-red-500/20 hover:border-red-500/40 transition-all duration-300 group">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                Sinais de alerta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-zinc-400 leading-relaxed">
                Reconhecer os sinais precoces é o primeiro passo. Se você se identificar 
                com algum destes comportamentos, talvez seja hora de buscar ajuda.
              </p>
              <div className="space-y-3">
                {[
                  "Gastar mais do que você pode perder",
                  "Pedir dinheiro emprestado para jogar",
                  "Mentir para família sobre seus hábitos de jogo",
                  "Tentar recuperar perdas aumentando as apostas",
                  "Deixar de pagar contas para jogar",
                  "Sentir irritação quando tenta parar"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ferramentas de Controle
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto">
              Oferecemos diversas ferramentas para ajudar você a manter o controle sobre sua atividade de jogo.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: PieChart,
                title: "Limites de Depósito",
                desc: "Defina valores máximos diários, semanais ou mensais para seus depósitos.",
                color: "blue",
                action: "Configurar"
              },
              {
                icon: Timer,
                title: "Limites de Tempo",
                desc: "Configure alertas ou limites rígidos para suas sessões de jogo.",
                color: "purple",
                action: "Configurar"
              },
              {
                icon: Clock,
                title: "Verificação de Realidade",
                desc: "Receba notificações periódicas sobre quanto tempo você está jogando.",
                color: "amber",
                action: "Ativar"
              },
              {
                icon: Ban,
                title: "Autoexclusão",
                desc: "Bloqueie seu acesso à conta por um período ou permanentemente.",
                color: "red",
                action: "Solicitar"
              }
            ].map((tool, i) => {
              const colorClasses = {
                blue: "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/20",
                purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/20",
                amber: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/20",
                red: "bg-red-500/10 text-red-400 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/20"
              };
              const iconColor = colorClasses[tool.color as keyof typeof colorClasses].split(" ")[1];
              
              return (
                <div 
                  key={i} 
                  className="bg-zinc-900/80 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${colorClasses[tool.color as keyof typeof colorClasses].split(" ").slice(0, 2).join(" ")} transition-all`}>
                    <tool.icon className={`w-6 h-6 ${iconColor}`} />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{tool.title}</h3>
                  <p className="text-sm text-zinc-500 mb-5 leading-relaxed">{tool.desc}</p>
                  <Link href="/profile/responsible-gaming">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={`w-full border-white/10 hover:bg-white/5 ${tool.color === 'red' ? 'text-red-400 hover:text-red-300' : ''}`}
                    >
                      {tool.action}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-16">
          <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
            
            <div className="relative p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                <div>
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-4">
                    <HeartHandshake className="w-4 h-4" />
                    APOIO PROFISSIONAL
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Você não está sozinho
                  </h2>
                  <p className="text-zinc-400 mb-8 leading-relaxed">
                    Se você ou alguém próximo está enfrentando dificuldades com o jogo, 
                    existem organizações que oferecem suporte gratuito, sigiloso e profissional.
                  </p>
                  
                  <div className="space-y-3">
                    {[
                      { 
                        name: "Gambling Therapy", 
                        desc: "Suporte online gratuito em português",
                        url: "https://www.gamblingtherapy.org/pt-br/",
                        icon: Globe,
                        color: "emerald"
                      },
                      { 
                        name: "Jogadores Anônimos Brasil", 
                        desc: "Grupos de apoio presenciais e online",
                        url: "https://www.jogadoresanonimos.com.br/",
                        icon: Users,
                        color: "blue"
                      },
                      { 
                        name: "CVV - Centro de Valorização da Vida", 
                        desc: "Ligação gratuita: 188 (24h)",
                        url: "https://cvv.org.br/",
                        icon: Phone,
                        color: "yellow"
                      }
                    ].map((org, i) => (
                      <a 
                        key={i}
                        href={org.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/10 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            org.color === 'emerald' ? 'bg-emerald-500/10' : 
                            org.color === 'blue' ? 'bg-blue-500/10' : 'bg-yellow-500/10'
                          }`}>
                            <org.icon className={`w-5 h-5 ${
                              org.color === 'emerald' ? 'text-emerald-400' : 
                              org.color === 'blue' ? 'text-blue-400' : 'text-yellow-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-primary transition-colors">{org.name}</p>
                            <p className="text-xs text-zinc-500">{org.desc}</p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
                
                <div className="flex flex-col items-center text-center p-8 bg-zinc-800/50 rounded-2xl border border-white/5">
                  <div className="w-24 h-24 border-4 border-red-500 rounded-full flex items-center justify-center mb-6 bg-red-500/10">
                    <span className="text-4xl font-black text-red-500">18+</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Proibido para Menores</h3>
                  <p className="text-zinc-400 mb-6 leading-relaxed">
                    É ilegal para menores de 18 anos participar de jogos de azar. 
                    Realizamos verificações rigorosas de idade e identidade.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge className="bg-zinc-700/50 text-zinc-400 border-0">Verificação de Idade</Badge>
                    <Badge className="bg-zinc-700/50 text-zinc-400 border-0">Proteção ao Menor</Badge>
                    <Badge className="bg-zinc-700/50 text-zinc-400 border-0">KYC Obrigatório</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center bg-zinc-900/50 rounded-2xl p-8 border border-white/5">
          <Lightbulb className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-3">Precisa de ajuda?</h3>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            Nossa equipe de suporte está disponível 24 horas para ajudar com 
            qualquer questão relacionada a jogo responsável.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/support">
              <Button className="bg-primary hover:bg-primary/90">
                Falar com Suporte
              </Button>
            </Link>
            <Link href="/profile/responsible-gaming">
              <Button variant="outline" className="border-white/10 hover:bg-white/5">
                <Settings className="w-4 h-4 mr-2" />
                Configurar Limites
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
