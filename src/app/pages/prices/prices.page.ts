import { Component, OnInit } from '@angular/core';
import { PricingService } from 'src/app/services/pricing.service';
import { Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import { GeolocationService } from 'src/app/services/geolocation.service';
import { DataTextService } from 'src/app/services/data-text.service';


@Component({
  selector: 'app-prices',
  templateUrl: './prices.page.html',
  styleUrls: ['./prices.page.scss'],
})
export class PricesPage implements OnInit {
  priceTables: any[] = [];
  selectedTable: any;
  calculatedPrice: any = {};
  dropPoints: any[] = [];
  totalDistance: number = 0;
  totalTime: number = 0;

  constructor(
    public dataService: DataService,
    private priceService: PricingService,
    private geolocationService: GeolocationService,
    private router: Router,
    public dataText: DataTextService
  ) {}

  ngOnInit() {
    this.loadTables();
    this.loadDropPoints();
  }

  ionViewWillEnter() {
    this.initializePage();
  }

  initializePage() {
    if (this.dataService.isHome) {
      this.startInterface();
    } else {
      this.router.navigate(['/login']);
    }
  }

  startInterface() {
    this.dropPoints = this.dataService.userInfo.dropPoints || [];
    if (this.priceTables.length > 0) {
      this.selectedTable = this.priceTables[0]; // Default first table
      this.updateCalculations();
    }
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  loadTables() {
    this.priceService.getPriceTables().subscribe((tables) => {
      this.priceTables = tables || [];
      if (this.priceTables.length > 0) {
        this.selectedTable = this.priceTables[0];
        this.updateCalculations();
      }
    });
  }

  loadDropPoints() {
    this.dropPoints = JSON.parse(localStorage.getItem('dropPoints')) || [];
  }

  async onTableChange(event: any) {
    this.selectedTable = event.detail.value;
    await this.updateCalculations();
  }

  async updateCalculations() {
    if (!this.selectedTable || this.dropPoints.length < 2) return;

    const distanceAndTime = await this.calculateDistancesAndTimes();
    this.calculatedPrice = this.priceService.calculate(this.selectedTable, this.dropPoints, distanceAndTime);

    // Prevent NaN display
    if (isNaN(this.calculatedPrice.price)) {
      this.calculatedPrice.price = '0.00';
    }

    console.log('Preço Calculado:', this.calculatedPrice);
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

  confirmPrices() {
    if (this.selectedTable && this.calculatedPrice) {
      this.dataService.userInfo.dropPoints = this.dropPoints;

      this.dataService.userInfo.servicesPrices = {
        totalDistance: this.calculatedPrice.distanceCharged,
        totalTime: this.calculatedPrice.totalTime,
        totalPrice: this.calculatedPrice.price,
        driverEarnings: this.priceService.calculateDriverEarnings(this.calculatedPrice.price, this.selectedTable),
        systemFee: this.calculatedPrice.systemFee,
        region: this.selectedTable.region,
      };

      this.router.navigate(['/home'], { queryParams: { fromPrices: true } });
    }
  }
}
