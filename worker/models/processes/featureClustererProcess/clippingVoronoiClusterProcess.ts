import { WorkerBase } from "../../../workerBase";
import { Observable, Subject } from "rxjs";
import { WWMessage } from "../../messages/message";
import { ClientProcess } from "../clientProcess";
import { ResultResponse } from "../../messages/resultResponse";
import { WorkQueue } from "../../workQueue";
import { WWMessageType } from "../../messages/messageType";
import { tap } from "rxjs/operators";
import { CancelMessage } from "../../messages/cancelMessage";
import { ClippingVoronoiClusterPayload, ClippingVoronoiClusterResponsePayload } from "../../payloads/featureClusterer/voronoiBuilderPayload";
import { CLippingVoronoiClusterMessage } from "../../messages/voronoiBuilderMessage";
import { IGeometry } from "../../../../client/app/shared/map-utils/shapes-pure";
import { ClippingGeometries } from "../../../../client/app/shared/voronoi/ClippingGeometries";
import GeometryFactory from "../../../../../node_modules/jsts/org/locationtech/jts/geom/geometryfactory";
import GeoJSONParser from "../../../../../node_modules/jsts/org/locationtech/jts/io/GeoJSONParser";
import { OverlayOp } from '../../../../../node_modules/jsts/org/locationtech/jts/operation/overlay';
import ArrayList from '../../../../../node_modules/jsts/java/util/ArrayList';
import Geometry from "../../../../../node_modules/jsts/org/locationtech/jts/geom/Geometry";
import GeometryCollection from "../../../../../node_modules/jsts/org/locationtech/jts/geom/GeometryCollection";

export class ClippingVoronoiClusterProcess extends ClientProcess {
  private payload: ClippingVoronoiClusterPayload;
  subject = new Subject<any>();
  private timeout: any;
  private ClippingGeometry: any;
  private Parser = new GeoJSONParser(new GeometryFactory());
  private deg2Rad = Math.PI / 180.0;
  private earthRad = 6378137; //radius of earth in metres;

  start(): Observable<WWMessage> {
    if (this.workerId != undefined) {
      return this.handleInAnotherWorker();
    } else {
      this.timeout = setTimeout(() => {
        try {
          const { clippingGeometryNames, features, box } = this.payload;
          let minDensity = 1E26;
          let maxDensity = 0;


          let clippers = clippingGeometryNames.map(a=> <Geometry>this.Parser["read"](ClippingGeometries[a]["geometry"]));

          let g : Geometry = clippers[0];

          for (let i = 0; i < clippers.length; i++) {
            g = OverlayOp.union(g, clippers[i]);
          }
          let clipper = g;


          let rect = this.Parser.geometryFactory.toGeometry({
            getMaxX() { return box.Max.Lng; },
            getMinX() { return box.Min.Lng; },
            getMaxY() { return box.Max.Lat; },
            getMinY() { return box.Min.Lat; },
            isNull() {return false;}
            });


          this.ClippingGeometry  = OverlayOp.intersection(clipper, rect);

          for (let index = 0; index < features.length; index++) {
            const feature = features[index];
            const { properties } = feature;

            if ((this.ClippingGeometry)) {
              const shape = this.intersectionClipping(this.ClippingGeometry, feature.geometry);
              if (shape) feature.geometry = shape;
            }
            const area = this.calculateArea(feature.geometry);
            const density = properties.weight / area;

            maxDensity = (area > 0) ? Math.max(maxDensity, density) : maxDensity;
            minDensity = (area > 0) ? Math.min(minDensity, density) : minDensity;
            features[index].properties = {
              ...properties,
              area,
              density
            }
          }
          const result = new ResultResponse(this.clientProcessId, new ClippingVoronoiClusterResponsePayload(features, minDensity, maxDensity));
          this.subject.next(result);
          this.subject.complete();
        } catch (error) {
          this.subject.error(error);
        }
      }, 0);
      return this.subject.asObservable();
    }
  }

  constructor(parentWorker: WorkerBase, initialMessage: WWMessage) {
    super(parentWorker);
    this.messageProcessing = initialMessage;
    this.clientProcessId = initialMessage.clientProcessId;
    this.payload = <ClippingVoronoiClusterPayload>initialMessage.data;
  }

  handleInAnotherWorker() {
    const clientProcessId = WorkQueue.getNextId();
    const clippingVoronoiMessage = new CLippingVoronoiClusterMessage(clientProcessId, this.payload);
    this.addChild(clientProcessId);
    this.postMessage(this.workerId, clippingVoronoiMessage).pipe(
      tap(e => e.messageType == WWMessageType.CANCEL ? this.removeChild(clientProcessId) : null),
    ).subscribe(message => {
      if (message.messageType === WWMessageType.ERROR) {
        this.subject.error("Error at handleInAnotherWorker clippingVoronoiMessage");
      } else {
        const { data } = message;
        const result = new ResultResponse(this.clientProcessId, data);
        this.subject.next(result);
        this.subject.complete();
      }
    })
    return this.subject.asObservable();
  }

  cancelProcess() {
    clearTimeout(this.timeout);
    if (!this.subject.isStopped) {
      this.subject.complete();
    }
    this.childClientProcessIds.forEach(e => {
      const message = new CancelMessage(e);
      this.postMessage(this.workerId, message);
    })
    super.cancelProcess();
  }

  private intersectionClipping(clippingShape, other) {
    let a = clippingShape;
    let b = this.Parser['read'](other);
    //if (RelateOp.intersects(a, b)) {
      let _shape = <Geometry>OverlayOp.intersection(a, b);
      if (_shape.isGeometryCollection()) { // check shape contain lineString
        let _arr = new ArrayList();
        for (let i = 0; i < _shape.getNumGeometries(); i++) {
          let g = _shape.getGeometryN(i)
          if (g !== null && (<GeometryCollection>g).getGeometryType() == 'Polygon') _arr.add(g);
        }
        _shape = _shape.getFactory().buildGeometry(_arr);
      }
      return (_shape)?this.Parser['write'](_shape):null;

  }
  private calculateArea(geometry: IGeometry): number {
    const coords: number[][] = geometry.coordinates[0];

    switch (geometry.type) {
      case "Polygon": {
        return this.calculateRingArea(geometry.coordinates[0])
      }
      case "MultiPolygon": {
        let area = 0;
        for (let i = 0; i < (<number[][][]>geometry.coordinates).length; i++) {
          area += this.calculateRingArea(geometry.coordinates[i][0]);
        }
        return area;
      }
      default:
        return 0;
    }
  }
  private calculateRingArea(coords: number[][]) {
    let area = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      let p1 = coords[i];
      let p2 = coords[i + 1];
      area += Math.abs(this.convertToRads(p2[0] - p1[0]) * (2 + Math.sin(this.convertToRads(p1[1]))) + Math.sin(this.convertToRads(p2[1])));
    }

    area = area * this.earthRad * this.earthRad / 2;

    return Math.abs(area);
  }

  private convertToRads(angle: number) {
    return angle * this.deg2Rad;
  }

}

