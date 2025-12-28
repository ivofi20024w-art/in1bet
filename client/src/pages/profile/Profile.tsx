import { MainLayout } from "@/components/layout/MainLayout";
import { USER } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { User, Wallet, CheckCircle2, AlertTriangle, Shield, Settings, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Profile() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-lg">
                    <img src={USER.avatar} alt={USER.name} className="w-full h-full object-cover" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-heading text-white">{USER.name}</h1>
                    <p className="text-gray-400">@{USER.username}</p>
                    <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            {USER.vipLevel}
                        </Badge>
                        <Badge variant="outline" className={
                            USER.kycStatus === 'Verificada' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }>
                            {USER.kycStatus}
                        </Badge>
                    </div>
                </div>
            </div>
            
            <Link href="/profile/edit">
                <Button variant="outline" className="border-white/10 hover:bg-white/5">Editar Perfil</Button>
            </Link>
        </div>

        {/* Warning Banner */}
        {USER.kycStatus !== 'Verificada' && (
             <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div className="flex-1">
                    <p className="font-bold text-yellow-500 text-sm">Verificação Pendente</p>
                    <p className="text-xs text-muted-foreground">Para aumentar seus limites e liberar saques, complete sua verificação.</p>
                </div>
                <Link href="/profile/verification">
                    <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20">Verificar Agora</Button>
                </Link>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <Card className="bg-card border-white/5">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Dados Pessoais
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">Email</span>
                        <span className="text-white text-sm font-medium">{USER.email}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">Telefone</span>
                        <span className="text-white text-sm font-medium">{USER.phone}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">Membro desde</span>
                        <span className="text-white text-sm font-medium">{USER.joinDate}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Wallet Summary */}
            <Card className="bg-card border-white/5">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-primary" />
                        Resumo da Carteira
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex justify-between items-center py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">Saldo Disponível</span>
                        <span className="text-2xl font-bold font-heading text-primary">{USER.currency} {USER.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">Em Aposta</span>
                        <span className="text-white text-sm font-medium">R$ 150,00</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/5">
                        <span className="text-gray-400 text-sm">Bônus Pendente</span>
                        <span className="text-white text-sm font-medium">R$ 50,00</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Quick Links Grid */}
        <h2 className="text-xl font-bold text-white mt-8">Configurações e Segurança</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/profile/settings">
                <div className="bg-card border border-white/5 hover:border-primary/50 p-6 rounded-xl cursor-pointer group transition-all">
                    <Settings className="w-8 h-8 text-gray-400 group-hover:text-primary mb-4 transition-colors" />
                    <h3 className="font-bold text-white mb-1">Preferências</h3>
                    <p className="text-xs text-gray-500">Idioma, odds e notificações</p>
                </div>
            </Link>
             <Link href="/profile/security">
                <div className="bg-card border border-white/5 hover:border-primary/50 p-6 rounded-xl cursor-pointer group transition-all">
                    <Shield className="w-8 h-8 text-gray-400 group-hover:text-primary mb-4 transition-colors" />
                    <h3 className="font-bold text-white mb-1">Segurança</h3>
                    <p className="text-xs text-gray-500">Senha e Dispositivos</p>
                </div>
            </Link>
             <Link href="/responsible-gaming">
                <div className="bg-card border border-white/5 hover:border-primary/50 p-6 rounded-xl cursor-pointer group transition-all">
                    <CheckCircle2 className="w-8 h-8 text-gray-400 group-hover:text-primary mb-4 transition-colors" />
                    <h3 className="font-bold text-white mb-1">Jogo Responsável</h3>
                    <p className="text-xs text-gray-500">Limites e autoexclusão</p>
                </div>
            </Link>
        </div>

      </div>
    </MainLayout>
  );
}
