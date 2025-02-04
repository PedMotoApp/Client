import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UiUtilsService } from 'src/app/services/ui-utils.service';
import { DataService } from 'src/app/services/data.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
})
export class OnboardingPage implements OnInit {

  data = [
    {
      image: 'assets/images/bemvindo1.png',
      title: 'Conecte-se com Facilidade', 
      description: 'Solicite entregas rápidas, acompanhe em tempo real e tenha segurança em cada pedido.'
    },
    {
      image: 'assets/images/bemvindo2.png',
      title: 'Entregas ágeis e eficientes',
      description: 'Aproveite preços justos e um sistema confiável para garantir a melhor experiência em suas entregas.'
    },
    {
      image: 'assets/images/bemvindo3.png',
      title: 'Controle Total',
      description: 'Gerencie seus pedidos, acompanhe seu histórico e tenha acesso rápido a todas as informações que precisa.'
    }
  ];

  dataProfessional = [
    {
      image: 'assets/images/bemvindo1.png',
      title: 'Seja um Entregador de Sucesso',
      description: 'Acesse pedidos próximos, maximize seus ganhos e trabalhe com flexibilidade.'
    },
    {
      image: 'assets/images/bemvindo2.png',
      title: 'Ganhe Mais',
      description: 'Aumente sua renda diária com entregas otimizadas e sem burocracia.'
    },
    {
      image: 'assets/images/bemvindo3.png',
      title: 'Trabalhe no Seu Ritmo',
      description: 'Escolha suas entregas e faça seu próprio horário. Seu trabalho, suas regras!'
    }
  ];

  constructor(
    private router: Router,
    public dataService: DataService,
    public auth: AngularFireAuth,
    private modalCtrl: ModalController,
    private uiUtils: UiUtilsService) { }

  ngOnInit() {}

  ionViewWillEnter(){
    if (this.dataService.getUserInfo() && this.dataService.getUserInfo().userType === 2) {
      this.data = this.dataProfessional;
    }
  }

  navigate() {
    this.modalCtrl.dismiss()
  }

  closeOnboarding() {
    this.modalCtrl.dismiss(); // Fecha o modal
  }
}
