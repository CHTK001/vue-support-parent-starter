import { a as __toCommonJS, n as __esmMin, r as __exportAll, t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
//#region ../../node_modules/.pnpm/@prettier+plugin-xml@3.4.2_prettier@3.9.6/node_modules/@prettier/plugin-xml/src/languages.js
var languages_default = [
	{
		name: "Ant Build System",
		tmScope: "text.xml.ant",
		codemirrorMode: "xml",
		codemirrorMimeType: "application/xml",
		filenames: ["ant.xml", "build.xml"],
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 15,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "COLLADA",
		extensions: [".dae"],
		tmScope: "text.xml",
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 49,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "Eagle",
		extensions: [".sch", ".brd"],
		tmScope: "text.xml",
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 97,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "Genshi",
		extensions: [".kid"],
		tmScope: "text.xml.genshi",
		aliases: ["xml+genshi", "xml+kid"],
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 126,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "JetBrains MPS",
		extensions: [
			".mps",
			".mpl",
			".msd"
		],
		tmScope: "none",
		aliases: ["mps"],
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 465165328,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "LabVIEW",
		extensions: [
			".lvproj",
			".lvclass",
			".lvlib"
		],
		tmScope: "text.xml",
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 194,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "Maven POM",
		tmScope: "text.xml.pom",
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		group: "XML",
		filenames: ["pom.xml"],
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 226,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "SVG",
		extensions: [".svg"],
		tmScope: "text.xml.svg",
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 337,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "Web Ontology Language",
		extensions: [".owl"],
		tmScope: "text.xml",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 394,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "XML",
		extensions: [
			".adml",
			".admx",
			".ant",
			".axaml",
			".axml",
			".builds",
			".ccproj",
			".ccxml",
			".clixml",
			".cproject",
			".cscfg",
			".csdef",
			".csl",
			".csproj",
			".ct",
			".depproj",
			".dita",
			".ditamap",
			".ditaval",
			".dll.config",
			".dotsettings",
			".filters",
			".fsproj",
			".fxml",
			".glade",
			".gml",
			".gmx",
			".gpx",
			".grxml",
			".gst",
			".hzp",
			".iml",
			".inx",
			".ivy",
			".jelly",
			".jsproj",
			".kml",
			".launch",
			".mdpolicy",
			".mjml",
			".mm",
			".mod",
			".mojo",
			".mxml",
			".natvis",
			".ncl",
			".ndproj",
			".nproj",
			".nuspec",
			".odd",
			".osm",
			".pkgproj",
			".pluginspec",
			".proj",
			".props",
			".ps1xml",
			".psc1",
			".pt",
			".qhelp",
			".rdf",
			".res",
			".resx",
			".rs",
			".rss",
			".runsettings",
			".sch",
			".scxml",
			".sfproj",
			".shproj",
			".slnx",
			".srdf",
			".storyboard",
			".sublime-snippet",
			".sw",
			".targets",
			".tml",
			".typ",
			".ui",
			".urdf",
			".ux",
			".vbproj",
			".vcxproj",
			".vsixmanifest",
			".vssettings",
			".vstemplate",
			".vxml",
			".wixproj",
			".workflow",
			".wsdl",
			".wsf",
			".wxi",
			".wxl",
			".wxs",
			".x3d",
			".xacro",
			".xaml",
			".xib",
			".xlf",
			".xliff",
			".xmi",
			".xml",
			".xml.dist",
			".xmp",
			".xproj",
			".xsd",
			".xspec",
			".xul",
			".zcml"
		],
		tmScope: "text.xml",
		aliases: [
			"rss",
			"xsd",
			"wsdl"
		],
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		filenames: [
			".classpath",
			".cproject",
			".project",
			"App.config",
			"NuGet.config",
			"Settings.StyleCop",
			"Web.Debug.config",
			"Web.Release.config",
			"Web.config",
			"packages.config"
		],
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 399,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "XML Property List",
		extensions: [
			".plist",
			".stTheme",
			".tmCommand",
			".tmLanguage",
			".tmPreferences",
			".tmSnippet",
			".tmTheme"
		],
		tmScope: "text.xml.plist",
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		group: "XML",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 75622871,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "XPages",
		extensions: [".xsp-config", ".xsp.metadata"],
		tmScope: "text.xml",
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 400,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "XProc",
		extensions: [".xpl", ".xproc"],
		tmScope: "text.xml",
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 401,
		vscodeLanguageIds: ["xml"]
	},
	{
		name: "XSLT",
		extensions: [".xslt", ".xsl"],
		tmScope: "text.xml.xsl",
		aliases: ["xsl"],
		codemirrorMode: "xml",
		codemirrorMimeType: "text/xml",
		since: "0.1.0",
		parsers: ["xml"],
		linguistLanguageId: 404,
		vscodeLanguageIds: ["xml"]
	}
];
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/version.js
var VERSION$1;
var init_version = __esmMin((() => {
	VERSION$1 = "7.1.1";
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/utils/utils.js
function isEmpty(arr) {
	return arr && arr.length === 0;
}
function keys(obj) {
	if (obj === void 0 || obj === null) return [];
	return Object.keys(obj);
}
function values(obj) {
	var vals = [];
	var keys = Object.keys(obj);
	for (var i = 0; i < keys.length; i++) vals.push(obj[keys[i]]);
	return vals;
}
function mapValues(obj, callback) {
	var result = [];
	var objKeys = keys(obj);
	for (var idx = 0; idx < objKeys.length; idx++) {
		var currKey = objKeys[idx];
		result.push(callback.call(null, obj[currKey], currKey));
	}
	return result;
}
function map(arr, callback) {
	var result = [];
	for (var idx = 0; idx < arr.length; idx++) result.push(callback.call(null, arr[idx], idx));
	return result;
}
function flatten(arr) {
	var result = [];
	for (var idx = 0; idx < arr.length; idx++) {
		var currItem = arr[idx];
		if (Array.isArray(currItem)) result = result.concat(flatten(currItem));
		else result.push(currItem);
	}
	return result;
}
function first$1(arr) {
	return isEmpty(arr) ? void 0 : arr[0];
}
function last(arr) {
	var len = arr && arr.length;
	return len ? arr[len - 1] : void 0;
}
function forEach(collection, iteratorCallback) {
	/* istanbul ignore else */
	if (Array.isArray(collection)) for (var i = 0; i < collection.length; i++) iteratorCallback.call(null, collection[i], i);
	else if (isObject(collection)) {
		var colKeys = keys(collection);
		for (var i = 0; i < colKeys.length; i++) {
			var key = colKeys[i];
			var value = collection[key];
			iteratorCallback.call(null, value, key);
		}
	} else throw Error("non exhaustive match");
}
function isString(item) {
	return typeof item === "string";
}
function isUndefined(item) {
	return item === void 0;
}
function isFunction(item) {
	return item instanceof Function;
}
function drop(arr, howMuch) {
	if (howMuch === void 0) howMuch = 1;
	return arr.slice(howMuch, arr.length);
}
function dropRight(arr, howMuch) {
	if (howMuch === void 0) howMuch = 1;
	return arr.slice(0, arr.length - howMuch);
}
function filter(arr, predicate) {
	var result = [];
	if (Array.isArray(arr)) for (var i = 0; i < arr.length; i++) {
		var item = arr[i];
		if (predicate.call(null, item)) result.push(item);
	}
	return result;
}
function reject(arr, predicate) {
	return filter(arr, function(item) {
		return !predicate(item);
	});
}
function pick(obj, predicate) {
	var keys = Object.keys(obj);
	var result = {};
	for (var i = 0; i < keys.length; i++) {
		var currKey = keys[i];
		var currItem = obj[currKey];
		if (predicate(currItem)) result[currKey] = currItem;
	}
	return result;
}
function has(obj, prop) {
	if (isObject(obj)) return obj.hasOwnProperty(prop);
	return false;
}
function contains(arr, item) {
	return find(arr, function(currItem) {
		return currItem === item;
	}) !== void 0 ? true : false;
}
/**
* shallow clone
*/
function cloneArr(arr) {
	var newArr = [];
	for (var i = 0; i < arr.length; i++) newArr.push(arr[i]);
	return newArr;
}
/**
* shallow clone
*/
function cloneObj(obj) {
	var clonedObj = {};
	for (var key in obj)
 /* istanbul ignore else */
	if (Object.prototype.hasOwnProperty.call(obj, key)) clonedObj[key] = obj[key];
	return clonedObj;
}
function find(arr, predicate) {
	for (var i = 0; i < arr.length; i++) {
		var item = arr[i];
		if (predicate.call(null, item)) return item;
	}
}
function findAll(arr, predicate) {
	var found = [];
	for (var i = 0; i < arr.length; i++) {
		var item = arr[i];
		if (predicate.call(null, item)) found.push(item);
	}
	return found;
}
function reduce(arrOrObj, iterator, initial) {
	var isArr = Array.isArray(arrOrObj);
	var vals = isArr ? arrOrObj : values(arrOrObj);
	var objKeys = isArr ? [] : keys(arrOrObj);
	var accumulator = initial;
	for (var i = 0; i < vals.length; i++) accumulator = iterator.call(null, accumulator, vals[i], isArr ? i : objKeys[i]);
	return accumulator;
}
function compact(arr) {
	return reject(arr, function(item) {
		return item === null || item === void 0;
	});
}
function uniq(arr, identity) {
	if (identity === void 0) identity = function(item) {
		return item;
	};
	var identities = [];
	return reduce(arr, function(result, currItem) {
		var currIdentity = identity(currItem);
		if (contains(identities, currIdentity)) return result;
		else {
			identities.push(currIdentity);
			return result.concat(currItem);
		}
	}, []);
}
function isArray(obj) {
	return Array.isArray(obj);
}
function isRegExp(obj) {
	return obj instanceof RegExp;
}
function isObject(obj) {
	return obj instanceof Object;
}
function every(arr, predicate) {
	for (var i = 0; i < arr.length; i++) if (!predicate(arr[i], i)) return false;
	return true;
}
function difference(arr, values) {
	return reject(arr, function(item) {
		return contains(values, item);
	});
}
function some(arr, predicate) {
	for (var i = 0; i < arr.length; i++) if (predicate(arr[i])) return true;
	return false;
}
function indexOf(arr, value) {
	for (var i = 0; i < arr.length; i++) if (arr[i] === value) return i;
	return -1;
}
/**
* mutates! (and returns) target
*/
function assign(target) {
	var sources = [];
	for (var _i = 1; _i < arguments.length; _i++) sources[_i - 1] = arguments[_i];
	for (var i = 0; i < sources.length; i++) {
		var curSource = sources[i];
		var currSourceKeys = keys(curSource);
		for (var j = 0; j < currSourceKeys.length; j++) {
			var currKey = currSourceKeys[j];
			target[currKey] = curSource[currKey];
		}
	}
	return target;
}
/**
* mutates! (and returns) target
*/
function assignNoOverwrite(target) {
	var sources = [];
	for (var _i = 1; _i < arguments.length; _i++) sources[_i - 1] = arguments[_i];
	for (var i = 0; i < sources.length; i++) {
		var curSource = sources[i];
		var currSourceKeys = keys(curSource);
		for (var j = 0; j < currSourceKeys.length; j++) {
			var currKey = currSourceKeys[j];
			if (!has(target, currKey)) target[currKey] = curSource[currKey];
		}
	}
	return target;
}
function defaults() {
	var sources = [];
	for (var _i = 0; _i < arguments.length; _i++) sources[_i] = arguments[_i];
	return assignNoOverwrite.apply(null, [{}].concat(sources));
}
function groupBy(arr, groupKeyFunc) {
	var result = {};
	forEach(arr, function(item) {
		var currGroupKey = groupKeyFunc(item);
		var currGroupArr = result[currGroupKey];
		if (currGroupArr) currGroupArr.push(item);
		else result[currGroupKey] = [item];
	});
	return result;
}
/**
* Merge obj2 into obj1.
* Will overwrite existing properties with the same name
*/
function merge(obj1, obj2) {
	var result = cloneObj(obj1);
	var keys2 = keys(obj2);
	for (var i = 0; i < keys2.length; i++) {
		var key = keys2[i];
		result[key] = obj2[key];
	}
	return result;
}
function NOOP() {}
function IDENTITY(item) {
	return item;
}
/**
* Will return a new packed array with same values.
*/
function packArray(holeyArr) {
	var result = [];
	for (var i = 0; i < holeyArr.length; i++) {
		var orgValue = holeyArr[i];
		result.push(orgValue !== void 0 ? orgValue : void 0);
	}
	return result;
}
function PRINT_ERROR(msg) {
	/* istanbul ignore else - can't override global.console in node.js */
	if (console && console.error) console.error("Error: " + msg);
}
function PRINT_WARNING(msg) {
	/* istanbul ignore else - can't override global.console in node.js*/
	if (console && console.warn) console.warn("Warning: " + msg);
}
function isES2015MapSupported() {
	return typeof Map === "function";
}
function applyMixins(derivedCtor, baseCtors) {
	baseCtors.forEach(function(baseCtor) {
		var baseProto = baseCtor.prototype;
		Object.getOwnPropertyNames(baseProto).forEach(function(propName) {
			if (propName === "constructor") return;
			var basePropDescriptor = Object.getOwnPropertyDescriptor(baseProto, propName);
			if (basePropDescriptor && (basePropDescriptor.get || basePropDescriptor.set)) Object.defineProperty(derivedCtor.prototype, propName, basePropDescriptor);
			else derivedCtor.prototype[propName] = baseCtor.prototype[propName];
		});
	});
}
function toFastProperties(toBecomeFast) {
	function FakeConstructor() {}
	FakeConstructor.prototype = toBecomeFast;
	var fakeInstance = new FakeConstructor();
	function fakeAccess() {
		return typeof fakeInstance.bar;
	}
	fakeAccess();
	fakeAccess();
	return toBecomeFast;
}
function peek(arr) {
	return arr[arr.length - 1];
}
/* istanbul ignore next - for performance tracing*/
function timer(func) {
	var start = (/* @__PURE__ */ new Date()).getTime();
	var val = func();
	return {
		time: (/* @__PURE__ */ new Date()).getTime() - start,
		value: val
	};
}
var init_utils = __esmMin((() => {}));
//#endregion
//#region ../../node_modules/.pnpm/regexp-to-ast@0.5.0/node_modules/regexp-to-ast/lib/regexp-to-ast.js
var require_regexp_to_ast = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		// istanbul ignore next
		if (typeof define === "function" && define.amd)
 // istanbul ignore next
		define([], factory);
		else if (typeof module === "object" && module.exports) module.exports = factory();
		else
 // istanbul ignore next
		root.regexpToAst = factory();
	})(typeof self !== "undefined" ? self : exports, function() {
		function RegExpParser() {}
		RegExpParser.prototype.saveState = function() {
			return {
				idx: this.idx,
				input: this.input,
				groupIdx: this.groupIdx
			};
		};
		RegExpParser.prototype.restoreState = function(newState) {
			this.idx = newState.idx;
			this.input = newState.input;
			this.groupIdx = newState.groupIdx;
		};
		RegExpParser.prototype.pattern = function(input) {
			this.idx = 0;
			this.input = input;
			this.groupIdx = 0;
			this.consumeChar("/");
			var value = this.disjunction();
			this.consumeChar("/");
			var flags = {
				type: "Flags",
				loc: {
					begin: this.idx,
					end: input.length
				},
				global: false,
				ignoreCase: false,
				multiLine: false,
				unicode: false,
				sticky: false
			};
			while (this.isRegExpFlag()) switch (this.popChar()) {
				case "g":
					addFlag(flags, "global");
					break;
				case "i":
					addFlag(flags, "ignoreCase");
					break;
				case "m":
					addFlag(flags, "multiLine");
					break;
				case "u":
					addFlag(flags, "unicode");
					break;
				case "y": addFlag(flags, "sticky");
			}
			if (this.idx !== this.input.length) throw Error("Redundant input: " + this.input.substring(this.idx));
			return {
				type: "Pattern",
				flags,
				value,
				loc: this.loc(0)
			};
		};
		RegExpParser.prototype.disjunction = function() {
			var alts = [];
			var begin = this.idx;
			alts.push(this.alternative());
			while (this.peekChar() === "|") {
				this.consumeChar("|");
				alts.push(this.alternative());
			}
			return {
				type: "Disjunction",
				value: alts,
				loc: this.loc(begin)
			};
		};
		RegExpParser.prototype.alternative = function() {
			var terms = [];
			var begin = this.idx;
			while (this.isTerm()) terms.push(this.term());
			return {
				type: "Alternative",
				value: terms,
				loc: this.loc(begin)
			};
		};
		RegExpParser.prototype.term = function() {
			if (this.isAssertion()) return this.assertion();
			else return this.atom();
		};
		RegExpParser.prototype.assertion = function() {
			var begin = this.idx;
			switch (this.popChar()) {
				case "^": return {
					type: "StartAnchor",
					loc: this.loc(begin)
				};
				case "$": return {
					type: "EndAnchor",
					loc: this.loc(begin)
				};
				case "\\":
					switch (this.popChar()) {
						case "b": return {
							type: "WordBoundary",
							loc: this.loc(begin)
						};
						case "B": return {
							type: "NonWordBoundary",
							loc: this.loc(begin)
						};
					}
					// istanbul ignore next
					throw Error("Invalid Assertion Escape");
				case "(":
					this.consumeChar("?");
					var type;
					switch (this.popChar()) {
						case "=":
							type = "Lookahead";
							break;
						case "!": type = "NegativeLookahead";
					}
					ASSERT_EXISTS(type);
					var disjunction = this.disjunction();
					this.consumeChar(")");
					return {
						type,
						value: disjunction,
						loc: this.loc(begin)
					};
			}
			// istanbul ignore next
			ASSERT_NEVER_REACH_HERE();
		};
		RegExpParser.prototype.quantifier = function(isBacktracking) {
			var range;
			var begin = this.idx;
			switch (this.popChar()) {
				case "*":
					range = {
						atLeast: 0,
						atMost: Infinity
					};
					break;
				case "+":
					range = {
						atLeast: 1,
						atMost: Infinity
					};
					break;
				case "?":
					range = {
						atLeast: 0,
						atMost: 1
					};
					break;
				case "{":
					var atLeast = this.integerIncludingZero();
					switch (this.popChar()) {
						case "}":
							range = {
								atLeast,
								atMost: atLeast
							};
							break;
						case ",":
							var atMost;
							if (this.isDigit()) {
								atMost = this.integerIncludingZero();
								range = {
									atLeast,
									atMost
								};
							} else range = {
								atLeast,
								atMost: Infinity
							};
							this.consumeChar("}");
					}
					if (isBacktracking === true && range === void 0) return;
					ASSERT_EXISTS(range);
			}
			if (isBacktracking === true && range === void 0) return;
			ASSERT_EXISTS(range);
			if (this.peekChar(0) === "?") {
				this.consumeChar("?");
				range.greedy = false;
			} else range.greedy = true;
			range.type = "Quantifier";
			range.loc = this.loc(begin);
			return range;
		};
		RegExpParser.prototype.atom = function() {
			var atom;
			var begin = this.idx;
			switch (this.peekChar()) {
				case ".":
					atom = this.dotAll();
					break;
				case "\\":
					atom = this.atomEscape();
					break;
				case "[":
					atom = this.characterClass();
					break;
				case "(": atom = this.group();
			}
			if (atom === void 0 && this.isPatternCharacter()) atom = this.patternCharacter();
			ASSERT_EXISTS(atom);
			atom.loc = this.loc(begin);
			if (this.isQuantifier()) atom.quantifier = this.quantifier();
			return atom;
		};
		RegExpParser.prototype.dotAll = function() {
			this.consumeChar(".");
			return {
				type: "Set",
				complement: true,
				value: [
					cc("\n"),
					cc("\r"),
					cc("\u2028"),
					cc("\u2029")
				]
			};
		};
		RegExpParser.prototype.atomEscape = function() {
			this.consumeChar("\\");
			switch (this.peekChar()) {
				case "1":
				case "2":
				case "3":
				case "4":
				case "5":
				case "6":
				case "7":
				case "8":
				case "9": return this.decimalEscapeAtom();
				case "d":
				case "D":
				case "s":
				case "S":
				case "w":
				case "W": return this.characterClassEscape();
				case "f":
				case "n":
				case "r":
				case "t":
				case "v": return this.controlEscapeAtom();
				case "c": return this.controlLetterEscapeAtom();
				case "0": return this.nulCharacterAtom();
				case "x": return this.hexEscapeSequenceAtom();
				case "u": return this.regExpUnicodeEscapeSequenceAtom();
				default: return this.identityEscapeAtom();
			}
		};
		RegExpParser.prototype.decimalEscapeAtom = function() {
			return {
				type: "GroupBackReference",
				value: this.positiveInteger()
			};
		};
		RegExpParser.prototype.characterClassEscape = function() {
			var set;
			var complement = false;
			switch (this.popChar()) {
				case "d":
					set = digitsCharCodes;
					break;
				case "D":
					set = digitsCharCodes;
					complement = true;
					break;
				case "s":
					set = whitespaceCodes;
					break;
				case "S":
					set = whitespaceCodes;
					complement = true;
					break;
				case "w":
					set = wordCharCodes;
					break;
				case "W":
					set = wordCharCodes;
					complement = true;
			}
			ASSERT_EXISTS(set);
			return {
				type: "Set",
				value: set,
				complement
			};
		};
		RegExpParser.prototype.controlEscapeAtom = function() {
			var escapeCode;
			switch (this.popChar()) {
				case "f":
					escapeCode = cc("\f");
					break;
				case "n":
					escapeCode = cc("\n");
					break;
				case "r":
					escapeCode = cc("\r");
					break;
				case "t":
					escapeCode = cc("	");
					break;
				case "v": escapeCode = cc("\v");
			}
			ASSERT_EXISTS(escapeCode);
			return {
				type: "Character",
				value: escapeCode
			};
		};
		RegExpParser.prototype.controlLetterEscapeAtom = function() {
			this.consumeChar("c");
			var letter = this.popChar();
			if (/[a-zA-Z]/.test(letter) === false) throw Error("Invalid ");
			return {
				type: "Character",
				value: letter.toUpperCase().charCodeAt(0) - 64
			};
		};
		RegExpParser.prototype.nulCharacterAtom = function() {
			this.consumeChar("0");
			return {
				type: "Character",
				value: cc("\0")
			};
		};
		RegExpParser.prototype.hexEscapeSequenceAtom = function() {
			this.consumeChar("x");
			return this.parseHexDigits(2);
		};
		RegExpParser.prototype.regExpUnicodeEscapeSequenceAtom = function() {
			this.consumeChar("u");
			return this.parseHexDigits(4);
		};
		RegExpParser.prototype.identityEscapeAtom = function() {
			return {
				type: "Character",
				value: cc(this.popChar())
			};
		};
		RegExpParser.prototype.classPatternCharacterAtom = function() {
			switch (this.peekChar()) {
				// istanbul ignore next
				case "\n":
				// istanbul ignore next
				case "\r":
				// istanbul ignore next
				case "\u2028":
				// istanbul ignore next
				case "\u2029":
				// istanbul ignore next
				case "\\":
				// istanbul ignore next
				case "]": throw Error("TBD");
				default: return {
					type: "Character",
					value: cc(this.popChar())
				};
			}
		};
		RegExpParser.prototype.characterClass = function() {
			var set = [];
			var complement = false;
			this.consumeChar("[");
			if (this.peekChar(0) === "^") {
				this.consumeChar("^");
				complement = true;
			}
			while (this.isClassAtom()) {
				var from = this.classAtom();
				if (from.type === "Character" && this.isRangeDash()) {
					this.consumeChar("-");
					var to = this.classAtom();
					if (to.type === "Character") {
						if (to.value < from.value) throw Error("Range out of order in character class");
						set.push({
							from: from.value,
							to: to.value
						});
					} else {
						insertToSet(from.value, set);
						set.push(cc("-"));
						insertToSet(to.value, set);
					}
				} else insertToSet(from.value, set);
			}
			this.consumeChar("]");
			return {
				type: "Set",
				complement,
				value: set
			};
		};
		RegExpParser.prototype.classAtom = function() {
			switch (this.peekChar()) {
				// istanbul ignore next
				case "]":
				// istanbul ignore next
				case "\n":
				// istanbul ignore next
				case "\r":
				// istanbul ignore next
				case "\u2028":
				// istanbul ignore next
				case "\u2029": throw Error("TBD");
				case "\\": return this.classEscape();
				default: return this.classPatternCharacterAtom();
			}
		};
		RegExpParser.prototype.classEscape = function() {
			this.consumeChar("\\");
			switch (this.peekChar()) {
				case "b":
					this.consumeChar("b");
					return {
						type: "Character",
						value: cc("\b")
					};
				case "d":
				case "D":
				case "s":
				case "S":
				case "w":
				case "W": return this.characterClassEscape();
				case "f":
				case "n":
				case "r":
				case "t":
				case "v": return this.controlEscapeAtom();
				case "c": return this.controlLetterEscapeAtom();
				case "0": return this.nulCharacterAtom();
				case "x": return this.hexEscapeSequenceAtom();
				case "u": return this.regExpUnicodeEscapeSequenceAtom();
				default: return this.identityEscapeAtom();
			}
		};
		RegExpParser.prototype.group = function() {
			var capturing = true;
			this.consumeChar("(");
			switch (this.peekChar(0)) {
				case "?":
					this.consumeChar("?");
					this.consumeChar(":");
					capturing = false;
					break;
				default: this.groupIdx++;
			}
			var value = this.disjunction();
			this.consumeChar(")");
			var groupAst = {
				type: "Group",
				capturing,
				value
			};
			if (capturing) groupAst.idx = this.groupIdx;
			return groupAst;
		};
		RegExpParser.prototype.positiveInteger = function() {
			var number = this.popChar();
			// istanbul ignore next - can't ever get here due to previous lookahead checks
			if (decimalPatternNoZero.test(number) === false) throw Error("Expecting a positive integer");
			while (decimalPattern.test(this.peekChar(0))) number += this.popChar();
			return parseInt(number, 10);
		};
		RegExpParser.prototype.integerIncludingZero = function() {
			var number = this.popChar();
			if (decimalPattern.test(number) === false) throw Error("Expecting an integer");
			while (decimalPattern.test(this.peekChar(0))) number += this.popChar();
			return parseInt(number, 10);
		};
		RegExpParser.prototype.patternCharacter = function() {
			var nextChar = this.popChar();
			switch (nextChar) {
				// istanbul ignore next
				case "\n":
				// istanbul ignore next
				case "\r":
				// istanbul ignore next
				case "\u2028":
				// istanbul ignore next
				case "\u2029":
				// istanbul ignore next
				case "^":
				// istanbul ignore next
				case "$":
				// istanbul ignore next
				case "\\":
				// istanbul ignore next
				case ".":
				// istanbul ignore next
				case "*":
				// istanbul ignore next
				case "+":
				// istanbul ignore next
				case "?":
				// istanbul ignore next
				case "(":
				// istanbul ignore next
				case ")":
				// istanbul ignore next
				case "[":
				// istanbul ignore next
				case "|":
 // istanbul ignore next
				throw Error("TBD");
				default: return {
					type: "Character",
					value: cc(nextChar)
				};
			}
		};
		RegExpParser.prototype.isRegExpFlag = function() {
			switch (this.peekChar(0)) {
				case "g":
				case "i":
				case "m":
				case "u":
				case "y": return true;
				default: return false;
			}
		};
		RegExpParser.prototype.isRangeDash = function() {
			return this.peekChar() === "-" && this.isClassAtom(1);
		};
		RegExpParser.prototype.isDigit = function() {
			return decimalPattern.test(this.peekChar(0));
		};
		RegExpParser.prototype.isClassAtom = function(howMuch) {
			if (howMuch === void 0) howMuch = 0;
			switch (this.peekChar(howMuch)) {
				case "]":
				case "\n":
				case "\r":
				case "\u2028":
				case "\u2029": return false;
				default: return true;
			}
		};
		RegExpParser.prototype.isTerm = function() {
			return this.isAtom() || this.isAssertion();
		};
		RegExpParser.prototype.isAtom = function() {
			if (this.isPatternCharacter()) return true;
			switch (this.peekChar(0)) {
				case ".":
				case "\\":
				case "[":
				case "(": return true;
				default: return false;
			}
		};
		RegExpParser.prototype.isAssertion = function() {
			switch (this.peekChar(0)) {
				case "^":
				case "$": return true;
				case "\\": switch (this.peekChar(1)) {
					case "b":
					case "B": return true;
					default: return false;
				}
				case "(": return this.peekChar(1) === "?" && (this.peekChar(2) === "=" || this.peekChar(2) === "!");
				default: return false;
			}
		};
		RegExpParser.prototype.isQuantifier = function() {
			var prevState = this.saveState();
			try {
				return this.quantifier(true) !== void 0;
			} catch (e) {
				return false;
			} finally {
				this.restoreState(prevState);
			}
		};
		RegExpParser.prototype.isPatternCharacter = function() {
			switch (this.peekChar()) {
				case "^":
				case "$":
				case "\\":
				case ".":
				case "*":
				case "+":
				case "?":
				case "(":
				case ")":
				case "[":
				case "|":
				case "/":
				case "\n":
				case "\r":
				case "\u2028":
				case "\u2029": return false;
				default: return true;
			}
		};
		RegExpParser.prototype.parseHexDigits = function(howMany) {
			var hexString = "";
			for (var i = 0; i < howMany; i++) {
				var hexChar = this.popChar();
				if (hexDigitPattern.test(hexChar) === false) throw Error("Expecting a HexDecimal digits");
				hexString += hexChar;
			}
			return {
				type: "Character",
				value: parseInt(hexString, 16)
			};
		};
		RegExpParser.prototype.peekChar = function(howMuch) {
			if (howMuch === void 0) howMuch = 0;
			return this.input[this.idx + howMuch];
		};
		RegExpParser.prototype.popChar = function() {
			var nextChar = this.peekChar(0);
			this.consumeChar();
			return nextChar;
		};
		RegExpParser.prototype.consumeChar = function(char) {
			if (char !== void 0 && this.input[this.idx] !== char) throw Error("Expected: '" + char + "' but found: '" + this.input[this.idx] + "' at offset: " + this.idx);
			if (this.idx >= this.input.length) throw Error("Unexpected end of input");
			this.idx++;
		};
		RegExpParser.prototype.loc = function(begin) {
			return {
				begin,
				end: this.idx
			};
		};
		var hexDigitPattern = /[0-9a-fA-F]/;
		var decimalPattern = /[0-9]/;
		var decimalPatternNoZero = /[1-9]/;
		function cc(char) {
			return char.charCodeAt(0);
		}
		function insertToSet(item, set) {
			if (item.length !== void 0) item.forEach(function(subItem) {
				set.push(subItem);
			});
			else set.push(item);
		}
		function addFlag(flagObj, flagKey) {
			if (flagObj[flagKey] === true) throw "duplicate flag " + flagKey;
			flagObj[flagKey] = true;
		}
		function ASSERT_EXISTS(obj) {
			// istanbul ignore next
			if (obj === void 0) throw Error("Internal Error - Should never get here!");
		}
		// istanbul ignore next
		function ASSERT_NEVER_REACH_HERE() {
			throw Error("Internal Error - Should never get here!");
		}
		var i;
		var digitsCharCodes = [];
		for (i = cc("0"); i <= cc("9"); i++) digitsCharCodes.push(i);
		var wordCharCodes = [cc("_")].concat(digitsCharCodes);
		for (i = cc("a"); i <= cc("z"); i++) wordCharCodes.push(i);
		for (i = cc("A"); i <= cc("Z"); i++) wordCharCodes.push(i);
		var whitespaceCodes = [
			cc(" "),
			cc("\f"),
			cc("\n"),
			cc("\r"),
			cc("	"),
			cc("\v"),
			cc("	"),
			cc("\xA0"),
			cc(" "),
			cc(" "),
			cc(" "),
			cc(" "),
			cc(" "),
			cc(" "),
			cc(" "),
			cc(" "),
			cc(" "),
			cc(" "),
			cc(" "),
			cc(" "),
			cc("\u2028"),
			cc("\u2029"),
			cc(" "),
			cc(" "),
			cc("　"),
			cc("﻿")
		];
		function BaseRegExpVisitor() {}
		BaseRegExpVisitor.prototype.visitChildren = function(node) {
			for (var key in node) {
				var child = node[key];
				/* istanbul ignore else */
				if (node.hasOwnProperty(key)) {
					if (child.type !== void 0) this.visit(child);
					else if (Array.isArray(child)) child.forEach(function(subChild) {
						this.visit(subChild);
					}, this);
				}
			}
		};
		BaseRegExpVisitor.prototype.visit = function(node) {
			switch (node.type) {
				case "Pattern":
					this.visitPattern(node);
					break;
				case "Flags":
					this.visitFlags(node);
					break;
				case "Disjunction":
					this.visitDisjunction(node);
					break;
				case "Alternative":
					this.visitAlternative(node);
					break;
				case "StartAnchor":
					this.visitStartAnchor(node);
					break;
				case "EndAnchor":
					this.visitEndAnchor(node);
					break;
				case "WordBoundary":
					this.visitWordBoundary(node);
					break;
				case "NonWordBoundary":
					this.visitNonWordBoundary(node);
					break;
				case "Lookahead":
					this.visitLookahead(node);
					break;
				case "NegativeLookahead":
					this.visitNegativeLookahead(node);
					break;
				case "Character":
					this.visitCharacter(node);
					break;
				case "Set":
					this.visitSet(node);
					break;
				case "Group":
					this.visitGroup(node);
					break;
				case "GroupBackReference":
					this.visitGroupBackReference(node);
					break;
				case "Quantifier": this.visitQuantifier(node);
			}
			this.visitChildren(node);
		};
		BaseRegExpVisitor.prototype.visitPattern = function(node) {};
		BaseRegExpVisitor.prototype.visitFlags = function(node) {};
		BaseRegExpVisitor.prototype.visitDisjunction = function(node) {};
		BaseRegExpVisitor.prototype.visitAlternative = function(node) {};
		BaseRegExpVisitor.prototype.visitStartAnchor = function(node) {};
		BaseRegExpVisitor.prototype.visitEndAnchor = function(node) {};
		BaseRegExpVisitor.prototype.visitWordBoundary = function(node) {};
		BaseRegExpVisitor.prototype.visitNonWordBoundary = function(node) {};
		BaseRegExpVisitor.prototype.visitLookahead = function(node) {};
		BaseRegExpVisitor.prototype.visitNegativeLookahead = function(node) {};
		BaseRegExpVisitor.prototype.visitCharacter = function(node) {};
		BaseRegExpVisitor.prototype.visitSet = function(node) {};
		BaseRegExpVisitor.prototype.visitGroup = function(node) {};
		BaseRegExpVisitor.prototype.visitGroupBackReference = function(node) {};
		BaseRegExpVisitor.prototype.visitQuantifier = function(node) {};
		return {
			RegExpParser,
			BaseRegExpVisitor,
			VERSION: "0.5.0"
		};
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/scan/reg_exp_parser.js
function getRegExpAst(regExp) {
	var regExpStr = regExp.toString();
	if (regExpAstCache.hasOwnProperty(regExpStr)) return regExpAstCache[regExpStr];
	else {
		var regExpAst = regExpParser.pattern(regExpStr);
		regExpAstCache[regExpStr] = regExpAst;
		return regExpAst;
	}
}
function clearRegExpParserCache() {
	regExpAstCache = {};
}
var import_regexp_to_ast$2, regExpAstCache, regExpParser;
var init_reg_exp_parser = __esmMin((() => {
	import_regexp_to_ast$2 = require_regexp_to_ast();
	regExpAstCache = {};
	regExpParser = new import_regexp_to_ast$2.RegExpParser();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/scan/reg_exp.js
function getOptimizedStartCodesIndices(regExp, ensureOptimizations) {
	if (ensureOptimizations === void 0) ensureOptimizations = false;
	try {
		var ast = getRegExpAst(regExp);
		return firstCharOptimizedIndices(ast.value, {}, ast.flags.ignoreCase);
	} catch (e) {
		/* istanbul ignore next */
		if (e.message === complementErrorMessage) {
			if (ensureOptimizations) PRINT_WARNING("" + failedOptimizationPrefixMsg + ("	Unable to optimize: < " + regExp.toString() + " >\n") + "	Complement Sets cannot be automatically optimized.\n	This will disable the lexer's first char optimizations.\n	See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#COMPLEMENT for details.");
		} else {
			var msgSuffix = "";
			if (ensureOptimizations) msgSuffix = "\n	This will disable the lexer's first char optimizations.\n	See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#REGEXP_PARSING for details.";
			PRINT_ERROR(failedOptimizationPrefixMsg + "\n" + ("	Failed parsing: < " + regExp.toString() + " >\n") + ("	Using the regexp-to-ast library version: " + import_regexp_to_ast$1.VERSION + "\n") + "	Please open an issue at: https://github.com/bd82/regexp-to-ast/issues" + msgSuffix);
		}
	}
	return [];
}
function firstCharOptimizedIndices(ast, result, ignoreCase) {
	switch (ast.type) {
		case "Disjunction":
			for (var i = 0; i < ast.value.length; i++) firstCharOptimizedIndices(ast.value[i], result, ignoreCase);
			break;
		case "Alternative":
			var terms = ast.value;
			for (var i = 0; i < terms.length; i++) {
				var term = terms[i];
				switch (term.type) {
					case "EndAnchor":
					case "GroupBackReference":
					case "Lookahead":
					case "NegativeLookahead":
					case "StartAnchor":
					case "WordBoundary":
					case "NonWordBoundary": continue;
				}
				var atom = term;
				switch (atom.type) {
					case "Character":
						addOptimizedIdxToResult(atom.value, result, ignoreCase);
						break;
					case "Set":
						if (atom.complement === true) throw Error(complementErrorMessage);
						forEach(atom.value, function(code) {
							if (typeof code === "number") addOptimizedIdxToResult(code, result, ignoreCase);
							else {
								var range = code;
								if (ignoreCase === true) for (var rangeCode = range.from; rangeCode <= range.to; rangeCode++) addOptimizedIdxToResult(rangeCode, result, ignoreCase);
								else {
									for (var rangeCode = range.from; rangeCode <= range.to && rangeCode < 256; rangeCode++) addOptimizedIdxToResult(rangeCode, result, ignoreCase);
									if (range.to >= 256) {
										var minUnOptVal = range.from >= 256 ? range.from : 256;
										var maxUnOptVal = range.to;
										var minOptIdx = charCodeToOptimizedIndex(minUnOptVal);
										var maxOptIdx = charCodeToOptimizedIndex(maxUnOptVal);
										for (var currOptIdx = minOptIdx; currOptIdx <= maxOptIdx; currOptIdx++) result[currOptIdx] = currOptIdx;
									}
								}
							}
						});
						break;
					case "Group":
						firstCharOptimizedIndices(atom.value, result, ignoreCase);
						break;
					/* istanbul ignore next */
					default: throw Error("Non Exhaustive Match");
				}
				var isOptionalQuantifier = atom.quantifier !== void 0 && atom.quantifier.atLeast === 0;
				if (atom.type === "Group" && isWholeOptional(atom) === false || atom.type !== "Group" && isOptionalQuantifier === false) break;
			}
			break;
		/* istanbul ignore next */
		default: throw Error("non exhaustive match!");
	}
	return values(result);
}
function addOptimizedIdxToResult(code, result, ignoreCase) {
	var optimizedCharIdx = charCodeToOptimizedIndex(code);
	result[optimizedCharIdx] = optimizedCharIdx;
	if (ignoreCase === true) handleIgnoreCase(code, result);
}
function handleIgnoreCase(code, result) {
	var char = String.fromCharCode(code);
	var upperChar = char.toUpperCase();
	/* istanbul ignore else */
	if (upperChar !== char) {
		var optimizedCharIdx = charCodeToOptimizedIndex(upperChar.charCodeAt(0));
		result[optimizedCharIdx] = optimizedCharIdx;
	} else {
		var lowerChar = char.toLowerCase();
		if (lowerChar !== char) {
			var optimizedCharIdx = charCodeToOptimizedIndex(lowerChar.charCodeAt(0));
			result[optimizedCharIdx] = optimizedCharIdx;
		}
	}
}
function findCode(setNode, targetCharCodes) {
	return find(setNode.value, function(codeOrRange) {
		if (typeof codeOrRange === "number") return contains(targetCharCodes, codeOrRange);
		else {
			var range_1 = codeOrRange;
			return find(targetCharCodes, function(targetCode) {
				return range_1.from <= targetCode && targetCode <= range_1.to;
			}) !== void 0;
		}
	});
}
function isWholeOptional(ast) {
	if (ast.quantifier && ast.quantifier.atLeast === 0) return true;
	if (!ast.value) return false;
	return isArray(ast.value) ? every(ast.value, isWholeOptional) : isWholeOptional(ast.value);
}
function canMatchCharCode(charCodes, pattern) {
	if (pattern instanceof RegExp) {
		var ast = getRegExpAst(pattern);
		var charCodeFinder = new CharCodeFinder(charCodes);
		charCodeFinder.visit(ast);
		return charCodeFinder.found;
	} else return find(pattern, function(char) {
		return contains(charCodes, char.charCodeAt(0));
	}) !== void 0;
}
var import_regexp_to_ast$1, __extends$10, complementErrorMessage, failedOptimizationPrefixMsg, CharCodeFinder;
var init_reg_exp = __esmMin((() => {
	import_regexp_to_ast$1 = require_regexp_to_ast();
	init_utils();
	init_reg_exp_parser();
	init_lexer();
	__extends$10 = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	complementErrorMessage = "Complement Sets are not supported for first char optimization";
	failedOptimizationPrefixMsg = "Unable to use \"first char\" lexer optimizations:\n";
	CharCodeFinder = function(_super) {
		__extends$10(CharCodeFinder, _super);
		function CharCodeFinder(targetCharCodes) {
			var _this = _super.call(this) || this;
			_this.targetCharCodes = targetCharCodes;
			_this.found = false;
			return _this;
		}
		CharCodeFinder.prototype.visitChildren = function(node) {
			if (this.found === true) return;
			switch (node.type) {
				case "Lookahead":
					this.visitLookahead(node);
					return;
				case "NegativeLookahead":
					this.visitNegativeLookahead(node);
					return;
			}
			_super.prototype.visitChildren.call(this, node);
		};
		CharCodeFinder.prototype.visitCharacter = function(node) {
			if (contains(this.targetCharCodes, node.value)) this.found = true;
		};
		CharCodeFinder.prototype.visitSet = function(node) {
			if (node.complement) {
				if (findCode(node, this.targetCharCodes) === void 0) this.found = true;
			} else if (findCode(node, this.targetCharCodes) !== void 0) this.found = true;
		};
		return CharCodeFinder;
	}(import_regexp_to_ast$1.BaseRegExpVisitor);
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/scan/lexer.js
function analyzeTokenTypes(tokenTypes, options) {
	options = defaults(options, {
		useSticky: SUPPORT_STICKY,
		debug: false,
		safeMode: false,
		positionTracking: "full",
		lineTerminatorCharacters: ["\r", "\n"],
		tracer: function(msg, action) {
			return action();
		}
	});
	var tracer = options.tracer;
	tracer("initCharCodeToOptimizedIndexMap", function() {
		initCharCodeToOptimizedIndexMap();
	});
	var onlyRelevantTypes;
	tracer("Reject Lexer.NA", function() {
		onlyRelevantTypes = reject(tokenTypes, function(currType) {
			return currType[PATTERN] === Lexer.NA;
		});
	});
	var hasCustom = false;
	var allTransformedPatterns;
	tracer("Transform Patterns", function() {
		hasCustom = false;
		allTransformedPatterns = map(onlyRelevantTypes, function(currType) {
			var currPattern = currType[PATTERN];
			/* istanbul ignore else */
			if (isRegExp(currPattern)) {
				var regExpSource = currPattern.source;
				if (regExpSource.length === 1 && regExpSource !== "^" && regExpSource !== "$" && regExpSource !== "." && !currPattern.ignoreCase) return regExpSource;
				else if (regExpSource.length === 2 && regExpSource[0] === "\\" && !contains([
					"d",
					"D",
					"s",
					"S",
					"t",
					"r",
					"n",
					"t",
					"0",
					"c",
					"b",
					"B",
					"f",
					"v",
					"w",
					"W"
				], regExpSource[1])) return regExpSource[1];
				else return options.useSticky ? addStickyFlag(currPattern) : addStartOfInput(currPattern);
			} else if (isFunction(currPattern)) {
				hasCustom = true;
				return { exec: currPattern };
			} else if (has(currPattern, "exec")) {
				hasCustom = true;
				return currPattern;
			} else if (typeof currPattern === "string") if (currPattern.length === 1) return currPattern;
			else {
				var escapedRegExpString = currPattern.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
				var wrappedRegExp = new RegExp(escapedRegExpString);
				return options.useSticky ? addStickyFlag(wrappedRegExp) : addStartOfInput(wrappedRegExp);
			}
			else throw Error("non exhaustive match");
		});
	});
	var patternIdxToType;
	var patternIdxToGroup;
	var patternIdxToLongerAltIdx;
	var patternIdxToPushMode;
	var patternIdxToPopMode;
	tracer("misc mapping", function() {
		patternIdxToType = map(onlyRelevantTypes, function(currType) {
			return currType.tokenTypeIdx;
		});
		patternIdxToGroup = map(onlyRelevantTypes, function(clazz) {
			var groupName = clazz.GROUP;
			/* istanbul ignore next */
			if (groupName === Lexer.SKIPPED) return;
			else if (isString(groupName)) return groupName;
			else if (isUndefined(groupName)) return false;
			else throw Error("non exhaustive match");
		});
		patternIdxToLongerAltIdx = map(onlyRelevantTypes, function(clazz) {
			var longerAltType = clazz.LONGER_ALT;
			if (longerAltType) return indexOf(onlyRelevantTypes, longerAltType);
		});
		patternIdxToPushMode = map(onlyRelevantTypes, function(clazz) {
			return clazz.PUSH_MODE;
		});
		patternIdxToPopMode = map(onlyRelevantTypes, function(clazz) {
			return has(clazz, "POP_MODE");
		});
	});
	var patternIdxToCanLineTerminator;
	tracer("Line Terminator Handling", function() {
		var lineTerminatorCharCodes = getCharCodes(options.lineTerminatorCharacters);
		patternIdxToCanLineTerminator = map(onlyRelevantTypes, function(tokType) {
			return false;
		});
		if (options.positionTracking !== "onlyOffset") patternIdxToCanLineTerminator = map(onlyRelevantTypes, function(tokType) {
			if (has(tokType, "LINE_BREAKS")) return tokType.LINE_BREAKS;
			else if (checkLineBreaksIssues(tokType, lineTerminatorCharCodes) === false) return canMatchCharCode(lineTerminatorCharCodes, tokType.PATTERN);
		});
	});
	var patternIdxToIsCustom;
	var patternIdxToShort;
	var emptyGroups;
	var patternIdxToConfig;
	tracer("Misc Mapping #2", function() {
		patternIdxToIsCustom = map(onlyRelevantTypes, isCustomPattern);
		patternIdxToShort = map(allTransformedPatterns, isShortPattern);
		emptyGroups = reduce(onlyRelevantTypes, function(acc, clazz) {
			var groupName = clazz.GROUP;
			if (isString(groupName) && !(groupName === Lexer.SKIPPED)) acc[groupName] = [];
			return acc;
		}, {});
		patternIdxToConfig = map(allTransformedPatterns, function(x, idx) {
			return {
				pattern: allTransformedPatterns[idx],
				longerAlt: patternIdxToLongerAltIdx[idx],
				canLineTerminator: patternIdxToCanLineTerminator[idx],
				isCustom: patternIdxToIsCustom[idx],
				short: patternIdxToShort[idx],
				group: patternIdxToGroup[idx],
				push: patternIdxToPushMode[idx],
				pop: patternIdxToPopMode[idx],
				tokenTypeIdx: patternIdxToType[idx],
				tokenType: onlyRelevantTypes[idx]
			};
		});
	});
	var canBeOptimized = true;
	var charCodeToPatternIdxToConfig = [];
	if (!options.safeMode) tracer("First Char Optimization", function() {
		charCodeToPatternIdxToConfig = reduce(onlyRelevantTypes, function(result, currTokType, idx) {
			if (typeof currTokType.PATTERN === "string") addToMapOfArrays(result, charCodeToOptimizedIndex(currTokType.PATTERN.charCodeAt(0)), patternIdxToConfig[idx]);
			else if (isArray(currTokType.START_CHARS_HINT)) {
				var lastOptimizedIdx_1;
				forEach(currTokType.START_CHARS_HINT, function(charOrInt) {
					var currOptimizedIdx = charCodeToOptimizedIndex(typeof charOrInt === "string" ? charOrInt.charCodeAt(0) : charOrInt);
					/* istanbul ignore else */
					if (lastOptimizedIdx_1 !== currOptimizedIdx) {
						lastOptimizedIdx_1 = currOptimizedIdx;
						addToMapOfArrays(result, currOptimizedIdx, patternIdxToConfig[idx]);
					}
				});
			} else if (isRegExp(currTokType.PATTERN)) if (currTokType.PATTERN.unicode) {
				canBeOptimized = false;
				if (options.ensureOptimizations) PRINT_ERROR("" + failedOptimizationPrefixMsg + ("	Unable to analyze < " + currTokType.PATTERN.toString() + " > pattern.\n") + "	The regexp unicode flag is not currently supported by the regexp-to-ast library.\n	This will disable the lexer's first char optimizations.\n	For details See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#UNICODE_OPTIMIZE");
			} else {
				var optimizedCodes = getOptimizedStartCodesIndices(currTokType.PATTERN, options.ensureOptimizations);
				/* istanbul ignore if */
				if (isEmpty(optimizedCodes)) canBeOptimized = false;
				forEach(optimizedCodes, function(code) {
					addToMapOfArrays(result, code, patternIdxToConfig[idx]);
				});
			}
			else {
				if (options.ensureOptimizations) PRINT_ERROR("" + failedOptimizationPrefixMsg + ("	TokenType: <" + currTokType.name + "> is using a custom token pattern without providing <start_chars_hint> parameter.\n") + "	This will disable the lexer's first char optimizations.\n	For details See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#CUSTOM_OPTIMIZE");
				canBeOptimized = false;
			}
			return result;
		}, []);
	});
	tracer("ArrayPacking", function() {
		charCodeToPatternIdxToConfig = packArray(charCodeToPatternIdxToConfig);
	});
	return {
		emptyGroups,
		patternIdxToConfig,
		charCodeToPatternIdxToConfig,
		hasCustom,
		canBeOptimized
	};
}
function validatePatterns(tokenTypes, validModesNames) {
	var errors = [];
	var missingResult = findMissingPatterns(tokenTypes);
	errors = errors.concat(missingResult.errors);
	var invalidResult = findInvalidPatterns(missingResult.valid);
	var validTokenTypes = invalidResult.valid;
	errors = errors.concat(invalidResult.errors);
	errors = errors.concat(validateRegExpPattern(validTokenTypes));
	errors = errors.concat(findInvalidGroupType(validTokenTypes));
	errors = errors.concat(findModesThatDoNotExist(validTokenTypes, validModesNames));
	errors = errors.concat(findUnreachablePatterns(validTokenTypes));
	return errors;
}
function validateRegExpPattern(tokenTypes) {
	var errors = [];
	var withRegExpPatterns = filter(tokenTypes, function(currTokType) {
		return isRegExp(currTokType[PATTERN]);
	});
	errors = errors.concat(findEndOfInputAnchor(withRegExpPatterns));
	errors = errors.concat(findStartOfInputAnchor(withRegExpPatterns));
	errors = errors.concat(findUnsupportedFlags(withRegExpPatterns));
	errors = errors.concat(findDuplicatePatterns(withRegExpPatterns));
	errors = errors.concat(findEmptyMatchRegExps(withRegExpPatterns));
	return errors;
}
function findMissingPatterns(tokenTypes) {
	var tokenTypesWithMissingPattern = filter(tokenTypes, function(currType) {
		return !has(currType, PATTERN);
	});
	return {
		errors: map(tokenTypesWithMissingPattern, function(currType) {
			return {
				message: "Token Type: ->" + currType.name + "<- missing static 'PATTERN' property",
				type: LexerDefinitionErrorType.MISSING_PATTERN,
				tokenTypes: [currType]
			};
		}),
		valid: difference(tokenTypes, tokenTypesWithMissingPattern)
	};
}
function findInvalidPatterns(tokenTypes) {
	var tokenTypesWithInvalidPattern = filter(tokenTypes, function(currType) {
		var pattern = currType[PATTERN];
		return !isRegExp(pattern) && !isFunction(pattern) && !has(pattern, "exec") && !isString(pattern);
	});
	return {
		errors: map(tokenTypesWithInvalidPattern, function(currType) {
			return {
				message: "Token Type: ->" + currType.name + "<- static 'PATTERN' can only be a RegExp, a Function matching the {CustomPatternMatcherFunc} type or an Object matching the {ICustomPattern} interface.",
				type: LexerDefinitionErrorType.INVALID_PATTERN,
				tokenTypes: [currType]
			};
		}),
		valid: difference(tokenTypes, tokenTypesWithInvalidPattern)
	};
}
function findEndOfInputAnchor(tokenTypes) {
	var EndAnchorFinder = function(_super) {
		__extends$9(EndAnchorFinder, _super);
		function EndAnchorFinder() {
			var _this = _super !== null && _super.apply(this, arguments) || this;
			_this.found = false;
			return _this;
		}
		EndAnchorFinder.prototype.visitEndAnchor = function(node) {
			this.found = true;
		};
		return EndAnchorFinder;
	}(import_regexp_to_ast.BaseRegExpVisitor);
	return map(filter(tokenTypes, function(currType) {
		var pattern = currType[PATTERN];
		try {
			var regexpAst = getRegExpAst(pattern);
			var endAnchorVisitor = new EndAnchorFinder();
			endAnchorVisitor.visit(regexpAst);
			return endAnchorVisitor.found;
		} catch (e) {
			/* istanbul ignore next - cannot ensure an error in regexp-to-ast*/
			return end_of_input.test(pattern.source);
		}
	}), function(currType) {
		return {
			message: "Unexpected RegExp Anchor Error:\n	Token Type: ->" + currType.name + "<- static 'PATTERN' cannot contain end of input anchor '$'\n	See sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#ANCHORS	for details.",
			type: LexerDefinitionErrorType.EOI_ANCHOR_FOUND,
			tokenTypes: [currType]
		};
	});
}
function findEmptyMatchRegExps(tokenTypes) {
	return map(filter(tokenTypes, function(currType) {
		return currType[PATTERN].test("");
	}), function(currType) {
		return {
			message: "Token Type: ->" + currType.name + "<- static 'PATTERN' must not match an empty string",
			type: LexerDefinitionErrorType.EMPTY_MATCH_PATTERN,
			tokenTypes: [currType]
		};
	});
}
function findStartOfInputAnchor(tokenTypes) {
	var StartAnchorFinder = function(_super) {
		__extends$9(StartAnchorFinder, _super);
		function StartAnchorFinder() {
			var _this = _super !== null && _super.apply(this, arguments) || this;
			_this.found = false;
			return _this;
		}
		StartAnchorFinder.prototype.visitStartAnchor = function(node) {
			this.found = true;
		};
		return StartAnchorFinder;
	}(import_regexp_to_ast.BaseRegExpVisitor);
	return map(filter(tokenTypes, function(currType) {
		var pattern = currType[PATTERN];
		try {
			var regexpAst = getRegExpAst(pattern);
			var startAnchorVisitor = new StartAnchorFinder();
			startAnchorVisitor.visit(regexpAst);
			return startAnchorVisitor.found;
		} catch (e) {
			/* istanbul ignore next - cannot ensure an error in regexp-to-ast*/
			return start_of_input.test(pattern.source);
		}
	}), function(currType) {
		return {
			message: "Unexpected RegExp Anchor Error:\n	Token Type: ->" + currType.name + "<- static 'PATTERN' cannot contain start of input anchor '^'\n	See https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#ANCHORS	for details.",
			type: LexerDefinitionErrorType.SOI_ANCHOR_FOUND,
			tokenTypes: [currType]
		};
	});
}
function findUnsupportedFlags(tokenTypes) {
	return map(filter(tokenTypes, function(currType) {
		var pattern = currType[PATTERN];
		return pattern instanceof RegExp && (pattern.multiline || pattern.global);
	}), function(currType) {
		return {
			message: "Token Type: ->" + currType.name + "<- static 'PATTERN' may NOT contain global('g') or multiline('m')",
			type: LexerDefinitionErrorType.UNSUPPORTED_FLAGS_FOUND,
			tokenTypes: [currType]
		};
	});
}
function findDuplicatePatterns(tokenTypes) {
	var found = [];
	var identicalPatterns = map(tokenTypes, function(outerType) {
		return reduce(tokenTypes, function(result, innerType) {
			if (outerType.PATTERN.source === innerType.PATTERN.source && !contains(found, innerType) && innerType.PATTERN !== Lexer.NA) {
				found.push(innerType);
				result.push(innerType);
				return result;
			}
			return result;
		}, []);
	});
	identicalPatterns = compact(identicalPatterns);
	return map(filter(identicalPatterns, function(currIdenticalSet) {
		return currIdenticalSet.length > 1;
	}), function(setOfIdentical) {
		var tokenTypeNames = map(setOfIdentical, function(currType) {
			return currType.name;
		});
		return {
			message: "The same RegExp pattern ->" + first$1(setOfIdentical).PATTERN + "<-" + ("has been used in all of the following Token Types: " + tokenTypeNames.join(", ") + " <-"),
			type: LexerDefinitionErrorType.DUPLICATE_PATTERNS_FOUND,
			tokenTypes: setOfIdentical
		};
	});
}
function findInvalidGroupType(tokenTypes) {
	return map(filter(tokenTypes, function(clazz) {
		if (!has(clazz, "GROUP")) return false;
		var group = clazz.GROUP;
		return group !== Lexer.SKIPPED && group !== Lexer.NA && !isString(group);
	}), function(currType) {
		return {
			message: "Token Type: ->" + currType.name + "<- static 'GROUP' can only be Lexer.SKIPPED/Lexer.NA/A String",
			type: LexerDefinitionErrorType.INVALID_GROUP_TYPE_FOUND,
			tokenTypes: [currType]
		};
	});
}
function findModesThatDoNotExist(tokenTypes, validModes) {
	return map(filter(tokenTypes, function(clazz) {
		return clazz.PUSH_MODE !== void 0 && !contains(validModes, clazz.PUSH_MODE);
	}), function(tokType) {
		return {
			message: "Token Type: ->" + tokType.name + "<- static 'PUSH_MODE' value cannot refer to a Lexer Mode ->" + tokType.PUSH_MODE + "<-which does not exist",
			type: LexerDefinitionErrorType.PUSH_MODE_DOES_NOT_EXIST,
			tokenTypes: [tokType]
		};
	});
}
function findUnreachablePatterns(tokenTypes) {
	var errors = [];
	var canBeTested = reduce(tokenTypes, function(result, tokType, idx) {
		var pattern = tokType.PATTERN;
		if (pattern === Lexer.NA) return result;
		if (isString(pattern)) result.push({
			str: pattern,
			idx,
			tokenType: tokType
		});
		else if (isRegExp(pattern) && noMetaChar(pattern)) result.push({
			str: pattern.source,
			idx,
			tokenType: tokType
		});
		return result;
	}, []);
	forEach(tokenTypes, function(tokType, testIdx) {
		forEach(canBeTested, function(_a) {
			var str = _a.str, idx = _a.idx, tokenType = _a.tokenType;
			if (testIdx < idx && testTokenType(str, tokType.PATTERN)) {
				var msg = "Token: ->" + tokenType.name + "<- can never be matched.\n" + ("Because it appears AFTER the Token Type ->" + tokType.name + "<-") + "in the lexer's definition.\nSee https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#UNREACHABLE";
				errors.push({
					message: msg,
					type: LexerDefinitionErrorType.UNREACHABLE_PATTERN,
					tokenTypes: [tokType, tokenType]
				});
			}
		});
	});
	return errors;
}
function testTokenType(str, pattern) {
	/* istanbul ignore else */
	if (isRegExp(pattern)) {
		var regExpArray = pattern.exec(str);
		return regExpArray !== null && regExpArray.index === 0;
	} else if (isFunction(pattern)) return pattern(str, 0, [], {});
	else if (has(pattern, "exec")) return pattern.exec(str, 0, [], {});
	else if (typeof pattern === "string") return pattern === str;
	else throw Error("non exhaustive match");
}
function noMetaChar(regExp) {
	return find([
		".",
		"\\",
		"[",
		"]",
		"|",
		"^",
		"$",
		"(",
		")",
		"?",
		"*",
		"+",
		"{"
	], function(char) {
		return regExp.source.indexOf(char) !== -1;
	}) === void 0;
}
function addStartOfInput(pattern) {
	var flags = pattern.ignoreCase ? "i" : "";
	return new RegExp("^(?:" + pattern.source + ")", flags);
}
function addStickyFlag(pattern) {
	var flags = pattern.ignoreCase ? "iy" : "y";
	return new RegExp("" + pattern.source, flags);
}
function performRuntimeChecks(lexerDefinition, trackLines, lineTerminatorCharacters) {
	var errors = [];
	if (!has(lexerDefinition, "defaultMode")) errors.push({
		message: "A MultiMode Lexer cannot be initialized without a <" + DEFAULT_MODE + "> property in its definition\n",
		type: LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE
	});
	if (!has(lexerDefinition, "modes")) errors.push({
		message: "A MultiMode Lexer cannot be initialized without a <" + MODES + "> property in its definition\n",
		type: LexerDefinitionErrorType.MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY
	});
	if (has(lexerDefinition, "modes") && has(lexerDefinition, "defaultMode") && !has(lexerDefinition.modes, lexerDefinition.defaultMode)) errors.push({
		message: "A MultiMode Lexer cannot be initialized with a " + DEFAULT_MODE + ": <" + lexerDefinition.defaultMode + ">which does not exist\n",
		type: LexerDefinitionErrorType.MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST
	});
	if (has(lexerDefinition, "modes")) forEach(lexerDefinition.modes, function(currModeValue, currModeName) {
		forEach(currModeValue, function(currTokType, currIdx) {
			if (isUndefined(currTokType)) errors.push({
				message: "A Lexer cannot be initialized using an undefined Token Type. Mode:" + ("<" + currModeName + "> at index: <" + currIdx + ">\n"),
				type: LexerDefinitionErrorType.LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED
			});
		});
	});
	return errors;
}
function performWarningRuntimeChecks(lexerDefinition, trackLines, lineTerminatorCharacters) {
	var warnings = [];
	var hasAnyLineBreak = false;
	var concreteTokenTypes = reject(compact(flatten(mapValues(lexerDefinition.modes, function(tokTypes) {
		return tokTypes;
	}))), function(currType) {
		return currType[PATTERN] === Lexer.NA;
	});
	var terminatorCharCodes = getCharCodes(lineTerminatorCharacters);
	if (trackLines) forEach(concreteTokenTypes, function(tokType) {
		var currIssue = checkLineBreaksIssues(tokType, terminatorCharCodes);
		if (currIssue !== false) {
			var warningDescriptor = {
				message: buildLineBreakIssueMessage(tokType, currIssue),
				type: currIssue.issue,
				tokenType: tokType
			};
			warnings.push(warningDescriptor);
		} else if (has(tokType, "LINE_BREAKS")) {
			if (tokType.LINE_BREAKS === true) hasAnyLineBreak = true;
		} else if (canMatchCharCode(terminatorCharCodes, tokType.PATTERN)) hasAnyLineBreak = true;
	});
	if (trackLines && !hasAnyLineBreak) warnings.push({
		message: "Warning: No LINE_BREAKS Found.\n	This Lexer has been defined to track line and column information,\n	But none of the Token Types can be identified as matching a line terminator.\n	See https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#LINE_BREAKS \n	for details.",
		type: LexerDefinitionErrorType.NO_LINE_BREAKS_FLAGS
	});
	return warnings;
}
function cloneEmptyGroups(emptyGroups) {
	var clonedResult = {};
	forEach(keys(emptyGroups), function(currKey) {
		var currGroupValue = emptyGroups[currKey];
		/* istanbul ignore else */
		if (isArray(currGroupValue)) clonedResult[currKey] = [];
		else throw Error("non exhaustive match");
	});
	return clonedResult;
}
function isCustomPattern(tokenType) {
	var pattern = tokenType.PATTERN;
	/* istanbul ignore else */
	if (isRegExp(pattern)) return false;
	else if (isFunction(pattern)) return true;
	else if (has(pattern, "exec")) return true;
	else if (isString(pattern)) return false;
	else throw Error("non exhaustive match");
}
function isShortPattern(pattern) {
	if (isString(pattern) && pattern.length === 1) return pattern.charCodeAt(0);
	else return false;
}
function checkLineBreaksIssues(tokType, lineTerminatorCharCodes) {
	if (has(tokType, "LINE_BREAKS")) return false;
	else if (isRegExp(tokType.PATTERN)) {
		try {
			canMatchCharCode(lineTerminatorCharCodes, tokType.PATTERN);
		} catch (e) {
			/* istanbul ignore next - to test this we would have to mock <canMatchCharCode> to throw an error */
			return {
				issue: LexerDefinitionErrorType.IDENTIFY_TERMINATOR,
				errMsg: e.message
			};
		}
		return false;
	} else if (isString(tokType.PATTERN)) return false;
	else if (isCustomPattern(tokType)) return { issue: LexerDefinitionErrorType.CUSTOM_LINE_BREAK };
	else throw Error("non exhaustive match");
}
function buildLineBreakIssueMessage(tokType, details) {
	/* istanbul ignore else */
	if (details.issue === LexerDefinitionErrorType.IDENTIFY_TERMINATOR) return "Warning: unable to identify line terminator usage in pattern.\n" + ("	The problem is in the <" + tokType.name + "> Token Type\n") + ("	 Root cause: " + details.errMsg + ".\n") + "	For details See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#IDENTIFY_TERMINATOR";
	else if (details.issue === LexerDefinitionErrorType.CUSTOM_LINE_BREAK) return "Warning: A Custom Token Pattern should specify the <line_breaks> option.\n" + ("	The problem is in the <" + tokType.name + "> Token Type\n") + "	For details See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#CUSTOM_LINE_BREAK";
	else throw Error("non exhaustive match");
}
function getCharCodes(charsOrCodes) {
	return map(charsOrCodes, function(numOrString) {
		if (isString(numOrString) && numOrString.length > 0) return numOrString.charCodeAt(0);
		else return numOrString;
	});
}
function addToMapOfArrays(map, key, value) {
	if (map[key] === void 0) map[key] = [value];
	else map[key].push(value);
}
/**
* We ae mapping charCode above ASCI (256) into buckets each in the size of 256.
* This is because ASCI are the most common start chars so each one of those will get its own
* possible token configs vector.
*
* Tokens starting with charCodes "above" ASCI are uncommon, so we can "afford"
* to place these into buckets of possible token configs, What we gain from
* this is avoiding the case of creating an optimization 'charCodeToPatternIdxToConfig'
* which would contain 10,000+ arrays of small size (e.g unicode Identifiers scenario).
* Our 'charCodeToPatternIdxToConfig' max size will now be:
* 256 + (2^16 / 2^8) - 1 === 511
*
* note the hack for fast division integer part extraction
* See: https://stackoverflow.com/a/4228528
*/
function charCodeToOptimizedIndex(charCode) {
	return charCode < 256 ? charCode : charCodeToOptimizedIdxMap[charCode];
}
function initCharCodeToOptimizedIndexMap() {
	if (isEmpty(charCodeToOptimizedIdxMap)) {
		charCodeToOptimizedIdxMap = new Array(65536);
		for (var i = 0; i < 65536; i++) charCodeToOptimizedIdxMap[i] = i > 255 ? 255 + ~~(i / 255) : i;
	}
}
var import_regexp_to_ast, __extends$9, PATTERN, DEFAULT_MODE, MODES, SUPPORT_STICKY, end_of_input, start_of_input, LineTerminatorOptimizedTester, charCodeToOptimizedIdxMap;
var init_lexer = __esmMin((() => {
	import_regexp_to_ast = require_regexp_to_ast();
	init_lexer_public();
	init_utils();
	init_reg_exp();
	init_reg_exp_parser();
	__extends$9 = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	PATTERN = "PATTERN";
	DEFAULT_MODE = "defaultMode";
	MODES = "modes";
	SUPPORT_STICKY = typeof (/* @__PURE__ */ new RegExp("(?:)")).sticky === "boolean";
	end_of_input = /[^\\][\$]/;
	start_of_input = /[^\\[][\^]|^\^/;
	LineTerminatorOptimizedTester = {
		test: function(text) {
			var len = text.length;
			for (var i = this.lastIndex; i < len; i++) {
				var c = text.charCodeAt(i);
				if (c === 10) {
					this.lastIndex = i + 1;
					return true;
				} else if (c === 13) {
					if (text.charCodeAt(i + 1) === 10) this.lastIndex = i + 2;
					else this.lastIndex = i + 1;
					return true;
				}
			}
			return false;
		},
		lastIndex: 0
	};
	charCodeToOptimizedIdxMap = [];
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/scan/tokens.js
function tokenStructuredMatcher(tokInstance, tokConstructor) {
	var instanceType = tokInstance.tokenTypeIdx;
	if (instanceType === tokConstructor.tokenTypeIdx) return true;
	else return tokConstructor.isParent === true && tokConstructor.categoryMatchesMap[instanceType] === true;
}
function tokenStructuredMatcherNoCategories(token, tokType) {
	return token.tokenTypeIdx === tokType.tokenTypeIdx;
}
function augmentTokenTypes(tokenTypes) {
	var tokenTypesAndParents = expandCategories(tokenTypes);
	assignTokenDefaultProps(tokenTypesAndParents);
	assignCategoriesMapProp(tokenTypesAndParents);
	assignCategoriesTokensProp(tokenTypesAndParents);
	forEach(tokenTypesAndParents, function(tokType) {
		tokType.isParent = tokType.categoryMatches.length > 0;
	});
}
function expandCategories(tokenTypes) {
	var result = cloneArr(tokenTypes);
	var categories = tokenTypes;
	var searching = true;
	while (searching) {
		categories = compact(flatten(map(categories, function(currTokType) {
			return currTokType.CATEGORIES;
		})));
		var newCategories = difference(categories, result);
		result = result.concat(newCategories);
		if (isEmpty(newCategories)) searching = false;
		else categories = newCategories;
	}
	return result;
}
function assignTokenDefaultProps(tokenTypes) {
	forEach(tokenTypes, function(currTokType) {
		if (!hasShortKeyProperty(currTokType)) {
			tokenIdxToClass[tokenShortNameIdx] = currTokType;
			currTokType.tokenTypeIdx = tokenShortNameIdx++;
		}
		if (hasCategoriesProperty(currTokType) && !isArray(currTokType.CATEGORIES)) currTokType.CATEGORIES = [currTokType.CATEGORIES];
		if (!hasCategoriesProperty(currTokType)) currTokType.CATEGORIES = [];
		if (!hasExtendingTokensTypesProperty(currTokType)) currTokType.categoryMatches = [];
		if (!hasExtendingTokensTypesMapProperty(currTokType)) currTokType.categoryMatchesMap = {};
	});
}
function assignCategoriesTokensProp(tokenTypes) {
	forEach(tokenTypes, function(currTokType) {
		currTokType.categoryMatches = [];
		forEach(currTokType.categoryMatchesMap, function(val, key) {
			currTokType.categoryMatches.push(tokenIdxToClass[key].tokenTypeIdx);
		});
	});
}
function assignCategoriesMapProp(tokenTypes) {
	forEach(tokenTypes, function(currTokType) {
		singleAssignCategoriesToksMap([], currTokType);
	});
}
function singleAssignCategoriesToksMap(path, nextNode) {
	forEach(path, function(pathNode) {
		nextNode.categoryMatchesMap[pathNode.tokenTypeIdx] = true;
	});
	forEach(nextNode.CATEGORIES, function(nextCategory) {
		var newPath = path.concat(nextNode);
		if (!contains(newPath, nextCategory)) singleAssignCategoriesToksMap(newPath, nextCategory);
	});
}
function hasShortKeyProperty(tokType) {
	return has(tokType, "tokenTypeIdx");
}
function hasCategoriesProperty(tokType) {
	return has(tokType, "CATEGORIES");
}
function hasExtendingTokensTypesProperty(tokType) {
	return has(tokType, "categoryMatches");
}
function hasExtendingTokensTypesMapProperty(tokType) {
	return has(tokType, "categoryMatchesMap");
}
function isTokenType(tokType) {
	return has(tokType, "tokenTypeIdx");
}
var tokenShortNameIdx, tokenIdxToClass;
var init_tokens = __esmMin((() => {
	init_utils();
	tokenShortNameIdx = 1;
	tokenIdxToClass = {};
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/scan/lexer_errors_public.js
var defaultLexerErrorProvider;
var init_lexer_errors_public = __esmMin((() => {
	defaultLexerErrorProvider = {
		buildUnableToPopLexerModeMessage: function(token) {
			return "Unable to pop Lexer Mode after encountering Token ->" + token.image + "<- The Mode Stack is empty";
		},
		buildUnexpectedCharactersMessage: function(fullText, startOffset, length, line, column) {
			return "unexpected character: ->" + fullText.charAt(startOffset) + "<- at offset: " + startOffset + "," + (" skipped " + length + " characters.");
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/scan/lexer_public.js
var LexerDefinitionErrorType, DEFAULT_LEXER_CONFIG, Lexer;
var init_lexer_public = __esmMin((() => {
	init_lexer();
	init_utils();
	init_tokens();
	init_lexer_errors_public();
	init_reg_exp_parser();
	(function(LexerDefinitionErrorType) {
		LexerDefinitionErrorType[LexerDefinitionErrorType["MISSING_PATTERN"] = 0] = "MISSING_PATTERN";
		LexerDefinitionErrorType[LexerDefinitionErrorType["INVALID_PATTERN"] = 1] = "INVALID_PATTERN";
		LexerDefinitionErrorType[LexerDefinitionErrorType["EOI_ANCHOR_FOUND"] = 2] = "EOI_ANCHOR_FOUND";
		LexerDefinitionErrorType[LexerDefinitionErrorType["UNSUPPORTED_FLAGS_FOUND"] = 3] = "UNSUPPORTED_FLAGS_FOUND";
		LexerDefinitionErrorType[LexerDefinitionErrorType["DUPLICATE_PATTERNS_FOUND"] = 4] = "DUPLICATE_PATTERNS_FOUND";
		LexerDefinitionErrorType[LexerDefinitionErrorType["INVALID_GROUP_TYPE_FOUND"] = 5] = "INVALID_GROUP_TYPE_FOUND";
		LexerDefinitionErrorType[LexerDefinitionErrorType["PUSH_MODE_DOES_NOT_EXIST"] = 6] = "PUSH_MODE_DOES_NOT_EXIST";
		LexerDefinitionErrorType[LexerDefinitionErrorType["MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE"] = 7] = "MULTI_MODE_LEXER_WITHOUT_DEFAULT_MODE";
		LexerDefinitionErrorType[LexerDefinitionErrorType["MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY"] = 8] = "MULTI_MODE_LEXER_WITHOUT_MODES_PROPERTY";
		LexerDefinitionErrorType[LexerDefinitionErrorType["MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST"] = 9] = "MULTI_MODE_LEXER_DEFAULT_MODE_VALUE_DOES_NOT_EXIST";
		LexerDefinitionErrorType[LexerDefinitionErrorType["LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED"] = 10] = "LEXER_DEFINITION_CANNOT_CONTAIN_UNDEFINED";
		LexerDefinitionErrorType[LexerDefinitionErrorType["SOI_ANCHOR_FOUND"] = 11] = "SOI_ANCHOR_FOUND";
		LexerDefinitionErrorType[LexerDefinitionErrorType["EMPTY_MATCH_PATTERN"] = 12] = "EMPTY_MATCH_PATTERN";
		LexerDefinitionErrorType[LexerDefinitionErrorType["NO_LINE_BREAKS_FLAGS"] = 13] = "NO_LINE_BREAKS_FLAGS";
		LexerDefinitionErrorType[LexerDefinitionErrorType["UNREACHABLE_PATTERN"] = 14] = "UNREACHABLE_PATTERN";
		LexerDefinitionErrorType[LexerDefinitionErrorType["IDENTIFY_TERMINATOR"] = 15] = "IDENTIFY_TERMINATOR";
		LexerDefinitionErrorType[LexerDefinitionErrorType["CUSTOM_LINE_BREAK"] = 16] = "CUSTOM_LINE_BREAK";
	})(LexerDefinitionErrorType || (LexerDefinitionErrorType = {}));
	DEFAULT_LEXER_CONFIG = {
		deferDefinitionErrorsHandling: false,
		positionTracking: "full",
		lineTerminatorsPattern: /\n|\r\n?/g,
		lineTerminatorCharacters: ["\n", "\r"],
		ensureOptimizations: false,
		safeMode: false,
		errorMessageProvider: defaultLexerErrorProvider,
		traceInitPerf: false,
		skipValidations: false
	};
	Object.freeze(DEFAULT_LEXER_CONFIG);
	Lexer = function() {
		function Lexer(lexerDefinition, config) {
			var _this = this;
			if (config === void 0) config = DEFAULT_LEXER_CONFIG;
			this.lexerDefinition = lexerDefinition;
			this.lexerDefinitionErrors = [];
			this.lexerDefinitionWarning = [];
			this.patternIdxToConfig = {};
			this.charCodeToPatternIdxToConfig = {};
			this.modes = [];
			this.emptyGroups = {};
			this.config = void 0;
			this.trackStartLines = true;
			this.trackEndLines = true;
			this.hasCustom = false;
			this.canModeBeOptimized = {};
			if (typeof config === "boolean") throw Error("The second argument to the Lexer constructor is now an ILexerConfig Object.\na boolean 2nd argument is no longer supported");
			this.config = merge(DEFAULT_LEXER_CONFIG, config);
			var traceInitVal = this.config.traceInitPerf;
			if (traceInitVal === true) {
				this.traceInitMaxIdent = Infinity;
				this.traceInitPerf = true;
			} else if (typeof traceInitVal === "number") {
				this.traceInitMaxIdent = traceInitVal;
				this.traceInitPerf = true;
			}
			this.traceInitIndent = -1;
			this.TRACE_INIT("Lexer Constructor", function() {
				var actualDefinition;
				var hasOnlySingleMode = true;
				_this.TRACE_INIT("Lexer Config handling", function() {
					if (_this.config.lineTerminatorsPattern === DEFAULT_LEXER_CONFIG.lineTerminatorsPattern) _this.config.lineTerminatorsPattern = LineTerminatorOptimizedTester;
					else if (_this.config.lineTerminatorCharacters === DEFAULT_LEXER_CONFIG.lineTerminatorCharacters) throw Error("Error: Missing <lineTerminatorCharacters> property on the Lexer config.\n	For details See: https://sap.github.io/chevrotain/docs/guide/resolving_lexer_errors.html#MISSING_LINE_TERM_CHARS");
					if (config.safeMode && config.ensureOptimizations) throw Error("\"safeMode\" and \"ensureOptimizations\" flags are mutually exclusive.");
					_this.trackStartLines = /full|onlyStart/i.test(_this.config.positionTracking);
					_this.trackEndLines = /full/i.test(_this.config.positionTracking);
					if (isArray(lexerDefinition)) {
						actualDefinition = { modes: {} };
						actualDefinition.modes[DEFAULT_MODE] = cloneArr(lexerDefinition);
						actualDefinition[DEFAULT_MODE] = DEFAULT_MODE;
					} else {
						hasOnlySingleMode = false;
						actualDefinition = cloneObj(lexerDefinition);
					}
				});
				if (_this.config.skipValidations === false) {
					_this.TRACE_INIT("performRuntimeChecks", function() {
						_this.lexerDefinitionErrors = _this.lexerDefinitionErrors.concat(performRuntimeChecks(actualDefinition, _this.trackStartLines, _this.config.lineTerminatorCharacters));
					});
					_this.TRACE_INIT("performWarningRuntimeChecks", function() {
						_this.lexerDefinitionWarning = _this.lexerDefinitionWarning.concat(performWarningRuntimeChecks(actualDefinition, _this.trackStartLines, _this.config.lineTerminatorCharacters));
					});
				}
				actualDefinition.modes = actualDefinition.modes ? actualDefinition.modes : {};
				forEach(actualDefinition.modes, function(currModeValue, currModeName) {
					actualDefinition.modes[currModeName] = reject(currModeValue, function(currTokType) {
						return isUndefined(currTokType);
					});
				});
				var allModeNames = keys(actualDefinition.modes);
				forEach(actualDefinition.modes, function(currModDef, currModName) {
					_this.TRACE_INIT("Mode: <" + currModName + "> processing", function() {
						_this.modes.push(currModName);
						if (_this.config.skipValidations === false) _this.TRACE_INIT("validatePatterns", function() {
							_this.lexerDefinitionErrors = _this.lexerDefinitionErrors.concat(validatePatterns(currModDef, allModeNames));
						});
						if (isEmpty(_this.lexerDefinitionErrors)) {
							augmentTokenTypes(currModDef);
							var currAnalyzeResult_1;
							_this.TRACE_INIT("analyzeTokenTypes", function() {
								currAnalyzeResult_1 = analyzeTokenTypes(currModDef, {
									lineTerminatorCharacters: _this.config.lineTerminatorCharacters,
									positionTracking: config.positionTracking,
									ensureOptimizations: config.ensureOptimizations,
									safeMode: config.safeMode,
									tracer: _this.TRACE_INIT.bind(_this)
								});
							});
							_this.patternIdxToConfig[currModName] = currAnalyzeResult_1.patternIdxToConfig;
							_this.charCodeToPatternIdxToConfig[currModName] = currAnalyzeResult_1.charCodeToPatternIdxToConfig;
							_this.emptyGroups = merge(_this.emptyGroups, currAnalyzeResult_1.emptyGroups);
							_this.hasCustom = currAnalyzeResult_1.hasCustom || _this.hasCustom;
							_this.canModeBeOptimized[currModName] = currAnalyzeResult_1.canBeOptimized;
						}
					});
				});
				_this.defaultMode = actualDefinition.defaultMode;
				if (!isEmpty(_this.lexerDefinitionErrors) && !_this.config.deferDefinitionErrorsHandling) {
					var allErrMessagesString = map(_this.lexerDefinitionErrors, function(error) {
						return error.message;
					}).join("-----------------------\n");
					throw new Error("Errors detected in definition of Lexer:\n" + allErrMessagesString);
				}
				forEach(_this.lexerDefinitionWarning, function(warningDescriptor) {
					PRINT_WARNING(warningDescriptor.message);
				});
				_this.TRACE_INIT("Choosing sub-methods implementations", function() {
					if (SUPPORT_STICKY) {
						_this.chopInput = IDENTITY;
						_this.match = _this.matchWithTest;
					} else {
						_this.updateLastIndex = NOOP;
						_this.match = _this.matchWithExec;
					}
					if (hasOnlySingleMode) _this.handleModes = NOOP;
					if (_this.trackStartLines === false) _this.computeNewColumn = IDENTITY;
					if (_this.trackEndLines === false) _this.updateTokenEndLineColumnLocation = NOOP;
					if (/full/i.test(_this.config.positionTracking)) _this.createTokenInstance = _this.createFullToken;
					else if (/onlyStart/i.test(_this.config.positionTracking)) _this.createTokenInstance = _this.createStartOnlyToken;
					else if (/onlyOffset/i.test(_this.config.positionTracking)) _this.createTokenInstance = _this.createOffsetOnlyToken;
					else throw Error("Invalid <positionTracking> config option: \"" + _this.config.positionTracking + "\"");
					if (_this.hasCustom) {
						_this.addToken = _this.addTokenUsingPush;
						_this.handlePayload = _this.handlePayloadWithCustom;
					} else {
						_this.addToken = _this.addTokenUsingMemberAccess;
						_this.handlePayload = _this.handlePayloadNoCustom;
					}
				});
				_this.TRACE_INIT("Failed Optimization Warnings", function() {
					var unOptimizedModes = reduce(_this.canModeBeOptimized, function(cannotBeOptimized, canBeOptimized, modeName) {
						if (canBeOptimized === false) cannotBeOptimized.push(modeName);
						return cannotBeOptimized;
					}, []);
					if (config.ensureOptimizations && !isEmpty(unOptimizedModes)) throw Error("Lexer Modes: < " + unOptimizedModes.join(", ") + " > cannot be optimized.\n	 Disable the \"ensureOptimizations\" lexer config flag to silently ignore this and run the lexer in an un-optimized mode.\n	 Or inspect the console log for details on how to resolve these issues.");
				});
				_this.TRACE_INIT("clearRegExpParserCache", function() {
					clearRegExpParserCache();
				});
				_this.TRACE_INIT("toFastProperties", function() {
					toFastProperties(_this);
				});
			});
		}
		Lexer.prototype.tokenize = function(text, initialMode) {
			if (initialMode === void 0) initialMode = this.defaultMode;
			if (!isEmpty(this.lexerDefinitionErrors)) {
				var allErrMessagesString = map(this.lexerDefinitionErrors, function(error) {
					return error.message;
				}).join("-----------------------\n");
				throw new Error("Unable to Tokenize because Errors detected in definition of Lexer:\n" + allErrMessagesString);
			}
			return this.tokenizeInternal(text, initialMode);
		};
		Lexer.prototype.tokenizeInternal = function(text, initialMode) {
			var _this = this, i, j, matchAltImage, longerAltIdx, matchedImage, payload, altPayload, imageLength, group, tokType, newToken, errLength, msg, match;
			var orgText = text;
			var orgLength = orgText.length;
			var offset = 0;
			var matchedTokensIndex = 0;
			var guessedNumberOfTokens = this.hasCustom ? 0 : Math.floor(text.length / 10);
			var matchedTokens = new Array(guessedNumberOfTokens);
			var errors = [];
			var line = this.trackStartLines ? 1 : void 0;
			var column = this.trackStartLines ? 1 : void 0;
			var groups = cloneEmptyGroups(this.emptyGroups);
			var trackLines = this.trackStartLines;
			var lineTerminatorPattern = this.config.lineTerminatorsPattern;
			var currModePatternsLength = 0;
			var patternIdxToConfig = [];
			var currCharCodeToPatternIdxToConfig = [];
			var modeStack = [];
			var emptyArray = [];
			Object.freeze(emptyArray);
			var getPossiblePatterns = void 0;
			function getPossiblePatternsSlow() {
				return patternIdxToConfig;
			}
			function getPossiblePatternsOptimized(charCode) {
				var optimizedCharIdx = charCodeToOptimizedIndex(charCode);
				var possiblePatterns = currCharCodeToPatternIdxToConfig[optimizedCharIdx];
				if (possiblePatterns === void 0) return emptyArray;
				else return possiblePatterns;
			}
			var pop_mode = function(popToken) {
				if (modeStack.length === 1 && popToken.tokenType.PUSH_MODE === void 0) {
					var msg_1 = _this.config.errorMessageProvider.buildUnableToPopLexerModeMessage(popToken);
					errors.push({
						offset: popToken.startOffset,
						line: popToken.startLine !== void 0 ? popToken.startLine : void 0,
						column: popToken.startColumn !== void 0 ? popToken.startColumn : void 0,
						length: popToken.image.length,
						message: msg_1
					});
				} else {
					modeStack.pop();
					var newMode = last(modeStack);
					patternIdxToConfig = _this.patternIdxToConfig[newMode];
					currCharCodeToPatternIdxToConfig = _this.charCodeToPatternIdxToConfig[newMode];
					currModePatternsLength = patternIdxToConfig.length;
					var modeCanBeOptimized = _this.canModeBeOptimized[newMode] && _this.config.safeMode === false;
					if (currCharCodeToPatternIdxToConfig && modeCanBeOptimized) getPossiblePatterns = getPossiblePatternsOptimized;
					else getPossiblePatterns = getPossiblePatternsSlow;
				}
			};
			function push_mode(newMode) {
				modeStack.push(newMode);
				currCharCodeToPatternIdxToConfig = this.charCodeToPatternIdxToConfig[newMode];
				patternIdxToConfig = this.patternIdxToConfig[newMode];
				currModePatternsLength = patternIdxToConfig.length;
				currModePatternsLength = patternIdxToConfig.length;
				var modeCanBeOptimized = this.canModeBeOptimized[newMode] && this.config.safeMode === false;
				if (currCharCodeToPatternIdxToConfig && modeCanBeOptimized) getPossiblePatterns = getPossiblePatternsOptimized;
				else getPossiblePatterns = getPossiblePatternsSlow;
			}
			push_mode.call(this, initialMode);
			var currConfig;
			while (offset < orgLength) {
				matchedImage = null;
				var nextCharCode = orgText.charCodeAt(offset);
				var chosenPatternIdxToConfig = getPossiblePatterns(nextCharCode);
				var chosenPatternsLength = chosenPatternIdxToConfig.length;
				for (i = 0; i < chosenPatternsLength; i++) {
					currConfig = chosenPatternIdxToConfig[i];
					var currPattern = currConfig.pattern;
					payload = null;
					var singleCharCode = currConfig.short;
					if (singleCharCode !== false) {
						if (nextCharCode === singleCharCode) matchedImage = currPattern;
					} else if (currConfig.isCustom === true) {
						match = currPattern.exec(orgText, offset, matchedTokens, groups);
						if (match !== null) {
							matchedImage = match[0];
							if (match.payload !== void 0) payload = match.payload;
						} else matchedImage = null;
					} else {
						this.updateLastIndex(currPattern, offset);
						matchedImage = this.match(currPattern, text, offset);
					}
					if (matchedImage !== null) {
						longerAltIdx = currConfig.longerAlt;
						if (longerAltIdx !== void 0) {
							var longerAltConfig = patternIdxToConfig[longerAltIdx];
							var longerAltPattern = longerAltConfig.pattern;
							altPayload = null;
							if (longerAltConfig.isCustom === true) {
								match = longerAltPattern.exec(orgText, offset, matchedTokens, groups);
								if (match !== null) {
									matchAltImage = match[0];
									if (match.payload !== void 0) altPayload = match.payload;
								} else matchAltImage = null;
							} else {
								this.updateLastIndex(longerAltPattern, offset);
								matchAltImage = this.match(longerAltPattern, text, offset);
							}
							if (matchAltImage && matchAltImage.length > matchedImage.length) {
								matchedImage = matchAltImage;
								payload = altPayload;
								currConfig = longerAltConfig;
							}
						}
						break;
					}
				}
				if (matchedImage !== null) {
					imageLength = matchedImage.length;
					group = currConfig.group;
					if (group !== void 0) {
						tokType = currConfig.tokenTypeIdx;
						newToken = this.createTokenInstance(matchedImage, offset, tokType, currConfig.tokenType, line, column, imageLength);
						this.handlePayload(newToken, payload);
						if (group === false) matchedTokensIndex = this.addToken(matchedTokens, matchedTokensIndex, newToken);
						else groups[group].push(newToken);
					}
					text = this.chopInput(text, imageLength);
					offset = offset + imageLength;
					column = this.computeNewColumn(column, imageLength);
					if (trackLines === true && currConfig.canLineTerminator === true) {
						var numOfLTsInMatch = 0;
						var foundTerminator = void 0;
						var lastLTEndOffset = void 0;
						lineTerminatorPattern.lastIndex = 0;
						do {
							foundTerminator = lineTerminatorPattern.test(matchedImage);
							if (foundTerminator === true) {
								lastLTEndOffset = lineTerminatorPattern.lastIndex - 1;
								numOfLTsInMatch++;
							}
						} while (foundTerminator === true);
						if (numOfLTsInMatch !== 0) {
							line = line + numOfLTsInMatch;
							column = imageLength - lastLTEndOffset;
							this.updateTokenEndLineColumnLocation(newToken, group, lastLTEndOffset, numOfLTsInMatch, line, column, imageLength);
						}
					}
					this.handleModes(currConfig, pop_mode, push_mode, newToken);
				} else {
					var errorStartOffset = offset;
					var errorLine = line;
					var errorColumn = column;
					var foundResyncPoint = false;
					while (!foundResyncPoint && offset < orgLength) {
						orgText.charCodeAt(offset);
						text = this.chopInput(text, 1);
						offset++;
						for (j = 0; j < currModePatternsLength; j++) {
							var currConfig_1 = patternIdxToConfig[j];
							var currPattern = currConfig_1.pattern;
							var singleCharCode = currConfig_1.short;
							if (singleCharCode !== false) {
								if (orgText.charCodeAt(offset) === singleCharCode) foundResyncPoint = true;
							} else if (currConfig_1.isCustom === true) foundResyncPoint = currPattern.exec(orgText, offset, matchedTokens, groups) !== null;
							else {
								this.updateLastIndex(currPattern, offset);
								foundResyncPoint = currPattern.exec(text) !== null;
							}
							if (foundResyncPoint === true) break;
						}
					}
					errLength = offset - errorStartOffset;
					msg = this.config.errorMessageProvider.buildUnexpectedCharactersMessage(orgText, errorStartOffset, errLength, errorLine, errorColumn);
					errors.push({
						offset: errorStartOffset,
						line: errorLine,
						column: errorColumn,
						length: errLength,
						message: msg
					});
				}
			}
			if (!this.hasCustom) matchedTokens.length = matchedTokensIndex;
			return {
				tokens: matchedTokens,
				groups,
				errors
			};
		};
		Lexer.prototype.handleModes = function(config, pop_mode, push_mode, newToken) {
			if (config.pop === true) {
				var pushMode = config.push;
				pop_mode(newToken);
				if (pushMode !== void 0) push_mode.call(this, pushMode);
			} else if (config.push !== void 0) push_mode.call(this, config.push);
		};
		Lexer.prototype.chopInput = function(text, length) {
			return text.substring(length);
		};
		Lexer.prototype.updateLastIndex = function(regExp, newLastIndex) {
			regExp.lastIndex = newLastIndex;
		};
		Lexer.prototype.updateTokenEndLineColumnLocation = function(newToken, group, lastLTIdx, numOfLTsInMatch, line, column, imageLength) {
			var lastCharIsLT, fixForEndingInLT;
			if (group !== void 0) {
				lastCharIsLT = lastLTIdx === imageLength - 1;
				fixForEndingInLT = lastCharIsLT ? -1 : 0;
				if (!(numOfLTsInMatch === 1 && lastCharIsLT === true)) {
					newToken.endLine = line + fixForEndingInLT;
					newToken.endColumn = column - 1 + -fixForEndingInLT;
				}
			}
		};
		Lexer.prototype.computeNewColumn = function(oldColumn, imageLength) {
			return oldColumn + imageLength;
		};
		/* istanbul ignore next - place holder */
		Lexer.prototype.createTokenInstance = function() {
			var args = [];
			for (var _i = 0; _i < arguments.length; _i++) args[_i] = arguments[_i];
			return null;
		};
		Lexer.prototype.createOffsetOnlyToken = function(image, startOffset, tokenTypeIdx, tokenType) {
			return {
				image,
				startOffset,
				tokenTypeIdx,
				tokenType
			};
		};
		Lexer.prototype.createStartOnlyToken = function(image, startOffset, tokenTypeIdx, tokenType, startLine, startColumn) {
			return {
				image,
				startOffset,
				startLine,
				startColumn,
				tokenTypeIdx,
				tokenType
			};
		};
		Lexer.prototype.createFullToken = function(image, startOffset, tokenTypeIdx, tokenType, startLine, startColumn, imageLength) {
			return {
				image,
				startOffset,
				endOffset: startOffset + imageLength - 1,
				startLine,
				endLine: startLine,
				startColumn,
				endColumn: startColumn + imageLength - 1,
				tokenTypeIdx,
				tokenType
			};
		};
		/* istanbul ignore next - place holder */
		Lexer.prototype.addToken = function(tokenVector, index, tokenToAdd) {
			return 666;
		};
		Lexer.prototype.addTokenUsingPush = function(tokenVector, index, tokenToAdd) {
			tokenVector.push(tokenToAdd);
			return index;
		};
		Lexer.prototype.addTokenUsingMemberAccess = function(tokenVector, index, tokenToAdd) {
			tokenVector[index] = tokenToAdd;
			index++;
			return index;
		};
		/* istanbul ignore next - place holder */
		Lexer.prototype.handlePayload = function(token, payload) {};
		Lexer.prototype.handlePayloadNoCustom = function(token, payload) {};
		Lexer.prototype.handlePayloadWithCustom = function(token, payload) {
			if (payload !== null) token.payload = payload;
		};
		/* istanbul ignore next - place holder to be replaced with chosen alternative at runtime */
		Lexer.prototype.match = function(pattern, text, offset) {
			return null;
		};
		Lexer.prototype.matchWithTest = function(pattern, text, offset) {
			if (pattern.test(text) === true) return text.substring(offset, pattern.lastIndex);
			return null;
		};
		Lexer.prototype.matchWithExec = function(pattern, text) {
			var regExpArray = pattern.exec(text);
			return regExpArray !== null ? regExpArray[0] : regExpArray;
		};
		Lexer.prototype.TRACE_INIT = function(phaseDesc, phaseImpl) {
			if (this.traceInitPerf === true) {
				this.traceInitIndent++;
				var indent = new Array(this.traceInitIndent + 1).join("	");
				if (this.traceInitIndent < this.traceInitMaxIdent) console.log(indent + "--> <" + phaseDesc + ">");
				var _a = timer(phaseImpl), time = _a.time, value = _a.value;
				/* istanbul ignore next - Difficult to reproduce specific performance behavior (>10ms) in tests */
				var traceMethod = time > 10 ? console.warn : console.log;
				if (this.traceInitIndent < this.traceInitMaxIdent) traceMethod(indent + "<-- <" + phaseDesc + "> time: " + time + "ms");
				this.traceInitIndent--;
				return value;
			} else return phaseImpl();
		};
		Lexer.SKIPPED = "This marks a skipped Token pattern, this means each token identified by it willbe consumed and then thrown into oblivion, this can be used to for example to completely ignore whitespace.";
		Lexer.NA = /NOT_APPLICABLE/;
		return Lexer;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/scan/tokens_public.js
function tokenLabel(tokType) {
	if (hasTokenLabel(tokType)) return tokType.LABEL;
	else return tokType.name;
}
function tokenName(tokType) {
	return tokType.name;
}
function hasTokenLabel(obj) {
	return isString(obj.LABEL) && obj.LABEL !== "";
}
function createToken(config) {
	return createTokenInternal(config);
}
function createTokenInternal(config) {
	var pattern = config.pattern;
	var tokenType = {};
	tokenType.name = config.name;
	if (!isUndefined(pattern)) tokenType.PATTERN = pattern;
	if (has(config, PARENT)) throw "The parent property is no longer supported.\nSee: https://github.com/SAP/chevrotain/issues/564#issuecomment-349062346 for details.";
	if (has(config, CATEGORIES)) tokenType.CATEGORIES = config[CATEGORIES];
	augmentTokenTypes([tokenType]);
	if (has(config, LABEL)) tokenType.LABEL = config[LABEL];
	if (has(config, GROUP)) tokenType.GROUP = config[GROUP];
	if (has(config, POP_MODE)) tokenType.POP_MODE = config[POP_MODE];
	if (has(config, PUSH_MODE)) tokenType.PUSH_MODE = config[PUSH_MODE];
	if (has(config, LONGER_ALT)) tokenType.LONGER_ALT = config[LONGER_ALT];
	if (has(config, LINE_BREAKS)) tokenType.LINE_BREAKS = config[LINE_BREAKS];
	if (has(config, START_CHARS_HINT)) tokenType.START_CHARS_HINT = config[START_CHARS_HINT];
	return tokenType;
}
function createTokenInstance(tokType, image, startOffset, endOffset, startLine, endLine, startColumn, endColumn) {
	return {
		image,
		startOffset,
		endOffset,
		startLine,
		endLine,
		startColumn,
		endColumn,
		tokenTypeIdx: tokType.tokenTypeIdx,
		tokenType: tokType
	};
}
function tokenMatcher(token, tokType) {
	return tokenStructuredMatcher(token, tokType);
}
var PARENT, CATEGORIES, LABEL, GROUP, PUSH_MODE, POP_MODE, LONGER_ALT, LINE_BREAKS, START_CHARS_HINT, EOF;
var init_tokens_public = __esmMin((() => {
	init_utils();
	init_lexer_public();
	init_tokens();
	PARENT = "parent";
	CATEGORIES = "categories";
	LABEL = "label";
	GROUP = "group";
	PUSH_MODE = "push_mode";
	POP_MODE = "pop_mode";
	LONGER_ALT = "longer_alt";
	LINE_BREAKS = "line_breaks";
	START_CHARS_HINT = "start_chars_hint";
	EOF = createToken({
		name: "EOF",
		pattern: Lexer.NA
	});
	augmentTokenTypes([EOF]);
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/gast/gast_public.js
function serializeGrammar(topRules) {
	return map(topRules, serializeProduction);
}
function serializeProduction(node) {
	function convertDefinition(definition) {
		return map(definition, serializeProduction);
	}
	/* istanbul ignore else */
	if (node instanceof NonTerminal) return {
		type: "NonTerminal",
		name: node.nonTerminalName,
		idx: node.idx
	};
	else if (node instanceof Alternative) return {
		type: "Alternative",
		definition: convertDefinition(node.definition)
	};
	else if (node instanceof Option) return {
		type: "Option",
		idx: node.idx,
		definition: convertDefinition(node.definition)
	};
	else if (node instanceof RepetitionMandatory) return {
		type: "RepetitionMandatory",
		idx: node.idx,
		definition: convertDefinition(node.definition)
	};
	else if (node instanceof RepetitionMandatoryWithSeparator) return {
		type: "RepetitionMandatoryWithSeparator",
		idx: node.idx,
		separator: serializeProduction(new Terminal({ terminalType: node.separator })),
		definition: convertDefinition(node.definition)
	};
	else if (node instanceof RepetitionWithSeparator) return {
		type: "RepetitionWithSeparator",
		idx: node.idx,
		separator: serializeProduction(new Terminal({ terminalType: node.separator })),
		definition: convertDefinition(node.definition)
	};
	else if (node instanceof Repetition) return {
		type: "Repetition",
		idx: node.idx,
		definition: convertDefinition(node.definition)
	};
	else if (node instanceof Alternation) return {
		type: "Alternation",
		idx: node.idx,
		definition: convertDefinition(node.definition)
	};
	else if (node instanceof Terminal) {
		var serializedTerminal = {
			type: "Terminal",
			name: node.terminalType.name,
			label: tokenLabel(node.terminalType),
			idx: node.idx
		};
		var pattern = node.terminalType.PATTERN;
		if (node.terminalType.PATTERN) serializedTerminal.pattern = isRegExp(pattern) ? pattern.source : pattern;
		return serializedTerminal;
	} else if (node instanceof Rule) return {
		type: "Rule",
		name: node.name,
		orgText: node.orgText,
		definition: convertDefinition(node.definition)
	};
	else throw Error("non exhaustive match");
}
var __extends$8, AbstractProduction, NonTerminal, Rule, Alternative, Option, RepetitionMandatory, RepetitionMandatoryWithSeparator, Repetition, RepetitionWithSeparator, Alternation, Terminal;
var init_gast_public = __esmMin((() => {
	init_utils();
	init_tokens_public();
	__extends$8 = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	AbstractProduction = function() {
		function AbstractProduction(_definition) {
			this._definition = _definition;
		}
		Object.defineProperty(AbstractProduction.prototype, "definition", {
			get: function() {
				return this._definition;
			},
			set: function(value) {
				this._definition = value;
			},
			enumerable: false,
			configurable: true
		});
		AbstractProduction.prototype.accept = function(visitor) {
			visitor.visit(this);
			forEach(this.definition, function(prod) {
				prod.accept(visitor);
			});
		};
		return AbstractProduction;
	}();
	NonTerminal = function(_super) {
		__extends$8(NonTerminal, _super);
		function NonTerminal(options) {
			var _this = _super.call(this, []) || this;
			_this.idx = 1;
			assign(_this, pick(options, function(v) {
				return v !== void 0;
			}));
			return _this;
		}
		Object.defineProperty(NonTerminal.prototype, "definition", {
			get: function() {
				if (this.referencedRule !== void 0) return this.referencedRule.definition;
				return [];
			},
			set: function(definition) {},
			enumerable: false,
			configurable: true
		});
		NonTerminal.prototype.accept = function(visitor) {
			visitor.visit(this);
		};
		return NonTerminal;
	}(AbstractProduction);
	Rule = function(_super) {
		__extends$8(Rule, _super);
		function Rule(options) {
			var _this = _super.call(this, options.definition) || this;
			_this.orgText = "";
			assign(_this, pick(options, function(v) {
				return v !== void 0;
			}));
			return _this;
		}
		return Rule;
	}(AbstractProduction);
	Alternative = function(_super) {
		__extends$8(Alternative, _super);
		function Alternative(options) {
			var _this = _super.call(this, options.definition) || this;
			_this.ignoreAmbiguities = false;
			assign(_this, pick(options, function(v) {
				return v !== void 0;
			}));
			return _this;
		}
		return Alternative;
	}(AbstractProduction);
	Option = function(_super) {
		__extends$8(Option, _super);
		function Option(options) {
			var _this = _super.call(this, options.definition) || this;
			_this.idx = 1;
			assign(_this, pick(options, function(v) {
				return v !== void 0;
			}));
			return _this;
		}
		return Option;
	}(AbstractProduction);
	RepetitionMandatory = function(_super) {
		__extends$8(RepetitionMandatory, _super);
		function RepetitionMandatory(options) {
			var _this = _super.call(this, options.definition) || this;
			_this.idx = 1;
			assign(_this, pick(options, function(v) {
				return v !== void 0;
			}));
			return _this;
		}
		return RepetitionMandatory;
	}(AbstractProduction);
	RepetitionMandatoryWithSeparator = function(_super) {
		__extends$8(RepetitionMandatoryWithSeparator, _super);
		function RepetitionMandatoryWithSeparator(options) {
			var _this = _super.call(this, options.definition) || this;
			_this.idx = 1;
			assign(_this, pick(options, function(v) {
				return v !== void 0;
			}));
			return _this;
		}
		return RepetitionMandatoryWithSeparator;
	}(AbstractProduction);
	Repetition = function(_super) {
		__extends$8(Repetition, _super);
		function Repetition(options) {
			var _this = _super.call(this, options.definition) || this;
			_this.idx = 1;
			assign(_this, pick(options, function(v) {
				return v !== void 0;
			}));
			return _this;
		}
		return Repetition;
	}(AbstractProduction);
	RepetitionWithSeparator = function(_super) {
		__extends$8(RepetitionWithSeparator, _super);
		function RepetitionWithSeparator(options) {
			var _this = _super.call(this, options.definition) || this;
			_this.idx = 1;
			assign(_this, pick(options, function(v) {
				return v !== void 0;
			}));
			return _this;
		}
		return RepetitionWithSeparator;
	}(AbstractProduction);
	Alternation = function(_super) {
		__extends$8(Alternation, _super);
		function Alternation(options) {
			var _this = _super.call(this, options.definition) || this;
			_this.idx = 1;
			_this.ignoreAmbiguities = false;
			_this.hasPredicates = false;
			assign(_this, pick(options, function(v) {
				return v !== void 0;
			}));
			return _this;
		}
		Object.defineProperty(Alternation.prototype, "definition", {
			get: function() {
				return this._definition;
			},
			set: function(value) {
				this._definition = value;
			},
			enumerable: false,
			configurable: true
		});
		return Alternation;
	}(AbstractProduction);
	Terminal = function() {
		function Terminal(options) {
			this.idx = 1;
			assign(this, pick(options, function(v) {
				return v !== void 0;
			}));
		}
		Terminal.prototype.accept = function(visitor) {
			visitor.visit(this);
		};
		return Terminal;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/rest.js
function restForRepetitionWithSeparator(repSepProd, currRest, prevRest) {
	return [new Option({ definition: [new Terminal({ terminalType: repSepProd.separator })].concat(repSepProd.definition) })].concat(currRest, prevRest);
}
var RestWalker;
var init_rest = __esmMin((() => {
	init_utils();
	init_gast_public();
	RestWalker = function() {
		function RestWalker() {}
		RestWalker.prototype.walk = function(prod, prevRest) {
			var _this = this;
			if (prevRest === void 0) prevRest = [];
			forEach(prod.definition, function(subProd, index) {
				var currRest = drop(prod.definition, index + 1);
				/* istanbul ignore else */
				if (subProd instanceof NonTerminal) _this.walkProdRef(subProd, currRest, prevRest);
				else if (subProd instanceof Terminal) _this.walkTerminal(subProd, currRest, prevRest);
				else if (subProd instanceof Alternative) _this.walkFlat(subProd, currRest, prevRest);
				else if (subProd instanceof Option) _this.walkOption(subProd, currRest, prevRest);
				else if (subProd instanceof RepetitionMandatory) _this.walkAtLeastOne(subProd, currRest, prevRest);
				else if (subProd instanceof RepetitionMandatoryWithSeparator) _this.walkAtLeastOneSep(subProd, currRest, prevRest);
				else if (subProd instanceof RepetitionWithSeparator) _this.walkManySep(subProd, currRest, prevRest);
				else if (subProd instanceof Repetition) _this.walkMany(subProd, currRest, prevRest);
				else if (subProd instanceof Alternation) _this.walkOr(subProd, currRest, prevRest);
				else throw Error("non exhaustive match");
			});
		};
		RestWalker.prototype.walkTerminal = function(terminal, currRest, prevRest) {};
		RestWalker.prototype.walkProdRef = function(refProd, currRest, prevRest) {};
		RestWalker.prototype.walkFlat = function(flatProd, currRest, prevRest) {
			var fullOrRest = currRest.concat(prevRest);
			this.walk(flatProd, fullOrRest);
		};
		RestWalker.prototype.walkOption = function(optionProd, currRest, prevRest) {
			var fullOrRest = currRest.concat(prevRest);
			this.walk(optionProd, fullOrRest);
		};
		RestWalker.prototype.walkAtLeastOne = function(atLeastOneProd, currRest, prevRest) {
			var fullAtLeastOneRest = [new Option({ definition: atLeastOneProd.definition })].concat(currRest, prevRest);
			this.walk(atLeastOneProd, fullAtLeastOneRest);
		};
		RestWalker.prototype.walkAtLeastOneSep = function(atLeastOneSepProd, currRest, prevRest) {
			var fullAtLeastOneSepRest = restForRepetitionWithSeparator(atLeastOneSepProd, currRest, prevRest);
			this.walk(atLeastOneSepProd, fullAtLeastOneSepRest);
		};
		RestWalker.prototype.walkMany = function(manyProd, currRest, prevRest) {
			var fullManyRest = [new Option({ definition: manyProd.definition })].concat(currRest, prevRest);
			this.walk(manyProd, fullManyRest);
		};
		RestWalker.prototype.walkManySep = function(manySepProd, currRest, prevRest) {
			var fullManySepRest = restForRepetitionWithSeparator(manySepProd, currRest, prevRest);
			this.walk(manySepProd, fullManySepRest);
		};
		RestWalker.prototype.walkOr = function(orProd, currRest, prevRest) {
			var _this = this;
			var fullOrRest = currRest.concat(prevRest);
			forEach(orProd.definition, function(alt) {
				var prodWrapper = new Alternative({ definition: [alt] });
				_this.walk(prodWrapper, fullOrRest);
			});
		};
		return RestWalker;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/gast/gast_visitor_public.js
var GAstVisitor;
var init_gast_visitor_public = __esmMin((() => {
	init_gast_public();
	GAstVisitor = function() {
		function GAstVisitor() {}
		GAstVisitor.prototype.visit = function(node) {
			var nodeAny = node;
			switch (nodeAny.constructor) {
				case NonTerminal: return this.visitNonTerminal(nodeAny);
				case Alternative: return this.visitAlternative(nodeAny);
				case Option: return this.visitOption(nodeAny);
				case RepetitionMandatory: return this.visitRepetitionMandatory(nodeAny);
				case RepetitionMandatoryWithSeparator: return this.visitRepetitionMandatoryWithSeparator(nodeAny);
				case RepetitionWithSeparator: return this.visitRepetitionWithSeparator(nodeAny);
				case Repetition: return this.visitRepetition(nodeAny);
				case Alternation: return this.visitAlternation(nodeAny);
				case Terminal: return this.visitTerminal(nodeAny);
				case Rule: return this.visitRule(nodeAny);
				/* istanbul ignore next */
				default: throw Error("non exhaustive match");
			}
		};
		GAstVisitor.prototype.visitNonTerminal = function(node) {};
		GAstVisitor.prototype.visitAlternative = function(node) {};
		GAstVisitor.prototype.visitOption = function(node) {};
		GAstVisitor.prototype.visitRepetition = function(node) {};
		GAstVisitor.prototype.visitRepetitionMandatory = function(node) {};
		GAstVisitor.prototype.visitRepetitionMandatoryWithSeparator = function(node) {};
		GAstVisitor.prototype.visitRepetitionWithSeparator = function(node) {};
		GAstVisitor.prototype.visitAlternation = function(node) {};
		GAstVisitor.prototype.visitTerminal = function(node) {};
		GAstVisitor.prototype.visitRule = function(node) {};
		return GAstVisitor;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/gast/gast.js
function isSequenceProd(prod) {
	return prod instanceof Alternative || prod instanceof Option || prod instanceof Repetition || prod instanceof RepetitionMandatory || prod instanceof RepetitionMandatoryWithSeparator || prod instanceof RepetitionWithSeparator || prod instanceof Terminal || prod instanceof Rule;
}
function isOptionalProd(prod, alreadyVisited) {
	if (alreadyVisited === void 0) alreadyVisited = [];
	if (prod instanceof Option || prod instanceof Repetition || prod instanceof RepetitionWithSeparator) return true;
	if (prod instanceof Alternation) return some(prod.definition, function(subProd) {
		return isOptionalProd(subProd, alreadyVisited);
	});
	else if (prod instanceof NonTerminal && contains(alreadyVisited, prod)) return false;
	else if (prod instanceof AbstractProduction) {
		if (prod instanceof NonTerminal) alreadyVisited.push(prod);
		return every(prod.definition, function(subProd) {
			return isOptionalProd(subProd, alreadyVisited);
		});
	} else return false;
}
function isBranchingProd(prod) {
	return prod instanceof Alternation;
}
function getProductionDslName(prod) {
	/* istanbul ignore else */
	if (prod instanceof NonTerminal) return "SUBRULE";
	else if (prod instanceof Option) return "OPTION";
	else if (prod instanceof Alternation) return "OR";
	else if (prod instanceof RepetitionMandatory) return "AT_LEAST_ONE";
	else if (prod instanceof RepetitionMandatoryWithSeparator) return "AT_LEAST_ONE_SEP";
	else if (prod instanceof RepetitionWithSeparator) return "MANY_SEP";
	else if (prod instanceof Repetition) return "MANY";
	else if (prod instanceof Terminal) return "CONSUME";
	else throw Error("non exhaustive match");
}
function collectMethods(rule) {
	collectorVisitor.reset();
	rule.accept(collectorVisitor);
	var dslMethods = collectorVisitor.dslMethods;
	collectorVisitor.reset();
	return dslMethods;
}
var __extends$7, DslMethodsCollectorVisitor, collectorVisitor;
var init_gast = __esmMin((() => {
	init_utils();
	init_gast_public();
	init_gast_visitor_public();
	__extends$7 = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	DslMethodsCollectorVisitor = function(_super) {
		__extends$7(DslMethodsCollectorVisitor, _super);
		function DslMethodsCollectorVisitor() {
			var _this = _super !== null && _super.apply(this, arguments) || this;
			_this.separator = "-";
			_this.dslMethods = {
				option: [],
				alternation: [],
				repetition: [],
				repetitionWithSeparator: [],
				repetitionMandatory: [],
				repetitionMandatoryWithSeparator: []
			};
			return _this;
		}
		DslMethodsCollectorVisitor.prototype.reset = function() {
			this.dslMethods = {
				option: [],
				alternation: [],
				repetition: [],
				repetitionWithSeparator: [],
				repetitionMandatory: [],
				repetitionMandatoryWithSeparator: []
			};
		};
		DslMethodsCollectorVisitor.prototype.visitTerminal = function(terminal) {
			var key = terminal.terminalType.name + this.separator + "Terminal";
			if (!has(this.dslMethods, key)) this.dslMethods[key] = [];
			this.dslMethods[key].push(terminal);
		};
		DslMethodsCollectorVisitor.prototype.visitNonTerminal = function(subrule) {
			var key = subrule.nonTerminalName + this.separator + "Terminal";
			if (!has(this.dslMethods, key)) this.dslMethods[key] = [];
			this.dslMethods[key].push(subrule);
		};
		DslMethodsCollectorVisitor.prototype.visitOption = function(option) {
			this.dslMethods.option.push(option);
		};
		DslMethodsCollectorVisitor.prototype.visitRepetitionWithSeparator = function(manySep) {
			this.dslMethods.repetitionWithSeparator.push(manySep);
		};
		DslMethodsCollectorVisitor.prototype.visitRepetitionMandatory = function(atLeastOne) {
			this.dslMethods.repetitionMandatory.push(atLeastOne);
		};
		DslMethodsCollectorVisitor.prototype.visitRepetitionMandatoryWithSeparator = function(atLeastOneSep) {
			this.dslMethods.repetitionMandatoryWithSeparator.push(atLeastOneSep);
		};
		DslMethodsCollectorVisitor.prototype.visitRepetition = function(many) {
			this.dslMethods.repetition.push(many);
		};
		DslMethodsCollectorVisitor.prototype.visitAlternation = function(or) {
			this.dslMethods.alternation.push(or);
		};
		return DslMethodsCollectorVisitor;
	}(GAstVisitor);
	collectorVisitor = new DslMethodsCollectorVisitor();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/first.js
function first(prod) {
	/* istanbul ignore else */
	if (prod instanceof NonTerminal) return first(prod.referencedRule);
	else if (prod instanceof Terminal) return firstForTerminal(prod);
	else if (isSequenceProd(prod)) return firstForSequence(prod);
	else if (isBranchingProd(prod)) return firstForBranching(prod);
	else throw Error("non exhaustive match");
}
function firstForSequence(prod) {
	var firstSet = [];
	var seq = prod.definition;
	var nextSubProdIdx = 0;
	var hasInnerProdsRemaining = seq.length > nextSubProdIdx;
	var currSubProd;
	var isLastInnerProdOptional = true;
	while (hasInnerProdsRemaining && isLastInnerProdOptional) {
		currSubProd = seq[nextSubProdIdx];
		isLastInnerProdOptional = isOptionalProd(currSubProd);
		firstSet = firstSet.concat(first(currSubProd));
		nextSubProdIdx = nextSubProdIdx + 1;
		hasInnerProdsRemaining = seq.length > nextSubProdIdx;
	}
	return uniq(firstSet);
}
function firstForBranching(prod) {
	return uniq(flatten(map(prod.definition, function(innerProd) {
		return first(innerProd);
	})));
}
function firstForTerminal(terminal) {
	return [terminal.terminalType];
}
var init_first = __esmMin((() => {
	init_utils();
	init_gast_public();
	init_gast();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/constants.js
var IN;
var init_constants = __esmMin((() => {
	IN = "_~IN~_";
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/follow.js
function computeAllProdsFollows(topProductions) {
	var reSyncFollows = {};
	forEach(topProductions, function(topProd) {
		assign(reSyncFollows, new ResyncFollowsWalker(topProd).startWalking());
	});
	return reSyncFollows;
}
function buildBetweenProdsFollowPrefix(inner, occurenceInParent) {
	return inner.name + occurenceInParent + IN;
}
var __extends$6, ResyncFollowsWalker;
var init_follow = __esmMin((() => {
	init_rest();
	init_first();
	init_utils();
	init_constants();
	init_gast_public();
	__extends$6 = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	ResyncFollowsWalker = function(_super) {
		__extends$6(ResyncFollowsWalker, _super);
		function ResyncFollowsWalker(topProd) {
			var _this = _super.call(this) || this;
			_this.topProd = topProd;
			_this.follows = {};
			return _this;
		}
		ResyncFollowsWalker.prototype.startWalking = function() {
			this.walk(this.topProd);
			return this.follows;
		};
		ResyncFollowsWalker.prototype.walkTerminal = function(terminal, currRest, prevRest) {};
		ResyncFollowsWalker.prototype.walkProdRef = function(refProd, currRest, prevRest) {
			var followName = buildBetweenProdsFollowPrefix(refProd.referencedRule, refProd.idx) + this.topProd.name;
			var fullRest = currRest.concat(prevRest);
			var t_in_topProd_follows = first(new Alternative({ definition: fullRest }));
			this.follows[followName] = t_in_topProd_follows;
		};
		return ResyncFollowsWalker;
	}(RestWalker);
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/errors_public.js
var defaultParserErrorProvider, defaultGrammarResolverErrorProvider, defaultGrammarValidatorErrorProvider;
var init_errors_public = __esmMin((() => {
	init_tokens_public();
	init_utils();
	init_gast_public();
	init_gast();
	defaultParserErrorProvider = {
		buildMismatchTokenMessage: function(_a) {
			var expected = _a.expected, actual = _a.actual;
			_a.previous;
			_a.ruleName;
			return "Expecting " + (hasTokenLabel(expected) ? "--> " + tokenLabel(expected) + " <--" : "token of type --> " + expected.name + " <--") + " but found --> '" + actual.image + "' <--";
		},
		buildNotAllInputParsedMessage: function(_a) {
			var firstRedundant = _a.firstRedundant;
			_a.ruleName;
			return "Redundant input, expecting EOF but found: " + firstRedundant.image;
		},
		buildNoViableAltMessage: function(_a) {
			var expectedPathsPerAlt = _a.expectedPathsPerAlt, actual = _a.actual;
			_a.previous;
			var customUserDescription = _a.customUserDescription;
			_a.ruleName;
			var errPrefix = "Expecting: ";
			var errSuffix = "\nbut found: '" + first$1(actual).image + "'";
			if (customUserDescription) return errPrefix + customUserDescription + errSuffix;
			else return errPrefix + ("one of these possible Token sequences:\n" + map(map(reduce(expectedPathsPerAlt, function(result, currAltPaths) {
				return result.concat(currAltPaths);
			}, []), function(currPath) {
				return "[" + map(currPath, function(currTokenType) {
					return tokenLabel(currTokenType);
				}).join(", ") + "]";
			}), function(itemMsg, idx) {
				return "  " + (idx + 1) + ". " + itemMsg;
			}).join("\n")) + errSuffix;
		},
		buildEarlyExitMessage: function(_a) {
			var expectedIterationPaths = _a.expectedIterationPaths, actual = _a.actual, customUserDescription = _a.customUserDescription;
			_a.ruleName;
			var errPrefix = "Expecting: ";
			var errSuffix = "\nbut found: '" + first$1(actual).image + "'";
			if (customUserDescription) return errPrefix + customUserDescription + errSuffix;
			else return errPrefix + ("expecting at least one iteration which starts with one of these possible Token sequences::\n  " + ("<" + map(expectedIterationPaths, function(currPath) {
				return "[" + map(currPath, function(currTokenType) {
					return tokenLabel(currTokenType);
				}).join(",") + "]";
			}).join(" ,") + ">")) + errSuffix;
		}
	};
	Object.freeze(defaultParserErrorProvider);
	defaultGrammarResolverErrorProvider = { buildRuleNotFoundError: function(topLevelRule, undefinedRule) {
		return "Invalid grammar, reference to a rule which is not defined: ->" + undefinedRule.nonTerminalName + "<-\ninside top level rule: ->" + topLevelRule.name + "<-";
	} };
	defaultGrammarValidatorErrorProvider = {
		buildDuplicateFoundError: function(topLevelRule, duplicateProds) {
			function getExtraProductionArgument(prod) {
				if (prod instanceof Terminal) return prod.terminalType.name;
				else if (prod instanceof NonTerminal) return prod.nonTerminalName;
				else return "";
			}
			var topLevelName = topLevelRule.name;
			var duplicateProd = first$1(duplicateProds);
			var index = duplicateProd.idx;
			var dslName = getProductionDslName(duplicateProd);
			var extraArgument = getExtraProductionArgument(duplicateProd);
			var hasExplicitIndex = index > 0;
			var msg = "->" + dslName + (hasExplicitIndex ? index : "") + "<- " + (extraArgument ? "with argument: ->" + extraArgument + "<-" : "") + "\n                  appears more than once (" + duplicateProds.length + " times) in the top level rule: ->" + topLevelName + "<-.                  \n                  For further details see: https://sap.github.io/chevrotain/docs/FAQ.html#NUMERICAL_SUFFIXES \n                  ";
			msg = msg.replace(/[ \t]+/g, " ");
			msg = msg.replace(/\s\s+/g, "\n");
			return msg;
		},
		buildNamespaceConflictError: function(rule) {
			return "Namespace conflict found in grammar.\n" + ("The grammar has both a Terminal(Token) and a Non-Terminal(Rule) named: <" + rule.name + ">.\n") + "To resolve this make sure each Terminal and Non-Terminal names are unique\nThis is easy to accomplish by using the convention that Terminal names start with an uppercase letter\nand Non-Terminal names start with a lower case letter.";
		},
		buildAlternationPrefixAmbiguityError: function(options) {
			var pathMsg = map(options.prefixPath, function(currTok) {
				return tokenLabel(currTok);
			}).join(", ");
			var occurrence = options.alternation.idx === 0 ? "" : options.alternation.idx;
			return "Ambiguous alternatives: <" + options.ambiguityIndices.join(" ,") + "> due to common lookahead prefix\n" + ("in <OR" + occurrence + "> inside <" + options.topLevelRule.name + "> Rule,\n") + ("<" + pathMsg + "> may appears as a prefix path in all these alternatives.\n") + "See: https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#COMMON_PREFIX\nFor Further details.";
		},
		buildAlternationAmbiguityError: function(options) {
			var pathMsg = map(options.prefixPath, function(currtok) {
				return tokenLabel(currtok);
			}).join(", ");
			var occurrence = options.alternation.idx === 0 ? "" : options.alternation.idx;
			var currMessage = "Ambiguous Alternatives Detected: <" + options.ambiguityIndices.join(" ,") + "> in <OR" + occurrence + ">" + (" inside <" + options.topLevelRule.name + "> Rule,\n") + ("<" + pathMsg + "> may appears as a prefix path in all these alternatives.\n");
			currMessage = currMessage + "See: https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#AMBIGUOUS_ALTERNATIVES\nFor Further details.";
			return currMessage;
		},
		buildEmptyRepetitionError: function(options) {
			var dslName = getProductionDslName(options.repetition);
			if (options.repetition.idx !== 0) dslName += options.repetition.idx;
			return "The repetition <" + dslName + "> within Rule <" + options.topLevelRule.name + "> can never consume any tokens.\nThis could lead to an infinite loop.";
		},
		buildTokenNameError: function(options) {
			/* istanbul ignore next */
			return "deprecated";
		},
		buildEmptyAlternationError: function(options) {
			return "Ambiguous empty alternative: <" + (options.emptyChoiceIdx + 1) + ">" + (" in <OR" + options.alternation.idx + "> inside <" + options.topLevelRule.name + "> Rule.\n") + "Only the last alternative may be an empty alternative.";
		},
		buildTooManyAlternativesError: function(options) {
			return "An Alternation cannot have more than 256 alternatives:\n" + ("<OR" + options.alternation.idx + "> inside <" + options.topLevelRule.name + "> Rule.\n has " + (options.alternation.definition.length + 1) + " alternatives.");
		},
		buildLeftRecursionError: function(options) {
			var ruleName = options.topLevelRule.name;
			var pathNames = map(options.leftRecursionPath, function(currRule) {
				return currRule.name;
			});
			var leftRecursivePath = ruleName + " --> " + pathNames.concat([ruleName]).join(" --> ");
			return "Left Recursion found in grammar.\n" + ("rule: <" + ruleName + "> can be invoked from itself (directly or indirectly)\n") + ("without consuming any Tokens. The grammar path that causes this is: \n " + leftRecursivePath + "\n") + " To fix this refactor your grammar to remove the left recursion.\nsee: https://en.wikipedia.org/wiki/LL_parser#Left_Factoring.";
		},
		buildInvalidRuleNameError: function(options) {
			/* istanbul ignore next */
			return "deprecated";
		},
		buildDuplicateRuleNameError: function(options) {
			var ruleName;
			if (options.topLevelRule instanceof Rule) ruleName = options.topLevelRule.name;
			else ruleName = options.topLevelRule;
			return "Duplicate definition, rule: ->" + ruleName + "<- is already defined in the grammar: ->" + options.grammarName + "<-";
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/resolver.js
function resolveGrammar$1(topLevels, errMsgProvider) {
	var refResolver = new GastRefResolverVisitor(topLevels, errMsgProvider);
	refResolver.resolveRefs();
	return refResolver.errors;
}
var __extends$5, GastRefResolverVisitor;
var init_resolver = __esmMin((() => {
	init_parser();
	init_utils();
	init_gast_visitor_public();
	__extends$5 = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	GastRefResolverVisitor = function(_super) {
		__extends$5(GastRefResolverVisitor, _super);
		function GastRefResolverVisitor(nameToTopRule, errMsgProvider) {
			var _this = _super.call(this) || this;
			_this.nameToTopRule = nameToTopRule;
			_this.errMsgProvider = errMsgProvider;
			_this.errors = [];
			return _this;
		}
		GastRefResolverVisitor.prototype.resolveRefs = function() {
			var _this = this;
			forEach(values(this.nameToTopRule), function(prod) {
				_this.currTopLevel = prod;
				prod.accept(_this);
			});
		};
		GastRefResolverVisitor.prototype.visitNonTerminal = function(node) {
			var ref = this.nameToTopRule[node.nonTerminalName];
			if (!ref) {
				var msg = this.errMsgProvider.buildRuleNotFoundError(this.currTopLevel, node);
				this.errors.push({
					message: msg,
					type: ParserDefinitionErrorType.UNRESOLVED_SUBRULE_REF,
					ruleName: this.currTopLevel.name,
					unresolvedRefName: node.nonTerminalName
				});
			} else node.referencedRule = ref;
		};
		return GastRefResolverVisitor;
	}(GAstVisitor);
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/interpreter.js
function possiblePathsFrom(targetDef, maxLength, currPath) {
	if (currPath === void 0) currPath = [];
	currPath = cloneArr(currPath);
	var result = [];
	var i = 0;
	function remainingPathWith(nextDef) {
		return nextDef.concat(drop(targetDef, i + 1));
	}
	function getAlternativesForProd(definition) {
		var alternatives = possiblePathsFrom(remainingPathWith(definition), maxLength, currPath);
		return result.concat(alternatives);
	}
	/**
	* Mandatory productions will halt the loop as the paths computed from their recursive calls will already contain the
	* following (rest) of the targetDef.
	*
	* For optional productions (Option/Repetition/...) the loop will continue to represent the paths that do not include the
	* the optional production.
	*/
	while (currPath.length < maxLength && i < targetDef.length) {
		var prod = targetDef[i];
		/* istanbul ignore else */
		if (prod instanceof Alternative) return getAlternativesForProd(prod.definition);
		else if (prod instanceof NonTerminal) return getAlternativesForProd(prod.definition);
		else if (prod instanceof Option) result = getAlternativesForProd(prod.definition);
		else if (prod instanceof RepetitionMandatory) {
			var newDef = prod.definition.concat([new Repetition({ definition: prod.definition })]);
			return getAlternativesForProd(newDef);
		} else if (prod instanceof RepetitionMandatoryWithSeparator) {
			var newDef = [new Alternative({ definition: prod.definition }), new Repetition({ definition: [new Terminal({ terminalType: prod.separator })].concat(prod.definition) })];
			return getAlternativesForProd(newDef);
		} else if (prod instanceof RepetitionWithSeparator) {
			var newDef = prod.definition.concat([new Repetition({ definition: [new Terminal({ terminalType: prod.separator })].concat(prod.definition) })]);
			result = getAlternativesForProd(newDef);
		} else if (prod instanceof Repetition) {
			var newDef = prod.definition.concat([new Repetition({ definition: prod.definition })]);
			result = getAlternativesForProd(newDef);
		} else if (prod instanceof Alternation) {
			forEach(prod.definition, function(currAlt) {
				if (isEmpty(currAlt.definition) === false) result = getAlternativesForProd(currAlt.definition);
			});
			return result;
		} else if (prod instanceof Terminal) currPath.push(prod.terminalType);
		else throw Error("non exhaustive match");
		i++;
	}
	result.push({
		partialPath: currPath,
		suffixDef: drop(targetDef, i)
	});
	return result;
}
function nextPossibleTokensAfter(initialDef, tokenVector, tokMatcher, maxLookAhead) {
	var EXIT_NON_TERMINAL = "EXIT_NONE_TERMINAL";
	var EXIT_NON_TERMINAL_ARR = [EXIT_NON_TERMINAL];
	var EXIT_ALTERNATIVE = "EXIT_ALTERNATIVE";
	var foundCompletePath = false;
	var tokenVectorLength = tokenVector.length;
	var minimalAlternativesIndex = tokenVectorLength - maxLookAhead - 1;
	var result = [];
	var possiblePaths = [];
	possiblePaths.push({
		idx: -1,
		def: initialDef,
		ruleStack: [],
		occurrenceStack: []
	});
	while (!isEmpty(possiblePaths)) {
		var currPath = possiblePaths.pop();
		if (currPath === EXIT_ALTERNATIVE) {
			if (foundCompletePath && last(possiblePaths).idx <= minimalAlternativesIndex) possiblePaths.pop();
			continue;
		}
		var currDef = currPath.def;
		var currIdx = currPath.idx;
		var currRuleStack = currPath.ruleStack;
		var currOccurrenceStack = currPath.occurrenceStack;
		if (isEmpty(currDef)) continue;
		var prod = currDef[0];
		/* istanbul ignore else */
		if (prod === EXIT_NON_TERMINAL) {
			var nextPath = {
				idx: currIdx,
				def: drop(currDef),
				ruleStack: dropRight(currRuleStack),
				occurrenceStack: dropRight(currOccurrenceStack)
			};
			possiblePaths.push(nextPath);
		} else if (prod instanceof Terminal)
 /* istanbul ignore else */
		if (currIdx < tokenVectorLength - 1) {
			var nextIdx = currIdx + 1;
			var actualToken = tokenVector[nextIdx];
			if (tokMatcher(actualToken, prod.terminalType)) {
				var nextPath = {
					idx: nextIdx,
					def: drop(currDef),
					ruleStack: currRuleStack,
					occurrenceStack: currOccurrenceStack
				};
				possiblePaths.push(nextPath);
			}
		} else if (currIdx === tokenVectorLength - 1) {
			result.push({
				nextTokenType: prod.terminalType,
				nextTokenOccurrence: prod.idx,
				ruleStack: currRuleStack,
				occurrenceStack: currOccurrenceStack
			});
			foundCompletePath = true;
		} else throw Error("non exhaustive match");
		else if (prod instanceof NonTerminal) {
			var newRuleStack = cloneArr(currRuleStack);
			newRuleStack.push(prod.nonTerminalName);
			var newOccurrenceStack = cloneArr(currOccurrenceStack);
			newOccurrenceStack.push(prod.idx);
			var nextPath = {
				idx: currIdx,
				def: prod.definition.concat(EXIT_NON_TERMINAL_ARR, drop(currDef)),
				ruleStack: newRuleStack,
				occurrenceStack: newOccurrenceStack
			};
			possiblePaths.push(nextPath);
		} else if (prod instanceof Option) {
			var nextPathWithout = {
				idx: currIdx,
				def: drop(currDef),
				ruleStack: currRuleStack,
				occurrenceStack: currOccurrenceStack
			};
			possiblePaths.push(nextPathWithout);
			possiblePaths.push(EXIT_ALTERNATIVE);
			var nextPathWith = {
				idx: currIdx,
				def: prod.definition.concat(drop(currDef)),
				ruleStack: currRuleStack,
				occurrenceStack: currOccurrenceStack
			};
			possiblePaths.push(nextPathWith);
		} else if (prod instanceof RepetitionMandatory) {
			var secondIteration = new Repetition({
				definition: prod.definition,
				idx: prod.idx
			});
			var nextDef = prod.definition.concat([secondIteration], drop(currDef));
			var nextPath = {
				idx: currIdx,
				def: nextDef,
				ruleStack: currRuleStack,
				occurrenceStack: currOccurrenceStack
			};
			possiblePaths.push(nextPath);
		} else if (prod instanceof RepetitionMandatoryWithSeparator) {
			var separatorGast = new Terminal({ terminalType: prod.separator });
			var secondIteration = new Repetition({
				definition: [separatorGast].concat(prod.definition),
				idx: prod.idx
			});
			var nextDef = prod.definition.concat([secondIteration], drop(currDef));
			var nextPath = {
				idx: currIdx,
				def: nextDef,
				ruleStack: currRuleStack,
				occurrenceStack: currOccurrenceStack
			};
			possiblePaths.push(nextPath);
		} else if (prod instanceof RepetitionWithSeparator) {
			var nextPathWithout = {
				idx: currIdx,
				def: drop(currDef),
				ruleStack: currRuleStack,
				occurrenceStack: currOccurrenceStack
			};
			possiblePaths.push(nextPathWithout);
			possiblePaths.push(EXIT_ALTERNATIVE);
			var separatorGast = new Terminal({ terminalType: prod.separator });
			var nthRepetition = new Repetition({
				definition: [separatorGast].concat(prod.definition),
				idx: prod.idx
			});
			var nextDef = prod.definition.concat([nthRepetition], drop(currDef));
			var nextPathWith = {
				idx: currIdx,
				def: nextDef,
				ruleStack: currRuleStack,
				occurrenceStack: currOccurrenceStack
			};
			possiblePaths.push(nextPathWith);
		} else if (prod instanceof Repetition) {
			var nextPathWithout = {
				idx: currIdx,
				def: drop(currDef),
				ruleStack: currRuleStack,
				occurrenceStack: currOccurrenceStack
			};
			possiblePaths.push(nextPathWithout);
			possiblePaths.push(EXIT_ALTERNATIVE);
			var nthRepetition = new Repetition({
				definition: prod.definition,
				idx: prod.idx
			});
			var nextDef = prod.definition.concat([nthRepetition], drop(currDef));
			var nextPathWith = {
				idx: currIdx,
				def: nextDef,
				ruleStack: currRuleStack,
				occurrenceStack: currOccurrenceStack
			};
			possiblePaths.push(nextPathWith);
		} else if (prod instanceof Alternation) for (var i = prod.definition.length - 1; i >= 0; i--) {
			var currAltPath = {
				idx: currIdx,
				def: prod.definition[i].definition.concat(drop(currDef)),
				ruleStack: currRuleStack,
				occurrenceStack: currOccurrenceStack
			};
			possiblePaths.push(currAltPath);
			possiblePaths.push(EXIT_ALTERNATIVE);
		}
		else if (prod instanceof Alternative) possiblePaths.push({
			idx: currIdx,
			def: prod.definition.concat(drop(currDef)),
			ruleStack: currRuleStack,
			occurrenceStack: currOccurrenceStack
		});
		else if (prod instanceof Rule) possiblePaths.push(expandTopLevelRule(prod, currIdx, currRuleStack, currOccurrenceStack));
		else throw Error("non exhaustive match");
	}
	return result;
}
function expandTopLevelRule(topRule, currIdx, currRuleStack, currOccurrenceStack) {
	var newRuleStack = cloneArr(currRuleStack);
	newRuleStack.push(topRule.name);
	var newCurrOccurrenceStack = cloneArr(currOccurrenceStack);
	newCurrOccurrenceStack.push(1);
	return {
		idx: currIdx,
		def: topRule.definition,
		ruleStack: newRuleStack,
		occurrenceStack: newCurrOccurrenceStack
	};
}
var __extends$4, AbstractNextPossibleTokensWalker, NextAfterTokenWalker, AbstractNextTerminalAfterProductionWalker, NextTerminalAfterManyWalker, NextTerminalAfterManySepWalker, NextTerminalAfterAtLeastOneWalker, NextTerminalAfterAtLeastOneSepWalker;
var init_interpreter = __esmMin((() => {
	init_rest();
	init_utils();
	init_first();
	init_gast_public();
	__extends$4 = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	AbstractNextPossibleTokensWalker = function(_super) {
		__extends$4(AbstractNextPossibleTokensWalker, _super);
		function AbstractNextPossibleTokensWalker(topProd, path) {
			var _this = _super.call(this) || this;
			_this.topProd = topProd;
			_this.path = path;
			_this.possibleTokTypes = [];
			_this.nextProductionName = "";
			_this.nextProductionOccurrence = 0;
			_this.found = false;
			_this.isAtEndOfPath = false;
			return _this;
		}
		AbstractNextPossibleTokensWalker.prototype.startWalking = function() {
			this.found = false;
			if (this.path.ruleStack[0] !== this.topProd.name) throw Error("The path does not start with the walker's top Rule!");
			this.ruleStack = cloneArr(this.path.ruleStack).reverse();
			this.occurrenceStack = cloneArr(this.path.occurrenceStack).reverse();
			this.ruleStack.pop();
			this.occurrenceStack.pop();
			this.updateExpectedNext();
			this.walk(this.topProd);
			return this.possibleTokTypes;
		};
		AbstractNextPossibleTokensWalker.prototype.walk = function(prod, prevRest) {
			if (prevRest === void 0) prevRest = [];
			if (!this.found) _super.prototype.walk.call(this, prod, prevRest);
		};
		AbstractNextPossibleTokensWalker.prototype.walkProdRef = function(refProd, currRest, prevRest) {
			if (refProd.referencedRule.name === this.nextProductionName && refProd.idx === this.nextProductionOccurrence) {
				var fullRest = currRest.concat(prevRest);
				this.updateExpectedNext();
				this.walk(refProd.referencedRule, fullRest);
			}
		};
		AbstractNextPossibleTokensWalker.prototype.updateExpectedNext = function() {
			if (isEmpty(this.ruleStack)) {
				this.nextProductionName = "";
				this.nextProductionOccurrence = 0;
				this.isAtEndOfPath = true;
			} else {
				this.nextProductionName = this.ruleStack.pop();
				this.nextProductionOccurrence = this.occurrenceStack.pop();
			}
		};
		return AbstractNextPossibleTokensWalker;
	}(RestWalker);
	NextAfterTokenWalker = function(_super) {
		__extends$4(NextAfterTokenWalker, _super);
		function NextAfterTokenWalker(topProd, path) {
			var _this = _super.call(this, topProd, path) || this;
			_this.path = path;
			_this.nextTerminalName = "";
			_this.nextTerminalOccurrence = 0;
			_this.nextTerminalName = _this.path.lastTok.name;
			_this.nextTerminalOccurrence = _this.path.lastTokOccurrence;
			return _this;
		}
		NextAfterTokenWalker.prototype.walkTerminal = function(terminal, currRest, prevRest) {
			if (this.isAtEndOfPath && terminal.terminalType.name === this.nextTerminalName && terminal.idx === this.nextTerminalOccurrence && !this.found) {
				var fullRest = currRest.concat(prevRest);
				var restProd = new Alternative({ definition: fullRest });
				this.possibleTokTypes = first(restProd);
				this.found = true;
			}
		};
		return NextAfterTokenWalker;
	}(AbstractNextPossibleTokensWalker);
	AbstractNextTerminalAfterProductionWalker = function(_super) {
		__extends$4(AbstractNextTerminalAfterProductionWalker, _super);
		function AbstractNextTerminalAfterProductionWalker(topRule, occurrence) {
			var _this = _super.call(this) || this;
			_this.topRule = topRule;
			_this.occurrence = occurrence;
			_this.result = {
				token: void 0,
				occurrence: void 0,
				isEndOfRule: void 0
			};
			return _this;
		}
		AbstractNextTerminalAfterProductionWalker.prototype.startWalking = function() {
			this.walk(this.topRule);
			return this.result;
		};
		return AbstractNextTerminalAfterProductionWalker;
	}(RestWalker);
	NextTerminalAfterManyWalker = function(_super) {
		__extends$4(NextTerminalAfterManyWalker, _super);
		function NextTerminalAfterManyWalker() {
			return _super !== null && _super.apply(this, arguments) || this;
		}
		NextTerminalAfterManyWalker.prototype.walkMany = function(manyProd, currRest, prevRest) {
			if (manyProd.idx === this.occurrence) {
				var firstAfterMany = first$1(currRest.concat(prevRest));
				this.result.isEndOfRule = firstAfterMany === void 0;
				if (firstAfterMany instanceof Terminal) {
					this.result.token = firstAfterMany.terminalType;
					this.result.occurrence = firstAfterMany.idx;
				}
			} else _super.prototype.walkMany.call(this, manyProd, currRest, prevRest);
		};
		return NextTerminalAfterManyWalker;
	}(AbstractNextTerminalAfterProductionWalker);
	NextTerminalAfterManySepWalker = function(_super) {
		__extends$4(NextTerminalAfterManySepWalker, _super);
		function NextTerminalAfterManySepWalker() {
			return _super !== null && _super.apply(this, arguments) || this;
		}
		NextTerminalAfterManySepWalker.prototype.walkManySep = function(manySepProd, currRest, prevRest) {
			if (manySepProd.idx === this.occurrence) {
				var firstAfterManySep = first$1(currRest.concat(prevRest));
				this.result.isEndOfRule = firstAfterManySep === void 0;
				if (firstAfterManySep instanceof Terminal) {
					this.result.token = firstAfterManySep.terminalType;
					this.result.occurrence = firstAfterManySep.idx;
				}
			} else _super.prototype.walkManySep.call(this, manySepProd, currRest, prevRest);
		};
		return NextTerminalAfterManySepWalker;
	}(AbstractNextTerminalAfterProductionWalker);
	NextTerminalAfterAtLeastOneWalker = function(_super) {
		__extends$4(NextTerminalAfterAtLeastOneWalker, _super);
		function NextTerminalAfterAtLeastOneWalker() {
			return _super !== null && _super.apply(this, arguments) || this;
		}
		NextTerminalAfterAtLeastOneWalker.prototype.walkAtLeastOne = function(atLeastOneProd, currRest, prevRest) {
			if (atLeastOneProd.idx === this.occurrence) {
				var firstAfterAtLeastOne = first$1(currRest.concat(prevRest));
				this.result.isEndOfRule = firstAfterAtLeastOne === void 0;
				if (firstAfterAtLeastOne instanceof Terminal) {
					this.result.token = firstAfterAtLeastOne.terminalType;
					this.result.occurrence = firstAfterAtLeastOne.idx;
				}
			} else _super.prototype.walkAtLeastOne.call(this, atLeastOneProd, currRest, prevRest);
		};
		return NextTerminalAfterAtLeastOneWalker;
	}(AbstractNextTerminalAfterProductionWalker);
	NextTerminalAfterAtLeastOneSepWalker = function(_super) {
		__extends$4(NextTerminalAfterAtLeastOneSepWalker, _super);
		function NextTerminalAfterAtLeastOneSepWalker() {
			return _super !== null && _super.apply(this, arguments) || this;
		}
		NextTerminalAfterAtLeastOneSepWalker.prototype.walkAtLeastOneSep = function(atleastOneSepProd, currRest, prevRest) {
			if (atleastOneSepProd.idx === this.occurrence) {
				var firstAfterfirstAfterAtLeastOneSep = first$1(currRest.concat(prevRest));
				this.result.isEndOfRule = firstAfterfirstAfterAtLeastOneSep === void 0;
				if (firstAfterfirstAfterAtLeastOneSep instanceof Terminal) {
					this.result.token = firstAfterfirstAfterAtLeastOneSep.terminalType;
					this.result.occurrence = firstAfterfirstAfterAtLeastOneSep.idx;
				}
			} else _super.prototype.walkAtLeastOneSep.call(this, atleastOneSepProd, currRest, prevRest);
		};
		return NextTerminalAfterAtLeastOneSepWalker;
	}(AbstractNextTerminalAfterProductionWalker);
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/lookahead.js
function getProdType(prod) {
	/* istanbul ignore else */
	if (prod instanceof Option) return PROD_TYPE.OPTION;
	else if (prod instanceof Repetition) return PROD_TYPE.REPETITION;
	else if (prod instanceof RepetitionMandatory) return PROD_TYPE.REPETITION_MANDATORY;
	else if (prod instanceof RepetitionMandatoryWithSeparator) return PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR;
	else if (prod instanceof RepetitionWithSeparator) return PROD_TYPE.REPETITION_WITH_SEPARATOR;
	else if (prod instanceof Alternation) return PROD_TYPE.ALTERNATION;
	else throw Error("non exhaustive match");
}
function buildLookaheadFuncForOr(occurrence, ruleGrammar, maxLookahead, hasPredicates, dynamicTokensEnabled, laFuncBuilder) {
	var lookAheadPaths = getLookaheadPathsForOr(occurrence, ruleGrammar, maxLookahead);
	return laFuncBuilder(lookAheadPaths, hasPredicates, areTokenCategoriesNotUsed(lookAheadPaths) ? tokenStructuredMatcherNoCategories : tokenStructuredMatcher, dynamicTokensEnabled);
}
/**
*  When dealing with an Optional production (OPTION/MANY/2nd iteration of AT_LEAST_ONE/...) we need to compare
*  the lookahead "inside" the production and the lookahead immediately "after" it in the same top level rule (context free).
*
*  Example: given a production:
*  ABC(DE)?DF
*
*  The optional '(DE)?' should only be entered if we see 'DE'. a single Token 'D' is not sufficient to distinguish between the two
*  alternatives.
*
*  @returns A Lookahead function which will return true IFF the parser should parse the Optional production.
*/
function buildLookaheadFuncForOptionalProd(occurrence, ruleGrammar, k, dynamicTokensEnabled, prodType, lookaheadBuilder) {
	var lookAheadPaths = getLookaheadPathsForOptionalProd(occurrence, ruleGrammar, prodType, k);
	var tokenMatcher = areTokenCategoriesNotUsed(lookAheadPaths) ? tokenStructuredMatcherNoCategories : tokenStructuredMatcher;
	return lookaheadBuilder(lookAheadPaths[0], tokenMatcher, dynamicTokensEnabled);
}
function buildAlternativesLookAheadFunc(alts, hasPredicates, tokenMatcher, dynamicTokensEnabled) {
	var numOfAlts = alts.length;
	var areAllOneTokenLookahead = every(alts, function(currAlt) {
		return every(currAlt, function(currPath) {
			return currPath.length === 1;
		});
	});
	if (hasPredicates)
 /**
	* @returns {number} - The chosen alternative index
	*/
	return function(orAlts) {
		var predicates = map(orAlts, function(currAlt) {
			return currAlt.GATE;
		});
		for (var t = 0; t < numOfAlts; t++) {
			var currAlt = alts[t];
			var currNumOfPaths = currAlt.length;
			var currPredicate = predicates[t];
			if (currPredicate !== void 0 && currPredicate.call(this) === false) continue;
			nextPath: for (var j = 0; j < currNumOfPaths; j++) {
				var currPath = currAlt[j];
				var currPathLength = currPath.length;
				for (var i = 0; i < currPathLength; i++) if (tokenMatcher(this.LA(i + 1), currPath[i]) === false) continue nextPath;
				return t;
			}
		}
	};
	else if (areAllOneTokenLookahead && !dynamicTokensEnabled) {
		var choiceToAlt_1 = reduce(map(alts, function(currAlt) {
			return flatten(currAlt);
		}), function(result, currAlt, idx) {
			forEach(currAlt, function(currTokType) {
				if (!has(result, currTokType.tokenTypeIdx)) result[currTokType.tokenTypeIdx] = idx;
				forEach(currTokType.categoryMatches, function(currExtendingType) {
					if (!has(result, currExtendingType)) result[currExtendingType] = idx;
				});
			});
			return result;
		}, []);
		/**
		* @returns {number} - The chosen alternative index
		*/
		return function() {
			return choiceToAlt_1[this.LA(1).tokenTypeIdx];
		};
	} else
 /**
	* @returns {number} - The chosen alternative index
	*/
	return function() {
		for (var t = 0; t < numOfAlts; t++) {
			var currAlt = alts[t];
			var currNumOfPaths = currAlt.length;
			nextPath: for (var j = 0; j < currNumOfPaths; j++) {
				var currPath = currAlt[j];
				var currPathLength = currPath.length;
				for (var i = 0; i < currPathLength; i++) if (tokenMatcher(this.LA(i + 1), currPath[i]) === false) continue nextPath;
				return t;
			}
		}
	};
}
function buildSingleAlternativeLookaheadFunction(alt, tokenMatcher, dynamicTokensEnabled) {
	var areAllOneTokenLookahead = every(alt, function(currPath) {
		return currPath.length === 1;
	});
	var numOfPaths = alt.length;
	if (areAllOneTokenLookahead && !dynamicTokensEnabled) {
		var singleTokensTypes = flatten(alt);
		if (singleTokensTypes.length === 1 && isEmpty(singleTokensTypes[0].categoryMatches)) {
			var expectedTokenUniqueKey_1 = singleTokensTypes[0].tokenTypeIdx;
			return function() {
				return this.LA(1).tokenTypeIdx === expectedTokenUniqueKey_1;
			};
		} else {
			var choiceToAlt_2 = reduce(singleTokensTypes, function(result, currTokType, idx) {
				result[currTokType.tokenTypeIdx] = true;
				forEach(currTokType.categoryMatches, function(currExtendingType) {
					result[currExtendingType] = true;
				});
				return result;
			}, []);
			return function() {
				return choiceToAlt_2[this.LA(1).tokenTypeIdx] === true;
			};
		}
	} else return function() {
		nextPath: for (var j = 0; j < numOfPaths; j++) {
			var currPath = alt[j];
			var currPathLength = currPath.length;
			for (var i = 0; i < currPathLength; i++) if (tokenMatcher(this.LA(i + 1), currPath[i]) === false) continue nextPath;
			return true;
		}
		return false;
	};
}
function initializeArrayOfArrays(size) {
	var result = new Array(size);
	for (var i = 0; i < size; i++) result[i] = [];
	return result;
}
/**
* A sort of hash function between a Path in the grammar and a string.
* Note that this returns multiple "hashes" to support the scenario of token categories.
* -  A single path with categories may match multiple **actual** paths.
*/
function pathToHashKeys(path) {
	var keys = [""];
	for (var i = 0; i < path.length; i++) {
		var tokType = path[i];
		var longerKeys = [];
		for (var j = 0; j < keys.length; j++) {
			var currShorterKey = keys[j];
			longerKeys.push(currShorterKey + "_" + tokType.tokenTypeIdx);
			for (var t = 0; t < tokType.categoryMatches.length; t++) {
				var categoriesKeySuffix = "_" + tokType.categoryMatches[t];
				longerKeys.push(currShorterKey + categoriesKeySuffix);
			}
		}
		keys = longerKeys;
	}
	return keys;
}
/**
* Imperative style due to being called from a hot spot
*/
function isUniquePrefixHash(altKnownPathsKeys, searchPathKeys, idx) {
	for (var currAltIdx = 0; currAltIdx < altKnownPathsKeys.length; currAltIdx++) {
		if (currAltIdx === idx) continue;
		var otherAltKnownPathsKeys = altKnownPathsKeys[currAltIdx];
		for (var searchIdx = 0; searchIdx < searchPathKeys.length; searchIdx++) if (otherAltKnownPathsKeys[searchPathKeys[searchIdx]] === true) return false;
	}
	return true;
}
function lookAheadSequenceFromAlternatives(altsDefs, k) {
	var partialAlts = map(altsDefs, function(currAlt) {
		return possiblePathsFrom([currAlt], 1);
	});
	var finalResult = initializeArrayOfArrays(partialAlts.length);
	var altsHashes = map(partialAlts, function(currAltPaths) {
		var dict = {};
		forEach(currAltPaths, function(item) {
			forEach(pathToHashKeys(item.partialPath), function(currKey) {
				dict[currKey] = true;
			});
		});
		return dict;
	});
	var newData = partialAlts;
	for (var pathLength = 1; pathLength <= k; pathLength++) {
		var currDataset = newData;
		newData = initializeArrayOfArrays(currDataset.length);
		var _loop_1 = function(altIdx) {
			var currAltPathsAndSuffixes = currDataset[altIdx];
			for (var currPathIdx = 0; currPathIdx < currAltPathsAndSuffixes.length; currPathIdx++) {
				var currPathPrefix = currAltPathsAndSuffixes[currPathIdx].partialPath;
				var suffixDef = currAltPathsAndSuffixes[currPathIdx].suffixDef;
				var prefixKeys = pathToHashKeys(currPathPrefix);
				if (isUniquePrefixHash(altsHashes, prefixKeys, altIdx) || isEmpty(suffixDef) || currPathPrefix.length === k) {
					var currAltResult = finalResult[altIdx];
					if (containsPath(currAltResult, currPathPrefix) === false) {
						currAltResult.push(currPathPrefix);
						for (var j = 0; j < prefixKeys.length; j++) {
							var currKey = prefixKeys[j];
							altsHashes[altIdx][currKey] = true;
						}
					}
				} else {
					var newPartialPathsAndSuffixes = possiblePathsFrom(suffixDef, pathLength + 1, currPathPrefix);
					newData[altIdx] = newData[altIdx].concat(newPartialPathsAndSuffixes);
					forEach(newPartialPathsAndSuffixes, function(item) {
						forEach(pathToHashKeys(item.partialPath), function(key) {
							altsHashes[altIdx][key] = true;
						});
					});
				}
			}
		};
		for (var altIdx = 0; altIdx < currDataset.length; altIdx++) _loop_1(altIdx);
	}
	return finalResult;
}
function getLookaheadPathsForOr(occurrence, ruleGrammar, k, orProd) {
	var visitor = new InsideDefinitionFinderVisitor(occurrence, PROD_TYPE.ALTERNATION, orProd);
	ruleGrammar.accept(visitor);
	return lookAheadSequenceFromAlternatives(visitor.result, k);
}
function getLookaheadPathsForOptionalProd(occurrence, ruleGrammar, prodType, k) {
	var insideDefVisitor = new InsideDefinitionFinderVisitor(occurrence, prodType);
	ruleGrammar.accept(insideDefVisitor);
	var insideDef = insideDefVisitor.result;
	var afterDef = new RestDefinitionFinderWalker(ruleGrammar, occurrence, prodType).startWalking();
	return lookAheadSequenceFromAlternatives([new Alternative({ definition: insideDef }), new Alternative({ definition: afterDef })], k);
}
function containsPath(alternative, searchPath) {
	compareOtherPath: for (var i = 0; i < alternative.length; i++) {
		var otherPath = alternative[i];
		if (otherPath.length !== searchPath.length) continue;
		for (var j = 0; j < otherPath.length; j++) {
			var searchTok = searchPath[j];
			var otherTok = otherPath[j];
			if ((searchTok === otherTok || otherTok.categoryMatchesMap[searchTok.tokenTypeIdx] !== void 0) === false) continue compareOtherPath;
		}
		return true;
	}
	return false;
}
function isStrictPrefixOfPath(prefix, other) {
	return prefix.length < other.length && every(prefix, function(tokType, idx) {
		var otherTokType = other[idx];
		return tokType === otherTokType || otherTokType.categoryMatchesMap[tokType.tokenTypeIdx];
	});
}
function areTokenCategoriesNotUsed(lookAheadPaths) {
	return every(lookAheadPaths, function(singleAltPaths) {
		return every(singleAltPaths, function(singlePath) {
			return every(singlePath, function(token) {
				return isEmpty(token.categoryMatches);
			});
		});
	});
}
var __extends$3, PROD_TYPE, RestDefinitionFinderWalker, InsideDefinitionFinderVisitor;
var init_lookahead = __esmMin((() => {
	init_utils();
	init_interpreter();
	init_rest();
	init_tokens();
	init_gast_public();
	init_gast_visitor_public();
	__extends$3 = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	(function(PROD_TYPE) {
		PROD_TYPE[PROD_TYPE["OPTION"] = 0] = "OPTION";
		PROD_TYPE[PROD_TYPE["REPETITION"] = 1] = "REPETITION";
		PROD_TYPE[PROD_TYPE["REPETITION_MANDATORY"] = 2] = "REPETITION_MANDATORY";
		PROD_TYPE[PROD_TYPE["REPETITION_MANDATORY_WITH_SEPARATOR"] = 3] = "REPETITION_MANDATORY_WITH_SEPARATOR";
		PROD_TYPE[PROD_TYPE["REPETITION_WITH_SEPARATOR"] = 4] = "REPETITION_WITH_SEPARATOR";
		PROD_TYPE[PROD_TYPE["ALTERNATION"] = 5] = "ALTERNATION";
	})(PROD_TYPE || (PROD_TYPE = {}));
	RestDefinitionFinderWalker = function(_super) {
		__extends$3(RestDefinitionFinderWalker, _super);
		function RestDefinitionFinderWalker(topProd, targetOccurrence, targetProdType) {
			var _this = _super.call(this) || this;
			_this.topProd = topProd;
			_this.targetOccurrence = targetOccurrence;
			_this.targetProdType = targetProdType;
			return _this;
		}
		RestDefinitionFinderWalker.prototype.startWalking = function() {
			this.walk(this.topProd);
			return this.restDef;
		};
		RestDefinitionFinderWalker.prototype.checkIsTarget = function(node, expectedProdType, currRest, prevRest) {
			if (node.idx === this.targetOccurrence && this.targetProdType === expectedProdType) {
				this.restDef = currRest.concat(prevRest);
				return true;
			}
			return false;
		};
		RestDefinitionFinderWalker.prototype.walkOption = function(optionProd, currRest, prevRest) {
			if (!this.checkIsTarget(optionProd, PROD_TYPE.OPTION, currRest, prevRest)) _super.prototype.walkOption.call(this, optionProd, currRest, prevRest);
		};
		RestDefinitionFinderWalker.prototype.walkAtLeastOne = function(atLeastOneProd, currRest, prevRest) {
			if (!this.checkIsTarget(atLeastOneProd, PROD_TYPE.REPETITION_MANDATORY, currRest, prevRest)) _super.prototype.walkOption.call(this, atLeastOneProd, currRest, prevRest);
		};
		RestDefinitionFinderWalker.prototype.walkAtLeastOneSep = function(atLeastOneSepProd, currRest, prevRest) {
			if (!this.checkIsTarget(atLeastOneSepProd, PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR, currRest, prevRest)) _super.prototype.walkOption.call(this, atLeastOneSepProd, currRest, prevRest);
		};
		RestDefinitionFinderWalker.prototype.walkMany = function(manyProd, currRest, prevRest) {
			if (!this.checkIsTarget(manyProd, PROD_TYPE.REPETITION, currRest, prevRest)) _super.prototype.walkOption.call(this, manyProd, currRest, prevRest);
		};
		RestDefinitionFinderWalker.prototype.walkManySep = function(manySepProd, currRest, prevRest) {
			if (!this.checkIsTarget(manySepProd, PROD_TYPE.REPETITION_WITH_SEPARATOR, currRest, prevRest)) _super.prototype.walkOption.call(this, manySepProd, currRest, prevRest);
		};
		return RestDefinitionFinderWalker;
	}(RestWalker);
	InsideDefinitionFinderVisitor = function(_super) {
		__extends$3(InsideDefinitionFinderVisitor, _super);
		function InsideDefinitionFinderVisitor(targetOccurrence, targetProdType, targetRef) {
			var _this = _super.call(this) || this;
			_this.targetOccurrence = targetOccurrence;
			_this.targetProdType = targetProdType;
			_this.targetRef = targetRef;
			_this.result = [];
			return _this;
		}
		InsideDefinitionFinderVisitor.prototype.checkIsTarget = function(node, expectedProdName) {
			if (node.idx === this.targetOccurrence && this.targetProdType === expectedProdName && (this.targetRef === void 0 || node === this.targetRef)) this.result = node.definition;
		};
		InsideDefinitionFinderVisitor.prototype.visitOption = function(node) {
			this.checkIsTarget(node, PROD_TYPE.OPTION);
		};
		InsideDefinitionFinderVisitor.prototype.visitRepetition = function(node) {
			this.checkIsTarget(node, PROD_TYPE.REPETITION);
		};
		InsideDefinitionFinderVisitor.prototype.visitRepetitionMandatory = function(node) {
			this.checkIsTarget(node, PROD_TYPE.REPETITION_MANDATORY);
		};
		InsideDefinitionFinderVisitor.prototype.visitRepetitionMandatoryWithSeparator = function(node) {
			this.checkIsTarget(node, PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR);
		};
		InsideDefinitionFinderVisitor.prototype.visitRepetitionWithSeparator = function(node) {
			this.checkIsTarget(node, PROD_TYPE.REPETITION_WITH_SEPARATOR);
		};
		InsideDefinitionFinderVisitor.prototype.visitAlternation = function(node) {
			this.checkIsTarget(node, PROD_TYPE.ALTERNATION);
		};
		return InsideDefinitionFinderVisitor;
	}(GAstVisitor);
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/checks.js
function validateGrammar$1(topLevels, globalMaxLookahead, tokenTypes, errMsgProvider, grammarName) {
	var duplicateErrors = map(topLevels, function(currTopLevel) {
		return validateDuplicateProductions(currTopLevel, errMsgProvider);
	});
	var leftRecursionErrors = map(topLevels, function(currTopRule) {
		return validateNoLeftRecursion(currTopRule, currTopRule, errMsgProvider);
	});
	var emptyAltErrors = [];
	var ambiguousAltsErrors = [];
	var emptyRepetitionErrors = [];
	if (every(leftRecursionErrors, isEmpty)) {
		emptyAltErrors = map(topLevels, function(currTopRule) {
			return validateEmptyOrAlternative(currTopRule, errMsgProvider);
		});
		ambiguousAltsErrors = map(topLevels, function(currTopRule) {
			return validateAmbiguousAlternationAlternatives(currTopRule, globalMaxLookahead, errMsgProvider);
		});
		emptyRepetitionErrors = validateSomeNonEmptyLookaheadPath(topLevels, globalMaxLookahead, errMsgProvider);
	}
	var termsNamespaceConflictErrors = checkTerminalAndNoneTerminalsNameSpace(topLevels, tokenTypes, errMsgProvider);
	var tooManyAltsErrors = map(topLevels, function(curRule) {
		return validateTooManyAlts(curRule, errMsgProvider);
	});
	var duplicateRulesError = map(topLevels, function(curRule) {
		return validateRuleDoesNotAlreadyExist(curRule, topLevels, grammarName, errMsgProvider);
	});
	return flatten(duplicateErrors.concat(emptyRepetitionErrors, leftRecursionErrors, emptyAltErrors, ambiguousAltsErrors, termsNamespaceConflictErrors, tooManyAltsErrors, duplicateRulesError));
}
function validateDuplicateProductions(topLevelRule, errMsgProvider) {
	var collectorVisitor = new OccurrenceValidationCollector();
	topLevelRule.accept(collectorVisitor);
	var allRuleProductions = collectorVisitor.allProductions;
	return map(values(pick(groupBy(allRuleProductions, identifyProductionForDuplicates), function(currGroup) {
		return currGroup.length > 1;
	})), function(currDuplicates) {
		var firstProd = first$1(currDuplicates);
		var msg = errMsgProvider.buildDuplicateFoundError(topLevelRule, currDuplicates);
		var dslName = getProductionDslName(firstProd);
		var defError = {
			message: msg,
			type: ParserDefinitionErrorType.DUPLICATE_PRODUCTIONS,
			ruleName: topLevelRule.name,
			dslName,
			occurrence: firstProd.idx
		};
		var param = getExtraProductionArgument(firstProd);
		if (param) defError.parameter = param;
		return defError;
	});
}
function identifyProductionForDuplicates(prod) {
	return getProductionDslName(prod) + "_#_" + prod.idx + "_#_" + getExtraProductionArgument(prod);
}
function getExtraProductionArgument(prod) {
	if (prod instanceof Terminal) return prod.terminalType.name;
	else if (prod instanceof NonTerminal) return prod.nonTerminalName;
	else return "";
}
function validateRuleDoesNotAlreadyExist(rule, allRules, className, errMsgProvider) {
	var errors = [];
	if (reduce(allRules, function(result, curRule) {
		if (curRule.name === rule.name) return result + 1;
		return result;
	}, 0) > 1) {
		var errMsg = errMsgProvider.buildDuplicateRuleNameError({
			topLevelRule: rule,
			grammarName: className
		});
		errors.push({
			message: errMsg,
			type: ParserDefinitionErrorType.DUPLICATE_RULE_NAME,
			ruleName: rule.name
		});
	}
	return errors;
}
function validateRuleIsOverridden(ruleName, definedRulesNames, className) {
	var errors = [];
	var errMsg;
	if (!contains(definedRulesNames, ruleName)) {
		errMsg = "Invalid rule override, rule: ->" + ruleName + "<- cannot be overridden in the grammar: ->" + className + "<-as it is not defined in any of the super grammars ";
		errors.push({
			message: errMsg,
			type: ParserDefinitionErrorType.INVALID_RULE_OVERRIDE,
			ruleName
		});
	}
	return errors;
}
function validateNoLeftRecursion(topRule, currRule, errMsgProvider, path) {
	if (path === void 0) path = [];
	var errors = [];
	var nextNonTerminals = getFirstNoneTerminal(currRule.definition);
	if (isEmpty(nextNonTerminals)) return [];
	else {
		var ruleName = topRule.name;
		if (contains(nextNonTerminals, topRule)) errors.push({
			message: errMsgProvider.buildLeftRecursionError({
				topLevelRule: topRule,
				leftRecursionPath: path
			}),
			type: ParserDefinitionErrorType.LEFT_RECURSION,
			ruleName
		});
		var errorsFromNextSteps = map(difference(nextNonTerminals, path.concat([topRule])), function(currRefRule) {
			var newPath = cloneArr(path);
			newPath.push(currRefRule);
			return validateNoLeftRecursion(topRule, currRefRule, errMsgProvider, newPath);
		});
		return errors.concat(flatten(errorsFromNextSteps));
	}
}
function getFirstNoneTerminal(definition) {
	var result = [];
	if (isEmpty(definition)) return result;
	var firstProd = first$1(definition);
	/* istanbul ignore else */
	if (firstProd instanceof NonTerminal) result.push(firstProd.referencedRule);
	else if (firstProd instanceof Alternative || firstProd instanceof Option || firstProd instanceof RepetitionMandatory || firstProd instanceof RepetitionMandatoryWithSeparator || firstProd instanceof RepetitionWithSeparator || firstProd instanceof Repetition) result = result.concat(getFirstNoneTerminal(firstProd.definition));
	else if (firstProd instanceof Alternation) result = flatten(map(firstProd.definition, function(currSubDef) {
		return getFirstNoneTerminal(currSubDef.definition);
	}));
	else if (firstProd instanceof Terminal) {} else throw Error("non exhaustive match");
	var isFirstOptional = isOptionalProd(firstProd);
	var hasMore = definition.length > 1;
	if (isFirstOptional && hasMore) {
		var rest = drop(definition);
		return result.concat(getFirstNoneTerminal(rest));
	} else return result;
}
function validateEmptyOrAlternative(topLevelRule, errMsgProvider) {
	var orCollector = new OrCollector();
	topLevelRule.accept(orCollector);
	var ors = orCollector.alternations;
	return reduce(ors, function(errors, currOr) {
		var currErrors = map(dropRight(currOr.definition), function(currAlternative, currAltIdx) {
			if (isEmpty(nextPossibleTokensAfter([currAlternative], [], null, 1))) return {
				message: errMsgProvider.buildEmptyAlternationError({
					topLevelRule,
					alternation: currOr,
					emptyChoiceIdx: currAltIdx
				}),
				type: ParserDefinitionErrorType.NONE_LAST_EMPTY_ALT,
				ruleName: topLevelRule.name,
				occurrence: currOr.idx,
				alternative: currAltIdx + 1
			};
			else return null;
		});
		return errors.concat(compact(currErrors));
	}, []);
}
function validateAmbiguousAlternationAlternatives(topLevelRule, globalMaxLookahead, errMsgProvider) {
	var orCollector = new OrCollector();
	topLevelRule.accept(orCollector);
	var ors = orCollector.alternations;
	ors = reject(ors, function(currOr) {
		return currOr.ignoreAmbiguities === true;
	});
	return reduce(ors, function(result, currOr) {
		var currOccurrence = currOr.idx;
		var alternatives = getLookaheadPathsForOr(currOccurrence, topLevelRule, currOr.maxLookahead || globalMaxLookahead, currOr);
		var altsAmbiguityErrors = checkAlternativesAmbiguities(alternatives, currOr, topLevelRule, errMsgProvider);
		var altsPrefixAmbiguityErrors = checkPrefixAlternativesAmbiguities(alternatives, currOr, topLevelRule, errMsgProvider);
		return result.concat(altsAmbiguityErrors, altsPrefixAmbiguityErrors);
	}, []);
}
function validateTooManyAlts(topLevelRule, errMsgProvider) {
	var orCollector = new OrCollector();
	topLevelRule.accept(orCollector);
	var ors = orCollector.alternations;
	return reduce(ors, function(errors, currOr) {
		if (currOr.definition.length > 255) errors.push({
			message: errMsgProvider.buildTooManyAlternativesError({
				topLevelRule,
				alternation: currOr
			}),
			type: ParserDefinitionErrorType.TOO_MANY_ALTS,
			ruleName: topLevelRule.name,
			occurrence: currOr.idx
		});
		return errors;
	}, []);
}
function validateSomeNonEmptyLookaheadPath(topLevelRules, maxLookahead, errMsgProvider) {
	var errors = [];
	forEach(topLevelRules, function(currTopRule) {
		var collectorVisitor = new RepetionCollector();
		currTopRule.accept(collectorVisitor);
		var allRuleProductions = collectorVisitor.allProductions;
		forEach(allRuleProductions, function(currProd) {
			var prodType = getProdType(currProd);
			var actualMaxLookahead = currProd.maxLookahead || maxLookahead;
			var currOccurrence = currProd.idx;
			var pathsInsideProduction = getLookaheadPathsForOptionalProd(currOccurrence, currTopRule, prodType, actualMaxLookahead)[0];
			if (isEmpty(flatten(pathsInsideProduction))) {
				var errMsg = errMsgProvider.buildEmptyRepetitionError({
					topLevelRule: currTopRule,
					repetition: currProd
				});
				errors.push({
					message: errMsg,
					type: ParserDefinitionErrorType.NO_NON_EMPTY_LOOKAHEAD,
					ruleName: currTopRule.name
				});
			}
		});
	});
	return errors;
}
function checkAlternativesAmbiguities(alternatives, alternation, rule, errMsgProvider) {
	var foundAmbiguousPaths = [];
	return map(reduce(alternatives, function(result, currAlt, currAltIdx) {
		if (alternation.definition[currAltIdx].ignoreAmbiguities === true) return result;
		forEach(currAlt, function(currPath) {
			var altsCurrPathAppearsIn = [currAltIdx];
			forEach(alternatives, function(currOtherAlt, currOtherAltIdx) {
				if (currAltIdx !== currOtherAltIdx && containsPath(currOtherAlt, currPath) && alternation.definition[currOtherAltIdx].ignoreAmbiguities !== true) altsCurrPathAppearsIn.push(currOtherAltIdx);
			});
			if (altsCurrPathAppearsIn.length > 1 && !containsPath(foundAmbiguousPaths, currPath)) {
				foundAmbiguousPaths.push(currPath);
				result.push({
					alts: altsCurrPathAppearsIn,
					path: currPath
				});
			}
		});
		return result;
	}, []), function(currAmbDescriptor) {
		var ambgIndices = map(currAmbDescriptor.alts, function(currAltIdx) {
			return currAltIdx + 1;
		});
		return {
			message: errMsgProvider.buildAlternationAmbiguityError({
				topLevelRule: rule,
				alternation,
				ambiguityIndices: ambgIndices,
				prefixPath: currAmbDescriptor.path
			}),
			type: ParserDefinitionErrorType.AMBIGUOUS_ALTS,
			ruleName: rule.name,
			occurrence: alternation.idx,
			alternatives: [currAmbDescriptor.alts]
		};
	});
}
function checkPrefixAlternativesAmbiguities(alternatives, alternation, rule, errMsgProvider) {
	var errors = [];
	var pathsAndIndices = reduce(alternatives, function(result, currAlt, idx) {
		var currPathsAndIdx = map(currAlt, function(currPath) {
			return {
				idx,
				path: currPath
			};
		});
		return result.concat(currPathsAndIdx);
	}, []);
	forEach(pathsAndIndices, function(currPathAndIdx) {
		if (alternation.definition[currPathAndIdx.idx].ignoreAmbiguities === true) return;
		var targetIdx = currPathAndIdx.idx;
		var targetPath = currPathAndIdx.path;
		var currPathPrefixErrors = map(findAll(pathsAndIndices, function(searchPathAndIdx) {
			return alternation.definition[searchPathAndIdx.idx].ignoreAmbiguities !== true && searchPathAndIdx.idx < targetIdx && isStrictPrefixOfPath(searchPathAndIdx.path, targetPath);
		}), function(currAmbPathAndIdx) {
			var ambgIndices = [currAmbPathAndIdx.idx + 1, targetIdx + 1];
			var occurrence = alternation.idx === 0 ? "" : alternation.idx;
			return {
				message: errMsgProvider.buildAlternationPrefixAmbiguityError({
					topLevelRule: rule,
					alternation,
					ambiguityIndices: ambgIndices,
					prefixPath: currAmbPathAndIdx.path
				}),
				type: ParserDefinitionErrorType.AMBIGUOUS_PREFIX_ALTS,
				ruleName: rule.name,
				occurrence,
				alternatives: ambgIndices
			};
		});
		errors = errors.concat(currPathPrefixErrors);
	});
	return errors;
}
function checkTerminalAndNoneTerminalsNameSpace(topLevels, tokenTypes, errMsgProvider) {
	var errors = [];
	var tokenNames = map(tokenTypes, function(currToken) {
		return currToken.name;
	});
	forEach(topLevels, function(currRule) {
		var currRuleName = currRule.name;
		if (contains(tokenNames, currRuleName)) {
			var errMsg = errMsgProvider.buildNamespaceConflictError(currRule);
			errors.push({
				message: errMsg,
				type: ParserDefinitionErrorType.CONFLICT_TOKENS_RULES_NAMESPACE,
				ruleName: currRuleName
			});
		}
	});
	return errors;
}
var __extends$2, OccurrenceValidationCollector, OrCollector, RepetionCollector;
var init_checks = __esmMin((() => {
	init_utils();
	init_parser();
	init_gast();
	init_lookahead();
	init_interpreter();
	init_gast_public();
	init_gast_visitor_public();
	__extends$2 = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	OccurrenceValidationCollector = function(_super) {
		__extends$2(OccurrenceValidationCollector, _super);
		function OccurrenceValidationCollector() {
			var _this = _super !== null && _super.apply(this, arguments) || this;
			_this.allProductions = [];
			return _this;
		}
		OccurrenceValidationCollector.prototype.visitNonTerminal = function(subrule) {
			this.allProductions.push(subrule);
		};
		OccurrenceValidationCollector.prototype.visitOption = function(option) {
			this.allProductions.push(option);
		};
		OccurrenceValidationCollector.prototype.visitRepetitionWithSeparator = function(manySep) {
			this.allProductions.push(manySep);
		};
		OccurrenceValidationCollector.prototype.visitRepetitionMandatory = function(atLeastOne) {
			this.allProductions.push(atLeastOne);
		};
		OccurrenceValidationCollector.prototype.visitRepetitionMandatoryWithSeparator = function(atLeastOneSep) {
			this.allProductions.push(atLeastOneSep);
		};
		OccurrenceValidationCollector.prototype.visitRepetition = function(many) {
			this.allProductions.push(many);
		};
		OccurrenceValidationCollector.prototype.visitAlternation = function(or) {
			this.allProductions.push(or);
		};
		OccurrenceValidationCollector.prototype.visitTerminal = function(terminal) {
			this.allProductions.push(terminal);
		};
		return OccurrenceValidationCollector;
	}(GAstVisitor);
	OrCollector = function(_super) {
		__extends$2(OrCollector, _super);
		function OrCollector() {
			var _this = _super !== null && _super.apply(this, arguments) || this;
			_this.alternations = [];
			return _this;
		}
		OrCollector.prototype.visitAlternation = function(node) {
			this.alternations.push(node);
		};
		return OrCollector;
	}(GAstVisitor);
	RepetionCollector = function(_super) {
		__extends$2(RepetionCollector, _super);
		function RepetionCollector() {
			var _this = _super !== null && _super.apply(this, arguments) || this;
			_this.allProductions = [];
			return _this;
		}
		RepetionCollector.prototype.visitRepetitionWithSeparator = function(manySep) {
			this.allProductions.push(manySep);
		};
		RepetionCollector.prototype.visitRepetitionMandatory = function(atLeastOne) {
			this.allProductions.push(atLeastOne);
		};
		RepetionCollector.prototype.visitRepetitionMandatoryWithSeparator = function(atLeastOneSep) {
			this.allProductions.push(atLeastOneSep);
		};
		RepetionCollector.prototype.visitRepetition = function(many) {
			this.allProductions.push(many);
		};
		return RepetionCollector;
	}(GAstVisitor);
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/gast/gast_resolver_public.js
function resolveGrammar(options) {
	options = defaults(options, { errMsgProvider: defaultGrammarResolverErrorProvider });
	var topRulesTable = {};
	forEach(options.rules, function(rule) {
		topRulesTable[rule.name] = rule;
	});
	return resolveGrammar$1(topRulesTable, options.errMsgProvider);
}
function validateGrammar(options) {
	options = defaults(options, { errMsgProvider: defaultGrammarValidatorErrorProvider });
	return validateGrammar$1(options.rules, options.maxLookahead, options.tokenTypes, options.errMsgProvider, options.grammarName);
}
function assignOccurrenceIndices(options) {
	forEach(options.rules, function(currRule) {
		var methodsCollector = new DslMethodsCollectorVisitor();
		currRule.accept(methodsCollector);
		forEach(methodsCollector.dslMethods, function(methods) {
			forEach(methods, function(currMethod, arrIdx) {
				currMethod.idx = arrIdx + 1;
			});
		});
	});
}
var init_gast_resolver_public = __esmMin((() => {
	init_utils();
	init_resolver();
	init_checks();
	init_errors_public();
	init_gast();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/exceptions_public.js
function isRecognitionException(error) {
	return contains(RECOGNITION_EXCEPTION_NAMES, error.name);
}
var __extends$1, MISMATCHED_TOKEN_EXCEPTION, NO_VIABLE_ALT_EXCEPTION, EARLY_EXIT_EXCEPTION, NOT_ALL_INPUT_PARSED_EXCEPTION, RECOGNITION_EXCEPTION_NAMES, RecognitionException, MismatchedTokenException, NoViableAltException, NotAllInputParsedException, EarlyExitException;
var init_exceptions_public = __esmMin((() => {
	init_utils();
	__extends$1 = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	MISMATCHED_TOKEN_EXCEPTION = "MismatchedTokenException";
	NO_VIABLE_ALT_EXCEPTION = "NoViableAltException";
	EARLY_EXIT_EXCEPTION = "EarlyExitException";
	NOT_ALL_INPUT_PARSED_EXCEPTION = "NotAllInputParsedException";
	RECOGNITION_EXCEPTION_NAMES = [
		MISMATCHED_TOKEN_EXCEPTION,
		NO_VIABLE_ALT_EXCEPTION,
		EARLY_EXIT_EXCEPTION,
		NOT_ALL_INPUT_PARSED_EXCEPTION
	];
	Object.freeze(RECOGNITION_EXCEPTION_NAMES);
	RecognitionException = function(_super) {
		__extends$1(RecognitionException, _super);
		function RecognitionException(message, token) {
			var _newTarget = this.constructor;
			var _this = _super.call(this, message) || this;
			_this.token = token;
			_this.resyncedTokens = [];
			Object.setPrototypeOf(_this, _newTarget.prototype);
			/* istanbul ignore next - V8 workaround to remove constructor from stacktrace when typescript target is ES5 */
			if (Error.captureStackTrace) Error.captureStackTrace(_this, _this.constructor);
			return _this;
		}
		return RecognitionException;
	}(Error);
	MismatchedTokenException = function(_super) {
		__extends$1(MismatchedTokenException, _super);
		function MismatchedTokenException(message, token, previousToken) {
			var _this = _super.call(this, message, token) || this;
			_this.previousToken = previousToken;
			_this.name = MISMATCHED_TOKEN_EXCEPTION;
			return _this;
		}
		return MismatchedTokenException;
	}(RecognitionException);
	NoViableAltException = function(_super) {
		__extends$1(NoViableAltException, _super);
		function NoViableAltException(message, token, previousToken) {
			var _this = _super.call(this, message, token) || this;
			_this.previousToken = previousToken;
			_this.name = NO_VIABLE_ALT_EXCEPTION;
			return _this;
		}
		return NoViableAltException;
	}(RecognitionException);
	NotAllInputParsedException = function(_super) {
		__extends$1(NotAllInputParsedException, _super);
		function NotAllInputParsedException(message, token) {
			var _this = _super.call(this, message, token) || this;
			_this.name = NOT_ALL_INPUT_PARSED_EXCEPTION;
			return _this;
		}
		return NotAllInputParsedException;
	}(RecognitionException);
	EarlyExitException = function(_super) {
		__extends$1(EarlyExitException, _super);
		function EarlyExitException(message, token, previousToken) {
			var _this = _super.call(this, message, token) || this;
			_this.previousToken = previousToken;
			_this.name = EARLY_EXIT_EXCEPTION;
			return _this;
		}
		return EarlyExitException;
	}(RecognitionException);
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/traits/recoverable.js
function InRuleRecoveryException(message) {
	this.name = IN_RULE_RECOVERY_EXCEPTION;
	this.message = message;
}
function attemptInRepetitionRecovery(prodFunc, args, lookaheadFunc, dslMethodIdx, prodOccurrence, nextToksWalker, notStuck) {
	var key = this.getKeyForAutomaticLookahead(dslMethodIdx, prodOccurrence);
	var firstAfterRepInfo = this.firstAfterRepMap[key];
	if (firstAfterRepInfo === void 0) {
		var currRuleName = this.getCurrRuleFullName();
		var ruleGrammar = this.getGAstProductions()[currRuleName];
		firstAfterRepInfo = new nextToksWalker(ruleGrammar, prodOccurrence).startWalking();
		this.firstAfterRepMap[key] = firstAfterRepInfo;
	}
	var expectTokAfterLastMatch = firstAfterRepInfo.token;
	var nextTokIdx = firstAfterRepInfo.occurrence;
	var isEndOfRule = firstAfterRepInfo.isEndOfRule;
	if (this.RULE_STACK.length === 1 && isEndOfRule && expectTokAfterLastMatch === void 0) {
		expectTokAfterLastMatch = EOF;
		nextTokIdx = 1;
	}
	if (this.shouldInRepetitionRecoveryBeTried(expectTokAfterLastMatch, nextTokIdx, notStuck)) this.tryInRepetitionRecovery(prodFunc, args, lookaheadFunc, expectTokAfterLastMatch);
}
var EOF_FOLLOW_KEY, IN_RULE_RECOVERY_EXCEPTION, Recoverable;
var init_recoverable = __esmMin((() => {
	init_tokens_public();
	init_utils();
	init_exceptions_public();
	init_constants();
	init_parser();
	EOF_FOLLOW_KEY = {};
	IN_RULE_RECOVERY_EXCEPTION = "InRuleRecoveryException";
	InRuleRecoveryException.prototype = Error.prototype;
	Recoverable = function() {
		function Recoverable() {}
		Recoverable.prototype.initRecoverable = function(config) {
			this.firstAfterRepMap = {};
			this.resyncFollows = {};
			this.recoveryEnabled = has(config, "recoveryEnabled") ? config.recoveryEnabled : DEFAULT_PARSER_CONFIG.recoveryEnabled;
			if (this.recoveryEnabled) this.attemptInRepetitionRecovery = attemptInRepetitionRecovery;
		};
		Recoverable.prototype.getTokenToInsert = function(tokType) {
			var tokToInsert = createTokenInstance(tokType, "", NaN, NaN, NaN, NaN, NaN, NaN);
			tokToInsert.isInsertedInRecovery = true;
			return tokToInsert;
		};
		Recoverable.prototype.canTokenTypeBeInsertedInRecovery = function(tokType) {
			return true;
		};
		Recoverable.prototype.tryInRepetitionRecovery = function(grammarRule, grammarRuleArgs, lookAheadFunc, expectedTokType) {
			var _this = this;
			var reSyncTokType = this.findReSyncTokenType();
			var savedLexerState = this.exportLexerState();
			var resyncedTokens = [];
			var passedResyncPoint = false;
			var nextTokenWithoutResync = this.LA(1);
			var currToken = this.LA(1);
			var generateErrorMessage = function() {
				var previousToken = _this.LA(0);
				var msg = _this.errorMessageProvider.buildMismatchTokenMessage({
					expected: expectedTokType,
					actual: nextTokenWithoutResync,
					previous: previousToken,
					ruleName: _this.getCurrRuleFullName()
				});
				var error = new MismatchedTokenException(msg, nextTokenWithoutResync, _this.LA(0));
				error.resyncedTokens = dropRight(resyncedTokens);
				_this.SAVE_ERROR(error);
			};
			while (!passedResyncPoint) if (this.tokenMatcher(currToken, expectedTokType)) {
				generateErrorMessage();
				return;
			} else if (lookAheadFunc.call(this)) {
				generateErrorMessage();
				grammarRule.apply(this, grammarRuleArgs);
				return;
			} else if (this.tokenMatcher(currToken, reSyncTokType)) passedResyncPoint = true;
			else {
				currToken = this.SKIP_TOKEN();
				this.addToResyncTokens(currToken, resyncedTokens);
			}
			this.importLexerState(savedLexerState);
		};
		Recoverable.prototype.shouldInRepetitionRecoveryBeTried = function(expectTokAfterLastMatch, nextTokIdx, notStuck) {
			if (notStuck === false) return false;
			if (expectTokAfterLastMatch === void 0 || nextTokIdx === void 0) return false;
			if (this.tokenMatcher(this.LA(1), expectTokAfterLastMatch)) return false;
			if (this.isBackTracking()) return false;
			if (this.canPerformInRuleRecovery(expectTokAfterLastMatch, this.getFollowsForInRuleRecovery(expectTokAfterLastMatch, nextTokIdx))) return false;
			return true;
		};
		Recoverable.prototype.getFollowsForInRuleRecovery = function(tokType, tokIdxInRule) {
			var grammarPath = this.getCurrentGrammarPath(tokType, tokIdxInRule);
			return this.getNextPossibleTokenTypes(grammarPath);
		};
		Recoverable.prototype.tryInRuleRecovery = function(expectedTokType, follows) {
			if (this.canRecoverWithSingleTokenInsertion(expectedTokType, follows)) return this.getTokenToInsert(expectedTokType);
			if (this.canRecoverWithSingleTokenDeletion(expectedTokType)) {
				var nextTok = this.SKIP_TOKEN();
				this.consumeToken();
				return nextTok;
			}
			throw new InRuleRecoveryException("sad sad panda");
		};
		Recoverable.prototype.canPerformInRuleRecovery = function(expectedToken, follows) {
			return this.canRecoverWithSingleTokenInsertion(expectedToken, follows) || this.canRecoverWithSingleTokenDeletion(expectedToken);
		};
		Recoverable.prototype.canRecoverWithSingleTokenInsertion = function(expectedTokType, follows) {
			var _this = this;
			if (!this.canTokenTypeBeInsertedInRecovery(expectedTokType)) return false;
			if (isEmpty(follows)) return false;
			var mismatchedTok = this.LA(1);
			return find(follows, function(possibleFollowsTokType) {
				return _this.tokenMatcher(mismatchedTok, possibleFollowsTokType);
			}) !== void 0;
		};
		Recoverable.prototype.canRecoverWithSingleTokenDeletion = function(expectedTokType) {
			return this.tokenMatcher(this.LA(2), expectedTokType);
		};
		Recoverable.prototype.isInCurrentRuleReSyncSet = function(tokenTypeIdx) {
			var followKey = this.getCurrFollowKey();
			return contains(this.getFollowSetFromFollowKey(followKey), tokenTypeIdx);
		};
		Recoverable.prototype.findReSyncTokenType = function() {
			var allPossibleReSyncTokTypes = this.flattenFollowSet();
			var nextToken = this.LA(1);
			var k = 2;
			while (true) {
				var nextTokenType = nextToken.tokenType;
				if (contains(allPossibleReSyncTokTypes, nextTokenType)) return nextTokenType;
				nextToken = this.LA(k);
				k++;
			}
		};
		Recoverable.prototype.getCurrFollowKey = function() {
			if (this.RULE_STACK.length === 1) return EOF_FOLLOW_KEY;
			var currRuleShortName = this.getLastExplicitRuleShortName();
			var currRuleIdx = this.getLastExplicitRuleOccurrenceIndex();
			var prevRuleShortName = this.getPreviousExplicitRuleShortName();
			return {
				ruleName: this.shortRuleNameToFullName(currRuleShortName),
				idxInCallingRule: currRuleIdx,
				inRule: this.shortRuleNameToFullName(prevRuleShortName)
			};
		};
		Recoverable.prototype.buildFullFollowKeyStack = function() {
			var _this = this;
			var explicitRuleStack = this.RULE_STACK;
			var explicitOccurrenceStack = this.RULE_OCCURRENCE_STACK;
			return map(explicitRuleStack, function(ruleName, idx) {
				if (idx === 0) return EOF_FOLLOW_KEY;
				return {
					ruleName: _this.shortRuleNameToFullName(ruleName),
					idxInCallingRule: explicitOccurrenceStack[idx],
					inRule: _this.shortRuleNameToFullName(explicitRuleStack[idx - 1])
				};
			});
		};
		Recoverable.prototype.flattenFollowSet = function() {
			var _this = this;
			return flatten(map(this.buildFullFollowKeyStack(), function(currKey) {
				return _this.getFollowSetFromFollowKey(currKey);
			}));
		};
		Recoverable.prototype.getFollowSetFromFollowKey = function(followKey) {
			if (followKey === EOF_FOLLOW_KEY) return [EOF];
			var followName = followKey.ruleName + followKey.idxInCallingRule + IN + followKey.inRule;
			return this.resyncFollows[followName];
		};
		Recoverable.prototype.addToResyncTokens = function(token, resyncTokens) {
			if (!this.tokenMatcher(token, EOF)) resyncTokens.push(token);
			return resyncTokens;
		};
		Recoverable.prototype.reSyncTo = function(tokType) {
			var resyncedTokens = [];
			var nextTok = this.LA(1);
			while (this.tokenMatcher(nextTok, tokType) === false) {
				nextTok = this.SKIP_TOKEN();
				this.addToResyncTokens(nextTok, resyncedTokens);
			}
			return dropRight(resyncedTokens);
		};
		Recoverable.prototype.attemptInRepetitionRecovery = function(prodFunc, args, lookaheadFunc, dslMethodIdx, prodOccurrence, nextToksWalker, notStuck) {};
		Recoverable.prototype.getCurrentGrammarPath = function(tokType, tokIdxInRule) {
			return {
				ruleStack: this.getHumanReadableRuleStack(),
				occurrenceStack: cloneArr(this.RULE_OCCURRENCE_STACK),
				lastTok: tokType,
				lastTokOccurrence: tokIdxInRule
			};
		};
		Recoverable.prototype.getHumanReadableRuleStack = function() {
			var _this = this;
			return map(this.RULE_STACK, function(currShortName) {
				return _this.shortRuleNameToFullName(currShortName);
			});
		};
		return Recoverable;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/grammar/keys.js
function getKeyForAutomaticLookahead(ruleIdx, dslMethodIdx, occurrence) {
	return occurrence | dslMethodIdx | ruleIdx;
}
var AT_LEAST_ONE_IDX, MANY_SEP_IDX, AT_LEAST_ONE_SEP_IDX;
var init_keys = __esmMin((() => {
	AT_LEAST_ONE_IDX = 1024;
	MANY_SEP_IDX = 1280;
	AT_LEAST_ONE_SEP_IDX = 1536;
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/traits/looksahead.js
var LooksAhead;
var init_looksahead = __esmMin((() => {
	init_lookahead();
	init_utils();
	init_parser();
	init_keys();
	init_gast();
	LooksAhead = function() {
		function LooksAhead() {}
		LooksAhead.prototype.initLooksAhead = function(config) {
			this.dynamicTokensEnabled = has(config, "dynamicTokensEnabled") ? config.dynamicTokensEnabled : DEFAULT_PARSER_CONFIG.dynamicTokensEnabled;
			this.maxLookahead = has(config, "maxLookahead") ? config.maxLookahead : DEFAULT_PARSER_CONFIG.maxLookahead;
			/* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
			this.lookAheadFuncsCache = isES2015MapSupported() ? /* @__PURE__ */ new Map() : [];
			/* istanbul ignore else - The else branch will be tested on older node.js versions and IE11 */
			if (isES2015MapSupported()) {
				this.getLaFuncFromCache = this.getLaFuncFromMap;
				this.setLaFuncCache = this.setLaFuncCacheUsingMap;
			} else {
				this.getLaFuncFromCache = this.getLaFuncFromObj;
				this.setLaFuncCache = this.setLaFuncUsingObj;
			}
		};
		LooksAhead.prototype.preComputeLookaheadFunctions = function(rules) {
			var _this = this;
			forEach(rules, function(currRule) {
				_this.TRACE_INIT(currRule.name + " Rule Lookahead", function() {
					var _a = collectMethods(currRule), alternation = _a.alternation, repetition = _a.repetition, option = _a.option, repetitionMandatory = _a.repetitionMandatory, repetitionMandatoryWithSeparator = _a.repetitionMandatoryWithSeparator, repetitionWithSeparator = _a.repetitionWithSeparator;
					forEach(alternation, function(currProd) {
						var prodIdx = currProd.idx === 0 ? "" : currProd.idx;
						_this.TRACE_INIT("" + getProductionDslName(currProd) + prodIdx, function() {
							var laFunc = buildLookaheadFuncForOr(currProd.idx, currRule, currProd.maxLookahead || _this.maxLookahead, currProd.hasPredicates, _this.dynamicTokensEnabled, _this.lookAheadBuilderForAlternatives);
							var key = getKeyForAutomaticLookahead(_this.fullRuleNameToShort[currRule.name], 256, currProd.idx);
							_this.setLaFuncCache(key, laFunc);
						});
					});
					forEach(repetition, function(currProd) {
						_this.computeLookaheadFunc(currRule, currProd.idx, 768, PROD_TYPE.REPETITION, currProd.maxLookahead, getProductionDslName(currProd));
					});
					forEach(option, function(currProd) {
						_this.computeLookaheadFunc(currRule, currProd.idx, 512, PROD_TYPE.OPTION, currProd.maxLookahead, getProductionDslName(currProd));
					});
					forEach(repetitionMandatory, function(currProd) {
						_this.computeLookaheadFunc(currRule, currProd.idx, AT_LEAST_ONE_IDX, PROD_TYPE.REPETITION_MANDATORY, currProd.maxLookahead, getProductionDslName(currProd));
					});
					forEach(repetitionMandatoryWithSeparator, function(currProd) {
						_this.computeLookaheadFunc(currRule, currProd.idx, AT_LEAST_ONE_SEP_IDX, PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR, currProd.maxLookahead, getProductionDslName(currProd));
					});
					forEach(repetitionWithSeparator, function(currProd) {
						_this.computeLookaheadFunc(currRule, currProd.idx, MANY_SEP_IDX, PROD_TYPE.REPETITION_WITH_SEPARATOR, currProd.maxLookahead, getProductionDslName(currProd));
					});
				});
			});
		};
		LooksAhead.prototype.computeLookaheadFunc = function(rule, prodOccurrence, prodKey, prodType, prodMaxLookahead, dslMethodName) {
			var _this = this;
			this.TRACE_INIT("" + dslMethodName + (prodOccurrence === 0 ? "" : prodOccurrence), function() {
				var laFunc = buildLookaheadFuncForOptionalProd(prodOccurrence, rule, prodMaxLookahead || _this.maxLookahead, _this.dynamicTokensEnabled, prodType, _this.lookAheadBuilderForOptional);
				var key = getKeyForAutomaticLookahead(_this.fullRuleNameToShort[rule.name], prodKey, prodOccurrence);
				_this.setLaFuncCache(key, laFunc);
			});
		};
		LooksAhead.prototype.lookAheadBuilderForOptional = function(alt, tokenMatcher, dynamicTokensEnabled) {
			return buildSingleAlternativeLookaheadFunction(alt, tokenMatcher, dynamicTokensEnabled);
		};
		LooksAhead.prototype.lookAheadBuilderForAlternatives = function(alts, hasPredicates, tokenMatcher, dynamicTokensEnabled) {
			return buildAlternativesLookAheadFunc(alts, hasPredicates, tokenMatcher, dynamicTokensEnabled);
		};
		LooksAhead.prototype.getKeyForAutomaticLookahead = function(dslMethodIdx, occurrence) {
			return getKeyForAutomaticLookahead(this.getLastExplicitRuleShortName(), dslMethodIdx, occurrence);
		};
		/* istanbul ignore next */
		LooksAhead.prototype.getLaFuncFromCache = function(key) {};
		LooksAhead.prototype.getLaFuncFromMap = function(key) {
			return this.lookAheadFuncsCache.get(key);
		};
		/* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
		LooksAhead.prototype.getLaFuncFromObj = function(key) {
			return this.lookAheadFuncsCache[key];
		};
		/* istanbul ignore next */
		LooksAhead.prototype.setLaFuncCache = function(key, value) {};
		LooksAhead.prototype.setLaFuncCacheUsingMap = function(key, value) {
			this.lookAheadFuncsCache.set(key, value);
		};
		/* istanbul ignore next - Using plain array as dictionary will be tested on older node.js versions and IE11 */
		LooksAhead.prototype.setLaFuncUsingObj = function(key, value) {
			this.lookAheadFuncsCache[key] = value;
		};
		return LooksAhead;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/cst/cst.js
/**
* This nodeLocation tracking is not efficient and should only be used
* when error recovery is enabled or the Token Vector contains virtual Tokens
* (e.g, Python Indent/Outdent)
* As it executes the calculation for every single terminal/nonTerminal
* and does not rely on the fact the token vector is **sorted**
*/
function setNodeLocationOnlyOffset(currNodeLocation, newLocationInfo) {
	if (isNaN(currNodeLocation.startOffset) === true) {
		currNodeLocation.startOffset = newLocationInfo.startOffset;
		currNodeLocation.endOffset = newLocationInfo.endOffset;
	} else if (currNodeLocation.endOffset < newLocationInfo.endOffset === true) currNodeLocation.endOffset = newLocationInfo.endOffset;
}
/**
* This nodeLocation tracking is not efficient and should only be used
* when error recovery is enabled or the Token Vector contains virtual Tokens
* (e.g, Python Indent/Outdent)
* As it executes the calculation for every single terminal/nonTerminal
* and does not rely on the fact the token vector is **sorted**
*/
function setNodeLocationFull(currNodeLocation, newLocationInfo) {
	if (isNaN(currNodeLocation.startOffset) === true) {
		currNodeLocation.startOffset = newLocationInfo.startOffset;
		currNodeLocation.startColumn = newLocationInfo.startColumn;
		currNodeLocation.startLine = newLocationInfo.startLine;
		currNodeLocation.endOffset = newLocationInfo.endOffset;
		currNodeLocation.endColumn = newLocationInfo.endColumn;
		currNodeLocation.endLine = newLocationInfo.endLine;
	} else if (currNodeLocation.endOffset < newLocationInfo.endOffset === true) {
		currNodeLocation.endOffset = newLocationInfo.endOffset;
		currNodeLocation.endColumn = newLocationInfo.endColumn;
		currNodeLocation.endLine = newLocationInfo.endLine;
	}
}
function addTerminalToCst(node, token, tokenTypeName) {
	if (node.children[tokenTypeName] === void 0) node.children[tokenTypeName] = [token];
	else node.children[tokenTypeName].push(token);
}
function addNoneTerminalToCst(node, ruleName, ruleResult) {
	if (node.children[ruleName] === void 0) node.children[ruleName] = [ruleResult];
	else node.children[ruleName].push(ruleResult);
}
var init_cst = __esmMin((() => {}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/lang/lang_extensions.js
function classNameFromInstance(instance) {
	return functionName(instance.constructor);
}
/**
* Utility to obtain Function names.
* Note that there should not be an assumptions on the result of this function.
* E.g: When running from minified source code the result may be auto generated.
*/
function functionName(func) {
	var existingNameProp = func.name;
	/* istanbul ignore else - too many hacks for IE/old versions of node.js here*/
	if (existingNameProp) return existingNameProp;
	else return "anonymous";
}
/**
* @returns {boolean} - has the property been successfully defined
*/
function defineNameProp(obj, nameValue) {
	var namePropDescriptor = Object.getOwnPropertyDescriptor(obj, NAME);
	/* istanbul ignore else -> will only run in old versions of node.js */
	if (isUndefined(namePropDescriptor) || namePropDescriptor.configurable) {
		Object.defineProperty(obj, NAME, {
			enumerable: false,
			configurable: true,
			writable: false,
			value: nameValue
		});
		return true;
	}
	/* istanbul ignore next -> will only run in old versions of node.js */
	return false;
}
var NAME;
var init_lang_extensions = __esmMin((() => {
	init_utils();
	NAME = "name";
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/cst/cst_visitor.js
function defaultVisit(ctx, param) {
	var childrenNames = keys(ctx);
	var childrenNamesLength = childrenNames.length;
	for (var i = 0; i < childrenNamesLength; i++) {
		var currChildArray = ctx[childrenNames[i]];
		var currChildArrayLength = currChildArray.length;
		for (var j = 0; j < currChildArrayLength; j++) {
			var currChild = currChildArray[j];
			if (currChild.tokenTypeIdx === void 0) this[currChild.name](currChild.children, param);
		}
	}
}
function createBaseSemanticVisitorConstructor(grammarName, ruleNames) {
	var derivedConstructor = function() {};
	defineNameProp(derivedConstructor, grammarName + "BaseSemantics");
	derivedConstructor.prototype = {
		visit: function(cstNode, param) {
			if (isArray(cstNode)) cstNode = cstNode[0];
			if (isUndefined(cstNode)) return;
			return this[cstNode.name](cstNode.children, param);
		},
		validateVisitor: function() {
			var semanticDefinitionErrors = validateVisitor(this, ruleNames);
			if (!isEmpty(semanticDefinitionErrors)) {
				var errorMessages = map(semanticDefinitionErrors, function(currDefError) {
					return currDefError.msg;
				});
				throw Error("Errors Detected in CST Visitor <" + functionName(this.constructor) + ">:\n	" + ("" + errorMessages.join("\n\n").replace(/\n/g, "\n	")));
			}
		}
	};
	derivedConstructor.prototype.constructor = derivedConstructor;
	derivedConstructor._RULE_NAMES = ruleNames;
	return derivedConstructor;
}
function createBaseVisitorConstructorWithDefaults(grammarName, ruleNames, baseConstructor) {
	var derivedConstructor = function() {};
	defineNameProp(derivedConstructor, grammarName + "BaseSemanticsWithDefaults");
	var withDefaultsProto = Object.create(baseConstructor.prototype);
	forEach(ruleNames, function(ruleName) {
		withDefaultsProto[ruleName] = defaultVisit;
	});
	derivedConstructor.prototype = withDefaultsProto;
	derivedConstructor.prototype.constructor = derivedConstructor;
	return derivedConstructor;
}
function validateVisitor(visitorInstance, ruleNames) {
	var missingErrors = validateMissingCstMethods(visitorInstance, ruleNames);
	var redundantErrors = validateRedundantMethods(visitorInstance, ruleNames);
	return missingErrors.concat(redundantErrors);
}
function validateMissingCstMethods(visitorInstance, ruleNames) {
	return compact(map(ruleNames, function(currRuleName) {
		if (!isFunction(visitorInstance[currRuleName])) return {
			msg: "Missing visitor method: <" + currRuleName + "> on " + functionName(visitorInstance.constructor) + " CST Visitor.",
			type: CstVisitorDefinitionError.MISSING_METHOD,
			methodName: currRuleName
		};
	}));
}
function validateRedundantMethods(visitorInstance, ruleNames) {
	var errors = [];
	for (var prop in visitorInstance) if (isFunction(visitorInstance[prop]) && !contains(VALID_PROP_NAMES, prop) && !contains(ruleNames, prop)) errors.push({
		msg: "Redundant visitor method: <" + prop + "> on " + functionName(visitorInstance.constructor) + " CST Visitor\nThere is no Grammar Rule corresponding to this method's name.\n",
		type: CstVisitorDefinitionError.REDUNDANT_METHOD,
		methodName: prop
	});
	return errors;
}
var CstVisitorDefinitionError, VALID_PROP_NAMES;
var init_cst_visitor = __esmMin((() => {
	init_utils();
	init_lang_extensions();
	(function(CstVisitorDefinitionError) {
		CstVisitorDefinitionError[CstVisitorDefinitionError["REDUNDANT_METHOD"] = 0] = "REDUNDANT_METHOD";
		CstVisitorDefinitionError[CstVisitorDefinitionError["MISSING_METHOD"] = 1] = "MISSING_METHOD";
	})(CstVisitorDefinitionError || (CstVisitorDefinitionError = {}));
	VALID_PROP_NAMES = [
		"constructor",
		"visit",
		"validateVisitor"
	];
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/traits/tree_builder.js
var TreeBuilder;
var init_tree_builder = __esmMin((() => {
	init_cst();
	init_utils();
	init_cst_visitor();
	init_parser();
	TreeBuilder = function() {
		function TreeBuilder() {}
		TreeBuilder.prototype.initTreeBuilder = function(config) {
			this.CST_STACK = [];
			this.outputCst = config.outputCst;
			this.nodeLocationTracking = has(config, "nodeLocationTracking") ? config.nodeLocationTracking : DEFAULT_PARSER_CONFIG.nodeLocationTracking;
			if (!this.outputCst) {
				this.cstInvocationStateUpdate = NOOP;
				this.cstFinallyStateUpdate = NOOP;
				this.cstPostTerminal = NOOP;
				this.cstPostNonTerminal = NOOP;
				this.cstPostRule = NOOP;
			} else if (/full/i.test(this.nodeLocationTracking)) if (this.recoveryEnabled) {
				this.setNodeLocationFromToken = setNodeLocationFull;
				this.setNodeLocationFromNode = setNodeLocationFull;
				this.cstPostRule = NOOP;
				this.setInitialNodeLocation = this.setInitialNodeLocationFullRecovery;
			} else {
				this.setNodeLocationFromToken = NOOP;
				this.setNodeLocationFromNode = NOOP;
				this.cstPostRule = this.cstPostRuleFull;
				this.setInitialNodeLocation = this.setInitialNodeLocationFullRegular;
			}
			else if (/onlyOffset/i.test(this.nodeLocationTracking)) if (this.recoveryEnabled) {
				this.setNodeLocationFromToken = setNodeLocationOnlyOffset;
				this.setNodeLocationFromNode = setNodeLocationOnlyOffset;
				this.cstPostRule = NOOP;
				this.setInitialNodeLocation = this.setInitialNodeLocationOnlyOffsetRecovery;
			} else {
				this.setNodeLocationFromToken = NOOP;
				this.setNodeLocationFromNode = NOOP;
				this.cstPostRule = this.cstPostRuleOnlyOffset;
				this.setInitialNodeLocation = this.setInitialNodeLocationOnlyOffsetRegular;
			}
			else if (/none/i.test(this.nodeLocationTracking)) {
				this.setNodeLocationFromToken = NOOP;
				this.setNodeLocationFromNode = NOOP;
				this.cstPostRule = NOOP;
				this.setInitialNodeLocation = NOOP;
			} else throw Error("Invalid <nodeLocationTracking> config option: \"" + config.nodeLocationTracking + "\"");
		};
		TreeBuilder.prototype.setInitialNodeLocationOnlyOffsetRecovery = function(cstNode) {
			cstNode.location = {
				startOffset: NaN,
				endOffset: NaN
			};
		};
		TreeBuilder.prototype.setInitialNodeLocationOnlyOffsetRegular = function(cstNode) {
			cstNode.location = {
				startOffset: this.LA(1).startOffset,
				endOffset: NaN
			};
		};
		TreeBuilder.prototype.setInitialNodeLocationFullRecovery = function(cstNode) {
			cstNode.location = {
				startOffset: NaN,
				startLine: NaN,
				startColumn: NaN,
				endOffset: NaN,
				endLine: NaN,
				endColumn: NaN
			};
		};
		/**
		*  @see setInitialNodeLocationOnlyOffsetRegular for explanation why this work
		
		* @param cstNode
		*/
		TreeBuilder.prototype.setInitialNodeLocationFullRegular = function(cstNode) {
			var nextToken = this.LA(1);
			cstNode.location = {
				startOffset: nextToken.startOffset,
				startLine: nextToken.startLine,
				startColumn: nextToken.startColumn,
				endOffset: NaN,
				endLine: NaN,
				endColumn: NaN
			};
		};
		TreeBuilder.prototype.cstInvocationStateUpdate = function(fullRuleName, shortName) {
			var cstNode = {
				name: fullRuleName,
				children: {}
			};
			this.setInitialNodeLocation(cstNode);
			this.CST_STACK.push(cstNode);
		};
		TreeBuilder.prototype.cstFinallyStateUpdate = function() {
			this.CST_STACK.pop();
		};
		TreeBuilder.prototype.cstPostRuleFull = function(ruleCstNode) {
			var prevToken = this.LA(0);
			var loc = ruleCstNode.location;
			if (loc.startOffset <= prevToken.startOffset === true) {
				loc.endOffset = prevToken.endOffset;
				loc.endLine = prevToken.endLine;
				loc.endColumn = prevToken.endColumn;
			} else {
				loc.startOffset = NaN;
				loc.startLine = NaN;
				loc.startColumn = NaN;
			}
		};
		TreeBuilder.prototype.cstPostRuleOnlyOffset = function(ruleCstNode) {
			var prevToken = this.LA(0);
			var loc = ruleCstNode.location;
			if (loc.startOffset <= prevToken.startOffset === true) loc.endOffset = prevToken.endOffset;
			else loc.startOffset = NaN;
		};
		TreeBuilder.prototype.cstPostTerminal = function(key, consumedToken) {
			var rootCst = this.CST_STACK[this.CST_STACK.length - 1];
			addTerminalToCst(rootCst, consumedToken, key);
			this.setNodeLocationFromToken(rootCst.location, consumedToken);
		};
		TreeBuilder.prototype.cstPostNonTerminal = function(ruleCstResult, ruleName) {
			var preCstNode = this.CST_STACK[this.CST_STACK.length - 1];
			addNoneTerminalToCst(preCstNode, ruleName, ruleCstResult);
			this.setNodeLocationFromNode(preCstNode.location, ruleCstResult.location);
		};
		TreeBuilder.prototype.getBaseCstVisitorConstructor = function() {
			if (isUndefined(this.baseCstVisitorConstructor)) {
				var newBaseCstVisitorConstructor = createBaseSemanticVisitorConstructor(this.className, keys(this.gastProductionsCache));
				this.baseCstVisitorConstructor = newBaseCstVisitorConstructor;
				return newBaseCstVisitorConstructor;
			}
			return this.baseCstVisitorConstructor;
		};
		TreeBuilder.prototype.getBaseCstVisitorConstructorWithDefaults = function() {
			if (isUndefined(this.baseCstVisitorWithDefaultsConstructor)) {
				var newConstructor = createBaseVisitorConstructorWithDefaults(this.className, keys(this.gastProductionsCache), this.getBaseCstVisitorConstructor());
				this.baseCstVisitorWithDefaultsConstructor = newConstructor;
				return newConstructor;
			}
			return this.baseCstVisitorWithDefaultsConstructor;
		};
		TreeBuilder.prototype.getLastExplicitRuleShortName = function() {
			var ruleStack = this.RULE_STACK;
			return ruleStack[ruleStack.length - 1];
		};
		TreeBuilder.prototype.getPreviousExplicitRuleShortName = function() {
			var ruleStack = this.RULE_STACK;
			return ruleStack[ruleStack.length - 2];
		};
		TreeBuilder.prototype.getLastExplicitRuleOccurrenceIndex = function() {
			var occurrenceStack = this.RULE_OCCURRENCE_STACK;
			return occurrenceStack[occurrenceStack.length - 1];
		};
		return TreeBuilder;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/traits/lexer_adapter.js
var LexerAdapter;
var init_lexer_adapter = __esmMin((() => {
	init_parser();
	LexerAdapter = function() {
		function LexerAdapter() {}
		LexerAdapter.prototype.initLexerAdapter = function() {
			this.tokVector = [];
			this.tokVectorLength = 0;
			this.currIdx = -1;
		};
		Object.defineProperty(LexerAdapter.prototype, "input", {
			get: function() {
				return this.tokVector;
			},
			set: function(newInput) {
				if (this.selfAnalysisDone !== true) throw Error("Missing <performSelfAnalysis> invocation at the end of the Parser's constructor.");
				this.reset();
				this.tokVector = newInput;
				this.tokVectorLength = newInput.length;
			},
			enumerable: false,
			configurable: true
		});
		LexerAdapter.prototype.SKIP_TOKEN = function() {
			if (this.currIdx <= this.tokVector.length - 2) {
				this.consumeToken();
				return this.LA(1);
			} else return END_OF_FILE;
		};
		LexerAdapter.prototype.LA = function(howMuch) {
			var soughtIdx = this.currIdx + howMuch;
			if (soughtIdx < 0 || this.tokVectorLength <= soughtIdx) return END_OF_FILE;
			else return this.tokVector[soughtIdx];
		};
		LexerAdapter.prototype.consumeToken = function() {
			this.currIdx++;
		};
		LexerAdapter.prototype.exportLexerState = function() {
			return this.currIdx;
		};
		LexerAdapter.prototype.importLexerState = function(newState) {
			this.currIdx = newState;
		};
		LexerAdapter.prototype.resetLexerState = function() {
			this.currIdx = -1;
		};
		LexerAdapter.prototype.moveToTerminatedState = function() {
			this.currIdx = this.tokVector.length - 1;
		};
		LexerAdapter.prototype.getLexerPosition = function() {
			return this.exportLexerState();
		};
		return LexerAdapter;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/traits/recognizer_api.js
var RecognizerApi;
var init_recognizer_api = __esmMin((() => {
	init_utils();
	init_exceptions_public();
	init_parser();
	init_errors_public();
	init_checks();
	init_gast_public();
	RecognizerApi = function() {
		function RecognizerApi() {}
		RecognizerApi.prototype.ACTION = function(impl) {
			return impl.call(this);
		};
		RecognizerApi.prototype.consume = function(idx, tokType, options) {
			return this.consumeInternal(tokType, idx, options);
		};
		RecognizerApi.prototype.subrule = function(idx, ruleToCall, options) {
			return this.subruleInternal(ruleToCall, idx, options);
		};
		RecognizerApi.prototype.option = function(idx, actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, idx);
		};
		RecognizerApi.prototype.or = function(idx, altsOrOpts) {
			return this.orInternal(altsOrOpts, idx);
		};
		RecognizerApi.prototype.many = function(idx, actionORMethodDef) {
			return this.manyInternal(idx, actionORMethodDef);
		};
		RecognizerApi.prototype.atLeastOne = function(idx, actionORMethodDef) {
			return this.atLeastOneInternal(idx, actionORMethodDef);
		};
		RecognizerApi.prototype.CONSUME = function(tokType, options) {
			return this.consumeInternal(tokType, 0, options);
		};
		RecognizerApi.prototype.CONSUME1 = function(tokType, options) {
			return this.consumeInternal(tokType, 1, options);
		};
		RecognizerApi.prototype.CONSUME2 = function(tokType, options) {
			return this.consumeInternal(tokType, 2, options);
		};
		RecognizerApi.prototype.CONSUME3 = function(tokType, options) {
			return this.consumeInternal(tokType, 3, options);
		};
		RecognizerApi.prototype.CONSUME4 = function(tokType, options) {
			return this.consumeInternal(tokType, 4, options);
		};
		RecognizerApi.prototype.CONSUME5 = function(tokType, options) {
			return this.consumeInternal(tokType, 5, options);
		};
		RecognizerApi.prototype.CONSUME6 = function(tokType, options) {
			return this.consumeInternal(tokType, 6, options);
		};
		RecognizerApi.prototype.CONSUME7 = function(tokType, options) {
			return this.consumeInternal(tokType, 7, options);
		};
		RecognizerApi.prototype.CONSUME8 = function(tokType, options) {
			return this.consumeInternal(tokType, 8, options);
		};
		RecognizerApi.prototype.CONSUME9 = function(tokType, options) {
			return this.consumeInternal(tokType, 9, options);
		};
		RecognizerApi.prototype.SUBRULE = function(ruleToCall, options) {
			return this.subruleInternal(ruleToCall, 0, options);
		};
		RecognizerApi.prototype.SUBRULE1 = function(ruleToCall, options) {
			return this.subruleInternal(ruleToCall, 1, options);
		};
		RecognizerApi.prototype.SUBRULE2 = function(ruleToCall, options) {
			return this.subruleInternal(ruleToCall, 2, options);
		};
		RecognizerApi.prototype.SUBRULE3 = function(ruleToCall, options) {
			return this.subruleInternal(ruleToCall, 3, options);
		};
		RecognizerApi.prototype.SUBRULE4 = function(ruleToCall, options) {
			return this.subruleInternal(ruleToCall, 4, options);
		};
		RecognizerApi.prototype.SUBRULE5 = function(ruleToCall, options) {
			return this.subruleInternal(ruleToCall, 5, options);
		};
		RecognizerApi.prototype.SUBRULE6 = function(ruleToCall, options) {
			return this.subruleInternal(ruleToCall, 6, options);
		};
		RecognizerApi.prototype.SUBRULE7 = function(ruleToCall, options) {
			return this.subruleInternal(ruleToCall, 7, options);
		};
		RecognizerApi.prototype.SUBRULE8 = function(ruleToCall, options) {
			return this.subruleInternal(ruleToCall, 8, options);
		};
		RecognizerApi.prototype.SUBRULE9 = function(ruleToCall, options) {
			return this.subruleInternal(ruleToCall, 9, options);
		};
		RecognizerApi.prototype.OPTION = function(actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, 0);
		};
		RecognizerApi.prototype.OPTION1 = function(actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, 1);
		};
		RecognizerApi.prototype.OPTION2 = function(actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, 2);
		};
		RecognizerApi.prototype.OPTION3 = function(actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, 3);
		};
		RecognizerApi.prototype.OPTION4 = function(actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, 4);
		};
		RecognizerApi.prototype.OPTION5 = function(actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, 5);
		};
		RecognizerApi.prototype.OPTION6 = function(actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, 6);
		};
		RecognizerApi.prototype.OPTION7 = function(actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, 7);
		};
		RecognizerApi.prototype.OPTION8 = function(actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, 8);
		};
		RecognizerApi.prototype.OPTION9 = function(actionORMethodDef) {
			return this.optionInternal(actionORMethodDef, 9);
		};
		RecognizerApi.prototype.OR = function(altsOrOpts) {
			return this.orInternal(altsOrOpts, 0);
		};
		RecognizerApi.prototype.OR1 = function(altsOrOpts) {
			return this.orInternal(altsOrOpts, 1);
		};
		RecognizerApi.prototype.OR2 = function(altsOrOpts) {
			return this.orInternal(altsOrOpts, 2);
		};
		RecognizerApi.prototype.OR3 = function(altsOrOpts) {
			return this.orInternal(altsOrOpts, 3);
		};
		RecognizerApi.prototype.OR4 = function(altsOrOpts) {
			return this.orInternal(altsOrOpts, 4);
		};
		RecognizerApi.prototype.OR5 = function(altsOrOpts) {
			return this.orInternal(altsOrOpts, 5);
		};
		RecognizerApi.prototype.OR6 = function(altsOrOpts) {
			return this.orInternal(altsOrOpts, 6);
		};
		RecognizerApi.prototype.OR7 = function(altsOrOpts) {
			return this.orInternal(altsOrOpts, 7);
		};
		RecognizerApi.prototype.OR8 = function(altsOrOpts) {
			return this.orInternal(altsOrOpts, 8);
		};
		RecognizerApi.prototype.OR9 = function(altsOrOpts) {
			return this.orInternal(altsOrOpts, 9);
		};
		RecognizerApi.prototype.MANY = function(actionORMethodDef) {
			this.manyInternal(0, actionORMethodDef);
		};
		RecognizerApi.prototype.MANY1 = function(actionORMethodDef) {
			this.manyInternal(1, actionORMethodDef);
		};
		RecognizerApi.prototype.MANY2 = function(actionORMethodDef) {
			this.manyInternal(2, actionORMethodDef);
		};
		RecognizerApi.prototype.MANY3 = function(actionORMethodDef) {
			this.manyInternal(3, actionORMethodDef);
		};
		RecognizerApi.prototype.MANY4 = function(actionORMethodDef) {
			this.manyInternal(4, actionORMethodDef);
		};
		RecognizerApi.prototype.MANY5 = function(actionORMethodDef) {
			this.manyInternal(5, actionORMethodDef);
		};
		RecognizerApi.prototype.MANY6 = function(actionORMethodDef) {
			this.manyInternal(6, actionORMethodDef);
		};
		RecognizerApi.prototype.MANY7 = function(actionORMethodDef) {
			this.manyInternal(7, actionORMethodDef);
		};
		RecognizerApi.prototype.MANY8 = function(actionORMethodDef) {
			this.manyInternal(8, actionORMethodDef);
		};
		RecognizerApi.prototype.MANY9 = function(actionORMethodDef) {
			this.manyInternal(9, actionORMethodDef);
		};
		RecognizerApi.prototype.MANY_SEP = function(options) {
			this.manySepFirstInternal(0, options);
		};
		RecognizerApi.prototype.MANY_SEP1 = function(options) {
			this.manySepFirstInternal(1, options);
		};
		RecognizerApi.prototype.MANY_SEP2 = function(options) {
			this.manySepFirstInternal(2, options);
		};
		RecognizerApi.prototype.MANY_SEP3 = function(options) {
			this.manySepFirstInternal(3, options);
		};
		RecognizerApi.prototype.MANY_SEP4 = function(options) {
			this.manySepFirstInternal(4, options);
		};
		RecognizerApi.prototype.MANY_SEP5 = function(options) {
			this.manySepFirstInternal(5, options);
		};
		RecognizerApi.prototype.MANY_SEP6 = function(options) {
			this.manySepFirstInternal(6, options);
		};
		RecognizerApi.prototype.MANY_SEP7 = function(options) {
			this.manySepFirstInternal(7, options);
		};
		RecognizerApi.prototype.MANY_SEP8 = function(options) {
			this.manySepFirstInternal(8, options);
		};
		RecognizerApi.prototype.MANY_SEP9 = function(options) {
			this.manySepFirstInternal(9, options);
		};
		RecognizerApi.prototype.AT_LEAST_ONE = function(actionORMethodDef) {
			this.atLeastOneInternal(0, actionORMethodDef);
		};
		RecognizerApi.prototype.AT_LEAST_ONE1 = function(actionORMethodDef) {
			return this.atLeastOneInternal(1, actionORMethodDef);
		};
		RecognizerApi.prototype.AT_LEAST_ONE2 = function(actionORMethodDef) {
			this.atLeastOneInternal(2, actionORMethodDef);
		};
		RecognizerApi.prototype.AT_LEAST_ONE3 = function(actionORMethodDef) {
			this.atLeastOneInternal(3, actionORMethodDef);
		};
		RecognizerApi.prototype.AT_LEAST_ONE4 = function(actionORMethodDef) {
			this.atLeastOneInternal(4, actionORMethodDef);
		};
		RecognizerApi.prototype.AT_LEAST_ONE5 = function(actionORMethodDef) {
			this.atLeastOneInternal(5, actionORMethodDef);
		};
		RecognizerApi.prototype.AT_LEAST_ONE6 = function(actionORMethodDef) {
			this.atLeastOneInternal(6, actionORMethodDef);
		};
		RecognizerApi.prototype.AT_LEAST_ONE7 = function(actionORMethodDef) {
			this.atLeastOneInternal(7, actionORMethodDef);
		};
		RecognizerApi.prototype.AT_LEAST_ONE8 = function(actionORMethodDef) {
			this.atLeastOneInternal(8, actionORMethodDef);
		};
		RecognizerApi.prototype.AT_LEAST_ONE9 = function(actionORMethodDef) {
			this.atLeastOneInternal(9, actionORMethodDef);
		};
		RecognizerApi.prototype.AT_LEAST_ONE_SEP = function(options) {
			this.atLeastOneSepFirstInternal(0, options);
		};
		RecognizerApi.prototype.AT_LEAST_ONE_SEP1 = function(options) {
			this.atLeastOneSepFirstInternal(1, options);
		};
		RecognizerApi.prototype.AT_LEAST_ONE_SEP2 = function(options) {
			this.atLeastOneSepFirstInternal(2, options);
		};
		RecognizerApi.prototype.AT_LEAST_ONE_SEP3 = function(options) {
			this.atLeastOneSepFirstInternal(3, options);
		};
		RecognizerApi.prototype.AT_LEAST_ONE_SEP4 = function(options) {
			this.atLeastOneSepFirstInternal(4, options);
		};
		RecognizerApi.prototype.AT_LEAST_ONE_SEP5 = function(options) {
			this.atLeastOneSepFirstInternal(5, options);
		};
		RecognizerApi.prototype.AT_LEAST_ONE_SEP6 = function(options) {
			this.atLeastOneSepFirstInternal(6, options);
		};
		RecognizerApi.prototype.AT_LEAST_ONE_SEP7 = function(options) {
			this.atLeastOneSepFirstInternal(7, options);
		};
		RecognizerApi.prototype.AT_LEAST_ONE_SEP8 = function(options) {
			this.atLeastOneSepFirstInternal(8, options);
		};
		RecognizerApi.prototype.AT_LEAST_ONE_SEP9 = function(options) {
			this.atLeastOneSepFirstInternal(9, options);
		};
		RecognizerApi.prototype.RULE = function(name, implementation, config) {
			if (config === void 0) config = DEFAULT_RULE_CONFIG;
			if (contains(this.definedRulesNames, name)) {
				var error = {
					message: defaultGrammarValidatorErrorProvider.buildDuplicateRuleNameError({
						topLevelRule: name,
						grammarName: this.className
					}),
					type: ParserDefinitionErrorType.DUPLICATE_RULE_NAME,
					ruleName: name
				};
				this.definitionErrors.push(error);
			}
			this.definedRulesNames.push(name);
			var ruleImplementation = this.defineRule(name, implementation, config);
			this[name] = ruleImplementation;
			return ruleImplementation;
		};
		RecognizerApi.prototype.OVERRIDE_RULE = function(name, impl, config) {
			if (config === void 0) config = DEFAULT_RULE_CONFIG;
			var ruleErrors = [];
			ruleErrors = ruleErrors.concat(validateRuleIsOverridden(name, this.definedRulesNames, this.className));
			this.definitionErrors.push.apply(this.definitionErrors, ruleErrors);
			var ruleImplementation = this.defineRule(name, impl, config);
			this[name] = ruleImplementation;
			return ruleImplementation;
		};
		RecognizerApi.prototype.BACKTRACK = function(grammarRule, args) {
			return function() {
				this.isBackTrackingStack.push(1);
				var orgState = this.saveRecogState();
				try {
					grammarRule.apply(this, args);
					return true;
				} catch (e) {
					if (isRecognitionException(e)) return false;
					else throw e;
				} finally {
					this.reloadRecogState(orgState);
					this.isBackTrackingStack.pop();
				}
			};
		};
		RecognizerApi.prototype.getGAstProductions = function() {
			return this.gastProductionsCache;
		};
		RecognizerApi.prototype.getSerializedGastProductions = function() {
			return serializeGrammar(values(this.gastProductionsCache));
		};
		return RecognizerApi;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/traits/recognizer_engine.js
var RecognizerEngine;
var init_recognizer_engine = __esmMin((() => {
	init_utils();
	init_keys();
	init_exceptions_public();
	init_lookahead();
	init_interpreter();
	init_parser();
	init_recoverable();
	init_tokens_public();
	init_tokens();
	init_lang_extensions();
	RecognizerEngine = function() {
		function RecognizerEngine() {}
		RecognizerEngine.prototype.initRecognizerEngine = function(tokenVocabulary, config) {
			this.className = classNameFromInstance(this);
			this.shortRuleNameToFull = {};
			this.fullRuleNameToShort = {};
			this.ruleShortNameIdx = 256;
			this.tokenMatcher = tokenStructuredMatcherNoCategories;
			this.definedRulesNames = [];
			this.tokensMap = {};
			this.isBackTrackingStack = [];
			this.RULE_STACK = [];
			this.RULE_OCCURRENCE_STACK = [];
			this.gastProductionsCache = {};
			if (has(config, "serializedGrammar")) throw Error("The Parser's configuration can no longer contain a <serializedGrammar> property.\n	See: https://sap.github.io/chevrotain/docs/changes/BREAKING_CHANGES.html#_6-0-0\n	For Further details.");
			if (isArray(tokenVocabulary)) {
				if (isEmpty(tokenVocabulary)) throw Error("A Token Vocabulary cannot be empty.\n	Note that the first argument for the parser constructor\n	is no longer a Token vector (since v4.0).");
				if (typeof tokenVocabulary[0].startOffset === "number") throw Error("The Parser constructor no longer accepts a token vector as the first argument.\n	See: https://sap.github.io/chevrotain/docs/changes/BREAKING_CHANGES.html#_4-0-0\n	For Further details.");
			}
			if (isArray(tokenVocabulary)) this.tokensMap = reduce(tokenVocabulary, function(acc, tokType) {
				acc[tokType.name] = tokType;
				return acc;
			}, {});
			else if (has(tokenVocabulary, "modes") && every(flatten(values(tokenVocabulary.modes)), isTokenType)) {
				var uniqueTokens = uniq(flatten(values(tokenVocabulary.modes)));
				this.tokensMap = reduce(uniqueTokens, function(acc, tokType) {
					acc[tokType.name] = tokType;
					return acc;
				}, {});
			} else if (isObject(tokenVocabulary)) this.tokensMap = cloneObj(tokenVocabulary);
			else throw new Error("<tokensDictionary> argument must be An Array of Token constructors, A dictionary of Token constructors or an IMultiModeLexerDefinition");
			this.tokensMap["EOF"] = EOF;
			var noTokenCategoriesUsed = every(values(tokenVocabulary), function(tokenConstructor) {
				return isEmpty(tokenConstructor.categoryMatches);
			});
			this.tokenMatcher = noTokenCategoriesUsed ? tokenStructuredMatcherNoCategories : tokenStructuredMatcher;
			augmentTokenTypes(values(this.tokensMap));
		};
		RecognizerEngine.prototype.defineRule = function(ruleName, impl, config) {
			if (this.selfAnalysisDone) throw Error("Grammar rule <" + ruleName + "> may not be defined after the 'performSelfAnalysis' method has been called'\nMake sure that all grammar rule definitions are done before 'performSelfAnalysis' is called.");
			var resyncEnabled = has(config, "resyncEnabled") ? config.resyncEnabled : DEFAULT_RULE_CONFIG.resyncEnabled;
			var recoveryValueFunc = has(config, "recoveryValueFunc") ? config.recoveryValueFunc : DEFAULT_RULE_CONFIG.recoveryValueFunc;
			var shortName = this.ruleShortNameIdx << 12;
			this.ruleShortNameIdx++;
			this.shortRuleNameToFull[shortName] = ruleName;
			this.fullRuleNameToShort[ruleName] = shortName;
			function invokeRuleWithTry(args) {
				try {
					if (this.outputCst === true) {
						impl.apply(this, args);
						var cst = this.CST_STACK[this.CST_STACK.length - 1];
						this.cstPostRule(cst);
						return cst;
					} else return impl.apply(this, args);
				} catch (e) {
					return this.invokeRuleCatch(e, resyncEnabled, recoveryValueFunc);
				} finally {
					this.ruleFinallyStateUpdate();
				}
			}
			var wrappedGrammarRule = function(idxInCallingRule, args) {
				if (idxInCallingRule === void 0) idxInCallingRule = 0;
				this.ruleInvocationStateUpdate(shortName, ruleName, idxInCallingRule);
				return invokeRuleWithTry.call(this, args);
			};
			var ruleNamePropName = "ruleName";
			wrappedGrammarRule[ruleNamePropName] = ruleName;
			wrappedGrammarRule["originalGrammarAction"] = impl;
			return wrappedGrammarRule;
		};
		RecognizerEngine.prototype.invokeRuleCatch = function(e, resyncEnabledConfig, recoveryValueFunc) {
			var isFirstInvokedRule = this.RULE_STACK.length === 1;
			var reSyncEnabled = resyncEnabledConfig && !this.isBackTracking() && this.recoveryEnabled;
			if (isRecognitionException(e)) {
				var recogError = e;
				if (reSyncEnabled) {
					var reSyncTokType = this.findReSyncTokenType();
					if (this.isInCurrentRuleReSyncSet(reSyncTokType)) {
						recogError.resyncedTokens = this.reSyncTo(reSyncTokType);
						if (this.outputCst) {
							var partialCstResult = this.CST_STACK[this.CST_STACK.length - 1];
							partialCstResult.recoveredNode = true;
							return partialCstResult;
						} else return recoveryValueFunc();
					} else {
						if (this.outputCst) {
							var partialCstResult = this.CST_STACK[this.CST_STACK.length - 1];
							partialCstResult.recoveredNode = true;
							recogError.partialCstResult = partialCstResult;
						}
						throw recogError;
					}
				} else if (isFirstInvokedRule) {
					this.moveToTerminatedState();
					return recoveryValueFunc();
				} else throw recogError;
			} else throw e;
		};
		RecognizerEngine.prototype.optionInternal = function(actionORMethodDef, occurrence) {
			var key = this.getKeyForAutomaticLookahead(512, occurrence);
			return this.optionInternalLogic(actionORMethodDef, occurrence, key);
		};
		RecognizerEngine.prototype.optionInternalLogic = function(actionORMethodDef, occurrence, key) {
			var _this = this;
			var lookAheadFunc = this.getLaFuncFromCache(key);
			var action;
			var predicate;
			if (actionORMethodDef.DEF !== void 0) {
				action = actionORMethodDef.DEF;
				predicate = actionORMethodDef.GATE;
				if (predicate !== void 0) {
					var orgLookaheadFunction_1 = lookAheadFunc;
					lookAheadFunc = function() {
						return predicate.call(_this) && orgLookaheadFunction_1.call(_this);
					};
				}
			} else action = actionORMethodDef;
			if (lookAheadFunc.call(this) === true) return action.call(this);
		};
		RecognizerEngine.prototype.atLeastOneInternal = function(prodOccurrence, actionORMethodDef) {
			var laKey = this.getKeyForAutomaticLookahead(AT_LEAST_ONE_IDX, prodOccurrence);
			return this.atLeastOneInternalLogic(prodOccurrence, actionORMethodDef, laKey);
		};
		RecognizerEngine.prototype.atLeastOneInternalLogic = function(prodOccurrence, actionORMethodDef, key) {
			var _this = this;
			var lookAheadFunc = this.getLaFuncFromCache(key);
			var action;
			var predicate;
			if (actionORMethodDef.DEF !== void 0) {
				action = actionORMethodDef.DEF;
				predicate = actionORMethodDef.GATE;
				if (predicate !== void 0) {
					var orgLookaheadFunction_2 = lookAheadFunc;
					lookAheadFunc = function() {
						return predicate.call(_this) && orgLookaheadFunction_2.call(_this);
					};
				}
			} else action = actionORMethodDef;
			if (lookAheadFunc.call(this) === true) {
				var notStuck = this.doSingleRepetition(action);
				while (lookAheadFunc.call(this) === true && notStuck === true) notStuck = this.doSingleRepetition(action);
			} else throw this.raiseEarlyExitException(prodOccurrence, PROD_TYPE.REPETITION_MANDATORY, actionORMethodDef.ERR_MSG);
			this.attemptInRepetitionRecovery(this.atLeastOneInternal, [prodOccurrence, actionORMethodDef], lookAheadFunc, AT_LEAST_ONE_IDX, prodOccurrence, NextTerminalAfterAtLeastOneWalker);
		};
		RecognizerEngine.prototype.atLeastOneSepFirstInternal = function(prodOccurrence, options) {
			var laKey = this.getKeyForAutomaticLookahead(AT_LEAST_ONE_SEP_IDX, prodOccurrence);
			this.atLeastOneSepFirstInternalLogic(prodOccurrence, options, laKey);
		};
		RecognizerEngine.prototype.atLeastOneSepFirstInternalLogic = function(prodOccurrence, options, key) {
			var _this = this;
			var action = options.DEF;
			var separator = options.SEP;
			if (this.getLaFuncFromCache(key).call(this) === true) {
				action.call(this);
				var separatorLookAheadFunc = function() {
					return _this.tokenMatcher(_this.LA(1), separator);
				};
				while (this.tokenMatcher(this.LA(1), separator) === true) {
					this.CONSUME(separator);
					action.call(this);
				}
				this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal, [
					prodOccurrence,
					separator,
					separatorLookAheadFunc,
					action,
					NextTerminalAfterAtLeastOneSepWalker
				], separatorLookAheadFunc, AT_LEAST_ONE_SEP_IDX, prodOccurrence, NextTerminalAfterAtLeastOneSepWalker);
			} else throw this.raiseEarlyExitException(prodOccurrence, PROD_TYPE.REPETITION_MANDATORY_WITH_SEPARATOR, options.ERR_MSG);
		};
		RecognizerEngine.prototype.manyInternal = function(prodOccurrence, actionORMethodDef) {
			var laKey = this.getKeyForAutomaticLookahead(768, prodOccurrence);
			return this.manyInternalLogic(prodOccurrence, actionORMethodDef, laKey);
		};
		RecognizerEngine.prototype.manyInternalLogic = function(prodOccurrence, actionORMethodDef, key) {
			var _this = this;
			var lookaheadFunction = this.getLaFuncFromCache(key);
			var action;
			var predicate;
			if (actionORMethodDef.DEF !== void 0) {
				action = actionORMethodDef.DEF;
				predicate = actionORMethodDef.GATE;
				if (predicate !== void 0) {
					var orgLookaheadFunction_3 = lookaheadFunction;
					lookaheadFunction = function() {
						return predicate.call(_this) && orgLookaheadFunction_3.call(_this);
					};
				}
			} else action = actionORMethodDef;
			var notStuck = true;
			while (lookaheadFunction.call(this) === true && notStuck === true) notStuck = this.doSingleRepetition(action);
			this.attemptInRepetitionRecovery(this.manyInternal, [prodOccurrence, actionORMethodDef], lookaheadFunction, 768, prodOccurrence, NextTerminalAfterManyWalker, notStuck);
		};
		RecognizerEngine.prototype.manySepFirstInternal = function(prodOccurrence, options) {
			var laKey = this.getKeyForAutomaticLookahead(MANY_SEP_IDX, prodOccurrence);
			this.manySepFirstInternalLogic(prodOccurrence, options, laKey);
		};
		RecognizerEngine.prototype.manySepFirstInternalLogic = function(prodOccurrence, options, key) {
			var _this = this;
			var action = options.DEF;
			var separator = options.SEP;
			if (this.getLaFuncFromCache(key).call(this) === true) {
				action.call(this);
				var separatorLookAheadFunc = function() {
					return _this.tokenMatcher(_this.LA(1), separator);
				};
				while (this.tokenMatcher(this.LA(1), separator) === true) {
					this.CONSUME(separator);
					action.call(this);
				}
				this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal, [
					prodOccurrence,
					separator,
					separatorLookAheadFunc,
					action,
					NextTerminalAfterManySepWalker
				], separatorLookAheadFunc, MANY_SEP_IDX, prodOccurrence, NextTerminalAfterManySepWalker);
			}
		};
		RecognizerEngine.prototype.repetitionSepSecondInternal = function(prodOccurrence, separator, separatorLookAheadFunc, action, nextTerminalAfterWalker) {
			while (separatorLookAheadFunc()) {
				this.CONSUME(separator);
				action.call(this);
			}
			/* istanbul ignore else */
			this.attemptInRepetitionRecovery(this.repetitionSepSecondInternal, [
				prodOccurrence,
				separator,
				separatorLookAheadFunc,
				action,
				nextTerminalAfterWalker
			], separatorLookAheadFunc, AT_LEAST_ONE_SEP_IDX, prodOccurrence, nextTerminalAfterWalker);
		};
		RecognizerEngine.prototype.doSingleRepetition = function(action) {
			var beforeIteration = this.getLexerPosition();
			action.call(this);
			return this.getLexerPosition() > beforeIteration;
		};
		RecognizerEngine.prototype.orInternal = function(altsOrOpts, occurrence) {
			var laKey = this.getKeyForAutomaticLookahead(256, occurrence);
			var alts = isArray(altsOrOpts) ? altsOrOpts : altsOrOpts.DEF;
			var altIdxToTake = this.getLaFuncFromCache(laKey).call(this, alts);
			if (altIdxToTake !== void 0) return alts[altIdxToTake].ALT.call(this);
			this.raiseNoAltException(occurrence, altsOrOpts.ERR_MSG);
		};
		RecognizerEngine.prototype.ruleFinallyStateUpdate = function() {
			this.RULE_STACK.pop();
			this.RULE_OCCURRENCE_STACK.pop();
			this.cstFinallyStateUpdate();
			if (this.RULE_STACK.length === 0 && this.isAtEndOfInput() === false) {
				var firstRedundantTok = this.LA(1);
				var errMsg = this.errorMessageProvider.buildNotAllInputParsedMessage({
					firstRedundant: firstRedundantTok,
					ruleName: this.getCurrRuleFullName()
				});
				this.SAVE_ERROR(new NotAllInputParsedException(errMsg, firstRedundantTok));
			}
		};
		RecognizerEngine.prototype.subruleInternal = function(ruleToCall, idx, options) {
			var ruleResult;
			try {
				var args = options !== void 0 ? options.ARGS : void 0;
				ruleResult = ruleToCall.call(this, idx, args);
				this.cstPostNonTerminal(ruleResult, options !== void 0 && options.LABEL !== void 0 ? options.LABEL : ruleToCall.ruleName);
				return ruleResult;
			} catch (e) {
				this.subruleInternalError(e, options, ruleToCall.ruleName);
			}
		};
		RecognizerEngine.prototype.subruleInternalError = function(e, options, ruleName) {
			if (isRecognitionException(e) && e.partialCstResult !== void 0) {
				this.cstPostNonTerminal(e.partialCstResult, options !== void 0 && options.LABEL !== void 0 ? options.LABEL : ruleName);
				delete e.partialCstResult;
			}
			throw e;
		};
		RecognizerEngine.prototype.consumeInternal = function(tokType, idx, options) {
			var consumedToken;
			try {
				var nextToken = this.LA(1);
				if (this.tokenMatcher(nextToken, tokType) === true) {
					this.consumeToken();
					consumedToken = nextToken;
				} else this.consumeInternalError(tokType, nextToken, options);
			} catch (eFromConsumption) {
				consumedToken = this.consumeInternalRecovery(tokType, idx, eFromConsumption);
			}
			this.cstPostTerminal(options !== void 0 && options.LABEL !== void 0 ? options.LABEL : tokType.name, consumedToken);
			return consumedToken;
		};
		RecognizerEngine.prototype.consumeInternalError = function(tokType, nextToken, options) {
			var msg;
			var previousToken = this.LA(0);
			if (options !== void 0 && options.ERR_MSG) msg = options.ERR_MSG;
			else msg = this.errorMessageProvider.buildMismatchTokenMessage({
				expected: tokType,
				actual: nextToken,
				previous: previousToken,
				ruleName: this.getCurrRuleFullName()
			});
			throw this.SAVE_ERROR(new MismatchedTokenException(msg, nextToken, previousToken));
		};
		RecognizerEngine.prototype.consumeInternalRecovery = function(tokType, idx, eFromConsumption) {
			if (this.recoveryEnabled && eFromConsumption.name === "MismatchedTokenException" && !this.isBackTracking()) {
				var follows = this.getFollowsForInRuleRecovery(tokType, idx);
				try {
					return this.tryInRuleRecovery(tokType, follows);
				} catch (eFromInRuleRecovery) {
					if (eFromInRuleRecovery.name === "InRuleRecoveryException") throw eFromConsumption;
					else throw eFromInRuleRecovery;
				}
			} else throw eFromConsumption;
		};
		RecognizerEngine.prototype.saveRecogState = function() {
			var savedErrors = this.errors;
			var savedRuleStack = cloneArr(this.RULE_STACK);
			return {
				errors: savedErrors,
				lexerState: this.exportLexerState(),
				RULE_STACK: savedRuleStack,
				CST_STACK: this.CST_STACK
			};
		};
		RecognizerEngine.prototype.reloadRecogState = function(newState) {
			this.errors = newState.errors;
			this.importLexerState(newState.lexerState);
			this.RULE_STACK = newState.RULE_STACK;
		};
		RecognizerEngine.prototype.ruleInvocationStateUpdate = function(shortName, fullName, idxInCallingRule) {
			this.RULE_OCCURRENCE_STACK.push(idxInCallingRule);
			this.RULE_STACK.push(shortName);
			this.cstInvocationStateUpdate(fullName, shortName);
		};
		RecognizerEngine.prototype.isBackTracking = function() {
			return this.isBackTrackingStack.length !== 0;
		};
		RecognizerEngine.prototype.getCurrRuleFullName = function() {
			var shortName = this.getLastExplicitRuleShortName();
			return this.shortRuleNameToFull[shortName];
		};
		RecognizerEngine.prototype.shortRuleNameToFullName = function(shortName) {
			return this.shortRuleNameToFull[shortName];
		};
		RecognizerEngine.prototype.isAtEndOfInput = function() {
			return this.tokenMatcher(this.LA(1), EOF);
		};
		RecognizerEngine.prototype.reset = function() {
			this.resetLexerState();
			this.isBackTrackingStack = [];
			this.errors = [];
			this.RULE_STACK = [];
			this.CST_STACK = [];
			this.RULE_OCCURRENCE_STACK = [];
		};
		return RecognizerEngine;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/traits/error_handler.js
var ErrorHandler;
var init_error_handler = __esmMin((() => {
	init_exceptions_public();
	init_utils();
	init_lookahead();
	init_parser();
	ErrorHandler = function() {
		function ErrorHandler() {}
		ErrorHandler.prototype.initErrorHandler = function(config) {
			this._errors = [];
			this.errorMessageProvider = has(config, "errorMessageProvider") ? config.errorMessageProvider : DEFAULT_PARSER_CONFIG.errorMessageProvider;
		};
		ErrorHandler.prototype.SAVE_ERROR = function(error) {
			if (isRecognitionException(error)) {
				error.context = {
					ruleStack: this.getHumanReadableRuleStack(),
					ruleOccurrenceStack: cloneArr(this.RULE_OCCURRENCE_STACK)
				};
				this._errors.push(error);
				return error;
			} else throw Error("Trying to save an Error which is not a RecognitionException");
		};
		Object.defineProperty(ErrorHandler.prototype, "errors", {
			get: function() {
				return cloneArr(this._errors);
			},
			set: function(newErrors) {
				this._errors = newErrors;
			},
			enumerable: false,
			configurable: true
		});
		ErrorHandler.prototype.raiseEarlyExitException = function(occurrence, prodType, userDefinedErrMsg) {
			var ruleName = this.getCurrRuleFullName();
			var ruleGrammar = this.getGAstProductions()[ruleName];
			var insideProdPaths = getLookaheadPathsForOptionalProd(occurrence, ruleGrammar, prodType, this.maxLookahead)[0];
			var actualTokens = [];
			for (var i = 1; i <= this.maxLookahead; i++) actualTokens.push(this.LA(i));
			var msg = this.errorMessageProvider.buildEarlyExitMessage({
				expectedIterationPaths: insideProdPaths,
				actual: actualTokens,
				previous: this.LA(0),
				customUserDescription: userDefinedErrMsg,
				ruleName
			});
			throw this.SAVE_ERROR(new EarlyExitException(msg, this.LA(1), this.LA(0)));
		};
		ErrorHandler.prototype.raiseNoAltException = function(occurrence, errMsgTypes) {
			var ruleName = this.getCurrRuleFullName();
			var ruleGrammar = this.getGAstProductions()[ruleName];
			var lookAheadPathsPerAlternative = getLookaheadPathsForOr(occurrence, ruleGrammar, this.maxLookahead);
			var actualTokens = [];
			for (var i = 1; i <= this.maxLookahead; i++) actualTokens.push(this.LA(i));
			var previousToken = this.LA(0);
			var errMsg = this.errorMessageProvider.buildNoViableAltMessage({
				expectedPathsPerAlt: lookAheadPathsPerAlternative,
				actual: actualTokens,
				previous: previousToken,
				customUserDescription: errMsgTypes,
				ruleName: this.getCurrRuleFullName()
			});
			throw this.SAVE_ERROR(new NoViableAltException(errMsg, this.LA(1), previousToken));
		};
		return ErrorHandler;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/traits/context_assist.js
var ContentAssist;
var init_context_assist = __esmMin((() => {
	init_interpreter();
	init_utils();
	ContentAssist = function() {
		function ContentAssist() {}
		ContentAssist.prototype.initContentAssist = function() {};
		ContentAssist.prototype.computeContentAssist = function(startRuleName, precedingInput) {
			var startRuleGast = this.gastProductionsCache[startRuleName];
			if (isUndefined(startRuleGast)) throw Error("Rule ->" + startRuleName + "<- does not exist in this grammar.");
			return nextPossibleTokensAfter([startRuleGast], precedingInput, this.tokenMatcher, this.maxLookahead);
		};
		ContentAssist.prototype.getNextPossibleTokenTypes = function(grammarPath) {
			var topRuleName = first$1(grammarPath.ruleStack);
			var topProduction = this.getGAstProductions()[topRuleName];
			return new NextAfterTokenWalker(topProduction, grammarPath).startWalking();
		};
		return ContentAssist;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/traits/gast_recorder.js
function recordProd(prodConstructor, mainProdArg, occurrence, handleSep) {
	if (handleSep === void 0) handleSep = false;
	assertMethodIdxIsValid(occurrence);
	var prevProd = peek(this.recordingProdStack);
	var grammarAction = isFunction(mainProdArg) ? mainProdArg : mainProdArg.DEF;
	var newProd = new prodConstructor({
		definition: [],
		idx: occurrence
	});
	if (handleSep) newProd.separator = mainProdArg.SEP;
	if (has(mainProdArg, "MAX_LOOKAHEAD")) newProd.maxLookahead = mainProdArg.MAX_LOOKAHEAD;
	this.recordingProdStack.push(newProd);
	grammarAction.call(this);
	prevProd.definition.push(newProd);
	this.recordingProdStack.pop();
	return RECORDING_NULL_OBJECT;
}
function recordOrProd(mainProdArg, occurrence) {
	var _this = this;
	assertMethodIdxIsValid(occurrence);
	var prevProd = peek(this.recordingProdStack);
	var hasOptions = isArray(mainProdArg) === false;
	var alts = hasOptions === false ? mainProdArg : mainProdArg.DEF;
	var newOrProd = new Alternation({
		definition: [],
		idx: occurrence,
		ignoreAmbiguities: hasOptions && mainProdArg.IGNORE_AMBIGUITIES === true
	});
	if (has(mainProdArg, "MAX_LOOKAHEAD")) newOrProd.maxLookahead = mainProdArg.MAX_LOOKAHEAD;
	newOrProd.hasPredicates = some(alts, function(currAlt) {
		return isFunction(currAlt.GATE);
	});
	prevProd.definition.push(newOrProd);
	forEach(alts, function(currAlt) {
		var currAltFlat = new Alternative({ definition: [] });
		newOrProd.definition.push(currAltFlat);
		if (has(currAlt, "IGNORE_AMBIGUITIES")) currAltFlat.ignoreAmbiguities = currAlt.IGNORE_AMBIGUITIES;
		else if (has(currAlt, "GATE")) currAltFlat.ignoreAmbiguities = true;
		_this.recordingProdStack.push(currAltFlat);
		currAlt.ALT.call(_this);
		_this.recordingProdStack.pop();
	});
	return RECORDING_NULL_OBJECT;
}
function getIdxSuffix(idx) {
	return idx === 0 ? "" : "" + idx;
}
function assertMethodIdxIsValid(idx) {
	if (idx < 0 || idx > MAX_METHOD_IDX) {
		var error = /* @__PURE__ */ new Error("Invalid DSL Method idx value: <" + idx + ">\n	" + ("Idx value must be a none negative value smaller than " + (MAX_METHOD_IDX + 1)));
		error.KNOWN_RECORDER_ERROR = true;
		throw error;
	}
}
var RECORDING_NULL_OBJECT, HANDLE_SEPARATOR, MAX_METHOD_IDX, RFT, RECORDING_PHASE_TOKEN, RECORDING_PHASE_CSTNODE, GastRecorder;
var init_gast_recorder = __esmMin((() => {
	init_utils();
	init_gast_public();
	init_lexer_public();
	init_tokens();
	init_tokens_public();
	init_parser();
	init_keys();
	RECORDING_NULL_OBJECT = { description: "This Object indicates the Parser is during Recording Phase" };
	Object.freeze(RECORDING_NULL_OBJECT);
	HANDLE_SEPARATOR = true;
	MAX_METHOD_IDX = Math.pow(2, 8) - 1;
	RFT = createToken({
		name: "RECORDING_PHASE_TOKEN",
		pattern: Lexer.NA
	});
	augmentTokenTypes([RFT]);
	RECORDING_PHASE_TOKEN = createTokenInstance(RFT, "This IToken indicates the Parser is in Recording Phase\n	See: https://sap.github.io/chevrotain/docs/guide/internals.html#grammar-recording for details", -1, -1, -1, -1, -1, -1);
	Object.freeze(RECORDING_PHASE_TOKEN);
	RECORDING_PHASE_CSTNODE = {
		name: "This CSTNode indicates the Parser is in Recording Phase\n	See: https://sap.github.io/chevrotain/docs/guide/internals.html#grammar-recording for details",
		children: {}
	};
	GastRecorder = function() {
		function GastRecorder() {}
		GastRecorder.prototype.initGastRecorder = function(config) {
			this.recordingProdStack = [];
			this.RECORDING_PHASE = false;
		};
		GastRecorder.prototype.enableRecording = function() {
			var _this = this;
			this.RECORDING_PHASE = true;
			this.TRACE_INIT("Enable Recording", function() {
				var _loop_1 = function(i) {
					var idx = i > 0 ? i : "";
					_this["CONSUME" + idx] = function(arg1, arg2) {
						return this.consumeInternalRecord(arg1, i, arg2);
					};
					_this["SUBRULE" + idx] = function(arg1, arg2) {
						return this.subruleInternalRecord(arg1, i, arg2);
					};
					_this["OPTION" + idx] = function(arg1) {
						return this.optionInternalRecord(arg1, i);
					};
					_this["OR" + idx] = function(arg1) {
						return this.orInternalRecord(arg1, i);
					};
					_this["MANY" + idx] = function(arg1) {
						this.manyInternalRecord(i, arg1);
					};
					_this["MANY_SEP" + idx] = function(arg1) {
						this.manySepFirstInternalRecord(i, arg1);
					};
					_this["AT_LEAST_ONE" + idx] = function(arg1) {
						this.atLeastOneInternalRecord(i, arg1);
					};
					_this["AT_LEAST_ONE_SEP" + idx] = function(arg1) {
						this.atLeastOneSepFirstInternalRecord(i, arg1);
					};
				};
				/**
				* Warning Dark Voodoo Magic upcoming!
				* We are "replacing" the public parsing DSL methods API
				* With **new** alternative implementations on the Parser **instance**
				*
				* So far this is the only way I've found to avoid performance regressions during parsing time.
				* - Approx 30% performance regression was measured on Chrome 75 Canary when attempting to replace the "internal"
				*   implementations directly instead.
				*/
				for (var i = 0; i < 10; i++) _loop_1(i);
				_this["consume"] = function(idx, arg1, arg2) {
					return this.consumeInternalRecord(arg1, idx, arg2);
				};
				_this["subrule"] = function(idx, arg1, arg2) {
					return this.subruleInternalRecord(arg1, idx, arg2);
				};
				_this["option"] = function(idx, arg1) {
					return this.optionInternalRecord(arg1, idx);
				};
				_this["or"] = function(idx, arg1) {
					return this.orInternalRecord(arg1, idx);
				};
				_this["many"] = function(idx, arg1) {
					this.manyInternalRecord(idx, arg1);
				};
				_this["atLeastOne"] = function(idx, arg1) {
					this.atLeastOneInternalRecord(idx, arg1);
				};
				_this.ACTION = _this.ACTION_RECORD;
				_this.BACKTRACK = _this.BACKTRACK_RECORD;
				_this.LA = _this.LA_RECORD;
			});
		};
		GastRecorder.prototype.disableRecording = function() {
			var _this = this;
			this.RECORDING_PHASE = false;
			this.TRACE_INIT("Deleting Recording methods", function() {
				for (var i = 0; i < 10; i++) {
					var idx = i > 0 ? i : "";
					delete _this["CONSUME" + idx];
					delete _this["SUBRULE" + idx];
					delete _this["OPTION" + idx];
					delete _this["OR" + idx];
					delete _this["MANY" + idx];
					delete _this["MANY_SEP" + idx];
					delete _this["AT_LEAST_ONE" + idx];
					delete _this["AT_LEAST_ONE_SEP" + idx];
				}
				delete _this["consume"];
				delete _this["subrule"];
				delete _this["option"];
				delete _this["or"];
				delete _this["many"];
				delete _this["atLeastOne"];
				delete _this.ACTION;
				delete _this.BACKTRACK;
				delete _this.LA;
			});
		};
		GastRecorder.prototype.ACTION_RECORD = function(impl) {};
		GastRecorder.prototype.BACKTRACK_RECORD = function(grammarRule, args) {
			return function() {
				return true;
			};
		};
		GastRecorder.prototype.LA_RECORD = function(howMuch) {
			return END_OF_FILE;
		};
		GastRecorder.prototype.topLevelRuleRecord = function(name, def) {
			try {
				var newTopLevelRule = new Rule({
					definition: [],
					name
				});
				newTopLevelRule.name = name;
				this.recordingProdStack.push(newTopLevelRule);
				def.call(this);
				this.recordingProdStack.pop();
				return newTopLevelRule;
			} catch (originalError) {
				if (originalError.KNOWN_RECORDER_ERROR !== true) try {
					originalError.message = originalError.message + "\n	 This error was thrown during the \"grammar recording phase\" For more info see:\n	https://sap.github.io/chevrotain/docs/guide/internals.html#grammar-recording";
				} catch (mutabilityError) {
					throw originalError;
				}
				throw originalError;
			}
		};
		GastRecorder.prototype.optionInternalRecord = function(actionORMethodDef, occurrence) {
			return recordProd.call(this, Option, actionORMethodDef, occurrence);
		};
		GastRecorder.prototype.atLeastOneInternalRecord = function(occurrence, actionORMethodDef) {
			recordProd.call(this, RepetitionMandatory, actionORMethodDef, occurrence);
		};
		GastRecorder.prototype.atLeastOneSepFirstInternalRecord = function(occurrence, options) {
			recordProd.call(this, RepetitionMandatoryWithSeparator, options, occurrence, HANDLE_SEPARATOR);
		};
		GastRecorder.prototype.manyInternalRecord = function(occurrence, actionORMethodDef) {
			recordProd.call(this, Repetition, actionORMethodDef, occurrence);
		};
		GastRecorder.prototype.manySepFirstInternalRecord = function(occurrence, options) {
			recordProd.call(this, RepetitionWithSeparator, options, occurrence, HANDLE_SEPARATOR);
		};
		GastRecorder.prototype.orInternalRecord = function(altsOrOpts, occurrence) {
			return recordOrProd.call(this, altsOrOpts, occurrence);
		};
		GastRecorder.prototype.subruleInternalRecord = function(ruleToCall, occurrence, options) {
			assertMethodIdxIsValid(occurrence);
			if (!ruleToCall || has(ruleToCall, "ruleName") === false) {
				var error = /* @__PURE__ */ new Error("<SUBRULE" + getIdxSuffix(occurrence) + "> argument is invalid" + (" expecting a Parser method reference but got: <" + JSON.stringify(ruleToCall) + ">") + ("\n inside top level rule: <" + this.recordingProdStack[0].name + ">"));
				error.KNOWN_RECORDER_ERROR = true;
				throw error;
			}
			var prevProd = peek(this.recordingProdStack);
			var ruleName = ruleToCall["ruleName"];
			var newNoneTerminal = new NonTerminal({
				idx: occurrence,
				nonTerminalName: ruleName,
				referencedRule: void 0
			});
			prevProd.definition.push(newNoneTerminal);
			return this.outputCst ? RECORDING_PHASE_CSTNODE : RECORDING_NULL_OBJECT;
		};
		GastRecorder.prototype.consumeInternalRecord = function(tokType, occurrence, options) {
			assertMethodIdxIsValid(occurrence);
			if (!hasShortKeyProperty(tokType)) {
				var error = /* @__PURE__ */ new Error("<CONSUME" + getIdxSuffix(occurrence) + "> argument is invalid" + (" expecting a TokenType reference but got: <" + JSON.stringify(tokType) + ">") + ("\n inside top level rule: <" + this.recordingProdStack[0].name + ">"));
				error.KNOWN_RECORDER_ERROR = true;
				throw error;
			}
			var prevProd = peek(this.recordingProdStack);
			var newNoneTerminal = new Terminal({
				idx: occurrence,
				terminalType: tokType
			});
			prevProd.definition.push(newNoneTerminal);
			return RECORDING_PHASE_TOKEN;
		};
		return GastRecorder;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/traits/perf_tracer.js
var PerformanceTracer;
var init_perf_tracer = __esmMin((() => {
	init_utils();
	init_parser();
	PerformanceTracer = function() {
		function PerformanceTracer() {}
		PerformanceTracer.prototype.initPerformanceTracer = function(config) {
			if (has(config, "traceInitPerf")) {
				var userTraceInitPerf = config.traceInitPerf;
				var traceIsNumber = typeof userTraceInitPerf === "number";
				this.traceInitMaxIdent = traceIsNumber ? userTraceInitPerf : Infinity;
				this.traceInitPerf = traceIsNumber ? userTraceInitPerf > 0 : userTraceInitPerf;
			} else {
				this.traceInitMaxIdent = 0;
				this.traceInitPerf = DEFAULT_PARSER_CONFIG.traceInitPerf;
			}
			this.traceInitIndent = -1;
		};
		PerformanceTracer.prototype.TRACE_INIT = function(phaseDesc, phaseImpl) {
			if (this.traceInitPerf === true) {
				this.traceInitIndent++;
				var indent = new Array(this.traceInitIndent + 1).join("	");
				if (this.traceInitIndent < this.traceInitMaxIdent) console.log(indent + "--> <" + phaseDesc + ">");
				var _a = timer(phaseImpl), time = _a.time, value = _a.value;
				/* istanbul ignore next - Difficult to reproduce specific performance behavior (>10ms) in tests */
				var traceMethod = time > 10 ? console.warn : console.log;
				if (this.traceInitIndent < this.traceInitMaxIdent) traceMethod(indent + "<-- <" + phaseDesc + "> time: " + time + "ms");
				this.traceInitIndent--;
				return value;
			} else return phaseImpl();
		};
		return PerformanceTracer;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/parse/parser/parser.js
function EMPTY_ALT(value) {
	if (value === void 0) value = void 0;
	return function() {
		return value;
	};
}
var __extends, END_OF_FILE, DEFAULT_PARSER_CONFIG, DEFAULT_RULE_CONFIG, ParserDefinitionErrorType, Parser$1, CstParser, EmbeddedActionsParser;
var init_parser = __esmMin((() => {
	init_utils();
	init_follow();
	init_tokens_public();
	init_errors_public();
	init_gast_resolver_public();
	init_recoverable();
	init_looksahead();
	init_tree_builder();
	init_lexer_adapter();
	init_recognizer_api();
	init_recognizer_engine();
	init_error_handler();
	init_context_assist();
	init_gast_recorder();
	init_perf_tracer();
	__extends = (function() {
		var extendStatics = function(d, b) {
			extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
				d.__proto__ = b;
			} || function(d, b) {
				for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
			};
			return extendStatics(d, b);
		};
		return function(d, b) {
			extendStatics(d, b);
			function __() {
				this.constructor = d;
			}
			d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
		};
	})();
	END_OF_FILE = createTokenInstance(EOF, "", NaN, NaN, NaN, NaN, NaN, NaN);
	Object.freeze(END_OF_FILE);
	DEFAULT_PARSER_CONFIG = Object.freeze({
		recoveryEnabled: false,
		maxLookahead: 3,
		dynamicTokensEnabled: false,
		outputCst: true,
		errorMessageProvider: defaultParserErrorProvider,
		nodeLocationTracking: "none",
		traceInitPerf: false,
		skipValidations: false
	});
	DEFAULT_RULE_CONFIG = Object.freeze({
		recoveryValueFunc: function() {},
		resyncEnabled: true
	});
	(function(ParserDefinitionErrorType) {
		ParserDefinitionErrorType[ParserDefinitionErrorType["INVALID_RULE_NAME"] = 0] = "INVALID_RULE_NAME";
		ParserDefinitionErrorType[ParserDefinitionErrorType["DUPLICATE_RULE_NAME"] = 1] = "DUPLICATE_RULE_NAME";
		ParserDefinitionErrorType[ParserDefinitionErrorType["INVALID_RULE_OVERRIDE"] = 2] = "INVALID_RULE_OVERRIDE";
		ParserDefinitionErrorType[ParserDefinitionErrorType["DUPLICATE_PRODUCTIONS"] = 3] = "DUPLICATE_PRODUCTIONS";
		ParserDefinitionErrorType[ParserDefinitionErrorType["UNRESOLVED_SUBRULE_REF"] = 4] = "UNRESOLVED_SUBRULE_REF";
		ParserDefinitionErrorType[ParserDefinitionErrorType["LEFT_RECURSION"] = 5] = "LEFT_RECURSION";
		ParserDefinitionErrorType[ParserDefinitionErrorType["NONE_LAST_EMPTY_ALT"] = 6] = "NONE_LAST_EMPTY_ALT";
		ParserDefinitionErrorType[ParserDefinitionErrorType["AMBIGUOUS_ALTS"] = 7] = "AMBIGUOUS_ALTS";
		ParserDefinitionErrorType[ParserDefinitionErrorType["CONFLICT_TOKENS_RULES_NAMESPACE"] = 8] = "CONFLICT_TOKENS_RULES_NAMESPACE";
		ParserDefinitionErrorType[ParserDefinitionErrorType["INVALID_TOKEN_NAME"] = 9] = "INVALID_TOKEN_NAME";
		ParserDefinitionErrorType[ParserDefinitionErrorType["NO_NON_EMPTY_LOOKAHEAD"] = 10] = "NO_NON_EMPTY_LOOKAHEAD";
		ParserDefinitionErrorType[ParserDefinitionErrorType["AMBIGUOUS_PREFIX_ALTS"] = 11] = "AMBIGUOUS_PREFIX_ALTS";
		ParserDefinitionErrorType[ParserDefinitionErrorType["TOO_MANY_ALTS"] = 12] = "TOO_MANY_ALTS";
	})(ParserDefinitionErrorType || (ParserDefinitionErrorType = {}));
	Parser$1 = function() {
		function Parser(tokenVocabulary, config) {
			this.definitionErrors = [];
			this.selfAnalysisDone = false;
			var that = this;
			that.initErrorHandler(config);
			that.initLexerAdapter();
			that.initLooksAhead(config);
			that.initRecognizerEngine(tokenVocabulary, config);
			that.initRecoverable(config);
			that.initTreeBuilder(config);
			that.initContentAssist();
			that.initGastRecorder(config);
			that.initPerformanceTracer(config);
			if (has(config, "ignoredIssues")) throw new Error("The <ignoredIssues> IParserConfig property has been deprecated.\n	Please use the <IGNORE_AMBIGUITIES> flag on the relevant DSL method instead.\n	See: https://sap.github.io/chevrotain/docs/guide/resolving_grammar_errors.html#IGNORING_AMBIGUITIES\n	For further details.");
			this.skipValidations = has(config, "skipValidations") ? config.skipValidations : DEFAULT_PARSER_CONFIG.skipValidations;
		}
		/**
		*  @deprecated use the **instance** method with the same name instead
		*/
		Parser.performSelfAnalysis = function(parserInstance) {
			throw Error("The **static** `performSelfAnalysis` method has been deprecated.	\nUse the **instance** method with the same name instead.");
		};
		Parser.prototype.performSelfAnalysis = function() {
			var _this = this;
			this.TRACE_INIT("performSelfAnalysis", function() {
				var defErrorsMsgs;
				_this.selfAnalysisDone = true;
				var className = _this.className;
				_this.TRACE_INIT("toFastProps", function() {
					toFastProperties(_this);
				});
				_this.TRACE_INIT("Grammar Recording", function() {
					try {
						_this.enableRecording();
						forEach(_this.definedRulesNames, function(currRuleName) {
							var originalGrammarAction = _this[currRuleName]["originalGrammarAction"];
							var recordedRuleGast = void 0;
							_this.TRACE_INIT(currRuleName + " Rule", function() {
								recordedRuleGast = _this.topLevelRuleRecord(currRuleName, originalGrammarAction);
							});
							_this.gastProductionsCache[currRuleName] = recordedRuleGast;
						});
					} finally {
						_this.disableRecording();
					}
				});
				var resolverErrors = [];
				_this.TRACE_INIT("Grammar Resolving", function() {
					resolverErrors = resolveGrammar({ rules: values(_this.gastProductionsCache) });
					_this.definitionErrors.push.apply(_this.definitionErrors, resolverErrors);
				});
				_this.TRACE_INIT("Grammar Validations", function() {
					if (isEmpty(resolverErrors) && _this.skipValidations === false) {
						var validationErrors = validateGrammar({
							rules: values(_this.gastProductionsCache),
							maxLookahead: _this.maxLookahead,
							tokenTypes: values(_this.tokensMap),
							errMsgProvider: defaultGrammarValidatorErrorProvider,
							grammarName: className
						});
						_this.definitionErrors.push.apply(_this.definitionErrors, validationErrors);
					}
				});
				if (isEmpty(_this.definitionErrors)) {
					if (_this.recoveryEnabled) _this.TRACE_INIT("computeAllProdsFollows", function() {
						_this.resyncFollows = computeAllProdsFollows(values(_this.gastProductionsCache));
					});
					_this.TRACE_INIT("ComputeLookaheadFunctions", function() {
						_this.preComputeLookaheadFunctions(values(_this.gastProductionsCache));
					});
				}
				if (!Parser.DEFER_DEFINITION_ERRORS_HANDLING && !isEmpty(_this.definitionErrors)) {
					defErrorsMsgs = map(_this.definitionErrors, function(defError) {
						return defError.message;
					});
					throw new Error("Parser Definition Errors detected:\n " + defErrorsMsgs.join("\n-------------------------------\n"));
				}
			});
		};
		Parser.DEFER_DEFINITION_ERRORS_HANDLING = false;
		return Parser;
	}();
	applyMixins(Parser$1, [
		Recoverable,
		LooksAhead,
		TreeBuilder,
		LexerAdapter,
		RecognizerEngine,
		RecognizerApi,
		ErrorHandler,
		ContentAssist,
		GastRecorder,
		PerformanceTracer
	]);
	CstParser = function(_super) {
		__extends(CstParser, _super);
		function CstParser(tokenVocabulary, config) {
			if (config === void 0) config = DEFAULT_PARSER_CONFIG;
			var _this = this;
			var configClone = cloneObj(config);
			configClone.outputCst = true;
			_this = _super.call(this, tokenVocabulary, configClone) || this;
			return _this;
		}
		return CstParser;
	}(Parser$1);
	EmbeddedActionsParser = function(_super) {
		__extends(EmbeddedActionsParser, _super);
		function EmbeddedActionsParser(tokenVocabulary, config) {
			if (config === void 0) config = DEFAULT_PARSER_CONFIG;
			var _this = this;
			var configClone = cloneObj(config);
			configClone.outputCst = false;
			_this = _super.call(this, tokenVocabulary, configClone) || this;
			return _this;
		}
		return EmbeddedActionsParser;
	}(Parser$1);
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/diagrams/render_public.js
function createSyntaxDiagramsCode(grammar, _a) {
	var _b = _a === void 0 ? {} : _a, _c = _b.resourceBase, resourceBase = _c === void 0 ? "https://unpkg.com/chevrotain@" + VERSION$1 + "/diagrams/" : _c, _d = _b.css, css = _d === void 0 ? "https://unpkg.com/chevrotain@" + VERSION$1 + "/diagrams/diagrams.css" : _d;
	var header = "\n<!-- This is a generated file -->\n<!DOCTYPE html>\n<meta charset=\"utf-8\">\n<style>\n  body {\n    background-color: hsl(30, 20%, 95%)\n  }\n</style>\n\n";
	var cssHtml = "\n<link rel='stylesheet' href='" + css + "'>\n";
	var scripts = "\n<script src='" + resourceBase + "vendor/railroad-diagrams.js'><\/script>\n<script src='" + resourceBase + "src/diagrams_builder.js'><\/script>\n<script src='" + resourceBase + "src/diagrams_behavior.js'><\/script>\n<script src='" + resourceBase + "src/main.js'><\/script>\n";
	var diagramsDiv = "\n<div id=\"diagrams\" align=\"center\"></div>    \n";
	var serializedGrammar = "\n<script>\n    window.serializedGrammar = " + JSON.stringify(grammar, null, "  ") + ";\n<\/script>\n";
	return header + cssHtml + scripts + diagramsDiv + serializedGrammar + "\n<script>\n    var diagramsDiv = document.getElementById(\"diagrams\");\n    main.drawDiagramsFromSerializedGrammar(serializedGrammar, diagramsDiv);\n<\/script>\n";
}
var init_render_public = __esmMin((() => {
	init_version();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/generate/generate.js
function genUmdModule(options) {
	return "\n(function (root, factory) {\n    if (typeof define === 'function' && define.amd) {\n        // AMD. Register as an anonymous module.\n        define(['chevrotain'], factory);\n    } else if (typeof module === 'object' && module.exports) {\n        // Node. Does not work with strict CommonJS, but\n        // only CommonJS-like environments that support module.exports,\n        // like Node.\n        module.exports = factory(require('chevrotain'));\n    } else {\n        // Browser globals (root is window)\n        root.returnExports = factory(root.b);\n    }\n}(typeof self !== 'undefined' ? self : this, function (chevrotain) {\n\n" + genClass(options) + "\n    \nreturn {\n    " + options.name + ": " + options.name + " \n}\n}));\n";
}
function genWrapperFunction(options) {
	return "    \n" + genClass(options) + "\nreturn new " + options.name + "(tokenVocabulary, config)    \n";
}
function genClass(options) {
	return "\nfunction " + options.name + "(tokenVocabulary, config) {\n    // invoke super constructor\n    // No support for embedded actions currently, so we can 'hardcode'\n    // The use of CstParser.\n    chevrotain.CstParser.call(this, tokenVocabulary, config)\n\n    const $ = this\n\n    " + genAllRules(options.rules) + "\n\n    // very important to call this after all the rules have been defined.\n    // otherwise the parser may not work correctly as it will lack information\n    // derived during the self analysis phase.\n    this.performSelfAnalysis(this)\n}\n\n// inheritance as implemented in javascript in the previous decade... :(\n" + options.name + ".prototype = Object.create(chevrotain.CstParser.prototype)\n" + options.name + ".prototype.constructor = " + options.name + "    \n    ";
}
function genAllRules(rules) {
	return map(rules, function(currRule) {
		return genRule(currRule, 1);
	}).join("\n");
}
function genRule(prod, n) {
	var result = indent$3(n, "$.RULE(\"" + prod.name + "\", function() {") + NL;
	result += genDefinition(prod.definition, n + 1);
	result += indent$3(n + 1, "})") + NL;
	return result;
}
function genTerminal(prod, n) {
	var name = prod.terminalType.name;
	return indent$3(n, "$.CONSUME" + prod.idx + "(this.tokensMap." + name + ")" + NL);
}
function genNonTerminal(prod, n) {
	return indent$3(n, "$.SUBRULE" + prod.idx + "($." + prod.nonTerminalName + ")" + NL);
}
function genAlternation(prod, n) {
	var result = indent$3(n, "$.OR" + prod.idx + "([") + NL;
	var alts = map(prod.definition, function(altDef) {
		return genSingleAlt(altDef, n + 1);
	});
	result += alts.join("," + NL);
	result += NL + indent$3(n, "])" + NL);
	return result;
}
function genSingleAlt(prod, n) {
	var result = indent$3(n, "{") + NL;
	result += indent$3(n + 1, "ALT: function() {") + NL;
	result += genDefinition(prod.definition, n + 1);
	result += indent$3(n + 1, "}") + NL;
	result += indent$3(n, "}");
	return result;
}
function genProd(prod, n) {
	/* istanbul ignore else */
	if (prod instanceof NonTerminal) return genNonTerminal(prod, n);
	else if (prod instanceof Option) return genDSLRule("OPTION", prod, n);
	else if (prod instanceof RepetitionMandatory) return genDSLRule("AT_LEAST_ONE", prod, n);
	else if (prod instanceof RepetitionMandatoryWithSeparator) return genDSLRule("AT_LEAST_ONE_SEP", prod, n);
	else if (prod instanceof RepetitionWithSeparator) return genDSLRule("MANY_SEP", prod, n);
	else if (prod instanceof Repetition) return genDSLRule("MANY", prod, n);
	else if (prod instanceof Alternation) return genAlternation(prod, n);
	else if (prod instanceof Terminal) return genTerminal(prod, n);
	else if (prod instanceof Alternative) return genDefinition(prod.definition, n);
	else throw Error("non exhaustive match");
}
function genDSLRule(dslName, prod, n) {
	var result = indent$3(n, "$." + (dslName + prod.idx) + "(");
	if (prod.separator) {
		result += "{" + NL;
		result += indent$3(n + 1, "SEP: this.tokensMap." + prod.separator.name) + "," + NL;
		result += "DEF: " + genDefFunction(prod.definition, n + 2) + NL;
		result += indent$3(n, "}") + NL;
	} else result += genDefFunction(prod.definition, n + 1);
	result += indent$3(n, ")") + NL;
	return result;
}
function genDefFunction(definition, n) {
	var def = "function() {" + NL;
	def += genDefinition(definition, n);
	def += indent$3(n, "}") + NL;
	return def;
}
function genDefinition(def, n) {
	var result = "";
	forEach(def, function(prod) {
		result += genProd(prod, n + 1);
	});
	return result;
}
function indent$3(howMuch, text) {
	return Array(howMuch * 4 + 1).join(" ") + text;
}
var NL;
var init_generate = __esmMin((() => {
	init_utils();
	init_gast_public();
	NL = "\n";
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/generate/generate_public.js
function generateParserFactory(options) {
	var wrapperText = genWrapperFunction({
		name: options.name,
		rules: options.rules
	});
	var constructorWrapper = new Function("tokenVocabulary", "config", "chevrotain", wrapperText);
	return function(config) {
		return constructorWrapper(options.tokenVocabulary, config, (init_api(), __toCommonJS(api_exports)));
	};
}
function generateParserModule(options) {
	return genUmdModule({
		name: options.name,
		rules: options.rules
	});
}
var init_generate_public = __esmMin((() => {
	init_generate();
}));
//#endregion
//#region ../../node_modules/.pnpm/chevrotain@7.1.1/node_modules/chevrotain/lib_esm/src/api.js
var api_exports = /* @__PURE__ */ __exportAll({
	Alternation: () => Alternation,
	Alternative: () => Alternative,
	CstParser: () => CstParser,
	EMPTY_ALT: () => EMPTY_ALT,
	EOF: () => EOF,
	EarlyExitException: () => EarlyExitException,
	EmbeddedActionsParser: () => EmbeddedActionsParser,
	GAstVisitor: () => GAstVisitor,
	Lexer: () => Lexer,
	LexerDefinitionErrorType: () => LexerDefinitionErrorType,
	MismatchedTokenException: () => MismatchedTokenException,
	NoViableAltException: () => NoViableAltException,
	NonTerminal: () => NonTerminal,
	NotAllInputParsedException: () => NotAllInputParsedException,
	Option: () => Option,
	Parser: () => Parser,
	ParserDefinitionErrorType: () => ParserDefinitionErrorType,
	Repetition: () => Repetition,
	RepetitionMandatory: () => RepetitionMandatory,
	RepetitionMandatoryWithSeparator: () => RepetitionMandatoryWithSeparator,
	RepetitionWithSeparator: () => RepetitionWithSeparator,
	Rule: () => Rule,
	Terminal: () => Terminal,
	VERSION: () => VERSION$1,
	assignOccurrenceIndices: () => assignOccurrenceIndices,
	clearCache: () => clearCache,
	createSyntaxDiagramsCode: () => createSyntaxDiagramsCode,
	createToken: () => createToken,
	createTokenInstance: () => createTokenInstance,
	defaultGrammarResolverErrorProvider: () => defaultGrammarResolverErrorProvider,
	defaultGrammarValidatorErrorProvider: () => defaultGrammarValidatorErrorProvider,
	defaultLexerErrorProvider: () => defaultLexerErrorProvider,
	defaultParserErrorProvider: () => defaultParserErrorProvider,
	generateParserFactory: () => generateParserFactory,
	generateParserModule: () => generateParserModule,
	isRecognitionException: () => isRecognitionException,
	resolveGrammar: () => resolveGrammar,
	serializeGrammar: () => serializeGrammar,
	serializeProduction: () => serializeProduction,
	tokenLabel: () => tokenLabel,
	tokenMatcher: () => tokenMatcher,
	tokenName: () => tokenName,
	validateGrammar: () => validateGrammar
});
/* istanbul ignore file - tricky to import some things from this module during testing */
/* istanbul ignore next */
function clearCache() {
	console.warn("The clearCache function was 'soft' removed from the Chevrotain API.\n	 It performs no action other than printing this message.\n	 Please avoid using it as it will be completely removed in the future");
}
var Parser;
var init_api = __esmMin((() => {
	init_version();
	init_parser();
	init_lexer_public();
	init_tokens_public();
	init_errors_public();
	init_exceptions_public();
	init_lexer_errors_public();
	init_gast_public();
	init_gast_visitor_public();
	init_gast_resolver_public();
	init_render_public();
	init_generate_public();
	Parser = function() {
		function Parser() {
			throw new Error("The Parser class has been deprecated, use CstParser or EmbeddedActionsParser instead.	\nSee: https://sap.github.io/chevrotain/docs/changes/BREAKING_CHANGES.html#_7-0-0");
		}
		return Parser;
	}();
}));
//#endregion
//#region ../../node_modules/.pnpm/@xml-tools+parser@1.0.12/node_modules/@xml-tools/parser/lib/lexer.js
var require_lexer = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { createToken: createTokenOrg, Lexer } = (init_api(), __toCommonJS(api_exports));
	var fragments = {};
	var f = fragments;
	function FRAGMENT(name, def) {
		fragments[name] = typeof def === "string" ? def : def.source;
	}
	function makePattern(strings, ...args) {
		let combined = "";
		for (let i = 0; i < strings.length; i++) {
			combined += strings[i];
			if (i < args.length) {
				let pattern = args[i];
				combined += `(?:${pattern})`;
			}
		}
		return new RegExp(combined);
	}
	var tokensArray = [];
	var tokensDictionary = {};
	function createToken(options) {
		const newTokenType = createTokenOrg(options);
		tokensArray.push(newTokenType);
		tokensDictionary[options.name] = newTokenType;
		return newTokenType;
	}
	FRAGMENT("NameStartChar", "(:|[a-zA-Z]|_|\\u2070-\\u218F|\\u2C00-\\u2FEF|\\u3001-\\uD7FF|\\uF900-\\uFDCF|\\uFDF0-\\uFFFD)");
	FRAGMENT("NameChar", makePattern`${f.NameStartChar}|-|\\.|\\d|\\u00B7||[\\u0300-\\u036F]|[\\u203F-\\u2040]`);
	FRAGMENT("Name", makePattern`${f.NameStartChar}(${f.NameChar})*`);
	var Comment = createToken({
		name: "Comment",
		pattern: /<!--(.|\r?\n)*?-->/,
		line_breaks: true
	});
	var CData = createToken({
		name: "CData",
		pattern: /<!\[CDATA\[(.|\r?\n)*?]]>/,
		line_breaks: true
	});
	var DocType = createToken({
		name: "DocType",
		pattern: /<!DOCTYPE/,
		push_mode: "INSIDE"
	});
	var IgnoredDTD = createToken({
		name: "DTD",
		pattern: /<!.*?>/,
		group: Lexer.SKIPPED
	});
	var EntityRef = createToken({
		name: "EntityRef",
		pattern: makePattern`&${f.Name};`
	});
	var CharRef = createToken({
		name: "CharRef",
		pattern: /&#\d+;|&#x[a-fA-F0-9]/
	});
	var SEA_WS = createToken({
		name: "SEA_WS",
		pattern: /( |\t|\n|\r\n)+/
	});
	var XMLDeclOpen = createToken({
		name: "XMLDeclOpen",
		pattern: /<\?xml[ \t\r\n]/,
		push_mode: "INSIDE"
	});
	var SLASH_OPEN = createToken({
		name: "SLASH_OPEN",
		pattern: /<\//,
		push_mode: "INSIDE"
	});
	var INVALID_SLASH_OPEN = createToken({
		name: "INVALID_SLASH_OPEN",
		pattern: /<\//,
		categories: [SLASH_OPEN]
	});
	var PROCESSING_INSTRUCTION = createToken({
		name: "PROCESSING_INSTRUCTION",
		pattern: makePattern`<\\?${f.Name}.*\\?>`
	});
	var OPEN = createToken({
		name: "OPEN",
		pattern: /</,
		push_mode: "INSIDE"
	});
	var INVALID_OPEN_INSIDE = createToken({
		name: "INVALID_OPEN_INSIDE",
		pattern: /</,
		categories: [OPEN]
	});
	var TEXT = createToken({
		name: "TEXT",
		pattern: /[^<&]+/
	});
	var CLOSE = createToken({
		name: "CLOSE",
		pattern: />/,
		pop_mode: true
	});
	var SPECIAL_CLOSE = createToken({
		name: "SPECIAL_CLOSE",
		pattern: /\?>/,
		pop_mode: true
	});
	var SLASH_CLOSE = createToken({
		name: "SLASH_CLOSE",
		pattern: /\/>/,
		pop_mode: true
	});
	var SLASH = createToken({
		name: "SLASH",
		pattern: /\//
	});
	var STRING = createToken({
		name: "STRING",
		pattern: /"[^<"]*"|'[^<']*'/
	});
	var EQUALS = createToken({
		name: "EQUALS",
		pattern: /=/
	});
	var Name = createToken({
		name: "Name",
		pattern: makePattern`${f.Name}`
	});
	var S = createToken({
		name: "S",
		pattern: /[ \t\r\n]/,
		group: Lexer.SKIPPED
	});
	module.exports = {
		xmlLexer: new Lexer({
			defaultMode: "OUTSIDE",
			modes: {
				OUTSIDE: [
					Comment,
					CData,
					DocType,
					IgnoredDTD,
					EntityRef,
					CharRef,
					SEA_WS,
					XMLDeclOpen,
					SLASH_OPEN,
					PROCESSING_INSTRUCTION,
					OPEN,
					TEXT
				],
				INSIDE: [
					Comment,
					INVALID_SLASH_OPEN,
					INVALID_OPEN_INSIDE,
					CLOSE,
					SPECIAL_CLOSE,
					SLASH_CLOSE,
					SLASH,
					EQUALS,
					STRING,
					Name,
					S
				]
			}
		}, {
			positionTracking: "full",
			ensureOptimizations: false,
			lineTerminatorCharacters: ["\n"],
			lineTerminatorsPattern: /\n|\r\n/g
		}),
		tokensDictionary
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@xml-tools+parser@1.0.12/node_modules/@xml-tools/parser/lib/parser.js
var require_parser = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { CstParser, tokenMatcher } = (init_api(), __toCommonJS(api_exports));
	var { tokensDictionary: t } = require_lexer();
	var Parser = class extends CstParser {
		constructor() {
			super(t, {
				maxLookahead: 1,
				recoveryEnabled: true,
				nodeLocationTracking: "full"
			});
			this.deletionRecoveryEnabled = true;
			const $ = this;
			$.RULE("document", () => {
				$.OPTION(() => {
					$.SUBRULE($.prolog);
				});
				$.MANY(() => {
					$.SUBRULE($.misc);
				});
				$.OPTION2(() => {
					$.SUBRULE($.docTypeDecl);
				});
				$.MANY2(() => {
					$.SUBRULE2($.misc);
				});
				$.SUBRULE($.element);
				$.MANY3(() => {
					$.SUBRULE3($.misc);
				});
			});
			$.RULE("prolog", () => {
				$.CONSUME(t.XMLDeclOpen);
				$.MANY(() => {
					$.SUBRULE($.attribute);
				});
				$.CONSUME(t.SPECIAL_CLOSE);
			});
			$.RULE("docTypeDecl", () => {
				$.CONSUME(t.DocType);
				$.CONSUME(t.Name);
				$.OPTION(() => {
					$.SUBRULE($.externalID);
				});
				$.CONSUME(t.CLOSE);
			});
			$.RULE("externalID", () => {
				$.OR([{
					GATE: () => $.LA(1).image === "SYSTEM",
					ALT: () => {
						$.CONSUME2(t.Name, { LABEL: "System" });
						$.CONSUME(t.STRING, { LABEL: "SystemLiteral" });
					}
				}, {
					GATE: () => $.LA(1).image === "PUBLIC",
					ALT: () => {
						$.CONSUME3(t.Name, { LABEL: "Public" });
						$.CONSUME2(t.STRING, { LABEL: "PubIDLiteral" });
						$.CONSUME3(t.STRING, { LABEL: "SystemLiteral" });
					}
				}]);
			});
			$.RULE("content", () => {
				$.MANY(() => {
					$.OR([
						{ ALT: () => $.SUBRULE($.element) },
						{ ALT: () => $.SUBRULE($.chardata) },
						{ ALT: () => $.SUBRULE($.reference) },
						{ ALT: () => $.CONSUME(t.CData) },
						{ ALT: () => $.CONSUME(t.PROCESSING_INSTRUCTION) },
						{ ALT: () => $.CONSUME(t.Comment) }
					]);
				});
			});
			$.RULE("element", () => {
				$.CONSUME(t.OPEN);
				try {
					this.deletionRecoveryEnabled = false;
					$.CONSUME(t.Name);
				} finally {
					this.deletionRecoveryEnabled = true;
				}
				$.MANY(() => {
					$.SUBRULE($.attribute);
				});
				$.OR([{ ALT: () => {
					$.CONSUME(t.CLOSE, { LABEL: "START_CLOSE" });
					$.SUBRULE($.content);
					$.CONSUME(t.SLASH_OPEN);
					$.CONSUME2(t.Name, { LABEL: "END_NAME" });
					$.CONSUME2(t.CLOSE, { LABEL: "END" });
				} }, { ALT: () => {
					$.CONSUME(t.SLASH_CLOSE);
				} }]);
			});
			$.RULE("reference", () => {
				$.OR([{ ALT: () => $.CONSUME(t.EntityRef) }, { ALT: () => $.CONSUME(t.CharRef) }]);
			});
			$.RULE("attribute", () => {
				$.CONSUME(t.Name);
				try {
					this.deletionRecoveryEnabled = false;
					$.CONSUME(t.EQUALS);
					$.CONSUME(t.STRING);
				} finally {
					this.deletionRecoveryEnabled = true;
				}
			});
			$.RULE("chardata", () => {
				$.OR([{ ALT: () => $.CONSUME(t.TEXT) }, { ALT: () => $.CONSUME(t.SEA_WS) }]);
			});
			$.RULE("misc", () => {
				$.OR([
					{ ALT: () => $.CONSUME(t.Comment) },
					{ ALT: () => $.CONSUME(t.PROCESSING_INSTRUCTION) },
					{ ALT: () => $.CONSUME(t.SEA_WS) }
				]);
			});
			this.performSelfAnalysis();
		}
		canRecoverWithSingleTokenDeletion(expectedTokType) {
			if (this.deletionRecoveryEnabled === false) return false;
			return super.canRecoverWithSingleTokenDeletion(expectedTokType);
		}
		/* istanbul ignore next - should be tested as part of Chevrotain */
		findReSyncTokenType() {
			const allPossibleReSyncTokTypes = this.flattenFollowSet();
			let nextToken = this.LA(1);
			let k = 2;
			while (true) {
				const foundMatch = allPossibleReSyncTokTypes.find((resyncTokType) => {
					return tokenMatcher(nextToken, resyncTokType);
				});
				if (foundMatch !== void 0) return foundMatch;
				nextToken = this.LA(k);
				k++;
			}
		}
	};
	module.exports = { xmlParser: new Parser() };
}));
//#endregion
//#region ../../node_modules/.pnpm/@prettier+plugin-xml@3.4.2_prettier@3.9.6/node_modules/@prettier/plugin-xml/src/parser.js
var import_api = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	var { xmlLexer } = require_lexer();
	var { xmlParser } = require_parser();
	module.exports = {
		parse: function parse(text) {
			const lexResult = xmlLexer.tokenize(text);
			xmlParser.input = lexResult.tokens;
			return {
				cst: xmlParser.document(),
				tokenVector: lexResult.tokens,
				lexErrors: lexResult.errors,
				parseErrors: xmlParser.errors
			};
		},
		BaseXmlCstVisitor: xmlParser.getBaseCstVisitorConstructor()
	};
})))();
function createError(message, options) {
	const error = /* @__PURE__ */ new SyntaxError(message + " (" + options.loc.start.line + ":" + options.loc.start.column + ")");
	return Object.assign(error, options);
}
function simplifyCST(node) {
	switch (node.name) {
		case "attribute": {
			const { Name, EQUALS, STRING } = node.children;
			return {
				name: "attribute",
				Name: Name[0].image,
				EQUALS: EQUALS[0].image,
				STRING: STRING[0].image,
				location: node.location
			};
		}
		case "chardata": {
			const { SEA_WS, TEXT } = node.children;
			return {
				name: "chardata",
				SEA_WS: SEA_WS ? SEA_WS[0].image : null,
				TEXT: TEXT ? TEXT[0].image : null,
				location: node.location
			};
		}
		case "content": {
			const { CData, Comment, chardata, element, PROCESSING_INSTRUCTION, reference } = node.children;
			return {
				name: "content",
				CData: CData || [],
				Comment: Comment || [],
				chardata: (chardata || []).map(simplifyCST),
				element: (element || []).map(simplifyCST),
				PROCESSING_INSTRUCTION: PROCESSING_INSTRUCTION || [],
				reference: (reference || []).map(simplifyCST),
				location: node.location
			};
		}
		case "docTypeDecl": {
			const { DocType, Name, externalID, CLOSE } = node.children;
			return {
				name: "docTypeDecl",
				DocType: DocType[0].image,
				Name: Name[0].image,
				externalID: externalID ? simplifyCST(externalID[0]) : null,
				CLOSE: CLOSE[0].image,
				location: node.location
			};
		}
		case "document": {
			const { docTypeDecl, element, misc, prolog } = node.children;
			return {
				name: "document",
				docTypeDecl: docTypeDecl ? simplifyCST(docTypeDecl[0]) : null,
				element: element ? simplifyCST(element[0]) : null,
				misc: (misc || []).filter((child) => !child.children.SEA_WS).map(simplifyCST),
				prolog: prolog ? simplifyCST(prolog[0]) : null,
				location: node.location
			};
		}
		case "element": {
			const { OPEN, Name, attribute, START_CLOSE, content, SLASH_OPEN, END_NAME, END, SLASH_CLOSE } = node.children;
			return {
				name: "element",
				OPEN: OPEN[0].image,
				Name: Name[0].image,
				attribute: (attribute || []).map(simplifyCST),
				START_CLOSE: START_CLOSE ? START_CLOSE[0].image : null,
				content: content ? simplifyCST(content[0]) : null,
				SLASH_OPEN: SLASH_OPEN ? SLASH_OPEN[0].image : null,
				END_NAME: END_NAME ? END_NAME[0].image : null,
				END: END ? END[0].image : null,
				SLASH_CLOSE: SLASH_CLOSE ? SLASH_CLOSE[0].image : null,
				location: node.location
			};
		}
		case "externalID": {
			const { Public, PubIDLiteral, System, SystemLiteral } = node.children;
			return {
				name: "externalID",
				Public: Public ? Public[0].image : null,
				PubIDLiteral: PubIDLiteral ? PubIDLiteral[0].image : null,
				System: System ? System[0].image : null,
				SystemLiteral: SystemLiteral ? SystemLiteral[0].image : null,
				location: node.location
			};
		}
		case "misc": {
			const { Comment, PROCESSING_INSTRUCTION, SEA_WS } = node.children;
			return {
				name: "misc",
				Comment: Comment ? Comment[0].image : null,
				PROCESSING_INSTRUCTION: PROCESSING_INSTRUCTION ? PROCESSING_INSTRUCTION[0].image : null,
				SEA_WS: SEA_WS ? SEA_WS[0].image : null,
				location: node.location
			};
		}
		case "prolog": {
			const { XMLDeclOpen, attribute, SPECIAL_CLOSE } = node.children;
			return {
				name: "prolog",
				XMLDeclOpen: XMLDeclOpen[0].image,
				attribute: (attribute || []).map(simplifyCST),
				SPECIAL_CLOSE: SPECIAL_CLOSE[0].image,
				location: node.location
			};
		}
		case "reference": {
			const { CharRef, EntityRef } = node.children;
			return {
				name: "reference",
				CharRef: CharRef ? CharRef[0].image : null,
				EntityRef: EntityRef ? EntityRef[0].image : null,
				location: node.location
			};
		}
		default: throw new Error(`Unknown node type: ${node.name}`);
	}
}
var parser = {
	parse(text) {
		const { lexErrors, parseErrors, cst } = (0, import_api.parse)(text);
		if (lexErrors.length > 0) {
			const lexError = lexErrors[0];
			throw createError(lexError.message, { loc: {
				start: {
					line: lexError.line,
					column: lexError.column
				},
				end: {
					line: lexError.line,
					column: lexError.column + lexError.length
				}
			} });
		}
		if (parseErrors.length > 0) {
			const parseError = parseErrors[0];
			throw createError(parseError.message, { loc: {
				start: {
					line: parseError.token.startLine,
					column: parseError.token.startColumn
				},
				end: {
					line: parseError.token.endLine,
					column: parseError.token.endColumn
				}
			} });
		}
		return simplifyCST(cst);
	},
	astFormat: "xml",
	locStart(node) {
		return node.location.startOffset;
	},
	locEnd(node) {
		return node.location.endOffset;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/prettier@3.9.6/node_modules/prettier/doc.mjs
var __defProp = Object.defineProperty;
var __export = (target, all) => {
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
};
__export({}, {
	builders: () => builders,
	printer: () => printer$1,
	utils: () => utils
});
var OPTIONAL_OBJECT = 1;
var createMethodShim = (methodName, getImplementation) => (flags, object, ...arguments_) => {
	if (flags | OPTIONAL_OBJECT && (object === void 0 || object === null)) return;
	return (getImplementation.call(object) ?? object[methodName]).apply(object, arguments_);
};
function stringOrArrayAt(index) {
	return this[index < 0 ? this.length + index : index];
}
var method_at_default = /* @__PURE__ */ createMethodShim("at", function() {
	if (Array.isArray(this) || typeof this === "string") return stringOrArrayAt;
});
var noop = () => {};
var noop_default = noop;
var DOC_TYPE_STRING = "string";
var DOC_TYPE_ARRAY = "array";
var DOC_TYPE_CURSOR = "cursor";
var DOC_TYPE_INDENT = "indent";
var DOC_TYPE_ALIGN = "align";
var DOC_TYPE_TRIM = "trim";
var DOC_TYPE_GROUP = "group";
var DOC_TYPE_FILL = "fill";
var DOC_TYPE_IF_BREAK = "if-break";
var DOC_TYPE_INDENT_IF_BREAK = "indent-if-break";
var DOC_TYPE_LINE_SUFFIX = "line-suffix";
var DOC_TYPE_LINE_SUFFIX_BOUNDARY = "line-suffix-boundary";
var DOC_TYPE_LINE = "line";
var DOC_TYPE_LABEL = "label";
var DOC_TYPE_BREAK_PARENT = "break-parent";
var VALID_OBJECT_DOC_TYPES = /* @__PURE__ */ new Set([
	DOC_TYPE_CURSOR,
	DOC_TYPE_INDENT,
	DOC_TYPE_ALIGN,
	DOC_TYPE_TRIM,
	DOC_TYPE_GROUP,
	DOC_TYPE_FILL,
	DOC_TYPE_IF_BREAK,
	DOC_TYPE_INDENT_IF_BREAK,
	DOC_TYPE_LINE_SUFFIX,
	DOC_TYPE_LINE_SUFFIX_BOUNDARY,
	DOC_TYPE_LINE,
	DOC_TYPE_LABEL,
	DOC_TYPE_BREAK_PARENT
]);
function trimNewlinesEnd(string) {
	let end = string.length;
	while (end > 0 && (string[end - 1] === "\r" || string[end - 1] === "\n")) end--;
	return end < string.length ? string.slice(0, end) : string;
}
function getOrInsertComputed(map, key, callback) {
	if (!map.has(key)) {
		const value = callback(key);
		map.set(key, value);
	}
	return map.get(key);
}
function getDocType(doc) {
	if (typeof doc === "string") return DOC_TYPE_STRING;
	if (Array.isArray(doc)) return DOC_TYPE_ARRAY;
	if (!doc) return;
	const { type } = doc;
	if (VALID_OBJECT_DOC_TYPES.has(type)) return type;
}
var get_doc_type_default = getDocType;
var disjunctionListFormat = (list) => new Intl.ListFormat("en-US", { type: "disjunction" }).format(list);
function getDocErrorMessage(doc) {
	const type = doc === null ? "null" : typeof doc;
	if (type !== "string" && type !== "object") return `Unexpected doc '${type}', 
Expected it to be 'string' or 'object'.`;
	if (get_doc_type_default(doc)) throw new Error("doc is valid.");
	const objectType = Object.prototype.toString.call(doc);
	if (objectType !== "[object Object]") return `Unexpected doc '${objectType}'.`;
	const EXPECTED_TYPE_VALUES = disjunctionListFormat([...VALID_OBJECT_DOC_TYPES].map((type2) => `'${type2}'`));
	return `Unexpected doc.type '${doc.type}'.
Expected it to be ${EXPECTED_TYPE_VALUES}.`;
}
var InvalidDocError = class extends Error {
	name = "InvalidDocError";
	constructor(doc) {
		super(getDocErrorMessage(doc));
		this.doc = doc;
	}
};
var invalid_doc_error_default = InvalidDocError;
var traverseDocOnExitStackMarker = {};
function traverseDoc(doc, onEnter, onExit, shouldTraverseConditionalGroups) {
	const docsStack = [doc];
	while (docsStack.length > 0) {
		const doc2 = docsStack.pop();
		if (doc2 === traverseDocOnExitStackMarker) {
			onExit(docsStack.pop());
			continue;
		}
		if (onExit) docsStack.push(doc2, traverseDocOnExitStackMarker);
		const docType = get_doc_type_default(doc2);
		if (!docType) throw new invalid_doc_error_default(doc2);
		if (onEnter?.(doc2) === false) continue;
		switch (docType) {
			case DOC_TYPE_ARRAY:
			case DOC_TYPE_FILL: {
				const parts = docType === DOC_TYPE_ARRAY ? doc2 : doc2.parts;
				for (let i = parts.length - 1; i >= 0; --i) docsStack.push(parts[i]);
				break;
			}
			case DOC_TYPE_IF_BREAK:
				docsStack.push(doc2.flatContents, doc2.breakContents);
				break;
			case DOC_TYPE_GROUP:
				if (shouldTraverseConditionalGroups && doc2.expandedStates) for (let i = doc2.expandedStates.length - 1; i >= 0; --i) docsStack.push(doc2.expandedStates[i]);
				else docsStack.push(doc2.contents);
				break;
			case DOC_TYPE_ALIGN:
			case DOC_TYPE_INDENT:
			case DOC_TYPE_INDENT_IF_BREAK:
			case DOC_TYPE_LABEL:
			case DOC_TYPE_LINE_SUFFIX:
				docsStack.push(doc2.contents);
				break;
			case DOC_TYPE_STRING:
			case DOC_TYPE_CURSOR:
			case DOC_TYPE_TRIM:
			case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
			case DOC_TYPE_LINE:
			case DOC_TYPE_BREAK_PARENT: break;
			default: throw new invalid_doc_error_default(doc2);
		}
	}
}
var traverse_doc_default = traverseDoc;
function mapDoc(doc, cb) {
	if (typeof doc === "string") return cb(doc);
	const mapped = /* @__PURE__ */ new Map();
	return rec(doc);
	function rec(doc2) {
		return getOrInsertComputed(mapped, doc2, process2);
	}
	function process2(doc2) {
		switch (get_doc_type_default(doc2)) {
			case DOC_TYPE_ARRAY: return cb(doc2.map(rec));
			case DOC_TYPE_FILL: return cb({
				...doc2,
				parts: doc2.parts.map(rec)
			});
			case DOC_TYPE_IF_BREAK: return cb({
				...doc2,
				breakContents: rec(doc2.breakContents),
				flatContents: rec(doc2.flatContents)
			});
			case DOC_TYPE_GROUP: {
				let { expandedStates, contents } = doc2;
				if (expandedStates) {
					expandedStates = expandedStates.map(rec);
					contents = expandedStates[0];
				} else contents = rec(contents);
				return cb({
					...doc2,
					contents,
					expandedStates
				});
			}
			case DOC_TYPE_ALIGN:
			case DOC_TYPE_INDENT:
			case DOC_TYPE_INDENT_IF_BREAK:
			case DOC_TYPE_LABEL:
			case DOC_TYPE_LINE_SUFFIX: return cb({
				...doc2,
				contents: rec(doc2.contents)
			});
			case DOC_TYPE_STRING:
			case DOC_TYPE_CURSOR:
			case DOC_TYPE_TRIM:
			case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
			case DOC_TYPE_LINE:
			case DOC_TYPE_BREAK_PARENT: return cb(doc2);
			default: throw new invalid_doc_error_default(doc2);
		}
	}
}
function findInDoc(doc, fn, defaultValue) {
	let result = defaultValue;
	let shouldSkipFurtherProcessing = false;
	function findInDocOnEnterFn(doc2) {
		if (shouldSkipFurtherProcessing) return false;
		const maybeResult = fn(doc2);
		if (maybeResult !== void 0) {
			shouldSkipFurtherProcessing = true;
			result = maybeResult;
		}
	}
	traverse_doc_default(doc, findInDocOnEnterFn);
	return result;
}
function willBreakFn(doc) {
	if (doc.type === DOC_TYPE_GROUP && doc.break) return true;
	if (doc.type === DOC_TYPE_LINE && doc.hard) return true;
	if (doc.type === DOC_TYPE_BREAK_PARENT) return true;
}
function willBreak(doc) {
	return findInDoc(doc, willBreakFn, false);
}
function breakParentGroup(groupStack) {
	if (groupStack.length > 0) {
		const parentGroup = method_at_default(0, groupStack, -1);
		if (!parentGroup.expandedStates && !parentGroup.break) parentGroup.break = "propagated";
	}
	return null;
}
function propagateBreaks(doc) {
	const alreadyVisitedSet = /* @__PURE__ */ new Set();
	const groupStack = [];
	function propagateBreaksOnEnterFn(doc2) {
		if (doc2.type === DOC_TYPE_BREAK_PARENT) breakParentGroup(groupStack);
		if (doc2.type === DOC_TYPE_GROUP) {
			groupStack.push(doc2);
			if (alreadyVisitedSet.has(doc2)) return false;
			alreadyVisitedSet.add(doc2);
		}
	}
	function propagateBreaksOnExitFn(doc2) {
		if (doc2.type === DOC_TYPE_GROUP) {
			if (groupStack.pop().break) breakParentGroup(groupStack);
		}
	}
	traverse_doc_default(doc, propagateBreaksOnEnterFn, propagateBreaksOnExitFn, true);
}
function removeLinesFn(doc) {
	if (doc.type === DOC_TYPE_LINE && !doc.hard) return doc.soft ? "" : " ";
	if (doc.type === DOC_TYPE_IF_BREAK) return doc.flatContents;
	return doc;
}
function removeLines(doc) {
	return mapDoc(doc, removeLinesFn);
}
function stripTrailingHardlineFromParts(parts) {
	parts = [...parts];
	while (parts.length >= 2 && method_at_default(0, parts, -2).type === DOC_TYPE_LINE && method_at_default(0, parts, -1).type === DOC_TYPE_BREAK_PARENT) parts.length -= 2;
	if (parts.length > 0) {
		const lastPart = stripTrailingHardlineFromDoc(method_at_default(0, parts, -1));
		parts[parts.length - 1] = lastPart;
	}
	return parts;
}
function stripTrailingHardlineFromDoc(doc) {
	switch (get_doc_type_default(doc)) {
		case DOC_TYPE_INDENT:
		case DOC_TYPE_INDENT_IF_BREAK:
		case DOC_TYPE_GROUP:
		case DOC_TYPE_LINE_SUFFIX:
		case DOC_TYPE_LABEL: {
			const contents = stripTrailingHardlineFromDoc(doc.contents);
			return {
				...doc,
				contents
			};
		}
		case DOC_TYPE_IF_BREAK: return {
			...doc,
			breakContents: stripTrailingHardlineFromDoc(doc.breakContents),
			flatContents: stripTrailingHardlineFromDoc(doc.flatContents)
		};
		case DOC_TYPE_FILL: return {
			...doc,
			parts: stripTrailingHardlineFromParts(doc.parts)
		};
		case DOC_TYPE_ARRAY: return stripTrailingHardlineFromParts(doc);
		case DOC_TYPE_STRING: return trimNewlinesEnd(doc);
		case DOC_TYPE_ALIGN:
		case DOC_TYPE_CURSOR:
		case DOC_TYPE_TRIM:
		case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
		case DOC_TYPE_LINE:
		case DOC_TYPE_BREAK_PARENT: break;
		default: throw new invalid_doc_error_default(doc);
	}
	return doc;
}
function stripTrailingHardline(doc) {
	return stripTrailingHardlineFromDoc(cleanDoc(doc));
}
function cleanDocFn(doc) {
	switch (get_doc_type_default(doc)) {
		case DOC_TYPE_FILL: {
			const { parts } = doc;
			if (parts.every((part) => part === "")) return "";
			if (parts.length === 1) return parts[0];
			break;
		}
		case DOC_TYPE_GROUP:
			if (!doc.contents && !doc.id && !doc.break && !doc.expandedStates) return "";
			if (doc.contents.type === DOC_TYPE_GROUP && doc.contents.id === doc.id && doc.contents.break === doc.break && doc.contents.expandedStates === doc.expandedStates) return doc.contents;
			break;
		case DOC_TYPE_ALIGN:
		case DOC_TYPE_INDENT:
		case DOC_TYPE_INDENT_IF_BREAK:
		case DOC_TYPE_LINE_SUFFIX:
			if (!doc.contents) return "";
			break;
		case DOC_TYPE_IF_BREAK:
			if (!doc.flatContents && !doc.breakContents) return "";
			break;
		case DOC_TYPE_ARRAY: {
			const parts = [];
			for (const part of doc) {
				if (!part) continue;
				const [currentPart, ...restParts] = Array.isArray(part) ? part : [part];
				if (typeof currentPart === "string" && typeof method_at_default(0, parts, -1) === "string") parts[parts.length - 1] += currentPart;
				else parts.push(currentPart);
				parts.push(...restParts);
			}
			if (parts.length === 0) return "";
			if (parts.length === 1) return parts[0];
			return parts;
		}
		case DOC_TYPE_STRING:
		case DOC_TYPE_CURSOR:
		case DOC_TYPE_TRIM:
		case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
		case DOC_TYPE_LINE:
		case DOC_TYPE_LABEL:
		case DOC_TYPE_BREAK_PARENT: break;
		default: throw new invalid_doc_error_default(doc);
	}
	return doc;
}
function cleanDoc(doc) {
	return mapDoc(doc, (currentDoc) => cleanDocFn(currentDoc));
}
function replaceEndOfLine(doc, replacement = literalline$2) {
	return mapDoc(doc, (currentDoc) => typeof currentDoc === "string" ? join$2(replacement, currentDoc.split("\n")) : currentDoc);
}
function canBreakFn(doc) {
	if (doc.type === DOC_TYPE_LINE) return true;
}
function canBreak(doc) {
	return findInDoc(doc, canBreakFn, false);
}
var assertDoc = noop_default;
var assertDocArray = noop_default;
var assertDocFillParts = noop_default;
var assertAlignType = noop_default;
function indent$2(contents) {
	assertDoc(contents);
	return {
		type: DOC_TYPE_INDENT,
		contents
	};
}
function align(alignType, contents) {
	assertAlignType(alignType);
	assertDoc(contents);
	return {
		type: DOC_TYPE_ALIGN,
		contents,
		n: alignType
	};
}
function dedentToRoot$1(contents) {
	return align(Number.NEGATIVE_INFINITY, contents);
}
function markAsRoot(contents) {
	return align({ type: "root" }, contents);
}
function dedent(contents) {
	return align(-1, contents);
}
function addAlignmentToDoc(doc, size, tabWidth) {
	assertDoc(doc);
	let aligned = doc;
	if (size > 0) {
		for (let level = 0; level < Math.floor(size / tabWidth); ++level) aligned = indent$2(aligned);
		aligned = align(size % tabWidth, aligned);
		aligned = align(Number.NEGATIVE_INFINITY, aligned);
	}
	return aligned;
}
var breakParent = { type: DOC_TYPE_BREAK_PARENT };
var cursor = { type: DOC_TYPE_CURSOR };
function fill$1(parts) {
	assertDocFillParts(parts);
	return {
		type: DOC_TYPE_FILL,
		parts
	};
}
function group$2(contents, options = {}) {
	assertDoc(contents);
	assertDocArray(options.expandedStates, true);
	return {
		type: DOC_TYPE_GROUP,
		id: options.id,
		contents,
		break: Boolean(options.shouldBreak),
		expandedStates: options.expandedStates
	};
}
function conditionalGroup(states, options) {
	return group$2(states[0], {
		...options,
		expandedStates: states
	});
}
function ifBreak(breakContents, flatContents = "", options = {}) {
	assertDoc(breakContents);
	if (flatContents !== "") assertDoc(flatContents);
	return {
		type: DOC_TYPE_IF_BREAK,
		breakContents,
		flatContents,
		groupId: options.groupId
	};
}
function indentIfBreak(contents, options) {
	assertDoc(contents);
	return {
		type: DOC_TYPE_INDENT_IF_BREAK,
		contents,
		groupId: options.groupId,
		negate: options.negate
	};
}
function join$2(separator, docs) {
	assertDoc(separator);
	assertDocArray(docs);
	const parts = [];
	for (let i = 0; i < docs.length; i++) {
		if (i !== 0) parts.push(separator);
		parts.push(docs[i]);
	}
	return parts;
}
function label(label2, contents) {
	assertDoc(contents);
	return label2 ? {
		type: DOC_TYPE_LABEL,
		label: label2,
		contents
	} : contents;
}
var line$2 = { type: DOC_TYPE_LINE };
var softline$2 = {
	type: DOC_TYPE_LINE,
	soft: true
};
var hardlineWithoutBreakParent = {
	type: DOC_TYPE_LINE,
	hard: true
};
var hardline$2 = [hardlineWithoutBreakParent, breakParent];
var literallineWithoutBreakParent = {
	type: DOC_TYPE_LINE,
	hard: true,
	literal: true
};
var literalline$2 = [literallineWithoutBreakParent, breakParent];
function lineSuffix(contents) {
	assertDoc(contents);
	return {
		type: DOC_TYPE_LINE_SUFFIX,
		contents
	};
}
var lineSuffixBoundary = { type: DOC_TYPE_LINE_SUFFIX_BOUNDARY };
var trim = { type: DOC_TYPE_TRIM };
var stringReplaceAll = String.prototype.replaceAll ?? function(pattern, replacement) {
	if (pattern.global) return this.replace(pattern, replacement);
	return this.split(pattern).join(replacement);
};
var method_replace_all_default = /* @__PURE__ */ createMethodShim("replaceAll", function() {
	if (typeof this === "string") return stringReplaceAll;
});
var OPTION_CR = "cr";
var OPTION_CRLF = "crlf";
var CHARACTER_CR = "\r";
var CHARACTER_CRLF = "\r\n";
var DEFAULT_EOL = "\n";
function convertEndOfLineOptionToCharacter(endOfLineOption) {
	return endOfLineOption === OPTION_CR ? CHARACTER_CR : endOfLineOption === OPTION_CRLF ? CHARACTER_CRLF : DEFAULT_EOL;
}
var emoji_regex_default = () => {
	return /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
};
var fullwidthMinimalCodePoint = 12288;
var fullwidthMaximumCodePoint = 65510;
var fullwidthRanges = [
	12288,
	12288,
	65281,
	65376,
	65504,
	65510
];
var wideMinimalCodePoint = 4352;
var wideMaximumCodePoint = 262141;
var wideRanges = [
	4352,
	4447,
	8986,
	8987,
	9001,
	9002,
	9193,
	9196,
	9200,
	9200,
	9203,
	9203,
	9725,
	9726,
	9748,
	9749,
	9776,
	9783,
	9800,
	9811,
	9855,
	9855,
	9866,
	9871,
	9875,
	9875,
	9889,
	9889,
	9898,
	9899,
	9917,
	9918,
	9924,
	9925,
	9934,
	9934,
	9940,
	9940,
	9962,
	9962,
	9970,
	9971,
	9973,
	9973,
	9978,
	9978,
	9981,
	9981,
	9989,
	9989,
	9994,
	9995,
	10024,
	10024,
	10060,
	10060,
	10062,
	10062,
	10067,
	10069,
	10071,
	10071,
	10133,
	10135,
	10160,
	10160,
	10175,
	10175,
	11035,
	11036,
	11088,
	11088,
	11093,
	11093,
	11904,
	11929,
	11931,
	12019,
	12032,
	12245,
	12272,
	12287,
	12289,
	12350,
	12353,
	12438,
	12441,
	12543,
	12549,
	12591,
	12593,
	12686,
	12688,
	12773,
	12783,
	12830,
	12832,
	12871,
	12880,
	42124,
	42128,
	42182,
	43360,
	43388,
	44032,
	55203,
	63744,
	64255,
	65040,
	65049,
	65072,
	65106,
	65108,
	65126,
	65128,
	65131,
	94176,
	94180,
	94192,
	94198,
	94208,
	101589,
	101631,
	101662,
	101760,
	101874,
	110576,
	110579,
	110581,
	110587,
	110589,
	110590,
	110592,
	110882,
	110898,
	110898,
	110928,
	110930,
	110933,
	110933,
	110948,
	110951,
	110960,
	111355,
	119552,
	119638,
	119648,
	119670,
	126980,
	126980,
	127183,
	127183,
	127374,
	127374,
	127377,
	127386,
	127488,
	127490,
	127504,
	127547,
	127552,
	127560,
	127568,
	127569,
	127584,
	127589,
	127744,
	127776,
	127789,
	127797,
	127799,
	127868,
	127870,
	127891,
	127904,
	127946,
	127951,
	127955,
	127968,
	127984,
	127988,
	127988,
	127992,
	128062,
	128064,
	128064,
	128066,
	128252,
	128255,
	128317,
	128331,
	128334,
	128336,
	128359,
	128378,
	128378,
	128405,
	128406,
	128420,
	128420,
	128507,
	128591,
	128640,
	128709,
	128716,
	128716,
	128720,
	128722,
	128725,
	128728,
	128732,
	128735,
	128747,
	128748,
	128756,
	128764,
	128992,
	129003,
	129008,
	129008,
	129292,
	129338,
	129340,
	129349,
	129351,
	129535,
	129648,
	129660,
	129664,
	129674,
	129678,
	129734,
	129736,
	129736,
	129741,
	129756,
	129759,
	129770,
	129775,
	129784,
	131072,
	196605,
	196608,
	262141
];
var isInRange = (ranges, codePoint) => {
	let low = 0;
	let high = Math.floor(ranges.length / 2) - 1;
	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const i = mid * 2;
		if (codePoint < ranges[i]) high = mid - 1;
		else if (codePoint > ranges[i + 1]) low = mid + 1;
		else return true;
	}
	return false;
};
var commonCjkCodePoint = 19968;
var [wideFastPathStart, wideFastPathEnd] = /* @__PURE__ */ findWideFastPathRange(wideRanges);
function findWideFastPathRange(ranges) {
	let fastPathStart = ranges[0];
	let fastPathEnd = ranges[1];
	for (let index = 0; index < ranges.length; index += 2) {
		const start = ranges[index];
		const end = ranges[index + 1];
		if (commonCjkCodePoint >= start && commonCjkCodePoint <= end) return [start, end];
		if (end - start > fastPathEnd - fastPathStart) {
			fastPathStart = start;
			fastPathEnd = end;
		}
	}
	return [fastPathStart, fastPathEnd];
}
var isFullWidth = (codePoint) => {
	if (codePoint < fullwidthMinimalCodePoint || codePoint > fullwidthMaximumCodePoint) return false;
	return isInRange(fullwidthRanges, codePoint);
};
var isWide = (codePoint) => {
	if (codePoint >= wideFastPathStart && codePoint <= wideFastPathEnd) return true;
	if (codePoint < wideMinimalCodePoint || codePoint > wideMaximumCodePoint) return false;
	return isInRange(wideRanges, codePoint);
};
var narrowEmojiRegexp = /^(?:[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u2600-\u2604\u260E\u2611\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26B0\u26B1\u26C8\u26CF\u26D1\u26D3\u26E9\u26F0\u26F1\u26F4\u26F7\u26F8\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2763\u2764\u27A1\u2934\u2935\u2B05-\u2B07]|\uD83C[\uDD70\uDD71\uDD7E\uDD7F\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF3\uDFF5\uDFF7]|\uD83D[\uDC3F\uDC41\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3])$/;
var isNarrowEmojiCharacter = (character) => narrowEmojiRegexp.test(character);
var notAsciiRegex = /[^\x20-\x7F]/;
function getStringWidth(text) {
	if (!text) return 0;
	if (!notAsciiRegex.test(text)) return text.length;
	let width = 0;
	text = text.replace(emoji_regex_default(), (character) => {
		width += isNarrowEmojiCharacter(character) ? 1 : 2;
		return "";
	});
	for (const character of text) {
		const codePoint = character.codePointAt(0);
		if (codePoint <= 31 || codePoint >= 127 && codePoint <= 159) continue;
		if (codePoint >= 768 && codePoint <= 879) continue;
		if (codePoint >= 65024 && codePoint <= 65039) continue;
		width += isFullWidth(codePoint) || isWide(codePoint) ? 2 : 1;
	}
	return width;
}
var get_string_width_default = getStringWidth;
var INDENT_COMMAND_TYPE_INDENT = 0;
var INDENT_COMMAND_TYPE_DEDENT = 1;
var INDENT_COMMAND_TYPE_WIDTH = 2;
var INDENT_COMMAND_TYPE_STRING = 3;
var INDENT_COMMAND_INDENT = { type: INDENT_COMMAND_TYPE_INDENT };
var INDENT_COMMAND_DEDENT = { type: INDENT_COMMAND_TYPE_DEDENT };
var ROOT_INDENT = {
	value: "",
	length: 0,
	queue: [],
	get root() {
		return ROOT_INDENT;
	}
};
function generateIndent(indent2, command, options) {
	const queue = command.type === INDENT_COMMAND_TYPE_DEDENT ? indent2.queue.slice(0, -1) : [...indent2.queue, command];
	let value = "";
	let length = 0;
	let lastTabs = 0;
	let lastSpaces = 0;
	for (const command2 of queue) switch (command2.type) {
		case INDENT_COMMAND_TYPE_INDENT:
			flush();
			if (options.useTabs) addTabs(1);
			else addSpaces(options.tabWidth);
			break;
		case INDENT_COMMAND_TYPE_STRING: {
			const { string } = command2;
			flush();
			value += string;
			length += string.length;
			break;
		}
		case INDENT_COMMAND_TYPE_WIDTH: {
			const { width } = command2;
			lastTabs += 1;
			lastSpaces += width;
			break;
		}
		default: throw new Error(`Unexpected indent comment '${command2.type}'.`);
	}
	flushSpaces();
	return {
		...indent2,
		value,
		length,
		queue
	};
	function addTabs(count) {
		value += "	".repeat(count);
		length += options.tabWidth * count;
	}
	function addSpaces(count) {
		value += " ".repeat(count);
		length += count;
	}
	function flush() {
		if (options.useTabs) flushTabs();
		else flushSpaces();
	}
	function flushTabs() {
		if (lastTabs > 0) addTabs(lastTabs);
		resetLast();
	}
	function flushSpaces() {
		if (lastSpaces > 0) addSpaces(lastSpaces);
		resetLast();
	}
	function resetLast() {
		lastTabs = 0;
		lastSpaces = 0;
	}
}
function makeAlign(indent2, indentOptions, options) {
	if (!indentOptions) return indent2;
	if (indentOptions.type === "root") return {
		...indent2,
		root: indent2
	};
	if (indentOptions === Number.NEGATIVE_INFINITY) return indent2.root;
	let command;
	if (typeof indentOptions === "number") if (indentOptions < 0) command = INDENT_COMMAND_DEDENT;
	else command = {
		type: INDENT_COMMAND_TYPE_WIDTH,
		width: indentOptions
	};
	else command = {
		type: INDENT_COMMAND_TYPE_STRING,
		string: indentOptions
	};
	return generateIndent(indent2, command, options);
}
function makeIndent(indent2, options) {
	return generateIndent(indent2, INDENT_COMMAND_INDENT, options);
}
function getTrailingIndentionLength(text) {
	let length = 0;
	for (let index = text.length - 1; index >= 0; index--) {
		const character = text[index];
		if (character === " " || character === "	") length++;
		else break;
	}
	return length;
}
function trimIndentation(text) {
	const length = getTrailingIndentionLength(text);
	return {
		text: length === 0 ? text : text.slice(0, text.length - length),
		count: length
	};
}
var printResult = class {
	/** @type {string[]} */
	#settledTexts = [];
	#unsettledText = "";
	#settledTextLength = 0;
	/** @type {number[]} */
	#settledPositions = [];
	/** @type {number[]} */
	#unsettledPositions = [];
	#settle() {
		const text = this.#unsettledText;
		if (text !== "") {
			this.#settledTexts.push(text);
			this.#settledTextLength += text.length;
			this.#unsettledText = "";
		}
		for (const position of this.#unsettledPositions) this.#settledPositions.push(Math.min(position, this.#settledTextLength));
		this.#unsettledPositions.length = 0;
	}
	markPosition() {
		if (this.#settledPositions.length + this.#unsettledPositions.length >= 2) throw new Error("There are too many 'cursor' in doc.");
		this.#unsettledPositions.push(this.#settledTextLength + this.#unsettledText.length);
	}
	/**
	@param {string} text
	*/
	write(text) {
		this.#unsettledText += text;
	}
	trim() {
		const { text: trimmed, count } = trimIndentation(this.#unsettledText);
		this.#unsettledText = trimmed;
		this.#settle();
		return count;
	}
	finish() {
		this.#settle();
		return {
			text: this.#settledTexts.join(""),
			positions: this.#settledPositions
		};
	}
};
var print_result_default = printResult;
var MODE_BREAK = /* @__PURE__ */ Symbol("MODE_BREAK");
var MODE_FLAT = /* @__PURE__ */ Symbol("MODE_FLAT");
var DOC_FILL_PRINTED_LENGTH = /* @__PURE__ */ Symbol("DOC_FILL_PRINTED_LENGTH");
function fits(next, restCommands, remainingWidth, hasLineSuffix, groupModeMap, mustBeFlat) {
	if (remainingWidth === Number.POSITIVE_INFINITY) return true;
	let restCommandsIndex = restCommands.length;
	let hasPendingSpace = false;
	const commands = [next];
	let output = "";
	while (remainingWidth >= 0) {
		if (commands.length === 0) {
			if (restCommandsIndex === 0) return true;
			commands.push(restCommands[--restCommandsIndex]);
			continue;
		}
		const { mode, doc } = commands.pop();
		const docType = get_doc_type_default(doc);
		switch (docType) {
			case DOC_TYPE_STRING:
				if (doc) {
					if (hasPendingSpace) {
						output += " ";
						remainingWidth -= 1;
						hasPendingSpace = false;
					}
					output += doc;
					remainingWidth -= get_string_width_default(doc);
				}
				break;
			case DOC_TYPE_ARRAY:
			case DOC_TYPE_FILL: {
				const parts = docType === DOC_TYPE_ARRAY ? doc : doc.parts;
				const end = doc[DOC_FILL_PRINTED_LENGTH] ?? 0;
				for (let index = parts.length - 1; index >= end; index--) commands.push({
					mode,
					doc: parts[index]
				});
				break;
			}
			case DOC_TYPE_INDENT:
			case DOC_TYPE_ALIGN:
			case DOC_TYPE_INDENT_IF_BREAK:
			case DOC_TYPE_LABEL:
				commands.push({
					mode,
					doc: doc.contents
				});
				break;
			case DOC_TYPE_TRIM: {
				const { text, count } = trimIndentation(output);
				output = text;
				remainingWidth += count;
				break;
			}
			case DOC_TYPE_GROUP: {
				if (mustBeFlat && doc.break) return false;
				const groupMode = doc.break ? MODE_BREAK : mode;
				const contents = doc.expandedStates && groupMode === MODE_BREAK ? method_at_default(0, doc.expandedStates, -1) : doc.contents;
				commands.push({
					mode: groupMode,
					doc: contents
				});
				break;
			}
			case DOC_TYPE_IF_BREAK: {
				const contents = (doc.groupId ? groupModeMap[doc.groupId] || MODE_FLAT : mode) === MODE_BREAK ? doc.breakContents : doc.flatContents;
				if (contents) commands.push({
					mode,
					doc: contents
				});
				break;
			}
			case DOC_TYPE_LINE:
				if (mode === MODE_BREAK || doc.hard) return true;
				if (!doc.soft) hasPendingSpace = true;
				break;
			case DOC_TYPE_LINE_SUFFIX:
				hasLineSuffix = true;
				break;
			case DOC_TYPE_LINE_SUFFIX_BOUNDARY: if (hasLineSuffix) return false;
		}
	}
	return false;
}
function printDocToString(doc, options) {
	const groupModeMap = /* @__PURE__ */ Object.create(null);
	const width = options.printWidth;
	const newLine = convertEndOfLineOptionToCharacter(options.endOfLine);
	let position = 0;
	const commands = [{
		indent: ROOT_INDENT,
		mode: MODE_BREAK,
		doc
	}];
	let shouldRemeasure = false;
	const lineSuffix2 = [];
	const result = new print_result_default();
	propagateBreaks(doc);
	while (commands.length > 0) {
		const { indent: indent2, mode, doc: doc2 } = commands.pop();
		switch (get_doc_type_default(doc2)) {
			case DOC_TYPE_STRING: {
				const formatted2 = newLine !== "\n" ? method_replace_all_default(0, doc2, "\n", newLine) : doc2;
				if (formatted2) {
					result.write(formatted2);
					if (commands.length > 0) position += get_string_width_default(formatted2);
				}
				break;
			}
			case DOC_TYPE_ARRAY:
				for (let index = doc2.length - 1; index >= 0; index--) commands.push({
					indent: indent2,
					mode,
					doc: doc2[index]
				});
				break;
			case DOC_TYPE_CURSOR:
				result.markPosition();
				break;
			case DOC_TYPE_INDENT:
				commands.push({
					indent: makeIndent(indent2, options),
					mode,
					doc: doc2.contents
				});
				break;
			case DOC_TYPE_ALIGN:
				commands.push({
					indent: makeAlign(indent2, doc2.n, options),
					mode,
					doc: doc2.contents
				});
				break;
			case DOC_TYPE_TRIM:
				position -= result.trim();
				break;
			case DOC_TYPE_GROUP: {
				const command = (function printGroup() {
					if (mode === MODE_FLAT && !shouldRemeasure) return {
						indent: indent2,
						mode: doc2.break ? MODE_BREAK : MODE_FLAT,
						doc: doc2.contents
					};
					shouldRemeasure = false;
					const remainingWidth = width - position;
					const hasLineSuffix = lineSuffix2.length > 0;
					const flatCommand = {
						indent: indent2,
						mode: MODE_FLAT,
						doc: doc2.contents
					};
					if (!doc2.break && fits(flatCommand, commands, remainingWidth, hasLineSuffix, groupModeMap)) return flatCommand;
					if (!doc2.expandedStates) return {
						indent: indent2,
						mode: MODE_BREAK,
						doc: doc2.contents
					};
					if (!doc2.break) for (let index = 1; index < doc2.expandedStates.length - 1; index++) {
						const flatCommand2 = {
							indent: indent2,
							mode: MODE_FLAT,
							doc: doc2.expandedStates[index]
						};
						if (fits(flatCommand2, commands, remainingWidth, hasLineSuffix, groupModeMap)) return flatCommand2;
					}
					return {
						indent: indent2,
						mode: MODE_BREAK,
						doc: method_at_default(0, doc2.expandedStates, -1)
					};
				})();
				commands.push(command);
				if (doc2.id) groupModeMap[doc2.id] = command.mode;
				break;
			}
			case DOC_TYPE_FILL: {
				const remainingWidth = width - position;
				const offset = doc2[DOC_FILL_PRINTED_LENGTH] ?? 0;
				const { parts } = doc2;
				const length = parts.length - offset;
				if (length === 0) break;
				const content = parts[offset + 0];
				const whitespace = parts[offset + 1];
				const contentFlatCommand = {
					indent: indent2,
					mode: MODE_FLAT,
					doc: content
				};
				const contentBreakCommand = {
					indent: indent2,
					mode: MODE_BREAK,
					doc: content
				};
				const contentFits = fits(contentFlatCommand, [], remainingWidth, lineSuffix2.length > 0, groupModeMap, true);
				if (length === 1) {
					if (contentFits) commands.push(contentFlatCommand);
					else commands.push(contentBreakCommand);
					break;
				}
				const whitespaceFlatCommand = {
					indent: indent2,
					mode: MODE_FLAT,
					doc: whitespace
				};
				const whitespaceBreakCommand = {
					indent: indent2,
					mode: MODE_BREAK,
					doc: whitespace
				};
				if (length === 2) {
					if (contentFits) commands.push(whitespaceFlatCommand, contentFlatCommand);
					else commands.push(whitespaceBreakCommand, contentBreakCommand);
					break;
				}
				const secondContent = parts[offset + 2];
				const remainingCommand = {
					indent: indent2,
					mode,
					doc: {
						...doc2,
						[DOC_FILL_PRINTED_LENGTH]: offset + 2
					}
				};
				const firstAndSecondContentFits = fits({
					indent: indent2,
					mode: MODE_FLAT,
					doc: [
						content,
						whitespace,
						secondContent
					]
				}, [], remainingWidth, lineSuffix2.length > 0, groupModeMap, true);
				commands.push(remainingCommand);
				if (firstAndSecondContentFits) commands.push(whitespaceFlatCommand, contentFlatCommand);
				else if (contentFits) commands.push(whitespaceBreakCommand, contentFlatCommand);
				else commands.push(whitespaceBreakCommand, contentBreakCommand);
				break;
			}
			case DOC_TYPE_IF_BREAK:
			case DOC_TYPE_INDENT_IF_BREAK: {
				const groupMode = doc2.groupId ? groupModeMap[doc2.groupId] : mode;
				if (groupMode === MODE_BREAK) {
					const breakContents = doc2.type === DOC_TYPE_IF_BREAK ? doc2.breakContents : doc2.negate ? doc2.contents : indent$2(doc2.contents);
					if (breakContents) commands.push({
						indent: indent2,
						mode,
						doc: breakContents
					});
				}
				if (groupMode === MODE_FLAT) {
					const flatContents = doc2.type === DOC_TYPE_IF_BREAK ? doc2.flatContents : doc2.negate ? indent$2(doc2.contents) : doc2.contents;
					if (flatContents) commands.push({
						indent: indent2,
						mode,
						doc: flatContents
					});
				}
				break;
			}
			case DOC_TYPE_LINE_SUFFIX:
				lineSuffix2.push({
					indent: indent2,
					mode,
					doc: doc2.contents
				});
				break;
			case DOC_TYPE_LINE_SUFFIX_BOUNDARY:
				if (lineSuffix2.length > 0) commands.push({
					indent: indent2,
					mode,
					doc: hardlineWithoutBreakParent
				});
				break;
			case DOC_TYPE_LINE:
				switch (mode) {
					case MODE_FLAT:
						if (!doc2.hard) {
							if (!doc2.soft) {
								result.write(" ");
								position += 1;
							}
							break;
						}
						shouldRemeasure = true;
					case MODE_BREAK:
						if (lineSuffix2.length > 0) {
							commands.push({
								indent: indent2,
								mode,
								doc: doc2
							}, ...lineSuffix2.reverse());
							lineSuffix2.length = 0;
							break;
						}
						if (doc2.literal) {
							result.write(newLine);
							position = 0;
							if (indent2.root) {
								if (indent2.root.value) result.write(indent2.root.value);
								position = indent2.root.length;
							}
						} else {
							result.trim();
							result.write(newLine + indent2.value);
							position = indent2.length;
						}
				}
				break;
			case DOC_TYPE_LABEL:
				commands.push({
					indent: indent2,
					mode,
					doc: doc2.contents
				});
				break;
			case DOC_TYPE_BREAK_PARENT: break;
			default: throw new invalid_doc_error_default(doc2);
		}
		if (commands.length === 0 && lineSuffix2.length > 0) {
			commands.push(...lineSuffix2.reverse());
			lineSuffix2.length = 0;
		}
	}
	const { text: formatted, positions: cursorPositions } = result.finish();
	if (cursorPositions.length !== 2) return { formatted };
	const [cursorNodeStart, cursorNodeEnd] = cursorPositions;
	return {
		formatted,
		cursorNodeStart,
		cursorNodeText: formatted.slice(cursorNodeStart, cursorNodeEnd)
	};
}
var builders = {
	join: join$2,
	line: line$2,
	softline: softline$2,
	hardline: hardline$2,
	literalline: literalline$2,
	group: group$2,
	conditionalGroup,
	fill: fill$1,
	lineSuffix,
	lineSuffixBoundary,
	cursor,
	breakParent,
	ifBreak,
	trim,
	indent: indent$2,
	indentIfBreak,
	align,
	addAlignmentToDoc,
	markAsRoot,
	dedentToRoot: dedentToRoot$1,
	dedent,
	hardlineWithoutBreakParent,
	literallineWithoutBreakParent,
	label,
	concat: (parts) => parts
};
var printer$1 = { printDocToString };
var utils = {
	willBreak,
	traverseDoc: traverse_doc_default,
	findInDoc,
	mapDoc,
	removeLines,
	stripTrailingHardline,
	replaceEndOfLine,
	canBreak
};
//#endregion
//#region ../../node_modules/.pnpm/@prettier+plugin-xml@3.4.2_prettier@3.9.6/node_modules/@prettier/plugin-xml/src/embed.js
var { dedentToRoot, group: group$1, hardline: hardline$1, indent: indent$1, join: join$1, line: line$1, literalline: literalline$1, softline: softline$1 } = builders;
function getElementTags(path, opts, print) {
	const { OPEN, Name, attribute, START_CLOSE, SLASH_OPEN, END_NAME, END } = path.getValue();
	const parts = [OPEN, Name];
	if (attribute.length > 0) parts.push(indent$1([line$1, join$1(line$1, path.map(print, "attribute"))]));
	if (!opts.bracketSameLine) parts.push(softline$1);
	return {
		openTag: group$1([...parts, START_CLOSE]),
		closeTag: group$1([
			SLASH_OPEN,
			END_NAME,
			END
		])
	};
}
function getTagType(attributes) {
	for (const attribute of attributes) if (attribute.Name === "type") {
		const value = attribute.STRING;
		if (value.startsWith("\"text/") && value.endsWith("\"")) return value.slice(6, -1);
	}
	return null;
}
function getParser(node, opts) {
	const { Name, attribute } = node;
	let parser = Name.toLowerCase();
	if (parser === "xml") return null;
	if ((parser === "style" || parser === "script") && attribute.length > 0) parser = getTagType(attribute);
	if (parser === "javascript") parser = "babel";
	if (opts.plugins.some((plugin) => typeof plugin !== "string" && plugin.parsers && Object.prototype.hasOwnProperty.call(plugin.parsers, parser))) return parser;
	return null;
}
function getSource(content) {
	return content.chardata.map((node) => {
		const { SEA_WS, TEXT } = node;
		const image = SEA_WS || TEXT;
		return {
			offset: node.location.startOffset,
			printed: image
		};
	}).sort(({ offset }) => offset).map(({ printed }) => printed).join("");
}
function embed(path, opts) {
	const node = path.getValue();
	if (node.name !== "element") return;
	const parser = getParser(node, opts);
	if (!parser) return;
	if (!node.content) return;
	const content = node.content;
	if (content.chardata.length === 0 || content.CData.length > 0 || content.Comment.length > 0 || content.element.length > 0 || content.PROCESSING_INSTRUCTION.length > 0 || content.reference.length > 0) return;
	return async function(textToDoc, print) {
		const { openTag, closeTag } = getElementTags(path, opts, print);
		const docNode = await textToDoc(getSource(content), { parser });
		return group$1([
			openTag,
			literalline$1,
			dedentToRoot(utils.replaceEndOfLine(docNode)),
			hardline$1,
			closeTag
		]);
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@prettier+plugin-xml@3.4.2_prettier@3.9.6/node_modules/@prettier/plugin-xml/src/printer.js
var { fill, group, hardline, indent, join, line, literalline, softline } = builders;
var ignoreStartComment = "<!-- prettier-ignore-start -->";
var ignoreEndComment = "<!-- prettier-ignore-end -->";
function hasIgnoreRanges(comments) {
	if (comments.length === 0) return false;
	comments.sort((left, right) => left.startOffset - right.startOffset);
	let startFound = false;
	for (let idx = 0; idx < comments.length; idx += 1) if (comments[idx].image === ignoreStartComment) startFound = true;
	else if (startFound && comments[idx].image === ignoreEndComment) return true;
	return false;
}
function isWhitespaceIgnorable(opts, name, attributes, content) {
	if (opts.xmlWhitespaceSensitivity === "strict") return false;
	if (name === "xsl:text") return false;
	if (attributes.some((attribute) => attribute && attribute.Name === "xml:space" && attribute.STRING.slice(1, -1) === "preserve")) return false;
	if (content.CData.length > 0) return false;
	if (hasIgnoreRanges(content.Comment)) return false;
	return true;
}
function printIToken(path) {
	const node = path.getValue();
	return {
		offset: node.startOffset,
		startLine: node.startLine,
		endLine: node.endLine,
		printed: node.image
	};
}
function printAttribute(path, opts, print) {
	const { Name, EQUALS, STRING } = path.getValue();
	let attributeValue;
	if (opts.xmlQuoteAttributes === "double") attributeValue = `"${STRING.slice(1, -1).replaceAll("\"", "&quot;")}"`;
	else if (opts.xmlQuoteAttributes === "single") attributeValue = `'${STRING.slice(1, -1).replaceAll("'", "&apos;")}'`;
	else attributeValue = STRING;
	return [
		Name,
		EQUALS,
		attributeValue
	];
}
function printCharData(path, opts, print) {
	const { SEA_WS, TEXT } = path.getValue();
	return (SEA_WS || TEXT).split(/(\n)/g).map((value, index) => index % 2 === 0 ? value : literalline);
}
function printContentFragments(path, print) {
	return [
		...path.map(printIToken, "CData"),
		...path.map(printIToken, "Comment"),
		...path.map((charDataPath) => ({
			offset: charDataPath.getValue().location.startOffset,
			printed: print(charDataPath)
		}), "chardata"),
		...path.map((elementPath) => ({
			offset: elementPath.getValue().location.startOffset,
			printed: print(elementPath)
		}), "element"),
		...path.map(printIToken, "PROCESSING_INSTRUCTION"),
		...path.map((referencePath) => {
			return {
				offset: referencePath.getValue().location.startOffset,
				printed: print(referencePath)
			};
		}, "reference")
	];
}
function printContent(path, opts, print) {
	let fragments = printContentFragments(path, print);
	const { Comment } = path.getValue();
	if (hasIgnoreRanges(Comment)) {
		Comment.sort((left, right) => left.startOffset - right.startOffset);
		const ignoreRanges = [];
		let ignoreStart = null;
		Comment.forEach((comment) => {
			if (comment.image === ignoreStartComment) ignoreStart = comment;
			else if (ignoreStart && comment.image === ignoreEndComment) {
				ignoreRanges.push({
					start: ignoreStart.startOffset,
					end: comment.endOffset
				});
				ignoreStart = null;
			}
		});
		fragments = fragments.filter((fragment) => ignoreRanges.every(({ start, end }) => fragment.offset < start || fragment.offset > end));
		ignoreRanges.forEach(({ start, end }) => {
			const content = opts.originalText.slice(start, end + 1);
			fragments.push({
				offset: start,
				printed: utils.replaceEndOfLine(content)
			});
		});
	}
	fragments.sort((left, right) => left.offset - right.offset);
	return group(fragments.map(({ printed }) => printed));
}
function printDocTypeDecl(path, opts, print) {
	const { DocType, Name, externalID, CLOSE } = path.getValue();
	const parts = [
		DocType,
		" ",
		Name
	];
	if (externalID) parts.push(" ", path.call(print, "externalID"));
	return group([...parts, CLOSE]);
}
function printDocument(path, opts, print) {
	const { docTypeDecl, element, misc, prolog } = path.getValue();
	const fragments = [];
	if (docTypeDecl) fragments.push({
		offset: docTypeDecl.location.startOffset,
		printed: path.call(print, "docTypeDecl")
	});
	if (prolog) fragments.push({
		offset: prolog.location.startOffset,
		printed: path.call(print, "prolog")
	});
	path.each((miscPath) => {
		const misc = miscPath.getValue();
		fragments.push({
			offset: misc.location.startOffset,
			printed: print(miscPath)
		});
	}, "misc");
	if (element) fragments.push({
		offset: element.location.startOffset,
		printed: path.call(print, "element")
	});
	fragments.sort((left, right) => left.offset - right.offset);
	return [join(hardline, fragments.map(({ printed }) => printed)), hardline];
}
function printCharDataPreserve(path, print) {
	let prevLocation;
	const response = [];
	path.each((charDataPath) => {
		const location = charDataPath.getValue().location;
		const content = print(charDataPath);
		if (prevLocation && location.startColumn && prevLocation.endColumn && location.startLine === prevLocation.endLine && location.startColumn === prevLocation.endColumn + 1) {
			const prevFragment = response[response.length - 1];
			prevFragment.endLine = location.endLine;
			prevFragment.printed = group([prevFragment.printed, content]);
		} else response.push({
			offset: location.startOffset,
			startLine: location.startLine,
			endLine: location.endLine,
			printed: content,
			whitespace: true
		});
		prevLocation = location;
	}, "chardata");
	return response;
}
function printCharDataIgnore(path) {
	const response = [];
	path.each((charDataPath) => {
		const chardata = charDataPath.getValue();
		if (!chardata.TEXT) return;
		const printed = group(chardata.TEXT.replaceAll(/^[\t\n\r\s]+|[\t\n\r\s]+$/g, "").split(/(\n)/g).map((value) => {
			if (value === "\n") return literalline;
			return fill(value.split(/\b( +)\b/g).map((segment, index) => index % 2 === 0 ? segment : line));
		}));
		const location = chardata.location;
		response.push({
			offset: location.startOffset,
			startLine: location.startLine,
			endLine: location.endLine,
			printed
		});
	}, "chardata");
	return response;
}
function printElementFragments(path, opts, print) {
	const children = path.getValue();
	let response = [];
	response = response.concat(path.map(printIToken, "Comment"));
	if (children.chardata.length > 0) if (children.chardata.some((chardata) => !!chardata.TEXT) && opts.xmlWhitespaceSensitivity === "preserve") response = response.concat(printCharDataPreserve(path, print));
	else response = response.concat(printCharDataIgnore(path, print));
	response = response.concat(path.map((elementPath) => {
		const location = elementPath.getValue().location;
		return {
			offset: location.startOffset,
			startLine: location.startLine,
			endLine: location.endLine,
			printed: print(elementPath)
		};
	}, "element"));
	response = response.concat(path.map(printIToken, "PROCESSING_INSTRUCTION"));
	response = response.concat(path.map((referencePath) => {
		const referenceNode = referencePath.getValue();
		return {
			type: "reference",
			offset: referenceNode.location.startOffset,
			startLine: referenceNode.location.startLine,
			endLine: referenceNode.location.endLine,
			printed: print(referencePath)
		};
	}, "reference"));
	return response;
}
function printElement(path, opts, print) {
	const { OPEN, Name, attribute, START_CLOSE, content, SLASH_OPEN, END_NAME, END, SLASH_CLOSE } = path.getValue();
	const parts = [OPEN, Name];
	if (attribute.length > 0) {
		const attributes = path.map((attributePath) => ({
			node: attributePath.getValue(),
			printed: print(attributePath)
		}), "attribute");
		if (opts.xmlSortAttributesByKey) attributes.sort((left, right) => {
			const leftAttr = left.node.Name;
			const rightAttr = right.node.Name;
			if (leftAttr === "xmlns") return -1;
			if (rightAttr === "xmlns") return 1;
			if (leftAttr.includes(":") && rightAttr.includes(":")) {
				const [leftNS, leftKey] = leftAttr.split(":");
				const [rightNS, rightKey] = rightAttr.split(":");
				if (leftNS === rightNS) return leftKey.localeCompare(rightKey);
				if (leftNS === "xmlns") return -1;
				if (rightNS === "xmlns") return 1;
				return leftNS.localeCompare(rightNS);
			}
			if (leftAttr.includes(":")) return -1;
			if (rightAttr.includes(":")) return 1;
			return leftAttr.localeCompare(rightAttr);
		});
		const separator = opts.singleAttributePerLine ? hardline : line;
		parts.push(indent([line, join(separator, attributes.map(({ printed }) => printed))]));
	}
	let space;
	if (opts.bracketSameLine) space = opts.xmlSelfClosingSpace ? " " : "";
	else space = opts.xmlSelfClosingSpace ? line : softline;
	if (SLASH_CLOSE) return group([
		...parts,
		space,
		SLASH_CLOSE
	]);
	if (content.chardata.length === 0 && content.CData.length === 0 && content.Comment.length === 0 && content.element.length === 0 && content.PROCESSING_INSTRUCTION.length === 0 && content.reference.length === 0) return group([
		...parts,
		space,
		"/>"
	]);
	const openTag = group([
		...parts,
		opts.bracketSameLine ? "" : softline,
		START_CLOSE
	]);
	const closeTag = group([
		SLASH_OPEN,
		END_NAME,
		END
	]);
	if (isWhitespaceIgnorable(opts, Name, attribute, content)) {
		const fragments = path.call((childrenPath) => printElementFragments(childrenPath, opts, print), "content");
		fragments.sort((left, right) => left.offset - right.offset);
		if (opts.xmlWhitespaceSensitivity === "preserve" && fragments.some(({ whitespace }) => whitespace)) return group([
			openTag,
			fragments.map(({ printed }) => printed),
			closeTag
		]);
		if (fragments.length === 0) return group([
			...parts,
			space,
			"/>"
		]);
		if (fragments.length === 1 && content.chardata.filter((chardata) => chardata.TEXT).length === 1) return group([
			openTag,
			indent([softline, fragments[0].printed]),
			softline,
			closeTag
		]);
		let delimiter = hardline;
		if (fragments.length === content.chardata.filter((chardata) => chardata.TEXT).length + content.reference.length) delimiter = " ";
		const docs = [hardline];
		let lastLine = fragments[0].startLine;
		fragments.forEach((node, index) => {
			if (index !== 0) if (node.startLine - lastLine >= 2) docs.push(hardline, hardline);
			else docs.push(delimiter);
			docs.push(node.printed);
			lastLine = node.endLine;
		});
		return group([
			openTag,
			indent(docs),
			hardline,
			closeTag
		]);
	}
	return group([
		openTag,
		indent(path.call(print, "content")),
		closeTag
	]);
}
function printExternalID(path, opts, print) {
	const { Public, PubIDLiteral, System, SystemLiteral } = path.getValue();
	if (System) return group([System, indent([line, SystemLiteral])]);
	return group([group([Public, indent([line, PubIDLiteral])]), indent([line, SystemLiteral])]);
}
function printMisc(path, opts, print) {
	const { Comment, PROCESSING_INSTRUCTION, SEA_WS } = path.getValue();
	return Comment || PROCESSING_INSTRUCTION || SEA_WS;
}
function printProlog(path, opts, print) {
	const { XMLDeclOpen, attribute, SPECIAL_CLOSE } = path.getValue();
	const parts = [XMLDeclOpen];
	if (attribute) parts.push(indent([softline, join(line, path.map(print, "attribute"))]));
	return group([
		...parts,
		opts.xmlSelfClosingSpace ? line : softline,
		SPECIAL_CLOSE
	]);
}
function printReference(path, opts, print) {
	const { CharRef, EntityRef } = path.getValue();
	return CharRef || EntityRef;
}
//#endregion
//#region ../../node_modules/.pnpm/@prettier+plugin-xml@3.4.2_prettier@3.9.6/node_modules/@prettier/plugin-xml/src/plugin.js
var plugin = {
	languages: languages_default,
	parsers: { xml: parser },
	printers: { xml: {
		getVisitorKeys(node, nonTraversableKeys) {
			return Object.keys(node).filter((key) => key !== "location" && key !== "tokenType");
		},
		embed,
		print(path, opts, print) {
			const node = path.getValue();
			switch (node.name) {
				case "attribute": return printAttribute(path, opts, print);
				case "chardata": return printCharData(path, opts, print);
				case "content": return printContent(path, opts, print);
				case "docTypeDecl": return printDocTypeDecl(path, opts, print);
				case "document": return printDocument(path, opts, print);
				case "element": return printElement(path, opts, print);
				case "externalID": return printExternalID(path, opts, print);
				case "misc": return printMisc(path, opts, print);
				case "prolog": return printProlog(path, opts, print);
				case "reference": return printReference(path, opts, print);
				default: throw new Error(`Unknown node type: ${node.name}`);
			}
		}
	} },
	options: {
		xmlSelfClosingSpace: {
			type: "boolean",
			category: "XML",
			default: true,
			description: "Adds a space before self-closing tags.",
			since: "1.1.0"
		},
		xmlWhitespaceSensitivity: {
			type: "choice",
			category: "XML",
			default: "strict",
			description: "How to handle whitespaces in XML.",
			choices: [
				{
					value: "strict",
					description: "Whitespaces are considered sensitive in all elements."
				},
				{
					value: "preserve",
					description: "Whitespaces within text nodes in XML elements and attributes are considered sensitive."
				},
				{
					value: "ignore",
					description: "Whitespaces are considered insensitive in all elements."
				}
			],
			since: "0.6.0"
		},
		xmlSortAttributesByKey: {
			type: "boolean",
			category: "XML",
			default: false,
			description: "Orders XML attributes by key alphabetically while prioritizing xmlns attributes."
		},
		xmlQuoteAttributes: {
			type: "choice",
			category: "XML",
			default: "preserve",
			description: "How to handle whitespaces in XML.",
			choices: [
				{
					value: "preserve",
					description: "Quotes in attribute values will be preserved as written."
				},
				{
					value: "single",
					description: "Quotes in attribute values will be converted to consistent single quotes and other quotes in the string will be escaped."
				},
				{
					value: "double",
					description: "Quotes in attribute values will be converted to consistent double quotes and other quotes in the string will be escaped."
				}
			]
		}
	},
	defaultOptions: {
		printWidth: 80,
		tabWidth: 2
	}
};
//#endregion
export { plugin as default };
