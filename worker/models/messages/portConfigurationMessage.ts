import { WWMessage } from './message';
import { PortPayload } from '../payloads/PortPayload';
import { WWMessageType } from './messageType';

export class PortConfigurationMessage extends WWMessage{
    constructor(portPayload:PortPayload, messagePort: MessagePort){
        super();
        this.messageType = WWMessageType.CONFIGURE_PORTS;
        this.clientProcessId = -1;
        this.data = portPayload;
        this.messagePort = messagePort;
    }
}