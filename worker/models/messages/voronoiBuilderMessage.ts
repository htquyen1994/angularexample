import { WWMessage } from "./message";
import { VoronoiBuilderPayload, ClippingVoronoiClusterPayload } from "../payloads/featureClusterer/voronoiBuilderPayload";
import { WWMessageType } from "./messageType";

export class VoronoiBuilderMessage extends WWMessage{
  constructor(clientProcessId:number, payload: VoronoiBuilderPayload){
     super()
     this.clientProcessId = clientProcessId;
     this.messageType = WWMessageType.VORONOI_BUILDER;
     this.data = payload;
 }
}

export class CLippingVoronoiClusterMessage extends WWMessage{
  constructor(clientProcessId:number, payload: ClippingVoronoiClusterPayload){
     super()
     this.clientProcessId = clientProcessId;
     this.messageType = WWMessageType.CLIPPING_VORONOI_CLUSTER;
     this.data = payload;
 }
}

