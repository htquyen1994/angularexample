import { TileOverlayAbstract } from "../overlay/tile-overlay-worker";
import { Observable, Observer } from "rxjs";

export enum createShapeReturnType{
    createShape,
    deleteShape
}

export class OverlayService {

    static createShape(overlay: TileOverlayAbstract<any>, tile: any, data: any, featureFilter: any,selectedIds: string[]): Observable<any> {
        return Observable.create((observer:Observer<any>)=>{
            const shapeId = data.shapeId;
            let callback = ()=>{
                observer.next(createShapeReturnType.createShape);
                observer.complete();
            }
            try {
                if (overlay.hasTile(tile.id) && featureFilter(data) &&  (!selectedIds || (selectedIds.includes(shapeId)))) {
                    overlay.addShapeFromData(data, tile, callback);
                } else if ((overlay.getShape(shapeId))) {
                    overlay.deleteShape(shapeId,tile.id);
                    callback();
                } else {
                    callback();
                }
            } catch (e) {
                console.log(e, data);
                callback();
            }
        })
    }

}