import { createAction, props } from '@ngrx/store';
import { ISort } from '@admin-shared/models/common-table';
import { ReferenceDataFilter, IReferenceData, ITenantsWithAccess } from '../../models';

const loadReferenceDatas = createAction(
  '[ReferenceData] Load ReferenceDatas'
);

const loadReferenceDatasSuccess = createAction(
  '[ReferenceData] Load ReferenceDatas Success',
  props<{ data: any }>()
);

const loadReferenceDatasFailure = createAction(
  '[ReferenceData] Load ReferenceDatas Failure',
  props<{ error: any }>()
);

const  changeSort = createAction(
  '[ReferenceData] changeSort ReferenceDatas',
  props<{ sort: ISort }>()
);

const changeFilter = createAction(
  '[ReferenceData] changeFilter ReferenceDatas',
  props<{ filter: ReferenceDataFilter }>()
);

const  updateFilterData = createAction(
  '[ReferenceData] updateFilterData ReferenceDatas',
  props<{ data: {
    data: IReferenceData[],
    tenants: ITenantsWithAccess[]
  } }>()
);

const  selectReferenceData = createAction(
  '[ReferenceData] select ReferenceData',
  props<{ item: IReferenceData, checked: boolean }>()
);

const  selectAllReferenceData = createAction(
  '[ReferenceData] select All ReferenceData',
  props<{ checked: boolean }>()
);


export const ReferenceDataActions = {
  loadReferenceDatas,
  loadReferenceDatasSuccess,
  loadReferenceDatasFailure,
  changeSort,
  changeFilter,
  updateFilterData,
  selectReferenceData,
  selectAllReferenceData
}
