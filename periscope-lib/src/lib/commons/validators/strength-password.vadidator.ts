import { AbstractControl, ValidatorFn } from '@angular/forms';

export enum EMeasureStrengthType {
  DIGITS = 'digits',
  LOWER = 'lower',
  UPPER = 'upper',
  NONWORDS = 'nonWords'
}

export function strengthPassword(variations?: EMeasureStrengthType[]): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const pass = control.value;
    return measureStrength(pass, variations);
  }
}

export function measureStrength(pass: string, _variations: EMeasureStrengthType[] = Object.values(EMeasureStrengthType)) {
  // bonus points for mixing it up
  const variations = {
    digits: /\d/.test(pass),
    lower: /[a-z]/.test(pass),
    upper: /[A-Z]/.test(pass),
    nonWords: /\W/.test(pass),
  };
  const result = {};
  for (let i = 0; i < _variations.length; i++) {
    const key = _variations[i];
    if(!variations[key]){
      result[key] = !variations[key];
    }
  }
  return Object.keys(result).length ? { ...result } : null;
}
