import { StoreModule } from "@ngrx/store";
import { NgModule } from "@angular/core";
import { featureResultPanel } from "./constants";
import { reducers } from './store/reducers';

@NgModule({
  imports: [
    StoreModule.forFeature(featureResultPanel, reducers),
  ],
  exports: [
    StoreModule,
  ]
})
export class ResultPanelStoreModule { }
