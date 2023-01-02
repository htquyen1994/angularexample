import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from '../../../shared'
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
@Injectable()
export class DetailPanelImagesService {

  constructor(private httpService: HttpService) { }

  getImages(folderName: string, id: string): Observable<any[]> {
    const params = new HttpParams()
      .set('folderName', folderName)
      .set('id', id)
    return this.httpService.get('POLImage/GetImages', params).pipe(map(e => e.results as Array<any>));
  }

  saveImages(folderName: string, id: string, description: string, file: string) {
    let params = new HttpParams();
    params = params.set('description', description);
    params = params.set('file', file);

    return this.httpService.post(`POLImage/CompleteImage?folderName=${folderName}&id=${id}`, params);
  }
  removeImages(folderName: string, id: string, file: string) {
    let params = new HttpParams();
    params = params.set('file', file);

    return this.httpService.post(`POLImage/RemoveImage?folderName=${folderName}&id=${id}`, params);
  }
}
