import { HttpParams } from '@angular/common/http';
import { Injectable, OnInit, Directive } from '@angular/core';
import { Subject, Observable, BehaviorSubject, combineLatest, forkJoin, Observer, of } from 'rxjs';
import { map, tap, first, filter, switchMap, catchError, finalize } from 'rxjs/operators';
import {
  ZINDEX,
  COLORS,
  MapService,
  DrawingOverlay,
  HttpService,
  OverlayService,
  IS_ATF_UK,
  LayerService,
} from '../../shared';
import { ICONS } from '../../shared/models/overlayShapeIcon'
import { ILocation, ILocationSearchType,  ILayer, OverlayShapeIconSvg } from '@client/app/shared/interfaces';
import { OverlayShapeType } from '../../shared/enums';
import { IBoundingBox } from '../../iface/IBoundingBox';
import { ELabelPosition } from '../../shared/models/label.model';
import { MatIconRegistry } from '@angular/material/icon';
// import { PLACE_ICONS } from '../../shared/google-places-icons'

@Injectable({
  providedIn: 'root'
})
export class PlacesService implements OnInit {
  placeHolderTexts: { [key: string]: string } = {
    'locations': 'Enter place/postcode',
    'bng': 'Enter XY e.g. 528290, 179900',
    'latLng': 'Enter Lat/Lng e.g. 52.104, 20.402',
    'nearest': 'Enter nearby keyword'
  };
  locateSource = new Subject<ILocation>();
  locate = this.locateSource.asObservable();
  overlay: DrawingOverlay;

  private gazetteerSettings = new BehaviorSubject<{ groups, data }>(null);
  gazetteerSettings$ = this.gazetteerSettings.asObservable().pipe(filter(e => !!e), first())
  constructor(private httpService: HttpService,
    private overlayService: OverlayService,
    private mapService: MapService,
    private layerService: LayerService,
    private matIconRegistry: MatIconRegistry) {
  }

  getGazetteerSettings() {
    const layers$ =this.layerService.layer.pipe(filter(e=>!!e),first());
    return forkJoin(
      layers$,
      this.httpService.get('TenantSettings/?settingCollection=uigazetteersettings&settingName=uigazetteersettings')
      ).pipe(
        map(([layers,data]) => {
          return {
            groups: this.buildGroupButtons(data, layers),
            data
          }
        }),
        tap(data => this.gazetteerSettings.next(data))
      )

  }
  buildGroupButtons(data, layers:ILayer[]) {
    const groupButtons = [];
    const { name, googlePlaces, clientGazetteer, bng, latLng, nearest, customGazetteerSettings } = data;
    if (googlePlaces) {
      const list = [{ id: 'locations', label: 'Locations', placeHolder: this.placeHolderTexts['locations'] }]
      groupButtons.push({
        id: ILocationSearchType.LOCATION,
        list,
        selected: list[0]
      })
    }
    if (clientGazetteer && customGazetteerSettings && customGazetteerSettings.length) {
      const list = customGazetteerSettings.map((e, i) => {
        const {name, url, layerId, zoom} = e;
        if(layerId){
          const layer = layers.find(e=>e.id === layerId);
          if(!layer) {
            return null
          }
        }
        const id = i.toString();
        return { id, label: name, placeHolder: `Enter ${name} name`, url, layerId, zoom }
      }).filter(e=>e);
      // this.onShowMultipleSearch(true);

      groupButtons.push({
        id: ILocationSearchType.GAZETTEER,
        list,
        selected: list[0],
        styles: IS_ATF_UK ? {flex: 5}: null
      })
    }
    if (bng || latLng) {
      const list = []
      if (latLng) {
        list.push({ id: 'latLng', label: 'Lat/Lng', placeHolder: this.placeHolderTexts['latLng'] })
      }
      if (bng) {
        list.push({ id: 'bng', label: 'BNG', placeHolder: this.placeHolderTexts['bng'] })
      }

      if (list.length) {
        const groupButton = {
          id: ILocationSearchType.BNG_LATLNG,
          list,
          selected: list[0]
        }
        groupButtons.push(groupButton);
      }
    }

    if (nearest) {
      const list = [{ id: 'nearest', label: 'Nearby', placeHolder: this.placeHolderTexts['nearest'] }];
      groupButtons.push({
        id: ILocationSearchType.NEAREST,
        list,
        selected: list[0]
      })
    }
    return groupButtons
  }

  ngOnInit() {

  }

  searchGazetteer(term: string, url: string, layerId: string, zoom: number): Observable<ILocation[]> {
    let params = new HttpParams();
    params = params.set('searchText', term);
    params = params.set('maxResults', '10');

    return this.httpService.get(url, params)
      .pipe(map((items: any) => {
        if (!Array.isArray(items.results)) {
          return [];
        }
        return items.results.map((location: any) => {
          return {
            id: location.id,
            name: location.name,
            isDefault: location.isDefault,
            locationType:location.location.type,
            icon: 'geo-'+ location.location.type,
            coordinates: {
              lat: location.location.coordinates[1],
              lng: location.location.coordinates[0]
            },
            details: (location.address || '').split(", "),
            layerId,
            zoom: zoom
          };
        });
      }
      ));
  }

  getPlace(placeId: string): Observable<{latLng: google.maps.LatLngLiteral, boundBox: IBoundingBox}> {

    const placeSource = new Subject<{latLng: google.maps.LatLngLiteral, boundBox: IBoundingBox}>();
    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: placeId,
      fields: ['address_component', 'name', 'formatted_address', 'geometry']
    };

    this.mapService.placesService.getDetails(request,
      (result: google.maps.places.PlaceResult, status: google.maps.places.PlacesServiceStatus) => {


        if (status === google.maps.places.PlacesServiceStatus.OK) {
          const { geometry } = result;
          try {
            const { location, viewport } = geometry;
            const latLng = <google.maps.LatLngLiteral>{
              lat: location.lat(),
              lng: location.lng()
            };
            const boundBox: IBoundingBox = viewport ? {
              Min: {
                Lng: viewport.getSouthWest().lng(),
                Lat: viewport.getSouthWest().lat()
              },
              Max: {
                Lng: viewport.getNorthEast().lng(),
                Lat: viewport.getNorthEast().lat()
              }
            } : null;
            placeSource.next({boundBox, latLng});
            placeSource.complete();
          } catch (error) {
            placeSource.error("Something went wrong at getting place detail")
          }
          // let zoom =  13;
          // this.mapService.showLocation(loc, zoom);
        }else{
          placeSource.error("Can not getting place detail")
        }
      });

    return placeSource;
  }

  // Search businesses using Google Api
  search(term: string): Observable<ILocation[]> {
    const searchSource = new Subject<ILocation[]>();
    var c = this.mapService.getVisibleViewportCenter();
    var ll = new google.maps.LatLng(c.lat, c.lng);
    const request: google.maps.places.AutocompletionRequest = {
      input: term,
      location: ll,
      radius: 50000
      // componentRestrictions: {'country': 'gb'}
      // types: ['(regions)']
    };
    this.mapService.autocompleteservice.getPlacePredictions(request,
      (results: google.maps.places.AutocompletePrediction[], status: google.maps.places.PlacesServiceStatus) => {
        let result: ILocation[] = [];
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          result = results.map((item: google.maps.places.AutocompletePrediction) => {
            // const icon = item.types.map(e=>PLACE_ICONS[e] ? e : null).filter(e=>e)[0];
            return {
              id: item.place_id,
              name: item.structured_formatting.main_text,
              details: [item.structured_formatting.secondary_text],
              isDefault: false,
              locationType:'place',
              icon: 'geo-place',
              coordinates: null,
              zoom: 14,
              // icon
            };
          });
        }
        searchSource.next(result);
        searchSource.complete();
      });
    //});
    return searchSource.asObservable();
  }

  nearbySearch(term: string): Observable<ILocation[]> {
    this.overlay = <DrawingOverlay>this.overlayService.overlays.get('__SEARCH');
    this.overlay.deleteShapes();
    const bound = new google.maps.LatLngBounds();

    var c = this.mapService.getVisibleViewportCenter();
    var ll = new google.maps.LatLng(c.lat, c.lng);

    const request: google.maps.places.PlaceSearchRequest = {
      location: ll,
      radius: 5000,
      // type:  'gyms'
      keyword: term
    };
    return this.googleNearbySearch(request).pipe(
      switchMap((results) => {
        if (!(results && results.length)) {
          return of([])
        }
        const gettingSVGs = results.map(e => {
          const { types } = e;
          if (types && types.length) {
            return this.getGoogleIcon(types);
          }
          return this.getGoogleIcon([]);
        })
        return forkJoin([...gettingSVGs])
          .pipe(
            map(svgs => {
              const iconPaths = svgs.map(e=>{
                if(!e) return null;
                const { name, svg } = e;
                const { x, y, width, height } = svg['viewbox'] ? svg['viewbox'] : { x: 0, y: 0, width: 50, height: 50 };
                return {
                  name,
                  path: svg.innerHTML,
                  viewbox: `${x} ${y} ${width} ${height}`
                }
              })
              const locations: ILocation[] = [];
              results.forEach((place, i) => {
                const _icon = {
                  icon: iconPaths[i] ? {
                    path: iconPaths[i].path,
                    viewbox: iconPaths[i].viewbox
                  } as OverlayShapeIconSvg : ICONS.PLACE,
                }
                const shape = this.overlay.addShapeByCoordinates(
                  `nearest${i}`,
                  OverlayShapeType.Point,
                  [place.geometry.location.lng(), place.geometry.location.lat()],
                  {
                    isEditable: false,
                    isSelectable: true,
                    fillColor: COLORS.SEARCH,
                    strokeColor: COLORS.SEARCH,
                    transparency: 0.8,
                    zIndex: ZINDEX.LOCATION,
                    labelStyle: {
                      id: 'label',
                      columnName: 'label',
                      name: 'label',
                      position: ELabelPosition.LEFT,
                    },
                    ..._icon
                  },
                  {
                    label: place.name
                  }
                );

                locations.push({
                  id: place.id,
                  name: place.name,
                  isDefault: false,
                  locationType: ICONS.PLACE,
                  coordinates: place.geometry.location.toJSON(),
                  details: [place.vicinity],
                  shapeId: shape.id,
                  icon: iconPaths[i] ? iconPaths[i].name : 'geo-' + ICONS.PLACE,
                });
                bound.extend(place.geometry.location.toJSON());
              });
              return locations;
            }),
            finalize(()=>{
              console.log('complete')
            })
          )
      }))
  }

  private googleNearbySearch(request): Observable<google.maps.places.PlaceResult[]>{
    return Observable.create((observer: Observer<google.maps.places.PlaceResult[]>)=>{
      this.mapService.placesService.nearbySearch(request,
        (results: google.maps.places.PlaceResult[], status: google.maps.places.PlacesServiceStatus) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            observer.next(results);
            observer.complete();
          }else{
            observer.next([]);
            observer.complete();
          }
        });
    })
  }
  private getGoogleIcon(types: string[] = []): Observable<{name: string, svg: SVGElement}>{
    return Observable.create((observer:Observer<{name: string, svg: SVGElement}>)=>{
      const icon = types.shift() || 'generic_business';
      return this.matIconRegistry.getNamedSvgIcon(`google-${icon}`).pipe(
        catchError(e=> {
          console.log(e);
          if(icon == 'generic_business'){
            return of(null)
          }else{
            return this.getGoogleIcon(types);
          }
        }),
        map(e => e ? { name: 'google-'+icon, svg: e } : null),
      ).subscribe((e)=>{
        observer.next(e);
        observer.complete();
      },err=>{
        observer.error(err);
      }, ()=>{
        observer.next(null);
        observer.complete();
      })
    })
  }
}
