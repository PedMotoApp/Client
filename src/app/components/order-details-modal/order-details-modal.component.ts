import { Component, Input } from '@angular/core';
import { ModalController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.scss'],
})
export class OrderDetailsModalComponent {
  @Input() order: any;
  @Input() driverCommission: number;

  constructor(
    private modalCtrl: ModalController,
    private alertCtrl: AlertController
  ) {}

  async dismiss() {
    await this.modalCtrl.dismiss();
  }

  async confirmAcceptOrder() {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar Aceitação',
      message: 'Deseja aceitar este pedido?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Aceitar',
          handler: () => {
            this.modalCtrl.dismiss({ accepted: true });
          }
        }
      ]
    });
    await alert.present();
  }
}