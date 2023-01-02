import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HttpService } from '../http.service';
import { filter, tap, map, withLatestFrom } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TenantUserService {
  private layerSharedUserList$ = new BehaviorSubject<{ [layerId: string]: any[] }>({})
  private tenantUserList$ = new BehaviorSubject<any[]>(null);

  constructor(
    private httpService: HttpService
  ) { }

  public getUserList(): Observable<any[]> {
    if (!this.tenantUserList$.value) {
      this.getUserListRequest().subscribe(_data => {
        this.tenantUserList$.next([..._data])
      })
    }
    return this.tenantUserList$.pipe(filter(e => !!e))
  }

  public getSharedLayerUsers(owner: string, layerId: string, source): Observable<any[]> {
    if (!this.layerSharedUserList$.value[layerId]) {
      this.getLayerSharedUserListRequest(owner, layerId, source).pipe(
        withLatestFrom(this.getUserList())
      ).subscribe(([_data, users]) => {
        const data = this.layerSharedUserList$.value;
        this.layerSharedUserList$.next({
          ...data,
          [layerId]: _data.map(e => {
            const user = users.find(user => user.username === e.userName);
            return user ? {
              ...user,
              permissableActions: e.permissableActions
            } : null
          }).filter(e => !!e)
        })
      })
    }
    return this.layerSharedUserList$.pipe(filter(e => !!e[layerId]), map(e => e[layerId]))
  }

  public resetSharedLayerUsers(layerId: string): void {
    if (!this.layerSharedUserList$.value[layerId]) {
      return;
    }
    const data = this.layerSharedUserList$.value;
    delete data[layerId];
    this.layerSharedUserList$.next({
      ...data,
    })
  }

  private getUserListRequest(term: string = ''): Observable<any[]> {
    const params = new HttpParams();
    params.set('term', term);
    params.set('page', '0');
    params.set('limit', '1000');
    return this.httpService.get(`User/getUsers?term=${term}&page=0&limit=1000`)
  }

  private getLayerSharedUserListRequest(owner: string, dataPackageId, source): Observable<any[]> {
    const request = {
      Owner: owner,
      Source: source
    };
    return this.httpService.postJSON(`DataPackageShare/ListRecipients/${dataPackageId}/Default`, request);
  }

}
