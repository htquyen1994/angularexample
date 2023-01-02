import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { HttpService } from '../../shared/http.service';
import { MatchItCriteria } from '../../resultpanel/shared/models/match-it-filter.model';
import { ReviewModel } from '../../resultpanel/shared/models/match-it-review.model';

@Injectable({
  providedIn: 'root'
})
export class AnalysisApiService {

  constructor(private httpService: HttpService) { }

  public previewMatchItForm(data: MatchItCriteria): Observable<ReviewModel> {
    return this.httpService.postJSON(`DataPackage/GetMatchIt`, data);
  }
}
