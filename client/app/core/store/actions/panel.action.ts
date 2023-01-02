import { createAction, props } from "@ngrx/store";
import { ResultPanelCollapseState } from '../../enums'
const SET_RESULT_PANEL_STATE = '[Panel - Result] Set result panel sate';

const setResultPanelState = createAction(
  SET_RESULT_PANEL_STATE,
  props<{ id: ResultPanelCollapseState }>()
);

export const panelActions = {
  setResultPanelState,
}
