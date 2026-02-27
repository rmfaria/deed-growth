import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Phone, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CrmWhatsApp = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">WhatsApp Business</h1>
        <p className="text-muted-foreground font-body text-sm">Configure a API oficial do WhatsApp Business</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <MessageSquare className="text-emerald-400" size={20} />
            Configuração da API
          </CardTitle>
          <CardDescription>
            Conecte sua conta do WhatsApp Business API (Meta Cloud API)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Phone Number ID</Label>
            <Input placeholder="ID do número de telefone (Meta Business)" />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp Business Account ID</Label>
            <Input placeholder="ID da conta WhatsApp Business" />
          </div>
          <div className="space-y-2">
            <Label>Access Token</Label>
            <Input type="password" placeholder="Token de acesso permanente" />
          </div>
          <div className="space-y-2">
            <Label>Webhook Verify Token</Label>
            <Input placeholder="Token para verificação do webhook" />
          </div>

          <div className="border-t border-border pt-4 space-y-3">
            <h4 className="font-display font-semibold text-sm">Automações</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Mensagem de boas-vindas</p>
                <p className="text-xs text-muted-foreground">Enviar ao receber novo lead</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Notificar mudança de estágio</p>
                <p className="text-xs text-muted-foreground">Enviar quando lead avançar no funil</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Lembrete de visita</p>
                <p className="text-xs text-muted-foreground">Enviar 24h antes da visita agendada</p>
              </div>
              <Switch />
            </div>
          </div>

          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => toast({ title: "Configuração salva!" })}>
            <Zap size={16} /> Salvar e Conectar
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Phone className="text-primary" size={20} />
            Templates de Mensagem
          </CardTitle>
          <CardDescription>
            Gerencie templates aprovados pelo WhatsApp Business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Configure seus templates de mensagem após conectar a API do WhatsApp Business.
            Templates precisam ser aprovados pela Meta antes de serem utilizados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrmWhatsApp;
