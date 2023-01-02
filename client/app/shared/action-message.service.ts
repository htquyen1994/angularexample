import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import { ActionMessage } from './interfaces';
import { ActionMessageType } from './enums';

@Injectable()
export class ActionMessageService {

  messagesSource = new Subject<ActionMessage>();
  messages = this.messagesSource.asObservable();

  sendInfo(value: string) {
    this.messagesSource.next({
      value,
      type: ActionMessageType.INFO
    });
  }

  sendWarning(value: string) {
    this.messagesSource.next({
      value,
      type: ActionMessageType.WARNING
    });
  }

  sendError(value: string) {
    this.messagesSource.next({
      value,
      type: ActionMessageType.ERROR
    });
  }

  sendSuccess(value: string) {
    this.messagesSource.next({
      value,
      type: ActionMessageType.SUCCESS
    });
  }

  sendMessage(type: ActionMessageType, message: string) {
    this.messagesSource.next({ type, value: message })
  }
}
