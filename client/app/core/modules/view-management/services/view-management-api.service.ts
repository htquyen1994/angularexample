import { Injectable } from '@angular/core';
import { HttpService, LayerSource } from '@client/app/shared';
import { zip, of } from 'rxjs';
import { map, withLatestFrom, filter, first } from 'rxjs/operators';
import { IInsightView, ICatchmentView } from '../interface';
import { string_to_slug } from '@periscope-lib/commons/utils/helper';
import { TravelMode, TravelType, TravelUnit } from '../enums';
import { AccountService } from 'src/client/app/shared';
import { ViewManagementLogicService } from './view-management-logic.service';

@Injectable({
  providedIn: 'root'
})
export class ViewManagementApiService {


  constructor(
    private httpService: HttpService,
    private _accountService: AccountService,
    private _viewManagementLogicService: ViewManagementLogicService
  ) {
  }

  getInsightViews() {
    return zip(
      this.httpService.get(`TenantSettings/?settingCollection=insight&settingName=insight`),
      this.httpService.get(`UserSettings/?settingCollection=insight&settingName=insight`),
      this._accountService.account.pipe(filter(e=>!!e), first())
      ).pipe(
        map(data => {
          const { isMetric } = data[2];
          const tenant = Array.isArray(data[0].insights) ? data[0].insights : [];
          const user = Array.isArray(data[1].insights) ? data[1].insights : [];

          const _user = user.map((x: IInsightView, i) => {
            const id = string_to_slug(`${LayerSource.USER} ${x.name} ${i}`);
            return this._viewManagementLogicService.toInsightView({
              ...x,
              source: LayerSource.USER,
              id
            }, isMetric)
          });
          // If one of the user views is set to default, this should override the tenant ones
          const isDefault = _user.find(x => x.isDefault);
          if (isDefault !== undefined) {
            tenant.forEach((x: IInsightView) => x.isDefault = false);
          }
          const _tenant = tenant.map((x: IInsightView, i) => {
            const id = string_to_slug(`${LayerSource.CORPORATE} ${x.name} ${i}`);
            return this._viewManagementLogicService.toInsightView({
              ...x,
              source: LayerSource.CORPORATE,
              id,
              isDefault: isDefault !== undefined ? false : x.isDefault
            }, isMetric)
          });

          return [].concat(_tenant).concat(_user)
        }))
  }

  getTenantInsightViews() {
    return this.httpService.get(`TenantSettings/?settingCollection=insight&settingName=insight`);
  }

  getUserInsightViews() {
    return this.httpService.get(`UserSettings/?settingCollection=insight&settingName=insight`);
  }

  updateUserStore(views: IInsightView[]) {
    const userInsights = {
      insights: views.filter(a => a.source === LayerSource.USER)
    };
    // return of()
    return this.httpService.postJSON('UserSettings/?settingCollection=insight&settingName=insight', userInsights)
  }


}
