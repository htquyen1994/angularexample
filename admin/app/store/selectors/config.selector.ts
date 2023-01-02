import { createSelector } from '@ngrx/store';
import { IAppState } from '../state/app.state';
import { IConfigState } from '../state/config.state';
import { Breakpoint } from '../../shared/models/global';

const configStateBreakPoint = (state: IAppState) => state.config.breakPoint;
const configStateIsLeftSideBarOpened = (state: IAppState) => state.config.isLeftSideBarOpened;

export const selectBreakPoint = createSelector(
    configStateBreakPoint,
    (state: Breakpoint) => state
);


export const selectIsLeftSideBarOpened = createSelector(
    configStateIsLeftSideBarOpened,
    (state: boolean) => state
);
