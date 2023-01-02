import { OverlayShapeGeometry } from '@client/app/shared/interfaces';
import { Observable } from 'rxjs';

export interface INearestShape {
  type: string;
  coordinates: any;
  label: string;
  fillColor?: string;
  iconSize?: number;
  zIndex?: number;
};

export interface INearestShapeRequest {
  label: string;
  shape: Observable<OverlayShapeGeometry>;
}
