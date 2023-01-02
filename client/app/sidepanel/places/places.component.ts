import { of as observableOf, Subject, Observable, ReplaySubject, throwError, EMPTY, combineLatest, BehaviorSubject, of } from 'rxjs';

import { mergeMap, debounceTime, first, catchError, tap, filter, switchMap, map } from 'rxjs/operators';
import {
  AfterViewInit, ChangeDetectorRef, Component, Directive, ElementRef, QueryList, ViewChild, ViewChildren, HostBinding, Input, HostListener
} from '@angular/core';

import { PlacesService } from './places.service';
import {
  LocationService,
  MapService,
  Projection,
  LayerSource,
  DOWN_ARROW,
  UP_ARROW,
  ENTER, AccountService, OverlayService, AppInsightsService, IS_POSTOFFICE, PanelService, LayerService, isShowBranchDetails, BRANCHES_LAYERID, SelectionService, RETAILERS_LAYERID, OverlayAbstract, ICONS
} from '../../shared';
import { ILocation, ILocationSearchType, IAccount } from '@client/app/shared/interfaces';
import { ISelectionButton } from '@periscope-lib/buttons/selection-button/selection-button.component';
import { FormControl } from '@angular/forms';
import { IBoundingBox } from '../../iface/IBoundingBox';
import { PLACE_ICONS } from '../../shared/google-places-icons';
import { StreetviewService } from '../../resultpanel/streetview/streetview.service';
import { OVERLAY_TYPE } from '../../shared/enums';
import { PanelStoreService } from '@client/app/core/services';
import { ResultPanelCollapseState } from '@client/app/core/enums';

@Directive({
  selector: '[goPlacesItem]'
})
export class PlacesItemDirective {
  constructor(private el: ElementRef) {
  }

  setFocus() {
    this.el.nativeElement.focus();
  }
}

@Component({
  selector: 'go-places',
  moduleId: module.id,
  templateUrl: 'places.component.html',
  styleUrls: ['places.component.less'],
})
export class PlacesComponent implements AfterViewInit {

  @ViewChild('term', { static: true }) input: ElementRef;
  @ViewChildren(PlacesItemDirective) resultItems: QueryList<PlacesItemDirective>;
  searchControl = new FormControl('');
  // searchType = 1;
  editLocationId: number;
  layerSource = LayerSource;

  // locations: ILocation[];
  isWaiting$ = new BehaviorSubject<boolean>(false);
  isDevMode = true;

  focusResult: number = null;
  activeResult: number = null;
  items: ILocation[] = [];

  placeHolderText: string;
  isPostOffice = IS_POSTOFFICE;
  clientGazetteers: {
    name: string,
    url: string,
    layerId: string,
    zoom: number
  }[] = [];

  groupButtons: {
    id: number,
    list: ISelectionButton[],
    selected: ISelectionButton,
    styles: any
  }[] = [];
  PLACES
  // firstGroupButtons: ISelectionButton[] = []; //locations
  // secondGroupButtons: ISelectionButton[] = []; // Gazetteers
  // thirdGroupButtons: ISelectionButton[] = []; // bng, lng/lat
  ILocationSearchType = ILocationSearchType;
  activeButtonGroup: ILocationSearchType = ILocationSearchType.LOCATION;
  searchOverlayId: string = OVERLAY_TYPE.SEARCH;
  public locations$: Observable<ILocation[]>;
  constructor(private placesService: PlacesService,
    private locationService: LocationService,
    private changeDetectorRef: ChangeDetectorRef,
    private overlayService: OverlayService,
    private applicationInsightsService: AppInsightsService,
    private accountService: AccountService,
    private mapService: MapService,
    private panelService: PanelService,
    private layerService: LayerService,
    private selectionService: SelectionService,
    private streetviewService: StreetviewService,
    private _panelStoreService: PanelStoreService
  ) {

    this.accountService.account.subscribe((account: IAccount) => {
      const { isDevMode, defaultSearchType } = account
      this.isDevMode = isDevMode;
      // this.searchType = account.defaultSearchType;
      this.activeButtonGroup = defaultSearchType;
      this.updatePlaceHolder(this.activeButtonGroup);
    });
    this.placesService.getGazetteerSettings()
      .subscribe(
        (_data) => {
          const { groups, data } = _data;
          const { customGazetteerSettings } = data;
          this.clientGazetteers = [...customGazetteerSettings];
          this.groupButtons = [...groups];
          this.updatePlaceHolder(this.activeButtonGroup);
          this.changeDetectorRef.detectChanges();
        });
    this.locations$ = locationService.location.pipe(map(locations => locations.map(e => ({ ...e, icon: e.icon ? e.icon : 'geo-'+ ICONS[e.locationType.toUpperCase()] }))));
    this.locations$.subscribe(e=>console.log(e))
    this.searchControl.valueChanges.pipe(
      tap(() => { this.isWaiting$.next(true); }),
      debounceTime(300),
      tap((value) => {
        this.mapService.clearMarker();
        const overlay = this.overlayService.overlays.get('__SEARCH');
        if (overlay) {
          overlay.deleteShapes();
        }
      }),
      switchMap((_term: string) => {
        const term = _term || '';
        let observable: Observable<ILocation[]> = observableOf([]);
        const group = this.groupButtons.find(e => e.id == this.activeButtonGroup);
        if (!group) return observable;
        const selected = group.selected;
        // const selectedButton = this.groupButtonsSelected[this.activeButtonGroup];
        if (!selected) return;
        switch (selected.id) {
          case 'locations':
            if (term.length >= 2) {
              observable = this.placesService.search(term);
            }
            break;
          case 'bng':
            const reg = term.match(/(\d{6})[^\d]*(\d{6})[^\d]*$/);
            if (reg) {
              const bng = new Projection().ConvertBNGtoWGS84(Number(reg[1]), Number(reg[2]));
              observable = observableOf([{
                name: `BNG: ${Number(reg[1])} ${Number(reg[2])}`,
                isDefault: false,
                locationType: 'point',
                icon: 'geo-point',
                coordinates: { lat: bng.latitude, lng: bng.longitude },
                zoom: 13
              }]);
            }
            break;
          case 'latLng':
            const reg1 = term.match(/([+-]?[.\d]+)[^\d]*?([+-]?[.\d]+)/);
            if (Array.isArray(reg1)) {
              const lat = Number(reg1[1]);
              const lng = Number(reg1[2]);
              if (reg1 && (lat > -90 && lat < 90) && (lng > -180 && lng < 180)) {
                observable = observableOf([{
                  name: `Lat/Lng: ${lat} ${lng}`,
                  isDefault: false,
                  locationType: 'point',
                  icon: 'geo-point',
                  coordinates: { lat, lng },
                  zoom: 13
                }]);
              }
            }
            break;
          case 'nearest':
            if (term.length >= 2) {
              observable = this.placesService.nearbySearch(term);
            }
            break;

          default:
            if (this.activeButtonGroup == ILocationSearchType.GAZETTEER && term) {
              const gazetteer = this.clientGazetteers[selected.id];
              if (gazetteer) {
                observable = this.placesService.searchGazetteer(term, gazetteer.url, gazetteer.layerId, gazetteer.zoom);
              }
            } else {
              observable = observableOf([]);
            }
            break;
        }

        return observable.pipe(
          catchError(err => {
            console.error(err);
            return of([]);
          }));
      }),
    ).subscribe((result) => {
      this.items = result;
      const places = this.items.map(e=>e.shapeId ? e : null).filter(e=>!!e);
      if(places.length){
        const bound = new google.maps.LatLngBounds();
        places.forEach(e=>{
          bound.extend(e.coordinates);
        })
        this.mapService.zoomBounds(bound);
      }
      this.isWaiting$.next(false);
      changeDetectorRef.markForCheck();
      changeDetectorRef.detectChanges();
    })
    this.selectionService.active.pipe(filter(e=>e.overlayId == this.searchOverlayId)).subscribe(data=>{
      if (data.isAdd) {
        const index = this.items.findIndex(e=>e.shapeId === data.shapeId);
        if(index != -1) {
          this.activeResult = index;
          this.setActiveResult(index);
        }
      } else {
        this.activeResult = null;
        this.selectionService.changeSelection(data);
        this.changeDetectorRef.detectChanges();
      }
    })
  }

  ngAfterViewInit() {
    this.resultItems.changes.subscribe(values => {
      this.focusResult = -1;
      this.activeResult = null;
    });
  }

  trackByIndex(index: number, _: any): number {
    return index;
  }

  search(term: string) {
    this.searchControl.setValue(term)
  }

  editLocation(event: Event, id: number) {
    event.stopPropagation();
    this.editLocationId = id;
    this.changeDetectorRef.detectChanges();
  }

  addLocation(location: ILocation) {
    if (location.coordinates === null && !!location.id) {
      this.placesService.getPlace(location.id).subscribe((result) => {
        const { boundBox, latLng } = result
        location.coordinates = latLng;
        location.boundBox = boundBox;
        this.locationService.addLocation(location);
        this.editLocationId = null;
        this.changeDetectorRef.detectChanges();
      }, err => {
        console.error(err)
      });
    } else {
      this.locationService.addLocation(location);
      this.editLocationId = null;
    }
    this.changeDetectorRef.detectChanges();
  }

  updateLocation(location: ILocation) {
    if (location.coordinates === null && !!location.id) {
      this.placesService.getPlace(location.id).subscribe((result) => {
        const { boundBox, latLng } = result
        location.coordinates = latLng;
        location.boundBox = boundBox;
        this.locationService.updateLocation(location);
        this.editLocationId = null;
      }, err => {
        console.error(err)
      });
    } else {
      this.locationService.updateLocation(location);
      this.editLocationId = null;
    }
    this.changeDetectorRef.detectChanges();
  }

  showLocation(location: ILocation) {
    const zoom = location.zoom || this.mapService.map.getZoom();
    if (location.coordinates === null && !!location.id) {
      this.placesService.getPlace(location.id).subscribe((result) => {
        const { boundBox, latLng } = result;
        this._showLocation(latLng, zoom, boundBox)
      });
    } else {
      const { boundBox, coordinates, shapeId } = location
      this._showLocation(coordinates, zoom, boundBox);
      if (shapeId) {
        this.selectionService.changeSelection({
          isAdd: true,
          overlayId: this.searchOverlayId,
          shapeId
        });
      }
    }
  }

  _showLocation(latLng: google.maps.LatLngLiteral, zoom: number, boundBox?: IBoundingBox) {
    const bounds = boundBox ? new google.maps.LatLngBounds(
      new google.maps.LatLng(boundBox.Min.Lat, boundBox.Min.Lng),
      new google.maps.LatLng(boundBox.Max.Lat, boundBox.Max.Lng)
    ) : null;
    if (this.activeButtonGroup === ILocationSearchType.GAZETTEER
      || this.activeButtonGroup === ILocationSearchType.NEAREST) {
      this.mapService.showLocation(latLng, zoom, false, bounds);
    } else {
      this.mapService.showLocation(latLng, zoom, true, bounds);
    }
  }

  onOpen() {
    this.editLocationId = null;
    this.changeDetectorRef.detectChanges();
  }

  onKeyDown(event: KeyboardEvent, index: number) {
    switch (event.keyCode) {
      case UP_ARROW:
        this.setActiveResult(Math.max(-1, index - 1));
        break;
      case DOWN_ARROW:
        this.setActiveResult(Math.min(this.items.length, index + 1));
        break;
      case ENTER:
        // if (index == -1) return;
        index = Math.max(0, index);
        this.goToResult(event, index);
        break;
    }
  }

  goToResult(event, index: number) {
    this.isWaiting$.pipe(filter(e => !e), first()).subscribe(() => {
      const location = this.items[index];
      if (location) {
        if (location.layerId && location.id) {
          this.onEditRecord(event, location);
        } else {
          this.showLocation(location);
        }
        this.activeResult = index;
        this.setActiveResult(index);
      }
    })
  }

  setActiveResult(index: number) {

    if (index === -1) {
      this.input.nativeElement.focus();
    } else if (this.resultItems.toArray()[index]) {
      // setTimeout(() => {
      this.input.nativeElement.blur();
      this.resultItems.toArray()[index].setFocus();
      // },0);
    }
    this.focusResult = index;
    this.changeDetectorRef.detectChanges();
  }

  onEditRecord(event: Event, row: any) {
    event.stopPropagation();
    const { id, layerId } = row;
    if (!layerId) {
      return;
    }
    this.onActivate(layerId, id);
    if(IS_POSTOFFICE){
      this.onStreetview(layerId, id)
    }
    this.changeDetectorRef.detectChanges();
  }

  onActivate(layerId: string, shapeId: string) {
    this._panelStoreService.setResultPanelState(ResultPanelCollapseState.HALF_SCREEN)
    this.layerService.setActiveLayerById(layerId);
    this.selectionService.clearLayerSelections(layerId);
    this.selectionService.openRow(layerId, shapeId.toString());
    this.changeDetectorRef.detectChanges();
  }

  onActiveTab($event: ISelectionButton, id) {
    this.activeButtonGroup = id;
    if(this.searchControl.value){
      this.search(this.searchControl.value);
    }
    this.updatePlaceHolder(id);
    this.changeDetectorRef.detectChanges();
    this.applicationInsightsService.logEvent('Places Tab', $event.label, '');
  }
  onSelected($event, id) {
    const group = this.groupButtons.find(e => e.id == id);
    if (group) {
      group.selected = $event;
    }
  }
  updatePlaceHolder(activeGroup: ILocationSearchType) {
    const group = this.groupButtons.find(e => e.id == activeGroup);
    if (group) {
      const { selected } = group
      this.placeHolderText = selected && selected.placeHolder ? selected.placeHolder : ''
    } else {
      this.placeHolderText = ''
    }
  }
  getIcon(iconType: string){
    return PLACE_ICONS[iconType];
  }
  onStreetview(layerId: string, shapeId: any) {
    this.streetviewService.setShapeLocation({
      layerId: layerId,
      shapeId: shapeId,
      notActivePegman: true
    });
    this.applicationInsightsService.logEvent('Places Tab', 'Street View', '');
  }
}
