import { Injectable } from '@angular/core';
import { LayerGroupService, unique, FilterService } from '@client/app/shared';
import { map } from 'rxjs/operators';
import { cloneDeep } from 'lodash';
import { ICoreFilter, ICoreLayer, ICoreGroup } from '../interfaces/layer.interface';

@Injectable({
  providedIn: 'root'
})
export class LayerLogicService {

  constructor(
    private _layerGroupService: LayerGroupService,
    private _filterService: FilterService
  ) { }

  getLayerGroups() {
    return this._layerGroupService.groups.pipe(
      map(_g => {
        const _groups = cloneDeep(_g)
        let layers: ICoreLayer[] = [];
        const groups: ICoreGroup[] = _groups.map((group, index) => {
          const { name } = group;
          const _layers = group.layers.map(layer => {
            const columnGroupOptions = layer.columns.map(e => e.groupId).filter(unique).map(groupId => {
              const columnGroup = layer.columnGroups.find(_e => _e.Index == groupId);
              const columnFiltered = layer.columns.filter(col=>col.groupId == groupId && !col.notComparable);
              const items = columnFiltered.length? columnFiltered.map(child => {
                return [{ label: child.name, value: child.id, }]
              }).reduce((a, b) => [...a, ...b]) : [];
              return items.length ? {
                label: columnGroup.Name,
                value: columnGroup.Index,
                items
              }: null
            }).filter(e => !!e);
            return {
              ...layer,
              columnGroupOptions
            }
          })
          if (_layers.length) {
            layers = [...layers, ..._layers];
            return {
              id: index,
              name,
              layers: _layers
            } as ICoreGroup
          }
          return null
        }).filter(e => !!e);
        return { layers, groups }
      })
    )
  }

  getFilters(): ICoreFilter[]{
    return Object.keys(this._filterService.filterListStore).map(key=>{
      const filters =  this._filterService.filterListStore[key];
      return {
        filters,
        layerId: key
      }
    })
  }
}
