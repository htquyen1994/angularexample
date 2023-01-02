import { createAction, props } from "@ngrx/store";

const ZOOM_TO = '[MAP - ACTION] Zoom to';

const zoomTo = createAction(
  ZOOM_TO,
  props<{ locations: google.maps.LatLng[], zoomLevel?: number}>()
);

export const mapActions = {
  zoomTo,
}
