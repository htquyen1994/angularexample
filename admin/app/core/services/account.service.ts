import { Injectable } from '@angular/core';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { BaseHttp } from './base-http.service';
import { IAccount, Account } from '../../shared/models/account';
import { map, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { PermissionGuardService } from './permission-guard.service';

@Injectable()
export class AccountService {
  readonly accountSource = new BehaviorSubject<IAccount>(null);
  account$ = this.accountSource.asObservable();
  currentAccount$ = this.accountSource.asObservable().pipe(filter(e => !!e));
  constructor(private http: BaseHttp, private router: Router) {
  }

  setAccount(account: IAccount | null) {
    const previous = this.accountSource.value;
    this.accountSource.next(account);
    if (previous === account) {
      return;
    }
    const index = this.router.config.findIndex(e => e.path === 'users');
    this.router.config.splice(index, 1);
    this.router.config.push({
      path: 'users', loadChildren: () =>
        import('@admin-modules/user-handler/user-handler.module').then(m => m.UserHandlerModule),
      canActivate: [PermissionGuardService]
    }
    )
  }

  getAccount(): Observable<IAccount> {
    return this.http.get('Account/getUserProfile').pipe(map(e => {
      this.setAccount(e);
      return new Account(e);
    }))
  }

  isSuperUser() {
    return this.accountSource.value && this.accountSource.value.isSuperUser
  }

  isNewGroveUser() {
    return this.accountSource.value && this.accountSource.value.tenantId === 'f90da5b5-ecae-46d0-95c5-42ef327b652f';
  }

  getProfile() {
    return this.accountSource.getValue();
  }
}
