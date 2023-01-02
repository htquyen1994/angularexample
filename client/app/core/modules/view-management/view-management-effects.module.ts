import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { ViewManagementEffects } from './store/effects'

@NgModule({
  imports: [
    EffectsModule.forFeature([ViewManagementEffects]),
  ],
  exports: [EffectsModule],
})
export class ViewManagementEffectsModule { }
