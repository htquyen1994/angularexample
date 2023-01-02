import { Injectable } from '@angular/core';
import { LayerDataService, HttpService } from '@client/app/shared';
import { HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { ILayer, IFilter } from '@client/app/shared/interfaces';
import { NearestDownloadModel } from '../interfaces';
import { tap } from 'rxjs/operators';
import { TravelMode } from '@client/app/core/modules/view-management/enums';

@Injectable({
  providedIn: 'root'
})
export class NearestApiService {

  constructor(private _httpService: HttpService) { }

  getNearest(layer: ILayer, filter: IFilter, pageSize: number, points: google.maps.LatLng[], travelMode: TravelMode, mapZoom: string) {
    if (!layer) {
      return of(null);
    }
    const mode = travelMode === TravelMode.CIRCLE ? 'straightLine' : travelMode;
    const subscriptions: Observable<any>[] = [];
    points.forEach(point => {

      let params = new HttpParams();

      params = params.set('Projection', JSON.stringify(LayerDataService.getProjection(layer, filter, layer.schema, true)));
      params = params.set('Predicate', JSON.stringify(LayerDataService.getPredicate(filter, layer, true)));
      params = params.set('PageSize', pageSize.toString());
      params = params.set('PageNumber', '0');
      params = params.set('Centroid[x]', point.lng().toString());
      params = params.set('Centroid[y]', point.lat().toString());
      params = params.set('Centroid[zoomLevel]', mapZoom);
      params = params.set('TravelMode', mode);
      params = params.set('source', layer.source.toString());
      params = params.set('ownerId', layer.owner);
      subscriptions.push(this._httpService.post(`DataPackage/GetNearest/${layer.id}/Default`, params));
    });

    return forkJoin(subscriptions);
  }

  download(model: NearestDownloadModel) {
    const { headers, results, columnLabels, isStraightLine } = model;
    const _model = {
      headers: JSON.stringify(headers),
      results: JSON.stringify(results),
      columnLabels: JSON.stringify(columnLabels),
      isStraightLine: isStraightLine
    };

    return this._httpService.postJSON(`DataPackageIndex/DownloadNearest`, _model).pipe(
      tap(data => this._httpService.downloadFile(data.file))
    )
  }
}
