import { Component, OnInit, Input, Inject, ViewChild, ChangeDetectorRef, ChangeDetectionStrategy, ViewEncapsulation, Output, EventEmitter } from '@angular/core';
import { QuickEdit, QuickEditDTO } from '../models/map.model';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OverlayShapeType, OverlayShapeChangeType } from '../../shared/enums';
import { OverlayShapeOptions } from '../../shared/interfaces';
import { COLORS, DrawingOverlay, OverlayService, OverlayShape, ActionMessageService, MapService, LayerService } from '../../shared';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { QuickEditService } from '../services/quick-edit.service';
import { decorateError, createSimpleError, IErrorResponse } from '../../shared/http.util';
import { Subject, Observable, BehaviorSubject, forkJoin } from 'rxjs';
import { DialogComponent } from '@client/app/shared/components';

@Component({
  selector: 'ps-quick-edit',
  templateUrl: './quick-edit.component.html',
  styleUrls: ['./quick-edit.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class QuickEditComponent implements OnInit {

  @Output() close = new EventEmitter<any>();
  @Output() load = new EventEmitter<boolean>();
  @Input()
  set isLoading(value: boolean) {
    this._isLoading = value;
    this.cd.markForCheck();
    this.cd.detectChanges();
  }
  // @ViewChild('dialog', { static: true })
  // dialog: DialogComponent;
  private overlay: DrawingOverlay;
  private shapeRefs = new Map<any, OverlayShape>();
  private quickEditData: QuickEdit;
  private unsubscribe$: Subject<void> = new Subject<void>();
  loading$ = new BehaviorSubject<boolean>(false);
  layers: { layerId: string, layerName: string, length }[] = [];
  innitPosition: { x: number, y: number };
  queueActions$ = new BehaviorSubject<any>([]);
  changes: { [layerId: string]: number } = {};
  _isLoading: boolean;
  error: IErrorResponse;
  constructor(
    // @Inject(MAT_DIALOG_DATA) public data: any,
    // private dialogRef: MatDialogRef<QuickEditComponent>,
    private overlayService: OverlayService,
    private quickEditService: QuickEditService,
    private actionMessageService: ActionMessageService,
    private cd: ChangeDetectorRef,
    private mapService: MapService,
    private layerService: LayerService,
  ) {
    this.innitPosition = {
      x: 72,
      y: window.innerWidth - 350
    }
  }

  ngOnInit() {
    this.overlay = <DrawingOverlay>this.overlayService.overlays.get('__QUICKEDIT');
    this.quickEditService.innit.pipe(takeUntil(this.unsubscribe$)).subscribe(data => {
      if (data) {
        this.quickEditData = data;
        this.innitQuickEdit();
        this.zoom();
        this.cd.markForCheck();
        this.cd.detectChanges();
      }
    })
    this.quickEditService.queueActions$.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
      this.queueActions$.next([...value]);
      this.changes = this.getChanges();
      this.cd.markForCheck();
      this.cd.detectChanges();
    });
    this.layerService.layerUpdated$.subscribe(data => {
      if (Array.isArray(data.updatedShapeIds)) {
        if(!this.quickEditData || !data.layer || !data.updatedShapeIds){
          return;
        }
        const shapes = this.quickEditData.shapes.filter(e=>data.layer.id == e.layerId);
        if(shapes.length){
          if(data.updatedShapeIds.filter(id=> shapes.filter(shape=>shape.identifierColumnValue == id).length).length){
            this.error = createSimpleError(
              `${data.user} has just edited one of these records, please click the Quick Edit tool again to get the changes.` +
              ' If you save now, you could overwrite a recent change.'
            );
            this.cd.detectChanges();
          }
        }
      }
    });
  }
  ngAfterViewInit() {
    // this.dialog.onHide(false);
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.quickEditService.reset();
    this.shapeRefs.forEach(e => {
      e.clean();
    })
    this.shapeRefs.clear();
    this.changes = {};
  }

  innitQuickEdit() {
    try {
      this.quickEditService.reset();
      this.layers = [];
      this.shapeRefs.forEach(e => {
        e.clean();
      })
      this.shapeRefs.clear();
      this.error = null;
      this.quickEditService.innitCurrentData({...this.quickEditData});
      this.quickEditData.shapes.forEach(shape => {
        const { id, geomColumnValue, layerId, layerName } = shape;
        this.createEditShape(id, geomColumnValue.coordinates);
        const index = this.layers.findIndex(e => e.layerId == layerId)
        if (index == -1) {
          this.layers.push({ layerId, layerName, length: 1 });
        } else {
          this.layers[index].length += 1;
        }
      })
    } catch (error) {
      this.actionMessageService.sendError(decorateError(error).error.message);
    }
  }

  createEditShape(id: string, coordinates: any) {
    const opts: OverlayShapeOptions = OverlayShape.getEditShapeOptions(OverlayShapeType.Point, { iconSize: 24, geometry: coordinates })

    const shape = this.overlay.addShapeByCoordinates(id, OverlayShapeType.Point, coordinates, opts);
    shape.change.pipe(debounceTime(100)).subscribe(value => {
      if (value === OverlayShapeChangeType.DRAGEND) {
        this.quickEditService.move(id, shape.serializeWithType().coordinates);
      }
    })
    this.shapeRefs.set(id, shape);
    return shape;
  }

  undo() {
    try {
      if(!this.quickEditService.queueActions$.value.length) return;
      const data = this.quickEditService.undo();
      const shape = this.shapeRefs.get(data[0].id);
      shape.clean();
      this.createEditShape(data[0].id, data[0].current);
    } catch (error) {
      this.actionMessageService.sendError(decorateError(error).error.message);
    }
  }

  undoAll() {
    try {
      if(!this.quickEditService.queueActions$.value.length) return;
      const data = this.quickEditService.undoAll();
      data.forEach(action=>{
        const shape = this.shapeRefs.get(action.id);
        shape.clean();
        this.createEditShape(action.id, action.current);
      })
    } catch (error) {
      this.actionMessageService.sendError(decorateError(error).error.message);
    }
  }

  onClose(data?) {
    // this.dialogRef.close(data);
    this.close.next(data);
  }
  onSave() {
    const quickEditDTO: QuickEditDTO[] = []
    this.quickEditService.getShapesChanged().forEach(shape => {
      const { id, layerId, layerName, geomColumnValue, geomColumnName, identifierColumnName, identifierColumnValue, source, owner } = shape;
      const index = quickEditDTO.findIndex(e => e.layerId === layerId);
      if (index != -1) {
        const element = quickEditDTO[index];
        element.changes.push({
          geomColumnName,
          geomColumnValue: JSON.stringify(geomColumnValue),
          identifierColumnName,
          identifierColumnValue
        })
      } else {
        quickEditDTO.push({
          layerId,
          changes: [{
            geomColumnName,
            geomColumnValue: JSON.stringify(geomColumnValue),
            identifierColumnName,
            identifierColumnValue
          }],
          source,
          owner
        })
      }
    });
    if (!quickEditDTO.filter(e => e.changes.length).length) {
      this.actionMessageService.sendInfo('No changes were made');
      return;
    }
    this.setLoading(true);
    forkJoin(quickEditDTO.map(e => this.quickEditService.batchQuickUpdate(e))).subscribe(res => {
      this.actionMessageService.sendSuccess('Changes were saved successfully');
      this.setLoading(false);
      this.onClose();
    }, error => {
      this.setLoading(false);
      this.actionMessageService.sendError(decorateError(error).error.message);
    })
  }

  zoom() {
    if (!this.shapeRefs.size) return;
    var bounds = new google.maps.LatLngBounds();
    this.shapeRefs.forEach(shape => {
      this.processPoints(shape.getCenter(), bounds.extend, bounds);
    })
    this.mapService.zoomBounds(bounds);
  }
  getChanges() {
    const changes = {};
    this.quickEditService.getShapesChanged().forEach(shape => {
      const { layerId } = shape;
      if (changes[layerId]) {
        changes[layerId] += 1;
      } else {
        changes[layerId] = 1;
      }
    })
    return { ...changes };
  }
  private processPoints(geometry, callback, thisArg) {
    if (geometry instanceof google.maps.LatLng) {
      callback.call(thisArg, geometry);
    } else if (geometry instanceof google.maps.Data.Point) {
      callback.call(thisArg, geometry.get());
    } else {
      geometry.getArray().forEach((g) => {
        this.processPoints(g, callback, thisArg);
      });
    }
  }
  private setLoading(value: boolean){
    this.loading$.next(value);
    this.load.next(value);
  }
}
