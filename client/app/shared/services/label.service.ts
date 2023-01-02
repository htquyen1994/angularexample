import { Injectable } from '@angular/core';
import { ILabelStyle } from '../models/label.model';
import { HttpService } from '../http.service';
import { tap, map, debounceTime, switchMap } from 'rxjs/operators';
import * as _ from 'lodash'
import { createSimpleError } from '../http.util';
import { getGuid } from '../global';
import { Observable, BehaviorSubject, Subject, forkJoin } from 'rxjs';
import { ILabelStyleChange, ILayer } from '../interfaces';
import { LayerSource } from '../LayerSource';

@Injectable({
  providedIn: 'root'
})
export class LabelService {

  private labelStyleListStore: { [layerId: string]: ILabelStyle[] } = {};
  private labelStyleActiveStore: { [layerId: string]: ILabelStyle } = {};

  private styleChangeSource = new Subject<ILabelStyleChange>();
  public styleChange = this.styleChangeSource.asObservable().pipe(debounceTime(50));
  constructor(
    private httpService: HttpService
  ) {
  }

  updateStyle(layerId: string, style: ILabelStyle) {
    if (!layerId)
      throw createSimpleError('Something went wrong');
    const userStore = this.getStore(LayerSource.USER);
    const tenantStore = this.getStore(LayerSource.CORPORATE);
    const styles = userStore[layerId] ? [...userStore[layerId]] : [];
    if (style.isDefault) {
      styles.forEach(e => {
        e.isDefault = false;
      });
    }
    if (style.id) { // update
      const index = styles.findIndex(e => e.id == style.id);
      if (index == -1)
        throw createSimpleError('Something went wrong');
      styles[index] = style;
    } else { // add
      const id = getGuid();
      style.id = id;
      styles.push(style);
    }

    const clone = JSON.parse(JSON.stringify(userStore))
    clone[layerId] = styles;
    return this.updateStyles(clone).pipe(
      map(() => this.mergeStyles(tenantStore, clone)),
      tap(labels => {
        this.updateStore(labels);
        this.setActiveStyleByLayerId(layerId, style);
      })
    )
  }

  deleteStyle(layerId: string, styleId: string) {
    if (!layerId || !styleId)
      throw createSimpleError('Something went wrong');
    const userStore = this.getStore(LayerSource.USER);
    const tenantStore = this.getStore(LayerSource.CORPORATE);
    const styles = userStore[layerId] ? [...userStore[layerId]] : [];
    const index = styles.findIndex(e => e.id == styleId);
    if (index == -1)
      throw createSimpleError('Something went wrong');
    styles.splice(index, 1);
    const clone = JSON.parse(JSON.stringify(userStore));
    clone[layerId] = styles;
    return this.updateStyles(clone).pipe(
      map(() => this.mergeStyles(tenantStore, clone)),
      tap(labels => {
        this.updateStore(labels)
        if (this.labelStyleActiveStore[layerId] && this.labelStyleActiveStore[layerId].id == styleId) {
          this.setActiveStyleByLayerId(layerId, null);
        }
      })
    )
  }

  getActiveStyleByLayerId(layerId: string) {
    if (!layerId) return null;
    const labelStyle = this.labelStyleActiveStore[layerId] || null;
    return labelStyle
  }

  getActiveStyleByLayerIdForRendering(layerId: string, zoom: number) {
    if (!layerId) return null;
    const labelStyle = this.labelStyleActiveStore[layerId] || null;
    if(labelStyle && labelStyle.enableScaleRange && (labelStyle.rangeScale[0] > zoom || labelStyle.rangeScale[1] < zoom)){
      return null;
    }
    return labelStyle
  }

  setActiveStyleByLayerId(layerId: string, style: ILabelStyle) {
    this.labelStyleActiveStore[layerId] = style;
    this.styleChangeSource.next({ overlayId: layerId, style: this.labelStyleActiveStore[layerId] });
    return this.labelStyleActiveStore[layerId];
  }

  getStylesByLayerId(layerId: string) {
    if (!layerId) return [];
    const labelstyles = this.labelStyleListStore[layerId] || [];
    return labelstyles
  }

  getStyleByLayerIdAndStyleId(layerId: string, styleId: string) {
    const styles = this.getStylesByLayerId(layerId);
    const style = styles.find(e => e.id == styleId);
    return style ? style : null;
  }

  innit(): Observable<any> {
    return this.getStyles().pipe(tap((labels) => this.updateStore(labels)))
  }

  removeRedundantStyles(layers: ILayer[]): void {
    const userStore = this.getStore(LayerSource.USER);
    const tenantStore = this.getStore(LayerSource.CORPORATE);
    const store = {}
    let isUpdate = false;
    Object.keys(userStore).forEach(key => {
      const layerFilter = layers.filter(e => e.id == key);
      if (layerFilter.length) {
        store[key] = userStore[key];
      } else {
        isUpdate = true;
      }
    })
    if (isUpdate) {
      const clone = JSON.parse(JSON.stringify(store));

      this.updateStyles(clone).pipe(
        map(() => this.mergeStyles(tenantStore, clone))
      ).subscribe((labels) => {
        this.updateStore(labels)
      })
    }
  }

  private getStyles(): Observable<{ [layerId: string]: ILabelStyle[] }> {
    return forkJoin(
      this.httpService.get(`TenantSettings/?settingCollection=labels&settingName=labels`),
      this.httpService.get(`UserSettings/?settingCollection=labels&settingName=labels`)
    ).pipe(
      map(([tenantStyles, userStyles]) => this.mergeStyles(tenantStyles, userStyles, true)),
    )
  }

  private decorateStyles(styles: { [key: string]: ILabelStyle[] }, source: LayerSource): { [key: string]: ILabelStyle[] } {
    styles = styles || {};

    Object.keys(styles).forEach(layerId => {
      if (Array.isArray(styles[layerId])) {
        styles[layerId].forEach((a: ILabelStyle) => a.source = source);
      }
    })
    return styles;
  }

  private updateStore(store) {
    const serialized = JSON.stringify(store);
    this.labelStyleListStore = JSON.parse(serialized);
  }

  private getStore(source: LayerSource): { [key: string]: ILabelStyle[] } {
    const store = {};
    Object.keys(this.labelStyleListStore).forEach(layerId => {
      if (Array.isArray(this.labelStyleListStore[layerId])) {
        const styles = this.labelStyleListStore[layerId].filter(e => e.source === source);
        if (styles.length) {
          store[layerId] = styles;
        }
      }
    })
    return store;
  }

  private updateStyles(store): Observable<any> {
    const serialized = JSON.stringify(store);
    const clone: { [key: string]: ILabelStyle[] } = JSON.parse(serialized);

    return this.httpService.postJSON('UserSettings/?settingCollection=labels&settingName=labels', clone)
  }

  private mergeStyles(tenantStyles, userStyles, isSetDefault?: boolean) {
    const tenantStyle = this.decorateStyles(tenantStyles, LayerSource.CORPORATE);
    const userStyle = this.decorateStyles(userStyles, LayerSource.USER);
    const keys = Array.from(new Set([...Object.getOwnPropertyNames(userStyle), ...Object.getOwnPropertyNames(tenantStyle)]))
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      (tenantStyle[key] || []).forEach(style => {
        style.isEditable = style.isEditable ? style.isEditable : false;
        style.isRemovable = style.isRemovable ? style.isRemovable : false;
        if (style.isDefault && isSetDefault) {
          tenantStyle[key].forEach(e => e.isDefault = false);
          style.isDefault = true;
          this.setActiveStyleByLayerId(key, style);
        }
      });
      (userStyle[key] || []).forEach(style => {
        style.isEditable = style.isEditable ? style.isEditable : true;
        style.isRemovable = style.isRemovable ? style.isRemovable : true;
        if (style.isDefault && isSetDefault) {
          userStyle[key].forEach(e => e.isDefault = false);
          style.isDefault = true;
          this.setActiveStyleByLayerId(key, style);
        }
      })
      tenantStyle[key] = (tenantStyle[key] || []).concat(userStyle[key] || []);
    }
    return { ...tenantStyle }
  }
}
