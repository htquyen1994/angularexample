import { MatchItLayerFilter, MatchItCriteria } from '../shared/models/match-it-filter.model';

export const FIND_STATISTIC_COLUMN = 'Ranking'

export enum FindState {
  WEIGHTING_SETUP,
  PREVIEW
}

export interface FindLayer extends MatchItLayerFilter{
}

export type FindCriteria = Omit<MatchItCriteria, "area">;
export interface WeightingColumnControl {
  id: string;
  weight: number;
  findMost: boolean;
}
export interface WeightingLayerControl {
  id: string;
  name: string;
  columns: WeightingColumnControl[]
}
