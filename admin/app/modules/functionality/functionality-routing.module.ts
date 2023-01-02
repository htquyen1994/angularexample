import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { FunctionalityPageComponent } from './containers/functionality-page/functionality-page.component';

const routes: Routes = [{
  path: "",
  component: FunctionalityPageComponent,
  pathMatch: 'full'
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})

export class FunctionalityRoutingModule { }
