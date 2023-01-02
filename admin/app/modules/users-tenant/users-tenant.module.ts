import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersTenantComponent } from './users-tenant.component';
import { SharedModule } from '@admin-shared/shared.module';
import { UsersTenantRoutingModule } from '@admin-modules/users-tenant/users-tenant-routing.module'
import { EffectsModule } from '@ngrx/effects';
import { MasterDataEffects } from '../../store/effects/master-data.effect';
import { UserSharedModule } from '@admin-modules/user-handler/user-shared.module';
@NgModule({
  imports: [
    SharedModule,
    UserSharedModule,
    UsersTenantRoutingModule,
    EffectsModule.forFeature([MasterDataEffects]),
  ],
  declarations: [UsersTenantComponent],
  providers: []
})
export class UsersTenantModule { }
