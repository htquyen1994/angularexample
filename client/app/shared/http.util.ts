import { throwError as observableThrowError, Observable } from 'rxjs';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { ERRORCODE } from './global';
import { SystemBreakdownService } from './services/system-breakdown.service';

export const API_CODE_UNKNOWN = 'unknown';
export const API_CODE_USER = 'user';

export interface IInnerError {
    code: string;
    error: IInnerError;

    [key: string]: any;
}

export interface IError {
    code: string;
    message: string;
    data?: number;
    target?: string;
    details?: IError[];
    error?: IInnerError;
}

export interface IErrorResponse {
    error: IError;
}

export function decorateError(error: any): IErrorResponse {
    let err: { code: string, message: string };
    if (error && error.error && error.error.error) {
        err = {
            ...error.error.error,
            code: error.error.error.code,
            message: error.error.error.message
        }
    } else if (error && error.error) {
        err = {
            ...error.error,
            code: error.error.code,
            message: error.error.message
        }
    } else if (error) {
        err = {
            ...error,
            code: error.code,
            message: error.message
        }
    } else {
        err = {
            code: API_CODE_USER,
            message: ERRORCODE.UNDEFINED
        }
    }
    if (err.code == undefined) { // check typescript error
        err = {
            code: API_CODE_USER,
            message: ERRORCODE.UNDEFINED
        }
    }
    return {
        error: err
    };
}

export function createSimpleError(message: string, code: string = API_CODE_USER, data?: any): IErrorResponse {
    return {
        error: {
            code,
            message,
            data
        }
    };
}

export function createSimpleErrorInstance(message: string, code: string = API_CODE_USER): IErrorResponse {
    const error = new Error();
    error['error'] = createSimpleError(message, code).error;
    return;
}

@Injectable()
export class CommonHttpInterceptor implements HttpInterceptor {

    constructor(private systemBreakdownService: SystemBreakdownService){}

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        let request_new = request.clone({
            withCredentials: true,
            url: `/api${request.url}`
        });

        if (request.url.startsWith('/assets')) {
            request_new = request.clone({
                withCredentials: true,
                url: `/client${request.url}`,
                setHeaders: {
                    'Suppress-Redirect': 'True',
                    'X-Requested-With': 'XMLHttpRequest'
                }
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
                (response: HttpEvent<any>) => {
                },
                error => {
                    if (error instanceof HttpErrorResponse) {
                        switch (error.status) {
                          case 401:
                          case 403:
                            this.systemBreakdownService.reloadBrowser();
                            break;
                          case 503:
                          {
                            if (!this.systemBreakdownService.isServerDown){
                              this.systemBreakdownService.checkServer();
                            }
                            break;
                          }
                          case 500:
                            console.error('Service Failure');
                            break;
                        }
                    }
                }),
            catchError(err => {
                let errorResponse: IErrorResponse;
                try {
                    const { error } = err;
                    errorResponse = decorateError(JSON.parse(error.message));
                    // if(err.error && err.error.error){
                    //     errorResponse = err.error;
                    // }else{
                    //     errorResponse = JSON.parse(err.message);
                    // }
                } catch (e) {
                  if (err.status == 0) {
                    errorResponse = createSimpleError('Cannot detect an internet connection.', undefined, {...err});
                  } else if (err.status == 502) {
                    errorResponse = createSimpleError('Timeout exceeded.', undefined, { ...err });
                  } else if (err.status == 503) {
                    errorResponse = createSimpleError('Server is offline.', undefined, { ...err });
                  } else if (err.status == 401 || err.status == 403) {
                    errorResponse = createSimpleError('Your session is about to expire, you are going to be redirected to login page.');
                  } else {
                    errorResponse = createSimpleError('Service error.Response is not JSON', undefined, {...err});
                  }
                    console.error(errorResponse.error.message);
                }

                if (errorResponse.error && errorResponse.error.error && errorResponse.error.error.trace) {
                    console.error(errorResponse.error.error.trace.split('\n'));
                }

                return observableThrowError(errorResponse);
            })
        );
    }
}
