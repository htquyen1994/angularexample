import { OverlayShape } from '../overlay-shape';
import {  OverlayShapeType } from '../enums'
import {  OverlayShapeOptions } from '../interfaces'
import {OverlayAbstract} from './overlay-abstact';

export class DrawingOverlay extends OverlayAbstract<OverlayShape> {
    addShapeByCoordinates(id: string, type: OverlayShapeType,
                          geometry: any | Array<any>, opts: OverlayShapeOptions, data = {}): OverlayShape {
        id = this.generateShapeId(id);
        opts.geometry = geometry;
        const shape = OverlayShape.factory(id, type, opts, data, null, this.overlayType, this.id, true);
        this.addShape(id, shape);
        return shape;
    }
    setStyle(style){

    };
}
