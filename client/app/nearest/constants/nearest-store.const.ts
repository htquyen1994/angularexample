import { NearestTool, NearestResult } from "../interfaces";
import { TravelMode } from '../../core/modules/view-management/enums'

export const initialNearestToolState: NearestTool = {
  formGroup: {
    value: 10,
    layerId: null,
    filterId: null,
    mode: TravelMode.CAR,
  },
  filters: [],
  pointShapes: [],
}

export const initialNearestResultState: NearestResult = {
  results: null,
  loading: false,
  downloading: false,
  error: null,
  payload: null,
  columns: null
}
