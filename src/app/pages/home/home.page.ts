import { Component, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

import { DataService } from 'src/app/services/data.service';
import { DataTextService } from 'src/app/services/data-text.service';
import { DatabaseService } from 'src/app/services/database.service';
import { UiUtilsService } from 'src/app/services/ui-utils.service';
import { AlertController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { GeolocationService } from 'src/app/services/geolocation.service';
import { environment } from 'src/environments/environment';
import { ActionSheetController } from '@ionic/angular';
import { SuggestionsModalComponent } from '../../components/suggestions-modal/suggestions-modal.component';
import { ModalController } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'src/app/services/message.service';
import { StatsService } from 'src/app/services/stats.service';
import { WalletService } from 'src/app/services/wallet.service';
import { NotificationService } from  'src/app/services/notification.service';
import { OnboardingPage } from '../onboarding/onboarding.page';
import { Storage } from '@ionic/storage';
import { PricingService } from 'src/app/services/pricing.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit, AfterViewInit {
  signupForm: FormGroup;
  private googleMapsLoaded = false;

  map: google.maps.Map;
  directionsService: google.maps.DirectionsService;
  directionsRenderer: google.maps.DirectionsRenderer;
  routeInfo: { distance: string; duration: string } | null = null;

  markers: google.maps.Marker[] = [];
  suggestions: google.maps.places.PlaceResult[] = [];
  userLocation: google.maps.LatLng;
  timeout: any;
  mapVisible: boolean = false;
  activeInputType: string;
  loading: HTMLIonLoadingElement;

  isModalOpen: boolean = false;
  fromPrices: boolean = false; // Flag to check if navigated from Prices
  orderId: string = '';

  statusCheckTimer: any; 

  availableOrders: any[] = [];
  recommendations: any[] = [];
  debounceTimeout: any = null; // Timeout para o debounce
  
  stats: any;
  toastPresented: boolean = false
  
  msgInfoVisible: boolean = true;
  currentMessage: string;

  currentBalance: number = 0;

  serviceMsgDistance: string;
  serviceMsgTime: string;
  serviceMsgPrice: string;
  hasSeenOnboarding: boolean = false;
  showGeneralData: boolean = false

  priceTables: any[] = [];
  selectedTable: any;
  calculatedPrice: any = {};
  dropPoints: any[] = [];
  totalDistance: number = 0;
  totalTime: number = 0;


  constructor(
    private formBuilder: FormBuilder,
    public dataService: DataService,
    public dataText: DataTextService,
    private db: DatabaseService,
    public authService: AuthService,    
    private alertCtrl: AlertController,    
    private walletService: WalletService,
    private uiUtils: UiUtilsService,
    private loadingCtrl: LoadingController,
    private router: Router,
    private zone: NgZone,
    private route: ActivatedRoute,
    private geolocationService: GeolocationService,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private statsService: StatsService,    
    private messageService: MessageService,
    public notificationService: NotificationService,
    public storage: Storage,
    private priceService: PricingService,
  ) {}

  async ngOnInit() {
    this.initializeForm();
    await this.storage.create(); // Inicializa o Storage

    await this.loadGoogleMapsApi();

  }

  async ngAfterViewInit() {

    this.hasSeenOnboarding = (await this.storage.get('hasSeenOnboarding')) || false;

    console.log('Já viu o onboarding?', this.hasSeenOnboarding);
    await this.loadGoogleMapsApi()

  }

  clearInputs() {
    this.signupForm.reset();
    this.additionalDestinations.clear();
    localStorage.removeItem('dropPoints');
    this.fromPrices = false
    this.availableOrders = [];
    this.clearRoute();
  }
  

  // Load Google Maps API asynchronously
  async loadGoogleMapsApi(): Promise<void> {
    if (this.googleMapsLoaded) return;

    // Check if a Google Maps script already exists
    if (document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')) return;

    // const key = "AIzaSyBW86YtgtmOHTvHl0uWvjfol_H6t4SeDzU";
    const key = environment.firebaseConfig.apiKey;
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log("Google Maps API loaded");
      this.googleMapsLoaded = true;
      this.initializeMap()
      .then(() => {
        console.log('Mapa inicializado full')
      })
    };
    script.onerror = (error) => {
      console.error("Error loading Google Maps API", error);
    };
    document.body.appendChild(script);
  }
  
  async initializeMap() {
    if (!window.google || !google.maps) {
      console.error("Google Maps API not loaded properly.");
      return;
    }

    const mapElement = document.getElementById('map') as HTMLElement;
    if (!mapElement) {
      console.error("Map div not found in the DOM.");
      return;
    }

    try {
      const position = await this.geolocationService.getCurrentPosition();
      const location = { lat: position.coords.latitude, lng: position.coords.longitude };

      const mapOptions: google.maps.MapOptions = {
        center: location,
        zoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
      };

      this.map = new google.maps.Map(mapElement, mapOptions);

      new google.maps.Marker({
        position: location,
        map: this.map,
        title: this.dataText.getText('currentLocation'),
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        },
      });

      this.mapVisible = true;

      this.userLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer();
      this.directionsRenderer.setMap(this.map);

    } catch (error) {
      console.error("Error initializing map:", error);
    }
  }

  ionViewWillEnter() {

    if (this.dataService.isHome) {
        this.startInterface()
    } else {
      this.router.navigate(['/login']);
    }    
  }

  async startInterface() {
        
    this.startNotifications();
    this.loadTables()
    this.loadBalance()    
    this.checkStep()
    this.startNotifications()      
    this.listenToOrderStatus();
    
    this.hasSeenOnboarding = (await this.storage.get('hasSeenOnboarding')) || false;

    if (!this.hasSeenOnboarding) {
      this.showOnboarding();
    }

  }   

  loadTables() {
    this.priceService.getPriceTables().subscribe((tables) => {
      this.priceTables = tables || [];

      console.log('this.priceTables', this.priceTables)

      if (this.priceTables.length > 0) {
        this.selectedTable = this.priceTables[0];        
      }
    });
  }

  async updateCalculations() {
    // Verifica se há dados suficientes para realizar o cálculo
    if (!this.selectedTable || this.dropPoints.length < 2) {
      console.log('!this.selectedTable || this.dropPoints.length < 2');
      console.log(this.selectedTable);
      console.log(this.dropPoints);
      return;
    }

    // Ativa o loading antes de iniciar o processamento
    this.showLoading("Carregando tabela de preços....");
    this.serviceMsgTime = "Calculando preços....";

    try {
      // Executa o cálculo das distâncias e tempos
      const distanceAndTime = await this.calculateDistancesAndTimes();
      console.log('distanceAndTime', distanceAndTime);

      // Calcula o preço com base nos dados obtidos
      this.calculatedPrice = this.priceService.calculate(this.selectedTable, this.dropPoints, distanceAndTime);

      // Evita exibir NaN para o preço
      if (isNaN(this.calculatedPrice.price)) {
        this.calculatedPrice.price = '0.00';
      }



      console.log('Preço Calculado:', this.calculatedPrice);

      // Atualiza as informações do serviço no objeto userInfo
      this.dataService.userInfo.servicesPrices = {
        totalDistance: this.calculatedPrice.distanceCharged,
        totalTime: this.calculatedPrice.totalTime,
        totalPrice: this.calculatedPrice.price,
        driverEarnings: this.priceService.calculateDriverEarnings(this.calculatedPrice.price, this.selectedTable),
        systemFee: this.calculatedPrice.systemFee,
        region: this.selectedTable.region,
      };

      console.log('servicesPrices', this.dataService.userInfo.servicesPrices);

      // Realiza a próxima etapa apenas se não houver erro
      this.loading.dismiss();
      this.checkStep();

    } catch (error) {
      // Exibe mensagem de erro e interrompe o fluxo
      if (error && error.message && error.message.includes('NOT_FOUND')) {
        this.uiUtils.showAlertError('Não foi possível calcular a rota. Verifique se todos os endereços estão corretos e tente novamente.');
      } else {
        this.uiUtils.showAlertError('Erro ao calcular preços. Por favor, verifique os endereços e tente novamente.');
      }
      // Reverte o estado para impedir continuidade
      this.fromPrices = false;
      // Limpa os valores exibidos para evitar confusão
      this.serviceMsgDistance = "";
      this.serviceMsgTime = "";
      this.serviceMsgPrice = "";
      this.dataService.userInfo.servicesPrices = {};
      this.dropPoints = [];
      // Forçar atualização da UI
      this.zone.run(() => {
        this.serviceMsgTime = "";
      });
    } finally {
      // Desativa o loading e limpa a mensagem em todos os casos
      if (this.loading) {
        this.loading.dismiss();
      }
      this.zone.run(() => {
        this.serviceMsgTime = "";
      });
    }
  }
  

  async calculateDistancesAndTimes() {
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 0; i < this.dropPoints.length - 1; i++) {
      const from = this.dropPoints[i].description;
      const to = this.dropPoints[i + 1].description;

      const { distance, duration } = await this.geolocationService.calculateDistanceAndTime(from, to);
      this.dropPoints[i + 1].distanceFromPrevious = distance;
      this.dropPoints[i + 1].timeFromPrevious = duration;

      totalDistance += distance;
      totalTime += duration;
    }

    const returnPoint = this.dropPoints.find((point) => point.isReturn);
    if (returnPoint) {
      const lastPoint = this.dropPoints[this.dropPoints.length - 2].description;
      const { distance, duration } = await this.geolocationService.calculateDistanceAndTime(lastPoint, returnPoint.description);

      returnPoint.distanceFromPrevious = distance;
      returnPoint.timeFromPrevious = duration;

      totalDistance += distance;
      totalTime += duration;
    }

    this.totalDistance = parseFloat(totalDistance.toFixed(2));
    this.totalTime = parseFloat(totalTime.toFixed(2));

    return { totalDistance, totalTime };
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


  checkStep() {
    const fromPrices = this.fromPrices
  
    if (fromPrices) {  
      this.updateServiceMessages();
      this.plotRouteOnMap();

    } else {
      this.initializePage();
    }
}
  
  // Atualiza as mensagens de distância, tempo e preço
  updateServiceMessages() {
    const servicesPrices = this.dataService.userInfo.servicesPrices;
  
    this.serviceMsgDistance = `${parseFloat(servicesPrices.totalDistance).toFixed(2)} km`;
    this.serviceMsgTime = `${parseFloat(servicesPrices.totalTime).toFixed(2)} min`;
    this.serviceMsgPrice = `R$ ${parseFloat(servicesPrices.totalPrice).toFixed(2)}`;
  }
  
  initializeForm() {
    this.signupForm = this.formBuilder.group({
      fromAddress: ['', Validators.required],
      toAddress: ['', Validators.required],
      additionalDestinations: this.formBuilder.array([]),
    });
  }

  async initializePage() {
    if (!this.fromPrices) {
      this.dataService.userInfo.dropPoints = [];
    }

    try {
      if (this.dataService.userInfo) {
        this.displayRandomMessage();
        this.updateStatsUser();
      }
    } catch (error) {
      console.error('Erro ao verificar ordens ativas:', error);
    }
  }


  updateStatsUser(){

    const userId = this.dataService.userInfo.userId;
    const userType = this.dataService.userInfo.userType;    

    this.statsService
      .consolidateUserStats(userId, userType)
      .then((stats) => {
        this.stats = stats;
        console.log('Estatísticas atualizadas:', this.stats);
      })
      .catch((error) => {
        this.uiUtils.showAlertError('Erro ao carregar estatísticas.');
      });
  }

  get additionalDestinations() {
    return this.signupForm.get('additionalDestinations') as FormArray;
  }

  displayRandomMessage() {
    this.currentMessage = this.messageService.getRandomMessage();

    setTimeout(() => {
      this.msgInfoVisible = false;
    }, 10000); 
  }

  addDestination() {
    this.additionalDestinations.push(
      this.formBuilder.group({
        address: [''], 
      })
    );
    this.adjustDynamicHeight();
  }
  
  
  removeDestination(index: number) {
    this.additionalDestinations.removeAt(index); 
    this.clearMarker(index); 
  }
  
  
  clearMarker(index: number) {
    if (this.markers[index]) {
      this.markers[index].setMap(null);
      this.markers.splice(index, 1);
    }
  }
  

  adjustDynamicHeight() {
    const listContainer = document.querySelector('.list-container') as HTMLElement;
    const mapContainer = document.querySelector('.map-container') as HTMLElement;
  
    const baseHeight = 150;
    const itemHeight = 60; 
    const itemCount = this.additionalDestinations.length + 2; 
  
    const newHeight = baseHeight + itemHeight * itemCount;
  
    if (listContainer) {
        listContainer.style.height = `${newHeight}px`;
    }

    if (mapContainer) {
        mapContainer.style.height = `calc(100vh - ${newHeight}px)`;
    }
  }

  addMarker(position: { lat: number; lng: number }, title: string) {

    if(!google){
      console.error('Google Maps API não carregada corretamente.');
      return;
    }

    const marker = new google.maps.Marker({
      position,
      map: this.map,
      title,
    });
    this.markers.push(marker);
  }

  initAutocomplete(inputId: string, controlName: string) {

    if(!google){
      console.error('Google Maps API não carregada corretamente.');
      return;
    }

    const input = document.getElementById(inputId) as HTMLInputElement;
    const autocomplete = new google.maps.places.Autocomplete(input, {
      fields: ['formatted_address', 'geometry'],
    });
  
    autocomplete.addListener('place_changed', () => {
      this.zone.run(() => {
        const place = autocomplete.getPlace();
        if (place.geometry?.location) {
          const location = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          };
  
          this.addMarker(location, place.formatted_address);
  
          if (controlName.startsWith('additionalDestinations_')) {
            const index = parseInt(controlName.split('_')[1], 10);
            this.additionalDestinations.at(index).setValue(place.formatted_address);
          } else {
            this.signupForm.controls[controlName].setValue(place.formatted_address);
          }
        }
      });
    });
  }
      
  onDebounce(inputType: string) {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
  
    this.debounceTimeout = setTimeout(() => {
      this.onEnter(inputType); 
    }, 600); // Ajuste o tempo de debounce (300ms, por exemplo)
  }

  async onEnter(inputType: string) {
    if (this.isModalOpen) {
      console.log('Um modal já está aberto.');
      return;
    }
  
    const value = this.getInputValue(inputType);
  
    if (!value || value.trim() === '') {
      console.log('O campo está vazio');
      return;
    }
  
    this.suggestions = await this.geolocationService.getPlaceSuggestions(value);
    console.log('Sugestões obtidas:', this.suggestions);
  
    if (this.suggestions && this.suggestions.length > 0) {

      if (this.isModalOpen) {
        console.log('Um modal já está aberto.');
        return;
      }

      this.isModalOpen = true; 
      const modal = await this.modalController.create({
        component: SuggestionsModalComponent,
        componentProps: {
          suggestions: this.suggestions,
        },
      });
  
      modal.onDidDismiss().then((result) => {
        this.isModalOpen = false;
      
        if (result.data) {
          if (inputType.startsWith('additionalDestinations_')) {
            const index = parseInt(inputType.split('_')[1], 10);
      
            const control = this.additionalDestinations.at(index);
            if (control) {
              control.get('address')?.setValue(result.data.suggestion.description);
            } else {
              console.error(`Controle adicional de destino não encontrado no índice ${index}`);
            }
          } else {
            this.signupForm.controls[inputType].setValue(result.data.suggestion.description);
          }
          this.focusNextInput(inputType); 
        }
      });
      
  
      await modal.present();
    }
  }
  
  
  getInputValue(inputType: string): string {
    if (inputType === 'fromAddress') {
      return this.signupForm.controls['fromAddress'].value;
    } else if (inputType === 'toAddress') {
      return this.signupForm.controls['toAddress'].value;
    } else if (inputType.startsWith('additionalDestinations_')) {
      const index = parseInt(inputType.split('_')[1], 10);
      return this.additionalDestinations.at(index).get('address').value;
    }
    return '';
  }

  applySelectedSuggestion(suggestion: any, inputType: string) {

    this.signupForm.controls[inputType].setValue(suggestion);
      
    const location = this.suggestions.find(
      (place) => place.formatted_address === suggestion
    )?.geometry?.location;
  
    if (location) {
      this.addMarker(
        { lat: location.lat(), lng: location.lng() },
        suggestion
      );
    }
  
    if (inputType === 'fromAddress') {
      const toAddressInput = document.getElementById('toAddress') as HTMLInputElement;
      if (toAddressInput) toAddressInput.focus();
    }
  }
  
  focusNextInput(inputType: string) {
    if (inputType === 'fromAddress') {
      const toAddressInput = document.getElementById('toAddress') as HTMLInputElement;
      if (toAddressInput) toAddressInput.focus();
    } else if (inputType === 'toAddress' && this.additionalDestinations.length > 0) {
      const additionalInput = document.getElementById(`additionalDestinations_0`) as HTMLInputElement;
      if (additionalInput) additionalInput.focus();
    } else if (inputType.startsWith('additionalDestinations_')) {
      const index = parseInt(inputType.split('_')[1], 10) + 1;
      const nextInput = document.getElementById(`additionalDestinations_${index}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }


  adjustMapSize() {
    const suggestionsVisible = this.suggestions.length > 0;
    const destinationsCount = this.signupForm.value.additionalDestinations.length + 1; 
    
    if (suggestionsVisible) {
      document.getElementById('map')?.classList.add('half-screen-map');
      document.getElementById('map')?.classList.remove('full-screen-map');
    } else {
      document.getElementById('map')?.classList.add('full-screen-map');
      document.getElementById('map')?.classList.remove('half-screen-map');
    }
    
    if (destinationsCount >= 2) {
      this.map.setZoom(12); 
    } else {
      this.map.setZoom(14); 
    }
  }
      

  async showLoading(message: string) {
    this.loading = await this.loadingCtrl.create({
      message
    });
    await this.loading.present();
  }

  async openMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: this.dataText.getText('options'),
      buttons: [
        {
          text: this.dataText.getText('clearFields'),
          icon: 'trash-bin-outline',
          handler: () => {
            this.clearFields();
          },
        },
        {
          text: this.dataText.getText('centerMap'),
          icon: 'locate-outline',
          handler: () => {
            this.centerMap();
          },
        },      
        {
          text: 'Cancel',
          icon: 'close',
          role: 'cancel',
        },
      ],
    });
    await actionSheet.present();
  }

  clearFields() {
    this.signupForm.reset();
    this.additionalDestinations.clear();
  }

  centerMap() {
    if (this.userLocation) {
      this.map.setCenter(this.userLocation);
      this.map.setZoom(14);
    } else {
      console.log('User location not available');
    }
  }


  checkBalanceBeforeProceed() {
    const minimumBalance = 20;                

    if(this.dataService.userInfo.assinante){
      this.currentBalance = 1000
      this.uiUtils.showToast("Você ganhou 1000 créditos por ser assinante!");
    }

    if (this.currentBalance < minimumBalance) {
      this.uiUtils.showAlertError('Saldo insuficiente para fazer um pedido. O saldo mínimo é de $20.').then(() => {
        this.alertCtrl.create({
          header: 'Saldo Insuficiente',
          message: 'Deseja ir para a página de carteiras para adicionar saldo?',
          buttons: [
            {
              text: 'Não',
              role: 'cancel',
            },
            {
              text: 'Sim',
              handler: () => {
                this.router.navigate(['/wallets']);
              },
            },
          ],
        }).then(alert => alert.present());
      });
    } else {
      this.traceRoutes();
    }
  }

  traceRoutes() {
   
    const fromAddress = this.signupForm.get('fromAddress').value;
    const toAddress = this.signupForm.get('toAddress').value;

    this.dataService.userInfo.dropPoints = [];
    this.dataService.userInfo.dropPoints.push({description: fromAddress, status: this.dataText.getText('waiting'), startPoint: true});
    this.dataService.userInfo.dropPoints.push({description: toAddress, status: this.dataText.getText('waiting')});

    this.additionalDestinations.controls.forEach((destinationControl) => {
      const destination = destinationControl.value;
      this.dataService.userInfo.dropPoints.push({
        description: destination.address,
        status: this.dataText.getText('waiting')
      });
    });
           
    this.fromPrices = true

    console.log('traceRoutes dropPoints', this.dataService.userInfo.dropPoints)
    this.dropPoints = this.dataService.userInfo.dropPoints
    this.updateCalculations();    
    
  }
  

  async plotRouteOnMap() {
    if (!this.dataService.userInfo.dropPoints || this.dataService.userInfo.dropPoints.length < 2){
      console.log('Sem pontos de serviço')
      return;
    }
  
    const waypoints = this.dataService.userInfo.dropPoints.slice(1, -1).map((point) => ({
      location: point.description,
      stopover: true,
    }));
  
    const origin = this.dataService.userInfo.dropPoints[0].description;
    const destination = this.dataService.userInfo.dropPoints[this.dataService.userInfo.dropPoints.length - 1].description;
  
    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      waypoints,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    if(!this.directionsService){
      this.directionsService = new google.maps.DirectionsService();      
    }
  
    this.directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        this.directionsRenderer.setDirections(result);
  
        const route = result.routes[0].legs;
        const totalDistance = route.reduce((sum, leg) => sum + leg.distance.value, 0);
        const totalDuration = route.reduce((sum, leg) => sum + leg.duration.value, 0);
  
        this.routeInfo = {
          distance: `${(totalDistance / 1000).toFixed(2)} km`,
          duration: `${Math.floor(totalDuration / 60)} min`,
        };
  
        console.log('Rota traçada com sucesso:', this.routeInfo);
      } else {
        console.error('Erro ao traçar a rota:', status);
      }
    });        
  }
  

clearAll(){
  this.clearRoute()
  this.clearFields()
  this.availableOrders = []
  this.fromPrices = false

}

resetMap() {
  console.log("🔄 Reinicializando o mapa...");

  if (this.map) {
    this.map = null; // Remove referência ao mapa anterior
    this.googleMapsLoaded = false
  }

  setTimeout(() => {
    this.zone.run(() => {
      this.loadGoogleMapsApi();
    });
  }, 200);
}



clearRoute() {
  console.log('Limpando rota.');

  if (this.directionsRenderer && typeof this.directionsRenderer.setDirections === 'function') {
    try {
      this.directionsRenderer.setDirections({ routes: [], geocoded_waypoints: [] });
      console.log('Rota removida do mapa.');
    } catch (error) {
      console.error('Erro ao limpar a rota:', error);
    }
  } else {
    console.warn('DirectionsRenderer não inicializado.');
  }
  
  this.routeInfo = null;
}
  

  async sendRequest() {

    if(!this.selectedTable){
      this.uiUtils.showAlertError('Nenhuma tabela de preços criada. Favor entrar em contato com o suporte.');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Confirmar Solicitação',
      message: 'Você deseja enviar esta solicitação? O valor será diminuído do total da sua carteira.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: async () => {

            const orderData = {
              dropPoints: this.dataService.userInfo.dropPoints,
              servicesPrices: this.dataService.userInfo.servicesPrices,      
              status: 'Aguardando',
              createdAt: new Date().toISOString(),
              userId: this.dataService.userInfo.userId,
              user: this.dataService.userInfo
            };

            try {
              this.orderId = await this.db.addToCollection('orders', orderData);                            
              const message = `Chamado criado com sucesso!`;
              this.uiUtils.showToast(message);               
              this.fromPrices = false
              
            } catch (error) {
              console.error('Erro ao enviar pedido:', error);
              this.loading.dismiss();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  async listenToOrderStatus() {
    this.db.listenToDocument(`orders`).subscribe(async (orders: any) => {
      if (!orders) {
        console.log('Nenhuma ordem disponível no Firebase.');
        this.availableOrders = [];
        return;
      }

      console.log('🚀 Atualizando ordens em tempo real...');

      const ordersArray = Array.isArray(orders)
        ? orders
        : Object.keys(orders).map((key) => ({
            key,
            ...orders[key],
          }));

      let position: GeolocationPosition | null = null;
      try {
        position = await this.geolocationService.getCurrentPosition();
        console.log('📍 Localização obtida:', position.coords.latitude, position.coords.longitude);
      } catch (error) {
        console.error('❌ Erro ao obter localização:', error);
      }

      let latitude = position?.coords.latitude || null;
      let longitude = position?.coords.longitude || null;

      const updatedOrders = [];

      for (const order of ordersArray) {
        console.log('🔄 Processando ordem:', order.key, order.status);

        if (order.status === 'Cancelado' || order.status === 'Finalizado') {
          console.log(`⚠️ Removendo ordem ${order.key} (${order.status})`);
          continue;
        }

        this.notifyPointStatusChange(order);

        if (order.status === 'Aguardando') {
          // Validação de expiração: checar se a ordem tem mais de 1 hora
          const createdAt = new Date(order.createdAt);
          const now = new Date();
          const timeDiff = now.getTime() - createdAt.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60); // Diferença em horas
          const isExpired = hoursDiff > 6; // Mais de 6 horas 

          console.log(`Ordem ${order.key} criada há ${hoursDiff.toFixed(2)} horas. Expirada: ${isExpired}`);

          // Definir status visual para exibição na UI
          order.displayStatus = isExpired ? 'Vencido' : order.status;
          order.isExpired = isExpired; // Campo auxiliar para controle na UI

          const collectionPoint = order.dropPoints?.[0]?.description;

          if (collectionPoint && latitude !== null && longitude !== null) {
            try {
              const { distance, duration } = await this.geolocationService.calculateDistanceAndTime(
                `${latitude},${longitude}`,
                collectionPoint
              );
              order.collectionDistance = `${distance.toFixed(2)} km`;
              order.collectionTime = `${Math.ceil(duration)} min`;
            } catch (error) {
              console.error('❌ Erro ao calcular distância do ponto de coleta:', error);
              order.collectionDistance = 'Erro';
              order.collectionTime = 'Erro';
            }
          }

          console.log(order.servicesPrices);

          order.calculatedDistance = order.servicesPrices?.totalDistance;
          order.calculatedDistance = order.calculatedDistance ? order.calculatedDistance.toFixed(2) : 'N/A';
          order.estimatedTime = order.servicesPrices?.totalTime || 'N/A';

          if (order.dropPoints.length > 1) {
            // Calcular distâncias e tempos entre os pontos
            // Nota: distanceToNext e timeToNext só são atribuídos ao ponto atual (i), não ao último ponto (i + 1)
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
                  console.error('❌ Erro ao calcular distância entre pontos:', error);
                  order.dropPoints[i].distanceToNext = 'Erro';
                  order.dropPoints[i].timeToNext = 'Erro';
                }
              }
            }
          }
        }

        updatedOrders.push(order);
      }

      // Ordena as ordens pelo createdAt (mais novos primeiro)
      updatedOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      this.availableOrders = updatedOrders;
    });
  }

  // Novo método para remover a ordem
  async removeOrder(order: any) {
    try {
      // Atualizar o status no banco de dados para "Vencida"
      await this.db.updateDocument(`orders/${order.key}`, {
        status: 'Vencida',
        updatedAt: new Date().toISOString()
      });

      // Remover a ordem da lista local
      this.availableOrders = this.availableOrders.filter(o => o.key !== order.key);
      this.uiUtils.showToast('Ordem removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover ordem:', error);
      this.uiUtils.showToast('Erro ao remover a ordem. Tente novamente.');
    }
  }

  
    
  notifyPointStatusChange(order: any) {
    const lastModifiedPoint = order.dropPoints.reduce((latest, point) => {
      return point.modifiedAt && (!latest.modifiedAt || new Date(point.modifiedAt) > new Date(latest.modifiedAt))
        ? point
        : latest;
    }, order.dropPoints[0]);

    if (lastModifiedPoint) {
      const message = `O status do ponto ${lastModifiedPoint.description} foi alterado para "${lastModifiedPoint.status}"`;
      this.uiUtils.showToast(message);
    }
  }
  
  async saveOrderAsHistory(order: any) {
    try {
      this.uiUtils.showLoading(this.dataText.getText('savingOrderHistory'))
        .then(async (loading) => {
          await loading.dismiss();
  
          const historyData = {
            ...order,
            finalizedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
          };
  
          await this.db.addToCollection('orderHistory', historyData);  
          await this.db.removeDocument(`orders/${order.key}`);
  
          this.uiUtils.showToast(this.dataText.getText('orderMovedToHistory'));
  
          this.dataService.selectedOrder = null;
       
        });
    } catch (error) {
      console.error('Erro ao salvar ordem no histórico:', error);
      this.uiUtils.showToast(this.dataText.getText('orderSaveError'));
    }
  }
  

  handleAcceptedOrder(order: any) {

    clearInterval(this.statusCheckTimer);            

    if(this.loading)
      this.loading.dismiss()

    this.fromPrices = false
    this.msgInfoVisible = false
    
    this.alertCtrl
      .create({
        header: 'Pedido Aceito',
        message: `Seu pedido foi aceito por um motorista Para mais detalhes, clique no historico.`,
        buttons: [{
          text: 'OK',
          handler: () => {                        
            this.dataService.selectedOrder = order
            this.uiUtils.presentToast(`Seu pedido foi aceito por um motorista.`)
            //this.router.navigate(['/details']);
          }
        }],
      })
      .then((alert) => alert.present());
  }

  handleCanceledOrder(order: any) {

    clearInterval(this.statusCheckTimer);            

    if(this.loading)
      this.loading.dismiss()

    this.fromPrices = false
    this.msgInfoVisible = false

    this.alertCtrl
      .create({
        header: 'Pedido Cancelado',
        message: `Seu pedido foi cancelado.`,
        buttons: [{
          text: 'OK',
          handler: () => {
            console.log('Ordem cancelada.');
          }
        }],
      })
      .then((alert) => alert.present());
  }

  handleCompletedOrder(order: any) {

    clearInterval(this.statusCheckTimer);            

    if(this.loading)
      this.loading.dismiss()

    this.fromPrices = false
    this.msgInfoVisible = false

    this.clearRoute()

    this.alertCtrl
      .create({
        header: 'Pedido Finalizado',
        message: `Parabéns! seu pedido foi finalizado. Não esqueça de fazer a avaliação para ganhar pontos!`,
        buttons: [{
          text: 'OK',
          handler: () => {
            console.log('Ordem finalizada.');
          }
        }],
      })
      .then((alert) => alert.present());
  }


  goPageHistory(){
    this.router.navigate(['/history']);
  }

  goToWallets() {  
    this.router.navigate(['/wallets']);
  }

  logout(){
    this.authService.logoutUser().then(() => {
      this.dataService.isHome = false;
      
      this.router.navigate(['/login']);
    });
  }
   

  toggleDetails(order: any) {

    order.showDetails = !order.showDetails; // Alterna o estado de exibição
  
    // Atualiza o texto e o ícone do botão com base no estado
    if (order.showDetails) {
      order.detailsButtonText = this.dataText.getText('hideDetails');
      order.detailsButtonIcon = 'chevron-up-outline';
    } else {
      order.detailsButtonText = this.dataText.getText('viewDetails');
      order.detailsButtonIcon = 'chevron-down-outline';
    }
  }
  

  confirmCancelOrder(order: any) {

    if(order.status === 'Aguardando'){

      this.alertCtrl.create({
        header: this.dataText.getText('confirmCancelOrder'),
        message: this.dataText.getText('confirmCancelOrderMessage'),
        buttons: [
          { text: this.dataText.getText('cancel'), role: 'cancel' },
          {
            text: this.dataText.getText('confirm'),
            handler: () => {
              this.cancelOrder(order);
            },
          },
        ],
      }).then((alert) => alert.present());

    }

    else {
      this.uiUtils.showAlertError(this.dataText.getText('currentStatusNotWaiting'))
    }    
  }

  cancelOrder(order: any) {
    this.alertCtrl.create({
      header: this.dataText.getText('cancelOrder'),
      message: this.dataText.getText('cancelReason'),
      inputs: [
        { type: 'radio', label: 'Entregador ausente', value: 'Entregador ausente' },
        { type: 'radio', label: 'Endereço incorreto', value: 'Endereço incorreto' },
        { type: 'radio', label: 'Mudança de planos', value: 'Mudança de planos' },
        { type: 'radio', label: 'Outro motivo', value: 'Outro motivo' },
      ],
      buttons: [
        { text: this.dataText.getText('cancel'), role: 'cancel' },
        {
          text: this.dataText.getText('confirm'),
          handler: async (reason) => {
            order.status = 'Cancelado';
            order.cancellationReason = reason;
            order.cancelledAt = new Date().toISOString();
  
            try {              
              await this.db.addToCollection('orderHistory', {
                dropPoints: order.dropPoints,
                status: order.status,
                cancellationReason: order.cancellationReason,
                cancelledAt: order.cancelledAt,
              });                

              await this.db.removeDocument(`orders/${order.key}`);      
              this.uiUtils.showToast('Pedido cancelado com sucesso!');


            } catch (error) {
              console.error('Erro ao cancelar pedido:', error);
              this.uiUtils.showToast('Erro ao cancelar o pedido. Tente novamente.');
            }
          },
        },
      ],
    }).then((alert) => alert.present());
  }

  
  goToProfile() {
    this.router.navigate(['/user-profile']);
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
        console.error('Erro ao carregar saldo:', JSON.stringify(error));
        this.currentBalance = 0
      },
    });
  }

  openChatbot() {    
    
    const key = "Support";
    const userId = this.dataService.userInfo.userId;

    console.log('Abrindo chatbot para o pedido:', key);
    const alert = this.alertCtrl.create({
      header: 'Chatbot',
      message: 'Deseja abrir o chatbot?',
      buttons: [
        {
          text: 'Sim',
          handler: () => {
            console.log('Abrindo chatbot para o pedido:', key);
            window.open('https://chatbot.pedmoto.com.br?key=' + key + '&userId=' + userId, '_blank');
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

  openChatbotOrder(order) {    
    
    const key = order.key;
    const userId = this.dataService.userInfo.userId;

    console.log('Abrindo chatbot para o pedido:', key);
    const alert = this.alertCtrl.create({
      header: 'Chatbot',
      message: 'Deseja abrir o chatbot?',
      buttons: [
        {
          text: 'Sim',
          handler: () => {
            console.log('Abrindo chatbot para o pedido:', key);
            window.open('https://chatbot.pedmoto.com.br?key=' + key + '&userId=' + userId, '_blank');
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




  dev() {
    const addresses = [
      'Praça dos Três Poderes, Brasília - DF',
      'Esplanada dos Ministérios, Brasília - DF',
      'Parque da Cidade Sarah Kubitschek, Brasília - DF',
      'Torre de TV, Brasília - DF',
      'Palácio do Planalto, Brasília - DF',
      'Congresso Nacional, Brasília - DF',
      'Catedral Metropolitana, Brasília - DF',
      'Museu Nacional, Brasília - DF',
      'Estádio Nacional Mané Garrincha, Brasília - DF',
      'Jardim Botânico, Brasília - DF',
      'Lago Paranoá, Brasília - DF',
      'Parque Nacional de Brasília, Brasília - DF'
    ];

    const getRandomAddress = () => addresses[Math.floor(Math.random() * addresses.length)];

    // Preencher os campos de origem e destino
    this.signupForm.patchValue({
      fromAddress: getRandomAddress(),
      toAddress: getRandomAddress(),
    });

    // Adicionar um destino adicional
    if (this.additionalDestinations.length === 0) {
      this.addDestination();
    }
    this.additionalDestinations.at(0).patchValue({
      address: getRandomAddress(),
    });

    console.log('Campos preenchidos automaticamente.');
  }

  doRefresh(event: any){
    
  }

}
