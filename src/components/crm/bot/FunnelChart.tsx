import type { BotLead } from "@/services/bot/types";
import { FLOW_STAGES } from "@/services/bot/types";

interface Props {
  leads: BotLead[];
}

export function FunnelChart({ leads }: Props) {
  const stageCounts = FLOW_STAGES.map((stage) => ({
    ...stage,
    count: leads.filter((l) => l.conversation_state === stage.key).length,
  }));

  const maxCount = Math.max(...stageCounts.map((s) => s.count), 1);

  return (
    <div className="space-y-2">
      {stageCounts.map((stage, i) => {
        const pct = Math.max((stage.count / maxCount) * 100, 8);
        return (
          <div key={stage.key} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-32 truncate text-right">{stage.label}</span>
            <div className="flex-1 h-7 bg-secondary/50 rounded overflow-hidden relative">
              <div
                className="h-full rounded transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, hsl(210 80% 55% / ${0.3 + (i * 0.07)}), hsl(210 80% 45% / ${0.5 + (i * 0.05)}))`,
                }}
              />
              <span className="absolute inset-0 flex items-center px-3 text-xs font-medium text-foreground">
                {stage.count}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
