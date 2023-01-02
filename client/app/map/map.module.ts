import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EditLabelComponent } from './edit-label/edit-label.component';
import { IsogramComponent } from './isogram/isogram.component';
import { InsightToolComponent } from './insight-tool/insight-tool.component';
import { MapComponent } from './map.component';
import { UiModule } from '../shared/ui.module';
import { ReportPanelComponent } from '../reports/report-panel/report-panel.component';
import { QuickEditComponent } from './quick-edit/quick-edit.component';
import { QuickEditService } from './services/quick-edit.service';
import { MeasureToolService } from './services/measure-tool.service';
import { MeasurementComponent } from './measurement/measurement.component';
import { RouteToolComponent } from './route-tool/route-tool.component';
import { MapToolDisabledPipe, MapToolAvailablePipe } from './pipes';
import { SettingConfirmPopupComponent } from './account/setting-confirm-popup/setting-confirm-popup.component';
import { CrimeStatisticComponent } from './crime-statistic/crime-statistic.component';
import { IsogramService } from '../shared/isogram.service';
import { LocationFormContainerComponent } from './containers/location-form-container/location-form-container.component';
import { SharedModule } from '../shared/shared.module';
import { AccountSettingDialogComponent } from './account/account-setting-dialog/account-setting-dialog.component';
@NgModule({
    imports: [SharedModule],
    exports: [MapComponent],
    declarations: [
        IsogramComponent,
        MapComponent,
        EditLabelComponent,
        InsightToolComponent,
        ReportPanelComponent,
        QuickEditComponent,
        MeasurementComponent,
        RouteToolComponent,
        MapToolDisabledPipe,
        SettingConfirmPopupComponent,
        CrimeStatisticComponent,
        LocationFormContainerComponent,
        MapToolAvailablePipe,
        AccountSettingDialogComponent
    ],
    entryComponents: [
        QuickEditComponent,
        RouteToolComponent,
        AccountSettingDialogComponent
    ],
    providers: [QuickEditService, MeasureToolService, IsogramService]
})
export class MapModule {
}
