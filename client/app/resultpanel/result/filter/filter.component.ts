import { Component, Output, Input, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef, ViewChild, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, FormControl, ValidationErrors } from '@angular/forms';
import { Subscription, Observable, Subject, combineLatest, BehaviorSubject, of } from 'rxjs';
import {
  FilterService,
  SelectionService,
  LayerDataService,
  LayerSource,
  AccountService,
  ActionMessageService,
  OverlayShapeCircle, OverlayShapeRectangle, DrawingOverlay,
  OverlayShape,
  OverlayService,
  ZINDEX,
  COLORS,
  checkVerticesCountWithinLimit,
  createSimpleError,
  PanelService,
  MIN_RESULT_PANEL,
  LayerService,
} from '../../../shared';
import { FilterShareComponent } from './filter-share/filter-share.component';
import { OverlayShapeGeometry, OverlayShapeOptions, IAccount, ILayer, IFilter, IFilterColumnFilter, ShareFeatureDialogModel } from '../../../shared/interfaces';
import { OverlayShapeType, MapToolType, ILayerColumnType, IFilterJunction, EFeatureShare, ERecipientType } from '../../../shared/enums';
import * as _ from 'lodash';
import { decorateError } from '../../../shared/http.util';
import { ModalService } from '../../../shared/services/modal.service';
import { takeUntil, map, switchMap, filter, first } from 'rxjs/operators';
import { BreakpointService } from '../../../shared/services/breakpoint.service';
import { OverlaypanelComponent, DialogComponent, DynamicConfirmComponent } from '@client/app/shared/components';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { FeatureShareFormComponent } from 'src/client/app/shared/containers';
import { JstsOperatorService } from 'src/client/app/shared/services';
import { ResultStatus } from 'src/client/app/shared/models/modal.model';

@Component({
  selector: 'go-filter',
  moduleId: module.id,
  templateUrl: 'filter.component.html',
  styleUrls: ['filter.component.less']
})
export class FilterComponent implements OnInit, OnDestroy {

  @ViewChild('deleteFilterConfirm', { static: true }) deleteFilterConfirmDialog: DialogComponent;
  @ViewChild('goFilterShare', { static: true }) goFilterShare: FilterShareComponent;
  @Output() changeFilter = new EventEmitter<IFilter>();
  @Output() createLayer = new EventEmitter<IFilter>();
  @Input()
  set layer(layer: ILayer) {
    this.groupCollapse = {};
    if (layer) {
      this.filterListInput = this.filterService.filterListStore[layer.id];

      if (!this.filterService.filterActiveStore[layer.id] && this.filterListInput) {
        this.filterService.setActiveFilter(layer.id, this.filterListInput[0]);
      }

      this.filterInput = this.filterService.filterActiveStore[layer.id];
    }
    if (!(this.layerInput && layer && this.layerInput.id == layer.id)) {
      this.layerShareSource.next(layer);
    }
    this.layerInput = layer;
    this.layerChanged$.next(this.layerInput)
    this.setClose();
  }
  sortDirectionOptions: PsSelectOption[]= [{
    value: 'ASC',
    label: 'Ascending'
  },{
    value: 'DESC',
    label: 'Descending'
  }]
  groupsOptions: PsSelectOption[] = [];
  operatorOptions: PsSelectOption[] = [{
    value: 'SpatialBinaryOperator.Intersects',
    label: 'Overlaps'
  },{
    value: 'SpatialBinaryOperator.WithinBounds',
    label: 'Inside'
  }];
  filterOperatorOptions: PsSelectOption[] = [{
    value: 'BinaryOperator.Equals',
    label: 'Equals'
  },{
    value: 'BinaryOperator.NotEquals',
    label: 'Not equals'
  },{
    value: 'BinaryOperator.Between',
    label: 'Between'
  },{
    value: 'BinaryOperator.LessThan',
    label: 'Less than'
  },{
    value: 'BinaryOperator.GreaterThan',
    label: 'Greater than'
  },{
    value: 'BinaryOperator.LessThanOrEqual',
    label: 'Less than or equal to'
  },{
    value: 'BinaryOperator.GreaterThanOrEqual',
    label: 'Greater than or equal'
  },{
    value: 'NullabilityOperator.IsNull',
    label: 'Is null'
  }]
  filterOperatorDateOptions: PsSelectOption[] = [{
    value: 'BinaryOperator.Equals',
    label: 'Equals'
  },{
    value: 'BinaryOperator.NotEquals',
    label: 'Not equals'
  },{
    value: 'BinaryOperator.LessThan',
    label: 'Less than'
  },{
    value: 'BinaryOperator.GreaterThan',
    label: 'Greater than'
  },{
    value: 'BinaryOperator.LessThanOrEqual',
    label: 'Less than or equal to'
  },{
    value: 'BinaryOperator.GreaterThanOrEqual',
    label: 'Greater than or equal'
  },{
    value: 'NullabilityOperator.IsNull',
    label: 'Is null'
  }]
  filterOperatorStringOptions: PsSelectOption[] = [{
    value: 'StringBinaryOperator.Equals',
    label: 'Equals'
  },{
    value: 'StringBinaryOperator.NotEquals',
    label: 'Not equals'
  },{
    value: 'StringBinaryOperator.StartsWith',
    label: 'Starts with'
  },{
    value: 'StringBinaryOperator.EndsWith',
    label: 'Ends with'
  },{
    value: 'NullabilityOperator.IsNull',
    label: 'Is null'
  }]
  isDevMode = false;
  canCopyToTenant = false;
  form: FormGroup;
  isFilterOpen = false;
  isSelectionActive = false;
  layerInput: ILayer;
  filterInput: IFilter;
  columnType = ILayerColumnType;
  filterJunction = IFilterJunction;
  layerSource = LayerSource;
  currentFilter: IFilter = null;
  picklist: { [columnId: string]: Observable<{ value: any, description: string }[]> } = {};
  canEditFilter = false;
  isAddFilter = true;
  isCreateMatch = false;
  canSpatialFilter = false;
  canShareFilter = false;
  canCreateUserLayer = false;
  canCreateLayerFromFilter = false;
  filterShape: OverlayShape = null;
  treeChildGroups: { [columnId: string]: FormGroup } = {};
  treeParentGroups: { [columnId: string]: FormGroup } = {};
  filterShare: IFilter = null;
  deletedConfirmFilter: IFilter = null;
  filterShareSource: Subject<IFilter> = new Subject<IFilter>();
  layerShareSource: Subject<ILayer> = new Subject<ILayer>();
  groupCollapse: { [groupId: string]: boolean } = {};
  showIcon: boolean = true;
  account: IAccount;
  canShare$: Observable<boolean>;
  disableShare$: Observable<boolean>;
  gettingShape: boolean = false;
  filterListInput: IFilter[] = [];
  private filterSubscription: Subscription;
  private unsubscribe$: Subject<void> = new Subject<void>();
  private layerChanged$: BehaviorSubject<ILayer> = new BehaviorSubject<ILayer>(null);

  get groupsControls(){
    return this.form ? (<FormArray>this.form.get('groups')).controls : []
  }
  constructor(private filterService: FilterService,
    private selectionService: SelectionService,
    private overlayService: OverlayService,
    private layerDataService: LayerDataService,
    private formBuilder: FormBuilder,
    private actionMessageService: ActionMessageService,
    private changeRef: ChangeDetectorRef,
    private accountService: AccountService,
    private modalService: ModalService,
    private panelService: PanelService,
    private breakpointService: BreakpointService,
    private _jstsOperatorService: JstsOperatorService,
    private _layerService: LayerService,
    private _ngZone: NgZone) {

    this.breakpointService.rightSection$.subscribe(value => {
      if (value.width < MIN_RESULT_PANEL) {
        this.showIcon = false;
      } else {
        this.showIcon = true;
      }
      this.changeRef.detectChanges();
    })

    this.canShare$ = this.accountService.account.pipe(
      map(e => e.shareFilter));

    this.disableShare$ = combineLatest(
      this.layerChanged$,
      this.accountService.account
    ).pipe(
      map(([layer, account]) => layer ? !(account.username === layer?.owner || layer?.source === LayerSource.CORPORATE): true));
  }

  ngOnInit() {
    this.accountService.account.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe((item: IAccount) => {
      this.account = item;
      this.canEditFilter = item.editFilter;
      this.isDevMode = item.isDevMode;
      this.canCopyToTenant = item.canCopyToTenant;
      this.canSpatialFilter = item.canSpatialFilter;
      this.canShareFilter = item.shareFilter;
      this.canCreateUserLayer = item.createUserLayer;
      this.canCreateLayerFromFilter = item.canCreateLayerFromFilter;
    });
    this.filterSubscription = this.filterService.filter.subscribe(filterChange => {
      if (this.layerInput && filterChange.layerId === this.layerInput.id) {
        this.filterInput = filterChange.filter;
        this.filterListInput = this.filterService.filterListStore[filterChange.layerId];
        this.changeRef.detectChanges();
      }
    });

    this.selectionService.shape.pipe(
      switchMap(shapeRef=>{
        if (!this.form) {
          return of(null);
        }

        if(!shapeRef){
          return of(null);
        }
        this.gettingShape = true;
        const layer = this._layerService.layerStore.get(shapeRef.overlayId);

        if(layer){
           return this.layerDataService.getRecordDetail(layer, shapeRef.id).pipe(
             map((x)=>{
               if(x && x.detail){
                const geometry = x.detail.geom || x.detail.Geom;
                return geometry
               }
               return null
             })
           )
        }
        return of(shapeRef.serializeWithType())
      }),
      filter(e=>!!e)
      ).subscribe((gometry: OverlayShapeGeometry) => {
        this.gettingShape = false;
        if (!this._jstsOperatorService.isValidShape(gometry)) {
          this.openModal(() => {
            const _shape = this._jstsOperatorService.getValidateShape(gometry);
            if(!_shape) {
              this.actionMessageService.sendWarning("Unhandled case!")
              return;
            }
            this.createShapeFilter(_shape);
          })
          return;
        }
        this.createShapeFilter(gometry);
    });

    this.selectionService.activeTool.subscribe(toolType => {
      this.isSelectionActive = toolType === MapToolType.SELECT_FILTER_SHAPE;
      this.changeRef.markForCheck();
      this.changeRef.detectChanges();
    });
  }

  ngOnDestroy() {
    this.filterSubscription.unsubscribe();
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  doCheck() {
    this.changeRef.detectChanges();
  }

  onShapeSelect() {
    this.selectionService.setTool(this.isSelectionActive ? null : MapToolType.SELECT_FILTER_SHAPE);
    this.changeRef.markForCheck();
    this.changeRef.detectChanges();
  }

  onFilterSelect(filter: IFilter) {
    this.filterService.setActiveFilter(this.layerInput.id, filter);
    this.changeRef.detectChanges();
  }


  onCreateForm(filter: IFilter = null) {
    try {
      this.isAddFilter = true;
      this.createFilterForm(false, filter);
      this.isFilterOpen = true;
    } catch (error) {
      this.actionMessageService.sendError(decorateError(error).error.message);
      this.onCancel(true);
    }
    this.changeRef.detectChanges();
  }

  onUpdateForm($event: Event, filter: IFilter, dropdown: OverlaypanelComponent) {
    $event.stopImmediatePropagation();
    try {
      this.isAddFilter = false;
      this.createFilterForm(true, filter);
      this.isFilterOpen = true;
      dropdown.hide();
    } catch (error) {
      this.actionMessageService.sendError(decorateError(error).error.message);
      this.onCancel(true);
    }
    this.changeRef.detectChanges();
  }

  ondeleteFilterConfirmOpen($event: Event, filter: IFilter, dropdown: OverlaypanelComponent) {
    this.deletedConfirmFilter = filter;
    dropdown.hide();
    this.deleteFilterConfirmDialog.onHide(false);
    this.changeRef.detectChanges();
  }

  onDeleteFilterConfirmClose() {
    this.deleteFilterConfirmDialog.onHide(true);
  }

  onDelete(filter: IFilter) {
    this.filterService.deleteFilter(this.layerInput.id, filter);
    this.setClose();
    this.deleteFilterConfirmDialog.onHide(true);
    this.changeRef.detectChanges();
  }

  onCopy($event: Event, filter: IFilter, dropdown: OverlaypanelComponent) {
    $event.stopImmediatePropagation();
    console.log('[COPY]');
    dropdown.hide();
    const filterCopy = Object.assign({}, filter);
    filterCopy.name = `${filter.name} (Copy)`;
    filterCopy.source = LayerSource.USER;
    this.filterService.createFilter(this.layerInput.id, null, filterCopy);
    this.changeRef.detectChanges();
  }

  onShare($event: Event, filter: IFilter, dropdown: OverlaypanelComponent) {
    $event.stopImmediatePropagation();
    console.log('[SHARE] Filter');
    const ref = this.modalService.openModal(FeatureShareFormComponent, {
      titleDialog: 'Share Layer Filter',
      titleText: `Filter: ${filter.name}`,
      data: {
        type: EFeatureShare.FILTER,
        data: filter,
        name: filter.name,
        key: this.layerInput.id,
        recipientType: this.layerInput.source === LayerSource.CORPORATE ? ERecipientType.ALL : ERecipientType.USER_LAYERS
      }
    } as ShareFeatureDialogModel)
    // dropdown.hide();
    // this.filterShare = filter;
    // this.filterShareSource.next(this.filterShare);
    // this.changeRef.detectChanges();
  }

  onNewLayer($event: Event, filter: IFilter, dropdown: OverlaypanelComponent) {
    $event.stopImmediatePropagation();
    console.log('[New Layer]');
    dropdown.hide();
    let filterNew = Object.assign({}, filter);
    this.createLayer.next(filterNew);
  }

  onUpdate() {
    const filter = this.convertToIFilter(this.form, this.filterShape);
    this.setClose();
    this.filterService.updateFilter(this.layerInput.id, this.currentFilter, filter);
  }

  onCreate() {
    const filter = this.convertToIFilter(this.form, this.filterShape);
    this.setClose();
    this.filterService.createFilter(this.layerInput.id, this.currentFilter, filter);
    if (this.isCreateMatch) {
      this.actionMessageService.sendInfo(`To view match result please turn on layer '${this.layerInput.name}'`);
      this.isCreateMatch = false;
    }
  }

  onClose() {
    this.changeRef.detectChanges();
  }

  onCancel(error?: boolean) {
    this.setClose();
    if (this.isAddFilter === false && !error) {
      this.filterService.setActiveFilter(this.layerInput.id, this.currentFilter);
    }
  }

  private setClose() {
    this.onShapeFilterDelete();
    this.isFilterOpen = false;
    this.unsubscribe$.next();
    this.changeRef.detectChanges();
    if (this.layerInput) {
      // this.overlayService.overlays.get('__FILTER').deleteShape(this.layerInput.id);
    }
  }

  createFilterForm(isUpdate: boolean, filter: IFilter = null) {
    this.unsubscribe$.next();
    filter = _.cloneDeep(filter);
    this.currentFilter = _.cloneDeep(filter);
    const idColumn = this.layerInput.columns.find(column => column.isIdentifier) || { id: '' };

    const emptySelectionValidatorFn = (c: FormArray): ValidationErrors | null => {
      let selected = false;
      c.controls.forEach((group: FormGroup) => {
        (<FormArray>group.controls.columns).controls.forEach((column: FormGroup) => {
          if (column.controls.isVisible.value === true) {
            selected = true;
          }
        });
      });
      return selected ? null : {
        'emptySelection': 'You have to select at least 1 column.'
      };
    };

    this.form = this.formBuilder.group({
      id: [filter ? filter.id : null],
      name: [filter ? filter.name : '', Validators.required],
      isDefault: [filter ? filter.isDefault : false, Validators.required],
      sortColumn: [filter ? filter.sortColumn : idColumn.id, Validators.required],
      sortDirection: [filter ? filter.sortDirection : 'ASC', Validators.required],
      source: [filter ? filter.source : LayerSource.USER],
      shape: this.formBuilder.group({
        value: [filter && filter.shape ? filter.shape.value : null],
        operator: [filter && filter.shape ? filter.shape.operator : 'SpatialBinaryOperator.Intersects']
      }),
      groups: this.formBuilder.array([], emptySelectionValidatorFn)
    });

    if (filter && filter.shape && filter.shape.value) {
      this.createShapeFilter(filter.shape.value);
    }

    const groups = (<FormArray>this.form.controls['groups']);

    this.form.statusChanges.subscribe(status => {
      this.changeRef.detectChanges();
    });

    this.layerInput.columnGroups.forEach(item => {
      groups.push(this.formBuilder.group({
        id: item.Index,
        name: item.Name,
        columns: this.formBuilder.array([])
      }));
      this.groupsOptions.push({
        value: item.Index,
        label: item.Name,
        items: []
      })
    });

    this.layerInput.columns
      .filter(item => !(item.notFilterable || item.notSelectable || item.type === ILayerColumnType.SHAPE))
      .forEach(column => {
        const filters: FormGroup[] = [];
        const isVisible = filter ? filter.displayColumns.includes(column.id) : column.isIdentifier || column.isLabel;
        const junction = filter && filter.junctions && filter.junctions[column.id] === IFilterJunction.OR ?
          IFilterJunction.OR : IFilterJunction.AND;

        const columnGroup: FormGroup = this.formBuilder.group({
          id: column.id,
          name: column.name,
          type: column.type,
          isPicklist: column.isPicklist,
          notSortable: column.notSortable,
          notFilterable: column.notFilterable,
          notSelectable: column.notSelectable,
          isIdentifier: column.isIdentifier,
          ParentPickListColumnName: null,
          isPercentage: column.isPercentage,
          isVisible: { value: isVisible, disabled: column.notSelectable },
          filters: this.formBuilder.array(filters),
          junctions: junction,
          required: column.required
        });

        if (filter && filter.filters[column.id]) {
          filter.filters[column.id].forEach((filterPart: IFilterColumnFilter) => {
            (<FormArray>columnGroup.controls['filters']).push(this.createPartialFilter(columnGroup, filterPart));
          });
        }

        if (column.isChildPickList) {
          const parentColunn = this.layerInput.columns.find(x => x.ChildPickListColumnName === column.id);
          this.treeChildGroups[parentColunn.id] = columnGroup;
          columnGroup.controls.ParentPickListColumnName.setValue(parentColunn.id);
          columnGroup.get('isVisible').disable();
        }
        if (column.isParentPickList) {
          this.treeParentGroups[column.ChildPickListColumnName] = columnGroup;
          columnGroup.get('isVisible').valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(value => {
            if (this.treeChildGroups[column.id]
              && this.treeChildGroups[column.id].get('isVisible')) {
              const childIsVisible = this.treeChildGroups[column.id].get('isVisible').value;
              if (childIsVisible != value) {
                this.treeChildGroups[column.id].get('isVisible').setValue(value);
              }
            }
          })
        }
        let _groupIndex = groups.getRawValue().findIndex(e=>e.id == column.groupId);
        if (_groupIndex != -1) {
          (<FormArray>(<FormGroup>groups.at(_groupIndex)).controls['columns']).push(columnGroup);
          if(!column.notSortable){
            this.groupsOptions[_groupIndex].items.push({
              label: column.name,
              value: column.id
            })
          }
        } else {
          throw createSimpleError(`Cannot display filter for ${this.layerInput.name} because one of more columns are assigned to a group that doesn't exist.`)
        }
      });
    this.groupsOptions = this.groupsOptions.filter(e => e.items.length);
    this.changeRef.detectChanges();
  }

  createShapeFilter(shape: OverlayShapeGeometry): void {

    if (this.overlayService.overlays.get('__FILTER').shapes.has(this.layerInput.id)) {
      this.overlayService.overlays.get('__FILTER').deleteShape(this.layerInput.id);
    }

    if (shape.coordinates[0].length === 61 && shape.coordinates[0][0][0] === shape.coordinates[0][30][0]) {
      shape = <any>{
        type: OverlayShapeType[OverlayShapeType.Circle],
        coordinates: OverlayShapeCircle.getGeometry(shape.coordinates)
      };

    } else if (shape.coordinates[0].length === 5 && shape.coordinates[0][1][1] === shape.coordinates[0][2][1]) {
      shape = <any>{
        type: OverlayShapeType[OverlayShapeType.Rectangle],
        coordinates: OverlayShapeRectangle.getGeometry(shape.coordinates)
      };
    }
    let isEditable = true;

    if ([OverlayShapeType.Polygon, OverlayShapeType.MultiPolygon].includes(OverlayShapeType[shape.type])) {
      isEditable = checkVerticesCountWithinLimit(shape);
    }

    const opts: OverlayShapeOptions = {
      isEditable: isEditable,
      isSelectable: true,
      fillColor: COLORS.MAP_FILTER,
      strokeColor: COLORS.MAP_FILTER_STROKE,
      transparency: COLORS.MAP_FILTER_TRANSPARENCY,
      zIndex: ZINDEX.LOCATION,
      iconSize: 24,
      geometry: shape.coordinates
    };

    this.filterShape = (<DrawingOverlay>this.overlayService
      .overlays
      .get('__FILTER'))
      .addShapeByCoordinates(this.layerInput.id, OverlayShapeType[shape.type], shape.coordinates, opts);

    this.changeRef.markForCheck();
    this.changeRef.detectChanges();
  }

  onShapeFilterDelete() {
    // (<FormGroup>this.form.controls['shape']).controls['value'].setValue(null);
    if (this.layerInput) {

      if (this.overlayService.overlays.get('__FILTER').shapes.has(this.layerInput.id)) {
        this.overlayService.overlays.get('__FILTER').deleteShape(this.layerInput.id);
      }
      this.filterShape = null;
      this.changeRef.markForCheck();
      this.changeRef.detectChanges();
    }
  }

  createPartialFilter(column: FormGroup, filterValue: IFilterColumnFilter = null): FormGroup {

    const isPicklist = column.controls['isPicklist'].value;
    const columnId = column.controls['id'].value;
    const columnType = column.controls['type'].value;
    const required = column.controls['required'].value;

    if (!filterValue) {
      filterValue = {
        operator: '',
        value: '',
        options: []
      };
      switch (columnType) {
        case ILayerColumnType.BOOLEAN:
          filterValue.operator = 'BinaryOperator.Equals';
          break;
        case ILayerColumnType.NUMBER:
          filterValue.operator = 'BinaryOperator.LessThanOrEqual';
          break;
        case ILayerColumnType.FLOAT:
          filterValue.operator = 'BinaryOperator.LessThanOrEqual';
          break;
        case ILayerColumnType.DATE:
          filterValue.operator = 'BinaryOperator.LessThanOrEqual';
          break;
        case ILayerColumnType.STRING:
          filterValue.operator = 'StringBinaryOperator.StartsWith';
          break;
        case ILayerColumnType.SHAPE:
          filterValue.operator = 'SpatialBinaryOperator.Intersects';
          break;
        default:
          console.warn('missing type', columnType);
      }

      if (column.controls['isPicklist'].value) {
        filterValue.operator = 'CollectionBinaryOperator.In';
      }
    }

    const isArray = Array.isArray(filterValue.value) &&
      columnType !== ILayerColumnType.NUMBER &&
      columnType !== ILayerColumnType.FLOAT &&
      !isPicklist;

    const columnFilterGroup = this.formBuilder.group({
      operator: filterValue.operator,
      value: isArray ? this.formBuilder.array(filterValue.value) : new FormControl(filterValue.value),
      options: this.formBuilder.array([])
    });

    if (columnType !== ILayerColumnType.SHAPE) {
      columnFilterGroup.controls['operator'].setValidators(Validators.required);
      if (columnFilterGroup.controls['operator'].value !== 'NullabilityOperator.IsNull') {
        columnFilterGroup.controls['value'].setValidators(Validators.required);
      }

      columnFilterGroup.controls['operator'].valueChanges.subscribe((value: string) => {
        if (value === 'NullabilityOperator.IsNull') {
          columnFilterGroup.controls['value'].setValidators(null);
          columnFilterGroup.controls['value'].setValue(null);
        } else {
          columnFilterGroup.controls['value'].setValidators(Validators.required);
        }
        columnFilterGroup.controls['value'].updateValueAndValidity();
      });

    }

    return columnFilterGroup;
  }

  addPartialFilter(column: FormGroup) {
    (<FormArray>column.controls['filters']).push(this.createPartialFilter(column));
    this.changeRef.detectChanges();
  }

  deletePartialFilter(column: FormGroup, index: number) {
    (<FormArray>column.controls['filters']).removeAt(index);
    this.changeRef.detectChanges();
  }

  onSelectColumn(group: FormGroup, isSelected: boolean) {
    (<FormArray>group.controls['columns']).controls.forEach((column: FormGroup) => {
      column.controls['isVisible'].setValue(isSelected);
    });
  }

  onMoveToTenant() {
    const filter = this.convertToIFilter(this.form, this.filterShape);
    this.filterService.copyToTenant(this.layerInput.id, filter);
  }

  onCloseFilterShare() {
    this.filterShare = null;
    this.changeRef.detectChanges();
  }

  onToggle(index: number) {
    this.groupCollapse[index] = !this.groupCollapse[index];
    this.changeRef.detectChanges();
  }

  convertToIFilter(form: FormGroup, filterShape: OverlayShape): IFilter {
    const raw: any = form.getRawValue();
    const filterParts: { [columnId: string]: IFilterColumnFilter[] } = {};
    const junctions: { [columnId: string]: IFilterJunction } = {};
    const displayColumns: string[] = [];

    (<Array<any>>raw.groups).forEach(group => {
      (<Array<any>>group.columns).forEach(column => {
        if (column.isVisible) {
          displayColumns.push(column.id);
        }
        junctions[column.id] = Number(column.junctions);
        column.filters.forEach((filterPart: IFilterColumnFilter) => {
          if (!Array.isArray(filterParts[column.id])) {
            filterParts[column.id] = [];
          }

          if (column.type === ILayerColumnType.NUMBER || column.type === ILayerColumnType.FLOAT) {
            if (Array.isArray(filterPart.value) &&
              !['CollectionBinaryOperator.In', 'BinaryOperator.Between'].includes(filterPart.operator)) {
              filterPart.value = filterPart.value[0];
            }
          }
          filterParts[column.id].push(filterPart);
        });
      });
    });

    let shape: IFilterColumnFilter | null = null;

    if (filterShape) {
        shape = {
          operator: raw.shape.operator,
          value: filterShape.serializeWithType()
        };
    }

    return {
      id: raw.id,
      name: <string>raw.name,
      isDefault: <boolean>raw.isDefault,
      shape: shape,
      displayColumns: displayColumns,
      sortColumn: <string>raw.sortColumn,
      sortDirection: <string>raw.sortDirection,
      filters: filterParts,
      junctions: junctions,
      source: LayerSource.USER
    };
  }


  openModal(success: Function, cancel?: Function) {
    this._ngZone.run(() => {
      const ref = this.modalService.openModal(DynamicConfirmComponent, {
        model: {
          title: "Confirm",
          content: "The selected shape is invalid. Would you like us to attempt to correct the shape and proceed?",
          yesButton: "Yes",
          noButton: "No"
        }
      })
      ref.afterClosed().pipe(first()).subscribe(res => {
        if (res) {
          if (res.status == ResultStatus.OK) {
            success();
          } else {
            if(cancel) {
              cancel();
            }
          }
        }
      })
    })
}

}
