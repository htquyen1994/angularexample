import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { IAccount, Account } from './shared/models/account';
import { AccountService } from './core/services/account.service';
import { IAppState } from './store/state/app.state';
import { Store, select } from '@ngrx/store';
import { AccountSelector } from './store/selectors';
import { AccountAction, ConfigAction, MasterDataAction } from './store/actions';
import { BreakpointService } from './core/services/breakpoint.service';
import { ReplaySubject, forkJoin, Observable } from 'rxjs';
import { MasterDataService } from './core/services/master-data.service';
import { filter } from 'rxjs/operators';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
@Component({
    selector: 'go-app',
    templateUrl: 'admin.component.html',
    styleUrls: ['admin.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent {
    account$: Observable<IAccount>;
    constructor(
        private _store: Store<IAppState>,
        private breakpointService: BreakpointService,
        private sanitizer: DomSanitizer,
        private matIconRegistry: MatIconRegistry,
    ) {
        this.matIconRegistry.addSvgIconSet(this.sanitizer.bypassSecurityTrustResourceUrl('admin/assets/iconset.svg'));
        this.matIconRegistry.addSvgIconSet(this.sanitizer.bypassSecurityTrustResourceUrl('admin/assets/client_iconset.svg'));
        this._store.dispatch(AccountAction.GetAccount());
        this.account$ = this._store.pipe(select(AccountSelector.selectAccount),filter(e=>!!e));
        this.breakpointService.change$.subscribe(breakpoint => {
            this._store.dispatch(ConfigAction.changeBreakPoint({ payload: breakpoint }))
        });
    }
}

