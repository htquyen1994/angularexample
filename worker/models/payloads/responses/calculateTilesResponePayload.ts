import { Payload } from '../Payload';

export class CalculateTilesResponsePayload extends Payload{
    tileIds:string[];

    constructor(tileIds: string[]){
        super();
        this.tileIds = tileIds;
    }
}