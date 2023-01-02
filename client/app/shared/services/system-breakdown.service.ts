import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { HttpService } from '../http.service';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class SystemBreakdownService {
  serverDown$ = new BehaviorSubject<boolean>(false);
  isChecking = false;
  get isServerDown() {
    return !!this.serverDown$.value || this.isChecking;
  }

  constructor(
    private httpService: HttpService
  ) { }

  serverDown(value) {
    if (value != this.serverDown$.value) {
      this.serverDown$.next(value);
    }
  }

  pingServer() {
    return this.httpService.get('DataPackage/Ping').pipe(catchError(error => {
      if (error.error.data && error.error.data && error.error.data.status == 503) {
        return of(false);
      } else {
        return of(true);
      }
    }), map(e => !!e));
  }

  checkServer() {
    this.isChecking = true;
    this.pingServer().subscribe(value => {
      if (!value) { // server is down
        setTimeout(() => {
          console.log('ReCheck server');
          this.checkServer();
        }, 10000);
      }
      this.isChecking = false;
      this.serverDown(!value);
    })
  }

  reloadBrowser() {
    window.location.href = `${window.location.origin}${window.location.pathname}?${Math.random()}`;
  }

}
