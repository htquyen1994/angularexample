import { createAction, props } from "@ngrx/store";
import { ActionMessage } from '../../../shared/interfaces'
const ADD_MESSAGE = '[ADD - MESSAGE] Add message';

const addMessage = createAction(
  ADD_MESSAGE,
  props<{ message: ActionMessage }>()
);

export const messageActions = {
  addMessage,
}
