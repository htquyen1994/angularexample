import { IAppState, IPanelState, IMapToolsState } from '../interfaces';
import { ResultPanelCollapseState } from '../enums';

export const appFeature = "appState";

export const initialPanelState: IPanelState = {
  leftPanel: false,
  resultPanel: ResultPanelCollapseState.CLOSE
}

const initialMapToolState: IMapToolsState = {
  selectionMapTool: {
    loading: false
  }
}

export const initialAppState: IAppState = {
  panelSate: initialPanelState,
  layers: [],
  layerGroups: [],
  filters: [],
  mapToolStates: initialMapToolState
}
