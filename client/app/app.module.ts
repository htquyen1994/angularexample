import { NgModule } from '@angular/core';
import { AppStoreModule } from './app-store.module';
import { MapModule } from './map/map.module';
import { SidepanelModule } from './sidepanel/sidepanel.module';
import { ResultpanelModule } from './resultpanel/resultpanel.module';
import { AppComponent } from './app.component';
import { AccountComponent } from './map/account/account.component';
import { MessageAreaComponent } from './map/message-area/message-area.component';
import { CoreModule } from '@client/app/core/core.module';
import { SharedModule } from './shared/shared.module'
import { CommonModule } from '@angular/common';
import { MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_FORMATS } from '@angular/material-moment-adapter';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonHttpInterceptor } from './shared/http.util';

const MODULES = [
  CommonModule,
  CoreModule,
  MapModule,
  SidepanelModule,
  ResultpanelModule,
  SharedModule,
  AppStoreModule,
]
@NgModule({
  imports: [
   ...MODULES
  ],
  declarations: [AppComponent, AccountComponent, MessageAreaComponent],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    { provide: HTTP_INTERCEPTORS, useClass: CommonHttpInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
