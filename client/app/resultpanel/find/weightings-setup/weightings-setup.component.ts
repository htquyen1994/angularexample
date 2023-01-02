import { Component, OnInit, ChangeDetectionStrategy, ViewEncapsulation, Input, Output, EventEmitter } from '@angular/core';
import { ILayerGroup, ILayer } from 'src/client/app/shared/interfaces';
import { FormArray, FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { FindLayer, WeightingLayerControl, WeightingColumnControl } from '../find.model';
import { Observable, combineLatest, Subject } from 'rxjs';
import { takeUntil, map, debounceTime } from 'rxjs/operators';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Component({
  selector: 'ps-weightings-setup',
  templateUrl: './weightings-setup.component.html',
  styleUrls: ['./weightings-setup.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WeightingsSetupComponent implements OnInit {
  @Input() data$ : Observable<{layers: ILayer[], layerGroups: ILayerGroup[]}>;
  layerGroups$ : Observable<ILayerGroup[]>;
  layerGroups: ILayerGroup[];
  layers: ILayer[];
  layerGroupOptions: PsSelectOption[] = [];
  columnGroupOptions: { [key: string]: PsSelectOption[] } = {};
  form: FormGroup;
  @Output() statusChange: EventEmitter<{ data: any, isValid: boolean }> = new EventEmitter();
  get layersControl() {
    return this.form.get('layers') as FormArray
  }
  private unsubscribe$: Subject<void> = new Subject<void>();
  columnOptions(layerId: string) {
    return this.layers.find(e => e.id == layerId).columns.map(e => ({ id: e.id, name: e.name, list: e['list'], columnAlias: e['columnAlias'], matchCommonGeoColumnId: e['matchCommonGeoColumnId'] }))
  }

  columnGroups(layerId: string) {
    return this.layers.find(e => e.id == layerId).columnGroups.map(e => ({ ...e }))
  }

  formatLabel(value: number) {
    return `${value * 100}%`;
  }

  constructor(
    private fb: FormBuilder,
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.data$.pipe(takeUntil(this.unsubscribe$)).subscribe((data)=>{
      const {layers, layerGroups} = data;
      if(layers && layerGroups){
        this.layers = [...layers];
        this.layerGroups = [...layerGroups];
        this.form.get('selectedLayerId').setValue(this.getPossibleLayer(layerGroups))
        this.layerGroupOptions = layerGroups.map((group, i) => ({
          label: group.name,
          value: group['groupId'],
          items: group.layers.map(layer => ({
            label: layer.name,
            value: layer.id
          }))
        }))
        this.layers.forEach(layer => {
          this.columnGroupOptions[layer.id] = layer.columnGroups.map(e => ({
            label: e.Name,
            value: e.Index,
            items: e.children.map(child => {
              if (child['list']) {
                return child['list'].map(item => ({ label: `${child.name} - ${item.key}`, value: item.matchCommonGeoColumnId }))
              }
              return [{ label: child.name, value: child.id, }]
            }).reduce((a, b) => [...a, ...b])
          }))
        })
      }
    })
    this.layerGroups$ = this.data$.pipe(map(e=>e.layerGroups));
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  getRawValue(): FindLayer[] {
    const { layers } = this.form.getRawValue();
    return (<any>layers).map(e => {
      const { id, name, columns } = e;
      const _columns = this.columnOptions(id);
      const _columns_list = _columns.filter(_col => !!_col.list);
      const { source, owner } = this.layers.find(e => e.id == id);
      return {
        dataPackageId: id,
        dataViewName: 'Default',
        source,
        owner,
        matchItColumns: columns.map(_col => {
          const { id, weight, findMost } = _col;
          if (!weight) return null;
          //sum column
          const column = _columns.find(e => e.id == id);
          if (column) {
            return {
              columnId: column.id,
              columnAlias: column.columnAlias,
              matchCommonGeoColumnId: column.matchCommonGeoColumnId,
              weight,
              findMost
            }
          }
          //count column
          const column_list = _columns_list.map(e => e.list.map(_e => ({ ..._e, columnId: e.id }))).reduce((a, b) => [...a, ...b]).find(e => e.matchCommonGeoColumnId == id);
          if (column_list) {
            return {
              columnId: column_list.columnId,
              columnAlias: column_list.columnAlias,
              matchCommonGeoColumnId: column_list.matchCommonGeoColumnId,
              weight,
              key: column_list.key,
              findMost
            }
          }
          return null
        }).filter(e => e)
      } as FindLayer
    })
  }

  initForm() {
    if (!this.form) {
      this.form = this.fb.group({
        selectedLayerId: this.fb.control(null),
        layers: this.fb.array([], Validators.required)
      })
      // this.form.statusChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
      //   if ((<FormArray>this.form.get('layers')).length) {
      //     this.statusChange.emit({ data: this.form.get('layers').value, isValid: value == 'VALID' })
      //   } else {
      //     this.statusChange.emit({ data: this.form.get('layers').value, isValid: false })
      //   }
      // })
      this.form.valueChanges.pipe(debounceTime(100), takeUntil(this.unsubscribe$)).subscribe((value) => {
        const { layers } = value;
        layers.forEach(layer => {
          this.updateDisableColumGroupOptions(layer.id, layer.columns.map(e => e.id))
        });
        this.statusChange.emit({ data: layers, isValid: this.form.valid })
      })
    }
  }

  addLayerControl(layerId: string) {
    const layerControl = this.getLayerControl();
    const layer = this.layers.find(e => e.id == layerId);
    const { id, name } = layer;
    const columnId = this.getPossibleColumn(layerId);
    const initData: WeightingLayerControl = {
      id,
      name,
      columns: [{
        id: columnId,
        weight: 1,
        findMost: true
      }]
    }
    layerControl.patchValue(initData);
    this.layersControl.push(layerControl);
    this.updateDisableLayerGroupOptions(layer.groupId, layerId, true);
    this.form.get('selectedLayerId').setValue(this.getPossibleLayer(this.layerGroups));
  }

  getLayerControl(){
    return new FormGroup({
      id: new FormControl(''),
      name: new FormControl(''),
      columns: new FormArray([this.getColumnControl()])
    })
  }

  getColumnControl(){
    return new FormGroup({
      id: new FormControl('', Validators.required),
      weight: new FormControl(1, Validators.required),
      findMost: new FormControl(false, Validators.required)
    })
  }

  containsLayer([layerId, layers]) {
    return !!(<any[]>layers).find(element => element.id == layerId);
  }
  containsColumn([columnId, columns]) {
    return !!(<any[]>columns).find(element => element.id == columnId);
  }
  checkAddColumnAvailable([columns, id]) {
    return columns.length > 4 || this.columnOptions(id).map(e => e.list ? e.list.length : 1).reduce((a, b) => a + b) == columns.length
  }
  checkAddLayerAvailable([layers]) {
    return layers.length > 4;
  }
  onRemoveLayer(index: number) {
    const controlValue = this.layersControl.at(index).value;
    if (controlValue) {
      const layer = this.layers.find(e => e.id == controlValue.id);
      this.updateDisableLayerGroupOptions(layer.groupId, layer.id, false);
      this.layersControl.removeAt(index);
    }
  }
  onAddColumn(index: number, layerId: string) {
    const columnsControl = (<FormArray>this.layersControl.at(index).get('columns'));
    const id = this.getPossibleColumn(layerId, columnsControl.value);
    const columnControl = this.getColumnControl();
    const initData: WeightingColumnControl = {
      id,
      weight: 1,
      findMost: true
    }
    columnControl.patchValue(initData);
    columnsControl.push(columnControl);
  }
  onRemoveColumn(layerIndex: number, columnIndex: number) {
    const layer = (<FormArray>this.layersControl.at(layerIndex));
    if(layer) {
      const column = (<FormArray>layer.get('columns')).at(columnIndex);
      if(column){
        (<FormArray>this.layersControl.at(layerIndex).get('columns')).removeAt(columnIndex);
        if ((<FormArray>this.layersControl.at(layerIndex).get('columns')).length == 0) {
          this.onRemoveLayer(layerIndex);
        }
      }
    }
  }
  onLayerSlideToggleChange(event, index: number) {
    if (event.checked) {
      (<FormArray>this.layersControl.at(index).get('columns')).controls.forEach(column => {
        column.get('weight').setValue(1)
      });
    } else {
      (<FormArray>this.layersControl.at(index).get('columns')).controls.forEach(column => {
        column.get('weight').setValue(0)
      });
    }
  }

  getPossibleColumn(layerId: string, selectedColumns: any[] = []): string {
    const columnGroups = this.columnGroups(layerId);
    let id: string = null;
    if (columnGroups.length == 1) {
      if (columnGroups[0].children.length == 1) {
        const columnOption = columnGroups[0].children[0];
        if (columnOption['list'] && columnOption['list'].length == 1) {
          const _id = columnOption['list'][0].matchCommonGeoColumnId;
          if (!this.containsColumn([_id, selectedColumns])) {
            id = _id;
          }
        } else if(!columnOption['list']) {
          const _id = columnOption.id;
          if (!this.containsColumn([_id, selectedColumns])) {
            id = _id;
          }
        }
      }
    }
    return id;
  }
  getPossibleLayer(layerGroup: ILayerGroup[]): string {
    let id: string = null;
    loop1:
    for (let i = 0; i < layerGroup.length; i++) {
      const group = layerGroup[i];
      for (let j = 0; j < group.layers.length; j++) {
        const layer = group.layers[j];
        const _id = layer.id;
        if (!this.containsLayer([_id, this.layersControl.value])) {
          id = _id;
          break loop1;
        }
      }
    }
    return id;
  }
  updateDisableLayerGroupOptions(groupId, layerId, disabled){
    const group = this.layerGroupOptions.find(e=>e.value == groupId);
    if(group){
      const layer = group.items.find(e=>e.value == layerId);
      if(layer) {
        layer.disabled = disabled;
      }
    }
  }
  updateDisableColumGroupOptions(layerId, columnIds:string[]) {
    const optionGroups = this.columnGroupOptions[layerId];
    if (optionGroups) {
      optionGroups.forEach(group=>{
        group.items.forEach(item=>{
          if(columnIds.includes(item.value)){
            item.disabled = true;
          }else {
            item.disabled = false;
          }
        })
      })
    }
  }
}
