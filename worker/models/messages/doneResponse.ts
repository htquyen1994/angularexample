import { WWMessage } from './message';
import { WWMessageType } from './messageType';

export class DoneResponse extends WWMessage{
     constructor(clientProcessId:number){
        super()
        this.clientProcessId = clientProcessId; 
        this.messageType = WWMessageType.DONE;
    }
}