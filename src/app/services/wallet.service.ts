import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private apiUrl = 'https://api.motokapp.com.br/api/wallets';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = 'seu_token_aqui'; // Substitua pelo token real
    return new HttpHeaders().set('Authorization', `Bearer ${token}`);
  }

  createPreference(amount: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/create-preference`, { amount }, { headers });
  }

  // Obter saldo do usuário
  getBalance(userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/balance`, {
      headers,
      params: { userId },
    });
  }

  // Iniciar o checkout para obter o preferenceId
  initiateCheckout(amount: number, userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/checkout`, { amount, userId }, { headers });
  }

  // Processar pagamento com os dados do cartão
  processPayment(cardData: any): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/process-payment`, cardData, { headers });
  }

  // Atualiza o saldo do usuário
  updateBalance(userId: string, amount: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/update-balance`, { userId, amount }, { headers });
  }

  // Diminui o saldo do usuário
  decreaseBalance(userId: string, amount: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/decrease-balance`, { userId, amount }, { headers });
  }

  // Adiciona o histórico de uma ordem
  addOrderToHistory(order: {
    serviceId: string;
    driverId: string;
    userId: string;
    amount: number;
    finalizedAt: string;
  }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.apiUrl}/add-to-history`, order, { headers });
  }

  // Solicitar retirada
  requestWithdrawal(userId: string, amount: number): Observable<any> {
    const headers = this.getAuthHeaders();    
    return this.http.post(`${this.apiUrl}/request-withdrawal`, { userId, amount }, { headers });
  }

  
   // Obter histórico de retiradas
   getWithdrawalHistory(userId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/withdrawal-history`, {
      headers,
      params: { userId },
    });
  }
}
