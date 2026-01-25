import { MainLayout } from "@/components/layout/MainLayout";
import { Lock, Eye, Shield, FileCheck, Database, Share2, UserCheck, Mail, Calendar } from "lucide-react";

export default function Privacy() {
  const lastUpdate = "15 de Janeiro de 2026";

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
            <Lock className="w-10 h-10 text-blue-500" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-4">Política de Privacidade</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-4">Sua privacidade é importante para nós. Entenda como coletamos, usamos e protegemos suas informações.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Calendar className="w-4 h-4" />
            Última atualização: {lastUpdate}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 md:p-10 space-y-10 text-zinc-300 leading-relaxed">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Quais dados coletamos</h2>
            </div>
            <p className="mb-4">
              Para oferecer nossos serviços de forma segura e personalizada, coletamos algumas informações quando você se cadastra, realiza transações ou utiliza nossa plataforma:
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: "Identificação", desc: "Nome completo, CPF, data de nascimento", icon: UserCheck },
                { title: "Contato", desc: "E-mail e número de telefone", icon: Mail },
                { title: "Financeiros", desc: "Histórico de transações e chaves PIX", icon: Database },
                { title: "Técnicos", desc: "Endereço IP, dispositivo e navegador", icon: Shield },
              ].map((item, i) => (
                <div key={i} className="bg-zinc-800/50 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <item.icon className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  </div>
                  <p className="text-xs text-zinc-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <FileCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Por que usamos seus dados</h2>
            </div>
            <p className="mb-4">Utilizamos suas informações para:</p>
            <ul className="space-y-3">
              {[
                "Processar depósitos, saques e pagamentos de forma segura",
                "Verificar sua identidade conforme exigido por lei (KYC)",
                "Prevenir fraudes e garantir a segurança da plataforma",
                "Personalizar sua experiência de jogo",
                "Enviar notificações importantes sobre sua conta",
                "Melhorar nossos serviços com base em análises de uso"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Como protegemos seus dados</h2>
            </div>
            <p className="mb-4">
              Levamos a segurança muito a sério. Implementamos múltiplas camadas de proteção:
            </p>
            <div className="bg-purple-500/10 p-5 rounded-xl border border-purple-500/20">
              <ul className="space-y-2 text-sm text-purple-200/90">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Criptografia SSL de 256 bits em todas as transmissões
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Servidores seguros com monitoramento 24/7
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Autenticação de dois fatores disponível para sua conta
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Conformidade com a LGPD (Lei Geral de Proteção de Dados)
                </li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Compartilhamento de informações</h2>
            </div>
            <p className="mb-4">
              <span className="text-white font-medium">Não vendemos nem alugamos seus dados pessoais.</span> Podemos compartilhar informações apenas em situações específicas:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-400">
              <li>Com processadores de pagamento para concluir suas transações</li>
              <li>Com autoridades competentes quando exigido por lei</li>
              <li>Para proteger a segurança da plataforma e de outros usuários</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Seus direitos</h2>
            </div>
            <p className="mb-4">
              De acordo com a LGPD, você tem direito a:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-400 mb-4">
              <li>Saber quais dados temos sobre você</li>
              <li>Corrigir informações incorretas ou desatualizadas</li>
              <li>Solicitar a exclusão dos seus dados (sujeito a obrigações legais de retenção)</li>
              <li>Revogar consentimentos dados anteriormente</li>
            </ul>
            <p>
              Para exercer qualquer desses direitos, entre em contato com nosso suporte ou envie um e-mail para <span className="text-primary">privacidade@in1bet.com.br</span>.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
