import { Component, OnInit } from '@angular/core';
import { DatabaseService } from 'src/app/services/database.service';
import { DataService } from 'src/app/services/data.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { DataTextService } from 'src/app/services/data-text.service';
import { GeolocationService } from 'src/app/services/geolocation.service';
import { AuthService } from 'src/app/services/auth.service';
import { ModalController } from '@ionic/angular';
import { OrderDetailsModalComponent } from 'src/app/components/order-details-modal/order-details-modal.component';
import { WalletService } from 'src/app/services/wallet.service';
import { ToastController } from '@ionic/angular';
import { MessageService } from 'src/app/services/message.service';
import { NotificationService } from  'src/app/services/notification.service';
import { Storage } from '@ionic/storage';
import { OnboardingPage } from '../onboarding/onboarding.page';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-driver-home',
  templateUrl: './driver-home.page.html',
  styleUrls: ['./driver-home.page.scss'],
})
export class DriverHomePage implements OnInit {
  
  availableOrders: any[] = [];
  recommendations: any[] = [];
  driverCommission = 0.1; 
  locationUpdateInterval: any;
  googleMapsLoaded: boolean = false;
  showGeneralData: boolean = false;

  overview = {
    totalServices: 0,
    totalEarnings: 0,
    totalClients: 0,
    onlineDrivers: 0,
    walletBalance: 0,
    dailyEarnings: 0,
    monthlyEarnings: 0,
  };
  
  dailyEarnings = 0;
  monthlyEarnings = 0;

  msgInfoVisible: boolean = true;
  currentMessage: string;
  hasSeenOnboarding: boolean = false;

  constructor(
    private db: DatabaseService,
    public dataService: DataService,
    private router: Router,
    public authService: AuthService,
    public dataText: DataTextService,    
    private walletService: WalletService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private geolocationService: GeolocationService,
    private messageService: MessageService,
    public notificationService: NotificationService,
    private modalController: ModalController,
    public storage: Storage,
    
  ) {}

  async ngOnInit() {
    await this.storage.create(); // Inicializa o Storage
    await this.loadGoogleMapsApi();
    
  }

  async ensureLocationPermission() {
    try {
      const hasPermission = await this.geolocationService.checkLocationPermission();
      if (!hasPermission) {
        console.warn('❌ Location permission denied.');
        return;
      }

      console.log('✅ Location permission granted.');
      
    } catch (error) {
      console.error('❌ Error checking location permission:', error);
    }
  }


  async loadGoogleMapsApi(): Promise<void> {
    if (this.googleMapsLoaded) return;
  
    //const key = "AIzaSyBW86YtgtmOHTvHl0uWvjfol_H6t4SeDzU";
    const key = environment.firebaseConfig.apiKey;  
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
  
    script.onload = () => {
      console.log("Google Maps API loaded");
      this.googleMapsLoaded = true;
    };
  
    script.onerror = (error) => {
      console.error("Error loading Google Maps API", error);
    };
  
    document.body.appendChild(script);
  }
  

  async ionViewWillEnter() {
    if (this.dataService.isHome) {
      this.startInterface();
    } else {
      this.router.navigate(['/login']);
    }
  }

  async startInterface() {
    this.loadOverview();
    this.startNotifications();
    this.loadDriverStats();

    await this.ensureLocationPermission();    
    
    await this.startLocationUpdates();
    this.listenToOrderStatus();

    this.hasSeenOnboarding = (await this.storage.get('hasSeenOnboarding')) || false;
    //this.hasSeenOnboarding = false

    if (!this.hasSeenOnboarding) {
      this.showOnboarding();
    }
  }

  async showOnboarding() {
      const modal = await this.modalController.create({
        component: OnboardingPage,
        cssClass: 'onboarding-modal',
        backdropDismiss: false, // Prevent accidental dismiss
      });
    
      await modal.present();
      await modal.onDidDismiss();
    
      // Salva no storage para não exibir novamente
      await this.storage.set('hasSeenOnboarding', true);
    }


  startNotifications(){
    this.notificationService
    .getFCMToken()
    .then((token) => {
              
      const userId = this.dataService.userInfo.userId;
      this.db.updateDocument(`userTokens/${userId}`, { token });
      this.notificationService.initFCM();
    })
    .catch((error) => {
      console.error('Erro ao inicializar FCM:', error);
    });

  }

  loadOverview() {

    this.displayRandomMessage()

    this.db.getCollection('recomendacoes', (ref) =>
      ref.orderByKey())
    .then((recommendations: any[]) => {

      console.log('Recomendações carregadas:', recommendations);
      this.recommendations = recommendations;
    });

  }

  displayRandomMessage() {
    this.currentMessage = this.messageService.getRandomMessage();
    setTimeout(() => {
      this.msgInfoVisible = false;
    }, 15000); 
  }

  async listenToOrderStatus() {
    
    this.db.listenToDocument(`orders`).subscribe(async (orders: any) => {
        if (orders) {
            this.availableOrders = [];

            const latitude = this.dataService.userInfo.latitude
            const longitude = this.dataService.userInfo.longitude

            console.log('')

            const ordersArray = Array.isArray(orders)
                ? orders
                : Object.keys(orders).map((key) => ({
                      key,
                      ...orders[key],
                  }));

            for (const order of ordersArray) {
                console.log('📌 Pedido:', order.key, order.status);

                if (order.status === 'Cancelado' || order.status === 'Finalizado') {
                    console.log(`🗑️ Removendo ordem ${order.key} (${order.status})`);
                    continue;
                }

                if (order.status === 'Aceito') {
                    const currentUserId = this.dataService.userInfo?.userId;

                    if (order.driverId === currentUserId) {
                        console.log('🚗 Você está em uma corrida:', order);
                        this.dataService.selectedOrder = order;
                        this.router.navigate(['/details']);
                        return;
                    }
                }



                if (order.status === 'Aguardando') {
                    const collectionPoint = order.dropPoints[0]?.description;

                    if (collectionPoint && latitude !== null && longitude !== null) {
                        try {

                            const { distance, duration } = await this.geolocationService.calculateDistanceAndTime(
                                `${latitude},${longitude}`,
                                collectionPoint
                            );

                            order.collectionDistance = `${distance.toFixed(2)} km`;
                            order.collectionTime = `${Math.ceil(duration)} min`;
                        } catch (error) {
                            console.error('Erro ao calcular distâncias:', error);
                            order.collectionDistance = 'Erro';
                            order.collectionTime = 'Erro';
                        }
                    }

                    if (order.dropPoints && order.dropPoints.length > 1) {
                        for (let i = 0; i < order.dropPoints.length - 1; i++) {
                            const currentPoint = order.dropPoints[i]?.description;
                            const nextPoint = order.dropPoints[i + 1]?.description;

                            if (currentPoint && nextPoint) {
                                try {
                                    const { distance, duration } = await this.geolocationService.calculateDistanceAndTime(
                                        currentPoint,
                                        nextPoint
                                    );
                                    order.dropPoints[i].distanceToNext = `${distance.toFixed(2)} km`;
                                    order.dropPoints[i].timeToNext = `${Math.ceil(duration)} min`;
                                } catch (error) {
                                    console.error('Erro ao calcular distâncias:', error);
                                    order.dropPoints[i].distanceToNext = 'Erro';
                                    order.dropPoints[i].timeToNext = 'Erro';
                                }
                            }
                        }
                    }
                }

                this.availableOrders = ordersArray;
            }

            this.showGeneralData = this.availableOrders.length === 0;
        } else {
            console.log('Nenhuma ordem disponível no Firebase.');
        }
    });
}

  
  
  async viewDetails(order: any) {
    const modal = await this.modalCtrl.create({
      component: OrderDetailsModalComponent,
      componentProps: {
        order: order,
        driverCommission: this.driverCommission,
      },
    });
  
    modal.onDidDismiss().then((result) => {
      if (result.data?.accepted) {
        this.acceptOrder(order);
      }
    });
  
    await modal.present();
  }
  
  
  async confirmAcceptOrder(order: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar',
      message: 'Você deseja aceitar este serviço?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Aceitar',
          handler: () => {
            this.acceptOrder(order);
          },
        },
      ],
    });
  
    await alert.present();
  }

  async acceptOrder(order: any) {

    const userId = this.dataService.userInfo.userId;
    const amountToDecrease = Number(order?.servicesPrices?.totalPrice) || 10;
    
    try {

      await this.db.updateDocument(`orders/${order.key}`, {
        status: 'Aceito',
        driverId: userId,
        driver: this.dataService.userInfo,
        datetime: new Date().toISOString(),
      });
  
      
      let isTest = true

      if(! this.dataService.userInfo.assinante){
        const response = await this.walletService.decreaseBalance(order.userId, amountToDecrease).toPromise();
        const responseOk = response.success      
        isTest = responseOk
      }
  
      if (isTest) {
         this.presentToast(`Saldo separado com sucesso! Começando serviço!`, 'success');
        this.dataService.selectedOrder = order;
        this.router.navigate(['/details']);

      } else {
        this.presentToast('Saldo não pôde ser atualizado. Tente novamente.', 'danger');
      }
  
      
    } catch (error) {
      console.error('Erro ao aceitar pedido ou atualizar saldo:', error);
      this.presentToast('Erro ao processar a solicitação. Tente novamente.', 'danger');
    }
  }

  async saveLatLong(lat: string, long: string) {
    const userId = this.dataService.userInfo.userId;
    await this.db.updateDocument(`/userProfile/${userId}`, {
      latitude: lat,
      longitude: long,
    });
  }

  async saveLastSeen(lastDatetime: string) {
    const userId = this.dataService.userInfo.userId;
    await this.db.updateDocument(`/userProfile/${userId}`, {
      lastDatetime,
    });
  }

  
  async startLocationUpdates() {
    try {
      this.locationUpdateInterval = this.geolocationService.watchPosition().subscribe(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.updateDriverLocation(latitude, longitude);
        },
        (error) => console.error('❌ Error getting location:', error)
      );
    } catch (error) {
      console.error('❌ Error starting location updates:', error);
    }
  }

  async updateDriverLocation(lat: number, long: number) {
    const userId = this.dataService.userInfo.userId;
    await this.db.updateDocument(`/userProfile/${userId}`, { latitude: lat, longitude: long });
  }

  ngOnDestroy() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }
  }

  toggleGeneralData() {
    this.showGeneralData = !this.showGeneralData;
  }
  
  logout() {
    this.authService.logoutUser().then(() => {
      this.dataService.isHome = false;
      this.router.navigate(['/login']);
    });
  }

  goToWallets() {  
    this.router.navigate(['/driver-wallet']);
  }
  
  goToProfile() {
    this.router.navigate(['/user-profile']);
  }

  goToHistory() {
    this.router.navigate(['/history']);
  }

  async loadDriverStats() {
    const userId = this.dataService.userInfo?.userId;
    if (!userId) {
      console.error('Usuário não autenticado.');
      return;
    }
  
    try {
      const orders = await this.db.getCollection('orderHistory', (ref) =>
        ref.orderByChild('driverId').equalTo(userId)
      );
  
      if (orders) {
        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().getMonth(); 
        
        this.overview.totalServices = orders.length;
  
        this.overview.totalEarnings = orders.reduce((sum, order) => {
          const earnings = parseFloat(order.servicesPrices?.driverEarnings || '0');
          return sum + earnings;
        }, 0);
  
        this.overview.monthlyEarnings = orders
          .filter(order => {
            const finalizedDate = new Date(order.finalizedAt);
            return finalizedDate.getMonth() === currentMonth;
          })
          .reduce((sum, order) => {
            const earnings = parseFloat(order.servicesPrices?.driverEarnings || '0');
            return sum + earnings;
          }, 0);
  
        this.overview.dailyEarnings = orders
          .filter(order => order.finalizedAt.startsWith(today))
          .reduce((sum, order) => {
            const earnings = parseFloat(order.servicesPrices?.driverEarnings || '0');
            return sum + earnings;
          }, 0);
  
        console.log('Estatísticas do entregador carregadas:', this.overview);
      } else {
        console.warn('Nenhuma ordem finalizada encontrada para este entregador.');
        this.overview = {
          totalServices: 0,
          totalEarnings: 0,
          monthlyEarnings: 0,
          dailyEarnings: 0,
          totalClients: 0,
          onlineDrivers: 0,
          walletBalance: 0,
        };
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas do entregador:', error);
    }
  }
  
  viewRecommendation(recommendation) {
    console.log('viewRecommendation', recommendation);
    const url = recommendation.url;
    if (url) {
      window.open(url, '_blank');
    }
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
