import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileCheck, UploadCloud, CheckCircle2, AlertCircle, ScanFace, CreditCard, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { USER } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";

export default function Verification() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Link href="/profile">
                <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl font-heading font-bold text-white mb-2">Verificação da Conta</h1>
                <p className="text-gray-400">Complete o processo de KYC para desbloquear saques ilimitados e benefícios VIP.</p>
            </div>
        </div>

        {USER.kycStatus === 'Verificada' ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-12 text-center shadow-[0_0_50px_-20px_rgba(34,197,94,0.3)]">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                    <ShieldCheck className="w-12 h-12 text-green-500" />
                </div>
                <h2 className="text-3xl font-heading font-bold text-white mb-4">Sua conta está Verificada!</h2>
                <p className="text-gray-300 max-w-md mx-auto mb-8 text-lg">
                    Parabéns! Sua identidade foi confirmada com sucesso. Você agora tem acesso total a saques instantâneos e limites aumentados.
                </p>
                <div className="inline-flex gap-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30 text-green-400 text-sm font-bold items-center">
                    <CheckCircle2 className="w-4 h-4" /> Nível 2 de Verificação Completo
                </div>
            </div>
        ) : (
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Steps Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-card border-white/5 sticky top-24">
                        <CardHeader>
                            <CardTitle className="text-lg">Progresso</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="relative pl-8 pb-8 border-l border-primary/30 last:border-0 last:pb-0">
                                <span className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                                <h4 className="font-bold text-primary mb-1">Passo 1: Dados Pessoais</h4>
                                <p className="text-xs text-muted-foreground">Nome, Endereço e CPF confirmados.</p>
                            </div>
                            <div className="relative pl-8 pb-8 border-l border-white/10 last:border-0 last:pb-0">
                                <span className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white ring-4 ring-background animate-pulse" />
                                <h4 className="font-bold text-white mb-1">Passo 2: Documentos</h4>
                                <p className="text-xs text-muted-foreground">Envie uma foto do seu RG ou CNH.</p>
                            </div>
                            <div className="relative pl-8 border-l border-white/10 last:border-0">
                                <span className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-white/10 ring-4 ring-background" />
                                <h4 className="font-bold text-muted-foreground mb-1">Passo 3: Selfie</h4>
                                <p className="text-xs text-muted-foreground">Reconhecimento facial rápido.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                         <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
                         <div>
                             <h4 className="font-bold text-blue-400 text-sm">Dados Protegidos</h4>
                             <p className="text-xs text-blue-400/80 mt-1 leading-relaxed">
                                 Suas informações são criptografadas e usadas apenas para verificação legal.
                             </p>
                         </div>
                    </div>
                </div>

                {/* Main Upload Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card border-white/5 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <FileCheck className="w-5 h-5 text-primary" />
                                Envio de Documento (Frente e Verso)
                            </CardTitle>
                            <CardDescription>
                                Aceitamos RG, CNH (Carteira de Motorista) ou Passaporte válido.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                            <CreditCard className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                        <h3 className="font-bold text-white mb-1">Frente do Documento</h3>
                                        <p className="text-xs text-gray-500 mb-4">Clique para selecionar ou arraste aqui</p>
                                        <Button size="sm" variant="secondary" className="text-xs">Selecionar Arquivo</Button>
                                    </div>
                                 </div>

                                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden">
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                                            <CreditCard className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors transform rotate-180" />
                                        </div>
                                        <h3 className="font-bold text-white mb-1">Verso do Documento</h3>
                                        <p className="text-xs text-gray-500 mb-4">Clique para selecionar ou arraste aqui</p>
                                        <Button size="sm" variant="secondary" className="text-xs">Selecionar Arquivo</Button>
                                    </div>
                                 </div>
                            </div>

                            <div className="bg-secondary/30 rounded-xl p-6 border border-white/5">
                                <h4 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-primary" /> 
                                    Dicas para aprovação rápida:
                                </h4>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-400">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Sem reflexos ou flash
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Todas as 4 bordas visíveis
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Texto legível e focado
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Documento fora do plástico
                                    </li>
                                </ul>
                            </div>

                            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-lg shadow-lg shadow-primary/20">
                                Enviar e Continuar
                            </Button>
                        </CardContent>
                    </Card>
                </div>
             </div>
        )}
      </div>
    </MainLayout>
  );
}
