import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, FileCheck, CheckCircle2, AlertCircle, ScanFace, CreditCard, ShieldCheck, Loader2, Clock, XCircle, Upload, Camera } from "lucide-react";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";

interface KycStatus {
  kycStatus: string;
  name: string;
  cpf: string | null;
  isVerified: boolean;
  verification: {
    id: string;
    status: string;
    documentType: string;
    rejectionReason: string | null;
    createdAt: string;
    reviewedAt: string | null;
  } | null;
}

export default function Verification() {
  const queryClient = useQueryClient();
  const [documentType, setDocumentType] = useState<"RG" | "CNH">("RG");
  const [documentFront, setDocumentFront] = useState<string>("");
  const [documentBack, setDocumentBack] = useState<string>("");
  const [selfie, setSelfie] = useState<string>("");
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const { data: kycData, isLoading } = useQuery<KycStatus>({
    queryKey: ["/api/kyc/status"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { documentType: string; documentFrontUrl: string; documentBackUrl?: string; selfieUrl: string }) => {
      return await apiRequest("POST", "/api/kyc/submit-documents", data);
    },
    onSuccess: () => {
      toast.success("Documentos enviados! Aguarde a análise.");
      setDocumentFront("");
      setDocumentBack("");
      setSelfie("");
      setStep(1);
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/status"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao enviar documentos");
    },
  });

  const handleFileUpload = (setter: (val: string) => void, nextStep?: 2 | 3) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 10MB.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
        if (nextStep) setStep(nextStep);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!documentFront || !selfie) {
      toast.error("Por favor, envie todos os documentos obrigatórios.");
      return;
    }
    submitMutation.mutate({
      documentType,
      documentFrontUrl: documentFront,
      documentBackUrl: documentBack || undefined,
      selfieUrl: selfie,
    });
  };

  useEffect(() => {
    if (documentFront && !documentBack && step === 1) {
      setStep(2);
    } else if (documentBack && step === 2) {
      setStep(3);
    } else if (selfie && step === 3) {
      setStep(3);
    }
  }, [documentFront, documentBack, selfie]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const isVerified = kycData?.kycStatus === "verified";
  const isPending = kycData?.verification?.status?.toUpperCase() === "PENDING" || kycData?.kycStatus === "pending";
  const isRejected = kycData?.verification?.status?.toUpperCase() === "REJECTED";

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="hover:bg-white/10 rounded-full" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">Verificação da Conta</h1>
            <p className="text-gray-400">Complete o processo de KYC para desbloquear saques.</p>
          </div>
        </div>

        {isVerified ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-12 text-center shadow-[0_0_50px_-20px_rgba(34,197,94,0.3)]" data-testid="status-verified">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
              <ShieldCheck className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white mb-4">Sua conta está Verificada!</h2>
            <p className="text-gray-300 max-w-md mx-auto mb-8 text-lg">
              Parabéns! Sua identidade foi confirmada com sucesso. Você agora tem acesso total a saques.
            </p>
            <div className="inline-flex gap-2 px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30 text-green-400 text-sm font-bold items-center">
              <CheckCircle2 className="w-4 h-4" /> Conta Verificada
            </div>
          </div>
        ) : isPending ? (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-12 text-center" data-testid="status-pending">
            <div className="w-24 h-24 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-12 h-12 text-yellow-500 animate-pulse" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-white mb-4">Verificação em Análise</h2>
            <p className="text-gray-300 max-w-md mx-auto mb-4 text-lg">
              Seus documentos foram enviados e estão sendo analisados pela nossa equipe de segurança.
            </p>
            <p className="text-gray-400 text-sm">
              Tempo médio de análise: 24-48 horas
            </p>
            <div className="inline-flex gap-2 px-4 py-2 bg-yellow-500/20 rounded-lg border border-yellow-500/30 text-yellow-400 text-sm font-bold items-center mt-6">
              <Clock className="w-4 h-4" /> Aguardando Revisão
            </div>
          </div>
        ) : isRejected ? (
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center" data-testid="status-rejected">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-heading font-bold text-white mb-2">Verificação Rejeitada</h2>
              <p className="text-gray-300 max-w-md mx-auto mb-4">
                Infelizmente, não foi possível aprovar seus documentos. Por favor, envie novamente.
              </p>
              {kycData?.verification?.rejectionReason && (
                <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-red-400 text-sm font-medium">Motivo: {kycData.verification.rejectionReason}</p>
                </div>
              )}
            </div>
            
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle>Enviar Novamente</CardTitle>
                <CardDescription>Corrija os problemas apontados e tente novamente</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setStep(1)} className="w-full" data-testid="button-retry">
                  Iniciar Nova Verificação
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="bg-card border-white/5 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">Progresso</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className={`relative pl-8 pb-8 border-l ${step >= 1 ? 'border-primary/30' : 'border-white/10'} last:border-0 last:pb-0`}>
                    <span className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${documentFront ? 'bg-green-500' : step === 1 ? 'bg-white animate-pulse' : 'bg-white/10'} ring-4 ring-background`} />
                    <h4 className={`font-bold ${documentFront ? 'text-green-500' : step === 1 ? 'text-white' : 'text-muted-foreground'} mb-1`}>
                      Passo 1: Frente do Documento
                    </h4>
                    <p className="text-xs text-muted-foreground">Envie a frente do seu RG ou CNH.</p>
                  </div>
                  <div className={`relative pl-8 pb-8 border-l ${step >= 2 ? 'border-primary/30' : 'border-white/10'} last:border-0 last:pb-0`}>
                    <span className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${documentBack ? 'bg-green-500' : step === 2 ? 'bg-white animate-pulse' : 'bg-white/10'} ring-4 ring-background`} />
                    <h4 className={`font-bold ${documentBack ? 'text-green-500' : step === 2 ? 'text-white' : 'text-muted-foreground'} mb-1`}>
                      Passo 2: Verso do Documento
                    </h4>
                    <p className="text-xs text-muted-foreground">Envie o verso do documento (opcional para CNH).</p>
                  </div>
                  <div className={`relative pl-8 border-l ${step >= 3 ? 'border-primary/30' : 'border-white/10'} last:border-0`}>
                    <span className={`absolute left-[-9px] top-0 w-4 h-4 rounded-full ${selfie ? 'bg-green-500' : step === 3 ? 'bg-white animate-pulse' : 'bg-white/10'} ring-4 ring-background`} />
                    <h4 className={`font-bold ${selfie ? 'text-green-500' : step === 3 ? 'text-white' : 'text-muted-foreground'} mb-1`}>
                      Passo 3: Selfie
                    </h4>
                    <p className="text-xs text-muted-foreground">Tire uma selfie segurando o documento.</p>
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

            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-card border-white/5 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary" />
                    Verificação de Identidade
                  </CardTitle>
                  <CardDescription>
                    Selecione o tipo de documento e envie as fotos necessárias.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Tipo de Documento</Label>
                    <Select value={documentType} onValueChange={(v) => setDocumentType(v as "RG" | "CNH")}>
                      <SelectTrigger className="w-full" data-testid="select-document-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RG">RG (Carteira de Identidade)</SelectItem>
                        <SelectItem value="CNH">CNH (Carteira de Motorista)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div
                      onClick={() => frontInputRef.current?.click()}
                      className={`border-2 border-dashed ${documentFront ? 'border-green-500/50 bg-green-500/5' : 'border-white/10'} rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden`}
                      data-testid="upload-front"
                    >
                      <input
                        ref={frontInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload(setDocumentFront, 2)}
                      />
                      {documentFront ? (
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-7 h-7 text-green-500" />
                          </div>
                          <h3 className="font-bold text-green-400 mb-1">Frente Enviada</h3>
                          <p className="text-xs text-gray-500">Clique para trocar</p>
                        </div>
                      ) : (
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <CreditCard className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <h3 className="font-bold text-white mb-1">Frente do Documento</h3>
                          <p className="text-xs text-gray-500 mb-4">Clique para selecionar</p>
                          <Button size="sm" variant="secondary" className="text-xs">
                            <Upload className="w-3 h-3 mr-1" /> Selecionar
                          </Button>
                        </div>
                      )}
                    </div>

                    <div
                      onClick={() => backInputRef.current?.click()}
                      className={`border-2 border-dashed ${documentBack ? 'border-green-500/50 bg-green-500/5' : 'border-white/10'} rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group relative overflow-hidden`}
                      data-testid="upload-back"
                    >
                      <input
                        ref={backInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload(setDocumentBack, 3)}
                      />
                      {documentBack ? (
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-7 h-7 text-green-500" />
                          </div>
                          <h3 className="font-bold text-green-400 mb-1">Verso Enviado</h3>
                          <p className="text-xs text-gray-500">Clique para trocar</p>
                        </div>
                      ) : (
                        <div className="relative z-10">
                          <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                            <CreditCard className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors transform rotate-180" />
                          </div>
                          <h3 className="font-bold text-white mb-1">Verso do Documento</h3>
                          <p className="text-xs text-gray-500 mb-4">Clique para selecionar</p>
                          <Button size="sm" variant="secondary" className="text-xs">
                            <Upload className="w-3 h-3 mr-1" /> Selecionar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    onClick={() => selfieInputRef.current?.click()}
                    className={`border-2 border-dashed ${selfie ? 'border-green-500/50 bg-green-500/5' : 'border-white/10'} rounded-2xl p-8 text-center hover:border-primary/50 hover:bg-white/5 transition-all cursor-pointer group`}
                    data-testid="upload-selfie"
                  >
                    <input
                      ref={selfieInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload(setSelfie)}
                    />
                    {selfie ? (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-7 h-7 text-green-500" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-green-400 mb-1">Selfie Enviada</h3>
                          <p className="text-xs text-gray-500">Clique para trocar</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Camera className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-white mb-1">Selfie com Documento</h3>
                          <p className="text-xs text-gray-500">Tire uma foto segurando o documento ao lado do rosto</p>
                        </div>
                      </div>
                    )}
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

                  <Button
                    onClick={handleSubmit}
                    disabled={!documentFront || !selfie || submitMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-lg shadow-lg shadow-primary/20"
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar para Verificação"
                    )}
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
