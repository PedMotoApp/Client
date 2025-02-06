import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { UiUtilsService } from 'src/app/services/ui-utils.service';
import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser/ngx';
import { DataService } from '../../services/data.service';
import { AuthService } from 'src/app/services/auth.service';
import { getAuth, onAuthStateChanged, signOut, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'; 
import { DatabaseService } from 'src/app/services/database.service';
import { Subscription } from 'rxjs';
import { DataTextService } from 'src/app/services/data-text.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, OnDestroy {
  private userConfig: Subscription;
  autoLogin = true;
  username: string;
  password: string;
  phoneNumber = 61983013768; // TODO: Remover numero de telefone
  languageSelected = 0;
  loginForm: FormGroup;

  constructor(
    private router: Router,
    public dataInfo: DataService,
    public uiUtils: UiUtilsService,
    public authService: AuthService,
    public alertCtrl: AlertController,
    private formBuilder: FormBuilder,
    private iab: InAppBrowser,
    public db: DatabaseService,
    public  dataText: DataTextService,
    public loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.startInterface();
  }

  ngOnDestroy() {
    if (this.userConfig) this.userConfig.unsubscribe();
  }

  ionViewWillEnter() {
    this.loadView();
  }

  startInterface() {
    
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });


    if(this.dataInfo.isDev){
      this.dev()
    }
        
  }

  dev(){
    this.loginForm = this.formBuilder.group({
      email: ['diego.freebsd@gmail.com', [Validators.required, Validators.email]],
      password: ['123456', Validators.required]
    });


    // this.goHome();
  }

  async loadView() {
    
    const auth = getAuth();  // Use getAuth to get the Firebase auth instance

    if (this.autoLogin) {
      onAuthStateChanged(auth, user => {
        if (user && !this.dataInfo.isHome) this.goPageHomeUser();
      });
    } else {
      signOut(auth);  // Use signOut from Firebase modular auth
    }
  }

  async goPageHomeUser() {
    this.userConfig = this.db.getUser().subscribe(data => {
      this.goPageHomeUserContinue(data);
      this.userConfig.unsubscribe();
    });
  }

  goPageHomeUserContinue(data) {
    if (!data.length) {
      this.uiUtils.showAlertError(this.dataText.getText('errorLogin'));
      return;
    }

    this.updateUserInfo(data);

    if (!this.dataInfo.userInfo) {
      this.uiUtils.showAlertError(this.dataText.getText('errorLogin1'));
      return;
    }

    this.normalizeUserInfo();
    this.checkUserStatus();
  }

  updateUserInfo(data) {
    data.forEach(element => {
      this.dataInfo.userInfo = element.payload.val();
    });


    this.authService.currentUserUid().then(uid => {
      this.dataInfo.userInfo.userId = uid;
    });
  }

  normalizeUserInfo() {
    if (this.dataInfo.userInfo.totalMoney) {
      this.dataInfo.userInfo.totalMoney = parseFloat(this.dataInfo.userInfo.totalMoney).toFixed(2);
    }
    if (this.dataInfo.userInfo.isPremium === undefined) {
      this.dataInfo.userInfo.isPremium = false;
    }
  }

  checkUserStatus() {
    const { status } = this.dataInfo.userInfo;
    const errorMessages = {
      'removed': this.dataText.getText('errorLogin3'),
      'inactive': this.dataText.getText('errorLogin4'),
      'profileIncomplete': this.dataText.getText('errorLogin5')
    };

    if (errorMessages[status]) {
      this.uiUtils.showAlertError(errorMessages[status]);
    } else {
      this.goHome();
    }
  }

  goHome() {

    console.log("Dados do usuário:", this.dataInfo.userInfo);

    this.saveDefaultState();

    if (!this.dataInfo.isHome) {

      this.dataInfo.isHome = true;
      this.navigateToHomePage();
      if (this.userConfig) this.userConfig.unsubscribe();

    }
  }

  async saveDefaultState() {
   
  }

  navigateToHomePage() {
    this.dataInfo.isHome = true;
    let page = '/home';

    if(this.dataInfo.appUserType === 2){
      page = '/driver';
    }

    const email = this.dataInfo.userInfo.email
    if(email === "cliente@pedmoto.com.br" || email === "profissional@pedmoto.com.br"){
      this.dataInfo.isDev = true
    }

    this.router.navigate([page]);
  }

  loginUser() {
    //this.dataInfo.appLoginType === 'Phone' ? this.loginPhone() : this.loginUserEmail();
    this.loginUserEmail();
  }

  loginPhone() {
    /*this.authService.signInPhone(this.phoneNumber, this.recaptchaVerifier)
      .then(this.loginPhoneContinue)
      .catch((error) => this.uiUtils.showAlertError(error));*/
  }

  loginPhoneContinue = (confirmationResult) => {
    this.alertCtrl.create({
      header: this.dataText.getText('enterSmsCodeHeader'),
      inputs: [{ name: 'confirmationCode', placeholder: this.dataText.getText('smsCodePlaceholder') }],
      buttons: [
        { text: this.dataText.getText('cancel'), role: 'cancel' },
        {
          text: this.dataText.getText('send'),
          handler: data => confirmationResult.confirm(data.confirmationCode)
            .then(result => console.log(result.user))
            .catch(error => console.error('Confirmation error:', error))
        }
      ]
    }).then(alert => alert.present());
  }

  async loginUserEmail() {
    if (this.loginForm.valid) {
      const loading = await this.loadingController.create({
        message: this.dataText.getText('pleaseWait'),
      });
      await loading.present();
  
      const email = this.loginForm.value.email.trim();
      const password = this.loginForm.value.password;

      console.log('email', email);
      console.log('password', password);
  
      this.authService.loginUser(email, password)
        .then(async () => {

          await loading.dismiss();
          const alert = await this.alertCtrl.create({
            header: 'Sucesso',
            message: 'Login realizado com sucesso!',
            buttons: ['OK'],
          });
          await alert.present();
          this.goPageHomeUser();
        })
        .catch(async (error) => {

          console.error('Erro de login:', error);
          console.log('loginUser', this.authService.getUserInfo());

          await loading.dismiss();
          this.treatErrorLogin(error);
        });
    } else {
      this.handleLoginInputErrorValidation();
    }
  }
  
  handleLoginInputErrorValidation() {
    const emailError = !this.loginForm.get('email')?.valid;
    const passwordError = !this.loginForm.get('password')?.valid;
  
    let errorMessage = 'Por favor, corrija os seguintes erros:\n';
    if (emailError) errorMessage += '- E-mail inválido.\n';
    if (passwordError) errorMessage += '- Senha deve conter pelo menos 6 caracteres.';
  
    this.uiUtils.showAlert('Erro de Validação', errorMessage);
  }
   

  async loginContinue(email: string, pass: string) {
    const loading = await this.loadingController.create({ message: this.dataText.getText('pleaseWait') });
    await loading.present();

    this.authService.loginUser(email, pass)
      .then((callback) => {

        console.log(callback);

        loading.dismiss();
        this.goPageHomeUser();
      })
      .catch(error => {

        console.log(error);
        loading.dismiss();
        this.treatErrorLogin(error);
      });
  }

  async treatErrorLogin(error) {
    const errorMessage = error.code === 'auth/user-not-found'
      ? this.dataText.getText('errorLogin6')
      : this.dataText.getText('errorLogin7');
    const alert = await this.uiUtils.showAlert(this.dataText.getText('warning'), errorMessage);
    await alert.present();
  }

  languageChanged() {
    this.languageSelected = this.languageSelected === 0 ? 1 : 0;
    this.dataText.setLanguage(this.languageSelected === 1 ? 'en' : 'pt-BR');

   
  }

  applyLanguageSettings() {
    this.dataText.setLanguage(this.languageSelected === 1 ? 'en' : 'pt-BR');
  }

  
  goToSignup() {
    this.router.navigate(['/signup']);
  }


  goToResetPassword() {

    const username = this.loginForm.value.email;

    if (username.length > 0) {
      this.authService.resetPassword(username).then(() => {
        this.uiUtils.showAlert(this.dataText.getText('warning'), this.dataText.getText('titleCheckMailbox')).then(alert => alert.present());
      }).catch(() => {
        this.uiUtils.showAlert(this.dataText.getText('warning'), this.dataText.getText('titleAuthRecoveryError')).then(alert => alert.present());
      });
    } else {
      this.uiUtils.showAlert(this.dataText.getText('warning'), this.dataText.getText('titleAuthRecoveryError')).then(alert => alert.present());
    }
  }

  goTerms() {
    const url = this.dataInfo.appTermsConditions;
    this.openInAppBrowser(url);
  }

  goPriv() {
    const url = this.dataInfo.appTermsPriv;
    this.openInAppBrowser(url);
  }

  private openInAppBrowser(url: string) {
    const options = 'location=no';
    this.iab.create(url, this.dataInfo.isWeb ? '_blank' : '_system', options);
  }



  
  signInWithGoogle() {
    this.authService.loginWithGoogle()
      .then((result) => {
        console.log("Usuário autenticado:", result.user);
        this.goPageHomeUser()
      })
      .catch((error) => this.uiUtils.showAlertError(error));
  }


  signInWithApple() {
    this.authService.signInWithApple()
      .then((result) => {
        
        console.log('signInWithApple', result)
        this.goPageHomeUser()
      })
      .catch((error) => this.uiUtils.showAlertError(error));
  }
  

  
}
