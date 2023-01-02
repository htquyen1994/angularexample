import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { featureAnalysis } from './constants';
import { reducers } from './store/reducers';

@NgModule({
  imports: [
    StoreModule.forFeature(featureAnalysis, reducers),
  ],
  exports: [
    StoreModule,
  ]
})
export class AnalysisStoreModule {}
