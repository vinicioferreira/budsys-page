import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, collection, doc, getDoc, getDocs, query, where, orderBy } from '@angular/fire/firestore';
import { getStatusColor, getStatusLabel } from '../../../shared/status-comercial';

@Component({
  selector: 'app-lead-perfil',
  templateUrl: './lead-perfil.component.html',
  styleUrls: ['./lead-perfil.component.scss']
})
export class LeadPerfilComponent implements OnInit {
  lead: any = null;
  historico: any[] = [];
  proximasAtividades: any[] = [];
  carregando = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private firestore: Firestore
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.carregar(id);
  }

  async carregar(id: string): Promise<void> {
    try {
      const leadSnap = await getDoc(doc(this.firestore, 'contatos', id));
      if (!leadSnap.exists()) { this.router.navigate(['/admin']); return; }
      this.lead = { id: leadSnap.id, ...leadSnap.data() };

      const snap = await getDocs(
        query(collection(this.firestore, 'atividades'), where('contatoId', '==', id))
      );

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      const todas = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => new Date(a.dataPrevista).getTime() - new Date(b.dataPrevista).getTime());

      this.historico = todas.filter((a: any) => {
        const data = new Date(a.dataPrevista);
        data.setHours(0, 0, 0, 0);
        return data <= hoje;
      }).reverse(); // mais recente primeiro no histórico

      this.proximasAtividades = todas.filter((a: any) => {
        const data = new Date(a.dataPrevista);
        data.setHours(0, 0, 0, 0);
        return data > hoje;
      });
    } catch (e) {
      console.error(e);
    } finally {
      this.carregando = false;
    }
  }

  voltar(): void {
    this.router.navigate(['/admin']);
  }

  getStatusLabel(s: string): string { return getStatusLabel(s); }
  getStatusColor(s: string): string { return getStatusColor(s); }

  getCanalLabel(canal: string): string {
    switch ((canal || '').toLowerCase()) {
      case 'whatsapp': return 'WhatsApp';
      case 'email': return 'E-mail';
      case 'ligacao': case 'ligar': return 'Ligação';
      case 'reuniao': case 'reunião': return 'Reunião';
      case 'linkedin': return 'LinkedIn';
      case 'manual': return 'Manual';
      default: return canal || 'Atividade';
    }
  }

  getCanalIcon(canal: string): string {
    switch ((canal || '').toLowerCase()) {
      case 'whatsapp': return 'chat';
      case 'email': return 'email';
      case 'ligacao': case 'ligar': return 'phone';
      case 'reuniao': case 'reunião': return 'event';
      case 'linkedin': return 'work';
      default: return 'task';
    }
  }

  formatarData(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  isPassada(dataPrevista: string): boolean {
    return new Date(dataPrevista) < new Date();
  }

  isFutura(dataPrevista: string): boolean {
    return new Date(dataPrevista) >= new Date();
  }

  todasFeitas(atividade: any): boolean {
    const acoes: any[] = atividade.acoes || [];
    return acoes.length > 0 && acoes.every((a: any) => a.feito === true);
  }
}
