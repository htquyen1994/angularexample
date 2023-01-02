import { Injectable } from '@angular/core';
import {forkJoin } from 'rxjs';
import { ShareFeatureForm } from '../interfaces';
import { HttpService } from '../http.service';
import { EFeatureShare } from '../enums';

@Injectable({
  providedIn: 'root'
})
export class FeatureShareService {

  constructor(
    private httpService: HttpService
  ) {
  }

  copyToUsers(model: ShareFeatureForm, users: string[]) {
    const { type, data, key } = model;
    let params = '';
    switch (type) {
      case EFeatureShare.FILTER:
        params += "?settingCollection=filters";
        params += "&settingName=filters";
        params += `&layerId=${key}`;
        break;
      case EFeatureShare.LAYER_STYLE:
        params += "?settingCollection=styles";
        params += "&settingName=styles";
        params += `&layerId=${key}`;
        break;
        case EFeatureShare.INSIGHT_VIEW:
        params += "?settingCollection=insight";
        params += "&settingName=insight";
        params += `&layerId=${key}`;
        break;
      default:
        break;
    }
    const observables = users.map(user => {
        return this.httpService.postJSON(`UserSettings/CopyToUser${params}&user=${user}`, data)
      });

    return forkJoin(observables);
  }
}
