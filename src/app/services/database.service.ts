import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { AuthService } from './auth.service';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { from } from 'rxjs';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private dateYear = moment().format('YYYY');
  private dateMonth = moment().format('MM');
  private dateDay = moment().format('DD');

  constructor(
    private db: AngularFireDatabase,
    private afAuth: AngularFireAuth,
    private authService: AuthService
  ) {}
 
getUser(): Observable<any> {
  return from(this.authService.currentUserUid()).pipe(
    switchMap(uid => {
      const path = `/userProfile/`;
      return this.db.list(path, ref => ref.orderByKey().equalTo(uid)).snapshotChanges();
    })
  );
}

  getUserInfo(uid: string): Observable<any> {
    const path = `/userProfile/`;
    return this.db.list(path, ref => ref.orderByKey().equalTo(uid)).snapshotChanges();
  }

 
  getDocument(path: string): Promise<any> {
    return this.db.object(path).valueChanges().pipe(take(1)).toPromise();
  }
  
  

  // Define the getCollection function
  async getCollection(path: string, queryFn?: (ref: any) => any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let ref = this.db.list(path, queryFn).snapshotChanges();

      ref.pipe(
        map((items: any[]) =>
          items.map((item: any) => ({
            ...item.payload.val(),
            key: item.key // Include the key
          }))
        )
      ).subscribe(
        (data) => resolve(data),
        (error) => reject(error)
      );
    });
  }


  // Adiciona dados a uma coleção no Realtime Database
  async addToCollection(collection: string, data: any): Promise<string> {
    const ref = this.db.list(collection);
    const newRef = await ref.push(data); // Adiciona um novo item à coleção
    return newRef.key as string; // Retorna a chave gerada pelo Firebase
  }

  // Ouve mudanças em um documento no Realtime Database
  listenToDocument(path: string): Observable<any> {
    return this.db.object(path).valueChanges(); // Observa alterações no documento
  }

  // Atualiza um documento no Realtime Database
  async updateDocument(path: string, data: any): Promise<void> {
    await this.db.object(path).update(data); // Atualiza os dados no caminho especificado
  }

  async removeDocument(path: string): Promise<void> {
    await this.db.object(path).remove(); // Remove o documento do caminho especificado
  }
  


}
