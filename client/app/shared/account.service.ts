import { IAccount, EPerformanceLevel } from './interfaces/account-interfaces';
import { throwError, zip, Subscription, ReplaySubject, Observable, Subject, Observer } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { tap } from 'rxjs/operators';

@Injectable()
export class AccountService {
  accountStore: IAccount = null;
  accountSource = new ReplaySubject<IAccount>(1);
  private hideButton = new Subject<boolean>();

  account = this.accountSource.asObservable();
  hideButton$ = this.hideButton.asObservable();

  nonOverlapLabelMode: boolean = true;

  constructor(private httpService: HttpService) {
    this.account.subscribe(account => {
      this.accountStore = account;
    });
  }

  getAccount(): Subscription {

    return zip(
      this.httpService.post(`UserProfile/GetUserProfile`),
      this.httpService.get(`TenantSettings/?settingCollection=uifunctionalitysettings&settingName=uifunctionalitysettings`))
      .subscribe((data: any) => {
        return this.accountSource.next(this.convertToIAccount(data));
      },
        error => {
          return throwError(error);
        });
  }

  setSetting(name: string, value: string): Observable<any> {

    let params = new HttpParams();
    params = params.set(name, value);

    return zip(
      this.httpService.post('UserProfile/SetProfile', params),
      this.httpService.get(`TenantSettings/?settingCollection=uifunctionalitysettings&settingName=uifunctionalitysettings`)).pipe(
        tap((account: any) => {
          this.accountSource.next(this.convertToIAccount(account));
        })
      );
  }

  setNonOverlapLabelMode(value: boolean) {
    this.nonOverlapLabelMode = value;
    this.accountSource.next({ ...this.accountStore, nonOverlapLabelMode: this.nonOverlapLabelMode });
  }

  private convertToIAccount([user, ui]): IAccount {
    const hasPermission = (permission) => (ui[permission])?ui[permission].includes(user.membershipLevel.name):false;
    return {
      isProfesional: true,
      allowEmailNotification: user.allowEmailNotification,
      isMetric: user.isMetric,
      filterByMap: user.filterByMap,
      pinSelected: user.pinSelected,
      username: user.username,
      forename: user.forename,
      surname: user.surname,
      tenantName: user.tenantName,
      tenantShortName: user.tenantShortName,
      tenantLiveUrl: user.tenantLiveUrl,
      isDevMode: user.isDevMode,
      isMarketView: user.isMarketView,

      canCopyToTenant: user.canCopyToTenant,
      isSuperUser: user.isSuperUser,
      isTenantAdmin: user.isTenantAdmin,
      showLocationTools: user.showLocationTools,
      showDrawingTools: user.showDrawingTools,
      showSelectionTools: user.showSelectionTools,
      showInformation: user.showInformation,
      showInsights: user.showInsights,
      showSplitShape: user.showSplitShape,
      showPrintTool: user.showPrintTool,
      showPointOfInterest: user.showPointOfInterest,
      mapType: user.mapType ? user.mapType : "roadmap",
      vectorMode: user.vectorMode ? user.vectorMode : false,
      insightAutoRun: user.insightAutoRun ? user.insightAutoRun : false,
      showNearest: user.showNearest,

      showRouteWithDirections: user.showRouteWithDirections,
      defaultSearchType: user.defaultSearchType ? user.defaultSearchType : 1,

      nonOverlapLabelMode: user.nonOverlappingLabelMode,
      showIntersectionTool: user.showIntersectionTool,
      showEnhancedReportingTool: user.showEnhancedReportingTool,
      showMyLocationTool: user.showMyLocationTool,
      showFollowMeTool: user.showFollowMeTool,

      drawShapeFillColour: user.drawShapeFillColour,
      drawShapeOpacity: user.drawShapeOpacity,
      drawShapeStrokeColour: user.drawShapeStrokeColour,
      showColumnGroups: user.showColumnGroups,
      showQuickEdit: user.showQuickEdit,
      showInsightCompact: user.showInsightCompact,
      showInsightPercentages: user.showInsightPercentages,
      showInsightIndices: user.showInsightIndices,
      showZoomLevelIndicator: user.showZoomLevelIndicator,
      editFilter: hasPermission('editFilter'),
      editSymbology: hasPermission('editSymbology'),
      editLayerGroup: hasPermission('editLayerGroup'),
      createUserLayer: hasPermission('createUserLayer'),
      viewNearest: hasPermission('viewNearest'),
      viewInsight: hasPermission('viewInsight'),
      canSplit: hasPermission('canSplit'),
      createMatch: hasPermission('createMatch'),
      runBatch: hasPermission('runBatch'),
      canPrint: hasPermission('canPrint'),
      canSpatialFilter: hasPermission('canSpatialFilter'),
      hasAdvancedStyling: hasPermission('hasAdvancedStyling'),
      hideAddInsightView: hasPermission('hideAddInsightView'),

      shareFilter: hasPermission('shareFilter'),
      shareStyle: hasPermission('shareStyle'),
      shareInsightView: hasPermission('shareInsightView'),

      shareUserLayer: hasPermission('shareUserLayer'),
      canQuickEdit: hasPermission('canQuickEdit'),
      viewDocuments: hasPermission('canCreateDocuments'),
      viewTurnOffLayers: hasPermission('viewTurnOffLayers'),
      canDownloadInsight: hasPermission('canDownloadInsight'),
      canDownloadNearest: hasPermission('canDownloadNearest'),
      hasFollowLocation: hasPermission('hasFollowLocation'),
      advancedReporting: hasPermission('advancedReporting'),
      canIntersect: hasPermission('canIntersect'),
      canCreateLayerFromFilter: hasPermission('canCreateLayerFromFilter'),
      canManageOrCalculateColumns: hasPermission('canManageOrCalculateColumns'),
      hasQuickFilter: hasPermission('hasQuickFilter'),
      hasRouteWithDirections: hasPermission('hasRouteWithDirections'),
      hasOSMap: hasPermission('hasOSMap'),
      hasPOLSecurity: hasPermission('hasPOLSecurity'),
      canDeleteDocuments: hasPermission('canDeleteDocuments'),
      hasPOLTonch: hasPermission('hasPOLTonch'),
      hasMaxDownload: hasPermission('hasMaxDownload'),
      hasFind: hasPermission('hasFind'),
      version : user.version,
      hasAdvancedCatchments: hasPermission('hasAdvancedCatchments'),
      hasTrafficWeightedCatchments: hasPermission('hasTrafficWeightedCatchments'),
    };
  }

  hideAccountBtn(isHide: boolean) {
    this.hideButton.next(isHide);
  }
}

