import { NgModule } from '@angular/core';
import { TabViewComponent } from './tab-view.component';
import { CommonModule } from '@angular/common';
import { TabPanelComponent } from './tab-panel.component';
import { SharedModule } from '../commons/shared';

@NgModule({
    declarations: [TabViewComponent, TabPanelComponent],
    imports: [CommonModule, SharedModule],
    exports: [TabViewComponent, TabPanelComponent]
})
export class TabViewModule { }