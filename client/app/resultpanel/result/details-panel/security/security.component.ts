import { Component, OnInit, Input, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IGroup } from '../../../shared/models/detail-panel.model';
import { DetailPanelSecurityService } from '../../../shared/services/detail-panel-security.service';
import { BehaviorSubject } from 'rxjs';
import { AccountService } from 'src/client/app/shared';
import { IAccount } from 'src/client/app/shared/interfaces';

@Component({
  selector: 'go-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SecurityComponent implements OnInit {
  @Input('id')
  set _id(value: string) {
    if (this.isInit && this.id != value) {
      this.id = value;
      this.getData();
    } else {
      this.id = value;
    }
  };
  id: string;
  @Input() isRetailer: boolean;
  @Input() set active(value: boolean) {
    if (value && !this.isInit) {
      this.isInit = true;
      this.getData();
    }
  }
  loading$ = new BehaviorSubject<boolean>(true);
  data: any;
  isInit = false;
  hasPOLTonch = false;
  groupCollapse: any = { 0: true }
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService,
    private detailPanelSecurityService: DetailPanelSecurityService
  ) {

    this.accountService.account.subscribe((item: IAccount) => {
      this.hasPOLTonch = item.hasPOLTonch;
    });
 }

  ngOnInit() {
  }

  getData() {
    this.detailPanelSecurityService.getSecurityData(this.id, this.isRetailer, this.hasPOLTonch).subscribe((data) => {
      this.data = data;
      this.loading$.next(false);
    })
  }


  onTabChange(event) {
    this.changeDetectorRef.detectChanges();
  }

}
