import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { functionalityFeature } from './constants';
import { functionalityReducer } from './store/reducers/functionality.reducer';

@NgModule({
  imports: [
    StoreModule.forFeature(functionalityFeature, functionalityReducer),
  ],
  exports: [
    StoreModule,
  ]
})
export class FunctionalityStoreModule {}
