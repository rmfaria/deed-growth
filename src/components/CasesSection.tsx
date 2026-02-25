import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import caseStudy1 from "@/assets/case-study-1.jpg";
import caseStudy2 from "@/assets/case-study-2.jpg";
import caseStudy3 from "@/assets/case-study-3.jpg";

const cases = [
  {
    image: caseStudy1,
    name: "Condomínio Três Vales",
    location: "Minas Gerais",
    description: "O mais exclusivo de Minas Gerais. Lotes de 1.000 a 2.500m² com infraestrutura completa.",
    results: ["300+ leads qualificados", "85% dos lotes vendidos", "ROI de 12x"],
    link: "/lp/tres-vales",
  },
  {
    image: caseStudy2,
    name: "Reserva de Piedade",
    location: "Piedade, MG",
    description: "Empreendimento residencial com foco em qualidade de vida e sustentabilidade.",
    results: ["200+ leads em 30 dias", "Landing page com 18% conv.", "Vendas 3x mais rápidas"],
    link: "/lp/reserva-de-piedade",
  },
  {
    image: caseStudy3,
    name: "Quintas do Morro",
    location: "Nova Lima, MG",
    description: "Condomínio de alto padrão com projeto arquitetônico exclusivo.",
    results: ["Branding completo", "Captação de leads premium", "100% vendido"],
    link: "#",
  },
];

const CasesSection = () => {
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
            Cases de Sucesso
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient mb-4">
            Empreendimentos que venderam
          </h2>
          <p className="font-body text-muted-foreground max-w-2xl mx-auto">
            Conheça alguns dos projetos que transformamos em sucesso de vendas com nossa metodologia.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c, i) => (
            <motion.a
              key={i}
              href={c.link}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={c.image}
                  alt={c.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={18} className="text-primary" />
                </div>
              </div>
              <div className="p-6">
                <p className="font-body text-xs text-primary uppercase tracking-wider mb-1">{c.location}</p>
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">{c.name}</h3>
                <p className="font-body text-sm text-muted-foreground mb-4">{c.description}</p>
                <div className="flex flex-wrap gap-2">
                  {c.results.map((r) => (
                    <span key={r} className="bg-primary/10 text-primary font-body text-xs px-3 py-1 rounded-full font-medium">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CasesSection;
