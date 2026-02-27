import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Users, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const CrmSettings = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground font-body text-sm">Configurações gerais do CRM</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Settings className="text-primary" size={20} />
            Minha Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Nome completo</Label>
            <Input placeholder="Seu nome" defaultValue={user?.user_metadata?.full_name || ""} />
          </div>
          <Button>Salvar Perfil</Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Building className="text-primary" size={20} />
            Empreendimentos
          </CardTitle>
          <CardDescription>Cadastre os empreendimentos para associar aos leads</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Nome do empreendimento" />
            <Button>Adicionar</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <Users className="text-primary" size={20} />
            Equipe
          </CardTitle>
          <CardDescription>Gerencie os usuários do CRM</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Para adicionar novos usuários, cadastre-os e atribua uma role (admin, manager, agent).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CrmSettings;
