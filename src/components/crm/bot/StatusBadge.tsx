import { cn } from "@/lib/utils";
import type { AttendanceStatus } from "@/services/bot/types";

const config: Record<AttendanceStatus, { label: string; className: string }> = {
  bot: { label: 'Bot', className: 'bg-primary/15 text-primary border-primary/30' },
  aguardando_humano: { label: 'Aguardando Humano', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  em_atendimento: { label: 'Em Atendimento', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  atendido: { label: 'Atendido', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  encerrado: { label: 'Encerrado', className: 'bg-muted text-muted-foreground border-border' },
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  const c = config[status];
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", c.className)}>
      {c.label}
    </span>
  );
}
