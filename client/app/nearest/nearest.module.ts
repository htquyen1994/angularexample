import { NgModule } from '@angular/core';
import { UiModule } from '../shared/ui.module';
import { NearestStoreModule } from './nearest-store.module';
import { NearestEffectsModule } from './nearest-effects.module';
import { NearestStoreService, NearestLogicService } from './services';

import {
  NearestListComponent,
  NearestToolBarComponent
} from './components';

import {
  NearestMapToolComponent,
  NearestResultComponent
} from './containers';

const COMPONENTS = [
  NearestListComponent,
  NearestToolBarComponent,
  NearestMapToolComponent,
  NearestResultComponent
];

const MODULES = [
  UiModule,
  NearestStoreModule,
  NearestEffectsModule
]

const PROVIDERS = [
  NearestStoreService,
  NearestLogicService
]

@NgModule({
  declarations: [...COMPONENTS],
  imports: [
    ...MODULES
  ],
  exports: [
    ...COMPONENTS
  ],
  providers: [
    ...PROVIDERS
  ]
})
export class NearestModule { }
