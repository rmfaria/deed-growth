import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Webhook, Mail, Key, Copy, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CrmIntegrations = () => {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Integrações</h1>
        <p className="text-muted-foreground font-body text-sm">Configure conexões com serviços externos</p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="email">Email Marketing</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="api">API REST</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Mail className="text-primary" size={20} />
                Email Marketing
              </CardTitle>
              <CardDescription>
                Configure a integração com seu serviço de email (SendGrid, Resend, Mailchimp, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Provedor</Label>
                <Input placeholder="Ex: SendGrid, Resend, Mailchimp" />
              </div>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input type="password" placeholder="Sua API key do provedor" />
              </div>
              <div className="space-y-2">
                <Label>Email remetente</Label>
                <Input type="email" placeholder="noreply@suaempresa.com" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Rastreamento de abertura</p>
                  <p className="text-xs text-muted-foreground">Pixel de tracking em emails enviados</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Rastreamento de cliques</p>
                  <p className="text-xs text-muted-foreground">Rastrear cliques em links dos emails</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button onClick={() => toast({ title: "Configuração salva!" })}>
                Salvar Configuração
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-6 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Webhook className="text-primary" size={20} />
                Webhooks
              </CardTitle>
              <CardDescription>
                Receba notificações em tempo real sobre eventos do CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook</Label>
                <Input placeholder="https://seuservidor.com/webhook" />
              </div>
              <div className="space-y-2">
                <Label>Eventos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["lead.created", "lead.updated", "lead.stage_changed", "campaign.sent", "campaign.opened"].map((event) => (
                    <label key={event} className="flex items-center gap-2 text-sm text-foreground">
                      <input type="checkbox" className="rounded border-border" />
                      {event}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secret (para assinatura HMAC)</Label>
                <Input type="password" placeholder="Chave secreta" />
              </div>
              <Button onClick={() => toast({ title: "Webhook configurado!" })}>
                <Plus size={16} /> Adicionar Webhook
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="mt-6 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Key className="text-primary" size={20} />
                API REST
              </CardTitle>
              <CardDescription>
                Gerencie chaves de API para acesso externo ao CRM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-sm font-medium text-foreground mb-2">Endpoint Base</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs text-primary bg-background px-3 py-2 rounded">
                    {`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "project"}.supabase.co/functions/v1`}
                  </code>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID || "project"}.supabase.co/functions/v1`);
                      toast({ title: "Copiado!" });
                    }}
                  >
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome da chave</Label>
                <Input placeholder="Ex: Integração RD Station" />
              </div>
              <div className="space-y-2">
                <Label>Permissões</Label>
                <div className="flex gap-3">
                  {["read", "write", "delete"].map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm text-foreground capitalize">
                      <input type="checkbox" className="rounded border-border" defaultChecked={p === "read"} />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
              <Button onClick={() => toast({ title: "API Key gerada!" })}>
                <Key size={16} /> Gerar API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrmIntegrations;
