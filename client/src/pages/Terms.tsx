import { MainLayout } from "@/components/layout/MainLayout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, FileText, Scale, AlertCircle } from "lucide-react";

export default function Terms() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Scale className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-heading font-bold text-white mb-4">Termos e Condições</h1>
            <p className="text-gray-400 max-w-2xl mx-auto">Última atualização: 28 de Dezembro de 2025</p>
        </div>

        <div className="bg-card border border-white/5 rounded-2xl p-8 md:p-12 shadow-xl space-y-8 text-gray-300 leading-relaxed">
            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm text-primary font-mono">01</span>
                    Introdução
                </h2>
                <p className="mb-4">
                    Bem-vindo à IN1Bet. Ao acessar ou usar nosso site, você concorda em cumprir e estar vinculado a estes Termos e Condições. Se você não concordar com qualquer parte destes termos, você não deve usar nossos serviços.
                </p>
                <p>
                    Estes termos aplicam-se a todas as apostas desportivas, jogos de casino e outros serviços oferecidos através do nosso site e aplicações móveis.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm text-primary font-mono">02</span>
                    Elegibilidade da Conta
                </h2>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Você deve ter pelo menos 18 anos de idade ou a idade legal para jogar na sua jurisdição.</li>
                    <li>Você deve ser residente em uma jurisdição onde o jogo online é permitido.</li>
                    <li>Você deve fornecer informações precisas e completas durante o registro.</li>
                    <li>Você é responsável por manter a confidencialidade dos dados de login da sua conta.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm text-primary font-mono">03</span>
                    Depósitos e Saques
                </h2>
                <p className="mb-4">
                    Aceitamos depósitos exclusivamente via PIX e outros métodos aprovados. Todos os fundos depositados devem ter origem legal e pertencer ao titular da conta.
                </p>
                <div className="bg-secondary/20 p-4 rounded-xl border border-white/5 flex gap-4 items-start">
                    <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-400">
                        A IN1Bet reserva-se o direito de solicitar verificação de identidade (KYC) antes de processar qualquer saque, especialmente para valores elevados ou atividades suspeitas.
                    </p>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm text-primary font-mono">04</span>
                    Regras de Apostas
                </h2>
                <p className="mb-4">
                    Todas as apostas são finais uma vez confirmadas. Não podemos cancelar ou alterar apostas a pedido do usuário após a confirmação.
                </p>
                <p>
                    Reservamo-nos o direito de anular qualquer aposta feita em eventos com erros óbvios de odds, horários incorretos ou suspeita de manipulação de resultados.
                </p>
            </section>

             <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm text-primary font-mono">05</span>
                    Bônus e Promoções
                </h2>
                <p>
                    Os bônus estão sujeitos a requisitos de aposta (rollover) específicos antes que possam ser sacados. A IN1Bet reserva-se o direito de alterar ou cancelar promoções a qualquer momento. O abuso de bônus resultará no cancelamento dos ganhos e possível suspensão da conta.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm text-primary font-mono">06</span>
                    Encerramento de Conta
                </h2>
                <p>
                    Podemos suspender ou encerrar sua conta se violar estes termos, se houver suspeita de fraude, lavagem de dinheiro ou uso indevido da plataforma. Você também pode solicitar o encerramento da sua conta a qualquer momento através do suporte.
                </p>
            </section>
        </div>
      </div>
    </MainLayout>
  );
}
