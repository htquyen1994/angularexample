import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { mapActions } from '../store/actions';

@Injectable({
  providedIn: 'root'
})
export class MapStoreService {

  constructor(private _store: Store) { }

  zoomTo(locations: google.maps.LatLng[]) {
    this._store.dispatch(mapActions.zoomTo({ locations }));
  }
}
