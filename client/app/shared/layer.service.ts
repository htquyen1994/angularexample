import { throwError as observableThrowError, Observable, ReplaySubject, Subject, Observer, observable, BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import { ClientCache } from './ClientCache';
import { MapService } from './map.service';
import { getGoogleBounds } from './map-utils/shapes';
import { HttpService } from './http.service';
import { LayerType, LayerJoinType, ILayerColumnType, ILayerColumnTypeLong, LayerCreationMethod } from './enums';
import { HttpParams } from '@angular/common/http';
import { ISelectItem, ILayer, IFeatureBoundsRequest, ILayerCreate, AclEntry, ShareResult, UnShareResult, ILayerColumn, ResponseLayerFieldType, ResponseLayerGroup, ResponseLayer, ResponseLayerField, ResponseLayerJoin, convertFromILayerColumnTypeLong, convertToILayerColumnType } from './interfaces';
import { IDataPackage, IField, Field, DataTypeFlags, DataPackageSource } from './Data/Packaging';
import { isNumericInt, DEFAULT_ZOOM_BUFFER, DEFAULT_ZOOM_RENDER, DEFAULT_ZOOM_RENDER_POLYGONS } from './global';
import { LayerBundle } from './layerBundle';
import { IBufferTile } from '../iface/IBufferTIle';
import { LayerSource } from './LayerSource';

export class IJoinRequest {
  file: string;
  layerId: number;
  selectFields: ISelectItem[];
  left: IJoin;
  right: IJoin;
}

export class IJoin {
  DataPackageId: string;
  DataView: string;
  JoinOn: string;
  Replace: string;
  ReplaceWith: string;
  Alias: string;
  Source: LayerSource;
  OwnerId: string;
}
@Injectable()
export class LayerService {
  private layerSelectedSource = new ReplaySubject<ILayer>();
  private layerActiveSource = new ReplaySubject<ILayer>(1);
  private layerDeleteSource = new Subject<ILayer>();
  private layerSource = new ReplaySubject<ILayer[]>();
  private layerRefreshSrouce = new Subject<ILayer>();

  public layerSelectedStore: Set<ILayer> = new Set<ILayer>();
  public layerSelected = this.layerSelectedSource.asObservable();
  public layerUpdated$ = new Subject<{ layer: ILayer, user: string, updatedShapeIds: any }>();
  public layerActiveStore: ILayer = null;
  public layerActive = this.layerActiveSource.asObservable();
  public layerDelete = this.layerDeleteSource.asObservable();
  public layerStore = new Map<string, ILayer>();
  public layer = this.layerSource.asObservable();
  public layerRefresh = this.layerRefreshSrouce.asObservable();

  constructor(private httpService: HttpService, private mapService: MapService) {
  }

  public setLayerActive(layer: ILayer) {
    this.layerActiveSource.next(layer);
  }

  public setLayers(layers: ILayer[]) {
    this.layerSource.next(layers);
  }

  public getLayer(id) {
    return this.layerStore.get(id);
  }

  public getDataPackageList(): Observable<IDataPackage[]> {
    return this.httpService.get('DataPackageIndex/Dump');
  }

  public convertDatapackageListToILayers(datapackage: IDataPackage[], userId: string): ILayer[] {
    let bundles: Map<string, ILayer[]> = new Map<string, ILayer[]>();

    this.layerStore = new Map<string, ILayer>();
    const layers = datapackage.map(x => {
      const layer = convertToILayer(x, userId);

      if ((x.Metadata.LayerBundleId)) {
        if (!bundles.has(x.Metadata.LayerBundleId)) {
          bundles.set(x.Metadata.LayerBundleId, []);
        }
        layer.bundleId = x.Metadata.LayerBundleId;
        bundles.get(x.Metadata.LayerBundleId).push(layer)
      }
      else {
        this.layerStore.set(layer.id, layer);
      }
      return layer;
    })


    bundles.forEach((lyr, key, pair) => {
      let b = new LayerBundle(lyr);
      this.layerStore.set(key, b);
      layers.push(b);
    })
    return layers;
  }

  public addLayer(layer: ILayer) {
    this.layerStore.set(layer.id, layer);
    this.layerSource.next(Array.from(this.layerStore.values()).filter(e => !(e instanceof LayerBundle)));
  }

  public getGeographyTypeLayers() {
    return this.httpService.get('DataPackageIndex/JoinLayers')
      .pipe(map((layers: any[]) => layers.map(layer => convertToILayer(layer))));
  }

  public getLayerBounds() {
    const { id, source, owner } = this.layerActiveStore;
    return this.httpService.get(`DataPackage/GetBounds/${id}/Default?source=${source}&ownerId=${owner}`)
      .subscribe((data: any) => {
        const bounds: google.maps.LatLngBounds = getGoogleBounds(data.results);
        this.mapService.zoomBounds(bounds);
      });
  }

  public getBounds(latLngs: Array<google.maps.LatLng>) {
    const bounds: google.maps.LatLngBounds = new google.maps.LatLngBounds();
    latLngs.forEach((latLng: google.maps.LatLng) => {
      if (latLng !== null) {
        bounds.extend(latLng);
      }
    });
    this.mapService.zoomBounds(bounds);
  }

  getSelectedBounds(layerId: string, shapeId: string[]) {
    const layer = this.layerStore.get(layerId);
    const { source, owner } = layer;
    return this.httpService.postJSON(`DataPackage/GetFeatureBounds/${layerId}/Default?source=${source}&ownerId=${owner}`, {
      Ids: shapeId,
    });
  }

  public getFeatureBounds(model: IFeatureBoundsRequest) {
    const { id, source, owner } = this.layerActiveStore;
    return this.httpService.postJSON(`DataPackage/GetFeatureBounds/${id}/Default?source=${source}&ownerId=${owner}`, model)
      .subscribe((data: any) => {
        const bounds: google.maps.LatLngBounds = getGoogleBounds(data.results);
        this.mapService.zoomBounds(bounds);
      });
  }

  public setSelectionChange(layer: ILayer) {
    let changed = false;
    if (layer.isSelected) {
      layer.isSelected = true;
      if (!this.layerSelectedStore.has(layer)) {
        this.layerSelectedStore.add(layer);
        changed = true;
      }
    } else {
      layer.isSelected = false;
      if (this.layerSelectedStore.has(layer)) {
        this.layerSelectedStore.delete(layer);
        changed = true;
      }
    }
    if (changed)
      this.layerSelectedSource.next(layer);
  }

  public setActiveLayerById(id: string) {
    const layer = this.getLayer(id);
    if (layer && !this.isActivateLayer(id)) this.setActiveChange(layer);
  }

  public isActivateLayer(layerId: string) {
    if (this.layerActiveStore) return this.layerActiveStore.id === layerId;
    return false
  }

  public setActiveChange(layer: ILayer) {
    // console.log('[DEFAULT LAYER]', layer);
    this.layerActiveStore = layer;
    this.layerActiveSource.next(layer);
  }

  public creteLayerEmpty(model: ILayerCreate) {
    const source = new Subject();
    const data = convertFromILayerCreate(model);
    data.fields = data.modifiedFields;

    this.httpService.postJSON(`DataSchema/CreateEmptySchema`, data).subscribe(_ => {

      const dataPackageId = _.dataPackageId;
      const layerGroupId = _.layerGroupId;
      const owner = _.userId;
      const layerAvailableRequest = {
        layerGroupId,
        dataPackageId,
        owner,
        source: LayerSource.USER
      };

      this.notifyLayerAvailable(layerAvailableRequest).subscribe((available: any) => {
        source.next(available);
      });
    },
      error => {
        source.error(error);
      });

    return source.asObservable();
  }

  public createLayerFile1(model: ILayerCreate) {
    const data = convertFromILayerCreate(model);
    return this.httpService.postJSON(`DataSchema/ReadSchema`, data);
  }

  public createLayerFile2(model: ILayerCreate) {
    const source = new Subject();
    const data = convertFromILayerCreate(model);

    this.httpService.postJSON(`DataSchema/ImportData`, data).subscribe((_: any) => {

      const dataPackageId = _.dataPackageId;
      const layerGroupId = _.layerGroupId;
      const owner = _.userId;
      const layerAvailableRequest = {
        layerGroupId,
        dataPackageId,
        owner,
        source: LayerSource.USER
      };

      // This is needed to notify any watchers (including us) that we have a new layer
      this.notifyLayerAvailable(layerAvailableRequest).subscribe((available: any) => {
        source.next(available);
      });
    },
      error => {
        source.error(error);
      });
    return source.asObservable();
  }

  public createCSV1(model: ILayerCreate) {
    const data = convertFromILayerCreate(model);
    return this.httpService.postJSON(`fileImport/ReadSchema`, data);
  }

  public createCSV2(model: ILayerCreate) {
    const source = new Subject();
    const data = convertFromILayerCreateCSV(model);

    this.httpService.postJSON(`fileImport/Join`, data).subscribe(reponse => {

      const { owner, layerGroupId, dataPackageId } = reponse;
      const layerAvailableRequest = {
        layerGroupId,
        dataPackageId,
        owner,
        source: LayerSource.USER
      };

      this.notifyLayerAvailable(layerAvailableRequest)
        .subscribe(() => source.next(data));
    },
      error => {
        source.error(error);
      });

    return source.asObservable();
  }

  public createCSVLatLng2(model: ILayerCreate) {
    const source = new Subject();
    const data = convertFromILayerCreateCSV(model);

    this.httpService.postJSON(`fileImport/ImportData`, data)
      .subscribe(
        response => {

          const postCodeField = data.modifiedFields.find(function (x) {
            return x.type.attributes.includes('Postcode');
          });

          if (postCodeField) {
            // #mat: I think it might be better if instead of checking if there's a postcode field,
            // it instead checked if there is a lat/lng field? That is the
            // condition for doing the join I imagine

            const joinRequest = this.createGeolytixJoinRequest(response, postCodeField, true);

            this.httpService.postJSON(`fileImport/Join`, joinRequest)
              .subscribe(
                _ => {

                  const { owner, dataPackageId } = _;
                  const { layerGroupId } = data;
                  const layerAvailableRequest = {
                    layerGroupId,
                    dataPackageId,
                    owner,
                    source: LayerSource.USER
                  };
                  // This is needed to notify any watchers (including us) that we have a new layer
                  this.notifyLayerAvailable(layerAvailableRequest)
                    .subscribe(() => source.next(response));
                },
                error => {
                  source.error(observableThrowError(error.error));
                });
          } else {
            const { owner, dataPackageId } = response;
            const { layerGroupId } = data;
            const layerAvailableRequest = {
              layerGroupId,
              dataPackageId,
              owner,
              source: LayerSource.USER
            };

            // This is needed to notify any watchers (including us) that we have a new layer
            this.notifyLayerAvailable(layerAvailableRequest)
              .subscribe(() => source.next(response));
          }
        },
        error => {
          source.error(error);
        });
    return source.asObservable();
  }

  public createGeolytixJoinRequest(response: any, postcodeField: any, isStructuredPostCode: boolean): IJoinRequest {
    const joinRequest = new IJoinRequest();
    joinRequest.selectFields = [];

    joinRequest.layerId = parseInt(response.layer.id, 10);
    joinRequest.file = response.layer.file;

    response.layer.fields.forEach((field: any) => {
      if (field.name !== 'Geom') {
        joinRequest.selectFields.push({ Table: 'l', Field: field.name, Alias: field.name });
      }
    });
    joinRequest.selectFields.push({ Table: 'r', Field: 'Geom', Alias: 'Geom' });
    joinRequest.left = new IJoin();
    joinRequest.left.Alias = 'l';
    joinRequest.left.DataPackageId = response.dataPackageId;
    joinRequest.left.DataView = 'Default';
    joinRequest.left.JoinOn = postcodeField.name;
    if (isStructuredPostCode) {
      joinRequest.left.Replace = ' ';
    } else {
      joinRequest.left.Replace = '';
    }
    joinRequest.left.ReplaceWith = '';

    joinRequest.right = new IJoin();
    joinRequest.right.Alias = 'r';
    joinRequest.right.DataPackageId = '2a0be31c-a3b9-4bb8-a2ba-ba804e1f63ab';
    joinRequest.right.DataView = 'Default';
    joinRequest.right.JoinOn = 'id';
    joinRequest.right.Replace = '';
    joinRequest.right.ReplaceWith = '';

    return joinRequest;
  }

  public copyLayer(model: any) {
    const {id, name, source, owner}= model;
    const params = {
      dataPackageId: id,
      newLayerName: name,
      source,
      owner
    };
    return this.httpService.postJSON(`layer/copy`, params).pipe(
      switchMap(result=>{
        const { dataPackageId, layerGroupId, userId } = result;
        const layerAvailableRequest = {
          layerGroupId: layerGroupId,
          dataPackageId: dataPackageId,
          source: userId,
          owner: LayerSource.USER
        };
        return this.notifyLayerAvailable(layerAvailableRequest)
      })
    )

  }

  public deleteLayer(layer: ILayer) {
    if (layer.isActive) {
      this.setActiveChange(null);
    }

    if (layer.isSelected) {
      layer.isSelected = false;
      this.setSelectionChange(layer);
    }

    this.layerStore.delete(layer.id);
    this.layerDeleteSource.next(layer);
  }

  public deleteLayerServer(params) {
    return this.httpService.postJSON(`DataSchema/DeleteLayer`, params);
  }

  public shareLayer(owner: string, recipients: AclEntry[], dataPackageId, source): Observable<ShareResult> {
    const request = {
      Source: source,
      Owner: owner,
      Recipients: recipients
    };
    return this.httpService.postJSON(`DataPackageShare/Share/${dataPackageId}/Default`, request);
  }

  public unshare(owner: string, usernames: string[], dataPackageId, source): Observable<UnShareResult> {
    const request = {
      Source: source,
      Owner: owner,
      Usernames: usernames,
    };
    return this.httpService.postJSON(`DataPackageShare/Unshare/${dataPackageId}/Default`, request);
  }

  public getLayerUserList(term: string = ''): Observable<any[]> {
    const params = new HttpParams();
    params.set('term', term);
    params.set('page', '0');
    params.set('limit', '1000');
    return this.httpService.get(`User/getUsers?term=${term}&page=0&limit=1000`);
  }

  public getLayerSharedUserList(owner: string, dataPackageId, source): Observable<any[]> {
    const request = {
      Source: source,
      Owner: owner
    };
    return this.httpService.postJSON(`DataPackageShare/ListRecipients/${dataPackageId}/Default`, request);
  }

  public updateLayer(model: any) {
    const { source, owner, id, name, groupId, description } = model;
    const params = {
      dataPackageId: id,
      updatedLayerName: name,
      updatedLayerGroupId: groupId,
      updatedLayerDescription: description,
      source,
      owner
    };

    return this.httpService.postJSON(`Layer/Update`, params);
  }

  public refreshLayer(dataPackageId: string, currentUserId: string): Observable<ILayer> {
    //todo extract bundled layers into into layerBundles
    return Observable.create((observer: Observer<ILayer>) => {
      this.httpService.get('DataPackageIndex/Dump').subscribe(
        (data: IDataPackage[]) => {
          const presentLayer = data.find(_ => _.Id === dataPackageId);
          if (presentLayer) {
            const newLayer = convertToILayer(presentLayer, currentUserId);
            this.layerStore.set(newLayer.id, newLayer);
            this.layerRefreshSrouce.next(newLayer);
            observer.next(newLayer);
            observer.complete();
          } else {
            observer.error(`Can not find existed Layer`);
          }
        }, err => {
          observer.error(err);
        })
    })
  }

  public notifyLayerAvailable(model: { layerGroupId: number, dataPackageId: string }) {
    return this.httpService.postJSON('fileImport/LayerAvailable', model)
  }
}

export function convertToILayer(layer: IDataPackage, currentUserId?: string): ILayer {

  const columnSortbyIndex = (a: ILayerColumn, b: ILayerColumn): number => {
    if (a.groupId === b.groupId) {
      return a.index < b.index ? -1 : 1;
    } else {
      return a.groupId < b.groupId ? -1 : 1;
    }
  };

  const defaultDataView = layer.DataViews['Default'];
  const minZoom = <number>(((<any>defaultDataView).TileCacheSettings) ? (<any>defaultDataView).TileCacheSettings.MinZoomLevel : 14);
  const maxZoom = <number>(((<any>defaultDataView).TileCacheSettings) ? (<any>defaultDataView).TileCacheSettings.MaxZoomLevel : 19);
  let type: LayerType = null;
  let zoomConfig = null;
  const { DatasetShapeType, DatasetOwner } = layer.Metadata;
  switch (DatasetShapeType) {
    case 'Point':
      type = LayerType.POINT;
      zoomConfig = buildZoomConfig(minZoom, maxZoom, true, DEFAULT_ZOOM_RENDER);
      break;
    case 'Line':
      type = LayerType.POLYLINE;
      zoomConfig = buildZoomConfig(minZoom, maxZoom, true, DEFAULT_ZOOM_RENDER_POLYGONS);
      break;
    case 'Polygon':
      type = LayerType.POLYGON;
      zoomConfig = buildZoomConfig(minZoom, maxZoom, true, DEFAULT_ZOOM_RENDER_POLYGONS);
      break;
  }

  if (DatasetOwner && currentUserId && DatasetOwner != currentUserId) {
    layer.Source = DataPackageSource.Shared;
  }

  if (type === null) {
    console.warn('layer type missing', layer.Id, DatasetShapeType);
  }

  let joinType: LayerJoinType = null;

  const data = {
    id: layer.Id,
    apiKey: layer.ProgramaticName,
    name: layer.Metadata.DatasetName,
    owner: layer.Metadata.DatasetOwner,
    defaultDisplay: layer.DefaultDisplay,
    defaultActive: layer.DefaultActive,
    hasInfo: layer.HasInfo,
    showGroupHeaders: layer.ShowGroupHeaders,
    hasInsight: layer.HasInsight,
    minZoom,
    maxZoom,
    minClusteredZoom: <number>(((<any>defaultDataView)
      .TileCacheSettings.MinClusteredZoomLevel === undefined) ?
      null : (<any>defaultDataView).TileCacheSettings.MinClusteredZoomLevel),
    maxClusteredZoom: <number>(((<any>defaultDataView)
      .TileCacheSettings.MaxClusteredZoomLevel === undefined) ?
      null : (<any>defaultDataView).TileCacheSettings.MaxClusteredZoomLevel),
    minHeatmapZoom: <number>(((<any>defaultDataView)
      .TileCacheSettings.MinHeatmapZoomLevel === undefined) ?
      null : (<any>defaultDataView).TileCacheSettings.MinHeatmapZoomLevel),
    maxHeatmapZoom: <number>(((<any>defaultDataView)
      .TileCacheSettings.MaxHeatmapZoomLevel === undefined) ?
      null : (<any>defaultDataView).TileCacheSettings.MaxHeatmapZoomLevel),
    description: layer.Metadata.DatasetDescription,
    type: type,
    joinType: null,
    joinLayerType: layer.JoinLayerType,
    source: <any>layer.Source,
    isEditable: defaultDataView.Security.IsEditable,
    isDownloadable: defaultDataView.Security.IsDownloadable,
    isRestrictedDownloadable: defaultDataView.Security.IsRestrictedDownloadable,
    isSelected: false,
    schema: defaultDataView.Schema,
    clippingGeometryNames: layer.Metadata.DatasetVoronoiClip ?? ["UK"],
    columns: defaultDataView.Schema._fieldsByIndex.map((column: IField) => {
      const attributes: { [name: string]: any } = column.Attributes || {};

      if (attributes['JoinGeographyKey']) {
        switch (attributes['JoinGeographyKey']) {
          case 'Postcode':
            joinType = LayerJoinType.POSTCODE;
            break;
          case 'PostSector':
            joinType = LayerJoinType.POST_SECTOR;
            break;
          case 'CensusOutputArea':
            joinType = LayerJoinType.CENSUS_OUTPUT_AREA;
            break;
          case 'RouteTown':
            joinType = LayerJoinType.ROUTE_TOWN;
            break;
          case 'PostDistrict':
            joinType = LayerJoinType.POST_DISTRICT;
            break;
          case 'PostArea':
            joinType = LayerJoinType.POST_AREA;
            break;
        }
      }

      return <ILayerColumn>{
        id: column.Key,
        type: convertToILayerColumnType(column, attributes),
        name: Field.getDescription(column) || Field.getName(column),
        groupId: Field.getFieldGroup(column),
        required: Field.isCompulsory(column),
        readOnly: Field.isReadonly(column),

        notSortable: Field.isNotSortable(column),
        notSelectable: Field.isNotSelectable(column),
        notFilterable: Field.isNotFilterable(column),
        notComparable: attributes['StatisticalOperations'] === undefined ? true : false,

        minValue: attributes['MinValue'] === undefined ? null : Number(attributes['MinValue']),
        maxValue: attributes['MaxValue'] === undefined ? null : Number(attributes['MaxValue']),
        minLength: attributes['MinLength'] === undefined ? null : Number(attributes['MinLength']),
        maxLength: attributes['MaxLength'] === undefined ? null : Number(attributes['MaxLength']),
        defaultColumnWidth: attributes['DefaultColumnWidth'] === undefined ? null : Number(attributes['DefaultColumnWidth']),

        isLabel: Field.isDefaultName(column),
        isIdentifier: attributes['Identifier'] || false,
        isTextarea: Number(attributes['MaxLength']) >= 500 || attributes['TextArea'] || false,
        isPostcode: attributes['Postcode'] || false,
        isLatitude: attributes['Latitude'] || false,
        isAddress: attributes['Address'] || false,
        isDefaultGeometry: attributes['DefaultGeometry'] || false,
        isLongitude: attributes['Longitude'] || false,
        isPicklist: attributes['CreatePickList'] || false,
        isEditablePicklist: attributes['EditablePickList'] || false,
        isInfo: attributes['InfoDisplayColumn'] || false,
        isPercentage: attributes['IsPercentageFormatted'] || false,
        isUrlFormatted: attributes['IsUrlFormatted'] || false,
        ChildPickListColumnName: attributes['ChildPickListColumnName'] === undefined ? null : attributes['ChildPickListColumnName'],
        isParentPickList: attributes['ParentPickList'] || false,
        isChildPickList: attributes['ChildPickList'] || false,
        isCentroid: attributes['CentroidGeom'] || false,
        isJoinable: attributes['JoinAppended'] || false,
        isColour: attributes['Colour'] || false,
        MatchPercentageField: attributes['MatchPercentageField'] === undefined ? null : attributes['MatchPercentageField'],
        DensityField: attributes['DensityField'] === undefined ? null : attributes['DensityField'],
        format: Array.isArray(attributes['Format']) ? attributes['Format'] : null,
        index: isNumericInt(attributes['Index']) ? parseInt(attributes['Index']) : undefined

      };
    })
      .sort(columnSortbyIndex)
      .map((e, i) => {
        e.isIndexUndefined = i != e.index;
        e.index = i;
        return e
      }), // sort index column
    columnGroups: defaultDataView.Schema.FieldGroups.map(group => {
      group.HasTotal = group.HasTotal || false;
      return group;
    }),
    dataCache: new ClientCache(),
    zoomConfig
  };

  data.joinType = joinType;

  return data;
}

function buildZoomConfig(fromLevel: number, toLevel: number, setupZoomRender = false, zoomRenders: number[]) {
  const result = {};
  let currentBuffer = { ...DEFAULT_ZOOM_BUFFER[5] };

  for (let level = fromLevel; level <= toLevel; level++) {
    if (DEFAULT_ZOOM_BUFFER[level]) {
      currentBuffer = { ...DEFAULT_ZOOM_BUFFER[level] };
    }
    result[level] = { ...currentBuffer };
  }
  if (setupZoomRender) {
    let zoomRender = zoomRenders[0];
    if (zoomRender < fromLevel) {
      zoomRender = fromLevel;
    }
    for (let level = fromLevel; level <= toLevel; level++) {
      if (zoomRenders.includes(level)) {
        zoomRender = level;
      }
      result[level].zoomRender = zoomRender;
    }
  }
  return result
}

function typeOf(value: any) {
  const type = typeof value;

  switch (type) {
    case 'object':
      return value === null ? 'null' : Object.prototype.toString.call(value).match(/^\[object (.*)\]$/)[1];

    case 'function':
      return 'Function';

    default:
      return type;
  }
}


export function convertFromILayerCreate(model: ILayerCreate): ResponseLayer {

  model = Object.assign({}, (<any>model).page1, (<any>model).page2);

  const columnGroups: ResponseLayerGroup[] = [];
  const columns: ResponseLayerField[] = [];

  model.columnGroups.forEach((group: any, groupIndex: number) => {

    group.columns.forEach((column: ILayerColumn) => {
      columns.push({
        id: column.id,
        name: column.name,
        sourceName: column.sourceName,
        sourceIndex: column.sourceIndex,
        sourceLayer: column.sourceLayer,
        type: convertFromILayerColumnTypeLong(column, model.columnIdentifier, model.columnLabel),
        fieldGroupId: groupIndex,
        required: !!column.required
      });
    });

    columnGroups.push({
      fieldGroupId: groupIndex,
      name: group.name
    });
  });

  const joins: ResponseLayerJoin[] = [];

  if ((<any>model).joinLayer) {
    joins.push({
      sourceColumnIndex: (<any>model).joinColumn,
      joinLayerId: (<any>model).joinLayer
    });
  }

  return {
    layerId: model.layerId,
    dataPackageId: model.id,
    file: model.file,
    layerShortName: model.file,
    layerName: model.name,
    layerDescription: model.description,
    layerGroupId: parseInt(<any>model.groupId, 10),
    modifiedFields: columns,
    fieldGroups: columnGroups,
    joins: joins,
    type: model.type,
    isFirstRowHeaders: model.hasHeader
  };
}

export function convertFromILayerCreateCSV(model: ILayerCreate): ResponseCSVLayer {

  model = Object.assign({}, (<any>model).page1, (<any>model).page2);

  const response: ResponseCSVLayer = {
    type: LayerType[LayerType[model.type]],
    layerDescription: model.description,
    layerName: model.name,
    file: model.file,
    layerGroupId: parseInt(<any>model.groupId, 10),
    isFirstRowHeaders: model.hasHeader,
    fieldGroups: [],
    modifiedFields: [],
    left: {
      DataPackageId: model.id,
      DataView: 'Default',
      JoinOn: null,
      Replace: ' ',
      ReplaceWith: ''
    },
    right: {
      DataPackageId: model.method === LayerCreationMethod.POSTCODE ? (<any>model).joinLayer : '2a0be31c-a3b9-4bb8-a2ba-ba804e1f63ab',
      DataView: 'Default',
      JoinOn: null,
      Replace: ' ',
      ReplaceWith: ''
    }
  };

  model.columnGroups.forEach((group: any, groupIndex: number) => {

    group.columns.forEach((column: ILayerColumn, index: number) => {
      response.modifiedFields.push({
        index: index,
        name: column.name,
        sourceName: column.sourceName,
        sourceIndex: column.sourceIndex,
        side: column.sourceLayer === null ? 'LEFT' : 'RIGHT',
        type: convertFromILayerColumnTypeLong(column, model.columnIdentifier, model.columnLabel),
        fieldGroupId: groupIndex,
        required: !!column.required
      });
    });

    response.fieldGroups.push({
      fieldGroupId: groupIndex,
      name: group.name
    });
  });

  if (parseInt((<any>model).joinColumn, 10) >= 0) {
    response.left.JoinOn = model.joinColumnList[(<any>model).joinColumn].sourceName;
  }

  return response;
}

interface ResponseCSVLayer {
  type: string;
  layerDescription: string;
  layerName: string;
  file: string;
  layerGroupId: number;
  isFirstRowHeaders: boolean;
  fieldGroups: ResponseLayerGroup[];
  modifiedFields: ResponseCSVLayerField[];

  left: ResponseCSVJoin;
  right: ResponseCSVJoin;
}

interface ResponseCSVLayerField {
  index: number;
  name: string;
  sourceName: string;
  sourceIndex: number;
  side: string;
  type: ResponseLayerFieldType;
  fieldGroupId: number;
  required: boolean;
}

interface ResponseCSVJoin {
  DataPackageId: string;
  DataView: string;
  JoinOn: string;
  Replace: string;
  ReplaceWith: string;
}
