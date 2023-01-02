import { OverlayDataItem } from "./overlay-worker.model";

export abstract class OverlayAbstract<T extends OverlayDataItem> {

  private static GUID = 1;

  shapes = new Map<string, T>();
  shapesReturn = new Map<string, T>();
  shapesUpdatedReturn = new Map<string, T>();
  shapesDeletedReturn = new Set<string>();
  constructor(public id: string, public overlayType?: number) {
  }

  generateShapeId(id: string = null): string {
    return id === null ? (OverlayAbstract.GUID++).toString() : id;
  }

  getShape(shapeId: string): any {
    return this.shapes.has(shapeId) ? this.shapes.get(shapeId) : null;
  }

  getShapes(): T[] {
    return Array.from(this.shapes.values());
  }

  getPureShapes(): any[] {
    return Array.from(this.shapesReturn.values()).filter(e => e).map(e => {
      return {
        id: e.id,
        data: e.data,
        tile: {
          id: e.tile.id
        }
      }
    });
  }

  getPureShapesUpdated(): any[] {
    return Array.from(this.shapesUpdatedReturn.values()).filter(e => e).map(e => {
      return {
        id: e.id,
        data: e.data,
        tile: {
          id: e.tile.id
        }
      }
    });
  }

  getPureShapesDeleted(): any[] {
    return Array.from(this.shapesDeletedReturn.values()).filter(e => e);
  }


  hasShape(id): boolean {
    return this.shapes.has(id);
  }

  addShape(id: string, shape: T, updated: boolean): T {
    id = this.generateShapeId(id);
    this.shapes.set(id, shape);
    if(updated){
      this.shapesUpdatedReturn.set(id, shape) // for uncounted shape
    }else{
      this.shapesReturn.set(id, shape);
    }
    return shape;
  }

  allShapes(callBack: (shape: T) => void) {
    this.shapes.forEach(callBack);
  }

  deleteShape(shapeId: string, tileId: string = null) {
    this.shapes.delete(shapeId);
    this.shapesDeletedReturn.add(shapeId);
  }

  deleteShapes() {
    this.shapes.clear();
    this.deleteShapesReturn();
    this.deleteShapesUpdatedReturn();
    this.deleteShapesDeletedReturn();
  }

  clear() {
    this.deleteShapes();
  }

  deleteShapesReturn() {
    this.shapesReturn.clear();
  }

  deleteShapesUpdatedReturn() {
    this.shapesUpdatedReturn.clear();
  }

  deleteShapesDeletedReturn() {
    this.shapesDeletedReturn.clear();
  }
}
