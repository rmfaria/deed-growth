import { Check, ArrowLeft, FileText, Clock, Zap, Database, MessageSquare, BarChart3, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useRef, useCallback } from "react";

const deliverables = [
  {
    icon: FileText,
    title: "Website Institucional Completo",
    description: "Site profissional com design responsivo, SEO otimizado, páginas de serviços, portfólio de cases e landing pages para captação de leads.",
  },
  {
    icon: Database,
    title: "Backend & Banco de Dados",
    description: "Infraestrutura completa em nuvem para armazenamento seguro de leads, dados de contato e histórico de interações.",
  },
  {
    icon: BarChart3,
    title: "Mini CRM Integrado",
    description: "Painel administrativo com funil de vendas Kanban, gestão de leads, classificação por temperatura (frio/morno/quente) e relatórios de desempenho.",
  },
  {
    icon: Share2,
    title: "Integração com Meta (Facebook & Instagram)",
    description: "Conexão direta com Meta Ads para captação automática de leads via formulários de anúncios e rastreamento de campanhas.",
  },
  {
    icon: Zap,
    title: "Classificação Inteligente de Leads",
    description: "Sistema de scoring e qualificação automática de leads com base em dados de origem, comportamento e perfil de interesse.",
  },
  {
    icon: MessageSquare,
    title: "Chat de IA para Consulta no Database",
    description: "Assistente inteligente integrado ao CRM que permite consultar dados, obter insights sobre leads e gerar relatórios via linguagem natural.",
  },
];

const timeline = [
  { phase: "Fase 1", title: "Setup & Estrutura", duration: "Semana 1-2", items: ["Configuração do backend e banco de dados", "Estrutura do site e design system", "Autenticação e painel admin"] },
  { phase: "Fase 2", title: "CRM & Funcionalidades", duration: "Semana 3-4", items: ["Funil de vendas Kanban", "Classificação de leads", "Dashboard com métricas"] },
  { phase: "Fase 3", title: "Integrações", duration: "Semana 5-6", items: ["Integração Meta Ads", "Chat de IA", "Testes e ajustes finais"] },
];

const Proposta = () => {
  const navigate = useNavigate();
  const today = new Date();
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + 15);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={18} />
            <span className="font-body text-sm">Voltar ao site</span>
          </button>
          <span className="font-display text-lg font-bold text-primary">UrbaMarket</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-16">
        {/* Title Block */}
        <section className="space-y-4">
          <p className="text-primary font-display text-sm font-semibold tracking-widest uppercase">Proposta Comercial</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight">
            Desenvolvimento de Plataforma Digital com CRM Integrado
          </h1>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground font-body pt-2">
            <span>Para: <strong className="text-foreground">UrbaMarket</strong></span>
            <span>Emitido em: <strong className="text-foreground">{formatDate(today)}</strong></span>
            <span>Válido até: <strong className="text-foreground">{formatDate(validUntil)}</strong></span>
          </div>
        </section>

        <Separator className="bg-border" />

        {/* Scope */}
        <section className="space-y-8">
          <div>
            <h2 className="font-display text-2xl font-bold mb-2">Escopo do Projeto</h2>
            <p className="text-muted-foreground font-body leading-relaxed">
              Desenvolvimento completo de plataforma digital incluindo website institucional, sistema de gestão de leads (CRM) e integrações inteligentes para maximizar a captação e conversão de clientes.
            </p>
          </div>

          <div className="grid gap-5">
            {deliverables.map((item) => (
              <Card key={item.title} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground font-body leading-relaxed">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        {/* Timeline */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl font-bold">Cronograma Estimado</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {timeline.map((phase) => (
              <Card key={phase.phase} className="bg-card border-border">
                <CardContent className="p-5 space-y-3">
                  <div>
                    <span className="text-xs font-display font-semibold text-primary uppercase tracking-wider">{phase.phase}</span>
                    <h3 className="font-display font-bold text-foreground mt-1">{phase.title}</h3>
                    <p className="text-xs text-muted-foreground font-body">{phase.duration}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                        <Check size={14} className="text-primary mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        {/* Maintenance */}
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold">Suporte Pós-Entrega</h2>
          <Card className="bg-card border-border">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock size={24} className="text-primary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">10 Horas de Manutenção</h3>
                <p className="text-muted-foreground font-body text-sm leading-relaxed mt-1">
                  Após a entrega final do projeto, estão incluídas <strong className="text-foreground">10 horas de manutenção</strong> para ajustes, 
                  correções, melhorias visuais ou funcionais. As horas podem ser utilizadas no período de até 60 dias após a entrega.
                </p>
                <ul className="mt-3 space-y-1">
                  {["Correção de bugs e ajustes de layout", "Pequenas alterações de conteúdo ou funcionalidade", "Otimizações de performance e SEO"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground font-body">
                      <Check size={14} className="text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator className="bg-border" />

        {/* Investment */}
        <section className="space-y-6">
          <h2 className="font-display text-2xl font-bold">Investimento</h2>
          <Card className="bg-card border-primary/30 border-2">
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-muted-foreground font-body text-sm uppercase tracking-wider">Valor Total do Projeto</p>
              <div className="font-display">
                <span className="text-5xl md:text-6xl font-bold text-primary">R$ 12.560</span>
                <span className="text-2xl text-primary">,00</span>
              </div>
              <p className="text-muted-foreground font-body text-sm max-w-md mx-auto">
                Inclui todo o desenvolvimento, deploy, integrações e 10 horas de manutenção pós-entrega.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 font-display font-semibold px-8">
                  Aprovar Proposta
                </Button>
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-display px-8">
                  Falar com a Equipe
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-3 gap-4 text-center">
            {[
              { label: "Entrada", value: "50%", sub: "R$ 6.280,00" },
              { label: "Na entrega", value: "30%", sub: "R$ 3.768,00" },
              { label: "Após 30 dias", value: "20%", sub: "R$ 2.512,00" },
            ].map((p) => (
              <Card key={p.label} className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">{p.label}</p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">{p.value}</p>
                  <p className="text-sm text-primary font-display font-semibold">{p.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="bg-border" />

        {/* Terms */}
        <section className="space-y-4 pb-12">
          <h2 className="font-display text-2xl font-bold">Termos e Condições</h2>
          <div className="text-sm text-muted-foreground font-body space-y-3 leading-relaxed">
            <p><strong className="text-foreground">1.</strong> Esta proposta é válida por 15 dias corridos a partir da data de emissão.</p>
            <p><strong className="text-foreground">2.</strong> O prazo estimado de entrega é de 6 semanas a partir da aprovação e pagamento da entrada.</p>
            <p><strong className="text-foreground">3.</strong> As 10 horas de manutenção devem ser utilizadas em até 60 dias após a entrega final do projeto.</p>
            <p><strong className="text-foreground">4.</strong> Alterações de escopo que excedam o descrito nesta proposta serão orçadas separadamente.</p>
            <p><strong className="text-foreground">5.</strong> Os custos de infraestrutura em nuvem (hospedagem, banco de dados, APIs de terceiros) são de responsabilidade do contratante.</p>
            <p><strong className="text-foreground">6.</strong> Todo o código-fonte será entregue ao cliente ao final do projeto.</p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/40 py-8">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="font-display font-bold text-primary text-lg">UrbaMarket</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Consultoria de Marketing & Vendas para o Mercado Imobiliário</p>
        </div>
      </footer>
    </div>
  );
};

export default Proposta;
