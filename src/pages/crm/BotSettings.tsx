import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Loader2, RefreshCw, CheckCircle2, XCircle, Circle, Plus, Trash2, Bot, RotateCcw } from "lucide-react";
import { SCORE_RULES } from "@/services/bot/types";
import { useBotConfig } from "@/hooks/useBotData";
import { toast } from "sonner";

const PROVIDER_DEFAULTS: Record<string, { label: string; model: string; hint: string }> = {
  openai:    { label: "OpenAI",         model: "gpt-4o-mini",   hint: "gpt-4o, gpt-4o-mini, gpt-4-turbo" },
  anthropic: { label: "Anthropic",      model: "claude-sonnet-4-20250514", hint: "claude-sonnet-4-20250514, claude-haiku-4-5-20251001" },
  google:    { label: "Google Gemini",  model: "gemini-2.0-flash",     hint: "gemini-2.0-flash, gemini-1.5-pro" },
  xai:       { label: "xAI Grok",      model: "grok-3-mini",          hint: "grok-3-mini, grok-3" },
};

const BotSettings = () => {
  const { data: config, isLoading } = useBotConfig();
  const [persona, setPersona] = useState("Rogério");
  const [openingMsg, setOpeningMsg] = useState("Olá, vi que você solicitou informações sobre os lotes do Metropolitan Business Center. Sou o {persona}, responsável pelo projeto. Posso te explicar rapidamente como funciona essa oportunidade.");
  const [contextMsg, setContextMsg] = useState("O MBC é um condomínio empresarial às margens da MG-10, próximo ao Aeroporto de Confins. Os lotes começam a partir de 1.000 m² e a região está em forte expansão logística.");
  const [transferMsg, setTransferMsg] = useState("Vou te conectar com um consultor que vai cuidar de tudo para você. Em breve ele entrará em contato!");
  const [businessHoursStart, setBusinessHoursStart] = useState("08:00");
  const [businessHoursEnd, setBusinessHoursEnd] = useState("18:00");
  const [autoHandoffHot, setAutoHandoffHot] = useState(true);
  const [autoResetHours, setAutoResetHours] = useState(4);
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [llmProvider, setLlmProvider] = useState("openai");
  const [llmApiKey, setLlmApiKey] = useState("");
  const [llmModel, setLlmModel] = useState("");
  const [llmSystemPrompt, setLlmSystemPrompt] = useState("");
  const [llmMaxHistory, setLlmMaxHistory] = useState(20);
  const [llmMaxResponseLength, setLlmMaxResponseLength] = useState(500);
  const [llmTemperature, setLlmTemperature] = useState(0.7);
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const [abTestPercentage, setAbTestPercentage] = useState(20);
  const [attendants, setAttendants] = useState<{ name: string; phone: string }[]>([{ name: "", phone: "" }]);
  const [saving, setSaving] = useState(false);
  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [engineLoading, setEngineLoading] = useState(false);

  const checkEngine = async () => {
    setEngineLoading(true);
    try {
      const resp = await fetch("https://prod.nesecurity.com.br/mbc/api/webhook/stats");
      if (resp.ok) {
        setEngineStatus(await resp.json());
      } else {
        setEngineStatus({ error: true });
      }
    } catch {
      setEngineStatus({ error: true });
    } finally {
      setEngineLoading(false);
    }
  };

  useEffect(() => { checkEngine(); }, []);

  useEffect(() => {
    if (config) {
      if (config.persona) setPersona(config.persona as string);
      if (config.opening_message) setOpeningMsg(config.opening_message as string);
      if (config.context_message) setContextMsg(config.context_message as string);
      if (config.transfer_message) setTransferMsg(config.transfer_message as string);
      if (config.business_hours_start) setBusinessHoursStart(config.business_hours_start as string);
      if (config.business_hours_end) setBusinessHoursEnd(config.business_hours_end as string);
      if (config.auto_handoff_hot !== undefined) setAutoHandoffHot(config.auto_handoff_hot as boolean);
      if (config.auto_reset_hours !== undefined) setAutoResetHours(Number(config.auto_reset_hours) || 4);
      if (config.llm_enabled !== undefined) setLlmEnabled(!!config.llm_enabled);
      if (config.llm_provider) setLlmProvider(config.llm_provider as string);
      if (config.llm_api_key) setLlmApiKey(config.llm_api_key as string);
      if (config.llm_model) setLlmModel(config.llm_model as string);
      if (config.llm_system_prompt) setLlmSystemPrompt(config.llm_system_prompt as string);
      if (config.llm_max_history !== undefined) setLlmMaxHistory(Number(config.llm_max_history) || 20);
      if (config.llm_max_response_length !== undefined) setLlmMaxResponseLength(Number(config.llm_max_response_length) || 500);
      if (config.llm_temperature !== undefined) setLlmTemperature(Number(config.llm_temperature) || 0.7);
      if (config.ab_test_enabled !== undefined) setAbTestEnabled(!!config.ab_test_enabled);
      if (config.ab_test_llm_percentage !== undefined) setAbTestPercentage(Number(config.ab_test_llm_percentage) || 20);
      if (config.attendants) {
        const atts = config.attendants as { name: string; phone: string }[];
        setAttendants(atts.length > 0 ? atts : [{ name: "", phone: "" }]);
      }
    }
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    const entries = [
      { key: 'persona', value: persona },
      { key: 'opening_message', value: openingMsg },
      { key: 'context_message', value: contextMsg },
      { key: 'transfer_message', value: transferMsg },
      { key: 'business_hours_start', value: businessHoursStart },
      { key: 'business_hours_end', value: businessHoursEnd },
      { key: 'auto_handoff_hot', value: autoHandoffHot },
      { key: 'auto_reset_hours', value: autoResetHours },
      { key: 'llm_enabled', value: llmEnabled },
      { key: 'llm_provider', value: llmProvider },
      { key: 'llm_api_key', value: llmApiKey },
      { key: 'llm_model', value: llmModel || PROVIDER_DEFAULTS[llmProvider]?.model || "" },
      { key: 'llm_system_prompt', value: llmSystemPrompt },
      { key: 'llm_max_history', value: llmMaxHistory },
      { key: 'llm_max_response_length', value: llmMaxResponseLength },
      { key: 'llm_temperature', value: llmTemperature },
      { key: 'ab_test_enabled', value: abTestEnabled },
      { key: 'ab_test_llm_percentage', value: abTestPercentage },
      { key: 'attendants', value: attendants.filter(a => a.name.trim() && a.phone.trim()) },
    ];

    try {
      const resp = await fetch("https://prod.nesecurity.com.br/mbc/api/webhook/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
      });
      const result = await resp.json();
      if (!result.ok) throw new Error(result.error || "Falha ao salvar");
      toast.success("Configurações salvas com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar configurações.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações do Bot</h1>
        <p className="text-muted-foreground font-body text-sm">Configure o comportamento do bot de pré-vendas MBC</p>
      </div>

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

      <Card className={`bg-card border-border ${llmEnabled ? "border-primary/40" : ""}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Bot size={18} className="text-primary" />
                Inteligência Artificial
              </CardTitle>
              <CardDescription>Substitui o fluxo fixo por conversa natural com IA</CardDescription>
            </div>
            <Switch checked={llmEnabled} onCheckedChange={setLlmEnabled} />
          </div>
        </CardHeader>
        {llmEnabled && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Provedor</Label>
                <Select value={llmProvider} onValueChange={(v) => { setLlmProvider(v); setLlmModel(""); }}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PROVIDER_DEFAULTS).map(([key, p]) => (
                      <SelectItem key={key} value={key}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo</Label>
                <Input
                  value={llmModel}
                  onChange={(e) => setLlmModel(e.target.value)}
                  placeholder={PROVIDER_DEFAULTS[llmProvider]?.model || ""}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">{PROVIDER_DEFAULTS[llmProvider]?.hint}</p>
              </div>
            </div>
            <div>
              <Label>API Key</Label>
              <Input
                type="password"
                value={llmApiKey}
                onChange={(e) => setLlmApiKey(e.target.value)}
                placeholder="sk-..."
                className="mt-1.5 font-mono"
              />
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>System Prompt</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs h-7"
                  onClick={() => setLlmSystemPrompt("")}
                >
                  <RotateCcw size={12} /> Restaurar padrão
                </Button>
              </div>
              <Textarea
                value={llmSystemPrompt}
                onChange={(e) => setLlmSystemPrompt(e.target.value)}
                placeholder="Deixe vazio para usar o prompt padrão com regras do MBC..."
                className="mt-1 font-mono text-xs min-h-[200px]"
                rows={12}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {'{persona}'} para o nome do corretor. Deixe vazio para usar o prompt padrão.
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Histórico</Label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={llmMaxHistory}
                  onChange={(e) => setLlmMaxHistory(parseInt(e.target.value) || 20)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">mensagens</p>
              </div>
              <div>
                <Label>Max caracteres</Label>
                <Input
                  type="number"
                  min={100}
                  max={2000}
                  step={50}
                  value={llmMaxResponseLength}
                  onChange={(e) => setLlmMaxResponseLength(parseInt(e.target.value) || 500)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">por resposta</p>
              </div>
              <div>
                <Label>Temperatura</Label>
                <Input
                  type="number"
                  min={0}
                  max={1}
                  step={0.1}
                  value={llmTemperature}
                  onChange={(e) => setLlmTemperature(parseFloat(e.target.value) || 0.7)}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">0=preciso, 1=criativo</p>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>A/B Testing</Label>
                  <p className="text-xs text-muted-foreground">Ativar IA gradualmente para uma porcentagem dos leads</p>
                </div>
                <Switch checked={abTestEnabled} onCheckedChange={setAbTestEnabled} />
              </div>
              {abTestEnabled && (
                <div className="flex items-center gap-3 mt-3">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={abTestPercentage}
                    onChange={(e) => setAbTestPercentage(parseInt(e.target.value) || 20)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">% dos leads usam IA (resto usa fluxo fixo)</span>
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <p className="text-xs text-amber-600 font-medium">
                Guardrails ativos: anti-repetição persistente, loop detection via DB, timeout 15s, rate limit 2s/msg, cooldown progressivo (30min/2h/8h), classificador de intent (regex), fallback automático para fluxo fixo.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-base">Atendentes</CardTitle>
          <CardDescription>Consultores que recebem notificação na transferência para humano</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {attendants.map((att, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                placeholder="Nome"
                value={att.name}
                onChange={(e) => {
                  const next = [...attendants];
                  next[i] = { ...next[i], name: e.target.value };
                  setAttendants(next);
                }}
                className="flex-1"
              />
              <Input
                placeholder="5531999999999"
                value={att.phone}
                onChange={(e) => {
                  const next = [...attendants];
                  next[i] = { ...next[i], phone: e.target.value };
                  setAttendants(next);
                }}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                disabled={attendants.length <= 1}
                onClick={() => setAttendants(attendants.filter((_, j) => j !== i))}
              >
                <Trash2 size={14} className="text-destructive" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setAttendants([...attendants, { name: "", phone: "" }])}
          >
            <Plus size={14} /> Adicionar Atendente
          </Button>
          <p className="text-xs text-muted-foreground">
            Ao transferir um lead, todos os atendentes recebem uma mensagem no WhatsApp com o contato do cliente.
          </p>
        </CardContent>
      </Card>

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
          <div>
            <Label>Reinício automático de conversa por inatividade</Label>
            <div className="flex items-center gap-3 mt-1.5">
              <Input
                type="number"
                min={1}
                max={168}
                value={autoResetHours}
                onChange={(e) => setAutoResetHours(parseInt(e.target.value) || 4)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">horas sem interação</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leads sem mensagem há mais de {autoResetHours}h voltam automaticamente para o início do fluxo (START).
            </p>
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

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-base">Integração OpenClaw</CardTitle>
              <CardDescription>Status dos serviços do engine em produção</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={checkEngine} disabled={engineLoading} className="gap-2">
              <RefreshCw size={14} className={engineLoading ? "animate-spin" : ""} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {engineStatus?.error ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <XCircle size={16} />
              <span>Engine offline ou inacessível</span>
            </div>
          ) : engineStatus ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm font-medium text-foreground">Engine online</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  uptime: {Math.floor(engineStatus.uptime / 60)}min
                </Badge>
              </div>
              <div className="space-y-1.5">
                {(engineStatus.services || [
                  "openclawWebhookReceiver", "conversationStateService", "leadScoringService",
                  "handoffRouterService", "materialDispatchService", "visitSchedulingService", "whatsappMessageService"
                ]).map((svc: string) => (
                  <div key={svc} className="flex items-center gap-2 py-1">
                    <Circle size={8} className="text-emerald-500 fill-emerald-500" />
                    <span className="font-mono text-xs text-foreground">{svc}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  {engineStatus.config?.supabase ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-destructive" />}
                  <span className="text-muted-foreground">Supabase</span>
                </div>
                <div className="flex items-center gap-2">
                  {engineStatus.config?.orbit_core ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-destructive" />}
                  <span className="text-muted-foreground">Orbit Core</span>
                </div>
                <div className="flex items-center gap-2">
                  {engineStatus.config?.whatsapp_api ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-muted-foreground" />}
                  <span className="text-muted-foreground">WhatsApp API</span>
                </div>
                <div className="flex items-center gap-2">
                  {engineStatus.config?.webhook_secret ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-destructive" />}
                  <span className="text-muted-foreground">Webhook Secret</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 size={14} className="animate-spin" />
              <span>Verificando engine...</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button className="gap-2" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
};

export default BotSettings;
