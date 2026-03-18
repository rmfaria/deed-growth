import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Plus, FileText, Map, Video, Table2, BookOpen, ExternalLink, Pencil, Trash2, Loader2, Upload, CheckCircle2 } from "lucide-react";
import { useBotMaterials } from "@/hooks/useBotData";
import { useCreateMaterial, useUpdateMaterial, useDeleteMaterial } from "@/hooks/useBotActions";
import { toast } from "sonner";
import type { MaterialType, BotMaterial } from "@/services/bot/types";

const typeIcons: Record<MaterialType, React.ElementType> = {
  apresentacao: BookOpen, planta: FileText, mapa: Map, tabela: Table2, video: Video, pdf: FileText,
};

const typeLabels: Record<MaterialType, string> = {
  apresentacao: 'Apresentação', planta: 'Planta', mapa: 'Mapa', tabela: 'Tabela', video: 'Vídeo', pdf: 'PDF',
};

const BotMaterials = () => {
  const { data: materials = [], isLoading } = useBotMaterials();
  const createMutation = useCreateMaterial();
  const updateMutation = useUpdateMaterial();
  const deleteMutation = useDeleteMaterial();
  const activeCount = materials.filter(m => m.is_active).length;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BotMaterial | null>(null);
  const [deleting, setDeleting] = useState<BotMaterial | null>(null);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<string>("pdf");
  const [formUrl, setFormUrl] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormType("pdf");
    setFormUrl("");
    setFormCategory("");
    setUploadedFileName("");
    setUploadProgress(0);
    setShowForm(true);
  };

  const openEdit = (mat: BotMaterial) => {
    setEditing(mat);
    setFormName(mat.name);
    setFormType(mat.type);
    setFormUrl(mat.url || "");
    setFormCategory(mat.category || "");
    setUploadedFileName("");
    setUploadProgress(0);
    setShowForm(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Limite: 50MB.");
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "bin";

      setUploadProgress(30);

      // Upload via engine proxy (uses service_role key server-side)
      const res = await fetch(
        `https://prod.nesecurity.com.br/mbc/api/webhook/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        }
      );

      setUploadProgress(80);

      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "Upload failed");

      setFormUrl(result.url);
      setUploadedFileName(file.name);
      setUploadProgress(100);

      if (!formName.trim()) {
        setFormName(file.name.replace(/\.[^.]+$/, ""));
      }

      // Auto-detect type from extension
      const typeMap: Record<string, string> = {
        mp4: "video", mov: "video", avi: "video", webm: "video",
        pdf: "pdf",
        jpg: "mapa", jpeg: "mapa", png: "mapa", webp: "mapa",
        xls: "tabela", xlsx: "tabela", csv: "tabela",
      };
      if (typeMap[ext]) setFormType(typeMap[ext]);

      toast.success("Arquivo enviado com sucesso!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro no upload: ${err.message || "falha desconhecida"}`);
      setUploadProgress(0);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (editing) {
      updateMutation.mutate({ id: editing.id, name: formName, type: formType, url: formUrl || undefined, category: formCategory || undefined });
    } else {
      createMutation.mutate({ name: formName, type: formType, url: formUrl || undefined, category: formCategory || undefined });
    }
    setShowForm(false);
  };

  const handleDelete = () => {
    if (deleting) {
      deleteMutation.mutate(deleting.id);
      setDeleting(null);
    }
  };

  const handleToggleActive = (mat: BotMaterial) => {
    updateMutation.mutate({ id: mat.id, is_active: !mat.is_active });
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
          <h1 className="font-display text-2xl font-bold text-foreground">Materiais</h1>
          <p className="text-muted-foreground font-body text-sm">{materials.length} materiais cadastrados • {activeCount} ativos</p>
        </div>
        <Button className="gap-2" onClick={openCreate}><Plus size={16} /> Novo Material</Button>
      </div>

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
              const Icon = typeIcons[mat.type as MaterialType] || FileText;
              return (
                <TableRow key={mat.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon size={16} className="text-muted-foreground" />
                      <span className="font-medium">{mat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{typeLabels[mat.type as MaterialType] || mat.type}</TableCell>
                  <TableCell className="text-sm capitalize">{mat.category || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={mat.is_active ? "default" : "secondary"}
                      className={`cursor-pointer ${mat.is_active ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : ''}`}
                      onClick={() => handleToggleActive(mat)}
                    >
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
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(mat)}><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleting(mat)}><Trash2 size={14} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {materials.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum material cadastrado.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar Material" : "Novo Material"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nome</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Apresentação MBC" className="mt-1.5" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(typeLabels) as MaterialType[]).map((t) => (
                    <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Arquivo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,image/*,application/pdf,.xls,.xlsx,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 flex-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? "Enviando..." : "Upload de Arquivo"}
                </Button>
              </div>
              {uploading && <Progress value={uploadProgress} className="h-2" />}
              {uploadedFileName && !uploading && (
                <div className="flex items-center gap-2 text-xs text-emerald-600">
                  <CheckCircle2 size={14} />
                  <span>{uploadedFileName}</span>
                </div>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Ou cole a URL diretamente</Label>
                <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://..." className="mt-1" />
              </div>
              <p className="text-xs text-muted-foreground">Formatos: PDF, imagens, vídeos (MP4). Limite: 50MB.</p>
            </div>
            <div>
              <Label>Categoria</Label>
              <Input value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="Ex: institucional, técnico, comercial" className="mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!formName.trim() || createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              {editing ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover material?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{deleting?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BotMaterials;
