import { cn } from "@/lib/utils";
import type { BotMessage } from "@/services/bot/types";
import { Bot, User } from "lucide-react";

interface Props {
  messages: BotMessage[];
}

export function ConversationTimeline({ messages }: Props) {
  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
      {messages.map((msg) => {
        const isBot = msg.direction === 'outbound';
        return (
          <div key={msg.id} className={cn("flex gap-2.5", isBot ? "justify-start" : "justify-end")}>
            {isBot && (
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                <Bot size={14} className="text-primary" />
              </div>
            )}
            <div className={cn(
              "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              isBot
                ? "bg-secondary text-secondary-foreground rounded-tl-md"
                : "bg-primary/15 text-foreground rounded-tr-md"
            )}>
              <p>{msg.content}</p>
              <span className="text-[10px] text-muted-foreground mt-1 block">
                {new Date(msg.created_at).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {!isBot && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                <User size={14} className="text-muted-foreground" />
              </div>
            )}
          </div>
        );
      })}
      {messages.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-8">Nenhuma mensagem registrada.</p>
      )}
    </div>
  );
}
