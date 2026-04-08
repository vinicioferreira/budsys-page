import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, query, where, Timestamp } from '@angular/fire/firestore';
import { STATUS_COMERCIAL, inferirFasePorStatus } from '../../shared/status-comercial';

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

interface FiltroPeriodo {
  label: string;
  value: string;
}

interface ContatarItem {
  nome: string;
  empresa: string;
  data: Date;
  observacao: string;
  classe: string;
  labelData: string;
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

  contatarAtrasados = 0;
  contatarHoje = 0;
  contatarEstaSemana = 0;
  contatarProximos = 0;
  contatarLista: ContatarItem[] = [];

  filtros: FiltroPeriodo[] = [
    { label: 'Mês atual',    value: 'mes_atual' },
    { label: 'Mês anterior', value: 'mes_anterior' },
    { label: '3 meses',      value: '3_meses' },
    { label: '6 meses',      value: '6_meses' },
    { label: '1 ano',        value: '1_ano' },
  ];

  filtroSelecionado = 'mes_atual';
  dataInicio!: Date;
  dataFim!: Date;
  dataFimMin!: Date; // nunca menor que dataInicio

  constructor(private firestore: Firestore) {}

  ngOnInit(): void {
    this.aplicarPreset('mes_atual');
    this.carregarContatarEm();
  }

  aplicarPreset(value: string): void {
    this.filtroSelecionado = value;
    const { inicio, fim } = this.rangeDoPreset(value);
    this.dataInicio = inicio;
    this.dataFim    = fim;
    this.dataFimMin = inicio;
    this.carregarMetricas();
  }

  onDataInicioChange(date: Date | null): void {
    if (!date) return;
    this.filtroSelecionado = '';
    this.dataInicio = date;
    this.dataFimMin = date;
    // Se dataFim ficou antes de dataInicio, ajusta
    if (this.dataFim < date) {
      this.dataFim = new Date(date);
    }
    this.carregarMetricas();
  }

  onDataFimChange(date: Date | null): void {
    if (!date) return;
    this.filtroSelecionado = '';
    this.dataFim = date;
    this.carregarMetricas();
  }

  private rangeDoPreset(value: string): { inicio: Date; fim: Date } {
    const hoje = new Date();
    const ano  = hoje.getFullYear();
    const mes  = hoje.getMonth();

    switch (value) {
      case 'mes_atual':
        return { inicio: new Date(ano, mes, 1),         fim: new Date(ano, mes + 1, 0, 23, 59, 59, 999) };
      case 'mes_anterior':
        return { inicio: new Date(ano, mes - 1, 1),     fim: new Date(ano, mes, 0, 23, 59, 59, 999) };
      case '3_meses':
        return { inicio: new Date(ano, mes - 2, 1),     fim: new Date(ano, mes + 1, 0, 23, 59, 59, 999) };
      case '6_meses':
        return { inicio: new Date(ano, mes - 5, 1),     fim: new Date(ano, mes + 1, 0, 23, 59, 59, 999) };
      case '1_ano':
        return { inicio: new Date(ano - 1, mes + 1, 1), fim: new Date(ano, mes + 1, 0, 23, 59, 59, 999) };
      default:
        return { inicio: new Date(ano, mes, 1),         fim: new Date(ano, mes + 1, 0, 23, 59, 59, 999) };
    }
  }

  async carregarMetricas(): Promise<void> {
    this.carregando = true;
    try {
      const fim = new Date(this.dataFim);
      fim.setHours(23, 59, 59, 999);

      const q = query(
        collection(this.firestore, 'contatos'),
        where('dataCadastro', '>=', Timestamp.fromDate(this.dataInicio)),
        where('dataCadastro', '<=', Timestamp.fromDate(fim))
      );

      const snapshot = await getDocs(q);

      const agrupado: Record<string, number> = {};
      let contatados = 0, reunioes = 0, propostas = 0, negociacao = 0;

      const FASE_NIVEL: Record<string, number> = {
        contatado: 1, reuniao: 2, proposta: 3, negociacao: 4, fechado: 5
      };

      for (const docSnap of snapshot.docs) {
        const d = docSnap.data();
        const status = d['status'] || 'novo';
        agrupado[status] = (agrupado[status] || 0) + 1;

        // Usa faseAtingida gravada; fallback para inferir do status atual
        const fase  = d['faseAtingida'] || inferirFasePorStatus(status);
        const nivel = FASE_NIVEL[fase] ?? 0;

        if (nivel >= 1) contatados++;
        if (nivel >= 2) reunioes++;
        if (nivel >= 3) propostas++;
        if (nivel >= 4) negociacao++;
      }

      this.total = snapshot.size;

      this.fechados    = agrupado['fechado'] || 0;
      this.perdidos    = agrupado['perdido'] || 0;
      this.emAndamento = this.total - this.fechados - this.perdidos;
      this.taxaFinal   = this.total > 0 ? Math.round((this.fechados / this.total) * 100) : 0;

      const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 100) : 0;

      this.etapasFunil = [
        { label: 'Leads',        icon: 'group_add',     color: '#546e7a', count: this.total,     conversao: null },
        { label: 'Contatados',   icon: 'phone_enabled', color: '#fb8c00', count: contatados,     conversao: pct(contatados, this.total) },
        { label: 'Reuniões',     icon: 'event',         color: '#1e88e5', count: reunioes,       conversao: pct(reunioes, contatados) },
        { label: 'Propostas',    icon: 'description',   color: '#8e24aa', count: propostas,      conversao: pct(propostas, reunioes) },
        { label: 'Negociação',   icon: 'handshake',     color: '#f57c00', count: negociacao,     conversao: pct(negociacao, propostas) },
        { label: 'Fechados',     icon: 'verified',      color: '#43a047', count: this.fechados,  conversao: pct(this.fechados, negociacao) },
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

  async carregarContatarEm(): Promise<void> {
    try {
      const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

      // 1. Busca todos os contatos
      const snapshotContatos = await getDocs(collection(this.firestore, 'contatos'));
      const mapaContatos = new Map<string, any>();
      for (const docSnap of snapshotContatos.docs) {
        mapaContatos.set(docSnap.id, docSnap.data());
      }

      // 2. Busca próxima atividade por contato (cadências)
      const snapshotAtividades = await getDocs(collection(this.firestore, 'atividades'));
      const mapaProximas = new Map<string, Date>();
      for (const docSnap of snapshotAtividades.docs) {
        const d = docSnap.data();
        const contatoId = d['contatoId'];
        if (!contatoId || !d['dataPrevista']) continue;
        const dataPrevista = new Date(d['dataPrevista']);
        if (isNaN(dataPrevista.getTime())) continue;
        const atual = mapaProximas.get(contatoId);
        if (!atual || dataPrevista < atual) {
          mapaProximas.set(contatoId, dataPrevista);
        }
      }

      // 3. Para cada contato, usa a data mais próxima entre contatarEm e próxima atividade
      const itens: { contatoId: string; data: Date; observacao: string }[] = [];

      for (const [id, contato] of mapaContatos) {
        let melhorData: Date | null = null;
        let observacao = '';

        if (contato['contatarEm']) {
          const d: Date = contato['contatarEm'].toDate
            ? contato['contatarEm'].toDate()
            : new Date(contato['contatarEm']);
          melhorData = d;
          observacao = contato['observacaoContatar'] || '';
        }

        const proxAtiv = mapaProximas.get(id);
        if (proxAtiv && (!melhorData || proxAtiv < melhorData)) {
          melhorData = proxAtiv;
          observacao = '';
        }

        if (!melhorData) continue;

        const alvo = new Date(melhorData); alvo.setHours(0, 0, 0, 0);
        const diff = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
        if (diff > 30) continue;

        itens.push({ contatoId: id, data: melhorData, observacao });
      }

      itens.sort((a, b) => a.data.getTime() - b.data.getTime());

      this.contatarAtrasados  = 0;
      this.contatarHoje       = 0;
      this.contatarEstaSemana = 0;
      this.contatarProximos   = 0;
      this.contatarLista      = [];

      for (const item of itens) {
        const contato = mapaContatos.get(item.contatoId)!;
        const alvo = new Date(item.data); alvo.setHours(0, 0, 0, 0);
        const diff = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);

        let classe = 'contatar-futuro';
        let labelData = '';

        if (diff < 0)        { this.contatarAtrasados++;  classe = 'contatar-atrasado'; labelData = `Atrasado ${Math.abs(diff)}d`; }
        else if (diff === 0) { this.contatarHoje++;        classe = 'contatar-hoje';     labelData = 'Hoje'; }
        else if (diff <= 7)  { this.contatarEstaSemana++;  classe = 'contatar-breve';    labelData = diff === 1 ? 'Amanhã' : `Em ${diff} dias`; }
        else                 { this.contatarProximos++;    classe = 'contatar-futuro';   labelData = item.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }); }

        this.contatarLista.push({
          nome:      contato['nome']    || '—',
          empresa:   contato['empresa'] || '',
          data:      item.data,
          observacao: item.observacao,
          classe,
          labelData,
        });
      }
    } catch (error) {
      console.error('Erro ao carregar contatarEm:', error);
    }
  }

  iconeBg(color: string): string {
    return color + '18';
  }
}
