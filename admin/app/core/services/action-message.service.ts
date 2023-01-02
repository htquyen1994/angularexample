import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

export enum ActionMessageType {
  INFO,
  WARNING,
  ERROR,
  SUCCESS
}

export interface ActionMessage {
  type: ActionMessageType;
  message: string;
}

@Injectable()
export class ActionMessageService {

  message$ = new Subject<ActionMessage>();

  sendInfo(message: string) {
    this.message$.next({
      message,
      type: ActionMessageType.INFO
    });
  }

  sendWarning(message: string) {
    this.message$.next({
      message,
      type: ActionMessageType.WARNING
    });
  }

  sendError(message: string) {
    this.message$.next({
      message,
      type: ActionMessageType.ERROR
    });
  }

  sendSuccess(message: string) {
    this.message$.next({
      message,
      type: ActionMessageType.SUCCESS
    });
  }
}
