import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private apiUrl = 'https://us-central1-pedmoto-b5358.cloudfunctions.net'; // Firebase Functions

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = 'seu_token_aqui'; // Substitua pelo token real se necessário
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  // Obter saldo do usuário
  getBalance(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getBalance`, {
      params: { userId },
    });
  }

  // Processar pagamento com os dados do cartão
  processPayment(cardData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/processPayment`, cardData);
  }

  // Atualiza o saldo do usuário
  updateBalance(userId: string, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/updateBalance`, { userId, amount });
  }

  // Diminui o saldo do usuário
  decreaseBalance(userId: string, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/decreaseBalance`, { userId, amount });
  }

  // Adiciona o histórico de uma ordem
  addOrderToHistory(order: {
    serviceId: string;
    driverId: string;
    userId: string;
    amount: number;
    finalizedAt: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/addToHistory`, order);
  }

  // Solicitar retirada
  requestWithdrawal(userId: string, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/requestWithdrawal`, { userId, amount });
  }

  // Obter histórico de retiradas
  getWithdrawalHistory(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/getWithdrawalHistory`, {
      params: { userId },
    });
  }
}
