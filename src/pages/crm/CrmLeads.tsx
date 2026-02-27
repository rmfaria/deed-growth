import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";

const CrmLeads = () => {
  const [leads, setLeads] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("leads")
        .select("*, pipeline_stages(name, color)")
        .order("created_at", { ascending: false });
      setLeads(data || []);
    };
    fetch();
  }, []);

  const filtered = leads.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    (l.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.phone || "").includes(search)
  );

  const tempLabels: Record<string, string> = { cold: "Frio", warm: "Morno", hot: "Quente" };
  const tempColors: Record<string, string> = {
    cold: "text-blue-400",
    warm: "text-amber-400",
    hot: "text-red-400",
  };

  const exportCSV = () => {
    const headers = ["Nome", "Email", "Telefone", "Temperatura", "Empreendimento", "Origem", "Estágio", "Criado em"];
    const rows = filtered.map((l) => [
      l.name,
      l.email || "",
      l.phone || "",
      tempLabels[l.temperature] || l.temperature,
      l.enterprise || "",
      l.source || "",
      l.pipeline_stages?.name || "",
      new Date(l.created_at).toLocaleDateString("pt-BR"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Leads</h1>
          <p className="text-muted-foreground font-body text-sm">{filtered.length} leads encontrados</p>
        </div>
        <Button variant="outline" onClick={exportCSV}>
          <Download size={16} /> Exportar CSV
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <Input
          placeholder="Buscar leads..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Temperatura</TableHead>
              <TableHead>Empreendimento</TableHead>
              <TableHead>Estágio</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Data</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    {lead.email && <div>{lead.email}</div>}
                    {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`font-medium text-sm ${tempColors[lead.temperature]}`}>
                    {tempLabels[lead.temperature] || lead.temperature}
                  </span>
                </TableCell>
                <TableCell>{lead.enterprise || "—"}</TableCell>
                <TableCell>
                  {lead.pipeline_stages ? (
                    <span className="inline-flex items-center gap-1.5 text-sm">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lead.pipeline_stages.color }} />
                      {lead.pipeline_stages.name}
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.source || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(lead.created_at).toLocaleDateString("pt-BR")}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum lead encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CrmLeads;
