import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import caseStudy1 from "@/assets/case-study-1.jpg";
import caseStudy2 from "@/assets/case-study-2.jpg";
import caseStudy3 from "@/assets/case-study-3.jpg";

const clients = [
  {
    image: caseStudy1,
    name: "Condomínio Três Vales",
    location: "Minas Gerais",
    type: "Condomínio",
    description: "O mais exclusivo de Minas Gerais. Lotes de 1.000 a 2.500m² com infraestrutura completa e parque de 210.000m².",
    results: ["300+ leads qualificados", "85% vendido", "ROI 12x"],
    link: "/lp/tres-vales",
  },
  {
    image: caseStudy2,
    name: "Reserva de Piedade",
    location: "Piedade, MG",
    type: "Loteamento",
    description: "Empreendimento residencial com foco em qualidade de vida, sustentabilidade e proximidade à natureza.",
    results: ["200+ leads/mês", "18% conversão LP", "3x mais rápido"],
    link: "/lp/reserva-de-piedade",
  },
  {
    image: caseStudy3,
    name: "Quintas do Morro",
    location: "Nova Lima, MG",
    type: "Alto Padrão",
    description: "Condomínio de alto padrão com projeto arquitetônico exclusivo, assinado por grandes nomes da arquitetura mineira.",
    results: ["Branding completo", "Leads premium", "100% vendido"],
    link: "#",
  },
  {
    image: caseStudy1,
    name: "Residencial Belvedere",
    location: "Funilândia, MG",
    type: "Loteamento",
    description: "Loteamento super exclusivo com lotes de 360m². Qualidade de vida para quem sonha em construir sua casa própria.",
    results: ["Campanha completa", "Funil otimizado", "Vendas aceleradas"],
    link: "#",
  },
  {
    image: caseStudy2,
    name: "Jardim das Macaúbas",
    location: "Minas Gerais",
    type: "Condomínio",
    description: "Lotes planos a partir de 1.000m² com infraestrutura completa e área de lazer com piscina, fitness e quadras.",
    results: ["Landing page premium", "Leads qualificados", "Alta conversão"],
    link: "#",
  },
];

const Clientes = () => {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="py-24">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="font-body text-xs font-medium text-primary uppercase tracking-widest mb-4 block">
                Portfólio
              </span>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-gradient mb-4">
                Nossos Clientes & Cases
              </h1>
              <p className="font-body text-lg text-muted-foreground max-w-2xl mx-auto">
                Conheça os empreendimentos que transformamos em sucesso de vendas com estratégia, marketing digital e gestão comercial.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((c, i) => (
                <motion.a
                  key={i}
                  href={c.link}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-300"
                  style={{ boxShadow: "var(--shadow-card)" }}
                >
                  <div className="relative overflow-hidden aspect-[4/3]">
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                    <span className="absolute top-4 left-4 bg-primary/20 backdrop-blur-sm text-primary font-body text-xs px-3 py-1 rounded-full font-medium">
                      {c.type}
                    </span>
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
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
};

export default Clientes;
