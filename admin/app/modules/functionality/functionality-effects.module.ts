import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { FunctionalityEffects } from './store/effects'

@NgModule({
  imports: [
    EffectsModule.forFeature([FunctionalityEffects]),
  ],
  exports: [EffectsModule],
})
export class FunctionalityEffectsModule { }
