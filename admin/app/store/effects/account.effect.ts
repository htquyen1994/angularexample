
import { Injectable } from '@angular/core';
import { ofType, Actions, createEffect } from '@ngrx/effects';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AccountService } from '../../core/services/account.service';
import { IAccount } from '../../shared/models/account';
import * as AccountAction from '../actions/account.action';
@Injectable()
export class AccountEffects {
  constructor(
    private accountService: AccountService,
    private actions$: Actions) { }

  getAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccountAction.GetAccount),
      switchMap(() => this.accountService.getAccount().pipe(
        switchMap((account: IAccount) => {
          return of(AccountAction.GetAccountSuccess({ payload: { ...account } }));
        })
      )),
     
    ), { useEffectsErrorHandler: false });
}
