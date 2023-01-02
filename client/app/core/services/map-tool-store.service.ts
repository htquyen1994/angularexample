import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { OverlayShapeGeometry } from '@client/app/shared/interfaces';
import { mapToolsActions } from '../store/actions';
import { appSelectors } from '../store/selectors';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MapToolsStoreService {

  get selectionMapLoading$() {
    return this._store.select(appSelectors.selectMapTools_selectionMap).pipe(map(e=>e.loading))
  }

  constructor(private _store: Store) { }

  getShapesByShape(shapeId: string, overlayId: string) {
    this._store.dispatch(mapToolsActions.getShapesByPolygon({ shapeId, overlayId }))
  }
}
