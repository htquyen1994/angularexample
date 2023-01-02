import {Injectable, NgZone} from '@angular/core';
import {
    OverlayService,
    OverlayShapePoint,
    OverlayShapeLine,
    OverlayShapePolygon,
    OverlayShapeCircle,
    OverlayShapeRectangle,
    MapService,
    SelectionService,
    ZINDEX,
    DrawingOverlay
} from '../../shared';
import { OverlayShapeOptions } from '../../shared/interfaces';
import { OverlayShapeType } from '../../shared/enums';

@Injectable()
export class DrawingService {

    drawingManager: google.maps.drawing.DrawingManager;
    opts: OverlayShapeOptions;
    overlay: DrawingOverlay = null;

    constructor(private mapService: MapService,
                private selectionService: SelectionService,
                private overlayService: OverlayService,
                private _ngZone: NgZone) {

        this.mapService.mapRx.subscribe((map: google.maps.Map) => {
            this.init(map);
        });
    }

    init(map: google.maps.Map) {

        this.overlay = <DrawingOverlay>this.overlayService.overlays.get('__DRAW');

        this.opts = {
            isEditable: true,
            isSelectable: true,
            zIndex: ZINDEX.INFOWINDOW
        };

        this.drawingManager = new google.maps.drawing.DrawingManager({
            map: map,
            drawingMode: null,
            drawingControl: false,
            markerOptions: OverlayShapePoint.getDefaultOptions(this.opts),
            polylineOptions: OverlayShapeLine.getDefaultOptions(this.opts),
            polygonOptions: OverlayShapePolygon.getDefaultOptions(this.opts),
            circleOptions: OverlayShapeCircle.getDefaultOptions(this.opts),
            rectangleOptions: OverlayShapeRectangle.getDefaultOptions(this.opts)
        });

        this.drawingManager.addListener('markercomplete', this.complete(OverlayShapeType.Point));
        this.drawingManager.addListener('polylinecomplete', this.complete(OverlayShapeType.LineString));
        this.drawingManager.addListener('polygoncomplete', this.complete(OverlayShapeType.Polygon));
        this.drawingManager.addListener('circlecomplete', this.complete(OverlayShapeType.Circle));
        this.drawingManager.addListener('rectanglecomplete', this.complete(OverlayShapeType.Rectangle));
    }

    resetDrawingOption(){
        if(this.drawingManager) {
            this.drawingManager.setOptions({
                markerOptions: OverlayShapePoint.getDefaultOptions(this.opts),
                polylineOptions: OverlayShapeLine.getDefaultOptions(this.opts),
                polygonOptions: OverlayShapePolygon.getDefaultOptions(this.opts),
                circleOptions: OverlayShapeCircle.getDefaultOptions(this.opts),
                rectangleOptions: OverlayShapeRectangle.getDefaultOptions(this.opts)
            })
        }
    }

    private complete(type: OverlayShapeType) {
        return (shapeRef: any) =>  this._ngZone.run(()=>{
          const shape = this.overlay.addShapeByCoordinates(null, type, shapeRef, this.opts);
          this.selectionService.changeSelection({
              isAdd: true,
              overlayId: this.overlay.id,
              shapeId: shape.id
          });
        })  ;
    }

  customDrawingManager(type: OverlayShapeType, opts: OverlayShapeOptions) {
    let markerOptions = OverlayShapePoint.getDefaultOptions(this.opts)
    switch (type) {
      case OverlayShapeType.Point:
        markerOptions = OverlayShapePoint.getDefaultOptions(opts);
        break;
      default:
        break;
    }
    const drawingManager = new google.maps.drawing.DrawingManager({
      map: this.mapService.map,
      drawingMode: null,
      drawingControl: false,
      markerOptions,
    });
    return drawingManager;
  }

  removeCustomDrawingManager(drawingManager: google.maps.drawing.DrawingManager){
    drawingManager.unbindAll();
    drawingManager.setMap(null);
    drawingManager = null;
  }
}
