import { Subscription } from 'rxjs';
import { ClientCache } from '../../../client/app/shared/ClientCache';
import { OverlayDataItem, IOverlayTile } from './overlay-worker.model';
import { OverlayAbstract } from './overlay-abstact-worker';

export class TileOverlayAbstract<T extends OverlayDataItem> extends OverlayAbstract<T> {

  dataCache: ClientCache;
  clusters: {
    centroid: any,
    weight: number,
    ratioScale: number,
    maxWeight: number,
    minWeight: number
  }[]
  voronoiCluster: any[];
  viewport: any;
  private tilesUpdate = new Set<string>()
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
    this.addShape(id, shape, this.tilesUpdate.has(tile.id));
  }

  deleteShape(shapeId: string, tileId: string = null, isTemp = false) {

    const tileMap = this.shapeTileIndex.get(shapeId);

    if ((tileMap) && tileMap.has(tileId)) {
      tileMap.delete(tileId);

      this.tiles.get(tileId).shapes
        .delete(this.getShape(shapeId));
    }

    if (!(tileMap) || tileMap.size == 0) {
      this.shapeTileIndex.delete(shapeId);
      super.deleteShape(shapeId, tileId);
    }
  }

  hasTile(tileId: string): boolean {
    return this.tiles.has(tileId);
  }

  addTile(tileId: string): IOverlayTile {
    if (this.tiles.has(tileId)) {
      this.tiles.get(tileId).isDeleted = false;
      this.tilesUpdate.add(tileId);
    } else {
      this.tiles.set(tileId, {
        id: tileId,
        shapes: new Set<OverlayDataItem>(),
        remoteTiles: new Set<string>(),
        isDeleted: false
      });
    }
    return this.tiles.get(tileId);
  }

  getTile(id: string): IOverlayTile {
    return this.tiles.get(id);
  }

  getTiles(): IOverlayTile[] {
    return Array.from(this.tiles.values());
  }

  updateTiles(viewportTilesIds: string[], renderedViewportTiles: string[], updateAll = false, updateTiles: { tileId, referenceTileId }[] = []): string[] {
    const viewportTileRendered = new Set<string>();
    viewportTilesIds.forEach(e => {
      if (renderedViewportTiles.includes(e)) {
        viewportTileRendered.add(e);
      }
      if (this.tiles.has(e)) {
        this.tiles.get(e).remoteTiles.forEach(_e => {
          if (renderedViewportTiles.includes(_e)) {
            viewportTileRendered.add(_e);
          }
        })
      }
    })
    const viewportRemoteTileRendered = new Set<string>();
    viewportTileRendered.forEach(e => {
      const tile = this.tiles.has(e);
      if (tile) {
        this.tiles.get(e).remoteTiles.forEach(remote => viewportRemoteTileRendered.add(remote))
      }
    })
    if (!updateAll) {
      updateTiles.forEach(e => {
        if (viewportTileRendered.has(e.tileId)) {
          viewportTileRendered.delete(e.tileId);
        }
        if (viewportTileRendered.has(e.referenceTileId)) {
          viewportTileRendered.delete(e.referenceTileId);
        }
      })
    }
    const tilesToRequest: string[] = viewportTilesIds
      .filter(tileId => updateAll || !viewportTileRendered.has(tileId));
    console.log("current tiles overlay", this.tiles);
    console.log("viewportTileRendered", viewportTileRendered)
    console.log("updateTiles", updateTiles);
    this.tiles.forEach(tile => {
      if (updateTiles.find(e => e.tileId === tile.id)) {
        this.deleteTile(tile, true);  // temporary delete shapes in tile
      } else if (
        !viewportTileRendered.has(tile.id)
        // && !viewportRemoteTileRendered.has(tile.id)
      ) {
        this.deleteTile(tile);
      }
    });

    return tilesToRequest;
  }

  deleteTiles() {
    console.log("deleteTiles")
    this.tiles.forEach(tile => {
      this.deleteTile(tile);
    });
    this.clearDeletedTiles();
  }

  deleteTile(tile: IOverlayTile | string, isTemp = false) {

    if (!(tile)) {
      return;
    }

    const t: IOverlayTile = tile instanceof Object ? <IOverlayTile>tile : this.tiles.get(<string>tile);

    if (!(t)) {
      return;
    }
    this.tiles.get(t.id).isDeleted = true;
  }

  clearDeletedTiles() {
    this.tiles.forEach(tile => {
      if (tile.isDeleted) {
        tile.shapes.forEach(shape => this.deleteShape(shape.id, tile.id));
        this.tiles.delete(tile.id);
      }
    })
  }

  setRemoteTiles(tileId: string, remoteTiles: string[]) {
    const tile = this.getTile(tileId);
    if (tile) {
      remoteTiles.forEach(tileId => {
        tile.remoteTiles.add(tileId);
      })
    }
  }

  setCluster(clusters) {
    this.clusters = [...clusters];
  }

  setVoronoiCluster(clusters) {
    this.voronoiCluster = [...clusters];
  }

  clearVoronoiCluster() {
    this.voronoiCluster = null;
  }

  clear() {
    this.shapeTileIndex.clear();
    this.tilesUpdate.clear();
    this.clusters = null;
    this.voronoiCluster = null;
    this.deleteTiles();
    super.clear();
  }
}
