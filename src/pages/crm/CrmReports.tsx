import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, TrendingUp, BarChart3, Target, Phone, Calendar, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { useBotLeads, useBotConfig } from "@/hooks/useBotData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FLOW_STAGES, SCORE_RULES } from "@/services/bot/types";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  AreaChart, Area,
} from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#06b6d4", "#ef4444", "#f97316", "#14b8a6", "#6366f1", "#a855f7"];
const SCORE_COLORS = { frio: "#3b82f6", morno: "#f59e0b", quente: "#ef4444" };
const STATUS_COLORS: Record<string, string> = {
  bot: "#3b82f6",
  aguardando_humano: "#f59e0b",
  em_atendimento: "#8b5cf6",
  atendido: "#22c55e",
  encerrado: "#6b7280",
};
const STATUS_LABELS: Record<string, string> = {
  bot: "Bot",
  aguardando_humano: "Aguardando",
  em_atendimento: "Em Atendimento",
  atendido: "Atendido",
  encerrado: "Encerrado",
};

function useVisits() {
  return useQuery({
    queryKey: ["reports-visits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bot_visits").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useHandoffs() {
  return useQuery({
    queryKey: ["reports-handoffs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bot_handoffs").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useScoreEvents() {
  return useQuery({
    queryKey: ["reports-score-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("score_events").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useMessages() {
  return useQuery({
    queryKey: ["reports-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bot_messages").select("id, direction, created_at");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function usePipelineStages() {
  return useQuery({
    queryKey: ["reports-pipeline"],
    queryFn: async () => {
      const { data, error } = await supabase.from("pipeline_stages").select("*").order("position");
      if (error) throw error;
      return data ?? [];
    },
  });
}

function useCrmLeads() {
  return useQuery({
    queryKey: ["reports-crm-leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*");
      if (error) throw error;
      return data ?? [];
    },
  });
}

const KpiCard = ({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string; value: string | number; subtitle: string;
  icon: React.ElementType; color: string; trend?: "up" | "down" | "neutral";
}) => (
  <Card className="bg-card border-border">
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend === "up" && <ArrowUpRight size={14} className="text-emerald-500" />}
          {trend === "down" && <ArrowDownRight size={14} className="text-red-500" />}
          {trend === "neutral" && <Minus size={14} className="text-muted-foreground" />}
        </div>
      )}
    </CardContent>
  </Card>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-medium text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const CrmReports = () => {
  const { data: botLeads = [], isLoading: loadingLeads } = useBotLeads();
  const { data: visits = [], isLoading: loadingVisits } = useVisits();
  const { data: handoffs = [], isLoading: loadingHandoffs } = useHandoffs();
  const { data: scoreEvents = [], isLoading: loadingEvents } = useScoreEvents();
  const { data: messages = [], isLoading: loadingMessages } = useMessages();
  const { data: stages = [] } = usePipelineStages();
  const { data: crmLeads = [] } = useCrmLeads();

  const isLoading = loadingLeads || loadingVisits || loadingHandoffs || loadingEvents || loadingMessages;

  // === KPIs ===
  const totalLeads = botLeads.length;
  const hotLeads = botLeads.filter((l) => l.score_classification === "quente").length;
  const warmLeads = botLeads.filter((l) => l.score_classification === "morno").length;
  const totalVisits = visits.length;
  const totalHandoffs = handoffs.length;
  const avgScore = totalLeads > 0 ? Math.round(botLeads.reduce((s, l) => s + l.score, 0) / totalLeads) : 0;

  // === Charts data ===

  // 1. Score classification pie
  const scorePieData = useMemo(() => [
    { name: "Frio", value: botLeads.filter((l) => l.score_classification === "frio").length },
    { name: "Morno", value: botLeads.filter((l) => l.score_classification === "morno").length },
    { name: "Quente", value: botLeads.filter((l) => l.score_classification === "quente").length },
  ].filter((d) => d.value > 0), [botLeads]);

  // 2. Attendance status pie
  const statusPieData = useMemo(() => {
    const counts: Record<string, number> = {};
    botLeads.forEach((l) => { counts[l.attendance_status] = (counts[l.attendance_status] || 0) + 1; });
    return Object.entries(counts).map(([key, value]) => ({
      name: STATUS_LABELS[key] || key,
      value,
      color: STATUS_COLORS[key] || "#6b7280",
    }));
  }, [botLeads]);

  // 3. Origin bar chart
  const originData = useMemo(() => {
    const counts: Record<string, number> = {};
    botLeads.forEach((l) => {
      const origin = l.origin || "Sem origem";
      counts[origin] = (counts[origin] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, total]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, total }));
  }, [botLeads]);

  // 4. Funnel: conversation state progression
  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    botLeads.forEach((l) => { counts[l.conversation_state] = (counts[l.conversation_state] || 0) + 1; });
    return FLOW_STAGES.map((stage) => ({
      name: stage.label,
      leads: counts[stage.key] || 0,
    }));
  }, [botLeads]);

  // 5. Leads over time (by created_at, grouped by day)
  const leadsOverTime = useMemo(() => {
    const byDay: Record<string, number> = {};
    botLeads.forEach((l) => {
      const day = l.created_at.slice(0, 10);
      byDay[day] = (byDay[day] || 0) + 1;
    });
    const sorted = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
    let cumulative = 0;
    return sorted.map(([date, count]) => {
      cumulative += count;
      return {
        date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        novos: count,
        total: cumulative,
      };
    });
  }, [botLeads]);

  // 6. Score events breakdown
  const scoreBreakdown = useMemo(() => {
    const counts: Record<string, { count: number; points: number }> = {};
    scoreEvents.forEach((e: any) => {
      if (!counts[e.event_type]) counts[e.event_type] = { count: 0, points: 0 };
      counts[e.event_type].count++;
      counts[e.event_type].points += e.points;
    });
    return SCORE_RULES.map((rule) => ({
      name: rule.label,
      ocorrencias: counts[rule.event]?.count || 0,
      pontos: counts[rule.event]?.points || 0,
    }));
  }, [scoreEvents]);

  // 7. Pipeline stages (CRM leads)
  const pipelineData = useMemo(() => {
    const counts: Record<string, number> = {};
    crmLeads.forEach((l: any) => { if (l.stage_id) counts[l.stage_id] = (counts[l.stage_id] || 0) + 1; });
    return stages.map((s: any) => ({
      name: s.name,
      leads: counts[s.id] || 0,
      color: s.color,
    }));
  }, [crmLeads, stages]);

  // 8. Messages per day
  const messagesOverTime = useMemo(() => {
    const byDay: Record<string, { inbound: number; outbound: number }> = {};
    messages.forEach((m: any) => {
      const day = m.created_at.slice(0, 10);
      if (!byDay[day]) byDay[day] = { inbound: 0, outbound: 0 };
      byDay[day][m.direction as "inbound" | "outbound"]++;
    });
    return Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        recebidas: data.inbound,
        enviadas: data.outbound,
      }));
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Relatórios</h1>
        <p className="text-muted-foreground font-body text-sm">Métricas e análises em tempo real do funil de vendas MBC</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Leads" value={totalLeads} subtitle="Cadastrados" icon={Users} color="bg-blue-500" />
        <KpiCard title="Quentes" value={hotLeads} subtitle={`${totalLeads > 0 ? Math.round(hotLeads / totalLeads * 100) : 0}% do total`} icon={TrendingUp} color="bg-red-500" />
        <KpiCard title="Mornos" value={warmLeads} subtitle={`${totalLeads > 0 ? Math.round(warmLeads / totalLeads * 100) : 0}% do total`} icon={Target} color="bg-amber-500" />
        <KpiCard title="Score Médio" value={avgScore} subtitle="pontos" icon={BarChart3} color="bg-violet-500" />
        <KpiCard title="Visitas" value={totalVisits} subtitle="Agendadas" icon={Calendar} color="bg-emerald-500" />
        <KpiCard title="Handoffs" value={totalHandoffs} subtitle="Transferências" icon={Phone} color="bg-cyan-500" />
      </div>

      {/* Row 1: Score classification + Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-base">Classificação de Score</CardTitle>
            <CardDescription>Distribuição dos leads por temperatura</CardDescription>
          </CardHeader>
          <CardContent>
            {scorePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={scorePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {scorePieData.map((entry) => (
                      <Cell key={entry.name} fill={SCORE_COLORS[entry.name.toLowerCase() as keyof typeof SCORE_COLORS] || "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-base">Status de Atendimento</CardTitle>
            <CardDescription>Leads por etapa de atendimento</CardDescription>
          </CardHeader>
          <CardContent>
            {statusPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {statusPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Leads over time */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-base">Evolução de Leads</CardTitle>
          <CardDescription>Novos leads por dia e total acumulado</CardDescription>
        </CardHeader>
        <CardContent>
          {leadsOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={leadsOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="total" name="Acumulado" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="novos" name="Novos" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-12 text-sm">Nenhum dado disponível</p>
          )}
        </CardContent>
      </Card>

      {/* Row 3: Origin + Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-base">Origem dos Leads</CardTitle>
            <CardDescription>Top 10 fontes de captação</CardDescription>
          </CardHeader>
          <CardContent>
            {originData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={originData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Leads" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-base">Pipeline de Vendas</CardTitle>
            <CardDescription>Leads por estágio do funil CRM</CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="leads" name="Leads" radius={[4, 4, 0, 0]}>
                    {pipelineData.map((entry, i) => (
                      <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Funnel */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display text-base">Funil de Conversão do Bot</CardTitle>
          <CardDescription>Leads por etapa do fluxo de conversa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {funnelData.map((stage, i) => {
              const maxLeads = Math.max(...funnelData.map((s) => s.leads), 1);
              const pct = (stage.leads / maxLeads) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-[120px] text-right shrink-0 truncate">{stage.name}</span>
                  <div className="flex-1 h-7 bg-secondary/50 rounded-md overflow-hidden relative">
                    <div
                      className="h-full rounded-md transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: COLORS[i % COLORS.length],
                        opacity: 0.8,
                      }}
                    />
                    {stage.leads > 0 && (
                      <span className="absolute inset-y-0 left-2 flex items-center text-xs font-bold text-white drop-shadow">
                        {stage.leads}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Row 5: Messages over time + Score events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-base">Mensagens por Dia</CardTitle>
            <CardDescription>Volume de mensagens enviadas e recebidas</CardDescription>
          </CardHeader>
          <CardContent>
            {messagesOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={messagesOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="recebidas" name="Recebidas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="enviadas" name="Enviadas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Nenhum dado de mensagens ainda</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-base">Eventos de Score</CardTitle>
            <CardDescription>Ocorrências por tipo de qualificação</CardDescription>
          </CardHeader>
          <CardContent>
            {scoreBreakdown.some((s) => s.ocorrencias > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scoreBreakdown} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="ocorrencias" name="Ocorrências" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-12 text-sm">Nenhum evento de score registrado</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CrmReports;
