// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  BACKEND_URL: 'https://api.motokapp.com.br/api',  
  //MERCADO_PAGO_PUBLICKEY: "APP_USR-63df9498-165e-4212-81e5-5ddda9e21c91",
  MERCADO_PAGO_PUBLICKEY: "TEST-05c8633b-51f7-4feb-ab4e-7021d75afca5",  
  firebaseConfig: {    
    apiKey: "AIzaSyA_YXibuMNddz4NIqwzC2tURwjUAG4e9LA",
    authDomain: "motok-7d13a.firebaseapp.com",  
    databaseURL: "https://motok-7d13a-default-rtdb.firebaseio.com",  
    projectId: "motok-7d13a",  
    storageBucket: "motok-7d13a.appspot.com",  
    messagingSenderId: "586536055929",  
    appId: "1:586536055929:web:c53de9532119419dfb10a8",  
    measurementId: "G-TQ0182Q808"  
  }

};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
