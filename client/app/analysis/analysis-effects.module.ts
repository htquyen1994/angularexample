import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { AnalysisEffects } from './store/effects'

@NgModule({
  imports: [
    EffectsModule.forFeature([AnalysisEffects]),
  ],
  exports: [EffectsModule],
})
export class AnalysisEffectsModule { }
