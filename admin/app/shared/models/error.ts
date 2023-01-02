import { HttpParams } from "@angular/common/http";
export const API_CODE_UNKNOWN = 'unknown';
export const API_CODE_USER = 'user';
export const ERRORCODE = {
    UNDEFINED: 'Something went wrong'
  }
export interface IInnerError {
    code: string;
    innererror: IInnerError;

    [key: string]: any;
}

export interface IError {
    code: string;
    message: string;
    target?: string;
    details?: IError[];
    innererror?: IInnerError;
}

export interface ListResponse<T> {
    length: number;
    data: T[];
}

export interface IErrorResponse {
    error: IError;
}

export function createSimpleError(message: string, code = ''): IErrorResponse {
    return {
        error: {
            code,
            message
        }
    };
}

export function getHttpParams(payload: any): HttpParams {
    let params = new HttpParams();

    Object.keys(payload).forEach((key: string) => {
        if (payload[key] instanceof Object) {
            params = params.set(key, JSON.stringify(payload[key]));
        } else {
            params = params.set(key, payload[key].toString());
        }
    });

    return params;
}


export function decorateError(error: any): IErrorResponse {
    let err: {code: string,message: string};
    if(error && error.error && error.error.error){
        err = {
            ...error.error.error,
            code: error.error.error.code,
            message: error.error.error.message
        }
    }else if(error && error.error){
        err = {
            ...error.error,
            code: error.error.code,
            message: error.error.message
        }
    }else if(error){
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
    if(err.code == undefined){ // check typescript error
        err = {
            code: API_CODE_USER,
            message: ERRORCODE.UNDEFINED
        }
    }
    return {
        error: err
    };
}
