import { NgModule } from '@angular/core';
import { UiModule } from '@client/app/shared/ui.module';
import { ViewManagementStoreModule } from './view-management-store.module';
import { ViewManagementEffectsModule } from './view-management-effects.module';
import { InsightViewManagementComponent, CatchmentViewManagementComponent } from './containers';
import { ViewManagementListComponent } from './components';
import { CatchmentValueValidatorDirective } from './directives';

const COMPONENTS = [
  InsightViewManagementComponent,
  ViewManagementListComponent,
  CatchmentViewManagementComponent,
  CatchmentValueValidatorDirective
]

const MODULES = [
  UiModule,
  ViewManagementStoreModule,
  ViewManagementEffectsModule,
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
  entryComponents: [InsightViewManagementComponent, CatchmentViewManagementComponent]
})
export class ViewManagementModule { }
