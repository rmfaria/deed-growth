import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import caseStudy2 from "@/assets/case-study-2.jpg";
import caseStudy3 from "@/assets/case-study-3.jpg";

const features = [
  "Lotes a partir de 300m²",
  "Infraestrutura completa",
  "Área verde preservada",
  "Segurança 24 horas",
  "Próximo ao centro",
  "Pronto para construir",
  "Paisagismo premium",
  "Valorização garantida",
];

const LpReservaPiedade = () => {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="relative min-h-[80vh] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={caseStudy3} alt="Reserva de Piedade" className="w-full h-full object-cover" />
            <div className="absolute inset-0 hero-overlay" />
          </div>
          <div className="container mx-auto px-6 relative z-10 py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <span className="font-body text-xs font-medium text-primary uppercase tracking-widest mb-4 block">
                  <MapPin size={14} className="inline mr-1" /> Piedade, Minas Gerais
                </span>
                <h1 className="font-display text-4xl md:text-6xl font-bold text-gradient mb-6 leading-tight">
                  Reserva de<br />Piedade
                </h1>
                <p className="font-body text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  Qualidade de vida, sustentabilidade e proximidade à natureza. O lugar ideal para construir o lar dos seus sonhos.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-8"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <h3 className="font-display font-bold text-2xl text-foreground mb-2">Garanta seu lote</h3>
                <p className="font-body text-sm text-muted-foreground mb-6">Cadastre-se e receba condições exclusivas.</p>
                <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                  <input type="text" placeholder="Seu nome" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <input type="tel" placeholder="WhatsApp" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <input type="email" placeholder="E-mail" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-display font-bold text-base hover:opacity-90 transition-opacity glow-green flex items-center justify-center gap-2">
                    Quero Saber Mais <ArrowRight size={18} />
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-card">
          <div className="container mx-auto px-6">
            <h2 className="font-display text-3xl font-bold text-gradient mb-12 text-center">Diferenciais</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 bg-background border border-border rounded-xl p-4">
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                  <span className="font-body text-sm text-foreground">{f}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <img src={caseStudy3} alt="Reserva de Piedade" className="w-full rounded-2xl object-cover aspect-video" />
              <img src={caseStudy2} alt="Reserva de Piedade entrada" className="w-full rounded-2xl object-cover aspect-video" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
};

export default LpReservaPiedade;
