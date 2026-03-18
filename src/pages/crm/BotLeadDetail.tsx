import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Calendar, UserCheck, MessageSquare, Target, MapPin, Building2, TrendingUp } from "lucide-react";
import { mockLeads, mockMessages, mockScoreEvents, mockVisits, mockHandoffs } from "@/services/bot/mockData";
import { ScoreBadge } from "@/components/crm/bot/ScoreBadge";
import { StatusBadge } from "@/components/crm/bot/StatusBadge";
import { ConversationTimeline } from "@/components/crm/bot/ConversationTimeline";
import { FLOW_STAGES } from "@/services/bot/types";

const BotLeadDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const lead = mockLeads.find(l => l.id === id);
  const messages = mockMessages[id || ''] || [];
  const scoreEvents = mockScoreEvents[id || ''] || [];
  const visits = mockVisits.filter(v => v.lead_id === id);
  const handoffs = mockHandoffs.filter(h => h.lead_id === id);

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">Lead não encontrado.</p>
        <Button variant="outline" onClick={() => navigate('/crm/bot/leads')}>Voltar</Button>
      </div>
    );
  }

  const currentStageIndex = FLOW_STAGES.findIndex(s => s.key === lead.conversation_state);

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" className="gap-2"><Send size={14} /> Enviar Material</Button>
        <Button variant="outline" className="gap-2"><Calendar size={14} /> Agendar Visita</Button>
        <Button variant="outline" className="gap-2"><UserCheck size={14} /> Transferir para Humano</Button>
        <Button variant="outline" className="gap-2"><MessageSquare size={14} /> Adicionar Observação</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Lead Info + Score */}
        <div className="space-y-6">
          {/* Dados do Lead */}
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

          {/* Score Events */}
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

          {/* Flow Progress */}
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

        {/* Center - Conversation */}
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader><CardTitle className="font-display text-base">Conversa</CardTitle></CardHeader>
          <CardContent>
            <ConversationTimeline messages={messages} />
          </CardContent>
        </Card>
      </div>

      {/* Visits & Handoffs */}
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
