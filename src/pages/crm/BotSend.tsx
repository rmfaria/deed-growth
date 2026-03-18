import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Send, Image, Video, FileText, Loader2, CheckCircle2, XCircle,
  Phone, ScrollText, Users, User, Search, Square, CheckSquare, StopCircle,
} from "lucide-react";
import { useBotLeads, useBotConfig, useBotMaterials } from "@/hooks/useBotData";
import { ScoreBadge } from "@/components/crm/bot/ScoreBadge";
import { toast } from "sonner";
import type { BotLead, BotMaterial } from "@/services/bot/types";

const MEDIA_TYPE_MAP: Record<string, string> = {
  video: "video",
  apresentacao: "document",
  planta: "document",
  mapa: "image",
  tabela: "document",
  pdf: "document",
};

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

const BATCH_SIZE = 10;
const BATCH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function notifyAttendants(
  attendants: { name: string; phone: string }[],
  leadName: string,
  leadPhone: string,
  leadOrigin: string,
) {
  const waLink = `https://wa.me/${leadPhone.replace(/[^0-9]/g, "")}`;
  for (const att of attendants) {
    const msg =
      `🔔 *Transferência de Lead*\n\n` +
      `*Cliente:* ${leadName}\n` +
      `*Telefone:* ${leadPhone}\n` +
      `*Campanha:* ${leadOrigin}\n\n` +
      `👉 Abrir conversa: ${waLink}`;
    const attPhone = att.phone.replace(/[^0-9]/g, "");
    if (attPhone) {
      await sendText(attPhone, msg).catch(() => {});
    }
  }
}

type SendMode = "single" | "mass";

interface BatchProgress {
  total: number;
  sent: number;
  failed: number;
  currentBatch: number;
  totalBatches: number;
  nextBatchAt: Date | null;
  status: "running" | "waiting" | "done" | "cancelled";
}

const BotSend = () => {
  const { data: leads = [] } = useBotLeads();
  const { data: botConfig } = useBotConfig();
  const { data: materials = [] } = useBotMaterials();
  const activeMaterials = materials.filter((m) => m.is_active && m.url && !m.url.includes("example.com"));

  // Mode
  const [sendMode, setSendMode] = useState<SendMode>("single");

  // Single mode state
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [selectedScript, setSelectedScript] = useState<string>("");
  const [manualPhone, setManualPhone] = useState("");
  const [message, setMessage] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [caption, setCaption] = useState("");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; phone: string } | null>(null);

  // Mass mode state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [massSearch, setMassSearch] = useState("");
  const [massScoreFilter, setMassScoreFilter] = useState("all");
  const [massOriginFilter, setMassOriginFilter] = useState("all");
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const cancelRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);
  const phone = selectedLead?.phone || manualPhone;
  const cleanPhone = phone.replace(/[^0-9+]/g, "");

  // Filtered leads for mass selection
  const filteredLeads = leads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(massSearch.toLowerCase()) ||
      l.phone.includes(massSearch);
    const matchScore = massScoreFilter === "all" || l.score_classification === massScoreFilter;
    const matchOrigin = massOriginFilter === "all" || (l.origin || "") === massOriginFilter;
    return matchSearch && matchScore && matchOrigin;
  });

  const origins = [...new Set(leads.map((l) => l.origin || "").filter(Boolean))];

  const toggleLead = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Single send
  const handleSendText = async () => {
    if (!cleanPhone || !message.trim()) return;
    setSending(true);
    setLastResult(null);
    try {
      const res = await sendText(cleanPhone, message, selectedLeadId || undefined);
      if (res.ok || res.sent) {
        toast.success(`Mensagem enviada para ${phone}`);
        setLastResult({ ok: true, phone });
        if (selectedScript === "transfer_message") {
          const attendants = (botConfig?.attendants as { name: string; phone: string }[]) || [];
          if (attendants.length > 0) {
            const leadName = selectedLead?.name || "Contato manual";
            const leadOrigin = selectedLead?.origin || "Sem campanha";
            await notifyAttendants(attendants, leadName, cleanPhone, leadOrigin);
            toast.success(`${attendants.length} atendente(s) notificado(s)`);
          }
        }
        setMessage("");
        setSelectedScript("");
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

  // Mass send with batching
  const handleMassSend = useCallback(async () => {
    if (selectedIds.size === 0 || !message.trim()) return;

    const selectedLeads = leads.filter((l) => selectedIds.has(l.id));
    const totalBatches = Math.ceil(selectedLeads.length / BATCH_SIZE);

    cancelRef.current = false;
    setBatchProgress({
      total: selectedLeads.length,
      sent: 0,
      failed: 0,
      currentBatch: 1,
      totalBatches,
      nextBatchAt: null,
      status: "running",
    });

    let sent = 0;
    let failed = 0;

    for (let b = 0; b < totalBatches; b++) {
      if (cancelRef.current) {
        setBatchProgress((p) => p ? { ...p, status: "cancelled" } : null);
        toast.info(`Envio cancelado. ${sent} enviados, ${failed} falhas.`);
        return;
      }

      const batch = selectedLeads.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);

      setBatchProgress((p) => p ? { ...p, currentBatch: b + 1, status: "running", nextBatchAt: null } : null);

      // Send each message in the batch sequentially (small delay between each)
      for (const lead of batch) {
        if (cancelRef.current) break;
        try {
          const leadPhone = lead.phone.replace(/[^0-9+]/g, "");
          const res = await sendText(leadPhone, message, lead.id);
          if (res.ok || res.sent) {
            sent++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
        setBatchProgress((p) => p ? { ...p, sent, failed } : null);
        // Small delay between individual sends (2s)
        await new Promise((r) => setTimeout(r, 2000));
      }

      // If not the last batch, wait 5 minutes
      if (b < totalBatches - 1 && !cancelRef.current) {
        const nextAt = new Date(Date.now() + BATCH_INTERVAL_MS);
        setBatchProgress((p) => p ? { ...p, status: "waiting", nextBatchAt: nextAt } : null);

        await new Promise<void>((resolve) => {
          timerRef.current = setTimeout(resolve, BATCH_INTERVAL_MS);
        });
        timerRef.current = null;
      }
    }

    if (!cancelRef.current) {
      setBatchProgress((p) => p ? { ...p, status: "done", nextBatchAt: null } : null);
      toast.success(`Envio massivo concluído! ${sent} enviados, ${failed} falhas.`);
    }
  }, [selectedIds, leads, message]);

  const handleCancelMass = () => {
    cancelRef.current = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setBatchProgress((p) => p ? { ...p, status: "cancelled" } : null);
  };

  const isMassRunning = batchProgress && (batchProgress.status === "running" || batchProgress.status === "waiting");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Enviar Mensagem</h1>
          <p className="text-muted-foreground font-body text-sm">Envie mensagens manuais via WhatsApp pelo OpenClaw</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          <Button
            variant={sendMode === "single" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setSendMode("single")}
            disabled={!!isMassRunning}
          >
            <User size={14} /> Individual
          </Button>
          <Button
            variant={sendMode === "mass" ? "default" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => setSendMode("mass")}
            disabled={!!isMassRunning}
          >
            <Users size={14} /> Massivo
          </Button>
        </div>
      </div>

      {sendMode === "single" ? (
        <>
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
        </>
      ) : (
        <>
          {/* Mass selection */}
          <Card className="bg-card border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-base">Selecionar Leads</CardTitle>
                  <CardDescription>{selectedIds.size} de {filteredLeads.length} selecionados</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll} disabled={!!isMassRunning} className="gap-1.5">
                    <CheckSquare size={14} /> Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll} disabled={!!isMassRunning} className="gap-1.5">
                    <Square size={14} /> Nenhum
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Filters */}
              <div className="flex flex-wrap gap-2">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                  <Input
                    placeholder="Buscar nome ou telefone..."
                    value={massSearch}
                    onChange={(e) => setMassSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>
                <Select value={massScoreFilter} onValueChange={setMassScoreFilter}>
                  <SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="frio">Frio</SelectItem>
                    <SelectItem value="morno">Morno</SelectItem>
                    <SelectItem value="quente">Quente</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={massOriginFilter} onValueChange={setMassOriginFilter}>
                  <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Origem" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas origens</SelectItem>
                    {origins.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lead list with checkboxes */}
              <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {filteredLeads.map((lead) => (
                  <label
                    key={lead.id}
                    className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-secondary/30 transition-colors ${
                      selectedIds.has(lead.id) ? "bg-primary/5" : ""
                    }`}
                  >
                    <Checkbox
                      checked={selectedIds.has(lead.id)}
                      onCheckedChange={() => toggleLead(lead.id)}
                      disabled={!!isMassRunning}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.phone} • {lead.origin || "—"}</p>
                    </div>
                    <ScoreBadge classification={lead.score_classification} score={lead.score} />
                  </label>
                ))}
                {filteredLeads.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-6">Nenhum lead encontrado.</p>
                )}
              </div>

              {/* Batch info */}
              {selectedIds.size > 0 && (
                <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <p className="text-xs text-blue-600 font-medium">
                    {selectedIds.size} leads selecionados — serão enviados em {Math.ceil(selectedIds.size / BATCH_SIZE)} lotes de até {BATCH_SIZE}, com intervalo de 5 minutos entre cada lote.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Composer */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <Tabs defaultValue="text">
            <TabsList className="mb-4">
              <TabsTrigger value="text" className="gap-2"><Send size={14} /> Texto</TabsTrigger>
              {sendMode === "single" && (
                <>
                  <TabsTrigger value="image" className="gap-2"><Image size={14} /> Imagem</TabsTrigger>
                  <TabsTrigger value="video" className="gap-2"><Video size={14} /> Vídeo</TabsTrigger>
                  <TabsTrigger value="document" className="gap-2"><FileText size={14} /> Documento</TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Texto */}
            <TabsContent value="text" className="space-y-4">
              <div>
                <Label>Script de Vendas</Label>
                <Select
                  value={selectedScript}
                  onValueChange={(key) => {
                    setSelectedScript(key);
                    const raw = botConfig?.[key] as string | undefined;
                    if (!raw) {
                      toast.info("Script não configurado. Acesse Configurações do Bot para definir.");
                      return;
                    }
                    const persona = (botConfig?.persona as string) || "Rogério";
                    setMessage(raw.replace(/\{persona\}/g, persona));
                  }}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecionar script..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SCRIPT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.key} value={opt.key}>
                        <div className="flex items-center gap-2">
                          <ScrollText size={14} className="text-muted-foreground" />
                          <span>{opt.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Preenche a mensagem com o texto configurado em Configurações</p>
                {selectedScript === "transfer_message" && sendMode === "single" && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-xs text-amber-600 font-medium">
                      Ao enviar, os atendentes configurados serão notificados via WhatsApp com o contato deste lead.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="mt-1.5 min-h-[120px] font-mono text-sm"
                  rows={5}
                  disabled={!!isMassRunning}
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
                {sendMode === "single" ? (
                  <Button onClick={handleSendText} disabled={!cleanPhone || !message.trim() || sending} className="gap-2">
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Enviar Texto
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    {isMassRunning && (
                      <Button variant="destructive" onClick={handleCancelMass} className="gap-2">
                        <StopCircle size={16} /> Cancelar
                      </Button>
                    )}
                    <Button
                      onClick={handleMassSend}
                      disabled={selectedIds.size === 0 || !message.trim() || !!isMassRunning}
                      className="gap-2"
                    >
                      {isMassRunning ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                      Enviar para {selectedIds.size} leads
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Imagem — single only */}
            {sendMode === "single" && (
              <TabsContent value="image" className="space-y-4">
                {activeMaterials.filter((m) => m.type === "mapa").length > 0 && (
                  <div>
                    <Label>Material publicado</Label>
                    <Select onValueChange={(id) => {
                      const mat = activeMaterials.find((m) => m.id === id);
                      if (mat?.url) { setMediaUrl(mat.url); setMediaType("image"); setCaption(mat.name); }
                    }}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecionar material..." /></SelectTrigger>
                      <SelectContent>
                        {activeMaterials.filter((m) => m.type === "mapa").map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
            )}

            {/* Vídeo — single only */}
            {sendMode === "single" && (
              <TabsContent value="video" className="space-y-4">
                {activeMaterials.filter((m) => m.type === "video").length > 0 && (
                  <div>
                    <Label>Material publicado</Label>
                    <Select onValueChange={(id) => {
                      const mat = activeMaterials.find((m) => m.id === id);
                      if (mat?.url) { setMediaUrl(mat.url); setMediaType("video"); setCaption(mat.name); }
                    }}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecionar vídeo publicado..." /></SelectTrigger>
                      <SelectContent>
                        {activeMaterials.filter((m) => m.type === "video").map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
            )}

            {/* Documento — single only */}
            {sendMode === "single" && (
              <TabsContent value="document" className="space-y-4">
                {activeMaterials.filter((m) => ["apresentacao", "planta", "tabela", "pdf"].includes(m.type)).length > 0 && (
                  <div>
                    <Label>Material publicado</Label>
                    <Select onValueChange={(id) => {
                      const mat = activeMaterials.find((m) => m.id === id);
                      if (mat?.url) { setMediaUrl(mat.url); setMediaType("document"); setCaption(mat.name); }
                    }}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecionar documento publicado..." /></SelectTrigger>
                      <SelectContent>
                        {activeMaterials.filter((m) => ["apresentacao", "planta", "tabela", "pdf"].includes(m.type)).map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.name} ({m.type})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Batch progress */}
      {batchProgress && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-base">Progresso do Envio Massivo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={(batchProgress.sent + batchProgress.failed) / batchProgress.total * 100} className="h-3" />
            <div className="flex items-center justify-between text-sm">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {batchProgress.sent} enviados
                </span>
                {batchProgress.failed > 0 && (
                  <span className="flex items-center gap-1.5">
                    <XCircle size={14} className="text-destructive" />
                    {batchProgress.failed} falhas
                  </span>
                )}
              </div>
              <span className="text-muted-foreground">
                Lote {batchProgress.currentBatch}/{batchProgress.totalBatches}
              </span>
            </div>

            {batchProgress.status === "waiting" && batchProgress.nextBatchAt && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-amber-600 font-medium">
                  Aguardando intervalo de 5 minutos... Próximo lote às{" "}
                  {batchProgress.nextBatchAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )}

            {batchProgress.status === "done" && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-xs text-emerald-600 font-medium">
                  Envio massivo concluído! {batchProgress.sent} de {batchProgress.total} enviados com sucesso.
                </p>
              </div>
            )}

            {batchProgress.status === "cancelled" && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/30">
                <p className="text-xs text-destructive font-medium">
                  Envio cancelado. {batchProgress.sent} enviados antes do cancelamento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Last result — single mode */}
      {sendMode === "single" && lastResult && (
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
