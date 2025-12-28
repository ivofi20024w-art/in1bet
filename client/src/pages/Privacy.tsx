import { MainLayout } from "@/components/layout/MainLayout";
import { Lock, Eye, Shield, FileCheck } from "lucide-react";

export default function Privacy() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-12 text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                <Lock className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-4">Política de Privacidade</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">Sua segurança e privacidade são nossa prioridade.</p>
        </div>

        <div className="bg-card border border-white/5 rounded-2xl p-8 md:p-12 shadow-xl space-y-8 text-gray-300 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                    Coleta de Dados
                </h2>
                <p className="mb-4">
                    Coletamos informações pessoais que você nos fornece diretamente ao registrar uma conta, realizar transações, verificar sua identidade ou entrar em contato com nosso suporte.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                    <li>Informações de Identificação: Nome, data de nascimento, CPF.</li>
                    <li>Informações de Contato: E-mail, número de telefone, endereço.</li>
                    <li>Informações Financeiras: Histórico de transações, chaves PIX.</li>
                    <li>Informações Técnicas: Endereço IP, tipo de dispositivo, navegador.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-blue-500" />
                    Uso das Informações
                </h2>
                <p>
                    Utilizamos seus dados para fornecer e melhorar nossos serviços, processar transações, verificar sua idade e identidade (conforme exigido por lei), prevenir fraudes e personalizar sua experiência no site.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-500" />
                    Segurança de Dados
                </h2>
                <p className="mb-4">
                    Implementamos medidas de segurança técnicas e organizacionais avançadas para proteger seus dados pessoais contra acesso não autorizado, alteração, divulgação ou destruição.
                </p>
                <p className="text-sm bg-blue-500/10 p-4 rounded-lg border border-blue-500/20 text-blue-200">
                    Todas as transações financeiras e dados sensíveis são transmitidos através de criptografia SSL (Secure Socket Layer) de última geração.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">Compartilhamento de Dados</h2>
                <p>
                    Não vendemos ou alugamos seus dados pessoais a terceiros. Podemos compartilhar informações com provedores de serviços confiáveis (como processadores de pagamento) apenas para fins de execução dos serviços contratados.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4">Seus Direitos</h2>
                <p>
                    Você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados pessoais, sujeito a certas obrigações legais de retenção de dados (como leis anti-lavagem de dinheiro). Para exercer esses direitos, entre em contato com nosso Encarregado de Proteção de Dados via suporte.
                </p>
            </section>

             <section>
                <h2 className="text-xl font-bold text-white mb-4">Cookies</h2>
                <p>
                    Utilizamos cookies para melhorar a funcionalidade do site, lembrar suas preferências e analisar o tráfego. Você pode gerenciar suas preferências de cookies nas configurações do seu navegador.
                </p>
            </section>
        </div>
      </div>
    </MainLayout>
  );
}
