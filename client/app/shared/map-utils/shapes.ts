import { GlobalMercator } from './mercator';
import { Object } from 'core-js';
import { createSimpleError } from '../http.util';
import { IBoundingBox } from '../../iface/IBoundingBox';

export interface IFeature<T extends IGeometry> {
  properties?: any;
  geometry: T;
  PeriscopeId?: any;
  shapeId?: any;
  centroid?: any;
  type?: any
}

export interface IFeatureCollection {
	features: IFeature<IGeometry>[];
}

export interface GeoJsonFeature<T extends IGeometry> extends IFeature<T> {
	type: string;
	properties: GeoJsonFeatureProperties;
}

export interface GeoJsonFeatureProperties {
	id: any;
}

export interface ICoordinateArray {
	length: number;
	[n: number]: number;
}

export interface ICoordinate {
	x(): number;
	y(): number;
	isValid(): boolean;
}

export interface ILineStringCoords extends Array<ICoordinateArray> {

}

export interface ILinearRing extends ILineStringCoords {

}

//first linear ring is outer shell, others are holes
export interface IPolygonShell extends Array<ILinearRing> {
}

export interface IGeometry {
	type: string;
	coordinates: ICoordinate | ICoordinateArray | ICoordinateArray[] | ICoordinateArray[][] | ILinearRing | ILinearRing[] | IPolygonShell[];
}

export interface IGeometryMethods {
	getBBox(): IRectangle;
}

export interface IPoint extends IGeometry {
	coordinates: ICoordinateArray;
}

export interface IMultiPoint extends IGeometry {
	coordinates: ICoordinateArray[];
}

export interface ILineString extends IGeometry {
	coordinates: ICoordinateArray[];
}

export interface IMultiLineString extends IGeometry {
	coordinates: ICoordinateArray[][];
}

export interface IPolygon extends IGeometry {
	coordinates: IPolygonShell;
}

export interface IMultiPolygon extends IGeometry {
	coordinates: IPolygonShell[];
}

export interface IGeometryCollection {
	type: string;
	geometries: IGeometry[];
}

export interface IPointMethods extends IGeometryMethods, IPoint {

}

export interface ILineStringMethods extends IGeometryMethods, ILineString {

}

export interface IPolygonMethods extends IGeometryMethods, IPolygon {

}

export interface IRectangularGeometryMethods extends IGeometryMethods, IRectangularGeometry {

}

export interface IMultiPointMethods extends IGeometryMethods, IMultiPoint {

}

export interface IMultiPolygonMethods extends IGeometryMethods, IMultiPolygon {

}

export interface IMultiLineStringMethods extends IGeometryMethods, IMultiLineString {

}

export interface IGeometryCollectionMethods extends IGeometryMethods, IGeometryCollection {

}

export interface ICircularGeometryMethods extends IGeometryMethods, ICircularGeometry {

}

///this is not defined in the GeoJson Specs
export interface ICircularGeometry extends IPoint {
	radius: number;
}

///this is not defined in the GeoJson Specs
export interface IRectangularGeometry extends IPolygon {
	rect: IRectangle;
}

///this is not defined in the GeoJson Specs
export interface IRectangle {
	min: ICoordinate;
	max: ICoordinate;
}


export function isValidCoordinate(coordinate: ICoordinateArray) {
	return coordinate.length === 2;
}

export function createGoogleLatLng(geom: any): google.maps.LatLng {
	if ((typeof geom) == "string") {
		let regex = /\(([^()]+)\)/g;
		let results = regex.exec(geom);
		let xy = results[1].split(' ');
		return new google.maps.LatLng(parseFloat(xy[1]), parseFloat(xy[0]));
	} else {
		let pt = <IPoint>geom;
		return new google.maps.LatLng(pt.coordinates[1], pt.coordinates[0]);
	}
}

export function reducePrecision(point: google.maps.LatLng, zoom: number) {

	let mercator = new GlobalMercator();
	let metresPerPx = mercator.PixelsToMeters(1, 1, zoom);
	let metresPerPx2 = mercator.PixelsToMeters(2, 2, zoom);

	let latLonPerMetre2 = mercator.MetersToLatLon(metresPerPx2.mx, metresPerPx2.my);
	let latLonPerMetre1 = mercator.MetersToLatLon(metresPerPx.mx, metresPerPx.my);

	let dllx = latLonPerMetre2.lng - latLonPerMetre1.lng;
	let dlly = latLonPerMetre2.lat - latLonPerMetre1.lat;

	let sx = dllx.toExponential();
	let dpx = Math.abs(parseInt(sx.substring(sx.indexOf('e') + 1)));
	let sy = dlly.toExponential();
	let dpy = Math.abs(parseInt(sy.substring(sy.indexOf('e') + 1)));

	let lat = round(point.lat(), dpy);
	let lng = round(point.lng(), dpx);

	//Use latlng -object literal
	return { lat: lat, lng: lng };
	// return new google.maps.LatLng(lat, lng);
}

export function round(number: number, fractionSize: number) {
	return +(Math.round(+(number.toString() + 'e' + fractionSize)).toString() + 'e' + -fractionSize);
}

export function createCoordinate(x: number, y: number): Coord;
export function createCoordinate(coord: ICoordinateArray): Coord;
export function createCoordinate(coord: ICoordinate): Coord;
export function createCoordinate(a: any, b?: number): Coord {
	if (a instanceof Coord)
		return a;
	if ((b)) {
		return new Coord([<number>a, b]);
	}
	if (a instanceof Array)
		return new Coord(a);
	if ((a.x) && (a.y)) {
		return new Coord(a.x(), a.y());
	}


	throw createSimpleError('not implemented');
}

export function createRectangularPolygon(min: ICoordinate, max: ICoordinate): IRectangularGeometryMethods {
	let m = createCoordinate(min);
	let ma = createCoordinate(max);
	let p = createPolygonVarArgs(createLinearRingVarArgs(m, createCoordinate(m.x(), ma.y()), ma, createCoordinate(ma.x(), m.y()), m));
	//p.rect = {
	//    min: m,
	//    max: ma
	//};

	(<IRectangularGeometryMethods>p).rect = p.getBBox();

	return <IRectangularGeometryMethods>p;
}

export function createLinearRingVarArgs(...coords: ICoordinateArray[]): ILinearRing {
	return createLinearRing(coords);
}

export function createLinearRing(coords: ICoordinateArray[]): ILinearRing {
	return <ILineStringCoords>coords.map((a) => createCoordinate(a));
}

export function createPolygonVarArgs(...rings: ILinearRing[]): IPolygonMethods {
	return createPolygon(rings);
}

export function createPolygon(rings: ILinearRing[]): IPolygonMethods {
	return extendGeometry<IPolygon, IPolygonMethods>({
		type: 'Polygon',
		coordinates: rings
	});
}

export function createMultiPolygon(shells: IPolygonShell[]): IMultiPolygonMethods {
	return extendGeometry<IMultiPolygon, IMultiPolygonMethods>({
		type: 'MultiPolygon',
		coordinates: <IPolygonShell[]>shells
	});
}

export function createMultiPolygonVarArgs(...shells: IPolygonShell[]): IMultiPolygonMethods {
	return createMultiPolygon(shells);
}

export function createPoint(coord: ICoordinateArray): IPointMethods {
	return extendGeometry<IPoint, IPointMethods>({
		type: 'Point',
		coordinates: createCoordinate(coord)
	});
}

export function createMultiPoint(coords: ICoordinateArray[]): IMultiPointMethods {
	return extendGeometry<IMultiPoint, IMultiPointMethods>({
		type: 'MultiPoint',
		coordinates: coords
	});
}

export function createMultiPointVarArgs(coords: ICoordinateArray[]): IMultiPointMethods {
	return createMultiPoint(coords);
}

export function createLineString(coords: ICoordinateArray[]): ILineStringMethods {
	return extendGeometry<ILineString, ILineStringMethods>({
		type: 'LineString',
		coordinates: coords
	});
}

export function createLineStringVarArgs(...coords: ICoordinateArray[]): ILineStringMethods {
	return createLineString(coords);
}

export function createMultiLineString(coords: ICoordinateArray[][]): IMultiLineStringMethods {
	return extendGeometry<IMultiLineString, IMultiLineStringMethods>({
		type: 'MultiLineString',
		coordinates: coords
	});
}

export function createMultiLineStringVarArgs(...coordArrays: ICoordinateArray[][]): IMultiLineStringMethods {
	return createMultiLineString(coordArrays);
}

export function createGeometryCollection(geoms: IGeometry[]): IGeometryCollectionMethods {
	return extendGeometry<IGeometryCollection, IGeometryCollectionMethods>({
		type: 'GeometryCollection',
		geometries: geoms
	});
}

export function createGeometryCollectionVarArgs(...geoms: IGeometry[]): IGeometryCollectionMethods {
	return createGeometryCollection(geoms);
}

export function createFeature(geom: IGeometry, props: any) {
	return {
		properties: props,
		geometry: geom
	};
}

export function createFeatureCollection(features: IFeature<IGeometry>[]): IFeatureCollection {
	return {
		features: features
	};
}

export function createFeatureCollectionVarArgs(...features: IFeature<IGeometry>[]): IFeatureCollection {
	return createFeatureCollection(features);
}


export function createCircle(coord: ICoordinateArray, radius: number): ICircularGeometryMethods {
	let a = <ICircularGeometryMethods>createPoint(coord);
	a.type = 'Custom.Circle';
	a.radius = radius;
	return a;
}


export function getGoogleBounds(geom: IGeometry): google.maps.LatLngBounds {
	let ext: IRectangle;
	ext = computeBBox(geom);
	return new google.maps.LatLngBounds(
		new google.maps.LatLng(ext.min.y(), ext.min.x()),
		new google.maps.LatLng(ext.max.y(), ext.max.x())
	);
}


export function computeBBox(geom: IGeometry): IRectangle {


	let allCoords = getFlattenedCoords(geom);
	//this is very verbose but I was getting incorrect results previously
	let xs = allCoords.map((a) => a[0]);
	let ys = allCoords.map((a) => a[1]);

	let minX = xs[0];
	let maxX = xs[0];
	let minY = ys[0];
	let maxY = ys[0];

	for (let i = 1; i < xs.length; i++) {
		minX = Math.min(xs[i], minX);
		maxX = Math.max(xs[i], maxX);
		minY = Math.min(ys[i], minY);
		maxY = Math.max(ys[i], maxY);
	}


	return {
		min: createCoordinate(minX, minY),
		max: createCoordinate(maxX, maxY)
	};
}

export function getFlattenedCoords(geom: IGeometry): ICoordinateArray[] {

	if (geom.type === 'GeometryCollection') {
		//TODO add replace lodash
		//return _.flatten((<IGeometryCollection>geom).geometries.map((a) => getFlattenedCoords(a)), true);
	}

	if (geom.type === 'Point') {
		return [(<IPoint>geom).coordinates];
	}
	if (geom.type === 'MultiPoint') {
		let mup = <IMultiPoint>geom;
		return mup.coordinates;
	}
	if (geom.type === 'Polygon') {
		let poly = <IPolygon>geom;
		return poly.coordinates[0]; //outer shell (first linear ring) only
	}

	if (geom.type === 'MultiPolygon') {
		//TODO add replace lodash
		//let mp = <IMultiPolygon>geom;
		//return _.flatten(mp.coordinates.map((a:IPolygonShell) => a[0]), true); //outer shell (first linear ring) of each poly only

	}

	if (geom.type === 'LineString') {
		let ls = <ILineString>geom;
		return ls.coordinates;
	}

	if (geom.type === 'MultiLineString') {
		let mls = <IMultiLineString>geom;
		//TODO add replace lodash
		//return _.flatten(mls.coordinates, true);
	}

	throw 'not implemented';
}

let _geometryBase = {
	getBBox() {
		return computeBBox(this);
	}
};

export function extendGeometry<T extends IGeometry | IGeometryCollection, U extends IGeometryMethods>(geom: T): U {
	return <U>replaceProtoOrExtend(geom, _geometryBase);
}

//http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/
export class Coord extends Array<any> implements ICoordinate, ICoordinateArray {
	x(): number {
		return this[0];
	}
	y(): number {
		return this[1];
	}
	last(): number {
		return this[this.length - 1];
	}
	isValid(): boolean {
		return this.length === 2;
	}
	length: number;

	[n: number]: number;

	constructor(coords: number[]);
	constructor(x: number, y?: number);
	constructor(a: any, b?: number) {
		super();
		let arr: any = [];
		if (a instanceof Array) {
			arr.push.apply(arr, a);
		} else if (b) {
			arr.push.apply(arr, arguments);
		}

		replaceProtoOrExtend<Coord>(arr, this['__proto__']);

		if (!(<Coord>arr).isValid())
			throw createSimpleError('invalid array length for coordinate');

		return <Coord>arr; //beware: this constructor returns a different object to the one you expect.
	}

}

function replaceProtoOrExtend<T>(who: any, what: T): T {
	if ((who.__proto__)) { //decent browser
		who.__proto__ = what;
	} else { //IE
		who.prototype = what;
		//TODO add replace lodash
		//_.extend(who, what);
	}
	return who;
}

export function getBoundingBox(bounds): IBoundingBox {
	bounds = convertGmapBoundsToRect(bounds);
	const rect = (<IRectangularGeometry>bounds).rect;
	return {
		Max: { Lat: rect.max.y(), Lng: rect.max.x() },
		Min: { Lat: rect.min.y(), Lng: rect.min.x() }
	};
}

export function getTiles(bounds: any, zoom: number) {

	bounds = convertGmapBoundsToRect(bounds);

	let mercator = new GlobalMercator();

	let rects: any[] = [];

	if ((bounds.geometries)) {
		let collection = <IGeometryCollection>bounds;
		for (let m = 0; m < collection.geometries.length; m++) {
			rects.push((<IRectangularGeometry>collection.geometries[m]).rect);
		}
	} else {
		rects.push((<IRectangularGeometry>bounds).rect);
	}

	let tiles: any[] = [];

	for (let x = 0; x < rects.length; x++) {
		let minM = mercator.LatLonToMeters(rects[x].min.y(), rects[x].min.x());
		let minTile = mercator.MetersToTile(minM.mx, minM.my, zoom);

		let maxM = mercator.LatLonToMeters(rects[x].max.y(), rects[x].max.x());
		let maxTile = mercator.MetersToTile(maxM.mx, maxM.my, zoom);

		for (let i = minTile.tx - 1; i < maxTile.tx + 2; i++) {
			for (let j = minTile.ty - 1; j < maxTile.ty + 2; j++) {

				let qk = mercator.QuadTree(i, j, zoom);
				tiles.push(qk);
			}
		}
	}

	return tiles.reduce(function (p, c) {
		if (p.indexOf(c) < 0) {
			p.push(c);
		}
		return p;
	}, []);
}

export function convertGmapBoundsToRect(gbounds: google.maps.LatLngBounds): IGeometry | IGeometryCollection {
	if (gbounds === null) {
		return null;
	}

	let sw = gbounds.getSouthWest();
	let ne = gbounds.getNorthEast();

	let lng1 = sw.lng();
	let lng2 = ne.lng();

	if (lng1 < lng2) {
		let min = createCoordinate(sw.lng(), sw.lat());
		let max = createCoordinate(ne.lng(), ne.lat());

		return createRectangularPolygon(min, max);
	} else {
		//we cross the date line need to split into a 2 rectangle multipolygon
		let min1 = createCoordinate(lng1, sw.lat());
		let max1 = createCoordinate(179.999999999999999, ne.lat());

		let min2 = createCoordinate(-179.999999999999999, sw.lat());
		let max2 = createCoordinate(lng2, ne.lat());

		let p1 = createRectangularPolygon(min1, max1);
		let p2 = createRectangularPolygon(min2, max2);

		return createGeometryCollectionVarArgs(p1, p2);
	}
}

export function getQuadKey(latLng: google.maps.LatLng, zoom: number) {
	let mercator = new GlobalMercator();
	let maxM = mercator.LatLonToMeters(latLng.lat(), latLng.lng());
	let tile = mercator.MetersToTile(maxM.mx, maxM.my, zoom);
	let qk = mercator.QuadTree(tile.tx, tile.ty, zoom);
	return `${zoom}:${qk}`;
}
