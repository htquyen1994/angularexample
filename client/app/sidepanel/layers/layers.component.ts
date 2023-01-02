import {
  Component,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  OnInit,
  Renderer2,
  NgZone
} from '@angular/core';

import {
  trigger,
  style,
  transition,
  animate
} from '@angular/animations';

import {
  LayerService,
  MapService,
  LayerGroupService,
  IS_MORRISON,
  AccountService,
  LayerStyleService,
  LayerSource,
  OverlayService,
  ActionMessageService,
  AppInsightsService,
  SelectionService
} from '../../shared';
import { IAccount, ILayer, ILayerGroup } from '../../shared/interfaces';
import { ReplaySubject, forkJoin, combineLatest, BehaviorSubject } from 'rxjs';
import { filter, first } from 'rxjs/operators';
import { LayerBundle } from '../../shared/layerBundle';
import { DomSanitizer } from '@angular/platform-browser';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { DropdownComponent } from '@client/app/shared/components';
import { ResultPanelCollapseState } from '@client/app/core/enums';
import { PanelStoreService } from '@client/app/core/services';
import { FormGroup, FormControl, Validators } from '@angular/forms';
enum DialogType {
  CREATE,
  UPDATE,
  DELETE,
  COPY,
  SHARE
}

interface ILayerState {
  isActive: boolean;
  isSelected: boolean;
  heatMapOnly: boolean;
}

@Component({
  selector: 'go-layers',
  moduleId: module.id,
  templateUrl: 'layers.component.html',
  styleUrls: ['layers.component.less'],
  animations: [

    trigger('parentOpen', [
      transition(
        ':enter',
        [
          style({ height: '0', overflow: 'hidden' }),
          animate('200ms ease-in',
            style({ height: '*', overflow: 'visible' }))
        ]
      ),
      transition(
        ':leave',
        [
          style({ overflow: 'hidden' }),
          animate('200ms ease-out',
            style({ height: 0, borderTopColor: '#EEE', overflow: 'hidden' }))
        ]
      )
    ])
  ]
})
export class LayersComponent implements OnInit {
  @ViewChild('treeEl', { static: true }) treeEl: ElementRef;
  @ViewChild('treeElWrapper', { static: true }) treeElWrapper: ElementRef;
  @ViewChild('addGroupInput', { static: false }) addGroupInput: ElementRef;
  @ViewChild('dragLabel', { static: true }) dragLabel: ElementRef;
  @ViewChild('dragPointer', { static: true }) dragPointer: ElementRef;
  @ViewChild('dropdown', { static: true }) dropdown: DropdownComponent;
  loading = new ReplaySubject<boolean>(1)
  disabledAnimation$ = new BehaviorSubject<boolean>(false)
  activeLayer: ILayer = null;
  dragEl: HTMLElement = null;
  dragLabelText: string;
  layerGroups: ILayerGroup[] = [];
  dialogState: DialogType = null;
  dialogType = DialogType;
  isMorrison = IS_MORRISON;
  canCreateUserLayer = false;
  canEditLayerGroup = false;
  isDevMode = false;
  canShareUserLayer = false;
  layerSource = LayerSource;
  isShowLegends = true;
  // groupEditingIndex: number = null;
  isGroupAdd = false;
  isTurnOffPressed = false;
  viewTurnOffLayers = false;


  private isFirstActive = true;
  private layers: ILayer[] = [];

  private stateCache: { [layerId: string]: ILayerState } = {};

  private zoomLevel = 0;

  scrollListener: any;
  formGroup: FormGroup;
  get editingGroupId(){
    return this.formGroup ? this.formGroup.get('id').value : null;
  }
  constructor(private layerService: LayerService,
    private mapService: MapService,
    private layerGroupService: LayerGroupService,
    private layerStyleService: LayerStyleService,
    private overlayService: OverlayService,
    private applicationInsightsService: AppInsightsService,
    private actionMessageService: ActionMessageService,
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService,
    private selectionService: SelectionService,
    private sanitizer: DomSanitizer,
    private renderer2: Renderer2,
    private zone: NgZone,
    private _panelStoreService: PanelStoreService
  ) {
    this.loading.next(true);
    this.disabledAnimation$.next(true);
    const groups$ = this.layerGroupService.groups.pipe(filter(e=>!!e));
    const getLayers$ = forkJoin(
      this.layerService.layer.pipe(filter(e => !!e), first()),
      this.layerStyleService.style.pipe(filter(e => !!e), first()),
      groups$.pipe(first())
    )
    groups$.subscribe(layerGroups => {
      this.disabledAnimation$.next(true);
      this.layerGroups = layerGroups;
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
      this.loading.next(false);
      this.disabledAnimation$.next(false);
    });
    getLayers$.subscribe(([layers, styles, groups]) => {

      this.layers = layers;
      this.layers.forEach(_layer => {
        const layerGroup = groups.find(e=>e.id === _layer.groupId);
        if(!layerGroup) {
          return;
        }
        const layer = layerGroup.layers.find(e=>e.id === _layer.id);
        if(!layer) {
          return;
        }
        this.stateCache[layer.id] = {
          isActive: false,
          isSelected: false,
          heatMapOnly: false
        };

        if (layer.defaultDisplay) {
          if (layer.defaultActive) {
            this.isFirstActive = false;
            setTimeout(() => this.onActivate(layer), 1000);
          }

          if (!layer.defaultActive) {
            this.isFirstActive = false;
          }
          this.onSelection(true, layer);
        }
      });
      if (!this.zoomLevel) {
        this.zoomLevel = this.mapService.map.getZoom();
      }
      this.updateZoom();
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
      // this.mapService.mapRx.subscribe(map => {
      //   this.updateZoom();
      // });

      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();

    });
    this.layerGroupService.groupUpdate.subscribe(data => {
      let index = this.layers.findIndex(e => e.id == data.layer.id);
      if (index != -1) {
        this.layers[index] = data.layer;
        this.changeDetectorRef.detectChanges();
      }
    })
    this.layerGroupService.groupAdd.subscribe(data => {
      this.layers.push(data.layer);
    });


    combineLatest(
      this.layerService.layerActive,
      getLayers$
    ).subscribe(([layer]) => {
      this.layers.filter(e => !(e instanceof LayerBundle)).forEach((item: ILayer) => {
        try {
          item.isActive = false;
        } catch (error) {
          console.error(error)
        }
      });
      if (layer) {
        const _layer = this.layers.find(item => item.id == layer.id);
        this.activeLayer = _layer
        this.activeLayer.isActive = true;
      } else {
        this.activeLayer = null;
      }
      this.changeDetectorRef.detectChanges();
    })

    this.mapService.zoom.subscribe((zoom: number) => {
      this.zoomLevel = zoom;
      this.updateZoom();
    });
    this.selectionService.selection.subscribe(select => {
      const selectedRecords = this.selectionService.selectionStore.get(select.overlayId).values();
      let layerIndex = this.layers.findIndex(e => e.id == select.overlayId);
      if (layerIndex != -1) {
        const layer = this.layers[layerIndex];
        this.layers[layerIndex].selectedRecords = Array.from(selectedRecords);
        this.updateHavingSelectedRecords(layer);
      }
      this.changeDetectorRef.detectChanges();
    })
  }

  ngOnInit() {
    this.accountService.account.subscribe((item: IAccount) => {
      this.canCreateUserLayer = item.createUserLayer;
      this.canEditLayerGroup = item.editLayerGroup;
      this.isDevMode = item.isDevMode;
      this.canShareUserLayer = item.shareUserLayer;
      this.viewTurnOffLayers = item.viewTurnOffLayers;
      this.changeDetectorRef.detectChanges();
    });
  }

  updateHavingSelectedRecords(layer) {
    let groupId = layer.groupId;
    if (layer.bundleId) {
      groupId = this.layerService.layerStore.get(layer.bundleId).groupId;
    }
    if (groupId == undefined) return;
    if (this.layerGroups[groupId])
      this.layerGroups[groupId].isHavingSelectedRecords =
        !!this.layerGroups[groupId].layers.find(e => e.selectedRecords && e.selectedRecords.length > 0);
  }

  turnOffLayers() {
    this.isTurnOffPressed = true;
    this.applicationInsightsService.logEvent('Layers Tab', 'Layers Off', '');

    setTimeout(() => this.isTurnOffPressed = false, 300);
    this.layers.forEach(layer => {
      if (layer.isSelected) {
        console.log(layer.name);
        this.onSelection(false, layer);
      }
    });
  }

  toggleLegends() {
    this.isShowLegends = !this.isShowLegends;
    this.applicationInsightsService.logEvent('Layers Tab', 'Legends', this.isShowLegends);
  }

  updateZoom() {
    Array.from(this.layerService.layerStore.values()).forEach(_layer => {
      this.updateLayer(_layer);
    });
    this.changeDetectorRef.detectChanges();
  }

  updateLayer(_layer: ILayer) {
    let layer = _layer;
    if (_layer instanceof LayerBundle) {
      const { isSelected } = _layer.activeChild;
      layer = _layer.setActivateChildForZoom(this.zoomLevel);
      if (this.activeLayer
        && this.activeLayer.bundleId
        && this.activeLayer.bundleId == layer.bundleId
        && this.activeLayer != layer) {
        this.onActiveBundle(_layer);
      }
      if (isSelected) {
        this.onSelectionBundle(isSelected, _layer);
      }
      this.updateHavingSelectedRecords(layer);
    }
    this.layerStyleService.setStyleListByLayerId(layer.id);
    const isDisabled = !this.layerStyleService.getActiveStyle(layer.id);

    if (layer.isDisabled !== isDisabled) {

      layer.isDisabled = isDisabled;

      if (isDisabled) {
        if (!this.stateCache[layer.id]) {
          this.stateCache[layer.id] = {
            isActive: false,
            isSelected: false,
            heatMapOnly: false
          };
        }
        this.stateCache[layer.id].isSelected = layer.isSelected;

        // this.stateCache[layer.id].isActive = layer.isActive;

        /*
                            if (layer.isActive) {
                                layer.isActive = false;
                                this.layerService.setActiveChange(null);
                            }
        */

        if (layer.isSelected) {
          layer.isSelected = false;
          this.layerService.setSelectionChange(layer);
        }
      } else if (this.stateCache[layer.id]) {
        /*
                            if (this.stateCache[layer.id].isActive) {
                                layer.isActive = true;
                                this.layerService.setActiveChange(layer);
                            }
        */

        if (this.stateCache[layer.id].isSelected) {
          layer.isSelected = true;
          this.layerService.setSelectionChange(layer);
        }
      }
    }
    if (layer.isSelected && !layer.isDisabled) {
      const group = this.layerGroups.find(e => e.id === layer.groupId);
      if (group && group.isCollapsed) {
        this.overlayService.updateOverlayByLayerId(layer.id, !layer.zoomConfig[this.mapService.map.getZoom()]);
      }
    }
  }

  onExpanded(group: ILayerGroup) {
    group.isCollapsed = !group.isCollapsed;
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
    this.layerGroupService.updateGroup(group, { isCollapsed: group.isCollapsed }, false);
  }

  onActivate(layer: ILayer) {
    // if (!layer.isDisabled) {

    if (this.isFirstActive) {
      this.isFirstActive = false;
      this._panelStoreService.setResultPanelState(ResultPanelCollapseState.HALF_SCREEN)
    }
    if (layer instanceof LayerBundle) {
      this.onActiveBundle(layer);
    } else {
      this.layerService.setActiveChange(!layer.isActive ? layer : null);
    }
    this.changeDetectorRef.detectChanges();
    // }
  }

  onActiveBundle(layer: LayerBundle) {
    const { isActive, activeChild } = layer;
    this.layerService.setActiveChange(!isActive ? activeChild : null);
  }

  onSelection(isSelected: boolean, layer: ILayer) {
    if (!this.activeLayer && this.isFirstActive) {
      this.isFirstActive = false;
      this.onActivate(layer);
      this._panelStoreService.setResultPanelState(ResultPanelCollapseState.HALF_SCREEN)
    }
    if (layer instanceof LayerBundle) {
      this.onSelectionBundle(isSelected, layer);
    } else {
      layer.isSelected = isSelected;
      this.layerService.setSelectionChange(layer);
    }
    this.changeDetectorRef.detectChanges();
  }

  onSelectionBundle(isSelected: boolean, layer: LayerBundle) {
    const { activeChild } = layer;
    layer.setAttr('isSelected', false);
    activeChild.isSelected = isSelected;
    layer.childLayers.forEach(_layer => this.layerService.setSelectionChange(_layer))
  }

  onLocate() {
    if (this.activeLayer) {
      this.layerService.getLayerBounds();
      this.applicationInsightsService.logEvent('Layers Tab', 'Zoom', '');
    }
  }

  onGroupEditForm(groupIndex: number, group: ILayerGroup) {
    const {id, name} = group;
    this.initForm({id, name});
    this.changeDetectorRef.detectChanges();
  }

  onLayerCreate(isOpen: boolean) {
    this.dialogState = isOpen ? DialogType.CREATE : null;
    this.dropdown.isOpen = false;
    this.applicationInsightsService.logEvent('Layers Tab', 'Create Layer', '');
  }

  onLayerUpdate(isOpen: boolean) {
    this.dialogState = isOpen ? DialogType.UPDATE : null;
    this.dropdown.isOpen = false;
    this.applicationInsightsService.logEvent('Layers Tab', 'Rename Layer', '');
  }

  onLayerDelete(isOpen: boolean) {
    this.dialogState = isOpen ? DialogType.DELETE : null;
    this.dropdown.isOpen = false;
    this.applicationInsightsService.logEvent('Layers Tab', 'Delete Layer', '');
  }

  onLayerCopy(isOpen: boolean) {
    this.dialogState = isOpen ? DialogType.COPY : null;
    this.dropdown.isOpen = false;
    this.applicationInsightsService.logEvent('Layers Tab', 'Copy Layer', '');
  }

  onLayerShare(isOpen: boolean) {
    this.dialogState = isOpen ? DialogType.SHARE : null;
    this.dropdown.isOpen = false;
    this.applicationInsightsService.logEvent('Layers Tab', 'Share Layer', '');
  }

  onGroupEdit() {
    const { id, name } = this.formGroup.getRawValue();
    this.layerGroupService.updateGroup({id} as ILayerGroup, { name }, true);
    this.onCancelGroupEdit();
    this.applicationInsightsService.logEvent('Layers Tab', 'Rename Layer Group', '');
  }

  onGroupAdd(name: HTMLInputElement) {
    this.isGroupAdd = null;
    this.layerGroupService.addGroup(name.value);
    this.applicationInsightsService.logEvent('Layers Tab', 'Create Layer Group', '');
    this.treeEl.nativeElement.scrollTop = this.treeEl.nativeElement.scrollHeight;
  }

  onGroupDelete(index: number) {
    this.layerGroupService.deleteGroup(index);
    this.applicationInsightsService.logEvent('Layers Tab', 'Delete Layer Group', '');
  }

  onCancelGroupEdit(){
    this.formGroup.reset();
    this.changeDetectorRef.detectChanges();
  }

  onGroupCreateForm() {
    this.dropdown.isOpen = false;
    this.isGroupAdd = true;
    this.treeEl.nativeElement.scrollTop = 0;
    this.changeDetectorRef.detectChanges();
    this.onScroll();
    this.initScrollListener();
  }

  onCancelGroupAdd() {
    this.isGroupAdd = null;
    this.destroyScrollListener();
    this.changeDetectorRef.detectChanges();
  }

  isBundleLayer(child: ILayer) {
    return child instanceof LayerBundle;
  }
  trustHtml(icon) {
    return this.sanitizer.bypassSecurityTrustHtml(icon)
  }

  dropItem(event: CdkDragDrop<any[]>) {
    const { previousContainer, container } = event;
    if (event.previousContainer === event.container) {
      const { id } = event.container
      this.layerGroupService.moveLayer(
        Number.parseInt(id),
        Number.parseInt(id),
        event.previousIndex,
        event.currentIndex);
    } else {
      const previousGroup = this.layerGroups.find(e => e.id.toString() == previousContainer.id);
      const currentGroup = this.layerGroups.find(e => e.id.toString() == container.id);
      if (previousGroup && previousGroup.isLocked || currentGroup && currentGroup.isLocked) {
        this.actionMessageService.sendInfo('Can not change layer position as layer group is locked');
        return;
      }
      this.layerGroupService.moveLayer(
        previousGroup.id,
        currentGroup.id,
        event.previousIndex,
        event.currentIndex);
    }
  }

  getConnectedList(): any[] {
    return this.layerGroups.map(x => `${x.id}`);
  }

  dropGroup(event: CdkDragDrop<any[]>) {
    const { data } = event.container;
    const previousGroup = data[event.previousIndex];
    const currentGroup = data[event.currentIndex];
    if (previousGroup.isLocked || currentGroup.isLocked) {
      this.actionMessageService.sendInfo('Can not change layer position as layer group is locked');
      return;
    }
    this.layerGroupService.moveGroup(
      previousGroup.id,
      currentGroup.id)
  }
  initScrollListener() {
    this.zone.runOutsideAngular(() => {
      this.destroyScrollListener();
      this.scrollListener = this.renderer2.listen(this.treeEl.nativeElement, 'scroll', (event: any) => {
        this.onScroll();
      });
    });
  }
  destroyScrollListener() {
    if (this.scrollListener)
      this.scrollListener();
  }
  onScroll() {
    if (!this.addGroupInput) return;
    if (this.treeEl.nativeElement.scrollTop > 42) {
      this.addGroupInput.nativeElement.classList.add("sticky");
    } else {
      this.addGroupInput.nativeElement.classList.remove("sticky");
    }
  }

  initForm(data?: any){
    if(!this.formGroup){
      this.formGroup = new FormGroup({
        id: new FormControl(null, Validators.required),
        name: new FormControl(null, Validators.required)
      })
    }
    if(data){
      this.formGroup.patchValue({...data})
    }
  }
}
