import { of as observableOf, Observable, Observer } from 'rxjs';
import { FormGroup, Validators, FormArray, FormBuilder } from '@angular/forms';
import { interpolateRgb } from 'd3-interpolate';
import { FilterService } from './filter.service';

import { OverlayShapeOptions, ILayer, IFilter } from './interfaces';
import { LayerDataService } from './layer-data.service';
import { COLORS, DEFAULT_ICON_SIZE, DEFAULT_OPACITY, randomColor, randomNewgroveColor, toHex } from './global';
import { ICONS, ICONS_LINE } from './models/overlayShapeIcon'
import { ILayerColumnType, LayerType } from './enums';
import { LayerStyleType, ILayerStyleOptsBasic, ILayerStyleOptsSelection, ValueFunctionType, ILayerStyleOptsGradient, ILayerStyleOptsHeatmap, LineStyle, ILayerStyleOptsCluster, ClusterType } from './models/layer-style.model';
import { map, first } from 'rxjs/operators';
export abstract class LayerStyle {
    static layerDataService: LayerDataService;
    static filterService: FilterService;
    isDefault = false;
    name = '';
    opts: { [prop: string]: any } = {};
    disabled: boolean = false;
    static factory(type: LayerStyleType, name: string, isDefault = false, opts: any = null): LayerStyle {
        let object: LayerStyle;
        switch (type) {
          case LayerStyleType.BASIC:
            object = new LayerStyleBasic(name, isDefault, opts);
            break;
          case LayerStyleType.SELECTION:
            object = new LayerStyleSelection(name, isDefault, opts);
            break;
          case LayerStyleType.GRADIENT:
            object = new LayerStyleGradient(name, isDefault, opts);
            break;
          case LayerStyleType.HEATMAP:
            object = new LayerStyleHeatmap(name, isDefault, opts);
            break;
          case LayerStyleType.CLUSTER:
            object = new LayerStyleCluster(name, isDefault, opts);
            break;
          default:
            console.warn('Missing LayerStyleType', type);
        }
        return object;
    }
  static getDefaultOpts(type: LayerStyleType): any {
    switch (type) {
      case LayerStyleType.BASIC:
        return new LayerStyleBasic(name).getDefaultOptions();
      case LayerStyleType.SELECTION:
        return new LayerStyleSelection(name).getDefaultOptions();
      case LayerStyleType.GRADIENT:
        return new LayerStyleGradient(name).getDefaultOptions();
      case LayerStyleType.HEATMAP:
        return new LayerStyleHeatmap(name).getDefaultOptions();
      case LayerStyleType.CLUSTER:
        return new LayerStyleCluster(name).getDefaultOptions();
      default:
        console.warn('Missing LayerStyleType', type);
    }
    return new LayerStyleBasic(name).getDefaultOptions();
  }

    constructor(public type: LayerStyleType) {
    }

    abstract getShapeOptions(data: { [s: string]: any }, layerId: string): Observable<OverlayShapeOptions>;

    abstract getDefaultOptions(): Object;

    abstract getForm(layer: ILayer, layerDataService: LayerDataService, formBuilder: FormBuilder): Observable<FormGroup>;

    setOption(property: string, value: number | string | boolean) {
        this.opts[property] = value;
    }

    setOptions(opts: Object) {
        this.name = (<any>opts).name;
        this.opts = opts;
        (<any>this.opts).transparency = parseFloat((<any>opts).transparency);
    }

    clone(): LayerStyle {
        return LayerStyle.factory(this.type, this.name, this.isDefault, JSON.parse(JSON.stringify(this.opts)));
    }
}

export class LayerStyleBasic extends LayerStyle {

    constructor(public name: string, public isDefault = false, public opts: ILayerStyleOptsBasic = null) {
        super(LayerStyleType.BASIC);
        this.opts = opts || this.getDefaultOptions();
    }

    getShapeOptions(data: { [s: string]: any }, layerId: string): Observable<OverlayShapeOptions> {
        return observableOf({
            isVisible: true,
            fillColor: this.opts.fillColor,
            strokeColor: this.opts.strokeColor,
            transparency: this.opts.transparency,
            strokeTransparency: this.opts.strokeTransparency,
            strokeWeight: this.opts.strokeTransparency === 0 ? 0 : this.opts.strokeWeight ? this.opts.strokeWeight : 2,
            icon: this.opts.icon,
            iconSize: this.opts.iconSize || DEFAULT_ICON_SIZE,
            zIndex: this.opts.zIndex ? this.opts.zIndex : 0,
            lineStyle: this.opts.lineStyle,
            styleType: LayerStyleType.BASIC,
            isDisplayStrokePoint: this.opts.isDisplayStrokePoint
        });
    }

    getDefaultOptions(): ILayerStyleOptsBasic {
        return {
            isDefault: false,
            icon: ICONS.CIRCLE,
            iconSize: DEFAULT_ICON_SIZE,
            fillColor: randomNewgroveColor(),//COLORS.MAP_CREATION,
            strokeColor: COLORS.MAP_CREATION_STROKE,
            strokeWeight: 2,
            transparency: DEFAULT_OPACITY,
            strokeTransparency: 1,
            zIndex: 0,
            label: 'Legend style',
            lineStyle: LineStyle.SOLID
        };
    }

    getForm(layer: ILayer, layerDataService: LayerDataService, formBuilder: FormBuilder): Observable<FormGroup> {
        if (layer.type == LayerType.POLYLINE) {
            this.opts.icon = this.opts.lineStyle == LineStyle.DASHED ? ICONS_LINE.LINE_DASHED : ICONS_LINE.LINE_SOLID;
        }
        return observableOf(formBuilder.group({
            type: [this.type, [Validators.required]],
            isDefault: [this.opts.isDefault],
            name: [this.name, Validators.required],
            transparency: [this.opts.transparency, Validators.required],
            strokeTransparency: [this.opts.strokeTransparency, Validators.required],
            fillColor: [this.opts.fillColor, Validators.required],
            strokeColor: [this.opts.strokeColor, Validators.required],
            icon: [this.opts.icon, Validators.required],
            iconSize: [this.opts.iconSize, Validators.required],
            zIndex: this.opts.zIndex || 0,
            label: this.opts.label || 'Legend style',
            strokeWeight: [this.opts.strokeWeight, Validators.required],
            lineStyle: [this.opts.lineStyle ? this.opts.lineStyle : LineStyle.SOLID, Validators.required]
        }));
    }
}

export class LayerStyleSelection extends LayerStyle {

    constructor(public name: string, public isDefault = false, public opts: ILayerStyleOptsSelection = null) {
        super(LayerStyleType.SELECTION);
        this.opts = opts ? {
            ...opts,
            strokeWeight: opts.strokeWeight ? opts.strokeWeight : 2 // for old LayerStyleSelection opt
        } : this.getDefaultOptions();

    }

    getShapeOptions(data: { [s: string]: any }, layerId: string): Observable<OverlayShapeOptions> {
        const options: OverlayShapeOptions = (this.opts.joinColumnName ? this.opts.list.find(x => x.value === 'join_' + data[this.opts.columnName] + data[this.opts.joinColumnName])
            : this.opts.list.find(x => x.value === data[this.opts.columnName]))
            || {};
        options.iconSize = this.opts.iconSize || DEFAULT_ICON_SIZE;
        options.isVisible = options['hidden'] ? false : true;
        options.transparency = this.opts.transparency;
        options.strokeTransparency = this.opts.strokeTransparency;
        options.strokeWeight = options.strokeTransparency === 0 ? 0 : options.strokeWeight != undefined && options.strokeWeight != null ? options.strokeWeight : 2;
        options.lineStyle = this.opts.lineStyle;
        options.styleType = LayerStyleType.SELECTION;
        return observableOf({ ...options,  isDisplayStrokePoint: this.opts.isDisplayStrokePoint });
    }

    getDefaultOptions(): ILayerStyleOptsSelection {
        return {
            isDefault: false,
            columnName: null,
            joinColumnName: null,
            isFilterApplied: true,
            parentColumnValue: null,
            parentList: [],
            iconSize: DEFAULT_ICON_SIZE,
            strokeWeight: 2,
            transparency: DEFAULT_OPACITY,
            strokeTransparency: 1,
            list: [],
            lineStyle: LineStyle.SOLID
        };
    }

    getForm(layer: ILayer, layerDataService: LayerDataService, formBuilder: FormBuilder): Observable<FormGroup> {
        return Observable.create((formSource: Observer<FormGroup>) => {

            let column = layer.columns.find(_ => _.id === this.opts.columnName);
            const joinColumn = layer.columns.find(_ => _.id === this.opts.joinColumnName);
            if (!joinColumn) {
                this.opts.joinColumnName = null;
            }
            if (!column) {
                column = layer.columns.find(_ => _.isPicklist);
            }

            let filter: IFilter = null;
            if (this.opts.isFilterApplied) {
                filter = LayerStyle.filterService.filterActiveStore[layer.id] || null;
            }
            this.opts.columnName = column.id;

            layerDataService.getPicklistEntries(layer, this.opts.columnName, undefined, undefined, this.opts.joinColumnName).subscribe(fullList => {
                if (column.isChildPickList) {
                    const parentColumn = layer.columns.find(_ => _.ChildPickListColumnName === this.opts.columnName);

                    layerDataService.getPicklistEntries(layer, parentColumn.id, '', filter).subscribe(parentValues => {

                        this.opts.parentList = parentValues;

                        layerDataService.getPicklistEntries(layer, this.opts.columnName, this.opts.parentColumnValue, filter, this.opts.joinColumnName)
                            .subscribe(selection => {
                                const originalData = layerDataService.getOrginalPicklistEntries(layer, this.opts.columnName, this.opts.parentColumnValue, filter, this.opts.joinColumnName);
                                const { hasDuplicates, message } = originalData;
                                if (hasDuplicates) {
                                    formSource.error(
                                        {
                                            form: this.formCreation(fullList, selection, formBuilder),
                                            error: { hasDuplicates, message }
                                        }
                                    )
                                } else {
                                    formSource.next(this.formCreation(fullList, selection, formBuilder));
                                    formSource.complete();
                                }
                            }, err => {
                                formSource.error(err)
                            });
                    }, err => {
                        formSource.error(err)
                    });

                } else {
                    layerDataService.getPicklistEntries(layer, this.opts.columnName, '', filter, this.opts.joinColumnName).subscribe(selection => {
                        const originalData = layerDataService.getOrginalPicklistEntries(layer, this.opts.columnName, '', filter, this.opts.joinColumnName);
                        const { hasDuplicates, message } = originalData;
                        if (hasDuplicates) {
                            formSource.error(
                                {
                                    form: this.formCreation(fullList, selection, formBuilder),
                                    error: { hasDuplicates, message }
                                }
                            )
                        } else {
                            formSource.next(this.formCreation(fullList, selection, formBuilder));
                            formSource.complete();
                        }
                    }, err => {
                        formSource.error(err)
                    });
                }
            }, err => {
                formSource.error(err)
            });
        })
    }

    private formCreation(values, filtered, formBuilder): FormGroup {

        const filteredValues = filtered.map(item => item.value);

        const list = values.map(item => {
            let itemStyle = this.opts.list.find(_ => _.value === item.value);

            if (!itemStyle) {
                itemStyle = {
                    name: item.description,
                    value: item.value,
                    fillColor: randomColor(),
                    strokeColor: COLORS.MAP_CREATION_STROKE,
                    icon: ICONS.CIRCLE,
                    zIndex: 0
                };
                if (this.opts.joinColumnName) {
                    const hexValue = toHex(item.joinColumnValue) || '#000000';
                    if (hexValue) {
                        itemStyle = {
                            name: item.description,
                            value: item.value,
                            fillColor: hexValue,
                            strokeColor: COLORS.MAP_CREATION_STROKE,
                            icon: ICONS.CIRCLE,
                            zIndex: 0
                        };
                    }
                }
            }

            return formBuilder.group({
                name: [itemStyle.name], // item.description
                value: [itemStyle.value],
                fillColor: [itemStyle.fillColor, Validators.required],
                strokeColor: [itemStyle.strokeColor, Validators.required],
                icon: [itemStyle.icon, Validators.required],
                isVisible: [filteredValues.includes(item.value), Validators.required],
                zIndex: [itemStyle.zIndex || 0],
                strokeWeight: [this.opts.strokeWeight],
                lineStyle: [this.opts.lineStyle ? this.opts.lineStyle : LineStyle.SOLID, Validators.required]
            });
        });
        // const listFiltered = list.filter(item => item.controls['isVisible'].value);
        return formBuilder.group({
            type: [this.type, Validators.required],
            isDefault: [this.opts.isDefault],
            name: [this.name, Validators.required],
            isFilterApplied: [this.opts.isFilterApplied],
            iconSize: [this.opts.iconSize, Validators.required],
            transparency: [this.opts.transparency, Validators.required],
            strokeTransparency: [this.opts.strokeTransparency, Validators.required],
            columnName: [this.opts.columnName, Validators.required],
            joinColumnName: [this.opts.joinColumnName],
            parentColumnValue: [this.opts.parentColumnValue],
            parentList: [this.opts.parentList],
            list: new FormArray(list),
            strokeWeight: [this.opts.strokeWeight]
            // listFiltered: new FormArray(listFiltered)
        });
    }
}

export class LayerStyleGradient extends LayerStyle {

    private static colorFnCache: Map<string, (t: number) => string> = new Map();

    constructor(public name: string, public isDefault = false, public opts: ILayerStyleOptsGradient = null) {
        super(LayerStyleType.GRADIENT);
        const defaultOpts = this.getDefaultOptions();
        this.opts = opts || defaultOpts;
        this.opts.valueFunction = this.opts.valueFunction === undefined ? ValueFunctionType.LINEAR : Number(this.opts.valueFunction);
        this.opts.gradient = this.opts.gradient || defaultOpts.gradient;
    }

    private colorFn(t: number): string {
        const parts = this.opts.gradient.length - 1;
        const partLength = 1 / parts;
        const rangeStart = Math.floor(t / partLength);
        const t1 = (t - (partLength * rangeStart)) * parts;

        const key = `${this.opts.gradient[rangeStart]}_${this.opts.gradient[rangeStart + 1]}`;
        if (!LayerStyleGradient.colorFnCache.has(key)) {
            LayerStyleGradient.colorFnCache.set(
                key,
                interpolateRgb(this.opts.gradient[rangeStart], this.opts.gradient[rangeStart + 1]));
        }

        return LayerStyleGradient.colorFnCache.get(key)(t1);
    }

    getShapeOptions(data: { [s: string]: any }, layerId: string): Observable<OverlayShapeOptions> {
        let filter: IFilter = null;
        if (this.opts.isFilterApplied) {
            filter = LayerStyle.filterService.filterActiveStore[layerId] || null;
        }
        return LayerStyle.layerDataService.getGetColumnStatistics(layerId, this.opts.columnName, filter).pipe(first(), map(bound => {
            let value = !(data[this.opts.columnName] == null || data[this.opts.columnName] == undefined) ? (data[this.opts.columnName] - bound.min) / (bound.max - bound.min) : null;
            if (value != null) {
                switch (this.opts.valueFunction) {
                    case ValueFunctionType.LOGARITHM:
                        value = Math.log10(value * 9 + 1);
                        break;
                    case ValueFunctionType.NATURAL_LOGARITHM:
                        value = Math.log(value * (Math.E - 1) + 1);
                        break;
                    case ValueFunctionType.EXPONENTIAL:
                        value = Math.pow(value, 2);
                        break;
                }
            }
            const fillColor = value != null ? this.colorFn(value) : null;
            const transparency = value != null ? this.opts.transparency : 0;
            const strokeColor = value != null ? this.opts.strokeColor : null;
            const strokeTransparency = this.opts.strokeTransparency;
            return {
                isVisible: true,
                icon: this.opts.icon,
                iconSize: this.opts.iconSize || DEFAULT_ICON_SIZE,
                fillColor: fillColor,
                strokeColor: strokeColor,
                strokeWeight: strokeTransparency === 0 ? 0 : this.opts.strokeWeight ? this.opts.strokeWeight : 2,
                strokeTransparency: strokeTransparency,
                transparency: transparency,
                styleType: LayerStyleType.GRADIENT,
                lineStyle: this.opts.lineStyle,
                isDisplayStrokePoint: this.opts.isDisplayStrokePoint
            }
        }))
    }

    getDefaultOptions(): ILayerStyleOptsGradient {
        return {
            isDefault: false,
            columnName: null,
            isFilterApplied: false,
            valueFunction: ValueFunctionType.LINEAR,
            iconSize: DEFAULT_ICON_SIZE,
            icon:
                ICONS.CIRCLE,
            strokeColor: COLORS.MAP_CREATION_STROKE,
            strokeWeight: 2,
            strokeTransparency: 1,
            transparency: DEFAULT_OPACITY,
            gradient: [
                COLORS.GRADIENT_START,
                COLORS.GRADIENT_STOP
            ],
            lineStyle: LineStyle.SOLID
        };
    }

    getForm(layer: ILayer, layerDataService: LayerDataService, formBuilder: FormBuilder): Observable<FormGroup> {

        let columnName = layer.columns.find(column => column.id === this.opts.columnName);

        if (!columnName) {
            columnName = layer.columns.find(column =>
                (column.type === ILayerColumnType.NUMBER || column.type === ILayerColumnType.FLOAT)
                && !(column.notFilterable || column.notSelectable));
        }

        this.opts.columnName = columnName.id || null;

        return observableOf(formBuilder.group({
            type: [this.type, Validators.required],
            isDefault: [this.opts.isDefault],
            name: [this.name, Validators.required],
            isFilterApplied: [this.opts.isFilterApplied],
            valueFunction: [this.opts.valueFunction],
            transparency: [this.opts.transparency, Validators.required],
            strokeTransparency: [this.opts.strokeTransparency, Validators.required],
            icon: [this.opts.icon, Validators.required],
            iconSize: [this.opts.iconSize, Validators.required],
            strokeColor: [this.opts.strokeColor, Validators.required],
            columnName: [this.opts.columnName, Validators.required],
            gradient: new FormArray(
                this.opts.gradient.map((value) => {
                    return formBuilder.control(value, Validators.required);
                })
            ),
            strokeWeight: [this.opts.strokeWeight, Validators.required],
            lineStyle: [this.opts.lineStyle, Validators.required]
        }));
    }
}

export class LayerStyleHeatmap extends LayerStyle {

    constructor(public name: string, public isDefault = false, public opts: ILayerStyleOptsHeatmap = null) {
        super(LayerStyleType.HEATMAP);
        this.opts = opts || this.getDefaultOptions();
    }

    getShapeOptions(data: { [s: string]: any }, layerId: string): Observable<OverlayShapeOptions> {
        return observableOf({
            isVisible: false,
            styleType: LayerStyleType.HEATMAP,
        });
    }

    getDefaultOptions(): ILayerStyleOptsHeatmap {
        return {
            isDefault: false,
            columnName: null,
            transparency: 0.7,
            gradient: [
                '#0000ff',
                '#00ffff',
                '#00ff00',
                '#ffff00',
                '#ff0000'
            ]
        };
    }

    getForm(layer: ILayer, layerDataService: LayerDataService, formBuilder: FormBuilder): Observable<FormGroup> {
        /*		let columnName = layer.columns.find(column => column.id === this.opts.columnName);

         if (!columnName) {
         columnName = layer.columns.find(column => column.type === ILayerColumnType.NUMBER);
         }

         this.opts.columnName = columnName.id || '';*/

        return observableOf(formBuilder.group({
            type: [this.type, Validators.required],
            isDefault: [this.opts.isDefault],
            name: [this.name, Validators.required],
            transparency: [this.opts.transparency, Validators.required],
            columnName: [this.opts.columnName],
            gradient: new FormArray(
                this.opts.gradient.map((value) => {
                    return formBuilder.control(value, Validators.required);
                })
            )
        }));
    }
}

export class LayerStyleCluster extends LayerStyle {

  constructor(public name: string, public isDefault = false, public opts: ILayerStyleOptsCluster = null) {
      super(LayerStyleType.CLUSTER);
      const _opts = {};
      const defaultOpts = this.getDefaultOptions();
      Object.keys(opts || {}).forEach(key=>{
        if(opts[key] != undefined && opts[key] != null){
          _opts[key] = opts[key];
        }
      })
      this.opts = {...defaultOpts, ..._opts};

  }

  getShapeOptions(data: { [s: string]: any }, layerId: string): Observable<OverlayShapeOptions> {
      return observableOf({
          isVisible: false,
          styleType: LayerStyleType.CLUSTER,
      });
  }

  getDefaultOptions(): ILayerStyleOptsCluster {
      return {
          isDefault: false,
          columnName: null,
          transparency: DEFAULT_OPACITY,
          strokeTransparency: 1,
          strokeColor: COLORS.MAP_CREATION_STROKE,
          gradient: [
            '#f29191',
            '#f70000'
          ],
          mapType: ClusterType.POINTS,
          isLabeling: false
      };
  }

  getForm(layer: ILayer, layerDataService: LayerDataService, formBuilder: FormBuilder): Observable<FormGroup> {
      return observableOf(formBuilder.group({
          type: [this.type, Validators.required],
          isDefault: [this.opts.isDefault],
          name: [this.name, Validators.required],
          columnName: [this.opts.columnName],
          gradient: new FormArray(
              this.opts.gradient.map((value) => {
                  return formBuilder.control(value, Validators.required);
              })
          ),
          mapType: [this.opts.mapType, Validators.required],
          transparency: [this.opts.transparency, Validators.required],
          strokeTransparency: [this.opts.strokeTransparency, Validators.required],
          strokeColor: [this.opts.strokeColor, Validators.required],
          isLabeling: [this.opts.isLabeling]
      }));
  }
}
