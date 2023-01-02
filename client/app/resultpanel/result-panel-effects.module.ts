import { resultPanelEffects } from "./store/effects";
import { EffectsModule } from "@ngrx/effects";
import { NgModule } from "@angular/core";

@NgModule({
  imports: [
    EffectsModule.forFeature([resultPanelEffects]),
  ],
  exports: [EffectsModule],
})
export class ResultPanelEffectsModule { }
