import { cn } from "@/lib/utils";
import type { ScoreClassification } from "@/services/bot/types";

const config: Record<ScoreClassification, { label: string; className: string }> = {
  frio: { label: 'Frio', className: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
  morno: { label: 'Morno', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  quente: { label: 'Quente', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export function ScoreBadge({ classification, score }: { classification: ScoreClassification; score?: number }) {
  const c = config[classification];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", c.className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", {
        "bg-sky-400": classification === 'frio',
        "bg-amber-400": classification === 'morno',
        "bg-red-400": classification === 'quente',
      })} />
      {c.label}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}
