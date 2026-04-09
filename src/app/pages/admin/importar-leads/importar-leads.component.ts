import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, collection, getDocs, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { CadenciaService } from '../../../services/cadencia.service';
import { AgendaService } from '../../../services/agenda.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-importar-leads',
  templateUrl: './importar-leads.component.html',
  styleUrls: ['./importar-leads.component.scss']
})
export class ImportarLeadsComponent {
  leads: any[] = [];
  cadencias: any[] = [];
  cadenciaSelecionada: string = '';
  importando = false;
  importadosCount = 0;
  duplicatasCount = 0;
  cnpjsExistentes = new Set<string>();

  constructor(
    private firestore: Firestore,
    private cadenciaService: CadenciaService,
    private agendaService: AgendaService,
    private router: Router
  ) {
    this.cadenciaService.listarCadencias().subscribe(c => this.cadencias = c);
  }

  voltar(): void {
    this.router.navigate(['/admin']);
  }

  async onFileChange(event: any): Promise<void> {
    const file = event.target.files[0];
    if (!file) return;

    // Busca CNPJs já cadastrados
    const snap = await getDocs(collection(this.firestore, 'contatos'));
    this.cnpjsExistentes = new Set(
      snap.docs.map(d => this.limparCnpj(d.data()['cnpj'] || ''))
        .filter(c => c.length > 0)
    );

    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target!.result as ArrayBuffer);
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
    const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    if (rows.length < 2) return;

    // Encontra a linha do cabeçalho (a que contém "CNPJ")
    const headerIndex = rows.findIndex((row: any[]) =>
      row.some((cell: any) => String(cell).trim().toUpperCase() === 'CNPJ')
    );

    if (headerIndex === -1) {
      alert('Não foi possível encontrar o cabeçalho da planilha. Verifique se a coluna "CNPJ" existe.');
      return;
    }

    const cabecalho = (rows[headerIndex] as string[]).map(c => String(c).trim());
    const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const get = (row: any[], nome: string) => {
      const nomeNorm = normalizar(nome);
      // Tenta match exato primeiro, depois startsWith, depois includes
      let idx = cabecalho.findIndex(c => normalizar(c) === nomeNorm);
      if (idx === -1) idx = cabecalho.findIndex(c => normalizar(c).startsWith(nomeNorm));
      if (idx === -1) idx = cabecalho.findIndex(c => normalizar(c).includes(nomeNorm));
      return String(row[idx] ?? '').trim();
    };

    this.leads = rows.slice(headerIndex + 1).map((row: any[]) => {
      const cnpjRaw = get(row, 'CNPJ');
      const cnpjLimpo = this.limparCnpj(cnpjRaw);
      const vazio = (v: string) => !v || v === '-' || v === '—';
      const nomeFantasia = get(row, 'Nome Fantasia');
      const razaoSocial = get(row, 'Razão Social');
      const nomeParsed = this.parseNome(get(row, 'Nome'));

      return {
        selecionado: !this.cnpjsExistentes.has(cnpjLimpo),
        duplicata: this.cnpjsExistentes.has(cnpjLimpo),
        cnpj: cnpjRaw,
        cnpjLimpo,
        empresa: (!vazio(nomeFantasia) ? nomeFantasia : razaoSocial),
        razaoSocial,
        nome: nomeParsed.nome,
        cargo: nomeParsed.cargo,
        faixaEtaria: nomeParsed.faixaEtaria,
        telefone: get(row, 'Telefone 1'),
        email: get(row, 'E-mail'),
        cidade: get(row, 'Município'),
        uf: get(row, 'UF'),
        porte: get(row, 'Porte'),
        segmento: get(row, 'Cnae Primário'),
      };
    }).filter((l: any) => l.cnpjLimpo || l.empresa);
  }

  private parseNome(raw: string): { nome: string; cargo: string; faixaEtaria: string } {
    if (!raw) return { nome: '', cargo: '', faixaEtaria: '' };
    const partes = raw.split(' - ').map(p => p.trim());
    const nomeFormatado = partes[0]
      ? partes[0].split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
      : '';
    const cargo = partes[1] ? partes[1].replace(/\(cd\.\s*\d+\)/g, '').trim() : '';
    const faixaEtaria = partes.find(p => /\d+\s*a\s*\d+\s*anos/i.test(p)) || '';
    return { nome: nomeFormatado, cargo, faixaEtaria };
  }

  private limparCnpj(cnpj: string): string {
    return (cnpj || '').replace(/\D/g, '');
  }

  get selecionados(): any[] {
    return this.leads.filter(l => l.selecionado);
  }

  toggleTodos(event: any): void {
    const valor = event.target.checked;
    this.leads.forEach(l => { if (!l.duplicata) l.selecionado = valor; });
  }

  async importar(): Promise<void> {
    if (!this.selecionados.length) { alert('Selecione pelo menos um lead.'); return; }

    this.importando = true;
    this.importadosCount = 0;
    this.duplicatasCount = 0;

    const cadencia = this.cadenciaSelecionada
      ? this.cadencias.find(c => c.id === this.cadenciaSelecionada)
      : null;

    for (const lead of this.selecionados) {
      if (this.cnpjsExistentes.has(lead.cnpjLimpo)) { this.duplicatasCount++; continue; }

      const docRef = await addDoc(collection(this.firestore, 'contatos'), {
        nome: lead.nome,
        empresa: lead.empresa,
        razaoSocial: lead.razaoSocial,
        cnpj: lead.cnpj,
        telefone: lead.telefone,
        email: lead.email,
        cidade: lead.cidade,
        uf: lead.uf,
        porte: lead.porte,
        segmento: lead.segmento,
        cargo: lead.cargo,
        faixaEtaria: lead.faixaEtaria,
        canal: cadencia?.nome || '',
        status: 'novo',
        dataCadastro: serverTimestamp(),
      });

      if (cadencia) {
        await this.agendaService.gerarAtividadesDeCadencia(
          cadencia, docRef.id, lead.nome, lead.empresa, new Date()
        );
      }

      this.importadosCount++;
    }

    this.importando = false;
    alert(`✅ ${this.importadosCount} leads importados!${this.duplicatasCount ? ` ${this.duplicatasCount} duplicatas ignoradas.` : ''}`);
    this.router.navigate(['/admin']);
  }
}
