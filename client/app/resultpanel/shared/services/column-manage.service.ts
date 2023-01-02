import { Injectable } from '@angular/core';
import { HttpService } from '@client/app/shared';
import { CustomCoulumnRequest, ICalculateColumnRequest, ILayer } from '@client/app/shared/interfaces';
import { Observable, Subject, forkJoin } from 'rxjs';
import { map, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ColumnManageService {

  signalUpdateSuccessSource: Subject<any> = new Subject<any>();
  signalUpdateSuccess = this.signalUpdateSuccessSource.asObservable();

  constructor(private httpService: HttpService) { }

  columnRequest(layer: ILayer, customColumnRequest: CustomCoulumnRequest): Observable<any> {
    return forkJoin(
      this.httpService.postJSON(`DataPackage/AlterLayer/${layer.id}/Default`, {...customColumnRequest, source: layer.source, owner: layer.owner}),
      this.signalUpdateSuccess.pipe(first())
    ).pipe(map(([res1, res2]) => {
      return res1;
    }))
  }

  updateSuccess() {
    this.signalUpdateSuccessSource.next();
  }

  columnCalculateRequest(layer: ILayer ,model: ICalculateColumnRequest): Observable<any> {
    return this.httpService.postJSON(`DataPackage/GenerateColumnDataByExpression/${layer.id}/Default`, {...model, source: layer.source, owner: layer.owner})
  }
}
