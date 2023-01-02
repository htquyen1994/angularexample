import {Component, HostBinding, OnInit, ChangeDetectionStrategy, ViewEncapsulation} from '@angular/core';
import {PanelService, AccountService, SettingsService, AppInsightsService} from '../shared';
import { IAccount, IStartUpSettings } from '../shared/interfaces';

@Component({
  selector: 'go-sidepanel',
  moduleId: module.id,
  templateUrl: 'sidepanel.component.html',
  styleUrls: ['sidepanel.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidepanelComponent implements OnInit {

  @HostBinding('attr.aria-hidden') hidden = false;
  tenantName: string;
  isMarketView: boolean;
  activeTab = 2;
  copyrightLevel1: string;
  copyrightLevel2: string;

  constructor(private panelService: PanelService,
              private applicationInsightsService: AppInsightsService,
              private accountService: AccountService,
              private settingsService: SettingsService) {
    this.panelService.sidePanel.subscribe(_ => this.hidden = _);
  }

  ngOnInit() {

    this.settingsService.startupSettings.subscribe((item: IStartUpSettings) => {
      this.activeTab = item.activeTab === null ? 1 : item.activeTab;
    });

    this.accountService.account.subscribe((item: IAccount) => {
      this.tenantName = item.tenantName;
      this.isMarketView = item?.isMarketView;
      this.copyrightLevel1 = this.isMarketView ? "MarketView from Serendipity2" : "Periscope®";
      this.copyrightLevel2 = this.isMarketView ? "Periscope® - Licensed to " + this.tenantName : "© Newgrove Ltd. Licensed to " + this.tenantName;

    });
  }

  onToggle() {
    this.panelService.setSidePanel(!this.panelService.sidePanelValue);
    this.applicationInsightsService.logEvent('Panel - Side', 'State', this.panelService.sidePanelValue ? 'Open' : 'Closed');
  }

  onLabel(tab: number) {
    this.activeTab = tab;
    this.applicationInsightsService.logEvent('Panel - Side', 'Tab', tab === 1 ? 'PLACES' : 'LAYERS');
  }
}
