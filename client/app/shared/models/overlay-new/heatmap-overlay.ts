import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { color } from 'd3-color';
import { OverlayDataItem, OverlayAbstract } from '../../overlay/overlay-abstact';
import { ILayer } from '../../interfaces';
import { LayerStyle } from '../../layer-style';
import { OverlayShapeType } from '../../enums/overlay-shape-enums';
import { TileOverlayAbstract } from './tile-overlay-abstract';

;

class HeatmapDataItem implements OverlayDataItem, google.maps.visualization.WeightedLocation {

  constructor(public id: string, public location: google.maps.LatLng, public weight: number) {
  }

  clean() {
  }
}

export class HeatmapOverlay extends TileOverlayAbstract<HeatmapDataItem> {

  private heatmap: google.maps.visualization.HeatmapLayer;
  private update$ = new Subject<null>();
  private map: google.maps.Map
  private isShowMap: boolean;
  private gradient: string[];
  constructor(id: string, layer: ILayer, map: google.maps.Map, public style: LayerStyle) {
    super(id, layer);
    this.map = map;
    this.showHeatMap();
    this.update$.pipe(debounceTime(1000)).subscribe(() => {
      this.heatmap.setData(this.getShapes());
      if (!this.isShowMap) {
        this.heatmap.setMap(null);
      }
    });
    this.gradient = style.opts.gradient.slice(0);
    let gradient = style.opts.gradient.slice(0);

    if (gradient.length > 0) {
      const c = color(gradient[0]).rgb();
      gradient[0] = `rgba(${c.r}, ${c.g}, ${c.b}, 0)`;
    } else {
      gradient = null;
    }

    this.heatmap = new google.maps.visualization.HeatmapLayer({
      map: map,
      data: [],
      gradient: gradient,
      dissipating: true,
      opacity: style.opts.transparency,
      // maxIntensity: 5,
      radius: 30
    });
  }

  setStyle(style) {
    let flag = false;
    if (style.opts.gradient &&
      (style.opts.gradient.length != this.gradient.length
        || style.opts.gradient.map((e, i) => this.gradient[i] == e).includes(false))) {
      this.gradient = style.opts.gradient.slice(0);
      flag = true;
    }
    if (style.opts.transparency != this.style.opts.transparency) {
      flag = true;
    }
    if (flag) {
      this.style = style;
      let gradient = style.opts.gradient.slice(0);
      if (gradient.length > 0) {
        const c = color(gradient[0]).rgb();
        gradient[0] = `rgba(${c.r}, ${c.g}, ${c.b}, 0)`;
      } else {
        gradient = null;
      }
      this.heatmap.setOptions({
        data: this.getShapes(),
        gradient,
        dissipating: true,
        opacity: style.opts.transparency,
        // maxIntensity: 5,
        radius: 30
      })
    }
    // this.hideHeatMap();
    // this.heatmap.setMap(null);
    // this.heatmap = new google.maps.visualization.HeatmapLayer({
    //   data: [],
    //   gradient: gradient,
    //   dissipating: true,
    //   opacity: style.opts.transparency,
    //   // maxIntensity: 5,
    //   radius: 30
    // });
    // this.setMapBack();
    // this.update$.next(null);
    // }
  }

  addShapeFromData(data, tile, labelStyle = null, callback?) {

    // const type = <any>OverlayShapeType[<any>data.geometry.type];
    const id = data.shapeId;

    let [lng, lat] = [0, 0];

    //if (type === OverlayShapeType.Point) {
    //    [lng, lat] = data.geometry.coordinates;
    //} else if (type === OverlayShapeType.Polygon || type === OverlayShapeType.MultiPolygon || type == OverlayShapeType.LineString) {
    [lng, lat] = data.CentroidGeom.coordinates;
    //} else {
    //    throw new Error('not Implemented');
    //}
    this.addShape(id, new HeatmapDataItem(
      this.generateShapeId(),
      new google.maps.LatLng(lat, lng),
      data[this.style.opts.columnName]
    ));

    if (callback)
      callback();

    this.update$.next(null);
  }

  clear() {
    this.hideHeatMap();
    this.heatmap.setMap(null);
    super.clear();
  }

  showHeatMap() {
    this.isShowMap = true;
  }

  hideHeatMap() {
    this.isShowMap = false;
  }

  setMapBack() {
    this.showHeatMap();
    this.heatmap.setMap(this.map);
  }
}
