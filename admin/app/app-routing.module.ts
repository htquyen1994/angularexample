import { APP_BASE_HREF, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PermissionGuardService } from '@admin-core/services/permission-guard.service';
import { PageComponent } from './page/page.component';
import { PageGuardService } from '@admin-core/services/page-guard.service';

const routes: Routes = [
  {
    path: '',
    component: PageComponent,
    canActivateChild: [PageGuardService],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'tenants',
        canActivate: [PermissionGuardService],
      },
      {
        path: 'tenants', loadChildren: () =>
          import('@admin-modules/tenants/tenant.module').then(m => m.TenantModule),
        canActivate: [PermissionGuardService],
      }, {
        path: 'users', loadChildren: () =>
          import('@admin-modules/user-handler/user-handler.module').then(m => m.UserHandlerModule),
        canActivate: [PermissionGuardService],
        canLoad: [PermissionGuardService]
      }, {
        path: 'permissions', loadChildren: () =>
          import('@admin-modules/permissions/permissions.module').then(m => m.PermissionsModule),
        canActivate: [PermissionGuardService],
      }, {
        path: 'reports', loadChildren: () =>
          import('@admin-modules/reports/reports.module').then(m => m.ReportsModule),
        canActivate: [PermissionGuardService],
      }, {
        path: 'tools', loadChildren: () =>
          import('@admin-modules/tools/tools.module').then(m => m.ToolsModule),
        canActivate: [PermissionGuardService],
      }, {
        path: 'data', loadChildren: () =>
          import('@admin-modules/reference-data/reference-data.module').then(m => m.ReferenceDataModule),
        canActivate: [PermissionGuardService],
      },{
        path: 'functionality', loadChildren: () =>
          import('@admin-modules/functionality/functionality.module').then(m => m.FunctionalityModule),
        canActivate: [PermissionGuardService],
      }, {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
      },
    ]
  }, {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  },
];

@NgModule({
  exports: [RouterModule],
  imports: [RouterModule.forRoot(routes)],
  providers: [
    { provide: APP_BASE_HREF, useValue: '/' },
    { provide: LocationStrategy, useClass: HashLocationStrategy }
  ]
})
export class AppRoutingModule {
}
