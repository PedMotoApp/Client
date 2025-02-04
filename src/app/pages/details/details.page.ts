import { Component, OnInit } from '@angular/core';
import { DataTextService } from 'src/app/services/data-text.service';
import { DataService } from 'src/app/services/data.service';
import { DatabaseService } from 'src/app/services/database.service';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { UiUtilsService } from 'src/app/services/ui-utils.service';
import { PricingService } from 'src/app/services/pricing.service';
import { WalletService } from 'src/app/services/wallet.service'; 


@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {

  ratingValue: number = 0;
  currentPointIndex: number = 0;
  ratingComment: string = '';
  currentOrderOriginal: any = []

  constructor(
    private db: DatabaseService,
    public dataService: DataService,
    public dataText: DataTextService,
    private router: Router,
    private uiUtils: UiUtilsService,
    private priceService: PricingService,
    private walletService: WalletService, 
    private alertController: AlertController,
    private toastCtrl: ToastController
  ) {}



  ionViewWillEnter() {
    this.initializePage();
  }

  initializePage() {
    if (!this.dataService.isHome) {
      this.router.navigate(['/login']);
      return;
    }

    this.initializeCurrentPointIndex();
    this.listenToOrderStatus()
  }

  ngOnInit() {
    
  }

  initializeCurrentPointIndex() {
    let arrivedIndex = this.dataService.selectedOrder.dropPoints.findIndex(point => point.status === 'Cheguei');
  
    if (arrivedIndex !== -1) {
      this.currentPointIndex = arrivedIndex;
    } else {
      this.currentPointIndex = this.dataService.selectedOrder.dropPoints.findIndex(point => point.status === 'Aguardando');
    }
  
    console.log('Ponto atual:', this.currentPointIndex);
  }
  
  
  updateCurrentPointIndex() {
    const currentPoint = this.dataService.selectedOrder.dropPoints[this.currentPointIndex];
  
    if (currentPoint && (currentPoint.status === 'Concluído' || currentPoint.status === 'Cancelado')) {
      this.currentPointIndex = this.dataService.selectedOrder.dropPoints.findIndex(point => point.status === 'Aguardando');
    }
  
  }
        
  markAsArrived(point: any) {
    if (point.status === 'Aguardando') {
      point.status = 'Cheguei';
      point.arrivedAt = new Date().toISOString();
      this.db.updateDocument(`orders/${this.dataService.selectedOrder.key}`, { dropPoints: this.dataService.selectedOrder.dropPoints });
      console.log(`Ponto atualizado para "Cheguei": ${point.description}`);
    }
  }
  
  
  markAsCompleted(point: any) {
    if (point.status === 'Cheguei') {
      point.status = 'Concluído';
      point.completedAt = new Date().toISOString();
      this.db.updateDocument(`orders/${this.dataService.selectedOrder.key}`, { dropPoints: this.dataService.selectedOrder.dropPoints });
      console.log(`Ponto atualizado para "Concluído": ${point.description}`);
      
      this.updateCurrentPointIndex();
      this.checkIfOrderCompleted();
    }
  }
      
  async cancelOrder(point: any) {
    const alert = await this.alertController.create({
      header: 'Cancelar Entrega',
      message: 'Por favor, selecione um motivo para o cancelamento:',
      inputs: [
        { type: 'radio', label: 'Cliente ausente', value: 'Cliente ausente' },
        { type: 'radio', label: 'Endereço inválido', value: 'Endereço inválido' },
        { type: 'radio', label: 'Pedido cancelado pelo cliente', value: 'Pedido cancelado pelo cliente' },
        { type: 'radio', label: 'Outro motivo', value: 'Outro motivo' },
      ],
      buttons: [
        { text: 'Voltar', role: 'cancel' },
        {
          text: 'Confirmar',
          handler: async (reason) => {
            point.status = 'Cancelado';
            point.cancellationReason = reason;
            point.cancelledAt = new Date().toISOString();
  
            await this.db.updateDocument(`orders/${this.dataService.selectedOrder.key}`, {
              dropPoints: this.dataService.selectedOrder.dropPoints,
            });
  
            this.updateCurrentPointIndex();
            this.checkIfOrderCompleted();
          },
        },
      ],
    });
  
    await alert.present();
  }
  


  checkIfOrderCompleted() {

    const allHandled = this.dataService.selectedOrder.dropPoints.every(
      (point) => point.status === 'Concluído' || point.status === 'Cancelado'
    );
  
    if (allHandled) {

      const key = this.dataService.selectedOrder.key

      this.dataService.selectedOrder.status = 'Finalizado';
      this.db.updateDocument(`orders/${this.dataService.selectedOrder.key}`, { status: 'Finalizado' });  

      this.saveOrderAsHistory(key);

      
      
    }
  }
  
  
  async saveOrderAsHistory(key) {
    try {
      this.uiUtils.showLoading("Salvando ordem no histórico...")
      .then(async (loading) => {
        await loading.dismiss();

        const historyData = {
          ...this.dataService.selectedOrder,
          status: 'Finalizado',
          finalizedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };

        await this.db.addToCollection('orderHistory', historyData);                
        await this.db.removeDocument(`orders/${key}`);
        
        const historyDataPayment = {
          serviceId: this.dataService.selectedOrder.key,
          driverId: this.dataService.userInfo.userId,
          userId: this.dataService.selectedOrder.userId,
          amount: this.dataService.selectedOrder.servicesPrices.driverEarnings,
          finalizedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        };

        
        await this.walletService.addOrderToHistory(historyDataPayment).toPromise();

        this.uiUtils.showToast(this.dataText.getText('orderCompleted'));
        this.dataService.selectedOrder = null;

        const targetRoute = this.dataService.userInfo.userType === 2 ? '/driver' : '/home';
        this.router.navigate([targetRoute]);

      });


    } catch (error) {
      console.error('Erro ao salvar ordem no histórico:', error);
      this.uiUtils.showToast(this.dataText.getText('orderSaveError'));
    } 


  }


  goBack(){
    if(this.dataService.appUserType === 2){
      this.router.navigate(['/driver']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  listenToOrderStatus() {
    
    let currentPointStatuses: { [key: number]: string } = {};
  
    if (!this.dataService.selectedOrder) {
      console.warn('Nenhuma ordem ativa encontrada.');
      return;
    }

    let key = this.dataService.selectedOrder.key
    console.log('this.dataService.selectedOrder.key', key)

    if(!key){
        key = this.currentOrderOriginal.key
        console.log('this.currentOrderOriginal.key', key)
    }

  
    this.db.listenToDocument(`orders/${key}`).subscribe(async (order: any) => {
      if (order) {
        this.dataService.selectedOrder = order;

        if(!this.currentOrderOriginal)
          this.currentOrderOriginal = order


        // Monitorar mudança de status dos pontos de entrega
        order.dropPoints.forEach(async (point: any, index: number) => {
          if (currentPointStatuses[index] !== point.status) {
            currentPointStatuses[index] = point.status;
            await this.notifyPointStatusChange(point, index);
          }
        });      
  
      } else {
        console.log('Ordem não encontrada no Firebase.');      
        this.router.navigate(['/driver']);
      }
    });
  }
  

  
  async notifyPointStatusChange(point: any, index: number) {
    console.log(`Mudança no ponto ${index + 1}:`, point.status);
  
    const toast = await this.toastCtrl.create({
      message: `O status do ponto ${index + 1} mudou para: ${point.status}`,
      duration: 3000,
      position: 'top',
      color: 'warning',
    });
  
    await toast.present();
  }      
  

}
