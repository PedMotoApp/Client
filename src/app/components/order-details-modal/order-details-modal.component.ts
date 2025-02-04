import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-order-details-modal',
  templateUrl: './order-details-modal.component.html',
  styleUrls: ['./order-details-modal.component.scss'],
})
export class OrderDetailsModalComponent {
  @Input() order: any;
  @Input() driverCommission: number;

  constructor(private modalCtrl: ModalController) {}

  
  dismiss() {
    this.modalCtrl.dismiss();
  }

  acceptOrder() {
    this.modalCtrl.dismiss({ accepted: true });
  }
}
