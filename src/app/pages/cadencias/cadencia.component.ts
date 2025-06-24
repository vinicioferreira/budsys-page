import { Component, OnInit } from '@angular/core';
import { Cadencia, Etapa } from '../../interfaces/cadencia';
import { CadenciaService } from '../../services/cadencias.service';

@Component({
  selector: 'app-cadencias',
  templateUrl: './cadencia.component.html',
  styleUrls: ['./cadencia.component.scss']
})
export class CadenciaComponent implements OnInit {
  cadencia: Cadencia = {
    nome: '',
    descricao: '',
    etapas: []
  };

  cadenciasSalvas: Cadencia[] = [];

  constructor(private cadenciaService: CadenciaService) {}

  ngOnInit(): void {
    this.carregarCadencias();
  }

  adicionarEtapa() {
    const novaEtapa: Etapa = {
      dia: 1,
      canal: '',
      mensagem: ''
    };
    this.cadencia.etapas.push(novaEtapa);
  }

  removerEtapa(index: number) {
    this.cadencia.etapas.splice(index, 1);
  }

  async salvar() {
    try {
      await this.cadenciaService.salvarCadencia(this.cadencia);
      alert('Cadência salva com sucesso!');
      this.cadencia = { nome: '', descricao: '', etapas: [] };
      this.carregarCadencias();  // Atualiza lista após salvar
    } catch (error) {
      console.error('Erro ao salvar cadência:', error);
      alert('Erro ao salvar cadência');
    }
  }

  carregarCadencias() {
    this.cadenciaService.listarCadencias().subscribe(cadencias => {
      this.cadenciasSalvas = cadencias;
    });
  }
}
