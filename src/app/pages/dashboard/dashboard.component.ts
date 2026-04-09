import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, query, where, Timestamp, doc, getDoc } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { STATUS_COMERCIAL, inferirFasePorStatus } from '../../shared/status-comercial';
import { ModalMessageComponent } from '../agenda/modal-message/modal-message.component';

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
  contatoId: string;
  atividadeId?: string; // preenchido para tarefas manuais sem contato
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

  listaAtrasados:  ContatarItem[] = [];
  listaHoje:       ContatarItem[] = [];
  listaSemana:     ContatarItem[] = [];
  listaProximos:   ContatarItem[] = [];

  expandedColunas = new Set<string>();

  toggleColuna(coluna: string): void {
    this.expandedColunas.has(coluna)
      ? this.expandedColunas.delete(coluna)
      : this.expandedColunas.add(coluna);
  }

  isColunaExpanded(coluna: string): boolean {
    return this.expandedColunas.has(coluna);
  }

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

  constructor(private firestore: Firestore, private dialog: MatDialog) {}

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

      // 2. Próxima atividade pendente por contato (ignora as com todas as ações feitas)
      // Prefere a mais próxima futura; só usa passada como fallback
      const snapshotAtividades = await getDocs(collection(this.firestore, 'atividades'));
      const agora = new Date();
      const mapaFuturas   = new Map<string, Date>(); // earliest future per contact
      const mapaAtrasadas = new Map<string, Date>(); // latest overdue per contact (always shown)
      const contatosComAtividadeConcluida = new Set<string>(); // contacts with all acoes done

      // Atividades sem contato vinculado (tarefas manuais avulsas)
      const atividadesSemContato: { id: string; nome: string; empresa: string; data: Date; acoes: any[]; anotacao: string; anotacaoLog: any[] }[] = [];

      for (const docSnap of snapshotAtividades.docs) {
        const d = docSnap.data();
        const contatoId = d['contatoId'];
        if (!d['dataPrevista']) continue;
        const dataPrevista = new Date(d['dataPrevista']);
        if (isNaN(dataPrevista.getTime())) continue;

        // Atividade sem contato: vai para lista avulsa se pendente e dentro de 30 dias
        if (!contatoId) {
          const acoes: any[] = d['acoes'] || [];
          const concluida = acoes.length > 0 && acoes.every((a: any) => a.feito === true);
          if (!concluida) {
            const alvo = new Date(dataPrevista); alvo.setHours(0, 0, 0, 0);
            const diff = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
            if (diff <= 30) {
              atividadesSemContato.push({
                id:         docSnap.id,
                nome:       String(d['contatoNome'] || d['mensagem'] || 'Tarefa'),
                empresa:    String(d['empresa'] || ''),
                data:       dataPrevista,
                acoes:      d['acoes'] || [],
                anotacao:   String(d['anotacao'] || ''),
                anotacaoLog: d['anotacaoLog'] || [],
              });
            }
          }
          continue;
        }

        const acoes: any[] = d['acoes'] || [];
        if (acoes.length > 0 && acoes.every((a: any) => a.feito === true)) {
          contatosComAtividadeConcluida.add(contatoId);
          continue;
        }

        if (dataPrevista >= agora) {
          const atual = mapaFuturas.get(contatoId);
          if (!atual || dataPrevista < atual) mapaFuturas.set(contatoId, dataPrevista);
        } else {
          const atual = mapaAtrasadas.get(contatoId);
          if (!atual || dataPrevista > atual) mapaAtrasadas.set(contatoId, dataPrevista);
        }
      }

      this.listaAtrasados = [];
      this.listaHoje      = [];
      this.listaSemana    = [];
      this.listaProximos  = [];

      // 3a. ATRASADOS: overdue de atividade ou contatarEm passado (sem atividade concluída)
      for (const [id, contato] of mapaContatos) {
        let dataAtrasada: Date | null = null;
        let observacao = '';

        // contatarEm passado → atrasado se não há atividade concluída
        if (contato['contatarEm']) {
          const d: Date = contato['contatarEm'].toDate
            ? contato['contatarEm'].toDate()
            : new Date(contato['contatarEm']);
          const alvo = new Date(d); alvo.setHours(0, 0, 0, 0);
          const diff = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
          if (diff < 0 && !contatosComAtividadeConcluida.has(id)) {
            dataAtrasada = d;
            observacao   = contato['observacaoContatar'] || '';
          }
        }

        // atividade de cadência atrasada (mais recente)
        const atrasadaAtiv = mapaAtrasadas.get(id);
        if (atrasadaAtiv && (!dataAtrasada || atrasadaAtiv > dataAtrasada)) {
          dataAtrasada = atrasadaAtiv;
          observacao   = '';
        }

        if (!dataAtrasada) continue;

        const alvo = new Date(dataAtrasada); alvo.setHours(0, 0, 0, 0);
        const diffDias = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
        this.listaAtrasados.push({
          contatoId:  id,
          nome:       contato['nome']    || '—',
          empresa:    contato['empresa'] || '',
          data:       dataAtrasada,
          observacao,
          classe:     'contatar-atrasado',
          labelData:  `${Math.abs(diffDias)}d atrás`,
        });
      }

      // 3b. FUTUROS: atividades de amanhã em diante (independente de ter overdue)
      //     + contatarEm futuro (hoje ou depois)
      for (const [id, contato] of mapaContatos) {
        let dataFutura: Date | null = null;
        let observacao = '';

        // contatarEm hoje ou futuro
        if (contato['contatarEm']) {
          const d: Date = contato['contatarEm'].toDate
            ? contato['contatarEm'].toDate()
            : new Date(contato['contatarEm']);
          const alvo = new Date(d); alvo.setHours(0, 0, 0, 0);
          const diff = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
          if (diff >= 0) {
            dataFutura = d;
            observacao = contato['observacaoContatar'] || '';
          }
        }

        // atividade futura mais próxima
        const futuraAtiv = mapaFuturas.get(id);
        if (futuraAtiv && (!dataFutura || futuraAtiv < dataFutura)) {
          dataFutura = futuraAtiv;
          observacao = '';
        }

        if (!dataFutura) continue;

        const alvo = new Date(dataFutura); alvo.setHours(0, 0, 0, 0);
        const diff = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
        if (diff > 30) continue;

        const entry: ContatarItem = {
          contatoId:  id,
          nome:       contato['nome']    || '—',
          empresa:    contato['empresa'] || '',
          data:       dataFutura,
          observacao,
          classe:     '',
          labelData:  '',
        };

        if (diff === 0) {
          entry.classe    = 'contatar-hoje';
          entry.labelData = 'Hoje';
          this.listaHoje.push(entry);
        } else if (diff <= 7) {
          entry.classe    = 'contatar-breve';
          entry.labelData = diff === 1 ? 'Amanhã' : `Em ${diff} dias`;
          this.listaSemana.push(entry);
        } else {
          entry.classe    = 'contatar-futuro';
          entry.labelData = dataFutura.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          this.listaProximos.push(entry);
        }
      }

      // 3c. Tarefas manuais sem contato
      for (const av of atividadesSemContato) {
        const alvo = new Date(av.data); alvo.setHours(0, 0, 0, 0);
        const diff = Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
        const entry: ContatarItem = {
          contatoId:   '',
          atividadeId: av.id,
          nome:        av.nome,
          empresa:     av.empresa,
          data:        av.data,
          observacao:  '',
          classe:      '',
          labelData:   '',
        };
        if (diff < 0) {
          entry.classe    = 'contatar-atrasado';
          entry.labelData = `${Math.abs(diff)}d atrás`;
          this.listaAtrasados.push(entry);
        } else if (diff === 0) {
          entry.classe    = 'contatar-hoje';
          entry.labelData = 'Hoje';
          this.listaHoje.push(entry);
        } else if (diff <= 7) {
          entry.classe    = 'contatar-breve';
          entry.labelData = diff === 1 ? 'Amanhã' : `Em ${diff} dias`;
          this.listaSemana.push(entry);
        } else {
          entry.classe    = 'contatar-futuro';
          entry.labelData = av.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
          this.listaProximos.push(entry);
        }
      }

      // Ordena cada lista por data
      const porData = (a: ContatarItem, b: ContatarItem) => a.data.getTime() - b.data.getTime();
      this.listaAtrasados.sort(porData);
      this.listaHoje.sort(porData);
      this.listaSemana.sort(porData);
      this.listaProximos.sort(porData);
    } catch (error) {
      console.error('Erro ao carregar contatarEm:', error);
    }
  }

  async abrirModalContato(item: ContatarItem): Promise<void> {
    let atividadeMaisProxima: any = null;

    if (item.atividadeId) {
      // Tarefa manual sem contato: carrega diretamente pelo ID
      const snap = await getDoc(doc(this.firestore, 'atividades', item.atividadeId));
      if (snap.exists()) atividadeMaisProxima = { id: snap.id, ...snap.data() };
    } else {
      const snapshotAtividades = await getDocs(
        query(collection(this.firestore, 'atividades'),
          where('contatoId', '==', item.contatoId))
      );

      const agora = new Date();
      let dataMaisProxima: Date | null = null;

      for (const docSnap of snapshotAtividades.docs) {
        const d = docSnap.data();
        if (!d['dataPrevista']) continue;
        const dataPrevista = new Date(d['dataPrevista']);
        const acoes: any[] = d['acoes'] || [];
        if (acoes.length > 0 && acoes.every((a: any) => a.feito === true)) continue;

        if (!dataMaisProxima || Math.abs(dataPrevista.getTime() - agora.getTime()) < Math.abs(dataMaisProxima.getTime() - agora.getTime())) {
          dataMaisProxima = dataPrevista;
          atividadeMaisProxima = { id: docSnap.id, ...d };
        }
      }
    }

    const snapshotContato = item.contatoId ? await getDocs(
      query(collection(this.firestore, 'contatos'), where('__name__', '==', item.contatoId))
    ) : null;
    const contato = snapshotContato?.docs[0]?.data() || {};

    this.dialog.open(ModalMessageComponent, {
      width: '500px',
      height: '850px',
      data: {
        id: atividadeMaisProxima?.id || null,
        contatoId: item.contatoId,
        contatoNome: item.nome,
        empresa: item.empresa,
        contatoTelefone: contato['telefone'] || '',
        contatoEmail: contato['email'] || '',
        anotacao: atividadeMaisProxima?.anotacao || '',
        anotacaoLog: atividadeMaisProxima?.anotacaoLog || [],
        status: contato['status'] || '',
        dataPrevista: atividadeMaisProxima?.dataPrevista || '',
        acoes: atividadeMaisProxima?.acoes || [],
        canal: atividadeMaisProxima?.acoes?.[0]?.canal || '',
        mensagem: atividadeMaisProxima?.acoes?.[0]?.mensagem || '',
      }
    }).afterClosed().subscribe(reload => {
      if (reload) this.carregarContatarEm();
    });
  }

  iconeBg(color: string): string {
    return color + '18';
  }
}
