import { Link } from "wouter";
import { ShieldCheck, Lock, AlertTriangle } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background border-t border-white/5 py-12 px-6 mt-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-2xl italic text-primary">
              IN1<span className="text-white">BET</span>
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A melhor plataforma de entretenimento online. Oferecemos uma experiência premium em casino e apostas desportivas com segurança, transparência e pagamentos instantâneos via PIX.
            </p>
            <div className="flex gap-4 pt-2">
              <Lock className="w-5 h-5 text-gray-500" />
              <ShieldCheck className="w-5 h-5 text-gray-500" />
              <span className="text-xs text-gray-500 font-medium border border-gray-700 px-2 py-0.5 rounded">SSL SECURE</span>
            </div>
          </div>

          {/* Links: Platform */}
          <div>
            <h4 className="font-bold text-white mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/casino" className="hover:text-primary transition-colors">Casino</Link></li>
              <li><Link href="/live-casino" className="hover:text-primary transition-colors">Casino Ao Vivo</Link></li>
              <li><Link href="/sports" className="hover:text-primary transition-colors">Esportes</Link></li>
              <li><Link href="/promotions" className="hover:text-primary transition-colors">Promoções</Link></li>
              <li><Link href="/vip" className="hover:text-primary transition-colors">Clube VIP</Link></li>
            </ul>
          </div>

          {/* Links: Support & Legal */}
          <div>
            <h4 className="font-bold text-white mb-4">Ajuda e Legal</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/support" className="hover:text-primary transition-colors">Central de Ajuda</Link></li>
              <li><Link href="/support/tickets" className="hover:text-primary transition-colors">Meus Tickets</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Termos e Condições</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
              <li><Link href="/aml" className="hover:text-primary transition-colors">Política AML / KYC</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">Política de Cookies</Link></li>
              <li><Link href="/responsible-gaming" className="hover:text-primary transition-colors">Jogo Responsável</Link></li>
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="font-bold text-white mb-4">Pagamentos</h4>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 inline-block">
                <div className="flex items-center gap-3 mb-3">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo%E2%80%94pix_powered_by_Banco_Central_%28Brazil%2C_2020%29.svg" alt="PIX" className="h-8" />
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                    Depósitos e saques instantâneos.<br/>Disponível 24 horas, 7 dias por semana.
                </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-gray-500">
                <div className="border border-red-900/50 text-red-700 font-bold rounded-full w-8 h-8 flex items-center justify-center text-xs">18+</div>
                <span className="text-xs">Proibido para menores de 18 anos. Jogue com responsabilidade.</span>
            </div>
            <p className="text-xs text-gray-600">
                © {currentYear} IN1Bet. Todos os direitos reservados.
            </p>
        </div>
      </div>
    </footer>
  );
}
