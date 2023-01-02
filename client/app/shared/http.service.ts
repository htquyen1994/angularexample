import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { API_BASE_HREF } from './global';
import { WorkerService } from './worker.service';
import { filter, tap, map } from 'rxjs/operators';
import { WORKER_ACTION } from '../../../client_webworker/app-workers/shared/models/worker-topic.constants';
import { environment } from '../../environments/environment';
import { ActionMessageService } from './action-message.service';
import { Observable } from 'rxjs';
import { saveAs } from 'file-saver';
@Injectable()
export class HttpService {
  constructor(
    private httpClient: HttpClient,
    private actionMessageService: ActionMessageService) {
  }

  post(url: string, params = new HttpParams()): Observable<any> {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('Suppress-Redirect', 'True')
      .set('X-Requested-With', 'XMLHttpRequest');

    const options = {
      headers,
      withCredentials: true
    };

    return this.httpClient.post(API_BASE_HREF + url, params.toString(), options);
  }

  postJSON(url: string, json: Array<any> | Object): Observable<any> {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Suppress-Redirect', 'True')
      .set('X-Requested-With', 'XMLHttpRequest');

    const options = {
      headers: headers,
      withCredentials: true
    };

    return this.httpClient.post(API_BASE_HREF + url, JSON.stringify(json), options);
  }

  get(url: string, params = new HttpParams()): Observable<any> {
    // if (environment.enableHttpWorkers) {
    //   return this.getWorker(url, params);
    // } else {
    return this.getHttp(url, params);
    // }
  }

  // private getWorker(url: string, params = new HttpParams()): any {
  //   const paramsObject = {};

  //   params.keys().forEach(x => {
  //     paramsObject[x] = params.get(x);
  //   });

  //   const key = `${Math.floor(Math.random() * 1000000)}`;

  //   this.workerService.doWork({
  //     action: WORKER_ACTION.GET,
  //     key,
  //     data: {
  //       url: `/api${API_BASE_HREF}${url}`
  //     }
  //   });

  //   return this.workerService.workerUpdate$
  //     .pipe(
  //       filter(x => x.key === key),
  //       // tap(x => console.info('[Worker:FE]', x)),
  //       map(x => x.data)
  //     );
  // }

  private getHttp(url: string, params = new HttpParams()): Observable<any> {
    const headers = new HttpHeaders()
      .set('Suppress-Redirect', 'True')
      .set('X-Requested-With', 'XMLHttpRequest');

    const options = {
      headers: headers,
      withCredentials: true,
      params
    };

    return this.httpClient.get(API_BASE_HREF + url, options);
  }


  downloadFile(file: string, fileType: string = null, totalHits: number = null, hasMaxDownload: boolean = false) {
    let maxAllowed = (hasMaxDownload) ? 250000 : 25000;
    if (totalHits >= maxAllowed) {
      let msg = 'The export of results is limited to the first' + (hasMaxDownload) ? '250,000 records.' : '25,000 records.';
      this.actionMessageService.sendWarning(msg);
    }
    const subStr = file.split('?');
    subStr[0] = decodeURIComponent(subStr[0]);
    window.location.href = subStr.reduce((a, b) => `${a}?${b}`);
  }

  getFile(url, urlRequest, options?): Observable<any> {
    const api = urlRequest + url;
    return this.httpClient.get(api, options);
  }
  postFile(url, urlRequest, params, options?): Observable<any> {
    const api = urlRequest + url;
    return this.httpClient.post(api, JSON.stringify(params), options);
  }
  downloadFileBlob(file: string, params = new HttpParams()) {
    const headers = new HttpHeaders()
      .set('Suppress-Redirect', 'True')
      .set('X-Requested-With', 'XMLHttpRequest');

    const options = {
      headers: headers,
      withCredentials: true,
      params,
      observe: 'response',
      responseType: "blob"
    };
    return this.getFile(file, '/download' + API_BASE_HREF, options).pipe(tap(e => {
      const { body, headers } = e;
      const content = headers.get('content-disposition');
      const filename = this.getFileName(content);
      saveAs(body, filename);
    }))
  }
  downloadFileBlob_post(file: string, json: Array<any> | Object) {
    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('Suppress-Redirect', 'True')
      .set('X-Requested-With', 'XMLHttpRequest');
    const options = {
      headers: headers,
      withCredentials: true,
      observe: 'response',
      responseType: "blob"
    };
    return this.postFile(file, '/download' + API_BASE_HREF, json, options).pipe(tap(e => {
      const { body, headers } = e;
      const content = headers.get('content-disposition');
      const filename = this.getFileName(content);
      saveAs(body, filename);
    }))
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
