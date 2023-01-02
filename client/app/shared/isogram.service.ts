import {throwError as observableThrowError, Subject, Observable, throwError, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {catchError, map, switchMap} from 'rxjs/operators';
import {HttpService} from './http.service';
import {ActionMessageService} from './action-message.service';
import {MapService} from './map.service';
import {OverlayShapeType, TravelType, CursorType} from './enums';
import MultiPolygon = google.maps.Data.MultiPolygon;
import { TravelModel, IsogramRequest } from './interfaces';
import { decorateError, createSimpleError } from './http.util';


@Injectable({
  providedIn: 'root'
})
export class IsogramService {

    travelSource = new Subject<any[]>();
    travel = this.travelSource.asObservable();
    startIds: any[] = [];
    endIds: any[] = [];

    private startMarkers: any[] = [];
    private model: TravelModel = null;
    private isFinished: boolean;

    constructor(private httpService: HttpService,
                private mapService: MapService,
                private actionMessageService: ActionMessageService) {
    }

    init(startPosition: google.maps.LatLng, model: TravelModel) {

        this.model = model;
        this.startIds = [];
        this.endIds = [];

        // just one at the moment
        this.startMarkers = [startPosition];
      const { mode, type, value, towardsOrigin, isDetail } = this.model;
        for (let i = 0; i < this.startMarkers.length; i++) {

            this.isFinished = false;

          const request: IsogramRequest = {
            Origin: [startPosition.lat(), startPosition.lng()],
            TravelMode: mode,
            TravelType: type,
            TravelValue: value,
            ReverseFlow: towardsOrigin,
            Complex: isDetail,
            Scenario: model.scenario
          };

            this.getIsogram(request).subscribe((data: any) => {
                this.travelSource.next(data);
            },err=>{
                const error:any = err && err.error && err.error.data && !err.error.data.error ? createSimpleError("No road network available at this location."): decorateError(err) ;
                this.actionMessageService.sendError(error.error.message)
                this.travelSource.next(error);
            });
        }
    }

    getIsogram(model: IsogramRequest, layerId: string = '00000000-0000-0000-0000-000000000004') {
        // this.mapService.setMapCursor(CursorType.DEFAULT);
        return this.httpService.postJSON(`Isogram/GetIsogram/${layerId}/Default`, model).pipe(
          switchMap((data: any) => {
            let type: OverlayShapeType = null;

            switch (data.isograms[0].results[0].type) {
              case 'Polygon':
                type = OverlayShapeType.Polygon;
                break;
              case 'MultiPolygon':
                type = OverlayShapeType.MultiPolygon;
                break;
              default:
                type = null;
                break;
            }
            if(type == null){
              return throwError(createSimpleError("No road network available at this location."))
            }
            return of({
              type: type,
              coordinates: data.isograms[0].results[0].coordinates
            });
          })
        );
    }

    clearOrigins() {
        for (let i = 0; i < this.startMarkers.length; i++) {
            this.startMarkers[i].unbindAll();
            this.startMarkers[i].setMap(null);
            delete this.startMarkers[i];
        }
        this.startMarkers.length = 0;
    }
}
