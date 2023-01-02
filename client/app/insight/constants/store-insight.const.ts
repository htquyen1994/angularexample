import { InsightResultState } from "../interfaces";
import { INITIAL_INSIGHT_FILTER_DATA } from './insight.const';
import { EStateInsight } from '@client/app/shared/enums';

export const featureInsight = 'featureInsight';

export const initialInsightResultState: InsightResultState = {
  autoRun: false,
  filterData: INITIAL_INSIGHT_FILTER_DATA,
  polygons: [],
  results: [],
  loading: false,
  error: null,
  active: false,
  selectedView: null,
  downloadError: null,
  downloadLoading: false,
  state: EStateInsight.InsightView,
  densityValues: null,
  matchItLayerFilter: null,
  createMatchLoading: false,
};
