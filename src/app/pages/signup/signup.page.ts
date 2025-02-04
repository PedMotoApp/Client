import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { DataService } from 'src/app/services/data.service';
import { DataTextService } from 'src/app/services/data-text.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {
  signupForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    public dataInfo: DataService,
    public dataText: DataTextService,
    private router: Router,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.signupForm = this.formBuilder.group({
      fullname: ['', Validators.required],
      tel: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      password1: ['', Validators.required],
      defaultState: ['DF', Validators.required],
    });
  }

  async signupUser() {
    if (this.signupForm.valid) {
      const { fullname, tel, email, password, password1, defaultState } = this.signupForm.value;

      if (password !== password1) {
        const alert = await this.alertCtrl.create({
          header: this.dataText.getText('passwordNotMatchHeader'),
          message: this.dataText.getText('passwordNotMatchMessage'),
          buttons: ['OK']
        });
        await alert.present();
        return;
      }

      try {
        await this.authService.signupUser(email, password, this.dataInfo.appUserType, tel); // Aqui, 1 é o tipo de usuário
        this.router.navigate(['/home']);
      } catch (error) {
        console.error('Signup error:', error);
        if (error.code === 'auth/email-already-in-use') {
          const alert = await this.alertCtrl.create({
            header: this.dataText.getText('emailInUseHeader'),
            message: this.dataText.getText('emailInUseMessage'),
            buttons: [{
              text: 'OK',
              handler: () => {
                this.router.navigate(['/login']); // Redireciona para a página de login
              }
            }]
          });
          await alert.present();
        } else {
          const alert = await this.alertCtrl.create({
            header: this.dataText.getText('signupError'),
            message: error.message,
            buttons: ['OK']
          });
          await alert.present();
        }
      }
    }
  }

  goBack(){
    this.router.navigate(['/login']);
  }

  goTerms() {
    window.open(this.dataInfo.appTermsConditions, '_blank');
  }

  goPriv() {
    window.open(this.dataInfo.appTermsPriv, '_blank');
  }
}
