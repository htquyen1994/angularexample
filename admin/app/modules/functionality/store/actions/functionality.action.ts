import { createAction, props } from "@ngrx/store";
import {IFunctionality, IFunctionalityClaim } from '../../interfaces'
import { IErrorResponse } from '@admin-shared/models/error';
const GET_FUNCTIONALITIES = '[FUNCTIONALITY - GET] Get functionality';
const GET_FUNCTIONALITIES_SUCCESS = '[FUNCTIONALITY - GET] Get functionality success';
const GET_FUNCTIONALITIES_FAIL = '[FUNCTIONALITY - GET] Get functionality fail';

const DOWNLOAD_FUNCTIONALITY = '[FUNCTIONALITY - DOWNLOAD] Download functionality';
const DOWNLOAD_FUNCTIONALITY_SUCCESS = '[FUNCTIONALITY - DOWNLOAD] Download functionality success';
const DOWNLOAD_FUNCTIONALITY_FAIL = '[FUNCTIONALITY - DOWNLOAD] Download functionality fail';


const getFunctionality = createAction(
  GET_FUNCTIONALITIES,
  props<{ tenantId: string }>()
);

const getFunctionalitySuccess = createAction(
  GET_FUNCTIONALITIES_SUCCESS,
  props<{ data: IFunctionality[]; claims: IFunctionalityClaim[]}>()
);

const getFunctionalityFail = createAction(
  GET_FUNCTIONALITIES_FAIL,
  props<{error: IErrorResponse}>()
);

const downloadFunctionality = createAction(
  DOWNLOAD_FUNCTIONALITY,
);

const downloadFunctionalitySuccess = createAction(
  DOWNLOAD_FUNCTIONALITY_SUCCESS,
);

const downloadFunctionalityFail = createAction(
  DOWNLOAD_FUNCTIONALITY_FAIL,
  props<{error: IErrorResponse}>()
);

export const functionalityActions = {
  getFunctionality,
  getFunctionalitySuccess,
  getFunctionalityFail,
  downloadFunctionality,
  downloadFunctionalitySuccess,
  downloadFunctionalityFail
}
