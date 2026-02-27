import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Phone, Mail, Thermometer, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Stage {
  id: string;
  name: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  stage_id: string | null;
  temperature: string;
  enterprise: string | null;
  unit_interest: string | null;
  source: string | null;
  score: number;
  created_at: string;
}

const CrmPipeline = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", enterprise: "", source: "", temperature: "cold" as string, stage_id: "" });
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    const [stagesRes, leadsRes] = await Promise.all([
      supabase.from("pipeline_stages").select("*").order("position"),
      supabase.from("leads").select("*").order("created_at", { ascending: false }),
    ]);
    if (stagesRes.data) setStages(stagesRes.data);
    if (leadsRes.data) setLeads(leadsRes.data);
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("leads-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (stageId: string) => {
    if (!draggedLead) return;

    const { error } = await supabase
      .from("leads")
      .update({ stage_id: stageId })
      .eq("id", draggedLead);

    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === draggedLead ? { ...l, stage_id: stageId } : l))
      );

      // Log activity
      const lead = leads.find((l) => l.id === draggedLead);
      const stage = stages.find((s) => s.id === stageId);
      if (lead && stage) {
        await supabase.from("lead_activities").insert({
          lead_id: draggedLead,
          type: "stage_change",
          title: `Movido para ${stage.name}`,
          description: `Lead ${lead.name} movido para o estágio ${stage.name}`,
        });
      }
    }
    setDraggedLead(null);
  };

  const handleAddLead = async () => {
    if (!newLead.name.trim()) return;

    const stageId = newLead.stage_id || stages[0]?.id;
    const { error } = await supabase.from("leads").insert({
      name: newLead.name.trim(),
      email: newLead.email.trim() || null,
      phone: newLead.phone.trim() || null,
      enterprise: newLead.enterprise.trim() || null,
      source: newLead.source.trim() || null,
      temperature: newLead.temperature as "cold" | "warm" | "hot",
      stage_id: stageId,
    });

    if (error) {
      toast({ title: "Erro ao adicionar lead", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lead adicionado!" });
      setNewLead({ name: "", email: "", phone: "", enterprise: "", source: "", temperature: "cold", stage_id: "" });
      setShowAddLead(false);
      fetchData();
    }
  };

  const getLeadsForStage = (stageId: string) => leads.filter((l) => l.stage_id === stageId);

  const tempColors: Record<string, string> = {
    cold: "border-l-blue-500",
    warm: "border-l-amber-500",
    hot: "border-l-red-500",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Funil de Vendas</h1>
          <p className="text-muted-foreground font-body text-sm">Arraste os leads entre os estágios</p>
        </div>
        <Dialog open={showAddLead} onOpenChange={setShowAddLead}>
          <DialogTrigger asChild>
            <Button><Plus size={18} /> Novo Lead</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">Adicionar Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} placeholder="Nome completo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} placeholder="email@exemplo.com" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Empreendimento</Label>
                  <Input value={newLead.enterprise} onChange={(e) => setNewLead({ ...newLead, enterprise: e.target.value })} placeholder="Nome do empreendimento" />
                </div>
                <div className="space-y-2">
                  <Label>Origem</Label>
                  <Input value={newLead.source} onChange={(e) => setNewLead({ ...newLead, source: e.target.value })} placeholder="Facebook, Google, etc." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temperatura</Label>
                  <Select value={newLead.temperature} onValueChange={(v) => setNewLead({ ...newLead, temperature: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cold">🧊 Frio</SelectItem>
                      <SelectItem value="warm">🌡️ Morno</SelectItem>
                      <SelectItem value="hot">🔥 Quente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estágio</Label>
                  <Select value={newLead.stage_id} onValueChange={(v) => setNewLead({ ...newLead, stage_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {stages.filter((s) => !s.is_lost).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleAddLead} className="w-full">Adicionar Lead</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageLeads = getLeadsForStage(stage.id);
          return (
            <div
              key={stage.id}
              className="min-w-[280px] max-w-[320px] flex-shrink-0"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(stage.id)}
            >
              <div className="rounded-xl bg-secondary/50 border border-border p-3">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-display font-semibold text-sm text-foreground">{stage.name}</h3>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[100px]">
                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => handleDragStart(lead.id)}
                      className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors border-l-4 ${tempColors[lead.temperature] || ""}`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-sm text-foreground">{lead.name}</p>
                        <GripVertical size={14} className="text-muted-foreground shrink-0" />
                      </div>
                      {lead.enterprise && (
                        <p className="text-xs text-primary mb-1">{lead.enterprise}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} /> {lead.phone}
                          </span>
                        )}
                        {lead.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={10} /> {lead.email.split("@")[0]}...
                          </span>
                        )}
                      </div>
                      {lead.source && (
                        <span className="mt-2 inline-block text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {lead.source}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CrmPipeline;
