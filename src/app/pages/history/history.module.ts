import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HistoryPageRoutingModule } from './history-routing.module';
import { HistoryPage } from './history.page';
import { RatingModalComponent } from 'src/app/components/rating-modal/rating-modal.component';
import { ReactiveFormsModule } from '@angular/forms'; 


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    HistoryPageRoutingModule
  ],
  declarations: [HistoryPage, RatingModalComponent]
})
export class HistoryPageModule {}
