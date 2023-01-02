import { MatchItLayerFilter } from '@client/app/resultpanel/shared/models/match-it-filter.model';
import { ReviewModel } from '@client/app/resultpanel/shared/models/match-it-review.model';
import { IErrorResponse } from '@client/app/shared';

export interface AnalysisState {
  loading: boolean;
  previewModel: ReviewModel;
  error: IErrorResponse;
}

export interface AnalysisPreviewPayload {
  layerFilters: MatchItLayerFilter[];
  formValue: {
    desired: number;
    resolution: number;
    area?: number;
  };
  densityValues: any
}
