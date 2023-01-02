import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SpinnerBtnDirective } from './directives/spinner-btn.directive';
import { MinDirective } from './directives/min.directive';
import { MaxDirective } from './directives/max.directive';
import { RegexHighlightPipe } from './pipes';
import { TextOverflowTooltipDirective } from './directives/text-overflow-tooltip.directive'

const DIRECTIVES = [
  SpinnerBtnDirective,
  MinDirective,
  MaxDirective,
  RegexHighlightPipe,
  TextOverflowTooltipDirective
]

const MODULES = [
  CommonModule
]

@NgModule({
  declarations: [
    ...DIRECTIVES
  ],
  imports: [
    ...MODULES
  ],
  exports: [
    ...DIRECTIVES
  ]
})
export class CommonsModule { }
