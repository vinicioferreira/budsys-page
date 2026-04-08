export interface StatusComercial {
  label: string;
  value: string;
  color: string;
  colorSecondary: string;
}

export const STATUS_COMERCIAL: StatusComercial[] = [
  { label: 'Novo',               value: 'novo',               color: '#546e7a', colorSecondary: '#eceff1' },
  { label: 'Tentando contato',   value: 'tentando_contato',   color: '#e53935', colorSecondary: '#ffcdd2' },
  { label: 'Contatado',          value: 'contatado',           color: '#fb8c00', colorSecondary: '#ffe0b2' },
  { label: 'Reunião agendada',   value: 'reuniao_agendada',   color: '#1e88e5', colorSecondary: '#bbdefb' },
  { label: 'Reunião realizada',  value: 'reuniao_realizada',  color: '#00897b', colorSecondary: '#b2dfdb' },
  { label: 'Reunião cancelada',  value: 'reuniao_cancelada',  color: '#f4511e', colorSecondary: '#fbe9e7' },
  { label: 'Proposta enviada',   value: 'proposta_enviada',   color: '#8e24aa', colorSecondary: '#e1bee7' },
  { label: 'Fechado',            value: 'fechado',             color: '#43a047', colorSecondary: '#c8e6c9' },
  { label: 'Perdido',            value: 'perdido',             color: '#757575', colorSecondary: '#eeeeee' },
];

export function getStatusColor(value: string): string {
  return STATUS_COMERCIAL.find(s => s.value === value)?.color || '#999';
}

export function getStatusLabel(value: string): string {
  return STATUS_COMERCIAL.find(s => s.value === value)?.label || value;
}

export function getStatusCor(value: string): { primary: string; secondary: string } {
  const s = STATUS_COMERCIAL.find(st => st.value === value);
  return s
    ? { primary: s.color, secondary: s.colorSecondary }
    : { primary: '#2196f3', secondary: '#bbdefb' };
}
