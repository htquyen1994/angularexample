export interface IFeature<T extends IGeometry> {
  properties?: any;
  geometry: T;
  PeriscopeId?: any;
  shapeId?: any;
  centroid?: any;
  type?: any
}
export interface IGeometry {
  type: string;
  coordinates: ICoordinate | ICoordinateArray | ICoordinateArray[] | ICoordinateArray[][] | ILinearRing | ILinearRing[] | IPolygonShell[];
}
export interface ICoordinate {
  x(): number;
  y(): number;
  isValid(): boolean;
}
export interface ICoordinateArray {
  length: number;
  [n: number]: number;
}
export interface ILineStringCoords extends Array<ICoordinateArray> {

}

export interface ILinearRing extends ILineStringCoords {

}

export interface IPolygonShell extends Array<ILinearRing> {
}
export interface IPolygon extends IGeometry {
	coordinates: IPolygonShell;
}
export interface IPoint extends IGeometry {
	coordinates: ICoordinateArray;
}
