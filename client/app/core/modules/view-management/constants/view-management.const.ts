import { IViewManagementState } from "../interface";
import { ISelectionButton } from '@periscope-lib/buttons/selection-button/selection-button.component';
import { TravelType, TravelMode, TravelDirectionType, TravelRevolution } from '../enums';

export const featureViewManagement = 'featureViewManagement';

export const initialViewManagementState: IViewManagementState = {
  insight: {
    error: null,
    loading: false,
    views: [],
    layerGroupOptions: [],
    layers: [],
    gettingLayer: false,
    editingView: null,
    isUpdating: false,
    updatingError: null
  }
};

export const catchmentTravelTypes: ISelectionButton[] = [{
  id: TravelType.DURATION,
  label: 'Time',
  placeHolder: 'Time',
  selected: true
}, {
  id: TravelType.DISTANCE,
  label: 'Distance',
  placeHolder: 'Distance',
  selected: false
}]

export const catchmentTravelModes: ISelectionButton[] = [{
  id: TravelMode.CIRCLE,
  label: 'Straight-line',
  placeHolder: 'Straight-line',
  selected: true
},{
  id: TravelMode.CAR,
  label: 'Car',
  placeHolder: 'Car',
},{
  id: TravelMode.WALKING,
  label: 'Walking',
  placeHolder: 'Walking',
},{
  id: TravelMode.BIKE,
  label: 'Bicycle',
  placeHolder: 'Bicycle',
}]

export const catchmentDirectionTypes: ISelectionButton[] = [{
  id: TravelDirectionType.FROM,
  label: 'From',
  tooltip: 'From center of catchment',
  selected: true
},{
  id: TravelDirectionType.TOWARD,
  label: 'Toward',
  tooltip: 'Toward center of catchment',
}]

export const catchmentOutputs: ISelectionButton[] = [{
  id: TravelRevolution.SMOOTH,
  label: 'Low Res',
  selected: true
},{
  id: TravelRevolution.DETAILED,
  label: 'High Res'
}]
