import {
  CurrencyPipe, DatePipe, DecimalPipe, LowerCasePipe, PercentPipe, SlicePipe,
  TitleCasePipe, UpperCasePipe
} from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { DistancePipe } from './distance.pipe';

@Pipe({
  name: 'divide100Pipe'
})
export class Divide100Pipe implements PipeTransform {
  transform(value: any, pipeArgs: string): any {
    return new PercentPipe('en-US').transform(value / 100, pipeArgs);
  }
}

@Pipe({
  name: 'dynamicPipe'
})
export class DynamicPipe implements PipeTransform {

  private static pipes = {
    'number': new DecimalPipe('en-US'),
    'lowercase': new LowerCasePipe(),
    'titlecase': new TitleCasePipe(),
    'currency': new CurrencyPipe('en-US'),
    'percent': new PercentPipe('en-US'),
    'uppercase': new UpperCasePipe(),
    'date': new DatePipe('en-US'),
    'slice': new SlicePipe(),
    'distance': new DistancePipe(),
    'percent_100': new Divide100Pipe()
  };

  transform(value: any, pipeToken: any, pipeArgs: any[]): any {
    if (DynamicPipe.pipes[pipeToken]) {
      return DynamicPipe.pipes[pipeToken].transform(value, ...pipeArgs);
    } else {
      return value;
    }
  }
}
