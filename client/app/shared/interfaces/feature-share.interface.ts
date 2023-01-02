import { EFeatureShare, ERecipientType } from '../enums';
import { IFilter } from './filter-interfaces';
import { IInsight } from './insight-interfaces';
import { LayerStyle } from '../layer-style';
import { IInsightView } from '@client/app/core/modules';

export interface ShareFeatureUser {
  userId: string;
  name: string;
  permission?: number;
}

export interface ShareFeatureDialogModel {
  titleDialog: string;
  titleText: string;
  data: ShareFeatureForm
}

export interface ShareFeatureForm {
  type: EFeatureShare;
  name: string;
  data: IFilter | IInsight | LayerStyle | IInsightView;
  recipientType: ERecipientType;
  key: string; // key want to updated in blob storage, e.g: should be layerId for filter, but should be "insight" for insight
}
