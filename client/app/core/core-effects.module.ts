import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { MessageEffects, LayerEffects, MapEffects, MapToolsEffects } from './store/effects';
@NgModule({
  imports: [
    EffectsModule.forFeature([MessageEffects, LayerEffects, MapEffects, MapToolsEffects]),
  ],
  exports: [EffectsModule],
})
export class CoreEffectsModule { }
