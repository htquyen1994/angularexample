import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionButtonComponent } from './selection-button.component';
import {MenuModule} from 'primeng/menu';
import {ButtonModule} from 'primeng/button';
import { NgxPipeFunctionModule } from 'ngx-pipe-function';
import { TooltipModule } from 'primeng/tooltip';


@NgModule({
  declarations: [
    SelectionButtonComponent
  ],
  imports: [
    CommonModule,
    MenuModule,
    ButtonModule,
    NgxPipeFunctionModule,
    TooltipModule
  ],
  exports: [
    SelectionButtonComponent
  ]
})
export class SelectionButtonModule { }
