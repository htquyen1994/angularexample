import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, CanActivateChild, CanLoad, Route, UrlSegment } from '@angular/router';
import { Observable } from 'rxjs/internal/Observable';
import { AccountService } from './account.service';
import { filter, first, map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { IAppState } from '../../store/state/app.state';
import { selectAccount } from '../../store/selectors/account.selector';


@Injectable()
export class PermissionGuardService implements CanActivate, CanActivateChild, CanLoad {
  private permissionUrl = {
    'superUser': ['tenants', 'users', 'permissions', 'reports', 'tools', 'data'],
    'tenantAdmin': ['users', 'reports', 'permissions']
  }
  constructor(
    private _store: Store<IAppState>,
    private router: Router
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
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const { routeConfig } = route;
    if (!routeConfig) return false;
    const { path } = routeConfig;
    console.log(state, route);

    return this._store.select(selectAccount).pipe(
      filter(e => !!e),
      first(),
      map(e => {
        const { permissionUrls } = e;
        if (!permissionUrls) return false;
        if (permissionUrls.map(e => e.url).includes(path)) {
          return true;
        } else if (permissionUrls.length) {
          return this.router.createUrlTree([`/${permissionUrls[0].url}`])
        }
        return false;
      })
    )
  }
  canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const { routeConfig } = childRoute;
    if (!routeConfig) return false;
    const { path } = routeConfig;
    console.log(state, childRoute);

    return this._store.select(selectAccount).pipe(
      filter(e => !!e),
      first(),
      map(e => {
        const { permissionUrls } = e;
        if (!permissionUrls) return false;
        if (permissionUrls.map(e => e.url).includes(path)) {
          return true;
        } else if (permissionUrls.length) {
          return this.router.createUrlTree([`/${permissionUrls[0].url}`])
        }
        return false;
      })
    )
  }
}
