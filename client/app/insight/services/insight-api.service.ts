import { Injectable } from '@angular/core';
import { IInsightLayer, IInsightView } from '@client/app/core/modules/view-management/interface';
import { Observable } from 'rxjs';
import { LayerService, HttpService, LayerDataService } from '@client/app/shared';
import { Expression } from '@client/app/shared/QueryModel';
import { IInsightPolygon, IInsightResult } from '../interfaces';
import { ILayer } from '@client/app/shared/interfaces';
import { map, tap } from 'rxjs/operators';
import { cloneDeep } from 'lodash';
@Injectable({
  providedIn: 'root'
})
export class InsightApiService {

  constructor(
    private _httpService: HttpService,
    private _layerService: LayerService
  ) { }
  getInsight(insightLayer: IInsightLayer, polygons: any[]): Observable<any> {
    const layer = this._layerService.layerStore.get(insightLayer.layerId);
    const model = {
      Projections: JSON.stringify(insightLayer.columnIds
        .map(columnId => Expression.Property('', columnId, LayerDataService.getTypeForField(layer.schema, columnId)))),

      // Projections: JSON.stringify(LayerDataService.getProjection(layer, filter, layer.schema, false)),
      QueryShapes: JSON.stringify(polygons)
    };

    return this._httpService.postJSON(`DataPackage/Compare/${layer.id}/Default`, model).pipe(
      map(data => this._convertToInsightResult(data, layer, polygons)));
  }

  downloadInsight(results: any, polygonRequest: IInsightPolygon[], showPercentages: boolean, groups: any, showComparison: boolean): Observable<any> {

    const getGroupName = layer => {
        const group = groups.find(z => z.layers.find(x => x === layer) !== undefined);

        return group ? group.name : '';
    };

    const resultsNew = results.map(result => ({
        data: result.data,
        layer: {
            id: result.layer.id,
            name: result.layer.name,
            groupName: getGroupName(result.layer)
        }
    }));

    const model = {
        results: JSON.stringify(resultsNew),
        polygonRequest: JSON.stringify(polygonRequest.map(x => x.label)),
        showComparison: showComparison,
        showPercentages: showPercentages
        //groups: JSON.stringify(groups)
    };
    return this._httpService.postJSON(`DataPackageIndex/DownloadInsight`, model).pipe(tap((data: any) => {
        this._httpService.downloadFile(data.file);
    }))
}

  getInsightBatch(view: IInsightView, polygons: any[]): Observable<{polygons: IInsightPolygon[], results: IInsightResult[]}> {
    const { layers,  } = view;
    const dataSetProjections = layers.map(insightLayer => {
      const { columnIds, layerId } = insightLayer;
      const layer = this._layerService.layerStore.get(layerId);
      if (!layer) {
        return null;
      }

      const { id, schema } = layer;
      return {
        DataPackageId: id,
        DataViewName: "Default",
        Projections: JSON.stringify(columnIds
          .map(columnId => Expression.Property('', columnId, LayerDataService.getTypeForField(schema, columnId)))),
      };
    }).filter(e => !!e);

    const batchModel = {
      DataSetProjections: dataSetProjections,
      QueryShapes: JSON.stringify(polygons)
    }

    return this._httpService.postJSON(`DataPackage/CompareBatch`, batchModel).pipe(
      map(_results => {
        const results: IInsightResult[] = _results.map(insightResult => this._convertToInsightResultBatch(insightResult, insightResult.layerId, polygons));
        return {
          results,
          polygons: results[0] ? results[0].polygons : polygons
        }
      }));
  }

  private _convertToInsightResultBatch(result: any, layerId: string, polygons: any[]): IInsightResult {
    const layer = this._layerService.layerStore.get(layerId);
    delete result.layerId;
    return this._convertToInsightResult(result, cloneDeep(layer), polygons);
  }


  private _convertToInsightResult(result: any, layer: ILayer, polygons: any[]): IInsightResult {
    const data: any = [];
    let _polygons: IInsightPolygon[] = [];
    let maxIndex: number = 0;
    Object.keys(result).forEach((columnId: string, resultIndex: number) => {

      let average: number = null;
      let averageCount: number = null;
      let averageLabel: number = null;
      let unit: string = null;
      //let area: number = null;
      let ukAvgDensity: number = null;
      let density: number = null;
      const valuesCompact: boolean[] = [];
      const values = result[columnId].map((x: any, index: number) => {

        const column: {
          count: number,
          percent: number,
          list: any[],
          average: number,
          averageCount: number,
          ukAvgDensity: number,
          density: number,
          areaKm2: number,
          zscore: number
          index: number
        } = {
          count: null,
          percent: null,
          list: null,
          average: null,
          averageCount: null,
          ukAvgDensity: null,
          density: null,
          areaKm2: null,
          zscore: null,
          index: null
        };
        if (x.areaKm2 && !_polygons[index]) {
          _polygons.push({ ...polygons[index], area: x.areaKm2 });
        }
        if (x.Sum) {
          average = x.Sum[0].ukPerc ? x.Sum[0].ukPerc / 100 : null;
          averageLabel = x.Sum[0].ukPercName;
          // TR uncomment for BOS-393
          averageCount = x.Sum[0].ukCount;
          unit = x.Sum[0].unit;
          ukAvgDensity = x.Sum[0].ukAvgDensity;
          density = x.Sum[0].density;

          column.averageCount = averageCount;
          column.average = average;

          column.count = x.Sum[0].count;
          column.percent = (x.Sum[0].perc !== 0) ? (x.Sum[0].count / x.Sum[0].perc) : null;

          column.ukAvgDensity = ukAvgDensity;
          column.density = density;
          column.zscore = parseFloat(x.Sum[0].zscore) == NaN ? null : parseFloat(x.Sum[0].zscore);
          column.index = x.Sum[0].index ? x.Sum[0].index : null;
          maxIndex = column.index > maxIndex ? column.index : maxIndex;
        } else if (x.Count) {
          column.list = x.Count;

          const totalCount = column.list.reduce((sum, value) => sum + value.totalCount, 0);
          const count = column.list.reduce((sum, value) => sum + value.count, 0);

          column.list.push({
            key: 'Subtotal',
            count,
            totalCount,
            totalPercent: (totalCount !== 0) ? totalCount / totalCount : 0,
            percent: (count !== 0) ? count / count : 0
          });

          column.list.forEach((value, i) => {
            if (value.key !== 'Subtotal') {
              valuesCompact[i] = (valuesCompact[i] === undefined ? false : valuesCompact[i]) || value.count !== 0;
              column.list[i].totalPercent = (Number.isInteger(value.totalCount) && totalCount !== 0) ?
                value.totalCount / totalCount : 0;
              column.list[i].percent = (Number.isInteger(value.count) && count !== 0) ? value.count / count : 0;
            } else {
              valuesCompact[i] = true;
            }
          });
        }

        return column;
      });

      const col = layer.columns.find(x => x.id === columnId && !x.notComparable);
      if (col) {
        if (!data[col.groupId]) {
          const group = layer.columnGroups.find(x => x.Index.toString() === col.groupId.toString());

          data[col.groupId] =
          {
            name: group.Name,
            HasTotal: group.HasTotal,
            children: [],
            maxIndex: 0
          };
        }
        data[col.groupId].maxIndex = maxIndex;
        const stats = result[columnId][0].columnStatistics;
        data[col.groupId]['children'].push({
          columnId: columnId,
          label: col.name,
          valuesCompact: valuesCompact,
          values: values,
          unit: unit,
          average: average,
          averageCount: averageCount,
          averageLabel: averageLabel,
          ukAvgDensity: ukAvgDensity,
          min: stats ? stats.min : null,
          max: stats ? stats.max : null
        });
      }
    });

    data.forEach(group => {
      if (group) {
        group.total = [];
        group.percent = [];
        group.average = [];
        group.averageCount = [];

        group.children.forEach((column) => {
          column.values.forEach((value, j) => {
            if (group.total[j] === undefined) {
              group.total[j] = null;
            }
            if (group.percent[j] === undefined) {
              group.percent[j] = null;
            }
            if (group.averageCount[j] === undefined) {
              group.averageCount[j] = null;
            }
            if (group.average[j] === undefined) {
              group.average[j] = null;
            }

            if (value.list) {
              group.total[j] += value.list[value.list.length - 1].count;
              if (value.list[value.list.length - 1].percent) {
                group.percent[j] += value.list[value.list.length - 1].percent;
              }
            } else {
              group.total[j] += value.count;
              if (value.percent) {
                group.percent[j] += value.percent;
              }
              group.averageCount[j] += value.averageCount;
              if (value.average) {
                group.average[j] += value.average;
              }
            }
          });
        });

      }
    });
    return {
      layer,
      data,
      polygons: _polygons
    };
  }
}
