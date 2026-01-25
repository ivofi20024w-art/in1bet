import { MainLayout } from "@/components/layout/MainLayout";
import { Cookie, Shield, Settings, BarChart3, Calendar, Info } from "lucide-react";

export default function Cookies() {
  const lastUpdate = "15 de Janeiro de 2026";

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-500/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
            <Cookie className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-white mb-4">Política de Cookies</h1>
          <p className="text-zinc-400 max-w-2xl mx-auto mb-4">Entenda como utilizamos cookies para melhorar sua experiência na IN1Bet.</p>
          <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
            <Calendar className="w-4 h-4" />
            Última atualização: {lastUpdate}
          </div>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 md:p-10 space-y-10 text-zinc-300 leading-relaxed">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-xl font-bold text-white">O que são cookies?</h2>
            </div>
            <p>
              Cookies são pequenos arquivos de texto que ficam armazenados no seu navegador quando você visita um site. Eles ajudam a lembrar suas preferências, manter você conectado e entender como você usa a plataforma — tudo para oferecer uma experiência mais rápida e personalizada.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-700/50 flex items-center justify-center">
                <Cookie className="w-5 h-5 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Tipos de cookies que utilizamos</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white">Cookies Essenciais</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full uppercase font-bold">Obrigatórios</span>
                </div>
                <p className="text-sm text-emerald-200/80">
                  Necessários para o funcionamento básico do site — sem eles, você não conseguiria fazer login, apostar ou realizar transações. Esses cookies não podem ser desativados.
                </p>
              </div>

              <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <h3 className="font-bold text-white">Cookies Funcionais</h3>
                </div>
                <p className="text-sm text-blue-200/80">
                  Lembram suas preferências como idioma, fuso horário e configurações de exibição. Desativá-los pode afetar a personalização da sua experiência.
                </p>
              </div>

              <div className="bg-purple-500/10 rounded-xl p-5 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white">Cookies Analíticos</h3>
                </div>
                <p className="text-sm text-purple-200/80">
                  Nos ajudam a entender como os usuários navegam pelo site, quais páginas são mais visitadas e onde podemos melhorar. Todos os dados são anônimos e agregados.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-700/50 flex items-center justify-center">
                <Settings className="w-5 h-5 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Como gerenciar cookies</h2>
            </div>
            <p className="mb-4">
              Você pode controlar quais cookies aceita através das configurações do seu navegador. Veja como fazer nos navegadores mais populares:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm text-zinc-400">
              <li><span className="text-white">Chrome:</span> Configurações → Privacidade e segurança → Cookies</li>
              <li><span className="text-white">Firefox:</span> Configurações → Privacidade → Cookies</li>
              <li><span className="text-white">Safari:</span> Preferências → Privacidade → Gerenciar dados de sites</li>
              <li><span className="text-white">Edge:</span> Configurações → Cookies e permissões de site</li>
            </ul>
            <p className="mt-4 text-sm text-zinc-500">
              Lembre-se: desativar cookies essenciais pode fazer com que algumas funcionalidades do site deixem de funcionar corretamente.
            </p>
          </section>

          <section className="pt-6 border-t border-white/5">
            <p className="text-sm text-zinc-500">
              Ao continuar navegando em nosso site, você concorda com o uso de cookies conforme descrito nesta política. Se tiver dúvidas, entre em contato com nosso suporte.
            </p>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
