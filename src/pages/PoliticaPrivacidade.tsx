import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const PoliticaPrivacidade = () => {
  return (
    <>
      <Header />
      <main className="pt-20">
        <section className="py-24">
          <div className="container mx-auto px-6 max-w-3xl">
            <h1 className="font-display text-4xl font-bold text-gradient mb-8">Política de Privacidade</h1>
            <div className="prose prose-invert max-w-none font-body text-muted-foreground space-y-6 text-sm leading-relaxed">
              <p>A UrbaMarket (CNPJ: 21.937.424/0001-57) está comprometida em proteger sua privacidade. Esta política descreve como coletamos, usamos e protegemos seus dados pessoais.</p>
              <h2 className="font-display text-xl font-semibold text-foreground">1. Dados Coletados</h2>
              <p>Coletamos nome, e-mail, telefone/WhatsApp e tipo de empreendimento quando você preenche nossos formulários de contato.</p>
              <h2 className="font-display text-xl font-semibold text-foreground">2. Uso dos Dados</h2>
              <p>Seus dados são utilizados exclusivamente para: entrar em contato comercial, enviar propostas personalizadas e melhorar nossos serviços de marketing imobiliário.</p>
              <h2 className="font-display text-xl font-semibold text-foreground">3. Compartilhamento</h2>
              <p>Não vendemos ou compartilhamos seus dados com terceiros, exceto quando necessário para a prestação de nossos serviços (plataformas de e-mail marketing e CRM).</p>
              <h2 className="font-display text-xl font-semibold text-foreground">4. Segurança</h2>
              <p>Adotamos medidas de segurança para proteger seus dados contra acesso não autorizado, alteração ou destruição.</p>
              <h2 className="font-display text-xl font-semibold text-foreground">5. Seus Direitos</h2>
              <p>Você pode solicitar a exclusão de seus dados a qualquer momento através do e-mail contato@urbamarket.com.br.</p>
              <h2 className="font-display text-xl font-semibold text-foreground">6. Contato</h2>
              <p>Para dúvidas sobre esta política, entre em contato: contato@urbamarket.com.br</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
};

export default PoliticaPrivacidade;
