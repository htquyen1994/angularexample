import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, Observer } from 'rxjs';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { IErrorResponse, createSimpleError } from '../../shared/models/error';
import { error } from 'loglevel';
import { saveAs } from 'file-saver';
@Injectable()
export class BaseHttp {
  public urlRequest: string;
  constructor(private http: HttpClient) {
    this.urlRequest = environment.api_url;
  }

  getJson<T>(url): Observable<any> {
    const api = environment.api_url_json + url;
    return this.http.get<T>(api);
  }
  getJsonWithType<T>(url, options?: any): Observable<any> {
    const api = environment.api_url_json + url;
    return this.http.get<T>(api, options);
  }

  postJsonWithType<T>(url, data?, headers?): Observable<any> {
    const api = environment.api_url_json + url;
    if (!headers) {
      headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
    }
    const httpOptions = {
      headers: headers
    };
    return this.http.post<T>(api, data, httpOptions);
  }

  get(url, options?, urlRequest?): Observable<any> {
    const api = (urlRequest ? urlRequest : this.urlRequest) + url;
    return this.http.get(api, options);
  }
  getWithType<T>(url, options?: any, urlRequest?): Observable<any> {
    const api = (urlRequest ? urlRequest : this.urlRequest) + url;
    return this.http.get<T>(api, options)
  }

  post(url, data?, headers?, urlRequest?): Observable<any> {
    const api = (urlRequest ? urlRequest : this.urlRequest) + url;
    if (!headers) {
      headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
    }

    const httpOptions = {
      headers: headers
    };
    return this.http.post(api, data, httpOptions);
  }
  postWithType<T>(url, data?, headers?, urlRequest?): Observable<any> {
    const api = (urlRequest ? urlRequest : this.urlRequest) + url;
    if (!headers) {
      headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
    }

    const httpOptions = {
      headers: headers
    };
    return this.http.post<T>(api, data, httpOptions);
  }

  delete(url): Observable<any> {
    const api = this.urlRequest + url;
    return this.http.delete(api);
  }

  put(url, data?, headers?): Observable<any> {
    const api = this.urlRequest + url;
    if (!headers) {
      headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });
    }

    const httpOptions = {
      headers: headers
    };

    return this.http.put(api, data, httpOptions);
  }
  downloadFile(file: string) {
    return this.get(file, { observe: 'response', responseType: "blob" }, '/download' + this.urlRequest).pipe(tap(e => {
      const { body, headers } = e;
      const content = headers.get('content-disposition');
      const filename = this.getFileName(content);
      saveAs(body, filename);
    }))
  }

  private handleError(e: HttpErrorResponse) {
    let errorResponse: IErrorResponse;

    try {
      errorResponse = JSON.parse(e.message);
    } catch (e) {
      errorResponse = createSimpleError('Response is not JSON');
      error(errorResponse.error.message);
    }

    if (errorResponse.error.innererror) {
      error(errorResponse.error.innererror.trace.split('\n'));
    }
    return throwError(errorResponse);
  }
  getFileName(content) {
    if (content && content.indexOf('attachment') !== -1) {
      var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      var matches = filenameRegex.exec(content);
      if (matches != null && matches[1]) {
        return matches[1].replace(/['"]/g, '');
      }
    }
    return null;
  }
}
