//#region ../../node_modules/.pnpm/wkt-parser@1.5.6/node_modules/wkt-parser/PROJJSONBuilder.js
var PROJJSONBuilderBase = class {
	static getId(node) {
		const idNode = node.find((child) => Array.isArray(child) && child[0] === "ID");
		if (idNode && idNode.length >= 3) return {
			authority: idNode[1],
			code: parseInt(idNode[2], 10)
		};
		return null;
	}
	static convertUnit(node, type = "unit") {
		if (!node || node.length < 3) return {
			type,
			name: "unknown",
			conversion_factor: null
		};
		const name = node[1];
		const conversionFactor = parseFloat(node[2]) || null;
		const idNode = node.find((child) => Array.isArray(child) && child[0] === "ID");
		return {
			type,
			name,
			conversion_factor: conversionFactor,
			id: idNode ? {
				authority: idNode[1],
				code: parseInt(idNode[2], 10)
			} : null
		};
	}
	static convertAxis(node) {
		const name = node[1] || "Unknown";
		let direction;
		const abbreviationMatch = name.match(/^\((.)\)$/);
		if (abbreviationMatch) {
			const abbreviation = abbreviationMatch[1].toUpperCase();
			if (abbreviation === "E") direction = "east";
			else if (abbreviation === "N") direction = "north";
			else if (abbreviation === "U") direction = "up";
			else if (node[2]) direction = node[2];
			else throw new Error(`Unknown axis abbreviation: ${abbreviation}`);
		} else direction = node[2] || "unknown";
		const orderNode = node.find((child) => Array.isArray(child) && child[0] === "ORDER");
		const order = orderNode ? parseInt(orderNode[1], 10) : null;
		const unitNode = node.find((child) => Array.isArray(child) && (child[0] === "LENGTHUNIT" || child[0] === "ANGLEUNIT" || child[0] === "SCALEUNIT"));
		const unit = this.convertUnit(unitNode);
		return {
			name,
			direction,
			unit,
			order
		};
	}
	static extractAxes(node) {
		return node.filter((child) => Array.isArray(child) && child[0] === "AXIS").map((axis) => this.convertAxis(axis)).sort((a, b) => (a.order || 0) - (b.order || 0));
	}
	static convert(node, result = {}) {
		switch (node[0]) {
			case "PROJCRS":
				result.type = "ProjectedCRS";
				result.name = node[1];
				result.base_crs = node.find((child) => Array.isArray(child) && child[0] === "BASEGEOGCRS") ? this.convert(node.find((child) => Array.isArray(child) && child[0] === "BASEGEOGCRS")) : null;
				result.conversion = node.find((child) => Array.isArray(child) && child[0] === "CONVERSION") ? this.convert(node.find((child) => Array.isArray(child) && child[0] === "CONVERSION")) : null;
				const csNode = node.find((child) => Array.isArray(child) && child[0] === "CS");
				if (csNode) result.coordinate_system = {
					subtype: csNode[1],
					axis: this.extractAxes(node)
				};
				const lengthUnitNode = node.find((child) => Array.isArray(child) && child[0] === "LENGTHUNIT");
				if (lengthUnitNode) {
					const unit = this.convertUnit(lengthUnitNode);
					result.coordinate_system.unit = unit;
				}
				result.id = this.getId(node);
				break;
			case "BASEGEOGCRS":
			case "GEOGCRS":
			case "GEODCRS":
				result.type = node[0] === "GEODCRS" ? "GeodeticCRS" : "GeographicCRS";
				result.name = node[1];
				const datumOrEnsembleNode = node.find((child) => Array.isArray(child) && (child[0] === "DATUM" || child[0] === "ENSEMBLE"));
				if (datumOrEnsembleNode) {
					const datumOrEnsemble = this.convert(datumOrEnsembleNode);
					if (datumOrEnsembleNode[0] === "ENSEMBLE") result.datum_ensemble = datumOrEnsemble;
					else result.datum = datumOrEnsemble;
					const primem = node.find((child) => Array.isArray(child) && child[0] === "PRIMEM");
					if (primem && primem[1] !== "Greenwich") datumOrEnsemble.prime_meridian = {
						name: primem[1],
						longitude: parseFloat(primem[2])
					};
				}
				const geogCsNode = node.find((child) => Array.isArray(child) && child[0] === "CS");
				result.coordinate_system = {
					subtype: geogCsNode ? geogCsNode[1] : "ellipsoidal",
					axis: this.extractAxes(node)
				};
				result.id = this.getId(node);
				break;
			case "DATUM":
				result.type = "GeodeticReferenceFrame";
				result.name = node[1];
				result.ellipsoid = node.find((child) => Array.isArray(child) && child[0] === "ELLIPSOID") ? this.convert(node.find((child) => Array.isArray(child) && child[0] === "ELLIPSOID")) : null;
				break;
			case "ENSEMBLE":
				result.type = "DatumEnsemble";
				result.name = node[1];
				result.members = node.filter((child) => Array.isArray(child) && child[0] === "MEMBER").map((member) => ({
					type: "DatumEnsembleMember",
					name: member[1],
					id: this.getId(member)
				}));
				const accuracyNode = node.find((child) => Array.isArray(child) && child[0] === "ENSEMBLEACCURACY");
				if (accuracyNode) result.accuracy = parseFloat(accuracyNode[1]);
				const ellipsoidNode = node.find((child) => Array.isArray(child) && child[0] === "ELLIPSOID");
				if (ellipsoidNode) result.ellipsoid = this.convert(ellipsoidNode);
				result.id = this.getId(node);
				break;
			case "ELLIPSOID":
				result.type = "Ellipsoid";
				result.name = node[1];
				result.semi_major_axis = parseFloat(node[2]);
				result.inverse_flattening = parseFloat(node[3]);
				node.find((child) => Array.isArray(child) && child[0] === "LENGTHUNIT") && this.convert(node.find((child) => Array.isArray(child) && child[0] === "LENGTHUNIT"), result);
				break;
			case "CONVERSION":
				result.type = "Conversion";
				result.name = node[1];
				result.method = node.find((child) => Array.isArray(child) && child[0] === "METHOD") ? this.convert(node.find((child) => Array.isArray(child) && child[0] === "METHOD")) : null;
				result.parameters = node.filter((child) => Array.isArray(child) && child[0] === "PARAMETER").map((param) => this.convert(param));
				break;
			case "METHOD":
				result.type = "Method";
				result.name = node[1];
				result.id = this.getId(node);
				break;
			case "PARAMETER":
				result.type = "Parameter";
				result.name = node[1];
				result.value = parseFloat(node[2]);
				result.unit = this.convertUnit(node.find((child) => Array.isArray(child) && (child[0] === "LENGTHUNIT" || child[0] === "ANGLEUNIT" || child[0] === "SCALEUNIT")));
				result.id = this.getId(node);
				break;
			case "BOUNDCRS":
				result.type = "BoundCRS";
				const sourceCrsNode = node.find((child) => Array.isArray(child) && child[0] === "SOURCECRS");
				if (sourceCrsNode) {
					const sourceCrsContent = sourceCrsNode.find((child) => Array.isArray(child));
					result.source_crs = sourceCrsContent ? this.convert(sourceCrsContent) : null;
				}
				const targetCrsNode = node.find((child) => Array.isArray(child) && child[0] === "TARGETCRS");
				if (targetCrsNode) {
					const targetCrsContent = targetCrsNode.find((child) => Array.isArray(child));
					result.target_crs = targetCrsContent ? this.convert(targetCrsContent) : null;
				}
				const transformationNode = node.find((child) => Array.isArray(child) && child[0] === "ABRIDGEDTRANSFORMATION");
				if (transformationNode) result.transformation = this.convert(transformationNode);
				else result.transformation = null;
				break;
			case "ABRIDGEDTRANSFORMATION":
				result.type = "Transformation";
				result.name = node[1];
				result.method = node.find((child) => Array.isArray(child) && child[0] === "METHOD") ? this.convert(node.find((child) => Array.isArray(child) && child[0] === "METHOD")) : null;
				result.parameters = node.filter((child) => Array.isArray(child) && (child[0] === "PARAMETER" || child[0] === "PARAMETERFILE")).map((param) => {
					if (param[0] === "PARAMETER") return this.convert(param);
					else if (param[0] === "PARAMETERFILE") return {
						name: param[1],
						value: param[2],
						id: {
							"authority": "EPSG",
							"code": 8656
						}
					};
				});
				if (result.parameters.length === 7) {
					const scaleDifference = result.parameters[6];
					if (scaleDifference.name === "Scale difference") scaleDifference.value = Math.round((scaleDifference.value - 1) * 0xe8d4a51000) / 1e6;
				}
				result.id = this.getId(node);
				break;
			case "AXIS":
				if (!result.coordinate_system) result.coordinate_system = {
					type: "unspecified",
					axis: []
				};
				result.coordinate_system.axis.push(this.convertAxis(node));
				break;
			case "LENGTHUNIT":
				const unit = this.convertUnit(node, "LinearUnit");
				if (result.coordinate_system && result.coordinate_system.axis) result.coordinate_system.axis.forEach((axis) => {
					if (!axis.unit) axis.unit = unit;
				});
				if (unit.conversion_factor && unit.conversion_factor !== 1) {
					if (result.semi_major_axis) result.semi_major_axis = {
						value: result.semi_major_axis,
						unit
					};
				}
				break;
			default: result.keyword = node[0];
		}
		return result;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/wkt-parser@1.5.6/node_modules/wkt-parser/buildPROJJSON.js
/**
* Builds a PROJJSON object from a WKT array structure.
* @param {Array} root The root WKT array node.
* @returns {Object} The PROJJSON object.
*/
function buildPROJJSON(root) {
	return PROJJSONBuilderBase.convert(root);
}
//#endregion
//#region ../../node_modules/.pnpm/wkt-parser@1.5.6/node_modules/wkt-parser/detectWKTVersion.js
/**
* Detects whether the WKT string is WKT1 or WKT2.
* @param {string} wkt The WKT string.
* @returns {string} The detected version ("WKT1" or "WKT2").
*/
function detectWKTVersion(wkt) {
	const normalizedWKT = wkt.toUpperCase();
	if (normalizedWKT.includes("PROJCRS") || normalizedWKT.includes("GEOGCRS") || normalizedWKT.includes("BOUNDCRS") || normalizedWKT.includes("VERTCRS") || normalizedWKT.includes("LENGTHUNIT") || normalizedWKT.includes("ANGLEUNIT") || normalizedWKT.includes("SCALEUNIT")) return "WKT2";
	if (normalizedWKT.includes("PROJCS") || normalizedWKT.includes("GEOGCS") || normalizedWKT.includes("LOCAL_CS") || normalizedWKT.includes("VERT_CS") || normalizedWKT.includes("UNIT")) return "WKT1";
	return "WKT1";
}
//#endregion
//#region ../../node_modules/.pnpm/wkt-parser@1.5.6/node_modules/wkt-parser/parser.js
var parser_default = parseString;
var NEUTRAL = 1;
var KEYWORD = 2;
var NUMBER = 3;
var QUOTED = 4;
var AFTERQUOTE = 5;
var ENDED = -1;
var whitespace = /\s/;
var latin = /[A-Za-z]/;
var keyword = /[A-Za-z84_]/;
var endThings = /[,\]]/;
var digets = /[\d\.E\-\+]/;
function Parser(text) {
	if (typeof text !== "string") throw new Error("not a string");
	this.text = text.trim();
	this.level = 0;
	this.place = 0;
	this.root = null;
	this.stack = [];
	this.currentObject = null;
	this.state = NEUTRAL;
}
Parser.prototype.readCharicter = function() {
	var char = this.text[this.place++];
	if (this.state !== QUOTED) while (whitespace.test(char)) {
		if (this.place >= this.text.length) return;
		char = this.text[this.place++];
	}
	switch (this.state) {
		case NEUTRAL: return this.neutral(char);
		case KEYWORD: return this.keyword(char);
		case QUOTED: return this.quoted(char);
		case AFTERQUOTE: return this.afterquote(char);
		case NUMBER: return this.number(char);
		case ENDED: return;
	}
};
Parser.prototype.afterquote = function(char) {
	if (char === "\"") {
		this.word += "\"";
		this.state = QUOTED;
		return;
	}
	if (endThings.test(char)) {
		this.word = this.word.trim();
		this.afterItem(char);
		return;
	}
	throw new Error("havn't handled \"" + char + "\" in afterquote yet, index " + this.place);
};
Parser.prototype.afterItem = function(char) {
	if (char === ",") {
		if (this.word !== null) this.currentObject.push(this.word);
		this.word = null;
		this.state = NEUTRAL;
		return;
	}
	if (char === "]") {
		this.level--;
		if (this.word !== null) {
			this.currentObject.push(this.word);
			this.word = null;
		}
		this.state = NEUTRAL;
		this.currentObject = this.stack.pop();
		if (!this.currentObject) this.state = ENDED;
		return;
	}
};
Parser.prototype.number = function(char) {
	if (digets.test(char)) {
		this.word += char;
		return;
	}
	if (endThings.test(char)) {
		this.word = parseFloat(this.word);
		this.afterItem(char);
		return;
	}
	throw new Error("havn't handled \"" + char + "\" in number yet, index " + this.place);
};
Parser.prototype.quoted = function(char) {
	if (char === "\"") {
		this.state = AFTERQUOTE;
		return;
	}
	this.word += char;
};
Parser.prototype.keyword = function(char) {
	if (keyword.test(char)) {
		this.word += char;
		return;
	}
	if (char === "[") {
		var newObjects = [];
		newObjects.push(this.word);
		this.level++;
		if (this.root === null) this.root = newObjects;
		else this.currentObject.push(newObjects);
		this.stack.push(this.currentObject);
		this.currentObject = newObjects;
		this.state = NEUTRAL;
		return;
	}
	if (endThings.test(char)) {
		this.afterItem(char);
		return;
	}
	throw new Error("havn't handled \"" + char + "\" in keyword yet, index " + this.place);
};
Parser.prototype.neutral = function(char) {
	if (latin.test(char)) {
		this.word = char;
		this.state = KEYWORD;
		return;
	}
	if (char === "\"") {
		this.word = "";
		this.state = QUOTED;
		return;
	}
	if (digets.test(char)) {
		this.word = char;
		this.state = NUMBER;
		return;
	}
	if (endThings.test(char)) {
		this.afterItem(char);
		return;
	}
	throw new Error("havn't handled \"" + char + "\" in neutral yet, index " + this.place);
};
Parser.prototype.output = function() {
	while (this.place < this.text.length) this.readCharicter();
	if (this.state === ENDED) return this.root;
	throw new Error("unable to parse string \"" + this.text + "\". State is " + this.state);
};
function parseString(txt) {
	return new Parser(txt).output();
}
//#endregion
//#region ../../node_modules/.pnpm/wkt-parser@1.5.6/node_modules/wkt-parser/process.js
function mapit(obj, key, value) {
	if (Array.isArray(key)) {
		value.unshift(key);
		key = null;
	}
	var thing = key ? {} : obj;
	var out = value.reduce(function(newObj, item) {
		sExpr(item, newObj);
		return newObj;
	}, thing);
	if (key) obj[key] = out;
}
function sExpr(v, obj) {
	if (!Array.isArray(v)) {
		obj[v] = true;
		return;
	}
	var key = v.shift();
	if (key === "PARAMETER") key = v.shift();
	if (v.length === 1) {
		if (Array.isArray(v[0])) {
			obj[key] = {};
			sExpr(v[0], obj[key]);
			return;
		}
		obj[key] = v[0];
		return;
	}
	if (!v.length) {
		obj[key] = true;
		return;
	}
	if (key === "TOWGS84") {
		obj[key] = v;
		return;
	}
	if (key === "AXIS") {
		if (!(key in obj)) obj[key] = [];
		obj[key].push(v);
		return;
	}
	if (!Array.isArray(key)) obj[key] = {};
	var i;
	switch (key) {
		case "UNIT":
		case "PRIMEM":
		case "VERT_DATUM":
			obj[key] = {
				name: v[0].toLowerCase(),
				convert: v[1]
			};
			if (v.length === 3) sExpr(v[2], obj[key]);
			return;
		case "SPHEROID":
		case "ELLIPSOID":
			obj[key] = {
				name: v[0],
				a: v[1],
				rf: v[2]
			};
			if (v.length === 4) sExpr(v[3], obj[key]);
			return;
		case "EDATUM":
		case "ENGINEERINGDATUM":
		case "LOCAL_DATUM":
		case "DATUM":
		case "VERT_CS":
		case "VERTCRS":
		case "VERTICALCRS":
			v[0] = ["name", v[0]];
			mapit(obj, key, v);
			return;
		case "COMPD_CS":
		case "COMPOUNDCRS":
		case "FITTED_CS":
		case "PROJECTEDCRS":
		case "PROJCRS":
		case "GEOGCS":
		case "GEOCCS":
		case "PROJCS":
		case "LOCAL_CS":
		case "GEODCRS":
		case "GEODETICCRS":
		case "GEODETICDATUM":
		case "ENGCRS":
		case "ENGINEERINGCRS":
			v[0] = ["name", v[0]];
			mapit(obj, key, v);
			obj[key].type = key;
			return;
		default:
			i = -1;
			while (++i < v.length) if (!Array.isArray(v[i])) return sExpr(v, obj[key]);
			return mapit(obj, key, v);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/wkt-parser@1.5.6/node_modules/wkt-parser/util.js
var D2R = .017453292519943295;
function d2r(input) {
	return input * D2R;
}
function applyProjectionDefaults(wkt) {
	const normalizedProjName = (wkt.projName || "").toLowerCase().replace(/_/g, " ");
	if (wkt.long0 === void 0 && wkt.longc !== void 0) wkt.long0 = wkt.longc;
	if (!wkt.lat_ts && wkt.lat1 && (normalizedProjName === "stereographic south pole" || normalizedProjName === "polar stereographic (variant b)")) {
		wkt.lat0 = d2r(wkt.lat1 > 0 ? 90 : -90);
		wkt.lat_ts = wkt.lat1;
		delete wkt.lat1;
	} else if (!wkt.lat_ts && wkt.lat0 && (normalizedProjName === "polar stereographic" || normalizedProjName === "polar stereographic (variant a)")) {
		wkt.lat_ts = wkt.lat0;
		wkt.lat0 = d2r(wkt.lat0 > 0 ? 90 : -90);
		delete wkt.lat1;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/wkt-parser@1.5.6/node_modules/wkt-parser/transformPROJJSON.js
function processUnit(unit) {
	let result = {
		units: null,
		to_meter: void 0
	};
	if (typeof unit === "string") {
		result.units = unit.toLowerCase();
		if (result.units === "metre") result.units = "meter";
		if (result.units === "meter") result.to_meter = 1;
	} else if (unit && unit.name) {
		result.units = unit.name.toLowerCase();
		if (result.units === "metre") result.units = "meter";
		result.to_meter = unit.conversion_factor;
	}
	return result;
}
function toValue(valueOrObject) {
	if (typeof valueOrObject === "object") return valueOrObject.value * valueOrObject.unit.conversion_factor;
	return valueOrObject;
}
function calculateEllipsoid(value, result) {
	if (value.ellipsoid.radius) {
		result.a = value.ellipsoid.radius;
		result.rf = 0;
	} else {
		result.a = toValue(value.ellipsoid.semi_major_axis);
		if (value.ellipsoid.inverse_flattening !== void 0) result.rf = value.ellipsoid.inverse_flattening;
		else if (value.ellipsoid.semi_major_axis !== void 0 && value.ellipsoid.semi_minor_axis !== void 0) result.rf = result.a / (result.a - toValue(value.ellipsoid.semi_minor_axis));
	}
}
function transformPROJJSON(projjson, result = {}) {
	if (!projjson || typeof projjson !== "object") return projjson;
	if (projjson.type === "BoundCRS") {
		transformPROJJSON(projjson.source_crs, result);
		if (projjson.transformation) if (projjson.transformation.method && projjson.transformation.method.name === "NTv2") result.nadgrids = projjson.transformation.parameters[0].value;
		else result.datum_params = projjson.transformation.parameters.map((param) => param.value);
		return result;
	}
	Object.keys(projjson).forEach((key) => {
		const value = projjson[key];
		if (value === null) return;
		switch (key) {
			case "name":
				if (result.srsCode) break;
				result.name = value;
				result.srsCode = value;
				break;
			case "type":
				if (value === "GeographicCRS") result.projName = "longlat";
				else if (value === "GeodeticCRS") if (projjson.coordinate_system && projjson.coordinate_system.subtype === "Cartesian") result.projName = "geocent";
				else result.projName = "longlat";
				else if (value === "ProjectedCRS" && projjson.conversion && projjson.conversion.method) result.projName = projjson.conversion.method.name;
				break;
			case "datum":
			case "datum_ensemble":
				if (value.ellipsoid) {
					result.ellps = value.ellipsoid.name;
					calculateEllipsoid(value, result);
				}
				if (value.prime_meridian) result.from_greenwich = value.prime_meridian.longitude * Math.PI / 180;
				break;
			case "ellipsoid":
				result.ellps = value.name;
				calculateEllipsoid(value, result);
				break;
			case "prime_meridian":
				result.long0 = (value.longitude || 0) * Math.PI / 180;
				break;
			case "coordinate_system":
				if (value.axis) {
					const directionMap = {
						"east": "e",
						"north": "n",
						"west": "w",
						"south": "s",
						"up": "u",
						"down": "d",
						"geocentricx": "e",
						"geocentricy": "n",
						"geocentricz": "u"
					};
					const mapped = value.axis.map((axis) => directionMap[axis.direction.toLowerCase()]);
					if (mapped.every(Boolean)) {
						result.axis = mapped.join("");
						if (result.axis.length === 2) result.axis += "u";
					}
					if (value.unit) {
						const { units, to_meter } = processUnit(value.unit);
						result.units = units;
						result.to_meter = to_meter;
					} else if (value.axis[0] && value.axis[0].unit) {
						const { units, to_meter } = processUnit(value.axis[0].unit);
						result.units = units;
						result.to_meter = to_meter;
					}
				}
				break;
			case "id":
				if (value.authority && value.code) result.title = value.authority + ":" + value.code;
				break;
			case "conversion":
				if (value.method && value.method.name) result.projName = value.method.name;
				if (value.parameters) value.parameters.forEach((param) => {
					const paramName = param.name.toLowerCase().replace(/\s+/g, "_");
					const paramValue = param.value;
					if (param.unit && param.unit.conversion_factor) result[paramName] = paramValue * param.unit.conversion_factor;
					else if (param.unit === "degree") result[paramName] = paramValue * Math.PI / 180;
					else result[paramName] = paramValue;
				});
				break;
			case "unit":
				if (value.name) {
					result.units = value.name.toLowerCase();
					if (result.units === "metre") result.units = "meter";
				}
				if (value.conversion_factor) result.to_meter = value.conversion_factor;
				break;
			case "base_crs":
				transformPROJJSON(value, result);
				result.datumCode = value.id ? value.id.authority + "_" + value.id.code : value.name;
		}
	});
	if (result.latitude_of_false_origin !== void 0) result.lat0 = result.latitude_of_false_origin;
	if (result.longitude_of_false_origin !== void 0) result.long0 = result.longitude_of_false_origin;
	if (result.latitude_of_standard_parallel !== void 0) {
		result.lat0 = result.latitude_of_standard_parallel;
		result.lat1 = result.latitude_of_standard_parallel;
	}
	if (result.latitude_of_1st_standard_parallel !== void 0) result.lat1 = result.latitude_of_1st_standard_parallel;
	if (result.latitude_of_2nd_standard_parallel !== void 0) result.lat2 = result.latitude_of_2nd_standard_parallel;
	if (result.latitude_of_projection_centre !== void 0) result.lat0 = result.latitude_of_projection_centre;
	if (result.longitude_of_projection_centre !== void 0) result.longc = result.longitude_of_projection_centre;
	if (result.easting_at_false_origin !== void 0) result.x0 = result.easting_at_false_origin;
	if (result.northing_at_false_origin !== void 0) result.y0 = result.northing_at_false_origin;
	if (result.latitude_of_natural_origin !== void 0) result.lat0 = result.latitude_of_natural_origin;
	if (result.longitude_of_natural_origin !== void 0) result.long0 = result.longitude_of_natural_origin;
	if (result.longitude_of_origin !== void 0) result.long0 = result.longitude_of_origin;
	if (result.false_easting !== void 0) result.x0 = result.false_easting;
	if (result.easting_at_projection_centre) result.x0 = result.easting_at_projection_centre;
	if (result.false_northing !== void 0) result.y0 = result.false_northing;
	if (result.northing_at_projection_centre) result.y0 = result.northing_at_projection_centre;
	if (result.standard_parallel_1 !== void 0) result.lat1 = result.standard_parallel_1;
	if (result.standard_parallel_2 !== void 0) result.lat2 = result.standard_parallel_2;
	if (result.scale_factor_at_natural_origin !== void 0) result.k0 = result.scale_factor_at_natural_origin;
	if (result.scale_factor_at_projection_centre !== void 0) result.k0 = result.scale_factor_at_projection_centre;
	if (result.scale_factor_on_pseudo_standard_parallel !== void 0) result.k0 = result.scale_factor_on_pseudo_standard_parallel;
	if (result.azimuth !== void 0) result.alpha = result.azimuth;
	if (result.azimuth_at_projection_centre !== void 0) result.alpha = result.azimuth_at_projection_centre;
	if (result.angle_from_rectified_to_skew_grid) result.rectified_grid_angle = result.angle_from_rectified_to_skew_grid;
	applyProjectionDefaults(result);
	return result;
}
//#endregion
//#region ../../node_modules/.pnpm/wkt-parser@1.5.6/node_modules/wkt-parser/index.js
var knownTypes = [
	"PROJECTEDCRS",
	"PROJCRS",
	"GEOGCS",
	"GEOCCS",
	"PROJCS",
	"LOCAL_CS",
	"GEODCRS",
	"GEODETICCRS",
	"GEODETICDATUM",
	"ENGCRS",
	"ENGINEERINGCRS"
];
function rename(obj, params) {
	var outName = params[0];
	var inName = params[1];
	if (!(outName in obj) && inName in obj) {
		obj[outName] = obj[inName];
		if (params.length === 3) obj[outName] = params[2](obj[outName]);
	}
}
function cleanWKT(wkt) {
	var keys = Object.keys(wkt);
	for (var i = 0, ii = keys.length; i < ii; ++i) {
		var key = keys[i];
		if (knownTypes.indexOf(key) !== -1) setPropertiesFromWkt(wkt[key]);
		if (typeof wkt[key] === "object") cleanWKT(wkt[key]);
	}
}
function setPropertiesFromWkt(wkt) {
	if (wkt.AUTHORITY) {
		var authority = Object.keys(wkt.AUTHORITY)[0];
		if (authority && authority in wkt.AUTHORITY) wkt.title = authority + ":" + wkt.AUTHORITY[authority];
	}
	if (wkt.type === "GEOGCS") wkt.projName = "longlat";
	else if (wkt.type === "LOCAL_CS") {
		wkt.projName = "identity";
		wkt.local = true;
	} else if (typeof wkt.PROJECTION === "object") wkt.projName = Object.keys(wkt.PROJECTION)[0];
	else wkt.projName = wkt.PROJECTION;
	if (wkt.AXIS) {
		var axisOrder = "";
		for (var i = 0, ii = wkt.AXIS.length; i < ii; ++i) {
			var axis = [wkt.AXIS[i][0].toLowerCase(), wkt.AXIS[i][1].toLowerCase()];
			if (axis[0].indexOf("north") !== -1 || (axis[0] === "y" || axis[0] === "lat") && axis[1] === "north") axisOrder += "n";
			else if (axis[0].indexOf("south") !== -1 || (axis[0] === "y" || axis[0] === "lat") && axis[1] === "south") axisOrder += "s";
			else if (axis[0].indexOf("east") !== -1 || (axis[0] === "x" || axis[0] === "lon") && axis[1] === "east") axisOrder += "e";
			else if (axis[0].indexOf("west") !== -1 || (axis[0] === "x" || axis[0] === "lon") && axis[1] === "west") axisOrder += "w";
		}
		if (axisOrder.length === 2) axisOrder += "u";
		if (axisOrder.length === 3) wkt.axis = axisOrder;
	}
	if (wkt.UNIT) {
		wkt.units = wkt.UNIT.name.toLowerCase();
		if (wkt.units === "metre") wkt.units = "meter";
		if (wkt.UNIT.convert) if (wkt.type === "GEOGCS") {
			if (wkt.DATUM && wkt.DATUM.SPHEROID) wkt.to_meter = wkt.UNIT.convert * wkt.DATUM.SPHEROID.a;
		} else wkt.to_meter = wkt.UNIT.convert;
	}
	var geogcs = wkt.GEOGCS;
	if (wkt.type === "GEOGCS") geogcs = wkt;
	if (geogcs) {
		if (geogcs.PRIMEM && geogcs.PRIMEM.convert) wkt.from_greenwich = d2r(geogcs.PRIMEM.convert);
		if (geogcs.DATUM) wkt.datumCode = geogcs.DATUM.name.toLowerCase();
		else wkt.datumCode = geogcs.name.toLowerCase();
		if (wkt.datumCode.slice(0, 2) === "d_") wkt.datumCode = wkt.datumCode.slice(2);
		if (wkt.datumCode === "new_zealand_1949") wkt.datumCode = "nzgd49";
		if (wkt.datumCode === "wgs_1984" || wkt.datumCode === "world_geodetic_system_1984") {
			if (wkt.PROJECTION === "Mercator_Auxiliary_Sphere") wkt.sphere = true;
			wkt.datumCode = "wgs84";
		}
		if (wkt.datumCode === "belge_1972") wkt.datumCode = "rnb72";
		if (geogcs.DATUM && geogcs.DATUM.SPHEROID) {
			wkt.ellps = geogcs.DATUM.SPHEROID.name.replace("_19", "").replace(/[Cc]larke\_18/, "clrk");
			if (wkt.ellps.toLowerCase().slice(0, 13) === "international") wkt.ellps = "intl";
			wkt.a = geogcs.DATUM.SPHEROID.a;
			wkt.rf = parseFloat(geogcs.DATUM.SPHEROID.rf);
		}
		if (geogcs.DATUM && geogcs.DATUM.TOWGS84) wkt.datum_params = geogcs.DATUM.TOWGS84;
		if (~wkt.datumCode.indexOf("osgb_1936")) wkt.datumCode = "osgb36";
		if (~wkt.datumCode.indexOf("osni_1952")) wkt.datumCode = "osni52";
		if (~wkt.datumCode.indexOf("tm65") || ~wkt.datumCode.indexOf("geodetic_datum_of_1965")) wkt.datumCode = "ire65";
		if (wkt.datumCode === "ch1903+") wkt.datumCode = "ch1903";
		if (~wkt.datumCode.indexOf("israel")) wkt.datumCode = "isr93";
	}
	if (wkt.b && !isFinite(wkt.b)) wkt.b = wkt.a;
	if (wkt.rectified_grid_angle) wkt.rectified_grid_angle = d2r(wkt.rectified_grid_angle);
	function toMeter(input) {
		return input * (wkt.to_meter || 1);
	}
	var renamer = function(a) {
		return rename(wkt, a);
	};
	[
		["standard_parallel_1", "Standard_Parallel_1"],
		["standard_parallel_1", "Latitude of 1st standard parallel"],
		["standard_parallel_2", "Standard_Parallel_2"],
		["standard_parallel_2", "Latitude of 2nd standard parallel"],
		["false_easting", "False_Easting"],
		["false_easting", "False easting"],
		["false-easting", "Easting at false origin"],
		["false_northing", "False_Northing"],
		["false_northing", "False northing"],
		["false_northing", "Northing at false origin"],
		["central_meridian", "Central_Meridian"],
		["central_meridian", "Longitude of natural origin"],
		["central_meridian", "Longitude of false origin"],
		["latitude_of_origin", "Latitude_Of_Origin"],
		["latitude_of_origin", "Central_Parallel"],
		["latitude_of_origin", "Latitude of natural origin"],
		["latitude_of_origin", "Latitude of false origin"],
		["scale_factor", "Scale_Factor"],
		["k0", "scale_factor"],
		["latitude_of_center", "Latitude_Of_Center"],
		["latitude_of_center", "Latitude_of_center"],
		[
			"lat0",
			"latitude_of_center",
			d2r
		],
		["longitude_of_center", "Longitude_Of_Center"],
		["longitude_of_center", "Longitude_of_center"],
		[
			"longc",
			"longitude_of_center",
			d2r
		],
		[
			"x0",
			"false_easting",
			toMeter
		],
		[
			"y0",
			"false_northing",
			toMeter
		],
		[
			"long0",
			"central_meridian",
			d2r
		],
		[
			"lat0",
			"latitude_of_origin",
			d2r
		],
		[
			"lat0",
			"standard_parallel_1",
			d2r
		],
		[
			"lat1",
			"standard_parallel_1",
			d2r
		],
		[
			"lat2",
			"standard_parallel_2",
			d2r
		],
		["azimuth", "Azimuth"],
		[
			"alpha",
			"azimuth",
			d2r
		],
		["srsCode", "name"]
	].forEach(renamer);
	applyProjectionDefaults(wkt);
}
function wkt_parser_default(wkt) {
	if (typeof wkt === "object") return transformPROJJSON(wkt);
	const version = detectWKTVersion(wkt);
	var lisp = parser_default(wkt);
	if (version === "WKT2") return transformPROJJSON(buildPROJJSON(lisp));
	var type = lisp[0];
	var obj = {};
	sExpr(lisp, obj);
	cleanWKT(obj);
	return obj[type];
}
//#endregion
//#region ../../node_modules/.pnpm/mgrs@1.0.0/node_modules/mgrs/mgrs.js
/**
* UTM zones are grouped, and assigned to one of a group of 6
* sets.
*
* {int} @private
*/
var NUM_100K_SETS = 6;
/**
* The column letters (for easting) of the lower left value, per
* set.
*
* {string} @private
*/
var SET_ORIGIN_COLUMN_LETTERS = "AJSAJS";
/**
* The row letters (for northing) of the lower left value, per
* set.
*
* {string} @private
*/
var SET_ORIGIN_ROW_LETTERS = "AFAFAF";
var A = 65;
var I = 73;
var O = 79;
var V = 86;
var Z = 90;
var mgrs_default = {
	forward,
	inverse,
	toPoint
};
/**
* Conversion of lat/lon to MGRS.
*
* @param {object} ll Object literal with lat and lon properties on a
*     WGS84 ellipsoid.
* @param {int} accuracy Accuracy in digits (5 for 1 m, 4 for 10 m, 3 for
*      100 m, 2 for 1000 m or 1 for 10000 m). Optional, default is 5.
* @return {string} the MGRS string for the given location and accuracy.
*/
function forward(ll, accuracy) {
	accuracy = accuracy || 5;
	return encode(LLtoUTM({
		lat: ll[1],
		lon: ll[0]
	}), accuracy);
}
/**
* Conversion of MGRS to lat/lon.
*
* @param {string} mgrs MGRS string.
* @return {array} An array with left (longitude), bottom (latitude), right
*     (longitude) and top (latitude) values in WGS84, representing the
*     bounding box for the provided MGRS reference.
*/
function inverse(mgrs) {
	var bbox = UTMtoLL(decode(mgrs.toUpperCase()));
	if (bbox.lat && bbox.lon) return [
		bbox.lon,
		bbox.lat,
		bbox.lon,
		bbox.lat
	];
	return [
		bbox.left,
		bbox.bottom,
		bbox.right,
		bbox.top
	];
}
function toPoint(mgrs) {
	var bbox = UTMtoLL(decode(mgrs.toUpperCase()));
	if (bbox.lat && bbox.lon) return [bbox.lon, bbox.lat];
	return [(bbox.left + bbox.right) / 2, (bbox.top + bbox.bottom) / 2];
}
/**
* Conversion from degrees to radians.
*
* @private
* @param {number} deg the angle in degrees.
* @return {number} the angle in radians.
*/
function degToRad(deg) {
	return deg * (Math.PI / 180);
}
/**
* Conversion from radians to degrees.
*
* @private
* @param {number} rad the angle in radians.
* @return {number} the angle in degrees.
*/
function radToDeg(rad) {
	return 180 * (rad / Math.PI);
}
/**
* Converts a set of Longitude and Latitude co-ordinates to UTM
* using the WGS84 ellipsoid.
*
* @private
* @param {object} ll Object literal with lat and lon properties
*     representing the WGS84 coordinate to be converted.
* @return {object} Object literal containing the UTM value with easting,
*     northing, zoneNumber and zoneLetter properties, and an optional
*     accuracy property in digits. Returns null if the conversion failed.
*/
function LLtoUTM(ll) {
	var Lat = ll.lat;
	var Long = ll.lon;
	var a = 6378137;
	var eccSquared = .00669438;
	var k0 = .9996;
	var LongOrigin;
	var eccPrimeSquared;
	var N, T, C, A, M;
	var LatRad = degToRad(Lat);
	var LongRad = degToRad(Long);
	var LongOriginRad;
	var ZoneNumber = Math.floor((Long + 180) / 6) + 1;
	if (Long === 180) ZoneNumber = 60;
	if (Lat >= 56 && Lat < 64 && Long >= 3 && Long < 12) ZoneNumber = 32;
	if (Lat >= 72 && Lat < 84) {
		if (Long >= 0 && Long < 9) ZoneNumber = 31;
		else if (Long >= 9 && Long < 21) ZoneNumber = 33;
		else if (Long >= 21 && Long < 33) ZoneNumber = 35;
		else if (Long >= 33 && Long < 42) ZoneNumber = 37;
	}
	LongOrigin = (ZoneNumber - 1) * 6 - 180 + 3;
	LongOriginRad = degToRad(LongOrigin);
	eccPrimeSquared = eccSquared / (1 - eccSquared);
	N = a / Math.sqrt(1 - eccSquared * Math.sin(LatRad) * Math.sin(LatRad));
	T = Math.tan(LatRad) * Math.tan(LatRad);
	C = eccPrimeSquared * Math.cos(LatRad) * Math.cos(LatRad);
	A = Math.cos(LatRad) * (LongRad - LongOriginRad);
	M = a * ((1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * eccSquared * eccSquared * eccSquared / 256) * LatRad - (3 * eccSquared / 8 + 3 * eccSquared * eccSquared / 32 + 45 * eccSquared * eccSquared * eccSquared / 1024) * Math.sin(2 * LatRad) + (15 * eccSquared * eccSquared / 256 + 45 * eccSquared * eccSquared * eccSquared / 1024) * Math.sin(4 * LatRad) - 35 * eccSquared * eccSquared * eccSquared / 3072 * Math.sin(6 * LatRad));
	var UTMEasting = k0 * N * (A + (1 - T + C) * A * A * A / 6 + (5 - 18 * T + T * T + 72 * C - 58 * eccPrimeSquared) * A * A * A * A * A / 120) + 5e5;
	var UTMNorthing = k0 * (M + N * Math.tan(LatRad) * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24 + (61 - 58 * T + T * T + 600 * C - 330 * eccPrimeSquared) * A * A * A * A * A * A / 720));
	if (Lat < 0) UTMNorthing += 1e7;
	return {
		northing: Math.round(UTMNorthing),
		easting: Math.round(UTMEasting),
		zoneNumber: ZoneNumber,
		zoneLetter: getLetterDesignator(Lat)
	};
}
/**
* Converts UTM coords to lat/long, using the WGS84 ellipsoid. This is a convenience
* class where the Zone can be specified as a single string eg."60N" which
* is then broken down into the ZoneNumber and ZoneLetter.
*
* @private
* @param {object} utm An object literal with northing, easting, zoneNumber
*     and zoneLetter properties. If an optional accuracy property is
*     provided (in meters), a bounding box will be returned instead of
*     latitude and longitude.
* @return {object} An object literal containing either lat and lon values
*     (if no accuracy was provided), or top, right, bottom and left values
*     for the bounding box calculated according to the provided accuracy.
*     Returns null if the conversion failed.
*/
function UTMtoLL(utm) {
	var UTMNorthing = utm.northing;
	var UTMEasting = utm.easting;
	var zoneLetter = utm.zoneLetter;
	var zoneNumber = utm.zoneNumber;
	if (zoneNumber < 0 || zoneNumber > 60) return null;
	var k0 = .9996;
	var a = 6378137;
	var eccSquared = .00669438;
	var eccPrimeSquared;
	var e1 = (1 - Math.sqrt(1 - eccSquared)) / (1 + Math.sqrt(1 - eccSquared));
	var N1, T1, C1, R1, D, M;
	var LongOrigin;
	var mu, phi1Rad;
	var x = UTMEasting - 5e5;
	var y = UTMNorthing;
	if (zoneLetter < "N") y -= 1e7;
	LongOrigin = (zoneNumber - 1) * 6 - 180 + 3;
	eccPrimeSquared = eccSquared / (1 - eccSquared);
	M = y / k0;
	mu = M / (a * (1 - eccSquared / 4 - 3 * eccSquared * eccSquared / 64 - 5 * eccSquared * eccSquared * eccSquared / 256));
	phi1Rad = mu + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * mu) + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32) * Math.sin(4 * mu) + 151 * e1 * e1 * e1 / 96 * Math.sin(6 * mu);
	N1 = a / Math.sqrt(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad));
	T1 = Math.tan(phi1Rad) * Math.tan(phi1Rad);
	C1 = eccPrimeSquared * Math.cos(phi1Rad) * Math.cos(phi1Rad);
	R1 = a * (1 - eccSquared) / Math.pow(1 - eccSquared * Math.sin(phi1Rad) * Math.sin(phi1Rad), 1.5);
	D = x / (N1 * k0);
	var lat = phi1Rad - N1 * Math.tan(phi1Rad) / R1 * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eccPrimeSquared) * D * D * D * D / 24 + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eccPrimeSquared - 3 * C1 * C1) * D * D * D * D * D * D / 720);
	lat = radToDeg(lat);
	var lon = (D - (1 + 2 * T1 + C1) * D * D * D / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eccPrimeSquared + 24 * T1 * T1) * D * D * D * D * D / 120) / Math.cos(phi1Rad);
	lon = LongOrigin + radToDeg(lon);
	var result;
	if (utm.accuracy) {
		var topRight = UTMtoLL({
			northing: utm.northing + utm.accuracy,
			easting: utm.easting + utm.accuracy,
			zoneLetter: utm.zoneLetter,
			zoneNumber: utm.zoneNumber
		});
		result = {
			top: topRight.lat,
			right: topRight.lon,
			bottom: lat,
			left: lon
		};
	} else result = {
		lat,
		lon
	};
	return result;
}
/**
* Calculates the MGRS letter designator for the given latitude.
*
* @private
* @param {number} lat The latitude in WGS84 to get the letter designator
*     for.
* @return {char} The letter designator.
*/
function getLetterDesignator(lat) {
	var LetterDesignator = "Z";
	if (84 >= lat && lat >= 72) LetterDesignator = "X";
	else if (72 > lat && lat >= 64) LetterDesignator = "W";
	else if (64 > lat && lat >= 56) LetterDesignator = "V";
	else if (56 > lat && lat >= 48) LetterDesignator = "U";
	else if (48 > lat && lat >= 40) LetterDesignator = "T";
	else if (40 > lat && lat >= 32) LetterDesignator = "S";
	else if (32 > lat && lat >= 24) LetterDesignator = "R";
	else if (24 > lat && lat >= 16) LetterDesignator = "Q";
	else if (16 > lat && lat >= 8) LetterDesignator = "P";
	else if (8 > lat && lat >= 0) LetterDesignator = "N";
	else if (0 > lat && lat >= -8) LetterDesignator = "M";
	else if (-8 > lat && lat >= -16) LetterDesignator = "L";
	else if (-16 > lat && lat >= -24) LetterDesignator = "K";
	else if (-24 > lat && lat >= -32) LetterDesignator = "J";
	else if (-32 > lat && lat >= -40) LetterDesignator = "H";
	else if (-40 > lat && lat >= -48) LetterDesignator = "G";
	else if (-48 > lat && lat >= -56) LetterDesignator = "F";
	else if (-56 > lat && lat >= -64) LetterDesignator = "E";
	else if (-64 > lat && lat >= -72) LetterDesignator = "D";
	else if (-72 > lat && lat >= -80) LetterDesignator = "C";
	return LetterDesignator;
}
/**
* Encodes a UTM location as MGRS string.
*
* @private
* @param {object} utm An object literal with easting, northing,
*     zoneLetter, zoneNumber
* @param {number} accuracy Accuracy in digits (1-5).
* @return {string} MGRS string for the given UTM location.
*/
function encode(utm, accuracy) {
	var seasting = "00000" + utm.easting, snorthing = "00000" + utm.northing;
	return utm.zoneNumber + utm.zoneLetter + get100kID(utm.easting, utm.northing, utm.zoneNumber) + seasting.substr(seasting.length - 5, accuracy) + snorthing.substr(snorthing.length - 5, accuracy);
}
/**
* Get the two letter 100k designator for a given UTM easting,
* northing and zone number value.
*
* @private
* @param {number} easting
* @param {number} northing
* @param {number} zoneNumber
* @return the two letter 100k designator for the given UTM location.
*/
function get100kID(easting, northing, zoneNumber) {
	var setParm = get100kSetForZone(zoneNumber);
	return getLetter100kID(Math.floor(easting / 1e5), Math.floor(northing / 1e5) % 20, setParm);
}
/**
* Given a UTM zone number, figure out the MGRS 100K set it is in.
*
* @private
* @param {number} i An UTM zone number.
* @return {number} the 100k set the UTM zone is in.
*/
function get100kSetForZone(i) {
	var setParm = i % NUM_100K_SETS;
	if (setParm === 0) setParm = NUM_100K_SETS;
	return setParm;
}
/**
* Get the two-letter MGRS 100k designator given information
* translated from the UTM northing, easting and zone number.
*
* @private
* @param {number} column the column index as it relates to the MGRS
*        100k set spreadsheet, created from the UTM easting.
*        Values are 1-8.
* @param {number} row the row index as it relates to the MGRS 100k set
*        spreadsheet, created from the UTM northing value. Values
*        are from 0-19.
* @param {number} parm the set block, as it relates to the MGRS 100k set
*        spreadsheet, created from the UTM zone. Values are from
*        1-60.
* @return two letter MGRS 100k code.
*/
function getLetter100kID(column, row, parm) {
	var index = parm - 1;
	var colOrigin = SET_ORIGIN_COLUMN_LETTERS.charCodeAt(index);
	var rowOrigin = SET_ORIGIN_ROW_LETTERS.charCodeAt(index);
	var colInt = colOrigin + column - 1;
	var rowInt = rowOrigin + row;
	var rollover = false;
	if (colInt > Z) {
		colInt = colInt - Z + A - 1;
		rollover = true;
	}
	if (colInt === I || colOrigin < I && colInt > I || (colInt > I || colOrigin < I) && rollover) colInt++;
	if (colInt === O || colOrigin < O && colInt > O || (colInt > O || colOrigin < O) && rollover) {
		colInt++;
		if (colInt === I) colInt++;
	}
	if (colInt > Z) colInt = colInt - Z + A - 1;
	if (rowInt > V) {
		rowInt = rowInt - V + A - 1;
		rollover = true;
	} else rollover = false;
	if (rowInt === I || rowOrigin < I && rowInt > I || (rowInt > I || rowOrigin < I) && rollover) rowInt++;
	if (rowInt === O || rowOrigin < O && rowInt > O || (rowInt > O || rowOrigin < O) && rollover) {
		rowInt++;
		if (rowInt === I) rowInt++;
	}
	if (rowInt > V) rowInt = rowInt - V + A - 1;
	return String.fromCharCode(colInt) + String.fromCharCode(rowInt);
}
/**
* Decode the UTM parameters from a MGRS string.
*
* @private
* @param {string} mgrsString an UPPERCASE coordinate string is expected.
* @return {object} An object literal with easting, northing, zoneLetter,
*     zoneNumber and accuracy (in meters) properties.
*/
function decode(mgrsString) {
	if (mgrsString && mgrsString.length === 0) throw "MGRSPoint coverting from nothing";
	var length = mgrsString.length;
	var hunK = null;
	var sb = "";
	var testChar;
	var i = 0;
	while (!/[A-Z]/.test(testChar = mgrsString.charAt(i))) {
		if (i >= 2) throw "MGRSPoint bad conversion from: " + mgrsString;
		sb += testChar;
		i++;
	}
	var zoneNumber = parseInt(sb, 10);
	if (i === 0 || i + 3 > length) throw "MGRSPoint bad conversion from: " + mgrsString;
	var zoneLetter = mgrsString.charAt(i++);
	if (zoneLetter <= "A" || zoneLetter === "B" || zoneLetter === "Y" || zoneLetter >= "Z" || zoneLetter === "I" || zoneLetter === "O") throw "MGRSPoint zone letter " + zoneLetter + " not handled: " + mgrsString;
	hunK = mgrsString.substring(i, i += 2);
	var set = get100kSetForZone(zoneNumber);
	var east100k = getEastingFromChar(hunK.charAt(0), set);
	var north100k = getNorthingFromChar(hunK.charAt(1), set);
	while (north100k < getMinNorthing(zoneLetter)) north100k += 2e6;
	var remainder = length - i;
	if (remainder % 2 !== 0) throw "MGRSPoint has to have an even number \nof digits after the zone letter and two 100km letters - front \nhalf for easting meters, second half for \nnorthing meters" + mgrsString;
	var sep = remainder / 2;
	var sepEasting = 0;
	var sepNorthing = 0;
	var accuracyBonus, sepEastingString, sepNorthingString, easting, northing;
	if (sep > 0) {
		accuracyBonus = 1e5 / Math.pow(10, sep);
		sepEastingString = mgrsString.substring(i, i + sep);
		sepEasting = parseFloat(sepEastingString) * accuracyBonus;
		sepNorthingString = mgrsString.substring(i + sep);
		sepNorthing = parseFloat(sepNorthingString) * accuracyBonus;
	}
	easting = sepEasting + east100k;
	northing = sepNorthing + north100k;
	return {
		easting,
		northing,
		zoneLetter,
		zoneNumber,
		accuracy: accuracyBonus
	};
}
/**
* Given the first letter from a two-letter MGRS 100k zone, and given the
* MGRS table set for the zone number, figure out the easting value that
* should be added to the other, secondary easting value.
*
* @private
* @param {char} e The first letter from a two-letter MGRS 100´k zone.
* @param {number} set The MGRS table set for the zone number.
* @return {number} The easting value for the given letter and set.
*/
function getEastingFromChar(e, set) {
	var curCol = SET_ORIGIN_COLUMN_LETTERS.charCodeAt(set - 1);
	var eastingValue = 1e5;
	var rewindMarker = false;
	while (curCol !== e.charCodeAt(0)) {
		curCol++;
		if (curCol === I) curCol++;
		if (curCol === O) curCol++;
		if (curCol > Z) {
			if (rewindMarker) throw "Bad character: " + e;
			curCol = A;
			rewindMarker = true;
		}
		eastingValue += 1e5;
	}
	return eastingValue;
}
/**
* Given the second letter from a two-letter MGRS 100k zone, and given the
* MGRS table set for the zone number, figure out the northing value that
* should be added to the other, secondary northing value. You have to
* remember that Northings are determined from the equator, and the vertical
* cycle of letters mean a 2000000 additional northing meters. This happens
* approx. every 18 degrees of latitude. This method does *NOT* count any
* additional northings. You have to figure out how many 2000000 meters need
* to be added for the zone letter of the MGRS coordinate.
*
* @private
* @param {char} n Second letter of the MGRS 100k zone
* @param {number} set The MGRS table set number, which is dependent on the
*     UTM zone number.
* @return {number} The northing value for the given letter and set.
*/
function getNorthingFromChar(n, set) {
	if (n > "V") throw "MGRSPoint given invalid Northing " + n;
	var curRow = SET_ORIGIN_ROW_LETTERS.charCodeAt(set - 1);
	var northingValue = 0;
	var rewindMarker = false;
	while (curRow !== n.charCodeAt(0)) {
		curRow++;
		if (curRow === I) curRow++;
		if (curRow === O) curRow++;
		if (curRow > V) {
			if (rewindMarker) throw "Bad character: " + n;
			curRow = A;
			rewindMarker = true;
		}
		northingValue += 1e5;
	}
	return northingValue;
}
/**
* The function getMinNorthing returns the minimum northing value of a MGRS
* zone.
*
* Ported from Geotrans' c Lattitude_Band_Value structure table.
*
* @private
* @param {char} zoneLetter The MGRS zone to get the min northing for.
* @return {number}
*/
function getMinNorthing(zoneLetter) {
	var northing;
	switch (zoneLetter) {
		case "C":
			northing = 11e5;
			break;
		case "D":
			northing = 2e6;
			break;
		case "E":
			northing = 28e5;
			break;
		case "F":
			northing = 37e5;
			break;
		case "G":
			northing = 46e5;
			break;
		case "H":
			northing = 55e5;
			break;
		case "J":
			northing = 64e5;
			break;
		case "K":
			northing = 73e5;
			break;
		case "L":
			northing = 82e5;
			break;
		case "M":
			northing = 91e5;
			break;
		case "N":
			northing = 0;
			break;
		case "P":
			northing = 8e5;
			break;
		case "Q":
			northing = 17e5;
			break;
		case "R":
			northing = 26e5;
			break;
		case "S":
			northing = 35e5;
			break;
		case "T":
			northing = 44e5;
			break;
		case "U":
			northing = 53e5;
			break;
		case "V":
			northing = 62e5;
			break;
		case "W":
			northing = 7e6;
			break;
		case "X":
			northing = 79e5;
			break;
		default: northing = -1;
	}
	if (northing >= 0) return northing;
	else throw "Invalid zone letter: " + zoneLetter;
}
//#endregion
export { wkt_parser_default as i, mgrs_default as n, toPoint as r, forward as t };
