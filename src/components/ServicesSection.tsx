import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Globe, Brain, Target, BarChart3, Megaphone, FileText } from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Landing Pages de Alta Conversão",
    description: "Páginas desenvolvidas com foco em captar leads qualificados. Design premium, copy persuasivo e performance otimizada para cada empreendimento.",
    keywords: ["UX/UI", "Responsivo", "SEO"],
  },
  {
    icon: Brain,
    title: "Inteligência de Marketing",
    description: "Estratégias baseadas em dados para posicionar seu empreendimento no mercado. Análise de concorrência, personas e jornada do comprador.",
    keywords: ["Data-driven", "Personas", "Estratégia"],
  },
  {
    icon: Target,
    title: "Captação de Leads Qualificados",
    description: "Campanhas no Google Ads e Meta Ads otimizadas para atrair compradores reais. Funil completo do clique à visita no stand.",
    keywords: ["Google Ads", "Meta Ads", "Funil"],
  },
  {
    icon: BarChart3,
    title: "Gestão de Vendas",
    description: "CRM imobiliário, scripts de atendimento e acompanhamento de todo o processo de venda. Da captação ao contrato assinado.",
    keywords: ["CRM", "Follow-up", "Fechamento"],
  },
  {
    icon: Megaphone,
    title: "Branding Imobiliário",
    description: "Identidade visual, naming e posicionamento de marca para empreendimentos que querem se destacar no mercado premium.",
    keywords: ["Marca", "Identidade", "Naming"],
  },
  {
    icon: FileText,
    title: "Secretariado de Vendas",
    description: "Aprovação de vendas, contratos digitais e assinatura eletrônica. Todo o backoffice para que sua equipe foque no que importa: vender.",
    keywords: ["Contratos", "Digital", "Backoffice"],
  },
];

const ServicesSection = () => {
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
            Nossas Soluções
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient mb-4">
            Tudo que seu empreendimento precisa
          </h2>
          <p className="font-body text-muted-foreground max-w-2xl mx-auto">
            Do planejamento à venda, oferecemos uma solução completa para loteadoras, construtoras e empreendedoras imobiliárias.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-all duration-300"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <service.icon size={24} className="text-primary" />
              </div>
              <h3 className="font-display font-semibold text-lg text-foreground mb-3">{service.title}</h3>
              <p className="font-body text-sm text-muted-foreground leading-relaxed mb-4">{service.description}</p>
              <div className="flex flex-wrap gap-2">
                {service.keywords.map((kw) => (
                  <span key={kw} className="bg-secondary text-muted-foreground font-body text-xs px-3 py-1 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
