import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { OverlayDataItem, OverlayAbstract } from '../../overlay/overlay-abstact';
import { MarkerClusterer } from '../../cluster';
import { ILayer } from '../../interfaces';
import { LayerStyle } from '../../layer-style';
import { BASE_HREF } from '../../global';
import { LayerType } from '../../enums';
import { TileOverlayAbstract } from './tile-overlay-abstract';

class ClusterDataItem implements OverlayDataItem {

  constructor(public id: string, public ref: google.maps.Marker) {
  }

  clean() {
  }
}

export class ClusterOverlay extends TileOverlayAbstract<ClusterDataItem> {

  private markerClusterer: MarkerClusterer;
  private update$ = new Subject<null>();
  constructor(public id: string,
    public layer: ILayer,
    private map: google.maps.Map,
    private style: LayerStyle) {

    super(id, layer);

    //this.update$.pipe(debounceTime(1500)).subscribe(() => {
    //   // this.markerClusterer.clearMarkers();
    //   // this.markerClusterer.addMarkers(shapes.map(e => e.ref), true);
    //  this.redraw();
    //});

    this.markerClusterer = new MarkerClusterer(this.map, [], {
      imagePath: `${BASE_HREF}icons/cluster/m`,
      minimumClusterSize: 1,
      zoomOnClick: false,
      gridSize: 100
    });
  }

  setStyle(style) {

  }

  addShapeFromData(data, tile, labelStyle = null, callback?) {

    const id = data.shapeId;
    let [lng, lat] = [0, 0];

    switch (this.layer.type) {
      case LayerType.POINT:
       // [lng, lat] = data.geometry.coordinates;
        [lng, lat] = data.CentroidGeom.coordinates;
        break;
      case LayerType.POLYGON:
        [lng, lat] = data.CentroidGeom.coordinates;
        break;
      default:
        console.warn('unsupported layer type');
    }

    const marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat, lng)
    });

    const shape = new ClusterDataItem(id, marker);
    this.addShape(id, shape);
    this.markerClusterer.addMarker(shape.ref, true);
    if (callback)
      callback();

   // this.update$.next(null);
  }

  deleteShape(shapeId: string) {
    let cdi = this.getShape(shapeId);
    if ((cdi))
      this.markerClusterer.removeMarker((<ClusterDataItem>cdi).ref, true);

    super.deleteShape(shapeId);
   // this.update$.next(null);
  }

  redraw() {
    this.markerClusterer.repaint();
  }

  clear() {
    this.markerClusterer.clearMarkers();
    super.clear();
  }
}
