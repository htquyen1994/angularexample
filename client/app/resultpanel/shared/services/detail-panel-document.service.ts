import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../shared'
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
@Injectable()
export class DetailPanelDocumentService {

  constructor(private httpService: HttpService) { }

  getDocuments(folderName: string, id: string): Observable<any[]> {
    const params = new HttpParams()
      .set('folderName', folderName)
      .set('id', id)
    return this.httpService.get('POLDocument/GetDocuments', params).pipe(map(e => e.results as Array<any>));
  }

  saveDocument(folderName: string, id: string, description: string, file: string) {
    let params = new HttpParams();
    params = params.set('description', description);
    params = params.set('file', file);

    return this.httpService.post(`POLDocument/Complete?folderName=${folderName}&id=${id}`, params);
  }
  removeDocument(folderName: string, id: string, file: string) {
    let params = new HttpParams();
    params = params.set('file', file);

    return this.httpService.post(`POLDocument/RemoveDocument?folderName=${folderName}&id=${id}`, params);
  }
}
