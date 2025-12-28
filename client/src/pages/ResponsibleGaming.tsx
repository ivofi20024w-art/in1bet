import { MainLayout } from "@/components/layout/MainLayout";
import { ShieldCheck, AlertTriangle, Clock, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResponsibleGaming() {
  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center mb-12">
            <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-4xl font-heading font-bold text-white mb-4">Jogo Responsável</h1>
            <p className="text-gray-400 text-lg">O jogo deve ser uma forma de entretenimento, não um problema.</p>
        </div>

        <div className="space-y-8">
            <section className="bg-card border border-white/5 p-8 rounded-xl">
                <h2 className="text-2xl font-bold mb-4 text-white">Ferramentas de Proteção</h2>
                <div className="grid gap-6">
                    <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                        <Clock className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-bold text-white">Limites de Tempo</h3>
                            <p className="text-sm text-gray-400 mb-3">Defina quanto tempo você pode passar jogando por dia.</p>
                            <Button size="sm" variant="outline">Definir Limites</Button>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                        <AlertTriangle className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-bold text-white">Limites de Depósito</h3>
                            <p className="text-sm text-gray-400 mb-3">Controle quanto dinheiro você pode depositar semanalmente.</p>
                            <Button size="sm" variant="outline">Definir Limites</Button>
                        </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                        <Ban className="w-6 h-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-bold text-white">Autoexclusão</h3>
                            <p className="text-sm text-gray-400 mb-3">Bloqueie sua conta temporariamente ou permanentemente.</p>
                            <Button size="sm" variant="destructive">Solicitar Bloqueio</Button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-card border border-white/5 p-8 rounded-xl">
                 <h2 className="text-2xl font-bold mb-4 text-white">Precisa de Ajuda?</h2>
                 <p className="text-gray-400 mb-4">Se você ou alguém que você conhece está enfrentando problemas com jogos, procure ajuda profissional.</p>
                 <ul className="list-disc pl-5 text-gray-400 space-y-2">
                     <li>Jogadores Anônimos: www.jogadoresanonimos.com.br</li>
                     <li>Gambling Therapy: www.gamblingtherapy.org</li>
                 </ul>
            </section>
            
            <div className="text-center pt-8 border-t border-white/5">
                <div className="inline-block border-2 border-red-600 rounded-full w-12 h-12 flex items-center justify-center text-red-600 font-bold text-lg mb-2">18+</div>
                <p className="text-xs text-gray-500">É proibido para menores de 18 anos jogar neste site.</p>
            </div>
        </div>
      </div>
    </MainLayout>
  );
}
