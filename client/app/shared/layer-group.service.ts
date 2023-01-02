import { throwError as observableThrowError, zip as observableZip, Subject, ReplaySubject, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

import { HttpService } from './http.service';
import { LayerService } from './layer.service';
import { LayerSource } from './LayerSource';
import { ILayer, ILayerGroup, ILayerGroupResponse } from './interfaces';
import { map } from 'rxjs/operators';
import { LayerBundle } from './layerBundle';
import { uniq } from 'lodash'
import { PsSelectOption } from '@periscope-lib/form/select/select.model';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Injectable()
export class LayerGroupService {

    groupStore: ILayerGroup[] = [];
    groupsSource = new ReplaySubject<ILayerGroup[]>(1);
    groups = this.groupsSource.asObservable().pipe(map(e=>e.map((group, index)=>({...group, id: index}))));

    groupAddSource = new Subject<{ groupId: number, layer: ILayer }>();
    groupAdd = this.groupAddSource.asObservable().pipe(map(e => {
        e.layer.groupId = e.groupId;
        return e
    }));
    groupUpdateSource = new Subject<{ groupId: number, layer: ILayer }>();
    groupUpdate = this.groupUpdateSource.asObservable();

    constructor(private httpService: HttpService,
        private layerService: LayerService) {

        this.groupAdd.subscribe(data => {
          const index = this.groupStore[data.groupId].layers.findIndex(e => e.id === data.layer.id);
          if (index == -1) {
            this.groupStore[data.groupId].layers.unshift(data.layer);
            this.saveGroups();
          } else {
            this.groupStore[data.groupId].layers[index] = data.layer;
          }
        });

        this.layerService.layerDelete.subscribe((layer: ILayer) => {
            this.groupStore.forEach(group => {
                const layerIndex = group.layers.findIndex(x => x === layer);
                if (layerIndex >= 0) {
                    group.layers.splice(layerIndex, 1);
                    this.saveGroups();
                }
            });
        });
        this.layerService.layerRefresh.subscribe((layer: ILayer) => {
            this.groupStore.forEach((group, index) => {
                const layerIndex = group.layers.findIndex(x => layer instanceof(LayerBundle)? x.id == (<LayerBundle>layer).bundleId  : x.id === layer.id);
                if (layerIndex != -1) {
                    group.layers[layerIndex] = layer;
                    this.groupUpdateSource.next({ groupId: index, layer: group.layers[layerIndex] });
                }
            });
        })
    }

  getGroupList() {
    return observableZip<ILayerGroupResponse[]>(
      this.httpService.get('TenantSettings/?settingCollection=groups&settingName=groups'),
      this.httpService.get('UserSettings/?settingCollection=groups&settingName=groups'),
      this.httpService.get('ReferenceDataSettings/?settingCollection=groups&settingName=groups')
    )
  }

    private saveGroups(isUpdateSource: boolean = true) {
        const groups = this.groupStore
            .filter(group => group.type === LayerSource.USER)
            .map(group => {
                return {
                    type: LayerSource.USER,
                    name: group.name,
                    layerIds: uniq(group.layers.map(layer => layer instanceof (LayerBundle) ? (<LayerBundle>layer).bundleId : layer.id)),
                    isLocked: group.isLocked,
                    isCollapsed: group.isCollapsed
                };
            });

        this.httpService.postJSON('UserSettings/?settingCollection=groups&settingName=groups', { groups: groups })
            .subscribe(() => {
              if(isUpdateSource){
                this.groupsSource.next(this.groupStore);
              }
            });
    }

    convertToILayerGroup(response: ILayerGroupResponse[], layerStore: Map<string, ILayer>): ILayerGroup[] {

        const tenantGroups = response[0].groups || [];
        tenantGroups.forEach(group => {
            group.type = LayerSource.CORPORATE;
            group.isLocked = true;
        });

        const userGroups = response[1].groups || [];
        userGroups.forEach(group => {
            group.type = LayerSource.USER;
        });

        const refGroups = response[2].groups || [];
        refGroups.forEach(group => {
          group.type = LayerSource.CORPORATE;
          group.isLocked = true;
        });
        refGroups.forEach(refGroup=>{
          const index = tenantGroups.findIndex(group=>group.name == refGroup.name);
          if(index != -1){
            tenantGroups[index].layerIds =  uniq([...tenantGroups[index].layerIds, ...refGroup.layerIds])
          }
          refGroup = null;
        })
        const mergedGroups = tenantGroups.concat(refGroups.filter(e=>e)).concat(userGroups);
        let isUpdate = false;
        const usedLayerIds: string[] = [];
        const groups: ILayerGroup[] = mergedGroups.map((group,groupIndex) => {
          const { type, name, isLocked, isCollapsed } = group;
          const layers = group.layerIds
              .filter(layerId => {
                  const addToGroup = layerStore.has(layerId) && !usedLayerIds.includes(layerId);
                  if (!addToGroup) {
                      isUpdate = true;
                  }
                  return addToGroup;
              })
              .map(layerId => {
                  usedLayerIds.push(layerId);
                  let _layer = layerStore.get(layerId);
                  return _layer;
              });

          return {
              type,
              name,
              layers,
              isLocked,
              isCollapsed
          };
      });

        if (groups.length === (tenantGroups.length + refGroups.length)) {
            groups.push({
                type: LayerSource.USER,
                name: 'My Layers',
                layers: [],
                isLocked: false,
                isCollapsed: false
            });
            isUpdate = true;
        }
      const filteredEmptyCorporateGroups = groups.filter(group => !(group.type === LayerSource.CORPORATE && group.layers.length == 0))
      .map((group, index)=>{
        group.layers.forEach(layer=>{
          let _layer = layerStore.get(layer.bundleId ? layer.bundleId : layer.id);
          if(!_layer){ debugger;}
          _layer.groupId = index;
          return layer;
        })
        return group;
      });
        const unGroupedLayerIds = Array.from(layerStore.keys())
            .filter(layerId => !usedLayerIds.includes(layerId));

        // voyagers layer should push to My Layers group the last one in stead of the first one
        if (unGroupedLayerIds.length > 0) {
            unGroupedLayerIds.forEach((layerId) => {
                const orphaned = layerStore.get(layerId);
                if (orphaned) {
                    // groups[tenantGroups.length].layers.push(orphaned);
                    let index = filteredEmptyCorporateGroups.findIndex(g => !g.isLocked && g.name === "My Layers");
                    if(index == -1) {
                      index = filteredEmptyCorporateGroups.push({
                        type: LayerSource.USER,
                        name: 'My Layers',
                        layers: [],
                        isLocked: false,
                        isCollapsed: false
                      }) - 1;
                    }
                    orphaned.groupId = index;
                    filteredEmptyCorporateGroups[index].layers.push(orphaned);
                    isUpdate = true;
                }
            });
        }

        this.groupStore = filteredEmptyCorporateGroups;

        if (isUpdate) {
            this.saveGroups(false);
        }

        return this.groupStore;
    }

    deleteGroup(index: number) {
      const group = this.groupStore[index];
      if (group && group.type === LayerSource.USER) {
        this.groupStore.splice(index, 1);
        this.saveGroups();
      }
    }

    addGroup(label: string) {
      const userGroupIndex = this.groupStore.findIndex(e => e.type === LayerSource.USER);
      this.groupStore.splice(userGroupIndex, 0, {
        type: LayerSource.USER,
        name: label,
        layers: [],
        isLocked: false,
        isCollapsed: false
      });

      this.saveGroups();
    }

    moveGroup(fromGroupIndex: number, toGroupIndex: number) {
      moveItemInArray(this.groupStore, fromGroupIndex, toGroupIndex);

      this.saveGroups();
    }

    moveLayer(fromGroupIndex: number, toGroupIndex: number, fromLayerIndex: number, toLayerIndex: number) {
      if (fromGroupIndex === toGroupIndex) {
        moveItemInArray(this.groupStore[fromGroupIndex].layers, fromLayerIndex, toLayerIndex);
      } else {
        transferArrayItem(this.groupStore[fromGroupIndex].layers,
          this.groupStore[toGroupIndex].layers,
          fromLayerIndex, toLayerIndex);
      }

      this.saveGroups();
    }

    updateGroup(group: ILayerGroup, options?: Object, updateSource = false) {
      const { id } = group;
      Object.assign(this.groupStore[id], options);
      if (this.groupStore[id].type === LayerSource.USER) {
        this.saveGroups(updateSource);
      }
    }
}

