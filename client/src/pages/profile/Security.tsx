import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, Smartphone, Key } from "lucide-react";
import { Link } from "wouter";
import { LOGIN_HISTORY } from "@/lib/mockData";

export default function Security() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Link href="/profile">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold text-white">Segurança</h1>
        </div>

        <div className="space-y-6">
            <Card className="bg-card border-white/5">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Key className="w-4 h-4 text-primary" />
                        Alterar Senha
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Senha Atual</Label>
                        <Input type="password" className="bg-secondary/50 border-white/10" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nova Senha</Label>
                            <Input type="password" className="bg-secondary/50 border-white/10" />
                        </div>
                         <div className="space-y-2">
                            <Label>Confirmar Nova Senha</Label>
                            <Input type="password" className="bg-secondary/50 border-white/10" />
                        </div>
                    </div>
                    <div className="pt-2">
                        <Button className="bg-primary hover:bg-primary/90 text-white font-bold">Atualizar Senha</Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-white/5">
                <CardHeader>
                     <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            Autenticação de Dois Fatores (2FA)
                        </CardTitle>
                        <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10">Ativar 2FA</Button>
                     </div>
                    <CardDescription>Proteja sua conta solicitando um código extra ao fazer login.</CardDescription>
                </CardHeader>
            </Card>

            <Card className="bg-card border-white/5">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-primary" />
                        Histórico de Login
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {LOGIN_HISTORY.map((login, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                                <div>
                                    <p className="font-bold text-white text-sm">{login.device}</p>
                                    <p className="text-xs text-gray-500">{login.location} • {login.ip}</p>
                                </div>
                                <span className="text-xs text-gray-400">{login.date}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </MainLayout>
  );
}
