import { Payload } from './Payload';

export class PortPayload extends Payload {
    workerId: string;
    apiBaseHref: string;
    constructor(workerId: string, apiBaseHref: string) {
        super();
        this.workerId = workerId;
        this.apiBaseHref = apiBaseHref;
    }
}