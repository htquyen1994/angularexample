import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DividerComponent } from './divider.component';
import { DividerModule as PrimeDividerModule} from 'primeng/divider'

const COMPONENTS = [
  DividerComponent,
];

@NgModule({
  imports: [
    CommonModule,
    PrimeDividerModule
  ],
  declarations: [...COMPONENTS],
  exports: [...COMPONENTS],
})
export class DividerModule { }
