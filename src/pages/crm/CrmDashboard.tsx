import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, TrendingUp, Mail, Target } from "lucide-react";

interface DashboardStats {
  totalLeads: number;
  hotLeads: number;
  campaignsSent: number;
  conversionRate: number;
}

const CrmDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    hotLeads: 0,
    campaignsSent: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [leadsRes, hotRes, campaignsRes, wonRes] = await Promise.all([
        supabase.from("leads").select("id", { count: "exact", head: true }),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("temperature", "hot"),
        supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("leads").select("id, pipeline_stages!inner(is_won)").eq("pipeline_stages.is_won", true),
      ]);

      const total = leadsRes.count || 0;
      const won = wonRes.data?.length || 0;

      setStats({
        totalLeads: total,
        hotLeads: hotRes.count || 0,
        campaignsSent: campaignsRes.count || 0,
        conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total de Leads", value: stats.totalLeads, icon: Users, color: "text-blue-400" },
    { title: "Leads Quentes", value: stats.hotLeads, icon: Target, color: "text-orange-400" },
    { title: "Campanhas Enviadas", value: stats.campaignsSent, icon: Mail, color: "text-primary" },
    { title: "Taxa de Conversão", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-emerald-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground font-body text-sm">Visão geral do seu CRM imobiliário</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-body font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-display font-bold text-foreground">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Leads Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentLeads />
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-display text-lg">Atividades Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentActivities />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

function RecentLeads() {
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("leads")
      .select("id, name, email, phone, temperature, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setLeads(data || []));
  }, []);

  if (leads.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhum lead ainda. Comece adicionando leads ao funil!</p>;
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div>
            <p className="font-medium text-foreground text-sm">{lead.name}</p>
            <p className="text-muted-foreground text-xs">{lead.email || lead.phone}</p>
          </div>
          <TemperatureBadge temp={lead.temperature} />
        </div>
      ))}
    </div>
  );
}

function RecentActivities() {
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("lead_activities")
      .select("id, title, type, created_at, leads(name)")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => setActivities(data || []));
  }, []);

  if (activities.length === 0) {
    return <p className="text-muted-foreground text-sm">Nenhuma atividade registrada ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((act) => (
        <div key={act.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div>
            <p className="font-medium text-foreground text-sm">{act.title}</p>
            <p className="text-muted-foreground text-xs">{(act.leads as any)?.name}</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(act.created_at).toLocaleDateString("pt-BR")}
          </span>
        </div>
      ))}
    </div>
  );
}

function TemperatureBadge({ temp }: { temp: string }) {
  const colors: Record<string, string> = {
    cold: "bg-blue-500/20 text-blue-400",
    warm: "bg-amber-500/20 text-amber-400",
    hot: "bg-red-500/20 text-red-400",
  };
  const labels: Record<string, string> = { cold: "Frio", warm: "Morno", hot: "Quente" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[temp] || ""}`}>
      {labels[temp] || temp}
    </span>
  );
}

export default CrmDashboard;
