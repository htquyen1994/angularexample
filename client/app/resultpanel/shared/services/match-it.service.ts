import { Injectable } from '@angular/core';
import { HttpService } from '../../../shared/http.service';
import { Observable, Subject, ReplaySubject, of } from 'rxjs';
import { MatchItLayer, MatchItCriteria, MatchItLayerFilter } from '../models/match-it-filter.model';
import { ReviewModel } from '../models/match-it-review.model';

@Injectable({
  providedIn: 'root'
})
export class MatchItService {

  constructor(private httpService: HttpService) { }

  public getFilters(layers: Array<MatchItLayer>): Observable<MatchItLayerFilter[]> {
    layers = layers.map(e => {
      return {
        ...e,
        dataViewName: e.dataViewName ? e.dataViewName : 'Default'
      }
    })
    return this.httpService.postJSON(`DataPackage/LoadMatchItFilterColumns`, layers);
  }

  public reviewMatchItForm(data: MatchItCriteria): Observable<ReviewModel> {
    return this.httpService.postJSON(`DataPackage/GetMatchIt`, data);
  }

  public createMatchLayer(data: any, _data: any = null, dataViewName: string = null): Observable<any> {
    if(_data){
      return this.httpService.postJSON(`DataPackage/SaveMatchItLayerFromFilter`, {...data,..._data,  dataViewName: dataViewName ? dataViewName : 'Default'});
    }else{
      return this.httpService.postJSON(`DataPackage/SaveMatchItLayer`, data);
    }
  }

  public downLoadFile(file) {
    this.httpService.downloadFile(file);
    return of({})
  }
}
