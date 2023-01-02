import { of as observableOf, Subject, ReplaySubject, Observable, Observer, BehaviorSubject } from 'rxjs';
import { debounceTime, map, share, shareReplay } from 'rxjs/operators';
import { Injectable, NgZone } from '@angular/core';
import { COLORS } from './global';
import { ICONS } from './models/overlayShapeIcon'
import { getQuadKey } from './map-utils/shapes';
import { DrawingOverlay } from './overlay/drawing-overlay';
import { OverlayService } from './overlay.service';
import { OverlayShapeOptions } from './interfaces';
import { OverlayShapeType, MapToolType, CursorType } from './enums';
import { OverlayShape } from './overlay-shape';
import { HttpService } from './http.service';
import { StreetviewService } from '../resultpanel/streetview/streetview.service';
import { environment } from '../../environments/environment';

class CoordMapType {
  tileSize: google.maps.Size;

  constructor(tileSize: google.maps.Size) {
    this.tileSize = tileSize;
  }
  getTile(
    coord: google.maps.Point,
    zoom: number,
    ownerDocument: Document
  ): HTMLElement {
    const div = ownerDocument.createElement("div");
    div.innerHTML = String(coord);
    div.style.width = this.tileSize.width + "px";
    div.style.height = this.tileSize.height + "px";
    div.style.fontSize = "10";
    div.style.borderStyle = "solid";
    div.style.borderWidth = "1px";
    div.style.borderColor = "#AAAAAA";
    return div;
  }
  releaseTile(tile: Element): void {}
}

@Injectable()
export class MapService {
  map: google.maps.Map;

  mapSource = new ReplaySubject<google.maps.Map>(1);
  mapRx = this.mapSource.asObservable();
  locationSource = new BehaviorSubject<Object>(null);
  location = this.locationSource.asObservable().pipe(debounceTime(500));
  mapBoundsChangeSource = new Subject();
  mapBoundsChange = this.mapBoundsChangeSource.pipe(debounceTime(500));
  overlaymapBounds = this.mapBoundsChangeSource.asObservable().pipe(debounceTime(500));
  zoomSource = new Subject<{currentZoom: number, previousZoom: number}>();
  zoom = this.zoomSource.pipe(debounceTime(500), map(e=>e.currentZoom));
  overlayZoom = this.zoomSource.asObservable();
  streetViewSource = new ReplaySubject<boolean>(1);
  streetView = this.streetViewSource.asObservable();
  placesService: google.maps.places.PlacesService;
  autocompleteservice: google.maps.places.AutocompleteService;
  distanceMatrixService: google.maps.DistanceMatrixService;
  overlayService: OverlayService;
  mapStyleSource = new ReplaySubject<string>(1);
  mapStyle = this.mapStyleSource.asObservable();

  mapDragStartSource = new Subject();
  mapDragStart$ = this.mapDragStartSource.asObservable();
  currentZoom: number;
  private showSelectedOnlySource = new ReplaySubject<boolean>(1);
  showSelectedOnly = this.showSelectedOnlySource.asObservable();
  private locationMarker: OverlayShape;
  private overlayHelper: google.maps.OverlayView;

  constructor(private httpService: HttpService,
    private streetviewService: StreetviewService,
    private ngZone: NgZone) {
  }

  setMap(el: Element, options: google.maps.MapOptions) {

    this.map = this.ngZone.runOutsideAngular(() => {
      const map = new google.maps.Map(el, options);

      this.placesService = new google.maps.places.PlacesService(map);
      this.autocompleteservice = new google.maps.places.AutocompleteService();
      this.distanceMatrixService = new google.maps.DistanceMatrixService();

      this.overlayHelper = new google.maps.OverlayView();

      this.overlayHelper.onAdd = () => {
      };
      this.overlayHelper.onRemove = () => {
      };
      this.overlayHelper.draw = () => {
      };
      this.overlayHelper.setMap(map);

      // this.setCenter(<google.maps.LatLngLiteral>options.center);
      // google.maps.event.addListenerOnce(map, 'tilesloaded', () => {
      //   this.mapSource.next(map);
      // });

      google.maps.event.addListenerOnce(map, 'idle', () => {
        this.mapSource.next(map);
        map.addListener('click', (event: google.maps.MouseEvent) => {
          const selectionService = this.overlayService.selectionService;
          selectionService.mapClickSource.next({latLng: event.latLng});
          if (!environment.production) {
            console.log('QUADKEY', getQuadKey(event.latLng, map.getZoom()));
          }
        });

        map.addListener('dragend', () => {
          this.mapBoundsChangeSource.next('bounds_changed');
          this.locationSource.next(null);
          // console.log(map.getBounds());
        });

        map.addListener('dragstart', () => {
          this.mapDragStartSource.next();
          // console.log(map.getBounds());
        });

        map.addListener('zoom_changed', () => {
          this.zoomSource.next({
            currentZoom: this.map.getZoom(),
            previousZoom: this.currentZoom
          });
          this.locationSource.next(null);
          this.currentZoom = this.map.getZoom();
          // this.mapBoundsChangeSource.next('bounds_changed');
        });
      });

      return map;
    });
  }

  clearMarker() {
    if (this.locationMarker) {
      this.locationMarker.clean();
    }
  }

  addMarker(location: google.maps.LatLng, iconName = ICONS.LOCATION, _opts?:OverlayShapeOptions) {

    this.clearMarker();
    const opts: OverlayShapeOptions = {
      isEditable: true,
      isSelectable: true,
      icon: iconName,
      fillColor: COLORS.LOCATION,
      ..._opts
    };
    this.locationMarker = (<DrawingOverlay>this.overlayService.overlays.get('__DRAW'))
      .addShapeByCoordinates(null, OverlayShapeType.Point, [location.lng(), location.lat()], opts);
  }

  addCoordMapType() {
    this.map.overlayMapTypes.insertAt(
      0,
      new CoordMapType(new google.maps.Size(256, 256))
    );
  }

  showLocation(location: google.maps.LatLngLiteral, zoom: number, showMarker: boolean = false, bounds: google.maps.LatLngBounds = null) {
    this.clearMarker();
    if(bounds){
      this.zoomBounds(bounds)
    }else{
      this.centreInViewportAtZoomLevel(zoom, location);
    }
    if (showMarker) {
      this.addMarker(new google.maps.LatLng(location.lat, location.lng), undefined);
    }
    this.streetviewService.updateLocation(true);
  }

  setMapCursor(cursorType: CursorType) {
    if (cursorType === CursorType.DEFAULT) {
      this.map.setOptions({ draggableCursor: 'url(https://maps.gstatic.com/mapfiles/openhand_8_8.cur), default' });
    } else if (cursorType === CursorType.CROSSHAIR) {
      this.map.setOptions({ draggableCursor: 'crosshair' });
    }
  }

  getBounds(): google.maps.LatLngBounds {
    return this.map.getBounds();
  }

  getDrawingBounds(shapeIds: Set<string>) {
    const bound = new google.maps.LatLngBounds();
    shapeIds.forEach(shapeId => {
      const shape = this.overlayService.overlays.get('__DRAW').shapes.get(shapeId);
      bound.union(shape.getBounds());
    });
    const ne = bound.getNorthEast();
    const sw = bound.getSouthWest();
    const x = [
      [ne.lng(), ne.lat()],
      [sw.lng(), sw.lat()]
    ];
    return observableOf({
      results: {
        coordinates: [x]
      }
    });
  }

  centreInViewportAtZoomLevel(zoomLevel: number, location: google.maps.LatLngLiteral) {
    if (zoomLevel >= 5 || zoomLevel < 20) {
      this.map.setCenter(location);
      this.map.setZoom(zoomLevel);
    }
  }

  getVisibleViewportCenter(): google.maps.LatLngLiteral {
    return this.map.getCenter().toJSON();
  }

  zoomBounds(bounds: google.maps.LatLngBounds) {
    this.map.setOptions({maxZoom: 17});
    this.map.fitBounds(bounds);
    this.map.setOptions({maxZoom: 19});
  }

  setMapType(type) {
    this.map.setMapTypeId(type);
    this.mapStyleSource.next(type);
  }

  onToggleShowSelectedOnly(value: boolean) {
    this.showSelectedOnlySource.next(value);
  }

  getDistanceMatrix(request: {
    destinations: Array<string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place>;
    origins: Array<string | google.maps.LatLng | google.maps.LatLngLiteral | google.maps.Place>;
  }): Observable<{distance: number, duration: number}[]> {
    return Observable.create((observer: Observer<any[]>)=>{
      this.distanceMatrixService.getDistanceMatrix(
        {
            travelMode: google.maps.TravelMode.DRIVING,
            avoidHighways: false,
            avoidTolls: false,
            unitSystem: google.maps.UnitSystem.METRIC,
            ...request
        },(response, status)=>{
          if(status == google.maps.DistanceMatrixStatus.OK){
            const { rows } = response;
            const results: {distance: number, duration: number}[] = [];
            rows[0].elements.forEach(e=>{
              results.push({
                distance: e.distance.value,
                duration: e.duration.value
              })
            })
            observer.next(results);
            observer.complete();
          }else{
            observer.error(`Something went wrong! ${status}`);
          }
        })
    })
  }

  geocoding(point: google.maps.LatLng):Observable<google.maps.GeocoderResult[]> {
    return Observable.create((observer: Observer<google.maps.GeocoderResult[]>)=>{
      const geocoder = new google.maps.Geocoder;
      geocoder.geocode({ location: point }, (result, status) => {
        if(status == google.maps.GeocoderStatus.OK){
          observer.next(result);
          observer.complete();
        }else{
          observer.error(status);
        }
      });
    })
  }
}
