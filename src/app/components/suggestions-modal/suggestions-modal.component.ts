import { Component, Input } from '@angular/core';

import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-suggestions-modal',
  templateUrl: './suggestions-modal.component.html',
  styleUrls: ['./suggestions-modal.component.scss'],
})
export class SuggestionsModalComponent {
  @Input() suggestions: any[] = []; // Recebe as sugestões como entrada

  constructor(private modalController: ModalController) {}

  selectSuggestion(suggestion: any) {
    this.modalController.dismiss({ suggestion }); // Envia a sugestão selecionada
  }

  close() {
    this.modalController.dismiss(); // Fecha o modal
  }
}
