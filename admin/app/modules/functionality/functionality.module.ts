import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FunctionalityPageComponent } from './containers';
import { FunctionalityRoutingModule } from './functionality-routing.module';
import { FunctionalityStoreModule } from './functionality-store.module';
import { FunctionalityEffectsModule } from './functionality-effects.module';

import {
  FunctionalityListComponent,
  FunctionalityFilterComponent
} from './components';

const COMPONENTS = [
  FunctionalityPageComponent,
  FunctionalityListComponent,
  FunctionalityFilterComponent
]

const MODULES = [
  SharedModule,
  FunctionalityRoutingModule,
  FunctionalityStoreModule,
  FunctionalityEffectsModule
]

@NgModule({
  declarations: [
    ...COMPONENTS,

  ],
  imports: [
    ...MODULES
  ]
})
export class FunctionalityModule { }
