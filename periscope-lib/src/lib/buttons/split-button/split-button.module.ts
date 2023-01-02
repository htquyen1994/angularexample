import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SplitButtonComponent } from './split-button.component';
import { SplitButtonModule as PrimeNgSplitButtonModule} from 'primeng/splitbutton';
import { TooltipModule } from 'primeng/tooltip'

const MODULES = [
  CommonModule,
  TooltipModule,
  PrimeNgSplitButtonModule,
]

const COMPONENTS = [
  SplitButtonComponent
]

@NgModule({
  declarations: [
    ...COMPONENTS
  ],
  imports: [
    ...MODULES
  ],
  exports: [
    ...COMPONENTS
  ]
})
export class SplitButtonModule { }
