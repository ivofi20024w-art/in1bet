import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Bell, Globe, Percent } from "lucide-react";
import { Link } from "wouter";

export default function Settings() {
  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Link href="/profile">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold text-white">Preferências</h1>
        </div>

        <div className="space-y-6">
            <Card className="bg-card border-white/5">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="w-4 h-4 text-primary" />
                        Geral
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Idioma</Label>
                        <Select defaultValue="pt-BR">
                            <SelectTrigger className="bg-secondary/50 border-white/10">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Formato de Odds</Label>
                        <Select defaultValue="decimal">
                            <SelectTrigger className="bg-secondary/50 border-white/10">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="decimal">Decimal (2.50)</SelectItem>
                                <SelectItem value="fractional">Fracionária (3/2)</SelectItem>
                                <SelectItem value="american">Americano (+150)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-card border-white/5">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="w-4 h-4 text-primary" />
                        Notificações
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Email Marketing</Label>
                            <p className="text-sm text-gray-500">Receber ofertas e bônus por email</p>
                        </div>
                        <Switch />
                    </div>
                     <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">Notificações Push</Label>
                            <p className="text-sm text-gray-500">Alertas sobre suas apostas no navegador</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                     <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="text-base">SMS</Label>
                            <p className="text-sm text-gray-500">Alertas de segurança e saques</p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
            </Card>

             <div className="flex justify-end">
                <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-8">Salvar Alterações</Button>
            </div>
        </div>
      </div>
    </MainLayout>
  );
}
