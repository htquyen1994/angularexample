import { Injectable } from '@angular/core';
import { AsyncValidator, AbstractControl, ValidationErrors, AsyncValidatorFn } from '@angular/forms';
import { AccountService, SettingsService, UNITS, CATCHMENT_SETTINGS } from 'src/client/app/shared';
import { Observable, of } from 'rxjs';
import { filter, first, withLatestFrom, map, catchError, debounceTime } from 'rxjs/operators';
import { TravelType, TravelMode } from '../enums';

@Injectable({
  providedIn: 'root'
})
export class CatchmentValidatorService {

  constructor(
    private _accountService: AccountService,
    private _settingsService: SettingsService,
  ) { }
  validate(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      const _value = control.get('value').value;
      const type = control.get('type').value;
      const isDetail = control.get('isDetail').value;
      const mode = control.get('mode').value
      return this.validateAsync(_value, type, isDetail, mode);
    }
  }

  validateAsync(_value, type, isDetail, mode): Observable<ValidationErrors | null> {
    return this._settingsService.startupSettings.pipe(
      debounceTime(50),
      filter(e => !!e),
      first(),
      withLatestFrom(
        this._accountService.account.pipe(filter(e => !!e), first())
      ),
      map(([setting, account]) => {
        const { isMetric } = account;
        const maxDriveDistance = isDetail ? CATCHMENT_SETTINGS.MAX_DISTANCE_HIGH : CATCHMENT_SETTINGS.MAX_DISTANCE_LOW;
        const maxDriveTime = isDetail ? CATCHMENT_SETTINGS.MAX_DURATION_HIGH : CATCHMENT_SETTINGS.MAX_DURATION_LOW;
        const maxValue = type === TravelType.DISTANCE ? mode === TravelMode.CIRCLE ? CATCHMENT_SETTINGS.MAX_DISTANCE_CIRCLE : maxDriveDistance : maxDriveTime;
        const minValue = type === TravelType.DISTANCE ? mode === TravelMode.CIRCLE ? CATCHMENT_SETTINGS.MIN_DISTANCE_CIRCLE : CATCHMENT_SETTINGS.MIN_DISTANCE : CATCHMENT_SETTINGS.MIN_DURATION;
        return this.validateValue(_value, type, maxValue, minValue, isMetric);
      }),
      catchError(() => of({
        errorMessage: `Something went wrong`
      }))
    );
  }

  validateValue(_value, type, maxValue, minValue, isMetric) {
    if (!_value || isNaN(_value)) {
      return {
        errorMessage: 'Invalid value'
      }
    }
    const value = Number.parseFloat(_value);
    if (value < 0.1) {
      return {
        errorMessage: 'Value should be bigger than 0.1',
      }
    }
    const _maxDriveDistance = isMetric ? maxValue : Number.parseFloat((maxValue * 1000 / UNITS.MILE.constant).toFixed(1))
    if (type === TravelType.DURATION && value > maxValue) {
      return {
        errorMessage: `Value should be smaller than ${maxValue}`
      }
    }
    if (type === TravelType.DISTANCE && value > _maxDriveDistance) {
      return {
        errorMessage: `Value should be smaller than ${_maxDriveDistance}`
      }
    }
    const _minDriveDistance = isMetric ? minValue :  Number.parseFloat((minValue * 1000 / UNITS.MILE.constant).toFixed(1))
    if (type === TravelType.DURATION && value < minValue) {
      return {
        errorMessage: `Value should be bigger than ${minValue}`
      }
    }
    if (type === TravelType.DISTANCE && value < _minDriveDistance) {
      return {
        errorMessage: `Value should be bigger than ${_minDriveDistance}`
      }
    }
    return null;
  }
}
