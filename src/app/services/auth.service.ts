// auth.service.ts
import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { User } from 'firebase/auth';
import { GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth'; // Importação explícita
import * as moment from 'moment';
import { OAuthProvider } from 'firebase/auth';

import { Plugins } from '@capacitor/core';

const { SignInWithApple } = Plugins;


@Injectable({
  providedIn: 'root',
})
export class AuthService {

  constructor(
    private afAuth: AngularFireAuth,
    private db: AngularFireDatabase
  ) {
    // Configura o idioma para português
    this.afAuth.useDeviceLanguage();
  }

  async getUserInfo(): Promise<User | null> {
    return this.afAuth.currentUser;
  }

  async loginUser(email: string, password: string) {
    return await this.afAuth.signInWithEmailAndPassword(email, password);
  }

  async loginAnon() {
    return await this.afAuth.signInAnonymously();
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider(); // Uso do GoogleAuthProvider com importação explícita
    try {
      const result = await this.afAuth.signInWithPopup(provider);
      return result; // Retorna o resultado do login com o Google
    } catch (error) {
      console.error('Erro na autenticação com Google:', error);
      throw error;
    }
  }

  async signInWithApple() {
    try {
      const response = await SignInWithApple.Authorize();
      const { identityToken } = response.response;
      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({
        idToken: identityToken,
      });
      const userCredential = await this.afAuth.signInWithCredential(credential);
      console.log('Usuário autenticado com Apple:', userCredential.user);
    } catch (error) {
      console.error('Erro ao autenticar com Apple:', error);
    }
}


  async loginWithFacebook() {
    const provider = new FacebookAuthProvider(); // Uso do FacebookAuthProvider com importação explícita
    return await this.afAuth.signInWithPopup(provider);
  }

  async signupUser(email: string, password: string, userType: number, tel: string) {
    const newUser = await this.afAuth.createUserWithEmailAndPassword(email, password);
    await this.registerUserDatabase(email, userType, newUser.user?.uid || '', tel);
  }

  async registerUserDatabase(email: string, userType: number, uid: string, tel: string) {
    const path = `/userProfile/${uid}`;
    const userData = {
      email,
      userType,
      tel,
      datetime: moment().format(),
      primeiroUso: true,
      uid,
    };
    await this.db.object(path).update(userData);
  }

  async resetPassword(email: string) {
    return await this.afAuth.sendPasswordResetEmail(email);
  }

  async logoutUser() {
    
    return await this.afAuth.signOut();
  }

  async currentUser() {
    return this.afAuth.currentUser;
  }

  async currentUserUid(): Promise<string | null> {
    const user = await this.currentUser();
    return user ? user.uid : null;
  }

  async currentUserEmail(): Promise<string | null> {
    const user = await this.currentUser();
    return user ? user.email : null;
  }

  async currentUserPhoto(): Promise<string | null> {
    const user = await this.currentUser();
    return user ? user.photoURL : null;
  }

  async currentUserDisplayName(): Promise<string | null> {
    const user = await this.currentUser();
    return user ? user.displayName : null;
  }

  async signInPhone(phoneNumber: string, appVerifier: any) {
    // Placeholder para autenticação via número de telefone, caso necessário no futuro.
  }
  
  async deleteUser() {
    const user = await this.currentUser();
    if (user) {
      return await user.delete();
    }
  }

  
  
}
