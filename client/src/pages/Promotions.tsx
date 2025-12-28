import { MainLayout } from "@/components/layout/MainLayout";
import { PROMOTIONS } from "@/lib/mockData";
import { Button } from "@/components/ui/button";

export default function Promotions() {
  return (
    <MainLayout>
      <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Promoções & Bónus</h1>
          <p className="text-gray-400">Aproveite as melhores ofertas para aumentar suas chances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROMOTIONS.map((promo) => (
            <div key={promo.id} className="bg-card border border-white/5 rounded-xl overflow-hidden hover:border-primary/50 transition-all group">
                <div className="h-48 overflow-hidden relative">
                    <img src={promo.image} alt={promo.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{promo.title}</h3>
                    <p className="text-gray-400 text-sm mb-6 h-10">{promo.description}</p>
                    <Button className="w-full bg-secondary/50 hover:bg-primary hover:text-white transition-colors">{promo.cta}</Button>
                </div>
            </div>
        ))}
      </div>
    </MainLayout>
  );
}
