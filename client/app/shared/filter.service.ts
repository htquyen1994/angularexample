import { throwError as observableThrowError, zip as observableZip, Subject, ReplaySubject, of, forkJoin, Observable, Subscription } from 'rxjs';
import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { LayerService } from './layer.service';
import { LayerSource } from './LayerSource';
import { LayerGroupService } from './layer-group.service';
import { SelectionService } from './selection.service';
import { ActionMessageService } from './action-message.service';
import { ILayer, ILayerColumn, IFilter, FilterChange } from './interfaces';
import { ILayerColumnType } from './enums';
import { LayerBundle } from './layerBundle';
import { map } from 'rxjs/operators';
import { JstsOperatorService } from './services/jsts-operator.service';
import { LayerStoreService } from '../core/services';


@Injectable()
export class FilterService {

  filterListStore: { [x: string]: IFilter[] } = {};
  filterActiveStore: { [x: string]: IFilter } = {};

  filterSource = new Subject<FilterChange>();
  filter = this.filterSource.asObservable();

  private layers: ILayer[] = []
  constructor(private httpService: HttpService,
    private layerService: LayerService,
    private actionMessageService: ActionMessageService,
    private selectionService: SelectionService,
    private layerGroupService: LayerGroupService,
    private _jstsOperatorService: JstsOperatorService,
    private _layerStoreService: LayerStoreService) {

    this.layerGroupService.groupAdd.subscribe(data => {
      this.filterListStore[data.layer.id] = [this.createDefaultFilter(data.layer)];
      this.setActiveFilter(data.layer.id, this.filterListStore[data.layer.id][0]);
    });

    this.layerService.layer.subscribe((layers: ILayer[]) => {
      this.layers = layers.filter(e=>!(e instanceof LayerBundle));
    });
    this.layerService.layerRefresh.subscribe(layer => {
      let index = this.layers.findIndex(e => e.id == layer.id);
      if (index != -1) {
        this.layers[index] = layer;
      }
    })
  }

  setActiveFilter(layerId: string, filter: IFilter, trigger = true) {
    this.filterActiveStore[layerId] = filter;
    this.selectionService.clearLayerSelections(layerId);
    if (trigger) {
      this.filterSource.next({
        layerId: layerId,
        filter: filter
      });
    }
  }

  createFilter(layerId: string, currentFilter: IFilter, filter: IFilter) {
    let filters = [...this.filterListStore[layerId]];
    if (filter.isDefault) {
      filters = filters.map(e => ({
        ...e,
        isDefault: false
      }));
    }

    filter.id = this.getPseudoGuid().toString(); //(this.filterListStore[layerId].length - 1).toString();
    filters.push(filter);
    this.filterListStore[layerId] = [...filters];

    this.setActiveFilter(layerId, filter);
    this.updateFilterStore();
  }



  getPseudoGuid() {
    var lut = []; for (var i = 0; i < 256; i++) { lut[i] = (i < 16 ? '0' : '') + (i).toString(16); }
    var d0 = Math.random() * 0xffffffff | 0;
    var d1 = Math.random() * 0xffffffff | 0;
    var d2 = Math.random() * 0xffffffff | 0;
    var d3 = Math.random() * 0xffffffff | 0;
    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] + '-' +
      lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] + lut[d1 >> 24 & 0xff] + '-' +
      lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' + lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] +
      lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] + lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff];
  }


  copyToTenant(layerId: string, filter: IFilter) {

    this.httpService.get('TenantSettings/?settingCollection=filters&settingName=filters').subscribe(filters => {

      filter.source = LayerSource.CORPORATE;
      if (!filters[layerId]) {
        filters[layerId] = [];
      }
      filters[layerId].push(filter);
      this.httpService.postJSON('TenantSettings/?settingCollection=filters&settingName=filters', filters)
        .subscribe(() => {
          this.actionMessageService.sendInfo('copy filter to tenant');
        });
    });
  }

  copyToUsers(layerId: string, filter: IFilter, users: string[]) {
    //
    const observables = users
      .map(user => this.httpService
        .postJSON('UserSettings/CopyToUser?settingCollection=filters&settingName=filters&user=' + user + '&layerId=' + layerId, filter));

    return forkJoin(observables);
  }

  updateFilter(layerId: string, currentFilter: IFilter, filter: IFilter) {
    if (filter.source === LayerSource.CORPORATE) {
      return;
    }
    filter = { ...filter, isUpdated: true };
    let filters = [...this.filterListStore[layerId]];
    if (filter.isDefault) {
      filters = filters.map(e => ({
        ...e,
        isDefault: false
      }));
    }
    const index = this.filterListStore[layerId].findIndex(_ => _.id === currentFilter.id);
    filters.splice(index, 1, filter);
    this.filterListStore[layerId] = [...filters];

    this.setActiveFilter(layerId, filter);
    this.updateFilterStore();
  }

  deleteFilter(layerId: string, currentFilter: IFilter) {

    if (currentFilter.source === LayerSource.CORPORATE) {
      return;
    }
    const filters = [...this.filterListStore[layerId]];
    const index = filters.findIndex(filter => filter === currentFilter);
    filters.splice(index, 1);

    const isDefault = filters.find(filter => filter.isDefault);

    if (isDefault === undefined) {
      const filter = {
        ...filters[0],
        isDefault: true
      }
      filters.splice(0, 1, filter);
    }
    this.filterListStore[layerId] = [...filters];
    if (this.filterActiveStore[layerId].id === currentFilter.id) {
      this.setActiveFilter(layerId, this.filterListStore[layerId][0]);
    }
    this.updateFilterStore();
  }

  updateFilterStore() {
    this._layerStoreService.getFilters()
    const serialized = JSON.stringify(this.filterListStore);

    const clone: { [key: string]: IFilter[] } = JSON.parse(serialized);

    const keys = Object.getOwnPropertyNames(clone);

    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (Array.isArray(clone[k])) {
        clone[k] = clone[k].filter(a => a.source === LayerSource.USER);
      }
    } // only persist user filters

    this.httpService.postJSON('UserSettings/?settingCollection=filters&settingName=filters', clone)
      .subscribe(() => {
        this.getFilterList();
      });
  }

  getFilterListData(data: any, callback: Function = null, trigger = true) {
    this.filterListStore = {};
    const handler = (filters: { [key: string]: IFilter[] }, filterSource: LayerSource) => {

      filters = filters || {};

      this.layers.forEach(layer => {
        if (filterSource === LayerSource.CORPORATE && !filters[layer.id]) {
          filters[layer.id] = [this.createDefaultFilter(layer)];
        }

        if (Array.isArray(filters[layer.id])) {
          filters[layer.id].forEach((a: IFilter) => a.source = filterSource);
        }

        return filters;

      });

      return filters;

    };

    const processor = (merged: ({ [key: string]: IFilter[] }[])) => {

      const corp = handler(merged[0], LayerSource.CORPORATE);
      const user = handler(merged[1], LayerSource.USER);
      const keys = Object.getOwnPropertyNames(user);
      const filters = {};
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        filters[key] = (corp[key] || []).concat(user[key]);
      }
      this.layers.forEach(layer => {

        if (!(filters[layer.id])) { // we have encountered a layer with no user or corporate filters defined

          const f = this.createDefaultFilter(layer);
          f.source = LayerSource.USER;

          filters[layer.id] = [f];
        }

        let activeFilter = filters[layer.id][0];

        this.filterListStore[layer.id] = filters[layer.id].map((filter: IFilter, index: number) => {

          if (filter.isDefault) {
            activeFilter = filter;
          }
          if(filter.shape){
            const _shape = this._jstsOperatorService.getValidateShape(filter.shape.value);
            if(_shape) {
              filter.shape = {
                ...filter.shape,
                value: _shape
              };
            }
          }
          filter.id = index.toString();
          return filter;
        });

        if (this.filterActiveStore[layer.id]) {
          const filter = this.filterListStore[layer.id][this.filterActiveStore[layer.id].id];
          if (filter) {
            activeFilter = filter;
          }
        }

        this.setActiveFilter(layer.id, activeFilter, trigger);
      });
      if (callback) callback();
    };

    processor(data);
  }

  getFilterList() {
    const source = new ReplaySubject(1);

    observableZip(
      this.httpService.get(`TenantSettings/?settingCollection=filters&settingName=filters`),
      this.httpService.get(`UserSettings/?settingCollection=filters&settingName=filters`))
      .subscribe(
        data => {
          source.next(data);
        },
        error => {
          return observableThrowError(error);
        });

    return source;
  }

  getUserFiltersByLayerId(layerId: string) {
    return this.httpService.get(`UserSettings/?settingCollection=filters&settingName=filters`).pipe(
      map(e=>{
        return e[layerId]
      })
    )
  }

  createDefaultFilter(layer: ILayer, allColumns = false): IFilter {
    let id: any = layer.columns.find(col => col.isIdentifier) || {};
    id = id.id;

    const columnSort = (a: ILayerColumn, b: ILayerColumn): number => {
      if (a.groupId.toString() === b.groupId.toString()) {
        return a.index < b.index ? -1 : 1;
      } else {
        return a.groupId < b.groupId ? -1 : 1;
      }
    };

    return {
      id: null,
      name: 'Records',
      isDefault: true,
      shape: null,
      source: LayerSource.USER,
      displayColumns: layer.columns
        .filter(
          (col: ILayerColumn) => allColumns || !((col.notSelectable) ||
            [ILayerColumnType.SHAPE, ILayerColumnType.QUADKEY].includes(col.type)))
        // .map((c, i) => {
        //   c.index = i;
        //   return c;
        // })
        .sort(columnSort)
        .map(col => col.id),
      sortColumn: id,
      sortDirection: 'ASC',
      filters: {}
    };
  }

  addFiltersByLayerId(layerId: string, filters: IFilter[]) {
    const currentFilters = [...this.filterListStore[layerId]];
    if(currentFilters && currentFilters.length > 0){
      filters.forEach(filter=>{
        const id = filter.id ? filter.id : filter.name;
        const index = currentFilters.findIndex(e => e.id === id);
        if (index != -1) {
          currentFilters[index] = filter;
        } else {
          currentFilters.push(filter);
        }
      })
    }
    this.filterListStore[layerId] = currentFilters;
  }
}
