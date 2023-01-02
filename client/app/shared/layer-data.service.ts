import { throwError as observableThrowError, of as observableOf, forkJoin, Subject, Observable, Subscription, of, ReplaySubject, BehaviorSubject, throwError, merge } from 'rxjs';

import { map, first, concatMap, tap, catchError, switchMap } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { HttpService } from './http.service';
import { LayerService } from './layer.service';
import { FilterService } from './filter.service';
import { MapService } from './map.service';
import { SelectionService } from './selection.service';

import { OverlayShapePolygon } from './overlay-shape';
import { StreetviewMarker } from '../resultpanel/streetview/streetview.component';
import { ILayerColumnType, IFilterJunction } from './enums';
import { ILayer, IFilter, ILayerData, ColumnStatistics, PicklistEntry, ColumnDivide } from './interfaces';
import { ISchema, DataTypeFlags, Field } from './Data/Packaging';
import { Expression, IPredicate, Predicate, TYPE, OperatorUtil, ConstantCollectionExpression } from './QueryModel';
import { DecimalPipe } from '@angular/common';
import { API_BASE_HREF } from './global';
import { createSimpleError } from './http.util';
import { IBoundingBox } from '../iface/IBoundingBox';

export interface QueryRequest {
  projection: any[];
  predicate: any[];
  pageSize: number;
  pageNumber: number;
  selectedIds?: string[];
  filterSelected?: boolean;
  boundingBox?: IBoundingBox;
  sort?: {
    columnName: string;
    sortDirection: string;
  }[]
}

@Injectable()
export class LayerDataService {

  picklistEntries: { [columnId: string]: BehaviorSubject<any> } = {};

  layerDataSource = new BehaviorSubject<ILayerData>({results: null, notSetWidth: true});
  layerData = this.layerDataSource.asObservable();

  layerDataCountSource = new BehaviorSubject<{ count: number, isLoading: boolean }>(null);
  layerDataCount = this.layerDataCountSource.asObservable();

  layerDataSubscription: Subscription = null;

  editLayerDataSource = new Subject<ILayerData>();
  editLayerData = this.editLayerDataSource.asObservable();

  countLayerDataSource = new Subject<ILayerData>();
  countLayerData = this.countLayerDataSource.asObservable();

  nearestLayerDataSource = new Subject<ILayerData>();
  nearestLayerData = this.nearestLayerDataSource.asObservable();

  infoLayerDataSource = new Subject<ILayerData>();
  infoLayerData = this.infoLayerDataSource.asObservable();

  downloadLayerDataSource = new Subject<any>();
  downloadLayerData = this.downloadLayerDataSource.asObservable();

  insightSelectionLayerDataSource = new Subject<any>();
  insightSelectionLayerData = this.insightSelectionLayerDataSource.asObservable();

  private columnStatistics: { [key: string]: ReplaySubject<ColumnStatistics> } = {};
  private columnDivide: { [key: string]: ReplaySubject<any> } = {};

  static getProjection(layer: ILayer, filter: IFilter, schema: ISchema, forceGeometryColumn: boolean = false) {

    const columns = filter.displayColumns.slice(0);
    const identifierColumn = layer.columns.find(column => column.isIdentifier).id;
    const geometryColumn = layer.columns.find(column => column.isDefaultGeometry).id;

    if (forceGeometryColumn) {
      if (columns.find(columnId => columnId === geometryColumn) === undefined) {
        columns.unshift(geometryColumn);
      }
    }

    if (columns.find(columnId => columnId === identifierColumn) === undefined) {
      columns.unshift(identifierColumn);
    }

    // if (!filter.isJsonExpression) {

    return columns.map(columnId => Expression.Property('', columnId, LayerDataService.getTypeForField(schema, columnId)));
    /*        } else {
     return columns.map(columnId => {
     return {
     Type: 'JsonExpression',
     ClassName: '',
     PropertyName: columnId
     };
     });
     }*/
  }

  static getNameAndShapeProjections(layer: ILayer, schema: ISchema) {
    const columns = layer.columns.filter(column => {
      return column.type === ILayerColumnType.SHAPE ||
        column.isLabel ||
        column.isIdentifier;
    });
    return columns.map(item => Expression.Property(layer.id, item.id, LayerDataService.getTypeForField(layer.schema, item.id)));
  }

  static getInfoProjections(layer: ILayer, schema: ISchema) {
    const columns = layer.columns.filter(column => {
      return column.isInfo;
    });
    return columns.map(item => Expression.Property(layer.id, item.id, LayerDataService.getTypeForField(layer.schema, item.id)));
  }

  static getComparableProjections(layer: ILayer, schema: ISchema) {
    const columns = layer.columns.filter(column => {
      return column.notComparable === false;
    });
    return columns.map(item => Expression.Property(layer.id, item.id, LayerDataService.getTypeForField(layer.schema, item.id)));
  }

  static getAllProjections(layer: ILayer, schema: ISchema) {

    const columns = layer.columns;

    return columns.map(item => Expression.Property(layer.id, item.id, LayerDataService.getTypeForField(layer.schema, item.id)));
  }

  static getPredicate(filter: IFilter, layer: ILayer, isRequest?: boolean): IPredicate[] {
    if (!filter) {
      return [];
    }

    const predicate: any[] = [];
    Object.keys(filter.filters).forEach((columnName: string) => {

      const filterGroup = filter.filters[columnName];

      if (filterGroup.length > 1) {
        if (filter.junctions[columnName] === IFilterJunction.OR) {
          predicate.push(Predicate.Or(
            filter.filters[columnName].map(
              x => LayerDataService.getPredicatePartial('', x.operator, x.value, columnName, layer.schema, isRequest))));
        } else {
          predicate.push(Predicate.And(
            filter.filters[columnName].map(
              x => LayerDataService.getPredicatePartial('', x.operator, x.value, columnName, layer.schema, isRequest))));
        }
      } else {
        filter.filters[columnName].forEach(x => {
          predicate.push(LayerDataService.getPredicatePartial('', x.operator, x.value, columnName, layer.schema, isRequest));
        });
      }
    });

    if (filter.shape) {
      const column = layer.columns.find(_ => _.isDefaultGeometry);
      predicate.push(LayerDataService.getPredicatePartial('', filter.shape.operator, filter.shape.value,
        column.id, layer.schema, isRequest));
    }

    return predicate;
  }

  static getTypeForField(schema: ISchema, columnName: string) {
    const field = schema._fieldsByIndex[schema._indicesByKey[columnName]];
    if (!field) {
      return null;
    }
    if (Field.hasFlag(field, DataTypeFlags.Boolean)) {
      return TYPE.boolean;
    }
    if (Field.hasFlag(field, DataTypeFlags.String)) {
      return TYPE.string;
    }
    if (Field.hasFlag(field, DataTypeFlags.Number)) {
      return TYPE.number;
    }
    if (Field.hasFlag(field, DataTypeFlags.DateTime)) {
      return TYPE.datetime;
    }
    if (Field.hasFlag(field, DataTypeFlags.Geometry)) {
      return TYPE.shape;
    }

    throw new Error('notimplemented');
  }

  private static getPredicatePartial(layerId: string, operator: string, value: any, columnName: string, schema: ISchema, isRequest?: boolean): IPredicate {
    const opKey = operator.split('.')[0];

    const type: TYPE = LayerDataService.getTypeForField(schema, columnName);

    switch (opKey) {

      case 'BinaryOperator':
        return Predicate.Binary(Expression.Property(layerId, columnName, type),
          OperatorUtil.GetOperator(operator),
          Expression.Constant(value, type));
      case 'CollectionBinaryOperator':
        if (!isRequest) {
          if (value instanceof Array) {
            value = value.map(e => {
              return e == '[IS NULL]' ? null : e;
            })
          }
        }
        return Predicate.Collection(Expression.Property(layerId, columnName, type),
          OperatorUtil.GetOperator(operator),
          <ConstantCollectionExpression>Expression.Constant(value, type));
      case 'StringBinaryOperator':
        return Predicate.String(Expression.Property(layerId, columnName, type),
          OperatorUtil.GetOperator(operator),
          Expression.Constant(value, type), false);
      case 'SpatialBinaryOperator':
        return Predicate.Intersects(Expression.Property(layerId, columnName, type), value);
      case 'NullabilityOperator':
        return Predicate.IsNull(Expression.Property(layerId, columnName, type));

      default:
        throw new Error('Predicate type not implemented ' + opKey);

    }
  }

  constructor(private httpService: HttpService,
    private layerService: LayerService,
    private filterService: FilterService,
    private selectionService: SelectionService,
    private mapService: MapService) {
  }

  getLayerDataOrigin(
    layer: ILayer,
    query: QueryRequest,
    isCountQuery?: boolean
  ) {
    const { id, source, owner } = layer;
    const { boundingBox, filterSelected, pageNumber = 0, pageSize = 25, predicate, projection, selectedIds, sort } = query;
    let params = new HttpParams();
    params = params.set('PageNumber', pageNumber.toString());
    params = params.set('PageSize', pageSize.toString());
    if (boundingBox) {
      params = params.set('BoundingBox[minX]', boundingBox.Min.Lng.toString());
      params = params.set('BoundingBox[minY]', boundingBox.Min.Lat.toString());
      params = params.set('BoundingBox[maxX]', boundingBox.Max.Lng.toString());
      params = params.set('BoundingBox[maxY]', boundingBox.Max.Lat.toString());
    }
    if (filterSelected) params = params.set('FilterSelected', 'True');
    if (predicate) params = params.set('Predicate', JSON.stringify(predicate));
    if (projection) params = params.set('Projection', JSON.stringify(projection));
    if (selectedIds) params = params.set('SelectedIds', JSON.stringify(selectedIds));
    if (sort && sort.length) {
      sort.forEach((_s, index) => {
        params = params.set(`Sort[${index}][ColumnName]`, _s.columnName);
        params = params.set(`Sort[${index}][SortDirection]`, _s.sortDirection);
      })
    }
    params = params.set('source', source.toString());
    params = params.set('ownerId', owner);
    if (isCountQuery) {
      return this.httpService.post(`DataPackage/CountQuery/${id}/Default`, params).pipe(map(data => ({ totalHits: data.totalHits })));
    }
    return this.httpService.post(`DataPackage/Query/${id}/Default`, params);
  }

  getGetColumnStatistics(layerId: string, fieldName: string, filter: IFilter = null): Observable<ColumnStatistics> {
    const filterKey = filter ? filter.name : '';
    const _fieldName = encodeURIComponent(fieldName)
    const key = `${layerId}_${_fieldName}_${filterKey}`;

    const layer = this.layerService.layerStore.get(layerId);

    let params = new HttpParams();
    params = params.set('Predicate', JSON.stringify(LayerDataService.getPredicate(filter, layer, true)));
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    if (!this.columnStatistics[key]) {
      this.columnStatistics[key] = new ReplaySubject(1);
      this.httpService.post(`DataPackage/GetColumnStatistics/${layerId}/Default/${_fieldName}`, params)
        .subscribe((data: ColumnStatistics) => {
          this.columnStatistics[key].next(data);
        });
    }

    return this.columnStatistics[key];
  }


  savePicklistEntry(isAdd: boolean, layerId: string, entry: PicklistEntry) {
    if (!layerId) {
      return null;
    }
    let source: Observable<any>;
    const layer = this.layerService.layerStore.get(layerId);

    let params = new HttpParams();
    params = params.set('Field', entry.Field);
    params = params.set('ValueFormat', entry.ValueFormat);
    params = params.set('ValueDescription', entry.ValueDescription);
    params = params.set('ValueOrder', entry.ValueOrder.toString());
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    if (isAdd) {
      source = this.httpService.post(`DataPackage/AddPicklistEntry/${layerId}/Default`, params)
    } else {
      // Only the ValueDescription & ValueOrder can be edited (Not the Field or ValueFormat)
      source = this.httpService.post(`DataPackage/UpdatePicklistEntry/${layerId}/Default`, params)
    }

    return source
  }

  deletePicklistEntry(layerId: string, entry: PicklistEntry) {
    if (!layerId) {
      return null;
    }

    const source = new Subject();
    let params = new HttpParams();
    params = params.set('Field', entry.Field);
    params = params.set('ValueFormat', entry.ValueFormat);

    const layer = this.layerService.layerStore.get(layerId);
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    return this.httpService.post(`DataPackage/DeletePicklistEntry/${layerId}/Default`, params);
  }

  deletePicklistCache(layerId, fieldName, filterValue = '', filterKey = '', joinColumnName = '') {
    const key = `${layerId}_${fieldName}_${filterValue}_${filterKey}_${joinColumnName}`;
    delete this.picklistEntries[key];
  }
  getPicklistEntries(
    layer: ILayer,
    fieldName: string,
    filterValue: string = '',
    filter: IFilter = null,
    joinColumnName: string = ''
  ): Observable<{ description: string, value: any, parentValue: string, joinColumnValue: any }[]> {
    const filterKey = filter ? filter.name : '';
    const key = `${layer.id}_${fieldName}_${filterValue}_${filterKey}_${joinColumnName}`;

    let params = new HttpParams();
    params = params.set('Predicate', JSON.stringify(LayerDataService.getPredicate(filter, layer, true)));
    // console.log(key, layer, filter);
    if (joinColumnName) {
      params = params.set('joinColumnName', joinColumnName.toString());
    }
    let callRequest: boolean = false;
    if (!this.picklistEntries[key] || (filter && filter.isUpdated) || this.picklistEntries[key].hasError) {
      callRequest = true;
    }
    if (this.picklistEntries[key]) {
      const data = this.picklistEntries[key].getValue();
      if (data && data.hasDuplicates) {
        callRequest = true;
      }
    }
    if (callRequest) {
      if (filter && filter.isUpdated) {
        filter.isUpdated = false;
      }
      this.picklistEntries[key] = new BehaviorSubject<any>(null);
    }
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    const _request = this.httpService.post(`DataPackage/GetPicklistEntries/${layer.id}/Default/${fieldName}/${filterValue === null ? '' : filterValue}`, params)
      .pipe(
        map((_: any) => {
          const columnDef = layer.columns.find(column => column.id === fieldName);

          const data = _.elements.sort((a, b) => {
            if (a.valueOrder > b.valueOrder) {
              return 1;
            }
            if (a.valueOrder < b.valueOrder) {
              return -1;
            }
            return 0;
          });

          if (columnDef && columnDef.type === ILayerColumnType.DATE) {
            data.forEach((item: any) => {
              item.description = new Date(item.value).toLocaleDateString('en-GB');
            });
          }
          if (joinColumnName) {
            data.forEach((item: any) => {
              item.value = 'join_' + item.value;
            });
          }
          return {
            ..._,
            data
          };
        }),
        tap(data => { this.picklistEntries[key].next(data); }),
        catchError(err => { this.picklistEntries[key].error(err); return throwError(err) })
      )
    return this.picklistEntries[key].asObservable().pipe(
      first(),
      concatMap((data: any) => {
        if (data) {
          return of(data);
        } else {
          return _request;
        }
      }),
      map(e => {
        return e.data;
      })
    )
  }

  getOrginalPicklistEntries(
    layer: ILayer,
    fieldName: string,
    filterValue: string = '',
    filter: IFilter = null,
    joinColumnName: string = '') {
    const filterKey = filter ? filter.name : '';
    const key = `${layer.id}_${fieldName}_${filterValue}_${filterKey}_${joinColumnName}`;
    return this.picklistEntries[key].getValue();
  }

  downloadData(layer: ILayer, filter: IFilter, filterByMap: boolean,
    pinSelected: boolean, pageNumber: number = 0, pageSize: number = 25, isXlsxDownload: boolean, isShpDownload: boolean, isShowGroup: boolean) {

    if (!layer) {
      this.downloadLayerDataSource.next({ count: 0, file: null });
      return null;
    }

    let params = new HttpParams();
    params = params.set('Projection', JSON.stringify(LayerDataService.getProjection(layer, filter, layer.schema, isShpDownload)));
    params = params.set('Predicate', JSON.stringify(LayerDataService.getPredicate(filter, layer, true)));

    params = params.set('PageSize', pageSize.toString());
    params = params.set('PageNumber', pageNumber.toString());
    params = params.set('IsColumnGroup', isShowGroup.toString());
    if (filterByMap) {
      const bounds = this.mapService.getBounds();
      params = params.set('BoundingBox[minX]', bounds.getSouthWest().lng().toString());
      params = params.set('BoundingBox[minY]', bounds.getSouthWest().lat().toString());
      params = params.set('BoundingBox[maxX]', bounds.getNorthEast().lng().toString());
      params = params.set('BoundingBox[maxY]', bounds.getNorthEast().lat().toString());
    }

    params = params.set('Sort[0][ColumnName]', filter.sortColumn);
    params = params.set('Sort[0][SortDirection]', filter.sortDirection);

    if (pinSelected) {
      const selected = this.selectionService.selectionStore.get(layer.id);
      if (selected && selected.size > 0) {
        params = params.set('SelectedIds', JSON.stringify(Array.from(selected.values())));
      }
    }

    params = params.set('Filename', layer.name);

    if (isXlsxDownload) {
      params = params.set('IsXlsxDownload', 'True');
    } else if (isShpDownload) {
      params = params.set('IsShpDownload', 'True');
    }

    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    return this.httpService.post(`DataPackage/Download/${layer.id}/Default`, params);

  }

  downloadDatapackageCode(layerId: string) {
    return this.httpService.downloadFile(`/api${API_BASE_HREF}DumpDataPackage/CodeDump/${layerId}`);
  }

  // service for requesting Geoms outside of viewport (where shapes have been removed)
  getLayerDataGeomsForSelectedRecords(layer: ILayer) {

    if (!layer) {
      this.insightSelectionLayerDataSource.next({ count: 0, results: null });
      return null;
    }

    const selected = this.selectionService.selectionStore.get(layer.id);

    if (selected && selected.size > 0) {

      const projection = LayerDataService.getNameAndShapeProjections(layer, layer.schema);
      const predicate = [];
      const pageSize = selected.size;
      const pageNumber = 0;
      const selectedIds = Array.from(selected.values());
      const filterSelected = true;

      return this.getLayerDataOrigin(layer, { projection, predicate, pageSize, pageNumber, selectedIds });
    }
    return observableOf([]);
  }


  getLayerInfoWithFilter(layer: ILayer, filter: IFilter, pageNumber: number = 0, pageSize: number = 25) {
    let result;
    try {
      result = {
        'Projection': JSON.stringify(LayerDataService.getProjection(layer, filter, layer.schema, true)),
        'Predicate': JSON.stringify(LayerDataService.getPredicate(filter, layer, true)),
        'PageSize': pageSize,
        'PageNumber': pageNumber,
        'Sort': [{
          ColumnName: filter.sortColumn,
          SortDirection: filter.sortDirection
        }],
        'dataPackageId': layer.id,
        'gridHeader': filter.displayColumns.map(e => {
          let col = layer.columns.find(c => c.id == e)
          if (col) {
            return {
              columnShortId: col.id,
              columnValue: col.name
            }
          }
          return null
        }).filter(e => e)
      }
    } catch (error) {
    }
    return result
  }

  getLayerDataSelectedRecords(layer: ILayer) {

    const filter = this.filterService.createDefaultFilter(layer, true);

    const selected = this.selectionService.selectionStore.get(layer.id);
    if (selected && selected.size > 0) {
      const query = this.buildQueryRequest(layer, filter, false, true, 0, Number(selected.size), null, true, true);
      return this.getLayerDataOrigin(layer, query);
    }
    return observableOf([]);
  }

  buildQueryRequest(layer: ILayer, filter: IFilter, filterByMap: boolean, pinSelected: boolean,
    pageNumber: number = 0, pageSize: number = 25, sortColumnId: string, sortDirectionAsc: boolean, filterSelected: boolean = false): any {
    if (!layer) {
      this.layerDataSource.next({ results: null, notSetWidth: true });
      return null;
    }
    const direction = sortDirectionAsc ? 'ASC' : 'DESC';
    const projection = LayerDataService.getProjection(layer, filter, layer.schema);
    const predicate = LayerDataService.getPredicate(filter, layer, true);
    const query: QueryRequest = {
      projection,
      predicate,
      pageSize,
      pageNumber,
      sort: [{
        columnName: sortColumnId ? sortColumnId : filter.sortColumn,
        sortDirection: sortDirectionAsc === null ? filter.sortDirection : direction
      }]
    }
    if (filterByMap) {
      const bounds = this.mapService.getBounds();
      query.boundingBox = {
        Min: {
          Lng: bounds.getSouthWest().lng(),
          Lat: bounds.getSouthWest().lat()
        },
        Max: {
          Lng: bounds.getNorthEast().lng(),
          Lat: bounds.getNorthEast().lat()
        }
      }
    }
    if (pinSelected || filterSelected) {
      const selected = this.selectionService.selectionStore.get(layer.id);
      if (selected && selected.size > 0) {
        query.selectedIds = Array.from(selected.values());
      }
      if (filterSelected)
        query.filterSelected = true;
    }
    return query;
    // return this.getLayerDataOrigin(layer.id, query);
  }

  getLayerData(layer: ILayer, filter: IFilter, filterByMap: boolean, pinSelected: boolean,
    pageNumber: number = 0, pageSize: number = 25, sortColumnId: string, sortDirectionAsc: boolean, filterSelected: boolean = false, isUpdateCount = true): any {
    const idColumn = layer.columns.find(column => column.isIdentifier).id;
    const query = this.buildQueryRequest(layer, filter, filterByMap, pinSelected, pageNumber, pageSize, sortColumnId, sortDirectionAsc, filterSelected);
    const getGridData$ = this.getLayerDataOrigin(layer, query).pipe(
      map(
        (items: { results: any[] }) => {
          // TODO hack make all idColumns as Strings in server side
          if (items.results) {
            const result = items.results.map((x: any) => {
              x[idColumn] = x[idColumn].toString();
              return x;
            });
            this.layerDataSource.next({
              results: result,
              notSetWidth: false
            });
            return { results: result };
          }
          else {
            this.layerDataSource.next({ results: null, notSetWidth: true });
            //console.log(items);
          }
          return null;
        },
        e => {
          this.layerDataSource.next({ results: null, notSetWidth: true });
          return observableThrowError(e);
        }));
    if (isUpdateCount) {
      this.layerDataCountSource.next({ count: 0, isLoading: true });
      const getCount$ = this.getLayerDataOrigin(layer, query, true).pipe(
        map((_data: { totalHits: number }) => {
          const { totalHits } = _data;
          this.layerDataCountSource.next({ count: totalHits, isLoading: false });
          return totalHits;
        })
      );
      return forkJoin(getGridData$, getCount$)
    }
    return getGridData$;
  }

  getStreetView(layerId: string, recordId: string, coordinates = null) {
    if (layerId.startsWith('__')) {
      return observableOf({
        'results': {
          'geom': {
            'type': 'Point',
            'coordinates': coordinates
          },
          'fov': 150,
          'heading': 0,
          'pitch': 0
        }
      });
    } else {
      let params = new HttpParams();
      params = params.set('DeleteId', recordId);
      const layer = this.layerService.layerStore.get(layerId);
      params = params.set('source', layer.source.toString());
      params = params.set('ownerId', layer.owner);
      return this.httpService.post(`DataPackage/GetStreetView/${layerId}/Default`, params);
    }
  }

  updateStreetView(payload: StreetviewMarker) {
    payload.zoom = parseInt((180 / Math.pow(2, payload.zoom)) + '', 10);
    payload.pitch = parseInt(payload.pitch + '', 10);
    payload.heading = parseInt(payload.heading + '', 10);
    const layer = this.layerService.layerStore.get(payload.layerId);
    return this.httpService.postJSON(`DataPackage/UpdateStreetView/${payload.layerId}/Default/${payload.shapeId}?source=${layer.source}&userId=${layer.owner}`, payload);
    // return Observable.of(payload);
  }

  batchSaveLayerData(layer: ILayer, columnNames: string[], columnValues: string[], selectedIds: string[]) {
    if (!layer) {
      this.layerDataSource.next({ results: [], notSetWidth: true });
      return null;
    }
    const _source = new Subject();

    let params = {};
    params['ColumnNames'] = JSON.stringify(Array.from(columnNames.values()));
    params['ColumnValues'] = JSON.stringify(Array.from(columnValues.values()));
    params['SelectedIds'] = JSON.stringify(Array.from(selectedIds.values()));
    const { source, owner } = layer

    this.httpService.postJSON(`DataPackage/BatchUpdate/${layer.id}/Default?source=${source}&ownerId=${owner}`, params).subscribe(
      response => {
        _source.next(response);
        _source.complete();
      }, e => {
        _source.error(observableThrowError(e.error));
      });

    return _source.asObservable();
  }


  saveLayerData(isAdd: boolean, layer: ILayer, columnNames: string[], columnValues: string[]) {
    if (!layer) {
      this.layerDataSource.next({ results: [], notSetWidth: true });
      return null;
    }
    const source = new Subject();

    let params = new HttpParams();
    params = params.set('ColumnNames', JSON.stringify(Array.from(columnNames.values())));
    params = params.set('ColumnValues', JSON.stringify(Array.from(columnValues.values())));
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    if (isAdd) {
      this.httpService.post(`DataPackage/Add/${layer.id}/Default`, params).subscribe(
        response => {
          source.next(response);
        }, e => {
          source.error(e);
        });
    } else {
      this.httpService.post(`DataPackage/Update/${layer.id}/Default`, params).subscribe(
        response => {
          source.next(response);
        }, e => {
          source.error(e);
        });
    }

    return source.asObservable();
  }

  deleteLayerData(layerId: string, recordId: string) {
    let params = new HttpParams();
    params = params.set('DeleteId', recordId);
    const layer = this.layerService.layerStore.get(layerId);
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    return this.httpService.post(`DataPackage/Delete/${layerId}/Default`, params);
  }

  getLayerDocuments(layerId: string, recordId: string) {
    let params = new HttpParams();
    params = params.set('id', recordId);
    const layer = this.layerService.layerStore.get(layerId);
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    return this.httpService.post(`Document/GetDocuments/${layerId}/Default`, params);
  }

  removeLayerDocument(layerId: string, recordId: string, file: string) {
    let params = new HttpParams();
    params = params.set('id', recordId);
    params = params.set('file', file);
    const layer = this.layerService.layerStore.get(layerId);
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    return this.httpService.post(`Document/RemoveDocument/${layerId}/Default`, params);
  }

  saveLayerDocument(layerId: string, recordId: string, description: string, file: string) {
    let params = new HttpParams();
    params = params.set('id', recordId);
    params = params.set('description', description);
    params = params.set('file', file);
    const layer = this.layerService.layerStore.get(layerId);
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    return this.httpService.post(`Document/Complete/${layerId}/Default`, params);
  }

  copyLayerData(layerId: string, recordId: string, Build_Type: string = null) {
    let params = new HttpParams();
    params = params.set('DeleteId', recordId);
    params = params.set('Build_Type', Build_Type);
    const layer = this.layerService.layerStore.get(layerId);
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    return this.httpService.post(`DataPackage/Copy/${layerId}/Default`, params);
  }

  // DM: Morrisons specific function
  makeStoreExtensionTrading(layerId: string, recordId: string) {
    let params = new HttpParams();
    params = params.set('DeleteId', recordId);
    const layer = this.layerService.layerStore.get(layerId);
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    return this.httpService.post(`DataPackage/MakeStoreExtensionTrading/${layerId}/Default`, params);
  }

  getRecordDetail(layer: ILayer, activeRowId: any) {
    if (!layer) {
      return throwError(createSimpleError('Something went wrong'));
    }
    const query: QueryRequest = {
      projection: LayerDataService.getAllProjections(layer, layer.schema),
      predicate: [],
      pageSize: 1,
      pageNumber: 0,
      selectedIds: activeRowId !== null ? [activeRowId] : [],
      filterSelected: true
    }
    return this.getLayerDataOrigin(layer, query).pipe(map((e: { totalHits: number, results: ILayerData }) => {
      return {
        detail: e.results[0]
      }
    }))
  }

  getEditLayerData(layer: ILayer, activeRowId: any) {
    if (!layer) {
      this.editLayerDataSource.next({ results: null });
      return null;
    }

    let params = new HttpParams();
    params = params.set('Projection', JSON.stringify(LayerDataService.getAllProjections(layer, layer.schema)));
    params = params.set('Predicate', '[]'); // JSON.stringify(LayerDataService.getPredicate(layer)));

    params = params.set('PageSize', '1');
    params = params.set('PageNumber', '0');

    if (activeRowId !== null) {
      const selected = this.selectionService.selectionStore.get(layer.id);
      // if (selected && selected.size > 0) {
      params = params.set('SelectedIds', JSON.stringify([activeRowId]));
      // }
    }
    const query: QueryRequest = {
      projection: LayerDataService.getAllProjections(layer, layer.schema),
      predicate: [],
      pageSize: 1,
      pageNumber: 0,
      selectedIds: activeRowId !== null ? [activeRowId] : [],
      filterSelected: true

    }
    return this.getLayerDataOrigin(layer, query)
      .subscribe((items: { results: ILayerData[] }) => {
        this.editLayerDataSource.next({
          results: items.results,
          shapeId: activeRowId
        });
      });
  }

  getEditLayerDatasSelected(layer: ILayer): Observable<any> {
    if (!layer) {
      this.editLayerDataSource.next({ results: null });
      return null;
    }
    const query: QueryRequest = {
      projection: LayerDataService.getAllProjections(layer, layer.schema),
      predicate: [],
      pageSize: 25,
      pageNumber: 0,
      filterSelected: true
    }
    const selected = this.selectionService.selectionStore.get(layer.id);
    if (selected && selected.size > 0) {
      query.selectedIds = Array.from(selected.values());
      query.pageSize = selected.size;
    }

    return this.getLayerDataOrigin(layer, query)
  }

  splitRecord(polygon: OverlayShapePolygon, line: google.maps.Polyline) {

    let params = new HttpParams();
    const bisectionLine = {
      type: 'LineString',
      coordinates: line.getPath().getArray().map(x => [x.lng(), x.lat()])
    };
    params = params.set('SourceGeometry', JSON.stringify(bisectionLine));
    params = params.set('TargetId', polygon.id);
    const layer = this.layerService.layerStore.get(polygon.overlayId);
    params = params.set('source', layer.source.toString());
    params = params.set('ownerId', layer.owner);
    return this.httpService.post(`DataPackage/Split/${polygon.overlayId}/Default`, params);

  }

  // DM: Need filter adding in.
  getNearestLayerData(layer: ILayer, filter: IFilter, pageSize: number, points: google.maps.LatLng[], travelMode: string) {
    if (!layer) {
      // this.nearestLayerDataSource.next({ results: null });
      return of(null);
    }

    const subscriptions: Observable<any>[] = [];
    points.forEach(point => {

      let params = new HttpParams();

      // @TR - I think we want to get all the columns here, not just ID & Name?
      // params = params.set('Projection', JSON.stringify(LayerDataService.getNameAndShapeProjections(layer, layer.schema)));
      params = params.set('Projection', JSON.stringify(LayerDataService.getProjection(layer, filter, layer.schema, true)));
      // params = params.set('Predicate', '[]');
      params = params.set('Predicate', JSON.stringify(LayerDataService.getPredicate(filter, layer, true)));
      params = params.set('PageSize', pageSize.toString());
      params = params.set('PageNumber', '0');
      params = params.set('Centroid[x]', point.lng().toString());
      params = params.set('Centroid[y]', point.lat().toString());
      params = params.set('Centroid[zoomLevel]', this.mapService.map.getZoom().toString());
      params = params.set('TravelMode', travelMode);
      params = params.set('source', layer.source.toString());
      params = params.set('ownerId', layer.owner);
      subscriptions.push(this.httpService.post(`DataPackage/GetNearest/${layer.id}/Default`, params));
    });

    return forkJoin(subscriptions).pipe(map(data => {
      const items = data.map((res, index) => {
        const {results} = res;
        const filtered = results.sort((a: any, b: any) => {
          if (a['DistanceOrder'] > b['DistanceOrder']) {
            return 1;
          }
          if (a['DistanceOrder'] < b['DistanceOrder']) {
            return -1;
          }
          return 0;
        }).slice(0, pageSize);
        return filtered.map((x: any, i) => {
          return {
            ...x,
            _LABEL: `${String.fromCharCode(97 + index).toUpperCase()}${i+1}`
          }
        });
      })
      return items.reduce((a,b)=>[...a,...b]).sort((a: any, b: any) => {
        if (a['DistanceOrder'] > b['DistanceOrder']) {
          return 1;
        }
        if (a['DistanceOrder'] < b['DistanceOrder']) {
          return -1;
        }
        return 0;
      });
    }));
  }

  getColumnValueDistribution(layerId: string, columnId: string, divideNumber: number = 100): Observable<any> {

    const key = `${layerId}_${columnId}_${divideNumber}`;
    const layer = this.layerService.layerStore.get(layerId);
    const { source, owner} = layer;
    if (!this.columnDivide[key]) {
      this.columnDivide[key] = new ReplaySubject(1);
      this.httpService.get(`DataPackage/GetNumericFieldTiles/${layerId}/Default/${encodeURI(columnId)}?numTiles=${divideNumber - 1}&source=${source}&ownerId=${owner}`)
        .subscribe((data: ColumnDivide) => {
          const stepObject = {};
          data.Tiles.forEach((x: any) => {
            stepObject[x.Tile] = x.Count;
          });
          const step = (data.Max - data.Min) / divideNumber;
          const steps: Array<any> = Array(divideNumber).fill({
            x: 0,
            y: 0,
            nextStep: 0
          }).map((x, i) => ({
            x: data.Min + step * i,
            y: stepObject[i],
            nextStep: i == divideNumber ? data.Max : (data.Min + step * (i + 1)),
            index: i,
            divideNumber: divideNumber
          }));
          this.columnDivide[key].next({
            min: data.Min,
            max: data.Max,
            steps: steps,
            step: step,
            sd: data.SD
          });
        });
    }
    return this.columnDivide[key].pipe(first());
  }

  getNewRetailerId(): Observable<string> {
    return this.httpService.get('Retailer/GetMaxRetailerNumber').pipe(map(e => e.Count))
  }
}
