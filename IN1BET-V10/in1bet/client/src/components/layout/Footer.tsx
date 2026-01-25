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
              {/* SPORTS DISABLED - Uncomment to re-enable
              <li><Link href="/sports" className="hover:text-primary transition-colors">Esportes</Link></li>
              */}
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
                    <svg viewBox="0 0 512 512" className="h-10 w-auto" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#32BCAD" d="M112.57 391.19c20.056 0 38.928-7.808 53.12-22l76.693-76.692c5.385-5.404 14.765-5.384 20.15 0l76.989 76.989c14.191 14.172 33.045 21.98 53.12 21.98h15.098l-97.138 97.139c-30.326 30.344-79.505 30.344-109.85 0l-97.415-97.416h9.232zm280.068-271.294c-20.056 0-38.929 7.809-53.12 22l-76.97 76.99c-5.551 5.53-14.6 5.568-20.15-.02l-76.711-76.693c-14.192-14.191-33.046-21.999-53.12-21.999h-9.234l97.416-97.416c30.344-30.344 79.523-30.344 109.867 0l97.138 97.138h-15.116z"/>
                      <path fill="#32BCAD" d="M22.758 200.753l58.024-58.024h31.787c13.84 0 27.384 5.605 37.172 15.394l76.694 76.693c7.178 7.179 16.596 10.768 26.033 10.768 9.417 0 18.854-3.59 26.014-10.75l76.989-76.99c9.787-9.787 23.331-15.393 37.171-15.393h37.654l58.3 58.302c30.343 30.344 30.343 79.523 0 109.867l-58.3 58.303H392.64c-13.84 0-27.384-5.605-37.171-15.394l-76.97-76.99c-13.914-13.894-38.172-13.894-52.066.02l-76.694 76.674c-9.788 9.788-23.332 15.413-37.172 15.413H80.782L22.758 310.62c-30.344-30.345-30.344-79.524 0-109.868z"/>
                    </svg>
                    <span className="text-lg font-bold text-[#32BCAD]">PIX</span>
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
