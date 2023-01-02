import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, ViewEncapsulation, OnInit } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { debug } from 'loglevel';
import { Breakpoint } from '../shared/models/global';
import { IAccount, Account, IPermissionUrl } from '../shared/models/account';
import { BreakpointService } from '../core/services/breakpoint.service';
import { AccountService } from '../core/services/account.service';
import { IAppState } from '../store/state/app.state';
import { Store, select } from '@ngrx/store';
import { AccountSelector, ConfigSelector } from '../store/selectors';
import { ConfigAction, MasterDataAction } from '../store/actions';
import { ReplaySubject, forkJoin, Observable, BehaviorSubject } from 'rxjs';
import { MasterDataService } from '../core/services/master-data.service';
import { map, first, filter } from 'rxjs/operators';
@Component({
  selector: 'go-page',
  templateUrl: 'page.component.html',
  styleUrls: ['page.component.less'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageComponent implements OnInit {
  @ViewChild(MatSidenav, { static: false }) navigation: MatSidenav;

  account: IAccount;
  public account$ = new Observable<IAccount>();
  public menuItem$ = new Observable<IPermissionUrl[]>();
  public sideNavMode = {
    mode: new BehaviorSubject<string>('side'),
    opened: new BehaviorSubject<boolean>(true),
  }
  constructor(
    private changeDetection: ChangeDetectorRef,
    private masterDataService: MasterDataService,
    private _store: Store<IAppState>) {
  }
  ngOnInit(): void {
    this.account$ = this._store.pipe(select(AccountSelector.selectAccount),filter(e=>!!e));
    this.menuItem$ = this.account$.pipe(map(e=>e.permissionUrls));
    this.menuItem$.subscribe(a=>{console.log(a)})
    this.account$.pipe(first()).subscribe((account)=>{
      this.init(account);
    })
  }

  init(account: IAccount){
    this._store.pipe(select(ConfigSelector.selectBreakPoint)).subscribe(breakpoint => {
      debug(`breakpoint: ${Breakpoint[breakpoint]}`);
      this.sideNavMode.mode.next(breakpoint === Breakpoint.DESKTOP ? 'side' : 'over')
      this._store.dispatch(ConfigAction.ChangeLeftSideBar({ payload: breakpoint === Breakpoint.DESKTOP }));
      this.changeDetection.markForCheck();
    });
    this._store.pipe(select(ConfigSelector.selectIsLeftSideBarOpened)).subscribe(isOpened => {
      this.sideNavMode.opened.next(isOpened)
      this.changeDetection.markForCheck();
    });
    if(account.isSuperUser){
      forkJoin(
        this.masterDataService.getMasterDataTenants(),
        this.masterDataService.getAllAvailableLayerClaim(),
      ).subscribe(([tennants, claims]) => {
        this._store.dispatch(MasterDataAction.getTenantsSuccess({ payload: tennants }));
        this._store.dispatch(MasterDataAction.getClaimsSuccess({ payload: claims }));
      })
    }
    if(account.isTenantAdmin){
      forkJoin(
        this.masterDataService.getAllAvailableLayerClaim(),
      ).subscribe(([claims]) => {
        this._store.dispatch(MasterDataAction.getClaimsSuccess({ payload: claims }));
      })
    }
  }

  onToggle() {
    this._store.dispatch(ConfigAction.ChangeLeftSideBar({ payload: !this.navigation.opened }));
  }
}
