import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { UserRoutingModule } from './user-routing.module';
import { EffectsModule } from '@ngrx/effects';
import { MasterDataEffects } from '../../store/effects/master-data.effect';
import { UserSharedModule } from '../user-handler/user-shared.module'
import { UserComponent } from './user.component';
@NgModule({
  imports: [
    SharedModule,
    UserSharedModule,
    UserRoutingModule,
    EffectsModule.forFeature([MasterDataEffects]),
  ],
  declarations: [UserComponent],
  providers: [],
})
export class UserModule {
}
