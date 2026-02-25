import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Search, Rocket, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Diagnóstico & Estratégia",
    description: "Analisamos seu empreendimento, concorrência e público-alvo. Definimos personas, posicionamento e o plano de ação completo para maximizar suas vendas.",
  },
  {
    number: "02",
    icon: Rocket,
    title: "Lançamento & Captação",
    description: "Desenvolvemos landing pages de alta conversão, campanhas de tráfego pago e toda a comunicação visual. Cada lead é qualificado antes de chegar à sua equipe.",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Vendas & Otimização",
    description: "Gestão de vendas com CRM, scripts, follow-up e relatórios em tempo real. Otimizamos constantemente as campanhas para reduzir custo por lead e aumentar conversão.",
  },
];

const MethodologySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 bg-card" ref={ref}>
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="font-body text-xs font-medium text-primary uppercase tracking-widest mb-4 block">
            Como Funciona
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient mb-4">
            Metodologia que gera resultado
          </h2>
          <p className="font-body text-muted-foreground max-w-2xl mx-auto">
            Um processo claro e comprovado para transformar seu empreendimento em um sucesso de vendas.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative"
            >
              <div className="bg-background border border-border rounded-2xl p-8 h-full">
                <span className="font-display text-6xl font-bold text-primary/10 absolute top-4 right-6">{step.number}</span>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <step.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-display font-semibold text-xl text-foreground mb-3">{step.title}</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-border" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MethodologySection;
