import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { ReferenceDataRoutingModule } from './reference-data-routing.module';
import { ReferenceDataComponent } from './reference-data.component';
import {
  ReferenceDataService,
  ReferenceDataStoreService
} from './services';
import {
  DeleteCacheComponent,
  DependenciesComponent,
  DeleteCacheLayersComponent
} from './components';
import { SharedModule } from '@admin-shared/shared.module';
import { referenceDataReducer } from './store/reducers';
import { ReferenceDataEffects } from './store/effects';
import { referenceDataFeatureKey } from './models';


@NgModule({
  declarations: [ReferenceDataComponent, DeleteCacheComponent, DependenciesComponent, DeleteCacheLayersComponent],
  imports: [
    SharedModule,
    ReferenceDataRoutingModule,
    StoreModule.forFeature(referenceDataFeatureKey, referenceDataReducer),
    EffectsModule.forFeature([ReferenceDataEffects])
  ],
  providers: [
    ReferenceDataService,
    ReferenceDataStoreService
  ],
  entryComponents: [DeleteCacheComponent, DependenciesComponent, DeleteCacheLayersComponent]
})
export class ReferenceDataModule { }
