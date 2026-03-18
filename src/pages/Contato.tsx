import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import { motion } from "framer-motion";
import { ArrowRight, Phone, Mail, MapPin } from "lucide-react";

const Contato = () => {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="py-24">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="font-body text-xs font-medium text-primary uppercase tracking-widest mb-4 block">
                  Entre em Contato
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-gradient mb-6 leading-tight">
                  Vamos transformar seu empreendimento em sucesso?
                </h1>
                <p className="font-body text-lg text-muted-foreground mb-10 leading-relaxed">
                  Preencha o formulário ou entre em contato diretamente. 
                  Nossa equipe responde em até 24 horas com uma proposta personalizada para o seu projeto.
                </p>

                <div className="flex flex-col gap-6">
                  <a href="https://api.whatsapp.com/send?phone=5531971558182" className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Phone size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground text-sm">WhatsApp</p>
                      <p className="font-body text-sm text-muted-foreground">(31) 97155-8182</p>
                    </div>
                  </a>
                  <a href="mailto:contato@urbamarket.com.br" className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Mail size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground text-sm">E-mail</p>
                      <p className="font-body text-sm text-muted-foreground">contato@urbamarket.com.br</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-display font-semibold text-foreground text-sm">Localização</p>
                      <p className="font-body text-sm text-muted-foreground">Governador Valadares, MG</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-8 lg:p-10"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <h3 className="font-display font-bold text-2xl text-foreground mb-2">Solicite sua proposta</h3>
                <p className="font-body text-sm text-muted-foreground mb-8">Sem compromisso. Retorno em até 24h.</p>
                <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Nome</label>
                    <input type="text" placeholder="Seu nome completo" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">E-mail</label>
                    <input type="email" placeholder="seu@email.com" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                  </div>
                  <div>
                    <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">WhatsApp</label>
                    <input type="tel" placeholder="(00) 00000-0000" className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
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
                  <div>
                    <label className="font-body text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Mensagem</label>
                    <textarea rows={3} placeholder="Conte-nos sobre seu empreendimento..." className="w-full bg-secondary border border-border rounded-lg px-4 py-3 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none" />
                  </div>
                  <button type="submit" className="w-full bg-primary text-primary-foreground py-4 rounded-lg font-display font-bold text-base hover:opacity-90 transition-opacity glow-green flex items-center justify-center gap-2">
                    Enviar Proposta <ArrowRight size={18} />
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
};

export default Contato;
