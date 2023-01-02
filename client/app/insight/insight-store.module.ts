import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { featureInsight } from './constants';
import { reducers } from './store/reducers';

@NgModule({
  imports: [
    StoreModule.forFeature(featureInsight, reducers),
  ],
  exports: [
    StoreModule,
  ]
})
export class InsightStoreModule {}
