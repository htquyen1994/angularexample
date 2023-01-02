import { NgModule } from '@angular/core';
import { UiModule } from './ui.module';
import { ViewManagementModule } from '../core/modules';
import { NotificationModule } from '../notification/notification.module';
import { NearestModule } from '../nearest/nearest.module';

const MODULES = [
  UiModule,
  ViewManagementModule,
  NotificationModule,
  NearestModule
]

@NgModule({
  declarations: [],
  imports: [
    ...MODULES
  ],
  exports: [
    ...MODULES
  ]
})
export class SharedModule { }
