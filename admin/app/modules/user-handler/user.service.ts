import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable, of, throwError } from 'rxjs';
import { ListResponse, getHttpParams } from '../../shared/models/error';
import { User } from './user.interface';
import { BaseHttp } from '../../core/services/base-http.service';
import { getEmptyGuid } from '@admin-shared/models/global';

export type UsersResponse = ListResponse<User>;

@Injectable()
export class UserService {

  constructor(private http: BaseHttp) {
  }

  getUserList(clientId: string, term: string, page: number, limit: number = 25): Observable<UsersResponse> {
    return this.http.get('User/getUserList', {
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

  createUser(user: User): Observable<User> {
    user.id = getEmptyGuid();
    return this.http.post('User/createUser', user).pipe(map(e => this.formDtoToUser(e)));
  }

  getUser(userId: string): Observable<User> {
    return this.http.get('User/getUserById', {
      params: getHttpParams({ userId })
    }).pipe(map(data => this.formDtoToUser(data)));
  }


  downloadUsers(clientId: string) {
    if (!clientId) return throwError("Something went wrong!")
    return this.http.downloadFile(`User/downloadUsers?clientId=${clientId}`);
  }

  updateUser(user: User): Observable<User> {
    return this.http.post('User/updateUser', user).pipe(map(e => this.formDtoToUser(e)));
  }

  sendNewUserEmail(user: User): Observable<User> {
    return this.http.post('User/sendNewUserEmail', user).pipe(map(e => this.formDtoToUser(e)));
  }

  updateStatus(userId: string, status: boolean): Observable<User> {
    return this.http.post('User/changeStatus', { id: userId, enabled: status }).pipe(map(e => this.formDtoToUser(e)));
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

  changePassword(userId, newPassword) {
    return this.http.post('User/changePassword', { id: userId, newPassword }).pipe(map(e => this.formDtoToUser(e)))
  }
}
