import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { NearestToolEffects, NearestResultEffects } from './store/effects';
@NgModule({
  imports: [
    EffectsModule.forFeature([NearestToolEffects, NearestResultEffects]),
  ],
  exports: [EffectsModule],
})
export class NearestEffectsModule { }
