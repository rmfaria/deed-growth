import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Search, CheckCircle2 } from "lucide-react";

const keywords = [
  "marketing imobiliário",
  "marketing para loteamentos",
  "marketing digital para construtoras",
  "landing page imobiliária",
  "captação de leads imobiliários",
  "consultoria de vendas imobiliárias",
  "divulgação de empreendimentos",
  "marketing para loteadoras",
  "agência de marketing imobiliário MG",
  "lançamento imobiliário marketing",
  "funil de vendas imobiliário",
  "tráfego pago para imóveis",
  "gestão de vendas loteamento",
  "branding empreendimento",
  "marketing condomínio residencial",
];

const googleCopy = [
  {
    title: "Marketing Imobiliário que Vende | UrbaMarket",
    description: "Especialistas em lançamentos imobiliários. Landing pages, captação de leads e gestão de vendas para loteamentos, construtoras e condomínios em MG.",
  },
  {
    title: "Lançamento Imobiliário? Venda Mais com a UrbaMarket",
    description: "Agência focada em marketing digital para o mercado imobiliário. +50 empreendimentos atendidos. Leads qualificados e ROI comprovado. Fale conosco!",
  },
  {
    title: "Landing Page para Loteamento | Alta Conversão",
    description: "Desenvolvemos landing pages que convertem até 18% dos visitantes em leads. Especialistas em loteamentos e condomínios premium. Peça sua proposta.",
  },
];

const KeywordsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-background" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="font-body text-xs font-medium text-primary uppercase tracking-widest mb-4 block">
            <Search size={14} className="inline mr-1" /> SEO & Google Ads
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient mb-4">
            Palavras-chave que posicionam
          </h2>
          <p className="font-body text-muted-foreground max-w-2xl mx-auto">
            Trabalhamos com as palavras-chave mais relevantes do Google para atrair empreendedoras, loteadoras e construtoras.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Keywords cloud */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="font-display font-semibold text-lg text-foreground mb-6">
              Palavras-chave do Google
            </h3>
            <div className="flex flex-wrap gap-3">
              {keywords.map((kw, i) => (
                <motion.span
                  key={kw}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
                  className="bg-card border border-border text-muted-foreground font-body text-sm px-4 py-2 rounded-full hover:border-primary/30 hover:text-primary transition-all cursor-default"
                >
                  {kw}
                </motion.span>
              ))}
            </div>
          </motion.div>

          {/* Google copy examples */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h3 className="font-display font-semibold text-lg text-foreground mb-6">
              Exemplos de Copy para Google Ads
            </h3>
            <div className="flex flex-col gap-4">
              {googleCopy.map((copy, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-display font-semibold text-sm text-primary mb-1">{copy.title}</p>
                      <p className="font-body text-xs text-muted-foreground leading-relaxed">{copy.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default KeywordsSection;
