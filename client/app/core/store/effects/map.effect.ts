import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { tap, observeOn } from 'rxjs/operators';
import { mapActions } from "../actions";
import { ActionMessageService, MapService } from '@client/app/shared';
import { asyncScheduler } from 'rxjs';

@Injectable()
export class MapEffects {
  constructor(
    private _actions$: Actions,
    private _mapService: MapService
  ) { }

  @Effect({dispatch: false})
  zoomTo$ = this._actions$.pipe(
    ofType(mapActions.zoomTo),
    observeOn(asyncScheduler), // execute lately
    tap(({locations, zoomLevel})=>{
      const bounds = new google.maps.LatLngBounds();
      locations.forEach(e=>{
        bounds.extend(e);
      })
      const maxZoom = zoomLevel ? zoomLevel : 17;
      this._mapService.map.setOptions({maxZoom});
      this._mapService.map.fitBounds(bounds);
      this._mapService.map.setOptions({maxZoom: 19});
    })
  );
}
