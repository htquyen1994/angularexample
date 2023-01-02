import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersTenantComponent } from './users-tenant.component';

const routes: Routes = [{
  path: "",
  component: UsersTenantComponent,
  pathMatch: 'full'
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersTenantRoutingModule { }
