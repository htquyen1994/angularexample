import { Subscription, BehaviorSubject, Subject } from 'rxjs';
import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef, NgZone, ElementRef } from '@angular/core';
import { debounceTime, first } from 'rxjs/operators';
import {
  LayerDataService,
  LayerService,
  SelectionService,
  IS_MORRISON,
  AccountService,
  ActionMessageService,
  MapService,
  HttpService,
  createSimpleError,
  IErrorResponse, AppInsightsService, LayerGroupService, OverlayService, IS_POSTOFFICE, isShowBranchDetails, LayerSource, Breakpoint, MAX_LAPTOP_WIDTH, MIN_RESULT_PANEL,
} from '../../shared';
import { DialogComponent } from '@client/app/shared/components';

import { ResultGridComponent } from './result-grid/result-grid.component';
import { StreetviewService } from '../streetview/streetview.service';
import { IAccount, ILayer, ILayerGroup, IFilter, ILabelStyleChange } from '../../shared/interfaces';
import { LayerType } from '../../shared/enums';
import { decorateError } from '../../shared/http.util';
import { AddColumnComponent } from '../add-column/add-column.component';
import { ModalService } from '../../shared/services/modal.service';
import * as _ from 'lodash';
import { CalculateColumnComponent } from '../calculate-column/calculate-column.component';
import { MatchCreateLayerComponent } from '../insights/match-create-layer/match-create-layer.component';
import { BreakpointService } from '../../shared/services/breakpoint.service';
import { EResultState } from '../shared/models/result.model';
import { ILabelStyle } from '../../shared/models/label.model';
import { LabelService } from '../../shared/services/label.service';
import { EDetailPanelTabs } from '../shared/models/detail-panel.model';
import { PsSelectOption } from '@periscope-lib/form/select/select.model';

@Component({
  selector: 'go-result',
  moduleId: module.id,
  templateUrl: 'result.component.html',
  styleUrls: ['result.component.less']
})
export class ResultComponent implements OnDestroy, OnInit {

  @ViewChild('resultGrid', { static: true }) resultGridRef: ResultGridComponent;
  @ViewChild('deleteRow', { static: true }) deleteDialogRef: DialogComponent;
  @ViewChild('extensionTrading', { static: true }) extensionTradingRef: DialogComponent;

  activeLayer: ILayer = null;
  layerType = LayerType;
  hasAddPermission = false;
  hasCreatePermission = false;
  hasDownloadPermission = false;
  hasRestrictedDownloadPermission = false;
  hasAddDocuments = false;
  hasEditBatchPermission = false;
  viewDocuments = false;
  isPinSelected = true; // fix
  isAddRow = false;
  isViewMode = false;
  hasMaxDownload = false;
  isBatchEdit = false;
  isDocumentForm = false;
  isMorrisonLayer = false;
  isMorrison = IS_MORRISON;
  isFilterByMap = true; // fix
  isDownloadForm = false;
  downloadError: IErrorResponse;
  isDevMode = false;
  canCopyToTenant = false;
  canManageOrCalculateColumns = false;
  createMatch = false;
  isLoading = false;
  isCopyForm = false;
  showColumnGroups = false;
  activeShapeId: string;

  deleteError: IErrorResponse = null;
  isLoadingDelete = false;

  extensionError: IErrorResponse = null;
  isLoadingExtension = false;
  layerGroups: ILayerGroup[] = [];
  showSelectedOnly: boolean = false;
  showGroups: boolean = false;
  get selectedIds() {
    let selectedIds = [];
    if (this.activeLayer && this.selectionService.selectionStore.get(this.activeLayer.id)) {
      selectedIds = Array.from(this.selectionService.selectionStore.get(this.activeLayer.id).values());
    }
    return selectedIds.length > 0 ? selectedIds : null
  }
  activeLayerId = null;

  layerSource = LayerSource;
  showIcon: boolean = false;
  state: EResultState;
  EResultState = EResultState;
  activeLabelStyle: ILabelStyle;
  labelStyles = new BehaviorSubject<ILabelStyle[]>([]);
  labelStyleLoading = new BehaviorSubject<boolean>(false);
  editStyle: ILabelStyle;
  private layerActiveSubscription: Subscription;
  private selectionServiceSubscription: Subscription;
  isPostOffice = IS_POSTOFFICE;
  editFormActiveTab: EDetailPanelTabs = EDetailPanelTabs.Information;
  excludingZone = false;
  refreshDetail$ = new Subject<void>();
  layerGroupOptions: PsSelectOption[] = [];

  constructor(private layerDataService: LayerDataService,
    private layerService: LayerService,
    private actionMessageService: ActionMessageService,
    private streetviewService: StreetviewService,
    private httpService: HttpService,
    private applicationInsightsService: AppInsightsService,
    private layerGroupService: LayerGroupService,
    private mapService: MapService,
    private changeDetectorRef: ChangeDetectorRef,
    private accountService: AccountService,
    private selectionService: SelectionService,
    private overlayService: OverlayService,
    private modalService: ModalService,
    private ngZone: NgZone,
    private breakpointService: BreakpointService,
    private labelService: LabelService,
    public hostElement: ElementRef
  ) {
    this.mapService.showSelectedOnly.subscribe(value => {
      if (this.showSelectedOnly == value) {
        return;
      }
      this.showSelectedOnly = value;
      this.changeDetectorRef.detectChanges();
    })
    this.breakpointService.rightSection$.subscribe(value => {
      if (value.width < MIN_RESULT_PANEL) {
        this.showIcon = false;
      } else {
        this.showIcon = true;
      }
      this.changeDetectorRef.detectChanges();
    })
  }

  ngOnInit() {

    this.layerGroupService.groups.subscribe(layerGroups => {
      this.layerGroups = layerGroups;
      this.layerGroupOptions = this.toPsSelectOptions(this.layerGroups);
      this.changeDetectorRef.detectChanges();
    });

    this.selectionService.active.subscribe(data => {
      const isActive = data.isAdd && this.activeLayer && this.activeLayer.id === data.overlayId;
      this.activeShapeId = isActive || this.isViewMode ? data.shapeId : null;
    });

    this.layerActiveSubscription = this.layerService.layerActive.subscribe(layer => {
      this.setState(null);
      this.activeLayerId = null;
      this.changeDetectorRef.detectChanges();
      this.activeLayer = layer ? _.cloneDeep(layer) : null;
      if (this.activeLayer) {
        this.activeLayerId = this.activeLayer.id;
        this.showGroups = this.activeLayer.showGroupHeaders;
      } else {
        this.showGroups = false;
      }
      this.getLabelStyles(this.activeLayerId);
      this.getActiveStyle(this.activeLayerId);
      this.isAddRow = false;
      this.isDocumentForm = false;
      this.isBatchEdit = false;
      this.setEditPermission();
      this.changeDetectorRef.detectChanges();
    });

    this.selectionServiceSubscription = this.selectionService.active.pipe(debounceTime(200)).subscribe(() => {
      this.setEditPermission();
      this.changeDetectorRef.detectChanges();
    });

    this.selectionServiceSubscription = this.selectionService.selection.pipe(debounceTime(200)).subscribe((selection) => {
      if (this.activeLayer && this.activeLayer.id == selection.overlayId) {
        this.changeDetectorRef.detectChanges();
      }
    });

    this.accountService.account.subscribe((item: IAccount) => {
      this.canCopyToTenant = item.canCopyToTenant;
      this.isDevMode = item.isDevMode;
      this.isPinSelected = item.pinSelected;
      this.isFilterByMap = item.filterByMap;
      this.viewDocuments = item.viewDocuments;
      this.hasMaxDownload = item.hasMaxDownload;
      this.createMatch = item.createMatch;
      this.canManageOrCalculateColumns = item.canManageOrCalculateColumns;
      this.showColumnGroups = item.showColumnGroups;
      this.changeDetectorRef.detectChanges();
    });
    // this.overlayService.label.subscribe((data: any) => {
    //   // labelgun , disable label for large amount shapes
    //   if (this.activeLayerId === data.overlayId) {
    //     this.setActiveStyle(this.activeLayerId, null);
    //     // this.changeDetectorRef.detectChanges();
    //   }
    // });
    this.labelService.styleChange.subscribe((data: ILabelStyleChange) => {
      if (data.overlayId == this.activeLayerId) {
        this.getActiveStyle(data.overlayId);
      }
    })
    this.selectionService.openRow$.subscribe(data => {
      const { layerId, shapeId } = data;
      if (layerId === this.activeLayerId) {
        this.openRow(shapeId);
      }
    })
  }

  ngOnDestroy() {
    this.layerActiveSubscription.unsubscribe();
    this.selectionServiceSubscription.unsubscribe();
  }

  setLayer(layerId) {
    const layer = this.layerService.layerStore.get(layerId);
    this.layerService.setActiveChange(layer ? layer : null);
  }

  setEditPermission() {
    this.hasAddPermission = this.activeLayer && this.activeLayer.isEditable;
    this.hasCreatePermission = this.hasAddPermission && !!this.selectionService.getLayerActiveShapeId(this.activeLayer.id);
    this.isMorrisonLayer = this.activeLayer && this.activeLayer.apiKey === 'MorrisonsCurrentStores';
    this.hasDownloadPermission = this.activeLayer && this.activeLayer.isDownloadable;
    this.hasRestrictedDownloadPermission = this.activeLayer && this.activeLayer.isRestrictedDownloadable;
    this.hasEditBatchPermission = this.hasAddPermission && (this.selectionService.selectionStore.get(this.activeLayer.id) || new Set<string>()).size > 1;
    this.hasAddDocuments = this.activeLayer && !!this.selectionService.getLayerActiveShapeId(this.activeLayer.id);

    // set to false  if no Documents permission
    if (this.viewDocuments === false) {
      this.hasAddDocuments = false;
    }
  }

  onLocateSelection() {
    this.overlayService.stopRenderShapes();
    this.layerService.getFeatureBounds({
      Ids: Array.from(this.selectionService.selectionStore.get(this.activeLayer.id).values())
    });
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Locate', '');
  }

  onPinSelected(): void {
    this.isPinSelected = !this.isPinSelected;
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Pin Selected', this.isPinSelected);
  }

  onQueryOnScreen() {
    this.isFilterByMap = !this.isFilterByMap;
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Filter By Map', this.isFilterByMap);
  }

  onDownloadForm(isOpen: boolean) {
    let count = 0;
    this.selectionService.selectionStore.forEach((shapes, layerId) => {
      if (this.activeLayer.id === layerId) {
        count += shapes.size;
      }
    });

    if (this.hasRestrictedDownloadPermission && count > 50) {
      this.actionMessageService.sendWarning('Please select not more than 50 record to download');
    } else {
      this.isDownloadForm = isOpen;
    }
    this.changeDetectorRef.detectChanges();
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Download Records', '');
  }

  download(data: { fileType: string, selectionType: string }) {
    this.downloadError = null;
    // TODO add these to request
    if (data.selectionType === '2') {
      const selection = this.selectionService.selectionStore.get(this.activeLayer.id);
      if (!selection || selection.size === 0) {
        this.downloadError = createSimpleError('Please select shapes');
        return;
      }
    }

    this.resultGridRef.downloadData(data, this.showGroups)
      .subscribe(
        (item: { totalHits: number, file: string, code: string, error: any, reason: any }) => {
          this.httpService.downloadFile(item.file, data.fileType, item.totalHits, this.hasMaxDownload);
          this.onDownloadForm(false);
        },
        error => {
          this.downloadError = decorateError(error);
          this.changeDetectorRef.detectChanges();
        });
  }

  onDeselect(): void {
    this.selectionService.deselectLayer(this.activeLayer.id);
    if (this.isPinSelected) {
      this.resultGridRef.updateData();
    }
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Deselect', '');
  }

  documents() {
    this.isDocumentForm = true;
  }

  editRow() {
    this.isViewMode = false;
    this.setState(EResultState.RECORD);
    this.isAddRow = false;
    this.isBatchEdit = false;
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Edit Record', '');
  }

  addRow() {
    this.isViewMode = false;
    this.setState(EResultState.RECORD);
    this.isAddRow = true;
    this.isBatchEdit = false;
    this.applicationInsightsService.logEvent('Layer Data Tab', 'New Record', '');
  }

  copyRowMorrisonForm() {
    this.isCopyForm = true;
    this.changeDetectorRef.detectChanges();
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Copy Record Morrisons', '');
  }

  copyRowBase(Build_Type: string = null) {
    const recordId = this.selectionService.getLayerActiveShapeId(this.activeLayer.id);
    this.isLoading = true;
    this.layerDataService.copyLayerData(this.activeLayer.id, recordId, Build_Type).subscribe(
      (data: any) => {
        this.isLoading = false;

        this.actionMessageService.sendInfo('Row copied');

        if (this.isMorrison) {
          this.resultGridRef.disabled = true;

          const subscription = this.selectionService.active.subscribe(selection => {
            if (selection.isAdd) {
              this.activeShapeId = selection.shapeId;
              setTimeout(() => {
                this.editRow();
                this.resultGridRef.disabled = false;
                this.resultGridRef.updateData();
                this.changeDetectorRef.detectChanges();
                subscription.unsubscribe();
              }, 1000);
            }
          });
          this.selectionService.changeSelection({
            isAdd: true,
            overlayId: this.activeLayer.id,
            shapeId: data.id.toString()
          });
        } else {
          this.selectionService.removeActive();
          this.resultGridRef.updateData();
        }
      },
      error => {
        this.actionMessageService.sendError(`Row copy error: ${decorateError(error).error.message}`);
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      });
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Copy Record', '');
  }

  copyRowMorrison(state) {
    this.isCopyForm = false;
    this.copyRowBase(state.Build_Type);
  }

  copyRow() {
    if (this.isMorrisonLayer) {
      this.copyRowMorrisonForm();
    } else {
      this.copyRowBase();
    }
  }

  onDeleteRow() {
    const recordId = this.selectionService.getLayerActiveShapeId(this.activeLayer.id);
    this.isLoadingDelete = true;
    this.layerDataService.deleteLayerData(this.activeLayer.id, recordId)
      .subscribe(
        response => {
          this.isLoadingDelete = false;
          this.deleteError = null;
          this.deleteDialogRef.onHide(true);
          this.selectionService.removeActive();
          this.resultGridRef.updateData();
          this.actionMessageService.sendInfo('Row deleted');
          this.selectionService.changeSelection({
            isAdd: false,
            overlayId: this.activeLayer.id,
            shapeId: recordId
          });
          this.applicationInsightsService.logEvent('Layer Data Tab', 'Delete Record', '');
        },
        error => {
          this.deleteError = decorateError(error);
          this.isLoadingDelete = false;
          this.changeDetectorRef.detectChanges();
        });
  }

  onExtensionTrading() {

    const shapeId = this.selectionService.getLayerActiveShapeId(this.activeLayer.id);
    this.layerDataService.getEditLayerData(this.activeLayer, shapeId);
    this.layerDataService.editLayerData.subscribe((items: any) => {
      if (['Detailed Planning Permission', 'Under Construction'].includes(items.results[0]['Extension_Status'])) {
        this.extensionTradingRef.onHide(false);
        this.changeDetectorRef.markForCheck();
        this.changeDetectorRef.detectChanges();
      } else {
        this.actionMessageService.sendInfo('Extension status should be \'Detailed Planning Permission\' or \'Under Construction\'');
      }
    });
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Extension Trading Morrisons', '');
  }

  onMakeStoreExtensionTrading() {
    const recordId = this.selectionService.getLayerActiveShapeId(this.activeLayer.id);
    this.isLoadingExtension = true;
    this.extensionError = null;
    this.layerDataService.makeStoreExtensionTrading(this.activeLayer.id, recordId).subscribe(
      response => {
        this.isLoadingExtension = false;
        this.extensionTradingRef.onHide(true);
        this.selectionService.removeActive();
        this.resultGridRef.updateData();
      },
      error => {
        this.extensionError = decorateError(error);
        this.isLoadingExtension = false;
        this.changeDetectorRef.detectChanges();
      });
  }

  onStreetview() {
    this.streetviewService.setShapeLocation({
      layerId: this.activeLayer.id,
      shapeId: this.selectionService.getLayerActiveShapeId(this.activeLayer.id)
    });
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Street View', '');
  }

  openRow(shapeId) {
    console.log(shapeId);
    this.selectionService.setActive(this.activeLayer.id, shapeId);
    if(this.isViewMode){
      if(this.state == EResultState.RECORD && !isShowBranchDetails(this.activeLayer.id)){
        this.layerDataService.getEditLayerData(this.activeLayer, shapeId);
      }else if(this.state === EResultState.DETAILPANEL && isShowBranchDetails(this.activeLayer.id)){
        this.refreshDetail$.next();
      } else {
        setTimeout(() => {
          if (isShowBranchDetails(this.activeLayer.id)) {
            this.setState(EResultState.DETAILPANEL);
          } else {
            this.setState(EResultState.RECORD);
          }
          this.changeDetectorRef.markForCheck();
          this.changeDetectorRef.detectChanges();
        }, 200);
      }
    }else{
      this.setState(null);
      this.changeDetectorRef.detectChanges();
      setTimeout(() => {
        this.isViewMode = true;
        this.isAddRow = false;
        this.isBatchEdit = false;
        if (isShowBranchDetails(this.activeLayer.id)) {
          this.setState(EResultState.DETAILPANEL);
        } else {
          this.setState(EResultState.RECORD);
        }
        this.changeDetectorRef.markForCheck();
        this.changeDetectorRef.detectChanges();
      }, 200);
    }
  }

  onClose() {
    this.editFormActiveTab = EDetailPanelTabs.Information;
    this.excludingZone = false;
    this.setState(null);
    this.isBatchEdit = false;
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }

  onEdit(event) {
    const {shapeId, activeTab, excludingZone} = event;
    this.setState(null);
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();

    setTimeout(() => {
      this.selectionService.setActive(this.activeLayer.id, shapeId);
      this.isViewMode = false;
      this.isAddRow = false;
      this.excludingZone = excludingZone;
      this.editFormActiveTab = activeTab;
      this.setState(EResultState.RECORD);
      this.isBatchEdit = false;
      this.changeDetectorRef.markForCheck();
      this.changeDetectorRef.detectChanges();
    }, 200);
  }
  editAllRowSelected() {
    this.isViewMode = false;
    this.setState(EResultState.RECORD);
    this.isAddRow = false;
    this.isBatchEdit = true;
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Batch Edit', '');
  }

  onToggleShowSelectedOnly(showSelectedOnly: boolean) {
    this.mapService.onToggleShowSelectedOnly(!showSelectedOnly);
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Selected', !showSelectedOnly);
  }

  onEditColumns() {
    const ref = this.modalService.openModal(AddColumnComponent, {
      layer: this.activeLayer,
    })
    ref.afterClosed().pipe(first()).subscribe(res => {
      if (res) {
        if (res.error) {
          this.actionMessageService.sendError(res.error.message);
        }
        if (res.success) {
          this.actionMessageService.sendInfo('Edit success');
        }
      }
      this.changeDetectorRef.detectChanges();
    })
    this.changeDetectorRef.detectChanges();
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Manage Columns', '');
  }
  onCalculateColumn() {
    const ref = this.modalService.openModal(CalculateColumnComponent, {
      layer: this.activeLayer,
    })
    ref.afterClosed().pipe(first()).subscribe(res => {
      if (res) {
        if (res.error) {
          this.actionMessageService.sendError(res.error.message);
        }
        if (res.success) {
          this.actionMessageService.sendInfo('Edit success');
        }
      }
      this.changeDetectorRef.detectChanges();
    })
    this.changeDetectorRef.detectChanges();
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Column Calculater', '');
  }
  onNewLayerFromFilter(filter: IFilter) {
    this.ngZone.run(() => {
      let filterNew = Object.assign({}, filter);
      const ref = this.modalService.openModal(MatchCreateLayerComponent, {
        createFilterAsLayer: this.layerDataService.getLayerInfoWithFilter(this.activeLayer, filterNew),
      })
    })
    this.applicationInsightsService.logEvent('Layer Data Tab', 'New Layer From Filter', '');
  }
  onShowGroups() {
    this.showGroups = !this.showGroups;
    this.changeDetectorRef.detectChanges();
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Column Groups', this.showGroups);
  }
  onDownloadPackageCode(layerId: string) {
    if (!layerId) return;
    this.layerDataService.downloadDatapackageCode(layerId);
  }

  onCreateLabelStyle(style: ILabelStyle = null) {
    this.editStyle = style;
    this.setState(EResultState.LABELSTYLE);
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Add Label Style', '');
  }

  setState(state: EResultState = null) {
    this.state = state;
  }

  getActiveStyle(layerId) {
    this.activeLabelStyle = this.labelService.getActiveStyleByLayerId(layerId);
    this.changeDetectorRef.detectChanges();
  }

  setActiveStyle(layerId, style: ILabelStyle) {
    this.activeLabelStyle = this.labelService.setActiveStyleByLayerId(layerId, style);
    this.changeDetectorRef.detectChanges();
  }

  getLabelStyles(layerId) {
    const styles = this.labelService.getStylesByLayerId(layerId);
    this.labelStyles.next([...styles]);
    this.changeDetectorRef.detectChanges();
  }

  onChangeStyle($event) {
    const { data } = $event;
    if (!this.activeLayerId) return;
    this.setActiveStyle(this.activeLayerId, data);
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Edit Label Style', '');
  }

  onCloseLabelStyle(event) {
    if (!event) {
      this.state = null;
    } else {
      const { data } = event;
      this.saveStyle(data);
    }
    this.editStyle = null;
  }

  saveStyle(data: ILabelStyle) {
    this.labelStyleLoading.next(true);
    try {
      this.labelService.updateStyle(this.activeLayerId, data)
        .subscribe(data => {
          this.getLabelStyles(this.activeLayerId);
          this.getActiveStyle(this.activeLayerId);
          this.labelStyleLoading.next(false);
          this.onCloseLabelStyle(null);
        }, error => {
          this.actionMessageService.sendError(decorateError(error).error.message);
        })
    } catch (error) {
      this.actionMessageService.sendError(decorateError(error).error.message);
      this.labelStyleLoading.next(false);
    }
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Save Label Style', '');
  }
  onDeleteStyle(style: ILabelStyle) {
    try {
      this.labelService.deleteStyle(this.activeLayerId, style.id).subscribe(data => {
        this.getLabelStyles(this.activeLayerId);
        this.getActiveStyle(this.activeLayerId);
        this.actionMessageService.sendSuccess("Delete label style successful")
      }, error => {
        this.actionMessageService.sendError(decorateError(error).error.message);
      })
    } catch (error) {
      this.actionMessageService.sendError(decorateError(error).error.message);
    }
    this.applicationInsightsService.logEvent('Layer Data Tab', 'Delete Label Style', '');
  }
  toPsSelectOptions(layerGroups: ILayerGroup[]): PsSelectOption[] {
    return layerGroups.map((group,index)=>({
      label: group.name,
      value: index,
      items: group.layers.map((layer,i)=>({
        label: layer.name,
        value: layer.id,
      }))
    }))
  }
}

