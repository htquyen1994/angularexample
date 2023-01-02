import { createReducer, on, Action } from "@ngrx/store";
import { MasterDataAction } from "../actions";
import { initialMasterDataState, IMasterDataState } from "../state/master-data.state";

const masterDataReducer = createReducer(
    initialMasterDataState,
    on(MasterDataAction.getTenants, (state, action) => ({ ...state, tenants: [] })),
    on(MasterDataAction.getTenantsSuccess, (state, action) => ({ ...state, tenants: action.payload })),
    on(MasterDataAction.getTenantsFailure, (state, action) => ({ ...state, error: action.payload })),
    on(MasterDataAction.getClaimsSuccess, (state, action) => ({ ...state, claims: action.payload })),
    on(MasterDataAction.getClaimsFailure, (state, action) => ({ ...state, error: action.payload })),
    on(MasterDataAction.getMembershipsSuccess, (state, action) => {
        const memberships = {...state.memberships};
        memberships[action.payload.tenantId] = action.payload.memberShipLevels;
        return {
            ...state,
            memberships: { ...memberships }
        }
    }),
    on(MasterDataAction.getMembershipsFailure, (state, action) => ({ ...state, error: action.payload })),
    on(MasterDataAction.loadPermissionTemplatesSuccess, (state, action) => {
        return {
          ...state,
          templates: {
            ...state.templates,
            [action.payload.tenantId]: action.payload.data
          }
        }
      }),
      on(MasterDataAction.loadPermissionTemplatesFailure, (state, action) => ({
        ...state,
        error: action.payload
      })),
);

export function reducer(state: IMasterDataState | undefined, action: Action) {
    return masterDataReducer(state, action);
}
