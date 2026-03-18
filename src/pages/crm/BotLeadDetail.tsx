import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Send, Calendar, UserCheck, MessageSquare, Target, MapPin, Building2, TrendingUp, Loader2 } from "lucide-react";
import { ScoreBadge } from "@/components/crm/bot/ScoreBadge";
import { StatusBadge } from "@/components/crm/bot/StatusBadge";
import { ConversationTimeline } from "@/components/crm/bot/ConversationTimeline";
import { FLOW_STAGES } from "@/services/bot/types";
import { useBotLead, useBotMessages, useScoreEvents, useBotVisits, useBotHandoffs, useBotMaterials } from "@/hooks/useBotData";
import { useHandoffLead, useScheduleVisit, useSendMaterial, useAddNote } from "@/hooks/useBotActions";

const BotLeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: lead, isLoading: loadingLead } = useBotLead(id);
  const { data: messages = [] } = useBotMessages(id);
  const { data: scoreEvents = [] } = useScoreEvents(id);
  const { data: visits = [] } = useBotVisits(id);
  const { data: handoffs = [] } = useBotHandoffs(id);
  const { data: materials = [] } = useBotMaterials();

  const handoffMutation = useHandoffLead();
  const visitMutation = useScheduleVisit();
  const materialMutation = useSendMaterial();
  const noteMutation = useAddNote();

  const [showMaterial, setShowMaterial] = useState(false);
  const [showVisit, setShowVisit] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const [showNote, setShowNote] = useState(false);

  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [visitDate, setVisitDate] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [handoffReason, setHandoffReason] = useState("");
  const [noteText, setNoteText] = useState("");

  if (loadingLead) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Lead não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/crm/bot/leads')}>Voltar</Button>
      </div>
    );
  }

  const currentStageIndex = FLOW_STAGES.findIndex(s => s.key === lead.conversation_state);
  const activeMaterials = materials.filter(m => m.is_active);

  const handleSendMaterial = () => {
    if (selectedMaterials.length === 0) return;
    materialMutation.mutate({ leadId: lead.id, materialNames: selectedMaterials });
    setShowMaterial(false);
    setSelectedMaterials([]);
  };

  const handleScheduleVisit = () => {
    visitMutation.mutate({ leadId: lead.id, scheduledAt: visitDate || undefined, notes: visitNotes || undefined });
    setShowVisit(false);
    setVisitDate("");
    setVisitNotes("");
  };

  const handleHandoff = () => {
    if (!handoffReason.trim()) return;
    handoffMutation.mutate({ leadId: lead.id, reason: handoffReason });
    setShowHandoff(false);
    setHandoffReason("");
  };

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    noteMutation.mutate({ leadId: lead.id, note: noteText });
    setShowNote(false);
    setNoteText("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate('/crm/bot/leads')}>
          <ArrowLeft size={20} />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-foreground truncate">{lead.name}</h1>
          <p className="text-muted-foreground font-body text-sm">{lead.phone} • {lead.origin || 'Sem origem'}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ScoreBadge classification={lead.score_classification} score={lead.score} />
          <StatusBadge status={lead.attendance_status} />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" className="gap-2" onClick={() => setShowMaterial(true)}><Send size={14} /> Enviar Material</Button>
        <Button variant="outline" className="gap-2" onClick={() => setShowVisit(true)}><Calendar size={14} /> Agendar Visita</Button>
        <Button variant="outline" className="gap-2" onClick={() => setShowHandoff(true)}><UserCheck size={14} /> Transferir para Humano</Button>
        <Button variant="outline" className="gap-2" onClick={() => setShowNote(true)}><MessageSquare size={14} /> Adicionar Observação</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="font-display text-base">Dados do Lead</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow icon={Building2} label="Perfil" value={lead.profile_type ? lead.profile_type.charAt(0).toUpperCase() + lead.profile_type.slice(1) : 'Indefinido'} />
              <InfoRow icon={Target} label="Objetivo" value={lead.objective || 'Não informado'} />
              <InfoRow icon={MapPin} label="Metragem" value={lead.desired_area || 'Não informada'} />
              <InfoRow icon={Building2} label="Interesse Construção" value={lead.construction_interest ? 'Sim' : 'Não'} />
              <InfoRow icon={TrendingUp} label="Visita" value={lead.visit_interest ? 'Sim' : 'Não'} />
              {lead.handoff_reason && <InfoRow icon={UserCheck} label="Motivo Handoff" value={lead.handoff_reason} />}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="font-display text-base">Histórico de Score</CardTitle></CardHeader>
            <CardContent>
              {scoreEvents.length > 0 ? (
                <div className="space-y-2">
                  {scoreEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm text-foreground">{ev.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ev.created_at).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">+{ev.points}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum evento de score.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="font-display text-base">Progresso no Fluxo</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1">
                {FLOW_STAGES.map((stage, i) => {
                  const isCurrent = i === currentStageIndex;
                  const isPast = i < currentStageIndex;
                  return (
                    <div key={stage.key} className={`flex items-center gap-2 py-1 px-2 rounded text-xs ${isCurrent ? 'bg-primary/15 text-primary font-medium' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/40'}`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isCurrent ? 'bg-primary' : isPast ? 'bg-muted-foreground' : 'bg-muted'}`} />
                      {stage.label}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader><CardTitle className="font-display text-base">Conversa</CardTitle></CardHeader>
          <CardContent>
            <ConversationTimeline messages={messages} />
          </CardContent>
        </Card>
      </div>

      {(visits.length > 0 || handoffs.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visits.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-display text-base">Visitas</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {visits.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm text-foreground capitalize">{v.status}</p>
                        {v.scheduled_at && <p className="text-xs text-muted-foreground">{new Date(v.scheduled_at).toLocaleString("pt-BR")}</p>}
                      </div>
                      {v.notes && <p className="text-xs text-muted-foreground max-w-[200px] truncate">{v.notes}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {handoffs.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="font-display text-base">Handoffs</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {handoffs.map((h) => (
                    <div key={h.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm text-foreground">{h.reason}</p>
                        <p className="text-xs text-muted-foreground capitalize">{h.status}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleDateString("pt-BR")}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Modal: Enviar Material */}
      <Dialog open={showMaterial} onOpenChange={setShowMaterial}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar Material</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            {activeMaterials.length > 0 ? activeMaterials.map((m) => (
              <label key={m.id} className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={selectedMaterials.includes(m.name)}
                  onCheckedChange={(checked) => {
                    setSelectedMaterials(prev => checked ? [...prev, m.name] : prev.filter(n => n !== m.name));
                  }}
                />
                <span className="text-sm">{m.name}</span>
                <span className="text-xs text-muted-foreground ml-auto capitalize">{m.type}</span>
              </label>
            )) : (
              <p className="text-sm text-muted-foreground">Nenhum material ativo cadastrado.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMaterial(false)}>Cancelar</Button>
            <Button onClick={handleSendMaterial} disabled={selectedMaterials.length === 0 || materialMutation.isPending}>
              {materialMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Enviar ({selectedMaterials.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Agendar Visita */}
      <Dialog open={showVisit} onOpenChange={setShowVisit}>
        <DialogContent>
          <DialogHeader><DialogTitle>Agendar Visita</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Data e horário (opcional)</Label>
              <Input type="datetime-local" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} placeholder="Notas sobre a visita..." className="mt-1.5" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVisit(false)}>Cancelar</Button>
            <Button onClick={handleScheduleVisit} disabled={visitMutation.isPending}>
              {visitMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Transferir para Humano */}
      <Dialog open={showHandoff} onOpenChange={setShowHandoff}>
        <DialogContent>
          <DialogHeader><DialogTitle>Transferir para Atendimento Humano</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Motivo da transferência</Label>
              <Textarea value={handoffReason} onChange={(e) => setHandoffReason(e.target.value)} placeholder="Ex: Lead solicitou proposta personalizada..." className="mt-1.5" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHandoff(false)}>Cancelar</Button>
            <Button onClick={handleHandoff} disabled={!handoffReason.trim() || handoffMutation.isPending}>
              {handoffMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Transferir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Adicionar Observação */}
      <Dialog open={showNote} onOpenChange={setShowNote}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Observação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Observação</Label>
              <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Registre uma observação sobre o lead..." className="mt-1.5" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNote(false)}>Cancelar</Button>
            <Button onClick={handleAddNote} disabled={!noteText.trim() || noteMutation.isPending}>
              {noteMutation.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <span className="text-muted-foreground">{label}: </span>
        <span className="text-foreground">{value}</span>
      </div>
    </div>
  );
}

export default BotLeadDetail;
