import { useState } from "react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, MapPin, Phone, TreePine, Shield, Lightbulb, Droplets, Home, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import caseStudy3 from "@/assets/case-study-3.jpg";
import reservaMapa from "@/assets/reserva-mapa.png";
import gallery1 from "@/assets/reserva-gallery-1.jpg";
import gallery2 from "@/assets/reserva-gallery-2.jpg";
import gallery3 from "@/assets/reserva-gallery-3.jpg";
import gallery4 from "@/assets/reserva-gallery-4.jpg";
import gallery5 from "@/assets/reserva-gallery-5.jpg";
import gallery6 from "@/assets/reserva-gallery-6.jpg";
import gallery7 from "@/assets/reserva-gallery-7.jpg";
import gallery8 from "@/assets/reserva-gallery-8.jpg";
import gallery9 from "@/assets/reserva-gallery-9.jpg";

const diferenciais = [
  { icon: Home, label: "Lotes a partir de 1000 m²" },
  { icon: Lightbulb, label: "Iluminação CEMIG" },
  { icon: Droplets, label: "Saneamento: fossa séptica individual" },
  { icon: CheckCircle2, label: "100% entregue, pronto para construir" },
  { icon: Shield, label: "Portaria 24h com cancela para moradores e visitantes" },
  { icon: TreePine, label: "168.000m² de área verde preservada" },
];

const galleryImages = [gallery1, gallery2, gallery3, gallery4, gallery5, gallery6, gallery7, gallery8, gallery9];

const LpReservaPiedade = () => {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      {/* Minimal LP header with logos */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-20 px-6">
          <span className="font-display font-bold text-xl text-foreground tracking-tight">
            RESERVA <span className="text-primary">DE PIEDADE</span>
          </span>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="font-display font-bold text-sm text-primary-foreground">U</span>
            </div>
            <div>
              <span className="font-display font-bold text-base text-foreground">URBA</span>
              <span className="font-display font-light text-base text-primary">MARKET</span>
            </div>
          </Link>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden">
          <div className="absolute inset-0">
            <img src={caseStudy3} alt="Reserva de Piedade" className="w-full h-full object-cover" />
            <div className="absolute inset-0 hero-overlay" />
          </div>
          <div className="container mx-auto px-6 relative z-10 py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-gradient mb-6 leading-tight uppercase">
                  A liberdade do campo e o conforto do seu novo lar.
                </h1>
                <p className="font-body text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
                  O Reserva de Piedade te possibilita a qualidade ideal de vida. Com o condomínio cercado pela vegetação nativa, o stress da cidade grande não é mais o seu problema. Este empreendimento conta com mais de 5 praças planejadas para a prática do esporte e lazer em família.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-8"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <h3 className="font-display font-bold text-2xl text-primary mb-2">Dê seu primeiro passo!</h3>
                <p className="font-body text-sm text-muted-foreground mb-6">Nossa equipe de vendas entrará em contato.</p>
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

        {/* SOBRE O EMPREENDIMENTO */}
        <section className="py-24 bg-card">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-primary mb-8 uppercase">Reserva de Piedade</h2>
              <p className="font-body text-lg text-muted-foreground max-w-4xl leading-relaxed mb-8">
                O Reserva de Piedade, localizado no distrito de Piedade do Paraopeba, é cercado por 168.000m² de área verde preservada, ou seja, é o lugar perfeito para você e sua família ter mais conexão com a natureza. E o melhor ainda é saber que o empreendimento está a cerca de 30 minutos do BH Shopping. É o lugar ideal para ter mais saúde e lazer. Seja com esportes, cachoeiras, momentos em família ou até mesmo aquele piquenique com as crianças.
              </p>
              <a
                href="#cadastro"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-display font-bold text-base hover:opacity-90 transition-opacity glow-green"
              >
                Faça seu Cadastro <ArrowRight size={18} />
              </a>
            </motion.div>
          </div>
        </section>

        {/* DIFERENCIAIS */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <h2 className="font-display text-3xl font-bold text-gradient mb-12 text-center uppercase">Nosso Diferencial</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {diferenciais.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4 bg-card border border-border rounded-xl p-6"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <d.icon size={22} className="text-primary" />
                  </div>
                  <span className="font-body text-base text-foreground font-medium">{d.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* LOCALIZAÇÃO */}
        <section className="py-24 bg-card">
          <div className="container mx-auto px-6">
            <h2 className="font-display text-3xl font-bold text-gradient mb-8 text-center uppercase">Localização Privilegiada</h2>
            <div className="max-w-4xl mx-auto">
              <ul className="font-body text-muted-foreground space-y-3 mb-10 text-lg">
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-primary shrink-0 mt-1" />
                  Acesso pela BR-040, via Parque Rola Moça ou por Piedade do Paraopeba.
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-primary shrink-0 mt-1" />
                  A 30 minutos do BH Shopping, próximo ao bairro Jardim Canadá.
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-primary shrink-0 mt-1" />
                  Próximo à saída para o Rio de Janeiro.
                </li>
              </ul>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="cursor-pointer"
                onClick={() => setLightbox(reservaMapa)}
              >
                <img src={reservaMapa} alt="Mapa Reserva de Piedade" className="w-full rounded-2xl border border-border hover:border-primary/30 transition-colors" />
                <p className="font-body text-xs text-primary text-center mt-3">Clique para ampliar</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* BEM-ESTAR */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-6">
              <Leaf size={32} className="text-primary mx-auto mb-4" />
              <h2 className="font-display text-3xl font-bold text-gradient mb-4">Um lugar, o seu bem-estar.</h2>
              <p className="font-body text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Em respeito ao meio ambiente e com consciência ecológica, o paisagismo do Reserva de Piedade resgata a beleza natural da flora nativa, com o mínimo de intervenção nos terrenos. Tudo com o objetivo de criar uma verdadeira reserva natural, onde tudo está onde deveria estar.
              </p>
            </motion.div>
          </div>
        </section>

        {/* GALERIA */}
        <section className="py-24 bg-card">
          <div className="container mx-auto px-6">
            <h2 className="font-display text-3xl font-bold text-gradient mb-4 text-center">Espaços que valorizam sua qualidade de vida</h2>
            <p className="font-body text-muted-foreground text-center mb-12">Já está na hora de viver mais e se preocupar menos. <strong className="text-foreground">Confira o que espera por você:</strong></p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="cursor-pointer overflow-hidden rounded-xl border border-border hover:border-primary/30 transition-all group"
                  onClick={() => setLightbox(img)}
                >
                  <img src={img} alt={`Reserva de Piedade - Foto ${i + 1}`} className="w-full aspect-[3/2] object-cover group-hover:scale-105 transition-transform duration-500" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SOBRE A CONSTRUTORA */}
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="font-display text-3xl font-bold text-gradient mb-6 text-center">Sobre a MIP Edificações</h2>
            <p className="font-body text-lg text-muted-foreground leading-relaxed text-center">
              A construtora faz parte do grupo MIP Engenharia S/A, fundado em 1961, e que é hoje uma das maiores empresas do país, no segmento de montagens eletromecânicas, e destaca-se por sua solidez empresarial, versatilidade e competência. <strong className="text-foreground">Certificada nas normas ISO 9001:2008 e PBQP.H/SIAC – Nível A</strong>, a MIP Edificações busca sempre o aprimoramento em todas as suas atividades.
            </p>
          </div>
        </section>

        {/* FORMULÁRIO + ATENDIMENTO */}
        <section id="cadastro" className="py-24 bg-card">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <h2 className="font-display text-3xl font-bold text-primary mb-4">Atendimento</h2>
                <p className="font-body text-muted-foreground mb-8">Fale com nossos especialistas</p>
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground">Rogério Rodrigues</p>
                      <a href="https://api.whatsapp.com/send?phone=5531971558182" className="font-body text-primary hover:underline">(31) 97155-8182</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Phone size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground">Ricardo Carneiro</p>
                      <a href="https://api.whatsapp.com/send?phone=5531999476162" className="font-body text-primary hover:underline">(31) 9994-76162</a>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-background border border-border rounded-2xl p-8"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <h3 className="font-display font-bold text-2xl text-foreground mb-2">Cadastre-se agora</h3>
                <p className="font-body text-sm text-muted-foreground mb-6">Receba informações exclusivas sobre o empreendimento.</p>
                <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                  <input type="text" placeholder="Seu nome" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <input type="tel" placeholder="WhatsApp" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <input type="email" placeholder="E-mail" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-display font-bold text-base hover:opacity-90 transition-opacity glow-green flex items-center justify-center gap-2">
                    Enviar Cadastro <ArrowRight size={18} />
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Footer mínimo */}
        <footer className="py-8 bg-background border-t border-border">
          <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-sm text-primary-foreground">U</span>
              </div>
              <span className="font-display font-bold text-base text-foreground">URBA<span className="font-light text-primary">MARKET</span></span>
            </Link>
            <p className="font-body text-xs text-muted-foreground">© {new Date().getFullYear()} UrbaMarket • Negócios Imobiliários</p>
          </div>
        </footer>
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Ampliação" className="max-w-full max-h-[90vh] rounded-xl border border-border" />
        </div>
      )}

      <WhatsAppButton />
    </>
  );
};

export default LpReservaPiedade;
