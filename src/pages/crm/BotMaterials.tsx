import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Map, Image, Video, Table2, BookOpen, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { mockMaterials } from "@/services/bot/mockData";
import type { MaterialType } from "@/services/bot/types";

const typeIcons: Record<MaterialType, React.ComponentType<{ size?: number; className?: string }>> = {
  apresentacao: BookOpen,
  planta: FileText,
  mapa: Map,
  tabela: Table2,
  video: Video,
  pdf: FileText,
};

const typeLabels: Record<MaterialType, string> = {
  apresentacao: 'Apresentação',
  planta: 'Planta',
  mapa: 'Mapa',
  tabela: 'Tabela',
  video: 'Vídeo',
  pdf: 'PDF',
};

const BotMaterials = () => {
  const [materials] = useState(mockMaterials);

  const activeCount = materials.filter(m => m.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Materiais</h1>
          <p className="text-muted-foreground font-body text-sm">{materials.length} materiais cadastrados • {activeCount} ativos</p>
        </div>
        <Button className="gap-2">
          <Plus size={16} /> Novo Material
        </Button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(typeLabels) as MaterialType[]).map((type) => {
          const Icon = typeIcons[type];
          const count = materials.filter(m => m.type === type).length;
          return (
            <Card key={type} className="bg-card border-border">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Icon size={20} className="text-primary mb-2" />
                <span className="text-lg font-bold text-foreground">{count}</span>
                <span className="text-xs text-muted-foreground">{typeLabels[type]}</span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((mat) => {
              const Icon = typeIcons[mat.type];
              return (
                <TableRow key={mat.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-muted-foreground" />
                      <span className="font-medium">{mat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{typeLabels[mat.type]}</TableCell>
                  <TableCell className="text-sm capitalize">{mat.category || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={mat.is_active ? "default" : "secondary"} className={mat.is_active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : ''}>
                      {mat.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(mat.updated_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {mat.url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => window.open(mat.url!, '_blank')}>
                          <ExternalLink size={14} />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8"><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 size={14} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default BotMaterials;
