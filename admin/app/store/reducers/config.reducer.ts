import { createReducer, on, Action } from "@ngrx/store";
import { initialConfigState, IConfigState } from "../state/config.state";
import { ConfigAction } from "../actions";

const configReducer = createReducer(
    initialConfigState,
    on(ConfigAction.changeBreakPoint, (state, action) => ({ ...state, breakPoint: action.payload })),
    on(ConfigAction.ChangeLeftSideBar, (state, action) => ({ ...state, isLeftSideBarOpened: action.payload })),
);

export function reducer(state: IConfigState | undefined, action: Action) {
    return configReducer(state, action);
}
