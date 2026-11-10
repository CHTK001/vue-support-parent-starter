//#region ../../node_modules/.pnpm/@tmcw+togeojson@7.1.2/node_modules/@tmcw/togeojson/dist/togeojson.es.mjs
function $(element, tagName) {
	return Array.from(element.getElementsByTagName(tagName));
}
function normalizeId(id) {
	return id[0] === "#" ? id : `#${id}`;
}
function $ns(element, tagName, ns) {
	return Array.from(element.getElementsByTagNameNS(ns, tagName));
}
/**
* get the content of a text node, if any
*/
function nodeVal(node) {
	node?.normalize();
	return node?.textContent || "";
}
/**
* Get one Y child of X, if any, otherwise null
*/
function get1(node, tagName, callback) {
	const n = node.getElementsByTagName(tagName);
	const result = n.length ? n[0] : null;
	if (result && callback) callback(result);
	return result;
}
function get(node, tagName, callback) {
	const properties = {};
	if (!node) return properties;
	const n = node.getElementsByTagName(tagName);
	const result = n.length ? n[0] : null;
	if (result && callback) return callback(result, properties);
	return properties;
}
function val1(node, tagName, callback) {
	const val = nodeVal(get1(node, tagName));
	if (val && callback) return callback(val) || {};
	return {};
}
function $num(node, tagName, callback) {
	const val = Number.parseFloat(nodeVal(get1(node, tagName)));
	if (Number.isNaN(val)) return void 0;
	if (val && callback) return callback(val) || {};
	return {};
}
function num1(node, tagName, callback) {
	const val = Number.parseFloat(nodeVal(get1(node, tagName)));
	if (Number.isNaN(val)) return void 0;
	if (callback) callback(val);
	return val;
}
function getMulti(node, propertyNames) {
	const properties = {};
	for (const property of propertyNames) val1(node, property, (val) => {
		properties[property] = val;
	});
	return properties;
}
function isElement(node) {
	return node?.nodeType === 1;
}
function getExtensions(node) {
	let values = [];
	if (node === null) return values;
	for (const child of Array.from(node.childNodes)) {
		if (!isElement(child)) continue;
		const name = abbreviateName(child.nodeName);
		if (name === "gpxtpx:TrackPointExtension") values = values.concat(getExtensions(child));
		else {
			const val = nodeVal(child);
			values.push([name, parseNumeric(val)]);
		}
	}
	return values;
}
function abbreviateName(name) {
	return [
		"heart",
		"gpxtpx:hr",
		"hr"
	].includes(name) ? "heart" : name;
}
function parseNumeric(val) {
	const num = Number.parseFloat(val);
	return Number.isNaN(num) ? val : num;
}
function coordPair$1(node) {
	const ll = [Number.parseFloat(node.getAttribute("lon") || ""), Number.parseFloat(node.getAttribute("lat") || "")];
	if (Number.isNaN(ll[0]) || Number.isNaN(ll[1])) return null;
	num1(node, "ele", (val) => {
		ll.push(val);
	});
	const time = get1(node, "time");
	return {
		coordinates: ll,
		time: time ? nodeVal(time) : null,
		extendedValues: getExtensions(get1(node, "extensions"))
	};
}
function getLineStyle(node) {
	return get(node, "line", (lineStyle) => {
		return Object.assign({}, val1(lineStyle, "color", (color) => {
			return { stroke: `#${color}` };
		}), $num(lineStyle, "opacity", (opacity) => {
			return { "stroke-opacity": opacity };
		}), $num(lineStyle, "width", (width) => {
			return { "stroke-width": width * 96 / 25.4 };
		}));
	});
}
function extractProperties(ns, node) {
	const properties = getMulti(node, [
		"name",
		"cmt",
		"desc",
		"type",
		"time",
		"keywords"
	]);
	for (const [n, url] of ns) for (const child of Array.from(node.getElementsByTagNameNS(url, "*"))) properties[child.tagName.replace(":", "_")] = nodeVal(child)?.trim();
	const links = $(node, "link");
	if (links.length) properties.links = links.map((link) => Object.assign({ href: link.getAttribute("href") }, getMulti(link, ["text", "type"])));
	return properties;
}
/**
* Extract points from a trkseg or rte element.
*/
function getPoints$1(node, pointname) {
	const pts = $(node, pointname);
	const line = [];
	const times = [];
	const extendedValues = {};
	for (let i = 0; i < pts.length; i++) {
		const c = coordPair$1(pts[i]);
		if (!c) continue;
		line.push(c.coordinates);
		if (c.time) times.push(c.time);
		for (const [name, val] of c.extendedValues) {
			const plural = name === "heart" ? name : `${name.replace("gpxtpx:", "")}s`;
			if (!extendedValues[plural]) extendedValues[plural] = Array(pts.length).fill(null);
			extendedValues[plural][i] = val;
		}
	}
	if (line.length < 2) return;
	return {
		line,
		times,
		extendedValues
	};
}
/**
* Extract a LineString geometry from a rte
* element.
*/
function getRoute(ns, node) {
	const line = getPoints$1(node, "rtept");
	if (!line) return;
	return {
		type: "Feature",
		properties: Object.assign({ _gpxType: "rte" }, extractProperties(ns, node), getLineStyle(get1(node, "extensions"))),
		geometry: {
			type: "LineString",
			coordinates: line.line
		}
	};
}
function getTrack(ns, node) {
	const segments = $(node, "trkseg");
	const track = [];
	const times = [];
	const extractedLines = [];
	for (const segment of segments) {
		const line = getPoints$1(segment, "trkpt");
		if (line) {
			extractedLines.push(line);
			if (line.times?.length) times.push(line.times);
		}
	}
	if (extractedLines.length === 0) return null;
	const multi = extractedLines.length > 1;
	const properties = Object.assign({ _gpxType: "trk" }, extractProperties(ns, node), getLineStyle(get1(node, "extensions")), times.length ? { coordinateProperties: { times: multi ? times : times[0] } } : {});
	for (let i = 0; i < extractedLines.length; i++) {
		const line = extractedLines[i];
		track.push(line.line);
		if (!properties.coordinateProperties) properties.coordinateProperties = {};
		const props = properties.coordinateProperties;
		for (const [name, val] of Object.entries(line.extendedValues)) if (multi) {
			if (!props[name]) props[name] = extractedLines.map((line) => new Array(line.line.length).fill(null));
			props[name][i] = val;
		} else props[name] = val;
	}
	return {
		type: "Feature",
		properties,
		geometry: multi ? {
			type: "MultiLineString",
			coordinates: track
		} : {
			type: "LineString",
			coordinates: track[0]
		}
	};
}
/**
* Extract a point, if possible, from a given node,
* which is usually a wpt or trkpt
*/
function getPoint(ns, node) {
	const properties = Object.assign(extractProperties(ns, node), getMulti(node, ["sym"]));
	const pair = coordPair$1(node);
	if (!pair) return null;
	return {
		type: "Feature",
		properties,
		geometry: {
			type: "Point",
			coordinates: pair.coordinates
		}
	};
}
/**
* Convert GPX to GeoJSON incrementally, returning
* a [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
* that yields output feature by feature.
*/
function* gpxGen(node) {
	const n = node;
	const GPXX = "gpxx";
	const GPXX_URI = "http://www.garmin.com/xmlschemas/GpxExtensions/v3";
	const ns = [[GPXX, GPXX_URI]];
	const attrs = n.getElementsByTagName("gpx")[0]?.attributes;
	if (attrs) {
		for (const attr of Array.from(attrs)) if (attr.name?.startsWith("xmlns:") && attr.value !== GPXX_URI) ns.push([attr.name, attr.value]);
	}
	for (const track of $(n, "trk")) {
		const feature = getTrack(ns, track);
		if (feature) yield feature;
	}
	for (const route of $(n, "rte")) {
		const feature = getRoute(ns, route);
		if (feature) yield feature;
	}
	for (const waypoint of $(n, "wpt")) {
		const point = getPoint(ns, waypoint);
		if (point) yield point;
	}
}
/**
*
* Convert a GPX document to GeoJSON. The first argument, `doc`, must be a GPX
* document as an XML DOM - not as a string. You can get this using jQuery's default
* `.ajax` function or using a bare XMLHttpRequest with the `.response` property
* holding an XML DOM.
*
* The output is a JavaScript object of GeoJSON data, same as `.kml` outputs, with the
* addition of a `_gpxType` property on each `LineString` feature that indicates whether
* the feature was encoded as a route (`rte`) or track (`trk`) in the GPX document.
*/
function gpx(node) {
	return {
		type: "FeatureCollection",
		features: Array.from(gpxGen(node))
	};
}
function fixColor(v, prefix) {
	const properties = {};
	const colorProp = prefix === "stroke" || prefix === "fill" ? prefix : `${prefix}-color`;
	if (v[0] === "#") v = v.substring(1);
	if (v.length === 6 || v.length === 3) properties[colorProp] = `#${v}`;
	else if (v.length === 8) {
		properties[`${prefix}-opacity`] = Number.parseInt(v.substring(0, 2), 16) / 255;
		properties[colorProp] = `#${v.substring(6, 8)}${v.substring(4, 6)}${v.substring(2, 4)}`;
	}
	return properties;
}
function numericProperty(node, source, target) {
	const properties = {};
	num1(node, source, (val) => {
		properties[target] = val;
	});
	return properties;
}
function getColor(node, output) {
	return get(node, "color", (elem) => fixColor(nodeVal(elem), output));
}
function extractIconHref(node) {
	return get(node, "Icon", (icon, properties) => {
		val1(icon, "href", (href) => {
			properties.icon = href;
		});
		return properties;
	});
}
function extractIcon(node) {
	return get(node, "IconStyle", (iconStyle) => {
		return Object.assign(getColor(iconStyle, "icon"), numericProperty(iconStyle, "scale", "icon-scale"), numericProperty(iconStyle, "heading", "icon-heading"), get(iconStyle, "hotSpot", (hotspot) => {
			const left = Number.parseFloat(hotspot.getAttribute("x") || "");
			const top = Number.parseFloat(hotspot.getAttribute("y") || "");
			const xunits = hotspot.getAttribute("xunits") || "";
			const yunits = hotspot.getAttribute("yunits") || "";
			if (!Number.isNaN(left) && !Number.isNaN(top)) return {
				"icon-offset": [left, top],
				"icon-offset-units": [xunits, yunits]
			};
			return {};
		}), extractIconHref(iconStyle));
	});
}
function extractLabel(node) {
	return get(node, "LabelStyle", (labelStyle) => {
		return Object.assign(getColor(labelStyle, "label"), numericProperty(labelStyle, "scale", "label-scale"));
	});
}
function extractLine(node) {
	return get(node, "LineStyle", (lineStyle) => {
		return Object.assign(getColor(lineStyle, "stroke"), numericProperty(lineStyle, "width", "stroke-width"));
	});
}
function extractPoly(node) {
	return get(node, "PolyStyle", (polyStyle, properties) => {
		return Object.assign(properties, get(polyStyle, "color", (elem) => fixColor(nodeVal(elem), "fill")), val1(polyStyle, "fill", (fill) => {
			if (fill === "0") return { "fill-opacity": 0 };
		}), val1(polyStyle, "outline", (outline) => {
			if (outline === "0") return { "stroke-opacity": 0 };
		}));
	});
}
function extractStyle(node) {
	return Object.assign({}, extractPoly(node), extractLine(node), extractLabel(node), extractIcon(node));
}
var removeSpace = /\s*/g;
var trimSpace = /^\s*|\s*$/g;
var splitSpace = /\s+/;
/**
* Get one coordinate from a coordinate array, if any
*/
function coord1(value) {
	return value.replace(removeSpace, "").split(",").map(Number.parseFloat).filter((num) => !Number.isNaN(num)).slice(0, 3);
}
/**
* Get all coordinates from a coordinate array as [[],[]]
*/
function coord(value) {
	return value.replace(trimSpace, "").split(splitSpace).map(coord1).filter((coord) => {
		return coord.length >= 2;
	});
}
function gxCoords(node) {
	let elems = $(node, "coord");
	if (elems.length === 0) elems = $ns(node, "coord", "*");
	const coordinates = elems.map((elem) => {
		return nodeVal(elem).split(" ").map(Number.parseFloat);
	});
	if (coordinates.length === 0) return null;
	return {
		geometry: coordinates.length > 2 ? {
			type: "LineString",
			coordinates
		} : {
			type: "Point",
			coordinates: coordinates[0]
		},
		times: $(node, "when").map((elem) => nodeVal(elem))
	};
}
function fixRing(ring) {
	if (ring.length === 0) return ring;
	const first = ring[0];
	const last = ring[ring.length - 1];
	let equal = true;
	for (let i = 0; i < Math.max(first.length, last.length); i++) if (first[i] !== last[i]) {
		equal = false;
		break;
	}
	if (!equal) return ring.concat([ring[0]]);
	return ring;
}
function getCoordinates(node) {
	return nodeVal(get1(node, "coordinates"));
}
function getGeometry(node) {
	let geometries = [];
	let coordTimes = [];
	for (let i = 0; i < node.childNodes.length; i++) {
		const child = node.childNodes.item(i);
		if (isElement(child)) switch (child.tagName) {
			case "MultiGeometry":
			case "MultiTrack":
			case "gx:MultiTrack": {
				const childGeometries = getGeometry(child);
				geometries = geometries.concat(childGeometries.geometries);
				coordTimes = coordTimes.concat(childGeometries.coordTimes);
				break;
			}
			case "Point": {
				const coordinates = coord1(getCoordinates(child));
				if (coordinates.length >= 2) geometries.push({
					type: "Point",
					coordinates
				});
				break;
			}
			case "LinearRing":
			case "LineString": {
				const coordinates = coord(getCoordinates(child));
				if (coordinates.length >= 2) geometries.push({
					type: "LineString",
					coordinates
				});
				break;
			}
			case "Polygon": {
				const coords = [];
				for (const linearRing of $(child, "LinearRing")) {
					const ring = fixRing(coord(getCoordinates(linearRing)));
					if (ring.length >= 4) coords.push(ring);
				}
				if (coords.length) geometries.push({
					type: "Polygon",
					coordinates: coords
				});
				break;
			}
			case "Track":
			case "gx:Track": {
				const gx = gxCoords(child);
				if (!gx) break;
				const { times, geometry } = gx;
				geometries.push(geometry);
				if (times.length) coordTimes.push(times);
				break;
			}
		}
	}
	return {
		geometries,
		coordTimes
	};
}
var toNumber = (x) => Number(x);
var typeConverters = {
	string: (x) => x,
	int: toNumber,
	uint: toNumber,
	short: toNumber,
	ushort: toNumber,
	float: toNumber,
	double: toNumber,
	bool: (x) => Boolean(x)
};
function extractExtendedData(node, schema) {
	return get(node, "ExtendedData", (extendedData, properties) => {
		for (const data of $(extendedData, "Data")) properties[data.getAttribute("name") || ""] = nodeVal(get1(data, "value"));
		for (const simpleData of $(extendedData, "SimpleData")) {
			const name = simpleData.getAttribute("name") || "";
			properties[name] = (schema[name] || typeConverters.string)(nodeVal(simpleData));
		}
		return properties;
	});
}
function getMaybeHTMLDescription(node) {
	const descriptionNode = get1(node, "description");
	for (const c of Array.from(descriptionNode?.childNodes || [])) if (c.nodeType === 4) return { description: {
		"@type": "html",
		value: nodeVal(c)
	} };
	return {};
}
function extractTimeSpan(node) {
	return get(node, "TimeSpan", (timeSpan) => {
		return { timespan: {
			begin: nodeVal(get1(timeSpan, "begin")),
			end: nodeVal(get1(timeSpan, "end"))
		} };
	});
}
function extractTimeStamp(node) {
	return get(node, "TimeStamp", (timeStamp) => {
		return { timestamp: nodeVal(get1(timeStamp, "when")) };
	});
}
function extractCascadedStyle(node, styleMap) {
	return val1(node, "styleUrl", (styleUrl) => {
		styleUrl = normalizeId(styleUrl);
		if (styleMap[styleUrl]) return Object.assign({ styleUrl }, styleMap[styleUrl]);
		return { styleUrl };
	});
}
var AltitudeMode;
(function(AltitudeMode) {
	AltitudeMode["ABSOLUTE"] = "absolute";
	AltitudeMode["RELATIVE_TO_GROUND"] = "relativeToGround";
	AltitudeMode["CLAMP_TO_GROUND"] = "clampToGround";
	AltitudeMode["CLAMP_TO_SEAFLOOR"] = "clampToSeaFloor";
	AltitudeMode["RELATIVE_TO_SEAFLOOR"] = "relativeToSeaFloor";
})(AltitudeMode || (AltitudeMode = {}));
function processAltitudeMode(mode) {
	switch (mode?.textContent) {
		case AltitudeMode.ABSOLUTE: return AltitudeMode.ABSOLUTE;
		case AltitudeMode.CLAMP_TO_GROUND: return AltitudeMode.CLAMP_TO_GROUND;
		case AltitudeMode.CLAMP_TO_SEAFLOOR: return AltitudeMode.CLAMP_TO_SEAFLOOR;
		case AltitudeMode.RELATIVE_TO_GROUND: return AltitudeMode.RELATIVE_TO_GROUND;
		case AltitudeMode.RELATIVE_TO_SEAFLOOR: return AltitudeMode.RELATIVE_TO_SEAFLOOR;
	}
	return null;
}
function getGroundOverlayBox(node) {
	if (get1(node, "gx:LatLonQuad")) return { geometry: {
		type: "Polygon",
		coordinates: [fixRing(coord(getCoordinates(node)))]
	} };
	return getLatLonBox(node);
}
var DEGREES_TO_RADIANS = Math.PI / 180;
function rotateBox(bbox, coordinates, rotation) {
	const center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
	return [coordinates[0].map((coordinate) => {
		const dy = coordinate[1] - center[1];
		const dx = coordinate[0] - center[0];
		const distance = Math.sqrt(dy ** 2 + dx ** 2);
		const angle = Math.atan2(dy, dx) + rotation * DEGREES_TO_RADIANS;
		return [center[0] + Math.cos(angle) * distance, center[1] + Math.sin(angle) * distance];
	})];
}
function getLatLonBox(node) {
	const latLonBox = get1(node, "LatLonBox");
	if (latLonBox) {
		const north = num1(latLonBox, "north");
		const west = num1(latLonBox, "west");
		const east = num1(latLonBox, "east");
		const south = num1(latLonBox, "south");
		const rotation = num1(latLonBox, "rotation");
		if (typeof north === "number" && typeof south === "number" && typeof west === "number" && typeof east === "number") {
			const bbox = [
				west,
				south,
				east,
				north
			];
			let coordinates = [[
				[west, north],
				[east, north],
				[east, south],
				[west, south],
				[west, north]
			]];
			if (typeof rotation === "number") coordinates = rotateBox(bbox, coordinates, rotation);
			return {
				bbox,
				geometry: {
					type: "Polygon",
					coordinates
				}
			};
		}
	}
	return null;
}
function getGroundOverlay(node, styleMap, schema, options) {
	const box = getGroundOverlayBox(node);
	const geometry = box?.geometry || null;
	if (!geometry && options.skipNullGeometry) return null;
	const feature = {
		type: "Feature",
		geometry,
		properties: Object.assign(
			/**
			* Related to
			* https://gist.github.com/tmcw/037a1cb6660d74a392e9da7446540f46
			*/
			{ "@geometry-type": "groundoverlay" },
			getMulti(node, [
				"name",
				"address",
				"visibility",
				"open",
				"phoneNumber",
				"description"
			]),
			getMaybeHTMLDescription(node),
			extractCascadedStyle(node, styleMap),
			extractStyle(node),
			extractIconHref(node),
			extractExtendedData(node, schema),
			extractTimeSpan(node),
			extractTimeStamp(node)
		)
	};
	if (box?.bbox) feature.bbox = box.bbox;
	if (feature.properties?.visibility !== void 0) feature.properties.visibility = feature.properties.visibility !== "0";
	const id = node.getAttribute("id");
	if (id !== null && id !== "") feature.id = id;
	return feature;
}
function getNetworkLinkRegion(node) {
	const region = get1(node, "Region");
	if (region) return {
		coordinateBox: getLatLonAltBox(region),
		lod: getLod(node)
	};
	return null;
}
function getLod(node) {
	const lod = get1(node, "Lod");
	if (lod) return [
		num1(lod, "minLodPixels") ?? -1,
		num1(lod, "maxLodPixels") ?? -1,
		num1(lod, "minFadeExtent") ?? null,
		num1(lod, "maxFadeExtent") ?? null
	];
	return null;
}
function getLatLonAltBox(node) {
	const latLonAltBox = get1(node, "LatLonAltBox");
	if (latLonAltBox) {
		const north = num1(latLonAltBox, "north");
		const west = num1(latLonAltBox, "west");
		const east = num1(latLonAltBox, "east");
		const south = num1(latLonAltBox, "south");
		if (processAltitudeMode(get1(latLonAltBox, "altitudeMode") || get1(latLonAltBox, "gx:altitudeMode"))) console.debug("Encountered an unsupported feature of KML for togeojson: please contact developers for support of altitude mode.");
		if (typeof north === "number" && typeof south === "number" && typeof west === "number" && typeof east === "number") return {
			bbox: [
				west,
				south,
				east,
				north
			],
			geometry: {
				type: "Polygon",
				coordinates: [[
					[west, north],
					[east, north],
					[east, south],
					[west, south],
					[west, north]
				]]
			}
		};
	}
	return null;
}
function getLinkObject(node) {
	const linkObj = get1(node, "Link");
	if (linkObj) return getMulti(linkObj, [
		"href",
		"refreshMode",
		"refreshInterval",
		"viewRefreshMode",
		"viewRefreshTime",
		"viewBoundScale",
		"viewFormat",
		"httpQuery"
	]);
	return {};
}
function getNetworkLink(node, styleMap, schema, options) {
	const box = getNetworkLinkRegion(node);
	const geometry = box?.coordinateBox?.geometry || null;
	if (!geometry && options.skipNullGeometry) return null;
	const feature = {
		type: "Feature",
		geometry,
		properties: Object.assign(
			/**
			* Related to
			* https://gist.github.com/tmcw/037a1cb6660d74a392e9da7446540f46
			*/
			{ "@geometry-type": "networklink" },
			getMulti(node, [
				"name",
				"address",
				"visibility",
				"open",
				"phoneNumber",
				"styleUrl",
				"refreshVisibility",
				"flyToView",
				"description"
			]),
			getMaybeHTMLDescription(node),
			extractCascadedStyle(node, styleMap),
			extractStyle(node),
			extractIconHref(node),
			extractExtendedData(node, schema),
			extractTimeSpan(node),
			extractTimeStamp(node),
			getLinkObject(node),
			box?.lod ? { lod: box.lod } : {}
		)
	};
	if (box?.coordinateBox?.bbox) feature.bbox = box.coordinateBox.bbox;
	if (feature.properties?.visibility !== void 0) feature.properties.visibility = feature.properties.visibility !== "0";
	const id = node.getAttribute("id");
	if (id !== null && id !== "") feature.id = id;
	return feature;
}
function geometryListToGeometry(geometries) {
	return geometries.length === 0 ? null : geometries.length === 1 ? geometries[0] : {
		type: "GeometryCollection",
		geometries
	};
}
function getPlacemark(node, styleMap, schema, options) {
	const { coordTimes, geometries } = getGeometry(node);
	const geometry = geometryListToGeometry(geometries);
	if (!geometry && options.skipNullGeometry) return null;
	const feature = {
		type: "Feature",
		geometry,
		properties: Object.assign(getMulti(node, [
			"name",
			"address",
			"visibility",
			"open",
			"phoneNumber",
			"description"
		]), getMaybeHTMLDescription(node), extractCascadedStyle(node, styleMap), extractStyle(node), extractExtendedData(node, schema), extractTimeSpan(node), extractTimeStamp(node), coordTimes.length ? { coordinateProperties: { times: coordTimes.length === 1 ? coordTimes[0] : coordTimes } } : {})
	};
	if (feature.properties?.visibility !== void 0) feature.properties.visibility = feature.properties.visibility !== "0";
	const id = node.getAttribute("id");
	if (id !== null && id !== "") feature.id = id;
	return feature;
}
function getStyleId(style) {
	let id = style.getAttribute("id");
	const parentNode = style.parentNode;
	if (!id && isElement(parentNode) && parentNode.localName === "CascadingStyle") id = parentNode.getAttribute("kml:id") || parentNode.getAttribute("id");
	return normalizeId(id || "");
}
function buildStyleMap(node) {
	const styleMap = {};
	for (const style of $(node, "Style")) styleMap[getStyleId(style)] = extractStyle(style);
	for (const map of $(node, "StyleMap")) {
		const id = normalizeId(map.getAttribute("id") || "");
		val1(map, "styleUrl", (styleUrl) => {
			styleUrl = normalizeId(styleUrl);
			if (styleMap[styleUrl]) styleMap[id] = styleMap[styleUrl];
		});
	}
	return styleMap;
}
function buildSchema(node) {
	const schema = {};
	for (const field of $(node, "SimpleField")) schema[field.getAttribute("name") || ""] = typeConverters[field.getAttribute("type") || ""] || typeConverters.string;
	return schema;
}
/**
* Convert KML to GeoJSON incrementally, returning
* a [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators)
* that yields output feature by feature.
*/
function* kmlGen(node, options = { skipNullGeometry: false }) {
	const n = node;
	const styleMap = buildStyleMap(n);
	const schema = buildSchema(n);
	for (const placemark of $(n, "Placemark")) {
		const feature = getPlacemark(placemark, styleMap, schema, options);
		if (feature) yield feature;
	}
	for (const groundOverlay of $(n, "GroundOverlay")) {
		const feature = getGroundOverlay(groundOverlay, styleMap, schema, options);
		if (feature) yield feature;
	}
	for (const networkLink of $(n, "NetworkLink")) {
		const feature = getNetworkLink(networkLink, styleMap, schema, options);
		if (feature) yield feature;
	}
}
/**
* Convert a KML document to GeoJSON. The first argument, `doc`, must be a KML
* document as an XML DOM - not as a string. You can get this using jQuery's default
* `.ajax` function or using a bare XMLHttpRequest with the `.response` property
* holding an XML DOM.
*
* The output is a JavaScript object of GeoJSON data. You can convert it to a string
* with [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
* or use it directly in libraries.
*/
function kml(node, options = { skipNullGeometry: false }) {
	return {
		type: "FeatureCollection",
		features: Array.from(kmlGen(node, options))
	};
}
//#endregion
export { gpx, kml };
