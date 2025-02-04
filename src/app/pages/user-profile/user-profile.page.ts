  import { Component, OnInit } from '@angular/core';
  import { FormBuilder, FormGroup, Validators } from '@angular/forms';
  import { DatabaseService } from 'src/app/services/database.service';
  import { DataService } from 'src/app/services/data.service';
  import { UiUtilsService } from 'src/app/services/ui-utils.service';
  import { DataTextService } from 'src/app/services/data-text.service';
  import { Router } from '@angular/router';
  import { AlertController, LoadingController } from '@ionic/angular';
  import { StatsService } from 'src/app/services/stats.service';
  import { AuthService } from 'src/app/services/auth.service'; 
  import { DocumentModalComponent } from 'src/app/components/document-modal/document-modal.component';
  import { ModalController } from '@ionic/angular';

  @Component({
    selector: 'app-user-profile',
    templateUrl: './user-profile.page.html',
    styleUrls: ['./user-profile.page.scss'],
  })
  export class UserProfilePage implements OnInit {
    userInfoForm: FormGroup;

    userStats = {
      ranking: '',
      totalServices: 0,
      totalDistance: 0,
      totalEarnings: 0,
    };

    constructor(
      private fb: FormBuilder,
      private db: DatabaseService,
      public dataService: DataService,
      private uiUtils: UiUtilsService,
      public dataText: DataTextService,
      private router: Router,
      private alertCtrl: AlertController,
      private loadingCtrl: LoadingController,
      private statsService: StatsService,
      private authService: AuthService,
      private modalCtrl: ModalController
    ) {
      this.userInfoForm = this.fb.group({
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        instagram: [''],
        phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,11}$')]],
        cpf: ['', Validators.pattern('^[0-9]{11}$')],
        cnpj: ['', Validators.pattern('^[0-9]{14}$')],
        photo: [''],
        pixKey: ['', Validators.required], 
      });

      
    }

    ngOnInit() {
      
    }

    ionViewWillEnter() {
      if (this.dataService.isHome) {
        this.startInterface();
      } else {
        this.router.navigate(['/login']);
      }
    }

    startInterface() {
      this.loadUserProfile();
    }

    async loadUserProfile() {
      const userId = this.dataService.userInfo?.userId;
      if (!userId) {
        console.error('Usuário não autenticado.');
        return;
      }

      console.log('Carregando perfil do usuário:', userId, this.dataService.userInfo);    
      this.userInfoForm.patchValue(this.dataService.userInfo);

      this.statsService.consolidateUserStats(userId, 'client').then((stats) => {
        this.userStats = stats || {};
      });

    }
    
    
    
    async saveProfile() {
      const userId = this.dataService.userInfo?.userId;
    
      if (!userId || this.userInfoForm.invalid) {
        this.showAlert('Erro', 'Preencha todos os campos obrigatórios corretamente.');
        return;
      }
    
      const loading = await this.loadingCtrl.create({
        message: 'Salvando perfil...',
      });
      await loading.present();
    
      try {
        await this.db.updateDocument(`userProfile/${userId}`, this.userInfoForm.value);
        await loading.dismiss();
        this.showAlert('Perfil Salvo', 'Suas informações foram atualizadas com sucesso.');

        if(this.dataService.userInfo.userType === 2){
          this.router.navigate(['/driver']);
        }
        else{
          this.router.navigate(['/home']);
        }
        
      } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        await loading.dismiss();
        this.showAlert('Erro', 'Não foi possível salvar as informações.');
      }
    }
    
    

    onFileSelected(event: Event) {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file && (file.type === 'image/png' || file.type === 'image/jpeg')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.userInfoForm.patchValue({ photo: reader.result });
        };
        reader.readAsDataURL(file);
      } else {
        this.showAlert('Formato Inválido', 'Por favor, selecione um arquivo PNG ou JPEG.');
      }
    }


    async confirmDeleteAccount() {
      const firstAlert = await this.alertCtrl.create({
        header: 'Confirmação',
        message: 'Tem certeza que deseja remover sua conta? Essa ação é irreversível.',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Continuar',
            handler: () => this.finalDeleteAccount(),
          },
        ],
      });
  
      await firstAlert.present();
    }
  
    async finalDeleteAccount() {
      const secondAlert = await this.alertCtrl.create({
        header: 'Confirmação Final',
        message: 'Ao confirmar, sua conta será desativada e todos os dados de autenticação serão removidos. Deseja prosseguir?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Excluir Conta',
            handler: async () => {
              await this.deleteAccount();
            },
          },
        ],
      });
  
      await secondAlert.present();
    }
  
    async deleteAccount() {
      const userId = this.dataService.userInfo?.userId;
      if (!userId) return;
  
      const loading = await this.loadingCtrl.create({
        message: 'Removendo conta...',
      });
      await loading.present();
  
      try {
        // Desativar conta no banco de dados
        await this.db.updateDocument(`userProfile/${userId}`, { status: 'Inativo' });
  
        // Remover autenticação do Firebase

        await this.authService.deleteUser();

  
        // Limpar dados locais
        this.dataService.clearUserData();
  
        await loading.dismiss();
        this.showAlert('Conta Removida', 'Sua conta foi removida com sucesso.');

        await this.authService.logoutUser();

        this.router.navigate(['/login']);
      } catch (error) {
        console.error('Erro ao remover conta:', error);
        await loading.dismiss();
        this.showAlert('Erro', 'Não foi possível remover a conta.');
      }
    }
  
    async showAlert(header: string, message: string) {
      const alert = await this.alertCtrl.create({
        header,
        message,
        buttons: ['OK'],
      });
      await alert.present();
    }

    async openDocumentModal() {
      const modal = await this.modalCtrl.create({
        component: DocumentModalComponent,
      });
      await modal.present();
    }
  
  }
