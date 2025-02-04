import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { UtilsModule } from '../utils/utils.module';
import { SuggestionsModalComponent } from './suggestions-modal/suggestions-modal.component';

@NgModule({
  declarations: [
    SuggestionsModalComponent
  ],
  imports: [CommonModule, IonicModule.forRoot(), UtilsModule],
  exports: [
    SuggestionsModalComponent
  ],
})
export class ComponentsModule {}
