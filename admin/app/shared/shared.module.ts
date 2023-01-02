import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PrimeNGModules } from './prime-ng.module';
import { PeriscopeDropdownComponent } from './components/periscope-dropdown/periscope-dropdown.component';
import { TableModule } from 'src/periscope-lib/src/lib/table/table.module';
import { MaterialModules } from 'src/periscope-lib/src/lib/material.module';
import { SpinnerModule } from 'src/periscope-lib/src/lib/spinner/spinner.module';
import { CommonsModule } from 'src/periscope-lib/src/lib/commons/commons.module';
import { NgxPipeFunctionModule } from 'ngx-pipe-function';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { PasswordStrengthMeterModule } from 'angular-password-strength-meter';
import { TabViewModule } from '@periscope-lib/tab-view/tab-view.module';
import { ErrorPipe } from './pipes';
const components: Array<any> = [
  PeriscopeDropdownComponent,
  ConfirmDialogComponent,
]

const modules = [
  CommonModule,
  FormsModule,
  ReactiveFormsModule,
  MaterialModules,
  PrimeNGModules,
  TableModule,
  SpinnerModule,
  NgxPipeFunctionModule,
  CommonsModule,
  PasswordStrengthMeterModule,
  TabViewModule
]

const PIPES = [
  ErrorPipe
]

@NgModule({
  declarations: [
    ...components,
    ...PIPES
  ],
  imports: [
    ...modules
  ],
  exports: [
    ...modules,
    ...components,
    ...PIPES
  ],
  providers: [],
  entryComponents: [ConfirmDialogComponent]
})
export class SharedModule { }
