import { throwError as observableThrowError, zip as observableZip, ReplaySubject, Subject, Observable, Observer, throwError, BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';

import { HttpService } from './http.service';
import { LayerSource } from './LayerSource';
import { LayerService } from './layer.service';
import { Expression } from './QueryModel';
import { LayerDataService } from './layer-data.service';
import { ActionMessageService } from './action-message.service';
import { OverlayShape } from './overlay-shape';
import { ILayer, ISelection, IInsight, PolygonRequest, IInsightLayer, InsightResult } from './interfaces';
import { MatchItPolygon } from '../resultpanel/shared/models/match-it-filter.model';
import { createSimpleError } from './http.util';
import { ERRORCODE } from './global';


@Injectable()
export class InsightService {

    store: IInsight[] = [];
    insightSource = new ReplaySubject<IInsight[]>(1);
    insight = this.insightSource.asObservable();

    insightShapeSource = new Subject<ISelection>();
    insightShape = this.insightShapeSource.asObservable();

    isQuickInsight$ = new BehaviorSubject<boolean>(false);
    // insightResultSource = new ReplaySubject<InsightResult[]>(1);
    // insightResult = this.insightResultSource.asObservable();

    runInsightManually$ = new Subject<void>()
    constructor(private httpService: HttpService,
        private actionMessageService: ActionMessageService,
        private layerService: LayerService) {
    }

    setShapeInsight(selection: ISelection) {
        this.insightShapeSource.next(selection);
    }

    public addOrUpdateInsightViewByLayerId(views: IInsight[], source: LayerSource){
      this.store = Array.isArray(this.store) ? this.store : [];
      const updateViews = views.map(view => {
        view.source = LayerSource.USER;
        return view
      });
      const notUpdateViews = this.store.filter(e=> e.source != source);
      this.setStore([...notUpdateViews, ...updateViews])
    }

    add(insight: IInsight) {
        if (insight.isDefault) {
            this.store.forEach(insght => {
                insght.isDefault = false;
            });
        }

        this.store.push(insight);
        // insight.id = (this.store.length - 1).toString();

        this.updateStore();
    }

    update(insight: IInsight, index) {
        if (insight.source === LayerSource.CORPORATE) {
            return;
        }
        if (insight.isDefault) {
            this.store.forEach(x => {
                x.isDefault = false;
            });
        }
        // const index = this.store.findIndex(x => x.id === insight.id);
        this.store[index] = insight;

        this.updateStore();
    }

    remove(insight: IInsight) {

        if (insight.source === LayerSource.CORPORATE) {
            return;
        }

        const index = this.store.findIndex(x => x === insight);
        this.store.splice(index, 1);

        const isDefault = this.store.find(x => x.isDefault);

        if (isDefault === undefined && this.store[0]) {
            this.store[0].isDefault = true;
        }

        this.updateStore();
    }

    updateStore() {
        const userInsights = {
            insights: this.store.filter(a => a.source === LayerSource.USER)
        };

        this.httpService.postJSON('UserSettings/?settingCollection=insight&settingName=insight', userInsights)
            .subscribe(() => this.getList());
    }

    setStore(insights: IInsight[]) {
        this.store = insights;
        this.insightSource.next(insights);
    }

    public getUserInsightViews() {
      return this.httpService.get(`UserSettings/?settingCollection=insight&settingName=insight`).pipe(
        map(e => e['insights'] ? e['insights'] : [])
      )
    }

    getList() {
        const source = new ReplaySubject<IInsight[]>(1);

        observableZip(
            this.httpService.get(`TenantSettings/?settingCollection=insight&settingName=insight`),
            this.httpService.get(`UserSettings/?settingCollection=insight&settingName=insight`))
            .subscribe(
                (data: any) => {

                    const tenant = Array.isArray(data[0].insights) ? data[0].insights : [];
                    const user = Array.isArray(data[1].insights) ? data[1].insights : [];

                    tenant.forEach((x: IInsight) => x.source = LayerSource.CORPORATE);
                    user.forEach((x: IInsight) => x.source = LayerSource.USER);

                    // If one of the user views is set to default, this should override the tenant ones
                    const isDefault = user.find(x => x.isDefault);
                    if (isDefault !== undefined) {
                        tenant.forEach((x: IInsight) => x.isDefault = false);
                    }

                    source.next([].concat(tenant).concat(user));
                },
                error => {
                    return observableThrowError(error);
                });

        return source;
    }

    downloadInsight(results: any, polygonRequest: PolygonRequest[], showPercentages: boolean, groups: any, showComparison: boolean): Observable<any> {

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
            showPercentages: showPercentages,
            polygonRequest: JSON.stringify(polygonRequest.map(x => x.label)),
            showComparison: showComparison
            //groups: JSON.stringify(groups)
        };
        return this.httpService.postJSON(`DataPackageIndex/DownloadInsight`, model).pipe(tap((data: any) => {
            this.httpService.downloadFile(data.file);
        }))
    }

    getInsight(insightLayer: IInsightLayer, polygons: any[]): Observable<any> {
        const layer = this.layerService.layerStore.get(insightLayer.layerId);
        const model = {
            Projections: JSON.stringify(insightLayer.columnIds
                .map(columnId => Expression.Property('', columnId, LayerDataService.getTypeForField(layer.schema, columnId)))),
            QueryShapes: JSON.stringify(polygons)
        };

        return this.httpService.postJSON(`DataPackage/Compare/${layer.id}/Default`, {...model, source: layer.source, owner: layer.owner}).pipe(
            map(data => this.convertToInsightResult(data, layer, polygons)));
    }

    getInsightBatch(model: any): Observable<any> {
        return this.httpService.postJSON(`DataPackage/CompareBatch`, model);
    }

    convertToInsightResultBatch(result: any, layerId: string, polygons: any[]): InsightResult {
        const layer = this.layerService.layerStore.get(layerId);
        return this.convertToInsightResult(result, layer, polygons);
    }

    private convertToInsightResult(result: any, layer: ILayer, polygons: any[]): InsightResult {
        const data: any = [];
        let _polygons: MatchItPolygon[] = [];
        let maxIndex: number = 0;
        Object.keys(result).filter(x => x !== "layerId").forEach((columnId: string, resultIndex: number) => {

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
                if (x.areaKm2) {
                    _polygons.push({ areaKm2: x.areaKm2, label: polygons[index].label });
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
                    maxIndex = column.index > maxIndex ? column.index: maxIndex;
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

    copyToTenant(insight: IInsight) {
        this.httpService.get('TenantSettings/?settingCollection=insight&settingName=insight').subscribe(insights => {

            insight.source = LayerSource.CORPORATE;
            if (!insights.insights) {
                insights = { insights: [] };
            }
            insights.insights.push(insight);
            this.httpService.postJSON('TenantSettings/?settingCollection=insight&settingName=insight', insights)
                .subscribe(() => {
                    this.actionMessageService.sendInfo('copy insight to tenant');
                });
        });
    }

    // setInsightResult(result: InsightResult[]){
    //     this.insightResultSource.next(result);
    // }
}
