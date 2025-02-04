import { AbstractControl } from '@angular/forms';

export function passwordValidator(control: AbstractControl) {

  if (control && control.value !== null && control.value !== undefined) {
    const value = control.value as string;
    if (value.length < 6) {
      return {
        invalidPassword: true,
        message: 'Senha deve ter no mínimo 6 caracteres ',
      };
    }
     
  }
  return null;
}
