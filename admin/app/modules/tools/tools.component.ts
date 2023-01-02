import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IAccount } from '../../shared/models/account';
import { AccountService } from '../../core/services/account.service';
import { ActionMessageService } from '../../core/services/action-message.service';
import { IAppState } from '../../store/state/app.state';
import { Store, select } from '@ngrx/store';
import { AccountSelector } from '../../store/selectors';

@Component({
  selector: 'go-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToolsComponent {
  account: IAccount;

  constructor(private actionMessageService: ActionMessageService,
    private accountService: AccountService,
    private _store: Store<IAppState>) {
      this._store.pipe(select(AccountSelector.selectAccount)).subscribe(account => {
        this.account = { ...account };
    });
  }

  onDownload() {
    this.actionMessageService.sendInfo('Data download started');
  }
}
