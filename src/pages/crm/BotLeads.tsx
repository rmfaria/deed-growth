import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Download, Eye, UserCheck, Send, Calendar } from "lucide-react";
import { mockLeads } from "@/services/bot/mockData";
import { ScoreBadge } from "@/components/crm/bot/ScoreBadge";
import { StatusBadge } from "@/components/crm/bot/StatusBadge";
import { useNavigate } from "react-router-dom";

const BotLeads = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");

  const filtered = mockLeads.filter((l) => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      (l.origin || '').toLowerCase().includes(search.toLowerCase());
    const matchScore = scoreFilter === 'all' || l.score_classification === scoreFilter;
    const matchStatus = statusFilter === 'all' || l.attendance_status === statusFilter;
    const matchProfile = profileFilter === 'all' || l.profile_type === profileFilter;
    return matchSearch && matchScore && matchStatus && matchProfile;
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Leads MBC</h1>
          <p className="text-muted-foreground font-body text-sm">{filtered.length} leads encontrados</p>
        </div>
        <Button variant="outline" onClick={exportCSV} className="gap-2">
          <Download size={16} /> Exportar CSV
        </Button>
      </div>

      {/* Filters */}
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

      {/* Table */}
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Ver detalhes" onClick={() => navigate(`/crm/bot/leads/${lead.id}`)}>
                      <Eye size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Enviar material">
                      <Send size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Agendar visita">
                      <Calendar size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Transferir para humano">
                      <UserCheck size={14} />
                    </Button>
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
    </div>
  );
};

export default BotLeads;
