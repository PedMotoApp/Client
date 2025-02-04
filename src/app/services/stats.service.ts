import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root',
})


export class StatsService {
  
  constructor(private db: DatabaseService) {}
  

  /**
   * Consolida as estatísticas de um usuário.
   * @param userId ID do usuário.
   * @param userType Tipo do usuário ('client' ou 'driver').
   */
  async consolidateUserStats(userId: string, userType: string): Promise<any> {
    try {
      // Obter todas as ordens do histórico
      const orders = await this.db.getCollection('orderHistory', (ref) =>
        ref.orderByChild(userType === 'driver' ? 'driverId' : 'userId').equalTo(userId)
      );
  
      if (!orders || orders.length === 0) {
        console.warn(`Nenhum dado encontrado para o usuário ${userId}`);
        return null;
      }
  
      // Processamento dos dados
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().getMonth();
  
      const totalServices = orders.length;
      const totalEarnings = orders.reduce(
        (sum, order) => sum + parseFloat(order.servicesPrices?.driverEarnings || 0),
        0
      );
      const dailyEarnings = orders
        .filter((order) => order.finalizedAt.startsWith(today))
        .reduce((sum, order) => sum + parseFloat(order.servicesPrices?.driverEarnings || 0), 0);
      const monthlyEarnings = orders
        .filter((order) => new Date(order.finalizedAt).getMonth() === currentMonth)
        .reduce((sum, order) => sum + parseFloat(order.servicesPrices?.driverEarnings || 0), 0);
      const totalDistance = orders.reduce(
        (sum, order) => sum + parseFloat(order.servicesPrices?.totalDistance || 0),
        0
      );
  
      // **Cálculo de Rankings e Medalhas**
      const consecutiveCompletions = orders.reduce((count, order) => {
        return order.status === 'Finalizado' ? count + 1 : 0;
      }, 0);
  
      const medals = {
        beginner: totalServices >= 1,
        proDriver: consecutiveCompletions >= 10,
        marathoner: totalDistance >= 500,
        moneyMaker: totalEarnings >= 1000,
      };
  
      const ranking = consecutiveCompletions >= 20
        ? 'Gold'
        : consecutiveCompletions >= 10
        ? 'Silver'
        : 'Bronze';
  
      // Consolidar as estatísticas
      const stats = {
        totalServices,
        totalEarnings: totalEarnings.toFixed(2),
        dailyEarnings: dailyEarnings.toFixed(2),
        monthlyEarnings: monthlyEarnings.toFixed(2),
        completionRate: ((consecutiveCompletions / totalServices) * 100).toFixed(2),
        totalDistance: totalDistance.toFixed(2),
        medals,
        ranking,
      };
  
      // Salvar no banco de dados do usuário
      await this.db.updateDocument(`userProfile/${userId}/stats`, stats);
  
      return stats;
    } catch (error) {
      console.error('Erro ao consolidar estatísticas:', error);
      throw error;
    }
  }
  
}
