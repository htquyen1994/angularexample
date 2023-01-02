import { OverlayDataItem } from '../../overlay/overlay-abstact';
import { ILayer, OverlayShapeOptions } from '@client/app/shared/interfaces';
import { LayerStyle, LayerStyleCluster } from '../../layer-style';
import { ZINDEX } from '../../global';
import { ICONS } from '../../models/overlayShapeIcon';
import { OverlayShapeType } from '@client/app/shared/enums';
import { TileOverlayAbstract } from './tile-overlay-abstract';
import { OverlayShapePoint, OverlayShape, OverlayShapePolygon, OverlayShapeMultiPolygon } from '../../overlay-shape';
import { interpolateRgb } from 'd3-interpolate';
import { OverlayShapeStatic } from '../overlay-shape-static';
import { DynamicPipe } from '@client/app/shared/pipes';
import { OverlayLabel } from '../../overlay-label';
import { ELabelPosition } from '../label.model';
import { IFeature, IGeometry } from '../../map-utils/shapes';
import * as _ from 'lodash'
export interface ClusterDataItemOption {
  zIndex?: number,
  icon?: string,
  isSelected?: boolean;
  gradient?: string[];
  ratioScale?: number;
  weight?: number;
  minWeight?: number;
  maxWeight?: number;
  geometry?: any;
  centroid?: number[];
  strokeTransparency?: number,
  transparency?: number;
  strokeColor?: string;

  isLabeling?: boolean;
}
export abstract class ClusterDataItem implements OverlayDataItem {
  mapRef: Array<any> = [];
  isMulti: boolean;
  private label: OverlayLabel = null;
  abstract getOptions(opts: ClusterDataItemOption);
  abstract setMapRef(opts: OverlayShapeOptions): any;
  abstract convertGeometry(shape: any): any;
  constructor(public id: string, public type: OverlayShapeType, public opts: ClusterDataItemOption, public data: any) {
    this.isMulti = [
      OverlayShapeType.MultiPoint,
      OverlayShapeType.MultiLineString,
      OverlayShapeType.MultiPolygon
    ].includes(type);
    const { geometry, isLabeling } = opts;
    const geometries = this.convertGeometry(geometry);
    delete opts.geometry;
    geometries.forEach((_geometry: any) => {
      const o = Object.assign({}, this.opts);
      o.geometry = _geometry;
      const _opts = this.getOptions(o);
      const shapeRef = this.setMapRef({ ..._opts });
      this.mapRef.push(shapeRef);
    });
    this.updateLabel(isLabeling);
    // this.setEvents();
  }
  static factory(id: string, type: OverlayShapeType, opts: ClusterDataItemOption, data: any): ClusterDataItem {
    let object: ClusterDataItem;
    switch (type) {
      case OverlayShapeType.Point:
        object = new ClusterShapePoint(id, type, opts, data);
        break;
      case OverlayShapeType.MultiPolygon:
      case OverlayShapeType.Polygon:
        object = new ClusterShapePolygon(id, type, opts, data);
        break;

      default:
        console.warn('GEOMETRY TYPE NOT IMPLEMENTED', type);
        break;
    }
    return object;
  }

  updateLabel(isLabeling) {
    const { weight, zIndex } = this.opts;
    const text = new DynamicPipe().transform(weight, 'number', ['1.0-0']);
    if (this.label) {
      this.destroyLabel();
    }
    if (this instanceof ClusterShapePoint) {
      this.createLabel(zIndex, text, 12);
      // this.mapRef.forEach(shapeRef => {
      //   shapeRef.setLabel({
      //     text,
      //     color: '#ffffff',
      //     fontSize: '11px',
      //     fontWeight: 'bold',
      //   })
      // })
    } else {
      if (isLabeling) {
        this.createLabel(zIndex, text, 14);
      } else {
        this.destroyLabel()
      }
    }
  }

  createLabel(zIndex, text, textSize: number) {
    this.label = new OverlayLabel(this.getCenter(), zIndex, text, this.type, {}, { position: ELabelPosition.CENTER, textSize });
    this.label.label.setPositionCallback(() => { // set callback
      OverlayShapeStatic.labelgunService.addLabel(this.label.label, this.id);
      this.label.label.setPositionCallback(undefined);
    })
    this.label.label.setDestroyCallback(() => {
      OverlayShapeStatic.labelgunService.removeLabel(this.id);
    })
  }

  getCenter(): google.maps.LatLng {
    const { centroid } = this.opts;
    return new google.maps.LatLng(centroid[1], centroid[0])
  }

  update(opts: ClusterDataItemOption) {
    const { gradient, transparency, strokeTransparency, strokeColor, isLabeling } = opts;
    if (isLabeling != this.opts.isLabeling || isLabeling) {
      this.updateLabel(isLabeling);
    }
    this.opts = { ...this.opts, gradient, transparency, strokeTransparency, strokeColor, isLabeling };
    const _opts = this.getOptions(this.opts);
    this.mapRef.forEach(shapeRef => {
      shapeRef.setOptions(_opts);
    })
  }

  setEvents(shapeRef) {
    shapeRef.addListener('click', (event: google.maps.MouseEvent) => {
      switch (OverlayShapeStatic.selectionService.activeToolStore) {
        case null:
          if (this.opts && this.opts.isSelected) {
            shapeRef.setZIndex(this.opts.zIndex);
            this.opts = {
              ...this.opts,
              isSelected: false
            }
          } else {
            shapeRef.setZIndex(ZINDEX.ACTIVESHAPE);
            this.opts = {
              ...this.opts,
              isSelected: true
            }
          }
          break;
        default:
      }
    });
  }

  clean() {
    this.mapRef.forEach((x: any) => x.setMap(null));
    if (this.label) {
      this.label.destroy();
    }
  }
  destroyLabel() {
    if (this.label) {
      this.label.destroy();
    }
  }
}

export class ClusterShapePoint extends ClusterDataItem {
  getOptions(opts: ClusterDataItemOption) {
    const { icon, zIndex, isSelected, gradient, ratioScale, weight, geometry, transparency, strokeTransparency, strokeColor } = opts;
    const _opts = Object.assign({
      clickable: false,
      isSelectable: true,
      icon,
      iconSize: 40 * ratioScale + 10,
      zIndex: isSelected ? ZINDEX.OVERLAYS : zIndex,
      fillColor: ClusterOverlay.colorFn(ratioScale, gradient),
      isDisplayStrokePoint: true,
      strokeWeight: 0.5,
      strokeColor: '#fff',
      geometry: geometry,
      // transparency
    })
    return OverlayShapePoint.getDefaultOptions(_opts);
  }
  setMapRef(opts: any) {
    return new google.maps.Marker(opts);
  }
  convertGeometry(shape: any) {
    if (!this.isMulti) {
      shape = [shape];
    }
    return shape.map((x: number[]) => {
      return new google.maps.LatLng(x[1], x[0]);
    });
  }

}

export class ClusterShapePolygon extends ClusterDataItem {
  getOptions(opts: ClusterDataItemOption) {
    const { zIndex, isSelected, gradient, ratioScale, geometry, strokeColor, strokeTransparency, transparency } = opts;
    const _opts = Object.assign({
      clickable: false,
      isSelectable: true,
      zIndex: isSelected ? ZINDEX.OVERLAYS : zIndex,
      fillColor: ClusterOverlay.colorFn(ratioScale, gradient),
      isDisplayStrokePoint: true,
      strokeWeight: 0.5,
      geometry: geometry,
      strokeColor,
      strokeTransparency,
      transparency
    })
    return OverlayShapePolygon.getDefaultOptions(_opts);
  }
  setMapRef(opts: OverlayShapeOptions) {
    return new google.maps.Polygon(opts);
  }
  convertGeometry(shape: any) {
    if (!this.isMulti) {
      shape = [shape];
    }
    return shape.map((x: any) => {
      return x.map((y: any) => {
        return y.map((z: any) => {
          return new google.maps.LatLng(z[1], z[0]);
        });
      });
    });
  }
}

export class ClusterOverlay extends TileOverlayAbstract<ClusterDataItem> {
  private static colorFnCache = new Map();
  private gradient = ['#ff9999', '#f94863'];

  constructor(public id: string,
    public layer: ILayer,
    private map: google.maps.Map,
    public style: LayerStyle) {
    super(id, layer);
    OverlayShape.index++;
    this.gradient = style.opts.gradient.slice(0);
    if (!this.gradient.length) {
      this.gradient = ['#ff9999', '#f94863'];
    }
    this.layerIndex = OverlayShape.index;
  }

  setStyle(style: LayerStyleCluster) {
    const { gradient, transparency, strokeTransparency, strokeColor, isLabeling } = style.opts;
    this.allShapes(shape => {
      shape.update({ gradient: gradient, transparency, strokeTransparency, strokeColor, isLabeling });
    });
    this.style = style.clone();
  }

  addShapeFromData(data: IFeature<IGeometry>, tile, labelStyle = null, callback?) {
    const { geometry, centroid, properties } = data
    const { weight, ratioScale } = properties;
    if (!weight) {
      return;
    }
    const { gradient, transparency, strokeTransparency, strokeColor, isLabeling } = this.style.opts
    const id = this.generateShapeId();
    const shape = ClusterDataItem.factory(
      id,
      <any>OverlayShapeType[<any>geometry.type],
      {
        icon: ICONS.CIRCLE,
        zIndex: this.layerIndex,
        gradient,
        transparency,
        strokeTransparency,
        strokeColor,
        ratioScale,
        weight,
        centroid,
        geometry: geometry.coordinates,
        isLabeling
      },
      data
    );
    this.addShape(id, shape);

    if (callback)
      callback();
  }

  deleteShape(shapeId: string) {
    super.deleteShape(shapeId);
  }

  clear() {
    super.clear();
  }

  static colorFn(t: number, gradient = ['#ff9999', '#f94863']): string {
    const parts = gradient.length - 1;
    const partLength = 1 / parts;
    const rangeStart = Math.floor(t / partLength);
    const t1 = (t - (partLength * rangeStart)) * parts;

    const key = `${gradient[rangeStart]}_${gradient[rangeStart + 1]}`;
    if (!ClusterOverlay.colorFnCache.has(key)) {
      ClusterOverlay.colorFnCache.set(
        key,
        interpolateRgb(gradient[rangeStart], gradient[rangeStart + 1]));
    }

    return ClusterOverlay.colorFnCache.get(key)(t1);
  }
}
