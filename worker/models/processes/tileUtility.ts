import { GlobalMercator } from '../../../client/app/shared/map-utils/mercator';
import { IBoundingBox } from '../../../client/app/iface/IBoundingBox';
import { IGeometry } from '../../../client/app/shared/map-utils/shapes-pure';
import { IBufferTile } from '../../../client/app/iface/IBufferTIle';

export class TileUtility {
  private static _mercator: GlobalMercator = new GlobalMercator();
  static GetTileIds(rects: IBoundingBox[], zoom: number): string[] {

    const tiles = new Set<string>();
    for (let x = 0; x < rects.length; x++) {
      let minM = this._mercator.LatLonToMeters(rects[x].Min.Lat, rects[x].Min.Lng);
      let minTile = this._mercator.MetersToTile(minM.mx, minM.my, zoom);

      let maxM = this._mercator.LatLonToMeters(rects[x].Max.Lat, rects[x].Max.Lng);
      let maxTile = this._mercator.MetersToTile(maxM.mx, maxM.my, zoom);
      for (let i = minTile.tx - 1; i < maxTile.tx + 2; i++) {
        for (let j = minTile.ty - 1; j < maxTile.ty + 2; j++) {

          let qk = this._mercator.QuadTree(i, j, zoom);
          tiles.add(qk);
        }
      }
    }

    return Array.from(tiles.values());
  }

  static GetPriorityTiles(_viewportTiles: string[], _currentTiles: string[]) {
    if (!_currentTiles.length) {
      return {
        requestTiles: [..._viewportTiles],
        neededUpdateTiles: [],
        lowPriorityTiles: []
      }
    }
    let compareCurrentTiles = [..._currentTiles];
    let compareViewportTiles = [..._viewportTiles];
    const lowPriorityTiles = new Set<string>();
    const requestTiles = [];
    let neededUpdateTiles = [];
    const dif = _viewportTiles[0].length - _currentTiles[0].length;
    if (dif > 0) { // zoom in
      compareViewportTiles = _viewportTiles.map(e => e.slice(0, -dif));
    } else if (dif < 0) { // zoom out
      compareCurrentTiles = _currentTiles.map(e => e.slice(0, dif));
    } else { //panning
      return {
        requestTiles: [..._viewportTiles],
        neededUpdateTiles: [],
        lowPriorityTiles: []
      }
    }

    _viewportTiles.forEach((tileId, i) => {
      const _t = compareViewportTiles[i];
      if (compareCurrentTiles.includes(_t)) {
        lowPriorityTiles.add(tileId);
        neededUpdateTiles = [...neededUpdateTiles, ...compareCurrentTiles.map((e, index) => e === _t ? {
          tileId: _currentTiles[index],
          referenceTileId: tileId
        } : null).filter(e => !!e)];
      } else {
        requestTiles.push(tileId);
      }
    })
    return {
      neededUpdateTiles,
      requestTiles: [...requestTiles],
      lowPriorityTiles: Array.from(lowPriorityTiles)
    }
  }

  static GetTilesBound(rect: IBoundingBox, zoom: number, bufferTile: IBufferTile): IBoundingBox {
    const minM = this._mercator.LatLonToMeters(rect.Min.Lat, rect.Min.Lng);
    const minTile = this._mercator.MetersToTile(minM.mx, minM.my, zoom);
    const maxM = this._mercator.LatLonToMeters(rect.Max.Lat, rect.Max.Lng);
    const maxTile = this._mercator.MetersToTile(maxM.mx, maxM.my, zoom);
    //console.log(minTile, maxTile);
    const minBound = this._mercator.TileLatLonBounds(minTile.tx - bufferTile.x, minTile.ty - bufferTile.y, zoom);
    const maxBound = this._mercator.TileLatLonBounds(maxTile.tx + bufferTile.x, maxTile.ty + bufferTile.y, zoom);

    // temporarily revert buffer fix
    //const minBound = this._mercator.TileLatLonBounds(minTile.tx - 1, minTile.ty - 1, zoom);
    //const maxBound = this._mercator.TileLatLonBounds(maxTile.tx + 2, maxTile.ty + 2, zoom);

    return {
      Max: {
        Lat: maxBound.max.lat,
        Lng: maxBound.max.lng
      },
      Min: {
        Lat: minBound.min.lat,
        Lng: minBound.min.lng
      }
    }
  }
  static boundingBoxToGeometry(viewport: IBoundingBox): IGeometry {
    const { Max, Min } = viewport;
    return {
      coordinates: [[[Min.Lng, Min.Lat], [Min.Lng, Max.Lat], [Max.Lng, Max.Lat], [Max.Lng, Min.Lat], [Min.Lng, Min.Lat]]],
      type: "Polygon"
    }
  }
}
