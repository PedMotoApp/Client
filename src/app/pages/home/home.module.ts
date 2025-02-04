import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { HomePageRoutingModule } from './home-routing.module';
import { ReactiveFormsModule } from '@angular/forms'; 
import { GoogleMapsModule } from '@angular/google-maps';
import { HomePage } from './home.page';
import { ComponentsModule } from '../../components/components.module';

@NgModule({
  imports: [
    CommonModule,    
    IonicModule,
    HomePageRoutingModule,
    ReactiveFormsModule,
    GoogleMapsModule,
    ComponentsModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
