import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';
import { STATUS_COMERCIAL } from '../../shared/status-comercial';

interface EtapaFunil {
  label: string;
  icon: string;
  color: string;
  count: number;
  conversao: number | null;
}

interface DistribuicaoItem {
  label: string;
  value: string;
  color: string;
  count: number;
  percentual: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  total = 0;
  fechados = 0;
  perdidos = 0;
  emAndamento = 0;
  taxaFinal = 0;

  etapasFunil: EtapaFunil[] = [];
  distribuicao: DistribuicaoItem[] = [];
  carregando = true;

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.carregarMetricas();
  }

  async carregarMetricas(): Promise<void> {
    try {
      const snapshot = await getDocs(collection(this.firestore, 'contatos'));

      const agrupado: Record<string, number> = {};
      for (const doc of snapshot.docs) {
        const status = doc.data()['status'] || 'novo';
        agrupado[status] = (agrupado[status] || 0) + 1;
      }

      this.total = snapshot.size;

      const soma = (...statuses: string[]) =>
        statuses.reduce((acc, s) => acc + (agrupado[s] || 0), 0);

      const contatados = soma('contatado', 'reuniao_agendada', 'reuniao_realizada', 'reuniao_cancelada', 'proposta_enviada', 'fechado');
      const reunioes   = soma('reuniao_realizada', 'proposta_enviada', 'fechado');
      const propostas  = soma('proposta_enviada', 'fechado');

      this.fechados    = agrupado['fechado'] || 0;
      this.perdidos    = agrupado['perdido'] || 0;
      this.emAndamento = this.total - this.fechados - this.perdidos;
      this.taxaFinal   = this.total > 0 ? Math.round((this.fechados / this.total) * 100) : 0;

      const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

      this.etapasFunil = [
        { label: 'Leads',      icon: 'group_add',    color: '#546e7a', count: this.total,  conversao: null },
        { label: 'Contatados', icon: 'phone_enabled', color: '#fb8c00', count: contatados, conversao: pct(contatados, this.total) },
        { label: 'Reuniões',   icon: 'event',         color: '#1e88e5', count: reunioes,   conversao: pct(reunioes, contatados) },
        { label: 'Propostas',  icon: 'description',   color: '#8e24aa', count: propostas,  conversao: pct(propostas, reunioes) },
        { label: 'Fechados',   icon: 'handshake',     color: '#43a047', count: this.fechados, conversao: pct(this.fechados, propostas) },
      ];

      this.distribuicao = STATUS_COMERCIAL
        .map(s => ({
          label: s.label,
          value: s.value,
          color: s.color,
          count: agrupado[s.value] || 0,
          percentual: this.total > 0 ? Math.round(((agrupado[s.value] || 0) / this.total) * 100) : 0
        }))
        .filter(s => s.count > 0)
        .sort((a, b) => b.count - a.count);

    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    } finally {
      this.carregando = false;
    }
  }

  iconeBg(color: string): string {
    return color + '18'; // hex alpha ~10%
  }
}
