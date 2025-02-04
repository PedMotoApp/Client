import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PricingService {
  constructor(private db: AngularFireDatabase) {}

  /**
   * Get price tables dynamically from Firebase.
   */
  getPriceTables(): Observable<any[]> {
    return this.db.list('priceTables').valueChanges();
  }

  /**
   * Calculate the total price based on the pricing table and distance.
   */
  calculate(selectedTable: any, dropPoints: any[], distanceAndTime: { totalDistance: number; totalTime: number }) {
    let { totalDistance, totalTime } = distanceAndTime;

    // Ensure valid values
    totalDistance = totalDistance || 0;
    totalTime = totalTime || 0;

    let totalPrice = 0;

    if (!selectedTable) {
      console.error('Tabela de preços não selecionada.');
      return { distanceCharged: 0, totalDistance, totalTime, extraPoints: 0, systemFee: 0, price: '0.00' };
    }

    // Validate essential pricing values
    const valueStart = selectedTable.valueStart || 0;
    const valueMeter = selectedTable.valueMeter || 0;
    const valuePoint = selectedTable.valuePoint || 0;
    const workFreeMeters = selectedTable.workFreeMeters || 0;
    const workFreePoints = selectedTable.workFreePoints || 0;
    const workMinuteValue = selectedTable.workMinuteValue || 0;
    const systemFee = selectedTable.systemFee || 0;
    const fixedFee = selectedTable.fixedFee || 0;

    // ** Calculate Distance-Based Charges **
    const distanceCharged = Math.max(0, totalDistance - workFreeMeters);
    const distanceCost = distanceCharged * valueMeter;

    // ** Calculate Extra Drop Points Charge **
    const extraPoints = Math.max(0, dropPoints.length - workFreePoints);
    const extraPointsCost = extraPoints * valuePoint;

    // ** Calculate Time-Based Charges **
    const timeCharged = Math.max(0, totalTime - (selectedTable.workFreeMinutes || 0));
    const timeCost = timeCharged * workMinuteValue;

    // ** Calculate Total Price **
    totalPrice += valueStart;
    totalPrice += distanceCost;
    totalPrice += extraPointsCost;
    totalPrice += timeCost;
    totalPrice += systemFee;
    totalPrice += fixedFee;

    // Ensure final values are numbers
    totalPrice = parseFloat(totalPrice.toFixed(2));

    console.log(`🔍 Calculated Price: 
      Start Fee: ${valueStart}, 
      Distance Charged (${distanceCharged} km): ${distanceCost}, 
      Extra Points (${extraPoints}): ${extraPointsCost}, 
      Time Charge (${timeCharged} min): ${timeCost},
      System Fee: ${systemFee}, 
      Fixed Fee: ${fixedFee},
      Final Price: ${totalPrice}`);

    return {
      distanceCharged,
      totalDistance,
      totalTime,
      extraPoints,
      systemFee,
      fixedFee,
      price: totalPrice.toFixed(2),
    };
  }

  /**
   * Calculate the driver's earnings after commission.
   */
  calculateDriverEarnings(totalPrice: number, selectedTable: any): number {
    const commissionFromPercent = (totalPrice * (selectedTable.driverCommissionPercent || 0)) / 100;
    const fixedCommission = selectedTable.driverCommissionFixed || 0;
    return totalPrice - commissionFromPercent - fixedCommission;
  }
}
