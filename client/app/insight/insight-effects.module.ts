import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { InsightResultEffects } from './store/effects'

@NgModule({
  imports: [
    EffectsModule.forFeature([InsightResultEffects]),
  ],
  exports: [EffectsModule],
})
export class InsightEffectsModule { }
