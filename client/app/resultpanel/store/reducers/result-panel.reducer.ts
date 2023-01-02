import { createReducer, on, Action } from '@ngrx/store';
import { resultPanelActions } from '../actions';
import { initialResultPanelState } from '../../constants';
import { ResultPanelState } from '../../interfaces';

const _resultPanelReducer = createReducer(initialResultPanelState,
  on(resultPanelActions.settingTabs, (state: ResultPanelState, action) => ({
    ...state,
    tabState: {
      ...state.tabState,
      loading: true,
      tabs: []
    }
  })),
  on(resultPanelActions.settingTabsSuccess, (state: ResultPanelState, action) => ({
    ...state,
    tabState: {
      ...state.tabState,
      loading: false,
      tabs: action.tabs
    }
  })),
  on(resultPanelActions.settingTabsFail, (state: ResultPanelState, action) => ({
    ...state,
    tabState: {
      ...state.tabState,
      loading: false,
    }
  })),

  on(resultPanelActions.setActiveTabSuccess, (state: ResultPanelState, action) => ({
    ...state,
    tabState: {
      ...state.tabState,
      activeTab: action.activeTab,
    }
  })),
)

export function resultPanelReducer(state: ResultPanelState | undefined, action: Action) {
  return _resultPanelReducer(state, action);
}
