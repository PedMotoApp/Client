import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { DataTextService } from 'src/app/services/data-text.service';
import { DatabaseService } from 'src/app/services/database.service';
import { GeolocationService } from 'src/app/services/geolocation.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { UiUtilsService } from 'src/app/services/ui-utils.service';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit {
  payload: any;
  fromAddress: string = '';
  toAddress: string = '';
  searching: boolean = true;  
  autocompleteItems: any[] = [];
  autocompleteItemsTo: any[] = [];
  totalDistance: number = 0;
  dropPoints: any[] = [];
  totalTime: number = 0;

  constructor(
    public dataService: DataService,
    public dataText: DataTextService,
    private db: DatabaseService,
    private router: Router,
    private geolocationService: GeolocationService,
    private alertController: AlertController,
    private uiUtils: UiUtilsService
  ) {}


  ngOnInit() {
    
  }

  ionViewWillEnter() {
    this.initializePage();
  }

  initializePage() {

    if (this.dataService.isHome) {
    
      this.loadDropPoints();      
      this.calculateDistancesAndTimes()

    } else {
      this.router.navigate(['/login']);
    }
  }


  loadDropPoints() {

    this.payload = this.dataService.userInfo.dropPoints || [];   
    this.searching = false;
  }

  addDropPoint(point: any) {

    if(!this.dataService.userInfo.dropPoints){
      this.dataService.userInfo.dropPoints = [];
    }

    this.dataService.userInfo.dropPoints.push(point);
  }

  async removeDropPoint(point: any) {
    const alert = await this.alertController.create({
      header: this.dataText.getText('confirmation'),
      message: this.dataText.getText('removePointConfirmation'),
      buttons: [
        {
          text: this.dataText.getText('cancel'),
          role: 'cancel',
        },
        {
          text: this.dataText.getText('remove'),
          role: 'destructive',
          handler: () => {
            const index = this.dataService.userInfo.dropPoints.indexOf(point);
            if (index > -1) {
              this.dataService.userInfo.dropPoints = this.dataService.userInfo.dropPoints.filter((_, i) => i !== index); // Cria um novo array sem o item removido
            }
          },
        },
      ],
    });
  
    await alert.present();
  }
  

  updateSearchResults(event: any) {
    const query = event?.detail?.value || ''; 
    if (!query || query.trim() === '') {
      this.autocompleteItems = [];
      return;
    }
    
    this.autocompleteItems = this.geolocationService.getAutocompleteSuggestions(query);
}

addDropPointManually(event: any) {
    const query = event.target.value;
    if (query && query.trim() !== '') {
      this.addDropPoint({
        description: query.trim(),
        status: this.dataText.getText('waiting'),
      });
      event.target.value = ''; 
    }
}


  selectAddress(address: any) {
    this.addDropPoint({
      description: address.description,
      status: this.dataText.getText('waiting'),
    });
    this.autocompleteItems = [];
  }


  round(num: number) {
    return Math.round(num * 100) / 100;
  }



  async addPayment(point: any) {
    const alert = await this.alertController.create({
      header: this.dataText.getText('addInfo'),
      inputs: [
        {
          type: 'radio',
          label: this.dataText.getText('machine'),
          value: 'machine',
          checked: point.payment === 'machine',
          name: 'paymentGroup', 
        },
        {
          type: 'radio',
          label: this.dataText.getText('pix'),
          value: 'pix',
          checked: point.payment === 'pix',
          name: 'paymentGroup',
        },
        {
          type: 'radio',
          label: this.dataText.getText('cash'),
          value: 'cash',
          checked: point.payment === 'cash',
          name: 'paymentGroup',
        }        
      ],
      buttons: [
        {
          text: this.dataText.getText('cancel'),
          role: 'cancel',
        },
        {
          text: this.dataText.getText('save'),
          handler: (data) => {
            point.payment = this.dataText.getText(data)            
          },
        },
      ],
    });
  
    await alert.present();
  }
  

  async addAdditionalInfo(point: any) {
    const alert = await this.alertController.create({
      header: this.dataText.getText('addInfo'),
      inputs: [       
        {
          name: 'reference',
          type: 'text',
          placeholder: this.dataText.getText('reference'),
          value: point.reference || '',
        },
        {
          name: 'responsible',
          type: 'text',
          placeholder: this.dataText.getText('responsible'),
          value: point.responsible || '',
        },
        {
          name: 'instructions',
          type: 'text',
          placeholder: this.dataText.getText('instructions'),
          value: point.responsible || '',
        },
        {
          name: 'charge',
          type: 'text',
          placeholder: this.dataText.getText('charge'),
          value: point.responsible || '',
        },
        {
          name: 'finalPassword',
          type: 'text',
          placeholder: this.dataText.getText('finalPassword'),
          value: point.finalPassword || '',
        },
      ],
      buttons: [
        {
          text: this.dataText.getText('cancel'),
          role: 'cancel',
        },
        {
          text: this.dataText.getText('save'),
          handler: (data) => {
            point.reference = data.reference;
            point.responsible = data.responsible;
            point.finalPassword = data.finalPassword;
            point.instructions = data.instructions;
            point.charge = data.charge;
          },
        },
      ],
    });
  
    await alert.present();
  }
  

  goBack() {
    if(this.searching){
      this.searching = false;      
    }
    else{
      this.router.navigate(['/home']);
    }
  }

  
  async onEnter(inputType: string) {
    const value = inputType === 'toAddress' ? this.toAddress : '';
    if (!value || value.trim() === '') {
      console.log('O campo está vazio');
      return;
    }
  
    //this.autocompleteItemsTo = await this.geolocationService.getPlaceSuggestions(value);
    this.searching = false
    this.dataService.userInfo.dropPoints.push({description: value, status: this.dataText.getText('waiting'), startPoint: false})
  }
  
  addAddress() {
    this.searching = true;
    this.toAddress = '';
  }
  

  next() {
    if (this.dataService.userInfo.dropPoints.length >= 2) {
      this.dataService.userInfo.dropPoints = this.dataService.userInfo.dropPoints;
      this.router.navigate(['/prices']);
    } else {
      console.log('Você deve ter no mínimo 2 pontos.');
      this.uiUtils.showAlert(this.dataText.getText('warning'), this.dataText.getText('titleMinPoints')).then(alert => alert.present());
    }
  }

  clear(){
    this.dataService.userInfo.dropPoints.forEach(element => {
      element.payment = '';
      element.payment = '';
      element.charge = '';
      element.cashChange = '';
      element.instructions = '';
      element.finalPassword = '';
    });

    this.toAddress = '';    
    this.autocompleteItems = [];
  }


  async showOptions(){}

  async calculateDistancesAndTimes() {

    this.dropPoints = this.dataService.userInfo.dropPoints;

    if (this.dropPoints.length < 2) return;
  
    let totalDistance = 0;
    let totalTime = 0; // Total acumulado de tempo
    const promises = [];
  
    for (let i = 0; i < this.dropPoints.length - 1; i++) {
      const fromPoint = this.dropPoints[i].description;
      const toPoint = this.dropPoints[i + 1].description;
  
      promises.push(
        this.geolocationService
          .calculateDistanceAndTime(fromPoint, toPoint)
          .then(({ distance, duration }) => {
            this.dropPoints[i + 1].calculatedDistance = distance; // Distância entre os pontos consecutivos
            this.dropPoints[i + 1].distanceFromStart = totalDistance + distance; // Distância acumulada
            this.dropPoints[i + 1].estimatedTime = duration; // Tempo estimado para o próximo ponto
            this.dropPoints[i + 1].timeFromStart = totalTime + duration; // Tempo acumulado
  
            totalDistance += distance;
            totalTime += duration;
          })
      );
    }
  
    // Adiciona cálculo da distância e tempo de retorno, se houver
    const returnPoint = this.dropPoints.find((point) => point.isReturn);
    if (returnPoint) {
      const lastDelivery = this.dropPoints[this.dropPoints.length - 2].description;
  
      promises.push(
        this.geolocationService
          .calculateDistanceAndTime(lastDelivery, returnPoint.description)
          .then(({ distance, duration }) => {
            returnPoint.calculatedDistance = distance;
            returnPoint.distanceFromStart = totalDistance + distance;
            returnPoint.estimatedTime = duration;
            returnPoint.timeFromStart = totalTime + duration;
  
            totalDistance += distance;
            totalTime += duration;
          })
      );
    }
  
    await Promise.all(promises);
  
    this.totalDistance = totalDistance; // Distância total
    this.totalTime = totalTime; // Tempo total
    console.log('Distâncias e tempos calculados:', this.dropPoints);
    console.log('Distância total:', this.totalDistance);
    console.log('Tempo total:', this.totalTime);
  }
  


  reorderDropPoints(event: any) {
    const movedItem = this.dataService.userInfo.dropPoints.splice(event.detail.from, 1)[0];
    this.dataService.userInfo.dropPoints.splice(event.detail.to, 0, movedItem);
    event.detail.complete();
    this.calculateDistancesAndTimes(); // Recalcula as distâncias após a reorganização
  }
    

  dev() {
    if (this.dataService.userInfo.dropPoints && this.dataService.userInfo.dropPoints.length > 0) {
      this.dataService.userInfo.dropPoints.forEach((point) => {
        point.reference = point.reference || 'Ponto de referência de teste';
        point.responsible = point.responsible || 'Responsável de teste';
        point.instructions = point.instructions || 'Instruções de teste';
        point.payment = point.payment || 'Pix';
        point.charge = point.charge || '50,00';
        point.finalPassword = point.finalPassword || '1234';
      });
      console.log('Dados de desenvolvimento adicionados:', this.dataService.userInfo.dropPoints);
    } else {
      console.warn('Nenhum dropPoint encontrado em userInfo. Adicione pelo menos um ponto para iniciar os testes.');
    }
  }
  
      
}
