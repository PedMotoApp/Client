import { Component, OnInit, AfterViewInit } from '@angular/core';
import { WalletService } from 'src/app/services/wallet.service';
import { ToastController, LoadingController } from '@ionic/angular';
import { environment } from '../../../environments/environment';
import { DatabaseService } from 'src/app/services/database.service';
import { DataTextService } from 'src/app/services/data-text.service';
import { DataService } from 'src/app/services/data.service';
import { Router } from '@angular/router';

declare var MercadoPago: any; // Declaração do MercadoPago como variável global

@Component({
  selector: 'app-wallets',
  templateUrl: './wallets.page.html',
  styleUrls: ['./wallets.page.scss'],
})
export class WalletsPage implements OnInit, AfterViewInit {
  currentBalance = 0;
  rechargeAmount = 100;
  private mp: any;
  private bricksBuilder: any;
  private cardPaymentBrickController: any;
  private token: string | null = null;

  constructor(
    private db: DatabaseService,
    public dataService: DataService,
    public dataText: DataTextService,
    private walletService: WalletService,
    private toastCtrl: ToastController,
    private router: Router,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    // Carrega o saldo quando o componente é inicializado    
  }

  ngAfterViewInit() {    
  }

  ionViewWillEnter() {
    if (this.dataService.isHome) {
      this.startInterface();
    } else {
      this.router.navigate(['/login']);
    }
  }


  ionViewWillLeave() {
    if (this.cardPaymentBrickController) {
      this.cardPaymentBrickController.unmount();
    }
  }

  startInterface() {  
    this.loadBrick();  
    this.loadBalance();
  }

  async loadBrick() {
    const loading = await this.presentLoading('Carregando sistema de pagamento...');

    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.async = true;
    script.defer = true;

    script.onload = async () => {
      console.log('SDK do Mercado Pago carregado com sucesso.');
      await loading.dismiss();
      this.initializeBrick();
    };

    script.onerror = async () => {
      console.error('Erro ao carregar o SDK do Mercado Pago.');
      await loading.dismiss();
      this.presentToast('Erro ao carregar o sistema de pagamento. Tente novamente mais tarde.', 'danger');
    };

    document.head.appendChild(script);
  }

  initializeBrick() {
    if (typeof MercadoPago === 'undefined') {
      console.error('MercadoPago não está definido. Verifique se o SDK foi carregado corretamente.');
      return;
    }
  
    this.mp = new MercadoPago(environment.MERCADO_PAGO_PUBLICKEY, {
      locale: 'pt-BR',
    });
  
    this.bricksBuilder = this.mp.bricks();
  
    const settings = {
      initialization: {
        amount: this.rechargeAmount || 0,
      },
      customization: {
        visual: {
          style: {
            theme: 'bootstrap',
          },
        },
        
        paymentMethods: {
          ticket: "all",
          bankTransfer: "all",
          creditCard: "all",
          debitCard: "all",
          mercadoPago: "all",
        },
      },
      callbacks: {
        onSubmit: (cardFormData: any) => {
          
          return new Promise<void>((resolve, reject) => {
            cardFormData.userId = this.dataService.userInfo.userId;

            this.walletService.processPayment(cardFormData).subscribe({
              next: (response) => {
                if (response.success) {
                  resolve();
                  this.presentToast('Pagamento realizado com sucesso!', 'success');
                  this.loadBalance();
                  this.cardPaymentBrickController.unmount();
                } else {
                  reject();
                  this.presentToast(response.message || 'Erro ao processar pagamento.', 'danger');
                }
              },
              error: (error) => {
                reject();
                console.error('Erro ao processar pagamento:', error);
                this.presentToast('Erro ao processar pagamento.', 'danger');
              },
            });
          });
        },
        onReady: () => {
          this.brickLoaded();                    
        },
        onError: (error: any) => {
          console.error('Erro no Brick:', error);
          this.presentToast('Erro no sistema de pagamento.', 'danger');
        },
      },
    };
  
    this.bricksBuilder
      .create('payment', 'paymentBrick_container', settings)
      .then((controller: any) => {
        this.cardPaymentBrickController = controller;
      })
      .catch((error: any) => {
        console.error('Erro ao criar o Brick:', error);
        this.presentToast('Erro ao iniciar o sistema de pagamento.', 'danger');
      });
  }
  
  async submitPayment() {
    if (this.cardPaymentBrickController) {
      this.cardPaymentBrickController.submit();
    } else {
      this.presentToast('Sistema de pagamento não está pronto.', 'danger');
    }
  }


  loadBalance() {
    const userId = this.dataService.userInfo.userId;

    this.walletService.getBalance(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentBalance = response.balance;
        } else {
          console.error('Erro ao carregar saldo:', response.message);
        }
      },
      error: (error) => {
        console.error('Erro ao carregar saldo:', error);
      },
    });
  }


  async presentToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 3000,
      position: 'top',
    });
    toast.present();
  }

  async presentLoading(message: string) {
    const loading = await this.loadingCtrl.create({
      message,
      spinner: 'crescent',
    });
    await loading.present();
    return loading;
  }


  brickLoaded() {
    console.log('Brick carregado com sucesso.');
  }
  
  

}
