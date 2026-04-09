export interface StatusComercial {
  label: string;
  value: string;
  color: string;
  colorSecondary: string;
}

export const STATUS_COMERCIAL: StatusComercial[] = [
  { label: 'Novo',               value: 'novo',               color: '#546e7a', colorSecondary: '#eceff1' },
  { label: 'Tentando contato',   value: 'tentando_contato',   color: '#e53935', colorSecondary: '#ffcdd2' },
  { label: 'Contatado',          value: 'contatado',          color: '#fb8c00', colorSecondary: '#ffe0b2' },
  { label: 'Aguardando retorno', value: 'aguardando_retorno', color: '#0288d1', colorSecondary: '#b3e5fc' },
  { label: 'Reunião agendada',   value: 'reuniao_agendada',   color: '#1e88e5', colorSecondary: '#bbdefb' },
  { label: 'Reunião realizada',  value: 'reuniao_realizada',  color: '#00897b', colorSecondary: '#b2dfdb' },
  { label: 'Proposta enviada',   value: 'proposta_enviada',   color: '#8e24aa', colorSecondary: '#e1bee7' },
  { label: 'Em negociação',      value: 'em_negociacao',      color: '#f57c00', colorSecondary: '#ffe0b2' },
  { label: 'Fechado',            value: 'fechado',            color: '#43a047', colorSecondary: '#c8e6c9' },
  { label: 'Perdido',            value: 'perdido',            color: '#757575', colorSecondary: '#eeeeee' },
];

export function getStatusColor(value: string): string {
  return STATUS_COMERCIAL.find(s => s.value === value)?.color || '#999';
}

export function getStatusLabel(value: string): string {
  return STATUS_COMERCIAL.find(s => s.value === value)?.label || value;
}

// ─── Fase atingida ───────────────────────────────────────────────────────────
// Hierarquia das fases do funil (só avança, nunca retrocede)
const FASE_HIERARQUIA: Record<string, number> = {
  contatado: 1,
  reuniao:   2,
  proposta:  3,
  negociacao: 4,
  fechado:   5,
};

const STATUS_PARA_FASE: Record<string, string> = {
  contatado:        'contatado',
  aguardando_retorno: '',        // ambíguo — não avança fase por si só
  reuniao_agendada: 'reuniao',
  reuniao_realizada: 'reuniao',
  proposta_enviada: 'proposta',
  em_negociacao:    'negociacao',
  fechado:          'fechado',
};

/** Retorna a nova faseAtingida se o status avança o funil; null se não avança. */
export function calcularFaseAtingida(novoStatus: string, faseAtual: string | null | undefined): string | null {
  const novaFase = STATUS_PARA_FASE[novoStatus];
  if (!novaFase) return null;
  const nivelAtual = FASE_HIERARQUIA[faseAtual || ''] ?? 0;
  const nivelNovo  = FASE_HIERARQUIA[novaFase] ?? 0;
  return nivelNovo > nivelAtual ? novaFase : null;
}

/** Infere a fase a partir do status atual (fallback para dados sem faseAtingida). */
export function inferirFasePorStatus(status: string): string {
  return STATUS_PARA_FASE[status] || '';
}

// ─── Motivos de perda ────────────────────────────────────────────────────────
export interface MotivoPerdido {
  label: string;
  value: string;
}

export const MOTIVOS_PERDIDO: MotivoPerdido[] = [
  { label: 'Já tem solução',            value: 'ja_tem_solucao' },
  { label: 'Preço / sem verba',         value: 'preco_sem_verba' },
  { label: 'Não é o momento',           value: 'nao_e_o_momento' },
  { label: 'Escolheu concorrente',      value: 'escolheu_concorrente' },
  { label: 'Sem interesse / não respondeu', value: 'sem_interesse' },
  { label: 'Não era o decisor',         value: 'nao_era_decisor' },
  { label: 'Outro',                     value: 'outro' },
];

export function getMotivoPerdidoLabel(value: string): string {
  return MOTIVOS_PERDIDO.find(m => m.value === value)?.label || value;
}

export function getStatusCor(value: string): { primary: string; secondary: string } {
  const s = STATUS_COMERCIAL.find(st => st.value === value);
  return s
    ? { primary: s.color, secondary: s.colorSecondary }
    : { primary: '#2196f3', secondary: '#bbdefb' };
}
