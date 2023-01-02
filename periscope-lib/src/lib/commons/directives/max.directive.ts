import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, AbstractControl, Validators } from '@angular/forms';

@Directive({
  selector: '[psMax]',
  providers: [{ provide: NG_VALIDATORS, useExisting: MaxDirective, multi: true }]
})
export class MaxDirective {
  @Input() psMax: number;

  validate(control: AbstractControl): { [key: string]: any } {

    return Validators.max(this.psMax)(control)
  }

}
