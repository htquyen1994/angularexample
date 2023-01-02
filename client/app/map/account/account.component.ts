import { Component, HostBinding, ViewChild, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { AccountService, IS_MORRISON, COLORS, MapService } from '../../shared';
import { IAccount, EPerformanceLevel } from '../../shared/interfaces';
import { Subscription, Subject, from, Observable } from 'rxjs';
import { debounceTime, first, map } from 'rxjs/operators';
import { PlacesService } from '../../sidepanel/places/places.service';
import { ModalService } from '../../shared/services/modal.service';
import { SettingConfirmPopupComponent } from './setting-confirm-popup/setting-confirm-popup.component';
import { ResultStatus } from '../../shared/models/modal.model';
import { environment } from 'src/client/environments/environment';
import { NotificationPopupComponent } from '../../notification/containers'
import { INotification } from '../../notification/interfaces';
import { NotificationService } from '../../notification/services/notification.service';
import { SystemBreakdownService } from '../../shared/services';
import { AccountSettingDialogComponent } from './account-setting-dialog/account-setting-dialog.component';

@Component({
  selector: 'go-account',
  templateUrl: 'account.component.html',
  styleUrls: ['account.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AccountComponent {
  @ViewChild('accountBtn', { static: true }) accountBtn: ElementRef;
  @HostBinding() tabindex = 1;

  account: IAccount;

  env = environment;

  constructor(
    private accountService: AccountService,
    private changeDetectorRef: ChangeDetectorRef,
    private modalService: ModalService
    ) {
    accountService.getAccount();
    accountService.account.subscribe((item) => {
      this.account = { ...item };
      this.changeDetectorRef.detectChanges();
    });

    accountService.hideButton$.subscribe((ishide) => {
      if (!this.accountBtn)
        return;
      if (ishide)
        this.accountBtn['elRef'].nativeElement.classList.add('hidden');
      else
        this.accountBtn['elRef'].nativeElement.classList.remove('hidden');
    });


  }

  showAccountSetting(){
    const modalRef = this.modalService.openModal(AccountSettingDialogComponent);
  }
}
