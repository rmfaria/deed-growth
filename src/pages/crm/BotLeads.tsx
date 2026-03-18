import { useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Download, Upload, Eye, UserCheck, Send, Calendar, Loader2, Trash2, RotateCcw } from "lucide-react";
import { ScoreBadge } from "@/components/crm/bot/ScoreBadge";
import { StatusBadge } from "@/components/crm/bot/StatusBadge";
import { useNavigate } from "react-router-dom";
import { useBotLeads } from "@/hooks/useBotData";
import { useHandoffLead, useScheduleVisit, useSendMaterial } from "@/hooks/useBotActions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, "");
  if (digits.length < 10 || digits.length > 13) return null;
  if (/^(\d)\1+$/.test(digits)) return null; // all same digit (e.g. 88888888888)
  const phone = digits.startsWith("55") ? digits : `55${digits}`;
  return phone;
}

function parseCSV(text: string): { name: string; email: string; phone: string }[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  return lines.slice(1).map((line) => {
    const parts = line.split(",").map((s) => s.trim());
    return { name: parts[0] || "", email: parts[1] || "", phone: parts[2] || "" };
  });
}

const BotLeads = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: allLeads = [], isLoading } = useBotLeads();
  const handoffMutation = useHandoffLead();
  const visitMutation = useScheduleVisit();
  const materialMutation = useSendMaterial();
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [importing, setImporting] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [deletingLead, setDeletingLead] = useState<{ id: string; name: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      // filter test/invalid rows and normalize phones
      const existingPhones = new Set(allLeads.map((l) => l.phone));
      const seen = new Set<string>();
      const valid: { name: string; phone: string }[] = [];

      for (const row of rows) {
        if (row.name.includes("<test lead") || row.phone.includes("<test lead")) continue;
        const phone = normalizePhone(row.phone);
        if (!phone) continue;
        if (existingPhones.has(phone) || seen.has(phone)) continue;
        seen.add(phone);
        valid.push({ name: row.name, phone });
      }

      if (valid.length === 0) {
        toast.info("Nenhum lead novo para importar.");
        return;
      }

      // insert in batches of 50
      let inserted = 0;
      for (let i = 0; i < valid.length; i += 50) {
        const batch = valid.slice(i, i + 50).map((v) => ({
          name: v.name,
          phone: v.phone,
          origin: "planilha-mbc",
          profile_type: "indefinido" as const,
          score: 0,
          score_classification: "frio" as const,
          attendance_status: "bot" as const,
          conversation_state: "START" as const,
          construction_interest: false,
          visit_interest: false,
          human_handoff: false,
        }));
        const { error } = await supabase.from("bot_leads").insert(batch);
        if (error) throw error;
        inserted += batch.length;
      }

      toast.success(`${inserted} leads importados com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["bot-leads"] });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao importar leads.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const trashLeads = allLeads.filter((l) => l.attendance_status === "encerrado");
  const activeLeads = allLeads.filter((l) => l.attendance_status !== "encerrado");

  const filtered = (showTrash ? trashLeads : activeLeads).filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.origin || '').toLowerCase().includes(search.toLowerCase());
    const matchScore = scoreFilter === 'all' || l.score_classification === scoreFilter;
    const matchStatus = statusFilter === 'all' || l.attendance_status === statusFilter;
    const matchProfile = profileFilter === 'all' || l.profile_type === profileFilter;
    return matchSearch && matchScore && matchStatus && matchProfile;
  });

  const handleMoveToTrash = async (leadId: string) => {
    await supabase.from("bot_leads").update({ attendance_status: "encerrado" }).eq("id", leadId);
    queryClient.invalidateQueries({ queryKey: ["bot-leads"] });
    toast.success("Lead movido para a lixeira.");
    setDeletingLead(null);
  };

  const handleRestore = async (leadId: string) => {
    await supabase.from("bot_leads").update({ attendance_status: "bot" }).eq("id", leadId);
    queryClient.invalidateQueries({ queryKey: ["bot-leads"] });
    toast.success("Lead restaurado.");
  };

  const handleDeletePermanent = async (leadId: string) => {
    await supabase.from("bot_leads").delete().eq("id", leadId);
    queryClient.invalidateQueries({ queryKey: ["bot-leads"] });
    toast.success("Lead removido permanentemente.");
    setDeletingLead(null);
  };

  const exportCSV = () => {
    const headers = ["Nome", "Telefone", "Origem", "Perfil", "Objetivo", "Metragem", "Score", "Classificação", "Status", "Estado Conversa"];
    const rows = filtered.map((l) => [
      l.name, l.phone, l.origin || '', l.profile_type || '', l.objective || '',
      l.desired_area || '', l.score, l.score_classification, l.attendance_status, l.conversation_state
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mbc-leads.csv";
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {showTrash ? "Lixeira" : "Leads MBC"}
          </h1>
          <p className="text-muted-foreground font-body text-sm">
            {filtered.length} leads {showTrash ? "na lixeira" : "encontrados"}
            {!showTrash && trashLeads.length > 0 && ` • ${trashLeads.length} na lixeira`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showTrash ? "default" : "outline"}
            onClick={() => setShowTrash(!showTrash)}
            className="gap-2"
          >
            <Trash2 size={16} />
            {showTrash ? "Ver Ativos" : `Lixeira${trashLeads.length > 0 ? ` (${trashLeads.length})` : ""}`}
          </Button>
          {!showTrash && (
            <>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing} className="gap-2">
                {importing ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                {importing ? "Importando..." : "Importar CSV"}
              </Button>
              <Button variant="outline" onClick={exportCSV} className="gap-2">
                <Download size={16} /> Exportar CSV
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input placeholder="Buscar por nome, telefone, origem..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Score" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="frio">Frio</SelectItem>
            <SelectItem value="morno">Morno</SelectItem>
            <SelectItem value="quente">Quente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="bot">Bot</SelectItem>
            <SelectItem value="aguardando_humano">Aguardando</SelectItem>
            <SelectItem value="em_atendimento">Em Atendimento</SelectItem>
            <SelectItem value="atendido">Atendido</SelectItem>
            <SelectItem value="encerrado">Encerrado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={profileFilter} onValueChange={setProfileFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Perfil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="empresa">Empresa</SelectItem>
            <SelectItem value="investimento">Investimento</SelectItem>
            <SelectItem value="indefinido">Indefinido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Última Interação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lead) => (
              <TableRow key={lead.id} className="cursor-pointer hover:bg-secondary/30" onClick={() => navigate(`/crm/bot/leads/${lead.id}`)}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{lead.phone}</TableCell>
                <TableCell className="text-sm">{lead.origin || '—'}</TableCell>
                <TableCell className="text-sm capitalize">{lead.profile_type || '—'}</TableCell>
                <TableCell><ScoreBadge classification={lead.score_classification} score={lead.score} /></TableCell>
                <TableCell><StatusBadge status={lead.attendance_status} /></TableCell>
                <TableCell className="text-xs text-muted-foreground">{lead.conversation_state.replace(/_/g, ' ')}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {lead.last_message_at ? new Date(lead.last_message_at).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-1">
                    {showTrash ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Restaurar lead"
                          onClick={() => handleRestore(lead.id)}>
                          <RotateCcw size={14} className="text-emerald-500" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Excluir permanentemente"
                          onClick={() => setDeletingLead({ id: lead.id, name: lead.name })}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalhes" onClick={() => navigate(`/crm/bot/leads/${lead.id}`)}>
                          <Eye size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Enviar material"
                          onClick={() => materialMutation.mutate({ leadId: lead.id, materialNames: ["Material MBC"] })}>
                          <Send size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Agendar visita"
                          onClick={() => visitMutation.mutate({ leadId: lead.id, notes: "Agendamento rápido via lista" })}>
                          <Calendar size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Transferir para humano"
                          onClick={() => handoffMutation.mutate({ leadId: lead.id, reason: "Transferência manual via lista" })}>
                          <UserCheck size={14} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Mover para lixeira"
                          onClick={() => setDeletingLead({ id: lead.id, name: lead.name })}>
                          <Trash2 size={14} className="text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum lead encontrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete/Trash Confirmation */}
      <AlertDialog open={!!deletingLead} onOpenChange={(open) => !open && setDeletingLead(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {showTrash ? "Excluir permanentemente?" : "Mover para lixeira?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {showTrash
                ? `"${deletingLead?.name}" será removido permanentemente. Esta ação não pode ser desfeita.`
                : `"${deletingLead?.name}" será movido para a lixeira. Você pode restaurá-lo depois.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={showTrash ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={() => {
                if (!deletingLead) return;
                if (showTrash) {
                  handleDeletePermanent(deletingLead.id);
                } else {
                  handleMoveToTrash(deletingLead.id);
                }
              }}
            >
              {showTrash ? "Excluir" : "Mover para lixeira"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BotLeads;
