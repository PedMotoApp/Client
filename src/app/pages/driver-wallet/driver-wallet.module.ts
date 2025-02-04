import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DriverWalletPageRoutingModule } from './driver-wallet-routing.module';

import { DriverWalletPage } from './driver-wallet.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DriverWalletPageRoutingModule
  ],
  declarations: [DriverWalletPage]
})
export class DriverWalletPageModule {}
