import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Flame, UserCheck, Eye, MessageSquare, ArrowRightLeft, Loader2 } from "lucide-react";
import { ScoreBadge } from "@/components/crm/bot/ScoreBadge";
import { FunnelChart } from "@/components/crm/bot/FunnelChart";
import { useNavigate } from "react-router-dom";
import { useBotLeads, useBotHandoffs, useBotVisits } from "@/hooks/useBotData";

const BotDashboard = () => {
  const navigate = useNavigate();
  const { data: leads = [], isLoading: loadingLeads } = useBotLeads();
  const { data: allHandoffs = [], isLoading: loadingHandoffs } = useBotHandoffs();
  const { data: allVisits = [], isLoading: loadingVisits } = useBotVisits();

  const isLoading = loadingLeads || loadingHandoffs || loadingVisits;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const frios = leads.filter(l => l.score_classification === 'frio').length;
  const mornos = leads.filter(l => l.score_classification === 'morno').length;
  const quentes = leads.filter(l => l.score_classification === 'quente').length;
  const aguardando = leads.filter(l => l.attendance_status === 'aguardando_humano').length;
  const visitasSolicitadas = allVisits.filter(v => v.status === 'solicitada' || v.status === 'confirmada').length;
  const handoffsPendentes = allHandoffs.filter(h => h.status === 'pendente').length;

  const origens = leads.reduce((acc, l) => {
    const o = l.origin || 'Desconhecido';
    acc[o] = (acc[o] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const kpis = [
    { title: 'Total de Leads', value: leads.length, icon: Users, color: 'text-blue-400' },
    { title: 'Leads Quentes', value: quentes, icon: Flame, color: 'text-red-400' },
    { title: 'Aguardando Humano', value: aguardando, icon: UserCheck, color: 'text-amber-400' },
    { title: 'Visitas Solicitadas', value: visitasSolicitadas, icon: Eye, color: 'text-emerald-400' },
    { title: 'Handoffs Pendentes', value: handoffsPendentes, icon: ArrowRightLeft, color: 'text-purple-400' },
    { title: 'Leads Mornos', value: mornos, icon: MessageSquare, color: 'text-amber-300' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">MBC Bot Dashboard</h1>
        <p className="text-muted-foreground font-body text-sm">Pré-vendas Metropolitan Business Center</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-display font-bold text-foreground">{kpi.value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{kpi.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-lg">Funil Conversacional</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart leads={leads} />
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Classificação por Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Frio (0-20)', count: frios, pct: leads.length ? (frios / leads.length) * 100 : 0, color: 'bg-sky-500' },
              { label: 'Morno (21-50)', count: mornos, pct: leads.length ? (mornos / leads.length) * 100 : 0, color: 'bg-amber-500' },
              { label: 'Quente (51+)', count: quentes, pct: leads.length ? (quentes / leads.length) * 100 : 0, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-foreground">{item.count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Leads por Origem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(origens).sort((a, b) => b[1] - a[1]).map(([origem, count]) => (
                <div key={origem} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <span className="text-sm text-foreground">{origem}</span>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </div>
              ))}
              {Object.keys(origens).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum lead cadastrado.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leads.slice(0, 5).map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0 cursor-pointer hover:bg-secondary/30 -mx-2 px-2 rounded transition-colors"
                  onClick={() => navigate(`/crm/bot/leads/${lead.id}`)}
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreBadge classification={lead.score_classification} score={lead.score} />
                  </div>
                </div>
              ))}
              {leads.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum lead cadastrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BotDashboard;
