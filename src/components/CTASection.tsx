import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-card relative overflow-hidden" ref={ref}>
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="font-body text-xs font-medium text-primary uppercase tracking-widest mb-4 block">
            Pronto para Começar?
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-gradient mb-6 leading-tight">
            Seu próximo empreendimento pode ser o nosso próximo case de sucesso.
          </h2>
          <p className="font-body text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Agende uma consultoria gratuita e descubra como podemos acelerar suas vendas com inteligência de marketing.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contato"
              className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-display font-semibold text-base hover:opacity-90 transition-opacity flex items-center justify-center gap-2 glow-green"
            >
              Solicitar Consultoria Grátis <ArrowRight size={18} />
            </Link>
            <a
              href="https://api.whatsapp.com/send?phone=5531971558182&text=Olá! Gostaria de saber mais sobre os serviços da UrbaMarket."
              target="_blank"
              rel="noopener noreferrer"
              className="border border-border text-foreground px-8 py-4 rounded-lg font-display font-medium text-base hover:bg-secondary transition-colors flex items-center justify-center gap-2"
            >
              <Phone size={18} /> Falar no WhatsApp
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
