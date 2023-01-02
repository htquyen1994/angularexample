import { LayerStyle } from "../layer-style";

export interface OverlayDataItem {
  id: string;
  data?: any;
  clean();
}

export abstract class OverlayAbstract<T extends OverlayDataItem> {
  layerIndex = 0;
  private static GUID = 1;

  shapes = new Map<string, T>();
  deleteTimeout: any[] = [];

  tiles = new Set<string>();
  tileMaps = new Map<string, string>();

  constructor(public id: string, public overlayType?: number) {
  }

  abstract setStyle(style: LayerStyle);

  generateShapeId(id: string = null): string {
    return id === null ? (OverlayAbstract.GUID++).toString() : id;
  }

  // TODO: type any
  getShape(shapeId: string): any {
    return this.shapes.has(shapeId) ? this.shapes.get(shapeId) : null;
  }

  getShapes(): T[] {
    return Array.from(this.shapes.values());
  }

  hasShape(id): boolean {
    return this.shapes.has(id);
  }

  addShape(id: string, shape: T): T {

    id = this.generateShapeId(id);

    if (this.getShape(id) === shape) {
      return shape;
    }

    this.deleteShape(id);

    this.shapes.set(id, shape);

    return shape;
  }

  updateShapeTile(shapeId: string, updatedTileId: string) {
    if (this.tileMaps.has(shapeId)) {
      const tileId = this.tileMaps.get(shapeId);
      if (tileId)
        this.deleteTile(tileId);
      this.tileMaps.delete(shapeId);
      this.addTile(updatedTileId, [shapeId]);
    }
  }

  addTile(tileId: string, shapeIds: string[]) {
    if (!this.tiles.has(tileId)) {
      this.tiles.add(tileId);
      shapeIds.forEach(e => {
        this.tileMaps.set(e, tileId);
      })
    } else {
      shapeIds.forEach(e => {
        this.tileMaps.set(e, tileId);
      })
    }
  }

  deleteTile(tileId) {
    if (this.tiles.has(tileId)) {
      this.tiles.delete(tileId);
    }
  }

  getTiles() {
    return Array.from(this.tiles.values());
  }

  allShapes(callBack: (shape: T) => void) {
    this.shapes.forEach(callBack);
  }

  deleteShape(shapeId: string) {

    if (this.shapes.has(shapeId)) {
      const shape = this.shapes.get(shapeId);
      if (shape) {
        shape.clean();
      }
      this.shapes.delete(shapeId);
    }
    if (this.tileMaps.has(shapeId)) {
      const tileId = this.tileMaps.get(shapeId);
      if (tileId)
        this.deleteTile(tileId);
      this.tileMaps.delete(shapeId);
    }
  }

  deleteShapes(excludeShapeIds: string[] = []) {
    this.shapes.forEach((shape, key) => {
      if (!excludeShapeIds.includes(shape.id)) {
        this.deleteShape(key);
      }
    });
  }

  deleteSelectedShapes(selectedShapeIds: string[] = []) {
    this.shapes.forEach((shape, key) => {
      if (selectedShapeIds.includes(shape.id)) {
        this.deleteShape(key);
      }
    });
  }
  deleteShapesById_async(shapeIds: string[] = []) {
    const pageSize = 50;//delete 50 shapes onetime
    const loopCount = Math.ceil(shapeIds.length / pageSize);
    for (let index = 0; index < loopCount; index++) {
      const currentIndex = index * pageSize;
      const _arrayDelete = shapeIds.slice(currentIndex, currentIndex + pageSize);
      const timeout = setTimeout(() => {
        for (let index = 0; index < _arrayDelete.length; index++) {
          const element = _arrayDelete[index];// shapeId
          const key = element;
          this.deleteShape(key);
        }
        let index = this.deleteTimeout.findIndex(e => e == timeout);
        this.deleteTimeout.splice(index, 1);
      }, 0);
      this.deleteTimeout.push(timeout);
    }
  }

  deleteShapes_async(arrayShapes: any[]) {
    const pageSize = 100;//delete 50 shapes onetime
    const loopCount = Math.ceil(arrayShapes.length / pageSize);
    for (let index = 0; index < loopCount; index++) {
      const currentIndex = index * pageSize;
      const _arrayDelete = arrayShapes.slice(currentIndex, currentIndex + pageSize);
      const timeout = setTimeout(() => {
        for (let index = 0; index < _arrayDelete.length; index++) {
          const element = _arrayDelete[index];// [key,value]
          const key = element[0];
          this.deleteShape(key);
        }
        let index = this.deleteTimeout.findIndex(e => e == timeout);
        this.deleteTimeout.splice(index, 1);
      }, 0);
      this.deleteTimeout.push(timeout);
    }
  }

  cancelDeteleShapes() {
    this.deleteTimeout.forEach(e => {
      clearTimeout(e);
    })
    this.deleteTimeout = [];
  }

  clear() {
    this.cancelDeteleShapes();
    this.deleteShapes_async(Array.from(this.shapes));
  }
}
