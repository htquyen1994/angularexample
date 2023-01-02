import { NgModule } from '@angular/core';

import { ResultComponent } from './result/result.component';
import { ResultEditComponent } from './result/result-edit/result-edit.component';
import { DocumentFormComponent } from './result/document-form/document-form.component';
import { DocumentFormDialogComponent } from './result/document-form-dialog/document-form-dialog.component';
import { StreetviewComponent } from './streetview/streetview.component';
import { ResultpanelComponent } from './resultpanel.component';
import { DownloadFormComponent } from './result/download-form/download-form.component';
import { LabelFormComponent } from './result/label-form/label-form.component';
import { CopyFormComponent } from './result/copy-form/copy-form.component';
import { BatchFormComponent } from './insights/batch-form/batch-form.component';
import { FilterComponent } from './result/filter/filter.component';
import { FilterShareComponent } from './result/filter/filter-share/filter-share.component';
import { ResultGridComponent } from './result/result-grid/result-grid.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatchCreateLayerComponent } from './insights/match-create-layer/match-create-layer.component';
import { AddColumnComponent } from './add-column/add-column.component';
import { CalculateColumnComponent } from './calculate-column/calculate-column.component';
import { BranchDetailsComponent } from './result/details-panel/branch-details/branch-details.component';
import { SecurityComponent } from './result/details-panel/security/security.component';
import { CustomerSessionsComponent } from './result/details-panel/customer-sessions/customer-sessions.component';
import { OpeningHoursComponent } from './result/details-panel/opening-hours/opening-hours.component';
import { ImagesComponent } from './result/details-panel/images/images.component';
import { DocumentsComponent } from './result/details-panel/documents/documents.component';
import { CustomerSessionsByWeekComponent } from './result/details-panel/customer-sessions-by-week/customer-sessions-by-week.component';
import { CustomerSessionsByWeekService } from './shared/services/customer-sessions-by-week.service';
import { LabelStyleFormComponent } from './result/label-style-form/label-style-form.component';
import { DetailsPanelComponent } from './result/details-panel/details-panel.component';
import { CustomerSessionsByKitComponent } from './result/details-panel/customer-sessions-by-kit/customer-sessions-by-kit.component';
import { CustomerSessionsByKitService } from './shared/services/customer-sessions-by-kit.service';
import { CustomerSessionsByDayTimeComponent } from './result/details-panel/customer-sessions-by-day-time/customer-sessions-by-day-time.component';
import { CustomerSessionsByDateTimeService } from './shared/services/customer-sessions-by-datetime.service';
import { CustomerSessionsAveragesComponent } from './result/details-panel/customer-sessions-averages/customer-sessions-averages.component';
import { CustomerSessionsAveragesService } from './shared/services/customer-sessions-averages.service';
import { CustomerSessionsPerformanceComponent } from './result/details-panel/customer-sessions-performance/customer-sessions-performance.component';
import { CustomerSessionPerformanceService } from './shared/services/customer-sessions-performance.service';
import { DetailPanelImagesService } from './shared/services/detail-panel-images.service';
import { DetailPanelDocumentService } from './shared/services/detail-panel-document.service';
import { OutreachServicesComponent } from './result/details-panel/outreach-services/outreach-services.component';
import { DetailPanelOutreachServicesService } from './shared/services/detail-panel-outreach-services.service';
import { ReportLocationFormComponent } from './result/details-panel/report-location-form/report-location-form.component';
import { NearestLocationsComponent } from './result/details-panel/nearest-locations/nearest-locations.component';
import { DetailPanelSecurityService } from './shared/services/detail-panel-security.service';
import { NearestLocationsService } from './shared/services/nearest-locations.service';
import { BranchPeopleComponent } from './result/details-panel/branch-people/branch-people.component';
import { SecurityViewComponent } from './result/details-panel/security/security-view/security-view.component';
import { SecurityStatisticsComponent } from './result/details-panel/security/security-statistics/security-statistics.component';
import { SecurityRiskAssessmentComponent } from './result/details-panel/security/security-risk-assessment/security-risk-assessment.component';
import { InsightModule } from '../insight/insight.module';
import { SharedModule } from '../shared/shared.module';
import { ResultPanelEffectsModule } from './result-panel-effects.module';
import { ResultPanelStoreModule } from './result-panel-store.module';

const COMPONENTS = [
  ResultComponent,
  StreetviewComponent,
  ResultEditComponent,
  FilterComponent,
  FilterShareComponent,
  ResultGridComponent,
  ResultpanelComponent,
  DownloadFormComponent,
  LabelFormComponent,
  DocumentFormComponent,
  DocumentFormDialogComponent,
  BatchFormComponent,
  CopyFormComponent,
  MatchCreateLayerComponent,
  AddColumnComponent,
  CalculateColumnComponent,
  BranchDetailsComponent,
  SecurityComponent,
  CustomerSessionsComponent,
  OpeningHoursComponent,
  ImagesComponent,
  DocumentsComponent,
  CustomerSessionsByWeekComponent,
  LabelStyleFormComponent,
  DetailsPanelComponent,
  CustomerSessionsByKitComponent,
  CustomerSessionsByDayTimeComponent,
  CustomerSessionsAveragesComponent,
  CustomerSessionsPerformanceComponent,
  OutreachServicesComponent,
  ReportLocationFormComponent,
  NearestLocationsComponent,
  BranchPeopleComponent,
  SecurityViewComponent,
  SecurityStatisticsComponent,
  SecurityRiskAssessmentComponent
];

const MODULES = [
  SharedModule,
  MatDatepickerModule,
  MatInputModule,
  InsightModule,
  ResultPanelEffectsModule,
  ResultPanelStoreModule
]

const PROVIDERS = [
  CustomerSessionsByWeekService,
  CustomerSessionsByKitService,
  CustomerSessionsByDateTimeService,
  CustomerSessionsAveragesService,
  CustomerSessionPerformanceService,
  DetailPanelImagesService,
  DetailPanelOutreachServicesService,
  DetailPanelDocumentService,
  NearestLocationsService,
  DetailPanelSecurityService
]

@NgModule({
  imports: [
    ...MODULES,
  ],
  declarations: [
    ...COMPONENTS
  ],
  providers: [
    ...PROVIDERS
  ],
  exports: [ResultpanelComponent],
  entryComponents: [MatchCreateLayerComponent, AddColumnComponent, CalculateColumnComponent]
})
export class ResultpanelModule {
}
