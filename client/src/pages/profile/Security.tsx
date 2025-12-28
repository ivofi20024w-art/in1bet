import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Smartphone, Key, AlertTriangle, Fingerprint, History } from "lucide-react";
import { Link } from "wouter";
import { LOGIN_HISTORY } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import securityHero from "@assets/generated_images/secure_shield_with_biometric_data_scanning.png";

export default function Security() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Link href="/profile">
                <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold text-white">Segurança da Conta</h1>
        </div>

        <div className="grid grid-cols-1 gap-6">
            {/* 2FA Highlight Card */}
            <div className="bg-gradient-to-r from-blue-900/40 to-primary/10 border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                
                <div className="relative z-10 p-4 bg-blue-500/20 rounded-full shrink-0">
                    <Shield className="w-8 h-8 text-blue-400" />
                </div>
                
                <div className="flex-1 text-center md:text-left relative z-10">
                    <h3 className="text-xl font-bold text-white mb-2">Autenticação de Dois Fatores (2FA)</h3>
                    <p className="text-gray-300 text-sm mb-4">Adicione uma camada extra de proteção à sua conta exigindo um código do Google Authenticator para fazer login.</p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold border-0 shadow-lg shadow-blue-500/20">
                            <Smartphone className="w-4 h-4 mr-2" /> Ativar 2FA Agora
                        </Button>
                    </div>
                </div>
            </div>

            <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                        <Key className="w-5 h-5" />
                        Alterar Senha
                    </CardTitle>
                    <CardDescription>Recomendamos usar uma senha forte e única para esta conta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Senha Atual</Label>
                        <Input type="password" className="bg-secondary/50 border-white/10 h-11" placeholder="Digite sua senha atual" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <Input type="password" className="bg-secondary/50 border-white/10 h-11" placeholder="Mínimo 8 caracteres" />
                        </div>
                         <div className="space-y-2">
                            <Label>Confirmar Nova Senha</Label>
                            <Input type="password" className="bg-secondary/50 border-white/10 h-11" placeholder="Repita a nova senha" />
                        </div>
                    </div>
                    
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 items-start mt-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-500/90 leading-relaxed">
                            Ao alterar sua senha, você será desconectado de todos os outros dispositivos por segurança.
                        </p>
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold min-w-[150px]">Atualizar Senha</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-primary">
                        <History className="w-5 h-5" />
                        Dispositivos Ativos & Histórico
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {LOGIN_HISTORY.map((login, i) => (
                            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-lg group">
                                <div className="flex items-center gap-4 mb-2 md:mb-0">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-green-500/20 text-green-500' : 'bg-secondary text-muted-foreground'}`}>
                                        {i === 0 ? <Fingerprint className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-white text-sm">{login.device}</p>
                                            {i === 0 && <Badge variant="secondary" className="text-[10px] bg-green-500/10 text-green-500 hover:bg-green-500/20">Atual</Badge>}
                                        </div>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            {login.location} • <span className="font-mono">{login.ip}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pl-14 md:pl-0">
                                    <span className="text-xs text-gray-400 font-medium">{login.date}</span>
                                    {i !== 0 && (
                                        <Button variant="ghost" size="sm" className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8">
                                            Desconectar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                     <div className="pt-6 border-t border-white/5 mt-4 text-center">
                        <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 w-full md:w-auto">
                            Desconectar de todos os dispositivos
                        </Button>
                     </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </MainLayout>
  );
}
