import Delaunay from '../../../../../node_modules/d3-delaunay/src/delaunay';
import {  IFeature, IPolygon } from '../map-utils/shapes-pure';
import { IBoundingBox } from '../../iface/IBoundingBox';
export class VoronoiBuilder {
  points: number[][] = [];
  weights: number[] = [];
  boundingBox: { min: { lng: number, lat: number }, max: { lng: number, lat: number } };
  MaxWeight = 0;
  MinWeight = 1E26;

  // MaxDensity = 0;
  // MinDensity = 99999999999;

  // ClippingGeometry?: Geometry;

  // private Parser = new GeoJSONParser(new GeometryFactory());

  //takes the result of the cluster process and the bounding box of the viewport
  constructor(clusters: { centroid: number[], weight?: number }[], box: IBoundingBox
    // , clippingGeometryKey: string = null
    ) {
    for (let i = 0; i < clusters.length; i++) {
      this.points.push(clusters[i].centroid);
      this.weights.push(clusters[i].weight);
    }
    const { Max, Min } = box;
    this.boundingBox = {
      max: {
        lat: Max.Lat,
        lng: Max.Lng
      },
      min: {
        lat: Min.Lat,
        lng: Min.Lng
      }
    };

    // if ((clippingGeometryKey)) {
    //   this.ClippingGeometry = this.Parser["read"](ClippingGeometries[clippingGeometryKey]["geometry"]);
    // }

  }



  /*returns
  [
    {
      type:"Feature",
      geometry: {...}
      centroid :number[],
      properties : {
      area :number,
      weight: number
      }
    },
    ....
  ]*/
  calculate() {
    const delaunay = Delaunay.from(this.points);
    const voronoi = delaunay.voronoi([this.boundingBox.min.lng, this.boundingBox.min.lat, this.boundingBox.max.lng, this.boundingBox.max.lat]);

    const geomBuilder = new GeometryBuilder();

    for (let i = 0; i < this.weights.length; i++) {
      const currentIndex = geomBuilder.featuresLength;
      voronoi.renderCell(i, geomBuilder);
      if (!geomBuilder.features[currentIndex]) continue;


      // if ((this.ClippingGeometry)) {
      //   const shape = this.intersectionClipping(this.ClippingGeometry, geomBuilder.features[currentIndex].geometry);
      //   if(shape) geomBuilder.features[currentIndex].geometry = shape;
      // }


      // geomBuilder.features[currentIndex].properties = {
      //   weight: this.weights[i],
      //   area: this.calculateArea(geomBuilder.features[currentIndex].geometry)
      // }
      // geomBuilder.features[currentIndex].properties.density = geomBuilder.features[currentIndex].properties.weight / geomBuilder.features[currentIndex].properties.area;

      this.MaxWeight = Math.max(this.MaxWeight, this.weights[i]);
      this.MinWeight = Math.min(this.MinWeight, this.weights[i]);

      // this.MaxDensity = Math.max(this.MaxDensity, geomBuilder.features[currentIndex].properties.density);
      // this.MinDensity = Math.min(this.MinDensity, geomBuilder.features[currentIndex].properties.density);
      geomBuilder.features[currentIndex] = {
        ...geomBuilder.features[currentIndex],
        centroid: this.points[i],
        properties: {
          weight: this.weights[i],
        }
      }
      geomBuilder.features[currentIndex].centroid = this.points[i];
    }
    const dif = this.MaxWeight - this.MinWeight;
    // const difDensity = this.MaxDensity - this.MinDensity;

    return geomBuilder.features.map(e => ({
      ...e,
      properties: {
        ...e.properties,
        // ratioScale: (e.properties.density - this.MinDensity) / difDensity,
        maxWeight: this.MaxWeight,
        minWeight: this.MinWeight,
        // maxDensity: this.MaxDensity,
        // minDensity: this.MinDensity
      }
    }));
  }

  // private calculateArea(geometry: IGeometry): number {
  //   const coords: number[][] = geometry.coordinates[0];

  //   switch (geometry.type) {
  //     case "Polygon": {
  //       return this.calculateRingArea(geometry.coordinates[0])
  //     }
  //     case "MultiPolygon": {
  //       let area = 0;
  //       for (let i = 0; i < (<number[][][]>geometry.coordinates).length; i++) {
  //         area+= this.calculateRingArea(geometry.coordinates[i][0]);
  //       }
  //       return area;
  //     }
  //     default:
  //       return 0;
  //   }
  // }

  // private calculateRingArea(coords: number[][]) {
  //   let area = 0;

  //   for (let i = 0; i < coords.length - 1; i++) {
  //     let p1 = coords[i];
  //     let p2 = coords[i + 1];
  //     area += this.convertToRads(p2[0] - p1[0]) * (2 + Math.sin(this.convertToRads(p1[1]))) + Math.sin(this.convertToRads(p2[1]));
  //   }

  //   area = area * this.earthRad * this.earthRad / 2;

  //   return Math.abs(area);
  // }

  // private deg2Rad = Math.PI / 180.0;
  // private earthRad = 6378137; //radius of earth in metres

  // private convertToRads(angle: number) {
  //   return angle * this.deg2Rad;
  // }

  // intersectionClipping(clippingShape, other) {
  //   let a = clippingShape;
  //   let b = this.Parser['read'](other);
  //   if (RelateOp.intersects(a, b)) {
  //     let _shape = OverlayOp.intersection(a, b);
  //     if (_shape.isGeometryCollection()) { // check shape contain lineString
  //       let _arr = new ArrayList();
  //       for (let i = 0; i < _shape.getNumGeometries(); i++) {
  //         let g = _shape.getGeometryN(i)
  //         if (g !== null && g.getGeometryType() == 'Polygon') _arr.add(g);
  //       }
  //       _shape = _shape.getFactory().buildGeometry(_arr);
  //     }
  //     return this.Parser['write'](_shape);
  //   }
  //   return null;
  // }
}

class GeometryBuilder {

  features: IFeature<IPolygon>[] = [];

  currentFigure: number[][];
  get featuresLength() {
    return this.features.length;
  }
  moveTo(x: number, y: number) {
    this.currentFigure = [];
    this.currentFigure.push([x, y]);
  }
  lineTo(x: number, y: number) {
    this.currentFigure.push([x, y]);
  }
  closePath() {
    this.currentFigure.push(this.currentFigure[0]);
    let geom = {
      type: "Polygon",
      coordinates: [
        this.currentFigure
      ]
    };

    let feat: IFeature<IPolygon> = {
      type: "Feature",
      geometry: geom
    }

    this.features.push(feat);
    this.currentFigure = null;
  }
}
