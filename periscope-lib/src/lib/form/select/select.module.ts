import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectComponent } from './select.component';
import { MultiSelectComponent } from './multi-select.component';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
@NgModule({
  declarations: [SelectComponent, MultiSelectComponent],
  imports: [
    CommonModule,
    FormsModule,
    DropdownModule,
    MultiSelectModule
  ],
  exports: [SelectComponent, MultiSelectComponent]
})
export class SelectModule { }
