import { Component, OnInit, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { ModalController, LoadingController, AlertController } from '@ionic/angular';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';
import { DatabaseService } from 'src/app/services/database.service';
import { DataService } from 'src/app/services/data.service';
import { DataTextService } from 'src/app/services/data-text.service';

@Component({
  selector: 'app-document-modal',
  templateUrl: './document-modal.component.html',
  styleUrls: ['./document-modal.component.scss'],
})
export class DocumentModalComponent implements OnInit {
  documents: any[] = [];
  @ViewChildren('fileInput') fileInputs!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(
    private modalCtrl: ModalController,
    private storage: AngularFireStorage,
    private db: DatabaseService,
    private dataService: DataService,
    public dataText: DataTextService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.setupDocuments();
  }

  ionViewWillEnter() {
    this.loadDocumentStatus();
  }

  // Configuração dos documentos necessários com base no tipo de usuário
  setupDocuments() {
    const userType = this.dataService.appUserType;

    if (userType === 2) {
      // Profissional
      this.documents = [
        { name: 'Carteira de Identidade com CPF', uploaded: false, required: true, uploadedUrl: '' },
        { name: 'Carteira de Motorista (CNH)', uploaded: false, required: true, uploadedUrl: '' },
        { name: 'Certidão de Nada Consta', uploaded: false, required: true, uploadedUrl: '' },
      ];
    } else {
      // Cliente
      this.documents = [
        { name: 'Carteira de Identidade com CPF', uploaded: false, required: true, uploadedUrl: '' },
        { name: 'Comprovante de Residência', uploaded: false, required: true, uploadedUrl: '' },
        { name: 'Documentos do CNPJ', uploaded: false, required: false, uploadedUrl: '' },
      ];
    }
  }

  // Carregar o status dos documentos
  // Carregar o status dos documentos
async loadDocumentStatus() {
  const userId = this.dataService.userInfo.userId;

  try {
    // Obtenha os dados do banco de dados
    const data: any = await this.db.getDocument(`userDocuments/${userId}`);
    if (data) {
      console.log('Documentos encontrados no banco de dados:', data);

      // Atualizar o status dos documentos
      this.documents = this.documents.map((doc) => {
        const documentData = data[doc.name]; // Localiza pelo nome do documento
        if (documentData) {
          return {
            ...doc,
            uploaded: !!documentData.uploaded,
            uploadedUrl: documentData.uploadedUrl || '',
          };
        }
        return doc; // Documento ainda não enviado
      });

      console.log('Status dos documentos carregados:', this.documents);
    } else {
      console.warn('Nenhum dado encontrado para documentos do usuário.');
    }
  } catch (error) {
    console.error('Erro ao carregar status dos documentos:', error);
  }
}

  
  // Abrir seletor de arquivos
  async triggerFileInput(index: number, document: any) {
    if (document.uploaded) {
      const alert = await this.alertCtrl.create({
        header: 'Atenção',
        message: 'Este documento já foi enviado. Para atualizá-lo, entre em contato com o suporte.',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const fileInput = this.fileInputs.toArray()[index]?.nativeElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Fazer upload do documento
  async uploadDocument(event: Event, document: any) {
    const userId = this.dataService.userInfo.userId;
    const file = (event.target as HTMLInputElement).files?.[0];
  
    if (file) {
      const filePath = `documents/${userId}/${document.name}`;
      const fileRef = this.storage.ref(filePath);
  
      // Mostrar loading
      const loading = await this.loadingCtrl.create({
        message: this.dataText.getText('uploadingDocument'),
      });
      await loading.present();
  
      const task = this.storage.upload(filePath, file);
      task
        .snapshotChanges()
        .pipe(
          finalize(async () => {
            try {
              const downloadUrl = await fileRef.getDownloadURL().toPromise();
              document.uploaded = true;
              document.uploadedUrl = downloadUrl;
  
              // Salvar no banco de dados
              const updateData = {
                [document.name]: {
                  uploaded: true,
                  uploadedUrl: downloadUrl,
                },
              };
  
              await this.db.updateDocument(`userDocuments/${userId}`, updateData);
  
              console.log('Documento enviado com sucesso:', document.name);
            } catch (error) {
              console.error('Erro ao salvar URL do documento:', error);
            } finally {
              await loading.dismiss();
            }
          })
        )
        .subscribe({
          error: async (error) => {
            console.error('Erro ao fazer upload:', error);
            await loading.dismiss();
          },
        });
    }
  }
  

  dismissModal() {
    this.modalCtrl.dismiss();
  }
}
