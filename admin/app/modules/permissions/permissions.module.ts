import { NgModule } from '@angular/core';
import { PermissionsRoutingModule } from './permissions-routing.module';
import { PermissionsComponent } from './permissions.component';
import { SharedModule } from '../../shared/shared.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { PermissionEffects } from './effects/permission.effects';
import { PermissionsService } from './services/permissions.service';
import {
  EditTemplateDialogComponent,
  AdministrativeClaimsComponent,
  SaveAsTemplateDialogComponent
} from './components'
import { permissionFeatureKey } from './constants';
import { permissionReducer } from './reducers/permission.reducer';
@NgModule({
  declarations: [
    PermissionsComponent,
    SaveAsTemplateDialogComponent,
    AdministrativeClaimsComponent,
    EditTemplateDialogComponent
  ],
  imports: [
    SharedModule,
    PermissionsRoutingModule,
    StoreModule.forFeature(permissionFeatureKey, permissionReducer),
    EffectsModule.forFeature([PermissionEffects])
  ],
  providers: [
    PermissionsService
  ],
  entryComponents: [SaveAsTemplateDialogComponent, EditTemplateDialogComponent]
})
export class PermissionsModule { }
