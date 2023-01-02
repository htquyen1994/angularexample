import { Breakpoint } from "../../shared/models/global";

export interface IConfigState {
    breakPoint: Breakpoint,
    isLeftSideBarOpened: boolean
}

export const initialConfigState: IConfigState = {
    breakPoint: Breakpoint.DESKTOP,
    isLeftSideBarOpened: false
};
