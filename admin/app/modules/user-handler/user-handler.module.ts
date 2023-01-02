import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ROUTES, Routes } from '@angular/router'
import { AccountService } from '../../core/services/account.service'
import { UserService } from '../user-handler/user.service';

@NgModule({
  imports: [
    SharedModule,
  ],
  declarations: [],
  providers: [
    {
      provide: ROUTES,
      useFactory: configUserHandlerRoutes,
      deps: [AccountService],
      multi: true
    },
    UserService
  ],
})
export class UserHandlerModule {
}

export function configUserHandlerRoutes(accountService: AccountService) {
  let routes: Routes = [];
  if (accountService.isSuperUser()) {
    routes = [{
      path: '', loadChildren: () =>
        import('../users/user.module').then(m => m.UserModule)
    }]
  } else {
    routes = [{
      path: '', loadChildren: () =>
        import('../users-tenant/users-tenant.module').then(m => m.UsersTenantModule)
    }]
  }
  return routes;
}
