import { Injectable } from '@angular/core';
import { BaseHttp } from '@admin-core/services/base-http.service';
import { Observable, throwError } from 'rxjs';
import { UsersResponse } from '@admin-modules/user-handler/user.service';
import { getHttpParams } from '@admin-shared/models/error';
import { map } from 'rxjs/operators';
import { getEmptyGuid } from '@admin-shared/models/global';
import { User } from '@admin-modules/user-handler/user.interface';

@Injectable()
export class UsersTenantService {

  constructor(private http: BaseHttp) {
  }

  getUserList(clientId: string, term: string, page: number, limit: number = 25): Observable<UsersResponse> {
      return this.http.get('TenantUser/getUserList', {
          params: getHttpParams({ clientId, term, page, limit })
      }).pipe(
          map(data => {
              return {
                  length: data.length,
                  data: data.map(e => this.formDtoToUser(e))
              };
          }),
      );
  }

  downloadUsers(clientId: string) {
    if(!clientId) return throwError("Something went wrong!")
    return this.http.downloadFile(`TenantUser/downloadUsers?clientId=${clientId}`);
  }

  createUser(user: User): Observable<User> {
      user.id = getEmptyGuid();
      return this.http.post('TenantUser/createUser', user).pipe(map(e => this.formDtoToUser(e)));
  }

  getUser(userId: string): Observable<User> {
      return this.http.get('TenantUser/getUserById', {
          params: getHttpParams({ userId })
      }).pipe(map(data => this.formDtoToUser(data)));
  }

  updateUser(user: User): Observable<User> {
      return this.http.post('TenantUser/updateUser', user).pipe(map(e => this.formDtoToUser(e)));
  }

  updateStatus(userId: string, status: boolean): Observable<User> {
      return this.http.post('TenantUser/changeStatus', { id: userId, enabled: status }).pipe(map(e => this.formDtoToUser(e)));
  }

  deleteUser(userId: number): Observable<User> {
      return this.http.getJsonWithType<User>('/user.json', {
          params: getHttpParams({ userId })
      });
  }

  formDtoToUser(dataDto: any) {
      return {
          ...dataDto,
          isEnabled: dataDto.enabled
      } as User
  }
}
