import { MapToolType } from '@client/app/shared/enums';

export interface IMapToolsState {
  selectionMapTool: IMapToolState
}

export interface IMapToolState {
  loading: boolean;
}
