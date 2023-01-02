import { NgModule } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { DialogService } from 'primeng/dynamicdialog';
import {
  OverlayService,
  SelectionService,
  LayerService,
  LayerDataService,
  LocationService,
  PanelService,
  MapService,
  HttpService,
  AccountService,
  HubService,
  FilterService,
  LayerGroupService,
  LayerStyleService,
  SettingsService,
  ActionMessageService,
  InsightService,
  WorkerService,
  IsogramService,
} from '@client/app/shared';

import { DrawingService } from '@client/app/map/services/drawing.service';
import { StreetviewService } from '@client/app/resultpanel/streetview/streetview.service';
import { WorkerMapProcessingService } from '@client/app/shared/services/worker-map-processing.service';
import { ReportService } from '@client/app/reports/services/report.service';
import { DetailPanelService } from '@client/app/resultpanel/shared/services/detail-panel.service';
import { SystemBreakdownService } from '@client/app/shared/services/system-breakdown.service';

import { CoreStoreModule } from './core-store.module';
import { CoreEffectsModule } from './core-effects.module';
import { MessageStoreService } from './services';
const MODULES = [
  HttpClientModule,
  CoreStoreModule,
  CoreEffectsModule
]

const PROVIDERS = [
  LayerService,
  LayerGroupService,
  FilterService,
  MapService,
  LayerStyleService,
  OverlayService,
  LayerDataService,
  SelectionService,
  LocationService,
  PanelService,
  HttpService,
  AccountService,
  DrawingService,
  HubService,
  SettingsService,
  ActionMessageService,
  InsightService,
  StreetviewService,
  WorkerService,
  ReportService,
  IsogramService,
  DetailPanelService,
  WorkerMapProcessingService,
  SystemBreakdownService,
  DialogService,
]

const PROVIDERS_STORE = [
  MessageStoreService
]
@NgModule({
  declarations: [],
  imports: [
      ...MODULES
  ],
  providers: [
    ...PROVIDERS,
    ...PROVIDERS_STORE
  ]
})
export class CoreModule { }
