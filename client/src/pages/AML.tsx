import { MainLayout } from "@/components/layout/MainLayout";
import { ShieldAlert, Search, FileSearch, Banknote } from "lucide-react";

export default function AML() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-12 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-6">
                <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-4">Política AML / KYC</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">Combate à Lavagem de Dinheiro e Conheça Seu Cliente</p>
        </div>

        <div className="bg-card border border-white/5 rounded-2xl p-8 md:p-12 shadow-xl space-y-8 text-gray-300 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-white mb-4">Compromisso</h2>
                <p>
                    A IN1Bet está comprometida com os mais altos padrões de combate à lavagem de dinheiro (AML) e financiamento do terrorismo. Implementamos políticas rigorosas para deter, impedir e relatar atividades suspeitas.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-red-500" />
                    Procedimentos KYC (Know Your Customer)
                </h2>
                <p className="mb-4">
                    Para cumprir com as regulamentações internacionais, exigimos a verificação da identidade de nossos usuários.
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400">
                    <li><strong>Verificação de Identidade:</strong> Documento oficial com foto (RG, CNH, Passaporte).</li>
                    <li><strong>Comprovante de Endereço:</strong> Conta de serviço público ou extrato bancário recente.</li>
                    <li><strong>Verificação de Fonte de Fundos:</strong> Em casos de grandes volumes, podemos solicitar comprovantes de origem dos recursos.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-red-500" />
                    Monitoramento de Transações
                </h2>
                <p>
                    Todas as transações são monitoradas por sistemas automatizados e manuais para identificar padrões incomuns ou suspeitos, como:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-400 mt-2">
                    <li>Depósitos seguidos de saques imediatos sem atividade de jogo.</li>
                    <li>Transações fracionadas para evitar limites de reporte (smurfing).</li>
                    <li>Uso de múltiplas contas ou contas de terceiros.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <FileSearch className="w-5 h-5 text-red-500" />
                    Reporte de Atividades
                </h2>
                <p>
                    Qualquer atividade considerada suspeita será reportada às autoridades competentes (UIF/COAF) sem aviso prévio ao usuário, conforme exigido por lei. Contas envolvidas em lavagem de dinheiro serão bloqueadas e os fundos retidos.
                </p>
            </section>
        </div>
      </div>
    </MainLayout>
  );
}
