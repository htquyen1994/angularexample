import { NgModule } from '@angular/core';

import { UiModule } from '../shared/ui.module';

import {
  InsightToolBarComponent,
  InsightListComponent,
} from './components';

import {
  InsightResultComponent
} from './containers';

import {
} from './services';

import { InsightStoreModule } from './insight-store.module';
import { InsightEffectsModule } from './insight-effects.module';
import { AnalysisModule } from '../analysis/analysis.module';

const MODULES = [
  InsightStoreModule,
  InsightEffectsModule,
  UiModule,
  AnalysisModule
]

const COMPONENTS = [
  InsightListComponent,
  InsightToolBarComponent,
  InsightResultComponent,
]

@NgModule({
  declarations: [...COMPONENTS],
  imports: [
    ...MODULES
  ],
  exports: [
    ...COMPONENTS,
    AnalysisModule
  ]
})
export class InsightModule { }
