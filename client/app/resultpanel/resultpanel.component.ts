import { Component, HostBinding, ChangeDetectorRef, ElementRef, ChangeDetectionStrategy, Input, NgZone } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
import { Tab, TabName, TabType } from '../shared/models/resultpanel.model';

import {
  PanelService,
  AccountService,
  LayerStyleService,
  ActionMessageService,
  LayerService,
  AppInsightsService,
} from '../shared';
import { IAccount, ILayerStyleChange } from '../shared/interfaces';
import { LayerStyleType } from '../shared/models/layer-style.model';
import { Observable } from 'rxjs';
import { ResultPanelStoreService } from './services';
import { ResultPanelCollapseState } from '../core/enums';
import { PanelStoreService } from '../core/services';
@Component({
  selector: 'go-resultpanel',
  moduleId: module.id,
  templateUrl: 'resultpanel.component.html',
  styleUrls: ['resultpanel.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResultpanelComponent {

  @Input() state: ResultPanelCollapseState;
  TabType = TabType;

  viewNearest = false;
  viewInsight = false;
  hasFind = false;
  account: IAccount;
  public TabName = TabName;
  private numberOfHeatmaps = 0;
  tabs$: Observable<Tab[]>;
  activeTab$: Observable<Tab>;
  ResultPanelCollapseState = ResultPanelCollapseState;
  constructor(private panelService: PanelService,
    private changeRef: ChangeDetectorRef,
    private accountService: AccountService,
    private layerStyleService: LayerStyleService,
    private layerService: LayerService,
    private applicationInsightsService: AppInsightsService,
    private actionMessageService: ActionMessageService,
    private _resultPanelStoreService: ResultPanelStoreService,
    private _panelStoreServices: PanelStoreService,
    private _ngZone: NgZone
  ) {

  }

  ngOnInit(): void {
    this._resultPanelStoreService.getTabs();

    this.tabs$ = this._resultPanelStoreService.tabs$;
    this.activeTab$ = this._resultPanelStoreService.activeTab$;


    this.accountService.account.subscribe((item: IAccount) => {
      this.viewNearest = item.viewNearest;
      this.viewInsight = item.viewInsight;
      this.hasFind = item.hasFind;
      // this.tabs[3].show = this.hasFind;
      this.changeRef.detectChanges();
    });

    this.layerStyleService.styleChange.pipe(debounceTime(100)).subscribe((change: ILayerStyleChange) => {
      this.updateHeatmapCount();
    });

    this.layerService.layerSelected.pipe(debounceTime(100)).subscribe(layer => {
      this.updateHeatmapCount();
    });

    this.panelService.changeDetection.subscribe(() => {
      this.changeRef.detectChanges();
    });
  }

  public trackByIndex(index: number, _: any): number {
    return index;
  }

  public isShowPanel([id, tabs]) {
    const tab = tabs.find(e => e.id === id);
    return tab && tab.show;
  }

  updateHeatmapCount() {
    let numberOfHeatmaps = 0;

    this.layerStyleService.getActiveStyleLayerIds().forEach((layerId: string) => {
      const style = this.layerStyleService.getActiveStyle(layerId);
      if (!style) return;
      const layer = this.layerService.layerStore.get(layerId);
      if (style.type === LayerStyleType.HEATMAP && this.layerService.layerSelectedStore.has(layer)) {
        numberOfHeatmaps += 1;
      }
    });

    if (numberOfHeatmaps >= 2 && this.numberOfHeatmaps !== numberOfHeatmaps) {
      this.actionMessageService.sendWarning(`Showing ${numberOfHeatmaps} heatmaps`);
    }
    this.numberOfHeatmaps = numberOfHeatmaps;
  }

  setState(state: ResultPanelCollapseState) {
    this._panelStoreServices.setResultPanelState(state);
    this.applicationInsightsService.logEvent('Panel - Result', 'State', state);
  }

  onActive(tab: Tab) {
    if (tab.disabled) {
      return;
    }
    this.onActiveById(tab.id);
  }

  onActiveById(id: TabName) {
    this._resultPanelStoreService.setActiveTab(id);
    this.applicationInsightsService.logEvent('Panel - Result', 'Tab', id);
  }

  onActiveStreetView(state: boolean) {
    this._ngZone.run(()=>{
      this.onActiveById(TabName.STREET_VIEW);
      this._panelStoreServices.setResultPanelState(ResultPanelCollapseState.HALF_SCREEN);
    })
  }

  onCloseTab(tab: Tab) {
    this._resultPanelStoreService.closeTab(tab.id)
    // if (tab.id === TabName.INSIGHTS) {
    //   this._insightStoreService.activeInsightResult(false)
    // }
  }
}
