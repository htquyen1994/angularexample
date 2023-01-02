import { ResultPanelCollapseState } from '../enums';
import { ICoreLayer, ICoreFilter, ICoreGroup } from './layer.interface';
import { IMapToolsState } from './map-tools.interface';
export interface IAppState {
  panelSate: IPanelState;
  layers: ICoreLayer[];
  layerGroups: ICoreGroup[];
  filters: ICoreFilter[];
  mapToolStates: IMapToolsState
}

export interface IPanelState {
  resultPanel: ResultPanelCollapseState;
  leftPanel: boolean;
}

export * from './layer.interface';
export * from './map-tools.interface';
