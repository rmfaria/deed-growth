import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MapPin, Leaf, Shield, Zap } from "lucide-react";
import caseStudy1 from "@/assets/case-study-1.jpg";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  "Lotes de 1.000 m² a 2.500 m²",
  "Saneamento básico instalado",
  "Rede elétrica subterrânea",
  "Segurança 24 horas",
  "Piscina no condomínio",
  "Parque de 210.000 m²",
  "Pronto para construir",
  "Vista de 360° deslumbrante",
  "Trilhas para Mountain Bike",
  "Horta orgânica",
  "Espaço kids",
  "Quadra de esportes",
];

const LpTresVales = () => {
  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="relative min-h-[80vh] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={heroBg} alt="Condomínio Três Vales" className="w-full h-full object-cover" />
            <div className="absolute inset-0 hero-overlay" />
          </div>
          <div className="container mx-auto px-6 relative z-10 py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div
                className="hero-text-shadow"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <span className="font-body text-xs font-medium text-primary uppercase tracking-widest mb-4 block">
                  <MapPin size={14} className="inline mr-1" /> O mais exclusivo de Minas Gerais
                </span>
                <h1 className="font-display text-4xl md:text-6xl font-bold text-gradient mb-6 leading-tight">
                  Condomínio<br />Três Vales
                </h1>
                <p className="font-body text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  Cercado por três belíssimos vales, muito verde e toda infraestrutura de esportes, lazer e serviços. 
                  Viva a exclusividade que você merece.
                </p>
                <div className="flex gap-4 mb-8">
                  {[
                    { icon: Leaf, label: "490.000m² área verde" },
                    { icon: Shield, label: "Segurança 24h" },
                    { icon: Zap, label: "Pronto p/ construir" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <item.icon size={16} className="text-primary" />
                      <span className="font-body text-xs text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-8"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <h3 className="font-display font-bold text-2xl text-foreground mb-2">Torne-se exclusivo</h3>
                <p className="font-body text-sm text-muted-foreground mb-6">Receba informações privilegiadas sobre o Três Vales.</p>
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

        {/* Features */}
        <section className="py-24 bg-card">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient mb-4">O melhor para viver</h2>
              <p className="font-body text-muted-foreground">Infraestrutura completa para uma vida extraordinária.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 bg-background border border-border rounded-xl p-4"
                >
                  <CheckCircle2 size={18} className="text-primary shrink-0" />
                  <span className="font-body text-sm text-foreground">{f}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient mb-4">Conheça o empreendimento</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <img src={heroBg} alt="Três Vales vista aérea" className="w-full rounded-2xl object-cover aspect-video" />
              <img src={caseStudy1} alt="Três Vales infraestrutura" className="w-full rounded-2xl object-cover aspect-video" />
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="py-24 bg-card">
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient mb-4">Longe o bastante, perto o suficiente</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 max-w-3xl mx-auto">
              {[
                { time: "03 min", place: "Escolas e supermercados" },
                { time: "15 min", place: "Centro da cidade" },
                { time: "45 min", place: "Aeroporto" },
                { time: "50 min", place: "Capital" },
              ].map((d, i) => (
                <div key={i} className="text-center">
                  <p className="font-display text-3xl font-bold text-primary">{d.time}</p>
                  <p className="font-body text-sm text-muted-foreground mt-2">{d.place}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
};

export default LpTresVales;
