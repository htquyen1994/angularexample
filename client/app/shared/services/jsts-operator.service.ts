import { Injectable } from '@angular/core';
import OverlayOp from 'jsts/org/locationtech/jts/operation/overlay/OverlayOp';
import GeoJSONParser from 'jsts/org/locationtech/jts/io/GeoJSONParser';
import RelateOp from 'jsts/org/locationtech/jts/operation/relate/RelateOp';
import UnionOp from 'jsts/org/locationtech/jts/operation/union/UnionOp';
import UnaryUnionOp from 'jsts/org/locationtech/jts/operation/union/UnaryUnionOp';
import ArrayList from 'jsts/java/util/ArrayList';
import Geometry from 'jsts/org/locationtech/jts/geom/Geometry';
import { BufferOp, BufferParameters } from 'jsts/org/locationtech/jts/operation/buffer';
import GeometryCollection from 'jsts/org/locationtech/jts/geom/GeometryCollection';
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory';
import { IsValidOp } from 'jsts/org/locationtech/jts/operation/valid';
import Polygon from 'jsts/org/locationtech/jts/geom/Polygon';
import MultiPolygon from 'jsts/org/locationtech/jts/geom/MultiPolygon';
import { Polygonizer } from 'jsts/org/locationtech/jts/operation/polygonize';
import LinearRing from 'jsts/org/locationtech/jts/geom/LinearRing'
@Injectable({
  providedIn: 'root'
})
export class JstsOperatorService {
  private static parser = new GeoJSONParser();
  constructor() { }

  intersection(shape, other) {
    let a = JstsOperatorService.parser.read(shape);
    let b = JstsOperatorService.parser.read(other);
    if (RelateOp.intersects(a, b)) {
      let _shape = OverlayOp.intersection(a, b);
      if (_shape.isGeometryCollection()) { // check shape contain lineString
        let _arr = new ArrayList();
        for (let i = 0; i < _shape.getNumGeometries(); i++) {
          let g = _shape.getGeometryN(i)
          if (g !== null && g.getGeometryType() == 'Polygon') _arr.add(g);
        }
        _shape = _shape.getFactory().buildGeometry(_arr);
      }
      return JstsOperatorService.parser.write(_shape);
    }
    return null;
  }

  union(shape, other) {
    try {
      let a = JstsOperatorService.parser.read(shape);
      let b = JstsOperatorService.parser.read(other);
      if (RelateOp.touches(a, b)) {
        const c = this.inflate(a);
        const d = this.inflate(b);
        const _shape = this._union(c, d);
        return JstsOperatorService.parser.write(this.deflate(_shape));
      } else if (RelateOp.intersects(a, b) || (a.getGeometryType().replace('Multi','') == 'Polygon' && b.getGeometryType().replace('Multi','') == 'Polygon')) {
        const ga = this.validate(a);
        const gb = this.validate(b);
        const _shape = this._union(ga, gb);

        return JstsOperatorService.parser.write(_shape);
      }
    } catch (error) {
      return null;
    }
    return null;
  }

  public isValidShape(shape) {
    try {
      let _shape = JstsOperatorService.parser.read(shape);
      if (new IsValidOp(_shape).isValid()) {
        return true
      }
      return false
    } catch (error) {
      return false;
    }
  }

  public getValidateShape(shape) {
    try {
      let _shape = JstsOperatorService.parser.read(shape);
      const ga = this.validate(_shape);
      return JstsOperatorService.parser.write(ga);
    } catch (error) {
      return null;
    }
  }

  private validate(geom) {
    if (geom instanceof Polygon) {
      if (new IsValidOp(geom).isValid()) {
        geom.normalize();
        return geom;
      }
      const polygonizer = new Polygonizer();
      this.addPolygon(geom, polygonizer);
      return this.toPolygonGeometry(polygonizer.getPolygons(), geom.getFactory());
    } else if (geom instanceof MultiPolygon) {
      if (new IsValidOp(geom).isValid()) {
        geom.normalize();
        return geom;
      }
      var polygonizer = new Polygonizer();

      for (var n = geom.getNumGeometries(); n > 0; n--) {
        this.addPolygon(geom.getGeometryN(n - 1), polygonizer);
      }
      return this.toPolygonGeometry(polygonizer.getPolygons(), geom.getFactory());
    } else {
      return geom;
    }
  };

  private addPolygon(polygon, polygonizer) {
    this.addLineString(polygon.getExteriorRing(), polygonizer);

    for (var n = polygon.getNumInteriorRing(); n > 0; n--) {
      this.addLineString(polygon.getInteriorRingN(n - 1), polygonizer);
    }
  };

  private addLineString(lineString, polygonizer) {
    if (lineString instanceof LinearRing) {
      // LinearRings are treated differently to line strings : we need a LineString NOT a LinearRing
      lineString = lineString.getFactory().createLineString(lineString.getCoordinateSequence());
    }

    // unioning the linestring with the point makes any self intersections explicit.
    var point = lineString.getFactory().createPoint(lineString.getCoordinateN(0));
    var toAdd = this._union(lineString, point); //geometry

    //Add result to polygonizer
    polygonizer.add(toAdd);
  }

  private toPolygonGeometry(polygons, factory) {
    switch (polygons.size()) {
      case 0:
        return null; // No valid polygons!
      case 1:
        return polygons.iterator().next(); // single polygon - no need to wrap
      default:
        //polygons may still overlap! Need to sym difference them
        var iter = polygons.iterator();
        var ret = iter.next();
        while (iter.hasNext()) {
          ret = OverlayOp.symDifference(ret, iter.next());
        }
        return ret;
    }
  }

  private _union(a, b) {
    let _shape = UnionOp.union(a, b);
    if (_shape.isGeometryCollection()) {
      let _arr = new ArrayList();
      for (let i = 0; i < _shape.getNumGeometries(); i++) {
        let g = _shape.getGeometryN(i)
        if (g !== null && g.getGeometryType() == 'Polygon') _arr.add(g);
      }
      _shape = _shape.getFactory().buildGeometry(_arr);
    }
    return _shape
  }

  private combineIntoOneGeometry(factory: GeometryFactory, _geometryCollection: ArrayList<Geometry>): Geometry {
    const geometryCollection: GeometryCollection =
      <GeometryCollection>factory.buildGeometry(_geometryCollection);
    return UnaryUnionOp.union(geometryCollection);
  }

  private deflate(geom: Geometry): Geometry {
    const bufferParameters: BufferParameters = new BufferParameters();
    bufferParameters.setEndCapStyle(BufferParameters.CAP_ROUND);
    bufferParameters.setJoinStyle(BufferParameters.JOIN_BEVEL);
    const buffered: Geometry = BufferOp.bufferOp(geom, -.0, bufferParameters);
    buffered.setUserData(geom.getUserData());
    return buffered;
  }

  private inflate(geom: Geometry): Geometry {
    const bufferParameters: BufferParameters = new BufferParameters();
    bufferParameters.setEndCapStyle(BufferParameters.CAP_ROUND);
    bufferParameters.setJoinStyle(BufferParameters.JOIN_MITRE);
    const buffered: Geometry = BufferOp.bufferOp(geom, .0, bufferParameters);
    buffered.setUserData(geom.getUserData());
    return buffered;
  }
}
