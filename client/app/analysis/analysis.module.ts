import { NgModule } from '@angular/core';
import { AnalysisStoreModule } from './analysis-store.module';
import { AnalysisEffectsModule } from './analysis-effects.module';
import { UiModule } from './../shared/ui.module';
import { MatchToolBarComponent, MatchWeightSetupComponent } from './components';
import { MatchItReviewComponent } from '../resultpanel/insights/match-it-review/match-it-review.component';
import { FindComponent } from '../resultpanel/find/find.component';
import { WeightingsSetupComponent } from '../resultpanel/find/weightings-setup/weightings-setup.component';
import { FindService } from '../resultpanel/find/find.service';

const MODULES = [
  UiModule,
  AnalysisStoreModule,
  AnalysisEffectsModule,
]

const COMPONENTS = [
  MatchToolBarComponent,
  MatchWeightSetupComponent,
  MatchItReviewComponent,
  FindComponent,
  WeightingsSetupComponent
]

const SERVICE = [
  FindService
]


@NgModule({
  declarations: [
    ...COMPONENTS
  ],
  imports: [
    ...MODULES
  ],
  exports: [
    ...COMPONENTS
  ],
  providers: [
    ...SERVICE
  ]
})
export class AnalysisModule { }
