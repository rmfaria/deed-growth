import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Image, Video, FileText, Loader2, CheckCircle2, XCircle, Phone, ScrollText } from "lucide-react";
import { useBotLeads, useBotConfig } from "@/hooks/useBotData";
import { ScoreBadge } from "@/components/crm/bot/ScoreBadge";
import { toast } from "sonner";

const ENGINE_BASE = "https://prod.nesecurity.com.br/mbc/api/webhook";

async function sendText(phone: string, text: string, leadId?: string) {
  const res = await fetch(`${ENGINE_BASE}/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, text, lead_id: leadId }),
  });
  return res.json();
}

async function sendMedia(phone: string, mediaUrl: string, mediaType: string, caption: string, leadId?: string) {
  const res = await fetch(`${ENGINE_BASE}/send-media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, media_url: mediaUrl, media_type: mediaType, caption, lead_id: leadId }),
  });
  return res.json();
}

const FORMAT_TIPS = [
  { label: "Negrito", syntax: "*texto*", example: "*destaque*" },
  { label: "Itálico", syntax: "_texto_", example: "_sutil_" },
  { label: "Tachado", syntax: "~texto~", example: "~removido~" },
  { label: "Monospace", syntax: "```texto```", example: "```código```" },
];

const SCRIPT_OPTIONS = [
  { key: "opening_message", label: "Abertura" },
  { key: "context_message", label: "Contextualização" },
  { key: "transfer_message", label: "Transferência para Humano" },
] as const;

const BotSend = () => {
  const { data: leads = [] } = useBotLeads();
  const { data: botConfig } = useBotConfig();
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [manualPhone, setManualPhone] = useState("");
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; phone: string } | null>(null);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);
  const phone = selectedLead?.phone || manualPhone;
  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  const handleSendText = async () => {
    if (!cleanPhone || !message.trim()) return;
    setSending(true);
    setLastResult(null);
    try {
      const res = await sendText(cleanPhone, message, selectedLeadId || undefined);
      if (res.ok || res.sent) {
        toast.success(`Mensagem enviada para ${phone}`);
        setLastResult({ ok: true, phone });
        setMessage("");
      } else {
        toast.error(`Erro: ${res.error || "falha no envio"}`);
        setLastResult({ ok: false, phone });
      }
    } catch {
      toast.error("Erro de conexão com o engine");
      setLastResult({ ok: false, phone });
    } finally {
      setSending(false);
    }
  };

  const handleSendMedia = async () => {
    if (!cleanPhone || !mediaUrl.trim()) return;
    setSending(true);
    setLastResult(null);
    try {
      const res = await sendMedia(cleanPhone, mediaUrl, mediaType, caption, selectedLeadId || undefined);
      if (res.ok) {
        toast.success(`Mídia enviada para ${phone}`);
        setLastResult({ ok: true, phone });
        setMediaUrl("");
        setCaption("");
      } else {
        toast.error(`Erro: ${res.error || "falha no envio"}`);
        setLastResult({ ok: false, phone });
      }
    } catch {
      toast.error("Erro de conexão com o engine");
      setLastResult({ ok: false, phone });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Enviar Mensagem</h1>
        <p className="text-muted-foreground font-body text-sm">Envie mensagens manuais via WhatsApp pelo OpenClaw</p>
      </div>

      {/* Destinatário */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-base">Destinatário</CardTitle>
          <CardDescription>Selecione um lead ou digite um número</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Lead existente</Label>
            <Select value={selectedLeadId} onValueChange={(v) => { setSelectedLeadId(v); setManualPhone(""); }}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Selecionar lead..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (digitar número)</SelectItem>
                {leads.map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    <div className="flex items-center gap-2">
                      <span>{l.name}</span>
                      <span className="text-muted-foreground text-xs">{l.phone}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedLead && selectedLeadId !== "none" && (
            <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
              <Phone size={16} className="text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">{selectedLead.name}</p>
                <p className="text-xs text-muted-foreground">{selectedLead.phone} • {selectedLead.origin || "—"}</p>
              </div>
              <ScoreBadge classification={selectedLead.score_classification} score={selectedLead.score} />
            </div>
          )}

          {(!selectedLeadId || selectedLeadId === "none") && (
            <div>
              <Label>Número do WhatsApp</Label>
              <Input
                value={manualPhone}
                onChange={(e) => setManualPhone(e.target.value)}
                placeholder="+5521988831979"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">Formato: código do país + DDD + número</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Composer */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <Tabs defaultValue="text">
            <TabsList className="mb-4">
              <TabsTrigger value="text" className="gap-2"><Send size={14} /> Texto</TabsTrigger>
              <TabsTrigger value="image" className="gap-2"><Image size={14} /> Imagem</TabsTrigger>
              <TabsTrigger value="video" className="gap-2"><Video size={14} /> Vídeo</TabsTrigger>
              <TabsTrigger value="document" className="gap-2"><FileText size={14} /> Documento</TabsTrigger>
            </TabsList>

            {/* Texto */}
            <TabsContent value="text" className="space-y-4">
              {botConfig && (
                <div>
                  <Label>Script de Vendas</Label>
                  <Select
                    onValueChange={(key) => {
                      const raw = botConfig[key] as string | undefined;
                      if (!raw) return;
                      const persona = (botConfig.persona as string) || "Rogério";
                      setMessage(raw.replace(/\{persona\}/g, persona));
                    }}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecionar script..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SCRIPT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.key} value={opt.key} disabled={!botConfig[opt.key]}>
                          <div className="flex items-center gap-2">
                            <ScrollText size={14} className="text-muted-foreground" />
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Preenche a mensagem com o texto configurado em Configurações</p>
                </div>
              )}
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="mt-1.5 min-h-[120px] font-mono text-sm"
                  rows={5}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {FORMAT_TIPS.map((f) => (
                    <Badge key={f.label} variant="outline" className="text-xs cursor-help" title={`${f.label}: ${f.syntax}`}>
                      {f.example}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{message.length} caracteres</p>
                <Button onClick={handleSendText} disabled={!cleanPhone || !message.trim() || sending} className="gap-2">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Enviar Texto
                </Button>
              </div>
            </TabsContent>

            {/* Imagem */}
            <TabsContent value="image" className="space-y-4">
              <div>
                <Label>URL da imagem</Label>
                <Input
                  value={mediaUrl}
                  onChange={(e) => { setMediaUrl(e.target.value); setMediaType("image"); }}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Legenda (opcional)</Label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Legenda da imagem..."
                  className="mt-1.5 font-mono text-sm"
                  rows={2}
                />
              </div>
              {mediaUrl && /\.(jpg|jpeg|png|gif|webp)/i.test(mediaUrl) && (
                <div className="rounded-lg overflow-hidden border border-border max-w-xs">
                  <img src={mediaUrl} alt="Preview" className="w-full h-auto" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSendMedia} disabled={!cleanPhone || !mediaUrl.trim() || sending} className="gap-2">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Image size={16} />}
                  Enviar Imagem
                </Button>
              </div>
            </TabsContent>

            {/* Vídeo */}
            <TabsContent value="video" className="space-y-4">
              <div>
                <Label>URL do vídeo</Label>
                <Input
                  value={mediaUrl}
                  onChange={(e) => { setMediaUrl(e.target.value); setMediaType("video"); }}
                  placeholder="https://exemplo.com/video.mp4"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Legenda (opcional)</Label>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Legenda do vídeo..."
                  className="mt-1.5 font-mono text-sm"
                  rows={2}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSendMedia} disabled={!cleanPhone || !mediaUrl.trim() || sending} className="gap-2">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
                  Enviar Vídeo
                </Button>
              </div>
            </TabsContent>

            {/* Documento */}
            <TabsContent value="document" className="space-y-4">
              <div>
                <Label>URL do documento</Label>
                <Input
                  value={mediaUrl}
                  onChange={(e) => { setMediaUrl(e.target.value); setMediaType("document"); }}
                  placeholder="https://exemplo.com/arquivo.pdf"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Nome do arquivo (opcional)</Label>
                <Input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="apresentacao-mbc.pdf"
                  className="mt-1.5"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSendMedia} disabled={!cleanPhone || !mediaUrl.trim() || sending} className="gap-2">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                  Enviar Documento
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Last result */}
      {lastResult && (
        <div className={`flex items-center gap-3 p-4 rounded-lg border ${lastResult.ok ? "border-emerald-500/30 bg-emerald-500/5" : "border-destructive/30 bg-destructive/5"}`}>
          {lastResult.ok ? <CheckCircle2 size={20} className="text-emerald-500" /> : <XCircle size={20} className="text-destructive" />}
          <span className="text-sm">
            {lastResult.ok ? `Enviado com sucesso para ${lastResult.phone}` : `Falha no envio para ${lastResult.phone}`}
          </span>
        </div>
      )}

      {/* Format guide */}
      <Card className="bg-card border-border border-dashed">
        <CardHeader>
          <CardTitle className="font-display text-sm text-muted-foreground">Formatação WhatsApp</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="space-y-1">
              <p className="font-mono text-muted-foreground">*negrito*</p>
              <p className="font-bold">negrito</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-muted-foreground">_itálico_</p>
              <p className="italic">itálico</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-muted-foreground">~tachado~</p>
              <p className="line-through">tachado</p>
            </div>
            <div className="space-y-1">
              <p className="font-mono text-muted-foreground">```mono```</p>
              <p className="font-mono bg-secondary px-1 rounded">mono</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BotSend;
