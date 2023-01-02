import { TravelMode } from '../../core/modules/view-management/enums';
import { IFilter, OverlayShapeGeometry, ILayer } from '@client/app/shared/interfaces';
import { IErrorResponse } from '@client/app/shared';


export interface NearestState {
  tool: NearestTool;
  result: NearestResult;
}

export interface NearestTool {
  formGroup: NearestToolPayload;
  filters: IFilter[];
  pointShapes: OverlayShapeGeometry[];
}

export interface NearestResult {
  payload: NearestToolPayload;
  results: any[];
  columns:NearestResultColumn[]
  loading: boolean;
  error: IErrorResponse;
  downloading: boolean;
}

export interface NearestToolPayload {
  value: number;
  layerId: string;
  filterId: string;
  mode: TravelMode;
}

export interface NearestResultColumn {
  header: string;
  id: string;
  align: string;
  type: string;
  isPercentage: boolean;
  formatPipe: string;
  format: string;
  orderBy?: string;
}

export interface NearestDownloadModel {
  headers: string[];
  results: any[];
  columnLabels: {[key: string]: string};
  isStraightLine: boolean;
}
