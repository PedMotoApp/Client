import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { FCMPluginOnIonic } from 'cordova-plugin-fcm-with-dependecy-updated/ionic';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private platform: Platform, 
    private fcm: FCMPluginOnIonic,
    private router: Router) {}
  
  getFCMToken(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.platform.ready();

       
        this.fcm.requestPushPermission()
        .then((permission) => {                    

          if(permission){
            this.fcm.getToken()
            .then((token) => {
              console.log('Token FCM:', token);
              resolve(token);
            })
            .catch(() => {
              console.error('Erro ao obter o token FCM.');
            });
          }
            
          else 
            console.log('Permissão de notificação negada.');
          

        })
        .catch(() => {
          console.error('Erro ao solicitar permissão de notificação.');
        })
        
      } catch (error) {
        console.error('Erro ao obter o token FCM:', error);
        reject('Erro ao obter o token FCM.');
      }
    });
  }


  initFCM() {
    this.platform.ready().then(() => {
      this.fcm.onNotification().subscribe((data: any) => {
        console.log('Notificação recebida:', data);

        if (data.wasTapped) {
          // Notificação clicada (em segundo plano)
          this.handleNotification(data);
        } else {
          // Notificação recebida em primeiro plano
          this.showNotification(data);
        }
      });
    });
  }

  handleNotification(data: any) {
    if (data.page) {
      this.router.navigateByUrl(data.page);
    }
  }

  showNotification(data: any) {
    // Mostre um alerta ou toast com a mensagem da notificação
    alert(`${data.title}: ${data.body}`);
  }
}
