import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save } from "lucide-react";
import { SCORE_RULES } from "@/services/bot/types";

const BotSettings = () => {
  const [persona, setPersona] = useState("Rogério");
  const [openingMsg, setOpeningMsg] = useState("Olá, vi que você solicitou informações sobre os lotes do Metropolitan Business Center. Sou o {persona}, responsável pelo projeto. Posso te explicar rapidamente como funciona essa oportunidade.");
  const [contextMsg, setContextMsg] = useState("O MBC é um condomínio empresarial às margens da MG-10, próximo ao Aeroporto de Confins. Os lotes começam a partir de 1.000 m² e a região está em forte expansão logística.");
  const [transferMsg, setTransferMsg] = useState("Vou te conectar com um consultor que vai cuidar de tudo para você. Em breve ele entrará em contato!");
  const [businessHoursStart, setBusinessHoursStart] = useState("08:00");
  const [businessHoursEnd, setBusinessHoursEnd] = useState("18:00");
  const [autoHandoffHot, setAutoHandoffHot] = useState(true);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações do Bot</h1>
        <p className="text-muted-foreground font-body text-sm">Configure o comportamento do bot de pré-vendas MBC</p>
      </div>

      {/* Persona */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-base">Persona do Bot</CardTitle>
          <CardDescription>Nome e identidade usados nas mensagens</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome do corretor/persona</Label>
            <Input value={persona} onChange={(e) => setPersona(e.target.value)} className="mt-1.5" />
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-base">Mensagens do Fluxo</CardTitle>
          <CardDescription>Textos configuráveis para cada etapa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mensagem de Abertura</Label>
            <Textarea value={openingMsg} onChange={(e) => setOpeningMsg(e.target.value)} className="mt-1.5" rows={3} />
            <p className="text-xs text-muted-foreground mt-1">Use {'{persona}'} para inserir o nome do corretor</p>
          </div>
          <Separator />
          <div>
            <Label>Mensagem de Contextualização</Label>
            <Textarea value={contextMsg} onChange={(e) => setContextMsg(e.target.value)} className="mt-1.5" rows={3} />
          </div>
          <Separator />
          <div>
            <Label>Mensagem de Transferência para Humano</Label>
            <Textarea value={transferMsg} onChange={(e) => setTransferMsg(e.target.value)} className="mt-1.5" rows={2} />
          </div>
        </CardContent>
      </Card>

      {/* Score Rules */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-base">Regras de Score</CardTitle>
          <CardDescription>Pontuação por evento — Frio: 0-20 | Morno: 21-50 | Quente: 51+</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SCORE_RULES.map((rule) => (
              <div key={rule.event} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-foreground">{rule.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">+{rule.points}</span>
                  <span className="text-xs text-muted-foreground font-mono">{rule.event}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Handoff & Hours */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-base">Handoff & Horários</CardTitle>
          <CardDescription>Regras de transferência e horário de atendimento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Transferir automaticamente leads quentes</Label>
              <p className="text-xs text-muted-foreground">Leads com score 51+ são transferidos para humano</p>
            </div>
            <Switch checked={autoHandoffHot} onCheckedChange={setAutoHandoffHot} />
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Início do expediente</Label>
              <Input type="time" value={businessHoursStart} onChange={(e) => setBusinessHoursStart(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Fim do expediente</Label>
              <Input type="time" value={businessHoursEnd} onChange={(e) => setBusinessHoursEnd(e.target.value)} className="mt-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Placeholder */}
      <Card className="bg-card border-border border-dashed">
        <CardHeader>
          <CardTitle className="font-display text-base text-muted-foreground">Integração OpenClaw</CardTitle>
          <CardDescription>Placeholder para configuração futura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <span className="font-mono text-xs">openclawWebhookReceiver</span> — Recebimento de mensagens</p>
          <p>• <span className="font-mono text-xs">conversationStateService</span> — Gerenciamento de estado</p>
          <p>• <span className="font-mono text-xs">leadScoringService</span> — Motor de score</p>
          <p>• <span className="font-mono text-xs">handoffRouterService</span> — Roteamento de handoff</p>
          <p>• <span className="font-mono text-xs">materialDispatchService</span> — Envio de materiais</p>
          <p>• <span className="font-mono text-xs">visitSchedulingService</span> — Agendamento de visitas</p>
          <p>• <span className="font-mono text-xs">whatsappMessageService</span> — Envio via WhatsApp</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="gap-2"><Save size={16} /> Salvar Configurações</Button>
      </div>
    </div>
  );
};

export default BotSettings;
