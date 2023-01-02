import { Observable } from 'rxjs';
import { ILayer, OverlayShapeGeometry } from '@client/app/shared/interfaces';

export interface IInsightPolygon {
  type: string;
  label: string;
  coordinates: any;
  index?: number;
  color?: string;
  area?: number;
};

export interface IInsightPolygonRequest {
  label: string;
  shape: Observable<OverlayShapeGeometry>;
}

export interface IInsightResult {
  layer: ILayer;
  data: {
      name: string;
      children: {
          columnId: string;
          label: string;
          values: number;
          unit: string;
          average: number;
          averageLabel: number;
          min: number | null;
          max: number | null;
      }[];
  }[];
  polygons: IInsightPolygon[];
}
