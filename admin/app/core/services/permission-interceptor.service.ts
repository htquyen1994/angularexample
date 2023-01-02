import { Injectable } from '@angular/core';
import { AccountService } from './account.service';
import { HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';

@Injectable()
export class PermissionInterceptorService {

  constructor(private accountService: AccountService) { }
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const { url, headers } = request;
    if (url.startsWith('/api/DataPackageAdmin')) {
      return this.accountService.currentAccount$.pipe(first(), switchMap(account => {
        const { isTenantAdmin } = account;
        let request_new = request.clone({
          headers: headers
        });;
        if (isTenantAdmin) {
          request_new = request.clone({
            url: request.url.replace("/api/DataPackageAdmin", '/api/TenantDataPackageAdmin'),
          });
        }
        return next.handle(request_new);
      }))
    } else if (url.startsWith('/api/User') || url.startsWith('/download/api/User')) {
      return this.accountService.currentAccount$.pipe(first(), switchMap(account => {
        const { isTenantAdmin } = account;
        let request_new = request.clone({
          headers: headers
        });;
        if (isTenantAdmin) {
          request_new = request.clone({
            url: request.url.replace("/api/User", '/api/TenantUser'),
          });
        }
        return next.handle(request_new);
      }))
    } else {
      return next.handle(request);
    }

  }
}
