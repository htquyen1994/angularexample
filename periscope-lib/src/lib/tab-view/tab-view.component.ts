import { ViewEncapsulation, Component, ChangeDetectionStrategy, QueryList, ContentChildren, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { TabPanelComponent } from './tab-panel.component';
import { ReplaySubject } from 'rxjs';

@Component({
    selector: 'ps-tabview',
    templateUrl: './tab-view.component.html',
    styleUrls: ['./tab-view.component.less'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TabViewComponent {
    @Output() change = new EventEmitter<{ index: number; source: TabPanelComponent }>();
    @ContentChildren(TabPanelComponent) tabPanels: QueryList<TabPanelComponent>;
    tabs: TabPanelComponent[];
    _activeIndex: number;
    constructor(private cd: ChangeDetectorRef) { }
    ngAfterContentInit() {
        this.initTabs();
        this.tabPanels.changes.subscribe(_ => {
            this.initTabs();
        });
    }
    initTabs(): void {
        this.tabs = this.tabPanels.toArray();
        let selectedTab = this.findSelectedTab();
        if (!selectedTab && this.tabs.length) {
            this.tabs[0].selected = true;
        } else if (selectedTab && this.tabs.length) {
            for (let i = 0; i < this.tabs.length; i++) {
                if (this.tabs[i].selected) {
                    this.tabs[i].selected = false;
                }
            }
            selectedTab.tab.selected = true;
        }
    }
    open(event: Event, tab: TabPanelComponent, index: number) {
        if (tab.disabled) {
            if (event) {
                event.preventDefault();
            }
            return;
        }
        if (!tab.selected) {
            let selectedTab = this.findSelectedTab();
            if (selectedTab) {
                selectedTab.tab.selected = false;
            }

            tab.selected = true;
            this.change.next({ index, source: tab });
        }

        if (event) {
            event.preventDefault();
        }
    }

    findSelectedTab() {
        for (let i = 0; i < this.tabs.length; i++) {
            if (this.tabs[i].selected) {
              return { tab: this.tabs[i], index: i };
            }
        }
        return null;
    }

    findTabNotDisabled() {
      for (let i = 0; i < this.tabs.length; i++) {
          if (!this.tabs[i].disabled) {
              return {tab:this.tabs[i], index: i};
          }
      }
      return null;
    }

    detectChange() {
      this.checkSelectedTab();
      this.cd.detectChanges();
    }

    checkSelectedTab(){
      const selectedTab = this.findSelectedTab();
      if(selectedTab && selectedTab.tab.disabled){
        selectedTab.tab.selected = false;
        const {index,tab} = this.findTabNotDisabled();
        tab.selected = true;
        this.change.next({ index, source: tab });
      }
    }
}
