import { WWMessage } from './message';
import { WWMessageType } from './messageType';
import { ConfigWorkerPayload } from '../payloads/configWorkerPayload';

export class ConfigWorkerMessage extends WWMessage {
    constructor(payload: ConfigWorkerPayload) {
        super();
        this.messageType = WWMessageType.CONFIG_WORKER;
        this.clientProcessId = -1;
        this.data = payload;
    }
}
