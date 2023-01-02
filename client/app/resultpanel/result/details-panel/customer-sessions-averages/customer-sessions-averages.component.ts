import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, ChangeDetectorRef, Input } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { CustomerSessionsAveragesService } from '../../../shared/services/customer-sessions-averages.service';
import { ActionMessageService, AppInsightsService } from 'src/client/app/shared';
import { decorateError } from 'src/client/app/shared/http.util';

@Component({
  selector: 'ps-customer-sessions-averages',
  templateUrl: './customer-sessions-averages.component.html',
  styleUrls: ['./customer-sessions-averages.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class CustomerSessionsAveragesComponent implements OnInit {
  @Input() fadCode: string;
  data$ = new BehaviorSubject<any[]>([]);
  loading$ = new BehaviorSubject<boolean>(false);
  subscription: Subscription;
  constructor(
    private cd: ChangeDetectorRef,
    private customerSessionsAveragesServiceService: CustomerSessionsAveragesService,
    private actionMessageService: ActionMessageService,
    private applicationInsightsService: AppInsightsService
  ) { }

  ngOnInit() {
    this.getData();
    this.applicationInsightsService.logEvent('Details Panel', 'Customer Sessions', 'Averages');
  }

  getData(){
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    this.loading$.next(true);
    this.cd.detectChanges();
    this.subscription = this.customerSessionsAveragesServiceService.getCustomerSessionsAverages(this.fadCode).subscribe(_data => {
      this.data$.next(_data);
      this.loading$.next(false);
      this.cd.detectChanges();
    }, err => {
      // this.actionMessageService.sendError(decorateError(err).error.message);
      this.loading$.next(false);
      this.cd.detectChanges();
    })
  }

}
