import { NgModule } from '@angular/core';
import { TenantComponent } from './tenant.component';
import { TenantFormComponent } from './tenant-form/tenant-form.component';
import { TenantService } from './tenant.service';
import { SharedModule } from '../../shared/shared.module';
import { TenantRoutingModule } from './tenant-routing.module';
import { EffectsModule } from '@ngrx/effects';
import { MasterDataEffects } from '../../store/effects/master-data.effect';

@NgModule({
    imports: [
        SharedModule,
        TenantRoutingModule,
        EffectsModule.forFeature([MasterDataEffects])
    ],
    exports: [TenantFormComponent],
    declarations: [TenantComponent, TenantFormComponent],
    providers: [TenantService],
    entryComponents: [TenantFormComponent]
})
export class TenantModule {
}
