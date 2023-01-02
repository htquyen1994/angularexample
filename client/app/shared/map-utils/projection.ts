
export class Projection {

	private rad2deg = 57.29577951;
	private deg2rad = 0.017453292;

	// Constants for WGS84
	private WGS84SemiMajor = 6378137.0;
	private WGS84SemiMinor = 6356752.3141;
	private WGS84Eccentricity = ((this.WGS84SemiMajor * this.WGS84SemiMajor) - (this.WGS84SemiMinor * this.WGS84SemiMinor))
		/ (this.WGS84SemiMajor * this.WGS84SemiMajor);
	// 0.00669438037928458;

	// These are from the PO's Branch URL links Access database and will be used in the conversion
	private WGS84EastingOrigin = 400050;
	private WGS84NorthingOrigin = -100100;
	private WGS84ScaleFactor = 0.9996012717;

	// OSGB scale factor on central meridian
	private WGS84FalseEast = -2.0 * this.deg2rad;
	private WGS84FalseNorth = 49.0 * this.deg2rad;

	// Add these when going from BNG to WGS84. Subtract when going from WGS84 to BNG
	private LongCorrectionFactor = -0.000230971909553546;
	private LatCorrectionFactor = -0.000849371602672008;

	// Airy Spheroid constants for BNG
	private OSGBSemiMajor = 6377563.396;

	// OSGB Semi-major axis
	private OSGBSemiMinor = 6356256.91;

	// OSGB semi-minor axis
	private OSGBEastingOrigin = 400000;
	// OSGB easting of false origin
	private OSGBNorthingOrigin = -100000;
	// OSGB northing of false origin
	private OSGBScaleFactor = 0.9996012717;
	// OSGB scale factor on central meridian
	private OSGBEccentricity = 0.0066705397616;
	// OSGB eccentricity squared
	private OSGBFalseEast = -0.034906585039886591;
	// OSGB false east
	private OSGBFalseNorth = 0.85521133347722145;
	// OSGB false north

	// Modified Airy Speriod constants for ING
	private OSISemiMajor = 6377340.189;
	// OSI semi-major
	private OSISemiMinor = 6356034.447;
	// OSI semi-minor
	private OSIEastingOrigin = 200000;
	// OSI easting of false origin
	private OSINorthingOrigin = 250000;
	// OSI northing of false origin
	private OSIScaleFactor = 1.000035;
	// OSI scale factor on central meridian
	private OSIEccentricity = 0.00667054015;
	// OSI eccentricity squared
	private OSIFalseEast = -0.13962634015954636615389526147909;
	// OSI false east
	private OSIFalseNorth = 0.93375114981696632365417456114141;
	// OSI false north


	// Function to convert WGS84 coordinates into BNG
	ConvertWGS84toBNG(latitude: number, longitude: number) {
		let h = 10; // Dummy height
		let geoLL: any;
		let shiftWithTransform = true;
		let shiftWithOffset = false;

		// Apply the dataum shift (using 3 parameter Helmert transformation to match the ESRI projection parameters)
		geoLL = this.transform(Number(latitude) * this.deg2rad, Number(longitude) * this.deg2rad,
			this.WGS84SemiMajor, this.WGS84Eccentricity, h,
			this.OSGBSemiMajor, this.OSGBEccentricity,
			//-375.0, 111.0, -431.0, 0.0, 0.0, 0.0, 0.0);
			-446.448, 125.157, -542.060, -0.1502, -0.2470, -0.8421, 20.4894);

		// Convert to eastings/northings using the Airy Spheroid
		let geo = this.LLtoNE(geoLL.latitude, geoLL.longitude,
			this.OSGBSemiMajor, this.OSGBSemiMinor,
			this.OSGBEastingOrigin, this.OSGBNorthingOrigin,
			this.OSGBScaleFactor, this.OSGBEccentricity,
			this.OSGBFalseEast, this.OSGBFalseNorth);


		return geo;
	}

	// Function to convert WGS84 coordinates into ING
	ConvertWGS84toING(latitude: any, longitude: any) {
		let h = 10; // Dummy height
		// Apply the dataum shift (using 3 parameter Helmert transformation to match the ESRI projection parameters)
		let geoLL = this.transform(Number(latitude) * this.deg2rad, Number(longitude) * this.deg2rad,
			this.WGS84SemiMajor, this.WGS84Eccentricity, h,
			this.OSISemiMajor, this.OSIEccentricity,
			-506.0, 122.0, -611.0, 0.0, 0.0, 0.0, 0.0);

		// Convert to eastings/northings using the Modified Airy Spheroid
		let geo = this.LLtoNE(geoLL.latitude, geoLL.longitude,
			this.OSISemiMajor, this.OSISemiMinor,
			this.OSIEastingOrigin, this.OSINorthingOrigin,
			this.OSIScaleFactor, this.OSIEccentricity,
			this.OSIFalseEast, this.OSIFalseNorth);

		return geo;
	}

	// Function to convert BNG coordinates into WGS84
	ConvertBNGtoWGS84(easting: number, northing: number) {
		// Convert to lat/long using the Airy Spheroid
		let geoLL = this.NEtoLL(Number(easting), Number(northing),
			this.OSGBSemiMajor, this.OSGBSemiMinor,
			this.OSGBEastingOrigin, this.OSGBNorthingOrigin,
			this.OSGBScaleFactor, this.OSGBEccentricity,
			this.OSGBFalseEast, this.OSGBFalseNorth);
		let shiftWithTransform = true;
		let shiftWithOffset = false;

		let geo: any;
		let h = 10; // Dummy height


		// Apply the dataum shift (using 3 parameter Helmert transformation to match the ESRI projection parameters)
		geo = this.transform(geoLL.latitude, geoLL.longitude,
			this.OSGBSemiMajor, this.OSGBEccentricity, h,
			this.WGS84SemiMajor, this.WGS84Eccentricity,
			//375.0, -111.0, 431.0, 0.0, 0.0, 0.0, 0.0);
			446.448, -125.157, 542.06, 0.15, 0.247, 0.842, -20.489);

		// Covert from radians to degrees and return
		geoLL.latitude = geo.latitude * this.rad2deg;
		geoLL.longitude = geo.longitude * this.rad2deg;

		return geoLL;
	}

	// Function to convert ING coordinates into WGS84
	ConvertINGtoWGS84(easting: any, northing: any) {
		// Convert to lat/long using the Modified Airy Spheroid
		let geoLL = this.NEtoLL(Number(easting), Number(northing),
			this.OSISemiMajor, this.OSISemiMinor,
			this.OSIEastingOrigin, this.OSINorthingOrigin,
			this.OSIScaleFactor, this.OSIEccentricity,
			this.OSIFalseEast, this.OSIFalseNorth);

		let h = 10; // Dummy height

		// Apply the dataum shift (using 3 parameter Helmert transformation to match the ESRI projection parameters)
		let geo = this.transform(geoLL.latitude, geoLL.longitude,
			this.OSISemiMajor, this.OSIEccentricity, h,
			this.WGS84SemiMajor, this.WGS84Eccentricity,
			506.0, -122.0, 611.0, 0.0, 0.0, 0.0, 0.0);

		// Covert from radians to degrees and return
		geoLL.latitude = geo.latitude * this.rad2deg;
		geoLL.longitude = geo.longitude * this.rad2deg;
		return geoLL;
	}

	// Helper function to convert Northings and Eastings to Lat/Long
	// Input easting and northing are in metres
	// Output latitude and longitude are in radians
	NEtoLL(easting: any, northing: any, a: any, b: any, e0: any, n0: any, f0: any, e2: any, lam0: any, phi0: any) {
		let af0 = a * f0;
		let bf0 = b * f0;
		let n = (af0 - bf0) / (af0 + bf0);
		let Et = easting - e0;
		let phid = this.InitialLat(northing, n0, af0, phi0, n, bf0);
		let nu = af0 / (Math.sqrt(1 - (e2 * (Math.sin(phid) * Math.sin(phid)))));
		let rho = (nu * (1 - e2)) / (1 - (e2 * (Math.sin(phid)) * (Math.sin(phid))));
		let eta2 = (nu / rho) - 1;
		let tlat2 = Math.tan(phid) * Math.tan(phid);
		let tlat4 = Math.pow(Math.tan(phid), 4);
		let tlat6 = Math.pow(Math.tan(phid), 6);
		let clatm1 = Math.pow(Math.cos(phid), -1);
		let VII = Math.tan(phid) / (2 * rho * nu);
		let VIII = (Math.tan(phid) / (24 * rho * (nu * nu * nu))) * (5 + (3 * tlat2) + eta2 - (9 * eta2 * tlat2));
		let IX = ((Math.tan(phid)) / (720 * rho * Math.pow(nu, 5))) * (61 + (90 * tlat2) + (45 * Math.pow(Math.tan(phid), 4)));
		let phip = (phid - ((Et * Et) * VII) + (Math.pow(Et, 4) * VIII) - (Math.pow(Et, 6) * IX));
		let X = Math.pow(Math.cos(phid), -1) / nu;
		let XI = (clatm1 / (6 * (nu * nu * nu))) * ((nu / rho) + (2 * (tlat2)));
		let XII = (clatm1 / (120 * Math.pow(nu, 5))) * (5 + (28 * tlat2) + (24 * tlat4));
		let XIIA = clatm1 / (5040 * Math.pow(nu, 7)) * (61 + (662 * tlat2) + (1320 * tlat4) + (720 * tlat6));
		let lambdap = (lam0 + (Et * X) - ((Et * Et * Et) * XI) + (Math.pow(Et, 5) * XII) - (Math.pow(Et, 7) * XIIA));

		let geo = { latitude: phip, longitude: lambdap };
		return geo;
	}

	// Helper function to convert Lat/Longs to Northings and Eastings
	// Input latitude and longitude are in radians
	// Output easting and northing are in metres

	LLtoNE(lat: any, lon: any, a: any, b: any, e0: any, n0: any, f0: any, e2: any, lam0: any, phi0: any) {
		let phi = lat;
		let lam = lon;
		let af0 = a * f0;
		let bf0 = b * f0;

		// easting
		let slat2 = Math.sin(phi) * Math.sin(phi);
		let nu = af0 / (Math.sqrt(1 - (e2 * (slat2))));
		let rho = (nu * (1 - e2)) / (1 - (e2 * slat2));
		let eta2 = (nu / rho) - 1;
		let p = lam - lam0;
		let IV = nu * Math.cos(phi);
		let clat3 = Math.pow(Math.cos(phi), 3);
		let tlat2 = Math.tan(phi) * Math.tan(phi);
		let V = (nu / 6) * clat3 * ((nu / rho) - tlat2);
		let clat5 = Math.pow(Math.cos(phi), 5);
		let tlat4 = Math.pow(Math.tan(phi), 4);
		let VI = (nu / 120) * clat5 * ((5 - (18 * tlat2)) + tlat4 + (14 * eta2) - (58 * tlat2 * eta2));
		let east = e0 + (p * IV) + (Math.pow(p, 3) * V) + (Math.pow(p, 5) * VI);

		// northing
		let n = (af0 - bf0) / (af0 + bf0);
		let M = this.Marc(bf0, n, phi0, phi);
		let I = M + (n0);
		let II = (nu / 2) * Math.sin(phi) * Math.cos(phi);
		let III = ((nu / 24) * Math.sin(phi) * Math.pow(Math.cos(phi), 3)) * (5 - Math.pow(Math.tan(phi), 2) + (9 * eta2));
		let IIIA = ((nu / 720) * Math.sin(phi) * clat5) * (61 - (58 * tlat2) + tlat4);
		let north = I + ((p * p) * II) + (Math.pow(p, 4) * III) + (Math.pow(p, 6) * IIIA);

		let geo = { easting: Math.round(east), northing: Math.round(north) };
		return geo;
	}

	// Function to apply the datum transformation using 7 parameter Helmert transformation
	transform(lat: any, lon: any, a: any, e: any, h: any, a2: any, e2: any, xp: any, yp: any, zp: any, xr: any, yr: any, zr: any, s: any) {
		// Convert to cartesian; lat, lon are radians
		let sf = s * 0.000001;
		let v = a / (Math.sqrt(1 - (e * (Math.sin(lat) * Math.sin(lat)))));
		let x = (v + h) * Math.cos(lat) * Math.cos(lon);
		let y = (v + h) * Math.cos(lat) * Math.sin(lon);
		let z = ((1 - e) * v + h) * Math.sin(lat);

		// Transform cartesian
		let xrot = (xr / 3600) * this.deg2rad;
		let yrot = (yr / 3600) * this.deg2rad;
		let zrot = (zr / 3600) * this.deg2rad;
		let hx = x + (x * sf) - (y * zrot) + (z * yrot) + xp;
		let hy = (x * zrot) + y + (y * sf) - (z * xrot) + yp;
		let hz = (-1 * x * yrot) + (y * xrot) + z + (z * sf) + zp;

		// Convert back to lat, lon
		lon = Math.atan(hy / hx);
		let p = Math.sqrt((hx * hx) + (hy * hy));
		lat = Math.atan(hz / (p * (1 - e2)));
		v = a2 / (Math.sqrt(1 - e2 * (Math.sin(lat) * Math.sin(lat))));
		let errvalue = 1.0;
		let lat0 = 0;
		while (errvalue > 0.001) {
			lat0 = Math.atan((hz + e2 * v * Math.sin(lat)) / p);
			errvalue = Math.abs(lat0 - lat);
			lat = lat0;
		}
		h = p / Math.cos(lat) - v;
		let geo = { latitude: lat, longitude: lon, height: h }; // object to hold lat and lon
		return geo;
	}

	// Helper function to compute the initial value for latitide
	InitialLat(north: any, n0: any, af0: any, phi0: any, n: any, bf0: any) {
		let phi1 = ((north - n0) / af0) + phi0;
		let M = this.Marc(bf0, n, phi0, phi1);
		let phi2 = ((north - n0 - M) / af0) + phi1;
		let ind = 0;
		while ((Math.abs(north - n0 - M) > 0.00001) && (ind < 20)) {
			ind = ind + 1;
			phi2 = ((north - n0 - M) / af0) + phi1;
			M = this.Marc(bf0, n, phi0, phi2);
			phi1 = phi2;
		}

		return phi2;
	}

	// Helper function to compute the meridional arc
	Marc(bf0: any, n: any, phi0: any, phi: any) {
		return bf0 * (((1 + n + ((5 / 4) * (n * n)) + ((5 / 4) * (n * n * n))) * (phi - phi0)) -
			(((3 * n) + (3 * (n * n)) + ((21 / 8) * (n * n * n))) * (Math.sin(phi - phi0)) * (Math.cos(phi + phi0))) +
			((((15 / 8) * (n * n)) + ((15 / 8) * (n * n * n))) * (Math.sin(2 * (phi - phi0))) * (Math.cos(2 * (phi + phi0)))) -
			(((35 / 24) * (n * n * n)) * (Math.sin(3 * (phi - phi0))) * (Math.cos(3 * (phi + phi0)))));
	}
}
