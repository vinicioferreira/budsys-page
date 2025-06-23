import { Component, ViewChild } from '@angular/core';
import { ContatoService } from '../../services/contato.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';


@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent {
  displayedColumns: string[] = ['seqId', 'nome', 'email', 'telefone', 'empresa', 'mensagem'];
  dataSource = new MatTableDataSource<any>([]);
  

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private contatoService: ContatoService) {}

  ngOnInit(): void {
    this.contatoService.listarContatos().subscribe(data => {
      this.dataSource.data = data;
      console.log('Clientes potenciais carregados:', data);
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}
