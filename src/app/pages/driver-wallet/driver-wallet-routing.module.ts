import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DriverWalletPage } from './driver-wallet.page';

const routes: Routes = [
  {
    path: '',
    component: DriverWalletPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DriverWalletPageRoutingModule {}
