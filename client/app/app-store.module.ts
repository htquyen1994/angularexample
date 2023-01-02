import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { environment } from '../environments/environment';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';


const MODULES = [
  StoreModule.forRoot({}),
  EffectsModule.forRoot([]),
  environment.production ? [] : StoreDevtoolsModule.instrument(),
];

@NgModule({
  declarations: [],
  imports: [...MODULES],
  exports: [StoreModule, environment.production ? [] : StoreDevtoolsModule, EffectsModule],
})
export class AppStoreModule {}
