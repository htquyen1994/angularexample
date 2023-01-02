import { throwError as observableThrowError, zip as observableZip, Subject, Observable, ReplaySubject, BehaviorSubject, combineLatest } from 'rxjs';
import { Injectable } from '@angular/core';

import { color } from 'd3-color';
import { FilterService } from './filter.service';

import { HttpService } from './http.service';
import { MapService } from './map.service';
import { LayerStyle, LayerStyleBasic, LayerStyleCluster } from './layer-style';
import { LayerService } from './layer.service';
import { LayerGroupService } from './layer-group.service';
import { ILayerStyleList, ILayerStyleChange, LayerStyleStore, ILayer, ILayerColourRamp } from './interfaces';
import { LayerDataService } from './layer-data.service';
import { ActionMessageService } from './action-message.service';
import { OverlayAbstract } from './overlay/overlay-abstact';
import { LayerStyleType, ILayerStyleOptsGradient } from './models/layer-style.model';
import { tap, map } from 'rxjs/operators';


@Injectable()
export class LayerStyleService {

  private styleListStore: ILayerStyleList = {};
  private styleSource = new ReplaySubject<ILayerStyleList>(1);
  private styleActiveStore: { [layerId: string]: LayerStyle } = {};
  private styleActiveStoreAll: { [layerId: string]: LayerStyle } = {};
  private styleChangeSource = new Subject<ILayerStyleChange>();
  private tenantColorRampsStore$ = new BehaviorSubject<ILayerColourRamp[]>([]);
  private referenceColorRampsStore$ = new BehaviorSubject<ILayerColourRamp[]>([]);
  private userColorRampsStore$ = new BehaviorSubject<ILayerColourRamp[]>([]);
  private previousActiveStyle: { [layerId: string]: LayerStyle } = {};
  private layers: ILayer[] = [];

  public style = this.styleSource.asObservable();
  public styleChange = this.styleChangeSource.asObservable();
  public colorRampsStore$ = new BehaviorSubject<ILayerColourRamp[]>([]);
  public updateLayerStyles$ = new Subject<{layerId: string}>();
  constructor(private httpService: HttpService,
    private mapService: MapService,
    private layerService: LayerService,
    private filterService: FilterService,
    private layerDataService: LayerDataService,
    private actionMessageService: ActionMessageService,
    private layerGroupService: LayerGroupService) {

    LayerStyle.layerDataService = layerDataService;
    LayerStyle.filterService = filterService;
    this.layerService.layer.subscribe((layers: ILayer[]) => {
      this.layers = layers;
    });
    this.layerService.layerRefresh.subscribe(layer => {
      let index = this.layers.findIndex(e => e.id == layer.id);
      if (index != -1) {
        this.layers[index] = layer;
      }
    })
    this.layerGroupService.groupAdd.subscribe(data => {
      const { layer, groupId } = data;
      const styleList = this.styleListStore[layer.id] || [];
      if (this.styleListStore[layer.id] && (layer.maxClusteredZoom || layer.minClusteredZoom) && !styleList.find(e => e.type === LayerStyleType.CLUSTER)) {
        this.styleListStore[layer.id].push(new LayerStyleCluster('Default Cluster style', true));
      }
      if (this.styleListStore[layer.id] && !(Array.isArray(this.styleListStore[layer.id]) && styleList.filter(e => e.type !== LayerStyleType.CLUSTER).length > 0)) {
        this.styleListStore[layer.id].push(new LayerStyleBasic('Default style', true));
      }
    });
    combineLatest(this.referenceColorRampsStore$.asObservable(), this.tenantColorRampsStore$.asObservable(), this.userColorRampsStore$.asObservable())
      .subscribe(([reference, tenant, user]) => {
        this.colorRampsStore$.next([...reference, ...tenant, ...user]);
      })
  }

  public getActiveStyleLayerIds() {
    return Object.keys(this.styleActiveStore)
  }

  public getStyleListData(data: any) {
    this.styleListStore = {};
    const handler = (response: LayerStyleStore, isEditable) => {

      const result = typeof response === 'object' ? response : {};

      this.layers.forEach(layer => {
        const styleList = Array.isArray(result[layer.id]) ? result[layer.id] : [];
        this.styleListStore[layer.id] = Array.isArray(this.styleListStore[layer.id]) ? this.styleListStore[layer.id] : [];
        styleList.forEach(style => {
          this.styleListStore[layer.id].push(
            LayerStyle.factory(style.type, style.name, isEditable, style.opts)
          );
        });
      });
    };

    handler(data[0], true);
    handler(data[1], true);
    handler(data[2], false);

    this.layers
      .filter(layer => !(Array.isArray(this.styleListStore[layer.id]) && this.styleListStore[layer.id].filter(e => e.type !== LayerStyleType.CLUSTER).length > 0))
      .forEach(layer => {
        this.styleListStore[layer.id] = [new LayerStyleBasic('Default style', true)];
      });
    this.layers
      .filter(layer => (layer.maxClusteredZoom || layer.minClusteredZoom) && !this.styleListStore[layer.id].find(e => e.type === LayerStyleType.CLUSTER))
      .forEach(layer => {
        this.styleListStore[layer.id].push(new LayerStyleCluster('Default Cluster style', true));
      });
    this.styleSource.next(this.styleListStore);
  }

  public getStyleList() {
    const source = new ReplaySubject<any[]>(1);
    observableZip(
      this.httpService.get(`TenantSettings/?settingCollection=styles&settingName=styles`),
      this.httpService.get(`ReferenceDataSettings/?settingCollection=styles&settingName=styles`))
      .subscribe(
        data => {
          source.next(data);
        },
        error => {
          return observableThrowError(error);
        });

    return source;
  }

  public getUserStyles(layerId?: string) {
    return this.httpService.get(`UserSettings/?settingCollection=styles&settingName=styles`).pipe(
      map(e => layerId ? e[layerId] : e)
    )
  }

  public saveStore(layerId: string, styles: LayerStyle[], currentStyle: LayerStyle) {

    this.styleListStore[layerId] = styles;

    const styleList: ILayerStyleList = {};
    Object.keys(this.styleListStore).forEach(styleLayerId => {
      styleList[styleLayerId] = this.styleListStore[styleLayerId].filter(style => !style.isDefault);
    });

    if (currentStyle && currentStyle.opts.isDefault) {
      if (currentStyle.type === LayerStyleType.CLUSTER) {
        styleList[layerId]
          .filter(style => style !== currentStyle && style.type === LayerStyleType.CLUSTER)
          .forEach(style => style.opts.isDefault = false);
      } else {
        styleList[layerId]
          .filter(style => style !== currentStyle && style.type !== LayerStyleType.CLUSTER)
          .forEach(style => style.opts.isDefault = false);
      }
    }

    this.httpService.postJSON('UserSettings/?settingCollection=styles&settingName=styles', styleList).subscribe(() => {
    });
  }

  public updateStyleStore(layerId: string, styles: LayerStyle[], currentStyle: LayerStyle){
    this.styleListStore[layerId] = styles;

    const styleList: ILayerStyleList = {};
    Object.keys(this.styleListStore).forEach(styleLayerId => {
      styleList[styleLayerId] = this.styleListStore[styleLayerId].filter(style => !style.isDefault);
    });

    if (currentStyle && currentStyle.opts.isDefault) {
      if (currentStyle.type === LayerStyleType.CLUSTER) {
        styleList[layerId]
          .filter(style => style !== currentStyle && style.type === LayerStyleType.CLUSTER)
          .forEach(style => style.opts.isDefault = false);
      } else {
        styleList[layerId]
          .filter(style => style !== currentStyle && style.type !== LayerStyleType.CLUSTER)
          .forEach(style => style.opts.isDefault = false);
      }
    }
    return this.httpService.postJSON('UserSettings/?settingCollection=styles&settingName=styles', styleList)
  }

  public addStyleObs(layerId: string, addStyle: LayerStyle, currentStyle: LayerStyle) {
    const styles = this.styleListStore[layerId] || [];
    return this.updateStyleStore(layerId, [...styles, addStyle], currentStyle).pipe(tap((res)=>{
      if (currentStyle) {
        const styleList = this.getStyleListByLayerId(layerId);
        if (styleList.find(e => e == currentStyle)) {
          this.styleActiveStore[layerId] = currentStyle;
        }
      }
    }))
  }

  public addOrUpdateStylesByLayerId(layerId: string, _styles: LayerStyle[], isEditable){
    this.styleListStore[layerId] = Array.isArray(this.styleListStore[layerId]) ? this.styleListStore[layerId] : [];
    const userStyles = _styles.map(style => {
      return LayerStyle.factory(style.type, style.name, isEditable, style.opts)
    });
    const tenantStyles = this.styleListStore[layerId].filter(e=>e.isDefault);
    this.styleListStore[layerId] = [...tenantStyles, ...userStyles];
    this.updateLayerStyles$.next({layerId})
  }

  public addStyle(layerId: string, addStyle: LayerStyle, currentStyle: LayerStyle) {
    const styles = this.styleListStore[layerId] || [];
    this.saveStore(layerId, [...styles, addStyle], currentStyle);
    this.setStyleListByLayerId(layerId);
    if (currentStyle) {
      const styleList = this.getStyleListByLayerId(layerId);
      if (styleList.find(e => e == currentStyle)) {
        this.styleActiveStore[layerId] = currentStyle;
      }
    }
  }

  public deleteStyle(layerId: string, deleteStyle: LayerStyle, currentStyle: LayerStyle) {
    const styles = this.styleListStore[layerId];
    this.saveStore(layerId, styles.filter(e => e != deleteStyle), currentStyle);
    if (currentStyle)
      this.styleActiveStore[layerId] = currentStyle;
  }

  public updateStyle(layerId: string, style: LayerStyle, updateStyle: LayerStyle, currentStyle: LayerStyle) {
    const styles = this.styleListStore[layerId];
    const index = styles.findIndex(e => e == style);
    if (index != -1) {
      styles[index] = updateStyle;
    }
    this.saveStore(layerId, styles, currentStyle);
    this.setStyleListByLayerId(layerId);
    if (currentStyle) {
      const styleList = this.getStyleListByLayerId(layerId);
      if (styleList.find(e => e == currentStyle)) {
        this.styleActiveStore[layerId] = currentStyle;
      }
    }
  }

  public copyToTenant(layerId: string, style: LayerStyle) {
    this.httpService.get('TenantSettings/?settingCollection=styles&settingName=styles').subscribe(styles => {

      if (!styles[layerId]) {
        styles[layerId] = [];
      }
      styles[layerId].push(style);
      this.httpService.postJSON('TenantSettings/?settingCollection=styles&settingName=styles', styles)
        .subscribe(() => {
          this.actionMessageService.sendInfo('copy style to tenant');
        });
    });
  }

  public getDefaultStyle() {
    return LayerStyle.factory(LayerStyleType.BASIC, 'Style', true);
  }

  public getDefaultClusterStyle() {
    return LayerStyle.factory(LayerStyleType.CLUSTER, 'Default Cluster Style', true);
  }

  public getDefaultGradientStyle() {
    const colorRamps = this.colorRampsStore$.value;
    const defaultStyle = LayerStyle.getDefaultOpts(LayerStyleType.GRADIENT);
    if(colorRamps && colorRamps.length) {
      return LayerStyle.factory(LayerStyleType.GRADIENT, 'Style', true, { ...defaultStyle, gradient: colorRamps[0].colours } as ILayerStyleOptsGradient);
    }else{
      return LayerStyle.factory(LayerStyleType.GRADIENT, 'Style', true, { ...defaultStyle } as ILayerStyleOptsGradient);
    }
  }

  public setActiveStyle(layerId: string, style: LayerStyle) {
    if (style) {
      this.styleActiveStore[layerId] = style;
    } else {
      delete this.styleActiveStore[layerId];
    }
    this.styleChangeSource.next({
      layerId,
      style
    });
  }

  public getActiveStyle(layerId: string): LayerStyle {

    const activeStyle = this.styleActiveStore[layerId];
    const styles = (this.styleListStore[layerId] || []).filter(e=>!e.disabled);
    if (!styles.length) {
      this.styleActiveStoreAll[layerId] = null;
      return null;
    }
    const defaultStyle = styles.find(style => !style.isDefault && style.opts.isDefault);
    const defaultTenantStyle = styles.find(style => style.isDefault);
    if (!activeStyle) {
      this.styleActiveStoreAll[layerId] = defaultStyle ? defaultStyle : defaultTenantStyle ? defaultTenantStyle : styles[0];
    } else {
      const previousActiveStyle = this.previousActiveStyle[layerId];
      const _activeStyle = styles.find(e => e == activeStyle);
      const _previousActiveStyle = styles.find(e => e == previousActiveStyle);
      this.styleActiveStoreAll[layerId] = _activeStyle ? _activeStyle : _previousActiveStyle ? _previousActiveStyle : defaultStyle ? defaultStyle : defaultTenantStyle ? defaultTenantStyle : styles[0];
    }

    return this.styleActiveStoreAll[layerId];
  }

  public setStyleListByLayerId(layerId: string){
    const zoom = this.mapService.map.getZoom();
    const layer = this.layers.find(e => e.id === layerId);
    try {
      const { minZoom, maxZoom, maxHeatmapZoom, minHeatmapZoom, minClusteredZoom, maxClusteredZoom } = layer;
      const styleStore = this.styleListStore[layerId] || [];
      styleStore.forEach(style => {
        const { type } = style;
        switch (type) {
          case LayerStyleType.CLUSTER:
            const cluster_minZoom = minClusteredZoom;
            const cluster_maxZoom = maxClusteredZoom;
            if ((zoom >= cluster_minZoom) && (zoom <= cluster_maxZoom)) {
              style.disabled = false;
              return;
            }
            break;
          case LayerStyleType.HEATMAP:
            const heatMap_minZoom = minHeatmapZoom || minZoom;
            const heatMap_maxZoom = maxHeatmapZoom || maxZoom;
            if ((zoom >= heatMap_minZoom) && (zoom <= heatMap_maxZoom)) {
              style.disabled = false;
              return;
            }
            break;

          default:
            if ((zoom >= minZoom || !minZoom) && (zoom <= maxZoom || !maxZoom)) {
              style.disabled = false;
              return;
            }
            break;
        }
        style.disabled = true;
      })
      // return styleStore.sort((a, b) => a.type - b.type);
    } catch (error) {
      console.error(error, layerId)
    }
  }

  public getStyleListByLayerId(layerId: string) {
    // const layer = this.layers.find(e => e.id === layerId);
    const styleStore = this.styleListStore[layerId] || [];
    return styleStore.sort((a, b) => a.type - b.type);
  }

  public getColourRamps() {
    observableZip(
      this.httpService.get(`TenantSettings/?settingCollection=styles&settingName=colourramp`),
      this.httpService.get(`ReferenceDataSettings/?settingCollection=styles&settingName=colourramp`),
      this.httpService.get(`UserSettings/?settingCollection=styles&settingName=colourramp`)
    ).subscribe(
      ([tenantColourRamps, referenceColourRamps, userColourRamps]) => {
        this.tenantColorRampsStore$.next(Object.assign([], tenantColourRamps ? tenantColourRamps.colourramp : []));
        this.referenceColorRampsStore$.next(Object.assign([], referenceColourRamps ? referenceColourRamps.colourramp : []));
        this.userColorRampsStore$.next(Object.assign([], userColourRamps ? userColourRamps.colourramp : []));
      }
    )
  }

  public setPreviousActiveStyle(layerId: string, style: LayerStyle) {
    this.previousActiveStyle[layerId] = style;
  }

  public getPreviousActiveStyle(layerId: string): LayerStyle{
    return this.previousActiveStyle[layerId];
  }
}
