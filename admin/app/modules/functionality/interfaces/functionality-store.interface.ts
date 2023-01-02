import { IFunctionalityClaim } from "./claim.interface";
import { IFunctionality } from "./functionality.interface";
import { IErrorResponse } from '@admin-shared/models/error';

export interface FunctionalityState {
  loading: boolean;
  filter: FunctionalityFilterState;
  result: FunctionalityResultState;
  error: IErrorResponse;
  downloading: boolean
}

export interface FunctionalityFilterState {
  tenantId: string;
}

export interface FunctionalityResultState {
  data: IFunctionality[];
  claims: IFunctionalityClaim[]
}
