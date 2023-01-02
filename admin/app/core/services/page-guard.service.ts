import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, CanActivateChild, CanLoad, Route, UrlSegment } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';
import { AccountService } from './account.service';
import { filter, first, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { IAppState } from '../../store/state/app.state';
import { selectAccount } from '../../store/selectors/account.selector';


@Injectable()
export class PageGuardService implements CanActivate, CanActivateChild, CanLoad {
  constructor(
    private _store: Store<IAppState>,
  ) { }
  canLoad(route: Route, segments: UrlSegment[]): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return this._store.select(selectAccount).pipe(
      filter(e => !!e),
      first(),
      map(e => {
        return !!e
      })
    )
  }
  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return this._store.select(selectAccount).pipe(
      filter(e => !!e),
      first(),
      map(e => {
        return !!e
      })
    )
  }
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    return this._store.select(selectAccount).pipe(
      filter(e => !!e),
      first(),
      map(e => {
        return !!e
      })
    )
  }
}
