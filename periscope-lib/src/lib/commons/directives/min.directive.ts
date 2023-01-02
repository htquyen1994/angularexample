import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, AbstractControl, Validators } from '@angular/forms';

@Directive({
  selector: '[psMin]',
  providers: [{ provide: NG_VALIDATORS, useExisting: MinDirective, multi: true }]
})
export class MinDirective {
  @Input() psMin: number;

  validate(control: AbstractControl): { [key: string]: any } {

    return Validators.min(this.psMin)(control)
  }

}
