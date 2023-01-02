import { WWMessage } from './message';
import { WWMessageType } from './messageType';

export class ResultResponse extends WWMessage{
     constructor(clientProcessId:number, result:any){
        super()
        this.data = result;
        this.clientProcessId = clientProcessId; 
        this.messageType = WWMessageType.RESULT;
    }
}