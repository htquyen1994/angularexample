import { Directive, Input } from '@angular/core';
import { NG_VALIDATORS, Validator, AbstractControl, ValidationErrors } from '@angular/forms';
import { CatchmentValidatorService } from '../services';
import { Observable } from 'rxjs';
import { TravelType } from '../enums';

@Directive({
  selector: '[psCatchmentValueValidator][ngModel]',
  providers: [{provide: NG_VALIDATORS, useExisting: CatchmentValueValidatorDirective, multi: true}]
})
export class CatchmentValueValidatorDirective implements Validator {
  private _psCatchmentValueValidator: {isDetail, isMetric, type} ;
  private _onChange: Function;

  @Input()
  get psCatchmentValueValidator() {
    return this._psCatchmentValueValidator;
  }

  set psCatchmentValueValidator(value: {isDetail, isMetric, type}) {
    this._psCatchmentValueValidator = {...value};
    if (this._onChange) this._onChange();
  }
  @Input("maxValue") maxValue: number;
  @Input("minValue") minValue: number = 1;
  constructor(
    private _catchmentValidatorService: CatchmentValidatorService
  ) { }

  validate(control: AbstractControl): ValidationErrors | null  {
    const {type, isMetric} = this.psCatchmentValueValidator;
    return this._catchmentValidatorService.validateValue(control.value || 10, type, this.maxValue, this.minValue, isMetric);
  }

  registerOnValidatorChange(fn: () => void): void {
    this._onChange = fn;
  }
}
