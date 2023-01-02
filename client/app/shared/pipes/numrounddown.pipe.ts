import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numrounddown'
})
export class NumrounddownPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    var num = Math.floor(value);
    return num;
  }

}
