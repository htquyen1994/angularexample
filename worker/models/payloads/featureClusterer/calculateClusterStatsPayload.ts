import { Payload } from "../Payload";
import { ICluster } from "../../../../client/app/shared/featureclusterer/featureclusterer";
import { IFeature, IGeometry } from "../../../../client/app/shared/map-utils/shapes-pure";

export class CalculateClusterStatsPayload extends Payload {
  clusters: ICluster[];
  weightCalculator : (feature:IFeature<IGeometry>) => number;
  constructor(clusters: ICluster[], weightCalculator:(feature:IFeature<IGeometry>) => number = a=>1 ) {
    super();
    this.clusters = clusters;
    this.weightCalculator = weightCalculator;
  }
}

export class CalculteClusterStatsResponsePayload extends Payload {
  clusters: ICluster[];
  converged: boolean;
  minWeight: number;
  maxWeight: number;
  constructor(clusters: ICluster[], converged: boolean, minWeight: number, maxWeight: number) {
    super();
    this.clusters = clusters;
    this.converged = converged;
    this.maxWeight = maxWeight;
    this.minWeight = minWeight;
  }
}
