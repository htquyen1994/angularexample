import { createAction, props } from "@ngrx/store";
import { Breakpoint } from "../../shared/models/global";

export enum EConfig {
    ChangeBreakPoint = '[config] Change Break Point',
    ChangeLeftSideBar = '[config] Change Left Side Bar'
}

export const changeBreakPoint = createAction(
    EConfig.ChangeBreakPoint,
    props<{ payload: Breakpoint }>()
);

export const ChangeLeftSideBar = createAction(
    EConfig.ChangeLeftSideBar,
    props<{ payload: boolean }>()
);
