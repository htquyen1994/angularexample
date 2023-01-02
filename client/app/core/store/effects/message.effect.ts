import { Injectable } from "@angular/core";
import { Actions, Effect, ofType } from "@ngrx/effects";
import { tap } from 'rxjs/operators';
import { messageActions } from "../actions";
import { ActionMessageService } from '@client/app/shared';

@Injectable()
export class MessageEffects {
  constructor(
    private _actions$: Actions,
    private _actionMessageService: ActionMessageService,
  ) { }

  @Effect({dispatch: false})
  addMessage$ = this._actions$.pipe(
    ofType(messageActions.addMessage),
    tap(({message})=>{
      const { value, type } = message;
      this._actionMessageService.sendMessage(type, value)
    })
  );
}
