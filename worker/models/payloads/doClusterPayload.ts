import { Payload } from './Payload';

export class DoClusterPayload extends Payload {
  features: any[];
  numInitialClusters: number;
  maxRepetitions: number;
  targetDeviation: number;
  columnWeight: string;
  constructor(features: any[], numInitialClusters: number, maxRepetitions: number, targetDeviation: number, columnWeight: string) {
    super();
    this.features = [...features];
    this.numInitialClusters = numInitialClusters;
    this.maxRepetitions = maxRepetitions;
    this.targetDeviation = targetDeviation;
    this.columnWeight = columnWeight;
  }
}
