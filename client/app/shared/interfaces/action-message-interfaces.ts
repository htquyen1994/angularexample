import { ActionMessageType } from "../enums/action-message-enums";

export interface ActionMessage {
    type: ActionMessageType;
    value: string;
}