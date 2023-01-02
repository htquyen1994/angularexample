export class GlobalMercator {
    tileSize: number;
    initialResolution: number;
    originShift: number;

    constructor(tileSize = 256) {
        //"Initialize the TMS Global Mercator pyramid"
        this.tileSize = tileSize;
        this.initialResolution = 2 * Math.PI * 6378137 / this.tileSize;
        //# 156543.03392804062 for tileSize 256 pixels
        this.originShift = 2 * Math.PI * 6378137 / 2.0;
        //# 20037508.342789244
    }

    LatLonToMeters(lat: number, lon: number) {
        //"Converts given lat/lon in WGS84 Datum to XY in Spherical Mercator EPSG:900913"
        let mx = lon * this.originShift / 180.0;
        let my = Math.log(Math.tan((90 + lat) * Math.PI / 360.0)) / (Math.PI / 180.0);
        my = my * this.originShift / 180.0;
        return { mx: mx, my: my };
    }

    MetersToLatLon(mx: number, my: number) {
        //"Converts XY point from Spherical Mercator EPSG:900913 to lat/lon in WGS84 Datum"
        let lon = (mx / this.originShift) * 180.0;
        let lat = (my / this.originShift) * 180.0;
        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180.0)) - Math.PI / 2.0);
        return { lat: lat, lng: lon };
    }

    PixelsToMeters(px: number, py: number, zoom: number) {
        //"Converts pixel coordinates in given zoom level of pyramid to EPSG:900913"
        let res = this.Resolution(zoom);
        let mx = px * res - this.originShift;
        let my = py * res - this.originShift;
        return { mx: mx, my: my };
    }

    MetersToPixels(mx: number, my: number, zoom: number) {
        //"Converts EPSG:900913 to pyramid pixel coordinates in given zoom level"
        let res = this.Resolution(zoom);
        let px = (mx + this.originShift) / res;
        let py = (my + this.originShift) / res;
        return { px: px, py: py };
    }

    PixelsToTile(px: number, py: number) {
        //"Returns a tile covering region in given pixel coordinates"
        let tx = Math.ceil(px / this.tileSize) - 1;
        let ty = Math.ceil(py / this.tileSize) - 1;
        return { tx: tx, ty: ty };
    }

    PixelsToRaster(px: number, py: number, zoom: number) {
        //"Move the origin of pixel coordinates to top-left corner"
        let mapSize = this.tileSize << zoom;
        return { px: px, py: mapSize - py };
    }

    MetersToTile(mx: number, my: number, zoom: number) {
        //"Returns tile for given mercator coordinates"
        let pt = this.MetersToPixels(mx, my, zoom);
        return this.PixelsToTile(pt.px, pt.py);
    }

    TileBounds(tx: number, ty: number, zoom: number) {
        //"Returns bounds of the given tile in EPSG:900913 coordinates"
        let pmin = this.PixelsToMeters(tx * this.tileSize, ty * this.tileSize, zoom);
        let pmax = this.PixelsToMeters((tx + 1) * this.tileSize, (ty + 1) * this.tileSize, zoom);
        return {
            min: pmin,
            max: pmax
        };
    }

    TileLatLonBounds(tx: number, ty: number, zoom: number) {
        //"Returns bounds of the given tile in latutude/longitude using WGS84 datum"
        let bounds = this.TileBounds(tx, ty, zoom);
        let minLL = this.MetersToLatLon(bounds.min.mx, bounds.min.my);
        let maxLL = this.MetersToLatLon(bounds.max.mx, bounds.max.my);
        return { min: minLL, max: maxLL };
    }

    Resolution(zoom: number) {
        //"Resolution (meters/pixel) for given zoom level (measured at Equator)"
        //# return (2 * Math.PI * 6378137) / (this.tileSize * 2* * zoom)
        return this.initialResolution / Math.pow(2, zoom);
    }

    ZoomForPixelSize(pixelSize: number) {
        //"Maximal scaledown zoom of the pyramid closest to the pixelSize."
        for (let i = 0; i < 30; i++) {
            if (pixelSize > this.Resolution(i))
                return i === 0 ? 0 : i - 1;
        }
        return 0;
    }

    GoogleTile(tx: number, ty: number, zoom: number) {
        //"Converts TMS tile coordinates to Google Tile coordinates"
        //# coordinate origin is moved from bottom - left to top - left corner of the extent
        return { tx: tx, ty: Math.pow(2, zoom - 1) - ty };
    }

    QuadTree(tx: number, ty: number, zoom: number) {
        //"Converts TMS tile coordinates to Microsoft QuadTree"
        let quadKey = '';
        for (let i = zoom; i > 0; i--) {
            let digit = 0;
            let mask = 1 << (i - 1);
            if ((tx & mask) !== 0) {
                digit++;
            }
            if ((ty & mask) !== 0) {
                digit++;
                digit++;
            }
            quadKey += digit.toString();
        }
        return quadKey;
        //#---------------------
    }

    QuadKeyToTileXY(quadKey: string) {


        let tileX = 0, tileY = 0;

        let levelOfDetail = quadKey.length;
        for (let i = levelOfDetail; i > 0; i--) {
            let mask = 1 << (i - 1);
            switch (quadKey[levelOfDetail - i]) {
                case '0':
                    continue;

                case '1':
                    tileX |= mask;
                    continue;

                case '2':
                    tileY |= mask;
                    continue;

                case '3':
                    tileX |= mask;
                    tileY |= mask;
                    continue;

                default:
                    throw 'Invalid QuadKey digit sequence.';
            }
        }
        let res = {
            zoom: levelOfDetail,
            tx: tileX,
            ty: tileY
        };

        return res;
    }

    static LatLngPerPixelAtPositionAndZoom(lat: number, lng: number, zoom: number, tileSize = 256): { latPerPx: number, lngPerPx: number } {

        const merc = new GlobalMercator(tileSize)

        var mm = merc.LatLonToMeters(lat, lng);

        var p = merc.MetersToPixels(mm.mx, mm.my,zoom);

        var scale = 1;

        var mmDash = merc.PixelsToMeters(p.px + scale, p.py + scale, zoom);

        var ll = merc.MetersToLatLon(mm.mx, mm.my);

        var lldash = merc.MetersToLatLon(mmDash.mx, mmDash.my);

        if (lldash.lng < lng)
            lldash.lng += 360;

        return { latPerPx: (lldash.lat - ll.lat) / scale, lngPerPx: (lldash.lng - ll.lng) / scale };

    }
}
