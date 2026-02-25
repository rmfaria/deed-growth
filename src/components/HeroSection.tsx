import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Users, Target } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Empreendimento imobiliário premium" className="w-full h-full object-cover" />
        <div className="absolute inset-0 hero-overlay" />
      </div>

      <div className="container mx-auto px-6 relative z-10 pt-32 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — Copy */}
          <div className="hero-text-shadow">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8"
            >
              <TrendingUp size={14} className="text-primary" />
              <span className="font-body text-xs font-medium text-primary uppercase tracking-wider">
                Marketing Imobiliário que Vende
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6"
            >
              <span className="text-gradient">Seu lançamento</span>
              <br />
              <span className="text-gradient">imobiliário merece</span>
              <br />
              <span className="text-primary">resultados reais.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-body text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed"
            >
              Somos a agência especializada em <strong className="text-foreground">loteamentos, condomínios e construtoras</strong>. 
              Landing pages de alta conversão, inteligência de marketing e leads qualificados para vender mais rápido.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/contato"
                className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-display font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 glow-green"
              >
                Quero Vender Mais <ArrowRight size={18} />
              </Link>
              <Link
                to="/clientes"
                className="border border-border text-foreground px-8 py-4 rounded-lg font-display font-medium text-base hover:bg-secondary transition-colors flex items-center justify-center gap-2"
              >
                Ver Resultados
              </Link>
            </motion.div>

            {/* Mini stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex gap-8 mt-14"
            >
              {[
                { icon: Target, value: "50+", label: "Empreendimentos" },
                { icon: Users, value: "10.000+", label: "Leads gerados" },
                { icon: TrendingUp, value: "98%", label: "Satisfação" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3">
                  <stat.icon size={20} className="text-primary" />
                  <div>
                    <p className="font-display font-bold text-xl text-foreground">{stat.value}</p>
                    <p className="font-body text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl p-8 lg:p-10"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h3 className="font-display font-bold text-2xl text-foreground mb-2">
              Vamos conversar sobre seu projeto?
            </h3>
            <p className="font-body text-sm text-muted-foreground mb-8">
              Preencha e receba uma proposta personalizada em até 24h.
            </p>

            <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">WhatsApp</label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Tipo de Empreendimento</label>
                <select className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all">
                  <option value="">Selecione...</option>
                  <option value="loteamento">Loteamento</option>
                  <option value="condominio">Condomínio</option>
                  <option value="predial">Prédio / Edifício</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-display font-bold text-base hover:opacity-90 transition-opacity mt-2 glow-green"
              >
                Solicitar Proposta Gratuita
              </button>
              <p className="font-body text-xs text-muted-foreground text-center">
                Sem compromisso • Resposta em até 24h
              </p>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
