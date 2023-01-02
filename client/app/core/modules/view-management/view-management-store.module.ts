import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { featureViewManagement } from './constants';
import { viewManagementReducer } from './store/reducers';

@NgModule({
  imports: [
    StoreModule.forFeature(featureViewManagement, viewManagementReducer),
  ],
  exports: [
    StoreModule,
  ]
})
export class ViewManagementStoreModule {}
