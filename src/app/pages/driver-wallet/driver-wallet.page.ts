import { Component, OnInit } from '@angular/core';
import { WalletService } from 'src/app/services/wallet.service';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { DataTextService } from 'src/app/services/data-text.service';
import { DataService } from 'src/app/services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-driver-wallet',
  templateUrl: './driver-wallet.page.html',
  styleUrls: ['./driver-wallet.page.scss'],
})
export class DriverWalletPage implements OnInit {
  currentBalance = 0;
  withdrawalHistory: any[] = []; // Histórico de retiradas

  constructor(
    private walletService: WalletService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    public dataText: DataTextService,
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit() {}

  ionViewWillEnter() {
    if (this.dataService.isHome) {
      this.loadBalance();
      this.loadWithdrawalHistory();
    } else {
      this.router.navigate(['/login']);
    }
  }

  loadBalance() {
    const userId = this.dataService.userInfo.userId;

    this.walletService.getBalance(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentBalance = response.balance;
        }
      },
      error: (error) => {
        console.error('Erro ao carregar saldo:', error);
        this.presentToast(this.dataText.getText('loadBalanceError'), 'danger');
      },
    });
  }

  loadWithdrawalHistory() {
    const userId = this.dataService.userInfo.userId;

    this.walletService.getWithdrawalHistory(userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.withdrawalHistory = response.history;
        }
      },
      error: (error) => {
        console.error('Erro ao carregar histórico de retiradas:', error);
        this.presentToast(this.dataText.getText('loadHistoryError'), 'danger');
      },
    });
  }

  async confirmWithdrawal() {
    const withdrawalAmount = Math.floor(this.currentBalance); // Alterado para retirar o saldo total sem decimais

    if (withdrawalAmount <= 0) {
      this.presentToast(this.dataText.getText('invalidWithdrawalAmount'), 'danger');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.dataText.getText('confirm'),
      message: `${this.dataText.getText('confirmWithdrawal')} R$ ${withdrawalAmount}?`,
      buttons: [
        {
          text: this.dataText.getText('cancel'),
          role: 'cancel',
        },
        {
          text: this.dataText.getText('confirm'),
          handler: () => {
            this.requestWithdrawal(withdrawalAmount);
          },
        },
      ],
    });

    await alert.present();
  }

  async requestWithdrawal(amount: number) {
    const loading = await this.presentLoading(this.dataText.getText('processingWithdrawal'));

    const userId = this.dataService.userInfo.userId;

    this.walletService.requestWithdrawal(userId, amount).subscribe({
      next: async (response) => {
        await loading.dismiss();
        if (response.success) {
          this.presentToast(response.message, 'success');
          this.loadBalance();
          this.loadWithdrawalHistory();
        } else {
          this.presentToast(response.message, 'danger');
        }
      },
      error: async (error) => {
        await loading.dismiss();
        console.error('Erro ao solicitar retirada:', error);
        this.presentToast(this.dataText.getText('withdrawalError'), 'danger');
      },
    });
  }

  buyToken() {
    window.open('https://token.pedmoto.com.br', '_blank'); // Substitua pela URL real de compra do token
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
}
