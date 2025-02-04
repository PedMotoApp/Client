import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DriverHomePageRoutingModule } from './driver-home-routing.module';
import { DriverHomePage } from './driver-home.page';
import { OrderDetailsModalComponent } from 'src/app/components/order-details-modal/order-details-modal.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DriverHomePageRoutingModule
  ],
  declarations: [DriverHomePage, OrderDetailsModalComponent]
})
export class DriverHomePageModule {}
