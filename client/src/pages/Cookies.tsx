import { MainLayout } from "@/components/layout/MainLayout";
import { Cookie, Settings, Shield } from "lucide-react";

export default function Cookies() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-12 text-center">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Cookie className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-4">Política de Cookies</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">Como utilizamos cookies para melhorar sua experiência.</p>
        </div>

        <div className="bg-card border border-white/5 rounded-2xl p-8 md:p-12 shadow-xl space-y-8 text-gray-300 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-white mb-4">O que são Cookies?</h2>
                <p>
                    Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita nosso site. Eles nos permitem lembrar de suas ações e preferências ao longo do tempo.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">Tipos de Cookies que Usamos</h2>
                <div className="space-y-4">
                    <div className="bg-secondary/20 p-4 rounded-xl border border-white/5">
                        <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-green-500" /> Essenciais
                        </h3>
                        <p className="text-sm text-gray-400">Necessários para o funcionamento do site (login, segurança, apostas). Não podem ser desativados.</p>
                    </div>
                    <div className="bg-secondary/20 p-4 rounded-xl border border-white/5">
                        <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-blue-500" /> Funcionais
                        </h3>
                        <p className="text-sm text-gray-400">Lembram suas preferências de idioma, região e configurações de jogo.</p>
                    </div>
                     <div className="bg-secondary/20 p-4 rounded-xl border border-white/5">
                        <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                            <Cookie className="w-4 h-4 text-orange-500" /> Analíticos
                        </h3>
                        <p className="text-sm text-gray-400">Ajudam-nos a entender como os usuários interagem com o site para melhorar o desempenho.</p>
                    </div>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">Gerenciar Cookies</h2>
                <p>
                    Você pode controlar e/ou excluir cookies conforme desejar através das configurações do seu navegador. Note que desativar cookies essenciais pode afetar o funcionamento da plataforma.
                </p>
            </section>
        </div>
      </div>
    </MainLayout>
  );
}
