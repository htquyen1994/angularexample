import { Injectable } from '@angular/core';
import { LayerGroupService, unique } from '@client/app/shared';
import { map, first, filter } from 'rxjs/operators';
import { ILayer, ILayerColumn, ILayerColumnGroup } from '@client/app/shared/interfaces';
import { ILayerInsightView, IInsightView, ICatchmentView } from '../interface';
import { TravelMode, TravelType, TravelUnit } from '../enums';
import { LayerSource } from 'src/client/app/shared';
import { cloneDeep } from 'lodash'
@Injectable({
  providedIn: 'root'
})
export class ViewManagementLogicService {

  constructor(
    private _layerGroupService: LayerGroupService
  ) { }

  getLayerGroupOptions() {
    return this._layerGroupService.groups.pipe(
      filter(e=>!!(e && e.length)),
      first(),
      map(_g => {
        const _groups = cloneDeep(_g)
        let layers: ILayerInsightView[] = [];
        const groups = _groups.map((group, index) => {
          const _layers = group.layers.filter(e => e.hasInsight).map(layer => {
            const columnGroupOptions = layer.columns.map(e => e.groupId).filter(unique).map(groupId => {
              const columnGroup = layer.columnGroups.find(_e => _e.Index == groupId);
              const columnFiltered = layer.columns.filter(col=>col.groupId == groupId && !col.notComparable);
              const items = columnFiltered.length? columnFiltered.map(child => {
                // if (child['list']) {
                //   return child['list'].map(item => ({ label: `${child.name} - ${item.key}`, value: item.matchCommonGeoColumnId }))
                // }
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
              value: index,
              label: group.name,
              items: _layers.map(layer => ({
                value: layer.id,
                label: layer.name,
                disabled: false
              }))
            }
          }
          return null
        }).filter(e => !!e);
        return { layers, groups }
      })
    )
  }

  toInsightView(data, isMetric): IInsightView{
    const { id, source, isDefault, layers, catchments, name } = data;
    return {
      id,
      name,
      source: source === LayerSource.CORPORATE ? source : LayerSource.USER,
      isDefault,
      layers,
      catchments: catchments ? catchments.map(e=>this.toCatchmentView(e, isMetric)): []
    }
  }

  toCatchmentView(catchmentView, isMetric: boolean): ICatchmentView {
    const { directionFromOrigin, type, value, toOrigin, isDetail, mode, unit } = catchmentView;

    const travelMode = [TravelMode.CIRCLE, TravelMode.CAR, TravelMode.CAR, TravelMode.WALKING, TravelMode.WALKING, TravelMode.BIKE, TravelMode.BIKE];
    const _mode = mode || travelMode[type] || TravelMode.CIRCLE;
   // const _toOrigin = directionFromOrigin || toOrigin || true;
    const _toOrigin = toOrigin || false;

    const _isDetail = isDetail || false;
    const isDistance = [0,2,4,6].includes(type) || type === TravelType.DISTANCE;
    const _value = travelMode[type] && isDistance ? value / 1000 : value; //check old catchment view value

    //const _unit = !unit ? isDistance ? isMetric ? TravelUnit.KILOMETER : TravelUnit.MILE : TravelUnit.MINUTE : unit
    const _unit = !unit ? isDistance ? TravelUnit.KILOMETER : TravelUnit.MINUTE : unit

    return {
      isDetail: _isDetail,
      toOrigin: _toOrigin,
      mode: _mode,
      type: isDistance ? TravelType.DISTANCE: TravelType.DURATION,
      value: _value,
      unit: _unit
    }
  }
}
