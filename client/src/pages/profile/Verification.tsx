import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, FileCheck, UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { USER } from "@/lib/mockData";

export default function Verification() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Link href="/profile">
                <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
            </Link>
            <h1 className="text-3xl font-heading font-bold text-white">Verificação da Conta</h1>
        </div>

        {USER.kycStatus === 'Verificada' ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-500 mb-2">Conta Verificada</h2>
                <p className="text-gray-400">Sua identidade foi confirmada. Você tem acesso total a todos os recursos.</p>
            </div>
        ) : (
             <div className="space-y-6">
                <Card className="bg-card border-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-primary" />
                            Envio de Documentos (KYC)
                        </CardTitle>
                        <CardDescription>Para garantir a segurança da plataforma e cumprir regulações, precisamos validar sua identidade.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-secondary/30 rounded-lg p-4 border border-white/5 flex gap-3 items-start">
                            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-300">Aceitamos RG, CNH ou Passaporte. O documento deve estar legível e com todas as bordas visíveis.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                                <UploadCloud className="w-10 h-10 text-gray-500 mx-auto mb-3 group-hover:text-primary transition-colors" />
                                <h3 className="font-bold text-white mb-1">Frente do Documento</h3>
                                <p className="text-xs text-gray-500">Clique para enviar</p>
                             </div>
                              <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer group">
                                <UploadCloud className="w-10 h-10 text-gray-500 mx-auto mb-3 group-hover:text-primary transition-colors" />
                                <h3 className="font-bold text-white mb-1">Verso do Documento</h3>
                                <p className="text-xs text-gray-500">Clique para enviar</p>
                             </div>
                        </div>

                        <Button className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12">Enviar para Análise</Button>
                    </CardContent>
                </Card>
             </div>
        )}
      </div>
    </MainLayout>
  );
}
