import { Payload } from "../Payload";
import { LngLat, ILngLat } from "../../../../client/app/shared/featureclusterer/featureclusterer";

export class FindClosestClusterPayload extends Payload {
  featurePositions: ILngLat[];
  clusterCentroids: ILngLat[];
  constructor(featurePosition: ILngLat[], clusterCentroids: ILngLat[]) {
    super();
    this.featurePositions = featurePosition;
    this.clusterCentroids = [...clusterCentroids];
  }
}

export class FindClosestClusterResponsePayload extends Payload {
  clusterIndex: number[];
  constructor(clusterIndex: number[]) {
    super();
    this.clusterIndex = clusterIndex;
  }
}
