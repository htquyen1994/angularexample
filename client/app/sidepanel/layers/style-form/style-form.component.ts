import { Component, Input, AfterContentInit, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, NgZone, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Subscription, Subject, Observable } from 'rxjs';
import { debounceTime, takeUntil, map, filter } from 'rxjs/operators';
import {
  LayerStyle,
  LayerStyleService,
  LayerDataService,
  ICONS_PATH,
  LayerSource,
  LayerStyleSelection,
  AccountService,
  LayerStyleGradient,
  FilterService,
  OverlayService,
  ICONS_LINE,
  ICONS_SVG,
  ActionMessageService,
  MapService
} from '../../../shared';
import { DomSanitizer } from '@angular/platform-browser';
import { IAccount, ILayer, IFilter, ColumnStatistics, ILayerColourRamp, ShareFeatureDialogModel } from '../../../shared/interfaces';
import { ILayerColumnType, LayerType, EFeatureShare, ERecipientType } from '../../../shared/enums';
import { LayerStyleType, ValueFunctionType, LineStyle, ClusterType } from '../../../shared/models/layer-style.model';
import { decorateError } from 'src/client/app/shared/http.util';
import { LayerBundle } from 'src/client/app/shared/layerBundle';
import {
  DynamicPipe
} from '@client/app/shared/pipes'
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import * as domHandler from '../../../shared/helper/domHandler'
import { ModalService } from 'src/client/app/shared/services';
import { FeatureShareFormComponent } from 'src/client/app/shared/containers';

@Component({
  selector: 'go-style-form',
  moduleId: module.id,
  templateUrl: 'style-form.component.html',
  styleUrls: ['style-form.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class StyleFormComponent implements OnInit, AfterContentInit, OnDestroy {

  @Input()
  set setLayer(layer: ILayer) {
    if (layer instanceof LayerBundle) {
      this.isRollupLayer = true;
      layer.activeChildChange$.pipe(takeUntil(this.destroy$)).subscribe(activeLayer => {
        this.layer = activeLayer;
      })
    } else {
      this.layer = layer;
    }
    const { columns } = this.layer;
    this.colourPicklist = columns.filter(column => column.type === ILayerColumnType.STRING && column.isColour && !(column.notFilterable || column.notSelectable)).map(e => ({ label: e.name, value: e.id }))
    this.pickListColumnOptions = columns.filter(e => e.isPicklist && !(e.notFilterable || e.notSelectable)).map(e => ({ label: e.name, value: e.id }));
    this.numberColumnOptions =  columns.filter(e => (e.type === ILayerColumnType.NUMBER || e.type === ILayerColumnType.FLOAT) && !(e.notFilterable || e.notSelectable)).map(e => ({ label: e.name, value: e.id }));
    //this.heatMapOnly = layer.heatMapOnly;
  }

  @Input() isShowLegends = true;
  // @ViewChild(VirtualScrollComponent) virtualScroll: VirtualScrollComponent;

  styleOptions: PsSelectOption[] =[];

  //heatMapOnly: boolean;
  styleSelected: any;
  form: FormGroup;
  isCreate: boolean = null;
  layerType = LayerType;
  iconsPath = ICONS_PATH;
  iconsSVG = ICONS_SVG;
  isMorrisonLegend = false;
  canEditSymbology = false;
  canShare$: Observable<boolean>;
  disableShare$: Observable<boolean>;
  columnStatistics: ColumnStatistics = {
    min: null,
    max: null
  };
  style: LayerStyle;
  styleTemp: LayerStyle;

  layerColumnType = ILayerColumnType;
  layerStyleType = LayerStyleType;
  valueFunctionType = ValueFunctionType;
  isLoading = false;
  isDevMode = false;
  hasAdvancedStyling = false;
  canCopyToTenant = false;
  isFilter = false;
  list = [];

  viewPortItems = null;
  viewPortLegendItems = null;
  colourPicklist: PsSelectOption[] = [];
  ClusterType = ClusterType;
  isRollupLayer = false;
  private layer: ILayer;

  private styleIndex: number;
  private styleList: LayerStyle[] = [];
  private formSubscription: Subscription;
  private picklistEntriesSubscription: Subscription;
  private destroy$: Subject<boolean> = new Subject<boolean>();
  styleTypeList: PsSelectOption[] = [
    { value: LayerStyleType.BASIC, label: 'Simple' },
    { value: LayerStyleType.SELECTION, label: 'Column' },
    { value: LayerStyleType.GRADIENT, label: 'Gradient' },
    { value: LayerStyleType.HEATMAP, label: 'Heatmap' },
    { value: LayerStyleType.CLUSTER, label: 'Cluster' }
  ];

  lineStyle: PsSelectOption[] = [
    { value: LineStyle.SOLID, label: 'Solid' },
    { value: LineStyle.DASHED, label: 'Dashed' },
  ]
  valueFunctionOptions: PsSelectOption[] = [
    { value: ValueFunctionType.LINEAR, label: 'Linear' },
    { value: ValueFunctionType.LOGARITHM, label: 'Common Logarithm' },
    { value: ValueFunctionType.NATURAL_LOGARITHM, label: 'Natural Logarithm' },
    { value: ValueFunctionType.EXPONENTIAL, label: 'Exponential' }
  ];
  colourRamps$: Observable<ILayerColourRamp[]>
  showColourRamp = false;
  oldGradient: string[];
  hasQuickFilter = false;
  sidePanelEl: HTMLElement;
  pickListColumnOptions:PsSelectOption[] = [];
  numberColumnOptions:PsSelectOption[] = [];
  parentElement: any;
  constructor(private formBuilder: FormBuilder,
    private layerStyleService: LayerStyleService,
    private layerDataService: LayerDataService,
    private filterService: FilterService,
    private overlayService: OverlayService,
    private changeDetectorRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private accountService: AccountService,
    private actionMessageService: ActionMessageService,
    private mapService: MapService,
    private modalService: ModalService,
    private el: ElementRef,
    private _ngZone: NgZone) {
      this.canShare$ = this.accountService.account.pipe(
        map(e => e.shareStyle ));

      this.disableShare$ = this.accountService.account.pipe(
        map(e => !(e.username === this.layer.owner || this.layer.source === LayerSource.CORPORATE)));
  }

  ngOnInit() {
    this.parentElement = this.el.nativeElement.parentElement;
    this.layerStyleService.updateLayerStyles$.pipe(
      takeUntil(this.destroy$),
      filter(e=>e.layerId == this.layer.id)
    ).subscribe(()=>{
      this.updateStyleList();
    })

    this.colourRamps$ = this.layerStyleService.colorRampsStore$.asObservable();
    this.accountService.account.pipe(takeUntil(this.destroy$)).subscribe((item: IAccount) => {
      this.canEditSymbology = item.editSymbology;
      this.isDevMode = item.isDevMode;
      this.canCopyToTenant = item.canCopyToTenant;
      this.hasAdvancedStyling = item.hasAdvancedStyling;
      this.hasQuickFilter = item.hasQuickFilter;
      this.changeDetectorRef.detectChanges();
    });

      this.filterService.filter.pipe(takeUntil(this.destroy$)).subscribe(onchange => {
      this.list = [];
      if (this.form) {
        this.getForm(this.styleTemp);
      } else if (this.style.type === LayerStyleType.SELECTION) {
        this.updateList();
      }
    });
    this.sidePanelEl = domHandler.find(document.body, 'go-sidepanel go-layers');
  }

  updateList() {
    this.updateLabelColumn();
    if (this.style.type === LayerStyleType.SELECTION) {
      const filter = this.filterService.filterActiveStore[this.layer.id];
      this.isLoading = true;
      this.picklistEntriesSubscription = this.layerDataService
        .getPicklistEntries(this.layer, this.style.opts.columnName, '', filter, this.style.opts.joinColumnName)
        .pipe(takeUntil(this.destroy$))
        .subscribe(selection => {
          this.isLoading = false;
          const filteredValues = selection.map(item => item.value);
          this.list = [...this.style.opts.list.filter(item => filteredValues.includes(item.value))];
          this.handleDuplicateError(this.layer, this.style.opts.columnName, '', filter, this.style.opts.joinColumnName);
          this.changeDetectorRef.markForCheck();
          this.changeDetectorRef.detectChanges();
        }, err => {
          this.isLoading = false;
          this.changeDetectorRef.detectChanges();
        });
    }
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }

  updateLabelColumn() {
    this.styleList.forEach((style: any, index: number) => {
      if (style.opts.columnName) {
        const column = this.layer.columns.find(x => x.id === style.opts.columnName);
        style.opts.label = column ? column.name : '';
      }
    });
  }

  ngAfterContentInit() {
    this.mapService.zoom.pipe(takeUntil(this.destroy$)).subscribe((zoom) => {
      this.updateStyleList();
    });

    const { maxClusteredZoom, minClusteredZoom, maxHeatmapZoom, minHeatmapZoom, minZoom, maxZoom } = this.layer;
    this.styleTypeList = this.styleTypeList.filter(style => {
      let isShow = true;

      switch (style.value) {
        case LayerStyleType.SELECTION:
          isShow = !!this.layer.columns.find(column => {
            return column.isPicklist && !(column.notFilterable || column.notSelectable);
          });
          break;
        case LayerStyleType.GRADIENT:
          isShow = !!this.layer.columns.find(column => {
            return (column.type === ILayerColumnType.NUMBER || column.type === ILayerColumnType.FLOAT) &&
              !(column.notFilterable || column.notSelectable || column.isIdentifier);
          });
          break;
        case LayerStyleType.HEATMAP:
          const heatMap_minZoom = minHeatmapZoom || minZoom;
          const heatMap_maxZoom = maxHeatmapZoom || maxZoom;
          isShow = (heatMap_minZoom || heatMap_maxZoom) && (this.layer.type === LayerType.POINT || !!this.layer.columns.find(column => column.isCentroid));
          break;
        case LayerStyleType.CLUSTER:
          if (!maxClusteredZoom && !minClusteredZoom) {
            isShow = false;
          }
          break;

      }
      return isShow;
    });
    this.updateStyleList();
    this.updateLabelColumn();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
    // this.layerStyleService.setActiveStyle(this.layer.id, null);
    if (this.picklistEntriesSubscription) {
      this.picklistEntriesSubscription.unsubscribe();
    }
  }

  canDelete(type) {
    if (type === LayerStyleType.CLUSTER) {
      return this.styleList.filter(e => e.type === LayerStyleType.CLUSTER).length > 1;
    } else {
      return this.styleList.filter(e => e.type !== LayerStyleType.CLUSTER).length > 1;
    }
  }

  updateStyleList() {
    this.styleList = this.layerStyleService.getStyleListByLayerId(this.layer.id);
    this.styleOptions = this.styleList.map((e, index) => ({ label: e.name, value: index, disabled: e.disabled }));
    const activeStyle = this.layerStyleService.getActiveStyle(this.layer.id);
    if (activeStyle == this.style) {
      const index = this.styleList.findIndex(e => e === activeStyle);
      if(this.styleIndex != index){
        this.styleIndex = index;
        this.changeDetectorRef.detectChanges();
      }else {
        this.overlayService.updateOverlayByLayerId(this.layer.id, !this.layer.zoomConfig[this.mapService.map.getZoom()]);
      }
      return;
    };
    if (!activeStyle) {
      return;
    }
    this.layerStyleService.setPreviousActiveStyle(this.layer.id, this.style);
    const index = this.styleList.findIndex(e => e === activeStyle);
    this.setActiveStyle(index);
    this.changeDetectorRef.detectChanges();
  }

  getAppliedFilter(): IFilter {
    let filter: IFilter = null;

    if (this.style.opts.isFilterApplied) {
      filter = this.filterService.filterActiveStore[this.layer.id] || null;
    }
    return filter;
  }

  getForm(style: LayerStyle) {
    // this.styleTemp = null;
    this.isLoading = true;

    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }

    style.getForm(this.layer, this.layerDataService, this.formBuilder).subscribe(
      form => {
        this.createForm(form, style);
      },
      (err) => {
        if (err.form) {
          this.createForm(err.form, style);
          this.actionMessageService.sendWarning(err.error.message);
        } else {
          this.actionMessageService.sendError(decorateError(err).error.message)
        }
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      });
  }

  createForm(form, style) {
    this._ngZone.run(()=>{
      this.styleTemp = style;
      this.form = form;
      this.isLoading = false;
      const formValue = form.getRawValue();
      this.styleTemp.setOptions(formValue);
      // TODO disabled so layer styles would not update when editing.
      // this.layerStyleService.setActiveStyle(this.layer.id, this.styleTemp);
      this.list = this.form.controls['list'] ? (this.form.controls['list'] as FormArray).controls : [];
      this.list = [...this.list.filter(item => item.controls['isVisible'].value)];
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
      this.formSubscription = this.form.valueChanges.pipe(debounceTime(500)).subscribe((data: any) => {
        this.styleTemp.setOptions(data);
        // TODO disabled so layer styles would not update when editing.
        // this.layerStyleService.setActiveStyle(this.layer.id, this.styleTemp);
      });
    })
  }

  setActiveStyle(index: number) {
    this.styleIndex = index;
    this.style = this.styleList[this.styleIndex];
    //fix detect change (not close dropdown)
    domHandler.invokeElementMethod(this.sidePanelEl, 'click');

    if (this.layer.type == LayerType.POLYLINE) {
      this.setIconPolyLine();
    }
    this.layerStyleService.setActiveStyle(this.layer.id, this.style);
    if (!this.style) return;
    if (this.style.type === LayerStyleType.GRADIENT) {
      this.columnStatistics = { min: null, max: null };
      const column = this.layer.columns.find(e=>e.id == (<LayerStyleGradient>this.style).opts.columnName);
      this.layerDataService.getGetColumnStatistics(
        this.layer.id,
        (<LayerStyleGradient>this.style).opts.columnName, this.getAppliedFilter()).pipe(takeUntil(this.destroy$))
        .pipe(map((data)=>{
          const _data = {...data};
          if(column){
            let format
            let formatPipe;
            if(column.format){
              formatPipe = column.format[0];
              format = column.format.slice(1);
            }else if (!column.isIdentifier) {
              if (column.isPercentage) {
                formatPipe = 'percent_100';
                format = ['1.1-1'];
              } else if (column.type === ILayerColumnType.NUMBER) {
                formatPipe = 'number';
                format = [];
              } else if (column.type === ILayerColumnType.FLOAT) {
                formatPipe = 'number';
                format = ['1.1-2'];
              }
            }
            if(format){
              const pipe = new DynamicPipe();
              _data.min = pipe.transform(_data.min, formatPipe, format);
              _data.max = pipe.transform(_data.max, formatPipe, format);
            }
          }
          return _data;
        }))
        .subscribe(data => {
          this.columnStatistics = data;
          this.changeDetectorRef.markForCheck();
          this.changeDetectorRef.detectChanges();
        });
    } else if (this.style.type === LayerStyleType.SELECTION) {
      this.updateList();
    }

    // Current Stores / Obsolete Stores + "Lite" versions
    this.isMorrisonLegend = [
      '00010000-1000-2000-0000-000000000001',
      '00020000-1000-2000-0000-000000000001',
      '08a18ec1-34eb-44c2-a632-558c9dc4f567',
      '21758b3f-f145-49e1-840c-b30b382d93a0'].includes(this.layer.id) &&
      this.layer.source === LayerSource.CORPORATE &&
      this.style.type === LayerStyleType.SELECTION &&
      (<LayerStyleSelection>this.style).opts.columnName === 'Status';
  }

  setFilterForm(state: boolean) {
    // this.getForm(this.styleTemp);
    this.setActiveStyle(this.styleIndex);
    console.log(state);
  }

  setFilter(state: boolean) {
    this.style.opts.isFilterApplied = state;
    // this.getForm(this.styleTemp);
    this.setActiveStyle(this.styleIndex);
    console.log(state);
  }
  setIsLabeling(state: boolean) {
    this.style.opts.isLabeling = state;
    // this.getForm(this.styleTemp);
    this.setActiveStyle(this.styleIndex);
    console.log(state);
  }

  addColor() {
    const control = <FormArray>this.form.controls['gradient'];
    const value = control.at(control.length - 1).value;

    control.push(
      this.formBuilder.control(value, Validators.required)
    );
  }

  removeColor(index: number) {
    (<FormArray>this.form.controls['gradient']).removeAt(index);
  }

  onTypeChange(type: any) {
    this.deleteForm();
    // let style = ;
    this.isCreate = true;
    // this.style = this.styleTemp;
    this.getForm(LayerStyle.factory(parseInt(type, 10), ''));
    this.changeDetectorRef.detectChanges();
    // this.styleTemp = style;
  }

  onFilterChange(isSelected: boolean) {
    this.styleTemp.setOption('isFilterApplied', isSelected);
    this.getForm(this.styleTemp);
  }

  onSelectChange(columnName: string) {
    this.styleTemp.setOption('columnName', columnName);
    this.getForm(this.styleTemp);
  }

  onSelectChangeHex(columnName: string) {
    this.styleTemp.setOption('joinColumnName', columnName);
    this.getForm(this.styleTemp);
  }

  onSelectParentChange(parentColumnValue: string) {
    this.styleTemp.setOption('parentColumnValue', parentColumnValue);
    this.getForm(this.styleTemp);
    this.changeDetectorRef.detectChanges();
  }

  onCreateForm() {
    this.onTypeChange(LayerStyleType.BASIC);
    this.changeDetectorRef.detectChanges();
  }

  onUpdateForm() {
    this.isCreate = false;
    // this.styleTemp = ;
    this.getForm(this.style.clone());
    this.changeDetectorRef.detectChanges();
  }

  onShareStyle() {
    const ref = this.modalService.openModal(FeatureShareFormComponent, {
      titleDialog: 'Share Layer Style',
      titleText: `Layer style name: ${this.style.name}`,
      data: {
        type: EFeatureShare.LAYER_STYLE,
        data: this.style,
        name: this.style.name,
        key: this.layer.id,
        recipientType: this.layer.source === LayerSource.CORPORATE ? ERecipientType.ALL : ERecipientType.USER_LAYERS
      }
    } as ShareFeatureDialogModel)
  }

  onCancel() {
    // this.style = this.layerStyleService.getActiveStyle(this.layer.id);
    this.layerStyleService.setActiveStyle(this.layer.id, this.style);
    this.isCreate = null;
    this.deleteForm();
    this.isCreate = null;
    this.changeDetectorRef.detectChanges();
  }

  onDelete() {
    this.layerStyleService.deleteStyle(this.layer.id, this.styleList[this.styleIndex], null)
    this.updateStyleList();
    this.deleteForm();
    this.isCreate = null;
    this.changeDetectorRef.detectChanges();
  }

  private updateStyle(currentStyle) {
    if (currentStyle && Array.isArray(currentStyle.opts.listFiltered)) {
      const newValues: Map<string, object> = new Map();
      currentStyle.opts.listFiltered.forEach(item => {
        newValues.set(item.value, item);
      });

      currentStyle.opts.list = currentStyle.opts.list.map(item => {
        if (newValues.has(item.value)) {
          item = newValues.get(item.value);
        }
        return item;
      });
    }
    return currentStyle;
  }

  onUpdate() {
    this.styleTemp.setOptions(this.form.getRawValue());
    const style = this.updateStyle(this.styleTemp);
    this.layerStyleService.updateStyle(this.layer.id, this.styleList[this.styleIndex], style, style)
    this.updateStyleList();
    this.deleteForm();
    this.isCreate = null;
    this.changeDetectorRef.detectChanges();
  }

  onCreate() {
    this.styleTemp.setOptions(this.form.getRawValue());
    const _createStyle = this.updateStyle(this.styleTemp);
    this.layerStyleService.addStyle(this.layer.id, _createStyle, _createStyle);
    this.updateStyleList();
    this.deleteForm();
    this.isCreate = null;
    this.actionMessageService.sendSuccess("Style created successfully. The new style will be available within its scale ranges.");
    this.changeDetectorRef.detectChanges();
  }

  copyToTenant() {
    this.layerStyleService.copyToTenant(this.layer.id, this.styleTemp);
  }

  private deleteForm() {
    this.form = null;
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    this.updateList();
  }

  setIconPolyLine() {
    this.style.setOption('icon', this.style.opts['lineStyle'] == LineStyle.DASHED ? ICONS_LINE.LINE_DASHED : ICONS_LINE.LINE_SOLID)
  }
  onUpdateIcon($event, item: FormGroup) {
    item.patchValue($event);
  }
  handleDuplicateError(layer, columnName, filterValue, filter, joinColumnName) {
    const originalData = this.layerDataService.getOrginalPicklistEntries(layer, columnName, filterValue, filter, joinColumnName);
    const { hasDuplicates, message } = originalData;
    if (hasDuplicates) {
      this.actionMessageService.sendWarning(message);
    }
  }
  onToggleColourRamp() {
    this.showColourRamp = !this.showColourRamp;
    this.changeDetectorRef.detectChanges();
  }
  onSelectColourRamp(colourRamp: ILayerColourRamp) {
    if (this.form.controls['gradient']) {
      if (!this.oldGradient) {
        this.oldGradient = (<FormArray>this.form.controls['gradient']).getRawValue();
      }
      (<FormArray>this.form.controls['gradient']) = new FormArray(
        colourRamp.colours.map((value) => {
          return this.formBuilder.control(value, Validators.required);
        }))
      this.form.updateValueAndValidity();
      this.onToggleColourRamp();
    }
  }
  onRestore() {
    (<FormArray>this.form.controls['gradient']) = new FormArray(
      this.oldGradient.map((value) => {
        return this.formBuilder.control(value, Validators.required);
      }))
    this.oldGradient = null;
    this.form.updateValueAndValidity();
    this.changeDetectorRef.detectChanges();
  }
  onReverse() {
    if (this.form.controls['gradient']) {
      const colours: string[] = (<FormArray>this.form.controls['gradient']).getRawValue();;
      this.form.controls['gradient'].patchValue(colours.reverse());
      this.form.updateValueAndValidity();
    }
  }
  onToggle(value, item, i) {
    if (!this.hasQuickFilter) return;
    this._ngZone.run(()=>{
      delete item._index;
      this.list[i] = {
        ...item,
        hidden: value
      }
      this.list = [...this.list];
      const { list } = this.style.opts;
      const index = list.findIndex(e => e.value === item.value);
      if (index != -1) {
        this.style.opts.list[index] = this.list[i];
        this.layerStyleService.setActiveStyle(this.layer.id, this.style);
      }
    })
  }
  getVirtualScrollerList(list: any[]) {
    return list.map((e, i) => ({ ...e, _index: i }))
  }
}
