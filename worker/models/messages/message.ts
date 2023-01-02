import { WWMessageType } from './messageType';
import { Payload } from '../payloads/Payload';
import { Subject } from 'rxjs';

export class WWMessage {
    clientProcessId:number;
    messageType: WWMessageType;
    data: Payload;
    responsePort: MessagePort;
    messagePort?: MessagePort;
    responseResult: Subject<WWMessage>;
}

