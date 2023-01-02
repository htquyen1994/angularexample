import { createAction, props } from "@ngrx/store";
import { Tab, TabName, TabType } from '../../../shared/models/resultpanel.model';

const SETTING_TABS = '[Result Panel - Tabs] Setting tabs';
const SETTING_TABS_SUCCESS = '[Result Panel - Tabs] Setting tabs success';
const SETTING_TABS_FAIL = '[Result Panel - Tabs] Setting tabs fail';

const SET_ACTIVE_TAB = '[Result Panel - Tabs] Set active tabs';
const SET_ACTIVE_TAB_SUCCESS = '[Result Panel - Tabs] Set active success';
const SET_ACTIVE_TAB_FAIL = '[Result Panel - Tabs] Set active fail';

const TOGGLE_TAB = '[Result Panel - Tabs] Toggle tab';


const settingTabs = createAction(
  SETTING_TABS
);

const settingTabsSuccess = createAction(
  SETTING_TABS_SUCCESS,
  props<{ tabs: Tab[] }>()
);

const settingTabsFail = createAction(
  SETTING_TABS_FAIL,
  props<{ error: any }>()
);

const setActiveTab = createAction(
  SET_ACTIVE_TAB,
  props<{ id: TabName }>()
);

const setActiveTabSuccess = createAction(
  SET_ACTIVE_TAB_SUCCESS,
  props<{ activeTab: Tab }>()
);

const setActiveTabFail = createAction(
  SET_ACTIVE_TAB_FAIL,
  props<{ error: any }>()
);

const toggleTab = createAction(
  TOGGLE_TAB,
  props<{ id: TabName, value: boolean }>()
);


export const resultPanelActions = {
  settingTabs,
  settingTabsSuccess,
  settingTabsFail,
  setActiveTab,
  setActiveTabSuccess,
  setActiveTabFail,
  toggleTab,
}
