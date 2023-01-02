import { WWMessage } from './message';
import { WWMessageType } from './messageType';
import { DoClusterPayload } from '../payloads/doClusterPayload';
import { FindClosestClusterPayload } from '../payloads/featureClusterer/findClosestClusterPayload';
import { CalculateClusterStatsPayload } from '../payloads/featureClusterer/calculateClusterStatsPayload';

export class DoClusterMessage extends WWMessage{
     constructor(clientProcessId:number, payload: DoClusterPayload){
        super()
        this.clientProcessId = clientProcessId;
        this.messageType = WWMessageType.DO_CLUSTER;
        this.data = payload;
    }
}

export class FindClosestClusterMessage extends WWMessage{
  constructor(clientProcessId:number, payload: FindClosestClusterPayload){
     super()
     this.clientProcessId = clientProcessId;
     this.messageType = WWMessageType.FIND_CLOSEST_CLUSTER;
     this.data = payload;
 }
}

export class CalculateClusterStatsMessage extends WWMessage{
  constructor(clientProcessId:number, payload: CalculateClusterStatsPayload){
     super()
     this.clientProcessId = clientProcessId;
     this.messageType = WWMessageType.CALC_CLUSTER_STATS;
     this.data = payload;
 }
}
