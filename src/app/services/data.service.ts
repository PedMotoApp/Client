import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { environment } from '../../environments/environment'; // Add import for environment


@Injectable({
  providedIn: 'root'
})
export class DataService {

  isDev = false;
  fireconfig = environment.firebaseConfig;
  
      
  appTermsConditions = "https://termos.pedmoto.com.br";
  appTermsPriv = "https://privacidade.pedmoto.com.br";

  isHome = false;
  appName = "Pedmoto Motorista";    
  appUserType = 2; // 1 = Client, 2 = Professional  
  isWeb = false;
  defaultState = 'DF';
  userId = 0;
  userInfo: any = [];
  services: any = [];  
  servicesPrices: any;  
  userName = "";
  latitude = "";
  longitude = "";      
  isMapError = false;
  isFcmStarted = false;
    
  selectedOrder: any;
 

  banks = [
    'Banco do Brasil',
    'Bradesco',
    'Caixa Econômica',
    'Itaú',
    'Sicred',
    'Banrisul',
    'Santander'
  ]; 
  

  constructor(private platform: Platform) {        
  }

  async clearUserData() {
    
  }    

  verificaCPF(strCPF) {
    var Soma;
    var Resto;
    Soma = 0;
    if (strCPF == "00000000000") return false;
      
    for (let i=1; i<=9; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (11 - i);
    Resto = (Soma * 10) % 11;
    
      if ((Resto == 10) || (Resto == 11))  Resto = 0;
      if (Resto != parseInt(strCPF.substring(9, 10)) ) return false;
    
    Soma = 0;
      for (let i = 1; i <= 10; i++) Soma = Soma + parseInt(strCPF.substring(i-1, i)) * (12 - i);
      Resto = (Soma * 10) % 11;
    
      if ((Resto == 10) || (Resto == 11))  Resto = 0;
      if (Resto != parseInt(strCPF.substring(10, 11) ) ) return false;
      return true; 
  }     


  getUserInfo(){
    return this.userInfo;
  }
 

}
