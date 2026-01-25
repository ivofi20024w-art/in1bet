import { MainLayout } from "@/components/layout/MainLayout";
import { Scale, FileText, Users, CreditCard, Gamepad2, Gift, Ban, Mail, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Terms() {
  const lastUpdate = "15 de Janeiro de 2026";

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
            <Scale className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-4">Termos e Condições de Uso</h1>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Calendar className="w-4 h-4" />
            Última atualização: {lastUpdate}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 md:p-10 space-y-10 text-zinc-300 leading-relaxed">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-white">1. Sobre a IN1Bet</h2>
            </div>
            <p className="mb-4">
              Bem-vindo à IN1Bet! Somos uma plataforma de entretenimento online que oferece jogos de cassino e apostas esportivas para o público brasileiro. Ao criar uma conta ou utilizar nossos serviços, você concorda com os termos descritos neste documento.
            </p>
            <p>
              Nosso objetivo é proporcionar uma experiência segura, justa e divertida. Se tiver dúvidas sobre qualquer ponto, nossa equipe de suporte está sempre disponível para ajudar.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">2. Quem pode usar a IN1Bet</h2>
            </div>
            <p className="mb-4">Para se cadastrar e jogar na IN1Bet, você precisa atender aos seguintes requisitos:</p>
            <ul className="space-y-3">
              {[
                "Ter pelo menos 18 anos de idade (ou a maioridade legal na sua região)",
                "Residir no Brasil ou em jurisdição onde jogos online são permitidos",
                "Fornecer informações verdadeiras e atualizadas no cadastro",
                "Manter seus dados de login em sigilo — você é responsável por tudo que acontece na sua conta"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-blue-400">{i + 1}</span>
                  </div>
                  <span className="text-zinc-400">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">3. Depósitos e Saques</h2>
            </div>
            <p className="mb-4">
              Trabalhamos exclusivamente com PIX para depósitos e saques — é rápido, seguro e disponível 24 horas por dia. Alguns pontos importantes:
            </p>
            <div className="bg-zinc-800/50 rounded-xl p-5 border border-white/5 space-y-3 text-sm">
              <p><span className="text-white font-medium">Depósitos:</span> O crédito aparece na sua conta em segundos após a confirmação do pagamento.</p>
              <p><span className="text-white font-medium">Saques:</span> Processados em até 1 hora para contas verificadas. O primeiro saque pode exigir verificação de identidade (KYC).</p>
              <p><span className="text-white font-medium">Origem dos fundos:</span> Todos os valores depositados devem ter origem lícita e pertencer ao titular da conta.</p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">4. Regras das Apostas</h2>
            </div>
            <p className="mb-4">
              Uma vez que você confirma uma aposta, ela é considerada final. Não é possível cancelar ou alterar após a confirmação.
            </p>
            <p className="mb-4">
              Nos reservamos o direito de anular apostas em casos de erros técnicos evidentes nas odds, horários incorretos, ou suspeita de manipulação de resultados. Nesses casos, os valores apostados serão devolvidos.
            </p>
            <p>
              Para jogos de cassino, os resultados são determinados por geradores de números aleatórios certificados, garantindo total imparcialidade.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Gift className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">5. Bônus e Promoções</h2>
            </div>
            <p className="mb-4">
              Oferecemos diversos bônus para tornar sua experiência ainda melhor. Cada promoção tem suas próprias regras, incluindo:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-400">
              <li><span className="text-white">Rollover:</span> Quantidade de vezes que o valor do bônus precisa ser apostado antes de liberar para saque</li>
              <li><span className="text-white">Prazo de validade:</span> Período máximo para cumprir os requisitos</li>
              <li><span className="text-white">Jogos elegíveis:</span> Nem todos os jogos contribuem igualmente para o rollover</li>
            </ul>
            <p className="mt-4 text-sm bg-amber-500/10 p-4 rounded-lg border border-amber-500/20 text-amber-200/90">
              Tentativas de abuso de promoções (como criação de múltiplas contas) resultarão no cancelamento do bônus, confisco de ganhos e possível suspensão da conta.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">6. Encerramento de Conta</h2>
            </div>
            <p className="mb-4">
              Podemos suspender ou encerrar sua conta nas seguintes situações:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-400 mb-4">
              <li>Violação destes termos de uso</li>
              <li>Suspeita de fraude, lavagem de dinheiro ou atividade ilegal</li>
              <li>Uso de bots, softwares automatizados ou métodos de jogo proibidos</li>
              <li>Fornecimento de informações falsas</li>
            </ul>
            <p>
              Você também pode solicitar o encerramento da sua conta a qualquer momento entrando em contato com nosso suporte. Seus dados serão tratados conforme nossa Política de Privacidade.
            </p>
          </section>

          <section className="pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-700/50 flex items-center justify-center">
                <Mail className="w-5 h-5 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Dúvidas?</h2>
            </div>
            <p className="text-zinc-400">
              Se você tiver qualquer pergunta sobre estes termos, estamos aqui para ajudar. Entre em contato pelo chat ao vivo disponível 24 horas ou envie um e-mail para <span className="text-primary">suporte@in1bet.com.br</span>.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
