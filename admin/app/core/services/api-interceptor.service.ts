import { Injectable, Injector } from '@angular/core';
import { HttpHandler, HttpRequest, HttpEvent } from "@angular/common/http";
import {    throwError as observableThrowError, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ActionMessageService } from './action-message.service';
import { environment } from '../../../environments/environment';
import { AuthenticationService } from './authentication.service';
import { createSimpleError, decorateError, IErrorResponse } from '../../shared/models/error';

@Injectable()
export class ApiInterceptorService {

    constructor(
        private actionMessageService: ActionMessageService,
        private authenticationService: AuthenticationService
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let headers = request.headers;
        headers = headers.set('Suppress-Redirect', 'True');
        headers = headers.set('X-Requested-With', 'XMLHttpRequest');
        let request_new = request.clone({
            headers: headers
        });;

        if (request.url.endsWith('.json')) {
            request_new = request.clone({
                withCredentials: true,
            });
        }
        if (request.url.startsWith('/download')) {
            request_new = request.clone({
                url: request.url.slice(9),
                withCredentials: true,
            });
        }
        return next.handle(request_new).pipe(
            tap(
                (event: HttpEvent<any>) => { },
                err => {
                    if (err instanceof HttpErrorResponse) {
                        switch (err.status) {
                            case 401:
                            case 403:
                                this.authenticationService.redirectToLoginPage();
                                break;
                            case 500:
                                console.error('Service Failure');
                                break;
                        }
                    }
                }),
                catchError(err=>{
                    let errorResponse: IErrorResponse;
                    try {
                        const { error } = err;
                        errorResponse = decorateError(JSON.parse(error.message));
                    } catch (e) {
                        if (err.status == 0) {
                            errorResponse = createSimpleError('Cannot detect an internet connection.');
                        } else {
                            errorResponse = createSimpleError('Service error.Response is not JSON');
                        }
                        console.error(errorResponse.error.message);
                    }
                    if (errorResponse.error && errorResponse.error.innererror && errorResponse.error.innererror.trace) {
                        console.error(errorResponse.error.innererror.trace.split('\n'));
                    }
                    return observableThrowError(errorResponse);
                })
        );
    }
}
