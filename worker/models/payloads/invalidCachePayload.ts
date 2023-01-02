import { Payload } from './Payload';
import {INVALIDCACHETYPE} from '../../../client/app/shared/global_origin'

export class InvalidCachePayload extends Payload {
    type: INVALIDCACHETYPE;
    overlayId: string;
    invalidateArray:string[];
}