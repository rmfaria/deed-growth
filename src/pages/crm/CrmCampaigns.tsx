import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Send, Mail, Eye, MousePointerClick, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const CrmCampaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", subject: "", html_content: "" });
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCampaigns(data || []));
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.subject.trim()) return;
    const { error } = await supabase.from("campaigns").insert({
      name: form.name.trim(),
      subject: form.subject.trim(),
      html_content: form.html_content,
      created_by: user?.id,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Campanha criada!" });
      setForm({ name: "", subject: "", html_content: "" });
      setShowNew(false);
      const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      setCampaigns(data || []);
    }
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
    scheduled: { label: "Agendada", color: "bg-blue-500/20 text-blue-400" },
    sending: { label: "Enviando", color: "bg-amber-500/20 text-amber-400" },
    sent: { label: "Enviada", color: "bg-emerald-500/20 text-emerald-400" },
    cancelled: { label: "Cancelada", color: "bg-red-500/20 text-red-400" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Campanhas</h1>
          <p className="text-muted-foreground font-body text-sm">Email marketing com rastreamento</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button><Plus size={18} /> Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Nova Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da campanha</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Lançamento Reserva Premium" />
              </div>
              <div className="space-y-2">
                <Label>Assunto do email</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex: Últimas unidades disponíveis!" />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo HTML</Label>
                <Textarea
                  value={form.html_content}
                  onChange={(e) => setForm({ ...form, html_content: e.target.value })}
                  placeholder="<h1>Olá {{nome}}...</h1>"
                  rows={8}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Campanha</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {campaigns.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="py-12 text-center">
              <Mail className="mx-auto mb-4 text-muted-foreground" size={40} />
              <p className="text-muted-foreground">Nenhuma campanha criada ainda.</p>
            </CardContent>
          </Card>
        )}

        {campaigns.map((c) => {
          const st = statusLabels[c.status] || statusLabels.draft;
          return (
            <Card key={c.id} className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-foreground">{c.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{c.subject}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Send size={14} /> {c.sent_count} enviados
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye size={14} /> {c.open_count} abertos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MousePointerClick size={14} /> {c.click_count} cliques
                  </span>
                  <span className="flex items-center gap-1.5 ml-auto">
                    <Clock size={14} /> {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CrmCampaigns;
