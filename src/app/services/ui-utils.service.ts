import { Injectable } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { DataTextService } from '../services/data-text.service';


@Injectable({
  providedIn: 'root'
})
export class UiUtilsService {
  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    public dataText: DataTextService,
    private loadingCtrl: LoadingController
  ) {}

  async showLoading(message: string): Promise<HTMLIonLoadingElement> {
    const loading = await this.loadingCtrl.create({
      message: message,
      spinner: 'crescent',
      duration: 10000
    });
    await loading.present();
    return loading;
  }

  async showLoadingTimer(title: string) {
    const loading = await this.loadingCtrl.create({
      message: title,
      duration: 900000 * 10
    });
    await loading.present();
    return loading;
  }

  async showAlert(title: string, message: string): Promise<HTMLIonAlertElement> {

    
    const alert = await this.alertCtrl.create({
      header: title,
      message: message,
      buttons: ['OK']
    });
    await alert.present();
    return alert;
  }
  

  showConfirm(title: string, subtitle: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: title,
        message: subtitle,
        buttons: [
          {
            text: this.dataText.getText('no'),
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: this.dataText.getText('yes'),
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }

  async showToast(msg: string) {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 4000,
      position: 'bottom'
    });
    toast.present();
  }

  
  async showAlertTimeout(title: string, message: string) {
    const alert = await this.showAlert(title, message);
    setTimeout(() => alert.dismiss(), 3000); // Dismiss after timeout
  }

  showAlertError(msg: string) {
    return this.showAlertTimeout(this.dataText.getText('attention'), msg);
  }

  showAlertSuccess(msg: string) {
    return this.showAlertTimeout(this.dataText.getText('success'), msg);
  }

  presentPrompt(title: string, placeholder: string): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: title,
        inputs: [{ name: 'response', placeholder }],
        buttons: [
          { text: this.dataText.getText('cancel'), role: 'cancel', handler: () => resolve(null) },
          {
            text: this.dataText.getText('send'),
            handler: (data) => resolve(data.response)
          }
        ]
      });
      await alert.present();
    });
  }

  presentPromptNumber(title: string, placeholder: string): Promise<string | null> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: title,
        inputs: [{ name: 'response', placeholder, type: 'number' }],
        buttons: [
          { text: this.dataText.getText('cancel'), role: 'cancel', handler: () => resolve(null) },
          {
            text: this.dataText.getText('send'),
            handler: (data) => resolve(data.response)
          }
        ]
      });
      await alert.present();
    });
  }

  async presentAlert(title, subtitle, message) {

    const alert = await this.alertCtrl.create({
      backdropDismiss:false,
      cssClass: 'my-custom-class',
      header: title,
      subHeader: subtitle,
      message: message,
      buttons: ['Beleza']
      
    });

    await alert.present();
    
    const { role } = await alert.onDidDismiss();
    console.log('onDidDismiss resolved with role', role);
  }


  async presentAlertSuccess(subtitle, message) {
    return this.presentAlert("Sucesso", subtitle, message)
  }

  async presentAlertErr(subtitle, message) {
    return this.presentAlert("Erro", subtitle, message)
  }

  async presentToast(msg = 'Nenhum resultado.') {
    const toast = await this.toastCtrl.create({
      message: msg,
      duration: 2000
    });
    toast.present();
  }

}
