import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { User, Wallet, CheckCircle2, AlertTriangle, Shield, Settings, ChevronRight, ArrowDownLeft, History, Loader2, Camera, X, Check } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useCallback } from "react";
import { getStoredAuth, getWallet, getCurrentUser, type User as UserType, storeAuth, type AuthState } from "@/lib/auth";
import { WalletModal } from "@/components/wallet/WalletModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface WalletData {
  balance: number;
  lockedBalance: number;
  currency: string;
}

const MALE_AVATARS = Array.from({ length: 35 }, (_, i) => ({
  id: `male_${i + 1}`,
  url: `/avatars/male/avatar_m_${String(i + 1).padStart(2, '0')}.png`,
  gender: 'male' as const,
}));

const FEMALE_AVATARS = Array.from({ length: 15 }, (_, i) => ({
  id: `female_${i + 1}`,
  url: `/avatars/female/avatar_f_${String(i + 1).padStart(2, '0')}.png`,
  gender: 'female' as const,
}));

const ALL_AVATARS = [...MALE_AVATARS, ...FEMALE_AVATARS];

export default function Profile() {
  const [user, setUser] = useState<UserType | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarFilter, setAvatarFilter] = useState<'all' | 'male' | 'female'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    const auth = getStoredAuth();
    
    if (auth.isAuthenticated && auth.user) {
      setUser(auth.user);
      setSelectedAvatar(auth.user.avatarUrl || null);
      const walletData = await getWallet();
      setWallet(walletData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveAvatar = async () => {
    if (!user) return;
    
    setSavingAvatar(true);
    try {
      const auth = getStoredAuth();
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.accessToken}`,
        },
        body: JSON.stringify({ avatarUrl: selectedAvatar }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar avatar');
      }
      
      const data = await response.json();
      
      const updatedAuth: AuthState = {
        ...auth,
        user: data.user,
      };
      storeAuth(updatedAuth);
      setUser(data.user);
      
      toast.success('Avatar atualizado com sucesso!');
      setShowAvatarModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar avatar');
    } finally {
      setSavingAvatar(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  };

  const maskCPF = (cpf: string) => {
    if (!cpf) return "---";
    const clean = cpf.replace(/\D/g, '');
    if (clean.length !== 11) return cpf;
    return `***.${clean.slice(3, 6)}.***-${clean.slice(9, 11)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' });
  };

  const getVipLevelLabel = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'bronze': return 'Bronze';
      case 'silver': return 'Prata';
      case 'gold': return 'Ouro';
      case 'platinum': return 'Platina';
      case 'diamond': return 'Diamante';
      default: return level || 'Bronze';
    }
  };

  const getKycStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'verified': return 'Verificado';
      case 'pending': return 'Pendente';
      case 'rejected': return 'Recusado';
      default: return 'Pendente';
    }
  };

  const filteredAvatars = avatarFilter === 'all' 
    ? ALL_AVATARS 
    : ALL_AVATARS.filter(a => a.gender === avatarFilter);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <User className="w-16 h-16 text-gray-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Faça login para continuar</h2>
          <p className="text-gray-400 mb-6">Você precisa estar logado para ver seu perfil.</p>
          <Link href="/">
            <Button className="bg-primary hover:bg-primary/90">Entrar</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const isVerified = user.kycStatus === 'verified';
  const balance = wallet?.balance || 0;
  const lockedBalance = wallet?.lockedBalance || 0;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary shadow-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center cursor-pointer group"
              onClick={() => setShowAvatarModal(true)}
            >
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary">{(user.username || user.name).charAt(0).toUpperCase()}</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold font-heading text-white" data-testid="text-user-name">{user.username || user.name}</h1>
              <p className="text-gray-400 text-sm" data-testid="text-user-email">{user.email}</p>
              <p className="text-gray-500 text-xs mt-0.5">Nome: {user.name}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20" data-testid="badge-vip-level">
                  {getVipLevelLabel(user.vipLevel)}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={isVerified 
                    ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                  }
                  data-testid="badge-kyc-status"
                >
                  {getKycStatusLabel(user.kycStatus)}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {!isVerified && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-yellow-500 text-sm">Verificação Pendente</p>
              <p className="text-xs text-muted-foreground">Para aumentar seus limites e liberar saques, complete sua verificação.</p>
            </div>
            <Link href="/profile/verification">
              <Button size="sm" variant="outline" className="border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/20 shrink-0" data-testid="button-verify">
                Verificar
              </Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-white/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">Nome</span>
                <span className="text-white text-sm font-medium" data-testid="text-profile-name">{user.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">Email</span>
                <span className="text-white text-sm font-medium" data-testid="text-profile-email">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">CPF</span>
                <span className="text-white text-sm font-medium" data-testid="text-profile-cpf">{maskCPF(user.cpf)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">Telefone</span>
                <span className="text-white text-sm font-medium" data-testid="text-profile-phone">{user.phone || "Não informado"}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-400 text-sm">Membro desde</span>
                <span className="text-white text-sm font-medium" data-testid="text-profile-member-since">{formatDate(user.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

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
                <span className="text-2xl font-bold font-heading text-primary" data-testid="text-profile-balance">
                  R$ {formatCurrency(balance)}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">Saldo Bloqueado</span>
                <span className="text-white text-sm font-medium" data-testid="text-profile-locked">
                  R$ {formatCurrency(lockedBalance)}
                </span>
              </div>
              <div className="pt-2 grid grid-cols-2 gap-3">
                <WalletModal onBalanceUpdate={fetchData}>
                  <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold" data-testid="button-profile-deposit">
                    <ArrowDownLeft className="w-4 h-4 mr-2" />
                    Depositar
                  </Button>
                </WalletModal>
                <Link href="/wallet">
                  <Button variant="outline" className="w-full border-white/10 hover:bg-white/5" data-testid="button-profile-wallet">
                    <Wallet className="w-4 h-4 mr-2" />
                    Carteira
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-xl font-bold text-white mt-8">Configurações e Segurança</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/profile/settings">
            <div className="bg-card border border-white/5 hover:border-primary/50 p-6 rounded-xl cursor-pointer group transition-all" data-testid="link-settings">
              <Settings className="w-8 h-8 text-gray-400 group-hover:text-primary mb-4 transition-colors" />
              <h3 className="font-bold text-white mb-1">Preferências</h3>
              <p className="text-xs text-gray-500">Idioma, odds e notificações</p>
            </div>
          </Link>
          <Link href="/profile/security">
            <div className="bg-card border border-white/5 hover:border-primary/50 p-6 rounded-xl cursor-pointer group transition-all" data-testid="link-security">
              <Shield className="w-8 h-8 text-gray-400 group-hover:text-primary mb-4 transition-colors" />
              <h3 className="font-bold text-white mb-1">Segurança</h3>
              <p className="text-xs text-gray-500">Senha e Dispositivos</p>
            </div>
          </Link>
          <Link href="/history">
            <div className="bg-card border border-white/5 hover:border-primary/50 p-6 rounded-xl cursor-pointer group transition-all" data-testid="link-history">
              <History className="w-8 h-8 text-gray-400 group-hover:text-primary mb-4 transition-colors" />
              <h3 className="font-bold text-white mb-1">Histórico</h3>
              <p className="text-xs text-gray-500">Transações e apostas</p>
            </div>
          </Link>
        </div>

      </div>

      <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
        <DialogContent className="bg-[#111111] border-gray-800 max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Escolher Avatar
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Selecione um avatar para seu perfil
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button 
              variant={avatarFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAvatarFilter('all')}
              className={avatarFilter === 'all' ? 'bg-primary' : ''}
            >
              Todos ({ALL_AVATARS.length})
            </Button>
            <Button 
              variant={avatarFilter === 'male' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAvatarFilter('male')}
              className={avatarFilter === 'male' ? 'bg-blue-600' : ''}
            >
              Masculino ({MALE_AVATARS.length})
            </Button>
            <Button 
              variant={avatarFilter === 'female' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAvatarFilter('female')}
              className={avatarFilter === 'female' ? 'bg-pink-600' : ''}
            >
              Feminino ({FEMALE_AVATARS.length})
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 gap-3">
              {filteredAvatars.map((avatar) => (
                <div
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.url)}
                  className={`relative w-14 h-14 rounded-full overflow-hidden cursor-pointer border-2 transition-all hover:scale-110 ${
                    selectedAvatar === avatar.url 
                      ? 'border-primary ring-2 ring-primary/50' 
                      : 'border-transparent hover:border-white/30'
                  }`}
                >
                  <img 
                    src={avatar.url} 
                    alt={avatar.id} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedAvatar === avatar.url && (
                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedAvatar(user?.avatarUrl || null);
                setShowAvatarModal(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveAvatar}
              disabled={savingAvatar}
              className="bg-primary hover:bg-primary/90"
            >
              {savingAvatar ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Avatar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
