import { Pipe, PipeTransform } from '@angular/core';
import { Helper } from '../meassure-tool/helper';
import { UnitTypeId } from '../meassure-tool/UnitTypeId';

@Pipe({
  name: 'distancePipe'
})
export class DistancePipe implements PipeTransform {
  private static pipes = {
    'metric': new Helper({
      unit: UnitTypeId.METRIC
    }),
    'imperial': new Helper({
      unit: UnitTypeId.IMPERIAL
    })
  };

  transform(value: number, pipeToken: any): unknown {
    if (DistancePipe.pipes[pipeToken]) {
      return DistancePipe.pipes[pipeToken].formatLength(value || 0);
    } else {
      return value;
    }
  }

}
