import { Payload } from "../Payload";
import { LngLat, ILngLat } from "../../../../client/app/shared/featureclusterer/featureclusterer";
import { IBoundingBox } from "../../../../client/app/iface/IBoundingBox";
import { IFeature, IPoint, IPolygon } from "../../../../client/app/shared/map-utils/shapes-pure";

export class VoronoiBuilderPayload extends Payload {
  clusters: { centroid: number[], weight?: number }[];
  box: IBoundingBox;
  clippingGeometryNames :string[];
  constructor(clusters: IFeature<IPoint>[], box: IBoundingBox, clippingGeometryNames :string[]) {
    super();
    this.clusters = clusters.filter(e=>e.properties['weight'] > 0).map(e=>({centroid: e.centroid, weight: e.properties['weight']}));
    this.box = box;
    this.clippingGeometryNames = clippingGeometryNames;
  }
}
export class ClippingVoronoiClusterPayload extends Payload {
  clippingGeometryNames :string[];
  features: IFeature<IPolygon>[];
  box:IBoundingBox;
  constructor(clippingGeometryNames :string[], features: IFeature<IPolygon>[], box:IBoundingBox) {
    super();
    this.features = features;
    this.box = box;
    this.clippingGeometryNames = clippingGeometryNames;
  }
}

export class ClippingVoronoiClusterResponsePayload extends Payload {
  features: IFeature<IPolygon>[]
  maxDensity: number;
  minDensity: number;
  constructor(features: IFeature<IPolygon>[], minDensity: number, maxDensity: number) {
    super();
    this.features = features;
    this.minDensity = minDensity;
    this.maxDensity = maxDensity;
  }
}
