import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { DatabaseService } from 'src/app/services/database.service';
import { DataTextService } from 'src/app/services/data-text.service';
import { DataService } from 'src/app/services/data.service';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

import autoTable from 'jspdf-autotable';

import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';

import { RatingModalComponent } from 'src/app/components/rating-modal/rating-modal.component';


@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
})
export class HistoryPage implements OnInit {

  orders: any[] = [];
  filteredOrders: any[] = [];
  filter = {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    endDate: new Date().toISOString(),
    status: '',
  };

  constructor(
    private db: DatabaseService, 
    public dataService: DataService,    
    public dataText: DataTextService,
    private router: Router,
    private alertController: AlertController,
    private modalCtrl: ModalController,
    private loadingController: LoadingController,
    private toastCtrl: ToastController) {}

  ngOnInit() {
    
  }


  ionViewWillEnter() {

    if (this.dataService.isHome) {
        this.startInterface()
    } else {
      this.router.navigate(['/login']);
    }    
  }
  
  startInterface(){
    const userInfo = this.dataService.userInfo;

    console.log('userInfo', userInfo)

    if (userInfo && userInfo.userId) {
      this.loadOrders();
    } else {
      console.error('Usuário não encontrado ou não logado.');
    }
  }

  async loadOrders() {
    try {
      const userInfo = this.dataService.userInfo;
      const userId = userInfo && userInfo.userId;
      const filterField = this.dataService.appUserType === 2 ? 'driverId' : 'userId';

      console.log('Carregando histórico de pedidos para o usuário:', userId);
            
      this.orders = await this.db.getCollection('orderHistory', (ref) =>
        ref.orderByChild(filterField).equalTo(userId)
      );

      this.applyFilters();
    } catch (error) {
      console.error('Erro ao carregar histórico de pedidos:', error);
    }
  }

  applyFilters() {
    const { startDate, endDate, status } = this.filter;

    console.log(startDate, endDate, status)
    this.filteredOrders = this.orders
      .filter((order) => {
        const orderDate = new Date(order.createdAt).getTime();
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return (
          orderDate >= start &&
          orderDate <= end &&
          (status ? order.status === status : true)
        );
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    this.filteredOrders = this.filteredOrders.map((order) => {
      const totalDistance = order.dropPoints.reduce(
        (acc, point) => acc + (point.distanceFromPrevious || 0),
        0
      );

      const totalTime = order.dropPoints.reduce(
        (acc, point) => acc + (point.timeFromPrevious || 0),
        0
      );

      return {
        ...order,
        aggregated: {
          totalDistance: totalDistance.toFixed(2), 
          totalTime: (totalTime * 60).toFixed(0), 
        },
      };
  });
}


  goBack() {
    let page = '/home'

    if(this.dataService.userInfo.userType === 2)
      page = 'driver'

    this.router.navigate([page]);
  }


  exportToExcel() {
    const worksheet = XLSX.utils.json_to_sheet(this.filteredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Historico');
    XLSX.writeFile(workbook, `Historico-${new Date().toISOString()}.xlsx`);
    this.presentToast('Atenção', 'Excel gerado com sucesso.');
  }

  exportToPDF() {
    const doc = new jsPDF();
  
    // Adicionar título
    doc.setFontSize(16);
    doc.text('Histórico de Pedidos', 14, 20);
    
    
  
    // Configurar colunas
    const columns = [
      this.dataText.getText('date'),
      this.dataText.getText('addresses'),
      this.dataText.getText('status'),
      this.dataText.getText('distance'),
    ];
  
    // Configurar linhas
    const rows = this.filteredOrders.map((order) => [
      new Date(order.createdAt).toLocaleDateString(), // Data formatada
      order.dropPoints.map((point) => point.description).join(', '), // Endereços
      order.status, // Status
      `${(order.totalDistance ?? 0).toFixed(2)} km`, // Distância total
    ]);
  
    // Gerar tabela
    autoTable(doc, {
      startY: 30, // Posição inicial da tabela
      head: [columns],
      body: rows,
      styles: { fontSize: 10 }, // Ajusta o tamanho da fonte
    });
  
    // Salvar o PDF
    doc.save(`Historico-${new Date().toISOString()}.pdf`);
    this.presentToast('Atenção', 'PDF gerado com sucesso.');
  }
  

  async viewDetails(order: any) {
    const alert = await this.alertController.create({
      header: this.dataText.getText('orderDetails'),
      message: `
        <strong>${this.dataText.getText('date')}:</strong> ${order.createdAt}<br>
        <strong>${this.dataText.getText('status')}:</strong> ${order.status}<br>
        <strong>${this.dataText.getText('distance')}:</strong> ${order.totalDistance?.toFixed(2)} km<br>
        <strong>${this.dataText.getText('addresses')}:</strong> <ul>
          ${order.dropPoints.map((point) => `<li>${point.description}</li>`).join('')}
        </ul>
      `,
      buttons: [this.dataText.getText('close')],
    });
  
    await alert.present();
  }


  async openRatingModal(order: any) {
    const userType = this.dataService.userInfo.userType;
    const ratingField = userType === 2 ? 'driverRating' : 'rating';
    const commentField = userType === 2 ? 'driverComment' : 'comment';
  
    if (order[ratingField]) {
      const alert = await this.alertController.create({
        header: this.dataText.getText('rating'),
        message: `
          <ion-icon name="star"></ion-icon> ${this.dataText.getText('alreadyRated')}: ${order[ratingField]}<br>
          <ion-icon name="chatbubble"></ion-icon> ${order[commentField]}
        `,
        buttons: [this.dataText.getText('close')],
      });
      await alert.present();
      return;
    }
  
    const modal = await this.modalCtrl.create({
      component: RatingModalComponent,
      componentProps: { order },
    });
  
    modal.onDidDismiss().then(async (result) => {
      if (result.data) {
        const { rating, comment, timestamp } = result.data;
        order[ratingField] = rating;
        order[commentField] = comment;
        order[`${ratingField}Timestamp`] = timestamp;
  
        await this.db.updateDocument(`orderHistory/${order.key}`, {
          [ratingField]: rating,
          [commentField]: comment,
          [`${ratingField}Timestamp`]: timestamp,
        });
        console.log('Avaliação salva:', rating, comment);
      }
    });
  
    await modal.present();
  }
  


  openComplaintModal(order: any){
    console.log('Abrindo modal de denúncia');
    const key = order.key;

    const alert = this.alertController.create({
      header: 'Denúncia',
      message: 'Deseja denunciar este pedido?',
      buttons: [
        {
          text: 'Sim',
          handler: async () => {
            console.log('Denunciando pedido:', key);
            await this.db.updateDocument(`orderHistory/${key}`, { complaint: true });
            this.presentToast('Atenção', 'Pedido denunciado com sucesso.');
            
          },
        },
        {
          text: 'Não',
          role: 'cancel',
        },
      ],
    });

    alert.then((a) => a.present());
    
  }



  openChatbot(order: any) {    
    
    const key = order.key;

    console.log('Abrindo chatbot para o pedido:', key);
    const alert = this.alertController.create({
      header: 'Chatbot',
      message: 'Deseja abrir o chatbot para este pedido?',
      buttons: [
        {
          text: 'Sim',
          handler: () => {
            console.log('Abrindo chatbot para o pedido:', key);
            window.open('https://chatbot.pedmoto.com.br?key=' + key, '_blank');
          },
        },
        {
          text: 'Não',
          role: 'cancel',
        },
      ],
    });

    alert.then((a) => a.present());

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
  

}
