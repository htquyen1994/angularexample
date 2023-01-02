import { Subscription } from 'rxjs';
import { ClientCache } from '../../../../../client/app/shared/ClientCache';
import { OverlayDataItem, IOverlayTile } from './overlay-worker.model';
import { OverlayAbstract } from './overlay-abstact-worker';

export class TileOverlayAbstract<T extends OverlayDataItem> extends OverlayAbstract<T> {

  dataCache: ClientCache;

  private tiles = new Map<string, IOverlayTile>();
  private shapeTileIndex = new Map<string, Set<string>>();

  constructor(public id: string) {
    super(id);
    this.dataCache = new ClientCache();
  }

  addShapeFromData(data: any, tile: IOverlayTile, callback?: Function) {
    let id = this.generateShapeId(data.shapeId);
    let shape: OverlayDataItem = {
      data: data,
      id: id,
      tile: tile
    }
    this.addShapeToTile(id, shape as T, tile);
    tile.shapes.add(shape);
    if (callback)
      callback();
  };

  addShapeToTile(id: string, shape: T, tile: IOverlayTile) {

    if (!this.shapeTileIndex.has(id))
      this.shapeTileIndex.set(id, new Set<string>());

    this.shapeTileIndex.get(id).add(tile.id);
    this.addShape(id, shape);
  }

  deleteShape(shapeId: string, tileId: string = null) {

    const tileMap = this.shapeTileIndex.get(shapeId);

    if ((tileMap) && tileMap.has(tileId)) {
      tileMap.delete(tileId);

      this.tiles.get(tileId).shapes
        .delete(this.getShape(shapeId));
    }

    if (!(tileMap) || tileMap.size == 0) {
      this.shapeTileIndex.delete(shapeId);
      super.deleteShape(shapeId);
    }
  }

  hasTile(tileId: string): boolean {
    return this.tiles.has(tileId);
  }

  addTile(tileId: string): IOverlayTile {
    this.tiles.set(tileId, {
      id: tileId,
      shapes: new Set<OverlayDataItem>(),
      subscriptions: new Set<Subscription>()
    });
    return this.tiles.get(tileId);
  }

  getTile(id: string): IOverlayTile {
    return this.tiles.get(id);
  }

  updateTiles(tilesIds: string[], updateAll = false): string[] {

    const tilesToRequest: string[] = tilesIds
      .filter(tileId => updateAll || !this.tiles.has(tileId));

    this.tiles.forEach(tile => {
      if (!tilesIds.includes(tile.id)) {
        this.deleteTile(tile);
      }
    });

    return tilesToRequest;
  }

  deleteTiles() {
    this.tiles.forEach(tile => {
      this.deleteTile(tile);
    });
  }

  deleteTile(tile: IOverlayTile | string) {

    if (!(tile)) {
      return;
    }

    const t: IOverlayTile = tile instanceof Object ? <IOverlayTile>tile : this.tiles.get(<string>tile);

    if (!(t)) {
      return;
    }

    t.shapes.forEach(shape => this.deleteShape(shape.id, t.id));
    t.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.tiles.delete(t.id);
  }

  clear() {
    this.shapeTileIndex.clear();
    this.deleteTiles();
    super.clear();
  }
}
