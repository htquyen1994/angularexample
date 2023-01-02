import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GalleriaModule } from './galleria/galleria';
import { DropdownModule } from 'primeng/dropdown';

const MODULES = [
  GalleriaModule,
  DropdownModule
]
@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    ...MODULES
  ],
  exports: [
    ...MODULES
  ]
})
export class PsPrimengModule { }
