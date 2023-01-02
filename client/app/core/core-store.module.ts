import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { environment } from '@client/environments/environment';
import { appFeature } from './constants';
import { reducers } from './store/reducers';

@NgModule({
  imports: [
    StoreModule.forFeature(appFeature, reducers),
  ],
  exports: [
    StoreModule,
  ]
})
export class CoreStoreModule {}
