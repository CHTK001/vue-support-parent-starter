//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/proj/Units.js
/**
* @typedef {Object} MetersPerUnitLookup
* @property {number} radians Radians
* @property {number} degrees Degrees
* @property {number} ft  Feet
* @property {number} m Meters
* @property {number} us-ft US feet
*/
/**
* Meters per unit lookup table.
* @const
* @type {MetersPerUnitLookup}
* @api
*/
var METERS_PER_UNIT$1 = {
	"radians": 6370997 / (2 * Math.PI),
	"degrees": 2 * Math.PI * 6370997 / 360,
	"ft": .3048,
	"m": 1,
	"us-ft": 1200 / 3937
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/proj/Projection.js
/**
* @module ol/proj/Projection
*/
/**
* @typedef {Object} Options
* @property {string} code The SRS identifier code, e.g. `EPSG:4326`.
* @property {import("./Units.js").Units} [units] Units. Required unless a
* proj4 projection is defined for `code`.
* @property {import("../extent.js").Extent} [extent] The validity extent for the SRS.
* @property {string} [axisOrientation='enu'] The axis orientation as specified in Proj4.
* @property {boolean} [global=false] Whether the projection is valid for the whole globe.
* @property {number} [metersPerUnit] The meters per unit for the SRS.
* If not provided, the `units` are used to get the meters per unit from the {@link METERS_PER_UNIT}
* lookup table.
* @property {import("../extent.js").Extent} [worldExtent] The world extent for the SRS.
* @property {function(number, import("../coordinate.js").Coordinate):number} [getPointResolution]
* Function to determine resolution at a point. The function is called with a
* `number` view resolution and a {@link module:ol/coordinate~Coordinate} as arguments, and returns
* the `number` resolution in projection units at the passed coordinate. If this is `undefined`,
* the default {@link module:ol/proj.getPointResolution} function will be used.
*/
/**
* @classdesc
* Projection definition class. One of these is created for each projection
* supported in the application and stored in the {@link module:ol/proj} namespace.
* You can use these in applications, but this is not required, as API params
* and options use {@link module:ol/proj~ProjectionLike} which means the simple string
* code will suffice.
*
* You can use {@link module:ol/proj.get} to retrieve the object for a particular
* projection.
*
* The library includes definitions for `EPSG:4326` and `EPSG:3857`, together
* with the following aliases:
* * `EPSG:4326`: CRS:84, urn:ogc:def:crs:EPSG:6.6:4326,
*     urn:ogc:def:crs:OGC:1.3:CRS84, urn:ogc:def:crs:OGC:2:84,
*     http://www.opengis.net/gml/srs/epsg.xml#4326,
*     urn:x-ogc:def:crs:EPSG:4326
* * `EPSG:3857`: EPSG:102100, EPSG:102113, EPSG:900913,
*     urn:ogc:def:crs:EPSG:6.18:3:3857,
*     http://www.opengis.net/gml/srs/epsg.xml#3857
*
* If you use [proj4js](https://github.com/proj4js/proj4js), aliases can
* be added using `proj4.defs()`. After all required projection definitions are
* added, call the {@link module:ol/proj/proj4.register} function.
*
* @api
*/
var Projection = class {
	/**
	* @param {Options} options Projection options.
	*/
	constructor(options) {
		/**
		* @private
		* @type {string}
		*/
		this.code_ = options.code;
		/**
		* Units of projected coordinates. When set to `TILE_PIXELS`, a
		* `this.extent_` and `this.worldExtent_` must be configured properly for each
		* tile.
		* @private
		* @type {import("./Units.js").Units}
		*/
		this.units_ = options.units;
		/**
		* Validity extent of the projection in projected coordinates. For projections
		* with `TILE_PIXELS` units, this is the extent of the tile in
		* tile pixel space.
		* @private
		* @type {import("../extent.js").Extent}
		*/
		this.extent_ = options.extent !== void 0 ? options.extent : null;
		/**
		* Extent of the world in EPSG:4326. For projections with
		* `TILE_PIXELS` units, this is the extent of the tile in
		* projected coordinate space.
		* @private
		* @type {import("../extent.js").Extent}
		*/
		this.worldExtent_ = options.worldExtent !== void 0 ? options.worldExtent : null;
		/**
		* @private
		* @type {string}
		*/
		this.axisOrientation_ = options.axisOrientation !== void 0 ? options.axisOrientation : "enu";
		/**
		* @private
		* @type {boolean}
		*/
		this.global_ = options.global !== void 0 ? options.global : false;
		/**
		* @private
		* @type {boolean}
		*/
		this.canWrapX_ = !!(this.global_ && this.extent_);
		/**
		* @private
		* @type {function(number, import("../coordinate.js").Coordinate):number|undefined}
		*/
		this.getPointResolutionFunc_ = options.getPointResolution;
		/**
		* @private
		* @type {import("../tilegrid/TileGrid.js").default}
		*/
		this.defaultTileGrid_ = null;
		/**
		* @private
		* @type {number|undefined}
		*/
		this.metersPerUnit_ = options.metersPerUnit;
	}
	/**
	* @return {boolean} The projection is suitable for wrapping the x-axis
	*/
	canWrapX() {
		return this.canWrapX_;
	}
	/**
	* Get the code for this projection, e.g. 'EPSG:4326'.
	* @return {string} Code.
	* @api
	*/
	getCode() {
		return this.code_;
	}
	/**
	* Get the validity extent for this projection.
	* @return {import("../extent.js").Extent} Extent.
	* @api
	*/
	getExtent() {
		return this.extent_;
	}
	/**
	* Get the units of this projection.
	* @return {import("./Units.js").Units} Units.
	* @api
	*/
	getUnits() {
		return this.units_;
	}
	/**
	* Get the amount of meters per unit of this projection.  If the projection is
	* not configured with `metersPerUnit` or a units identifier, the return is
	* `undefined`.
	* @return {number|undefined} Meters.
	* @api
	*/
	getMetersPerUnit() {
		return this.metersPerUnit_ || METERS_PER_UNIT$1[this.units_];
	}
	/**
	* Get the world extent for this projection.
	* @return {import("../extent.js").Extent} Extent.
	* @api
	*/
	getWorldExtent() {
		return this.worldExtent_;
	}
	/**
	* Get the axis orientation of this projection.
	* Example values are:
	* enu - the default easting, northing, elevation.
	* neu - northing, easting, up - useful for "lat/long" geographic coordinates,
	*     or south orientated transverse mercator.
	* wnu - westing, northing, up - some planetary coordinate systems have
	*     "west positive" coordinate systems
	* @return {string} Axis orientation.
	* @api
	*/
	getAxisOrientation() {
		return this.axisOrientation_;
	}
	/**
	* Is this projection a global projection which spans the whole world?
	* @return {boolean} Whether the projection is global.
	* @api
	*/
	isGlobal() {
		return this.global_;
	}
	/**
	* Set if the projection is a global projection which spans the whole world
	* @param {boolean} global Whether the projection is global.
	* @api
	*/
	setGlobal(global) {
		this.global_ = global;
		this.canWrapX_ = !!(global && this.extent_);
	}
	/**
	* @return {import("../tilegrid/TileGrid.js").default} The default tile grid.
	*/
	getDefaultTileGrid() {
		return this.defaultTileGrid_;
	}
	/**
	* @param {import("../tilegrid/TileGrid.js").default} tileGrid The default tile grid.
	*/
	setDefaultTileGrid(tileGrid) {
		this.defaultTileGrid_ = tileGrid;
	}
	/**
	* Set the validity extent for this projection.
	* @param {import("../extent.js").Extent} extent Extent.
	* @api
	*/
	setExtent(extent) {
		this.extent_ = extent;
		this.canWrapX_ = !!(this.global_ && extent);
	}
	/**
	* Set the world extent for this projection.
	* @param {import("../extent.js").Extent} worldExtent World extent
	*     [minlon, minlat, maxlon, maxlat].
	* @api
	*/
	setWorldExtent(worldExtent) {
		this.worldExtent_ = worldExtent;
	}
	/**
	* Set the getPointResolution function (see {@link module:ol/proj.getPointResolution}
	* for this projection.
	* @param {function(number, import("../coordinate.js").Coordinate):number} func Function
	* @api
	*/
	setGetPointResolution(func) {
		this.getPointResolutionFunc_ = func;
	}
	/**
	* Get the custom point resolution function for this projection (if set).
	* @return {function(number, import("../coordinate.js").Coordinate):number|undefined} The custom point
	* resolution function (if set).
	*/
	getPointResolutionFunc() {
		return this.getPointResolutionFunc_;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/proj/epsg3857.js
/**
* @module ol/proj/epsg3857
*/
/**
* Radius of WGS84 sphere
*
* @const
* @type {number}
*/
var RADIUS$1 = 6378137;
/**
* @const
* @type {number}
*/
var HALF_SIZE = Math.PI * RADIUS$1;
/**
* @const
* @type {import("../extent.js").Extent}
*/
var EXTENT$1 = [
	-HALF_SIZE,
	-HALF_SIZE,
	HALF_SIZE,
	HALF_SIZE
];
/**
* @const
* @type {import("../extent.js").Extent}
*/
var WORLD_EXTENT = [
	-180,
	-85,
	180,
	85
];
/**
* Maximum safe value in y direction
* @const
* @type {number}
*/
var MAX_SAFE_Y = RADIUS$1 * Math.log(Math.tan(Math.PI / 2));
/**
* @classdesc
* Projection object for web/spherical Mercator (EPSG:3857).
*/
var EPSG3857Projection = class extends Projection {
	/**
	* @param {string} code Code.
	*/
	constructor(code) {
		super({
			code,
			units: "m",
			extent: EXTENT$1,
			global: true,
			worldExtent: WORLD_EXTENT,
			getPointResolution: function(resolution, point) {
				return resolution / Math.cosh(point[1] / RADIUS$1);
			}
		});
	}
};
/**
* Projections equal to EPSG:3857.
*
* @const
* @type {Array<import("./Projection.js").default>}
*/
var PROJECTIONS$1 = [
	new EPSG3857Projection("EPSG:3857"),
	new EPSG3857Projection("EPSG:102100"),
	new EPSG3857Projection("EPSG:102113"),
	new EPSG3857Projection("EPSG:900913"),
	new EPSG3857Projection("http://www.opengis.net/def/crs/EPSG/0/3857"),
	new EPSG3857Projection("http://www.opengis.net/gml/srs/epsg.xml#3857")
];
/**
* Transformation from EPSG:4326 to EPSG:3857.
*
* @param {Array<number>} input Input array of coordinate values.
* @param {Array<number>} [output] Output array of coordinate values.
* @param {number} [dimension] Dimension (default is `2`).
* @return {Array<number>} Output array of coordinate values.
*/
function fromEPSG4326(input, output, dimension) {
	const length = input.length;
	dimension = dimension > 1 ? dimension : 2;
	if (output === void 0) if (dimension > 2) output = input.slice();
	else output = new Array(length);
	for (let i = 0; i < length; i += dimension) {
		output[i] = HALF_SIZE * input[i] / 180;
		let y = RADIUS$1 * Math.log(Math.tan(Math.PI * (+input[i + 1] + 90) / 360));
		if (y > MAX_SAFE_Y) y = MAX_SAFE_Y;
		else if (y < -MAX_SAFE_Y) y = -MAX_SAFE_Y;
		output[i + 1] = y;
	}
	return output;
}
/**
* Transformation from EPSG:3857 to EPSG:4326.
*
* @param {Array<number>} input Input array of coordinate values.
* @param {Array<number>} [output] Output array of coordinate values.
* @param {number} [dimension] Dimension (default is `2`).
* @return {Array<number>} Output array of coordinate values.
*/
function toEPSG4326(input, output, dimension) {
	const length = input.length;
	dimension = dimension > 1 ? dimension : 2;
	if (output === void 0) if (dimension > 2) output = input.slice();
	else output = new Array(length);
	for (let i = 0; i < length; i += dimension) {
		output[i] = 180 * input[i] / HALF_SIZE;
		output[i + 1] = 360 * Math.atan(Math.exp(input[i + 1] / RADIUS$1)) / Math.PI - 90;
	}
	return output;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/proj/epsg4326.js
/**
* @module ol/proj/epsg4326
*/
/**
* Semi-major radius of the WGS84 ellipsoid.
*
* @const
* @type {number}
*/
var RADIUS = 6378137;
/**
* Extent of the EPSG:4326 projection which is the whole world.
*
* @const
* @type {import("../extent.js").Extent}
*/
var EXTENT = [
	-180,
	-90,
	180,
	90
];
/**
* @const
* @type {number}
*/
var METERS_PER_UNIT = Math.PI * RADIUS / 180;
/**
* @classdesc
* Projection object for WGS84 geographic coordinates (EPSG:4326).
*
* Note that OpenLayers does not strictly comply with the EPSG definition.
* The EPSG registry defines 4326 as a CRS for Latitude,Longitude (y,x).
* OpenLayers treats EPSG:4326 as a pseudo-projection, with x,y coordinates.
*/
var EPSG4326Projection = class extends Projection {
	/**
	* @param {string} code Code.
	* @param {string} [axisOrientation] Axis orientation.
	*/
	constructor(code, axisOrientation) {
		super({
			code,
			units: "degrees",
			extent: EXTENT,
			axisOrientation,
			global: true,
			metersPerUnit: METERS_PER_UNIT,
			worldExtent: EXTENT
		});
	}
};
/**
* Projections equal to EPSG:4326.
*
* @const
* @type {Array<import("./Projection.js").default>}
*/
var PROJECTIONS = [
	new EPSG4326Projection("CRS:84"),
	new EPSG4326Projection("EPSG:4326", "neu"),
	new EPSG4326Projection("urn:ogc:def:crs:OGC:1.3:CRS84"),
	new EPSG4326Projection("urn:ogc:def:crs:OGC:2:84"),
	new EPSG4326Projection("http://www.opengis.net/def/crs/OGC/1.3/CRS84"),
	new EPSG4326Projection("http://www.opengis.net/gml/srs/epsg.xml#4326", "neu"),
	new EPSG4326Projection("http://www.opengis.net/def/crs/EPSG/0/4326", "neu")
];
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/proj/projections.js
/**
* @module ol/proj/projections
*/
/**
* @type {Object<string, import("./Projection.js").default>}
*/
var cache = {};
/**
* Get a cached projection by code.
* @param {string} code The code for the projection.
* @return {import("./Projection.js").default} The projection (if cached).
*/
function get$2(code) {
	return cache[code] || cache[code.replace(/urn:(x-)?ogc:def:crs:EPSG:(.*:)?(\w+)$/, "EPSG:$3")] || null;
}
/**
* Add a projection to the cache.
* @param {string} code The projection code.
* @param {import("./Projection.js").default} projection The projection to cache.
*/
function add$2(code, projection) {
	cache[code] = projection;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/obj.js
/**
* @module ol/obj
*/
/**
* Removes all properties from an object.
* @param {Object<string, unknown>} object The object to clear.
*/
function clear(object) {
	for (const property in object) delete object[property];
}
/**
* Determine if an object has any properties.
* @param {Object} object The object to check.
* @return {boolean} The object is empty.
*/
function isEmpty$1(object) {
	let property;
	for (property in object) return false;
	return !property;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/proj/transforms.js
/**
* @private
* @type {!Object<string, Object<string, import("../proj.js").TransformFunction>>}
*/
var transforms = {};
/**
* Registers a conversion function to convert coordinates from the source
* projection to the destination projection.
*
* @param {import("./Projection.js").default} source Source.
* @param {import("./Projection.js").default} destination Destination.
* @param {import("../proj.js").TransformFunction} transformFn Transform.
*/
function add$1(source, destination, transformFn) {
	const sourceCode = source.getCode();
	const destinationCode = destination.getCode();
	if (!(sourceCode in transforms)) transforms[sourceCode] = {};
	transforms[sourceCode][destinationCode] = transformFn;
}
/**
* Get a transform given a source code and a destination code.
* @param {string} sourceCode The code for the source projection.
* @param {string} destinationCode The code for the destination projection.
* @return {import("../proj.js").TransformFunction|undefined} The transform function (if found).
*/
function get$1(sourceCode, destinationCode) {
	let transform;
	if (sourceCode in transforms && destinationCode in transforms[sourceCode]) transform = transforms[sourceCode][destinationCode];
	return transform;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/extent/Relationship.js
/**
* @module ol/extent/Relationship
*/
/**
* Relationship to an extent.
* @enum {number}
*/
var Relationship_default = {
	UNKNOWN: 0,
	INTERSECTING: 1,
	ABOVE: 2,
	RIGHT: 4,
	BELOW: 8,
	LEFT: 16
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/extent.js
/**
* @module ol/extent
*/
/**
* @param {Array<number>} xs Xs.
* @param {Array<number>} ys Ys.
* @param {Extent} [dest] Destination extent.
* @private
* @return {Extent} Extent.
*/
function _boundingExtentXYs(xs, ys, dest) {
	return createOrUpdate(Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys), dest);
}
/**
* Creates a clone of an extent.
*
* @param {Extent} extent Extent to clone.
* @param {Extent} [dest] Extent.
* @return {Extent} The clone.
*/
function clone(extent, dest) {
	if (dest) {
		dest[0] = extent[0];
		dest[1] = extent[1];
		dest[2] = extent[2];
		dest[3] = extent[3];
		return dest;
	}
	return extent.slice();
}
/**
* @param {Extent} extent Extent.
* @param {number} x X.
* @param {number} y Y.
* @return {number} Closest squared distance.
*/
function closestSquaredDistanceXY(extent, x, y) {
	let dx, dy;
	if (x < extent[0]) dx = extent[0] - x;
	else if (extent[2] < x) dx = x - extent[2];
	else dx = 0;
	if (y < extent[1]) dy = extent[1] - y;
	else if (extent[3] < y) dy = y - extent[3];
	else dy = 0;
	return dx * dx + dy * dy;
}
/**
* Check if one extent contains another.
*
* An extent is deemed contained if it lies completely within the other extent,
* including if they share one or more edges.
*
* @param {Extent} extent1 Extent 1.
* @param {Extent} extent2 Extent 2.
* @return {boolean} The second extent is contained by or on the edge of the
*     first.
* @api
*/
function containsExtent(extent1, extent2) {
	return extent1[0] <= extent2[0] && extent2[2] <= extent1[2] && extent1[1] <= extent2[1] && extent2[3] <= extent1[3];
}
/**
* Check if the passed coordinate is contained or on the edge of the extent.
*
* @param {Extent} extent Extent.
* @param {number} x X coordinate.
* @param {number} y Y coordinate.
* @return {boolean} The x, y values are contained in the extent.
* @api
*/
function containsXY(extent, x, y) {
	return extent[0] <= x && x <= extent[2] && extent[1] <= y && y <= extent[3];
}
/**
* Get the relationship between a coordinate and extent.
* @param {Extent} extent The extent.
* @param {import("./coordinate.js").Coordinate} coordinate The coordinate.
* @return {import("./extent/Relationship.js").default} The relationship (bitwise compare with
*     import("./extent/Relationship.js").Relationship).
*/
function coordinateRelationship(extent, coordinate) {
	const minX = extent[0];
	const minY = extent[1];
	const maxX = extent[2];
	const maxY = extent[3];
	const x = coordinate[0];
	const y = coordinate[1];
	let relationship = Relationship_default.UNKNOWN;
	if (x < minX) relationship = relationship | Relationship_default.LEFT;
	else if (x > maxX) relationship = relationship | Relationship_default.RIGHT;
	if (y < minY) relationship = relationship | Relationship_default.BELOW;
	else if (y > maxY) relationship = relationship | Relationship_default.ABOVE;
	if (relationship === Relationship_default.UNKNOWN) relationship = Relationship_default.INTERSECTING;
	return relationship;
}
/**
* Create an empty extent.
* @return {Extent} Empty extent.
* @api
*/
function createEmpty() {
	return [
		Infinity,
		Infinity,
		-Infinity,
		-Infinity
	];
}
/**
* Create a new extent or update the provided extent.
* @param {number} minX Minimum X.
* @param {number} minY Minimum Y.
* @param {number} maxX Maximum X.
* @param {number} maxY Maximum Y.
* @param {Extent} [dest] Destination extent.
* @return {Extent} Extent.
*/
function createOrUpdate(minX, minY, maxX, maxY, dest) {
	if (dest) {
		dest[0] = minX;
		dest[1] = minY;
		dest[2] = maxX;
		dest[3] = maxY;
		return dest;
	}
	return [
		minX,
		minY,
		maxX,
		maxY
	];
}
/**
* Create a new empty extent or make the provided one empty.
* @param {Extent} [dest] Extent.
* @return {Extent} Extent.
*/
function createOrUpdateEmpty(dest) {
	return createOrUpdate(Infinity, Infinity, -Infinity, -Infinity, dest);
}
/**
* @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
* @param {Extent} [dest] Extent.
* @return {Extent} Extent.
*/
function createOrUpdateFromCoordinate(coordinate, dest) {
	const x = coordinate[0];
	const y = coordinate[1];
	return createOrUpdate(x, y, x, y, dest);
}
/**
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @param {Extent} [dest] Extent.
* @return {Extent} Extent.
*/
function createOrUpdateFromFlatCoordinates(flatCoordinates, offset, end, stride, dest) {
	return extendFlatCoordinates(createOrUpdateEmpty(dest), flatCoordinates, offset, end, stride);
}
/**
* Determine if two extents are equivalent.
* @param {Extent} extent1 Extent 1.
* @param {Extent} extent2 Extent 2.
* @return {boolean} The two extents are equivalent.
* @api
*/
function equals$2(extent1, extent2) {
	return extent1[0] == extent2[0] && extent1[2] == extent2[2] && extent1[1] == extent2[1] && extent1[3] == extent2[3];
}
/**
* @param {Extent} extent Extent.
* @param {Array<number>} flatCoordinates Flat coordinates.
* @param {number} offset Offset.
* @param {number} end End.
* @param {number} stride Stride.
* @return {Extent} Extent.
*/
function extendFlatCoordinates(extent, flatCoordinates, offset, end, stride) {
	for (; offset < end; offset += stride) extendXY(extent, flatCoordinates[offset], flatCoordinates[offset + 1]);
	return extent;
}
/**
* @param {Extent} extent Extent.
* @param {number} x X.
* @param {number} y Y.
*/
function extendXY(extent, x, y) {
	extent[0] = Math.min(extent[0], x);
	extent[1] = Math.min(extent[1], y);
	extent[2] = Math.max(extent[2], x);
	extent[3] = Math.max(extent[3], y);
}
/**
* This function calls `callback` for each corner of the extent. If the
* callback returns a truthy value the function returns that value
* immediately. Otherwise the function returns `false`.
* @param {Extent} extent Extent.
* @param {function(import("./coordinate.js").Coordinate): S} callback Callback.
* @return {S|boolean} Value.
* @template S
*/
function forEachCorner(extent, callback) {
	let val;
	val = callback(getBottomLeft(extent));
	if (val) return val;
	val = callback(getBottomRight(extent));
	if (val) return val;
	val = callback(getTopRight(extent));
	if (val) return val;
	val = callback(getTopLeft(extent));
	if (val) return val;
	return false;
}
/**
* Get the bottom left coordinate of an extent.
* @param {Extent} extent Extent.
* @return {import("./coordinate.js").Coordinate} Bottom left coordinate.
* @api
*/
function getBottomLeft(extent) {
	return [extent[0], extent[1]];
}
/**
* Get the bottom right coordinate of an extent.
* @param {Extent} extent Extent.
* @return {import("./coordinate.js").Coordinate} Bottom right coordinate.
* @api
*/
function getBottomRight(extent) {
	return [extent[2], extent[1]];
}
/**
* Get the center coordinate of an extent.
* @param {Extent} extent Extent.
* @return {import("./coordinate.js").Coordinate} Center.
* @api
*/
function getCenter(extent) {
	return [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
}
/**
* @param {import("./coordinate.js").Coordinate} center Center.
* @param {number} resolution Resolution.
* @param {number} rotation Rotation.
* @param {import("./size.js").Size} size Size.
* @param {Extent} [dest] Destination extent.
* @return {Extent} Extent.
*/
function getForViewAndSize(center, resolution, rotation, size, dest) {
	const [x0, y0, x1, y1, x2, y2, x3, y3] = getRotatedViewport(center, resolution, rotation, size);
	return createOrUpdate(Math.min(x0, x1, x2, x3), Math.min(y0, y1, y2, y3), Math.max(x0, x1, x2, x3), Math.max(y0, y1, y2, y3), dest);
}
/**
* @param {import("./coordinate.js").Coordinate} center Center.
* @param {number} resolution Resolution.
* @param {number} rotation Rotation.
* @param {import("./size.js").Size} size Size.
* @return {Array<number>} Linear ring representing the viewport.
*/
function getRotatedViewport(center, resolution, rotation, size) {
	const dx = resolution * size[0] / 2;
	const dy = resolution * size[1] / 2;
	const cosRotation = Math.cos(rotation);
	const sinRotation = Math.sin(rotation);
	const xCos = dx * cosRotation;
	const xSin = dx * sinRotation;
	const yCos = dy * cosRotation;
	const ySin = dy * sinRotation;
	const x = center[0];
	const y = center[1];
	return [
		x - xCos + ySin,
		y - xSin - yCos,
		x - xCos - ySin,
		y - xSin + yCos,
		x + xCos - ySin,
		y + xSin + yCos,
		x + xCos + ySin,
		y + xSin - yCos,
		x - xCos + ySin,
		y - xSin - yCos
	];
}
/**
* Get the height of an extent.
* @param {Extent} extent Extent.
* @return {number} Height.
* @api
*/
function getHeight(extent) {
	return extent[3] - extent[1];
}
/**
* Get the intersection of two extents.
* @param {Extent} extent1 Extent 1.
* @param {Extent} extent2 Extent 2.
* @param {Extent} [dest] Optional extent to populate with intersection.
* @return {Extent} Intersecting extent.
* @api
*/
function getIntersection(extent1, extent2, dest) {
	const intersection = dest ? dest : createEmpty();
	if (intersects(extent1, extent2)) {
		if (extent1[0] > extent2[0]) intersection[0] = extent1[0];
		else intersection[0] = extent2[0];
		if (extent1[1] > extent2[1]) intersection[1] = extent1[1];
		else intersection[1] = extent2[1];
		if (extent1[2] < extent2[2]) intersection[2] = extent1[2];
		else intersection[2] = extent2[2];
		if (extent1[3] < extent2[3]) intersection[3] = extent1[3];
		else intersection[3] = extent2[3];
	} else createOrUpdateEmpty(intersection);
	return intersection;
}
/**
* Get the top left coordinate of an extent.
* @param {Extent} extent Extent.
* @return {import("./coordinate.js").Coordinate} Top left coordinate.
* @api
*/
function getTopLeft(extent) {
	return [extent[0], extent[3]];
}
/**
* Get the top right coordinate of an extent.
* @param {Extent} extent Extent.
* @return {import("./coordinate.js").Coordinate} Top right coordinate.
* @api
*/
function getTopRight(extent) {
	return [extent[2], extent[3]];
}
/**
* Get the width of an extent.
* @param {Extent} extent Extent.
* @return {number} Width.
* @api
*/
function getWidth(extent) {
	return extent[2] - extent[0];
}
/**
* Determine if one extent intersects another.
* @param {Extent} extent1 Extent 1.
* @param {Extent} extent2 Extent.
* @return {boolean} The two extents intersect.
* @api
*/
function intersects(extent1, extent2) {
	return extent1[0] <= extent2[2] && extent1[2] >= extent2[0] && extent1[1] <= extent2[3] && extent1[3] >= extent2[1];
}
/**
* Determine if an extent is empty.
* @param {Extent} extent Extent.
* @return {boolean} Is empty.
* @api
*/
function isEmpty(extent) {
	return extent[2] < extent[0] || extent[3] < extent[1];
}
/**
* @param {Extent} extent Extent.
* @param {Extent} [dest] Extent.
* @return {Extent} Extent.
*/
function returnOrUpdate(extent, dest) {
	if (dest) {
		dest[0] = extent[0];
		dest[1] = extent[1];
		dest[2] = extent[2];
		dest[3] = extent[3];
		return dest;
	}
	return extent;
}
/**
* Determine if the segment between two coordinates intersects (crosses,
* touches, or is contained by) the provided extent.
* @param {Extent} extent The extent.
* @param {import("./coordinate.js").Coordinate} start Segment start coordinate.
* @param {import("./coordinate.js").Coordinate} end Segment end coordinate.
* @return {boolean} The segment intersects the extent.
*/
function intersectsSegment(extent, start, end) {
	let intersects = false;
	const startRel = coordinateRelationship(extent, start);
	const endRel = coordinateRelationship(extent, end);
	if (startRel === Relationship_default.INTERSECTING || endRel === Relationship_default.INTERSECTING) intersects = true;
	else {
		const minX = extent[0];
		const minY = extent[1];
		const maxX = extent[2];
		const maxY = extent[3];
		const startX = start[0];
		const startY = start[1];
		const endX = end[0];
		const endY = end[1];
		const slope = (endY - startY) / (endX - startX);
		let x, y;
		if (!!(endRel & Relationship_default.ABOVE) && !(startRel & Relationship_default.ABOVE)) {
			x = endX - (endY - maxY) / slope;
			intersects = x >= minX && x <= maxX;
		}
		if (!intersects && !!(endRel & Relationship_default.RIGHT) && !(startRel & Relationship_default.RIGHT)) {
			y = endY - (endX - maxX) * slope;
			intersects = y >= minY && y <= maxY;
		}
		if (!intersects && !!(endRel & Relationship_default.BELOW) && !(startRel & Relationship_default.BELOW)) {
			x = endX - (endY - minY) / slope;
			intersects = x >= minX && x <= maxX;
		}
		if (!intersects && !!(endRel & Relationship_default.LEFT) && !(startRel & Relationship_default.LEFT)) {
			y = endY - (endX - minX) * slope;
			intersects = y >= minY && y <= maxY;
		}
	}
	return intersects;
}
/**
* Apply a transform function to the extent.
* @param {Extent} extent Extent.
* @param {import("./proj.js").TransformFunction} transformFn Transform function.
* Called with `[minX, minY, maxX, maxY]` extent coordinates.
* @param {Extent} [dest] Destination extent.
* @param {number} [stops] Number of stops per side used for the transform.
* By default only the corners are used.
* @return {Extent} Extent.
* @api
*/
function applyTransform(extent, transformFn, dest, stops) {
	if (isEmpty(extent)) return createOrUpdateEmpty(dest);
	let coordinates = [];
	if (stops > 1) {
		const width = extent[2] - extent[0];
		const height = extent[3] - extent[1];
		for (let i = 0; i < stops; ++i) coordinates.push(extent[0] + width * i / stops, extent[1], extent[2], extent[1] + height * i / stops, extent[2] - width * i / stops, extent[3], extent[0], extent[3] - height * i / stops);
	} else coordinates = [
		extent[0],
		extent[1],
		extent[2],
		extent[1],
		extent[2],
		extent[3],
		extent[0],
		extent[3]
	];
	transformFn(coordinates, coordinates, 2);
	const xs = [];
	const ys = [];
	for (let i = 0, l = coordinates.length; i < l; i += 2) {
		xs.push(coordinates[i]);
		ys.push(coordinates[i + 1]);
	}
	return _boundingExtentXYs(xs, ys, dest);
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/math.js
/**
* @module ol/math
*/
/**
* Takes a number and clamps it to within the provided bounds.
* @param {number} value The input number.
* @param {number} min The minimum value to return.
* @param {number} max The maximum value to return.
* @return {number} The input number if it is within bounds, or the nearest
*     number within the bounds.
*/
function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}
/**
* Returns the square of the closest distance between the point (x, y) and the
* line segment (x1, y1) to (x2, y2).
* @param {number} x X.
* @param {number} y Y.
* @param {number} x1 X1.
* @param {number} y1 Y1.
* @param {number} x2 X2.
* @param {number} y2 Y2.
* @return {number} Squared distance.
*/
function squaredSegmentDistance(x, y, x1, y1, x2, y2) {
	const dx = x2 - x1;
	const dy = y2 - y1;
	if (dx !== 0 || dy !== 0) {
		const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
		if (t > 1) {
			x1 = x2;
			y1 = y2;
		} else if (t > 0) {
			x1 += dx * t;
			y1 += dy * t;
		}
	}
	return squaredDistance(x, y, x1, y1);
}
/**
* Returns the square of the distance between the points (x1, y1) and (x2, y2).
* @param {number} x1 X1.
* @param {number} y1 Y1.
* @param {number} x2 X2.
* @param {number} y2 Y2.
* @return {number} Squared distance.
*/
function squaredDistance(x1, y1, x2, y2) {
	const dx = x2 - x1;
	const dy = y2 - y1;
	return dx * dx + dy * dy;
}
/**
* Converts degrees to radians.
*
* @param {number} angleInDegrees Angle in degrees.
* @return {number} Angle in radians.
*/
function toRadians(angleInDegrees) {
	return angleInDegrees * Math.PI / 180;
}
/**
* Returns the modulo of a / b, depending on the sign of b.
*
* @param {number} a Dividend.
* @param {number} b Divisor.
* @return {number} Modulo.
*/
function modulo(a, b) {
	const r = a % b;
	return r * b < 0 ? r + b : r;
}
/**
* Calculates the linearly interpolated value of x between a and b.
*
* @param {number} a Number
* @param {number} b Number
* @param {number} x Value to be interpolated.
* @return {number} Interpolated value.
*/
function lerp(a, b, x) {
	return a + x * (b - a);
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/coordinate.js
/**
* @module ol/coordinate
*/
/**
* An array of numbers representing an `xy`, `xyz` or `xyzm` coordinate.
* Example: `[16, 48]`.
* @typedef {Array<number>} Coordinate
* @api
*/
/**
* A function that takes a {@link module:ol/coordinate~Coordinate} and
* transforms it into a `{string}`.
*
* @typedef {function((Coordinate|undefined)): string} CoordinateFormat
* @api
*/
/**
* Add `delta` to `coordinate`. `coordinate` is modified in place and returned
* by the function.
*
* Example:
*
*     import {add} from 'ol/coordinate.js';
*
*     const coord = [7.85, 47.983333];
*     add(coord, [-2, 4]);
*     // coord is now [5.85, 51.983333]
*
* @param {Coordinate} coordinate Coordinate.
* @param {Coordinate} delta Delta.
* @return {Coordinate} The input coordinate adjusted by
* the given delta.
* @api
*/
function add(coordinate, delta) {
	coordinate[0] += +delta[0];
	coordinate[1] += +delta[1];
	return coordinate;
}
/**
* @param {Coordinate} coordinate1 First coordinate.
* @param {Coordinate} coordinate2 Second coordinate.
* @return {boolean} The two coordinates are equal.
*/
function equals$1(coordinate1, coordinate2) {
	let equals = true;
	for (let i = coordinate1.length - 1; i >= 0; --i) if (coordinate1[i] != coordinate2[i]) {
		equals = false;
		break;
	}
	return equals;
}
/**
* Rotate `coordinate` by `angle`. `coordinate` is modified in place and
* returned by the function.
*
* Example:
*
*     import {rotate} from 'ol/coordinate.js';
*
*     const coord = [7.85, 47.983333];
*     const rotateRadians = Math.PI / 2; // 90 degrees
*     rotate(coord, rotateRadians);
*     // coord is now [-47.983333, 7.85]
*
* @param {Coordinate} coordinate Coordinate.
* @param {number} angle Angle in radian.
* @return {Coordinate} Coordinate.
* @api
*/
function rotate(coordinate, angle) {
	const cosAngle = Math.cos(angle);
	const sinAngle = Math.sin(angle);
	const x = coordinate[0] * cosAngle - coordinate[1] * sinAngle;
	const y = coordinate[1] * cosAngle + coordinate[0] * sinAngle;
	coordinate[0] = x;
	coordinate[1] = y;
	return coordinate;
}
/**
* Scale `coordinate` by `scale`. `coordinate` is modified in place and returned
* by the function.
*
* Example:
*
*     import {scale as scaleCoordinate} from 'ol/coordinate.js';
*
*     const coord = [7.85, 47.983333];
*     const scale = 1.2;
*     scaleCoordinate(coord, scale);
*     // coord is now [9.42, 57.5799996]
*
* @param {Coordinate} coordinate Coordinate.
* @param {number} scale Scale factor.
* @return {Coordinate} Coordinate.
*/
function scale(coordinate, scale) {
	coordinate[0] *= scale;
	coordinate[1] *= scale;
	return coordinate;
}
/**
* Modifies the provided coordinate in-place to be within the real world
* extent. The lower projection extent boundary is inclusive, the upper one
* exclusive.
*
* @param {Coordinate} coordinate Coordinate.
* @param {import("./proj/Projection.js").default} projection Projection.
* @return {Coordinate} The coordinate within the real world extent.
*/
function wrapX(coordinate, projection) {
	if (projection.canWrapX()) {
		const worldWidth = getWidth(projection.getExtent());
		const worldsAway = getWorldsAway(coordinate, projection, worldWidth);
		if (worldsAway) coordinate[0] -= worldsAway * worldWidth;
	}
	return coordinate;
}
/**
* @param {Coordinate} coordinate Coordinate.
* @param {import("./proj/Projection.js").default} projection Projection.
* @param {number} [sourceExtentWidth] Width of the source extent.
* @return {number} Offset in world widths.
*/
function getWorldsAway(coordinate, projection, sourceExtentWidth) {
	const projectionExtent = projection.getExtent();
	let worldsAway = 0;
	if (projection.canWrapX() && (coordinate[0] < projectionExtent[0] || coordinate[0] > projectionExtent[2])) {
		sourceExtentWidth = sourceExtentWidth || getWidth(projectionExtent);
		worldsAway = Math.floor((coordinate[0] - projectionExtent[0]) / sourceExtentWidth);
	}
	return worldsAway;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/console.js
/**
* @module ol/console
*/
/**
* @typedef {'info'|'warn'|'error'|'none'} Level
*/
/**
* @type {Object<Level, number>}
*/
var levels = {
	info: 1,
	warn: 2,
	error: 3,
	none: 4
};
/**
* @type {number}
*/
var level = levels.info;
/**
* @param  {...any} args Arguments to log
*/
function warn(...args) {
	if (level > levels.warn) return;
	console.warn(...args);
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/proj.js
var showCoordinateWarning = true;
/**
* @param {boolean} [disable = true] Disable console info about `useGeographic()`
*/
function disableCoordinateWarning(disable) {
	showCoordinateWarning = !(disable === void 0 ? true : disable);
}
/**
* @param {Array<number>} input Input coordinate array.
* @param {Array<number>} [output] Output array of coordinate values.
* @return {Array<number>} Output coordinate array (new array, same coordinate
*     values).
*/
function cloneTransform(input, output) {
	if (output !== void 0) {
		for (let i = 0, ii = input.length; i < ii; ++i) output[i] = input[i];
		output = output;
	} else output = input.slice();
	return output;
}
/**
* @param {Array<number>} input Input coordinate array.
* @param {Array<number>} [output] Output array of coordinate values.
* @return {Array<number>} Input coordinate array (same array as input).
*/
function identityTransform(input, output) {
	if (output !== void 0 && input !== output) {
		for (let i = 0, ii = input.length; i < ii; ++i) output[i] = input[i];
		input = output;
	}
	return input;
}
/**
* Add a Projection object to the list of supported projections that can be
* looked up by their code.
*
* @param {Projection} projection Projection instance.
* @api
*/
function addProjection(projection) {
	add$2(projection.getCode(), projection);
	add$1(projection, projection, cloneTransform);
}
/**
* @param {Array<Projection>} projections Projections.
*/
function addProjections(projections) {
	projections.forEach(addProjection);
}
/**
* Fetches a Projection object for the code specified.
*
* @param {ProjectionLike} projectionLike Either a code string which is
*     a combination of authority and identifier such as "EPSG:4326", or an
*     existing projection object, or undefined.
* @return {Projection|null} Projection object, or null if not in list.
* @api
*/
function get(projectionLike) {
	return typeof projectionLike === "string" ? get$2(projectionLike) : /** @type {Projection} */ projectionLike || null;
}
/**
* Registers transformation functions that don't alter coordinates. Those allow
* to transform between projections with equal meaning.
*
* @param {Array<Projection>} projections Projections.
* @api
*/
function addEquivalentProjections(projections) {
	addProjections(projections);
	projections.forEach(function(source) {
		projections.forEach(function(destination) {
			if (source !== destination) add$1(source, destination, cloneTransform);
		});
	});
}
/**
* Registers transformation functions to convert coordinates in any projection
* in projection1 to any projection in projection2.
*
* @param {Array<Projection>} projections1 Projections with equal
*     meaning.
* @param {Array<Projection>} projections2 Projections with equal
*     meaning.
* @param {TransformFunction} forwardTransform Transformation from any
*   projection in projection1 to any projection in projection2.
* @param {TransformFunction} inverseTransform Transform from any projection
*   in projection2 to any projection in projection1..
*/
function addEquivalentTransforms(projections1, projections2, forwardTransform, inverseTransform) {
	projections1.forEach(function(projection1) {
		projections2.forEach(function(projection2) {
			add$1(projection1, projection2, forwardTransform);
			add$1(projection2, projection1, inverseTransform);
		});
	});
}
/**
* @param {Projection|string|undefined} projection Projection.
* @param {string} defaultCode Default code.
* @return {Projection} Projection.
*/
function createProjection(projection, defaultCode) {
	if (!projection) return get(defaultCode);
	if (typeof projection === "string") return get(projection);
	return projection;
}
/**
* Creates a {@link module:ol/proj~TransformFunction} from a simple 2D coordinate transform
* function.
* @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} coordTransform Coordinate
*     transform.
* @return {TransformFunction} Transform function.
*/
function createTransformFromCoordinateTransform(coordTransform) {
	return (
	/**
	* @param {Array<number>} input Input.
	* @param {Array<number>} [output] Output.
	* @param {number} [dimension] Dimension.
	* @return {Array<number>} Output.
	*/
	function(input, output, dimension) {
		const length = input.length;
		dimension = dimension !== void 0 ? dimension : 2;
		output = output !== void 0 ? output : new Array(length);
		for (let i = 0; i < length; i += dimension) {
			const point = coordTransform(input.slice(i, i + dimension));
			const pointLength = point.length;
			for (let j = 0, jj = dimension; j < jj; ++j) output[i + j] = j >= pointLength ? input[i + j] : point[j];
		}
		return output;
	});
}
/**
* Registers coordinate transform functions to convert coordinates between the
* source projection and the destination projection.
* The forward and inverse functions convert coordinate pairs; this function
* converts these into the functions used internally which also handle
* extents and coordinate arrays.
*
* @param {ProjectionLike} source Source projection.
* @param {ProjectionLike} destination Destination projection.
* @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} forward The forward transform
*     function (that is, from the source projection to the destination
*     projection) that takes a {@link module:ol/coordinate~Coordinate} as argument and returns
*     the transformed {@link module:ol/coordinate~Coordinate}.
* @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} inverse The inverse transform
*     function (that is, from the destination projection to the source
*     projection) that takes a {@link module:ol/coordinate~Coordinate} as argument and returns
*     the transformed {@link module:ol/coordinate~Coordinate}. If the transform function can only
*     transform less dimensions than the input coordinate, it is supposeed to return a coordinate
*     with only the length it can transform. The other dimensions will be taken unchanged from the
*     source.
* @api
*/
function addCoordinateTransforms(source, destination, forward, inverse) {
	const sourceProj = get(source);
	const destProj = get(destination);
	add$1(sourceProj, destProj, createTransformFromCoordinateTransform(forward));
	add$1(destProj, sourceProj, createTransformFromCoordinateTransform(inverse));
}
/**
* Transforms a coordinate from longitude/latitude to a different projection.
* @param {import("./coordinate.js").Coordinate} coordinate Coordinate as longitude and latitude, i.e.
*     an array with longitude as 1st and latitude as 2nd element.
* @param {ProjectionLike} [projection] Target projection. The
*     default is Web Mercator, i.e. 'EPSG:3857'.
* @return {import("./coordinate.js").Coordinate} Coordinate projected to the target projection.
* @api
*/
function fromLonLat(coordinate, projection) {
	disableCoordinateWarning();
	return transform(coordinate, "EPSG:4326", projection !== void 0 ? projection : "EPSG:3857");
}
/**
* Transforms a coordinate to longitude/latitude.
* @param {import("./coordinate.js").Coordinate} coordinate Projected coordinate.
* @param {ProjectionLike} [projection] Projection of the coordinate.
*     The default is Web Mercator, i.e. 'EPSG:3857'.
* @return {import("./coordinate.js").Coordinate} Coordinate as longitude and latitude, i.e. an array
*     with longitude as 1st and latitude as 2nd element.
* @api
*/
function toLonLat(coordinate, projection) {
	const lonLat = transform(coordinate, projection !== void 0 ? projection : "EPSG:3857", "EPSG:4326");
	const lon = lonLat[0];
	if (lon < -180 || lon > 180) lonLat[0] = modulo(lon + 180, 360) - 180;
	return lonLat;
}
/**
* Searches in the list of transform functions for the function for converting
* coordinates from the source projection to the destination projection.
*
* @param {Projection} sourceProjection Source Projection object.
* @param {Projection} destinationProjection Destination Projection
*     object.
* @return {TransformFunction} Transform function.
*/
function getTransformFromProjections(sourceProjection, destinationProjection) {
	let transformFunc = get$1(sourceProjection.getCode(), destinationProjection.getCode());
	if (!transformFunc) transformFunc = identityTransform;
	return transformFunc;
}
/**
* Given the projection-like objects, searches for a transformation
* function to convert a coordinates array from the source projection to the
* destination projection.
*
* @param {ProjectionLike} source Source.
* @param {ProjectionLike} destination Destination.
* @return {TransformFunction} Transform function.
* @api
*/
function getTransform(source, destination) {
	return getTransformFromProjections(get(source), get(destination));
}
/**
* Transforms a coordinate from source projection to destination projection.
* This returns a new coordinate (and does not modify the original).
*
* See {@link module:ol/proj.transformExtent} for extent transformation.
* See the transform method of {@link module:ol/geom/Geometry~Geometry} and its
* subclasses for geometry transforms.
*
* @param {import("./coordinate.js").Coordinate} coordinate Coordinate.
* @param {ProjectionLike} source Source projection-like.
* @param {ProjectionLike} destination Destination projection-like.
* @return {import("./coordinate.js").Coordinate} Coordinate.
* @api
*/
function transform(coordinate, source, destination) {
	return getTransform(source, destination)(coordinate, void 0, coordinate.length);
}
/**
* Transforms an extent from source projection to destination projection.  This
* returns a new extent (and does not modify the original).
*
* @param {import("./extent.js").Extent} extent The extent to transform.
* @param {ProjectionLike} source Source projection-like.
* @param {ProjectionLike} destination Destination projection-like.
* @param {number} [stops] Number of stops per side used for the transform.
* By default only the corners are used.
* @return {import("./extent.js").Extent} The transformed extent.
* @api
*/
function transformExtent(extent, source, destination, stops) {
	return applyTransform(extent, getTransform(source, destination), void 0, stops);
}
/**
* @type {Projection|null}
*/
var userProjection = null;
/**
* Get the projection for coordinates supplied from and returned by API methods.
* @return {Projection|null} The user projection (or null if not set).
* @api
*/
function getUserProjection() {
	return userProjection;
}
/**
* Return a coordinate transformed into the user projection.  If no user projection
* is set, the original coordinate is returned.
* @param {Array<number>} coordinate Input coordinate.
* @param {ProjectionLike} sourceProjection The input coordinate projection.
* @return {Array<number>} The input coordinate in the user projection.
*/
function toUserCoordinate(coordinate, sourceProjection) {
	if (!userProjection) return coordinate;
	return transform(coordinate, sourceProjection, userProjection);
}
/**
* Return a coordinate transformed from the user projection.  If no user projection
* is set, the original coordinate is returned.
* @param {Array<number>} coordinate Input coordinate.
* @param {ProjectionLike} destProjection The destination projection.
* @return {Array<number>} The input coordinate transformed.
*/
function fromUserCoordinate(coordinate, destProjection) {
	if (!userProjection) {
		if (showCoordinateWarning && !equals$1(coordinate, [0, 0]) && coordinate[0] >= -180 && coordinate[0] <= 180 && coordinate[1] >= -90 && coordinate[1] <= 90) {
			showCoordinateWarning = false;
			warn("Call useGeographic() from ol/proj once to work with [longitude, latitude] coordinates.");
		}
		return coordinate;
	}
	return transform(coordinate, userProjection, destProjection);
}
/**
* Return an extent transformed into the user projection.  If no user projection
* is set, the original extent is returned.
* @param {import("./extent.js").Extent} extent Input extent.
* @param {ProjectionLike} sourceProjection The input extent projection.
* @return {import("./extent.js").Extent} The input extent in the user projection.
*/
function toUserExtent(extent, sourceProjection) {
	if (!userProjection) return extent;
	return transformExtent(extent, sourceProjection, userProjection);
}
/**
* Return an extent transformed from the user projection.  If no user projection
* is set, the original extent is returned.
* @param {import("./extent.js").Extent} extent Input extent.
* @param {ProjectionLike} destProjection The destination projection.
* @return {import("./extent.js").Extent} The input extent transformed.
*/
function fromUserExtent(extent, destProjection) {
	if (!userProjection) return extent;
	return transformExtent(extent, userProjection, destProjection);
}
/**
* Creates a safe coordinate transform function from a coordinate transform function.
* "Safe" means that it can handle wrapping of x-coordinates for global projections,
* and that coordinates exceeding the source projection validity extent's range will be
* clamped to the validity range.
* @param {Projection} sourceProj Source projection.
* @param {Projection} destProj Destination projection.
* @param {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} transform Transform function (source to destination).
* @return {function(import("./coordinate.js").Coordinate): import("./coordinate.js").Coordinate} Safe transform function (source to destination).
*/
function createSafeCoordinateTransform(sourceProj, destProj, transform) {
	return function(coord) {
		let transformed, worldsAway;
		if (sourceProj.canWrapX()) {
			const sourceExtent = sourceProj.getExtent();
			const sourceExtentWidth = getWidth(sourceExtent);
			coord = coord.slice(0);
			worldsAway = getWorldsAway(coord, sourceProj, sourceExtentWidth);
			if (worldsAway) coord[0] = coord[0] - worldsAway * sourceExtentWidth;
			coord[0] = clamp(coord[0], sourceExtent[0], sourceExtent[2]);
			coord[1] = clamp(coord[1], sourceExtent[1], sourceExtent[3]);
			transformed = transform(coord);
		} else transformed = transform(coord);
		if (worldsAway && destProj.canWrapX()) transformed[0] += worldsAway * getWidth(destProj.getExtent());
		return transformed;
	};
}
/**
* Add transforms to and from EPSG:4326 and EPSG:3857.  This function is called
* by when this module is executed and should only need to be called again after
* `clearAllProjections()` is called (e.g. in tests).
*/
function addCommon() {
	addEquivalentProjections(PROJECTIONS$1);
	addEquivalentProjections(PROJECTIONS);
	addEquivalentTransforms(PROJECTIONS, PROJECTIONS$1, fromEPSG4326, toEPSG4326);
}
addCommon();
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/Disposable.js
/**
* @module ol/Disposable
*/
/**
* @classdesc
* Objects that need to clean up after themselves.
*/
var Disposable = class {
	constructor() {
		/**
		* The object has already been disposed.
		* @type {boolean}
		* @protected
		*/
		this.disposed = false;
	}
	/**
	* Clean up.
	*/
	dispose() {
		if (!this.disposed) {
			this.disposed = true;
			this.disposeInternal();
		}
	}
	/**
	* Extension point for disposable objects.
	* @protected
	*/
	disposeInternal() {}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/events/Event.js
/**
* @module ol/events/Event
*/
/**
* @classdesc
* Stripped down implementation of the W3C DOM Level 2 Event interface.
* See https://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-interface.
*
* This implementation only provides `type` and `target` properties, and
* `stopPropagation` and `preventDefault` methods. It is meant as base class
* for higher level events defined in the library, and works with
* {@link module:ol/events/Target~Target}.
*/
var BaseEvent = class {
	/**
	* @param {string} type Type.
	*/
	constructor(type) {
		/**
		* @type {boolean}
		*/
		this.propagationStopped;
		/**
		* @type {boolean}
		*/
		this.defaultPrevented;
		/**
		* The event type.
		* @type {string}
		* @api
		*/
		this.type = type;
		/**
		* The event target.
		* @type {Object}
		* @api
		*/
		this.target = null;
	}
	/**
	* Prevent default. This means that no emulated `click`, `singleclick` or `doubleclick` events
	* will be fired.
	* @api
	*/
	preventDefault() {
		this.defaultPrevented = true;
	}
	/**
	* Stop event propagation.
	* @api
	*/
	stopPropagation() {
		this.propagationStopped = true;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/array.js
/**
* Compare function sorting arrays in ascending order.  Safe to use for numeric values.
* @param {*} a The first object to be compared.
* @param {*} b The second object to be compared.
* @return {number} A negative number, zero, or a positive number as the first
*     argument is less than, equal to, or greater than the second.
*/
function ascending(a, b) {
	return a > b ? 1 : a < b ? -1 : 0;
}
/**
* {@link module:ol/tilegrid/TileGrid~TileGrid#getZForResolution} can use a function
* of this type to determine which nearest resolution to use.
*
* This function takes a `{number}` representing a value between two array entries,
* a `{number}` representing the value of the nearest higher entry and
* a `{number}` representing the value of the nearest lower entry
* as arguments and returns a `{number}`. If a negative number or zero is returned
* the lower value will be used, if a positive number is returned the higher value
* will be used.
* @typedef {function(number, number, number): number} NearestDirectionFunction
* @api
*/
/**
* @param {Array<number>} arr Array in descending order.
* @param {number} target Target.
* @param {number|NearestDirectionFunction} direction
*    0 means return the nearest,
*    > 0 means return the largest nearest,
*    < 0 means return the smallest nearest.
* @return {number} Index.
*/
function linearFindNearest(arr, target, direction) {
	if (arr[0] <= target) return 0;
	const n = arr.length;
	if (target <= arr[n - 1]) return n - 1;
	if (typeof direction === "function") {
		for (let i = 1; i < n; ++i) {
			const candidate = arr[i];
			if (candidate === target) return i;
			if (candidate < target) {
				if (direction(target, arr[i - 1], candidate) > 0) return i - 1;
				return i;
			}
		}
		return n - 1;
	}
	if (direction > 0) {
		for (let i = 1; i < n; ++i) if (arr[i] < target) return i - 1;
		return n - 1;
	}
	if (direction < 0) {
		for (let i = 1; i < n; ++i) if (arr[i] <= target) return i;
		return n - 1;
	}
	for (let i = 1; i < n; ++i) {
		if (arr[i] == target) return i;
		if (arr[i] < target) {
			if (arr[i - 1] - target < target - arr[i]) return i - 1;
			return i;
		}
	}
	return n - 1;
}
/**
* @param {Array<VALUE>} arr The array to modify.
* @param {!Array<VALUE>|VALUE} data The elements or arrays of elements to add to arr.
* @template VALUE
*/
function extend(arr, data) {
	const extension = Array.isArray(data) ? data : [data];
	const length = extension.length;
	for (let i = 0; i < length; i++) arr[arr.length] = extension[i];
}
/**
* @param {Array<any>|Uint8ClampedArray} arr1 The first array to compare.
* @param {Array<any>|Uint8ClampedArray} arr2 The second array to compare.
* @return {boolean} Whether the two arrays are equal.
*/
function equals(arr1, arr2) {
	const len1 = arr1.length;
	if (len1 !== arr2.length) return false;
	for (let i = 0; i < len1; i++) if (arr1[i] !== arr2[i]) return false;
	return true;
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/functions.js
/**
* @module ol/functions
*/
/**
* Always returns true.
* @return {boolean} true.
*/
function TRUE() {
	return true;
}
/**
* Always returns false.
* @return {boolean} false.
*/
function FALSE() {
	return false;
}
/**
* A reusable function, used e.g. as a default for callbacks.
*
* @return {void} Nothing.
*/
function VOID() {}
/**
* Wrap a function in another function that remembers the last return.  If the
* returned function is called twice in a row with the same arguments and the same
* this object, it will return the value from the first call in the second call.
*
* @param {function(...any): ReturnType} fn The function to memoize.
* @return {function(...any): ReturnType} The memoized function.
* @template ReturnType
*/
function memoizeOne(fn) {
	let called = false;
	/** @type {ReturnType} */
	let lastResult;
	/** @type {Array<any>} */
	let lastArgs;
	let lastThis;
	return function() {
		const nextArgs = Array.prototype.slice.call(arguments);
		if (!called || this !== lastThis || !equals(nextArgs, lastArgs)) {
			called = true;
			lastThis = this;
			lastArgs = nextArgs;
			lastResult = fn.apply(this, arguments);
		}
		return lastResult;
	};
}
/**
* @template T
* @param {function(): (T | Promise<T>)} getter A function that returns a value or a promise for a value.
* @return {Promise<T>} A promise for the value.
*/
function toPromise(getter) {
	function promiseGetter() {
		let value;
		try {
			value = getter();
		} catch (err) {
			return Promise.reject(err);
		}
		if (value instanceof Promise) return value;
		return Promise.resolve(value);
	}
	return promiseGetter();
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/events/Target.js
/**
* @module ol/events/Target
*/
/**
* @typedef {EventTarget|Target} EventTargetLike
*/
/**
* @classdesc
* A simplified implementation of the W3C DOM Level 2 EventTarget interface.
* See https://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html#Events-EventTarget.
*
* There are two important simplifications compared to the specification:
*
* 1. The handling of `useCapture` in `addEventListener` and
*    `removeEventListener`. There is no real capture model.
* 2. The handling of `stopPropagation` and `preventDefault` on `dispatchEvent`.
*    There is no event target hierarchy. When a listener calls
*    `stopPropagation` or `preventDefault` on an event object, it means that no
*    more listeners after this one will be called. Same as when the listener
*    returns false.
*/
var Target = class extends Disposable {
	/**
	* @param {*} [target] Default event target for dispatched events.
	*/
	constructor(target) {
		super();
		/**
		* @private
		* @type {*}
		*/
		this.eventTarget_ = target;
		/**
		* @private
		* @type {Object<string, number>|null}
		*/
		this.pendingRemovals_ = null;
		/**
		* @private
		* @type {Object<string, number>|null}
		*/
		this.dispatching_ = null;
		/**
		* @private
		* @type {Object<string, Array<import("../events.js").Listener>>|null}
		*/
		this.listeners_ = null;
	}
	/**
	* @param {string} type Type.
	* @param {import("../events.js").Listener} listener Listener.
	*/
	addEventListener(type, listener) {
		if (!type || !listener) return;
		const listeners = this.listeners_ || (this.listeners_ = {});
		const listenersForType = listeners[type] || (listeners[type] = []);
		if (!listenersForType.includes(listener)) listenersForType.push(listener);
	}
	/**
	* Dispatches an event and calls all listeners listening for events
	* of this type. The event parameter can either be a string or an
	* Object with a `type` property.
	*
	* @param {import("./Event.js").default|string} event Event object.
	* @return {boolean|undefined} `false` if anyone called preventDefault on the
	*     event object or if any of the listeners returned false.
	* @api
	*/
	dispatchEvent(event) {
		const isString = typeof event === "string";
		const type = isString ? event : event.type;
		const listeners = this.listeners_ && this.listeners_[type];
		if (!listeners) return;
		const evt = isString ? new BaseEvent(event) : event;
		if (!evt.target) evt.target = this.eventTarget_ || this;
		const dispatching = this.dispatching_ || (this.dispatching_ = {});
		const pendingRemovals = this.pendingRemovals_ || (this.pendingRemovals_ = {});
		if (!(type in dispatching)) {
			dispatching[type] = 0;
			pendingRemovals[type] = 0;
		}
		++dispatching[type];
		let propagate;
		for (let i = 0, ii = listeners.length; i < ii; ++i) {
			if ("handleEvent" in listeners[i]) propagate = listeners[i].handleEvent(evt);
			else propagate = listeners[i].call(this, evt);
			if (propagate === false || evt.propagationStopped) {
				propagate = false;
				break;
			}
		}
		if (--dispatching[type] === 0) {
			let pr = pendingRemovals[type];
			delete pendingRemovals[type];
			while (pr--) this.removeEventListener(type, VOID);
			delete dispatching[type];
		}
		return propagate;
	}
	/**
	* Clean up.
	*/
	disposeInternal() {
		this.listeners_ && clear(this.listeners_);
	}
	/**
	* Get the listeners for a specified event type. Listeners are returned in the
	* order that they will be called in.
	*
	* @param {string} type Type.
	* @return {Array<import("../events.js").Listener>|undefined} Listeners.
	*/
	getListeners(type) {
		return this.listeners_ && this.listeners_[type] || void 0;
	}
	/**
	* @param {string} [type] Type. If not provided,
	*     `true` will be returned if this event target has any listeners.
	* @return {boolean} Has listeners.
	*/
	hasListener(type) {
		if (!this.listeners_) return false;
		return type ? type in this.listeners_ : Object.keys(this.listeners_).length > 0;
	}
	/**
	* @param {string} type Type.
	* @param {import("../events.js").Listener} listener Listener.
	*/
	removeEventListener(type, listener) {
		if (!this.listeners_) return;
		const listeners = this.listeners_[type];
		if (!listeners) return;
		const index = listeners.indexOf(listener);
		if (index !== -1) if (this.pendingRemovals_ && type in this.pendingRemovals_) {
			listeners[index] = VOID;
			++this.pendingRemovals_[type];
		} else {
			listeners.splice(index, 1);
			if (listeners.length === 0) delete this.listeners_[type];
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/events/EventType.js
/**
* @module ol/events/EventType
*/
/**
* @enum {string}
* @const
*/
var EventType_default = {
	/**
	* Generic change event. Triggered when the revision counter is increased.
	* @event module:ol/events/Event~BaseEvent#change
	* @api
	*/
	CHANGE: "change",
	/**
	* Generic error event. Triggered when an error occurs.
	* @event module:ol/events/Event~BaseEvent#error
	* @api
	*/
	ERROR: "error",
	BLUR: "blur",
	CLEAR: "clear",
	CONTEXTMENU: "contextmenu",
	CLICK: "click",
	DBLCLICK: "dblclick",
	DRAGENTER: "dragenter",
	DRAGOVER: "dragover",
	DROP: "drop",
	FOCUS: "focus",
	KEYDOWN: "keydown",
	KEYPRESS: "keypress",
	LOAD: "load",
	RESIZE: "resize",
	TOUCHMOVE: "touchmove",
	WHEEL: "wheel"
};
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/events.js
/**
* @module ol/events
*/
/**
* Key to use with {@link module:ol/Observable.unByKey}.
* @typedef {Object} EventsKey
* @property {ListenerFunction} listener Listener.
* @property {import("./events/Target.js").EventTargetLike} target Target.
* @property {string} type Type.
* @api
*/
/**
* Listener function. This function is called with an event object as argument.
* When the function returns `false`, event propagation will stop.
*
* @typedef {function((Event|import("./events/Event.js").default)): (void|boolean)} ListenerFunction
* @api
*/
/**
* @typedef {Object} ListenerObject
* @property {ListenerFunction} handleEvent HandleEvent listener function.
*/
/**
* @typedef {ListenerFunction|ListenerObject} Listener
*/
/**
* Registers an event listener on an event target. Inspired by
* https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html
*
* This function efficiently binds a `listener` to a `this` object, and returns
* a key for use with {@link module:ol/events.unlistenByKey}.
*
* @param {import("./events/Target.js").EventTargetLike} target Event target.
* @param {string} type Event type.
* @param {ListenerFunction} listener Listener.
* @param {Object} [thisArg] Object referenced by the `this` keyword in the
*     listener. Default is the `target`.
* @param {boolean} [once] If true, add the listener as one-off listener.
* @return {EventsKey} Unique key for the listener.
*/
function listen(target, type, listener, thisArg, once) {
	if (thisArg && thisArg !== target) listener = listener.bind(thisArg);
	if (once) {
		const originalListener = listener;
		listener = function() {
			target.removeEventListener(type, listener);
			originalListener.apply(this, arguments);
		};
	}
	const eventsKey = {
		target,
		type,
		listener
	};
	target.addEventListener(type, listener);
	return eventsKey;
}
/**
* Registers a one-off event listener on an event target. Inspired by
* https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html
*
* This function efficiently binds a `listener` as self-unregistering listener
* to a `this` object, and returns a key for use with
* {@link module:ol/events.unlistenByKey} in case the listener needs to be
* unregistered before it is called.
*
* When {@link module:ol/events.listen} is called with the same arguments after this
* function, the self-unregistering listener will be turned into a permanent
* listener.
*
* @param {import("./events/Target.js").EventTargetLike} target Event target.
* @param {string} type Event type.
* @param {ListenerFunction} listener Listener.
* @param {Object} [thisArg] Object referenced by the `this` keyword in the
*     listener. Default is the `target`.
* @return {EventsKey} Key for unlistenByKey.
*/
function listenOnce(target, type, listener, thisArg) {
	return listen(target, type, listener, thisArg, true);
}
/**
* Unregisters event listeners on an event target. Inspired by
* https://google.github.io/closure-library/api/source/closure/goog/events/events.js.src.html
*
* The argument passed to this function is the key returned from
* {@link module:ol/events.listen} or {@link module:ol/events.listenOnce}.
*
* @param {EventsKey} key The key.
*/
function unlistenByKey(key) {
	if (key && key.target) {
		key.target.removeEventListener(key.type, key.listener);
		clear(key);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/ol@9.2.4/node_modules/ol/Observable.js
/**
* @module ol/Observable
*/
/***
* @template {string} Type
* @template {Event|import("./events/Event.js").default} EventClass
* @template Return
* @typedef {(type: Type, listener: (event: EventClass) => ?) => Return} OnSignature
*/
/***
* @template {string} Type
* @template Return
* @typedef {(type: Type[], listener: (event: Event|import("./events/Event").default) => ?) => Return extends void ? void : Return[]} CombinedOnSignature
*/
/**
* @typedef {'change'|'error'} EventTypes
*/
/***
* @template Return
* @typedef {OnSignature<EventTypes, import("./events/Event.js").default, Return> & CombinedOnSignature<EventTypes, Return>} ObservableOnSignature
*/
/**
* @classdesc
* Abstract base class; normally only used for creating subclasses and not
* instantiated in apps.
* An event target providing convenient methods for listener registration
* and unregistration. A generic `change` event is always available through
* {@link module:ol/Observable~Observable#changed}.
*
* @fires import("./events/Event.js").default
* @api
*/
var Observable = class extends Target {
	constructor() {
		super();
		this.on = this.onInternal;
		this.once = this.onceInternal;
		this.un = this.unInternal;
		/**
		* @private
		* @type {number}
		*/
		this.revision_ = 0;
	}
	/**
	* Increases the revision counter and dispatches a 'change' event.
	* @api
	*/
	changed() {
		++this.revision_;
		this.dispatchEvent(EventType_default.CHANGE);
	}
	/**
	* Get the version number for this object.  Each time the object is modified,
	* its version number will be incremented.
	* @return {number} Revision.
	* @api
	*/
	getRevision() {
		return this.revision_;
	}
	/**
	* @param {string|Array<string>} type Type.
	* @param {function((Event|import("./events/Event").default)): ?} listener Listener.
	* @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Event key.
	* @protected
	*/
	onInternal(type, listener) {
		if (Array.isArray(type)) {
			const len = type.length;
			const keys = new Array(len);
			for (let i = 0; i < len; ++i) keys[i] = listen(this, type[i], listener);
			return keys;
		}
		return listen(this, type, listener);
	}
	/**
	* @param {string|Array<string>} type Type.
	* @param {function((Event|import("./events/Event").default)): ?} listener Listener.
	* @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Event key.
	* @protected
	*/
	onceInternal(type, listener) {
		let key;
		if (Array.isArray(type)) {
			const len = type.length;
			key = new Array(len);
			for (let i = 0; i < len; ++i) key[i] = listenOnce(this, type[i], listener);
		} else key = listenOnce(this, type, listener);
		/** @type {Object} */ listener.ol_key = key;
		return key;
	}
	/**
	* Unlisten for a certain type of event.
	* @param {string|Array<string>} type Type.
	* @param {function((Event|import("./events/Event").default)): ?} listener Listener.
	* @protected
	*/
	unInternal(type, listener) {
		const key = listener.ol_key;
		if (key) unByKey(key);
		else if (Array.isArray(type)) for (let i = 0, ii = type.length; i < ii; ++i) this.removeEventListener(type[i], listener);
		else this.removeEventListener(type, listener);
	}
};
/**
* Listen for a certain type of event.
* @function
* @param {string|Array<string>} type The event type or array of event types.
* @param {function((Event|import("./events/Event").default)): ?} listener The listener function.
* @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Unique key for the listener. If
*     called with an array of event types as the first argument, the return
*     will be an array of keys.
* @api
*/
Observable.prototype.on;
/**
* Listen once for a certain type of event.
* @function
* @param {string|Array<string>} type The event type or array of event types.
* @param {function((Event|import("./events/Event").default)): ?} listener The listener function.
* @return {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} Unique key for the listener. If
*     called with an array of event types as the first argument, the return
*     will be an array of keys.
* @api
*/
Observable.prototype.once;
/**
* Unlisten for a certain type of event.
* @function
* @param {string|Array<string>} type The event type or array of event types.
* @param {function((Event|import("./events/Event").default)): ?} listener The listener function.
* @api
*/
Observable.prototype.un;
/**
* Removes an event listener using the key returned by `on()` or `once()`.
* @param {import("./events.js").EventsKey|Array<import("./events.js").EventsKey>} key The key returned by `on()`
*     or `once()` (or an array of keys).
* @api
*/
function unByKey(key) {
	if (Array.isArray(key)) for (let i = 0, ii = key.length; i < ii; ++i) unlistenByKey(key[i]);
	else unlistenByKey(key);
}
//#endregion
export { createOrUpdateFromFlatCoordinates as $, toLonLat as A, clamp as B, disableCoordinateWarning as C, get as D, fromUserExtent as E, add as F, toRadians as G, modulo as H, equals$1 as I, containsExtent as J, clone as K, rotate as L, toUserExtent as M, transform as N, getTransform as O, warn as P, createOrUpdateFromCoordinate as Q, scale as R, createSafeCoordinateTransform as S, fromUserCoordinate as T, squaredDistance as U, lerp as V, squaredSegmentDistance as W, createEmpty as X, containsXY as Y, createOrUpdateEmpty as Z, Disposable as _, EventType_default as a, getHeight as at, addProjection as b, TRUE as c, intersects as ct, toPromise as d, returnOrUpdate as dt, equals$2 as et, ascending as f, get$1 as ft, BaseEvent as g, METERS_PER_UNIT$1 as gt, linearFindNearest as h, Projection as ht, unlistenByKey as i, getForViewAndSize as it, toUserCoordinate as j, getUserProjection as k, VOID as l, intersectsSegment as lt, extend as m, isEmpty$1 as mt, unByKey as n, forEachCorner as nt, Target as o, getIntersection as ot, equals as p, clear as pt, closestSquaredDistanceXY as q, listen as r, getCenter as rt, FALSE as s, getWidth as st, Observable as t, extendFlatCoordinates as tt, memoizeOne as u, isEmpty as ut, addCoordinateTransforms as v, fromLonLat as w, createProjection as x, addEquivalentProjections as y, wrapX as z };
