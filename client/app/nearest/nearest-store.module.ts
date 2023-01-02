import { NgModule } from '@angular/core';
import { StoreModule } from "@ngrx/store";
import { reducers } from "./store/reducers";
import { featureNearest } from "./constants";

@NgModule({
  imports: [
    StoreModule.forFeature(featureNearest, reducers),
  ],
  exports: [
    StoreModule,
  ]
})
export class NearestStoreModule { }
