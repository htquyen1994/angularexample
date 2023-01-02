import { NgModule } from '@angular/core';

import { NotificationService } from './services/notification.service';
import {
  NotificationItemComponent,
  NotificationListComponent,
  NotificationDetailComponent
} from './components';
import { NotificationWrapperComponent, NotificationPopupComponent } from './containers';
import { HttpService } from '../shared';
import { UiModule } from '../shared/ui.module';

const COMPONENTS = [
  NotificationItemComponent,
  NotificationListComponent,
  NotificationDetailComponent,
  NotificationWrapperComponent,
  NotificationPopupComponent
]

@NgModule({
  declarations: [
    ...COMPONENTS
  ],
  imports: [
    UiModule
  ],
  exports: [
    ...COMPONENTS
  ],
  providers: [
    NotificationService,
    HttpService
  ],
})
export class NotificationModule { }
