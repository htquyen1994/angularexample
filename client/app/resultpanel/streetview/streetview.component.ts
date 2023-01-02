import { first, takeUntil } from 'rxjs/operators';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, EventEmitter, Input, Output, ChangeDetectorRef } from '@angular/core';
import { Subscription, fromEventPattern, merge, Subject, Observable } from 'rxjs';

import {
  PanelService,
  MapService,
  SelectionService,
  LayerService,
  LayerDataService,
  ActionMessageService,
  IErrorResponse
} from '../../shared';

import {
  DialogComponent
} from '@client/app/shared/components'
import { StreetviewService } from './streetview.service';
import { LayerType } from '../../shared/enums';
import { decorateError } from '../../shared/http.util';
import { PanelStoreService } from '@client/app/core/services';

export interface StreetviewMarker {
  layerId: string;
  layerLabel: string;
  shapeId: string;
  shapeLabel: string;
  coordinates: google.maps.LatLngLiteral;
  pitch: number;
  heading: number;
  zoom: number;
}

@Component({
  selector: 'go-streetview',
  moduleId: module.id,
  templateUrl: 'streetview.component.html',
  styleUrls: ['streetview.component.less']
})
export class StreetviewComponent implements OnDestroy, OnInit {

  @ViewChild('streetView', { static: true }) streetViewRef: ElementRef;
  @ViewChild('dialog', { static: true }) dialogRef: DialogComponent;

  @Input()
  set active(value: boolean) {
    this.isActive = !!value;
    this.setMarkerChanged(false);

    if (value) {
      this.updateLocation();
    }

    setTimeout(() => this.streetView && this.streetView.setVisible(this.isActive), 200);
  }

  @Output() onActive = new EventEmitter<boolean>();

  hasLocation = false;
  isMarkerChanged = false;
  markerOptions: StreetviewMarker = null;
  hasUpdatePermission = false;
  isLoading = false;
  error: IErrorResponse = null;
  notChangeTab = false;
  private isActive = false;
  private streetView: google.maps.StreetViewPanorama = null;
  private streetViewService = new google.maps.StreetViewService();
  private resultPanelSubscription: Subscription;
  private sidePanelSubscription: Subscription;
  private activeSubscription: Subscription;

  constructor(private mapService: MapService,
    private changeRef: ChangeDetectorRef,
    private layerService: LayerService,
    private streetviewService: StreetviewService,
    private selectionService: SelectionService,
    private actionMessageService: ActionMessageService,
    private layerDataService: LayerDataService,
    private panelService: PanelService,
    private _panelStoreServices: PanelStoreService
    ) {
  }

  ngOnInit() {

    this.streetviewService.view.subscribe(state => {
      this.updateLocation(state, false);
    });

    this.streetviewService.locate.subscribe(data => {
      const { notActiveTab, layerId, shapeId, notActivePegman } = data;
      this.notChangeTab = !!notActiveTab;
      if (!notActivePegman) {
        this.streetView.setVisible(true);
      }
      this.locateShape(layerId, shapeId);
    });

    this.activeSubscription = this.selectionService.active.subscribe(selection => {
      if (!this.isActive) return;
      this.setMarkerChanged(false);
      this.markerOptions = null;

      const layer = this.layerService.layerStore.get(selection.overlayId);

      if (!(selection.isAdd && layer && layer.type === LayerType.POINT && layer.isEditable)) {
        return null;
      }

      this.locateShape(selection.overlayId, selection.shapeId, false);
    });

    this.resultPanelSubscription = this._panelStoreServices.resultPanelState$.subscribe((state) => {
      if (state !== 0 && this.isActive) {
        this.resize();
        this.changeRef.detectChanges();
      }
    });

    this.sidePanelSubscription = this.panelService.sidePanel.subscribe(() => {
      if (this.isActive) {
        this.resize();
        this.changeRef.detectChanges();
      }
    });

    this.mapService.mapRx.pipe(first()).subscribe((map: google.maps.Map) => {
      this.initStreetView(map);
      this.addListener();
      this.addListenerForMarker();
    });
  }

  ngOnDestroy() {
    this.resultPanelSubscription.unsubscribe();
    this.sidePanelSubscription.unsubscribe();
    this.activeSubscription.unsubscribe();
    this.streetView.setVisible(false);
    this.streetView = null;
  }

  initStreetView(map) {
    this.streetView = new google.maps.StreetViewPanorama(this.streetViewRef.nativeElement, {
      visible: false,
      enableCloseButton: false,
      imageDateControl: true,
      zoomControl: true,
      panControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP },
      addressControlOptions: { position: google.maps.ControlPosition.TOP_CENTER },
      zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_TOP }
    });
    map.setStreetView(this.streetView);
  }

  addListener() {
    const visible_changed$ = fromEventPattern(
      (handler) => this.streetView.addListener('visible_changed', handler)
    )
    visible_changed$.subscribe(() => {
      setTimeout(() => {
        if (this.streetView.getVisible() && !this.isActive) {
          this.streetView.setPov({
            heading: this.streetView.getPov().heading,
            pitch: 0
          });
          setTimeout(() => this.streetView.setZoom(0), 300);
          if (!this.notChangeTab) {
            this.notChangeTab = false;
            this.onActive.emit(true);
          }
        } else if (!this.streetView.getVisible() && this.isActive) {
          this.streetView.setVisible(true);
        }
      }, 0);
    })
  }

  addListenerForMarker() {
    const position_changed$ = fromEventPattern(
      (handler) => this.streetView.addListener('position_changed', handler),
      (handler) => google.maps.event.clearListeners(this.streetView, 'position_changed')
    ).subscribe(() => {
      if (this.markerOptions) {
        const position = this.streetView.getPosition();
        this.markerOptions.coordinates = { lat: position.lat(), lng: position.lng() };
        // setTimeout(() => {
        //   if (this.isActive) {
        //     this.onLocate();
        //   }
        // }, 300);
        this.setMarkerChanged(true);
      }
    })
    const pov_changed$ = fromEventPattern(
      (handler) => this.streetView.addListener('pov_changed', handler),
      (handler) => google.maps.event.clearListeners(this.streetView, 'pov_changed')
    ).subscribe(() => {
      if (this.markerOptions) {
        const pov = this.streetView.getPov();
        this.markerOptions.pitch = pov.pitch;
        this.markerOptions.heading = pov.heading;
        this.markerOptions.zoom = this.streetView.getZoom();
        this.setMarkerChanged(true);
      }
    })
    const zoom_changed$ = fromEventPattern(
      (handler) => this.streetView.addListener('zoom_changed', handler),
      (handler) => google.maps.event.clearListeners(this.streetView, 'zoom_changed')
    ).subscribe(() => {
      if (this.markerOptions) {
        this.markerOptions.zoom = this.streetView.getZoom();
        this.setMarkerChanged(true);
      }
    })
  }

  locateShape(layerId: string, shapeId: string, setStreetview = true) {
    this.layerDataService.getStreetView(layerId, shapeId).subscribe(data => {
      const layer = this.layerService.layerStore.get(layerId);
      this.hasUpdatePermission = layer ? layer.isEditable : false;

      this.markerOptions = {
        layerId: layerId,
        layerLabel: layer.name,
        shapeId: shapeId,
        shapeLabel: shapeId,
        coordinates: { lat: data.results.geom.coordinates[1], lng: data.results.geom.coordinates[0] },
        pitch: data.results.pitch,
        heading: data.results.heading,
        zoom: Math.log((180 / data.results.fov)) / Math.log(2)
      };

      if (setStreetview) {
        this.streetView.setOptions({
          position: this.markerOptions.coordinates,
          zoom: this.markerOptions.zoom,
          pov: {
            heading: this.markerOptions.heading,
            pitch: this.markerOptions.pitch
          },
          visible: true // tricky fix for BOS-2094
        });
        this.streetView.setVisible(false); // tricky fix for BOS-2094
        setTimeout(() => {
          if (this.isActive) {
            this.onLocate();
          }
        }, 300);
      }
    });
  }

  resize() {
    // wait 200ms till panel animation ends
    setTimeout(() => {
      google.maps.event.trigger(this.streetView, 'resize');
    }, 200);
  }

  updateLocation(state = false, changeTab = true) {
    const position = this.streetView.getPosition();
    if ((!position || state) && (this.isActive || !changeTab)) {
      const position = this.mapService.getVisibleViewportCenter();

      this.streetViewService.getPanoramaByLocation(position, 1000, (data, status) => {
        this.hasLocation = status === google.maps.StreetViewStatus.OK;
        if (this.hasLocation) {
          // if (this.streetView.getVisible()) {
          this.streetView.setOptions({
            position: data.location.latLng,
            zoom: 0,
            pov: {
              heading: 0,
              pitch: 0
            },
            visible: true // tricky fix for BOS-2104
          });
          this.streetView.setVisible(false);// tricky fix for BOS-2104
          // Math.log((180 / data.results.fov)) / Math.log(2)
          // this.streetView.setZoom(1);
          // }
          if (changeTab) {
            this.streetView.setVisible(this.hasLocation);
          }
        }
      });
    }
  }

  onLocate() {
    const location = this.streetView.getPosition().toJSON();
    this.mapService.centreInViewportAtZoomLevel(this.mapService.map.getZoom(), location);
  }

  onUpdate() {
    // DM: Not sure if we need to reverse the conversion before saving
    // this.markerOptions.zoom = (180 / Math.pow(2, this.markerOptions.zoom));
    if (this.markerOptions) {
      this.isLoading = true;
      this.layerDataService.updateStreetView(this.markerOptions)
        .subscribe(
          response => {
            this.isLoading = false;
            this.setMarkerChanged(false);
            this.dialogRef.onHide(true);
          },
          e => {
            this.isLoading = false;
            this.error = decorateError(e);
          });
    }
  }

  private setMarkerChanged(isChanged: boolean) {
    this.isMarkerChanged = isChanged;
    this.changeRef.detectChanges();
  }
}
