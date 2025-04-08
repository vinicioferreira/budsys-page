import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ModalContatoComponent } from './modal-contato/modal-contato.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  // Lista de imagens do dashboard
  dashboardImages: string[] = [
    'assets/Dashbord_Budsys.png', // Imagens do dashboard
    'assets/dashboard.png',
    'assets/Logo_Nova_1.png'
  ];

  // Índice da imagem atual
  currentImageIndex = 0;
  // Imagem atual exibida
  currentDashboardImage = this.dashboardImages[this.currentImageIndex];

  slideWidth = 33.33; // 3 cards por vez, cada um ocupa ~33.33%
  frasesGrupo1 = [
    'Cadastro rápido de clientes e fornecedores.',
    'Ganhe tempo com automação de orçamentos.',
    'Visualize tudo com um dashboard claro.',
    'Organização e controle ao seu alcance.'
  ];

  frasesGrupo2 = [
    'Orçamentos com aparência profissional.',
    'Controle de status em tempo real.',
    'Tudo integrado em um só sistema.',
    'Mais agilidade e menos retrabalho.'
  ];

  frases = this.frasesGrupo1;
  frasesComDuplicado: string[] = [];
  currentSlide = 0;
  transitionStyle = 'transform 0.6s ease-in-out';

  // Vídeos
  videos: string[] = [
    'assets/BudSys_Video_Baixa.mp4',
    'assets/Dashboard.mp4'
  ];

  videoAtual = 0;
  currentVideoUrl = this.videos[this.videoAtual];
  isManualChange = false; // Flag para verificar se a troca é manual

  constructor(private dialog: MatDialog) {}

  ngOnInit() {
    this.iniciarCarrossel();

     // Troca a imagem automaticamente após 10 segundos
    setInterval(() => {
      this.trocarImagemProxima();
    }, 10000); // Troca a imagem a cada 10 segundos

    // Substituir o setInterval por evento 'ended' para garantir a troca após o término
    setInterval(() => {
      this.currentVideoUrl = this.videos[this.videoAtual];
      const player = this.videoPlayer.nativeElement;
      if (player.ended) {
        this.proximoVideo(); // Muda o vídeo quando o atual terminar
      }
    }, 1000); // Verifica a cada 1 segundo se o vídeo terminou

    setInterval(() => {
      this.frases = this.frases === this.frasesGrupo1 ? this.frasesGrupo2 : this.frasesGrupo1;
      this.frasesComDuplicado = [...this.frases, ...this.frases];
      this.currentSlide = 0;
    }, 20000); // troca as frases a cada 20 segundos
  }

  iniciarCarrossel() {
    this.frasesComDuplicado = [...this.frases, ...this.frases];

    setInterval(() => {
      this.nextSlide();
    }, 3000); // tempo de rotação das frases
  }

  nextSlide() {
    this.currentSlide++;
    // Quando chega no final, reseta o scroll pra primeira posição
    if (this.currentSlide >= this.frases.length) {
      this.transitionStyle = 'none';
      this.currentSlide = 0;

      // Aguarda um frame pra resetar com transição novamente
      setTimeout(() => {
        this.transitionStyle = 'transform 0.6s ease-in-out';
      }, 50);
    }
  }

   // Função para trocar o vídeo quando o atual terminar
   trocarVideo() {
    const player = this.videoPlayer.nativeElement;

    // Verifica se o vídeo está sendo reproduzido
    if (!player.paused) {
      return; // Se o vídeo estiver rodando, não faz nada
    }

    // Caso o vídeo tenha terminado ou esteja pausado, troca o vídeo
    this.isManualChange = false; // Resetando a flag para troca automática
    this.videoAtual = (this.videoAtual + 1) % this.videos.length;
    player.src = this.videos[this.videoAtual];
    player.load();
    player.play();
  }

  // Função para avançar para o próximo vídeo (manualmente)
  proximoVideo() {
    this.isManualChange = true; // Indica que a troca foi manual

    // Atualiza o índice do vídeo
    this.videoAtual = (this.videoAtual + 1) % this.videos.length;
    this.currentVideoUrl = this.videos[this.videoAtual];

    // Força a troca imediata do vídeo, sem esperar o atual terminar
    const player = this.videoPlayer.nativeElement;
    player.src = this.videos[this.videoAtual];
    player.load(); // Recarrega o vídeo
    player.play(); // Inicia a reprodução do novo vídeo
  }

  // Função para retroceder para o vídeo anterior (manualmente)
  videoAnterior() {
    this.isManualChange = true; // Indica que a troca foi manual

    // Atualiza o índice do vídeo
    this.videoAtual = (this.videoAtual - 1 + this.videos.length) % this.videos.length;
    this.currentVideoUrl = this.videos[this.videoAtual];

    // Força a troca imediata do vídeo, sem esperar o atual terminar
    const player = this.videoPlayer.nativeElement;
    player.src = this.videos[this.videoAtual];
    player.load(); // Recarrega o vídeo
    player.play(); // Inicia a reprodução do novo vídeo
  }

  // Função para trocar para a imagem anterior
  trocarImagemAnterior() {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.dashboardImages.length) % this.dashboardImages.length;
    this.currentDashboardImage = this.dashboardImages[this.currentImageIndex];
  }

  // Função para trocar para a próxima imagem
  trocarImagemProxima() {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.dashboardImages.length;
    this.currentDashboardImage = this.dashboardImages[this.currentImageIndex];
  }

  abrirModal() {
    this.dialog.open(ModalContatoComponent, {
      width: '400px',
      disableClose: false
    });
  }
}
