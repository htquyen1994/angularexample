import {Operator} from './Operator';

import GeoJSONReader from 'jsts/org/locationtech/jts/io/GeoJSONReader';
import RelateOp from 'jsts/org/locationtech/jts/operation/relate/RelateOp';

export class SpatialBinaryOperator extends Operator {

  private static parser = new GeoJSONReader();

  static WithinBounds = new SpatialBinaryOperator('SpatialBinaryOperator.WithinBounds', 'Inside Bounds Of',
    (a: any, b: any): boolean => {

      const ga = SpatialBinaryOperator.parser.read(a);
      const gb = SpatialBinaryOperator.parser.read(b);

      return RelateOp.within(ga, gb);
    });

  static Intersects = new SpatialBinaryOperator('SpatialBinaryOperator.Intersects', 'Overlaps',
    (a: any, b: any): boolean => {

      const ga = SpatialBinaryOperator.parser.read(a);
      const gb = SpatialBinaryOperator.parser.read(b);

      return RelateOp.intersects(ga, gb);
    });

  constructor(name: string, description: string, filter: (a: any, b: any) => boolean) {
    super(name, description, filter);
  }
}
