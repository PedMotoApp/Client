import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams, AlertController } from '@ionic/angular';
import { DataTextService } from 'src/app/services/data-text.service';
import { DataService } from 'src/app/services/data.service';

@Component({
  selector: 'app-rating-modal',
  templateUrl: './rating-modal.component.html',
  styleUrls: ['./rating-modal.component.scss'],
})
export class RatingModalComponent implements OnInit {
  order: any;
  rating = 0;
  comment = '';
  stars = [1, 2, 3, 4, 5];
  currentMessage: string = '';

  constructor(
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private alertCtrl: AlertController,
    public dataText: DataTextService,
    public dataService: DataService
  ) {}

  ngOnInit() {
    this.order = this.navParams.get('order');
    console.log('Order recebido no modal:', this.order);
    this.currentMessage = this.dataText.getText('ratingModalMessage');

  }

  setRating(value: number) {
    this.rating = value;
  }

  async confirmRating() {
    const alert = await this.alertCtrl.create({
      header: this.dataText.getText('confirm'),
      message: this.dataText.getText('confirmRatingMessage'),
      buttons: [
        {
          text: this.dataText.getText('cancel'),
          role: 'cancel',
        },
        {
          text: this.dataText.getText('confirm'),
          handler: () => this.submitRating(),
        },
      ],
    });

    await alert.present();
  }

  submitRating() {
    if (this.rating < 1 || this.rating > 5) {
      return; // Não salva se a nota for inválida
    }

    this.modalCtrl.dismiss({
      rating: this.rating,
      comment: this.comment,
      timestamp: new Date().toISOString(),
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  goBack() {
    this.dismiss();
  }
}
