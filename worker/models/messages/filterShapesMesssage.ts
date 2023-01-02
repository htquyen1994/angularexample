import { WWMessage } from './message';
import { WWMessageType } from './messageType';
import { FilterShapesPayload } from '../payloads/filterShapePayload';

export class FilterShapesMessage extends WWMessage{
     constructor(clientProcessId:number, payload: FilterShapesPayload){
        super()
        this.clientProcessId = clientProcessId; 
        this.messageType = WWMessageType.FILTER_SHAPES;
        this.data = payload;
    }
}