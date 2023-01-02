import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { messageActions } from '../store/actions';
import { ActionMessageType } from '@client/app/shared/enums';

@Injectable({
  providedIn: 'root'
})
export class MessageStoreService {

  constructor(private _store: Store) { }

  sendInfo(value: string) {
    const message = { value, type: ActionMessageType.INFO }
    this._store.dispatch(messageActions.addMessage({
      message
    }))
  }

  sendWarning(value: string) {
    const message = { value, type: ActionMessageType.WARNING }
    this._store.dispatch(messageActions.addMessage({
      message
    }))
  }

  sendError(value: string) {
    const message = { value, type: ActionMessageType.ERROR }
    this._store.dispatch(messageActions.addMessage({
      message
    }))
  }

  sendSuccess(value: string) {
    const message = { value, type: ActionMessageType.SUCCESS }
    this._store.dispatch(messageActions.addMessage({
      message
    }))
  }
}
