import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerModule} from 'primeng/divider';
import { FieldsetComponent } from './fieldset.component';

const COMPONENTS = [
  FieldsetComponent,
];

@NgModule({
  imports: [
    CommonModule,
    DividerModule
  ],
  declarations: COMPONENTS,
  exports: COMPONENTS,
})
export class FieldsetModule { }
