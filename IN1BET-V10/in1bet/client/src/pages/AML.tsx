import { MainLayout } from "@/components/layout/MainLayout";
import { ShieldAlert, Search, FileSearch, Banknote, AlertTriangle, UserCheck, Building, Calendar, Info } from "lucide-react";

export default function AML() {
  const lastUpdate = "15 de Janeiro de 2026";

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-500/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-4">Política AML / KYC</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-4">Nosso compromisso com a prevenção à lavagem de dinheiro e verificação de identidade dos usuários.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Calendar className="w-4 h-4" />
            Última atualização: {lastUpdate}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 md:p-10 space-y-10 text-zinc-300 leading-relaxed">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Building className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Nosso compromisso</h2>
            </div>
            <p className="mb-4">
              A IN1Bet leva muito a sério a prevenção à lavagem de dinheiro (AML) e ao financiamento de atividades ilícitas. Seguimos as melhores práticas internacionais e a legislação brasileira para garantir que nossa plataforma não seja utilizada para fins ilegais.
            </p>
            <p>
              Nossos procedimentos são projetados para proteger tanto a empresa quanto nossos usuários, criando um ambiente de jogo seguro e transparente.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Verificação de Identidade (KYC)</h2>
            </div>
            <p className="mb-4">
              "Conheça Seu Cliente" (KYC) é um processo padrão da indústria que nos ajuda a verificar que você é quem diz ser. Isso protege sua conta contra uso indevido e nos ajuda a cumprir a regulamentação.
            </p>
            
            <div className="bg-zinc-800/50 rounded-xl p-5 border border-white/5 space-y-4">
              <h3 className="font-bold text-white text-sm mb-3">Quando solicitamos verificação:</h3>
              <ul className="space-y-3">
                {[
                  "No seu primeiro saque",
                  "Quando você atingir determinados volumes de depósito",
                  "Se detectarmos atividade incomum na conta",
                  "Periodicamente, conforme exigido por regulamentação"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 bg-zinc-800/50 rounded-xl p-5 border border-white/5">
              <h3 className="font-bold text-white text-sm mb-3">Documentos que podemos solicitar:</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { doc: "Documento com foto", desc: "RG, CNH ou Passaporte" },
                  { doc: "Comprovante de endereço", desc: "Conta de luz, água ou extrato bancário" },
                  { doc: "Selfie com documento", desc: "Para confirmar sua identidade" },
                  { doc: "Origem dos fundos", desc: "Para valores mais elevados" }
                ].map((item, i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-lg p-3">
                    <p className="text-white text-sm font-medium">{item.doc}</p>
                    <p className="text-xs text-zinc-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Monitoramento de Transações</h2>
            </div>
            <p className="mb-4">
              Monitoramos todas as transações em tempo real para identificar padrões que possam indicar atividade suspeita:
            </p>
            <div className="bg-amber-500/10 rounded-xl p-5 border border-amber-500/20">
              <ul className="space-y-2 text-sm text-amber-200/90">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Depósitos seguidos de saques sem atividade de jogo
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Tentativas de fracionar transações para evitar limites
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Uso de contas ou métodos de pagamento de terceiros
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  Padrões de apostas incompatíveis com jogo recreativo
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <FileSearch className="w-5 h-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Consequências</h2>
            </div>
            <p className="mb-4">
              Se identificarmos atividade suspeita ou confirmada de lavagem de dinheiro:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-400">
              <li>A conta será imediatamente bloqueada para investigação</li>
              <li>Os fundos podem ser retidos durante o processo</li>
              <li>O caso será reportado às autoridades competentes (COAF/UIF) conforme exigido por lei</li>
              <li>Não há aviso prévio ao usuário sobre reportes às autoridades</li>
            </ul>
          </section>

          <section className="pt-6 border-t border-white/5">
            <div className="flex items-start gap-3 text-sm text-zinc-500">
              <Info className="w-5 h-5 shrink-0 text-zinc-600" />
              <p>
                Estes procedimentos existem para proteger você e garantir um ambiente de jogo justo e legal. Se tiver dúvidas sobre o processo de verificação, nossa equipe de suporte está disponível 24 horas para ajudar.
              </p>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
