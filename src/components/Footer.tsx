import { Link } from "react-router-dom";
import { Instagram, Youtube, Facebook, Mail, Phone } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-lg text-primary-foreground">U</span>
              </div>
              <div>
                <span className="font-display font-bold text-xl text-foreground">URBA</span>
                <span className="font-display font-light text-xl text-primary">MARKET</span>
              </div>
            </div>
            <p className="font-body text-sm text-muted-foreground leading-relaxed">
              Especialistas em marketing digital e vendas para o mercado imobiliário premium.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Navegação</h4>
            <div className="flex flex-col gap-3">
              <Link to="/" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link to="/clientes" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">Clientes</Link>
              <Link to="/contato" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">Contato</Link>
              <Link to="/politica-de-privacidade" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Serviços</h4>
            <div className="flex flex-col gap-3">
              <span className="font-body text-sm text-muted-foreground">Landing Pages</span>
              <span className="font-body text-sm text-muted-foreground">Inteligência de Marketing</span>
              <span className="font-body text-sm text-muted-foreground">Captação de Leads</span>
              <span className="font-body text-sm text-muted-foreground">Gestão de Vendas</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-sm text-foreground mb-4 uppercase tracking-wider">Contato</h4>
            <div className="flex flex-col gap-3">
              <a href="https://api.whatsapp.com/send?phone=5531971558182" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Phone size={14} /> (31) 97155-8182
              </a>
              <a href="mailto:contato@urbamarket.com.br" className="font-body text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                <Mail size={14} /> contato@urbamarket.com.br
              </a>
            </div>
            <div className="flex gap-3 mt-6">
              <a href="https://www.instagram.com/urbamarket_/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                <Instagram size={18} />
              </a>
              <a href="https://www.youtube.com/channel/UC982AYRZV2LO0o03VIDTO9A" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                <Youtube size={18} />
              </a>
              <a href="https://www.facebook.com/urbamarketempreendimentos" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                <Facebook size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-muted-foreground">
            CNPJ: 21.937.424/0001-57 © {new Date().getFullYear()} UrbaMarket. Todos os direitos reservados.
          </p>
          <p className="font-body text-xs text-muted-foreground">
            Governador Valadares, Minas Gerais
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
