import { createReducer, on, Action } from "@ngrx/store";
import { initialAccountState } from "../state/account.state";
import * as AccountAction from '../actions/account.action';
import { IAccount } from "../../shared/models/account";

const accountReducer = createReducer(
    initialAccountState,
    on(AccountAction.GetAccountSuccess, (state, action) => ({ ...state, ...action.payload })),
);

export function reducer(state: IAccount | undefined, action: Action) {
    return accountReducer(state, action);
}
