import { IInsightFilterData } from './insight-action.interface';
import { IInsightPolygon } from './insight-polygon.interface';
import { IErrorResponse } from '@client/app/shared';
import { IInsightView } from '@client/app/core/modules/view-management/interface';
import { EStateInsight } from '@client/app/shared/enums';
import { MatchItLayerFilter } from '@client/app/resultpanel/shared/models/match-it-filter.model';

export interface InsightState {
  insightResult: InsightResultState
}
export interface InsightResultState {
  autoRun: boolean;
  filterData: IInsightFilterData;
  polygons: IInsightPolygon[];
  results: any[];
  loading: boolean;
  createMatchLoading: boolean;
  error: IErrorResponse;
  active: boolean;
  selectedView: IInsightView;
  downloadLoading: boolean;
  downloadError: IErrorResponse;
  state: EStateInsight;
  matchItLayerFilter: MatchItLayerFilter[];
  densityValues: any[];
}
