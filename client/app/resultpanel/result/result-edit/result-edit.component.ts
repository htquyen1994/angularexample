import { AfterContentInit, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Observable, of, Subscription, Subject } from 'rxjs';
import {
  AccountService,
  ActionMessageService,
  COLORS,
  DrawingOverlay,
  IErrorResponse,
  IS_MORRISON,
  LayerDataService,
  LayerService,
  MapService,
  OverlayService,
  OverlayShape,
  OverlayShapeCircle,
  SelectionService,
  checkVerticesCountWithinLimit,
  IS_POSTOFFICE,
  isShowCustomEdit,
  AppInsightsService,
  isPostOfficeRetailer,
  UNITS,
  isBlank
} from '../../../shared';
import { DialogComponent } from '@client/app/shared/components';
import * as moment from 'moment';
import { ResultGridComponent } from '../result-grid/result-grid.component';
import { tap, map, takeUntil, filter } from 'rxjs/operators';
import { OverlayShapeType, MapToolType, ILayerColumnType, LayerType } from '../../../shared/enums';
import { OverlayShapeOptions, OverlayShapeGeometry, IAccount, ILayer, ILayerColumn, PicklistEntry, ILayerData, ILayerColumnGroup } from '../../../shared/interfaces';
import { decorateError, IError, createSimpleError } from '../../../shared/http.util';
import * as _ from 'lodash';
import { EDetailPanelTabs, IBranchDetail, IGroup, TypeOfImage } from '../../shared/models/detail-panel.model';
import { StreetviewService } from '../../streetview/streetview.service';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
export interface ILayerColumnInput extends ILayerColumn {
  value: any;
  options: Observable<PsSelectOption[]>;
}

@Component({
  selector: 'go-edit-form',
  moduleId: module.id,
  templateUrl: 'result-edit.component.html',
  styleUrls: ['result-edit.component.less'],
})
export class ResultEditComponent implements AfterContentInit, OnDestroy {
  @ViewChild('picklistDialog', { static: true }) dialog: DialogComponent;
  @ViewChild('picklistConfirm', { static: true }) dialogConfirm: DialogComponent;

  @Output() close = new EventEmitter<boolean>();
  @Output() edit = new EventEmitter<any>();
  @Input() resultGrid: ResultGridComponent;
  @Input() isViewMode = false;
  @Input() hasCreatePermission: boolean;

  @Input()
  set layer(layer: ILayer) {
    if (layer) {
      this.hiddenColumns = [];
      this.activeLayer = Object.assign({}, layer);
      this.isCustomLogicLayer = isShowCustomEdit(this.activeLayer ? this.activeLayer.id : null);
      this.isRetailerLayer = isPostOfficeRetailer(this.activeLayer ? this.activeLayer.id : null);
      // this.isBranchLayer = isShowBranchDetails(this.activeLayer ? this.activeLayer.id : null);
      this.activeLayer.columnGroups.map(item => {
        item.expanded = true;
        return item.children = [];
      });
      this.activeLayer.columns.forEach((item) => {

        if (item.groupId >= 0) {
          if (!(item.notFilterable || item.notSelectable || (item.type === ILayerColumnType.SHAPE && !item.isDefaultGeometry))) {

            const idx = (item.groupId) ? item.groupId : 0;

            let grp = this.activeLayer.columnGroups[idx];

            if (!(grp)) {
              this.activeLayer.columnGroups[idx] = {
                Index: idx,
                Name: '',
                Description: '',
                HasTotal: false,
                children: <ILayerColumn[]>[],
                expanded: false
              };
              grp = this.activeLayer.columnGroups[idx];
            }
            const format = item.format !== null ? item.format.slice(0) : null;
            item['formatPipe'] = format !== null ? format[0] : null;
            item['_format'] = format !== null ? format.slice(1) : null;
            grp.children.push(item);
          } else {
            this.hiddenColumns.push(item);
          }
          item.expanded = true;
        }
      });
      if (this.activeLayer.columnGroups.filter(e => e).length != this.activeLayer.columnGroups.length) {
        this.actionMessageService.sendError("Columns are assigned to a Group that doesn't exist.")
      }
      this.changeDetectorRef.detectChanges();
    }
  }

  // @HostBinding('attr.theme') theme = IS_MORRISON ? 'wide' : null;

  @Input() isAddRow = false;
  @Input() inputShapeId: number = null;
  @Input() isBatchEdit = false;
  @Input() activeTab: EDetailPanelTabs = EDetailPanelTabs.Information;
  @Input() excludingZone = false;
  // get isShowDetailPanel() {
  //   return this.isBranchLayer && this.isPostOffice && this.isViewMode && !this.isBatchEdit
  // }
  layerUpdateSubscription: Subscription;
  isPicklistLoading = false;
  isPicklistAdd = false;
  isPicklistColumn = null;
  isPicklistForm: FormGroup;
  isPicklistError: IErrorResponse;
  hiddenColumns: ILayerColumn[] = [];
  selectionActive = 'inactive';
  formGroup: FormGroup;
  showShapeEdit = true;
  error: IErrorResponse;
  selectionError: string;
  shapeTypes = {
    'Point': 'Point',
    'MultiPoint': 'Multi Point',
    'LineString': 'Polyline',
    'MultiLineString': 'Multi Polyline',
    'Polygon': 'Polygon',
    'MultiPolygon': 'Multi Polygon',
    'Circle': 'Circle'
  };
  morrison_columns = [
    // 'SizeNetLabel',
    'Retailer',
    'Nearest_Morrisons',
    'Nearest_Morrisons_Drivetime',
    'Record_Type',
    'CatalistID',
    'NielsenRegion',
    'Country',
    'StoreTypeLPID',
    'TownType1ID',
    'TownType2ID',
    'StorePerformanceID'// ,
    // 'Status'
  ];

  isLoading = false;
  currentIndex = 0;
  maxIndex = 0;
  selectedIds: string[];
  activeLayer: ILayer = null;
  isDevMode = false;
  selectionType = MapToolType.SELECT_EDIT_SHAPE;
  isSelectionEnabled = true;
  updatePicklistSubscription: Subscription;
  editRecords: any[];
  isPostOffice = IS_POSTOFFICE;
  groupCollapse: { [groupId: string]: boolean } = {};
  isCustomLogicLayer = false;
  isRetailerLayer = false;
  hasPOLSecurity = false;
  EDetailPanelTabs = EDetailPanelTabs;
  TypeOfImage = TypeOfImage;
  isExcludingZone = false;
  exclusionZoneShape: OverlayShape = null;
  columnType = ILayerColumnType;
  toolType = MapToolType;
  overlayShapeType = OverlayShapeType;
  shapeLastRef: OverlayShape;
  textBlock: { [s: string]: string } = {};

  checkBatchEditValid() {
    if (!this.activeLayer) return false;
    if (!this.activeLayer.columnGroups.length) return false;
    return this.activeLayer.columnGroups.filter(e => e.children.filter(_e => _e['checked']).length > 0).length > 0;
  }
  private editLayerDataSubscription: Subscription;
  public shapeId: string;
  public retailerNo: string;
  private shapeRefs: Set<OverlayShape> = new Set();
  private overlay: DrawingOverlay;
  private toolSubscription: Subscription;
  private selectionServiceSubscription: Subscription;
  private unsubscribe$: Subject<void> = new Subject<void>();
  constructor(@Inject(FormBuilder)
  private formBuilder: FormBuilder,
    private mapService: MapService,
    private selectionService: SelectionService,
    private layerService: LayerService,
    private overlayService: OverlayService,
    private actionMessageService: ActionMessageService,
    private changeDetectorRef: ChangeDetectorRef,
    private layerDataService: LayerDataService,
    private accountService: AccountService,
    private applicationInsightsService: AppInsightsService,
    private streetviewService: StreetviewService) {

    this.accountService.account.subscribe((item: IAccount) => {
      this.isDevMode = item.isDevMode;
      this.hasPOLSecurity = item.hasPOLSecurity;
    });

    this.isPicklistForm = this.formBuilder.group({
      id: [''],
      entry: ['', [Validators.required]]
    });
    this.isPicklistForm.statusChanges.subscribe(e => { this.changeDetectorRef.detectChanges(); })
    this.selectionService.activeToolSource.next(MapToolType.SELECT_EDIT_SHAPE);
  }

  ngAfterContentInit() {
    this.layerUpdateSubscription = this.layerService.layerUpdated$.subscribe(data => {
      if (Array.isArray(data.updatedShapeIds)) {
        if (data.updatedShapeIds.includes(this.selectionService.getLayerActiveShapeId(this.activeLayer.id))) {
          this.error = createSimpleError(
            `${data.user} has just edited this record, please close the form to get the changes.` +
            ' If you save now, you could overwrite the previous change.'
          );
          this.changeDetectorRef.detectChanges();
        }
      }
    });

    this.overlay = <DrawingOverlay>this.overlayService.overlays.get('__DATA');

    // this.mapService.setMapCursor(CursorType.CROSSHAIR);

    this.toolSubscription = this.selectionService.activeToolSource.subscribe(tool => {
      this.isSelectionEnabled = [MapToolType.SELECT_EDIT_SHAPE, MapToolType.SELECT_EDIT_COMBINE].includes(tool);
      if (this.isSelectionEnabled) {
        this.selectionType = tool;
        this.cleanShapes();
      }
      this.changeDetectorRef.detectChanges();
    });

    this.selectionServiceSubscription = this.selectionService.shape.subscribe((shapeRef: OverlayShape) => {
      if (!(this.isAddRow || (!this.isViewMode && !this.isAddRow && !this.isBatchEdit))) return;
      if (shapeRef.overlayId === this.overlay.id) {
        this.overlay.deleteShape(shapeRef.id);
        this.shapeRefs.delete(shapeRef);
        this.updateShapeFormValue();
      } else {
        const isCompatibleType =
          (shapeRef.type === OverlayShapeType.Point && this.activeLayer.type === LayerType.POINT) ||
          (shapeRef.type === OverlayShapeType.MultiPoint && this.activeLayer.type === LayerType.POINT) ||
          (shapeRef.type === OverlayShapeType.LineString && this.activeLayer.type === LayerType.POLYLINE) ||
          (shapeRef.type === OverlayShapeType.MultiLineString && this.activeLayer.type === LayerType.POLYLINE) ||
          (shapeRef.type === OverlayShapeType.Polygon && this.activeLayer.type === LayerType.POLYGON) ||
          (shapeRef.type === OverlayShapeType.MultiPolygon && this.activeLayer.type === LayerType.POLYGON) ||
          (shapeRef.type === OverlayShapeType.Circle && this.activeLayer.type === LayerType.POLYGON) ||
          (shapeRef.type === OverlayShapeType.Rectangle && this.activeLayer.type === LayerType.POLYGON);

        this.selectionError = 'Please select a ' + LayerType[this.activeLayer.type] + ' for this layer';

        if (isCompatibleType) {
          this.selectionError = null;
          const shape = shapeRef.serializeWithType(true);
          let isEditable = checkVerticesCountWithinLimit(shapeRef.serializeWithType());

          //if (this.selectionType === MapToolType.SELECT_EDIT_SHAPE) {
          this.cleanShapes();
          this.createEditShape(shapeRef.type, shape.coordinates, isEditable && !this.isViewMode);
          if (isEditable === false && this.selectionType === MapToolType.SELECT_EDIT_SHAPE) {
            this.actionMessageService.sendWarning('Shape is too complex for editing.');
          }
        }
      }
      this.changeDetectorRef.detectChanges();
    });
    if (this.isAddRow) {
      this.createForm();
    } else if (this.isBatchEdit) {
      this.isLoading = true;
      this.layerDataService.getEditLayerDatasSelected(this.activeLayer).subscribe((items: { totalHits: number, results: ILayerData[] }) => {
        this.isLoading = false;
        this.createBatchEditForm(items.results);
        this.changeDetectorRef.markForCheck();
        this.changeDetectorRef.detectChanges();
      }, () => {
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      });
    } else {
      this.isLoading = true;
      this.shapeId = this.selectionService.getLayerActiveShapeId(this.activeLayer.id);
      this.layerDataService.getEditLayerData(this.activeLayer, this.shapeId);
      this.editLayerDataSubscription = this.layerDataService.editLayerData.subscribe(
        (items: ILayerData) => {
          if(!items.results){
            this.isLoading = true;

            this.changeDetectorRef.markForCheck();
            this.changeDetectorRef.detectChanges();
            return;
          }
          this.isLoading = false;

          if(items.shapeId){
            this.shapeId = items.shapeId;
          }

          this.cleanShapes();
          this.createForm(items.results[0]);
          if (this.isExcludingZone) {
            this.removeExclusionZoneShape();
            this.createExclusionZoneShape();
          }
          this.changeDetectorRef.markForCheck();
          this.changeDetectorRef.detectChanges();
        },
        () => {
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
      this.layerDataService.layerData.pipe(filter(record => !!(record && record.results))).subscribe(record => {
        this.editRecords = _.cloneDeep(record.results);
        const idColumn = this.activeLayer.columns.find(column => column.isIdentifier).id;
        this.currentIndex = this.editRecords.findIndex(x => x[idColumn] === this.shapeId);
        this.maxIndex = this.editRecords.length;
      })
    }
  }

  updateShapeFormValue() {
    if (this.formGroup && !this.isBatchEdit) {
      const shapeColumn = this.activeLayer.columns
        .find(column => column.type === ILayerColumnType.SHAPE && column.isDefaultGeometry);
      this.formGroup.controls[shapeColumn.id].setValue(this.shapeRefs.size > 0 ? '1' : null);
    }
  }

  onRecord(indexChange: number) {
    this.isLoading = true;
    const idColumn = this.activeLayer.columns.find(x => x.isIdentifier).id;

    const currentIndex = this.editRecords.findIndex(x => x[idColumn] === this.shapeId);
    const column = this.editRecords[currentIndex + indexChange];

    if (column) {
      this.currentIndex = currentIndex + indexChange;
      this.shapeId = column[idColumn];
      this.layerDataService.getEditLayerData(this.activeLayer, this.shapeId);
    }
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }

  onEdit() {

    const idColumn = this.activeLayer.columns.find(x => x.isIdentifier).id;
    const currentIndex = this.editRecords.findIndex(x => x[idColumn] === this.shapeId);
    const column = this.editRecords[currentIndex];

    if (column) {
      this.shapeId = column[idColumn];
      this.edit.emit({ shapeId: this.shapeId, activeTab: this.activeTab, excludingZone: this.isExcludingZone });
    }
  }

  createEditShape(type: OverlayShapeType, coordinates: any, isEditable = true) {
    const opts: OverlayShapeOptions = OverlayShape.getEditShapeOptions(type, { isEditable, iconSize: 24, geometry: coordinates })

    const shape = this.overlay.addShapeByCoordinates(null, type, coordinates, opts);

    this.shapeRefs.add(shape);
    this.shapeLastRef = shape;

    this.updateShapeFormValue();
    if (this.excludingZone) {
      this.onExclusionZone();
    }
    return shape;
  }

  createForm(items: any = {}) {
    const group: { [x: string]: any } = {};
    this.activeLayer.columns.forEach((column: ILayerColumnInput) => {
      const disabled = this.isViewMode || column.readOnly || (column.isIdentifier && !this.isAddRow);

      column.value = items[column.id] !== undefined ? items[column.id] : null;

      if (column.type === ILayerColumnType.DATE && column.value !== null && !column.isPicklist) {
        // column.value = ;
        // date.add(date.utcOffset() * 60).format('YYYY-MM-DD'));

        column.value = disabled ? moment(column.value).format('DD/MM/YYYY') :
          new Date(column.value.slice(0, 10)).toISOString().slice(0, 10);
      }

      if (column.isPicklist) {
        column.options = this.layerDataService.getPicklistEntries(this.activeLayer, column.id)
          .pipe(map(e=>e.map(_e=> isBlank(_e.description) ? ({value: _e.value, label: ""}): ({value: _e.value, label: _e.description}))),tap(() => setTimeout(() => {
            if (!this.changeDetectorRef['destroyed']) {
              this.changeDetectorRef.detectChanges();
            }
          }, 20)));
      }

      if (column.value !== null && column.type === ILayerColumnType.SHAPE && column.isDefaultGeometry) {
        this.showShapeEdit = true; // checkVerticesCountWithinLimit(column.value);
        if (this.showShapeEdit) {
          const isEditing = checkVerticesCountWithinLimit(column.value);

          if (column.value.isCircle) {
            this.createEditShape(
              OverlayShapeType.Circle,
              OverlayShapeCircle.getGeometry(column.value.coordinates),
              !this.isViewMode && isEditing);
          } else {
            this.createEditShape(
              <any>OverlayShapeType[column.value.type], column.value.coordinates,
              !this.isViewMode && isEditing);
          }

          column.value = this.shapeLastRef;
          if (!this.excludingZone) {
            this.mapService.zoomBounds(this.shapeLastRef.getBounds());
          }
        }
      } else if (column.type === ILayerColumnType.SHAPE) {
        // console.warn('no geom');
      }

      const validatorFns: ValidatorFn[] = [];

      if (column.required) {
        validatorFns.push(Validators.required);
      }
      if (column.maxLength !== null) {
        validatorFns.push(Validators.maxLength(column.maxLength));
      }
      if (column.minLength !== null) {
        validatorFns.push(Validators.minLength(column.minLength));
      }
      if (column.maxValue !== null) {
        validatorFns.push((c: FormControl) => c.value <= column.maxValue ? null : {
          maxvalue: {
            requiredValue: column.maxValue
          }
        });
      }
      if (column.minValue !== null) {
        validatorFns.push((c: FormControl) => c.value >= column.minValue ? null : {
          minvalue: {
            requiredValue: column.minValue
          }
        });
      }
      if (column.type == ILayerColumnType.NUMBER) {
        validatorFns.push((c: FormControl) => {
          if (!(c.value == undefined || c.value == null || c.value == '')) {
            try {
              const value = parseFloat(c.value) == NaN;
              if (value) throw {};
              if (!Number.isInteger(parseFloat(c.value))) {
                throw {};
              }
            } catch (error) {
              return {
                errorMessage: 'Value must be a whole number'
              }
            }
          }
          return null;
        });
      }
      // let isVisible = true;
      // if (column.isIdentifier && this.isAddRow && column.readOnly) {
      //     isVisible = false;
      // }
      // group['isVisible'] = isVisible;
      group[column.id] = [{
        value: column.value,
        disabled: disabled
      }, validatorFns];

      // if (!(column.isIdentifier && this.isAddRow && column.readOnly)) {
      // group[column.id] = [{ value: column.value, disabled: column.readOnly || (column.isIdentifier && isVisible) }, validatorFns];
      // }
    });

    this.formGroup = this.formBuilder.group(group);
    this.handleErrorForHiddenColumn();
    if (this.activeLayer.id === '00010000-1000-2000-0000-000000000001' ||
      this.activeLayer.id === '00020000-1000-2000-0000-000000000001') {
      addMorrisonLogic(this.formGroup, <ILayerColumnInput[]>this.activeLayer.columns, this.textBlock);
    }
    if (isPostOfficeRetailer(this.activeLayer.id)) { //for PostOffice retailer
      if (this.isAddRow) {
        const retailerNo = getControl(this.formGroup, 'RetailerNo');
        if (retailerNo) {
          this.layerDataService.getNewRetailerId().pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
            retailerNo.setValue(value);
          })
        }
      } else {
        this.retailerNo = getControl(this.formGroup, 'RetailerNo').value;
      }
    }

    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy() {
    if (this.editLayerDataSubscription) {
      this.editLayerDataSubscription.unsubscribe();
    }
    this.layerUpdateSubscription.unsubscribe();
    this.toolSubscription.unsubscribe();
    this.selectionServiceSubscription.unsubscribe();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    this.cleanShapes();
    this.removeExclusionZoneShape();
  }

  onSubmit() {
    if (this.isBatchEdit) {
      this.saveBatchEdit();
    } else {
      this.save();
    }
  }

  save() {
    const columnNames: any = [];
    const columnValues: any = [];
    // const selections: any = [];
    this.activeLayer.columns.forEach(column => {
      if ((!column.readOnly || (!this.isAddRow && column.isIdentifier) || (IS_MORRISON && this.morrison_columns.includes(column.id)))
        && !column.notFilterable && !column.notSelectable) {

        if (this.showShapeEdit || column.type !== ILayerColumnType.SHAPE) {
          columnNames.push(column.id);
        }

        const value = this.formGroup.controls[column.id].value;

        if (column.type === ILayerColumnType.SHAPE) {

          const shapes = [];
          this.shapeRefs.forEach(shape => {
            shapes.push(shape.serializeWithType(false));
          });
          columnValues.push(JSON.stringify(shapes[0]));
        } else if (this.showShapeEdit) {
          if (column.type === ILayerColumnType.BOOLEAN && this.formGroup.controls[column.id].value === null) {
            columnValues.push(false);
          } else if (column.type === ILayerColumnType.DATE) {
            // const value = this.formGroup.controls[column.id].value;
            const date = moment(value);
            if (value !== null && date.isValid()) {
              columnValues.push(date.add(date.utcOffset() * 60).format('YYYY-MM-DD'));
              // columnValues.push(date);
            } else {
              columnValues.push('');
            }
          } else {
            columnValues.push(this.formGroup.controls[column.id].value);
          }
        }
      }
    }
    );
    this.isLoading = true;
    this.layerDataService.saveLayerData(this.isAddRow, this.activeLayer, columnNames, columnValues)
      .subscribe(
        () => {
          this.isLoading = false;
          this.layerService.setLayerActive(this.layerService.layerActiveStore);
          this.selectionService.activeToolSource.next(MapToolType.SELECTION);
          this.closeEdit();
        },
        error => {
          this.error = decorateError(error);
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
  }

  createBatchEditForm(items: any[] = []) {
    this.selectedIds = null;
    const group: { [x: string]: any } = {};
    this.activeLayer.columnGroups.map(item => {
      item.expanded = true;
      return item.children = [];
    });
    this.activeLayer.columns.forEach((column: ILayerColumnInput) => {
      if (column.isIdentifier) {
        this.selectedIds = items.map(e => e[column.id]);
      }
      const disabled = column.readOnly || (column.isIdentifier && !this.isAddRow) || column.isDefaultGeometry || (column.notFilterable && column.notSelectable)
      if (disabled) {
        return;
      }
      if (column.groupId >= 0) {
        if (!(column.notFilterable || column.notSelectable || (column.type === ILayerColumnType.SHAPE && !column.isDefaultGeometry))) {
          const idx = (column.groupId) ? column.groupId : 0;
          let grp = this.activeLayer.columnGroups[idx];
          if (!(grp)) {
            this.activeLayer.columnGroups[idx] = {
              Index: idx,
              Name: '',
              Description: '',
              HasTotal: false,
              children: <ILayerColumn[]>[],
              expanded: false
            };
            grp = this.activeLayer.columnGroups[idx];
          }
          grp.children.push(column);
          column['checked'] = false;
        }
        column.expanded = true;
      }
      column.value = items[0][column.id]; // default

      if (column.type === ILayerColumnType.DATE && column.value !== null && !column.isPicklist) {
        column.value = new Date(column.value.slice(0, 10)).toISOString().slice(0, 10);
      }

      if (column.isPicklist) {
        column.options = this.layerDataService.getPicklistEntries(this.activeLayer, column.id)
          .pipe(map(e=>e.map(_e=>({value: _e.value, label: _e.description}))),tap(() => setTimeout(() => {
            if (!this.changeDetectorRef['destroyed']) {
              this.changeDetectorRef.detectChanges();
            }
          }, 20)));
      }

      const validatorFns: ValidatorFn[] = [];

      if (column.required) {
        validatorFns.push(Validators.required);
      }
      if (column.maxLength !== null) {
        validatorFns.push(Validators.maxLength(column.maxLength));
      }
      if (column.minLength !== null) {
        validatorFns.push(Validators.minLength(column.minLength));
      }
      if (column.maxValue !== null) {
        validatorFns.push((c: FormControl) => c.value <= column.maxValue ? null : {
          maxvalue: {
            requiredValue: column.maxValue
          }
        });
      }
      if (column.minValue !== null) {
        validatorFns.push((c: FormControl) => c.value >= column.minValue ? null : {
          minvalue: {
            requiredValue: column.minValue
          }
        });
      }
      if (column.type == ILayerColumnType.NUMBER) {
        validatorFns.push((c: FormControl) => {
          if (!(c.value == undefined || c.value == null || c.value == '')) {
            try {
              const value = parseFloat(c.value) == NaN;
              if (value) throw {};
              if (!Number.isInteger(parseFloat(c.value))) {
                throw {};
              }
            } catch (error) {
              return {
                errorMessage: 'Value must be a whole number'
              }
            }
          }
          return null;
        });
      }
      group[column.id] = [column.value, validatorFns];
    });
    // console.log(group);
    this.formGroup = this.formBuilder.group(group);
    this.handleErrorForHiddenColumn();
    if (this.activeLayer.id === '00010000-1000-2000-0000-000000000001' ||
      this.activeLayer.id === '00020000-1000-2000-0000-000000000001') {
      addMorrisonLogic(this.formGroup, <ILayerColumnInput[]>this.activeLayer.columns, this.textBlock);
    }
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }

  saveBatchEdit() {
    const columnNames: any = [];
    const columnValues: any = [];
    if (!this.checkBatchEditValid()) {
      return;
    }
    this.activeLayer.columns.forEach(column => {
      const group = this.activeLayer.columnGroups[column.groupId];
      const _column = group ? group.children.find(e => e.id == column.id) : null;
      if (this.formGroup.controls[column.id] && _column && column['checked']) {
        columnNames.push(column.id);
        const value = this.formGroup.controls[column.id].value;
        if (column.type === ILayerColumnType.BOOLEAN && this.formGroup.controls[column.id].value === null) {
          columnValues.push(false);
        } else if (column.type === ILayerColumnType.DATE) {
          const date = moment(value);
          if (value !== null && date.isValid()) {
            columnValues.push(date.add(date.utcOffset() * 60).format('YYYY-MM-DD'));
          } else {
            columnValues.push('');
          }
        } else {
          columnValues.push(this.formGroup.controls[column.id].value);
        }
      }
      if (column.isIdentifier) {
        columnNames.push(column.id);
        columnValues.push(null);
      }
    });
    this.isLoading = true;
    this.layerDataService.batchSaveLayerData(this.activeLayer, columnNames, columnValues, this.selectedIds)
      .subscribe(
        () => {
          this.isLoading = false;
          this.layerService.setLayerActive(this.layerService.layerActiveStore);
          this.closeEdit();
        },
        error => {
          this.error = decorateError(error);
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
  }

  cleanShapes() {
    this.overlay.deleteShapes();
    this.shapeRefs = new Set();
    this.shapeLastRef = null;
    this.updateShapeFormValue();
  }

  closeEdit() {
    this.cleanShapes();
    this.selectionService.activeToolSource.next(MapToolType.SELECTION);
    // this.mapService.setMapCursor(CursorType.DEFAULT);
    this.close.emit(true);
  }

  setSelectionType(toolType: MapToolType) {
    this.selectionService.activeToolSource.next(toolType);
  }

  onPicklistDelete() {
    this.isPicklistLoading = true;
    this.changeDetectorRef.detectChanges();
    const entry: PicklistEntry = {
      Field: this.isPicklistColumn.id,
      ValueFormat: this.isPicklistForm.controls.id.value,
      ValueDescription: this.isPicklistForm.controls.entry.value,
      ValueOrder: 0
    };

    this.updatePicklistSubscription = this.layerDataService.deletePicklistEntry(this.activeLayer.id, entry).subscribe(response => {
      this.updatePicklist(true);
      this.onPicklistConfirmClose(true);
    });
    this.updatePicklistSubscription.add(() => {
      this.isPicklistLoading = false;
      this.changeDetectorRef.detectChanges();
    })
  }

  onPicklistEdit() {
    this.isPicklistLoading = true;
    this.changeDetectorRef.detectChanges();
    const entry: PicklistEntry = {
      Field: this.isPicklistColumn.id,
      ValueFormat: this.isPicklistAdd ? this.isPicklistForm.controls.entry.value : this.isPicklistForm.controls.id.value,
      ValueDescription: this.isPicklistForm.controls.entry.value,
      ValueOrder: 0
    };

    this.updatePicklistSubscription = this.layerDataService.savePicklistEntry(this.isPicklistAdd, this.activeLayer.id, entry).subscribe(response => {
      this.updatePicklist();
      this.onPicklistDialogClose(true);
    });
    this.updatePicklistSubscription.add(() => {
      this.isPicklistLoading = false;
      this.changeDetectorRef.detectChanges();
    })
  }

  onPicklistDialogOpen(column, isAdd) {
    this.isPicklistColumn = column;
    this.isPicklistAdd = isAdd;
    if (this.isPicklistAdd) {
      this.isPicklistForm.controls.id.setValue('');
      this.isPicklistForm.controls.entry.setValue('');
      this.dialog.onHide(false);
    } else {
      this.isPicklistColumn.options.subscribe(values => {
        this.isPicklistColumn['_options'] = values;
        let optionselected = values.find(e => e.value == this.formGroup.controls[column.id].value);
        this.isPicklistForm.controls.id.setValue(optionselected.value);
        this.isPicklistForm.controls.entry.setValue(optionselected.description);
        this.dialog.onHide(false);
      })
    }
  }

  onPicklistConfirmOpen(column) {
    this.isPicklistColumn = column;
    this.isPicklistColumn.options.subscribe(values => {
      this.isPicklistColumn['_options'] = values;
      let optionselected = values.find(e => e.value == this.formGroup.controls[column.id].value);
      this.isPicklistForm.controls.id.setValue(optionselected.value);
      this.isPicklistForm.controls.entry.setValue(optionselected.description);
      this.dialogConfirm.onHide(false);
    })
  }

  updatePicklist(isDelete: boolean = false) {
    this.layerDataService.deletePicklistCache(this.activeLayer.id, this.isPicklistColumn.id);
    this.isPicklistColumn.options = this.layerDataService.getPicklistEntries(this.activeLayer, this.isPicklistColumn.id).pipe(tap((data) => setTimeout(() => {
      if (isDelete) {
        this.formGroup.controls[this.isPicklistColumn.id].patchValue(data[0].value);
      }
      if (!this.changeDetectorRef['destroyed']) {
        this.changeDetectorRef.detectChanges();
      }
    }, 20)));
  }

  onPicklistDialogClose(isCloseDialog?: boolean) {
    if (this.updatePicklistSubscription) {
      this.updatePicklistSubscription.unsubscribe();
      this.updatePicklistSubscription = null;
    }
    if (isCloseDialog) {
      this.dialog.onHide(true);
    }
  }

  onPicklistConfirmClose(isCloseDialog?: boolean) {
    if (this.updatePicklistSubscription) {
      this.updatePicklistSubscription.unsubscribe();
      this.updatePicklistSubscription = null;
    }
    if (isCloseDialog) {
      this.dialogConfirm.onHide(true);
    }
  }

  handleErrorForHiddenColumn() {
    let errors: IError[] = [];
    this.hiddenColumns.forEach(e => {
      if (this.formGroup.get(e.id) && this.formGroup.get(e.id).errors) {
        let message: string;
        const error = this.formGroup.get(e.id).errors;
        if (this.formGroup.get(e.id).errors['required']) {
          message = `Value must be entered for ${e.name}`
          errors.push(createSimpleError(`${message}`).error);
        }
        if (this.formGroup.get(e.id).errors['maxlength']) {
          message = `${e.name} value can not be longer than ${error.requiredLength} characters`
          errors.push(createSimpleError(`${message}`).error);
        }
        if (this.formGroup.get(e.id).errors['minLength']) {
          message = `${e.name} value can not be less than ${error.requiredLength} characters`
          errors.push(createSimpleError(`${message}`).error);
        }
        if (this.formGroup.get(e.id).errors['maxvalue']) {
          message = `${e.name} value can not be greater than ${error.requiredValue}`
          errors.push(createSimpleError(`${message}`).error);
        }
        if (this.formGroup.get(e.id).errors['minValue']) {
          message = `${e.name} value can not be less than ${error.requiredValue}`
          errors.push(createSimpleError(`${message}`).error);
        }
        if (this.formGroup.get(e.id).errors['errorMessage']) {
          message = `${e.name} ${error.errorMessage}`
          errors.push(createSimpleError(`${message}`).error);
        }
      }
    })
    this.error = { error: { code: null, message: null, details: errors } };
  }

  onSelectColumn(group: ILayerColumnGroup, isSelected: boolean) {
    group.children.forEach(column => {
      column['checked'] = isSelected;
    })
    this.changeDetectorRef.detectChanges();
  }
  onToggle(index: number) {
    this.groupCollapse[index] = !this.groupCollapse[index];
    this.changeDetectorRef.detectChanges();
  }
  onSelectTab(tab: EDetailPanelTabs) {
    this.activeTab = tab;
    this.applicationInsightsService.logEvent('Edit Result', this.activeTab, '');
    this.changeDetectorRef.detectChanges();
  }
  onExclusionZone() {
    this.isExcludingZone = !this.isExcludingZone;
    if (this.isExcludingZone) {
      this.createExclusionZoneShape();
    } else {
      this.removeExclusionZoneShape();
    }
    this.changeDetectorRef.detectChanges();
  }
  createExclusionZoneShape() {
    const opts: OverlayShapeOptions = {
      clickable: false,
      isEditable: false,
      isSelectable: false,
      fillColor: COLORS.MAP_CREATION,
      strokeColor: COLORS.MAP_CREATION_STROKE,
      strokeWeight: 1,
      transparency: 0,
      zIndex: google.maps.Marker.MAX_ZINDEX * 2,
      isDisplayStrokePoint: true,
    };

    this.exclusionZoneShape = this.overlay.addShapeByCoordinates(null, OverlayShapeType.Circle, {
      center: this.shapeLastRef.getCenter(),
      radius: 0.25 * UNITS.MILE.constant
    }, opts);
    this.mapService.zoomBounds(this.exclusionZoneShape.getBounds());
  }
  removeExclusionZoneShape() {
    if (this.exclusionZoneShape) {
      this.overlay.deleteShape(this.exclusionZoneShape.id);
      this.exclusionZoneShape = null;
    }
  }
  onStreetView(){
    this.streetviewService.setShapeLocation({
      layerId: this.activeLayer.id,
      shapeId: this.shapeId
    });
    this.applicationInsightsService.logEvent('result edit', 'Street View', '');
  }
}

function addMorrisonLogic(formGroup: FormGroup, columns: ILayerColumnInput[], textBlock: { [s: string]: string }) {

  getControl(formGroup, 'Fascia').valueChanges.subscribe((value: any) => {
    if (value === 'Sainsbury\'s: Local') {
      getControl(formGroup, 'Retailer').setValue('Sainsbury\'s');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Tesco: Express') {
      getControl(formGroup, 'Retailer').setValue('Tesco');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'One Stop') {
      getControl(formGroup, 'Retailer').setValue('One Stop');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Morrisons: Local') {
      getControl(formGroup, 'Retailer').setValue('Morrisons');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Waitrose: Little Waitrose') {
      getControl(formGroup, 'Retailer').setValue('Waitrose');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Best-one') {
      getControl(formGroup, 'Retailer').setValue('Best-one');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Costcutter') {
      getControl(formGroup, 'Retailer').setValue('Costcutter');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Lifestyle Express') {
      getControl(formGroup, 'Retailer').setValue('Lifestyle Express');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Londis') {
      getControl(formGroup, 'Retailer').setValue('Londis');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Mace') {
      getControl(formGroup, 'Retailer').setValue('Mace');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'McColl\'s') {
      getControl(formGroup, 'Retailer').setValue('McColl\'s');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'McColl\'s: Martin\'s') {
      getControl(formGroup, 'Retailer').setValue('McColl\'s');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'McColl\'s: RS McColl') {
      getControl(formGroup, 'Retailer').setValue('McColl\'s');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Nisa: Local') {
      getControl(formGroup, 'Retailer').setValue('Nisa');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Premier') {
      getControl(formGroup, 'Retailer').setValue('Premier');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Spar') {
      getControl(formGroup, 'Retailer').setValue('Spar');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Asda: Filling Station') {
      getControl(formGroup, 'Retailer').setValue('Asda');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Simply Fresh') {
      getControl(formGroup, 'Retailer').setValue('Simply Fresh');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Simply Fresh: Simply Local') {
      getControl(formGroup, 'Retailer').setValue('Simply Fresh');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Select & Save') {
      getControl(formGroup, 'Retailer').setValue('Select & Save');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Bargain Booze: Select Convenience') {
      getControl(formGroup, 'Retailer').setValue('Bargain Booze');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Nisa: Loco') {
      getControl(formGroup, 'Retailer').setValue('Nisa');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Co-op: Southern Welcome') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'My Local') {
      getControl(formGroup, 'Retailer').setValue('My Local');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Morrisons: Daily') {
      getControl(formGroup, 'Retailer').setValue('Morrisons');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Budgens') {
      getControl(formGroup, 'Retailer').setValue('Budgens');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Farmfoods') {
      getControl(formGroup, 'Retailer').setValue('Farmfoods');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Iceland') {
      getControl(formGroup, 'Retailer').setValue('Iceland');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'The Food Warehouse') {
      getControl(formGroup, 'Retailer').setValue('The Food Warehouse');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Marks & Spencer: Simply Food') {
      getControl(formGroup, 'Retailer').setValue('Marks & Spencer');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Somerfield') {
      getControl(formGroup, 'Retailer').setValue('Somerfield');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Wholefoods') {
      getControl(formGroup, 'Retailer').setValue('Wholefoods');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Tesco: Metro') {
      getControl(formGroup, 'Retailer').setValue('Tesco');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Developer') {
      getControl(formGroup, 'Retailer').setValue('Developer');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Booths') {
      getControl(formGroup, 'Retailer').setValue('Booths');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Independent') {
      getControl(formGroup, 'Retailer').setValue('Independent');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Tesco: Unknown') {
      getControl(formGroup, 'Retailer').setValue('Tesco');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Sainsbury\'s: Unknown') {
      getControl(formGroup, 'Retailer').setValue('Sainsbury\'s');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Marks & Spencer: Unknown') {
      getControl(formGroup, 'Retailer').setValue('Marks & Spencer');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Anglia Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Chelmsford Star Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Clydebank Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Heart Of England') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Lincoln Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Midlands Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Radstock Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Scotmid (Scottish Midland Co-op)') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Southern Co-operatives') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Tamworth Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Wooldale Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Cooltrader') {
      getControl(formGroup, 'Retailer').setValue('Cooltrader');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Morrisons: To Be Confirmed') {
      getControl(formGroup, 'Retailer').setValue('Morrisons');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Midcounties Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Channel Islands Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: East of England Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Lituanica') {
      getControl(formGroup, 'Retailer').setValue('Lituanica');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Kwiksave') {
      getControl(formGroup, 'Retailer').setValue('Kwiksave');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Asda: Unknown') {
      getControl(formGroup, 'Retailer').setValue('Asda');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Heron Foods') {
      getControl(formGroup, 'Retailer').setValue('Heron Foods');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Fultons Foods') {
      getControl(formGroup, 'Retailer').setValue('Fultons Foods');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Spar: EuroSpar') {
      getControl(formGroup, 'Retailer').setValue('Spar');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Nisa: Extra') {
      getControl(formGroup, 'Retailer').setValue('Nisa');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Lakes & Dales Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Co-op: Central England Co-op') {
      getControl(formGroup, 'Retailer').setValue('Co-op');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Iceland: Food Warehouse') {
      getControl(formGroup, 'Retailer').setValue('Iceland');
      getControl(formGroup, 'StoreTypeLPID').setValue('0');
    }
    if (value === 'Aldi') {
      getControl(formGroup, 'Retailer').setValue('Aldi');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Aldi: Local') {
      getControl(formGroup, 'Retailer').setValue('Aldi');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Lidl') {
      getControl(formGroup, 'Retailer').setValue('Lidl');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Morrisons') {
      getControl(formGroup, 'Retailer').setValue('Morrisons');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Marks & Spencer') {
      getControl(formGroup, 'Retailer').setValue('Marks & Spencer');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Netto') {
      getControl(formGroup, 'Retailer').setValue('Netto');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Sainsbury\'s') {
      getControl(formGroup, 'Retailer').setValue('Sainsbury\'s');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Waitrose') {
      getControl(formGroup, 'Retailer').setValue('Waitrose');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Tesco: SuperStore') {
      getControl(formGroup, 'Retailer').setValue('Tesco');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Tesco: Extra') {
      getControl(formGroup, 'Retailer').setValue('Tesco');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Haldanes') {
      getControl(formGroup, 'Retailer').setValue('Haldanes');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Marks & Spencer: Outlet') {
      getControl(formGroup, 'Retailer').setValue('Marks & Spencer');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Haldanes: UGO') {
      getControl(formGroup, 'Retailer').setValue('Haldanes');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Asda: Supercentre') {
      getControl(formGroup, 'Retailer').setValue('Asda');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Asda: Superstore') {
      getControl(formGroup, 'Retailer').setValue('Asda');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Asda: Supermarket') {
      getControl(formGroup, 'Retailer').setValue('Asda');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Home Bargains') {
      getControl(formGroup, 'Retailer').setValue('Home Bargains');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'B&M: Bargain Store') {
      getControl(formGroup, 'Retailer').setValue('B&M');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'B&M: Home Store') {
      getControl(formGroup, 'Retailer').setValue('B&M');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'B&M: Express') {
      getControl(formGroup, 'Retailer').setValue('B&M');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Poundland') {
      getControl(formGroup, 'Retailer').setValue('Poundland');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Poundworld') {
      getControl(formGroup, 'Retailer').setValue('Poundworld');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Pound Deals') {
      getControl(formGroup, 'Retailer').setValue('Pound Deals');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Pound Store') {
      getControl(formGroup, 'Retailer').setValue('Pound Store');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Poundworld: Express') {
      getControl(formGroup, 'Retailer').setValue('Poundworld');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'DiscountUK') {
      getControl(formGroup, 'Retailer').setValue('DiscountUK');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Poundstretcher') {
      getControl(formGroup, 'Retailer').setValue('Poundstretcher');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === '99p Stores') {
      getControl(formGroup, 'Retailer').setValue('99p Stores');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Wilko') {
      getControl(formGroup, 'Retailer').setValue('Wilko');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'BHS') {
      getControl(formGroup, 'Retailer').setValue('BHS');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Cook') {
      getControl(formGroup, 'Retailer').setValue('Cook');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Family Bargains') {
      getControl(formGroup, 'Retailer').setValue('Family Bargains');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Bargain Buys') {
      getControl(formGroup, 'Retailer').setValue('Bargain Buys');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Quality Save') {
      getControl(formGroup, 'Retailer').setValue('Quality Save');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Savers') {
      getControl(formGroup, 'Retailer').setValue('Savers');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Poundland: & more') {
      getControl(formGroup, 'Retailer').setValue('Poundland');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Jack\'s') {
      getControl(formGroup, 'Retailer').setValue('Jack\'s');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'The Range') {
      getControl(formGroup, 'Retailer').setValue('The Range');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Safeway') {
      getControl(formGroup, 'Retailer').setValue('Safeway');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Safeway: Daily') {
      getControl(formGroup, 'Retailer').setValue('Safeway');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Dunnes Stores') {
      getControl(formGroup, 'Retailer').setValue('Dunnes Stores');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'SuperValu') {
      getControl(formGroup, 'Retailer').setValue('SuperValu');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Centra') {
      getControl(formGroup, 'Retailer').setValue('Centra');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'One Below') {
      getControl(formGroup, 'Retailer').setValue('One Below');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Amazon: Go') {
      getControl(formGroup, 'Retailer').setValue('Amazon');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Morrisons: Select') {
      getControl(formGroup, 'Retailer').setValue('Morrisons');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'The Deal Depot') {
      getControl(formGroup, 'Retailer').setValue('The Deal Depot');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Morrisons: Nutmeg') {
      getControl(formGroup, 'Retailer').setValue('Morrisons');
      getControl(formGroup, 'StoreTypeLPID').setValue('2');
    }
    if (value === 'Sainsbury\'s: On The Go') {
      getControl(formGroup, 'Retailer').setValue('Sainsbury\'s');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Swift') {
      getControl(formGroup, 'Retailer').setValue('Swift');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Asda: On The Move') {
      getControl(formGroup, 'Retailer').setValue('Asda');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
    if (value === 'Amazon: Fresh') {
      getControl(formGroup, 'Retailer').setValue('Amazon');
      getControl(formGroup, 'StoreTypeLPID').setValue('1');
    }
  });

  //  Fascia should only update other values when changed (not on edit page load) and hence line below is commented out.
  //  formGroup.controls['Fascia'].updateValueAndValidity({ onlySelf: true, emitEvent: true });

  getControl(formGroup, 'Retailer').valueChanges.subscribe((value: any) => {
    if (value !== 'Morrisons') {
      getControl(formGroup, 'Morrisons_Store_Number').setValue('');
      getControl(formGroup, 'Morrisons_Store_Number').disable();
    } else {
      getControl(formGroup, 'Morrisons_Store_Number').enable();
    }

    if (value === 'Morrisons') {
      getControl(formGroup, 'IsMorrisons').enable();
      getControl(formGroup, 'IsMorrisons').setValue(true);
      getControl(formGroup, 'IsMorrisons').disable();
    } else if (value === 'Developer') {
      getControl(formGroup, 'IsMorrisons').enable();
      getControl(formGroup, 'IsMorrisons').setValue(false);
    } else {
      getControl(formGroup, 'IsMorrisons').enable();
      getControl(formGroup, 'IsMorrisons').setValue(false);
      getControl(formGroup, 'IsMorrisons').disable();
    }

  });
  getControl(formGroup, 'Retailer').updateValueAndValidity({ onlySelf: true, emitEvent: true });

  getControl(formGroup, 'Trading_Status').valueChanges.subscribe((value: any) => {

    if (value === 'Trading' || value === 'Closed') {
      getControl(formGroup, 'Record_Type').setValue('Current');
    } else {
      getControl(formGroup, 'Record_Type').setValue('Future');
    }

  });
  getControl(formGroup, 'Trading_Status').updateValueAndValidity({ onlySelf: true, emitEvent: true });

  getControl(formGroup, 'Size_Net').valueChanges.subscribe((value: any) => {

    //  Fascia type must be >0 (but all are so logic isnt required)
    // if (value >= 0 && getControl(formGroup,'StoreTypeLPID').value === '0') {
    if (value === null || value === '') {
      getControl(formGroup, 'StoreTypeLPID').setValue(0);
    } else if (value <= 4999) {
      getControl(formGroup, 'StoreTypeLPID').setValue(1);
    } else {
      getControl(formGroup, 'StoreTypeLPID').setValue(2);
    }
    // }
    let size = 0;
    if (getControl(formGroup, 'Future_Extension_Extra_Space').value > 0 && value > 0) {
      size = getControl(formGroup, 'Future_Extension_Extra_Space').value + value;
    }
    textBlock['Future_Extension_Extra_Space'] = size !== 0 ? `Resulting Net Size: ${size}` : '';
  });
  getControl(formGroup, 'Size_Net').updateValueAndValidity({ onlySelf: true, emitEvent: true });

  getControl(formGroup, 'ConformID').valueChanges.subscribe((value: any) => {
    columns.forEach((column) => {
      if (column.id === 'ConformID') {
        if (value === 1) {
          column.options = of([
            { value: 0, label: '0 - Unknown' },
            { value: 1, label: '1 - Conforming, unconstrained, no problems' },
            {
              value: 2,
              label: '2 - Conforming but constrained, e.g. car park too small or pay and display, ' +
                'or access slightly difficult'
            },
            { value: 3, label: '3 - Nonconforming and constrained' },
            { value: 4, label: '4 - Nonconforming and severely constrained' }
          ]);

        }

      }
    });
  });
  getControl(formGroup, 'ConformID').updateValueAndValidity({ onlySelf: true, emitEvent: true });

  getControl(formGroup, 'Future_Extension_Extra_Space').valueChanges.subscribe((value: any) => {
    let size = 0;
    if (getControl(formGroup, 'Size_Net').value > 0 && value > 0) {
      size = getControl(formGroup, 'Size_Net').value + value;
    }
    textBlock['Future_Extension_Extra_Space'] = size !== 0 ? `Resulting Net Size: ${size}` : '';
  });
  getControl(formGroup, 'Future_Extension_Extra_Space').updateValueAndValidity({ onlySelf: true, emitEvent: true });

  getControl(formGroup, 'Future_Extension_Extra_Space_Gross').valueChanges.subscribe((value: any) => {
    let size = 0;
    if (getControl(formGroup, 'Size_Gross').value > 0 && value > 0) {
      size = getControl(formGroup, 'Size_Gross').value + value;
    }

    textBlock['Future_Extension_Extra_Space_Gross'] = size !== 0 ? `Total Gross space: ${size}` : '';
  });
  getControl(formGroup, 'Future_Extension_Extra_Space_Gross').updateValueAndValidity({ onlySelf: true, emitEvent: true });

  getControl(formGroup, 'Size_Gross').valueChanges.subscribe((value: any) => {
    let size = 0;
    if (getControl(formGroup, 'Future_Extension_Extra_Space_Gross').value > 0 && value > 0) {
      size = getControl(formGroup, 'Future_Extension_Extra_Space_Gross').value + value;
    }

    textBlock['Future_Extension_Extra_Space_Gross'] = size !== 0 ? `Total Gross space: ${size}` : '';
  });
  getControl(formGroup, 'Size_Gross').updateValueAndValidity({ onlySelf: true, emitEvent: true });

  getControl(formGroup, 'StoreTypeLPID').valueChanges.subscribe((value: any) => {

    setControlValue(getControl(formGroup, 'CentreStrengthID'), value === 2, value === 2 ? undefined : null);
    setControlValue(getControl(formGroup, 'PitchPositionID'), value === 1, value === 1 ? undefined : null);
    setControlValue(getControl(formGroup, 'TownType1ID'), value !== 0, value !== 0 ? undefined : null);
    setControlValue(getControl(formGroup, 'TownType2ID'), value !== 0, value !== 0 ? undefined : null);
    /*
            if (value === 0) {
                formGroup.controls['TownType1ID'].enable();
                formGroup.controls['TownType1ID'].setValue(null);
                formGroup.controls['TownType1ID'].disable();

                formGroup.controls['TownType2ID'].enable();
                formGroup.controls['TownType2ID'].setValue(null);
                formGroup.controls['TownType2ID'].disable();
            } else {
                formGroup.controls['TownType1ID'].enable();
                formGroup.controls['TownType2ID'].enable();
            }
    */
    if (value === 1) {
      getControl(formGroup, 'LocationType2ID').enable();
      // formGroup.controls['PitchPositionID'].enable();
    } else {
      getControl(formGroup, 'LocationType2ID').disable();
      // formGroup.controls['PitchPositionID'].disable();
    }

    /*		if (value === 2) {
                formGroup.controls['CentreStrengthID'].enable();
            } else {
                formGroup.controls['CentreStrengthID'].disable();
            }*/

    columns.forEach((column) => {
      if (column.id === 'TownType1ID') {
        if (value === 1) {
          column.options = of([
            { value: 15, label: 'London (within M25)' },
            { value: 16, label: 'London (within N/S Circular)' },
            { value: 17, label: 'Major Conurbation' },
            { value: 18, label: 'Large Town' },
            { value: 19, label: 'Medium Town' },
            { value: 20, label: 'Small Town' }
          ]);

        } else if (value === 2) {
          column.options = of([
            { value: 11, label: 'Major Conurbation' },
            { value: 12, label: 'Large Town' },
            { value: 13, label: 'Medium Town' },
            { value: 14, label: 'Small Town' }
          ]);
        }
      }

      if (column.id === 'TownType2ID') {
        if (value === 1) {
          column.options = of([
            { value: 6, label: 'London (Zone 1 & 2)' },
            { value: 7, label: 'Central' },
            { value: 8, label: 'Edge of Central' },
            { value: 9, label: 'Suburb' },
            { value: 10, label: 'Out-of-Town' }
          ]);

        } else if (value === 2) {
          column.options = of([
            { value: 1, label: 'Town Centre' },
            { value: 2, label: 'Edge of Centre' },
            { value: 3, label: 'Suburb' },
            { value: 4, label: 'Out of Town' },
            //{ value: '5', description: 'Neighbourhood Centre' }
          ]);
        }
      }

      if (column.id === 'LocationType1ID') {
        if (value === 1) {
          getControl(formGroup, 'LocationType1ID').enable();
          column.options = of([
            { value: 10, label: 'District Centre' },
            { value: 11, label: 'Standalone' },
            { value: 12, label: 'Local Parade (Strong)' },
            { value: 13, label: 'Local Parade (Weak)' },
            { value: 14, label: 'Local Parade (< 8 Units)' },
            { value: 15, label: 'High Street' },
            { value: 16, label: 'End of High Street' },
            { value: 17, label: 'In Station' },
            { value: 18, label: 'Shopping Centre' },
            { value: 19, label: 'Retail Park' },
            { value: 28, label: 'Local Centre' }
          ]);

        } else if (value === 2) {
          getControl(formGroup, 'LocationType1ID').enable();
          column.options = of([
            { value: 1, label: 'Standalone' },
            { value: 2, label: 'High Street' },
            { value: 3, label: 'End of High Street' },
            { value: 4, label: 'Retail Park (Adjacent)' },
            { value: 5, label: 'Retail Park (Shared)' },
            { value: 6, label: 'Retail Park (Opposite)' },
            //{ value: '7', description: 'Leisure Park (Shared)' },
            { value: 8, label: 'Shopping Centre' },
            { value: 9, label: 'District Centre' }
          ]);
        } else {
          getControl(formGroup, 'LocationType1ID').disable();
        }
      }
      if (column.id === 'CentreStrengthID') {
        if (value === 1) {
          column.options = of([
            { value: 4, label: 'X' }
          ]);

        } else if (value === 2) {
          column.options = of([
            { value: 1, label: 'A' },
            { value: 2, label: 'B' },
            { value: 3, label: 'C' },
            { value: 4, label: 'D' },
            { value: 5, label: 'X' }
          ]);
        }
      }
      if (column.id === 'PitchPositionID') {
        if (value === 1) {
          column.options = of([
            { value: 1, label: 'Prime Pitch' },
            { value: 2, label: 'Secondary Pitch' },
            { value: 3, label: 'Tertiary Pitch' },
            { value: 4, label: 'Off-Pitch' }
          ]);

        } else if (value === 2) {
          column.options = of([
            { value: 1, label: 'Not Used' }
          ]);
        }
      }
    });
  });
  getControl(formGroup, 'StoreTypeLPID').updateValueAndValidity({ onlySelf: true, emitEvent: true });

  getControl(formGroup, 'Fac_ATM').valueChanges.subscribe((value: any) => {
    if (value === 'Yes') {
      getControl(formGroup, 'Fac_ATMType').enable();
    } else {
      getControl(formGroup, 'Fac_ATMType').disable();
    }
  });
  getControl(formGroup, 'Fac_ATM').updateValueAndValidity({ onlySelf: true, emitEvent: true });

  getControl(formGroup, 'Fac_ClickAndCollect_Overall').valueChanges.subscribe((value: any) => {
    if (value === 'Yes') {
      getControl(formGroup, 'Fac_ClickAndCollect_Grocery').enable();
      getControl(formGroup, 'Fac_ClickAndCollect_NonFood').enable();
    } else {
      getControl(formGroup, 'Fac_ClickAndCollect_Grocery').disable();
      getControl(formGroup, 'Fac_ClickAndCollect_NonFood').disable();
    }
  });
  getControl(formGroup, 'Fac_ClickAndCollect_Overall').updateValueAndValidity({ onlySelf: true, emitEvent: true });
}

function setControlValue(control: AbstractControl, isEnabled: boolean, value?: any) {
  control.enable();
  if (value !== undefined) {
    control.setValue(value);
  }
  if (isEnabled === false) {
    control.disable();
  }
}

function getControl(formGroup: FormGroup, controlName: string): AbstractControl {
  return formGroup.controls[controlName] || new FormControl();
}
