import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputModule } from './input/input.module';
import { SelectModule } from './select/select.module';



@NgModule({
  imports: [
    CommonModule,
    InputModule,
    SelectModule
  ],
  exports: [InputModule, SelectModule]
})
export class FormModule { }
