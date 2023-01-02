import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {
  ActionMessageService,
  BreakpointService,
  AccountService,
  BaseHttp,
  AuthenticationService,
  MasterDataService,
  PermissionGuardService,
  PageGuardService,
  HelperService,
  ApiInterceptorService,
  PermissionInterceptorService
} from './services';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { environment } from 'src/admin/environments/environment';
import { AccountEffects } from '../store/effects/account.effect';
import { appReducers } from '../store/reducers/app.reducers';
import { MasterDataEffects } from '../store/effects/master-data.effect';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
@NgModule({
    declarations: [
    ],
    imports: [
        HttpClientModule,
        StoreModule.forRoot(appReducers),
        EffectsModule.forRoot([AccountEffects, MasterDataEffects]),
        !environment.production ? StoreDevtoolsModule.instrument() : [],
    ],
    exports: [
    ],
    providers: [
        ActionMessageService,
        BreakpointService,
        AccountService,
        { provide: HTTP_INTERCEPTORS, useClass: PermissionInterceptorService, multi: true, },
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptorService, multi: true, },
        BaseHttp,
        AuthenticationService,
        MasterDataService,
        PermissionGuardService,
        PageGuardService,
        HelperService
    ]
})
export class CoreModule {
    constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
        if (parentModule) {
            throw new Error('CoreModule has already been loaded. You should only import Core modules in the AppModule only.');
        }
    }
}
