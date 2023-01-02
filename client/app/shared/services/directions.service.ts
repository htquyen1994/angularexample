import { Injectable } from '@angular/core';
import { MapService } from '../map.service';
import { BehaviorSubject, Observable, Observer, of } from 'rxjs';

@Injectable()
export class DirectionsService {
  directionsService: google.maps.DirectionsService;
  directionsRenderers: Map<string, google.maps.DirectionsRenderer> = new Map<string, any>();
  selectedTravelMode = new BehaviorSubject<google.maps.TravelMode>(google.maps.TravelMode.DRIVING);
  selectedTravelMode$ = this.selectedTravelMode.asObservable();
  reverseDirection = new BehaviorSubject<boolean>(false);
  reverseDirection$ = this.reverseDirection.asObservable();
  selectedRoute = new BehaviorSubject<any>(null);
  selectedRoute$ = this.selectedRoute.asObservable();
  routesResult = new Map<string, any>();
  start: google.maps.LatLng = null;
  endpoints: { fadCode: string, latlng: google.maps.LatLng }[] = [];
  get getAllResults() {
    return Array.from(this.routesResult.values());
  }
  constructor(
    private mapService: MapService,
  ) {
    this.directionsService = new google.maps.DirectionsService();
  }

  reset() {
    this.resetResults();
  }

  selectTravelMode(mode: google.maps.TravelMode) {
    if (mode === this.selectedTravelMode.getValue()) return;
    this.selectedTravelMode.next(mode);
    this.calcRoute(this.start, this.endpoints);
  }

  onReverseDirection() {
    this.reverseDirection.next(!this.reverseDirection.getValue());
    this.calcRoute(this.start, this.endpoints);
  }

  onSelectedRoute(result) {
    this.selectedRoute.next(result ? [...result] : null);
  }

  setResult(key, value) {
    this.routesResult.set(key, value);
  }

  resetResults() {
    this.routesResult = new Map<string, any>();
  }

  calcRouteForArray(_points: google.maps.LatLng[] = [], markerOptions: google.maps.MarkerOptions): Observable<google.maps.DirectionsResult> {
    this.clearRoute();
    const points: google.maps.LatLng[] = [..._points];
    if (!points.length) return of(null);
    return Observable.create((observer: Observer<google.maps.DirectionsResult>) => {
      const mode = this.selectedTravelMode.getValue();
      // const reverseDirection = this.reverseDirection.getValue();
      let keys = points.map((e, i) => i);
      // if (reverseDirection) {
      //   points.reverse();
      //   keys.reverse();
      // }
      const key = keys.join("_");
      const start = points.splice(0, 1);
      const request: google.maps.DirectionsRequest = {
        origin: start[0],
        travelMode: mode,
      };
      if (points.length) {
        const end = points.splice(points.length - 1, 1);
        request.destination = end[0];
      }
      if (points.length) {
        points.forEach(e => {
          request.waypoints.push({ location: e, stopover: true });
        })
      }
      this.directionsService.route(request, (result, status) => {
        if (this.checkStatus(status)) {
          this.addDirection(key, result, true, markerOptions);
          observer.next(result),
            observer.complete()
        } else {
          observer.error(status);
        }
      }
      );
    })
  }

  calcRoute(start, end: { fadCode: string, latlng: google.maps.LatLng }[], isRender: boolean = true, callback?: Function,) {
    this.clearRoute();
    this.start = start;
    this.endpoints = [...end];
    const mode = this.selectedTravelMode.getValue();
    const reverse = this.reverseDirection.getValue();
    this.endpoints.forEach((e, i) => {
      const _key = !reverse ? "start_" + e.fadCode : e.fadCode + "_start";
      const key = _key + "_" + mode;
      if (this.routesResult.has(key)) {
        this.addDirection(key, this.routesResult.get(key), i == end.length - 1)
      } else {
        const request: google.maps.DirectionsRequest = {
          origin: !reverse ? start : e.latlng,
          destination: !reverse ? e.latlng : start,
          travelMode: mode,
        };
        this.directionsService.route(request, (result, status) =>
          this.handleResult(result, status, key, i == end.length - 1 && isRender, callback)
        );
      }
    })
  }

  handleResult(result, status, key, isRender, callback) {
    if (callback) callback(result, status);
    this.checkStatus(status) ?
      this.addDirection(key, result, isRender) :
      () => { throw `Error status ${google.maps.DirectionsStatus[status]}` }
  }

  addDirection(key, result, isRender, markerOptions?) {
    this.setResult(key, result);
    const directionsRenderer = new google.maps.DirectionsRenderer({
      draggable: true,
      directions: result,
      markerOptions
    })
    this.directionsRenderers.set(key, directionsRenderer);
    directionsRenderer.addListener('directions_changed', (data) => {
      //update the directions when directions_changed
      const result: any[] = [];
      this.directionsRenderers.forEach((e, _key) => {
        let data = this.routesResult.get(_key);
        if (key === _key) {
          data = directionsRenderer.getDirections();
        }
        result.push(data);
      })
      this.onSelectedRoute(result);
    })
    if (isRender) {
      this.onSelectedRoutes(true)
    }
  }

  onSelectedRoutes(isSetMap?: boolean) {
    const result: any[] = [];
    this.directionsRenderers.forEach((e, key) => {
      if (isSetMap) e.setMap(this.mapService.map);
      const data = this.routesResult.get(key);
      result.push(data);
    })
    this.onSelectedRoute(result);
  }

  checkStatus(status) {
    if (status == google.maps.DirectionsStatus.OK) {
      return true
    }
    return false
  }

  clearRoute() {
    this.start = null;
    this.endpoints = [];
    this.directionsRenderers.forEach(e => e.setMap(null));
    this.directionsRenderers = new Map<string, any>();
  }
}
