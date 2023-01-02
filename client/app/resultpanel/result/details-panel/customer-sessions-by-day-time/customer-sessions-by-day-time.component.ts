import { Component, OnInit, Input, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActionMessageService, AppInsightsService } from 'src/client/app/shared';
import { CustomerSessionsByDateTimeService } from '../../../shared/services/customer-sessions-by-datetime.service';
import { FormGroup, FormBuilder } from '@angular/forms';
import { decorateError } from 'src/client/app/shared/http.util';
import { GoTableColumn } from 'src/periscope-lib/src/lib/table/table.model';

@Component({
  selector: 'ps-customer-sessions-by-day-time',
  templateUrl: './customer-sessions-by-day-time.component.html',
  styleUrls: ['./customer-sessions-by-day-time.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CustomerSessionsByDayTimeComponent implements OnInit {
  @Input('fadCode') set _fadCode(value: string){
    if (this.isInit && this.fadCode != value) {
      this.fadCode = value;
      this.coreData = null;
      this.allData = null;
      this.onUpdate();
    } else {
      this.fadCode = value;
    }
  };
  fadCode: string;
  public headers: GoTableColumn[] = [
    { name: 'Time', trackBy: 'Time', class: 'col-100 align-left' },
    { name: 'Monday', trackBy: 'Monday', class: 'col-100 align-right' },
    { name: 'Tuesday', trackBy: 'Tuesday', class: 'col-100 align-right' },
    { name: 'Wednesday', trackBy: 'Wednesday', class: 'col-100 align-right' },
    { name: 'Thursday', trackBy: 'Thursday', class: 'col-100 align-right' },
    { name: 'Friday', trackBy: 'Friday', class: 'col-100 align-right' },
    { name: 'Saturday', trackBy: 'Saturday', class: 'col-100 align-right' },
    { name: 'Sunday', trackBy: 'Sunday', class: 'col-100 align-right' },
  ];
  data$ = new BehaviorSubject<any[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);
  coreData: any[];
  allData: any[];
  subscription: Subscription;
  isCore = true;
  subscriptionDownload: Subscription;
  loadingDownload$ = new BehaviorSubject<boolean>(false);
  isInit = false;
  constructor(
    private cd: ChangeDetectorRef,
    private customerSessionsByDateTimeService: CustomerSessionsByDateTimeService,
    private actionMessageService: ActionMessageService,
    private applicationInsightsService: AppInsightsService
  ) { }

  ngOnInit() {
    this.isInit = true;
    this.onUpdate();
    this.applicationInsightsService.logEvent('Details Panel', 'Customer Sessions', 'By Day Time');
  }

  onSelect(isCore) {
    this.isCore = !!isCore;
    this.onUpdate();
    this.cd.detectChanges();
  }
  onDownload(isCore){
    this.applicationInsightsService.logEvent('Details Panel', 'Customer Sessions', 'Download By Day Time');
    if (this.subscriptionDownload) {
      this.subscriptionDownload.unsubscribe();
      this.subscriptionDownload = null;
    }
    this.loadingDownload$.next(true);
    this.cd.detectChanges();
    this.subscriptionDownload = this.customerSessionsByDateTimeService.getReport(this.fadCode, isCore).subscribe(e=>{
      this.loadingDownload$.next(false);
      this.cd.detectChanges();
    },err=>{
      this.actionMessageService.sendError("No Customer Sessions data found for this branch");
      this.loadingDownload$.next(false);
      this.cd.detectChanges();
    });
  }

  private onUpdate() {
    if (!this.coreData && this.isCore) {
      this.getData(this.isCore);
      return;
    }
    if (!this.allData && !this.isCore) {
      this.getData(this.isCore);
      return;
    }
    if (this.coreData && this.isCore) {
      this.setData(this.isCore, this.coreData);
    }
    if (this.allData && !this.isCore) {
      this.setData(this.isCore, this.allData);
    }
  }

  private getData(isCore: boolean) {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.loading$.next(true);
    this.cd.detectChanges();
    this.customerSessionsByDateTimeService.getCustomerSessionsByDateTime(this.fadCode, isCore).subscribe(_data => {
      this.setData(isCore, _data);
      this.loading$.next(false);
      this.cd.detectChanges();
    }, err => {
       this.setData(isCore, []);
      // this.actionMessageService.sendError(decorateError(err).error.message);
      this.loading$.next(false);
      this.cd.detectChanges();
    })
  }

  private setData(isCore, data: any[]) {
    this.data$.next(data);
    if (this.coreData && this.allData) return;
    if (isCore) {
      this.coreData = data;
    } else {
      this.allData = data;
    }
    this.cd.detectChanges();
  }
}
