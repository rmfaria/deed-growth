import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FLOW_STAGES } from "@/services/bot/types";
import { ArrowDown, MessageSquare, UserCheck, Send, Calendar, HelpCircle } from "lucide-react";

const stageDetails: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; messages: string[]; variables?: string[]; actions?: string[] }> = {
  START: { icon: MessageSquare, messages: ['Lead entra no sistema via WhatsApp'] },
  ABERTURA: {
    icon: MessageSquare,
    messages: [
      '"Olá, vi que você solicitou informações sobre os lotes do Metropolitan Business Center. Sou o Rogério, responsável pelo projeto. Posso te explicar rapidamente como funciona essa oportunidade."',
    ],
  },
  CONTEXTUALIZACAO: {
    icon: MessageSquare,
    messages: [
      '"O MBC é um condomínio empresarial às margens da MG-10, próximo ao Aeroporto de Confins. Os lotes começam a partir de 1.000 m² e a região está em forte expansão logística."',
    ],
  },
  QUALIFICACAO_PRINCIPAL: {
    icon: HelpCircle,
    messages: ['"Você está avaliando para instalar sua empresa ou pensando como investimento?"'],
    variables: ['perfil_lead: empresa | investimento | indefinido'],
  },
  QUALIFICACAO_SECUNDARIA: {
    icon: HelpCircle,
    messages: [
      'Se empresa: perguntar tipo de operação e metragem',
      'Se investimento: perguntar se busca valorização ou construção para renda',
    ],
    variables: ['objetivo_lead', 'metragem_desejada', 'interesse_construcao'],
  },
  APRESENTACAO_EMPREENDIMENTO: {
    icon: MessageSquare,
    messages: [
      'Localização: margens da MG-10, 3km do Aeroporto de Confins',
      'Infraestrutura: ruas de 10m, asfalto para carretas, rotatórias',
      'Segurança: portaria + ronda 24h',
      'Serviços: Cemig, Copasa, internet',
    ],
  },
  CONDICOES_COMERCIAIS: {
    icon: MessageSquare,
    messages: [
      'Preço base: R$ 530.000',
      'Entrada: 20%',
      'Saldo: até 24 parcelas',
      'Correção: Price – 0,99% a.m.',
      'Condomínio: ~R$ 500/mês',
    ],
  },
  CONVERSAO: {
    icon: Send,
    messages: [
      '"Posso te enviar o material?"',
      '"Posso te enviar a planta?"',
      '"Faz sentido agendarmos uma visita?"',
    ],
    actions: ['Enviar material', 'Enviar planta', 'Sugerir visita', 'Sugerir consultor humano'],
  },
  AGENDAMENTO_VISITA: {
    icon: Calendar,
    messages: ['Coleta de data/horário preferencial para visita'],
    actions: ['Registrar solicitação de visita', 'Gerar handoff'],
  },
  TRANSFERENCIA_HUMANA: {
    icon: UserCheck,
    messages: ['"Vou te conectar com um consultor que vai cuidar de tudo para você."'],
    actions: ['Transferir atendimento', 'Notificar consultor'],
  },
  ENCERRADO: {
    icon: MessageSquare,
    messages: ['Conversa finalizada'],
  },
};

const BotFlow = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Fluxo Conversacional</h1>
        <p className="text-muted-foreground font-body text-sm">Etapas do bot de pré-vendas MBC</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-1">
        {FLOW_STAGES.map((stage, i) => {
          const detail = stageDetails[stage.key];
          const Icon = detail?.icon || MessageSquare;
          return (
            <div key={stage.key}>
              <Card className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">Etapa {i + 1}</span>
                        <h3 className="font-display font-semibold text-foreground">{stage.label}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">{stage.description}</p>

                      {detail?.messages.map((msg, j) => (
                        <div key={j} className="bg-secondary/50 rounded-lg px-3 py-2 mb-1.5 text-sm text-secondary-foreground">
                          {msg}
                        </div>
                      ))}

                      {detail?.variables && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-muted-foreground">Variáveis capturadas:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {detail.variables.map((v) => (
                              <span key={v} className="inline-flex px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono">{v}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {detail?.actions && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-muted-foreground">Ações:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {detail.actions.map((a) => (
                              <span key={a} className="inline-flex px-2 py-0.5 rounded bg-accent/10 text-accent text-xs">{a}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {i < FLOW_STAGES.length - 1 && (
                <div className="flex justify-center py-0.5">
                  <ArrowDown size={16} className="text-muted-foreground/40" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Handoff Triggers */}
      <Card className="bg-card border-border max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="font-display text-base text-amber-400">Gatilhos de Transferência para Humano</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Pedido de proposta personalizada',
              'Pedido de visita',
              'Negociação específica',
              'Uso de veículo na entrada',
              'Pedido de desconto',
              'Condição diferenciada',
              'Lead muito interessado',
              'Score alto (51+)',
            ].map((trigger) => (
              <div key={trigger} className="flex items-center gap-2 text-sm text-foreground bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
                <UserCheck size={14} className="text-amber-400 shrink-0" />
                {trigger}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BotFlow;
