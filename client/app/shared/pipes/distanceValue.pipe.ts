import { Pipe, PipeTransform } from '@angular/core';
import { TravelUnit } from '../../core/modules/view-management/enums';
import { UNITS } from '../global';

@Pipe({
  name: 'distanceValuePipe'
})
export class DistanceValuePipe implements PipeTransform {

  transform(value: number| string, unit: TravelUnit, currentUnit: TravelUnit): string {
    const _value = Number.parseFloat(value.toString());
    if(unit === currentUnit) {
      return _value ? _value.toFixed(2) : '';
    }
    if (currentUnit === TravelUnit.KILOMETER){
      return (_value * (UNITS.MILE.constant / 1000)).toFixed(2)
    }
    if (currentUnit === TravelUnit.MILE){
      return (_value / (UNITS.MILE.constant / 1000)).toFixed(2)
    }
    return value.toString();
  }

}
