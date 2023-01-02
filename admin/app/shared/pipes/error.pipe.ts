import { Pipe, PipeTransform } from '@angular/core';
import { IErrorResponse } from '@admin-shared/models/error';

@Pipe({
  name: 'error'
})
export class ErrorPipe implements PipeTransform {

  transform(value: IErrorResponse, ...args: unknown[]): unknown {
    return value.error.message;
  }

}
