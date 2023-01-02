import { setLevel, disableAll } from 'loglevel';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AdminComponent } from './admin.component';
import { PageComponent } from './page/page.component';
import { MessageAreaComponent } from './shared/components/message-area/message-area.component';
import { SharedModule } from './shared/shared.module';
import { CoreModule } from './core/core.module';
import { MAT_DATE_LOCALE, DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MomentDateAdapter, MAT_MOMENT_DATE_FORMATS } from '@angular/material-moment-adapter';

@NgModule({
    imports: [
        BrowserModule,
        BrowserAnimationsModule,
        SharedModule,
        CoreModule,
        AppRoutingModule,
    ],
    declarations: [
        AdminComponent,
        PageComponent,
        MessageAreaComponent,
    ],
    providers: [
      { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
      { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
      { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
    ],
    bootstrap: [AdminComponent]
})
export class AdminModule {
    constructor() {
        if (environment.production) {
            disableAll();
        } else {
            setLevel('trace');
        }
    }
}
