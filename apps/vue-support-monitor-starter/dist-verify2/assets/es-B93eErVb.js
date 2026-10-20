import { o as __toESM, r as __exportAll, t as __commonJSMin } from "./rolldown-runtime-CEgmsyvS.js";
import { B as h, fn as markRaw, gn as reactive, k as defineComponent, u as Teleport } from "./runtime-core.esm-bundler-DDQHILLo.js";
import { i as createApp } from "./runtime-dom.esm-bundler-RRl39S3n.js";
import { i as baseGetTag, n as isSymbol, r as isObjectLike, t as isObject } from "./isObject-CBh4bHyD.js";
import { _ as isArray, i as toString, v as arrayMap } from "./_baseGet-DmmfCxUg.js";
import { a as apply$1, o as identity, t as baseFlatten } from "./_baseFlatten-D6objHuc.js";
import { h as baseUnary } from "./_Uint8Array-Cf2dnQh6.js";
import { t as baseClone } from "./_baseClone-CR0xuNh7.js";
import { i as arrayIncludes, n as baseUniq, r as arrayIncludesWith, t as union } from "./union-CKG0-ouI.js";
import { t as baseIteratee } from "./_baseIteratee-0zvAcVIj.js";
import { r as baseAssignValue } from "./_baseSet-CMSvwkCM.js";
import { n as baseRest, t as isArrayLikeObject } from "./isArrayLikeObject-CeWRLNuC.js";
import { i as createAssigner, r as baseMerge, t as merge } from "./merge-DIljS_69.js";
import { t as isPlainObject } from "./isPlainObject-CmtvaEIG.js";
import { t as baseSlice } from "./_baseSlice-CS6dHRAG.js";
import { a as defaults$3, i as has, n as max, o as hasUnicode, t as sortBy } from "./sortBy-BKBwN3Oc.js";
import { n as arrayReduce, t as isEmpty } from "./isEmpty-DZzpJqft.js";
import { t as clamp } from "./clamp--xaQdoQg.js";
import { t as cloneDeep } from "./cloneDeep-BJ4zGpri.js";
import { i as SetCache, r as cacheHas } from "./_baseIsEqual-4zTScXwg.js";
import { t as baseEach } from "./_baseEach-CPGfeQSN.js";
import { t as debounce$1 } from "./debounce-DfrQLO3V.js";
import { t as isEqual } from "./isEqual-BgqgQyvI.js";
import { t as pick } from "./pick-BwGnaelS.js";
import { t as throttle } from "./throttle-DxY_k3Za.js";
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_castSlice.js
/**
* Casts `array` to a slice if it's needed.
*
* @private
* @param {Array} array The array to inspect.
* @param {number} start The start position.
* @param {number} [end=array.length] The end position.
* @returns {Array} Returns the cast slice.
*/
function castSlice(array, start, end) {
	var length = array.length;
	end = end === void 0 ? length : end;
	return !start && end >= length ? array : baseSlice(array, start, end);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_asciiToArray.js
/**
* Converts an ASCII `string` to an array.
*
* @private
* @param {string} string The string to convert.
* @returns {Array} Returns the converted array.
*/
function asciiToArray(string) {
	return string.split("");
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_unicodeToArray.js
/** Used to compose unicode character classes. */
var rsAstralRange$1 = "\\ud800-\\udfff";
var rsComboRange$1 = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff";
var rsVarRange$1 = "\\ufe0e\\ufe0f";
/** Used to compose unicode capture groups. */
var rsAstral = "[" + rsAstralRange$1 + "]";
var rsCombo$1 = "[" + rsComboRange$1 + "]";
var rsFitz = "\\ud83c[\\udffb-\\udfff]";
var rsModifier$1 = "(?:" + rsCombo$1 + "|" + rsFitz + ")";
var rsNonAstral$1 = "[^" + rsAstralRange$1 + "]";
var rsRegional$1 = "(?:\\ud83c[\\udde6-\\uddff]){2}";
var rsSurrPair$1 = "[\\ud800-\\udbff][\\udc00-\\udfff]";
var rsZWJ$1 = "\\u200d";
/** Used to compose unicode regexes. */
var reOptMod$1 = rsModifier$1 + "?";
var rsOptVar$1 = "[" + rsVarRange$1 + "]?";
var rsOptJoin$1 = "(?:" + rsZWJ$1 + "(?:" + [
	rsNonAstral$1,
	rsRegional$1,
	rsSurrPair$1
].join("|") + ")" + rsOptVar$1 + reOptMod$1 + ")*";
var rsSeq$1 = rsOptVar$1 + reOptMod$1 + rsOptJoin$1;
var rsSymbol = "(?:" + [
	rsNonAstral$1 + rsCombo$1 + "?",
	rsCombo$1,
	rsRegional$1,
	rsSurrPair$1,
	rsAstral
].join("|") + ")";
/** Used to match [string symbols](https://mathiasbynens.be/notes/javascript-unicode). */
var reUnicode = RegExp(rsFitz + "(?=" + rsFitz + ")|" + rsSymbol + rsSeq$1, "g");
/**
* Converts a Unicode `string` to an array.
*
* @private
* @param {string} string The string to convert.
* @returns {Array} Returns the converted array.
*/
function unicodeToArray(string) {
	return string.match(reUnicode) || [];
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_stringToArray.js
/**
* Converts `string` to an array.
*
* @private
* @param {string} string The string to convert.
* @returns {Array} Returns the converted array.
*/
function stringToArray(string) {
	return hasUnicode(string) ? unicodeToArray(string) : asciiToArray(string);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_createCaseFirst.js
/**
* Creates a function like `_.lowerFirst`.
*
* @private
* @param {string} methodName The name of the `String` case method to use.
* @returns {Function} Returns the new case function.
*/
function createCaseFirst(methodName) {
	return function(string) {
		string = toString(string);
		var strSymbols = hasUnicode(string) ? stringToArray(string) : void 0;
		var chr = strSymbols ? strSymbols[0] : string.charAt(0);
		var trailing = strSymbols ? castSlice(strSymbols, 1).join("") : string.slice(1);
		return chr[methodName]() + trailing;
	};
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/upperFirst.js
/**
* Converts the first character of `string` to upper case.
*
* @static
* @memberOf _
* @since 4.0.0
* @category String
* @param {string} [string=''] The string to convert.
* @returns {string} Returns the converted string.
* @example
*
* _.upperFirst('fred');
* // => 'Fred'
*
* _.upperFirst('FRED');
* // => 'FRED'
*/
var upperFirst = createCaseFirst("toUpperCase");
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/capitalize.js
/**
* Converts the first character of `string` to upper case and the remaining
* to lower case.
*
* @static
* @memberOf _
* @since 3.0.0
* @category String
* @param {string} [string=''] The string to capitalize.
* @returns {string} Returns the capitalized string.
* @example
*
* _.capitalize('FRED');
* // => 'Fred'
*/
function capitalize(string) {
	return upperFirst(toString(string).toLowerCase());
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_basePropertyOf.js
/**
* The base implementation of `_.propertyOf` without support for deep paths.
*
* @private
* @param {Object} object The object to query.
* @returns {Function} Returns the new accessor function.
*/
function basePropertyOf(object) {
	return function(key) {
		return object == null ? void 0 : object[key];
	};
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_deburrLetter.js
/**
* Used by `_.deburr` to convert Latin-1 Supplement and Latin Extended-A
* letters to basic Latin letters.
*
* @private
* @param {string} letter The matched letter to deburr.
* @returns {string} Returns the deburred letter.
*/
var deburrLetter = basePropertyOf({
	"À": "A",
	"Á": "A",
	"Â": "A",
	"Ã": "A",
	"Ä": "A",
	"Å": "A",
	"à": "a",
	"á": "a",
	"â": "a",
	"ã": "a",
	"ä": "a",
	"å": "a",
	"Ç": "C",
	"ç": "c",
	"Ð": "D",
	"ð": "d",
	"È": "E",
	"É": "E",
	"Ê": "E",
	"Ë": "E",
	"è": "e",
	"é": "e",
	"ê": "e",
	"ë": "e",
	"Ì": "I",
	"Í": "I",
	"Î": "I",
	"Ï": "I",
	"ì": "i",
	"í": "i",
	"î": "i",
	"ï": "i",
	"Ñ": "N",
	"ñ": "n",
	"Ò": "O",
	"Ó": "O",
	"Ô": "O",
	"Õ": "O",
	"Ö": "O",
	"Ø": "O",
	"ò": "o",
	"ó": "o",
	"ô": "o",
	"õ": "o",
	"ö": "o",
	"ø": "o",
	"Ù": "U",
	"Ú": "U",
	"Û": "U",
	"Ü": "U",
	"ù": "u",
	"ú": "u",
	"û": "u",
	"ü": "u",
	"Ý": "Y",
	"ý": "y",
	"ÿ": "y",
	"Æ": "Ae",
	"æ": "ae",
	"Þ": "Th",
	"þ": "th",
	"ß": "ss",
	"Ā": "A",
	"Ă": "A",
	"Ą": "A",
	"ā": "a",
	"ă": "a",
	"ą": "a",
	"Ć": "C",
	"Ĉ": "C",
	"Ċ": "C",
	"Č": "C",
	"ć": "c",
	"ĉ": "c",
	"ċ": "c",
	"č": "c",
	"Ď": "D",
	"Đ": "D",
	"ď": "d",
	"đ": "d",
	"Ē": "E",
	"Ĕ": "E",
	"Ė": "E",
	"Ę": "E",
	"Ě": "E",
	"ē": "e",
	"ĕ": "e",
	"ė": "e",
	"ę": "e",
	"ě": "e",
	"Ĝ": "G",
	"Ğ": "G",
	"Ġ": "G",
	"Ģ": "G",
	"ĝ": "g",
	"ğ": "g",
	"ġ": "g",
	"ģ": "g",
	"Ĥ": "H",
	"Ħ": "H",
	"ĥ": "h",
	"ħ": "h",
	"Ĩ": "I",
	"Ī": "I",
	"Ĭ": "I",
	"Į": "I",
	"İ": "I",
	"ĩ": "i",
	"ī": "i",
	"ĭ": "i",
	"į": "i",
	"ı": "i",
	"Ĵ": "J",
	"ĵ": "j",
	"Ķ": "K",
	"ķ": "k",
	"ĸ": "k",
	"Ĺ": "L",
	"Ļ": "L",
	"Ľ": "L",
	"Ŀ": "L",
	"Ł": "L",
	"ĺ": "l",
	"ļ": "l",
	"ľ": "l",
	"ŀ": "l",
	"ł": "l",
	"Ń": "N",
	"Ņ": "N",
	"Ň": "N",
	"Ŋ": "N",
	"ń": "n",
	"ņ": "n",
	"ň": "n",
	"ŋ": "n",
	"Ō": "O",
	"Ŏ": "O",
	"Ő": "O",
	"ō": "o",
	"ŏ": "o",
	"ő": "o",
	"Ŕ": "R",
	"Ŗ": "R",
	"Ř": "R",
	"ŕ": "r",
	"ŗ": "r",
	"ř": "r",
	"Ś": "S",
	"Ŝ": "S",
	"Ş": "S",
	"Š": "S",
	"ś": "s",
	"ŝ": "s",
	"ş": "s",
	"š": "s",
	"Ţ": "T",
	"Ť": "T",
	"Ŧ": "T",
	"ţ": "t",
	"ť": "t",
	"ŧ": "t",
	"Ũ": "U",
	"Ū": "U",
	"Ŭ": "U",
	"Ů": "U",
	"Ű": "U",
	"Ų": "U",
	"ũ": "u",
	"ū": "u",
	"ŭ": "u",
	"ů": "u",
	"ű": "u",
	"ų": "u",
	"Ŵ": "W",
	"ŵ": "w",
	"Ŷ": "Y",
	"ŷ": "y",
	"Ÿ": "Y",
	"Ź": "Z",
	"Ż": "Z",
	"Ž": "Z",
	"ź": "z",
	"ż": "z",
	"ž": "z",
	"Ĳ": "IJ",
	"ĳ": "ij",
	"Œ": "Oe",
	"œ": "oe",
	"ŉ": "'n",
	"ſ": "s"
});
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/deburr.js
/** Used to match Latin Unicode letters (excluding mathematical operators). */
var reLatin = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g;
/**
* Used to match [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks) and
* [combining diacritical marks for symbols](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks_for_Symbols).
*/
var reComboMark = RegExp("[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff]", "g");
/**
* Deburrs `string` by converting
* [Latin-1 Supplement](https://en.wikipedia.org/wiki/Latin-1_Supplement_(Unicode_block)#Character_table)
* and [Latin Extended-A](https://en.wikipedia.org/wiki/Latin_Extended-A)
* letters to basic Latin letters and removing
* [combining diacritical marks](https://en.wikipedia.org/wiki/Combining_Diacritical_Marks).
*
* @static
* @memberOf _
* @since 3.0.0
* @category String
* @param {string} [string=''] The string to deburr.
* @returns {string} Returns the deburred string.
* @example
*
* _.deburr('déjà vu');
* // => 'deja vu'
*/
function deburr(string) {
	string = toString(string);
	return string && string.replace(reLatin, deburrLetter).replace(reComboMark, "");
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_asciiWords.js
/** Used to match words composed of alphanumeric characters. */
var reAsciiWord = /[^\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\x7f]+/g;
/**
* Splits an ASCII `string` into an array of its words.
*
* @private
* @param {string} The string to inspect.
* @returns {Array} Returns the words of `string`.
*/
function asciiWords(string) {
	return string.match(reAsciiWord) || [];
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_hasUnicodeWord.js
/** Used to detect strings that need a more robust regexp to match words. */
var reHasUnicodeWord = /[a-z][A-Z]|[A-Z]{2}[a-z]|[0-9][a-zA-Z]|[a-zA-Z][0-9]|[^a-zA-Z0-9 ]/;
/**
* Checks if `string` contains a word composed of Unicode symbols.
*
* @private
* @param {string} string The string to inspect.
* @returns {boolean} Returns `true` if a word is found, else `false`.
*/
function hasUnicodeWord(string) {
	return reHasUnicodeWord.test(string);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_unicodeWords.js
/** Used to compose unicode character classes. */
var rsAstralRange = "\\ud800-\\udfff";
var rsComboRange = "\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff";
var rsDingbatRange = "\\u2700-\\u27bf";
var rsLowerRange = "a-z\\xdf-\\xf6\\xf8-\\xff";
var rsMathOpRange = "\\xac\\xb1\\xd7\\xf7";
var rsNonCharRange = "\\x00-\\x2f\\x3a-\\x40\\x5b-\\x60\\x7b-\\xbf";
var rsPunctuationRange = "\\u2000-\\u206f";
var rsSpaceRange = " \\t\\x0b\\f\\xa0\\ufeff\\n\\r\\u2028\\u2029\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000";
var rsUpperRange = "A-Z\\xc0-\\xd6\\xd8-\\xde";
var rsVarRange = "\\ufe0e\\ufe0f";
var rsBreakRange = rsMathOpRange + rsNonCharRange + rsPunctuationRange + rsSpaceRange;
/** Used to compose unicode capture groups. */
var rsApos = "['’]";
var rsBreak = "[" + rsBreakRange + "]";
var rsCombo = "[" + rsComboRange + "]";
var rsDigits = "\\d+";
var rsDingbat = "[" + rsDingbatRange + "]";
var rsLower = "[" + rsLowerRange + "]";
var rsMisc = "[^" + rsAstralRange + rsBreakRange + rsDigits + rsDingbatRange + rsLowerRange + rsUpperRange + "]";
var rsModifier = "(?:" + rsCombo + "|\\ud83c[\\udffb-\\udfff])";
var rsNonAstral = "[^" + rsAstralRange + "]";
var rsRegional = "(?:\\ud83c[\\udde6-\\uddff]){2}";
var rsSurrPair = "[\\ud800-\\udbff][\\udc00-\\udfff]";
var rsUpper = "[" + rsUpperRange + "]";
var rsZWJ = "\\u200d";
/** Used to compose unicode regexes. */
var rsMiscLower = "(?:" + rsLower + "|" + rsMisc + ")";
var rsMiscUpper = "(?:" + rsUpper + "|" + rsMisc + ")";
var rsOptContrLower = "(?:" + rsApos + "(?:d|ll|m|re|s|t|ve))?";
var rsOptContrUpper = "(?:" + rsApos + "(?:D|LL|M|RE|S|T|VE))?";
var reOptMod = rsModifier + "?";
var rsOptVar = "[" + rsVarRange + "]?";
var rsOptJoin = "(?:" + rsZWJ + "(?:" + [
	rsNonAstral,
	rsRegional,
	rsSurrPair
].join("|") + ")" + rsOptVar + reOptMod + ")*";
var rsOrdLower = "\\d*(?:1st|2nd|3rd|(?![123])\\dth)(?=\\b|[A-Z_])";
var rsOrdUpper = "\\d*(?:1ST|2ND|3RD|(?![123])\\dTH)(?=\\b|[a-z_])";
var rsSeq = rsOptVar + reOptMod + rsOptJoin;
var rsEmoji = "(?:" + [
	rsDingbat,
	rsRegional,
	rsSurrPair
].join("|") + ")" + rsSeq;
/** Used to match complex or compound words. */
var reUnicodeWord = RegExp([
	rsUpper + "?" + rsLower + "+" + rsOptContrLower + "(?=" + [
		rsBreak,
		rsUpper,
		"$"
	].join("|") + ")",
	rsMiscUpper + "+" + rsOptContrUpper + "(?=" + [
		rsBreak,
		rsUpper + rsMiscLower,
		"$"
	].join("|") + ")",
	rsUpper + "?" + rsMiscLower + "+" + rsOptContrLower,
	rsUpper + "+" + rsOptContrUpper,
	rsOrdUpper,
	rsOrdLower,
	rsDigits,
	rsEmoji
].join("|"), "g");
/**
* Splits a Unicode `string` into an array of its words.
*
* @private
* @param {string} The string to inspect.
* @returns {Array} Returns the words of `string`.
*/
function unicodeWords(string) {
	return string.match(reUnicodeWord) || [];
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/words.js
/**
* Splits `string` into an array of its words.
*
* @static
* @memberOf _
* @since 3.0.0
* @category String
* @param {string} [string=''] The string to inspect.
* @param {RegExp|string} [pattern] The pattern to match words.
* @param- {Object} [guard] Enables use as an iteratee for methods like `_.map`.
* @returns {Array} Returns the words of `string`.
* @example
*
* _.words('fred, barney, & pebbles');
* // => ['fred', 'barney', 'pebbles']
*
* _.words('fred, barney, & pebbles', /[^, ]+/g);
* // => ['fred', 'barney', '&', 'pebbles']
*/
function words(string, pattern, guard) {
	string = toString(string);
	pattern = guard ? void 0 : pattern;
	if (pattern === void 0) return hasUnicodeWord(string) ? unicodeWords(string) : asciiWords(string);
	return string.match(pattern) || [];
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_createCompounder.js
/** Used to match apostrophes. */
var reApos = RegExp("['’]", "g");
/**
* Creates a function like `_.camelCase`.
*
* @private
* @param {Function} callback The function to combine each word.
* @returns {Function} Returns the new compounder function.
*/
function createCompounder(callback) {
	return function(string) {
		return arrayReduce(words(deburr(string).replace(reApos, "")), callback, "");
	};
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/camelCase.js
/**
* Converts `string` to [camel case](https://en.wikipedia.org/wiki/CamelCase).
*
* @static
* @memberOf _
* @since 3.0.0
* @category String
* @param {string} [string=''] The string to convert.
* @returns {string} Returns the camel cased string.
* @example
*
* _.camelCase('Foo Bar');
* // => 'fooBar'
*
* _.camelCase('--foo-bar--');
* // => 'fooBar'
*
* _.camelCase('__FOO_BAR__');
* // => 'fooBar'
*/
var camelCase = createCompounder(function(result, word, index) {
	word = word.toLowerCase();
	return result + (index ? capitalize(word) : word);
});
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/clone.js
/** Used to compose bitmasks for cloning. */
var CLONE_SYMBOLS_FLAG = 4;
/**
* Creates a shallow clone of `value`.
*
* **Note:** This method is loosely based on the
* [structured clone algorithm](https://mdn.io/Structured_clone_algorithm)
* and supports cloning arrays, array buffers, booleans, date objects, maps,
* numbers, `Object` objects, regexes, sets, strings, symbols, and typed
* arrays. The own enumerable properties of `arguments` objects are cloned
* as plain objects. An empty object is returned for uncloneable values such
* as error objects, functions, DOM nodes, and WeakMaps.
*
* @static
* @memberOf _
* @since 0.1.0
* @category Lang
* @param {*} value The value to clone.
* @returns {*} Returns the cloned value.
* @see _.cloneDeep
* @example
*
* var objects = [{ 'a': 1 }, { 'b': 2 }];
*
* var shallow = _.clone(objects);
* console.log(shallow[0] === objects[0]);
* // => true
*/
function clone(value) {
	return baseClone(value, CLONE_SYMBOLS_FLAG);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_arrayAggregator.js
/**
* A specialized version of `baseAggregator` for arrays.
*
* @private
* @param {Array} [array] The array to iterate over.
* @param {Function} setter The function to set `accumulator` values.
* @param {Function} iteratee The iteratee to transform keys.
* @param {Object} accumulator The initial aggregated object.
* @returns {Function} Returns `accumulator`.
*/
function arrayAggregator(array, setter, iteratee, accumulator) {
	var index = -1, length = array == null ? 0 : array.length;
	while (++index < length) {
		var value = array[index];
		setter(accumulator, value, iteratee(value), array);
	}
	return accumulator;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseAggregator.js
/**
* Aggregates elements of `collection` on `accumulator` with keys transformed
* by `iteratee` and values set by `setter`.
*
* @private
* @param {Array|Object} collection The collection to iterate over.
* @param {Function} setter The function to set `accumulator` values.
* @param {Function} iteratee The iteratee to transform keys.
* @param {Object} accumulator The initial aggregated object.
* @returns {Function} Returns `accumulator`.
*/
function baseAggregator(collection, setter, iteratee, accumulator) {
	baseEach(collection, function(value, key, collection) {
		setter(accumulator, value, iteratee(value), collection);
	});
	return accumulator;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_createAggregator.js
/**
* Creates a function like `_.groupBy`.
*
* @private
* @param {Function} setter The function to set accumulator values.
* @param {Function} [initializer] The accumulator object initializer.
* @returns {Function} Returns the new aggregator function.
*/
function createAggregator(setter, initializer) {
	return function(collection, iteratee) {
		var func = isArray(collection) ? arrayAggregator : baseAggregator, accumulator = initializer ? initializer() : {};
		return func(collection, setter, baseIteratee(iteratee, 2), accumulator);
	};
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_customDefaultsMerge.js
/**
* Used by `_.defaultsDeep` to customize its `_.merge` use to merge source
* objects into destination objects that are passed thru.
*
* @private
* @param {*} objValue The destination value.
* @param {*} srcValue The source value.
* @param {string} key The key of the property to merge.
* @param {Object} object The parent object of `objValue`.
* @param {Object} source The parent object of `srcValue`.
* @param {Object} [stack] Tracks traversed source values and their merged
*  counterparts.
* @returns {*} Returns the value to assign.
*/
function customDefaultsMerge(objValue, srcValue, key, object, source, stack) {
	if (isObject(objValue) && isObject(srcValue)) {
		stack.set(srcValue, objValue);
		baseMerge(objValue, srcValue, void 0, customDefaultsMerge, stack);
		stack["delete"](srcValue);
	}
	return objValue;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/mergeWith.js
/**
* This method is like `_.merge` except that it accepts `customizer` which
* is invoked to produce the merged values of the destination and source
* properties. If `customizer` returns `undefined`, merging is handled by the
* method instead. The `customizer` is invoked with six arguments:
* (objValue, srcValue, key, object, source, stack).
*
* **Note:** This method mutates `object`.
*
* @static
* @memberOf _
* @since 4.0.0
* @category Object
* @param {Object} object The destination object.
* @param {...Object} sources The source objects.
* @param {Function} customizer The function to customize assigned values.
* @returns {Object} Returns `object`.
* @example
*
* function customizer(objValue, srcValue) {
*   if (_.isArray(objValue)) {
*     return objValue.concat(srcValue);
*   }
* }
*
* var object = { 'a': [1], 'b': [2] };
* var other = { 'a': [3], 'b': [4] };
*
* _.mergeWith(object, other, customizer);
* // => { 'a': [1, 3], 'b': [2, 4] }
*/
var mergeWith = createAssigner(function(object, source, srcIndex, customizer) {
	baseMerge(object, source, srcIndex, customizer);
});
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/defaultsDeep.js
/**
* This method is like `_.defaults` except that it recursively assigns
* default properties.
*
* **Note:** This method mutates `object`.
*
* @static
* @memberOf _
* @since 3.10.0
* @category Object
* @param {Object} object The destination object.
* @param {...Object} [sources] The source objects.
* @returns {Object} Returns `object`.
* @see _.defaults
* @example
*
* _.defaultsDeep({ 'a': { 'b': 2 } }, { 'a': { 'b': 1, 'c': 3 } });
* // => { 'a': { 'b': 2, 'c': 3 } }
*/
var defaultsDeep = baseRest(function(args) {
	args.push(void 0, customDefaultsMerge);
	return apply$1(mergeWith, void 0, args);
});
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseDifference.js
/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;
/**
* The base implementation of methods like `_.difference` without support
* for excluding multiple arrays or iteratee shorthands.
*
* @private
* @param {Array} array The array to inspect.
* @param {Array} values The values to exclude.
* @param {Function} [iteratee] The iteratee invoked per element.
* @param {Function} [comparator] The comparator invoked per element.
* @returns {Array} Returns the new array of filtered values.
*/
function baseDifference(array, values, iteratee, comparator) {
	var index = -1, includes = arrayIncludes, isCommon = true, length = array.length, result = [], valuesLength = values.length;
	if (!length) return result;
	if (iteratee) values = arrayMap(values, baseUnary(iteratee));
	if (comparator) {
		includes = arrayIncludesWith;
		isCommon = false;
	} else if (values.length >= LARGE_ARRAY_SIZE) {
		includes = cacheHas;
		isCommon = false;
		values = new SetCache(values);
	}
	outer: while (++index < length) {
		var value = array[index], computed = iteratee == null ? value : iteratee(value);
		value = comparator || value !== 0 ? value : 0;
		if (isCommon && computed === computed) {
			var valuesIndex = valuesLength;
			while (valuesIndex--) if (values[valuesIndex] === computed) continue outer;
			result.push(value);
		} else if (!includes(values, computed, comparator)) result.push(value);
	}
	return result;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/difference.js
/**
* Creates an array of `array` values not included in the other given arrays
* using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
* for equality comparisons. The order and references of result values are
* determined by the first array.
*
* **Note:** Unlike `_.pullAll`, this method returns a new array.
*
* @static
* @memberOf _
* @since 0.1.0
* @category Array
* @param {Array} array The array to inspect.
* @param {...Array} [values] The values to exclude.
* @returns {Array} Returns the new array of filtered values.
* @see _.without, _.xor
* @example
*
* _.difference([2, 1], [2, 3]);
* // => [1]
*/
var difference = baseRest(function(array, values) {
	return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true)) : [];
});
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/groupBy.js
/** Used to check objects for own properties. */
var hasOwnProperty = Object.prototype.hasOwnProperty;
/**
* Creates an object composed of keys generated from the results of running
* each element of `collection` thru `iteratee`. The order of grouped values
* is determined by the order they occur in `collection`. The corresponding
* value of each key is an array of elements responsible for generating the
* key. The iteratee is invoked with one argument: (value).
*
* @static
* @memberOf _
* @since 0.1.0
* @category Collection
* @param {Array|Object} collection The collection to iterate over.
* @param {Function} [iteratee=_.identity] The iteratee to transform keys.
* @returns {Object} Returns the composed aggregate object.
* @example
*
* _.groupBy([6.1, 4.2, 6.3], Math.floor);
* // => { '4': [4.2], '6': [6.1, 6.3] }
*
* // The `_.property` iteratee shorthand.
* _.groupBy(['one', 'two', 'three'], 'length');
* // => { '3': ['one', 'two'], '5': ['three'] }
*/
var groupBy = createAggregator(function(result, value, key) {
	if (hasOwnProperty.call(result, key)) result[key].push(value);
	else baseAssignValue(result, key, [value]);
});
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/isNumber.js
/** `Object#toString` result references. */
var numberTag = "[object Number]";
/**
* Checks if `value` is classified as a `Number` primitive or object.
*
* **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
* classified as numbers, use the `_.isFinite` method.
*
* @static
* @memberOf _
* @since 0.1.0
* @category Lang
* @param {*} value The value to check.
* @returns {boolean} Returns `true` if `value` is a number, else `false`.
* @example
*
* _.isNumber(3);
* // => true
*
* _.isNumber(Number.MIN_VALUE);
* // => true
*
* _.isNumber(Infinity);
* // => true
*
* _.isNumber('3');
* // => false
*/
function isNumber(value) {
	return typeof value == "number" || isObjectLike(value) && baseGetTag(value) == numberTag;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/lowerFirst.js
/**
* Converts the first character of `string` to lower case.
*
* @static
* @memberOf _
* @since 4.0.0
* @category String
* @param {string} [string=''] The string to convert.
* @returns {string} Returns the converted string.
* @example
*
* _.lowerFirst('Fred');
* // => 'fred'
*
* _.lowerFirst('FRED');
* // => 'fRED'
*/
var lowerFirst = createCaseFirst("toLowerCase");
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseSortedIndexBy.js
/** Used as references for the maximum length and index of an array. */
var MAX_ARRAY_INDEX = 4294967294;
var nativeFloor = Math.floor;
var nativeMin = Math.min;
/**
* The base implementation of `_.sortedIndexBy` and `_.sortedLastIndexBy`
* which invokes `iteratee` for `value` and each element of `array` to compute
* their sort ranking. The iteratee is invoked with one argument; (value).
*
* @private
* @param {Array} array The sorted array to inspect.
* @param {*} value The value to evaluate.
* @param {Function} iteratee The iteratee invoked per element.
* @param {boolean} [retHighest] Specify returning the highest qualified index.
* @returns {number} Returns the index at which `value` should be inserted
*  into `array`.
*/
function baseSortedIndexBy(array, value, iteratee, retHighest) {
	var low = 0, high = array == null ? 0 : array.length;
	if (high === 0) return 0;
	value = iteratee(value);
	var valIsNaN = value !== value, valIsNull = value === null, valIsSymbol = isSymbol(value), valIsUndefined = value === void 0;
	while (low < high) {
		var mid = nativeFloor((low + high) / 2), computed = iteratee(array[mid]), othIsDefined = computed !== void 0, othIsNull = computed === null, othIsReflexive = computed === computed, othIsSymbol = isSymbol(computed);
		if (valIsNaN) var setLow = retHighest || othIsReflexive;
		else if (valIsUndefined) setLow = othIsReflexive && (retHighest || othIsDefined);
		else if (valIsNull) setLow = othIsReflexive && othIsDefined && (retHighest || !othIsNull);
		else if (valIsSymbol) setLow = othIsReflexive && othIsDefined && !othIsNull && (retHighest || !othIsSymbol);
		else if (othIsNull || othIsSymbol) setLow = false;
		else setLow = retHighest ? computed <= value : computed < value;
		if (setLow) low = mid + 1;
		else high = mid;
	}
	return nativeMin(high, MAX_ARRAY_INDEX);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseSortedIndex.js
/** Used as references for the maximum length and index of an array. */
var HALF_MAX_ARRAY_LENGTH = 2147483647;
/**
* The base implementation of `_.sortedIndex` and `_.sortedLastIndex` which
* performs a binary search of `array` to determine the index at which `value`
* should be inserted into `array` in order to maintain its sort order.
*
* @private
* @param {Array} array The sorted array to inspect.
* @param {*} value The value to evaluate.
* @param {boolean} [retHighest] Specify returning the highest qualified index.
* @returns {number} Returns the index at which `value` should be inserted
*  into `array`.
*/
function baseSortedIndex(array, value, retHighest) {
	var low = 0, high = array == null ? low : array.length;
	if (typeof value == "number" && value === value && high <= HALF_MAX_ARRAY_LENGTH) {
		while (low < high) {
			var mid = low + high >>> 1, computed = array[mid];
			if (computed !== null && !isSymbol(computed) && (retHighest ? computed <= value : computed < value)) low = mid + 1;
			else high = mid;
		}
		return high;
	}
	return baseSortedIndexBy(array, value, identity, retHighest);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/sortedIndex.js
/**
* Uses a binary search to determine the lowest index at which `value`
* should be inserted into `array` in order to maintain its sort order.
*
* @static
* @memberOf _
* @since 0.1.0
* @category Array
* @param {Array} array The sorted array to inspect.
* @param {*} value The value to evaluate.
* @returns {number} Returns the index at which `value` should be inserted
*  into `array`.
* @example
*
* _.sortedIndex([30, 50], 40);
* // => 1
*/
function sortedIndex(array, value) {
	return baseSortedIndex(array, value);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/sortedIndexBy.js
/**
* This method is like `_.sortedIndex` except that it accepts `iteratee`
* which is invoked for `value` and each element of `array` to compute their
* sort ranking. The iteratee is invoked with one argument: (value).
*
* @static
* @memberOf _
* @since 4.0.0
* @category Array
* @param {Array} array The sorted array to inspect.
* @param {*} value The value to evaluate.
* @param {Function} [iteratee=_.identity] The iteratee invoked per element.
* @returns {number} Returns the index at which `value` should be inserted
*  into `array`.
* @example
*
* var objects = [{ 'x': 4 }, { 'x': 5 }];
*
* _.sortedIndexBy(objects, { 'x': 4 }, function(o) { return o.x; });
* // => 0
*
* // The `_.property` iteratee shorthand.
* _.sortedIndexBy(objects, { 'x': 4 }, 'x');
* // => 0
*/
function sortedIndexBy(array, value, iteratee) {
	return baseSortedIndexBy(array, value, baseIteratee(iteratee, 2));
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/startCase.js
/**
* Converts `string` to
* [start case](https://en.wikipedia.org/wiki/Letter_case#Stylistic_or_specialised_usage).
*
* @static
* @memberOf _
* @since 3.1.0
* @category String
* @param {string} [string=''] The string to convert.
* @returns {string} Returns the start cased string.
* @example
*
* _.startCase('--foo-bar--');
* // => 'Foo Bar'
*
* _.startCase('fooBar');
* // => 'Foo Bar'
*
* _.startCase('__FOO_BAR__');
* // => 'FOO BAR'
*/
var startCase = createCompounder(function(result, word, index) {
	return result + (index ? " " : "") + upperFirst(word);
});
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/uniq.js
/**
* Creates a duplicate-free version of an array, using
* [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
* for equality comparisons, in which only the first occurrence of each element
* is kept. The order of result values is determined by the order they occur
* in the array.
*
* @static
* @memberOf _
* @since 0.1.0
* @category Array
* @param {Array} array The array to inspect.
* @returns {Array} Returns the new duplicate free array.
* @example
*
* _.uniq([2, 1, 2]);
* // => [2, 1]
*/
function uniq(array) {
	return array && array.length ? baseUniq(array) : [];
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/polyfill/index.js
if (typeof window === "object" && window.NodeList && !NodeList.prototype.forEach) NodeList.prototype.forEach = Array.prototype.forEach;
if (typeof window !== "undefined") (function(arr) {
	arr.forEach((item) => {
		if (Object.prototype.hasOwnProperty.call(item, "append")) return;
		Object.defineProperty(item, "append", {
			configurable: true,
			enumerable: true,
			writable: true,
			value(...args) {
				const docFrag = document.createDocumentFragment();
				args.forEach((arg) => {
					const isNode = arg instanceof Node;
					docFrag.appendChild(isNode ? arg : document.createTextNode(String(arg)));
				});
				this.appendChild(docFrag);
			}
		});
	});
})([
	Element.prototype,
	Document.prototype,
	DocumentFragment.prototype
]);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/common/disposable.js
var Disposable = class {
	get disposed() {
		return this._disposed === true;
	}
	dispose() {
		this._disposed = true;
	}
};
(function(Disposable) {
	function dispose() {
		return (target, methodName, descriptor) => {
			const raw = descriptor.value;
			const proto = target.__proto__;
			descriptor.value = function(...args) {
				if (this.disposed) return;
				raw.call(this, ...args);
				proto.dispose.call(this);
			};
		};
	}
	Disposable.dispose = dispose;
})(Disposable || (Disposable = {}));
/**
* An object which manages a collection of disposable items.
*/
var DisposableSet = class {
	constructor() {
		this.isDisposed = false;
		this.items = /* @__PURE__ */ new Set();
	}
	/**
	* Test whether the set has been disposed.
	*/
	get disposed() {
		return this.isDisposed;
	}
	/**
	* Dispose of the set and the items it contains.
	*
	* #### Notes
	* Items are disposed in the order they are added to the set.
	*/
	dispose() {
		if (this.isDisposed) return;
		this.isDisposed = true;
		this.items.forEach((item) => {
			item.dispose();
		});
		this.items.clear();
	}
	/**
	* Test whether the set contains a specific item.
	*
	* @param item - The item of interest.
	*
	* @returns `true` if the set contains the item, `false` otherwise.
	*/
	contains(item) {
		return this.items.has(item);
	}
	/**
	* Add a disposable item to the set.
	*
	* @param item - The item to add to the set.
	*
	* #### Notes
	* If the item is already contained in the set, this is a no-op.
	*/
	add(item) {
		this.items.add(item);
	}
	/**
	* Remove a disposable item from the set.
	*
	* @param item - The item to remove from the set.
	*
	* #### Notes
	* If the item is not contained in the set, this is a no-op.
	*/
	remove(item) {
		this.items.delete(item);
	}
	/**
	* Remove all items from the set.
	*/
	clear() {
		this.items.clear();
	}
};
(function(DisposableSet) {
	/**
	* Create a disposable set from an iterable of items.
	*
	* @param items - The iterable or array-like object of interest.
	*
	* @returns A new disposable initialized with the given items.
	*/
	function from(items) {
		const set = new DisposableSet();
		items.forEach((item) => {
			set.add(item);
		});
		return set;
	}
	DisposableSet.from = from;
})(DisposableSet || (DisposableSet = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/function/function.js
function apply(fn, ctx, args) {
	if (args) switch (args.length) {
		case 0: return fn.call(ctx);
		case 1: return fn.call(ctx, args[0]);
		case 2: return fn.call(ctx, args[0], args[1]);
		case 3: return fn.call(ctx, args[0], args[1], args[2]);
		case 4: return fn.call(ctx, args[0], args[1], args[2], args[3]);
		case 5: return fn.call(ctx, args[0], args[1], args[2], args[3], args[4]);
		case 6: return fn.call(ctx, args[0], args[1], args[2], args[3], args[4], args[5]);
		default: return fn.apply(ctx, args);
	}
	return fn.call(ctx);
}
function call$1(fn, ctx, ...args) {
	return apply(fn, ctx, args);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/function/async.js
function isAsyncLike(obj) {
	return typeof obj === "object" && obj.then && typeof obj.then === "function";
}
function isAsync(obj) {
	return obj != null && (obj instanceof Promise || isAsyncLike(obj));
}
function toAsyncBoolean(...inputs) {
	const results = [];
	inputs.forEach((arg) => {
		if (Array.isArray(arg)) results.push(...arg);
		else results.push(arg);
	});
	if (results.some((res) => isAsync(res))) {
		const deferres = results.map((res) => isAsync(res) ? res : Promise.resolve(res !== false));
		return Promise.all(deferres).then((arr) => arr.reduce((memo, item) => item !== false && memo, true));
	}
	return results.every((res) => res !== false);
}
function toDeferredBoolean(...inputs) {
	const ret = toAsyncBoolean(inputs);
	return typeof ret === "boolean" ? Promise.resolve(ret) : ret;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/event/util.js
function call(list, args) {
	const results = [];
	for (let i = 0; i < list.length; i += 2) {
		const handler = list[i];
		const context = list[i + 1];
		const ret = apply(handler, context, Array.isArray(args) ? args : [args]);
		results.push(ret);
	}
	return toAsyncBoolean(results);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/event/events.js
var Events = class {
	constructor() {
		this.listeners = {};
	}
	on(name, handler, context) {
		if (handler == null) return this;
		if (!this.listeners[name]) this.listeners[name] = [];
		this.listeners[name].push(handler, context);
		return this;
	}
	once(name, handler, context) {
		const cb = (...args) => {
			this.off(name, cb);
			return call([handler, context], args);
		};
		return this.on(name, cb, this);
	}
	off(name, handler, context) {
		if (!(name || handler || context)) {
			this.listeners = {};
			return this;
		}
		const listeners = this.listeners;
		(name ? [name] : Object.keys(listeners)).forEach((n) => {
			const cache = listeners[n];
			if (!cache) return;
			if (!(handler || context)) {
				delete listeners[n];
				return;
			}
			for (let i = cache.length - 2; i >= 0; i -= 2) if (!(handler && cache[i] !== handler || context && cache[i + 1] !== context)) cache.splice(i, 2);
		});
		return this;
	}
	trigger(name, ...args) {
		let returned = true;
		if (name !== "*") {
			const list = this.listeners[name];
			if (list != null) returned = call([...list], args);
		}
		const list = this.listeners["*"];
		if (list != null) return toAsyncBoolean([returned, call([...list], [name, ...args])]);
		return returned;
	}
	emit(name, ...args) {
		return this.trigger(name, ...args);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/object/mixins.js
/**
* @see https://www.typescriptlang.org/docs/handbook/mixins.html
*/
function applyMixins(derivedCtor, ...baseCtors) {
	baseCtors.forEach((baseCtor) => {
		Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
			if (name !== "constructor") Object.defineProperty(derivedCtor.prototype, name, Object.getOwnPropertyDescriptor(baseCtor.prototype, name));
		});
	});
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/object/inherit.js
var extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d, b) {
	d.__proto__ = b;
} || function(d, b) {
	for (const p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
};
/**
* @see https://github.com/microsoft/TypeScript/blob/5c85febb0ce9d6088cbe9b09cb42f73f9ee8ea05/src/compiler/transformers/es2015.ts#L4309
*/
function inherit(cls, base) {
	extendStatics(cls, base);
	function tmp() {
		this.constructor = cls;
	}
	cls.prototype = base === null ? Object.create(base) : (tmp.prototype = base.prototype, new tmp());
}
var A = class {};
var isNativeClass = /^\s*class\s+/.test(`${A}`) || /^\s*class\s*\{/.test(`${class {}}`);
/**
* Extends class with specified class name.
*/
function createClass(className, base) {
	let cls;
	if (isNativeClass) cls = class extends base {};
	else {
		cls = function() {
			return base.apply(this, arguments);
		};
		inherit(cls, base);
	}
	Object.defineProperty(cls, "name", { value: className });
	return cls;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/object/object.js
function isMaliciousProp(prop) {
	return prop === "__proto__";
}
function getByPath(obj, path, delimiter = "/") {
	let ret;
	const keys = Array.isArray(path) ? path : path.split(delimiter);
	if (keys.length) {
		ret = obj;
		while (keys.length) {
			const key = keys.shift();
			if (Object(ret) === ret && key && key in ret) ret = ret[key];
			else return;
		}
	}
	return ret;
}
function setByPath(obj, path, value, delimiter = "/") {
	const keys = Array.isArray(path) ? path : path.split(delimiter);
	const lastKey = keys.pop();
	if (lastKey && !isMaliciousProp(lastKey)) {
		let diver = obj;
		keys.forEach((key) => {
			if (!isMaliciousProp(key)) {
				if (diver[key] == null) diver[key] = {};
				diver = diver[key];
			}
		});
		diver[lastKey] = value;
	}
	return obj;
}
function unsetByPath(obj, path, delimiter = "/") {
	const keys = Array.isArray(path) ? path.slice() : path.split(delimiter);
	const propertyToRemove = keys.pop();
	if (propertyToRemove) if (keys.length > 0) {
		const parent = getByPath(obj, keys);
		if (parent) delete parent[propertyToRemove];
	} else delete obj[propertyToRemove];
	return obj;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/common/basecoat.js
var __decorate$29 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Basecoat = class extends Events {
	dispose() {
		this.off();
	}
};
__decorate$29([Disposable.dispose()], Basecoat.prototype, "dispose", null);
(function(Basecoat) {
	Basecoat.dispose = Disposable.dispose;
})(Basecoat || (Basecoat = {}));
applyMixins(Basecoat, Disposable);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/string/format.js
var cacheStringFunction = (fn) => {
	const cache = Object.create(null);
	return ((str) => {
		return cache[str] || (cache[str] = fn(str));
	});
};
var kebabCase = cacheStringFunction((s) => s.replace(/\B([A-Z])/g, "-$1").toLowerCase());
var pascalCase = cacheStringFunction((s) => startCase(camelCase(s)).replace(/ /g, ""));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/string/hashcode.js
/**
* Return a simple hash code from a string.
* Source from: https://github.com/sindresorhus/fnv1a/blob/master/index.js#L25
*/
function hashcode(str) {
	let hash = 2166136261;
	let isUnicoded = false;
	let string = str;
	for (let i = 0, ii = string.length; i < ii; i += 1) {
		let characterCode = string.charCodeAt(i);
		if (characterCode > 127 && !isUnicoded) {
			string = unescape(encodeURIComponent(string));
			characterCode = string.charCodeAt(i);
			isUnicoded = true;
		}
		hash ^= characterCode;
		hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
	}
	return hash >>> 0;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/string/uuid.js
function uuid() {
	let res = "";
	const template = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
	for (let i = 0, len = 36; i < len; i += 1) {
		const s = template[i];
		const r = Math.random() * 16 | 0;
		const v = s === "x" ? r : s === "y" ? r & 3 | 8 : s;
		res += v.toString(16);
	}
	return res;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/string/suggestion.js
/**
* Given a name and a list of names that are not equal to the name, return a
* spelling suggestion if there is one that is close enough. Names less than
* length 3 only check for case-insensitive equality, not Levenshtein distance.
*
* - If there is a candidate that's the same except for case, return that.
* - If there is a candidate that's within one edit of the name, return that.
* - Otherwise, return the candidate with the smallest Levenshtein distance,
*     except for candidates:
*       * With no name
*       * Whose length differs from the target name by more than 0.34 of the
*         length of the name.
*       * Whose levenshtein distance is more than 0.4 of the length of the
*         name (0.4 allows 1 substitution/transposition for every 5 characters,
*         and 1 insertion/deletion at 3 characters)
*/
function getSpellingSuggestion(name, candidates, getName) {
	const maximumLengthDifference = Math.min(2, Math.floor(name.length * .34));
	let bestDistance = Math.floor(name.length * .4) + 1;
	let bestCandidate;
	let justCheckExactMatches = false;
	const nameLowerCase = name.toLowerCase();
	for (const candidate of candidates) {
		const candidateName = getName(candidate);
		if (candidateName !== void 0 && Math.abs(candidateName.length - nameLowerCase.length) <= maximumLengthDifference) {
			const candidateNameLowerCase = candidateName.toLowerCase();
			if (candidateNameLowerCase === nameLowerCase) {
				if (candidateName === name) continue;
				return candidate;
			}
			if (justCheckExactMatches) continue;
			if (candidateName.length < 3) continue;
			const distance = levenshteinWithMax(nameLowerCase, candidateNameLowerCase, bestDistance - 1);
			if (distance === void 0) continue;
			if (distance < 3) {
				justCheckExactMatches = true;
				bestCandidate = candidate;
			} else {
				bestDistance = distance;
				bestCandidate = candidate;
			}
		}
	}
	return bestCandidate;
}
function levenshteinWithMax(s1, s2, max) {
	let previous = new Array(s2.length + 1);
	let current = new Array(s2.length + 1);
	/** Represents any value > max. We don't care about the particular value. */
	const big = max + 1;
	for (let i = 0; i <= s2.length; i += 1) previous[i] = i;
	for (let i = 1; i <= s1.length; i += 1) {
		const c1 = s1.charCodeAt(i - 1);
		const minJ = i > max ? i - max : 1;
		const maxJ = s2.length > max + i ? max + i : s2.length;
		current[0] = i;
		/** Smallest value of the matrix in the ith column. */
		let colMin = i;
		for (let j = 1; j < minJ; j += 1) current[j] = big;
		for (let j = minJ; j <= maxJ; j += 1) {
			const dist = c1 === s2.charCodeAt(j - 1) ? previous[j - 1] : Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + 2);
			current[j] = dist;
			colMin = Math.min(colMin, dist);
		}
		for (let j = maxJ + 1; j <= s2.length; j += 1) current[j] = big;
		if (colMin > max) return;
		const temp = previous;
		previous = current;
		current = temp;
	}
	const res = previous[s2.length];
	return res > max ? void 0 : res;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/number/number.js
function isPercentage(val) {
	return typeof val === "string" && val.slice(-1) === "%";
}
function normalizePercentage(num, ref) {
	if (num == null) return 0;
	let raw;
	if (typeof num === "string") {
		raw = parseFloat(num);
		if (isPercentage(num)) {
			raw /= 100;
			if (Number.isFinite(raw)) return raw * ref;
		}
	} else raw = num;
	if (!Number.isFinite(raw)) return 0;
	if (raw > 0 && raw < 1) return raw * ref;
	return raw;
}
function normalizeSides(box) {
	if (typeof box === "object") {
		let left = 0;
		let top = 0;
		let right = 0;
		let bottom = 0;
		if (box.vertical != null && Number.isFinite(box.vertical)) top = bottom = box.vertical;
		if (box.horizontal != null && Number.isFinite(box.horizontal)) right = left = box.horizontal;
		if (box.left != null && Number.isFinite(box.left)) left = box.left;
		if (box.top != null && Number.isFinite(box.top)) top = box.top;
		if (box.right != null && Number.isFinite(box.right)) right = box.right;
		if (box.bottom != null && Number.isFinite(box.bottom)) bottom = box.bottom;
		return {
			top,
			right,
			bottom,
			left
		};
	}
	let val = 0;
	if (box != null && Number.isFinite(box)) val = box;
	return {
		top: val,
		right: val,
		bottom: val,
		left: val
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/platform/index.js
var _IS_MAC = false;
var _IS_IOS = false;
var _IS_WINDOWS = false;
var _IS_IE = false;
var _IS_IE11 = false;
var _IS_EDGE = false;
var _IS_NETSCAPE = false;
var _IS_CHROME_APP = false;
var _IS_CHROME = false;
var _IS_OPERA = false;
var _IS_FIREFOX = false;
var _IS_SAFARI = false;
var _SUPPORT_TOUCH = false;
var _SUPPORT_POINTER = false;
var _SUPPORT_PASSIVE = false;
var _NO_FOREIGNOBJECT = false;
if (typeof navigator === "object") {
	const ua = navigator.userAgent;
	_IS_MAC = ua.indexOf("Macintosh") >= 0;
	_IS_IOS = !!ua.match(/(iPad|iPhone|iPod)/g);
	_IS_WINDOWS = ua.indexOf("Windows") >= 0;
	_IS_IE = ua.indexOf("MSIE") >= 0;
	_IS_IE11 = !!ua.match(/Trident\/7\./);
	_IS_EDGE = !!ua.match(/Edge\//);
	_IS_NETSCAPE = ua.indexOf("Mozilla/") >= 0 && ua.indexOf("MSIE") < 0 && ua.indexOf("Edge/") < 0;
	_IS_CHROME = ua.indexOf("Chrome/") >= 0 && ua.indexOf("Edge/") < 0;
	_IS_OPERA = ua.indexOf("Opera/") >= 0 || ua.indexOf("OPR/") >= 0;
	_IS_FIREFOX = ua.indexOf("Firefox/") >= 0;
	_IS_SAFARI = ua.indexOf("AppleWebKit/") >= 0 && ua.indexOf("Chrome/") < 0 && ua.indexOf("Edge/") < 0;
	if (typeof document === "object") _NO_FOREIGNOBJECT = !document.createElementNS || `${document.createElementNS("http://www.w3.org/2000/svg", "foreignObject")}` !== "[object SVGForeignObjectElement]" || ua.indexOf("Opera/") >= 0;
}
if (typeof window === "object") {
	_IS_CHROME_APP = window.chrome != null && window.chrome.app != null && window.chrome.app.runtime != null;
	_SUPPORT_POINTER = window.PointerEvent != null && !_IS_MAC;
}
if (typeof document === "object") {
	_SUPPORT_TOUCH = "ontouchstart" in document.documentElement;
	try {
		const options = Object.defineProperty({}, "passive", { get() {
			_SUPPORT_PASSIVE = true;
		} });
		const div = document.createElement("div");
		if (div.addEventListener) div.addEventListener("click", () => {}, options);
	} catch (err) {}
}
var Platform;
(function(Platform) {
	Platform.IS_MAC = _IS_MAC;
	Platform.IS_IOS = _IS_IOS;
	Platform.IS_WINDOWS = _IS_WINDOWS;
	Platform.IS_IE = _IS_IE;
	Platform.IS_IE11 = _IS_IE11;
	Platform.IS_EDGE = _IS_EDGE;
	/**
	* A flag indicating whether the browser is Netscape (including Firefox).
	*/
	Platform.IS_NETSCAPE = _IS_NETSCAPE;
	/**
	* A flag indicating whether the the this is running inside a Chrome App.
	*/
	Platform.IS_CHROME_APP = _IS_CHROME_APP;
	Platform.IS_CHROME = _IS_CHROME;
	Platform.IS_OPERA = _IS_OPERA;
	Platform.IS_FIREFOX = _IS_FIREFOX;
	Platform.IS_SAFARI = _IS_SAFARI;
	/**
	* A flag indicating whether this device supports touchstart/-move/-end
	* events (Apple iOS, Android, Chromebook and Chrome Browser on touch-enabled
	* devices).
	*/
	Platform.SUPPORT_TOUCH = _SUPPORT_TOUCH;
	/**
	* A flag indicating whether this device supports Microsoft pointer events.
	*/
	Platform.SUPPORT_POINTER = _SUPPORT_POINTER;
	Platform.SUPPORT_PASSIVE = _SUPPORT_PASSIVE;
	/**
	* A flag indicating whether foreignObject support is not available. This
	* is the case for Opera, older SVG-based browsers and all versions of IE.
	*/
	Platform.NO_FOREIGNOBJECT = _NO_FOREIGNOBJECT;
	Platform.SUPPORT_FOREIGNOBJECT = !Platform.NO_FOREIGNOBJECT;
})(Platform || (Platform = {}));
(function(Platform) {
	function getHMRStatus() {
		const mod = window.module;
		if (mod != null && mod.hot != null && mod.hot.status != null) return mod.hot.status();
		return "unkonwn";
	}
	Platform.getHMRStatus = getHMRStatus;
	function isApplyingHMR() {
		return getHMRStatus() === "apply";
	}
	Platform.isApplyingHMR = isApplyingHMR;
	const TAGNAMES = {
		select: "input",
		change: "input",
		submit: "form",
		reset: "form",
		error: "img",
		load: "img",
		abort: "img"
	};
	function isEventSupported(event) {
		const elem = document.createElement(TAGNAMES[event] || "div");
		const eventName = `on${event}`;
		let isSupported = eventName in elem;
		if (!isSupported) {
			elem.setAttribute(eventName, "return;");
			isSupported = typeof elem[eventName] === "function";
		}
		return isSupported;
	}
	Platform.isEventSupported = isEventSupported;
})(Platform || (Platform = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/class.js
var rclass = /[\t\r\n\f]/g;
var rnotwhite = /\S+/g;
var fillSpaces = (str) => ` ${str} `;
function getClass(elem) {
	return elem && elem.getAttribute && elem.getAttribute("class") || "";
}
function hasClass(elem, selector) {
	if (elem == null || selector == null) return false;
	const classNames = fillSpaces(getClass(elem));
	const className = fillSpaces(selector);
	return elem.nodeType === 1 ? classNames.replace(rclass, " ").includes(className) : false;
}
function addClass(elem, selector) {
	if (elem == null || selector == null) return;
	if (typeof selector === "function") return addClass(elem, selector(getClass(elem)));
	if (typeof selector === "string" && elem.nodeType === 1) {
		const classes = selector.match(rnotwhite) || [];
		const oldValue = fillSpaces(getClass(elem)).replace(rclass, " ");
		let newValue = classes.reduce((memo, cls) => {
			if (memo.indexOf(fillSpaces(cls)) < 0) return `${memo}${cls} `;
			return memo;
		}, oldValue);
		newValue = newValue.trim();
		if (oldValue !== newValue) elem.setAttribute("class", newValue);
	}
}
function removeClass(elem, selector) {
	if (elem == null) return;
	if (typeof selector === "function") return removeClass(elem, selector(getClass(elem)));
	if ((!selector || typeof selector === "string") && elem.nodeType === 1) {
		const classes = (selector || "").match(rnotwhite) || [];
		const oldValue = fillSpaces(getClass(elem)).replace(rclass, " ");
		let newValue = classes.reduce((memo, cls) => {
			const className = fillSpaces(cls);
			if (memo.indexOf(className) > -1) return memo.replace(className, " ");
			return memo;
		}, oldValue);
		newValue = selector ? newValue.trim() : "";
		if (oldValue !== newValue) elem.setAttribute("class", newValue);
	}
}
function toggleClass(elem, selector, stateVal) {
	if (elem == null || selector == null) return;
	if (stateVal != null && typeof selector === "string") {
		stateVal ? addClass(elem, selector) : removeClass(elem, selector);
		return;
	}
	if (typeof selector === "function") return toggleClass(elem, selector(getClass(elem), stateVal), stateVal);
	if (typeof selector === "string") (selector.match(rnotwhite) || []).forEach((cls) => {
		hasClass(elem, cls) ? removeClass(elem, cls) : addClass(elem, cls);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/elem.js
var idCounter = 0;
function uniqueId() {
	idCounter += 1;
	return `v${idCounter}`;
}
function ensureId(elem) {
	if (elem.id == null || elem.id === "") elem.id = uniqueId();
	return elem.id;
}
/**
* Returns true if object is an instance of SVGGraphicsElement.
* @see https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement
*/
function isSVGGraphicsElement(elem) {
	if (elem == null) return false;
	return typeof elem.getScreenCTM === "function" && elem instanceof SVGElement;
}
var ns = {
	svg: "http://www.w3.org/2000/svg",
	xmlns: "http://www.w3.org/2000/xmlns/",
	xml: "http://www.w3.org/XML/1998/namespace",
	xlink: "http://www.w3.org/1999/xlink",
	xhtml: "http://www.w3.org/1999/xhtml"
};
function createElement(tagName, doc = document) {
	return doc.createElement(tagName);
}
function createElementNS(tagName, namespaceURI = ns.xhtml, doc = document) {
	return doc.createElementNS(namespaceURI, tagName);
}
function createSvgElement(tagName, doc = document) {
	return createElementNS(tagName, ns.svg, doc);
}
function createSvgDocument(content) {
	if (content) {
		const { documentElement } = parseXML(`<svg xmlns="${ns.svg}" xmlns:xlink="${ns.xlink}" version="1.1">${content}</svg>`, { async: false });
		return documentElement;
	}
	const svg = document.createElementNS(ns.svg, "svg");
	svg.setAttributeNS(ns.xmlns, "xmlns:xlink", ns.xlink);
	svg.setAttribute("version", "1.1");
	return svg;
}
function parseXML(data, options = {}) {
	let xml;
	try {
		const parser = new DOMParser();
		if (options.async != null) {
			const instance = parser;
			instance.async = options.async;
		}
		xml = parser.parseFromString(data, options.mimeType || "text/xml");
	} catch (error) {
		xml = void 0;
	}
	if (!xml || xml.getElementsByTagName("parsererror").length) throw new Error(`Invalid XML: ${data}`);
	return xml;
}
function tagName(node, lowercase = true) {
	const nodeName = node.nodeName;
	return lowercase ? nodeName.toLowerCase() : nodeName.toUpperCase();
}
function index(elem) {
	let index = 0;
	let node = elem.previousSibling;
	while (node) {
		if (node.nodeType === 1) index += 1;
		node = node.previousSibling;
	}
	return index;
}
function find(elem, selector) {
	return elem.querySelectorAll(selector);
}
function findOne(elem, selector) {
	return elem.querySelector(selector);
}
function findParentByClass(elem, className, terminator) {
	const ownerSVGElement = elem.ownerSVGElement;
	let node = elem.parentNode;
	while (node && node !== terminator && node !== ownerSVGElement) {
		if (hasClass(node, className)) return node;
		node = node.parentNode;
	}
	return null;
}
function contains(parent, child) {
	const bup = child && child.parentNode;
	return parent === bup || !!(bup && bup.nodeType === 1 && parent.compareDocumentPosition(bup) & 16);
}
function remove(elem) {
	if (elem) (Array.isArray(elem) ? elem : [elem]).forEach((item) => {
		if (item.parentNode) item.parentNode.removeChild(item);
	});
}
function empty(elem) {
	while (elem.firstChild) elem.removeChild(elem.firstChild);
}
function append(elem, elems) {
	(Array.isArray(elems) ? elems : [elems]).forEach((child) => {
		if (child != null) elem.appendChild(child);
	});
}
function prepend(elem, elems) {
	const child = elem.firstChild;
	return child ? before(child, elems) : append(elem, elems);
}
function before(elem, elems) {
	const parent = elem.parentNode;
	if (parent) (Array.isArray(elems) ? elems : [elems]).forEach((child) => {
		if (child != null) parent.insertBefore(child, elem);
	});
}
function appendTo(elem, target) {
	if (target != null) target.appendChild(elem);
}
function isElement(x) {
	return !!x && x.nodeType === 1;
}
function isHTMLElement(elem) {
	try {
		return elem instanceof HTMLElement;
	} catch (e) {
		return typeof elem === "object" && elem.nodeType === 1 && typeof elem.style === "object" && typeof elem.ownerDocument === "object";
	}
}
function children(parent, className) {
	const matched = [];
	let elem = parent.firstChild;
	for (; elem; elem = elem.nextSibling) if (elem.nodeType === 1) {
		if (!className || hasClass(elem, className)) matched.push(elem);
	}
	return matched;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/attr.js
var CASE_SENSITIVE_ATTR = [
	"viewBox",
	"attributeName",
	"attributeType",
	"repeatCount",
	"textLength",
	"lengthAdjust",
	"gradientUnits"
];
function getAttribute(elem, name) {
	return elem.getAttribute(name);
}
function removeAttribute(elem, name) {
	const qualified = qualifyAttr(name);
	if (qualified.ns) {
		if (elem.hasAttributeNS(qualified.ns, qualified.local)) elem.removeAttributeNS(qualified.ns, qualified.local);
	} else if (elem.hasAttribute(name)) elem.removeAttribute(name);
}
function setAttribute(elem, name, value) {
	if (value == null) return removeAttribute(elem, name);
	const qualified = qualifyAttr(name);
	if (qualified.ns && typeof value === "string") elem.setAttributeNS(qualified.ns, name, value);
	else if (name === "id") elem.id = `${value}`;
	else elem.setAttribute(name, `${value}`);
}
function setAttributes(elem, attrs) {
	Object.keys(attrs).forEach((name) => {
		setAttribute(elem, name, attrs[name]);
	});
}
function attr(elem, name, value) {
	if (name == null) {
		const attrs = elem.attributes;
		const ret = {};
		for (let i = 0; i < attrs.length; i += 1) ret[attrs[i].name] = attrs[i].value;
		return ret;
	}
	if (typeof name === "string" && value === void 0) return elem.getAttribute(name);
	if (typeof name === "object") setAttributes(elem, name);
	else setAttribute(elem, name, value);
}
function qualifyAttr(name) {
	if (name.indexOf(":") !== -1) {
		const combinedKey = name.split(":");
		return {
			ns: ns[combinedKey[0]],
			local: combinedKey[1]
		};
	}
	return {
		ns: null,
		local: name
	};
}
function kebablizeAttrs(attrs) {
	const result = {};
	Object.keys(attrs).forEach((key) => {
		const name = CASE_SENSITIVE_ATTR.includes(key) ? key : kebabCase(key);
		result[name] = attrs[key];
	});
	return result;
}
function styleToObject(styleString) {
	const ret = {};
	styleString.split(";").forEach((item) => {
		const section = item.trim();
		if (section) {
			const pair = section.split("=");
			if (pair.length) ret[pair[0].trim()] = pair[1] ? pair[1].trim() : "";
		}
	});
	return ret;
}
function mergeAttrs(target, source) {
	Object.keys(source).forEach((attr) => {
		if (attr === "class") target[attr] = target[attr] ? `${target[attr]} ${source[attr]}` : source[attr];
		else if (attr === "style") {
			const to = typeof target[attr] === "object";
			const so = typeof source[attr] === "object";
			let tt;
			let ss;
			if (to && so) {
				tt = target[attr];
				ss = source[attr];
			} else if (to) {
				tt = target[attr];
				ss = styleToObject(source[attr]);
			} else if (so) {
				tt = styleToObject(target[attr]);
				ss = source[attr];
			} else {
				tt = styleToObject(target[attr]);
				ss = styleToObject(source[attr]);
			}
			target[attr] = mergeAttrs(tt, ss);
		} else target[attr] = source[attr];
	});
	return target;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/text/annotate.js
function annotate(t, annotations, opt = {}) {
	const offset = opt.offset || 0;
	const compacted = [];
	const ret = [];
	let curr;
	let prev;
	let batch = null;
	for (let i = 0; i < t.length; i += 1) {
		curr = ret[i] = t[i];
		for (let j = 0, jj = annotations.length; j < jj; j += 1) {
			const annotation = annotations[j];
			const start = annotation.start + offset;
			const end = annotation.end + offset;
			if (i >= start && i < end) {
				if (typeof curr === "string") curr = ret[i] = {
					t: t[i],
					attrs: annotation.attrs
				};
				else curr.attrs = mergeAttrs(mergeAttrs({}, curr.attrs), annotation.attrs);
				if (opt.includeAnnotationIndices) {
					if (curr.annotations == null) curr.annotations = [];
					curr.annotations.push(j);
				}
			}
		}
		prev = ret[i - 1];
		if (!prev) batch = curr;
		else if (isObject(curr) && isObject(prev)) {
			batch = batch;
			if (JSON.stringify(curr.attrs) === JSON.stringify(prev.attrs)) batch.t += curr.t;
			else {
				compacted.push(batch);
				batch = curr;
			}
		} else if (isObject(curr)) {
			batch = batch;
			compacted.push(batch);
			batch = curr;
		} else if (isObject(prev)) {
			batch = batch;
			compacted.push(batch);
			batch = curr;
		} else batch = (batch || "") + curr;
	}
	if (batch != null) compacted.push(batch);
	return compacted;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/text/sanitize.js
/**
* Replaces all spaces with the Unicode No-break space.
* ref: http://www.fileformat.info/info/unicode/char/a0/index.htm
*
* IE would otherwise collapse all spaces into one. This is useful
* e.g. in tests when you want to compare the actual DOM text content
* without having to add the unicode character in the place of all spaces.
*/
function sanitize(text) {
	return text.replace(/ /g, "\xA0");
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/datauri/index.js
var DataUri;
(function(DataUri) {
	function isDataUrl(url) {
		return url.substr(0, 5) === "data:";
	}
	DataUri.isDataUrl = isDataUrl;
	/**
	* Converts an image at `url` to base64-encoded data uri.
	* The mime type of the image is inferred from the `url` file extension.
	*/
	function imageToDataUri(url, callback) {
		if (!url || isDataUrl(url)) {
			setTimeout(() => callback(null, url));
			return;
		}
		const onError = () => {
			callback(/* @__PURE__ */ new Error(`Failed to load image: ${url}`));
		};
		const onLoad = window.FileReader ? (xhr) => {
			if (xhr.status === 200) {
				const reader = new FileReader();
				reader.onload = (evt) => {
					const dataUri = evt.target.result;
					callback(null, dataUri);
				};
				reader.onerror = onError;
				reader.readAsDataURL(xhr.response);
			} else onError();
		} : (xhr) => {
			const toString = (u8a) => {
				const CHUNK_SZ = 32768;
				const c = [];
				for (let i = 0; i < u8a.length; i += CHUNK_SZ) c.push(String.fromCharCode.apply(null, u8a.subarray(i, i + CHUNK_SZ)));
				return c.join("");
			};
			if (xhr.status === 200) {
				let suffix = url.split(".").pop() || "png";
				if (suffix === "svg") suffix = "svg+xml";
				const meta = `data:image/${suffix};base64,`;
				const bytes = new Uint8Array(xhr.response);
				callback(null, meta + btoa(toString(bytes)));
			} else onError();
		};
		const xhr = new XMLHttpRequest();
		xhr.responseType = window.FileReader ? "blob" : "arraybuffer";
		xhr.open("GET", url, true);
		xhr.addEventListener("error", onError);
		xhr.addEventListener("load", () => onLoad(xhr));
		xhr.send();
	}
	DataUri.imageToDataUri = imageToDataUri;
	function dataUriToBlob(dataUrl) {
		let uri = dataUrl.replace(/\s/g, "");
		uri = decodeURIComponent(uri);
		const index = uri.indexOf(",");
		const dataType = uri.slice(0, index);
		const mime = dataType.split(":")[1].split(";")[0];
		const data = uri.slice(index + 1);
		let decodedString;
		if (dataType.indexOf("base64") >= 0) decodedString = atob(data);
		else decodedString = unescape(encodeURIComponent(data));
		const ia = new Uint8Array(decodedString.length);
		for (let i = 0; i < decodedString.length; i += 1) ia[i] = decodedString.charCodeAt(i);
		return new Blob([ia], { type: mime });
	}
	DataUri.dataUriToBlob = dataUriToBlob;
	function downloadBlob(blob, fileName) {
		const msSaveBlob = window.navigator.msSaveBlob;
		if (msSaveBlob) msSaveBlob(blob, fileName);
		else {
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = fileName;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		}
	}
	DataUri.downloadBlob = downloadBlob;
	function downloadDataUri(dataUrl, fileName) {
		downloadBlob(dataUriToBlob(dataUrl), fileName);
	}
	DataUri.downloadDataUri = downloadDataUri;
	function parseViewBox(svg) {
		const matches = svg.match(/<svg[^>]*viewBox\s*=\s*(["']?)(.+?)\1[^>]*>/i);
		if (matches && matches[2]) return matches[2].replace(/\s+/, " ").split(" ");
		return null;
	}
	function getNumber(str) {
		const ret = parseFloat(str);
		return Number.isNaN(ret) ? null : ret;
	}
	function svgToDataUrl(svg, options = {}) {
		let viewBox = null;
		const getNumberFromViewBox = (index) => {
			if (viewBox == null) viewBox = parseViewBox(svg);
			if (viewBox != null) return getNumber(viewBox[index]);
			return null;
		};
		const getNumberFromMatches = (reg) => {
			const matches = svg.match(reg);
			if (matches && matches[2]) return getNumber(matches[2]);
			return null;
		};
		let w = options.width;
		if (w == null) w = getNumberFromMatches(/<svg[^>]*width\s*=\s*(["']?)(.+?)\1[^>]*>/i);
		if (w == null) w = getNumberFromViewBox(2);
		if (w == null) throw new Error("Can not parse width from svg string");
		let h = options.height;
		if (h == null) h = getNumberFromMatches(/<svg[^>]*height\s*=\s*(["']?)(.+?)\1[^>]*>/i);
		if (h == null) h = getNumberFromViewBox(3);
		if (h == null) throw new Error("Can not parse height from svg string");
		return `data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, "%27").replace(/"/g, "%22")}`;
	}
	DataUri.svgToDataUrl = svgToDataUrl;
})(DataUri || (DataUri = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/unit/index.js
var millimeterSize;
var supportedUnits = {
	px(val) {
		return val;
	},
	mm(val) {
		return millimeterSize * val;
	},
	cm(val) {
		return millimeterSize * val * 10;
	},
	in(val) {
		return millimeterSize * val * 25.4;
	},
	pt(val) {
		return millimeterSize * (25.4 * val / 72);
	},
	pc(val) {
		return millimeterSize * (25.4 * val / 6);
	}
};
var Unit;
(function(Unit) {
	function measure(cssWidth, cssHeight, unit) {
		const div = document.createElement("div");
		const style = div.style;
		style.display = "inline-block";
		style.position = "absolute";
		style.left = "-15000px";
		style.top = "-15000px";
		style.width = cssWidth + (unit || "px");
		style.height = cssHeight + (unit || "px");
		document.body.appendChild(div);
		const rect = div.getBoundingClientRect();
		const size = {
			width: rect.width || 0,
			height: rect.height || 0
		};
		document.body.removeChild(div);
		return size;
	}
	Unit.measure = measure;
	function toPx(val, unit) {
		if (millimeterSize == null) millimeterSize = measure("1", "1", "mm").width;
		const convert = unit ? supportedUnits[unit] : null;
		if (convert) return convert(val);
		return val;
	}
	Unit.toPx = toPx;
})(Unit || (Unit = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/prefix.js
var hyphenPattern = /-(.)/g;
function camelize(str) {
	return str.replace(hyphenPattern, (_, char) => char.toUpperCase());
}
var memoized = {};
var prefixes = [
	"webkit",
	"ms",
	"moz",
	"o"
];
var testStyle = typeof document !== "undefined" ? document.createElement("div").style : {};
function getWithPrefix(name) {
	for (let i = 0; i < prefixes.length; i += 1) {
		const prefixedName = prefixes[i] + name;
		if (prefixedName in testStyle) return prefixedName;
	}
	return null;
}
function getVendorPrefixedName(property) {
	const name = camelize(property);
	if (memoized[name] == null) {
		const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
		memoized[name] = name in testStyle ? name : getWithPrefix(capitalizedName);
	}
	return memoized[name];
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/style.js
function getComputedStyle$1(elem, name) {
	const computed = elem.ownerDocument && elem.ownerDocument.defaultView && elem.ownerDocument.defaultView.opener ? elem.ownerDocument.defaultView.getComputedStyle(elem, null) : window.getComputedStyle(elem, null);
	if (computed && name) return computed.getPropertyValue(name) || computed[name];
	return computed;
}
(function() {
	if (typeof document == "undefined") return function() {};
	const doc = document;
	if (doc.selection) return function() {
		doc.selection.empty();
	};
	if (window.getSelection) return function() {
		const selection = window.getSelection();
		if (selection) {
			if (selection.empty) selection.empty();
			else if (selection.removeAllRanges) selection.removeAllRanges();
		}
	};
	return function() {};
})();
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/css.js
var numericProps = {
	animationIterationCount: true,
	columnCount: true,
	flexGrow: true,
	flexShrink: true,
	fontWeight: true,
	gridArea: true,
	gridColumn: true,
	gridColumnEnd: true,
	gridColumnStart: true,
	gridRow: true,
	gridRowEnd: true,
	gridRowStart: true,
	lineHeight: true,
	opacity: true,
	order: true,
	orphans: true,
	widows: true,
	zIndex: true
};
function isCSSVariable(prop) {
	return /^--/.test(prop);
}
function computeStyle(elem, prop, isVariable) {
	const style = window.getComputedStyle(elem, null);
	return isVariable ? style.getPropertyValue(prop) || void 0 : style[prop] || elem.style[prop];
}
function computeStyleInt(elem, prop) {
	return parseInt(computeStyle(elem, prop), 10) || 0;
}
function getSuffixedValue(prop, value) {
	return !numericProps[prop] && typeof value === "number" ? `${value}px` : value;
}
function css(elem, prop, value) {
	if (typeof prop === "string") {
		const isVariable = isCSSVariable(prop);
		if (!isVariable) prop = getVendorPrefixedName(prop);
		if (value === void 0) return computeStyle(elem, prop, isVariable);
		if (!isVariable) value = getSuffixedValue(prop, value);
		const style = elem.style;
		if (isVariable) style.setProperty(prop, value);
		else style[prop] = value;
		return;
	}
	for (const key in prop) css(elem, key, prop[key]);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/data.js
var dataset = /* @__PURE__ */ new WeakMap();
function getData(elem, name) {
	const key = camelCase(name);
	const cache = dataset.get(elem);
	if (cache) return cache[key];
}
function setData(elem, name, value) {
	const key = camelCase(name);
	const cache = dataset.get(elem);
	if (cache) cache[key] = value;
	else dataset.set(elem, { [key]: value });
}
function data(elem, name, value) {
	if (!name) {
		const datas = {};
		Object.keys(dataset).forEach((key) => {
			datas[key] = getData(elem, key);
		});
		return datas;
	}
	if (typeof name === "string") {
		if (value === void 0) return getData(elem, name);
		setData(elem, name, value);
		return;
	}
	for (const key in name) data(elem, key, name[key]);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/vector/index.js
var Vector = class Vector {
	get [Symbol.toStringTag]() {
		return Vector.toStringTag;
	}
	get type() {
		return this.node.nodeName;
	}
	get id() {
		return this.node.id;
	}
	set id(id) {
		this.node.id = id;
	}
	constructor(elem, attrs, children) {
		if (!elem) throw new TypeError("Invalid element to create vector");
		let node;
		if (Vector.isVector(elem)) node = elem.node;
		else if (typeof elem === "string") if (elem.toLowerCase() === "svg") node = createSvgDocument();
		else if (elem[0] === "<") {
			const doc = createSvgDocument(elem);
			node = document.importNode(doc.firstChild, true);
		} else node = document.createElementNS(ns.svg, elem);
		else node = elem;
		this.node = node;
		if (attrs) this.setAttributes(attrs);
		if (children) this.append(children);
	}
	transform(matrix, options) {
		if (matrix == null) return transform(this.node);
		transform(this.node, matrix, options);
		return this;
	}
	translate(tx, ty = 0, options = {}) {
		if (tx == null) return translate(this.node);
		translate(this.node, tx, ty, options);
		return this;
	}
	rotate(angle, cx, cy, options = {}) {
		if (angle == null) return rotate$1(this.node);
		rotate$1(this.node, angle, cx, cy, options);
		return this;
	}
	scale(sx, sy) {
		if (sx == null) return scale(this.node);
		scale(this.node, sx, sy);
		return this;
	}
	/**
	* Returns an SVGMatrix that specifies the transformation necessary
	* to convert this coordinate system into `target` coordinate system.
	*/
	getTransformToElement(target) {
		const ref = Vector.toNode(target);
		return getTransformToElement(this.node, ref);
	}
	removeAttribute(name) {
		removeAttribute(this.node, name);
		return this;
	}
	getAttribute(name) {
		return getAttribute(this.node, name);
	}
	setAttribute(name, value) {
		setAttribute(this.node, name, value);
		return this;
	}
	setAttributes(attrs) {
		setAttributes(this.node, attrs);
		return this;
	}
	attr(name, value) {
		if (name == null) return attr(this.node);
		if (typeof name === "string" && value === void 0) return attr(this.node, name);
		if (typeof name === "object") attr(this.node, name);
		else attr(this.node, name, value);
		return this;
	}
	svg() {
		return this.node instanceof SVGSVGElement ? this : Vector.create(this.node.ownerSVGElement);
	}
	defs() {
		const context = this.svg() || this;
		const defsNode = context.node.getElementsByTagName("defs")[0];
		if (defsNode) return Vector.create(defsNode);
		return Vector.create("defs").appendTo(context);
	}
	text(content, options = {}) {
		text$1(this.node, content, options);
		return this;
	}
	tagName() {
		return tagName(this.node);
	}
	clone() {
		return Vector.create(this.node.cloneNode(true));
	}
	remove() {
		remove(this.node);
		return this;
	}
	empty() {
		empty(this.node);
		return this;
	}
	append(elems) {
		append(this.node, Vector.toNodes(elems));
		return this;
	}
	appendTo(target) {
		appendTo(this.node, Vector.isVector(target) ? target.node : target);
		return this;
	}
	prepend(elems) {
		prepend(this.node, Vector.toNodes(elems));
		return this;
	}
	before(elems) {
		before(this.node, Vector.toNodes(elems));
		return this;
	}
	replace(elem) {
		if (this.node.parentNode) this.node.parentNode.replaceChild(Vector.toNode(elem), this.node);
		return Vector.create(elem);
	}
	first() {
		return this.node.firstChild ? Vector.create(this.node.firstChild) : null;
	}
	last() {
		return this.node.lastChild ? Vector.create(this.node.lastChild) : null;
	}
	get(index) {
		const child = this.node.childNodes[index];
		return child ? Vector.create(child) : null;
	}
	indexOf(elem) {
		return Array.prototype.slice.call(this.node.childNodes).indexOf(Vector.toNode(elem));
	}
	find(selector) {
		const vels = [];
		const nodes = find(this.node, selector);
		if (nodes) for (let i = 0, ii = nodes.length; i < ii; i += 1) vels.push(Vector.create(nodes[i]));
		return vels;
	}
	findOne(selector) {
		const found = findOne(this.node, selector);
		return found ? Vector.create(found) : null;
	}
	findParentByClass(className, terminator) {
		const node = findParentByClass(this.node, className, terminator);
		return node ? Vector.create(node) : null;
	}
	matches(selector) {
		const node = this.node;
		this.node.matches;
		const matcher = node.matches || node.matchesSelector || node.msMatchesSelector || node.mozMatchesSelector || node.webkitMatchesSelector || node.oMatchesSelector || null;
		return matcher && matcher.call(node, selector);
	}
	contains(child) {
		return contains(this.node, Vector.isVector(child) ? child.node : child);
	}
	wrap(node) {
		const vel = Vector.create(node);
		const parentNode = this.node.parentNode;
		if (parentNode != null) parentNode.insertBefore(vel.node, this.node);
		return vel.append(this);
	}
	parent(type) {
		let parent = this;
		if (parent.node.parentNode == null) return null;
		parent = Vector.create(parent.node.parentNode);
		if (type == null) return parent;
		do
			if (typeof type === "string" ? parent.matches(type) : parent instanceof type) return parent;
		while (parent = Vector.create(parent.node.parentNode));
		return parent;
	}
	children() {
		const children = this.node.childNodes;
		const vels = [];
		for (let i = 0; i < children.length; i += 1) if (children[i].nodeType === 1) vels.push(Vector.create(children[i]));
		return vels;
	}
	eachChild(fn, deep) {
		const children = this.children();
		for (let i = 0, l = children.length; i < l; i += 1) {
			fn.call(children[i], children[i], i, children);
			if (deep) children[i].eachChild(fn, deep);
		}
		return this;
	}
	index() {
		return index(this.node);
	}
	hasClass(className) {
		return hasClass(this.node, className);
	}
	addClass(className) {
		addClass(this.node, className);
		return this;
	}
	removeClass(className) {
		removeClass(this.node, className);
		return this;
	}
	toggleClass(className, stateVal) {
		toggleClass(this.node, className, stateVal);
		return this;
	}
	toLocalPoint(x, y) {
		return toLocalPoint(this.node, x, y);
	}
	/**
	* Samples the underlying SVG element (it currently works only on
	* paths - where it is most useful anyway). Returns an array of objects
	* of the form `{ x: Number, y: Number, distance: Number }`. Each of these
	* objects represent a point on the path. This basically creates a discrete
	* representation of the path (which is possible a curve). The sampling
	* interval defines the accuracy of the sampling. In other words, we travel
	* from the beginning of the path to the end by interval distance (on the
	* path, not between the resulting points) and collect the discrete points
	* on the path. This is very useful in many situations. For example, SVG
	* does not provide a built-in mechanism to find intersections between two
	* paths. Using sampling, we can just generate bunch of points for each of
	* the path and find the closest ones from each set.
	*/
	sample(interval = 1) {
		if (this.node instanceof SVGPathElement) return sample(this.node, interval);
		return [];
	}
	toPath() {
		return Vector.create(toPath(this.node));
	}
	toPathData() {
		return toPathData(this.node);
	}
};
(function(Vector) {
	Vector.toStringTag = `X6.${Vector.name}`;
	function isVector(instance) {
		if (instance == null) return false;
		if (instance instanceof Vector) return true;
		const tag = instance[Symbol.toStringTag];
		const vector = instance;
		if ((tag == null || tag === Vector.toStringTag) && vector.node instanceof SVGElement && typeof vector.sample === "function" && typeof vector.toPath === "function") return true;
		return false;
	}
	Vector.isVector = isVector;
	function create(elem, attrs, children) {
		return new Vector(elem, attrs, children);
	}
	Vector.create = create;
	function createVectors(markup) {
		if (markup[0] === "<") {
			const svgDoc = createSvgDocument(markup);
			const vels = [];
			for (let i = 0, ii = svgDoc.childNodes.length; i < ii; i += 1) {
				const childNode = svgDoc.childNodes[i];
				vels.push(create(document.importNode(childNode, true)));
			}
			return vels;
		}
		return [create(markup)];
	}
	Vector.createVectors = createVectors;
	function toNode(elem) {
		if (isVector(elem)) return elem.node;
		return elem;
	}
	Vector.toNode = toNode;
	function toNodes(elems) {
		if (Array.isArray(elems)) return elems.map((elem) => toNode(elem));
		return [toNode(elems)];
	}
	Vector.toNodes = toNodes;
})(Vector || (Vector = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/text.js
function createTextPathNode(attrs, elem) {
	const vel = Vector.create(elem);
	const textPath = Vector.create("textPath");
	const d = attrs.d;
	if (d && attrs["xlink:href"] === void 0) {
		const path = Vector.create("path").attr("d", d).appendTo(vel.defs());
		textPath.attr("xlink:href", `#${path.id}`);
	}
	if (typeof attrs === "object") textPath.attr(attrs);
	return textPath.node;
}
function annotateTextLine(lineNode, lineAnnotations, options) {
	const eol = options.eol;
	const baseSize = options.baseSize;
	const lineHeight = options.lineHeight;
	let maxFontSize = 0;
	let tspanNode;
	const fontMetrics = {};
	const lastJ = lineAnnotations.length - 1;
	for (let j = 0; j <= lastJ; j += 1) {
		let annotation = lineAnnotations[j];
		let fontSize = null;
		if (typeof annotation === "object") {
			const annotationAttrs = annotation.attrs;
			const vTSpan = Vector.create("tspan", annotationAttrs);
			tspanNode = vTSpan.node;
			let t = annotation.t;
			if (eol && j === lastJ) t += eol;
			tspanNode.textContent = t;
			const annotationClass = annotationAttrs.class;
			if (annotationClass) vTSpan.addClass(annotationClass);
			if (options.includeAnnotationIndices) vTSpan.attr("annotations", annotation.annotations.join(","));
			fontSize = parseFloat(annotationAttrs["font-size"]);
			if (fontSize === void 0) fontSize = baseSize;
			if (fontSize && fontSize > maxFontSize) maxFontSize = fontSize;
		} else {
			if (eol && j === lastJ) annotation += eol;
			tspanNode = document.createTextNode(annotation || " ");
			if (baseSize && baseSize > maxFontSize) maxFontSize = baseSize;
		}
		lineNode.appendChild(tspanNode);
	}
	if (maxFontSize) fontMetrics.maxFontSize = maxFontSize;
	if (lineHeight) fontMetrics.lineHeight = lineHeight;
	else if (maxFontSize) fontMetrics.lineHeight = maxFontSize * 1.2;
	return fontMetrics;
}
var emRegex = /em$/;
function emToPx(em, fontSize) {
	const numerical = parseFloat(em);
	if (emRegex.test(em)) return numerical * fontSize;
	return numerical;
}
function calculateDY(alignment, linesMetrics, baseSizePx, lineHeight) {
	if (!Array.isArray(linesMetrics)) return 0;
	const n = linesMetrics.length;
	if (!n) return 0;
	let lineMetrics = linesMetrics[0];
	const flMaxFont = emToPx(lineMetrics.maxFontSize, baseSizePx) || baseSizePx;
	let rLineHeights = 0;
	const lineHeightPx = emToPx(lineHeight, baseSizePx);
	for (let i = 1; i < n; i += 1) {
		lineMetrics = linesMetrics[i];
		const iLineHeight = emToPx(lineMetrics.lineHeight, baseSizePx) || lineHeightPx;
		rLineHeights += iLineHeight;
	}
	const llMaxFont = emToPx(lineMetrics.maxFontSize, baseSizePx) || baseSizePx;
	let dy;
	switch (alignment) {
		case "middle":
			dy = flMaxFont / 2 - .15 * llMaxFont - rLineHeights / 2;
			break;
		case "bottom":
			dy = -(.25 * llMaxFont) - rLineHeights;
			break;
		default: dy = .8 * flMaxFont;
	}
	return dy;
}
function text$1(elem, content, options = {}) {
	content = sanitize(content);
	const eol = options.eol;
	let textPath = options.textPath;
	const verticalAnchor = options.textVerticalAnchor;
	const namedVerticalAnchor = verticalAnchor === "middle" || verticalAnchor === "bottom" || verticalAnchor === "top";
	let x = options.x;
	if (x === void 0) x = elem.getAttribute("x") || 0;
	const iai = options.includeAnnotationIndices;
	let annotations = options.annotations;
	if (annotations && !Array.isArray(annotations)) annotations = [annotations];
	const defaultLineHeight = options.lineHeight;
	const autoLineHeight = defaultLineHeight === "auto";
	const lineHeight = autoLineHeight ? "1.5em" : defaultLineHeight || "1em";
	let needEmpty = true;
	const childNodes = elem.childNodes;
	if (childNodes.length === 1) {
		const node = childNodes[0];
		if (node && node.tagName.toUpperCase() === "TITLE") needEmpty = false;
	}
	if (needEmpty) empty(elem);
	attr(elem, {
		"xml:space": "preserve",
		display: content || options.displayEmpty ? null : "none"
	});
	const strFontSize = attr(elem, "font-size");
	let fontSize = parseFloat(strFontSize);
	if (!fontSize) {
		fontSize = 16;
		if ((namedVerticalAnchor || annotations) && !strFontSize) attr(elem, "font-size", `${fontSize}`);
	}
	let containerNode;
	if (textPath) {
		if (typeof textPath === "string") textPath = { d: textPath };
		containerNode = createTextPathNode(textPath, elem);
	} else containerNode = document.createDocumentFragment();
	let dy;
	let offset = 0;
	let annotatedY;
	const lines = content.split("\n");
	const linesMetrics = [];
	const lastI = lines.length - 1;
	for (let i = 0; i <= lastI; i += 1) {
		dy = lineHeight;
		let lineClassName = "v-line";
		const lineNode = createSvgElement("tspan");
		let lineMetrics;
		let line = lines[i];
		if (line) if (annotations) {
			lineMetrics = annotateTextLine(lineNode, annotate(line, annotations, {
				offset: -offset,
				includeAnnotationIndices: iai
			}), {
				eol: i !== lastI && eol,
				baseSize: fontSize,
				lineHeight: autoLineHeight ? null : lineHeight,
				includeAnnotationIndices: iai
			});
			const iLineHeight = lineMetrics.lineHeight;
			if (iLineHeight && autoLineHeight && i !== 0) dy = iLineHeight;
			if (i === 0) annotatedY = lineMetrics.maxFontSize * .8;
		} else {
			if (eol && i !== lastI) line += eol;
			lineNode.textContent = line;
		}
		else {
			lineNode.textContent = "-";
			lineClassName += " v-empty-line";
			const lineNodeStyle = lineNode.style;
			lineNodeStyle.fillOpacity = 0;
			lineNodeStyle.strokeOpacity = 0;
			if (annotations) lineMetrics = {};
		}
		if (lineMetrics) linesMetrics.push(lineMetrics);
		if (i > 0) lineNode.setAttribute("dy", dy);
		if (i > 0 || textPath) lineNode.setAttribute("x", x);
		lineNode.className.baseVal = lineClassName;
		containerNode.appendChild(lineNode);
		offset += line.length + 1;
	}
	if (namedVerticalAnchor) if (annotations) dy = calculateDY(verticalAnchor, linesMetrics, fontSize, lineHeight);
	else if (verticalAnchor === "top") dy = "0.8em";
	else {
		let rh;
		if (lastI > 0) {
			rh = parseFloat(lineHeight) || 1;
			rh *= lastI;
			if (!emRegex.test(lineHeight)) rh /= fontSize;
		} else rh = 0;
		switch (verticalAnchor) {
			case "middle":
				dy = `${.3 - rh / 2}em`;
				break;
			case "bottom": dy = `${-rh - .3}em`;
		}
	}
	else if (verticalAnchor === 0) dy = "0em";
	else if (verticalAnchor) dy = verticalAnchor;
	else {
		dy = 0;
		if (elem.getAttribute("y") == null) elem.setAttribute("y", `${annotatedY || "0.8em"}`);
	}
	containerNode.firstChild.setAttribute("dy", dy);
	elem.appendChild(containerNode);
}
function measureText(text, styles = {}) {
	const canvasContext = document.createElement("canvas").getContext("2d");
	if (!text) return { width: 0 };
	const font = [];
	const fontSize = styles["font-size"] ? `${parseFloat(styles["font-size"])}px` : "14px";
	font.push(styles["font-style"] || "normal");
	font.push(styles["font-variant"] || "normal");
	font.push(styles["font-weight"] || 400);
	font.push(fontSize);
	font.push(styles["font-family"] || "sans-serif");
	canvasContext.font = font.join(" ");
	return canvasContext.measureText(text);
}
function splitTextByLength(text, splitWidth, totalWidth, style = {}) {
	if (splitWidth >= totalWidth) return [text, ""];
	const length = text.length;
	const caches = {};
	let index = Math.round(splitWidth / totalWidth * length - 1);
	if (index < 0) index = 0;
	while (index >= 0 && index < length) {
		const frontText = text.slice(0, index);
		const frontWidth = caches[frontText] || measureText(frontText, style).width;
		const behindText = text.slice(0, index + 1);
		const behindWidth = caches[behindText] || measureText(behindText, style).width;
		caches[frontText] = frontWidth;
		caches[behindText] = behindWidth;
		if (frontWidth > splitWidth) index -= 1;
		else if (behindWidth <= splitWidth) index += 1;
		else break;
	}
	return [text.slice(0, index), text.slice(index)];
}
function breakText(text, size, styles = {}, options = {}) {
	const width = size.width;
	const height = size.height;
	const eol = options.eol || "\n";
	const fontSize = styles.fontSize || 14;
	const lineHeight = styles.lineHeight ? parseFloat(styles.lineHeight) : Math.ceil(fontSize * 1.4);
	const maxLines = Math.floor(height / lineHeight);
	if (text.indexOf(eol) > -1) {
		const delimiter = uuid();
		const splitText = [];
		text.split(eol).map((line) => {
			const part = breakText(line, Object.assign(Object.assign({}, size), { height: Number.MAX_SAFE_INTEGER }), styles, Object.assign(Object.assign({}, options), { eol: delimiter }));
			if (part) splitText.push(...part.split(delimiter));
		});
		return splitText.slice(0, maxLines).join(eol);
	}
	const { width: textWidth } = measureText(text, styles);
	if (textWidth < width) return text;
	const lines = [];
	let remainText = text;
	let remainWidth = textWidth;
	let ellipsis = options.ellipsis;
	let ellipsisWidth = 0;
	if (ellipsis) {
		if (typeof ellipsis !== "string") ellipsis = "…";
		ellipsisWidth = measureText(ellipsis, styles).width;
	}
	for (let i = 0; i < maxLines; i += 1) if (remainWidth > width) if (i === maxLines - 1) {
		const [front] = splitTextByLength(remainText, width - ellipsisWidth, remainWidth, styles);
		lines.push(ellipsis ? `${front}${ellipsis}` : front);
	} else {
		const [front, behind] = splitTextByLength(remainText, width, remainWidth, styles);
		lines.push(front);
		remainText = behind;
		remainWidth = measureText(remainText, styles).width;
	}
	else {
		lines.push(remainText);
		break;
	}
	return lines.join(eol);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/path.js
var KAPPA = .551784;
function getNumbericAttribute(elem, attr, defaultValue = NaN) {
	const v = elem.getAttribute(attr);
	if (v == null) return defaultValue;
	const n = parseFloat(v);
	return Number.isNaN(n) ? defaultValue : n;
}
function sample(elem, interval = 1) {
	const length = elem.getTotalLength();
	const samples = [];
	let distance = 0;
	let sample;
	while (distance < length) {
		sample = elem.getPointAtLength(distance);
		samples.push({
			distance,
			x: sample.x,
			y: sample.y
		});
		distance += interval;
	}
	return samples;
}
function lineToPathData(line) {
	return [
		"M",
		getNumbericAttribute(line, "x1"),
		getNumbericAttribute(line, "y1"),
		"L",
		getNumbericAttribute(line, "x2"),
		getNumbericAttribute(line, "y2")
	].join(" ");
}
function polygonToPathData(polygon) {
	const points = getPointsFromSvgElement(polygon);
	if (points.length === 0) return null;
	return `${svgPointsToPath(points)} Z`;
}
function polylineToPathData(polyline) {
	const points = getPointsFromSvgElement(polyline);
	if (points.length === 0) return null;
	return svgPointsToPath(points);
}
function svgPointsToPath(points) {
	return `M ${points.map((p) => `${p.x} ${p.y}`).join(" L")}`;
}
function getPointsFromSvgElement(elem) {
	const points = [];
	const nodePoints = elem.points;
	if (nodePoints) for (let i = 0, ii = nodePoints.numberOfItems; i < ii; i += 1) points.push(nodePoints.getItem(i));
	return points;
}
function circleToPathData(circle) {
	const cx = getNumbericAttribute(circle, "cx", 0);
	const cy = getNumbericAttribute(circle, "cy", 0);
	const r = getNumbericAttribute(circle, "r");
	const cd = r * KAPPA;
	return [
		"M",
		cx,
		cy - r,
		"C",
		cx + cd,
		cy - r,
		cx + r,
		cy - cd,
		cx + r,
		cy,
		"C",
		cx + r,
		cy + cd,
		cx + cd,
		cy + r,
		cx,
		cy + r,
		"C",
		cx - cd,
		cy + r,
		cx - r,
		cy + cd,
		cx - r,
		cy,
		"C",
		cx - r,
		cy - cd,
		cx - cd,
		cy - r,
		cx,
		cy - r,
		"Z"
	].join(" ");
}
function ellipseToPathData(ellipse) {
	const cx = getNumbericAttribute(ellipse, "cx", 0);
	const cy = getNumbericAttribute(ellipse, "cy", 0);
	const rx = getNumbericAttribute(ellipse, "rx");
	const ry = getNumbericAttribute(ellipse, "ry") || rx;
	const cdx = rx * KAPPA;
	const cdy = ry * KAPPA;
	return [
		"M",
		cx,
		cy - ry,
		"C",
		cx + cdx,
		cy - ry,
		cx + rx,
		cy - cdy,
		cx + rx,
		cy,
		"C",
		cx + rx,
		cy + cdy,
		cx + cdx,
		cy + ry,
		cx,
		cy + ry,
		"C",
		cx - cdx,
		cy + ry,
		cx - rx,
		cy + cdy,
		cx - rx,
		cy,
		"C",
		cx - rx,
		cy - cdy,
		cx - cdx,
		cy - ry,
		cx,
		cy - ry,
		"Z"
	].join(" ");
}
function rectangleToPathData(rect) {
	return rectToPathData({
		x: getNumbericAttribute(rect, "x", 0),
		y: getNumbericAttribute(rect, "y", 0),
		width: getNumbericAttribute(rect, "width", 0),
		height: getNumbericAttribute(rect, "height", 0),
		rx: getNumbericAttribute(rect, "rx", 0),
		ry: getNumbericAttribute(rect, "ry", 0)
	});
}
function rectToPathData(r) {
	let d;
	const x = r.x;
	const y = r.y;
	const width = r.width;
	const height = r.height;
	const topRx = Math.min(r.rx || r["top-rx"] || 0, width / 2);
	const bottomRx = Math.min(r.rx || r["bottom-rx"] || 0, width / 2);
	const topRy = Math.min(r.ry || r["top-ry"] || 0, height / 2);
	const bottomRy = Math.min(r.ry || r["bottom-ry"] || 0, height / 2);
	if (topRx || bottomRx || topRy || bottomRy) d = [
		"M",
		x,
		y + topRy,
		"v",
		height - topRy - bottomRy,
		"a",
		bottomRx,
		bottomRy,
		0,
		0,
		0,
		bottomRx,
		bottomRy,
		"h",
		width - 2 * bottomRx,
		"a",
		bottomRx,
		bottomRy,
		0,
		0,
		0,
		bottomRx,
		-bottomRy,
		"v",
		-(height - bottomRy - topRy),
		"a",
		topRx,
		topRy,
		0,
		0,
		0,
		-topRx,
		-topRy,
		"h",
		-(width - 2 * topRx),
		"a",
		topRx,
		topRy,
		0,
		0,
		0,
		-topRx,
		topRy,
		"Z"
	];
	else d = [
		"M",
		x,
		y,
		"H",
		x + width,
		"V",
		y + height,
		"H",
		x,
		"V",
		y,
		"Z"
	];
	return d.join(" ");
}
function toPath(elem) {
	const path = createSvgElement("path");
	attr(path, attr(elem));
	const d = toPathData(elem);
	if (d) path.setAttribute("d", d);
	return path;
}
function toPathData(elem) {
	const tagName = elem.tagName.toLowerCase();
	switch (tagName) {
		case "path": return elem.getAttribute("d");
		case "line": return lineToPathData(elem);
		case "polygon": return polygonToPathData(elem);
		case "polyline": return polylineToPathData(elem);
		case "ellipse": return ellipseToPathData(elem);
		case "circle": return circleToPathData(elem);
		case "rect": return rectangleToPathData(elem);
	}
	throw new Error(`"${tagName}" cannot be converted to svg path element.`);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/matrix.js
var transformRegex = /(\w+)\(([^,)]+),?([^)]+)?\)/gi;
var transformSeparatorRegex = /[ ,]+/;
var transformationListRegex = /^(\w+)\((.*)\)/;
/**
* Returns a SVG point object initialized with the `x` and `y` coordinates.
* @see https://developer.mozilla.org/en/docs/Web/API/SVGPoint
*/
function createSVGPoint(x, y) {
	const p = createSvgElement("svg").createSVGPoint();
	p.x = x;
	p.y = y;
	return p;
}
/**
* Returns the SVG transformation matrix initialized with the given matrix.
*
* The given matrix is an object of the form:
* {
*   a: number
*   b: number
*   c: number
*   d: number
*   e: number
*   f: number
* }
*
* @see https://developer.mozilla.org/en/docs/Web/API/SVGMatrix
*/
function createSVGMatrix(matrix) {
	const mat = createSvgElement("svg").createSVGMatrix();
	if (matrix != null) {
		const source = matrix;
		const target = mat;
		for (const key in source) target[key] = source[key];
	}
	return mat;
}
/**
* Returns a SVG transform object.
* @see https://developer.mozilla.org/en/docs/Web/API/SVGTransform
*/
function createSVGTransform(matrix) {
	const svgDocument = createSvgElement("svg");
	if (matrix != null) {
		if (!(matrix instanceof DOMMatrix)) matrix = createSVGMatrix(matrix);
		return svgDocument.createSVGTransformFromMatrix(matrix);
	}
	return svgDocument.createSVGTransform();
}
/**
* Returns the SVG transformation matrix built from the `transformString`.
*
* E.g. 'translate(10,10) scale(2,2)' will result in matrix:
* `{ a: 2, b: 0, c: 0, d: 2, e: 10, f: 10}`
*/
function transformStringToMatrix(transform) {
	let mat = createSVGMatrix();
	const matches = transform != null && transform.match(transformRegex);
	if (!matches) return mat;
	for (let i = 0, n = matches.length; i < n; i += 1) {
		const transformationMatch = matches[i].match(transformationListRegex);
		if (transformationMatch) {
			let sx;
			let sy;
			let tx;
			let ty;
			let angle;
			let ctm = createSVGMatrix();
			const args = transformationMatch[2].split(transformSeparatorRegex);
			switch (transformationMatch[1].toLowerCase()) {
				case "scale":
					sx = parseFloat(args[0]);
					sy = args[1] === void 0 ? sx : parseFloat(args[1]);
					ctm = ctm.scaleNonUniform(sx, sy);
					break;
				case "translate":
					tx = parseFloat(args[0]);
					ty = parseFloat(args[1]);
					ctm = ctm.translate(tx, ty);
					break;
				case "rotate":
					angle = parseFloat(args[0]);
					tx = parseFloat(args[1]) || 0;
					ty = parseFloat(args[2]) || 0;
					if (tx !== 0 || ty !== 0) ctm = ctm.translate(tx, ty).rotate(angle).translate(-tx, -ty);
					else ctm = ctm.rotate(angle);
					break;
				case "skewx":
					angle = parseFloat(args[0]);
					ctm = ctm.skewX(angle);
					break;
				case "skewy":
					angle = parseFloat(args[0]);
					ctm = ctm.skewY(angle);
					break;
				case "matrix":
					ctm.a = parseFloat(args[0]);
					ctm.b = parseFloat(args[1]);
					ctm.c = parseFloat(args[2]);
					ctm.d = parseFloat(args[3]);
					ctm.e = parseFloat(args[4]);
					ctm.f = parseFloat(args[5]);
					break;
				default: continue;
			}
			mat = mat.multiply(ctm);
		}
	}
	return mat;
}
function matrixToTransformString(matrix) {
	const m = matrix || {};
	return `matrix(${m.a != null ? m.a : 1},${m.b != null ? m.b : 0},${m.c != null ? m.c : 0},${m.d != null ? m.d : 1},${m.e != null ? m.e : 0},${m.f != null ? m.f : 0})`;
}
function parseTransformString(transform) {
	let translation;
	let rotation;
	let scale;
	if (transform) {
		const separator = transformSeparatorRegex;
		if (transform.trim().indexOf("matrix") >= 0) {
			const decomposedMatrix = decomposeMatrix(transformStringToMatrix(transform));
			translation = [decomposedMatrix.translateX, decomposedMatrix.translateY];
			rotation = [decomposedMatrix.rotation];
			scale = [decomposedMatrix.scaleX, decomposedMatrix.scaleY];
			const transformations = [];
			if (translation[0] !== 0 || translation[1] !== 0) transformations.push(`translate(${translation.join(",")})`);
			if (scale[0] !== 1 || scale[1] !== 1) transformations.push(`scale(${scale.join(",")})`);
			if (rotation[0] !== 0) transformations.push(`rotate(${rotation[0]})`);
			transform = transformations.join(" ");
		} else {
			const translateMatch = transform.match(/translate\((.*?)\)/);
			if (translateMatch) translation = translateMatch[1].split(separator);
			const rotateMatch = transform.match(/rotate\((.*?)\)/);
			if (rotateMatch) rotation = rotateMatch[1].split(separator);
			const scaleMatch = transform.match(/scale\((.*?)\)/);
			if (scaleMatch) scale = scaleMatch[1].split(separator);
		}
	}
	const sx = scale && scale[0] ? parseFloat(scale[0]) : 1;
	return {
		raw: transform || "",
		translation: {
			tx: translation && translation[0] ? parseInt(translation[0], 10) : 0,
			ty: translation && translation[1] ? parseInt(translation[1], 10) : 0
		},
		rotation: {
			angle: rotation && rotation[0] ? parseInt(rotation[0], 10) : 0,
			cx: rotation && rotation[1] ? parseInt(rotation[1], 10) : void 0,
			cy: rotation && rotation[2] ? parseInt(rotation[2], 10) : void 0
		},
		scale: {
			sx,
			sy: scale && scale[1] ? parseFloat(scale[1]) : sx
		}
	};
}
function deltaTransformPoint(matrix, point) {
	return {
		x: point.x * matrix.a + point.y * matrix.c + 0,
		y: point.x * matrix.b + point.y * matrix.d + 0
	};
}
/**
* Decomposes the SVG transformation matrix into separate transformations.
*
* Returns an object of the form:
* {
*   translateX: number
*   translateY: number
*   scaleX: number
*   scaleY: number
*   skewX: number
*   skewY: number
*   rotation: number
* }
*
* @see https://developer.mozilla.org/en/docs/Web/API/SVGMatrix
*/
function decomposeMatrix(matrix) {
	const px = deltaTransformPoint(matrix, {
		x: 0,
		y: 1
	});
	const py = deltaTransformPoint(matrix, {
		x: 1,
		y: 0
	});
	const skewX = 180 / Math.PI * Math.atan2(px.y, px.x) - 90;
	return {
		skewX,
		skewY: 180 / Math.PI * Math.atan2(py.y, py.x),
		translateX: matrix.e,
		translateY: matrix.f,
		scaleX: Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b),
		scaleY: Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d),
		rotation: skewX
	};
}
function matrixToScale(matrix) {
	let a;
	let b;
	let c;
	let d;
	if (matrix) {
		a = matrix.a == null ? 1 : matrix.a;
		d = matrix.d == null ? 1 : matrix.d;
		b = matrix.b;
		c = matrix.c;
	} else a = d = 1;
	return {
		sx: b ? Math.sqrt(a * a + b * b) : a,
		sy: c ? Math.sqrt(c * c + d * d) : d
	};
}
function matrixToRotation(matrix) {
	let p = {
		x: 0,
		y: 1
	};
	if (matrix) p = deltaTransformPoint(matrix, p);
	const deg = 180 * Math.atan2(p.y, p.x) / Math.PI % 360 - 90;
	return { angle: deg % 360 + (deg < 0 ? 360 : 0) };
}
function matrixToTranslation(matrix) {
	return {
		tx: matrix && matrix.e || 0,
		ty: matrix && matrix.f || 0
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/transform.js
function transform(elem, matrix, options = {}) {
	if (matrix == null) return transformStringToMatrix(attr(elem, "transform"));
	if (options.absolute) {
		elem.setAttribute("transform", matrixToTransformString(matrix));
		return;
	}
	const transformList = elem.transform;
	const svgTransform = createSVGTransform(matrix);
	transformList.baseVal.appendItem(svgTransform);
}
function translate(elem, tx, ty = 0, options = {}) {
	let transformAttr = attr(elem, "transform");
	const transform = parseTransformString(transformAttr);
	if (tx == null) return transform.translation;
	transformAttr = transform.raw;
	transformAttr = transformAttr.replace(/translate\([^)]*\)/g, "").trim();
	const newTranslate = `translate(${options.absolute ? tx : transform.translation.tx + tx},${options.absolute ? ty : transform.translation.ty + ty})`;
	elem.setAttribute("transform", `${newTranslate} ${transformAttr}`.trim());
}
function rotate$1(elem, angle, cx, cy, options = {}) {
	let transformAttr = attr(elem, "transform");
	const transform = parseTransformString(transformAttr);
	if (angle == null) return transform.rotation;
	transformAttr = transform.raw;
	transformAttr = transformAttr.replace(/rotate\([^)]*\)/g, "").trim();
	angle %= 360;
	const newRotate = `rotate(${options.absolute ? angle : transform.rotation.angle + angle}${cx != null && cy != null ? `,${cx},${cy}` : ""})`;
	elem.setAttribute("transform", `${transformAttr} ${newRotate}`.trim());
}
function scale(elem, sx, sy) {
	let transformAttr = attr(elem, "transform");
	const transform = parseTransformString(transformAttr);
	if (sx == null) return transform.scale;
	sy = sy == null ? sx : sy;
	transformAttr = transform.raw;
	transformAttr = transformAttr.replace(/scale\([^)]*\)/g, "").trim();
	const newScale = `scale(${sx},${sy})`;
	elem.setAttribute("transform", `${transformAttr} ${newScale}`.trim());
}
/**
* Returns an DOMMatrix that specifies the transformation necessary
* to convert `elem` coordinate system into `target` coordinate system.
*/
function getTransformToElement(elem, target) {
	if (isSVGGraphicsElement(target) && isSVGGraphicsElement(elem)) {
		const targetCTM = target.getScreenCTM();
		const nodeCTM = elem.getScreenCTM();
		if (targetCTM && nodeCTM) return targetCTM.inverse().multiply(nodeCTM);
	}
	return createSVGMatrix();
}
/**
* Returns an DOMMatrix that specifies the transformation necessary
* to convert `elem` coordinate system into `target` coordinate system.
* Unlike getTransformToElement, elem is child of target,Because of the reduction in DOM API calls,
* there is a significant performance improvement.
*/
function getTransformToParentElement(elem, target) {
	let matrix = createSVGMatrix();
	if (isSVGGraphicsElement(target) && isSVGGraphicsElement(elem)) {
		let node = elem;
		const matrixList = [];
		while (node && node !== target) {
			const nodeMatrix = transformStringToMatrix(node.getAttribute("transform") || null);
			matrixList.push(nodeMatrix);
			node = node.parentNode;
		}
		matrixList.reverse().forEach((m) => {
			matrix = matrix.multiply(m);
		});
	}
	return matrix;
}
/**
* Converts a global point with coordinates `x` and `y` into the
* coordinate space of the element.
*/
function toLocalPoint(elem, x, y) {
	const svg = elem instanceof SVGSVGElement ? elem : elem.ownerSVGElement;
	const p = svg.createSVGPoint();
	p.x = x;
	p.y = y;
	try {
		const ctm = svg.getScreenCTM();
		const globalPoint = p.matrixTransform(ctm.inverse());
		const globalToLocalMatrix = getTransformToElement(elem, svg).inverse();
		return globalPoint.matrixTransform(globalToLocalMatrix);
	} catch (e) {
		return p;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/event/hook.js
var EventHook;
(function(EventHook) {
	const cache = {};
	function get(type) {
		return cache[type] || {};
	}
	EventHook.get = get;
	function register(type, hook) {
		cache[type] = hook;
	}
	EventHook.register = register;
	function unregister(type) {
		delete cache[type];
	}
	EventHook.unregister = unregister;
})(EventHook || (EventHook = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/event/store.js
var Store$1;
(function(Store) {
	const cache = /* @__PURE__ */ new WeakMap();
	function ensure(target) {
		if (!cache.has(target)) cache.set(target, { events: Object.create(null) });
		return cache.get(target);
	}
	Store.ensure = ensure;
	function get(target) {
		return cache.get(target);
	}
	Store.get = get;
	function remove(target) {
		return cache.delete(target);
	}
	Store.remove = remove;
})(Store$1 || (Store$1 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/event/util.js
var Util$3;
(function(Util) {
	Util.returnTrue = () => true;
	Util.returnFalse = () => false;
	function stopPropagationCallback(e) {
		e.stopPropagation();
	}
	Util.stopPropagationCallback = stopPropagationCallback;
	function addEventListener(elem, type, handler) {
		if (elem.addEventListener != null) elem.addEventListener(type, handler);
	}
	Util.addEventListener = addEventListener;
	function removeEventListener(elem, type, handler) {
		if (elem.removeEventListener != null) elem.removeEventListener(type, handler);
	}
	Util.removeEventListener = removeEventListener;
})(Util$3 || (Util$3 = {}));
(function(Util) {
	const rNotHTMLWhite = /[^\x20\t\r\n\f]+/g;
	const rNamespace = /^([^.]*)(?:\.(.+)|)/;
	function splitType(types) {
		return (types || "").match(rNotHTMLWhite) || [""];
	}
	Util.splitType = splitType;
	function normalizeType(type) {
		const parts = rNamespace.exec(type) || [];
		return {
			originType: parts[1] ? parts[1].trim() : parts[1],
			namespaces: parts[2] ? parts[2].split(".").map((ns) => ns.trim()).sort() : []
		};
	}
	Util.normalizeType = normalizeType;
	function isValidTarget(target) {
		return target.nodeType === 1 || target.nodeType === 9 || !+target.nodeType;
	}
	Util.isValidTarget = isValidTarget;
	function isValidSelector(elem, selector) {
		if (selector) {
			const node = elem;
			return node.querySelector != null && node.querySelector(selector) != null;
		}
		return true;
	}
	Util.isValidSelector = isValidSelector;
})(Util$3 || (Util$3 = {}));
(function(Util) {
	let seed = 0;
	const cache = /* @__PURE__ */ new WeakMap();
	function ensureHandlerId(handler) {
		if (!cache.has(handler)) {
			cache.set(handler, seed);
			seed += 1;
		}
		return cache.get(handler);
	}
	Util.ensureHandlerId = ensureHandlerId;
	function getHandlerId(handler) {
		return cache.get(handler);
	}
	Util.getHandlerId = getHandlerId;
	function removeHandlerId(handler) {
		return cache.delete(handler);
	}
	Util.removeHandlerId = removeHandlerId;
	function setHandlerId(handler, id) {
		return cache.set(handler, id);
	}
	Util.setHandlerId = setHandlerId;
})(Util$3 || (Util$3 = {}));
(function(Util) {
	function getHandlerQueue(elem, event) {
		const queue = [];
		const store = Store$1.get(elem);
		const bag = store && store.events && store.events[event.type];
		const handlers = bag && bag.handlers || [];
		const delegateCount = bag ? bag.delegateCount : 0;
		if (delegateCount > 0 && !(event.type === "click" && typeof event.button === "number" && event.button >= 1)) {
			for (let curr = event.target; curr !== elem; curr = curr.parentNode || elem) if (curr.nodeType === 1 && !(event.type === "click" && curr.disabled === true)) {
				const matchedHandlers = [];
				const matchedSelectors = {};
				for (let i = 0; i < delegateCount; i += 1) {
					const handleObj = handlers[i];
					const selector = handleObj.selector;
					if (selector != null && matchedSelectors[selector] == null) {
						const node = elem;
						const nodes = [];
						node.querySelectorAll(selector).forEach((child) => {
							nodes.push(child);
						});
						matchedSelectors[selector] = nodes.includes(curr);
					}
					if (matchedSelectors[selector]) matchedHandlers.push(handleObj);
				}
				if (matchedHandlers.length) queue.push({
					elem: curr,
					handlers: matchedHandlers
				});
			}
		}
		if (delegateCount < handlers.length) queue.push({
			elem,
			handlers: handlers.slice(delegateCount)
		});
		return queue;
	}
	Util.getHandlerQueue = getHandlerQueue;
})(Util$3 || (Util$3 = {}));
(function(Util) {
	function isWindow(obj) {
		return obj != null && obj === obj.window;
	}
	Util.isWindow = isWindow;
})(Util$3 || (Util$3 = {}));
(function(Util) {
	function contains(a, b) {
		const adown = a.nodeType === 9 ? a.documentElement : a;
		const bup = b && b.parentNode;
		return a === bup || !!(bup && bup.nodeType === 1 && (adown.contains ? adown.contains(bup) : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16));
	}
	Util.contains = contains;
})(Util$3 || (Util$3 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/event/object.js
var EventObject = class {
	constructor(e, props) {
		this.isDefaultPrevented = Util$3.returnFalse;
		this.isPropagationStopped = Util$3.returnFalse;
		this.isImmediatePropagationStopped = Util$3.returnFalse;
		this.isSimulated = false;
		this.preventDefault = () => {
			const e = this.originalEvent;
			this.isDefaultPrevented = Util$3.returnTrue;
			if (e && !this.isSimulated) e.preventDefault();
		};
		this.stopPropagation = () => {
			const e = this.originalEvent;
			this.isPropagationStopped = Util$3.returnTrue;
			if (e && !this.isSimulated) e.stopPropagation();
		};
		this.stopImmediatePropagation = () => {
			const e = this.originalEvent;
			this.isImmediatePropagationStopped = Util$3.returnTrue;
			if (e && !this.isSimulated) e.stopImmediatePropagation();
			this.stopPropagation();
		};
		if (typeof e === "string") this.type = e;
		else if (e.type) {
			this.originalEvent = e;
			this.type = e.type;
			this.isDefaultPrevented = e.defaultPrevented ? Util$3.returnTrue : Util$3.returnFalse;
			this.target = e.target;
			this.currentTarget = e.currentTarget;
			this.relatedTarget = e.relatedTarget;
			this.timeStamp = e.timeStamp;
		}
		if (props) Object.assign(this, props);
		if (!this.timeStamp) this.timeStamp = Date.now();
	}
};
(function(EventObject) {
	function create(originalEvent) {
		return originalEvent instanceof EventObject ? originalEvent : new EventObject(originalEvent);
	}
	EventObject.create = create;
})(EventObject || (EventObject = {}));
(function(EventObject) {
	function addProperty(name, hook) {
		Object.defineProperty(EventObject.prototype, name, {
			enumerable: true,
			configurable: true,
			get: typeof hook === "function" ? function() {
				if (this.originalEvent) return hook(this.originalEvent);
			} : function() {
				if (this.originalEvent) return this.originalEvent[name];
			},
			set(value) {
				Object.defineProperty(this, name, {
					enumerable: true,
					configurable: true,
					writable: true,
					value
				});
			}
		});
	}
	EventObject.addProperty = addProperty;
})(EventObject || (EventObject = {}));
(function(EventObject) {
	const commonProps = {
		bubbles: true,
		cancelable: true,
		eventPhase: true,
		detail: true,
		view: true,
		button: true,
		buttons: true,
		clientX: true,
		clientY: true,
		offsetX: true,
		offsetY: true,
		pageX: true,
		pageY: true,
		screenX: true,
		screenY: true,
		toElement: true,
		pointerId: true,
		pointerType: true,
		char: true,
		code: true,
		charCode: true,
		key: true,
		keyCode: true,
		touches: true,
		changedTouches: true,
		targetTouches: true,
		which: true,
		altKey: true,
		ctrlKey: true,
		metaKey: true,
		shiftKey: true
	};
	Object.keys(commonProps).forEach((name) => EventObject.addProperty(name, commonProps[name]));
})(EventObject || (EventObject = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/event/special.js
var Special;
(function(Special) {
	EventHook.register("load", { noBubble: true });
})(Special || (Special = {}));
(function(Special) {
	EventHook.register("beforeunload", { postDispatch(elem, event) {
		if (event.result !== void 0 && event.originalEvent) event.originalEvent.returnValue = event.result;
	} });
})(Special || (Special = {}));
(function(Special) {
	EventHook.register("mouseenter", {
		delegateType: "mouseover",
		bindType: "mouseover",
		handle(target, event) {
			let ret;
			const related = event.relatedTarget;
			const handleObj = event.handleObj;
			if (!related || related !== target && !Util$3.contains(target, related)) {
				event.type = handleObj.originType;
				ret = handleObj.handler.call(target, event);
				event.type = "mouseover";
			}
			return ret;
		}
	});
	EventHook.register("mouseleave", {
		delegateType: "mouseout",
		bindType: "mouseout",
		handle(target, event) {
			let ret;
			const related = event.relatedTarget;
			const handleObj = event.handleObj;
			if (!related || related !== target && !Util$3.contains(target, related)) {
				event.type = handleObj.originType;
				ret = handleObj.handler.call(target, event);
				event.type = "mouseout";
			}
			return ret;
		}
	});
})(Special || (Special = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/event/core.js
var __rest$29 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var Core;
(function(Core) {
	let triggered;
	function on(elem, types, handler, data, selector) {
		if (!Util$3.isValidTarget(elem)) return;
		let handlerData;
		if (typeof handler !== "function") {
			const { handler: h, selector: s } = handler, others = __rest$29(handler, ["handler", "selector"]);
			handler = h;
			selector = s;
			handlerData = others;
		}
		const store = Store$1.ensure(elem);
		let mainHandler = store.handler;
		if (mainHandler == null) mainHandler = store.handler = function(e, ...args) {
			return triggered !== e.type ? dispatch(elem, e, ...args) : void 0;
		};
		const guid = Util$3.ensureHandlerId(handler);
		Util$3.splitType(types).forEach((item) => {
			const { originType, namespaces } = Util$3.normalizeType(item);
			if (!originType) return;
			let type = originType;
			let hook = EventHook.get(type);
			type = (selector ? hook.delegateType : hook.bindType) || type;
			hook = EventHook.get(type);
			const handleObj = Object.assign({
				type,
				originType,
				data,
				selector,
				guid,
				handler,
				namespace: namespaces.join(".")
			}, handlerData);
			const events = store.events;
			let bag = events[type];
			if (!bag) {
				bag = events[type] = {
					handlers: [],
					delegateCount: 0
				};
				if (!hook.setup || hook.setup(elem, data, namespaces, mainHandler) === false) Util$3.addEventListener(elem, type, mainHandler);
			}
			if (hook.add) {
				Util$3.removeHandlerId(handleObj.handler);
				hook.add(elem, handleObj);
				Util$3.setHandlerId(handleObj.handler, guid);
			}
			if (selector) {
				bag.handlers.splice(bag.delegateCount, 0, handleObj);
				bag.delegateCount += 1;
			} else bag.handlers.push(handleObj);
		});
	}
	Core.on = on;
	function off(elem, types, handler, selector, mappedTypes) {
		const store = Store$1.get(elem);
		if (!store) return;
		const events = store.events;
		if (!events) return;
		Util$3.splitType(types).forEach((item) => {
			const { originType, namespaces } = Util$3.normalizeType(item);
			if (!originType) {
				Object.keys(events).forEach((key) => {
					off(elem, key + item, handler, selector, true);
				});
				return;
			}
			let type = originType;
			const hook = EventHook.get(type);
			type = (selector ? hook.delegateType : hook.bindType) || type;
			const bag = events[type];
			if (!bag) return;
			const rns = namespaces.length > 0 ? new RegExp(`(^|\\.)${namespaces.join("\\.(?:.*\\.|)")}(\\.|$)`) : null;
			const originHandlerCount = bag.handlers.length;
			for (let i = bag.handlers.length - 1; i >= 0; i -= 1) {
				const handleObj = bag.handlers[i];
				if ((mappedTypes || originType === handleObj.originType) && (!handler || Util$3.getHandlerId(handler) === handleObj.guid) && (rns == null || handleObj.namespace && rns.test(handleObj.namespace)) && (selector == null || selector === handleObj.selector || selector === "**" && handleObj.selector)) {
					bag.handlers.splice(i, 1);
					if (handleObj.selector) bag.delegateCount -= 1;
					if (hook.remove) hook.remove(elem, handleObj);
				}
			}
			if (originHandlerCount && bag.handlers.length === 0) {
				if (!hook.teardown || hook.teardown(elem, namespaces, store.handler) === false) Util$3.removeEventListener(elem, type, store.handler);
				delete events[type];
			}
		});
		if (Object.keys(events).length === 0) Store$1.remove(elem);
	}
	Core.off = off;
	function dispatch(elem, evt, ...args) {
		const event = EventObject.create(evt);
		event.delegateTarget = elem;
		const hook = EventHook.get(event.type);
		if (hook.preDispatch && hook.preDispatch(elem, event) === false) return;
		const handlerQueue = Util$3.getHandlerQueue(elem, event);
		for (let i = 0, l = handlerQueue.length; i < l && !event.isPropagationStopped(); i += 1) {
			const matched = handlerQueue[i];
			event.currentTarget = matched.elem;
			for (let j = 0, k = matched.handlers.length; j < k && !event.isImmediatePropagationStopped(); j += 1) {
				const handleObj = matched.handlers[j];
				if (event.rnamespace == null || handleObj.namespace && event.rnamespace.test(handleObj.namespace)) {
					event.handleObj = handleObj;
					event.data = handleObj.data;
					const hookHandle = EventHook.get(handleObj.originType).handle;
					const result = hookHandle ? hookHandle(matched.elem, event, ...args) : handleObj.handler.call(matched.elem, event, ...args);
					if (result !== void 0) {
						event.result = result;
						if (result === false) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}
		if (hook.postDispatch) hook.postDispatch(elem, event);
		return event.result;
	}
	Core.dispatch = dispatch;
	function trigger(event, eventArgs, elem, onlyHandlers) {
		let eventObj = event;
		let type = typeof event === "string" ? event : event.type;
		let namespaces = typeof event === "string" || eventObj.namespace == null ? [] : eventObj.namespace.split(".");
		const node = elem;
		if (node.nodeType === 3 || node.nodeType === 8) return;
		if (type.indexOf(".") > -1) {
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		const ontype = type.indexOf(":") < 0 && `on${type}`;
		eventObj = event instanceof EventObject ? event : new EventObject(type, typeof event === "object" ? event : null);
		eventObj.namespace = namespaces.join(".");
		eventObj.rnamespace = eventObj.namespace ? new RegExp(`(^|\\.)${namespaces.join("\\.(?:.*\\.|)")}(\\.|$)`) : null;
		eventObj.result = void 0;
		if (!eventObj.target) eventObj.target = node;
		const args = [eventObj];
		if (Array.isArray(eventArgs)) args.push(...eventArgs);
		else args.push(eventArgs);
		const hook = EventHook.get(type);
		if (!onlyHandlers && hook.trigger && hook.trigger(node, eventObj, eventArgs) === false) return;
		let bubbleType;
		const eventPath = [node];
		if (!onlyHandlers && !hook.noBubble && !Util$3.isWindow(node)) {
			bubbleType = hook.delegateType || type;
			let last = node;
			let curr = node.parentNode;
			while (curr != null) {
				eventPath.push(curr);
				last = curr;
				curr = curr.parentNode;
			}
			const doc = node.ownerDocument || document;
			if (last === doc) {
				const win = last.defaultView || last.parentWindow || window;
				eventPath.push(win);
			}
		}
		let lastElement = node;
		for (let i = 0, l = eventPath.length; i < l && !eventObj.isPropagationStopped(); i += 1) {
			const currElement = eventPath[i];
			lastElement = currElement;
			eventObj.type = i > 1 ? bubbleType : hook.bindType || type;
			const store = Store$1.get(currElement);
			if (store) {
				if (store.events[eventObj.type] && store.handler) store.handler.call(currElement, ...args);
			}
			const handle = ontype && currElement[ontype] || null;
			if (handle && Util$3.isValidTarget(currElement)) {
				eventObj.result = handle.call(currElement, ...args);
				if (eventObj.result === false) eventObj.preventDefault();
			}
		}
		eventObj.type = type;
		if (!onlyHandlers && !eventObj.isDefaultPrevented()) {
			const preventDefault = hook.preventDefault;
			if ((preventDefault == null || preventDefault(eventPath.pop(), eventObj, eventArgs) === false) && Util$3.isValidTarget(node)) {
				if (ontype && typeof node[type] === "function" && !Util$3.isWindow(node)) {
					const tmp = node[ontype];
					if (tmp) node[ontype] = null;
					triggered = type;
					if (eventObj.isPropagationStopped()) lastElement.addEventListener(type, Util$3.stopPropagationCallback);
					node[type]();
					if (eventObj.isPropagationStopped()) lastElement.removeEventListener(type, Util$3.stopPropagationCallback);
					triggered = void 0;
					if (tmp) node[ontype] = tmp;
				}
			}
		}
		return eventObj.result;
	}
	Core.trigger = trigger;
})(Core || (Core = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/event/main.js
var Event;
(function(Event) {
	function on(elem, events, selector, data, handler) {
		Private$4.on(elem, events, selector, data, handler);
		return elem;
	}
	Event.on = on;
	function once(elem, events, selector, data, handler) {
		Private$4.on(elem, events, selector, data, handler, true);
		return elem;
	}
	Event.once = once;
	function off(elem, events, selector, handler) {
		Private$4.off(elem, events, selector, handler);
		return elem;
	}
	Event.off = off;
	function trigger(elem, event, args, onlyHandlers) {
		Core.trigger(event, args, elem, onlyHandlers);
		return elem;
	}
	Event.trigger = trigger;
})(Event || (Event = {}));
var Private$4;
(function(Private) {
	function on(elem, types, selector, data, fn, once) {
		if (typeof types === "object") {
			if (typeof selector !== "string") {
				data = data || selector;
				selector = void 0;
			}
			Object.keys(types).forEach((type) => on(elem, type, selector, data, types[type], once));
			return;
		}
		if (data == null && fn == null) {
			fn = selector;
			data = selector = void 0;
		} else if (fn == null) if (typeof selector === "string") {
			fn = data;
			data = void 0;
		} else {
			fn = data;
			data = selector;
			selector = void 0;
		}
		if (fn === false) fn = Util$3.returnFalse;
		else if (!fn) return;
		if (once) {
			const originHandler = fn;
			fn = function(event, ...args) {
				Private.off(elem, event);
				return originHandler.call(this, event, ...args);
			};
			Util$3.setHandlerId(fn, Util$3.ensureHandlerId(originHandler));
		}
		Core.on(elem, types, fn, data, selector);
	}
	Private.on = on;
	function off(elem, events, selector, fn) {
		const evt = events;
		if (evt && evt.preventDefault != null && evt.handleObj != null) {
			const obj = evt.handleObj;
			off(evt.delegateTarget, obj.namespace ? `${obj.originType}.${obj.namespace}` : obj.originType, obj.selector, obj.handler);
			return;
		}
		if (typeof events === "object") {
			const types = events;
			Object.keys(types).forEach((type) => off(elem, type, selector, types[type]));
			return;
		}
		if (selector === false || typeof selector === "function") {
			fn = selector;
			selector = void 0;
		}
		if (fn === false) fn = Util$3.returnFalse;
		Core.off(elem, events, fn, selector);
	}
	Private.off = off;
})(Private$4 || (Private$4 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/mousewheel.js
var MouseWheelHandle = class {
	constructor(target, onWheelCallback, onWheelGuard) {
		this.animationFrameId = 0;
		this.deltaX = 0;
		this.deltaY = 0;
		this.eventName = Platform.isEventSupported("wheel") ? "wheel" : "mousewheel";
		this.target = target;
		this.onWheelCallback = onWheelCallback;
		this.onWheelGuard = onWheelGuard;
		this.onWheel = this.onWheel.bind(this);
		this.didWheel = this.didWheel.bind(this);
	}
	enable() {
		this.target.addEventListener(this.eventName, this.onWheel, { passive: false });
	}
	disable() {
		this.target.removeEventListener(this.eventName, this.onWheel);
	}
	onWheel(e) {
		if (this.onWheelGuard != null && !this.onWheelGuard(e)) return;
		this.deltaX += e.deltaX;
		this.deltaY += e.deltaY;
		e.preventDefault();
		let changed;
		if (this.deltaX !== 0 || this.deltaY !== 0) {
			e.stopPropagation();
			changed = true;
		}
		if (changed === true && this.animationFrameId === 0) this.animationFrameId = requestAnimationFrame(() => {
			this.didWheel(e);
		});
	}
	didWheel(e) {
		this.animationFrameId = 0;
		this.onWheelCallback(e, this.deltaX, this.deltaY);
		this.deltaX = 0;
		this.deltaY = 0;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dom/position.js
function offset$1(elem) {
	const rect = elem.getBoundingClientRect();
	const win = elem.ownerDocument.defaultView;
	return {
		top: rect.top + win.pageYOffset,
		left: rect.left + win.pageXOffset
	};
}
function width(elem) {
	return elem.getBoundingClientRect().width;
}
function height(elem) {
	return elem.getBoundingClientRect().height;
}
function position(elem) {
	const isFixed = computeStyle(elem, "position") === "fixed";
	let offsetValue;
	if (isFixed) {
		const rect = elem.getBoundingClientRect();
		offsetValue = {
			left: rect.left,
			top: rect.top
		};
	} else offsetValue = offset$1(elem);
	if (!isFixed) {
		const doc = elem.ownerDocument;
		let offsetParent = elem.offsetParent || doc.documentElement;
		while ((offsetParent === doc.body || offsetParent === doc.documentElement) && computeStyle(offsetParent, "position") === "static") offsetParent = offsetParent.parentNode;
		if (offsetParent !== elem && isElement(offsetParent)) {
			const parentOffset = offset$1(offsetParent);
			offsetValue.top -= parentOffset.top + computeStyleInt(offsetParent, "borderTopWidth");
			offsetValue.left -= parentOffset.left + computeStyleInt(offsetParent, "borderLeftWidth");
		}
	}
	return {
		top: offsetValue.top - computeStyleInt(elem, "marginTop"),
		left: offsetValue.left - computeStyleInt(elem, "marginLeft")
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/size-sensor/sensors/util.js
function debounce(fn, delay = 60) {
	let timer = null;
	return (...args) => {
		if (timer) clearTimeout(timer);
		timer = window.setTimeout(() => {
			fn.apply(this, args);
		}, delay);
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/size-sensor/sensors/object.js
function createSensor$2(element) {
	let sensor = null;
	let listeners = [];
	const create = () => {
		if (getComputedStyle(element).position === "static") {
			const style = element.style;
			style.position = "relative";
		}
		const obj = document.createElement("object");
		obj.onload = () => {
			obj.contentDocument.defaultView.addEventListener("resize", trigger);
			trigger();
		};
		obj.style.display = "block";
		obj.style.position = "absolute";
		obj.style.top = "0";
		obj.style.left = "0";
		obj.style.height = "100%";
		obj.style.width = "100%";
		obj.style.overflow = "hidden";
		obj.style.pointerEvents = "none";
		obj.style.zIndex = "-1";
		obj.style.opacity = "0";
		obj.setAttribute("tabindex", "-1");
		obj.type = "text/html";
		element.appendChild(obj);
		obj.data = "about:blank";
		return obj;
	};
	const trigger = debounce(() => {
		listeners.forEach((listener) => listener(element));
	});
	const bind = (listener) => {
		if (!sensor) sensor = create();
		if (listeners.indexOf(listener) === -1) listeners.push(listener);
	};
	const destroy = () => {
		if (sensor && sensor.parentNode) {
			if (sensor.contentDocument) sensor.contentDocument.defaultView.removeEventListener("resize", trigger);
			sensor.parentNode.removeChild(sensor);
			sensor = null;
			listeners = [];
		}
	};
	const unbind = (listener) => {
		const idx = listeners.indexOf(listener);
		if (idx !== -1) listeners.splice(idx, 1);
		if (listeners.length === 0 && sensor) destroy();
	};
	return {
		element,
		bind,
		destroy,
		unbind
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/size-sensor/sensors/observer.js
function createSensor$1(element) {
	let sensor = null;
	let listeners = [];
	const trigger = debounce(() => {
		listeners.forEach((listener) => {
			listener(element);
		});
	});
	const create = () => {
		const s = new ResizeObserver(trigger);
		s.observe(element);
		trigger();
		return s;
	};
	const bind = (listener) => {
		if (!sensor) sensor = create();
		if (listeners.indexOf(listener) === -1) listeners.push(listener);
	};
	const destroy = () => {
		if (sensor) {
			sensor.disconnect();
			listeners = [];
			sensor = null;
		}
	};
	const unbind = (listener) => {
		const idx = listeners.indexOf(listener);
		if (idx !== -1) listeners.splice(idx, 1);
		if (listeners.length === 0 && sensor) destroy();
	};
	return {
		element,
		bind,
		destroy,
		unbind
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/size-sensor/sensors/index.js
var createSensor = typeof ResizeObserver !== "undefined" ? createSensor$1 : createSensor$2;
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/size-sensor/index.js
var SizeSensor;
(function(SizeSensor) {
	const cache = /* @__PURE__ */ new WeakMap();
	function get(element) {
		let sensor = cache.get(element);
		if (sensor) return sensor;
		sensor = createSensor(element);
		cache.set(element, sensor);
		return sensor;
	}
	function remove(sensor) {
		sensor.destroy();
		cache.delete(sensor.element);
	}
	SizeSensor.bind = (element, cb) => {
		const sensor = get(element);
		sensor.bind(cb);
		return () => sensor.unbind(cb);
	};
	SizeSensor.clear = (element) => {
		remove(get(element));
	};
})(SizeSensor || (SizeSensor = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/algorithm/priorityqueue.js
/**
* An implementation of the Priority Queue abstract data type.
*
* @see: http://en.wikipedia.org/wiki/Priority_queue
*
* It is like a normal stack or queue, but where each item has assigned a
* priority (a number). Items with higher priority are served before items
* with lower priority. This implementation uses binary heap as an internal
* representation of the queue. The time complexity of all the methods is as
* follows:
*
* - create: `O(n)`
* - insert: `O(log n)`
* - remove: `O(log n)`
* - peek: `O(1)`
* - isEmpty: `O(1)`
* - peekPriority: `O(1)`
*/
var PriorityQueue = class PriorityQueue {
	constructor(options = {}) {
		this.comparator = options.comparator || PriorityQueue.defaultComparator;
		this.index = {};
		this.data = options.data || [];
		this.heapify();
	}
	/**
	* Returns `true` if the priority queue is empty, `false` otherwise.
	*/
	isEmpty() {
		return this.data.length === 0;
	}
	/**
	* Inserts a value with priority to the queue. Optionally pass a unique
	* id of this item. Passing unique IDs for each item you insert allows
	* you to use the `updatePriority()` operation.
	* @param priority
	* @param value
	* @param id
	*/
	insert(priority, value, id) {
		const item = {
			priority,
			value
		};
		const index = this.data.length;
		if (id) {
			item.id = id;
			this.index[id] = index;
		}
		this.data.push(item);
		this.bubbleUp(index);
		return this;
	}
	/**
	* Returns the value of an item with the highest priority.
	*/
	peek() {
		return this.data[0] ? this.data[0].value : null;
	}
	/**
	* Returns the highest priority in the queue.
	*/
	peekPriority() {
		return this.data[0] ? this.data[0].priority : null;
	}
	updatePriority(id, priority) {
		const index = this.index[id];
		if (typeof index === "undefined") throw new Error(`Node with id '${id}' was not found in the heap.`);
		const data = this.data;
		const oldPriority = data[index].priority;
		const comp = this.comparator(priority, oldPriority);
		if (comp < 0) {
			data[index].priority = priority;
			this.bubbleUp(index);
		} else if (comp > 0) {
			data[index].priority = priority;
			this.bubbleDown(index);
		}
	}
	/**
	* Removes the item with the highest priority from the queue
	*
	* @returns The value of the removed item.
	*/
	remove() {
		const data = this.data;
		const peek = data[0];
		const last = data.pop();
		if (peek.id) delete this.index[peek.id];
		if (data.length > 0) {
			data[0] = last;
			if (last.id) this.index[last.id] = 0;
			this.bubbleDown(0);
		}
		return peek ? peek.value : null;
	}
	heapify() {
		for (let i = 0; i < this.data.length; i += 1) this.bubbleUp(i);
	}
	bubbleUp(index) {
		const data = this.data;
		let tmp;
		let parent;
		let current = index;
		while (current > 0) {
			parent = current - 1 >>> 1;
			if (this.comparator(data[current].priority, data[parent].priority) < 0) {
				tmp = data[parent];
				data[parent] = data[current];
				let id = data[current].id;
				if (id != null) this.index[id] = parent;
				data[current] = tmp;
				id = data[current].id;
				if (id != null) this.index[id] = current;
				current = parent;
			} else break;
		}
	}
	bubbleDown(index) {
		const data = this.data;
		const last = data.length - 1;
		let current = index;
		while (true) {
			const left = (current << 1) + 1;
			const right = left + 1;
			let minIndex = current;
			if (left <= last && this.comparator(data[left].priority, data[minIndex].priority) < 0) minIndex = left;
			if (right <= last && this.comparator(data[right].priority, data[minIndex].priority) < 0) minIndex = right;
			if (minIndex !== current) {
				const tmp = data[minIndex];
				data[minIndex] = data[current];
				let id = data[current].id;
				if (id != null) this.index[id] = minIndex;
				data[current] = tmp;
				id = data[current].id;
				if (id != null) this.index[id] = current;
				current = minIndex;
			} else break;
		}
	}
};
(function(PriorityQueue) {
	PriorityQueue.defaultComparator = (a, b) => a - b;
})(PriorityQueue || (PriorityQueue = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/algorithm/dijkstra.js
var Dijkstra;
(function(Dijkstra) {
	function run(adjacencyList, source, weight = (u, v) => 1) {
		const dist = {};
		const previous = {};
		const scanned = {};
		const queue = new PriorityQueue();
		dist[source] = 0;
		Object.keys(adjacencyList).forEach((v) => {
			if (v !== source) dist[v] = Infinity;
			queue.insert(dist[v], v, v);
		});
		while (!queue.isEmpty()) {
			const u = queue.remove();
			scanned[u] = true;
			const neighbours = adjacencyList[u] || [];
			for (let i = 0; i < neighbours.length; i += 1) {
				const v = neighbours[i];
				if (!scanned[v]) {
					const alt = dist[u] + weight(u, v);
					if (alt < dist[v]) {
						dist[v] = alt;
						previous[v] = u;
						queue.updatePriority(v, alt);
					}
				}
			}
		}
		return previous;
	}
	Dijkstra.run = run;
})(Dijkstra || (Dijkstra = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/color/index.js
var Color = class Color {
	constructor(color, g, b, a) {
		if (color == null) return this.set(255, 255, 255, 1);
		if (typeof color === "number") return this.set(color, g, b, a);
		if (typeof color === "string") return Color.fromString(color) || this;
		if (Array.isArray(color)) return this.set(color);
		this.set(color.r, color.g, color.b, color.a == null ? 1 : color.a);
	}
	blend(start, end, weight) {
		this.set(start.r + (end.r - start.r) * weight, start.g + (end.g - start.g) * weight, start.b + (end.b - start.b) * weight, start.a + (end.a - start.a) * weight);
	}
	lighten(amount) {
		const rgba = Color.lighten(this.toArray(), amount);
		this.r = rgba[0];
		this.g = rgba[1];
		this.b = rgba[2];
		this.a = rgba[3];
	}
	darken(amount) {
		this.lighten(-amount);
	}
	set(arg0, arg1, arg2, arg3) {
		const r = Array.isArray(arg0) ? arg0[0] : arg0;
		const g = Array.isArray(arg0) ? arg0[1] : arg1;
		const b = Array.isArray(arg0) ? arg0[2] : arg2;
		const a = Array.isArray(arg0) ? arg0[3] : arg3;
		this.r = Math.round(clamp(r, 0, 255));
		this.g = Math.round(clamp(g, 0, 255));
		this.b = Math.round(clamp(b, 0, 255));
		this.a = a == null ? 1 : clamp(a, 0, 1);
		return this;
	}
	toHex() {
		return `#${[
			"r",
			"g",
			"b"
		].map((key) => {
			const str = this[key].toString(16);
			return str.length < 2 ? `0${str}` : str;
		}).join("")}`;
	}
	toRGBA() {
		return this.toArray();
	}
	toHSLA() {
		return Color.rgba2hsla(this.r, this.g, this.b, this.a);
	}
	toCSS(ignoreAlpha) {
		const rgb = `${this.r},${this.g},${this.b},`;
		return ignoreAlpha ? `rgb(${rgb})` : `rgba(${rgb},${this.a})`;
	}
	toGrey() {
		return Color.makeGrey(Math.round((this.r + this.g + this.b) / 3), this.a);
	}
	toArray() {
		return [
			this.r,
			this.g,
			this.b,
			this.a
		];
	}
	toString() {
		return this.toCSS();
	}
};
(function(Color) {
	function fromArray(arr) {
		return new Color(arr);
	}
	Color.fromArray = fromArray;
	function fromHex(color) {
		return new Color([...hex2rgb(color), 1]);
	}
	Color.fromHex = fromHex;
	function fromRGBA(color) {
		const matches = color.toLowerCase().match(/^rgba?\(([\s.,0-9]+)\)/);
		if (matches) return new Color(matches[1].split(/\s*,\s*/).map((v) => parseInt(v, 10)));
		return null;
	}
	Color.fromRGBA = fromRGBA;
	function hue2rgb(m1, m2, h) {
		if (h < 0) ++h;
		if (h > 1) --h;
		const h6 = 6 * h;
		if (h6 < 1) return m1 + (m2 - m1) * h6;
		if (2 * h < 1) return m2;
		if (3 * h < 2) return m1 + (m2 - m1) * (2 / 3 - h) * 6;
		return m1;
	}
	function fromHSLA(color) {
		const matches = color.toLowerCase().match(/^hsla?\(([\s.,0-9]+)\)/);
		if (matches) {
			const arr = matches[2].split(/\s*,\s*/);
			return new Color(hsla2rgba((parseFloat(arr[0]) % 360 + 360) % 360 / 360, parseFloat(arr[1]) / 100, parseFloat(arr[2]) / 100, arr[3] == null ? 1 : parseInt(arr[3], 10)));
		}
		return null;
	}
	Color.fromHSLA = fromHSLA;
	function fromString(color) {
		if (color.startsWith("#")) return fromHex(color);
		if (color.startsWith("rgb")) return fromRGBA(color);
		const preset = Color.named[color];
		if (preset) return fromHex(preset);
		return fromHSLA(color);
	}
	Color.fromString = fromString;
	function makeGrey(g, a) {
		return Color.fromArray([
			g,
			g,
			g,
			a
		]);
	}
	Color.makeGrey = makeGrey;
	function rgba2hsla(arg0, arg1, arg2, arg3) {
		const r = Array.isArray(arg0) ? arg0[0] : arg0;
		const g = Array.isArray(arg0) ? arg0[1] : arg1;
		const b = Array.isArray(arg0) ? arg0[2] : arg2;
		const a = Array.isArray(arg0) ? arg0[3] : arg3;
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const l = (max + min) / 2;
		let h = 0;
		let s = 0;
		if (min !== max) {
			const d = max - min;
			s = l > .5 ? d / (2 - max - min) : d / (max + min);
			switch (max) {
				case r:
					h = (g - b) / d + (g < b ? 6 : 0);
					break;
				case g:
					h = (b - r) / d + 2;
					break;
				case b: h = (r - g) / d + 4;
			}
			h /= 6;
		}
		return [
			h,
			s,
			l,
			a == null ? 1 : a
		];
	}
	Color.rgba2hsla = rgba2hsla;
	function hsla2rgba(arg0, arg1, arg2, arg3) {
		const h = Array.isArray(arg0) ? arg0[0] : arg0;
		const s = Array.isArray(arg0) ? arg0[1] : arg1;
		const l = Array.isArray(arg0) ? arg0[2] : arg2;
		const a = Array.isArray(arg0) ? arg0[3] : arg3;
		const m2 = l <= .5 ? l * (s + 1) : l + s - l * s;
		const m1 = 2 * l - m2;
		return [
			hue2rgb(m1, m2, h + 1 / 3) * 256,
			hue2rgb(m1, m2, h) * 256,
			hue2rgb(m1, m2, h - 1 / 3) * 256,
			a == null ? 1 : a
		];
	}
	Color.hsla2rgba = hsla2rgba;
	function random(ignoreAlpha) {
		return new Color(Math.round(Math.random() * 256), Math.round(Math.random() * 256), Math.round(Math.random() * 256), ignoreAlpha ? void 0 : parseFloat(Math.random().toFixed(2)));
	}
	Color.random = random;
	function randomHex() {
		const letters = "0123456789ABCDEF";
		let color = "#";
		for (let i = 0; i < 6; i += 1) color += letters[Math.floor(Math.random() * 16)];
		return color;
	}
	Color.randomHex = randomHex;
	function randomRGBA(ignoreAlpha) {
		return random(ignoreAlpha).toString();
	}
	Color.randomRGBA = randomRGBA;
	function invert(color, bw) {
		if (typeof color === "string") {
			const pound = color[0] === "#";
			const [r, g, b] = hex2rgb(color);
			if (bw) return r * .299 + g * .587 + b * .114 > 186 ? "#000000" : "#ffffff";
			return `${pound ? "#" : ""}${rgb2hex(255 - r, 255 - g, 255 - b)}`;
		}
		const r = color[0];
		const g = color[1];
		const b = color[2];
		const a = color[3];
		if (bw) return r * .299 + g * .587 + b * .114 > 186 ? [
			0,
			0,
			0,
			a
		] : [
			255,
			255,
			255,
			a
		];
		return [
			255 - r,
			255 - g,
			255 - b,
			a
		];
	}
	Color.invert = invert;
	function hex2rgb(hex) {
		const color = hex.indexOf("#") === 0 ? hex : `#${hex}`;
		let val = Number(`0x${color.substr(1)}`);
		if (!(color.length === 4 || color.length === 7) || Number.isNaN(val)) throw new Error("Invalid hex color.");
		const bits = color.length === 4 ? 4 : 8;
		const mask = (1 << bits) - 1;
		const bgr = [
			"b",
			"g",
			"r"
		].map(() => {
			const c = val & mask;
			val >>= bits;
			return bits === 4 ? 17 * c : c;
		});
		return [
			bgr[2],
			bgr[1],
			bgr[0]
		];
	}
	function rgb2hex(r, g, b) {
		const pad = (hex) => hex.length < 2 ? `0${hex}` : hex;
		return `${pad(r.toString(16))}${pad(g.toString(16))}${pad(b.toString(16))}`;
	}
	function lighten(color, amt) {
		return lum(color, amt);
	}
	Color.lighten = lighten;
	function darken(color, amt) {
		return lum(color, -amt);
	}
	Color.darken = darken;
	function lum(color, amt) {
		if (typeof color === "string") {
			const pound = color[0] === "#";
			const num = parseInt(pound ? color.substr(1) : color, 16);
			const r = clamp((num >> 16) + amt, 0, 255);
			const g = clamp((num >> 8 & 255) + amt, 0, 255);
			const b = clamp((num & 255) + amt, 0, 255);
			return `${pound ? "#" : ""}${(b | g << 8 | r << 16).toString(16)}`;
		}
		const arr = hex2rgb(lum(rgb2hex(color[0], color[1], color[2]), amt));
		return [
			arr[0],
			arr[1],
			arr[2],
			color[3]
		];
	}
})(Color || (Color = {}));
(function(Color) {
	Color.named = {
		aliceblue: "#f0f8ff",
		antiquewhite: "#faebd7",
		aqua: "#00ffff",
		aquamarine: "#7fffd4",
		azure: "#f0ffff",
		beige: "#f5f5dc",
		bisque: "#ffe4c4",
		black: "#000000",
		blanchedalmond: "#ffebcd",
		blue: "#0000ff",
		blueviolet: "#8a2be2",
		brown: "#a52a2a",
		burlywood: "#deb887",
		burntsienna: "#ea7e5d",
		cadetblue: "#5f9ea0",
		chartreuse: "#7fff00",
		chocolate: "#d2691e",
		coral: "#ff7f50",
		cornflowerblue: "#6495ed",
		cornsilk: "#fff8dc",
		crimson: "#dc143c",
		cyan: "#00ffff",
		darkblue: "#00008b",
		darkcyan: "#008b8b",
		darkgoldenrod: "#b8860b",
		darkgray: "#a9a9a9",
		darkgreen: "#006400",
		darkgrey: "#a9a9a9",
		darkkhaki: "#bdb76b",
		darkmagenta: "#8b008b",
		darkolivegreen: "#556b2f",
		darkorange: "#ff8c00",
		darkorchid: "#9932cc",
		darkred: "#8b0000",
		darksalmon: "#e9967a",
		darkseagreen: "#8fbc8f",
		darkslateblue: "#483d8b",
		darkslategray: "#2f4f4f",
		darkslategrey: "#2f4f4f",
		darkturquoise: "#00ced1",
		darkviolet: "#9400d3",
		deeppink: "#ff1493",
		deepskyblue: "#00bfff",
		dimgray: "#696969",
		dimgrey: "#696969",
		dodgerblue: "#1e90ff",
		firebrick: "#b22222",
		floralwhite: "#fffaf0",
		forestgreen: "#228b22",
		fuchsia: "#ff00ff",
		gainsboro: "#dcdcdc",
		ghostwhite: "#f8f8ff",
		gold: "#ffd700",
		goldenrod: "#daa520",
		gray: "#808080",
		green: "#008000",
		greenyellow: "#adff2f",
		grey: "#808080",
		honeydew: "#f0fff0",
		hotpink: "#ff69b4",
		indianred: "#cd5c5c",
		indigo: "#4b0082",
		ivory: "#fffff0",
		khaki: "#f0e68c",
		lavender: "#e6e6fa",
		lavenderblush: "#fff0f5",
		lawngreen: "#7cfc00",
		lemonchiffon: "#fffacd",
		lightblue: "#add8e6",
		lightcoral: "#f08080",
		lightcyan: "#e0ffff",
		lightgoldenrodyellow: "#fafad2",
		lightgray: "#d3d3d3",
		lightgreen: "#90ee90",
		lightgrey: "#d3d3d3",
		lightpink: "#ffb6c1",
		lightsalmon: "#ffa07a",
		lightseagreen: "#20b2aa",
		lightskyblue: "#87cefa",
		lightslategray: "#778899",
		lightslategrey: "#778899",
		lightsteelblue: "#b0c4de",
		lightyellow: "#ffffe0",
		lime: "#00ff00",
		limegreen: "#32cd32",
		linen: "#faf0e6",
		magenta: "#ff00ff",
		maroon: "#800000",
		mediumaquamarine: "#66cdaa",
		mediumblue: "#0000cd",
		mediumorchid: "#ba55d3",
		mediumpurple: "#9370db",
		mediumseagreen: "#3cb371",
		mediumslateblue: "#7b68ee",
		mediumspringgreen: "#00fa9a",
		mediumturquoise: "#48d1cc",
		mediumvioletred: "#c71585",
		midnightblue: "#191970",
		mintcream: "#f5fffa",
		mistyrose: "#ffe4e1",
		moccasin: "#ffe4b5",
		navajowhite: "#ffdead",
		navy: "#000080",
		oldlace: "#fdf5e6",
		olive: "#808000",
		olivedrab: "#6b8e23",
		orange: "#ffa500",
		orangered: "#ff4500",
		orchid: "#da70d6",
		palegoldenrod: "#eee8aa",
		palegreen: "#98fb98",
		paleturquoise: "#afeeee",
		palevioletred: "#db7093",
		papayawhip: "#ffefd5",
		peachpuff: "#ffdab9",
		peru: "#cd853f",
		pink: "#ffc0cb",
		plum: "#dda0dd",
		powderblue: "#b0e0e6",
		purple: "#800080",
		rebeccapurple: "#663399",
		red: "#ff0000",
		rosybrown: "#bc8f8f",
		royalblue: "#4169e1",
		saddlebrown: "#8b4513",
		salmon: "#fa8072",
		sandybrown: "#f4a460",
		seagreen: "#2e8b57",
		seashell: "#fff5ee",
		sienna: "#a0522d",
		silver: "#c0c0c0",
		skyblue: "#87ceeb",
		slateblue: "#6a5acd",
		slategray: "#708090",
		slategrey: "#708090",
		snow: "#fffafa",
		springgreen: "#00ff7f",
		steelblue: "#4682b4",
		tan: "#d2b48c",
		teal: "#008080",
		thistle: "#d8bfd8",
		tomato: "#ff6347",
		turquoise: "#40e0d0",
		violet: "#ee82ee",
		wheat: "#f5deb3",
		white: "#ffffff",
		whitesmoke: "#f5f5f5",
		yellow: "#ffff00",
		yellowgreen: "#9acd32"
	};
})(Color || (Color = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/dictionary/dictionary.js
var Dictionary = class {
	constructor() {
		this.clear();
	}
	clear() {
		this.map = /* @__PURE__ */ new WeakMap();
		this.arr = [];
	}
	has(key) {
		return this.map.has(key);
	}
	get(key) {
		return this.map.get(key);
	}
	set(key, value) {
		this.map.set(key, value);
		this.arr.push(key);
	}
	delete(key) {
		const index = this.arr.indexOf(key);
		if (index >= 0) this.arr.splice(index, 1);
		const ret = this.map.get(key);
		this.map.delete(key);
		return ret;
	}
	each(iterator) {
		this.arr.forEach((key) => {
			iterator(this.map.get(key), key);
		});
	}
	dispose() {
		this.clear();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/modifier/index.js
var ModifierKey;
(function(ModifierKey) {
	function parse(modifiers) {
		const or = [];
		const and = [];
		if (Array.isArray(modifiers)) or.push(...modifiers);
		else modifiers.split("|").forEach((item) => {
			if (item.indexOf("&") === -1) or.push(item);
			else and.push(...item.split("&"));
		});
		return {
			or,
			and
		};
	}
	ModifierKey.parse = parse;
	function equals(modifiers1, modifiers2) {
		if (modifiers1 != null && modifiers2 != null) {
			const m1 = parse(modifiers1);
			const m2 = parse(modifiers2);
			const or1 = m1.or.sort();
			const or2 = m2.or.sort();
			const and1 = m1.and.sort();
			const and2 = m2.and.sort();
			const equal = (a1, a2) => {
				return a1.length === a2.length && (a1.length === 0 || a1.every((a, i) => a === a2[i]));
			};
			return equal(or1, or2) && equal(and1, and2);
		}
		if (modifiers1 == null && modifiers2 == null) return true;
		return false;
	}
	ModifierKey.equals = equals;
	function isMatch(e, modifiers, strict) {
		if (modifiers == null || Array.isArray(modifiers) && modifiers.length === 0) return strict ? e.altKey !== true && e.ctrlKey !== true && e.metaKey !== true && e.shiftKey !== true : true;
		const { or, and } = parse(modifiers);
		const match = (key) => {
			return e[`${key.toLowerCase()}Key`] === true;
		};
		return or.some((key) => match(key)) && and.every((key) => match(key));
	}
	ModifierKey.isMatch = isMatch;
})(ModifierKey || (ModifierKey = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/animation/timing.js
var Timing;
(function(Timing) {
	Timing.linear = (t) => t;
	Timing.quad = (t) => t * t;
	Timing.cubic = (t) => t * t * t;
	Timing.inout = (t) => {
		if (t <= 0) return 0;
		if (t >= 1) return 1;
		const t2 = t * t;
		const t3 = t2 * t;
		return 4 * (t < .5 ? t3 : 3 * (t - t2) + t3 - .75);
	};
	Timing.exponential = (t) => {
		return Math.pow(2, 10 * (t - 1));
	};
	Timing.bounce = ((t) => {
		for (let a = 0, b = 1;; a += b, b /= 2) if (t >= (7 - 4 * a) / 11) {
			const q = (11 - 6 * a - 11 * t) / 4;
			return -q * q + b * b;
		}
	});
})(Timing || (Timing = {}));
(function(Timing) {
	Timing.decorators = {
		reverse(f) {
			return (t) => 1 - f(1 - t);
		},
		reflect(f) {
			return (t) => .5 * (t < .5 ? f(2 * t) : 2 - f(2 - 2 * t));
		},
		clamp(f, n = 0, x = 1) {
			return (t) => {
				const r = f(t);
				return r < n ? n : r > x ? x : r;
			};
		},
		back(s = 1.70158) {
			return (t) => t * t * ((s + 1) * t - s);
		},
		elastic(x = 1.5) {
			return (t) => Math.pow(2, 10 * (t - 1)) * Math.cos(20 * Math.PI * x / 3 * t);
		}
	};
})(Timing || (Timing = {}));
(function(Timing) {
	function easeInSine(t) {
		return -1 * Math.cos(t * (Math.PI / 2)) + 1;
	}
	Timing.easeInSine = easeInSine;
	function easeOutSine(t) {
		return Math.sin(t * (Math.PI / 2));
	}
	Timing.easeOutSine = easeOutSine;
	function easeInOutSine(t) {
		return -.5 * (Math.cos(Math.PI * t) - 1);
	}
	Timing.easeInOutSine = easeInOutSine;
	function easeInQuad(t) {
		return t * t;
	}
	Timing.easeInQuad = easeInQuad;
	function easeOutQuad(t) {
		return t * (2 - t);
	}
	Timing.easeOutQuad = easeOutQuad;
	function easeInOutQuad(t) {
		return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
	}
	Timing.easeInOutQuad = easeInOutQuad;
	function easeInCubic(t) {
		return t * t * t;
	}
	Timing.easeInCubic = easeInCubic;
	function easeOutCubic(t) {
		const t1 = t - 1;
		return t1 * t1 * t1 + 1;
	}
	Timing.easeOutCubic = easeOutCubic;
	function easeInOutCubic(t) {
		return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
	}
	Timing.easeInOutCubic = easeInOutCubic;
	function easeInQuart(t) {
		return t * t * t * t;
	}
	Timing.easeInQuart = easeInQuart;
	function easeOutQuart(t) {
		const t1 = t - 1;
		return 1 - t1 * t1 * t1 * t1;
	}
	Timing.easeOutQuart = easeOutQuart;
	function easeInOutQuart(t) {
		const t1 = t - 1;
		return t < .5 ? 8 * t * t * t * t : 1 - 8 * t1 * t1 * t1 * t1;
	}
	Timing.easeInOutQuart = easeInOutQuart;
	function easeInQuint(t) {
		return t * t * t * t * t;
	}
	Timing.easeInQuint = easeInQuint;
	function easeOutQuint(t) {
		const t1 = t - 1;
		return 1 + t1 * t1 * t1 * t1 * t1;
	}
	Timing.easeOutQuint = easeOutQuint;
	function easeInOutQuint(t) {
		const t1 = t - 1;
		return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * t1 * t1 * t1 * t1 * t1;
	}
	Timing.easeInOutQuint = easeInOutQuint;
	function easeInExpo(t) {
		if (t === 0) return 0;
		return Math.pow(2, 10 * (t - 1));
	}
	Timing.easeInExpo = easeInExpo;
	function easeOutExpo(t) {
		if (t === 1) return 1;
		return -Math.pow(2, -10 * t) + 1;
	}
	Timing.easeOutExpo = easeOutExpo;
	function easeInOutExpo(t) {
		if (t === 0 || t === 1) return t;
		const scaledTime = t * 2;
		const scaledTime1 = scaledTime - 1;
		if (scaledTime < 1) return .5 * Math.pow(2, 10 * scaledTime1);
		return .5 * (-Math.pow(2, -10 * scaledTime1) + 2);
	}
	Timing.easeInOutExpo = easeInOutExpo;
	function easeInCirc(t) {
		const scaledTime = t / 1;
		return -1 * (Math.sqrt(1 - scaledTime * t) - 1);
	}
	Timing.easeInCirc = easeInCirc;
	function easeOutCirc(t) {
		const t1 = t - 1;
		return Math.sqrt(1 - t1 * t1);
	}
	Timing.easeOutCirc = easeOutCirc;
	function easeInOutCirc(t) {
		const scaledTime = t * 2;
		const scaledTime1 = scaledTime - 2;
		if (scaledTime < 1) return -.5 * (Math.sqrt(1 - scaledTime * scaledTime) - 1);
		return .5 * (Math.sqrt(1 - scaledTime1 * scaledTime1) + 1);
	}
	Timing.easeInOutCirc = easeInOutCirc;
	function easeInBack(t, magnitude = 1.70158) {
		return t * t * ((magnitude + 1) * t - magnitude);
	}
	Timing.easeInBack = easeInBack;
	function easeOutBack(t, magnitude = 1.70158) {
		const scaledTime = t / 1 - 1;
		return scaledTime * scaledTime * ((magnitude + 1) * scaledTime + magnitude) + 1;
	}
	Timing.easeOutBack = easeOutBack;
	function easeInOutBack(t, magnitude = 1.70158) {
		const scaledTime = t * 2;
		const scaledTime2 = scaledTime - 2;
		const s = magnitude * 1.525;
		if (scaledTime < 1) return .5 * scaledTime * scaledTime * ((s + 1) * scaledTime - s);
		return .5 * (scaledTime2 * scaledTime2 * ((s + 1) * scaledTime2 + s) + 2);
	}
	Timing.easeInOutBack = easeInOutBack;
	function easeInElastic(t, magnitude = .7) {
		if (t === 0 || t === 1) return t;
		const scaledTime1 = t / 1 - 1;
		const p = 1 - magnitude;
		const s = p / (2 * Math.PI) * Math.asin(1);
		return -(Math.pow(2, 10 * scaledTime1) * Math.sin((scaledTime1 - s) * (2 * Math.PI) / p));
	}
	Timing.easeInElastic = easeInElastic;
	function easeOutElastic(t, magnitude = .7) {
		const p = 1 - magnitude;
		const scaledTime = t * 2;
		if (t === 0 || t === 1) return t;
		const s = p / (2 * Math.PI) * Math.asin(1);
		return Math.pow(2, -10 * scaledTime) * Math.sin((scaledTime - s) * (2 * Math.PI) / p) + 1;
	}
	Timing.easeOutElastic = easeOutElastic;
	function easeInOutElastic(t, magnitude = .65) {
		const p = 1 - magnitude;
		if (t === 0 || t === 1) return t;
		const scaledTime = t * 2;
		const scaledTime1 = scaledTime - 1;
		const s = p / (2 * Math.PI) * Math.asin(1);
		if (scaledTime < 1) return -.5 * (Math.pow(2, 10 * scaledTime1) * Math.sin((scaledTime1 - s) * (2 * Math.PI) / p));
		return Math.pow(2, -10 * scaledTime1) * Math.sin((scaledTime1 - s) * (2 * Math.PI) / p) * .5 + 1;
	}
	Timing.easeInOutElastic = easeInOutElastic;
	function easeOutBounce(t) {
		const scaledTime = t / 1;
		if (scaledTime < 1 / 2.75) return 7.5625 * scaledTime * scaledTime;
		if (scaledTime < 2 / 2.75) {
			const scaledTime2 = scaledTime - 1.5 / 2.75;
			return 7.5625 * scaledTime2 * scaledTime2 + .75;
		}
		if (scaledTime < 2.5 / 2.75) {
			const scaledTime2 = scaledTime - 2.25 / 2.75;
			return 7.5625 * scaledTime2 * scaledTime2 + .9375;
		}
		{
			const scaledTime2 = scaledTime - 2.625 / 2.75;
			return 7.5625 * scaledTime2 * scaledTime2 + .984375;
		}
	}
	Timing.easeOutBounce = easeOutBounce;
	function easeInBounce(t) {
		return 1 - easeOutBounce(1 - t);
	}
	Timing.easeInBounce = easeInBounce;
	function easeInOutBounce(t) {
		if (t < .5) return easeInBounce(t * 2) * .5;
		return easeOutBounce(t * 2 - 1) * .5 + .5;
	}
	Timing.easeInOutBounce = easeInOutBounce;
})(Timing || (Timing = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/animation/interp.js
var Interp;
(function(Interp) {
	Interp.number = (a, b) => {
		const d = b - a;
		return (t) => {
			return a + d * t;
		};
	};
	Interp.object = (a, b) => {
		const keys = Object.keys(a);
		return (t) => {
			const ret = {};
			for (let i = keys.length - 1; i !== -1; i -= 1) {
				const key = keys[i];
				ret[key] = a[key] + (b[key] - a[key]) * t;
			}
			return ret;
		};
	};
	Interp.unit = (a, b) => {
		const reg = /(-?[0-9]*.[0-9]*)(px|em|cm|mm|in|pt|pc|%)/;
		const ma = reg.exec(a);
		const mb = reg.exec(b);
		const pb = mb ? mb[1] : "";
		const aa = ma ? +ma[1] : 0;
		const bb = mb ? +mb[1] : 0;
		const index = pb.indexOf(".");
		const precision = index > 0 ? pb[1].length - index - 1 : 0;
		const d = bb - aa;
		const u = ma ? ma[2] : "";
		return (t) => {
			return (aa + d * t).toFixed(precision) + u;
		};
	};
	Interp.color = (a, b) => {
		const ca = parseInt(a.slice(1), 16);
		const cb = parseInt(b.slice(1), 16);
		const ra = ca & 255;
		const rd = (cb & 255) - ra;
		const ga = ca & 65280;
		const gd = (cb & 65280) - ga;
		const ba = ca & 16711680;
		const bd = (cb & 16711680) - ba;
		return (t) => {
			const r = ra + rd * t & 255;
			const g = ga + gd * t & 65280;
			const b = ba + bd * t & 16711680;
			return `#${(1 << 24 | r | g | b).toString(16).slice(1)}`;
		};
	};
})(Interp || (Interp = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-common@2.0.17/node_modules/@antv/x6-common/es/css-loader/loader.js
var cssModules = [];
function ensure(name, content) {
	const cssModule = cssModules.find((m) => m.name === name);
	if (cssModule) {
		cssModule.loadTimes += 1;
		if (cssModule.loadTimes > 1) return;
	}
	if (!Platform.isApplyingHMR()) {
		const styleElement = document.createElement("style");
		styleElement.setAttribute("type", "text/css");
		styleElement.textContent = content;
		const head = document.querySelector("head");
		if (head) head.insertBefore(styleElement, head.firstChild);
		cssModules.push({
			name,
			loadTimes: 1,
			styleElement
		});
	}
}
function clean(name) {
	const index = cssModules.findIndex((m) => m.name === name);
	if (index > -1) {
		const cssModule = cssModules[index];
		cssModule.loadTimes -= 1;
		if (cssModule.loadTimes > 0) return;
		let styleElement = cssModule.styleElement;
		if (styleElement && styleElement.parentNode) styleElement.parentNode.removeChild(styleElement);
		styleElement = null;
		cssModules.splice(index, 1);
	}
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/angle.js
var Angle;
(function(Angle) {
	/**
	* Converts radian angle to degree angle.
	* @param rad The radians to convert.
	*/
	function toDeg(rad) {
		return 180 * rad / Math.PI % 360;
	}
	Angle.toDeg = toDeg;
	/**
	* Converts degree angle to radian angle.
	* @param deg The degree angle to convert.
	* @param over360
	*/
	Angle.toRad = function(deg, over360 = false) {
		return (over360 ? deg : deg % 360) * Math.PI / 180;
	};
	/**
	* Returns the angle in degrees and clamps its value between `0` and `360`.
	*/
	function normalize(angle) {
		return angle % 360 + (angle < 0 ? 360 : 0);
	}
	Angle.normalize = normalize;
})(Angle || (Angle = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/util.js
var GeometryUtil;
(function(GeometryUtil) {
	function round(num, precision = 0) {
		return Number.isInteger(num) ? num : +num.toFixed(precision);
	}
	GeometryUtil.round = round;
	function random(min, max) {
		let mmin;
		let mmax;
		if (max == null) {
			mmax = min == null ? 1 : min;
			mmin = 0;
		} else {
			mmax = max;
			mmin = min == null ? 0 : min;
		}
		if (mmax < mmin) {
			const temp = mmin;
			mmin = mmax;
			mmax = temp;
		}
		return Math.floor(Math.random() * (mmax - mmin + 1) + mmin);
	}
	GeometryUtil.random = random;
	function clamp(value, min, max) {
		if (Number.isNaN(value)) return NaN;
		if (Number.isNaN(min) || Number.isNaN(max)) return 0;
		return min < max ? value < min ? min : value > max ? max : value : value < max ? max : value > min ? min : value;
	}
	GeometryUtil.clamp = clamp;
	function snapToGrid(value, gridSize) {
		return gridSize * Math.round(value / gridSize);
	}
	GeometryUtil.snapToGrid = snapToGrid;
	function containsPoint(rect, point) {
		return point != null && rect != null && point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
	}
	GeometryUtil.containsPoint = containsPoint;
	function squaredLength(p1, p2) {
		const dx = p1.x - p2.x;
		const dy = p1.y - p2.y;
		return dx * dx + dy * dy;
	}
	GeometryUtil.squaredLength = squaredLength;
})(GeometryUtil || (GeometryUtil = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/geometry.js
var Geometry = class {
	valueOf() {
		return this.toJSON();
	}
	toString() {
		return JSON.stringify(this.toJSON());
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/point.js
var Point = class Point extends Geometry {
	constructor(x, y) {
		super();
		this.x = x == null ? 0 : x;
		this.y = y == null ? 0 : y;
	}
	/**
	* Rounds the point to the given precision.
	*/
	round(precision = 0) {
		this.x = GeometryUtil.round(this.x, precision);
		this.y = GeometryUtil.round(this.y, precision);
		return this;
	}
	add(x, y) {
		const p = Point.create(x, y);
		this.x += p.x;
		this.y += p.y;
		return this;
	}
	update(x, y) {
		const p = Point.create(x, y);
		this.x = p.x;
		this.y = p.y;
		return this;
	}
	translate(dx, dy) {
		const t = Point.create(dx, dy);
		this.x += t.x;
		this.y += t.y;
		return this;
	}
	/**
	* Rotate the point by `degree` around `center`.
	*/
	rotate(degree, center) {
		const p = Point.rotate(this, degree, center);
		this.x = p.x;
		this.y = p.y;
		return this;
	}
	/**
	* Scale point by `sx` and `sy` around the given `origin`. If origin is
	* not specified, the point is scaled around `0, 0`.
	*/
	scale(sx, sy, origin = new Point()) {
		const ref = Point.create(origin);
		this.x = ref.x + sx * (this.x - ref.x);
		this.y = ref.y + sy * (this.y - ref.y);
		return this;
	}
	/**
	* Chooses the point closest to this point from among `points`. If `points`
	* is an empty array, `null` is returned.
	*/
	closest(points) {
		if (points.length === 1) return Point.create(points[0]);
		let ret = null;
		let min = Infinity;
		points.forEach((p) => {
			const dist = this.squaredDistance(p);
			if (dist < min) {
				ret = p;
				min = dist;
			}
		});
		return ret ? Point.create(ret) : null;
	}
	/**
	* Returns the distance between the point and another point `p`.
	*/
	distance(p) {
		return Math.sqrt(this.squaredDistance(p));
	}
	/**
	* Returns the squared distance between the point and another point `p`.
	*
	* Useful for distance comparisons in which real distance is not necessary
	* (saves one `Math.sqrt()` operation).
	*/
	squaredDistance(p) {
		const ref = Point.create(p);
		const dx = this.x - ref.x;
		const dy = this.y - ref.y;
		return dx * dx + dy * dy;
	}
	manhattanDistance(p) {
		const ref = Point.create(p);
		return Math.abs(ref.x - this.x) + Math.abs(ref.y - this.y);
	}
	/**
	* Returns the magnitude of the point vector.
	*
	* @see http://en.wikipedia.org/wiki/Magnitude_(mathematics)
	*/
	magnitude() {
		return Math.sqrt(this.x * this.x + this.y * this.y) || .01;
	}
	/**
	* Returns the angle(in degrees) between vector from this point to `p` and
	* the x-axis.
	*/
	theta(p = new Point()) {
		const ref = Point.create(p);
		const y = -(ref.y - this.y);
		const x = ref.x - this.x;
		let rad = Math.atan2(y, x);
		if (rad < 0) rad = 2 * Math.PI + rad;
		return 180 * rad / Math.PI;
	}
	/**
	* Returns the angle(in degrees) between vector from this point to `p1` and
	* the vector from this point to `p2`.
	*
	* The ordering of points `p1` and `p2` is important.
	*
	* The function returns a value between `0` and `180` when the angle (in the
	* direction from `p1` to `p2`) is clockwise, and a value between `180` and
	* `360` when the angle is counterclockwise.
	*
	* Returns `NaN` if either of the points `p1` and `p2` is equal with this point.
	*/
	angleBetween(p1, p2) {
		if (this.equals(p1) || this.equals(p2)) return NaN;
		let angle = this.theta(p2) - this.theta(p1);
		if (angle < 0) angle += 360;
		return angle;
	}
	/**
	* Returns the angle(in degrees) between the line from `(0,0)` and this point
	* and the line from `(0,0)` to `p`.
	*
	* The function returns a value between `0` and `180` when the angle (in the
	* direction from this point to `p`) is clockwise, and a value between `180`
	* and `360` when the angle is counterclockwise. Returns `NaN` if called from
	* point `(0,0)` or if `p` is `(0,0)`.
	*/
	vectorAngle(p) {
		return new Point(0, 0).angleBetween(this, p);
	}
	/**
	* Converts rectangular to polar coordinates.
	*/
	toPolar(origin) {
		this.update(Point.toPolar(this, origin));
		return this;
	}
	/**
	* Returns the change in angle(in degrees) that is the result of moving the
	* point from its previous position to its current position.
	*
	* More specifically, this function computes the angle between the line from
	* the ref point to the previous position of this point(i.e. current position
	* `-dx`, `-dy`) and the line from the `ref` point to the current position of
	* this point.
	*
	* The function returns a positive value between `0` and `180` when the angle
	* (in the direction from previous position of this point to its current
	* position) is clockwise, and a negative value between `0` and `-180` when
	* the angle is counterclockwise.
	*
	* The function returns `0` if the previous and current positions of this
	* point are the same (i.e. both `dx` and `dy` are `0`).
	*/
	changeInAngle(dx, dy, ref = new Point()) {
		return this.clone().translate(-dx, -dy).theta(ref) - this.theta(ref);
	}
	/**
	* If the point lies outside the rectangle `rect`, adjust the point so that
	* it becomes the nearest point on the boundary of `rect`.
	*/
	adhereToRect(rect) {
		if (!GeometryUtil.containsPoint(rect, this)) {
			this.x = Math.min(Math.max(this.x, rect.x), rect.x + rect.width);
			this.y = Math.min(Math.max(this.y, rect.y), rect.y + rect.height);
		}
		return this;
	}
	/**
	* Returns the bearing(cardinal direction) between me and the given point.
	*
	* @see https://en.wikipedia.org/wiki/Cardinal_direction
	*/
	bearing(p) {
		const ref = Point.create(p);
		const lat1 = Angle.toRad(this.y);
		const lat2 = Angle.toRad(ref.y);
		const lon1 = this.x;
		const lon2 = ref.x;
		const dLon = Angle.toRad(lon2 - lon1);
		const y = Math.sin(dLon) * Math.cos(lat2);
		const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
		const brng = Angle.toDeg(Math.atan2(y, x));
		const bearings = [
			"NE",
			"E",
			"SE",
			"S",
			"SW",
			"W",
			"NW",
			"N"
		];
		let index = brng - 22.5;
		if (index < 0) index += 360;
		index = parseInt(index / 45, 10);
		return bearings[index];
	}
	/**
	* Returns the cross product of the vector from me to `p1` and the vector
	* from me to `p2`.
	*
	* The left-hand rule is used because the coordinate system is left-handed.
	*/
	cross(p1, p2) {
		if (p1 != null && p2 != null) {
			const a = Point.create(p1);
			const b = Point.create(p2);
			return (b.x - this.x) * (a.y - this.y) - (b.y - this.y) * (a.x - this.x);
		}
		return NaN;
	}
	/**
	* Returns the dot product of this point with given other point.
	*/
	dot(p) {
		const ref = Point.create(p);
		return this.x * ref.x + this.y * ref.y;
	}
	diff(dx, dy) {
		if (typeof dx === "number") return new Point(this.x - dx, this.y - dy);
		const p = Point.create(dx);
		return new Point(this.x - p.x, this.y - p.y);
	}
	/**
	* Returns an interpolation between me and point `p` for a parametert in
	* the closed interval `[0, 1]`.
	*/
	lerp(p, t) {
		const ref = Point.create(p);
		return new Point((1 - t) * this.x + t * ref.x, (1 - t) * this.y + t * ref.y);
	}
	/**
	* Normalize the point vector, scale the line segment between `(0, 0)`
	* and the point in order for it to have the given length. If length is
	* not specified, it is considered to be `1`; in that case, a unit vector
	* is computed.
	*/
	normalize(length = 1) {
		const scale = length / this.magnitude();
		return this.scale(scale, scale);
	}
	/**
	* Moves this point along the line starting from `ref` to this point by a
	* certain `distance`.
	*/
	move(ref, distance) {
		const p = Point.create(ref);
		const rad = Angle.toRad(p.theta(this));
		return this.translate(Math.cos(rad) * distance, -Math.sin(rad) * distance);
	}
	/**
	* Returns a point that is the reflection of me with the center of inversion
	* in `ref` point.
	*/
	reflection(ref) {
		return Point.create(ref).move(this, this.distance(ref));
	}
	snapToGrid(gx, gy) {
		this.x = GeometryUtil.snapToGrid(this.x, gx);
		this.y = GeometryUtil.snapToGrid(this.y, gy == null ? gx : gy);
		return this;
	}
	equals(p) {
		const ref = Point.create(p);
		return ref != null && ref.x === this.x && ref.y === this.y;
	}
	clone() {
		return Point.clone(this);
	}
	/**
	* Returns the point as a simple JSON object. For example: `{ x: 0, y: 0 }`.
	*/
	toJSON() {
		return Point.toJSON(this);
	}
	serialize() {
		return `${this.x} ${this.y}`;
	}
};
(function(Point) {
	function isPoint(instance) {
		return instance != null && instance instanceof Point;
	}
	Point.isPoint = isPoint;
})(Point || (Point = {}));
(function(Point) {
	function isPointLike(p) {
		return p != null && typeof p === "object" && typeof p.x === "number" && typeof p.y === "number";
	}
	Point.isPointLike = isPointLike;
	function isPointData(p) {
		return p != null && Array.isArray(p) && p.length === 2 && typeof p[0] === "number" && typeof p[1] === "number";
	}
	Point.isPointData = isPointData;
})(Point || (Point = {}));
(function(Point) {
	function create(x, y) {
		if (x == null || typeof x === "number") return new Point(x, y);
		return clone(x);
	}
	Point.create = create;
	function clone(p) {
		if (Point.isPoint(p)) return new Point(p.x, p.y);
		if (Array.isArray(p)) return new Point(p[0], p[1]);
		return new Point(p.x, p.y);
	}
	Point.clone = clone;
	function toJSON(p) {
		if (Point.isPoint(p)) return {
			x: p.x,
			y: p.y
		};
		if (Array.isArray(p)) return {
			x: p[0],
			y: p[1]
		};
		return {
			x: p.x,
			y: p.y
		};
	}
	Point.toJSON = toJSON;
	/**
	* Returns a new Point object from the given polar coordinates.
	* @see http://en.wikipedia.org/wiki/Polar_coordinate_system
	*/
	function fromPolar(r, rad, origin = new Point()) {
		let x = Math.abs(r * Math.cos(rad));
		let y = Math.abs(r * Math.sin(rad));
		const org = clone(origin);
		const deg = Angle.normalize(Angle.toDeg(rad));
		if (deg < 90) y = -y;
		else if (deg < 180) {
			x = -x;
			y = -y;
		} else if (deg < 270) x = -x;
		return new Point(org.x + x, org.y + y);
	}
	Point.fromPolar = fromPolar;
	/**
	* Converts rectangular to polar coordinates.
	*/
	function toPolar(point, origin = new Point()) {
		const p = clone(point);
		const o = clone(origin);
		const dx = p.x - o.x;
		const dy = p.y - o.y;
		return new Point(Math.sqrt(dx * dx + dy * dy), Angle.toRad(o.theta(p)));
	}
	Point.toPolar = toPolar;
	function equals(p1, p2) {
		if (p1 === p2) return true;
		if (p1 != null && p2 != null) return p1.x === p2.x && p1.y === p2.y;
		return false;
	}
	Point.equals = equals;
	function equalPoints(p1, p2) {
		if (p1 == null && p2 != null || p1 != null && p2 == null || p1 != null && p2 != null && p1.length !== p2.length) return false;
		if (p1 != null && p2 != null) {
			for (let i = 0, ii = p1.length; i < ii; i += 1) if (!equals(p1[i], p2[i])) return false;
		}
		return true;
	}
	Point.equalPoints = equalPoints;
	/**
	* Returns a point with random coordinates that fall within the range
	* `[x1, x2]` and `[y1, y2]`.
	*/
	function random(x1, x2, y1, y2) {
		return new Point(GeometryUtil.random(x1, x2), GeometryUtil.random(y1, y2));
	}
	Point.random = random;
	function rotate(point, angle, center) {
		const rad = Angle.toRad(Angle.normalize(-angle));
		return rotateEx(point, Math.cos(rad), Math.sin(rad), center);
	}
	Point.rotate = rotate;
	function rotateEx(point, cos, sin, center = new Point()) {
		const source = clone(point);
		const origin = clone(center);
		const dx = source.x - origin.x;
		const dy = source.y - origin.y;
		const x1 = dx * cos - dy * sin;
		const y1 = dy * cos + dx * sin;
		return new Point(x1 + origin.x, y1 + origin.y);
	}
	Point.rotateEx = rotateEx;
})(Point || (Point = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/rectangle.js
var Rectangle = class Rectangle extends Geometry {
	get left() {
		return this.x;
	}
	get top() {
		return this.y;
	}
	get right() {
		return this.x + this.width;
	}
	get bottom() {
		return this.y + this.height;
	}
	get origin() {
		return new Point(this.x, this.y);
	}
	get topLeft() {
		return new Point(this.x, this.y);
	}
	get topCenter() {
		return new Point(this.x + this.width / 2, this.y);
	}
	get topRight() {
		return new Point(this.x + this.width, this.y);
	}
	get center() {
		return new Point(this.x + this.width / 2, this.y + this.height / 2);
	}
	get bottomLeft() {
		return new Point(this.x, this.y + this.height);
	}
	get bottomCenter() {
		return new Point(this.x + this.width / 2, this.y + this.height);
	}
	get bottomRight() {
		return new Point(this.x + this.width, this.y + this.height);
	}
	get corner() {
		return new Point(this.x + this.width, this.y + this.height);
	}
	get rightMiddle() {
		return new Point(this.x + this.width, this.y + this.height / 2);
	}
	get leftMiddle() {
		return new Point(this.x, this.y + this.height / 2);
	}
	get topLine() {
		return new Line(this.topLeft, this.topRight);
	}
	get rightLine() {
		return new Line(this.topRight, this.bottomRight);
	}
	get bottomLine() {
		return new Line(this.bottomLeft, this.bottomRight);
	}
	get leftLine() {
		return new Line(this.topLeft, this.bottomLeft);
	}
	constructor(x, y, width, height) {
		super();
		this.x = x == null ? 0 : x;
		this.y = y == null ? 0 : y;
		this.width = width == null ? 0 : width;
		this.height = height == null ? 0 : height;
	}
	getOrigin() {
		return this.origin;
	}
	getTopLeft() {
		return this.topLeft;
	}
	getTopCenter() {
		return this.topCenter;
	}
	getTopRight() {
		return this.topRight;
	}
	getCenter() {
		return this.center;
	}
	getCenterX() {
		return this.x + this.width / 2;
	}
	getCenterY() {
		return this.y + this.height / 2;
	}
	getBottomLeft() {
		return this.bottomLeft;
	}
	getBottomCenter() {
		return this.bottomCenter;
	}
	getBottomRight() {
		return this.bottomRight;
	}
	getCorner() {
		return this.corner;
	}
	getRightMiddle() {
		return this.rightMiddle;
	}
	getLeftMiddle() {
		return this.leftMiddle;
	}
	getTopLine() {
		return this.topLine;
	}
	getRightLine() {
		return this.rightLine;
	}
	getBottomLine() {
		return this.bottomLine;
	}
	getLeftLine() {
		return this.leftLine;
	}
	/**
	* Returns a rectangle that is the bounding box of the rectangle.
	*
	* If `angle` is specified, the bounding box calculation will take into
	* account the rotation of the rectangle by angle degrees around its center.
	*/
	bbox(angle) {
		if (!angle) return this.clone();
		const rad = Angle.toRad(angle);
		const st = Math.abs(Math.sin(rad));
		const ct = Math.abs(Math.cos(rad));
		const w = this.width * ct + this.height * st;
		const h = this.width * st + this.height * ct;
		return new Rectangle(this.x + (this.width - w) / 2, this.y + (this.height - h) / 2, w, h);
	}
	round(precision = 0) {
		this.x = GeometryUtil.round(this.x, precision);
		this.y = GeometryUtil.round(this.y, precision);
		this.width = GeometryUtil.round(this.width, precision);
		this.height = GeometryUtil.round(this.height, precision);
		return this;
	}
	add(x, y, width, height) {
		const rect = Rectangle.create(x, y, width, height);
		const minX = Math.min(this.x, rect.x);
		const minY = Math.min(this.y, rect.y);
		const maxX = Math.max(this.x + this.width, rect.x + rect.width);
		const maxY = Math.max(this.y + this.height, rect.y + rect.height);
		this.x = minX;
		this.y = minY;
		this.width = maxX - minX;
		this.height = maxY - minY;
		return this;
	}
	update(x, y, width, height) {
		const rect = Rectangle.create(x, y, width, height);
		this.x = rect.x;
		this.y = rect.y;
		this.width = rect.width;
		this.height = rect.height;
		return this;
	}
	inflate(dx, dy) {
		const w = dx;
		const h = dy != null ? dy : dx;
		this.x -= w;
		this.y -= h;
		this.width += 2 * w;
		this.height += 2 * h;
		return this;
	}
	snapToGrid(gx, gy) {
		const origin = this.origin.snapToGrid(gx, gy);
		const corner = this.corner.snapToGrid(gx, gy);
		this.x = origin.x;
		this.y = origin.y;
		this.width = corner.x - origin.x;
		this.height = corner.y - origin.y;
		return this;
	}
	translate(tx, ty) {
		const p = Point.create(tx, ty);
		this.x += p.x;
		this.y += p.y;
		return this;
	}
	scale(sx, sy, origin = new Point()) {
		const pos = this.origin.scale(sx, sy, origin);
		this.x = pos.x;
		this.y = pos.y;
		this.width *= sx;
		this.height *= sy;
		return this;
	}
	rotate(degree, center = this.getCenter()) {
		if (degree !== 0) {
			const rad = Angle.toRad(degree);
			const cos = Math.cos(rad);
			const sin = Math.sin(rad);
			let p1 = this.getOrigin();
			let p2 = this.getTopRight();
			let p3 = this.getBottomRight();
			let p4 = this.getBottomLeft();
			p1 = Point.rotateEx(p1, cos, sin, center);
			p2 = Point.rotateEx(p2, cos, sin, center);
			p3 = Point.rotateEx(p3, cos, sin, center);
			p4 = Point.rotateEx(p4, cos, sin, center);
			const rect = new Rectangle(p1.x, p1.y, 0, 0);
			rect.add(p2.x, p2.y, 0, 0);
			rect.add(p3.x, p3.y, 0, 0);
			rect.add(p4.x, p4.y, 0, 0);
			this.update(rect);
		}
		return this;
	}
	rotate90() {
		const t = (this.width - this.height) / 2;
		this.x += t;
		this.y -= t;
		const tmp = this.width;
		this.width = this.height;
		this.height = tmp;
		return this;
	}
	/**
	* Translates the rectangle by `rect.x` and `rect.y` and expand it by
	* `rect.width` and `rect.height`.
	*/
	moveAndExpand(rect) {
		const ref = Rectangle.clone(rect);
		this.x += ref.x || 0;
		this.y += ref.y || 0;
		this.width += ref.width || 0;
		this.height += ref.height || 0;
		return this;
	}
	/**
	* Returns an object where `sx` and `sy` give the maximum scaling that can be
	* applied to the rectangle so that it would still fit into `limit`. If
	* `origin` is specified, the rectangle is scaled around it; otherwise, it is
	* scaled around its center.
	*/
	getMaxScaleToFit(limit, origin = this.center) {
		const rect = Rectangle.clone(limit);
		const ox = origin.x;
		const oy = origin.y;
		let sx1 = Infinity;
		let sx2 = Infinity;
		let sx3 = Infinity;
		let sx4 = Infinity;
		let sy1 = Infinity;
		let sy2 = Infinity;
		let sy3 = Infinity;
		let sy4 = Infinity;
		const p1 = rect.topLeft;
		if (p1.x < ox) sx1 = (this.x - ox) / (p1.x - ox);
		if (p1.y < oy) sy1 = (this.y - oy) / (p1.y - oy);
		const p2 = rect.bottomRight;
		if (p2.x > ox) sx2 = (this.x + this.width - ox) / (p2.x - ox);
		if (p2.y > oy) sy2 = (this.y + this.height - oy) / (p2.y - oy);
		const p3 = rect.topRight;
		if (p3.x > ox) sx3 = (this.x + this.width - ox) / (p3.x - ox);
		if (p3.y < oy) sy3 = (this.y - oy) / (p3.y - oy);
		const p4 = rect.bottomLeft;
		if (p4.x < ox) sx4 = (this.x - ox) / (p4.x - ox);
		if (p4.y > oy) sy4 = (this.y + this.height - oy) / (p4.y - oy);
		return {
			sx: Math.min(sx1, sx2, sx3, sx4),
			sy: Math.min(sy1, sy2, sy3, sy4)
		};
	}
	/**
	* Returns a number that specifies the maximum scaling that can be applied to
	* the rectangle along both axes so that it would still fit into `limit`. If
	* `origin` is specified, the rectangle is scaled around it; otherwise, it is
	* scaled around its center.
	*/
	getMaxUniformScaleToFit(limit, origin = this.center) {
		const scale = this.getMaxScaleToFit(limit, origin);
		return Math.min(scale.sx, scale.sy);
	}
	containsPoint(x, y) {
		return GeometryUtil.containsPoint(this, Point.create(x, y));
	}
	containsRect(x, y, width, height) {
		const b = Rectangle.create(x, y, width, height);
		const x1 = this.x;
		const y1 = this.y;
		const w1 = this.width;
		const h1 = this.height;
		const x2 = b.x;
		const y2 = b.y;
		const w2 = b.width;
		const h2 = b.height;
		if (w1 === 0 || h1 === 0 || w2 === 0 || h2 === 0) return false;
		return x2 >= x1 && y2 >= y1 && x2 + w2 <= x1 + w1 && y2 + h2 <= y1 + h1;
	}
	/**
	* Returns an array of the intersection points of the rectangle and the line.
	* Return `null` if no intersection exists.
	*/
	intersectsWithLine(line) {
		const rectLines = [
			this.topLine,
			this.rightLine,
			this.bottomLine,
			this.leftLine
		];
		const points = [];
		const dedupeArr = [];
		rectLines.forEach((l) => {
			const p = line.intersectsWithLine(l);
			if (p !== null && dedupeArr.indexOf(p.toString()) < 0) {
				points.push(p);
				dedupeArr.push(p.toString());
			}
		});
		return points.length > 0 ? points : null;
	}
	/**
	* Returns the point on the boundary of the rectangle that is the intersection
	* of the rectangle with a line starting in the center the rectangle ending in
	* the point `p`.
	*
	* If `angle` is specified, the intersection will take into account the
	* rotation of the rectangle by `angle` degrees around its center.
	*/
	intersectsWithLineFromCenterToPoint(p, angle) {
		const ref = Point.clone(p);
		const center = this.center;
		let result = null;
		if (angle != null && angle !== 0) ref.rotate(angle, center);
		const sides = [
			this.topLine,
			this.rightLine,
			this.bottomLine,
			this.leftLine
		];
		const connector = new Line(center, ref);
		for (let i = sides.length - 1; i >= 0; i -= 1) {
			const intersection = sides[i].intersectsWithLine(connector);
			if (intersection !== null) {
				result = intersection;
				break;
			}
		}
		if (result && angle != null && angle !== 0) result.rotate(-angle, center);
		return result;
	}
	intersectsWithRect(x, y, width, height) {
		const ref = Rectangle.create(x, y, width, height);
		if (!this.isIntersectWithRect(ref)) return null;
		const myOrigin = this.origin;
		const myCorner = this.corner;
		const rOrigin = ref.origin;
		const rCorner = ref.corner;
		const xx = Math.max(myOrigin.x, rOrigin.x);
		const yy = Math.max(myOrigin.y, rOrigin.y);
		return new Rectangle(xx, yy, Math.min(myCorner.x, rCorner.x) - xx, Math.min(myCorner.y, rCorner.y) - yy);
	}
	isIntersectWithRect(x, y, width, height) {
		const ref = Rectangle.create(x, y, width, height);
		const myOrigin = this.origin;
		const myCorner = this.corner;
		const rOrigin = ref.origin;
		const rCorner = ref.corner;
		if (rCorner.x <= myOrigin.x || rCorner.y <= myOrigin.y || rOrigin.x >= myCorner.x || rOrigin.y >= myCorner.y) return false;
		return true;
	}
	/**
	* Normalize the rectangle, i.e. make it so that it has non-negative
	* width and height. If width is less than `0`, the function swaps left and
	* right corners and if height is less than `0`, the top and bottom corners
	* are swapped.
	*/
	normalize() {
		let newx = this.x;
		let newy = this.y;
		let newwidth = this.width;
		let newheight = this.height;
		if (this.width < 0) {
			newx = this.x + this.width;
			newwidth = -this.width;
		}
		if (this.height < 0) {
			newy = this.y + this.height;
			newheight = -this.height;
		}
		this.x = newx;
		this.y = newy;
		this.width = newwidth;
		this.height = newheight;
		return this;
	}
	/**
	* Returns a rectangle that is a union of this rectangle and rectangle `rect`.
	*/
	union(rect) {
		const ref = Rectangle.clone(rect);
		const myOrigin = this.origin;
		const myCorner = this.corner;
		const rOrigin = ref.origin;
		const rCorner = ref.corner;
		const originX = Math.min(myOrigin.x, rOrigin.x);
		const originY = Math.min(myOrigin.y, rOrigin.y);
		const cornerX = Math.max(myCorner.x, rCorner.x);
		const cornerY = Math.max(myCorner.y, rCorner.y);
		return new Rectangle(originX, originY, cornerX - originX, cornerY - originY);
	}
	/**
	* Returns a string ("top", "left", "right" or "bottom") denoting the side of
	* the rectangle which is nearest to the point `p`.
	*/
	getNearestSideToPoint(p) {
		const ref = Point.clone(p);
		const distLeft = ref.x - this.x;
		const distRight = this.x + this.width - ref.x;
		const distTop = ref.y - this.y;
		const distBottom = this.y + this.height - ref.y;
		let closest = distLeft;
		let side = "left";
		if (distRight < closest) {
			closest = distRight;
			side = "right";
		}
		if (distTop < closest) {
			closest = distTop;
			side = "top";
		}
		if (distBottom < closest) side = "bottom";
		return side;
	}
	/**
	* Returns a point on the boundary of the rectangle nearest to the point `p`.
	*/
	getNearestPointToPoint(p) {
		const ref = Point.clone(p);
		if (this.containsPoint(ref)) {
			const side = this.getNearestSideToPoint(ref);
			if (side === "left") return new Point(this.x, ref.y);
			if (side === "top") return new Point(ref.x, this.y);
			if (side === "right") return new Point(this.x + this.width, ref.y);
			if (side === "bottom") return new Point(ref.x, this.y + this.height);
		}
		return ref.adhereToRect(this);
	}
	equals(rect) {
		return rect != null && rect.x === this.x && rect.y === this.y && rect.width === this.width && rect.height === this.height;
	}
	clone() {
		return new Rectangle(this.x, this.y, this.width, this.height);
	}
	toJSON() {
		return {
			x: this.x,
			y: this.y,
			width: this.width,
			height: this.height
		};
	}
	serialize() {
		return `${this.x} ${this.y} ${this.width} ${this.height}`;
	}
};
(function(Rectangle) {
	function isRectangle(instance) {
		return instance != null && instance instanceof Rectangle;
	}
	Rectangle.isRectangle = isRectangle;
})(Rectangle || (Rectangle = {}));
(function(Rectangle) {
	function isRectangleLike(o) {
		return o != null && typeof o === "object" && typeof o.x === "number" && typeof o.y === "number" && typeof o.width === "number" && typeof o.height === "number";
	}
	Rectangle.isRectangleLike = isRectangleLike;
})(Rectangle || (Rectangle = {}));
(function(Rectangle) {
	function create(x, y, width, height) {
		if (x == null || typeof x === "number") return new Rectangle(x, y, width, height);
		return clone(x);
	}
	Rectangle.create = create;
	function clone(rect) {
		if (Rectangle.isRectangle(rect)) return rect.clone();
		if (Array.isArray(rect)) return new Rectangle(rect[0], rect[1], rect[2], rect[3]);
		return new Rectangle(rect.x, rect.y, rect.width, rect.height);
	}
	Rectangle.clone = clone;
	/**
	* Returns a new rectangle from the given ellipse.
	*/
	function fromEllipse(ellipse) {
		return new Rectangle(ellipse.x - ellipse.a, ellipse.y - ellipse.b, 2 * ellipse.a, 2 * ellipse.b);
	}
	Rectangle.fromEllipse = fromEllipse;
	function fromSize(size) {
		return new Rectangle(0, 0, size.width, size.height);
	}
	Rectangle.fromSize = fromSize;
	function fromPositionAndSize(pos, size) {
		return new Rectangle(pos.x, pos.y, size.width, size.height);
	}
	Rectangle.fromPositionAndSize = fromPositionAndSize;
})(Rectangle || (Rectangle = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/line.js
var Line = class Line extends Geometry {
	get center() {
		return new Point((this.start.x + this.end.x) / 2, (this.start.y + this.end.y) / 2);
	}
	constructor(x1, y1, x2, y2) {
		super();
		if (typeof x1 === "number" && typeof y1 === "number") {
			this.start = new Point(x1, y1);
			this.end = new Point(x2, y2);
		} else {
			this.start = Point.create(x1);
			this.end = Point.create(y1);
		}
	}
	getCenter() {
		return this.center;
	}
	/**
	* Rounds the line to the given `precision`.
	*/
	round(precision = 0) {
		this.start.round(precision);
		this.end.round(precision);
		return this;
	}
	translate(tx, ty) {
		if (typeof tx === "number") {
			this.start.translate(tx, ty);
			this.end.translate(tx, ty);
		} else {
			this.start.translate(tx);
			this.end.translate(tx);
		}
		return this;
	}
	/**
	* Rotate the line by `angle` around `origin`.
	*/
	rotate(angle, origin) {
		this.start.rotate(angle, origin);
		this.end.rotate(angle, origin);
		return this;
	}
	/**
	* Scale the line by `sx` and `sy` about the given `origin`. If origin is not
	* specified, the line is scaled around `0,0`.
	*/
	scale(sx, sy, origin) {
		this.start.scale(sx, sy, origin);
		this.end.scale(sx, sy, origin);
		return this;
	}
	/**
	* Returns the length of the line.
	*/
	length() {
		return Math.sqrt(this.squaredLength());
	}
	/**
	* Useful for distance comparisons in which real length is not necessary
	* (saves one `Math.sqrt()` operation).
	*/
	squaredLength() {
		const dx = this.start.x - this.end.x;
		const dy = this.start.y - this.end.y;
		return dx * dx + dy * dy;
	}
	/**
	* Scale the line so that it has the requested length. The start point of
	* the line is preserved.
	*/
	setLength(length) {
		const total = this.length();
		if (!total) return this;
		const scale = length / total;
		return this.scale(scale, scale, this.start);
	}
	parallel(distance) {
		const line = this.clone();
		if (!line.isDifferentiable()) return line;
		const { start, end } = line;
		const eRef = start.clone().rotate(270, end);
		const sRef = end.clone().rotate(90, start);
		start.move(sRef, distance);
		end.move(eRef, distance);
		return line;
	}
	/**
	* Returns the vector of the line with length equal to length of the line.
	*/
	vector() {
		return new Point(this.end.x - this.start.x, this.end.y - this.start.y);
	}
	/**
	* Returns the angle of incline of the line.
	*
	* The function returns `NaN` if the start and end endpoints of the line
	* both lie at the same coordinates(it is impossible to determine the angle
	* of incline of a line that appears to be a point). The
	* `line.isDifferentiable()` function may be used in advance to determine
	* whether the angle of incline can be computed for a given line.
	*/
	angle() {
		const ref = new Point(this.start.x + 1, this.start.y);
		return this.start.angleBetween(this.end, ref);
	}
	/**
	* Returns a rectangle that is the bounding box of the line.
	*/
	bbox() {
		const left = Math.min(this.start.x, this.end.x);
		const top = Math.min(this.start.y, this.end.y);
		const right = Math.max(this.start.x, this.end.x);
		const bottom = Math.max(this.start.y, this.end.y);
		return new Rectangle(left, top, right - left, bottom - top);
	}
	/**
	* Returns the bearing (cardinal direction) of the line.
	*
	* The return value is one of the following strings:
	* 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW' and 'N'.
	*
	* The function returns 'N' if the two endpoints of the line are coincident.
	*/
	bearing() {
		return this.start.bearing(this.end);
	}
	/**
	* Returns the point on the line that lies closest to point `p`.
	*/
	closestPoint(p) {
		return this.pointAt(this.closestPointNormalizedLength(p));
	}
	/**
	* Returns the length of the line up to the point that lies closest to point `p`.
	*/
	closestPointLength(p) {
		return this.closestPointNormalizedLength(p) * this.length();
	}
	/**
	* Returns a line that is tangent to the line at the point that lies closest
	* to point `p`.
	*/
	closestPointTangent(p) {
		return this.tangentAt(this.closestPointNormalizedLength(p));
	}
	/**
	* Returns the normalized length (distance from the start of the line / total
	* line length) of the line up to the point that lies closest to point.
	*/
	closestPointNormalizedLength(p) {
		const product = this.vector().dot(new Line(this.start, p).vector());
		const normalized = Math.min(1, Math.max(0, product / this.squaredLength()));
		if (Number.isNaN(normalized)) return 0;
		return normalized;
	}
	/**
	* Returns a point on the line that lies `rate` (normalized length) away from
	* the beginning of the line.
	*/
	pointAt(ratio) {
		const start = this.start;
		const end = this.end;
		if (ratio <= 0) return start.clone();
		if (ratio >= 1) return end.clone();
		return start.lerp(end, ratio);
	}
	/**
	* Returns a point on the line that lies length away from the beginning of
	* the line.
	*/
	pointAtLength(length) {
		const start = this.start;
		const end = this.end;
		let fromStart = true;
		if (length < 0) {
			fromStart = false;
			length = -length;
		}
		const total = this.length();
		if (length >= total) return fromStart ? end.clone() : start.clone();
		const rate = (fromStart ? length : total - length) / total;
		return this.pointAt(rate);
	}
	/**
	* Divides the line into two lines at the point that lies `rate` (normalized
	* length) away from the beginning of the line.
	*/
	divideAt(ratio) {
		const dividerPoint = this.pointAt(ratio);
		return [new Line(this.start, dividerPoint), new Line(dividerPoint, this.end)];
	}
	/**
	* Divides the line into two lines at the point that lies length away from
	* the beginning of the line.
	*/
	divideAtLength(length) {
		const dividerPoint = this.pointAtLength(length);
		return [new Line(this.start, dividerPoint), new Line(dividerPoint, this.end)];
	}
	/**
	* Returns `true` if the point `p` lies on the line. Return `false` otherwise.
	*/
	containsPoint(p) {
		const start = this.start;
		const end = this.end;
		if (start.cross(p, end) !== 0) return false;
		const length = this.length();
		if (new Line(start, p).length() > length) return false;
		if (new Line(p, end).length() > length) return false;
		return true;
	}
	intersect(shape, options) {
		const ret = shape.intersectsWithLine(this, options);
		if (ret) return Array.isArray(ret) ? ret : [ret];
		return null;
	}
	/**
	* Returns the intersection point of the line with another line. Returns
	* `null` if no intersection exists.
	*/
	intersectsWithLine(line) {
		const pt1Dir = new Point(this.end.x - this.start.x, this.end.y - this.start.y);
		const pt2Dir = new Point(line.end.x - line.start.x, line.end.y - line.start.y);
		const det = pt1Dir.x * pt2Dir.y - pt1Dir.y * pt2Dir.x;
		const deltaPt = new Point(line.start.x - this.start.x, line.start.y - this.start.y);
		const alpha = deltaPt.x * pt2Dir.y - deltaPt.y * pt2Dir.x;
		const beta = deltaPt.x * pt1Dir.y - deltaPt.y * pt1Dir.x;
		if (det === 0 || alpha * det < 0 || beta * det < 0) return null;
		if (det > 0) {
			if (alpha > det || beta > det) return null;
		} else if (alpha < det || beta < det) return null;
		return new Point(this.start.x + alpha * pt1Dir.x / det, this.start.y + alpha * pt1Dir.y / det);
	}
	/**
	* Returns `true` if a tangent line can be found for the line.
	*
	* Tangents cannot be found if both of the line endpoints are coincident
	* (the line appears to be a point).
	*/
	isDifferentiable() {
		return !this.start.equals(this.end);
	}
	/**
	* Returns the perpendicular distance between the line and point. The
	* distance is positive if the point lies to the right of the line, negative
	* if the point lies to the left of the line, and `0` if the point lies on
	* the line.
	*/
	pointOffset(p) {
		const ref = Point.clone(p);
		const start = this.start;
		const end = this.end;
		return ((end.x - start.x) * (ref.y - start.y) - (end.y - start.y) * (ref.x - start.x)) / this.length();
	}
	pointSquaredDistance(x, y) {
		const p = Point.create(x, y);
		return this.closestPoint(p).squaredDistance(p);
	}
	pointDistance(x, y) {
		const p = Point.create(x, y);
		return this.closestPoint(p).distance(p);
	}
	/**
	* Returns a line tangent to the line at point that lies `rate` (normalized
	* length) away from the beginning of the line.
	*/
	tangentAt(ratio) {
		if (!this.isDifferentiable()) return null;
		const start = this.start;
		const end = this.end;
		const tangentStart = this.pointAt(ratio);
		const tangentLine = new Line(start, end);
		tangentLine.translate(tangentStart.x - start.x, tangentStart.y - start.y);
		return tangentLine;
	}
	/**
	* Returns a line tangent to the line at point that lies `length` away from
	* the beginning of the line.
	*/
	tangentAtLength(length) {
		if (!this.isDifferentiable()) return null;
		const start = this.start;
		const end = this.end;
		const tangentStart = this.pointAtLength(length);
		const tangentLine = new Line(start, end);
		tangentLine.translate(tangentStart.x - start.x, tangentStart.y - start.y);
		return tangentLine;
	}
	relativeCcw(x, y) {
		const ref = Point.create(x, y);
		let dx1 = ref.x - this.start.x;
		let dy1 = ref.y - this.start.y;
		const dx2 = this.end.x - this.start.x;
		const dy2 = this.end.y - this.start.y;
		let ccw = dx1 * dy2 - dy1 * dx2;
		if (ccw === 0) {
			ccw = dx1 * dx2 + dy1 * dy2;
			if (ccw > 0) {
				dx1 -= dx2;
				dy1 -= dy2;
				ccw = dx1 * dx2 + dy1 * dy2;
				if (ccw < 0) ccw = 0;
			}
		}
		return ccw < 0 ? -1 : ccw > 0 ? 1 : 0;
	}
	/**
	* Return `true` if the line equals the other line.
	*/
	equals(l) {
		return l != null && this.start.x === l.start.x && this.start.y === l.start.y && this.end.x === l.end.x && this.end.y === l.end.y;
	}
	/**
	* Returns another line which is a clone of the line.
	*/
	clone() {
		return new Line(this.start, this.end);
	}
	toJSON() {
		return {
			start: this.start.toJSON(),
			end: this.end.toJSON()
		};
	}
	serialize() {
		return [this.start.serialize(), this.end.serialize()].join(" ");
	}
};
(function(Line) {
	function isLine(instance) {
		return instance != null && instance instanceof Line;
	}
	Line.isLine = isLine;
})(Line || (Line = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/ellipse.js
var Ellipse$1 = class Ellipse$1 extends Geometry {
	get center() {
		return new Point(this.x, this.y);
	}
	constructor(x, y, a, b) {
		super();
		this.x = x == null ? 0 : x;
		this.y = y == null ? 0 : y;
		this.a = a == null ? 0 : a;
		this.b = b == null ? 0 : b;
	}
	/**
	* Returns a rectangle that is the bounding box of the ellipse.
	*/
	bbox() {
		return Rectangle.fromEllipse(this);
	}
	/**
	* Returns a point that is the center of the ellipse.
	*/
	getCenter() {
		return this.center;
	}
	inflate(dx, dy) {
		const w = dx;
		const h = dy != null ? dy : dx;
		this.a += 2 * w;
		this.b += 2 * h;
		return this;
	}
	normalizedDistance(x, y) {
		const ref = Point.create(x, y);
		const dx = ref.x - this.x;
		const dy = ref.y - this.y;
		const a = this.a;
		const b = this.b;
		return dx * dx / (a * a) + dy * dy / (b * b);
	}
	containsPoint(x, y) {
		return this.normalizedDistance(x, y) <= 1;
	}
	/**
	* Returns an array of the intersection points of the ellipse and the line.
	* Returns `null` if no intersection exists.
	*/
	intersectsWithLine(line) {
		const intersections = [];
		const rx = this.a;
		const ry = this.b;
		const a1 = line.start;
		const a2 = line.end;
		const dir = line.vector();
		const diff = a1.diff(new Point(this.x, this.y));
		const mDir = new Point(dir.x / (rx * rx), dir.y / (ry * ry));
		const mDiff = new Point(diff.x / (rx * rx), diff.y / (ry * ry));
		const a = dir.dot(mDir);
		const b = dir.dot(mDiff);
		const c = diff.dot(mDiff) - 1;
		const d = b * b - a * c;
		if (d < 0) return null;
		if (d > 0) {
			const root = Math.sqrt(d);
			const ta = (-b - root) / a;
			const tb = (-b + root) / a;
			if ((ta < 0 || ta > 1) && (tb < 0 || tb > 1)) return null;
			if (ta >= 0 && ta <= 1) intersections.push(a1.lerp(a2, ta));
			if (tb >= 0 && tb <= 1) intersections.push(a1.lerp(a2, tb));
		} else {
			const t = -b / a;
			if (t >= 0 && t <= 1) intersections.push(a1.lerp(a2, t));
			else return null;
		}
		return intersections;
	}
	/**
	* Returns the point on the boundary of the ellipse that is the
	* intersection of the ellipse with a line starting in the center
	* of the ellipse ending in the point `p`.
	*
	* If angle is specified, the intersection will take into account
	* the rotation of the ellipse by angle degrees around its center.
	*/
	intersectsWithLineFromCenterToPoint(p, angle = 0) {
		const ref = Point.clone(p);
		if (angle) ref.rotate(angle, this.getCenter());
		const dx = ref.x - this.x;
		const dy = ref.y - this.y;
		let result;
		if (dx === 0) {
			result = this.bbox().getNearestPointToPoint(ref);
			if (angle) return result.rotate(-angle, this.getCenter());
			return result;
		}
		const m = dy / dx;
		const mSquared = m * m;
		const aSquared = this.a * this.a;
		const bSquared = this.b * this.b;
		let x = Math.sqrt(1 / (1 / aSquared + mSquared / bSquared));
		x = dx < 0 ? -x : x;
		const y = m * x;
		result = new Point(this.x + x, this.y + y);
		if (angle) return result.rotate(-angle, this.getCenter());
		return result;
	}
	/**
	* Returns the angle between the x-axis and the tangent from a point. It is
	* valid for points lying on the ellipse boundary only.
	*/
	tangentTheta(p) {
		const ref = Point.clone(p);
		const x0 = ref.x;
		const y0 = ref.y;
		const a = this.a;
		const b = this.b;
		const center = this.bbox().center;
		const cx = center.x;
		const cy = center.y;
		const refPointDelta = 30;
		const q1 = x0 > center.x + a / 2;
		const q3 = x0 < center.x - a / 2;
		let x;
		let y;
		if (q1 || q3) {
			y = x0 > center.x ? y0 - refPointDelta : y0 + refPointDelta;
			x = a * a / (x0 - cx) - a * a * (y0 - cy) * (y - cy) / (b * b * (x0 - cx)) + cx;
		} else {
			x = y0 > center.y ? x0 + refPointDelta : x0 - refPointDelta;
			y = b * b / (y0 - cy) - b * b * (x0 - cx) * (x - cx) / (a * a * (y0 - cy)) + cy;
		}
		return new Point(x, y).theta(ref);
	}
	scale(sx, sy) {
		this.a *= sx;
		this.b *= sy;
		return this;
	}
	rotate(angle, origin) {
		const rect = Rectangle.fromEllipse(this);
		rect.rotate(angle, origin);
		const ellipse = Ellipse$1.fromRect(rect);
		this.a = ellipse.a;
		this.b = ellipse.b;
		this.x = ellipse.x;
		this.y = ellipse.y;
		return this;
	}
	translate(dx, dy) {
		const p = Point.create(dx, dy);
		this.x += p.x;
		this.y += p.y;
		return this;
	}
	equals(ellipse) {
		return ellipse != null && ellipse.x === this.x && ellipse.y === this.y && ellipse.a === this.a && ellipse.b === this.b;
	}
	clone() {
		return new Ellipse$1(this.x, this.y, this.a, this.b);
	}
	toJSON() {
		return {
			x: this.x,
			y: this.y,
			a: this.a,
			b: this.b
		};
	}
	serialize() {
		return `${this.x} ${this.y} ${this.a} ${this.b}`;
	}
};
(function(Ellipse) {
	function isEllipse(instance) {
		return instance != null && instance instanceof Ellipse;
	}
	Ellipse.isEllipse = isEllipse;
})(Ellipse$1 || (Ellipse$1 = {}));
(function(Ellipse) {
	function create(x, y, a, b) {
		if (x == null || typeof x === "number") return new Ellipse(x, y, a, b);
		return parse(x);
	}
	Ellipse.create = create;
	function parse(e) {
		if (Ellipse.isEllipse(e)) return e.clone();
		if (Array.isArray(e)) return new Ellipse(e[0], e[1], e[2], e[3]);
		return new Ellipse(e.x, e.y, e.a, e.b);
	}
	Ellipse.parse = parse;
	function fromRect(rect) {
		const center = rect.center;
		return new Ellipse(center.x, center.y, rect.width / 2, rect.height / 2);
	}
	Ellipse.fromRect = fromRect;
})(Ellipse$1 || (Ellipse$1 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/path/util.js
var regexSupportedData = new RegExp(`^[\\s\\dLMCZz,.]*$`);
function isValid(data) {
	if (typeof data !== "string") return false;
	return regexSupportedData.test(data);
}
/**
* Returns the remainder of division of `n` by `m`. You should use this
* instead of the built-in operation as the built-in operation does not
* properly handle negative numbers.
*/
function mod(n, m) {
	return (n % m + m) % m;
}
function draw(points, round, initialMove, close, exclude) {
	const data = [];
	const end = points[points.length - 1];
	const rounded = round != null && round > 0;
	const arcSize = round || 0;
	if (close && rounded) {
		points = points.slice();
		const p0 = points[0];
		const wp = new Point(end.x + (p0.x - end.x) / 2, end.y + (p0.y - end.y) / 2);
		points.splice(0, 0, wp);
	}
	let pt = points[0];
	let i = 1;
	if (initialMove) data.push("M", pt.x, pt.y);
	else data.push("L", pt.x, pt.y);
	while (i < (close ? points.length : points.length - 1)) {
		let tmp = points[mod(i, points.length)];
		let dx = pt.x - tmp.x;
		let dy = pt.y - tmp.y;
		if (rounded && (dx !== 0 || dy !== 0) && (exclude == null || exclude.indexOf(i - 1) < 0)) {
			let dist = Math.sqrt(dx * dx + dy * dy);
			const nx1 = dx * Math.min(arcSize, dist / 2) / dist;
			const ny1 = dy * Math.min(arcSize, dist / 2) / dist;
			const x1 = tmp.x + nx1;
			const y1 = tmp.y + ny1;
			data.push("L", x1, y1);
			let next = points[mod(i + 1, points.length)];
			while (i < points.length - 2 && Math.round(next.x - tmp.x) === 0 && Math.round(next.y - tmp.y) === 0) {
				next = points[mod(i + 2, points.length)];
				i += 1;
			}
			dx = next.x - tmp.x;
			dy = next.y - tmp.y;
			dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
			const nx2 = dx * Math.min(arcSize, dist / 2) / dist;
			const ny2 = dy * Math.min(arcSize, dist / 2) / dist;
			const x2 = tmp.x + nx2;
			const y2 = tmp.y + ny2;
			data.push("Q", tmp.x, tmp.y, x2, y2);
			tmp = new Point(x2, y2);
		} else data.push("L", tmp.x, tmp.y);
		pt = tmp;
		i += 1;
	}
	if (close) data.push("Z");
	else data.push("L", end.x, end.y);
	return data.map((v) => typeof v === "string" ? v : +v.toFixed(3)).join(" ");
}
function drawPoints(points, options = {}) {
	const pts = [];
	if (points && points.length) points.forEach((p) => {
		if (Array.isArray(p)) pts.push({
			x: p[0],
			y: p[1]
		});
		else pts.push({
			x: p.x,
			y: p.y
		});
	});
	return draw(pts, options.round, options.initialMove == null || options.initialMove, options.close, options.exclude);
}
/**
* Converts the given arc to a series of curves.
*/
function arcToCurves(x0, y0, r1, r2, angle = 0, largeArcFlag = 0, sweepFlag = 0, x, y) {
	if (r1 === 0 || r2 === 0) return [];
	x -= x0;
	y -= y0;
	r1 = Math.abs(r1);
	r2 = Math.abs(r2);
	const ctx = -x / 2;
	const cty = -y / 2;
	const cpsi = Math.cos(angle * Math.PI / 180);
	const spsi = Math.sin(angle * Math.PI / 180);
	const rxd = cpsi * ctx + spsi * cty;
	const ryd = -1 * spsi * ctx + cpsi * cty;
	const rxdd = rxd * rxd;
	const rydd = ryd * ryd;
	const r1x = r1 * r1;
	const r2y = r2 * r2;
	const lamda = rxdd / r1x + rydd / r2y;
	let sds;
	if (lamda > 1) {
		r1 = Math.sqrt(lamda) * r1;
		r2 = Math.sqrt(lamda) * r2;
		sds = 0;
	} else {
		let seif = 1;
		if (largeArcFlag === sweepFlag) seif = -1;
		sds = seif * Math.sqrt((r1x * r2y - r1x * rydd - r2y * rxdd) / (r1x * rydd + r2y * rxdd));
	}
	const txd = sds * r1 * ryd / r2;
	const tyd = -1 * sds * r2 * rxd / r1;
	const tx = cpsi * txd - spsi * tyd + x / 2;
	const ty = spsi * txd + cpsi * tyd + y / 2;
	let rad = Math.atan2((ryd - tyd) / r2, (rxd - txd) / r1) - Math.atan2(0, 1);
	let s1 = rad >= 0 ? rad : 2 * Math.PI + rad;
	rad = Math.atan2((-ryd - tyd) / r2, (-rxd - txd) / r1) - Math.atan2((ryd - tyd) / r2, (rxd - txd) / r1);
	let dr = rad >= 0 ? rad : 2 * Math.PI + rad;
	if (sweepFlag === 0 && dr > 0) dr -= 2 * Math.PI;
	else if (sweepFlag !== 0 && dr < 0) dr += 2 * Math.PI;
	const sse = dr * 2 / Math.PI;
	const seg = Math.ceil(sse < 0 ? -1 * sse : sse);
	const segr = dr / seg;
	const t = 8 / 3 * Math.sin(segr / 4) * Math.sin(segr / 4) / Math.sin(segr / 2);
	const cpsir1 = cpsi * r1;
	const cpsir2 = cpsi * r2;
	const spsir1 = spsi * r1;
	const spsir2 = spsi * r2;
	let mc = Math.cos(s1);
	let ms = Math.sin(s1);
	let x2 = -t * (cpsir1 * ms + spsir2 * mc);
	let y2 = -t * (spsir1 * ms - cpsir2 * mc);
	let x3 = 0;
	let y3 = 0;
	const result = [];
	for (let n = 0; n < seg; n += 1) {
		s1 += segr;
		mc = Math.cos(s1);
		ms = Math.sin(s1);
		x3 = cpsir1 * mc - spsir2 * ms + tx;
		y3 = spsir1 * mc + cpsir2 * ms + ty;
		const dx = -t * (cpsir1 * ms + spsir2 * mc);
		const dy = -t * (spsir1 * ms - cpsir2 * mc);
		const index = n * 6;
		result[index] = Number(x2 + x0);
		result[index + 1] = Number(y2 + y0);
		result[index + 2] = Number(x3 - dx + x0);
		result[index + 3] = Number(y3 - dy + y0);
		result[index + 4] = Number(x3 + x0);
		result[index + 5] = Number(y3 + y0);
		x2 = x3 + dx;
		y2 = y3 + dy;
	}
	return result.map((num) => +num.toFixed(2));
}
function drawArc(startX, startY, rx, ry, xAxisRotation = 0, largeArcFlag = 0, sweepFlag = 0, stopX, stopY) {
	const data = [];
	const points = arcToCurves(startX, startY, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, stopX, stopY);
	if (points != null) for (let i = 0, ii = points.length; i < ii; i += 6) data.push("C", points[i], points[i + 1], points[i + 2], points[i + 3], points[i + 4], points[i + 5]);
	return data.join(" ");
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/polyline.js
var Polyline$1 = class Polyline$1 extends Geometry {
	get start() {
		return this.points[0] || null;
	}
	get end() {
		return this.points[this.points.length - 1] || null;
	}
	constructor(points) {
		super();
		if (points != null) {
			if (typeof points === "string") return Polyline$1.parse(points);
			this.points = points.map((p) => Point.create(p));
		} else this.points = [];
	}
	scale(sx, sy, origin = new Point()) {
		this.points.forEach((p) => p.scale(sx, sy, origin));
		return this;
	}
	rotate(angle, origin) {
		this.points.forEach((p) => p.rotate(angle, origin));
		return this;
	}
	translate(dx, dy) {
		const t = Point.create(dx, dy);
		this.points.forEach((p) => p.translate(t.x, t.y));
		return this;
	}
	round(precision = 0) {
		this.points.forEach((p) => p.round(precision));
		return this;
	}
	bbox() {
		if (this.points.length === 0) return new Rectangle();
		let x1 = Infinity;
		let x2 = -Infinity;
		let y1 = Infinity;
		let y2 = -Infinity;
		const points = this.points;
		for (let i = 0, ii = points.length; i < ii; i += 1) {
			const point = points[i];
			const x = point.x;
			const y = point.y;
			if (x < x1) x1 = x;
			if (x > x2) x2 = x;
			if (y < y1) y1 = y;
			if (y > y2) y2 = y;
		}
		return new Rectangle(x1, y1, x2 - x1, y2 - y1);
	}
	closestPoint(p) {
		const cpLength = this.closestPointLength(p);
		return this.pointAtLength(cpLength);
	}
	closestPointLength(p) {
		const points = this.points;
		const count = points.length;
		if (count === 0 || count === 1) return 0;
		let length = 0;
		let cpLength = 0;
		let minSqrDistance = Infinity;
		for (let i = 0, ii = count - 1; i < ii; i += 1) {
			const line = new Line(points[i], points[i + 1]);
			const lineLength = line.length();
			const cpNormalizedLength = line.closestPointNormalizedLength(p);
			const sqrDistance = line.pointAt(cpNormalizedLength).squaredDistance(p);
			if (sqrDistance < minSqrDistance) {
				minSqrDistance = sqrDistance;
				cpLength = length + cpNormalizedLength * lineLength;
			}
			length += lineLength;
		}
		return cpLength;
	}
	closestPointNormalizedLength(p) {
		const length = this.length();
		if (length === 0) return 0;
		return this.closestPointLength(p) / length;
	}
	closestPointTangent(p) {
		const cpLength = this.closestPointLength(p);
		return this.tangentAtLength(cpLength);
	}
	containsPoint(p) {
		if (this.points.length === 0) return false;
		const ref = Point.clone(p);
		const x = ref.x;
		const y = ref.y;
		const points = this.points;
		const count = points.length;
		let startIndex = count - 1;
		let intersectionCount = 0;
		for (let endIndex = 0; endIndex < count; endIndex += 1) {
			const start = points[startIndex];
			const end = points[endIndex];
			if (ref.equals(start)) return true;
			const segment = new Line(start, end);
			if (segment.containsPoint(p)) return true;
			if (y <= start.y && y > end.y || y > start.y && y <= end.y) {
				const xDifference = start.x - x > end.x - x ? start.x - x : end.x - x;
				if (xDifference >= 0) {
					const rayEnd = new Point(x + xDifference, y);
					const ray = new Line(p, rayEnd);
					if (segment.intersectsWithLine(ray)) intersectionCount += 1;
				}
			}
			startIndex = endIndex;
		}
		return intersectionCount % 2 === 1;
	}
	intersectsWithLine(line) {
		const intersections = [];
		for (let i = 0, n = this.points.length - 1; i < n; i += 1) {
			const a = this.points[i];
			const b = this.points[i + 1];
			const int = line.intersectsWithLine(new Line(a, b));
			if (int) intersections.push(int);
		}
		return intersections.length > 0 ? intersections : null;
	}
	isDifferentiable() {
		for (let i = 0, ii = this.points.length - 1; i < ii; i += 1) {
			const a = this.points[i];
			const b = this.points[i + 1];
			if (new Line(a, b).isDifferentiable()) return true;
		}
		return false;
	}
	length() {
		let len = 0;
		for (let i = 0, ii = this.points.length - 1; i < ii; i += 1) {
			const a = this.points[i];
			const b = this.points[i + 1];
			len += a.distance(b);
		}
		return len;
	}
	pointAt(ratio) {
		const points = this.points;
		const count = points.length;
		if (count === 0) return null;
		if (count === 1) return points[0].clone();
		if (ratio <= 0) return points[0].clone();
		if (ratio >= 1) return points[count - 1].clone();
		const length = this.length() * ratio;
		return this.pointAtLength(length);
	}
	pointAtLength(length) {
		const points = this.points;
		const count = points.length;
		if (count === 0) return null;
		if (count === 1) return points[0].clone();
		let fromStart = true;
		if (length < 0) {
			fromStart = false;
			length = -length;
		}
		let tmp = 0;
		for (let i = 0, ii = count - 1; i < ii; i += 1) {
			const index = fromStart ? i : ii - 1 - i;
			const a = points[index];
			const b = points[index + 1];
			const l = new Line(a, b);
			const d = a.distance(b);
			if (length <= tmp + d) return l.pointAtLength((fromStart ? 1 : -1) * (length - tmp));
			tmp += d;
		}
		return (fromStart ? points[count - 1] : points[0]).clone();
	}
	tangentAt(ratio) {
		const count = this.points.length;
		if (count === 0 || count === 1) return null;
		if (ratio < 0) ratio = 0;
		if (ratio > 1) ratio = 1;
		const length = this.length() * ratio;
		return this.tangentAtLength(length);
	}
	tangentAtLength(length) {
		const points = this.points;
		const count = points.length;
		if (count === 0 || count === 1) return null;
		let fromStart = true;
		if (length < 0) {
			fromStart = false;
			length = -length;
		}
		let lastValidLine;
		let tmp = 0;
		for (let i = 0, ii = count - 1; i < ii; i += 1) {
			const index = fromStart ? i : ii - 1 - i;
			const a = points[index];
			const b = points[index + 1];
			const l = new Line(a, b);
			const d = a.distance(b);
			if (l.isDifferentiable()) {
				if (length <= tmp + d) return l.tangentAtLength((fromStart ? 1 : -1) * (length - tmp));
				lastValidLine = l;
			}
			tmp += d;
		}
		if (lastValidLine) {
			const ratio = fromStart ? 1 : 0;
			return lastValidLine.tangentAt(ratio);
		}
		return null;
	}
	simplify(options = {}) {
		const points = this.points;
		if (points.length < 3) return this;
		const threshold = options.threshold || 0;
		let currentIndex = 0;
		while (points[currentIndex + 2]) {
			const firstIndex = currentIndex;
			const middleIndex = currentIndex + 1;
			const lastIndex = currentIndex + 2;
			const firstPoint = points[firstIndex];
			const middlePoint = points[middleIndex];
			const lastPoint = points[lastIndex];
			if (new Line(firstPoint, lastPoint).closestPoint(middlePoint).distance(middlePoint) <= threshold) points.splice(middleIndex, 1);
			else currentIndex += 1;
		}
		return this;
	}
	toHull() {
		const points = this.points;
		const count = points.length;
		if (count === 0) return new Polyline$1();
		let startPoint = points[0];
		for (let i = 1; i < count; i += 1) if (points[i].y < startPoint.y) startPoint = points[i];
		else if (points[i].y === startPoint.y && points[i].x > startPoint.x) startPoint = points[i];
		const sortedRecords = [];
		for (let i = 0; i < count; i += 1) {
			let angle = startPoint.theta(points[i]);
			if (angle === 0) angle = 360;
			sortedRecords.push([
				points[i],
				i,
				angle
			]);
		}
		sortedRecords.sort((record1, record2) => {
			let ret = record1[2] - record2[2];
			if (ret === 0) ret = record2[1] - record1[1];
			return ret;
		});
		if (sortedRecords.length > 2) {
			const startPoint = sortedRecords[sortedRecords.length - 1];
			sortedRecords.unshift(startPoint);
		}
		const insidePoints = {};
		const hullRecords = [];
		const getKey = (record) => `${record[0].toString()}@${record[1]}`;
		while (sortedRecords.length !== 0) {
			const currentRecord = sortedRecords.pop();
			const currentPoint = currentRecord[0];
			if (insidePoints[getKey(currentRecord)]) continue;
			let correctTurnFound = false;
			while (!correctTurnFound) if (hullRecords.length < 2) {
				hullRecords.push(currentRecord);
				correctTurnFound = true;
			} else {
				const lastHullRecord = hullRecords.pop();
				const lastHullPoint = lastHullRecord[0];
				const secondLastHullRecord = hullRecords.pop();
				const secondLastHullPoint = secondLastHullRecord[0];
				const crossProduct = secondLastHullPoint.cross(lastHullPoint, currentPoint);
				if (crossProduct < 0) {
					hullRecords.push(secondLastHullRecord);
					hullRecords.push(lastHullRecord);
					hullRecords.push(currentRecord);
					correctTurnFound = true;
				} else if (crossProduct === 0) {
					const THRESHOLD = 1e-10;
					const angleBetween = lastHullPoint.angleBetween(secondLastHullPoint, currentPoint);
					if (Math.abs(angleBetween - 180) < THRESHOLD) {
						insidePoints[getKey(lastHullRecord)] = lastHullPoint;
						hullRecords.push(secondLastHullRecord);
					} else if (lastHullPoint.equals(currentPoint) || secondLastHullPoint.equals(lastHullPoint)) {
						insidePoints[getKey(lastHullRecord)] = lastHullPoint;
						hullRecords.push(secondLastHullRecord);
					} else if (Math.abs((angleBetween + 1) % 360 - 1) < THRESHOLD) {
						hullRecords.push(secondLastHullRecord);
						sortedRecords.push(lastHullRecord);
					}
				} else {
					insidePoints[getKey(lastHullRecord)] = lastHullPoint;
					hullRecords.push(secondLastHullRecord);
				}
			}
		}
		if (hullRecords.length > 2) hullRecords.pop();
		let lowestHullIndex;
		let indexOfLowestHullIndexRecord = -1;
		for (let i = 0, n = hullRecords.length; i < n; i += 1) {
			const currentHullIndex = hullRecords[i][1];
			if (lowestHullIndex === void 0 || currentHullIndex < lowestHullIndex) {
				lowestHullIndex = currentHullIndex;
				indexOfLowestHullIndexRecord = i;
			}
		}
		let hullPointRecordsReordered = [];
		if (indexOfLowestHullIndexRecord > 0) {
			const newFirstChunk = hullRecords.slice(indexOfLowestHullIndexRecord);
			const newSecondChunk = hullRecords.slice(0, indexOfLowestHullIndexRecord);
			hullPointRecordsReordered = newFirstChunk.concat(newSecondChunk);
		} else hullPointRecordsReordered = hullRecords;
		const hullPoints = [];
		for (let i = 0, n = hullPointRecordsReordered.length; i < n; i += 1) hullPoints.push(hullPointRecordsReordered[i][0]);
		return new Polyline$1(hullPoints);
	}
	equals(p) {
		if (p == null) return false;
		if (p.points.length !== this.points.length) return false;
		return p.points.every((a, i) => a.equals(this.points[i]));
	}
	clone() {
		return new Polyline$1(this.points.map((p) => p.clone()));
	}
	toJSON() {
		return this.points.map((p) => p.toJSON());
	}
	serialize() {
		return this.points.map((p) => `${p.serialize()}`).join(" ");
	}
};
(function(Polyline) {
	function isPolyline(instance) {
		return instance != null && instance instanceof Polyline;
	}
	Polyline.isPolyline = isPolyline;
})(Polyline$1 || (Polyline$1 = {}));
(function(Polyline) {
	function parse(svgString) {
		const str = svgString.trim();
		if (str === "") return new Polyline();
		const points = [];
		const coords = str.split(/\s*,\s*|\s+/);
		for (let i = 0, ii = coords.length; i < ii; i += 2) points.push({
			x: +coords[i],
			y: +coords[i + 1]
		});
		return new Polyline(points);
	}
	Polyline.parse = parse;
})(Polyline$1 || (Polyline$1 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/curve.js
var Curve = class Curve extends Geometry {
	constructor(start, controlPoint1, controlPoint2, end) {
		super();
		this.PRECISION = 3;
		this.start = Point.create(start);
		this.controlPoint1 = Point.create(controlPoint1);
		this.controlPoint2 = Point.create(controlPoint2);
		this.end = Point.create(end);
	}
	bbox() {
		const start = this.start;
		const controlPoint1 = this.controlPoint1;
		const controlPoint2 = this.controlPoint2;
		const end = this.end;
		const x0 = start.x;
		const y0 = start.y;
		const x1 = controlPoint1.x;
		const y1 = controlPoint1.y;
		const x2 = controlPoint2.x;
		const y2 = controlPoint2.y;
		const x3 = end.x;
		const y3 = end.y;
		const points = [];
		const tvalues = [];
		const bounds = [[], []];
		let a;
		let b;
		let c;
		let t;
		let t1;
		let t2;
		let b2ac;
		let sqrtb2ac;
		for (let i = 0; i < 2; i += 1) {
			if (i === 0) {
				b = 6 * x0 - 12 * x1 + 6 * x2;
				a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
				c = 3 * x1 - 3 * x0;
			} else {
				b = 6 * y0 - 12 * y1 + 6 * y2;
				a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
				c = 3 * y1 - 3 * y0;
			}
			if (Math.abs(a) < 1e-12) {
				if (Math.abs(b) < 1e-12) continue;
				t = -c / b;
				if (t > 0 && t < 1) tvalues.push(t);
				continue;
			}
			b2ac = b * b - 4 * c * a;
			sqrtb2ac = Math.sqrt(b2ac);
			if (b2ac < 0) continue;
			t1 = (-b + sqrtb2ac) / (2 * a);
			if (t1 > 0 && t1 < 1) tvalues.push(t1);
			t2 = (-b - sqrtb2ac) / (2 * a);
			if (t2 > 0 && t2 < 1) tvalues.push(t2);
		}
		let x;
		let y;
		let mt;
		let j = tvalues.length;
		const jlen = j;
		while (j) {
			j -= 1;
			t = tvalues[j];
			mt = 1 - t;
			x = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
			bounds[0][j] = x;
			y = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
			bounds[1][j] = y;
			points[j] = {
				X: x,
				Y: y
			};
		}
		tvalues[jlen] = 0;
		tvalues[jlen + 1] = 1;
		points[jlen] = {
			X: x0,
			Y: y0
		};
		points[jlen + 1] = {
			X: x3,
			Y: y3
		};
		bounds[0][jlen] = x0;
		bounds[1][jlen] = y0;
		bounds[0][jlen + 1] = x3;
		bounds[1][jlen + 1] = y3;
		tvalues.length = jlen + 2;
		bounds[0].length = jlen + 2;
		bounds[1].length = jlen + 2;
		points.length = jlen + 2;
		const left = Math.min.apply(null, bounds[0]);
		const top = Math.min.apply(null, bounds[1]);
		const right = Math.max.apply(null, bounds[0]);
		const bottom = Math.max.apply(null, bounds[1]);
		return new Rectangle(left, top, right - left, bottom - top);
	}
	closestPoint(p, options = {}) {
		return this.pointAtT(this.closestPointT(p, options));
	}
	closestPointLength(p, options = {}) {
		const opts = this.getOptions(options);
		return this.lengthAtT(this.closestPointT(p, opts), opts);
	}
	closestPointNormalizedLength(p, options = {}) {
		const opts = this.getOptions(options);
		const cpLength = this.closestPointLength(p, opts);
		if (!cpLength) return 0;
		const length = this.length(opts);
		if (length === 0) return 0;
		return cpLength / length;
	}
	closestPointT(p, options = {}) {
		const precision = this.getPrecision(options);
		const subdivisions = this.getDivisions(options);
		const precisionRatio = Math.pow(10, -precision);
		let investigatedSubdivision = null;
		let investigatedSubdivisionStartT = 0;
		let investigatedSubdivisionEndT = 0;
		let distFromStart = 0;
		let distFromEnd = 0;
		let chordLength = 0;
		let minSumDist = null;
		const count = subdivisions.length;
		let piece = count > 0 ? 1 / count : 0;
		subdivisions.forEach((division, i) => {
			const startDist = division.start.distance(p);
			const endDist = division.end.distance(p);
			const sumDist = startDist + endDist;
			if (minSumDist == null || sumDist < minSumDist) {
				investigatedSubdivision = division;
				investigatedSubdivisionStartT = i * piece;
				investigatedSubdivisionEndT = (i + 1) * piece;
				distFromStart = startDist;
				distFromEnd = endDist;
				minSumDist = sumDist;
				chordLength = division.endpointDistance();
			}
		});
		while (true) {
			const startPrecisionRatio = distFromStart ? Math.abs(distFromStart - distFromEnd) / distFromStart : 0;
			const endPrecisionRatio = distFromEnd != null ? Math.abs(distFromStart - distFromEnd) / distFromEnd : 0;
			const hasRequiredPrecision = startPrecisionRatio < precisionRatio || endPrecisionRatio < precisionRatio;
			const hasMiniStartDistance = distFromStart ? distFromStart < chordLength * precisionRatio : true;
			const hasMiniEndDistance = distFromEnd ? distFromEnd < chordLength * precisionRatio : true;
			if (hasRequiredPrecision || hasMiniStartDistance || hasMiniEndDistance) return distFromStart <= distFromEnd ? investigatedSubdivisionStartT : investigatedSubdivisionEndT;
			const divided = investigatedSubdivision.divide(.5);
			piece /= 2;
			const startDist1 = divided[0].start.distance(p);
			const endDist1 = divided[0].end.distance(p);
			const sumDist1 = startDist1 + endDist1;
			const startDist2 = divided[1].start.distance(p);
			const endDist2 = divided[1].end.distance(p);
			if (sumDist1 <= startDist2 + endDist2) {
				investigatedSubdivision = divided[0];
				investigatedSubdivisionEndT -= piece;
				distFromStart = startDist1;
				distFromEnd = endDist1;
			} else {
				investigatedSubdivision = divided[1];
				investigatedSubdivisionStartT += piece;
				distFromStart = startDist2;
				distFromEnd = endDist2;
			}
		}
	}
	closestPointTangent(p, options = {}) {
		return this.tangentAtT(this.closestPointT(p, options));
	}
	containsPoint(p, options = {}) {
		return this.toPolyline(options).containsPoint(p);
	}
	divideAt(ratio, options = {}) {
		if (ratio <= 0) return this.divideAtT(0);
		if (ratio >= 1) return this.divideAtT(1);
		const t = this.tAt(ratio, options);
		return this.divideAtT(t);
	}
	divideAtLength(length, options = {}) {
		const t = this.tAtLength(length, options);
		return this.divideAtT(t);
	}
	divide(t) {
		return this.divideAtT(t);
	}
	divideAtT(t) {
		const start = this.start;
		const controlPoint1 = this.controlPoint1;
		const controlPoint2 = this.controlPoint2;
		const end = this.end;
		if (t <= 0) return [new Curve(start, start, start, start), new Curve(start, controlPoint1, controlPoint2, end)];
		if (t >= 1) return [new Curve(start, controlPoint1, controlPoint2, end), new Curve(end, end, end, end)];
		const dividerPoints = this.getSkeletonPoints(t);
		const startControl1 = dividerPoints.startControlPoint1;
		const startControl2 = dividerPoints.startControlPoint2;
		const divider = dividerPoints.divider;
		const dividerControl1 = dividerPoints.dividerControlPoint1;
		const dividerControl2 = dividerPoints.dividerControlPoint2;
		return [new Curve(start, startControl1, startControl2, divider), new Curve(divider, dividerControl1, dividerControl2, end)];
	}
	endpointDistance() {
		return this.start.distance(this.end);
	}
	getSkeletonPoints(t) {
		const start = this.start;
		const control1 = this.controlPoint1;
		const control2 = this.controlPoint2;
		const end = this.end;
		if (t <= 0) return {
			startControlPoint1: start.clone(),
			startControlPoint2: start.clone(),
			divider: start.clone(),
			dividerControlPoint1: control1.clone(),
			dividerControlPoint2: control2.clone()
		};
		if (t >= 1) return {
			startControlPoint1: control1.clone(),
			startControlPoint2: control2.clone(),
			divider: end.clone(),
			dividerControlPoint1: end.clone(),
			dividerControlPoint2: end.clone()
		};
		const midpoint1 = new Line(start, control1).pointAt(t);
		const midpoint2 = new Line(control1, control2).pointAt(t);
		const midpoint3 = new Line(control2, end).pointAt(t);
		const subControl1 = new Line(midpoint1, midpoint2).pointAt(t);
		const subControl2 = new Line(midpoint2, midpoint3).pointAt(t);
		return {
			startControlPoint1: midpoint1,
			startControlPoint2: subControl1,
			divider: new Line(subControl1, subControl2).pointAt(t),
			dividerControlPoint1: subControl2,
			dividerControlPoint2: midpoint3
		};
	}
	getSubdivisions(options = {}) {
		const precision = this.getPrecision(options);
		let subdivisions = [new Curve(this.start, this.controlPoint1, this.controlPoint2, this.end)];
		if (precision === 0) return subdivisions;
		let previousLength = this.endpointDistance();
		const precisionRatio = Math.pow(10, -precision);
		let iteration = 0;
		while (true) {
			iteration += 1;
			const divisions = [];
			subdivisions.forEach((c) => {
				const divided = c.divide(.5);
				divisions.push(divided[0], divided[1]);
			});
			const length = divisions.reduce((memo, c) => memo + c.endpointDistance(), 0);
			const ratio = length !== 0 ? (length - previousLength) / length : 0;
			if (iteration > 1 && ratio < precisionRatio) return divisions;
			subdivisions = divisions;
			previousLength = length;
		}
	}
	length(options = {}) {
		return this.getDivisions(options).reduce((memo, c) => {
			return memo + c.endpointDistance();
		}, 0);
	}
	lengthAtT(t, options = {}) {
		if (t <= 0) return 0;
		const precision = options.precision === void 0 ? this.PRECISION : options.precision;
		return this.divide(t)[0].length({ precision });
	}
	pointAt(ratio, options = {}) {
		if (ratio <= 0) return this.start.clone();
		if (ratio >= 1) return this.end.clone();
		const t = this.tAt(ratio, options);
		return this.pointAtT(t);
	}
	pointAtLength(length, options = {}) {
		const t = this.tAtLength(length, options);
		return this.pointAtT(t);
	}
	pointAtT(t) {
		if (t <= 0) return this.start.clone();
		if (t >= 1) return this.end.clone();
		return this.getSkeletonPoints(t).divider;
	}
	isDifferentiable() {
		const start = this.start;
		const control1 = this.controlPoint1;
		const control2 = this.controlPoint2;
		const end = this.end;
		return !(start.equals(control1) && control1.equals(control2) && control2.equals(end));
	}
	tangentAt(ratio, options = {}) {
		if (!this.isDifferentiable()) return null;
		if (ratio < 0) ratio = 0;
		else if (ratio > 1) ratio = 1;
		const t = this.tAt(ratio, options);
		return this.tangentAtT(t);
	}
	tangentAtLength(length, options = {}) {
		if (!this.isDifferentiable()) return null;
		const t = this.tAtLength(length, options);
		return this.tangentAtT(t);
	}
	tangentAtT(t) {
		if (!this.isDifferentiable()) return null;
		if (t < 0) t = 0;
		if (t > 1) t = 1;
		const skeletonPoints = this.getSkeletonPoints(t);
		const p1 = skeletonPoints.startControlPoint2;
		const p2 = skeletonPoints.dividerControlPoint1;
		const tangentStart = skeletonPoints.divider;
		const tangentLine = new Line(p1, p2);
		tangentLine.translate(tangentStart.x - p1.x, tangentStart.y - p1.y);
		return tangentLine;
	}
	getPrecision(options = {}) {
		return options.precision == null ? this.PRECISION : options.precision;
	}
	getDivisions(options = {}) {
		if (options.subdivisions != null) return options.subdivisions;
		const precision = this.getPrecision(options);
		return this.getSubdivisions({ precision });
	}
	getOptions(options = {}) {
		return {
			precision: this.getPrecision(options),
			subdivisions: this.getDivisions(options)
		};
	}
	tAt(ratio, options = {}) {
		if (ratio <= 0) return 0;
		if (ratio >= 1) return 1;
		const opts = this.getOptions(options);
		const length = this.length(opts) * ratio;
		return this.tAtLength(length, opts);
	}
	tAtLength(length, options = {}) {
		let fromStart = true;
		if (length < 0) {
			fromStart = false;
			length = -length;
		}
		const precision = this.getPrecision(options);
		const subdivisions = this.getDivisions(options);
		const opts = {
			precision,
			subdivisions
		};
		let investigatedSubdivision = null;
		let investigatedSubdivisionStartT;
		let investigatedSubdivisionEndT;
		let baselinePointDistFromStart = 0;
		let baselinePointDistFromEnd = 0;
		let memo = 0;
		const count = subdivisions.length;
		let piece = count > 0 ? 1 / count : 0;
		for (let i = 0; i < count; i += 1) {
			const index = fromStart ? i : count - 1 - i;
			const division = subdivisions[i];
			const dist = division.endpointDistance();
			if (length <= memo + dist) {
				investigatedSubdivision = division;
				investigatedSubdivisionStartT = index * piece;
				investigatedSubdivisionEndT = (index + 1) * piece;
				baselinePointDistFromStart = fromStart ? length - memo : dist + memo - length;
				baselinePointDistFromEnd = fromStart ? dist + memo - length : length - memo;
				break;
			}
			memo += dist;
		}
		if (investigatedSubdivision == null) return fromStart ? 1 : 0;
		const total = this.length(opts);
		const precisionRatio = Math.pow(10, -precision);
		while (true) {
			let ratio;
			ratio = total !== 0 ? baselinePointDistFromStart / total : 0;
			if (ratio < precisionRatio) return investigatedSubdivisionStartT;
			ratio = total !== 0 ? baselinePointDistFromEnd / total : 0;
			if (ratio < precisionRatio) return investigatedSubdivisionEndT;
			let newBaselinePointDistFromStart;
			let newBaselinePointDistFromEnd;
			const divided = investigatedSubdivision.divide(.5);
			piece /= 2;
			const baseline1Length = divided[0].endpointDistance();
			const baseline2Length = divided[1].endpointDistance();
			if (baselinePointDistFromStart <= baseline1Length) {
				investigatedSubdivision = divided[0];
				investigatedSubdivisionEndT -= piece;
				newBaselinePointDistFromStart = baselinePointDistFromStart;
				newBaselinePointDistFromEnd = baseline1Length - newBaselinePointDistFromStart;
			} else {
				investigatedSubdivision = divided[1];
				investigatedSubdivisionStartT += piece;
				newBaselinePointDistFromStart = baselinePointDistFromStart - baseline1Length;
				newBaselinePointDistFromEnd = baseline2Length - newBaselinePointDistFromStart;
			}
			baselinePointDistFromStart = newBaselinePointDistFromStart;
			baselinePointDistFromEnd = newBaselinePointDistFromEnd;
		}
	}
	toPoints(options = {}) {
		const subdivisions = this.getDivisions(options);
		const points = [subdivisions[0].start.clone()];
		subdivisions.forEach((c) => points.push(c.end.clone()));
		return points;
	}
	toPolyline(options = {}) {
		return new Polyline$1(this.toPoints(options));
	}
	scale(sx, sy, origin) {
		this.start.scale(sx, sy, origin);
		this.controlPoint1.scale(sx, sy, origin);
		this.controlPoint2.scale(sx, sy, origin);
		this.end.scale(sx, sy, origin);
		return this;
	}
	rotate(angle, origin) {
		this.start.rotate(angle, origin);
		this.controlPoint1.rotate(angle, origin);
		this.controlPoint2.rotate(angle, origin);
		this.end.rotate(angle, origin);
		return this;
	}
	translate(tx, ty) {
		if (typeof tx === "number") {
			this.start.translate(tx, ty);
			this.controlPoint1.translate(tx, ty);
			this.controlPoint2.translate(tx, ty);
			this.end.translate(tx, ty);
		} else {
			this.start.translate(tx);
			this.controlPoint1.translate(tx);
			this.controlPoint2.translate(tx);
			this.end.translate(tx);
		}
		return this;
	}
	equals(c) {
		return c != null && this.start.equals(c.start) && this.controlPoint1.equals(c.controlPoint1) && this.controlPoint2.equals(c.controlPoint2) && this.end.equals(c.end);
	}
	clone() {
		return new Curve(this.start, this.controlPoint1, this.controlPoint2, this.end);
	}
	toJSON() {
		return {
			start: this.start.toJSON(),
			controlPoint1: this.controlPoint1.toJSON(),
			controlPoint2: this.controlPoint2.toJSON(),
			end: this.end.toJSON()
		};
	}
	serialize() {
		return [
			this.start.serialize(),
			this.controlPoint1.serialize(),
			this.controlPoint2.serialize(),
			this.end.serialize()
		].join(" ");
	}
};
(function(Curve) {
	function isCurve(instance) {
		return instance != null && instance instanceof Curve;
	}
	Curve.isCurve = isCurve;
})(Curve || (Curve = {}));
(function(Curve) {
	function getFirstControlPoints(rhs) {
		const n = rhs.length;
		const x = [];
		const tmp = [];
		let b = 2;
		x[0] = rhs[0] / b;
		for (let i = 1; i < n; i += 1) {
			tmp[i] = 1 / b;
			b = (i < n - 1 ? 4 : 3.5) - tmp[i];
			x[i] = (rhs[i] - x[i - 1]) / b;
		}
		for (let i = 1; i < n; i += 1) x[n - i - 1] -= tmp[n - i] * x[n - i];
		return x;
	}
	function getCurveControlPoints(points) {
		const knots = points.map((p) => Point.clone(p));
		const firstControlPoints = [];
		const secondControlPoints = [];
		const n = knots.length - 1;
		if (n === 1) {
			firstControlPoints[0] = new Point((2 * knots[0].x + knots[1].x) / 3, (2 * knots[0].y + knots[1].y) / 3);
			secondControlPoints[0] = new Point(2 * firstControlPoints[0].x - knots[0].x, 2 * firstControlPoints[0].y - knots[0].y);
			return [firstControlPoints, secondControlPoints];
		}
		const rhs = [];
		for (let i = 1; i < n - 1; i += 1) rhs[i] = 4 * knots[i].x + 2 * knots[i + 1].x;
		rhs[0] = knots[0].x + 2 * knots[1].x;
		rhs[n - 1] = (8 * knots[n - 1].x + knots[n].x) / 2;
		const x = getFirstControlPoints(rhs);
		for (let i = 1; i < n - 1; i += 1) rhs[i] = 4 * knots[i].y + 2 * knots[i + 1].y;
		rhs[0] = knots[0].y + 2 * knots[1].y;
		rhs[n - 1] = (8 * knots[n - 1].y + knots[n].y) / 2;
		const y = getFirstControlPoints(rhs);
		for (let i = 0; i < n; i += 1) {
			firstControlPoints.push(new Point(x[i], y[i]));
			if (i < n - 1) secondControlPoints.push(new Point(2 * knots[i + 1].x - x[i + 1], 2 * knots[i + 1].y - y[i + 1]));
			else secondControlPoints.push(new Point((knots[n].x + x[n - 1]) / 2, (knots[n].y + y[n - 1]) / 2));
		}
		return [firstControlPoints, secondControlPoints];
	}
	function throughPoints(points) {
		if (points == null || Array.isArray(points) && points.length < 2) throw new Error("At least 2 points are required");
		const controlPoints = getCurveControlPoints(points);
		const curves = [];
		for (let i = 0, ii = controlPoints[0].length; i < ii; i += 1) {
			const controlPoint1 = new Point(controlPoints[0][i].x, controlPoints[0][i].y);
			const controlPoint2 = new Point(controlPoints[1][i].x, controlPoints[1][i].y);
			curves.push(new Curve(points[i], controlPoint1, controlPoint2, points[i + 1]));
		}
		return curves;
	}
	Curve.throughPoints = throughPoints;
})(Curve || (Curve = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/path/segment.js
var Segment = class extends Geometry {
	constructor() {
		super(...arguments);
		this.isVisible = true;
		this.isSegment = true;
		this.isSubpathStart = false;
	}
	get end() {
		return this.endPoint;
	}
	get start() {
		if (this.previousSegment == null) throw new Error("Missing previous segment. (This segment cannot be the first segment of a path, or segment has not yet been added to a path.)");
		return this.previousSegment.end;
	}
	closestPointT(p, options) {
		if (this.closestPointNormalizedLength) return this.closestPointNormalizedLength(p);
		throw new Error("Neither `closestPointT` nor `closestPointNormalizedLength` method is implemented.");
	}
	lengthAtT(t, options) {
		if (t <= 0) return 0;
		const length = this.length();
		if (t >= 1) return length;
		return length * t;
	}
	divideAtT(t) {
		if (this.divideAt) return this.divideAt(t);
		throw new Error("Neither `divideAtT` nor `divideAt` method is implemented.");
	}
	pointAtT(t) {
		if (this.pointAt) return this.pointAt(t);
		throw new Error("Neither `pointAtT` nor `pointAt` method is implemented.");
	}
	tangentAtT(t) {
		if (this.tangentAt) return this.tangentAt(t);
		throw new Error("Neither `tangentAtT` nor `tangentAt` method is implemented.");
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/path/lineto.js
var LineTo = class LineTo extends Segment {
	constructor(x, y) {
		super();
		if (Line.isLine(x)) this.endPoint = x.end.clone().round(2);
		else this.endPoint = Point.create(x, y).round(2);
	}
	get type() {
		return "L";
	}
	get line() {
		return new Line(this.start, this.end);
	}
	bbox() {
		return this.line.bbox();
	}
	closestPoint(p) {
		return this.line.closestPoint(p);
	}
	closestPointLength(p) {
		return this.line.closestPointLength(p);
	}
	closestPointNormalizedLength(p) {
		return this.line.closestPointNormalizedLength(p);
	}
	closestPointTangent(p) {
		return this.line.closestPointTangent(p);
	}
	length() {
		return this.line.length();
	}
	divideAt(ratio) {
		const divided = this.line.divideAt(ratio);
		return [new LineTo(divided[0]), new LineTo(divided[1])];
	}
	divideAtLength(length) {
		const divided = this.line.divideAtLength(length);
		return [new LineTo(divided[0]), new LineTo(divided[1])];
	}
	getSubdivisions() {
		return [];
	}
	pointAt(ratio) {
		return this.line.pointAt(ratio);
	}
	pointAtLength(length) {
		return this.line.pointAtLength(length);
	}
	tangentAt(ratio) {
		return this.line.tangentAt(ratio);
	}
	tangentAtLength(length) {
		return this.line.tangentAtLength(length);
	}
	isDifferentiable() {
		if (this.previousSegment == null) return false;
		return !this.start.equals(this.end);
	}
	clone() {
		return new LineTo(this.end);
	}
	scale(sx, sy, origin) {
		this.end.scale(sx, sy, origin);
		return this;
	}
	rotate(angle, origin) {
		this.end.rotate(angle, origin);
		return this;
	}
	translate(tx, ty) {
		if (typeof tx === "number") this.end.translate(tx, ty);
		else this.end.translate(tx);
		return this;
	}
	equals(s) {
		return this.type === s.type && this.start.equals(s.start) && this.end.equals(s.end);
	}
	toJSON() {
		return {
			type: this.type,
			start: this.start.toJSON(),
			end: this.end.toJSON()
		};
	}
	serialize() {
		const end = this.end;
		return `${this.type} ${end.x} ${end.y}`;
	}
};
(function(LineTo) {
	function create(...args) {
		const len = args.length;
		const arg0 = args[0];
		if (Line.isLine(arg0)) return new LineTo(arg0);
		if (Point.isPointLike(arg0)) {
			if (len === 1) return new LineTo(arg0);
			return args.map((arg) => new LineTo(arg));
		}
		if (len === 2) return new LineTo(+args[0], +args[1]);
		const segments = [];
		for (let i = 0; i < len; i += 2) {
			const x = +args[i];
			const y = +args[i + 1];
			segments.push(new LineTo(x, y));
		}
		return segments;
	}
	LineTo.create = create;
})(LineTo || (LineTo = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/path/close.js
var Close = class Close extends Segment {
	get end() {
		if (!this.subpathStartSegment) throw new Error("Missing subpath start segment. (This segment needs a subpath start segment (e.g. MoveTo), or segment has not yet been added to a path.)");
		return this.subpathStartSegment.end;
	}
	get type() {
		return "Z";
	}
	get line() {
		return new Line(this.start, this.end);
	}
	bbox() {
		return this.line.bbox();
	}
	closestPoint(p) {
		return this.line.closestPoint(p);
	}
	closestPointLength(p) {
		return this.line.closestPointLength(p);
	}
	closestPointNormalizedLength(p) {
		return this.line.closestPointNormalizedLength(p);
	}
	closestPointTangent(p) {
		return this.line.closestPointTangent(p);
	}
	length() {
		return this.line.length();
	}
	divideAt(ratio) {
		const divided = this.line.divideAt(ratio);
		return [divided[1].isDifferentiable() ? new LineTo(divided[0]) : this.clone(), new LineTo(divided[1])];
	}
	divideAtLength(length) {
		const divided = this.line.divideAtLength(length);
		return [divided[1].isDifferentiable() ? new LineTo(divided[0]) : this.clone(), new LineTo(divided[1])];
	}
	getSubdivisions() {
		return [];
	}
	pointAt(ratio) {
		return this.line.pointAt(ratio);
	}
	pointAtLength(length) {
		return this.line.pointAtLength(length);
	}
	tangentAt(ratio) {
		return this.line.tangentAt(ratio);
	}
	tangentAtLength(length) {
		return this.line.tangentAtLength(length);
	}
	isDifferentiable() {
		if (!this.previousSegment || !this.subpathStartSegment) return false;
		return !this.start.equals(this.end);
	}
	scale() {
		return this;
	}
	rotate() {
		return this;
	}
	translate() {
		return this;
	}
	equals(s) {
		return this.type === s.type && this.start.equals(s.start) && this.end.equals(s.end);
	}
	clone() {
		return new Close();
	}
	toJSON() {
		return {
			type: this.type,
			start: this.start.toJSON(),
			end: this.end.toJSON()
		};
	}
	serialize() {
		return this.type;
	}
};
(function(Close) {
	function create() {
		return new Close();
	}
	Close.create = create;
})(Close || (Close = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/path/moveto.js
var MoveTo = class MoveTo extends Segment {
	constructor(x, y) {
		super();
		this.isVisible = false;
		this.isSubpathStart = true;
		if (Line.isLine(x) || Curve.isCurve(x)) this.endPoint = x.end.clone().round(2);
		else this.endPoint = Point.create(x, y).round(2);
	}
	get start() {
		throw new Error("Illegal access. Moveto segments should not need a start property.");
	}
	get type() {
		return "M";
	}
	bbox() {
		return null;
	}
	closestPoint() {
		return this.end.clone();
	}
	closestPointLength() {
		return 0;
	}
	closestPointNormalizedLength() {
		return 0;
	}
	closestPointT() {
		return 1;
	}
	closestPointTangent() {
		return null;
	}
	length() {
		return 0;
	}
	lengthAtT() {
		return 0;
	}
	divideAt() {
		return [this.clone(), this.clone()];
	}
	divideAtLength() {
		return [this.clone(), this.clone()];
	}
	getSubdivisions() {
		return [];
	}
	pointAt() {
		return this.end.clone();
	}
	pointAtLength() {
		return this.end.clone();
	}
	pointAtT() {
		return this.end.clone();
	}
	tangentAt() {
		return null;
	}
	tangentAtLength() {
		return null;
	}
	tangentAtT() {
		return null;
	}
	isDifferentiable() {
		return false;
	}
	scale(sx, sy, origin) {
		this.end.scale(sx, sy, origin);
		return this;
	}
	rotate(angle, origin) {
		this.end.rotate(angle, origin);
		return this;
	}
	translate(tx, ty) {
		if (typeof tx === "number") this.end.translate(tx, ty);
		else this.end.translate(tx);
		return this;
	}
	clone() {
		return new MoveTo(this.end);
	}
	equals(s) {
		return this.type === s.type && this.end.equals(s.end);
	}
	toJSON() {
		return {
			type: this.type,
			end: this.end.toJSON()
		};
	}
	serialize() {
		const end = this.end;
		return `${this.type} ${end.x} ${end.y}`;
	}
};
(function(MoveTo) {
	function create(...args) {
		const len = args.length;
		const arg0 = args[0];
		if (Line.isLine(arg0)) return new MoveTo(arg0);
		if (Curve.isCurve(arg0)) return new MoveTo(arg0);
		if (Point.isPointLike(arg0)) {
			if (len === 1) return new MoveTo(arg0);
			const segments = [];
			for (let i = 0; i < len; i += 1) if (i === 0) segments.push(new MoveTo(args[i]));
			else segments.push(new LineTo(args[i]));
			return segments;
		}
		if (len === 2) return new MoveTo(+args[0], +args[1]);
		const segments = [];
		for (let i = 0; i < len; i += 2) {
			const x = +args[i];
			const y = +args[i + 1];
			if (i === 0) segments.push(new MoveTo(x, y));
			else segments.push(new LineTo(x, y));
		}
		return segments;
	}
	MoveTo.create = create;
})(MoveTo || (MoveTo = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/path/curveto.js
var CurveTo = class CurveTo extends Segment {
	constructor(arg0, arg1, arg2, arg3, arg4, arg5) {
		super();
		if (Curve.isCurve(arg0)) {
			this.controlPoint1 = arg0.controlPoint1.clone().round(2);
			this.controlPoint2 = arg0.controlPoint2.clone().round(2);
			this.endPoint = arg0.end.clone().round(2);
		} else if (typeof arg0 === "number") {
			this.controlPoint1 = new Point(arg0, arg1).round(2);
			this.controlPoint2 = new Point(arg2, arg3).round(2);
			this.endPoint = new Point(arg4, arg5).round(2);
		} else {
			this.controlPoint1 = Point.create(arg0).round(2);
			this.controlPoint2 = Point.create(arg1).round(2);
			this.endPoint = Point.create(arg2).round(2);
		}
	}
	get type() {
		return "C";
	}
	get curve() {
		return new Curve(this.start, this.controlPoint1, this.controlPoint2, this.end);
	}
	bbox() {
		return this.curve.bbox();
	}
	closestPoint(p) {
		return this.curve.closestPoint(p);
	}
	closestPointLength(p) {
		return this.curve.closestPointLength(p);
	}
	closestPointNormalizedLength(p) {
		return this.curve.closestPointNormalizedLength(p);
	}
	closestPointTangent(p) {
		return this.curve.closestPointTangent(p);
	}
	length() {
		return this.curve.length();
	}
	divideAt(ratio, options = {}) {
		const divided = this.curve.divideAt(ratio, options);
		return [new CurveTo(divided[0]), new CurveTo(divided[1])];
	}
	divideAtLength(length, options = {}) {
		const divided = this.curve.divideAtLength(length, options);
		return [new CurveTo(divided[0]), new CurveTo(divided[1])];
	}
	divideAtT(t) {
		const divided = this.curve.divideAtT(t);
		return [new CurveTo(divided[0]), new CurveTo(divided[1])];
	}
	getSubdivisions() {
		return [];
	}
	pointAt(ratio) {
		return this.curve.pointAt(ratio);
	}
	pointAtLength(length) {
		return this.curve.pointAtLength(length);
	}
	tangentAt(ratio) {
		return this.curve.tangentAt(ratio);
	}
	tangentAtLength(length) {
		return this.curve.tangentAtLength(length);
	}
	isDifferentiable() {
		if (!this.previousSegment) return false;
		const start = this.start;
		const control1 = this.controlPoint1;
		const control2 = this.controlPoint2;
		const end = this.end;
		return !(start.equals(control1) && control1.equals(control2) && control2.equals(end));
	}
	scale(sx, sy, origin) {
		this.controlPoint1.scale(sx, sy, origin);
		this.controlPoint2.scale(sx, sy, origin);
		this.end.scale(sx, sy, origin);
		return this;
	}
	rotate(angle, origin) {
		this.controlPoint1.rotate(angle, origin);
		this.controlPoint2.rotate(angle, origin);
		this.end.rotate(angle, origin);
		return this;
	}
	translate(tx, ty) {
		if (typeof tx === "number") {
			this.controlPoint1.translate(tx, ty);
			this.controlPoint2.translate(tx, ty);
			this.end.translate(tx, ty);
		} else {
			this.controlPoint1.translate(tx);
			this.controlPoint2.translate(tx);
			this.end.translate(tx);
		}
		return this;
	}
	equals(s) {
		return this.start.equals(s.start) && this.end.equals(s.end) && this.controlPoint1.equals(s.controlPoint1) && this.controlPoint2.equals(s.controlPoint2);
	}
	clone() {
		return new CurveTo(this.controlPoint1, this.controlPoint2, this.end);
	}
	toJSON() {
		return {
			type: this.type,
			start: this.start.toJSON(),
			controlPoint1: this.controlPoint1.toJSON(),
			controlPoint2: this.controlPoint2.toJSON(),
			end: this.end.toJSON()
		};
	}
	serialize() {
		const c1 = this.controlPoint1;
		const c2 = this.controlPoint2;
		const end = this.end;
		return [
			this.type,
			c1.x,
			c1.y,
			c2.x,
			c2.y,
			end.x,
			end.y
		].join(" ");
	}
};
(function(CurveTo) {
	function create(...args) {
		const len = args.length;
		const arg0 = args[0];
		if (Curve.isCurve(arg0)) return new CurveTo(arg0);
		if (Point.isPointLike(arg0)) {
			if (len === 3) return new CurveTo(args[0], args[1], args[2]);
			const segments = [];
			for (let i = 0; i < len; i += 3) segments.push(new CurveTo(args[i], args[i + 1], args[i + 2]));
			return segments;
		}
		if (len === 6) return new CurveTo(args[0], args[1], args[2], args[3], args[4], args[5]);
		const segments = [];
		for (let i = 0; i < len; i += 6) segments.push(new CurveTo(args[i], args[i + 1], args[i + 2], args[i + 3], args[i + 4], args[i + 5]));
		return segments;
	}
	CurveTo.create = create;
})(CurveTo || (CurveTo = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/path/normalize.js
function rotate(x, y, rad) {
	return {
		x: x * Math.cos(rad) - y * Math.sin(rad),
		y: x * Math.sin(rad) + y * Math.cos(rad)
	};
}
function q2c(x1, y1, ax, ay, x2, y2) {
	const v13 = 1 / 3;
	const v23 = 2 / 3;
	return [
		v13 * x1 + v23 * ax,
		v13 * y1 + v23 * ay,
		v13 * x2 + v23 * ax,
		v13 * y2 + v23 * ay,
		x2,
		y2
	];
}
function a2c(x1, y1, rx, ry, angle, largeArcFlag, sweepFlag, x2, y2, recursive) {
	const v120 = Math.PI * 120 / 180;
	const rad = Math.PI / 180 * (+angle || 0);
	let res = [];
	let xy;
	let f1;
	let f2;
	let cx;
	let cy;
	if (!recursive) {
		xy = rotate(x1, y1, -rad);
		x1 = xy.x;
		y1 = xy.y;
		xy = rotate(x2, y2, -rad);
		x2 = xy.x;
		y2 = xy.y;
		const x = (x1 - x2) / 2;
		const y = (y1 - y2) / 2;
		let h = x * x / (rx * rx) + y * y / (ry * ry);
		if (h > 1) {
			h = Math.sqrt(h);
			rx = h * rx;
			ry = h * ry;
		}
		const rx2 = rx * rx;
		const ry2 = ry * ry;
		const k = (largeArcFlag === sweepFlag ? -1 : 1) * Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x)));
		cx = k * rx * y / ry + (x1 + x2) / 2;
		cy = k * -ry * x / rx + (y1 + y2) / 2;
		f1 = Math.asin((y1 - cy) / ry);
		f2 = Math.asin((y2 - cy) / ry);
		f1 = x1 < cx ? Math.PI - f1 : f1;
		f2 = x2 < cx ? Math.PI - f2 : f2;
		if (f1 < 0) f1 = Math.PI * 2 + f1;
		if (f2 < 0) f2 = Math.PI * 2 + f2;
		if (sweepFlag && f1 > f2) f1 -= Math.PI * 2;
		if (!sweepFlag && f2 > f1) f2 -= Math.PI * 2;
	} else {
		f1 = recursive[0];
		f2 = recursive[1];
		cx = recursive[2];
		cy = recursive[3];
	}
	let df = f2 - f1;
	if (Math.abs(df) > v120) {
		const f2old = f2;
		const x2old = x2;
		const y2old = y2;
		f2 = f1 + v120 * (sweepFlag && f2 > f1 ? 1 : -1);
		x2 = cx + rx * Math.cos(f2);
		y2 = cy + ry * Math.sin(f2);
		res = a2c(x2, y2, rx, ry, angle, 0, sweepFlag, x2old, y2old, [
			f2,
			f2old,
			cx,
			cy
		]);
	}
	df = f2 - f1;
	const c1 = Math.cos(f1);
	const s1 = Math.sin(f1);
	const c2 = Math.cos(f2);
	const s2 = Math.sin(f2);
	const t = Math.tan(df / 4);
	const hx = 4 / 3 * (rx * t);
	const hy = 4 / 3 * (ry * t);
	const m1 = [x1, y1];
	const m2 = [x1 + hx * s1, y1 - hy * c1];
	const m3 = [x2 + hx * s2, y2 - hy * c2];
	const m4 = [x2, y2];
	m2[0] = 2 * m1[0] - m2[0];
	m2[1] = 2 * m1[1] - m2[1];
	if (recursive) return [
		m2,
		m3,
		m4
	].concat(res);
	{
		res = [
			m2,
			m3,
			m4
		].concat(res).join().split(",");
		const newres = [];
		const ii = res.length;
		for (let i = 0; i < ii; i += 1) newres[i] = i % 2 ? rotate(+res[i - 1], +res[i], rad).y : rotate(+res[i], +res[i + 1], rad).x;
		return newres;
	}
}
function parse(pathData) {
	if (!pathData) return null;
	const spaces = "	\n\v\f\r \xA0 ᠎             　\u2028\u2029";
	const segmentReg = new RegExp(`([a-z])[${spaces},]*((-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?[${spaces}]*,?[${spaces}]*)+)`, "ig");
	const commandParamReg = new RegExp(`(-?\\d*\\.?\\d*(?:e[\\-+]?\\d+)?)[${spaces}]*,?[${spaces}]*`, "ig");
	const paramsCount = {
		a: 7,
		c: 6,
		h: 1,
		l: 2,
		m: 2,
		q: 4,
		s: 4,
		t: 2,
		v: 1,
		z: 0
	};
	const segmetns = [];
	pathData.replace(segmentReg, (input, cmd, args) => {
		const params = [];
		let command = cmd.toLowerCase();
		args.replace(commandParamReg, (a, b) => {
			if (b) params.push(+b);
			return a;
		});
		if (command === "m" && params.length > 2) {
			segmetns.push([cmd, ...params.splice(0, 2)]);
			command = "l";
			cmd = cmd === "m" ? "l" : "L";
		}
		const count = paramsCount[command];
		while (params.length >= count) {
			segmetns.push([cmd, ...params.splice(0, count)]);
			if (!count) break;
		}
		return input;
	});
	return segmetns;
}
function abs(pathString) {
	const pathArray = parse(pathString);
	if (!pathArray || !pathArray.length) return [[
		"M",
		0,
		0
	]];
	let x = 0;
	let y = 0;
	let mx = 0;
	let my = 0;
	const segments = [];
	for (let i = 0, ii = pathArray.length; i < ii; i += 1) {
		const r = [];
		segments.push(r);
		const segment = pathArray[i];
		const command = segment[0];
		if (command !== command.toUpperCase()) {
			r[0] = command.toUpperCase();
			switch (r[0]) {
				case "A":
					r[1] = segment[1];
					r[2] = segment[2];
					r[3] = segment[3];
					r[4] = segment[4];
					r[5] = segment[5];
					r[6] = +segment[6] + x;
					r[7] = +segment[7] + y;
					break;
				case "V":
					r[1] = +segment[1] + y;
					break;
				case "H":
					r[1] = +segment[1] + x;
					break;
				case "M":
					mx = +segment[1] + x;
					my = +segment[2] + y;
					for (let j = 1, jj = segment.length; j < jj; j += 1) r[j] = +segment[j] + (j % 2 ? x : y);
					break;
				default: for (let j = 1, jj = segment.length; j < jj; j += 1) r[j] = +segment[j] + (j % 2 ? x : y);
			}
		} else for (let j = 0, jj = segment.length; j < jj; j += 1) r[j] = segment[j];
		switch (r[0]) {
			case "Z":
				x = +mx;
				y = +my;
				break;
			case "H":
				x = r[1];
				break;
			case "V":
				y = r[1];
				break;
			case "M":
				mx = r[r.length - 2];
				my = r[r.length - 1];
				x = r[r.length - 2];
				y = r[r.length - 1];
				break;
			default:
				x = r[r.length - 2];
				y = r[r.length - 1];
		}
	}
	return segments;
}
function normalize$1(path) {
	const pathArray = abs(path);
	const attrs = {
		x: 0,
		y: 0,
		bx: 0,
		by: 0,
		X: 0,
		Y: 0,
		qx: null,
		qy: null
	};
	function processPath(path, d, pcom) {
		let nx;
		let ny;
		if (!path) return [
			"C",
			d.x,
			d.y,
			d.x,
			d.y,
			d.x,
			d.y
		];
		if (!(path[0] in {
			T: 1,
			Q: 1
		})) {
			d.qx = null;
			d.qy = null;
		}
		switch (path[0]) {
			case "M":
				d.X = path[1];
				d.Y = path[2];
				break;
			case "A":
				if (parseFloat(path[1]) === 0 || parseFloat(path[2]) === 0) return [
					"L",
					path[6],
					path[7]
				];
				return ["C"].concat(a2c.apply(0, [d.x, d.y].concat(path.slice(1))));
			case "S":
				if (pcom === "C" || pcom === "S") {
					nx = d.x * 2 - d.bx;
					ny = d.y * 2 - d.by;
				} else {
					nx = d.x;
					ny = d.y;
				}
				return [
					"C",
					nx,
					ny
				].concat(path.slice(1));
			case "T":
				if (pcom === "Q" || pcom === "T") {
					d.qx = d.x * 2 - d.qx;
					d.qy = d.y * 2 - d.qy;
				} else {
					d.qx = d.x;
					d.qy = d.y;
				}
				return ["C"].concat(q2c(d.x, d.y, d.qx, d.qy, path[1], path[2]));
			case "Q":
				d.qx = path[1];
				d.qy = path[2];
				return ["C"].concat(q2c(d.x, d.y, path[1], path[2], path[3], path[4]));
			case "H": return ["L"].concat(path[1], d.y);
			case "V": return ["L"].concat(d.x, path[1]);
		}
		return path;
	}
	function fixArc(pp, i) {
		if (pp[i].length > 7) {
			pp[i].shift();
			const pi = pp[i];
			while (pi.length) {
				commands[i] = "A";
				i += 1;
				pp.splice(i, 0, ["C"].concat(pi.splice(0, 6)));
			}
			pp.splice(i, 1);
			ii = pathArray.length;
		}
	}
	const commands = [];
	let prevCommand = "";
	let ii = pathArray.length;
	for (let i = 0; i < ii; i += 1) {
		let command = "";
		if (pathArray[i]) command = pathArray[i][0];
		if (command !== "C") {
			commands[i] = command;
			if (i > 0) prevCommand = commands[i - 1];
		}
		pathArray[i] = processPath(pathArray[i], attrs, prevCommand);
		if (commands[i] !== "A" && command === "C") commands[i] = "C";
		fixArc(pathArray, i);
		const seg = pathArray[i];
		const seglen = seg.length;
		attrs.x = seg[seglen - 2];
		attrs.y = seg[seglen - 1];
		attrs.bx = parseFloat(seg[seglen - 4]) || attrs.x;
		attrs.by = parseFloat(seg[seglen - 3]) || attrs.y;
	}
	if (!pathArray[0][0] || pathArray[0][0] !== "M") pathArray.unshift([
		"M",
		0,
		0
	]);
	return pathArray;
}
/**
* Converts provided SVG path data string into a normalized path data string.
*
* The normalization uses a restricted subset of path commands; all segments
* are translated into lineto, curveto, moveto, and closepath segments.
*
* Relative path commands are changed into their absolute counterparts,
* and chaining of coordinates is disallowed.
*
* The function will always return a valid path data string; if an input
* string cannot be normalized, 'M 0 0' is returned.
*/
function normalizePathData(pathData) {
	return normalize$1(pathData).map((segment) => segment.map((item) => typeof item === "string" ? item : GeometryUtil.round(item, 2))).join(",").split(",").join(" ");
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-geometry@2.0.5/node_modules/@antv/x6-geometry/es/path/path.js
var Path$1 = class Path$1 extends Geometry {
	constructor(args) {
		super();
		this.PRECISION = 3;
		this.segments = [];
		if (Array.isArray(args)) if (Line.isLine(args[0]) || Curve.isCurve(args[0])) {
			let previousObj = null;
			args.forEach((o, i) => {
				if (i === 0) this.appendSegment(Path$1.createSegment("M", o.start));
				if (previousObj != null && !previousObj.end.equals(o.start)) this.appendSegment(Path$1.createSegment("M", o.start));
				if (Line.isLine(o)) this.appendSegment(Path$1.createSegment("L", o.end));
				else if (Curve.isCurve(o)) this.appendSegment(Path$1.createSegment("C", o.controlPoint1, o.controlPoint2, o.end));
				previousObj = o;
			});
		} else args.forEach((s) => {
			if (s.isSegment) this.appendSegment(s);
		});
		else if (args != null) {
			if (Line.isLine(args)) {
				this.appendSegment(Path$1.createSegment("M", args.start));
				this.appendSegment(Path$1.createSegment("L", args.end));
			} else if (Curve.isCurve(args)) {
				this.appendSegment(Path$1.createSegment("M", args.start));
				this.appendSegment(Path$1.createSegment("C", args.controlPoint1, args.controlPoint2, args.end));
			} else if (Polyline$1.isPolyline(args)) {
				if (args.points && args.points.length) args.points.forEach((point, index) => {
					const segment = index === 0 ? Path$1.createSegment("M", point) : Path$1.createSegment("L", point);
					this.appendSegment(segment);
				});
			} else if (args.isSegment) this.appendSegment(args);
		}
	}
	get start() {
		const segments = this.segments;
		const count = segments.length;
		if (count === 0) return null;
		for (let i = 0; i < count; i += 1) {
			const segment = segments[i];
			if (segment.isVisible) return segment.start;
		}
		return segments[count - 1].end;
	}
	get end() {
		const segments = this.segments;
		const count = segments.length;
		if (count === 0) return null;
		for (let i = count - 1; i >= 0; i -= 1) {
			const segment = segments[i];
			if (segment.isVisible) return segment.end;
		}
		return segments[count - 1].end;
	}
	moveTo(...args) {
		return this.appendSegment(MoveTo.create.call(null, ...args));
	}
	lineTo(...args) {
		return this.appendSegment(LineTo.create.call(null, ...args));
	}
	curveTo(...args) {
		return this.appendSegment(CurveTo.create.call(null, ...args));
	}
	arcTo(rx, ry, xAxisRotation, largeArcFlag, sweepFlag, endX, endY) {
		const start = this.end || new Point();
		const points = typeof endX === "number" ? arcToCurves(start.x, start.y, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, endX, endY) : arcToCurves(start.x, start.y, rx, ry, xAxisRotation, largeArcFlag, sweepFlag, endX.x, endX.y);
		if (points != null) for (let i = 0, ii = points.length; i < ii; i += 6) this.curveTo(points[i], points[i + 1], points[i + 2], points[i + 3], points[i + 4], points[i + 5]);
		return this;
	}
	quadTo(x1, y1, x, y) {
		const start = this.end || new Point();
		const data = [
			"M",
			start.x,
			start.y
		];
		if (typeof x1 === "number") data.push("Q", x1, y1, x, y);
		else {
			const p = y1;
			data.push(`Q`, x1.x, x1.y, p.x, p.y);
		}
		const path = Path$1.parse(data.join(" "));
		this.appendSegment(path.segments.slice(1));
		return this;
	}
	close() {
		return this.appendSegment(Close.create());
	}
	drawPoints(points, options = {}) {
		const raw = drawPoints(points, options);
		const sub = Path$1.parse(raw);
		if (sub && sub.segments) this.appendSegment(sub.segments);
	}
	bbox() {
		const segments = this.segments;
		const count = segments.length;
		if (count === 0) return null;
		let bbox;
		for (let i = 0; i < count; i += 1) {
			const segment = segments[i];
			if (segment.isVisible) {
				const segmentBBox = segment.bbox();
				if (segmentBBox != null) bbox = bbox ? bbox.union(segmentBBox) : segmentBBox;
			}
		}
		if (bbox != null) return bbox;
		const lastSegment = segments[count - 1];
		return new Rectangle(lastSegment.end.x, lastSegment.end.y, 0, 0);
	}
	appendSegment(seg) {
		const count = this.segments.length;
		let previousSegment = count !== 0 ? this.segments[count - 1] : null;
		let currentSegment;
		const nextSegment = null;
		if (Array.isArray(seg)) for (let i = 0, ii = seg.length; i < ii; i += 1) {
			const segment = seg[i];
			currentSegment = this.prepareSegment(segment, previousSegment, nextSegment);
			this.segments.push(currentSegment);
			previousSegment = currentSegment;
		}
		else if (seg != null && seg.isSegment) {
			currentSegment = this.prepareSegment(seg, previousSegment, nextSegment);
			this.segments.push(currentSegment);
		}
		return this;
	}
	insertSegment(index, seg) {
		const count = this.segments.length;
		if (index < 0) index = count + index + 1;
		if (index > count || index < 0) throw new Error("Index out of range.");
		let currentSegment;
		let previousSegment = null;
		let nextSegment = null;
		if (count !== 0) if (index >= 1) {
			previousSegment = this.segments[index - 1];
			nextSegment = previousSegment.nextSegment;
		} else {
			previousSegment = null;
			nextSegment = this.segments[0];
		}
		if (!Array.isArray(seg)) {
			currentSegment = this.prepareSegment(seg, previousSegment, nextSegment);
			this.segments.splice(index, 0, currentSegment);
		} else for (let i = 0, ii = seg.length; i < ii; i += 1) {
			const segment = seg[i];
			currentSegment = this.prepareSegment(segment, previousSegment, nextSegment);
			this.segments.splice(index + i, 0, currentSegment);
			previousSegment = currentSegment;
		}
		return this;
	}
	removeSegment(index) {
		const idx = this.fixIndex(index);
		const removedSegment = this.segments.splice(idx, 1)[0];
		const previousSegment = removedSegment.previousSegment;
		const nextSegment = removedSegment.nextSegment;
		if (previousSegment) previousSegment.nextSegment = nextSegment;
		if (nextSegment) nextSegment.previousSegment = previousSegment;
		if (removedSegment.isSubpathStart && nextSegment) this.updateSubpathStartSegment(nextSegment);
		return removedSegment;
	}
	replaceSegment(index, seg) {
		const idx = this.fixIndex(index);
		let currentSegment;
		const replacedSegment = this.segments[idx];
		let previousSegment = replacedSegment.previousSegment;
		const nextSegment = replacedSegment.nextSegment;
		let updateSubpathStart = replacedSegment.isSubpathStart;
		if (!Array.isArray(seg)) {
			currentSegment = this.prepareSegment(seg, previousSegment, nextSegment);
			this.segments.splice(idx, 1, currentSegment);
			if (updateSubpathStart && currentSegment.isSubpathStart) updateSubpathStart = false;
		} else {
			this.segments.splice(index, 1);
			for (let i = 0, ii = seg.length; i < ii; i += 1) {
				const segment = seg[i];
				currentSegment = this.prepareSegment(segment, previousSegment, nextSegment);
				this.segments.splice(index + i, 0, currentSegment);
				previousSegment = currentSegment;
				if (updateSubpathStart && currentSegment.isSubpathStart) updateSubpathStart = false;
			}
		}
		if (updateSubpathStart && nextSegment) this.updateSubpathStartSegment(nextSegment);
	}
	getSegment(index) {
		const idx = this.fixIndex(index);
		return this.segments[idx];
	}
	fixIndex(index) {
		const length = this.segments.length;
		if (length === 0) throw new Error("Path has no segments.");
		let i = index;
		while (i < 0) i = length + i;
		if (i >= length || i < 0) throw new Error("Index out of range.");
		return i;
	}
	segmentAt(ratio, options = {}) {
		const index = this.segmentIndexAt(ratio, options);
		if (!index) return null;
		return this.getSegment(index);
	}
	segmentAtLength(length, options = {}) {
		const index = this.segmentIndexAtLength(length, options);
		if (!index) return null;
		return this.getSegment(index);
	}
	segmentIndexAt(ratio, options = {}) {
		if (this.segments.length === 0) return null;
		const rate = GeometryUtil.clamp(ratio, 0, 1);
		const opt = this.getOptions(options);
		const length = this.length(opt) * rate;
		return this.segmentIndexAtLength(length, opt);
	}
	segmentIndexAtLength(length, options = {}) {
		const count = this.segments.length;
		if (count === 0) return null;
		let fromStart = true;
		if (length < 0) {
			fromStart = false;
			length = -length;
		}
		const precision = this.getPrecision(options);
		const segmentSubdivisions = this.getSubdivisions(options);
		let memo = 0;
		let lastVisibleIndex = null;
		for (let i = 0; i < count; i += 1) {
			const index = fromStart ? i : count - 1 - i;
			const segment = this.segments[index];
			const subdivisions = segmentSubdivisions[index];
			const len = segment.length({
				precision,
				subdivisions
			});
			if (segment.isVisible) {
				if (length <= memo + len) return index;
				lastVisibleIndex = index;
			}
			memo += len;
		}
		return lastVisibleIndex;
	}
	getSegmentSubdivisions(options = {}) {
		const precision = this.getPrecision(options);
		const segmentSubdivisions = [];
		for (let i = 0, ii = this.segments.length; i < ii; i += 1) {
			const subdivisions = this.segments[i].getSubdivisions({ precision });
			segmentSubdivisions.push(subdivisions);
		}
		return segmentSubdivisions;
	}
	updateSubpathStartSegment(segment) {
		let previous = segment.previousSegment;
		let current = segment;
		while (current && !current.isSubpathStart) {
			if (previous != null) current.subpathStartSegment = previous.subpathStartSegment;
			else current.subpathStartSegment = null;
			previous = current;
			current = current.nextSegment;
		}
	}
	prepareSegment(segment, previousSegment, nextSegment) {
		segment.previousSegment = previousSegment;
		segment.nextSegment = nextSegment;
		if (previousSegment != null) previousSegment.nextSegment = segment;
		if (nextSegment != null) nextSegment.previousSegment = segment;
		let updateSubpathStart = segment;
		if (segment.isSubpathStart) {
			segment.subpathStartSegment = segment;
			updateSubpathStart = nextSegment;
		}
		if (updateSubpathStart != null) this.updateSubpathStartSegment(updateSubpathStart);
		return segment;
	}
	closestPoint(p, options = {}) {
		const t = this.closestPointT(p, options);
		if (!t) return null;
		return this.pointAtT(t);
	}
	closestPointLength(p, options = {}) {
		const opts = this.getOptions(options);
		const t = this.closestPointT(p, opts);
		if (!t) return 0;
		return this.lengthAtT(t, opts);
	}
	closestPointNormalizedLength(p, options = {}) {
		const opts = this.getOptions(options);
		const cpLength = this.closestPointLength(p, opts);
		if (cpLength === 0) return 0;
		const length = this.length(opts);
		if (length === 0) return 0;
		return cpLength / length;
	}
	closestPointT(p, options = {}) {
		if (this.segments.length === 0) return null;
		const precision = this.getPrecision(options);
		const segmentSubdivisions = this.getSubdivisions(options);
		let closestPointT;
		let minSquaredDistance = Infinity;
		for (let i = 0, ii = this.segments.length; i < ii; i += 1) {
			const segment = this.segments[i];
			const subdivisions = segmentSubdivisions[i];
			if (segment.isVisible) {
				const segmentClosestPointT = segment.closestPointT(p, {
					precision,
					subdivisions
				});
				const segmentClosestPoint = segment.pointAtT(segmentClosestPointT);
				const squaredDistance = GeometryUtil.squaredLength(segmentClosestPoint, p);
				if (squaredDistance < minSquaredDistance) {
					closestPointT = {
						segmentIndex: i,
						value: segmentClosestPointT
					};
					minSquaredDistance = squaredDistance;
				}
			}
		}
		if (closestPointT) return closestPointT;
		return {
			segmentIndex: this.segments.length - 1,
			value: 1
		};
	}
	closestPointTangent(p, options = {}) {
		if (this.segments.length === 0) return null;
		const precision = this.getPrecision(options);
		const segmentSubdivisions = this.getSubdivisions(options);
		let closestPointTangent;
		let minSquaredDistance = Infinity;
		for (let i = 0, ii = this.segments.length; i < ii; i += 1) {
			const segment = this.segments[i];
			const subdivisions = segmentSubdivisions[i];
			if (segment.isDifferentiable()) {
				const segmentClosestPointT = segment.closestPointT(p, {
					precision,
					subdivisions
				});
				const segmentClosestPoint = segment.pointAtT(segmentClosestPointT);
				const squaredDistance = GeometryUtil.squaredLength(segmentClosestPoint, p);
				if (squaredDistance < minSquaredDistance) {
					closestPointTangent = segment.tangentAtT(segmentClosestPointT);
					minSquaredDistance = squaredDistance;
				}
			}
		}
		if (closestPointTangent) return closestPointTangent;
		return null;
	}
	containsPoint(p, options = {}) {
		const polylines = this.toPolylines(options);
		if (!polylines) return false;
		let numIntersections = 0;
		for (let i = 0, ii = polylines.length; i < ii; i += 1) if (polylines[i].containsPoint(p)) numIntersections += 1;
		return numIntersections % 2 === 1;
	}
	pointAt(ratio, options = {}) {
		if (this.segments.length === 0) return null;
		if (ratio <= 0) return this.start.clone();
		if (ratio >= 1) return this.end.clone();
		const opts = this.getOptions(options);
		const length = this.length(opts) * ratio;
		return this.pointAtLength(length, opts);
	}
	pointAtLength(length, options = {}) {
		if (this.segments.length === 0) return null;
		if (length === 0) return this.start.clone();
		let fromStart = true;
		if (length < 0) {
			fromStart = false;
			length = -length;
		}
		const precision = this.getPrecision(options);
		const segmentSubdivisions = this.getSubdivisions(options);
		let lastVisibleSegment;
		let memo = 0;
		for (let i = 0, ii = this.segments.length; i < ii; i += 1) {
			const index = fromStart ? i : ii - 1 - i;
			const segment = this.segments[index];
			const subdivisions = segmentSubdivisions[index];
			const d = segment.length({
				precision,
				subdivisions
			});
			if (segment.isVisible) {
				if (length <= memo + d) return segment.pointAtLength((fromStart ? 1 : -1) * (length - memo), {
					precision,
					subdivisions
				});
				lastVisibleSegment = segment;
			}
			memo += d;
		}
		if (lastVisibleSegment) return fromStart ? lastVisibleSegment.end : lastVisibleSegment.start;
		return this.segments[this.segments.length - 1].end.clone();
	}
	pointAtT(t) {
		const segments = this.segments;
		const numSegments = segments.length;
		if (numSegments === 0) return null;
		const segmentIndex = t.segmentIndex;
		if (segmentIndex < 0) return segments[0].pointAtT(0);
		if (segmentIndex >= numSegments) return segments[numSegments - 1].pointAtT(1);
		const tValue = GeometryUtil.clamp(t.value, 0, 1);
		return segments[segmentIndex].pointAtT(tValue);
	}
	divideAt(ratio, options = {}) {
		if (this.segments.length === 0) return null;
		const rate = GeometryUtil.clamp(ratio, 0, 1);
		const opts = this.getOptions(options);
		const length = this.length(opts) * rate;
		return this.divideAtLength(length, opts);
	}
	divideAtLength(length, options = {}) {
		if (this.segments.length === 0) return null;
		let fromStart = true;
		if (length < 0) {
			fromStart = false;
			length = -length;
		}
		const precision = this.getPrecision(options);
		const segmentSubdivisions = this.getSubdivisions(options);
		let memo = 0;
		let divided;
		let dividedSegmentIndex;
		let lastValidSegment;
		let lastValidSegmentIndex;
		let t;
		for (let i = 0, ii = this.segments.length; i < ii; i += 1) {
			const index = fromStart ? i : ii - 1 - i;
			const segment = this.getSegment(index);
			const opts = {
				precision,
				subdivisions: segmentSubdivisions[index]
			};
			const len = segment.length(opts);
			if (segment.isDifferentiable()) {
				lastValidSegment = segment;
				lastValidSegmentIndex = index;
				if (length <= memo + len) {
					dividedSegmentIndex = index;
					divided = segment.divideAtLength((fromStart ? 1 : -1) * (length - memo), opts);
					break;
				}
			}
			memo += len;
		}
		if (!lastValidSegment) return null;
		if (!divided) {
			dividedSegmentIndex = lastValidSegmentIndex;
			t = fromStart ? 1 : 0;
			divided = lastValidSegment.divideAtT(t);
		}
		const pathCopy = this.clone();
		const index = dividedSegmentIndex;
		pathCopy.replaceSegment(index, divided);
		const divisionStartIndex = index;
		let divisionMidIndex = index + 1;
		let divisionEndIndex = index + 2;
		if (!divided[0].isDifferentiable()) {
			pathCopy.removeSegment(divisionStartIndex);
			divisionMidIndex -= 1;
			divisionEndIndex -= 1;
		}
		const movetoEnd = pathCopy.getSegment(divisionMidIndex).start;
		pathCopy.insertSegment(divisionMidIndex, Path$1.createSegment("M", movetoEnd));
		divisionEndIndex += 1;
		if (!divided[1].isDifferentiable()) {
			pathCopy.removeSegment(divisionEndIndex - 1);
			divisionEndIndex -= 1;
		}
		const secondPathSegmentIndexConversion = divisionEndIndex - divisionStartIndex - 1;
		for (let i = divisionEndIndex, ii = pathCopy.segments.length; i < ii; i += 1) {
			const originalSegment = this.getSegment(i - secondPathSegmentIndexConversion);
			const segment = pathCopy.getSegment(i);
			if (segment.type === "Z" && !originalSegment.subpathStartSegment.end.equals(segment.subpathStartSegment.end)) {
				const convertedSegment = Path$1.createSegment("L", originalSegment.end);
				pathCopy.replaceSegment(i, convertedSegment);
			}
		}
		return [new Path$1(pathCopy.segments.slice(0, divisionMidIndex)), new Path$1(pathCopy.segments.slice(divisionMidIndex))];
	}
	intersectsWithLine(line, options = {}) {
		const polylines = this.toPolylines(options);
		if (polylines == null) return null;
		let intersections = null;
		for (let i = 0, ii = polylines.length; i < ii; i += 1) {
			const polyline = polylines[i];
			const intersection = line.intersect(polyline);
			if (intersection) {
				if (intersections == null) intersections = [];
				if (Array.isArray(intersection)) intersections.push(...intersection);
				else intersections.push(intersection);
			}
		}
		return intersections;
	}
	isDifferentiable() {
		for (let i = 0, ii = this.segments.length; i < ii; i += 1) if (this.segments[i].isDifferentiable()) return true;
		return false;
	}
	isValid() {
		const segments = this.segments;
		return segments.length === 0 || segments[0].type === "M";
	}
	length(options = {}) {
		if (this.segments.length === 0) return 0;
		const segmentSubdivisions = this.getSubdivisions(options);
		let length = 0;
		for (let i = 0, ii = this.segments.length; i < ii; i += 1) {
			const segment = this.segments[i];
			const subdivisions = segmentSubdivisions[i];
			length += segment.length({ subdivisions });
		}
		return length;
	}
	lengthAtT(t, options = {}) {
		const count = this.segments.length;
		if (count === 0) return 0;
		let segmentIndex = t.segmentIndex;
		if (segmentIndex < 0) return 0;
		let tValue = GeometryUtil.clamp(t.value, 0, 1);
		if (segmentIndex >= count) {
			segmentIndex = count - 1;
			tValue = 1;
		}
		const precision = this.getPrecision(options);
		const segmentSubdivisions = this.getSubdivisions(options);
		let length = 0;
		for (let i = 0; i < segmentIndex; i += 1) {
			const segment = this.segments[i];
			const subdivisions = segmentSubdivisions[i];
			length += segment.length({
				precision,
				subdivisions
			});
		}
		const segment = this.segments[segmentIndex];
		const subdivisions = segmentSubdivisions[segmentIndex];
		length += segment.lengthAtT(tValue, {
			precision,
			subdivisions
		});
		return length;
	}
	tangentAt(ratio, options = {}) {
		if (this.segments.length === 0) return null;
		const rate = GeometryUtil.clamp(ratio, 0, 1);
		const opts = this.getOptions(options);
		const length = this.length(opts) * rate;
		return this.tangentAtLength(length, opts);
	}
	tangentAtLength(length, options = {}) {
		if (this.segments.length === 0) return null;
		let fromStart = true;
		if (length < 0) {
			fromStart = false;
			length = -length;
		}
		const precision = this.getPrecision(options);
		const segmentSubdivisions = this.getSubdivisions(options);
		let lastValidSegment;
		let memo = 0;
		for (let i = 0, ii = this.segments.length; i < ii; i += 1) {
			const index = fromStart ? i : ii - 1 - i;
			const segment = this.segments[index];
			const subdivisions = segmentSubdivisions[index];
			const len = segment.length({
				precision,
				subdivisions
			});
			if (segment.isDifferentiable()) {
				if (length <= memo + len) return segment.tangentAtLength((fromStart ? 1 : -1) * (length - memo), {
					precision,
					subdivisions
				});
				lastValidSegment = segment;
			}
			memo += len;
		}
		if (lastValidSegment) {
			const t = fromStart ? 1 : 0;
			return lastValidSegment.tangentAtT(t);
		}
		return null;
	}
	tangentAtT(t) {
		const count = this.segments.length;
		if (count === 0) return null;
		const segmentIndex = t.segmentIndex;
		if (segmentIndex < 0) return this.segments[0].tangentAtT(0);
		if (segmentIndex >= count) return this.segments[count - 1].tangentAtT(1);
		const tValue = GeometryUtil.clamp(t.value, 0, 1);
		return this.segments[segmentIndex].tangentAtT(tValue);
	}
	getPrecision(options = {}) {
		return options.precision == null ? this.PRECISION : options.precision;
	}
	getSubdivisions(options = {}) {
		if (options.segmentSubdivisions == null) {
			const precision = this.getPrecision(options);
			return this.getSegmentSubdivisions({ precision });
		}
		return options.segmentSubdivisions;
	}
	getOptions(options = {}) {
		return {
			precision: this.getPrecision(options),
			segmentSubdivisions: this.getSubdivisions(options)
		};
	}
	toPoints(options = {}) {
		const segments = this.segments;
		const count = segments.length;
		if (count === 0) return null;
		const segmentSubdivisions = this.getSubdivisions(options);
		const points = [];
		let partialPoints = [];
		for (let i = 0; i < count; i += 1) {
			const segment = segments[i];
			if (segment.isVisible) {
				const divisions = segmentSubdivisions[i];
				if (divisions.length > 0) divisions.forEach((c) => partialPoints.push(c.start));
				else partialPoints.push(segment.start);
			} else if (partialPoints.length > 0) {
				partialPoints.push(segments[i - 1].end);
				points.push(partialPoints);
				partialPoints = [];
			}
		}
		if (partialPoints.length > 0) {
			partialPoints.push(this.end);
			points.push(partialPoints);
		}
		return points;
	}
	toPolylines(options = {}) {
		const points = this.toPoints(options);
		if (!points) return null;
		return points.map((arr) => new Polyline$1(arr));
	}
	scale(sx, sy, origin) {
		this.segments.forEach((s) => s.scale(sx, sy, origin));
		return this;
	}
	rotate(angle, origin) {
		this.segments.forEach((segment) => segment.rotate(angle, origin));
		return this;
	}
	translate(tx, ty) {
		if (typeof tx === "number") this.segments.forEach((s) => s.translate(tx, ty));
		else this.segments.forEach((s) => s.translate(tx));
		return this;
	}
	clone() {
		const path = new Path$1();
		this.segments.forEach((s) => path.appendSegment(s.clone()));
		return path;
	}
	equals(p) {
		if (p == null) return false;
		const segments = this.segments;
		const otherSegments = p.segments;
		const count = segments.length;
		if (otherSegments.length !== count) return false;
		for (let i = 0; i < count; i += 1) {
			const a = segments[i];
			const b = otherSegments[i];
			if (a.type !== b.type || !a.equals(b)) return false;
		}
		return true;
	}
	toJSON() {
		return this.segments.map((s) => s.toJSON());
	}
	serialize() {
		if (!this.isValid()) throw new Error("Invalid path segments.");
		return this.segments.map((s) => s.serialize()).join(" ");
	}
	toString() {
		return this.serialize();
	}
};
(function(Path) {
	function isPath(instance) {
		return instance != null && instance instanceof Path;
	}
	Path.isPath = isPath;
})(Path$1 || (Path$1 = {}));
(function(Path) {
	function parse(pathData) {
		if (!pathData) return new Path();
		const path = new Path();
		const commands = Path.normalize(pathData).match(/(?:[a-zA-Z] *)(?:(?:-?\d+(?:\.\d+)?(?:e[-+]?\d+)? *,? *)|(?:-?\.\d+ *,? *))+|(?:[a-zA-Z] *)(?! |\d|-|\.)/g);
		if (commands != null) for (let i = 0, ii = commands.length; i < ii; i += 1) {
			const args = commands[i].match(/(?:[a-zA-Z])|(?:(?:-?\d+(?:\.\d+)?(?:e[-+]?\d+)?))|(?:(?:-?\.\d+))/g);
			if (args != null) {
				const type = args[0];
				const coords = args.slice(1).map((a) => +a);
				const segment = createSegment.call(null, type, ...coords);
				path.appendSegment(segment);
			}
		}
		return path;
	}
	Path.parse = parse;
	function createSegment(type, ...args) {
		if (type === "M") return MoveTo.create.call(null, ...args);
		if (type === "L") return LineTo.create.call(null, ...args);
		if (type === "C") return CurveTo.create.call(null, ...args);
		if (type === "z" || type === "Z") return Close.create();
		throw new Error(`Invalid path segment type "${type}"`);
	}
	Path.createSegment = createSegment;
})(Path$1 || (Path$1 = {}));
(function(Path) {
	Path.normalize = normalizePathData;
	Path.isValid = isValid;
	Path.drawArc = drawArc;
	Path.drawPoints = drawPoints;
	Path.arcToCurves = arcToCurves;
})(Path$1 || (Path$1 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/registry.js
var Registry = class {
	constructor(options) {
		this.options = Object.assign({}, options);
		this.data = this.options.data || {};
		this.register = this.register.bind(this);
		this.unregister = this.unregister.bind(this);
	}
	get names() {
		return Object.keys(this.data);
	}
	register(name, options, force = false) {
		if (typeof name === "object") {
			Object.entries(name).forEach(([key, val]) => {
				this.register(key, val, options);
			});
			return;
		}
		if (this.exist(name) && !force && !Platform.isApplyingHMR()) this.onDuplicated(name);
		const process = this.options.process;
		const entity = process ? call$1(process, this, name, options) : options;
		this.data[name] = entity;
		return entity;
	}
	unregister(name) {
		const entity = name ? this.data[name] : null;
		delete this.data[name];
		return entity;
	}
	get(name) {
		return name ? this.data[name] : null;
	}
	exist(name) {
		return name ? this.data[name] != null : false;
	}
	onDuplicated(name) {
		try {
			if (this.options.onConflict) call$1(this.options.onConflict, this, name);
			throw new Error(`${upperFirst(this.options.type)} with name '${name}' already registered.`);
		} catch (err) {
			throw err;
		}
	}
	onNotFound(name, prefix) {
		throw new Error(this.getSpellingSuggestion(name, prefix));
	}
	getSpellingSuggestion(name, prefix) {
		const suggestion = this.getSpellingSuggestionForName(name);
		return `${upperFirst(prefix ? `${prefix} ${lowerFirst(this.options.type)}` : this.options.type)} with name '${name}' does not exist.${suggestion ? ` Did you mean '${suggestion}'?` : ""}`;
	}
	getSpellingSuggestionForName(name) {
		return getSpellingSuggestion(name, Object.keys(this.data), (candidate) => candidate);
	}
};
(function(Registry) {
	function create(options) {
		return new Registry(options);
	}
	Registry.create = create;
})(Registry || (Registry = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/grid/dot.js
var dot = {
	color: "#aaaaaa",
	thickness: 1,
	markup: "rect",
	update(elem, options) {
		const width = options.thickness * options.sx;
		const height = options.thickness * options.sy;
		attr(elem, {
			width,
			height,
			rx: width,
			ry: height,
			fill: options.color
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/grid/fixed-dot.js
var fixedDot = {
	color: "#aaaaaa",
	thickness: 1,
	markup: "rect",
	update(elem, options) {
		const size = options.sx <= 1 ? options.thickness * options.sx : options.thickness;
		attr(elem, {
			width: size,
			height: size,
			rx: size,
			ry: size,
			fill: options.color
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/grid/mesh.js
var mesh = {
	color: "rgba(224,224,224,1)",
	thickness: 1,
	markup: "path",
	update(elem, options) {
		let d;
		const width = options.width;
		const height = options.height;
		const thickness = options.thickness;
		if (width - thickness >= 0 && height - thickness >= 0) d = [
			"M",
			width,
			0,
			"H0 M0 0 V0",
			height
		].join(" ");
		else d = "M 0 0 0 0";
		attr(elem, {
			d,
			stroke: options.color,
			"stroke-width": options.thickness
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/grid/double-mesh.js
var doubleMesh = [{
	color: "rgba(224,224,224,1)",
	thickness: 1,
	markup: "path",
	update(elem, options) {
		let d;
		const width = options.width;
		const height = options.height;
		const thickness = options.thickness;
		if (width - thickness >= 0 && height - thickness >= 0) d = [
			"M",
			width,
			0,
			"H0 M0 0 V0",
			height
		].join(" ");
		else d = "M 0 0 0 0";
		attr(elem, {
			d,
			stroke: options.color,
			"stroke-width": options.thickness
		});
	}
}, {
	color: "rgba(224,224,224,0.2)",
	thickness: 3,
	factor: 4,
	markup: "path",
	update(elem, options) {
		let d;
		const factor = options.factor || 1;
		const width = options.width * factor;
		const height = options.height * factor;
		const thickness = options.thickness;
		if (width - thickness >= 0 && height - thickness >= 0) d = [
			"M",
			width,
			0,
			"H0 M0 0 V0",
			height
		].join(" ");
		else d = "M 0 0 0 0";
		options.width = width;
		options.height = height;
		attr(elem, {
			d,
			stroke: options.color,
			"stroke-width": options.thickness
		});
	}
}];
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/grid/main.js
var main_exports$13 = /* @__PURE__ */ __exportAll({
	dot: () => dot,
	doubleMesh: () => doubleMesh,
	fixedDot: () => fixedDot,
	mesh: () => mesh
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/grid/index.js
var Grid = class {
	constructor() {
		this.patterns = {};
		this.root = Vector.create(createSvgDocument(), {
			width: "100%",
			height: "100%"
		}, [createSvgElement("defs")]).node;
	}
	add(id, elem) {
		const firstChild = this.root.childNodes[0];
		if (firstChild) firstChild.appendChild(elem);
		this.patterns[id] = elem;
		Vector.create("rect", {
			width: "100%",
			height: "100%",
			fill: `url(#${id})`
		}).appendTo(this.root);
	}
	get(id) {
		return this.patterns[id];
	}
	has(id) {
		return this.patterns[id] != null;
	}
};
(function(Grid) {
	Grid.presets = main_exports$13;
	Grid.registry = Registry.create({ type: "grid" });
	Grid.registry.register(Grid.presets, true);
})(Grid || (Grid = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/background/flip-x.js
var flipX = function(img) {
	const canvas = document.createElement("canvas");
	const width = img.width;
	const height = img.height;
	canvas.width = width * 2;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, width, height);
	ctx.translate(2 * width, 0);
	ctx.scale(-1, 1);
	ctx.drawImage(img, 0, 0, width, height);
	return canvas;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/background/flip-y.js
var flipY = function(img) {
	const canvas = document.createElement("canvas");
	const width = img.width;
	const height = img.height;
	canvas.width = width;
	canvas.height = height * 2;
	const ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, width, height);
	ctx.translate(0, 2 * height);
	ctx.scale(1, -1);
	ctx.drawImage(img, 0, 0, width, height);
	return canvas;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/background/flip-xy.js
var flipXY = function(img) {
	const canvas = document.createElement("canvas");
	const width = img.width;
	const height = img.height;
	canvas.width = 2 * width;
	canvas.height = 2 * height;
	const ctx = canvas.getContext("2d");
	ctx.drawImage(img, 0, 0, width, height);
	ctx.setTransform(-1, 0, 0, -1, canvas.width, canvas.height);
	ctx.drawImage(img, 0, 0, width, height);
	ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
	ctx.drawImage(img, 0, 0, width, height);
	ctx.setTransform(1, 0, 0, -1, 0, canvas.height);
	ctx.drawImage(img, 0, 0, width, height);
	return canvas;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/background/watermark.js
var watermark = function(img, options) {
	const width = img.width;
	const height = img.height;
	const canvas = document.createElement("canvas");
	canvas.width = width * 3;
	canvas.height = height * 3;
	const ctx = canvas.getContext("2d");
	const angle = options.angle != null ? -options.angle : -20;
	const radians = Angle.toRad(angle);
	const stepX = canvas.width / 4;
	const stepY = canvas.height / 4;
	for (let i = 0; i < 4; i += 1) for (let j = 0; j < 4; j += 1) if ((i + j) % 2 > 0) {
		ctx.setTransform(1, 0, 0, 1, (2 * i - 1) * stepX, (2 * j - 1) * stepY);
		ctx.rotate(radians);
		ctx.drawImage(img, -width / 2, -height / 2, width, height);
	}
	return canvas;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/background/main.js
var main_exports$12 = /* @__PURE__ */ __exportAll({
	flipX: () => flipX,
	flipXY: () => flipXY,
	flipY: () => flipY,
	watermark: () => watermark
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/background/index.js
var Background;
(function(Background) {
	Background.presets = Object.assign({}, main_exports$12);
	Background.presets["flip-x"] = flipX;
	Background.presets["flip-y"] = flipY;
	Background.presets["flip-xy"] = flipXY;
	Background.registry = Registry.create({ type: "background pattern" });
	Background.registry.register(Background.presets, true);
})(Background || (Background = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/util.js
function getString(value, defaultValue) {
	return value != null ? value : defaultValue;
}
function getNumber(num, defaultValue) {
	return num != null && Number.isFinite(num) ? num : defaultValue;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/outline.js
function outline(args = {}) {
	const color = getString(args.color, "blue");
	const width = getNumber(args.width, 1);
	const margin = getNumber(args.margin, 2);
	const opacity = getNumber(args.opacity, 1);
	const innerRadius = margin;
	return `
    <filter>
      <feFlood flood-color="${color}" flood-opacity="${opacity}" result="colored"/>
      <feMorphology in="SourceAlpha" result="morphedOuter" operator="dilate" radius="${margin + width}" />
      <feMorphology in="SourceAlpha" result="morphedInner" operator="dilate" radius="${innerRadius}" />
      <feComposite result="morphedOuterColored" in="colored" in2="morphedOuter" operator="in"/>
      <feComposite operator="xor" in="morphedOuterColored" in2="morphedInner" result="outline"/>
      <feMerge>
        <feMergeNode in="outline"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  `.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/highlight.js
function highlight(args = {}) {
	const color = getString(args.color, "red");
	const blur = getNumber(args.blur, 0);
	const width = getNumber(args.width, 1);
	return `
      <filter>
        <feFlood flood-color="${color}" flood-opacity="${getNumber(args.opacity, 1)}" result="colored"/>
        <feMorphology result="morphed" in="SourceGraphic" operator="dilate" radius="${width}"/>
        <feComposite result="composed" in="colored" in2="morphed" operator="in"/>
        <feGaussianBlur result="blured" in="composed" stdDeviation="${blur}"/>
        <feBlend in="SourceGraphic" in2="blured" mode="normal"/>
      </filter>
    `.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/blur.js
function blur(args = {}) {
	const x = getNumber(args.x, 2);
	return `
    <filter>
      <feGaussianBlur stdDeviation="${args.y != null && Number.isFinite(args.y) ? [x, args.y] : x}"/>
    </filter>
  `.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/drop-shadow.js
function dropShadow(args = {}) {
	const dx = getNumber(args.dx, 0);
	const dy = getNumber(args.dy, 0);
	const color = getString(args.color, "black");
	const blur = getNumber(args.blur, 4);
	const opacity = getNumber(args.opacity, 1);
	return "SVGFEDropShadowElement" in window ? `<filter>
         <feDropShadow stdDeviation="${blur}" dx="${dx}" dy="${dy}" flood-color="${color}" flood-opacity="${opacity}" />
       </filter>`.trim() : `<filter>
         <feGaussianBlur in="SourceAlpha" stdDeviation="${blur}" />
         <feOffset dx="${dx}" dy="${dy}" result="offsetblur" />
         <feFlood flood-color="${color}" />
         <feComposite in2="offsetblur" operator="in" />
         <feComponentTransfer>
           <feFuncA type="linear" slope="${opacity}" />
         </feComponentTransfer>
         <feMerge>
           <feMergeNode/>
           <feMergeNode in="SourceGraphic"/>
         </feMerge>
       </filter>`.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/gray-scale.js
function grayScale(args = {}) {
	const amount = getNumber(args.amount, 1);
	const a = .2126 + .7874 * (1 - amount);
	const b = .7152 - .7152 * (1 - amount);
	return `
    <filter>
      <feColorMatrix type="matrix" values="${a} ${b} ${.0722 - .0722 * (1 - amount)} 0 0 ${.2126 - .2126 * (1 - amount)} ${.7152 + .2848 * (1 - amount)} ${.0722 - .0722 * (1 - amount)} 0 0 ${.2126 - .2126 * (1 - amount)} ${b} ${.0722 + .9278 * (1 - amount)} 0 0 0 0 0 1 0"/>
    </filter>
  `.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/sepia.js
function sepia(args = {}) {
	const amount = getNumber(args.amount, 1);
	return `
      <filter>
        <feColorMatrix type="matrix" values="${.393 + .607 * (1 - amount)} ${.769 - .769 * (1 - amount)} ${.189 - .189 * (1 - amount)} 0 0 ${.349 - .349 * (1 - amount)} ${.686 + .314 * (1 - amount)} ${.168 - .168 * (1 - amount)} 0 0 ${.272 - .272 * (1 - amount)} ${.534 - .534 * (1 - amount)} ${.131 + .869 * (1 - amount)} 0 0 0 0 0 1 0"/>
      </filter>
    `.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/saturate.js
function saturate(args = {}) {
	return `
      <filter>
        <feColorMatrix type="saturate" values="${1 - getNumber(args.amount, 1)}"/>
      </filter>
    `.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/hue-rotate.js
function hueRotate(args = {}) {
	return `
      <filter>
        <feColorMatrix type="hueRotate" values="${getNumber(args.angle, 0)}"/>
      </filter>
    `.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/invert.js
function invert(args = {}) {
	const amount = getNumber(args.amount, 1);
	const amount2 = 1 - amount;
	return `
      <filter>
        <feComponentTransfer>
          <feFuncR type="table" tableValues="${amount} ${amount2}"/>
          <feFuncG type="table" tableValues="${amount} ${amount2}"/>
          <feFuncB type="table" tableValues="${amount} ${amount2}"/>
        </feComponentTransfer>
      </filter>
    `.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/brightness.js
function brightness(args = {}) {
	const amount = getNumber(args.amount, 1);
	return `
    <filter>
      <feComponentTransfer>
        <feFuncR type="linear" slope="${amount}"/>
        <feFuncG type="linear" slope="${amount}"/>
        <feFuncB type="linear" slope="${amount}"/>
      </feComponentTransfer>
    </filter>
  `.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/contrast.js
function contrast(args = {}) {
	const amount = getNumber(args.amount, 1);
	const amount2 = .5 - amount / 2;
	return `
    <filter>
     <feComponentTransfer>
        <feFuncR type="linear" slope="${amount}" intercept="${amount2}"/>
        <feFuncG type="linear" slope="${amount}" intercept="${amount2}"/>
        <feFuncB type="linear" slope="${amount}" intercept="${amount2}"/>
      </feComponentTransfer>
    </filter>
  `.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/main.js
var main_exports$11 = /* @__PURE__ */ __exportAll({
	blur: () => blur,
	brightness: () => brightness,
	contrast: () => contrast,
	dropShadow: () => dropShadow,
	grayScale: () => grayScale,
	highlight: () => highlight,
	hueRotate: () => hueRotate,
	invert: () => invert,
	outline: () => outline,
	saturate: () => saturate,
	sepia: () => sepia
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/filter/index.js
var Filter;
(function(Filter) {
	Filter.presets = main_exports$11;
	Filter.registry = Registry.create({ type: "filter" });
	Filter.registry.register(Filter.presets, true);
})(Filter || (Filter = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/raw.js
var raw = {
	xlinkHref: "xlink:href",
	xlinkShow: "xlink:show",
	xlinkRole: "xlink:role",
	xlinkType: "xlink:type",
	xlinkArcrole: "xlink:arcrole",
	xlinkTitle: "xlink:title",
	xlinkActuate: "xlink:actuate",
	xmlSpace: "xml:space",
	xmlBase: "xml:base",
	xmlLang: "xml:lang",
	preserveAspectRatio: "preserveAspectRatio",
	requiredExtension: "requiredExtension",
	requiredFeatures: "requiredFeatures",
	systemLanguage: "systemLanguage",
	externalResourcesRequired: "externalResourceRequired"
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/ref.js
var ref = {};
var refX = { position: positionWrapper("x", "width", "origin") };
var refY = { position: positionWrapper("y", "height", "origin") };
var refDx = { position: positionWrapper("x", "width", "corner") };
var refDy = { position: positionWrapper("y", "height", "corner") };
var refWidth = { set: setWrapper("width", "width") };
var refHeight = { set: setWrapper("height", "height") };
var refRx = { set: setWrapper("rx", "width") };
var refRy = { set: setWrapper("ry", "height") };
var refRInscribed = { set: ((attrName) => {
	const widthFn = setWrapper(attrName, "width");
	const heightFn = setWrapper(attrName, "height");
	return function(value, options) {
		const refBBox = options.refBBox;
		return call$1(refBBox.height > refBBox.width ? widthFn : heightFn, this, value, options);
	};
})("r") };
var refRCircumscribed = { set(val, { refBBox }) {
	let value = parseFloat(val);
	const percentage = isPercentage(val);
	if (percentage) value /= 100;
	const diagonalLength = Math.sqrt(refBBox.height * refBBox.height + refBBox.width * refBBox.width);
	let rValue;
	if (Number.isFinite(value)) if (percentage || value >= 0 && value <= 1) rValue = value * diagonalLength;
	else rValue = Math.max(value + diagonalLength, 0);
	return { r: rValue };
} };
var refCx = { set: setWrapper("cx", "width") };
var refCy = { set: setWrapper("cy", "height") };
var refDResetOffset = { set: dWrapper({ resetOffset: true }) };
var refDKeepOffset = { set: dWrapper({ resetOffset: false }) };
var refPointsResetOffset = { set: pointsWrapper({ resetOffset: true }) };
var refPointsKeepOffset = { set: pointsWrapper({ resetOffset: false }) };
var refR = refRInscribed;
var refD = refDResetOffset;
var refPoints = refPointsResetOffset;
var refX2 = refX;
var refY2 = refY;
var refWidth2 = refWidth;
var refHeight2 = refHeight;
function positionWrapper(axis, dimension, origin) {
	return (val, { refBBox }) => {
		if (val == null) return null;
		let value = parseFloat(val);
		const percentage = isPercentage(val);
		if (percentage) value /= 100;
		let delta;
		if (Number.isFinite(value)) {
			const refOrigin = refBBox[origin];
			if (percentage || value > 0 && value < 1) delta = refOrigin[axis] + refBBox[dimension] * value;
			else delta = refOrigin[axis] + value;
		}
		const point = new Point();
		point[axis] = delta || 0;
		return point;
	};
}
function setWrapper(attrName, dimension) {
	return function(val, { refBBox }) {
		let value = parseFloat(val);
		const percentage = isPercentage(val);
		if (percentage) value /= 100;
		const attrs = {};
		if (Number.isFinite(value)) attrs[attrName] = percentage || value >= 0 && value <= 1 ? value * refBBox[dimension] : Math.max(value + refBBox[dimension], 0);
		return attrs;
	};
}
function shapeWrapper(shapeConstructor, options) {
	const cacheName = "x6-shape";
	const resetOffset = options && options.resetOffset;
	return function(value, { elem, refBBox }) {
		let cache = data(elem, cacheName);
		if (!cache || cache.value !== value) {
			const cachedShape = shapeConstructor(value);
			cache = {
				value,
				shape: cachedShape,
				shapeBBox: cachedShape.bbox()
			};
			data(elem, cacheName, cache);
		}
		const shape = cache.shape.clone();
		const shapeBBox = cache.shapeBBox.clone();
		const shapeOrigin = shapeBBox.getOrigin();
		const refOrigin = refBBox.getOrigin();
		shapeBBox.x = refOrigin.x;
		shapeBBox.y = refOrigin.y;
		const fitScale = refBBox.getMaxScaleToFit(shapeBBox, refOrigin);
		const sx = shapeBBox.width === 0 || refBBox.width === 0 ? 1 : fitScale.sx;
		const sy = shapeBBox.height === 0 || refBBox.height === 0 ? 1 : fitScale.sy;
		shape.scale(sx, sy, shapeOrigin);
		if (resetOffset) shape.translate(-shapeOrigin.x, -shapeOrigin.y);
		return shape;
	};
}
function dWrapper(options) {
	function pathConstructor(value) {
		return Path$1.parse(value);
	}
	const shape = shapeWrapper(pathConstructor, options);
	return (value, args) => {
		return { d: shape(value, args).serialize() };
	};
}
function pointsWrapper(options) {
	const shape = shapeWrapper((points) => new Polyline$1(points), options);
	return (value, args) => {
		return { points: shape(value, args).serialize() };
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/fill.js
var fill = {
	qualify: isPlainObject,
	set(fill, { view }) {
		return `url(#${view.graph.defineGradient(fill)})`;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/stroke.js
var stroke$1 = {
	qualify: isPlainObject,
	set(stroke, { view }) {
		const cell = view.cell;
		const options = Object.assign({}, stroke);
		if (cell.isEdge() && options.type === "linearGradient") {
			const edgeView = view;
			const source = edgeView.sourcePoint;
			const target = edgeView.targetPoint;
			options.id = `gradient-${options.type}-${cell.id}`;
			options.attrs = Object.assign(Object.assign({}, options.attrs), {
				x1: source.x,
				y1: source.y,
				x2: target.x,
				y2: target.y,
				gradientUnits: "userSpaceOnUse"
			});
			view.graph.defs.remove(options.id);
		}
		return `url(#${view.graph.defineGradient(options)})`;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/text.js
var text = {
	qualify(text, { attrs }) {
		return attrs.textWrap == null || !isPlainObject(attrs.textWrap);
	},
	set(text, { view, elem, attrs }) {
		const cacheName = "x6-text";
		const cache = data(elem, cacheName);
		const json = (str) => {
			try {
				return JSON.parse(str);
			} catch (error) {
				return str;
			}
		};
		const options = {
			x: attrs.x,
			eol: attrs.eol,
			annotations: json(attrs.annotations),
			textPath: json(attrs["text-path"] || attrs.textPath),
			textVerticalAnchor: attrs["text-vertical-anchor"] || attrs.textVerticalAnchor,
			displayEmpty: (attrs["display-empty"] || attrs.displayEmpty) === "true",
			lineHeight: attrs["line-height"] || attrs.lineHeight
		};
		const fontSize = attrs["font-size"] || attrs.fontSize;
		const textHash = JSON.stringify([text, options]);
		if (fontSize) elem.setAttribute("font-size", fontSize);
		if (cache == null || cache !== textHash) {
			const textPath = options.textPath;
			if (textPath != null && typeof textPath === "object") {
				const selector = textPath.selector;
				if (typeof selector === "string") {
					const pathNode = view.find(selector)[0];
					if (pathNode instanceof SVGPathElement) {
						ensureId(pathNode);
						options.textPath = Object.assign({ "xlink:href": `#${pathNode.id}` }, textPath);
					}
				}
			}
			text$1(elem, `${text}`, options);
			data(elem, cacheName, textHash);
		}
	}
};
var textWrap = {
	qualify: isPlainObject,
	set(val, { view, elem, attrs, refBBox }) {
		const info = val;
		const width = info.width || 0;
		if (isPercentage(width)) refBBox.width *= parseFloat(width) / 100;
		else if (width <= 0) refBBox.width += width;
		else refBBox.width = width;
		const height = info.height || 0;
		if (isPercentage(height)) refBBox.height *= parseFloat(height) / 100;
		else if (height <= 0) refBBox.height += height;
		else refBBox.height = height;
		let wrappedText;
		let txt = info.text;
		if (txt == null) txt = attrs.text || (elem === null || elem === void 0 ? void 0 : elem.textContent);
		if (txt != null) wrappedText = breakText(`${txt}`, refBBox, {
			"font-weight": attrs["font-weight"] || attrs.fontWeight,
			"font-size": attrs["font-size"] || attrs.fontSize,
			"font-family": attrs["font-family"] || attrs.fontFamily,
			lineHeight: attrs.lineHeight
		}, { ellipsis: info.ellipsis });
		else wrappedText = "";
		call$1(text.set, this, wrappedText, {
			view,
			elem,
			attrs,
			refBBox,
			cell: view.cell
		});
	}
};
var isTextInUse = (val, { attrs }) => {
	return attrs.text !== void 0;
};
var lineHeight = { qualify: isTextInUse };
var textVerticalAnchor = { qualify: isTextInUse };
var textPath = { qualify: isTextInUse };
var annotations = { qualify: isTextInUse };
var eol = { qualify: isTextInUse };
var displayEmpty = { qualify: isTextInUse };
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/title.js
var title = {
	qualify(title, { elem }) {
		return elem instanceof SVGElement;
	},
	set(val, { elem }) {
		const cacheName = "x6-title";
		const title = `${val}`;
		const cache = data(elem, cacheName);
		if (cache == null || cache !== title) {
			data(elem, cacheName, title);
			const firstChild = elem.firstChild;
			if (firstChild && firstChild.tagName.toUpperCase() === "TITLE") {
				const titleElem = firstChild;
				titleElem.textContent = title;
			} else {
				const titleNode = document.createElementNS(elem.namespaceURI, "title");
				titleNode.textContent = title;
				elem.insertBefore(titleNode, firstChild);
			}
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/align.js
var xAlign = { offset: offsetWrapper("x", "width", "right") };
var yAlign = { offset: offsetWrapper("y", "height", "bottom") };
var resetOffset = { offset(val, { refBBox }) {
	return val ? {
		x: -refBBox.x,
		y: -refBBox.y
	} : {
		x: 0,
		y: 0
	};
} };
function offsetWrapper(axis, dimension, corner) {
	return (value, { refBBox }) => {
		const point = new Point();
		let delta;
		if (value === "middle") delta = refBBox[dimension] / 2;
		else if (value === corner) delta = refBBox[dimension];
		else if (typeof value === "number" && Number.isFinite(value)) delta = value > -1 && value < 1 ? -refBBox[dimension] * value : -value;
		else if (isPercentage(value)) delta = refBBox[dimension] * parseFloat(value) / 100;
		else delta = 0;
		point[axis] = -(refBBox[axis] + delta);
		return point;
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/style.js
var style = {
	qualify: isPlainObject,
	set(styles, { elem }) {
		css(elem, styles);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/html.js
var html = { set(html, { elem }) {
	elem.innerHTML = `${html}`;
} };
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/filter.js
var filter = {
	qualify: isPlainObject,
	set(filter, { view }) {
		return `url(#${view.graph.defineFilter(filter)})`;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/port.js
var port = { set(port) {
	if (port != null && typeof port === "object" && port.id) return port.id;
	return port;
} };
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/marker/util.js
function normalize(d, offset1, offset2) {
	let offsetX;
	let offsetY;
	if (typeof offset1 === "object") {
		offsetX = offset1.x;
		offsetY = offset1.y;
	} else {
		offsetX = offset1;
		offsetY = offset2;
	}
	const path = Path$1.parse(d);
	const bbox = path.bbox();
	if (bbox) {
		let ty = -bbox.height / 2 - bbox.y;
		let tx = -bbox.width / 2 - bbox.x;
		if (typeof offsetX === "number") tx -= offsetX;
		if (typeof offsetY === "number") ty -= offsetY;
		path.translate(tx, ty);
	}
	return path.serialize();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/marker/classic.js
var __rest$28 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var block = (_a) => {
	var { size, width, height, offset, open } = _a, attrs = __rest$28(_a, [
		"size",
		"width",
		"height",
		"offset",
		"open"
	]);
	return createClassicMarker({
		size,
		width,
		height,
		offset
	}, open === true, true, void 0, attrs);
};
var classic = (_a) => {
	var { size, width, height, offset, factor } = _a, attrs = __rest$28(_a, [
		"size",
		"width",
		"height",
		"offset",
		"factor"
	]);
	return createClassicMarker({
		size,
		width,
		height,
		offset
	}, false, false, factor, attrs);
};
function createClassicMarker(options, open, full, factor = 3 / 4, attrs = {}) {
	const size = options.size || 10;
	const width = options.width || size;
	const height = options.height || size;
	const path = new Path$1();
	const localAttrs = {};
	if (open) {
		path.moveTo(width, 0).lineTo(0, height / 2).lineTo(width, height);
		localAttrs.fill = "none";
	} else {
		path.moveTo(0, height / 2);
		path.lineTo(width, 0);
		if (!full) {
			const f = clamp(factor, 0, 1);
			path.lineTo(width * f, height / 2);
		}
		path.lineTo(width, height);
		path.close();
	}
	return Object.assign(Object.assign(Object.assign({}, localAttrs), attrs), {
		tagName: "path",
		d: normalize(path.serialize(), { x: options.offset != null ? options.offset : -width / 2 })
	});
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/marker/diamond.js
var __rest$27 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var diamond = (_a) => {
	var { size, width, height, offset } = _a, attrs = __rest$27(_a, [
		"size",
		"width",
		"height",
		"offset"
	]);
	const s = size || 10;
	const w = width || s;
	const h = height || s;
	const path = new Path$1();
	path.moveTo(0, h / 2).lineTo(w / 2, 0).lineTo(w, h / 2).lineTo(w / 2, h).close();
	return Object.assign(Object.assign({}, attrs), {
		tagName: "path",
		d: normalize(path.serialize(), offset == null ? -w / 2 : offset)
	});
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/marker/path.js
var __rest$26 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var path = (_a) => {
	var { d, offsetX, offsetY } = _a, attrs = __rest$26(_a, [
		"d",
		"offsetX",
		"offsetY"
	]);
	return Object.assign(Object.assign({}, attrs), {
		tagName: "path",
		d: normalize(d, offsetX, offsetY)
	});
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/marker/cross.js
var __rest$25 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var cross = (_a) => {
	var { size, width, height, offset } = _a, attrs = __rest$25(_a, [
		"size",
		"width",
		"height",
		"offset"
	]);
	const s = size || 10;
	const w = width || s;
	const h = height || s;
	const path = new Path$1();
	path.moveTo(0, 0).lineTo(w, h).moveTo(0, h).lineTo(w, 0);
	return Object.assign(Object.assign({}, attrs), {
		tagName: "path",
		fill: "none",
		d: normalize(path.serialize(), offset || -w / 2)
	});
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/marker/async.js
var __rest$24 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var async = (_a) => {
	var { width, height, offset, open, flip } = _a, attrs = __rest$24(_a, [
		"width",
		"height",
		"offset",
		"open",
		"flip"
	]);
	let h = height || 6;
	const w = width || 10;
	const opened = open === true;
	const fliped = flip === true;
	const result = Object.assign(Object.assign({}, attrs), { tagName: "path" });
	if (fliped) h = -h;
	const path = new Path$1();
	path.moveTo(0, h).lineTo(w, 0);
	if (!opened) {
		path.lineTo(w, h);
		path.close();
	} else result.fill = "none";
	result.d = normalize(path.serialize(), {
		x: offset || -w / 2,
		y: h / 2
	});
	return result;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/marker/circle.js
var __rest$23 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var circle = (_a) => {
	var { r } = _a, attrs = __rest$23(_a, ["r"]);
	const radius = r || 5;
	return Object.assign(Object.assign({ cx: radius }, attrs), {
		tagName: "circle",
		r: radius
	});
};
var circlePlus = (_a) => {
	var { r } = _a, attrs = __rest$23(_a, ["r"]);
	const radius = r || 5;
	const path = new Path$1();
	path.moveTo(radius, 0).lineTo(radius, radius * 2);
	path.moveTo(0, radius).lineTo(radius * 2, radius);
	return { children: [Object.assign(Object.assign({}, circle({ r: radius })), { fill: "none" }), Object.assign(Object.assign({}, attrs), {
		tagName: "path",
		d: normalize(path.serialize(), -radius)
	})] };
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/marker/ellipse.js
var __rest$22 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var ellipse$1 = (_a) => {
	var { rx, ry } = _a, attrs = __rest$22(_a, ["rx", "ry"]);
	const radiusX = rx || 5;
	const radiusy = ry || 5;
	return Object.assign(Object.assign({ cx: radiusX }, attrs), {
		tagName: "ellipse",
		rx: radiusX,
		ry: radiusy
	});
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/marker/main.js
var main_exports$10 = /* @__PURE__ */ __exportAll({
	async: () => async,
	block: () => block,
	circle: () => circle,
	circlePlus: () => circlePlus,
	classic: () => classic,
	cross: () => cross,
	diamond: () => diamond,
	ellipse: () => ellipse$1,
	path: () => path
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/marker/index.js
var Marker;
(function(Marker) {
	Marker.presets = main_exports$10;
	Marker.registry = Registry.create({ type: "marker" });
	Marker.registry.register(Marker.presets, true);
})(Marker || (Marker = {}));
(function(Marker) {
	Marker.normalize = normalize;
})(Marker || (Marker = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/marker.js
var __rest$21 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
function qualify(value) {
	return typeof value === "string" || isPlainObject(value);
}
var sourceMarker = {
	qualify,
	set(marker, { view, attrs }) {
		return createMarker("marker-start", marker, view, attrs);
	}
};
var targetMarker = {
	qualify,
	set(marker, { view, attrs }) {
		return createMarker("marker-end", marker, view, attrs, { transform: "rotate(180)" });
	}
};
var vertexMarker = {
	qualify,
	set(marker, { view, attrs }) {
		return createMarker("marker-mid", marker, view, attrs);
	}
};
function createMarker(type, marker, view, attrs, manual = {}) {
	const def = typeof marker === "string" ? { name: marker } : marker;
	const { name, args } = def, others = __rest$21(def, ["name", "args"]);
	let preset = others;
	if (name && typeof name === "string") {
		const fn = Marker.registry.get(name);
		if (fn) preset = fn(Object.assign(Object.assign({}, others), args));
		else return Marker.registry.onNotFound(name);
	}
	const options = Object.assign(Object.assign(Object.assign({}, normalizeAttr(attrs, type)), manual), preset);
	return { [type]: `url(#${view.graph.defineMarker(options)})` };
}
function normalizeAttr(attr, type) {
	const result = {};
	const stroke = attr.stroke;
	if (typeof stroke === "string") {
		result.stroke = stroke;
		result.fill = stroke;
	}
	let strokeOpacity = attr.strokeOpacity;
	if (strokeOpacity == null) strokeOpacity = attr["stroke-opacity"];
	if (strokeOpacity == null) strokeOpacity = attr.opacity;
	if (strokeOpacity != null) {
		result["stroke-opacity"] = strokeOpacity;
		result["fill-opacity"] = strokeOpacity;
	}
	if (type !== "marker-mid") {
		const strokeWidth = parseFloat(attr.strokeWidth || attr["stroke-width"]);
		if (Number.isFinite(strokeWidth) && strokeWidth > 1) {
			const offset = Math.ceil(strokeWidth / 2);
			result.refX = type === "marker-start" ? offset : -offset;
		}
	}
	return result;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/connection.js
var isEdgeView = (val, { view }) => {
	return view.cell.isEdge();
};
var connection = {
	qualify: isEdgeView,
	set(val, args) {
		var _a, _b, _c, _d;
		const view = args.view;
		const reverse = val.reverse || false;
		const stubs = val.stubs || 0;
		let d;
		if (Number.isFinite(stubs) && stubs !== 0) if (!reverse) {
			let offset;
			if (stubs < 0) offset = ((view.getConnectionLength() || 0) + stubs) / 2;
			else offset = stubs;
			const path = view.getConnection();
			if (path) {
				const sourceParts = path.divideAtLength(offset);
				const targetParts = path.divideAtLength(-offset);
				if (sourceParts && targetParts) d = `${sourceParts[0].serialize()} ${targetParts[1].serialize()}`;
			}
		} else {
			let offset;
			let length;
			const len = view.getConnectionLength() || 0;
			if (stubs < 0) {
				offset = (len + stubs) / 2;
				length = -stubs;
			} else {
				offset = stubs;
				length = len - stubs * 2;
			}
			const path = view.getConnection();
			d = (_d = (_c = (_b = (_a = path === null || path === void 0 ? void 0 : path.divideAtLength(offset)) === null || _a === void 0 ? void 0 : _a[1]) === null || _b === void 0 ? void 0 : _b.divideAtLength(length)) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.serialize();
		}
		return { d: d || view.getConnectionPathData() };
	}
};
var atConnectionLengthKeepGradient = {
	qualify: isEdgeView,
	set: atConnectionWrapper("getTangentAtLength", { rotate: true })
};
var atConnectionLengthIgnoreGradient = {
	qualify: isEdgeView,
	set: atConnectionWrapper("getTangentAtLength", { rotate: false })
};
var atConnectionRatioKeepGradient = {
	qualify: isEdgeView,
	set: atConnectionWrapper("getTangentAtRatio", { rotate: true })
};
var atConnectionRatioIgnoreGradient = {
	qualify: isEdgeView,
	set: atConnectionWrapper("getTangentAtRatio", { rotate: false })
};
var atConnectionLength = atConnectionLengthKeepGradient;
var atConnectionRatio = atConnectionRatioKeepGradient;
function atConnectionWrapper(method, options) {
	const zeroVector = {
		x: 1,
		y: 0
	};
	return (value, args) => {
		let p;
		let angle;
		const view = args.view;
		const tangent = view[method](Number(value));
		if (tangent) {
			angle = options.rotate ? tangent.vector().vectorAngle(zeroVector) : 0;
			p = tangent.start;
		} else {
			p = view.path.start;
			angle = 0;
		}
		if (angle === 0) return { transform: `translate(${p.x},${p.y}')` };
		return { transform: `translate(${p.x},${p.y}') rotate(${angle})` };
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/main.js
var main_exports$9 = /* @__PURE__ */ __exportAll({
	annotations: () => annotations,
	atConnectionLength: () => atConnectionLength,
	atConnectionLengthIgnoreGradient: () => atConnectionLengthIgnoreGradient,
	atConnectionLengthKeepGradient: () => atConnectionLengthKeepGradient,
	atConnectionRatio: () => atConnectionRatio,
	atConnectionRatioIgnoreGradient: () => atConnectionRatioIgnoreGradient,
	atConnectionRatioKeepGradient: () => atConnectionRatioKeepGradient,
	connection: () => connection,
	displayEmpty: () => displayEmpty,
	eol: () => eol,
	fill: () => fill,
	filter: () => filter,
	html: () => html,
	lineHeight: () => lineHeight,
	port: () => port,
	ref: () => ref,
	refCx: () => refCx,
	refCy: () => refCy,
	refD: () => refD,
	refDKeepOffset: () => refDKeepOffset,
	refDResetOffset: () => refDResetOffset,
	refDx: () => refDx,
	refDy: () => refDy,
	refHeight: () => refHeight,
	refHeight2: () => refHeight2,
	refPoints: () => refPoints,
	refPointsKeepOffset: () => refPointsKeepOffset,
	refPointsResetOffset: () => refPointsResetOffset,
	refR: () => refR,
	refRCircumscribed: () => refRCircumscribed,
	refRInscribed: () => refRInscribed,
	refRx: () => refRx,
	refRy: () => refRy,
	refWidth: () => refWidth,
	refWidth2: () => refWidth2,
	refX: () => refX,
	refX2: () => refX2,
	refY: () => refY,
	refY2: () => refY2,
	resetOffset: () => resetOffset,
	sourceMarker: () => sourceMarker,
	stroke: () => stroke$1,
	style: () => style,
	targetMarker: () => targetMarker,
	text: () => text,
	textPath: () => textPath,
	textVerticalAnchor: () => textVerticalAnchor,
	textWrap: () => textWrap,
	title: () => title,
	vertexMarker: () => vertexMarker,
	xAlign: () => xAlign,
	yAlign: () => yAlign
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/attr/index.js
var Attr;
(function(Attr) {
	function isValidDefinition(def, val, options) {
		if (def != null) {
			if (typeof def === "string") return true;
			if (typeof def.qualify !== "function" || call$1(def.qualify, this, val, options)) return true;
		}
		return false;
	}
	Attr.isValidDefinition = isValidDefinition;
})(Attr || (Attr = {}));
(function(Attr) {
	Attr.presets = Object.assign(Object.assign({}, raw), main_exports$9);
	Attr.registry = Registry.create({ type: "attribute definition" });
	Attr.registry.register(Attr.presets, true);
})(Attr || (Attr = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/config/index.js
var Config = {
	prefixCls: "x6",
	autoInsertCSS: true,
	useCSSSelector: true,
	prefix(suffix) {
		return `${Config.prefixCls}-${suffix}`;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/highlighter/class.js
var defaultClassName = Config.prefix("highlighted");
var className$1 = {
	highlight(cellView, magnet, options) {
		addClass(magnet, options && options.className || defaultClassName);
	},
	unhighlight(cellView, magnet, options) {
		removeClass(magnet, options && options.className || defaultClassName);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/highlighter/opacity.js
var className = Config.prefix("highlight-opacity");
var opacity = {
	highlight(cellView, magnet) {
		addClass(magnet, className);
	},
	unhighlight(cellView, magnetEl) {
		removeClass(magnetEl, className);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/util/index.js
var Util$2;
(function(Util) {
	Util.normalizeMarker = normalize;
	/**
	* Transforms point by an SVG transformation represented by `matrix`.
	*/
	function transformPoint(point, matrix) {
		const ret = createSVGPoint(point.x, point.y).matrixTransform(matrix);
		return new Point(ret.x, ret.y);
	}
	Util.transformPoint = transformPoint;
	/**
	* Transforms line by an SVG transformation represented by `matrix`.
	*/
	function transformLine(line, matrix) {
		return new Line(transformPoint(line.start, matrix), transformPoint(line.end, matrix));
	}
	Util.transformLine = transformLine;
	/**
	* Transforms polyline by an SVG transformation represented by `matrix`.
	*/
	function transformPolyline(polyline, matrix) {
		let points = polyline instanceof Polyline$1 ? polyline.points : polyline;
		if (!Array.isArray(points)) points = [];
		return new Polyline$1(points.map((p) => transformPoint(p, matrix)));
	}
	Util.transformPolyline = transformPolyline;
	function transformRectangle(rect, matrix) {
		const p = createSvgElement("svg").createSVGPoint();
		p.x = rect.x;
		p.y = rect.y;
		const corner1 = p.matrixTransform(matrix);
		p.x = rect.x + rect.width;
		p.y = rect.y;
		const corner2 = p.matrixTransform(matrix);
		p.x = rect.x + rect.width;
		p.y = rect.y + rect.height;
		const corner3 = p.matrixTransform(matrix);
		p.x = rect.x;
		p.y = rect.y + rect.height;
		const corner4 = p.matrixTransform(matrix);
		const minX = Math.min(corner1.x, corner2.x, corner3.x, corner4.x);
		const maxX = Math.max(corner1.x, corner2.x, corner3.x, corner4.x);
		const minY = Math.min(corner1.y, corner2.y, corner3.y, corner4.y);
		const maxY = Math.max(corner1.y, corner2.y, corner3.y, corner4.y);
		return new Rectangle(minX, minY, maxX - minX, maxY - minY);
	}
	Util.transformRectangle = transformRectangle;
	/**
	* Returns the bounding box of the element after transformations are
	* applied. If `withoutTransformations` is `true`, transformations of
	* the element will not be considered when computing the bounding box.
	* If `target` is specified, bounding box will be computed relatively
	* to the `target` element.
	*/
	function bbox(elem, withoutTransformations, target) {
		let box;
		const ownerSVGElement = elem.ownerSVGElement;
		if (!ownerSVGElement) return new Rectangle(0, 0, 0, 0);
		try {
			box = elem.getBBox();
		} catch (e) {
			box = {
				x: elem.clientLeft,
				y: elem.clientTop,
				width: elem.clientWidth,
				height: elem.clientHeight
			};
		}
		if (withoutTransformations) return Rectangle.create(box);
		const matrix = getTransformToElement(elem, target || ownerSVGElement);
		return transformRectangle(box, matrix);
	}
	Util.bbox = bbox;
	/**
	* Returns the bounding box of the element after transformations are
	* applied. Unlike `bbox()`, this function fixes a browser implementation
	* bug to return the correct bounding box if this elemenent is a group of
	* svg elements (if `options.recursive` is specified).
	*/
	function getBBox(elem, options = {}) {
		let outputBBox;
		if (!elem.ownerSVGElement || !isSVGGraphicsElement(elem)) {
			if (isHTMLElement(elem)) {
				const { left, top, width, height } = getBoundingOffsetRect(elem);
				return new Rectangle(left, top, width, height);
			}
			return new Rectangle(0, 0, 0, 0);
		}
		let target = options.target;
		if (!options.recursive) {
			try {
				outputBBox = elem.getBBox();
			} catch (e) {
				outputBBox = {
					x: elem.clientLeft,
					y: elem.clientTop,
					width: elem.clientWidth,
					height: elem.clientHeight
				};
			}
			if (!target) return Rectangle.create(outputBBox);
			const matrix = getTransformToElement(elem, target);
			return transformRectangle(outputBBox, matrix);
		}
		{
			const children = elem.childNodes;
			const n = children.length;
			if (n === 0) return getBBox(elem, { target });
			if (!target) target = elem;
			for (let i = 0; i < n; i += 1) {
				const child = children[i];
				let childBBox;
				if (child.childNodes.length === 0) childBBox = getBBox(child, { target });
				else childBBox = getBBox(child, {
					target,
					recursive: true
				});
				if (!outputBBox) outputBBox = childBBox;
				else outputBBox = outputBBox.union(childBBox);
			}
			return outputBBox;
		}
	}
	Util.getBBox = getBBox;
	function getBoundingOffsetRect(elem) {
		let left = 0;
		let top = 0;
		let width = 0;
		let height = 0;
		if (elem) {
			let current = elem;
			while (current) {
				left += current.offsetLeft;
				top += current.offsetTop;
				current = current.offsetParent;
				if (current) {
					left += parseInt(getComputedStyle$1(current, "borderLeft"), 10);
					top += parseInt(getComputedStyle$1(current, "borderTop"), 10);
				}
			}
			width = elem.offsetWidth;
			height = elem.offsetHeight;
		}
		return {
			left,
			top,
			width,
			height
		};
	}
	Util.getBoundingOffsetRect = getBoundingOffsetRect;
	/**
	* Convert the SVGElement to an equivalent geometric shape. The element's
	* transformations are not taken into account.
	*
	* SVGRectElement      => Rectangle
	*
	* SVGLineElement      => Line
	*
	* SVGCircleElement    => Ellipse
	*
	* SVGEllipseElement   => Ellipse
	*
	* SVGPolygonElement   => Polyline
	*
	* SVGPolylineElement  => Polyline
	*
	* SVGPathElement      => Path
	*
	* others              => Rectangle
	*/
	function toGeometryShape(elem) {
		const attr = (name) => {
			const s = elem.getAttribute(name);
			const v = s ? parseFloat(s) : 0;
			return Number.isNaN(v) ? 0 : v;
		};
		switch (elem instanceof SVGElement && elem.nodeName.toLowerCase()) {
			case "rect": return new Rectangle(attr("x"), attr("y"), attr("width"), attr("height"));
			case "circle": return new Ellipse$1(attr("cx"), attr("cy"), attr("r"), attr("r"));
			case "ellipse": return new Ellipse$1(attr("cx"), attr("cy"), attr("rx"), attr("ry"));
			case "polyline": {
				const points = getPointsFromSvgElement(elem);
				return new Polyline$1(points);
			}
			case "polygon": {
				const points = getPointsFromSvgElement(elem);
				if (points.length > 1) points.push(points[0]);
				return new Polyline$1(points);
			}
			case "path": {
				let d = elem.getAttribute("d");
				if (!Path$1.isValid(d)) d = Path$1.normalize(d);
				return Path$1.parse(d);
			}
			case "line": return new Line(attr("x1"), attr("y1"), attr("x2"), attr("y2"));
		}
		return getBBox(elem);
	}
	Util.toGeometryShape = toGeometryShape;
	function translateAndAutoOrient(elem, position, reference, target) {
		const pos = Point.create(position);
		const ref = Point.create(reference);
		if (!target) target = elem instanceof SVGSVGElement ? elem : elem.ownerSVGElement;
		const s = scale(elem);
		elem.setAttribute("transform", "");
		const bbox = getBBox(elem, { target }).scale(s.sx, s.sy);
		const translateToOrigin = createSVGTransform();
		translateToOrigin.setTranslate(-bbox.x - bbox.width / 2, -bbox.y - bbox.height / 2);
		const rotateAroundOrigin = createSVGTransform();
		const angle = pos.angleBetween(ref, pos.clone().translate(1, 0));
		if (angle) rotateAroundOrigin.setRotate(angle, 0, 0);
		const translateFromOrigin = createSVGTransform();
		const finalPosition = pos.clone().move(ref, bbox.width / 2);
		translateFromOrigin.setTranslate(2 * pos.x - finalPosition.x, 2 * pos.y - finalPosition.y);
		const ctm = getTransformToElement(elem, target);
		const transform = createSVGTransform();
		transform.setMatrix(translateFromOrigin.matrix.multiply(rotateAroundOrigin.matrix.multiply(translateToOrigin.matrix.multiply(ctm.scale(s.sx, s.sy)))));
		elem.setAttribute("transform", matrixToTransformString(transform.matrix));
	}
	Util.translateAndAutoOrient = translateAndAutoOrient;
	function findShapeNode(magnet) {
		if (magnet == null) return null;
		let node = magnet;
		do {
			let tagName = node.tagName;
			if (typeof tagName !== "string") return null;
			tagName = tagName.toUpperCase();
			if (hasClass(node, "x6-port")) node = node.nextElementSibling;
			else if (tagName === "G") node = node.firstElementChild;
			else if (tagName === "TITLE") node = node.nextElementSibling;
			else break;
		} while (node);
		return node;
	}
	Util.findShapeNode = findShapeNode;
	function getBBoxV2(elem) {
		const node = findShapeNode(elem);
		if (!isSVGGraphicsElement(node)) {
			if (isHTMLElement(elem)) {
				const { left, top, width, height } = getBoundingOffsetRect(elem);
				return new Rectangle(left, top, width, height);
			}
			return new Rectangle(0, 0, 0, 0);
		}
		return toGeometryShape(node).bbox() || Rectangle.create();
	}
	Util.getBBoxV2 = getBBoxV2;
})(Util$2 || (Util$2 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/highlighter/stroke.js
var defaultOptions = {
	padding: 3,
	rx: 0,
	ry: 0,
	attrs: {
		"stroke-width": 3,
		stroke: "#FEB663"
	}
};
var stroke = {
	highlight(cellView, magnet, options) {
		const id = Private$3.getHighlighterId(magnet, options);
		if (Private$3.hasCache(id)) return;
		options = defaultsDeep({}, options, defaultOptions);
		const magnetVel = Vector.create(magnet);
		let pathData;
		let magnetBBox;
		try {
			pathData = magnetVel.toPathData();
		} catch (error) {
			magnetBBox = Util$2.bbox(magnetVel.node, true);
			pathData = rectToPathData(Object.assign(Object.assign({}, options), magnetBBox));
		}
		const path = createSvgElement("path");
		attr(path, Object.assign({
			d: pathData,
			"pointer-events": "none",
			"vector-effect": "non-scaling-stroke",
			fill: "none"
		}, options.attrs ? kebablizeAttrs(options.attrs) : null));
		if (cellView.isEdgeElement(magnet)) attr(path, "d", cellView.getConnectionPathData());
		else {
			let highlightMatrix = magnetVel.getTransformToElement(cellView.container);
			const padding = options.padding;
			if (padding) {
				if (magnetBBox == null) magnetBBox = Util$2.bbox(magnetVel.node, true);
				const cx = magnetBBox.x + magnetBBox.width / 2;
				const cy = magnetBBox.y + magnetBBox.height / 2;
				magnetBBox = Util$2.transformRectangle(magnetBBox, highlightMatrix);
				const width = Math.max(magnetBBox.width, 1);
				const height = Math.max(magnetBBox.height, 1);
				const sx = (width + padding) / width;
				const sy = (height + padding) / height;
				const paddingMatrix = createSVGMatrix({
					a: sx,
					b: 0,
					c: 0,
					d: sy,
					e: cx - sx * cx,
					f: cy - sy * cy
				});
				highlightMatrix = highlightMatrix.multiply(paddingMatrix);
			}
			transform(path, highlightMatrix);
		}
		addClass(path, Config.prefix("highlight-stroke"));
		const cell = cellView.cell;
		const removeHandler = () => Private$3.removeHighlighter(id);
		cell.on("removed", removeHandler);
		if (cell.model) cell.model.on("reseted", removeHandler);
		cellView.container.appendChild(path);
		Private$3.setCache(id, path);
	},
	unhighlight(cellView, magnet, opt) {
		Private$3.removeHighlighter(Private$3.getHighlighterId(magnet, opt));
	}
};
var Private$3;
(function(Private) {
	function getHighlighterId(magnet, options) {
		ensureId(magnet);
		return magnet.id + JSON.stringify(options);
	}
	Private.getHighlighterId = getHighlighterId;
	const cache = {};
	function setCache(id, elem) {
		cache[id] = elem;
	}
	Private.setCache = setCache;
	function hasCache(id) {
		return cache[id] != null;
	}
	Private.hasCache = hasCache;
	function removeHighlighter(id) {
		const elem = cache[id];
		if (elem) {
			remove(elem);
			delete cache[id];
		}
	}
	Private.removeHighlighter = removeHighlighter;
})(Private$3 || (Private$3 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/highlighter/main.js
var main_exports$8 = /* @__PURE__ */ __exportAll({
	className: () => className$1,
	opacity: () => opacity,
	stroke: () => stroke
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/highlighter/index.js
var Highlighter;
(function(Highlighter) {
	function check(name, highlighter) {
		if (typeof highlighter.highlight !== "function") throw new Error(`Highlighter '${name}' is missing required \`highlight()\` method`);
		if (typeof highlighter.unhighlight !== "function") throw new Error(`Highlighter '${name}' is missing required \`unhighlight()\` method`);
	}
	Highlighter.check = check;
})(Highlighter || (Highlighter = {}));
(function(Highlighter) {
	Highlighter.presets = main_exports$8;
	Highlighter.registry = Registry.create({ type: "highlighter" });
	Highlighter.registry.register(Highlighter.presets, true);
})(Highlighter || (Highlighter = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-layout/util.js
function normalizePoint$1(bbox, args = {}) {
	return new Point(normalizePercentage(args.x, bbox.width), normalizePercentage(args.y, bbox.height));
}
function toResult$1(point, angle, rawArgs) {
	return Object.assign({
		angle,
		position: point.toJSON()
	}, rawArgs);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-layout/absolute.js
var absolute = (portsPositionArgs, elemBBox) => {
	return portsPositionArgs.map(({ x, y, angle }) => toResult$1(normalizePoint$1(elemBBox, {
		x,
		y
	}), angle || 0));
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-layout/ellipse.js
var ellipse = (portsPositionArgs, elemBBox, groupPositionArgs) => {
	const startAngle = groupPositionArgs.start || 0;
	const stepAngle = groupPositionArgs.step || 20;
	return ellipseLayout(portsPositionArgs, elemBBox, startAngle, (index, count) => (index + .5 - count / 2) * stepAngle);
};
var ellipseSpread = (portsPositionArgs, elemBBox, groupPositionArgs) => {
	const startAngle = groupPositionArgs.start || 0;
	const stepAngle = groupPositionArgs.step || 360 / portsPositionArgs.length;
	return ellipseLayout(portsPositionArgs, elemBBox, startAngle, (index) => {
		return index * stepAngle;
	});
};
function ellipseLayout(portsPositionArgs, elemBBox, startAngle, stepFn) {
	const center = elemBBox.getCenter();
	const start = elemBBox.getTopCenter();
	const ratio = elemBBox.width / elemBBox.height;
	const ellipse = Ellipse$1.fromRect(elemBBox);
	const count = portsPositionArgs.length;
	return portsPositionArgs.map((item, index) => {
		const angle = startAngle + stepFn(index, count);
		const p = start.clone().rotate(-angle, center).scale(ratio, 1, center);
		const theta = item.compensateRotate ? -ellipse.tangentTheta(p) : 0;
		if (item.dx || item.dy) p.translate(item.dx || 0, item.dy || 0);
		if (item.dr) p.move(center, item.dr);
		return toResult$1(p.round(), theta, item);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-layout/line.js
var __rest$20 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var line = (portsPositionArgs, elemBBox, groupPositionArgs) => {
	return lineLayout(portsPositionArgs, normalizePoint$1(elemBBox, groupPositionArgs.start || elemBBox.getOrigin()), normalizePoint$1(elemBBox, groupPositionArgs.end || elemBBox.getCorner()), groupPositionArgs);
};
var left$2 = (portsPositionArgs, elemBBox, groupPositionArgs) => {
	return lineLayout(portsPositionArgs, elemBBox.getTopLeft(), elemBBox.getBottomLeft(), groupPositionArgs);
};
var right$2 = (portsPositionArgs, elemBBox, groupPositionArgs) => {
	return lineLayout(portsPositionArgs, elemBBox.getTopRight(), elemBBox.getBottomRight(), groupPositionArgs);
};
var top$2 = (portsPositionArgs, elemBBox, groupPositionArgs) => {
	return lineLayout(portsPositionArgs, elemBBox.getTopLeft(), elemBBox.getTopRight(), groupPositionArgs);
};
var bottom$2 = (portsPositionArgs, elemBBox, groupPositionArgs) => {
	return lineLayout(portsPositionArgs, elemBBox.getBottomLeft(), elemBBox.getBottomRight(), groupPositionArgs);
};
function lineLayout(portsPositionArgs, p1, p2, groupPositionArgs) {
	const line = new Line(p1, p2);
	const length = portsPositionArgs.length;
	return portsPositionArgs.map((_a, index) => {
		var { strict } = _a, offset = __rest$20(_a, ["strict"]);
		const ratio = strict || groupPositionArgs.strict ? (index + 1) / (length + 1) : (index + .5) / length;
		const p = line.pointAt(ratio);
		if (offset.dx || offset.dy) p.translate(offset.dx || 0, offset.dy || 0);
		return toResult$1(p.round(), 0, offset);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-layout/main.js
var main_exports$7 = /* @__PURE__ */ __exportAll({
	absolute: () => absolute,
	bottom: () => bottom$2,
	ellipse: () => ellipse,
	ellipseSpread: () => ellipseSpread,
	left: () => left$2,
	line: () => line,
	right: () => right$2,
	top: () => top$2
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-layout/index.js
var PortLayout;
(function(PortLayout) {
	PortLayout.presets = main_exports$7;
	PortLayout.registry = Registry.create({ type: "port layout" });
	PortLayout.registry.register(PortLayout.presets, true);
})(PortLayout || (PortLayout = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-label-layout/util.js
var defaults$2 = {
	position: {
		x: 0,
		y: 0
	},
	angle: 0,
	attrs: { ".": {
		y: "0",
		"text-anchor": "start"
	} }
};
function toResult(preset, args) {
	const { x, y, angle, attrs } = args || {};
	return defaultsDeep({}, {
		angle,
		attrs,
		position: {
			x,
			y
		}
	}, preset, defaults$2);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-label-layout/side.js
var manual = (portPosition, elemBBox, args) => toResult({ position: elemBBox.getTopLeft() }, args);
var left$1 = (portPosition, elemBBox, args) => toResult({
	position: {
		x: -15,
		y: 0
	},
	attrs: { ".": {
		y: ".3em",
		"text-anchor": "end"
	} }
}, args);
var right$1 = (portPosition, elemBBox, args) => toResult({
	position: {
		x: 15,
		y: 0
	},
	attrs: { ".": {
		y: ".3em",
		"text-anchor": "start"
	} }
}, args);
var top$1 = (portPosition, elemBBox, args) => toResult({
	position: {
		x: 0,
		y: -15
	},
	attrs: { ".": { "text-anchor": "middle" } }
}, args);
var bottom$1 = (portPosition, elemBBox, args) => toResult({
	position: {
		x: 0,
		y: 15
	},
	attrs: { ".": {
		y: ".6em",
		"text-anchor": "middle"
	} }
}, args);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-label-layout/inout.js
var outside = (portPosition, elemBBox, args) => outsideLayout(portPosition, elemBBox, false, args);
var outsideOriented = (portPosition, elemBBox, args) => outsideLayout(portPosition, elemBBox, true, args);
var inside = (portPosition, elemBBox, args) => insideLayout(portPosition, elemBBox, false, args);
var insideOriented = (portPosition, elemBBox, args) => insideLayout(portPosition, elemBBox, true, args);
function outsideLayout(portPosition, elemBBox, autoOrient, args) {
	const offset = args.offset != null ? args.offset : 15;
	const angle = elemBBox.getCenter().theta(portPosition);
	const bboxAngles = getBBoxAngles(elemBBox);
	let y;
	let tx;
	let ty;
	let textAnchor;
	let orientAngle = 0;
	if (angle < bboxAngles[1] || angle > bboxAngles[2]) {
		y = ".3em";
		tx = offset;
		ty = 0;
		textAnchor = "start";
	} else if (angle < bboxAngles[0]) {
		y = "0";
		tx = 0;
		ty = -offset;
		if (autoOrient) {
			orientAngle = -90;
			textAnchor = "start";
		} else textAnchor = "middle";
	} else if (angle < bboxAngles[3]) {
		y = ".3em";
		tx = -offset;
		ty = 0;
		textAnchor = "end";
	} else {
		y = ".6em";
		tx = 0;
		ty = offset;
		if (autoOrient) {
			orientAngle = 90;
			textAnchor = "start";
		} else textAnchor = "middle";
	}
	return toResult({
		position: {
			x: Math.round(tx),
			y: Math.round(ty)
		},
		angle: orientAngle,
		attrs: { ".": {
			y,
			"text-anchor": textAnchor
		} }
	}, args);
}
function insideLayout(portPosition, elemBBox, autoOrient, args) {
	const offset = args.offset != null ? args.offset : 15;
	const angle = elemBBox.getCenter().theta(portPosition);
	const bboxAngles = getBBoxAngles(elemBBox);
	let y;
	let tx;
	let ty;
	let textAnchor;
	let orientAngle = 0;
	if (angle < bboxAngles[1] || angle > bboxAngles[2]) {
		y = ".3em";
		tx = -offset;
		ty = 0;
		textAnchor = "end";
	} else if (angle < bboxAngles[0]) {
		y = ".6em";
		tx = 0;
		ty = offset;
		if (autoOrient) {
			orientAngle = 90;
			textAnchor = "start";
		} else textAnchor = "middle";
	} else if (angle < bboxAngles[3]) {
		y = ".3em";
		tx = offset;
		ty = 0;
		textAnchor = "start";
	} else {
		y = "0em";
		tx = 0;
		ty = -offset;
		if (autoOrient) {
			orientAngle = -90;
			textAnchor = "start";
		} else textAnchor = "middle";
	}
	return toResult({
		position: {
			x: Math.round(tx),
			y: Math.round(ty)
		},
		angle: orientAngle,
		attrs: { ".": {
			y,
			"text-anchor": textAnchor
		} }
	}, args);
}
function getBBoxAngles(elemBBox) {
	const center = elemBBox.getCenter();
	const tl = center.theta(elemBBox.getTopLeft());
	const bl = center.theta(elemBBox.getBottomLeft());
	const br = center.theta(elemBBox.getBottomRight());
	return [
		tl,
		center.theta(elemBBox.getTopRight()),
		br,
		bl
	];
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-label-layout/radial.js
var radial = (portPosition, elemBBox, args) => radialLayout(portPosition.diff(elemBBox.getCenter()), false, args);
var radialOriented = (portPosition, elemBBox, args) => radialLayout(portPosition.diff(elemBBox.getCenter()), true, args);
function radialLayout(portCenterOffset, autoOrient, args) {
	const offset = args.offset != null ? args.offset : 20;
	const origin = new Point(0, 0);
	const angle = -portCenterOffset.theta(origin);
	const pos = portCenterOffset.clone().move(origin, offset).diff(portCenterOffset).round();
	let y = ".3em";
	let textAnchor;
	let orientAngle = angle;
	if ((angle + 90) % 180 === 0) {
		textAnchor = autoOrient ? "end" : "middle";
		if (!autoOrient && angle === -270) y = "0em";
	} else if (angle > -270 && angle < -90) {
		textAnchor = "start";
		orientAngle = angle - 180;
	} else textAnchor = "end";
	return toResult({
		position: pos.round().toJSON(),
		angle: autoOrient ? orientAngle : 0,
		attrs: { ".": {
			y,
			"text-anchor": textAnchor
		} }
	}, args);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-label-layout/main.js
var main_exports$6 = /* @__PURE__ */ __exportAll({
	bottom: () => bottom$1,
	inside: () => inside,
	insideOriented: () => insideOriented,
	left: () => left$1,
	manual: () => manual,
	outside: () => outside,
	outsideOriented: () => outsideOriented,
	radial: () => radial,
	radialOriented: () => radialOriented,
	right: () => right$1,
	top: () => top$1
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/port-label-layout/index.js
var PortLabelLayout;
(function(PortLabelLayout) {
	PortLabelLayout.presets = main_exports$6;
	PortLabelLayout.registry = Registry.create({ type: "port label layout" });
	PortLabelLayout.registry.register(PortLabelLayout.presets, true);
})(PortLabelLayout || (PortLabelLayout = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/view/view.js
var __decorate$28 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var View = class View extends Basecoat {
	get priority() {
		return 2;
	}
	/** If need remove `this.container` DOM */
	get disposeContainer() {
		return true;
	}
	constructor() {
		super();
		this.cid = Private$2.uniqueId();
		View.views[this.cid] = this;
	}
	confirmUpdate(flag, options) {
		return 0;
	}
	empty(elem = this.container) {
		empty(elem);
		return this;
	}
	unmount(elem = this.container) {
		remove(elem);
		return this;
	}
	remove(elem = this.container) {
		if (elem === this.container) {
			this.removeEventListeners(document);
			this.onRemove();
			delete View.views[this.cid];
			if (this.disposeContainer) this.unmount(elem);
		} else this.unmount(elem);
		return this;
	}
	onRemove() {}
	setClass(className, elem = this.container) {
		elem.classList.value = Array.isArray(className) ? className.join(" ") : className;
	}
	addClass(className, elem = this.container) {
		addClass(elem, Array.isArray(className) ? className.join(" ") : className);
		return this;
	}
	removeClass(className, elem = this.container) {
		removeClass(elem, Array.isArray(className) ? className.join(" ") : className);
		return this;
	}
	setStyle(style, elem = this.container) {
		css(elem, style);
		return this;
	}
	setAttrs(attrs, elem = this.container) {
		if (attrs != null && elem != null) attr(elem, attrs);
		return this;
	}
	/**
	* Returns the value of the specified attribute of `node`.
	*
	* If the node does not set a value for attribute, start recursing up
	* the DOM tree from node to lookup for attribute at the ancestors of
	* node. If the recursion reaches CellView's root node and attribute
	* is not found even there, return `null`.
	*/
	findAttr(attrName, elem = this.container) {
		let current = elem;
		while (current && current.nodeType === 1) {
			const value = current.getAttribute(attrName);
			if (value != null) return value;
			if (current === this.container) return null;
			current = current.parentNode;
		}
		return null;
	}
	find(selector, rootElem = this.container, selectors = this.selectors) {
		return View.find(selector, rootElem, selectors).elems;
	}
	findOne(selector, rootElem = this.container, selectors = this.selectors) {
		const nodes = this.find(selector, rootElem, selectors);
		return nodes.length > 0 ? nodes[0] : null;
	}
	findByAttr(attrName, elem = this.container) {
		let node = elem;
		while (node && node.getAttribute) {
			const val = node.getAttribute(attrName);
			if ((val != null || node === this.container) && val !== "false") return node;
			node = node.parentNode;
		}
		return null;
	}
	getSelector(elem, prevSelector) {
		let selector;
		if (elem === this.container) {
			if (typeof prevSelector === "string") selector = `> ${prevSelector}`;
			return selector;
		}
		if (elem) {
			const nth = index(elem) + 1;
			selector = `${elem.tagName.toLowerCase()}:nth-child(${nth})`;
			if (prevSelector) selector += ` > ${prevSelector}`;
			selector = this.getSelector(elem.parentNode, selector);
		}
		return selector;
	}
	prefixClassName(className) {
		return Config.prefix(className);
	}
	delegateEvents(events, append) {
		if (events == null) return this;
		if (!append) this.undelegateEvents();
		const splitter = /^(\S+)\s*(.*)$/;
		Object.keys(events).forEach((key) => {
			const match = key.match(splitter);
			if (match == null) return;
			const method = this.getEventHandler(events[key]);
			if (typeof method === "function") this.delegateEvent(match[1], match[2], method);
		});
		return this;
	}
	undelegateEvents() {
		Event.off(this.container, this.getEventNamespace());
		return this;
	}
	delegateDocumentEvents(events, data) {
		this.addEventListeners(document, events, data);
		return this;
	}
	undelegateDocumentEvents() {
		this.removeEventListeners(document);
		return this;
	}
	delegateEvent(eventName, selector, listener) {
		Event.on(this.container, eventName + this.getEventNamespace(), selector, listener);
		return this;
	}
	undelegateEvent(eventName, selector, listener) {
		const name = eventName + this.getEventNamespace();
		if (selector == null) Event.off(this.container, name);
		else if (typeof selector === "string") Event.off(this.container, name, selector, listener);
		else Event.off(this.container, name, selector);
		return this;
	}
	addEventListeners(elem, events, data) {
		if (events == null) return this;
		const ns = this.getEventNamespace();
		Object.keys(events).forEach((eventName) => {
			const method = this.getEventHandler(events[eventName]);
			if (typeof method === "function") Event.on(elem, eventName + ns, data, method);
		});
		return this;
	}
	removeEventListeners(elem) {
		if (elem != null) Event.off(elem, this.getEventNamespace());
		return this;
	}
	getEventNamespace() {
		return `.${Config.prefixCls}-event-${this.cid}`;
	}
	getEventHandler(handler) {
		let method;
		if (typeof handler === "string") {
			const fn = this[handler];
			if (typeof fn === "function") method = (...args) => fn.call(this, ...args);
		} else method = (...args) => handler.call(this, ...args);
		return method;
	}
	getEventTarget(e, options = {}) {
		const { target, type, clientX = 0, clientY = 0 } = e;
		if (options.fromPoint || type === "touchmove" || type === "touchend") return document.elementFromPoint(clientX, clientY);
		return target;
	}
	stopPropagation(e) {
		this.setEventData(e, { propagationStopped: true });
		return this;
	}
	isPropagationStopped(e) {
		return this.getEventData(e).propagationStopped === true;
	}
	getEventData(e) {
		return this.eventData(e);
	}
	setEventData(e, data) {
		return this.eventData(e, data);
	}
	eventData(e, data) {
		if (e == null) throw new TypeError("Event object required");
		let currentData = e.data;
		const key = `__${this.cid}__`;
		if (data == null) {
			if (currentData == null) return {};
			return currentData[key] || {};
		}
		if (currentData == null) currentData = e.data = {};
		if (currentData[key] == null) currentData[key] = Object.assign({}, data);
		else currentData[key] = Object.assign(Object.assign({}, currentData[key]), data);
		return currentData[key];
	}
	normalizeEvent(evt) {
		return View.normalizeEvent(evt);
	}
	dispose() {
		this.remove();
	}
};
__decorate$28([View.dispose()], View.prototype, "dispose", null);
(function(View) {
	function createElement(tagName, isSvgElement) {
		return isSvgElement ? createSvgElement(tagName || "g") : createElementNS(tagName || "div");
	}
	View.createElement = createElement;
	function find(selector, rootElem, selectors) {
		if (!selector || selector === ".") return { elems: [rootElem] };
		if (selectors) {
			const nodes = selectors[selector];
			if (nodes) return { elems: Array.isArray(nodes) ? nodes : [nodes] };
		}
		if (Config.useCSSSelector) {
			const validSelector = selector.includes(">") ? `:scope ${selector}` : selector;
			return {
				isCSSSelector: true,
				elems: Array.prototype.slice.call(rootElem.querySelectorAll(validSelector))
			};
		}
		return { elems: [] };
	}
	View.find = find;
	function normalizeEvent(evt) {
		let normalizedEvent = evt;
		const originalEvent = evt.originalEvent;
		const touchEvt = originalEvent && originalEvent.changedTouches && originalEvent.changedTouches[0];
		if (touchEvt) {
			for (const key in evt) if (touchEvt[key] === void 0) touchEvt[key] = evt[key];
			normalizedEvent = touchEvt;
		}
		return normalizedEvent;
	}
	View.normalizeEvent = normalizeEvent;
})(View || (View = {}));
(function(View) {
	View.views = {};
	function getView(cid) {
		return View.views[cid] || null;
	}
	View.getView = getView;
})(View || (View = {}));
var Private$2;
(function(Private) {
	let counter = 0;
	function uniqueId() {
		const id = `v${counter}`;
		counter += 1;
		return id;
	}
	Private.uniqueId = uniqueId;
})(Private$2 || (Private$2 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/view/cache.js
var Cache = class {
	constructor(view) {
		this.view = view;
		this.clean();
	}
	clean() {
		if (this.elemCache) this.elemCache.dispose();
		this.elemCache = new Dictionary();
		this.pathCache = {};
	}
	get(elem) {
		if (!this.elemCache.has(elem)) this.elemCache.set(elem, {});
		return this.elemCache.get(elem);
	}
	getData(elem) {
		const meta = this.get(elem);
		if (!meta.data) meta.data = {};
		return meta.data;
	}
	getMatrix(elem) {
		const meta = this.get(elem);
		if (meta.matrix == null) {
			const target = this.view.container;
			meta.matrix = getTransformToParentElement(elem, target);
		}
		return createSVGMatrix(meta.matrix);
	}
	getShape(elem) {
		const meta = this.get(elem);
		if (meta.shape == null) meta.shape = Util$2.toGeometryShape(elem);
		return meta.shape.clone();
	}
	getBoundingRect(elem) {
		const meta = this.get(elem);
		if (meta.boundingRect == null) meta.boundingRect = Util$2.getBBoxV2(elem);
		return meta.boundingRect.clone();
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/view/markup.js
var Markup;
(function(Markup) {
	function isJSONMarkup(markup) {
		return markup != null && !isStringMarkup(markup);
	}
	Markup.isJSONMarkup = isJSONMarkup;
	function isStringMarkup(markup) {
		return markup != null && typeof markup === "string";
	}
	Markup.isStringMarkup = isStringMarkup;
	function clone(markup) {
		return markup == null || isStringMarkup(markup) ? markup : cloneDeep(markup);
	}
	Markup.clone = clone;
	/**
	* Removes blank space in markup to prevent create empty text node.
	*/
	function sanitize(markup) {
		return `${markup}`.trim().replace(/[\r|\n]/g, " ").replace(/>\s+</g, "><");
	}
	Markup.sanitize = sanitize;
	function parseJSONMarkup(markup, options = { ns: ns.svg }) {
		const fragment = document.createDocumentFragment();
		const groups = {};
		const selectors = {};
		const queue = [{
			markup: Array.isArray(markup) ? markup : [markup],
			parent: fragment,
			ns: options.ns
		}];
		while (queue.length > 0) {
			const item = queue.pop();
			let ns$1 = item.ns || ns.svg;
			const defines = item.markup;
			const parentNode = item.parent;
			defines.forEach((define) => {
				const tagName = define.tagName;
				if (!tagName) throw new TypeError("Invalid tagName");
				if (define.ns) ns$1 = define.ns;
				const node = ns$1 ? createElementNS(tagName, ns$1) : createElement(tagName);
				const attrs = define.attrs;
				if (attrs) attr(node, kebablizeAttrs(attrs));
				const style = define.style;
				if (style) css(node, style);
				const className = define.className;
				if (className != null) node.setAttribute("class", Array.isArray(className) ? className.join(" ") : className);
				if (define.textContent) node.textContent = define.textContent;
				const selector = define.selector;
				if (selector != null) {
					if (selectors[selector]) throw new TypeError("Selector must be unique");
					selectors[selector] = node;
				}
				if (define.groupSelector) {
					let nodeGroups = define.groupSelector;
					if (!Array.isArray(nodeGroups)) nodeGroups = [nodeGroups];
					nodeGroups.forEach((name) => {
						if (!groups[name]) groups[name] = [];
						groups[name].push(node);
					});
				}
				parentNode.appendChild(node);
				const children = define.children;
				if (Array.isArray(children)) queue.push({
					ns: ns$1,
					markup: children,
					parent: node
				});
			});
		}
		Object.keys(groups).forEach((groupName) => {
			if (selectors[groupName]) throw new Error("Ambiguous group selector");
			selectors[groupName] = groups[groupName];
		});
		return {
			fragment,
			selectors,
			groups
		};
	}
	Markup.parseJSONMarkup = parseJSONMarkup;
	function createContainer(firstChild) {
		return firstChild instanceof SVGElement ? createSvgElement("g") : createElement("div");
	}
	function renderMarkup(markup) {
		if (isStringMarkup(markup)) {
			const nodes = Vector.createVectors(markup);
			const count = nodes.length;
			if (count === 1) return { elem: nodes[0].node };
			if (count > 1) {
				const elem = createContainer(nodes[0].node);
				nodes.forEach((node) => {
					elem.appendChild(node.node);
				});
				return { elem };
			}
			return {};
		}
		const result = parseJSONMarkup(markup);
		const fragment = result.fragment;
		let elem = null;
		if (fragment.childNodes.length > 1) {
			elem = createContainer(fragment.firstChild);
			elem.appendChild(fragment);
		} else elem = fragment.firstChild;
		return {
			elem,
			selectors: result.selectors
		};
	}
	Markup.renderMarkup = renderMarkup;
	function parseLabelStringMarkup(markup) {
		const children = Vector.createVectors(markup);
		const fragment = document.createDocumentFragment();
		for (let i = 0, n = children.length; i < n; i += 1) {
			const currentChild = children[i].node;
			fragment.appendChild(currentChild);
		}
		return {
			fragment,
			selectors: {}
		};
	}
	Markup.parseLabelStringMarkup = parseLabelStringMarkup;
})(Markup || (Markup = {}));
(function(Markup) {
	function getSelector(elem, stop, prev) {
		if (elem != null) {
			let selector;
			const tagName = elem.tagName.toLowerCase();
			if (elem === stop) {
				if (typeof prev === "string") selector = `> ${tagName} > ${prev}`;
				else selector = `> ${tagName}`;
				return selector;
			}
			const parent = elem.parentNode;
			if (parent && parent.childNodes.length > 1) selector = `${tagName}:nth-child(${index(elem) + 1})`;
			else selector = tagName;
			if (prev) selector += ` > ${prev}`;
			return getSelector(elem.parentNode, stop, selector);
		}
		return prev;
	}
	Markup.getSelector = getSelector;
})(Markup || (Markup = {}));
(function(Markup) {
	function getPortContainerMarkup() {
		return "g";
	}
	Markup.getPortContainerMarkup = getPortContainerMarkup;
	function getPortMarkup() {
		return {
			tagName: "circle",
			selector: "circle",
			attrs: {
				r: 10,
				fill: "#FFFFFF",
				stroke: "#000000"
			}
		};
	}
	Markup.getPortMarkup = getPortMarkup;
	function getPortLabelMarkup() {
		return {
			tagName: "text",
			selector: "text",
			attrs: { fill: "#000000" }
		};
	}
	Markup.getPortLabelMarkup = getPortLabelMarkup;
})(Markup || (Markup = {}));
(function(Markup) {
	function getEdgeMarkup() {
		return [{
			tagName: "path",
			selector: "wrap",
			groupSelector: "lines",
			attrs: {
				fill: "none",
				cursor: "pointer",
				stroke: "transparent",
				strokeLinecap: "round"
			}
		}, {
			tagName: "path",
			selector: "line",
			groupSelector: "lines",
			attrs: {
				fill: "none",
				pointerEvents: "none"
			}
		}];
	}
	Markup.getEdgeMarkup = getEdgeMarkup;
})(Markup || (Markup = {}));
(function(Markup) {
	function getForeignObjectMarkup(bare = false) {
		return {
			tagName: "foreignObject",
			selector: "fo",
			children: [{
				ns: ns.xhtml,
				tagName: "body",
				selector: "foBody",
				attrs: { xmlns: ns.xhtml },
				style: {
					width: "100%",
					height: "100%",
					background: "transparent"
				},
				children: bare ? [] : [{
					tagName: "div",
					selector: "foContent",
					style: {
						width: "100%",
						height: "100%"
					}
				}]
			}]
		};
	}
	Markup.getForeignObjectMarkup = getForeignObjectMarkup;
})(Markup || (Markup = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/view/attr.js
var AttrManager = class {
	constructor(view) {
		this.view = view;
	}
	get cell() {
		return this.view.cell;
	}
	getDefinition(attrName) {
		return this.cell.getAttrDefinition(attrName);
	}
	processAttrs(elem, raw) {
		let normal;
		let set;
		let offset;
		let position;
		const specials = [];
		Object.keys(raw).forEach((name) => {
			const val = raw[name];
			const definition = this.getDefinition(name);
			const isValid = call$1(Attr.isValidDefinition, this.view, definition, val, {
				elem,
				attrs: raw,
				cell: this.cell,
				view: this.view
			});
			if (definition && isValid) {
				if (typeof definition === "string") {
					if (normal == null) normal = {};
					normal[definition] = val;
				} else if (val !== null) specials.push({
					name,
					definition
				});
			} else {
				if (normal == null) normal = {};
				const normalName = CASE_SENSITIVE_ATTR.includes(name) ? name : kebabCase(name);
				normal[normalName] = val;
			}
		});
		specials.forEach(({ name, definition }) => {
			const val = raw[name];
			if (typeof definition.set === "function") {
				if (set == null) set = {};
				set[name] = val;
			}
			if (typeof definition.offset === "function") {
				if (offset == null) offset = {};
				offset[name] = val;
			}
			if (typeof definition.position === "function") {
				if (position == null) position = {};
				position[name] = val;
			}
		});
		return {
			raw,
			normal,
			set,
			offset,
			position
		};
	}
	mergeProcessedAttrs(allProcessedAttrs, roProcessedAttrs) {
		allProcessedAttrs.set = Object.assign(Object.assign({}, allProcessedAttrs.set), roProcessedAttrs.set);
		allProcessedAttrs.position = Object.assign(Object.assign({}, allProcessedAttrs.position), roProcessedAttrs.position);
		allProcessedAttrs.offset = Object.assign(Object.assign({}, allProcessedAttrs.offset), roProcessedAttrs.offset);
		const transform = allProcessedAttrs.normal && allProcessedAttrs.normal.transform;
		if (transform != null && roProcessedAttrs.normal) roProcessedAttrs.normal.transform = transform;
		allProcessedAttrs.normal = roProcessedAttrs.normal;
	}
	findAttrs(cellAttrs, rootNode, selectorCache, selectors) {
		const merge$1 = [];
		const result = new Dictionary();
		Object.keys(cellAttrs).forEach((selector) => {
			const attrs = cellAttrs[selector];
			if (!isPlainObject(attrs)) return;
			const { isCSSSelector, elems } = View.find(selector, rootNode, selectors);
			selectorCache[selector] = elems;
			for (let i = 0, l = elems.length; i < l; i += 1) {
				const elem = elems[i];
				const unique = selectors && selectors[selector] === elem;
				const prev = result.get(elem);
				if (prev) {
					if (!prev.array) {
						merge$1.push(elem);
						prev.array = true;
						prev.attrs = [prev.attrs];
						prev.priority = [prev.priority];
					}
					const attributes = prev.attrs;
					const selectedLength = prev.priority;
					if (unique) {
						attributes.unshift(attrs);
						selectedLength.unshift(-1);
					} else {
						const sortIndex = sortedIndex(selectedLength, isCSSSelector ? -1 : l);
						attributes.splice(sortIndex, 0, attrs);
						selectedLength.splice(sortIndex, 0, l);
					}
				} else result.set(elem, {
					elem,
					attrs,
					priority: unique ? -1 : l,
					array: false
				});
			}
		});
		merge$1.forEach((node) => {
			const item = result.get(node);
			item.attrs = item.attrs.reduceRight((memo, attrs) => merge(memo, attrs), {});
		});
		return result;
	}
	updateRelativeAttrs(elem, processedAttrs, refBBox) {
		const rawAttrs = processedAttrs.raw || {};
		let nodeAttrs = processedAttrs.normal || {};
		const setAttrs = processedAttrs.set;
		const positionAttrs = processedAttrs.position;
		const offsetAttrs = processedAttrs.offset;
		const getOptions = () => ({
			elem,
			cell: this.cell,
			view: this.view,
			attrs: rawAttrs,
			refBBox: refBBox.clone()
		});
		if (setAttrs != null) Object.keys(setAttrs).forEach((name) => {
			const val = setAttrs[name];
			const def = this.getDefinition(name);
			if (def != null) {
				const ret = call$1(def.set, this.view, val, getOptions());
				if (typeof ret === "object") nodeAttrs = Object.assign(Object.assign({}, nodeAttrs), ret);
				else if (ret != null) nodeAttrs[name] = ret;
			}
		});
		if (elem instanceof HTMLElement) {
			this.view.setAttrs(nodeAttrs, elem);
			return;
		}
		const nodeTransform = nodeAttrs.transform;
		const nodeMatrix = transformStringToMatrix(nodeTransform ? `${nodeTransform}` : null);
		const nodePosition = new Point(nodeMatrix.e, nodeMatrix.f);
		if (nodeTransform) {
			delete nodeAttrs.transform;
			nodeMatrix.e = 0;
			nodeMatrix.f = 0;
		}
		let positioned = false;
		if (positionAttrs != null) Object.keys(positionAttrs).forEach((name) => {
			const val = positionAttrs[name];
			const def = this.getDefinition(name);
			if (def != null) {
				const ts = call$1(def.position, this.view, val, getOptions());
				if (ts != null) {
					positioned = true;
					nodePosition.translate(Point.create(ts));
				}
			}
		});
		this.view.setAttrs(nodeAttrs, elem);
		let offseted = false;
		if (offsetAttrs != null) {
			const nodeBoundingRect = this.view.getBoundingRectOfElement(elem);
			if (nodeBoundingRect.width > 0 && nodeBoundingRect.height > 0) {
				const nodeBBox = Util$2.transformRectangle(nodeBoundingRect, nodeMatrix);
				Object.keys(offsetAttrs).forEach((name) => {
					const val = offsetAttrs[name];
					const def = this.getDefinition(name);
					if (def != null) {
						const ts = call$1(def.offset, this.view, val, {
							elem,
							cell: this.cell,
							view: this.view,
							attrs: rawAttrs,
							refBBox: nodeBBox
						});
						if (ts != null) {
							offseted = true;
							nodePosition.translate(Point.create(ts));
						}
					}
				});
			}
		}
		if (nodeTransform != null || positioned || offseted) {
			nodePosition.round(1);
			nodeMatrix.e = Number.isFinite(nodePosition.x) ? nodePosition.x : 0;
			nodeMatrix.f = Number.isFinite(nodePosition.y) ? nodePosition.y : 0;
			elem.setAttribute("transform", matrixToTransformString(nodeMatrix));
		}
	}
	update(rootNode, attrs, options) {
		const selectorCache = {};
		const nodesAttrs = this.findAttrs(options.attrs || attrs, rootNode, selectorCache, options.selectors);
		const nodesAllAttrs = options.attrs ? this.findAttrs(attrs, rootNode, selectorCache, options.selectors) : nodesAttrs;
		const specialItems = [];
		nodesAttrs.each((data) => {
			const node = data.elem;
			const nodeAttrs = data.attrs;
			const processed = this.processAttrs(node, nodeAttrs);
			if (processed.set == null && processed.position == null && processed.offset == null) this.view.setAttrs(processed.normal, node);
			else {
				const data = nodesAllAttrs.get(node);
				const nodeAllAttrs = data ? data.attrs : null;
				const refSelector = nodeAllAttrs && nodeAttrs.ref == null ? nodeAllAttrs.ref : nodeAttrs.ref;
				let refNode;
				if (refSelector) {
					refNode = (selectorCache[refSelector] || this.view.find(refSelector, rootNode, options.selectors))[0];
					if (!refNode) throw new Error(`"${refSelector}" reference does not exist.`);
				} else refNode = null;
				const item = {
					node,
					refNode,
					attributes: nodeAllAttrs,
					processedAttributes: processed
				};
				const index = specialItems.findIndex((item) => item.refNode === node);
				if (index > -1) specialItems.splice(index, 0, item);
				else specialItems.push(item);
			}
		});
		const bboxCache = new Dictionary();
		let rotatableMatrix;
		specialItems.forEach((item) => {
			const node = item.node;
			const refNode = item.refNode;
			let unrotatedRefBBox;
			const isRefNodeRotatable = refNode != null && options.rotatableNode != null && contains(options.rotatableNode, refNode);
			if (refNode) unrotatedRefBBox = bboxCache.get(refNode);
			if (!unrotatedRefBBox) {
				const target = isRefNodeRotatable ? options.rotatableNode : rootNode;
				unrotatedRefBBox = refNode ? Util$2.getBBox(refNode, { target }) : options.rootBBox;
				if (refNode) bboxCache.set(refNode, unrotatedRefBBox);
			}
			let processedAttrs;
			if (options.attrs && item.attributes) {
				processedAttrs = this.processAttrs(node, item.attributes);
				this.mergeProcessedAttrs(processedAttrs, item.processedAttributes);
			} else processedAttrs = item.processedAttributes;
			let refBBox = unrotatedRefBBox;
			if (isRefNodeRotatable && options.rotatableNode != null && !options.rotatableNode.contains(node)) {
				if (!rotatableMatrix) rotatableMatrix = transformStringToMatrix(attr(options.rotatableNode, "transform"));
				refBBox = Util$2.transformRectangle(unrotatedRefBBox, rotatableMatrix);
			}
			this.updateRelativeAttrs(node, processedAttrs, refBBox);
		});
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/view/flag.js
var FlagManager = class {
	get cell() {
		return this.view.cell;
	}
	constructor(view, actions, bootstrap = []) {
		this.view = view;
		const flags = {};
		const attrs = {};
		let shift = 0;
		Object.keys(actions).forEach((attr) => {
			let labels = actions[attr];
			if (!Array.isArray(labels)) labels = [labels];
			labels.forEach((label) => {
				let flag = flags[label];
				if (!flag) {
					shift += 1;
					flag = flags[label] = 1 << shift;
				}
				attrs[attr] |= flag;
			});
		});
		let labels = bootstrap;
		if (!Array.isArray(labels)) labels = [labels];
		labels.forEach((label) => {
			if (!flags[label]) {
				shift += 1;
				flags[label] = 1 << shift;
			}
		});
		if (shift > 25) throw new Error("Maximum number of flags exceeded.");
		this.flags = flags;
		this.attrs = attrs;
		this.bootstrap = bootstrap;
	}
	getFlag(label) {
		const flags = this.flags;
		if (flags == null) return 0;
		if (Array.isArray(label)) return label.reduce((memo, key) => memo | flags[key], 0);
		return flags[label] | 0;
	}
	hasAction(flag, label) {
		return flag & this.getFlag(label);
	}
	removeAction(flag, label) {
		return flag ^ flag & this.getFlag(label);
	}
	getBootstrapFlag() {
		return this.getFlag(this.bootstrap);
	}
	getChangedFlag() {
		let flag = 0;
		if (!this.attrs) return flag;
		Object.keys(this.attrs).forEach((attr) => {
			if (this.cell.hasChanged(attr)) flag |= this.attrs[attr];
		});
		return flag;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/view/cell.js
var __decorate$27 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest$19 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var CellView = class CellView extends View {
	static getDefaults() {
		return this.defaults;
	}
	static config(options) {
		this.defaults = this.getOptions(options);
	}
	static getOptions(options) {
		const mergeActions = (arr1, arr2) => {
			if (arr2 != null) return uniq([...Array.isArray(arr1) ? arr1 : [arr1], ...Array.isArray(arr2) ? arr2 : [arr2]]);
			return Array.isArray(arr1) ? [...arr1] : [arr1];
		};
		const ret = cloneDeep(this.getDefaults());
		const { bootstrap, actions, events, documentEvents } = options, others = __rest$19(options, [
			"bootstrap",
			"actions",
			"events",
			"documentEvents"
		]);
		if (bootstrap) ret.bootstrap = mergeActions(ret.bootstrap, bootstrap);
		if (actions) Object.entries(actions).forEach(([key, val]) => {
			const raw = ret.actions[key];
			if (val && raw) ret.actions[key] = mergeActions(raw, val);
			else if (val) ret.actions[key] = mergeActions(val);
		});
		if (events) ret.events = Object.assign(Object.assign({}, ret.events), events);
		if (options.documentEvents) ret.documentEvents = Object.assign(Object.assign({}, ret.documentEvents), documentEvents);
		return merge(ret, others);
	}
	get [Symbol.toStringTag]() {
		return CellView.toStringTag;
	}
	constructor(cell, options = {}) {
		super();
		this.cell = cell;
		this.options = this.ensureOptions(options);
		this.graph = this.options.graph;
		this.attr = new AttrManager(this);
		this.flag = new FlagManager(this, this.options.actions, this.options.bootstrap);
		this.cache = new Cache(this);
		this.setContainer(this.ensureContainer());
		this.setup();
		this.init();
	}
	init() {}
	onRemove() {
		this.removeTools();
	}
	get priority() {
		return this.options.priority;
	}
	get rootSelector() {
		return this.options.rootSelector;
	}
	getConstructor() {
		return this.constructor;
	}
	ensureOptions(options) {
		return this.getConstructor().getOptions(options);
	}
	getContainerTagName() {
		return this.options.isSvgElement ? "g" : "div";
	}
	getContainerStyle() {}
	getContainerAttrs() {
		return {
			"data-cell-id": this.cell.id,
			"data-shape": this.cell.shape
		};
	}
	getContainerClassName() {
		return this.prefixClassName("cell");
	}
	ensureContainer() {
		return View.createElement(this.getContainerTagName(), this.options.isSvgElement);
	}
	setContainer(container) {
		if (this.container !== container) {
			this.undelegateEvents();
			this.container = container;
			if (this.options.events != null) this.delegateEvents(this.options.events);
			const attrs = this.getContainerAttrs();
			if (attrs != null) this.setAttrs(attrs, container);
			const style = this.getContainerStyle();
			if (style != null) this.setStyle(style, container);
			const className = this.getContainerClassName();
			if (className != null) this.addClass(className, container);
		}
		return this;
	}
	isNodeView() {
		return false;
	}
	isEdgeView() {
		return false;
	}
	render() {
		return this;
	}
	confirmUpdate(flag, options = {}) {
		return 0;
	}
	getBootstrapFlag() {
		return this.flag.getBootstrapFlag();
	}
	getFlag(actions) {
		return this.flag.getFlag(actions);
	}
	hasAction(flag, actions) {
		return this.flag.hasAction(flag, actions);
	}
	removeAction(flag, actions) {
		return this.flag.removeAction(flag, actions);
	}
	handleAction(flag, action, handle, additionalRemovedActions) {
		if (this.hasAction(flag, action)) {
			handle();
			const removedFlags = [action];
			if (additionalRemovedActions) if (typeof additionalRemovedActions === "string") removedFlags.push(additionalRemovedActions);
			else removedFlags.push(...additionalRemovedActions);
			return this.removeAction(flag, removedFlags);
		}
		return flag;
	}
	setup() {
		this.cell.on("changed", this.onCellChanged, this);
	}
	onCellChanged({ options }) {
		this.onAttrsChange(options);
	}
	onAttrsChange(options) {
		let flag = this.flag.getChangedFlag();
		if (options.updated || !flag) return;
		if (options.dirty && this.hasAction(flag, "update")) flag |= this.getFlag("render");
		if (options.toolId) options.async = false;
		if (this.graph != null) this.graph.renderer.requestViewUpdate(this, flag, options);
	}
	parseJSONMarkup(markup, rootElem) {
		const result = Markup.parseJSONMarkup(markup);
		const selectors = result.selectors;
		const rootSelector = this.rootSelector;
		if (rootElem && rootSelector) {
			if (selectors[rootSelector]) throw new Error("Invalid root selector");
			selectors[rootSelector] = rootElem;
		}
		return result;
	}
	can(feature) {
		let interacting = this.graph.options.interacting;
		if (typeof interacting === "function") interacting = call$1(interacting, this.graph, this);
		if (typeof interacting === "object") {
			let val = interacting[feature];
			if (typeof val === "function") val = call$1(val, this.graph, this);
			return val !== false;
		}
		if (typeof interacting === "boolean") return interacting;
		return false;
	}
	cleanCache() {
		this.cache.clean();
		return this;
	}
	getCache(elem) {
		return this.cache.get(elem);
	}
	getDataOfElement(elem) {
		return this.cache.getData(elem);
	}
	getMatrixOfElement(elem) {
		return this.cache.getMatrix(elem);
	}
	getShapeOfElement(elem) {
		return this.cache.getShape(elem);
	}
	getBoundingRectOfElement(elem) {
		return this.cache.getBoundingRect(elem);
	}
	getBBoxOfElement(elem) {
		const rect = this.getBoundingRectOfElement(elem);
		const matrix = this.getMatrixOfElement(elem);
		const rm = this.getRootRotatedMatrix();
		const tm = this.getRootTranslatedMatrix();
		return Util$2.transformRectangle(rect, tm.multiply(rm).multiply(matrix));
	}
	getUnrotatedBBoxOfElement(elem) {
		const rect = this.getBoundingRectOfElement(elem);
		const matrix = this.getMatrixOfElement(elem);
		const tm = this.getRootTranslatedMatrix();
		return Util$2.transformRectangle(rect, tm.multiply(matrix));
	}
	getBBox(options = {}) {
		let bbox;
		if (options.useCellGeometry) {
			const cell = this.cell;
			const angle = cell.isNode() ? cell.getAngle() : 0;
			bbox = cell.getBBox().bbox(angle);
		} else bbox = this.getBBoxOfElement(this.container);
		return this.graph.coord.localToGraphRect(bbox);
	}
	getRootTranslatedMatrix() {
		const cell = this.cell;
		const pos = cell.isNode() ? cell.getPosition() : {
			x: 0,
			y: 0
		};
		return createSVGMatrix().translate(pos.x, pos.y);
	}
	getRootRotatedMatrix() {
		let matrix = createSVGMatrix();
		const cell = this.cell;
		const angle = cell.isNode() ? cell.getAngle() : 0;
		if (angle) {
			const bbox = cell.getBBox();
			const cx = bbox.width / 2;
			const cy = bbox.height / 2;
			matrix = matrix.translate(cx, cy).rotate(angle).translate(-cx, -cy);
		}
		return matrix;
	}
	findMagnet(elem = this.container) {
		return this.findByAttr("magnet", elem);
	}
	updateAttrs(rootNode, attrs, options = {}) {
		if (options.rootBBox == null) options.rootBBox = new Rectangle();
		if (options.selectors == null) options.selectors = this.selectors;
		this.attr.update(rootNode, attrs, options);
	}
	isEdgeElement(magnet) {
		return this.cell.isEdge() && (magnet == null || magnet === this.container);
	}
	prepareHighlight(elem, options = {}) {
		const magnet = elem || this.container;
		options.partial = magnet === this.container;
		return magnet;
	}
	highlight(elem, options = {}) {
		const magnet = this.prepareHighlight(elem, options);
		this.notify("cell:highlight", {
			magnet,
			options,
			view: this,
			cell: this.cell
		});
		if (this.isEdgeView()) this.notify("edge:highlight", {
			magnet,
			options,
			view: this,
			edge: this.cell,
			cell: this.cell
		});
		else if (this.isNodeView()) this.notify("node:highlight", {
			magnet,
			options,
			view: this,
			node: this.cell,
			cell: this.cell
		});
		return this;
	}
	unhighlight(elem, options = {}) {
		const magnet = this.prepareHighlight(elem, options);
		this.notify("cell:unhighlight", {
			magnet,
			options,
			view: this,
			cell: this.cell
		});
		if (this.isNodeView()) this.notify("node:unhighlight", {
			magnet,
			options,
			view: this,
			node: this.cell,
			cell: this.cell
		});
		else if (this.isEdgeView()) this.notify("edge:unhighlight", {
			magnet,
			options,
			view: this,
			edge: this.cell,
			cell: this.cell
		});
		return this;
	}
	notifyUnhighlight(magnet, options) {}
	getEdgeTerminal(magnet, x, y, edge, type) {
		const cell = this.cell;
		const portId = this.findAttr("port", magnet);
		const selector = magnet.getAttribute("data-selector");
		const terminal = { cell: cell.id };
		if (selector != null) terminal.magnet = selector;
		if (portId != null) {
			terminal.port = portId;
			if (cell.isNode()) {
				if (!cell.hasPort(portId) && selector == null) terminal.selector = this.getSelector(magnet);
			}
		} else if (selector == null && this.container !== magnet) terminal.selector = this.getSelector(magnet);
		return terminal;
	}
	getMagnetFromEdgeTerminal(terminal) {
		const cell = this.cell;
		const root = this.container;
		const portId = terminal.port;
		let selector = terminal.magnet;
		let magnet;
		if (portId != null && cell.isNode() && cell.hasPort(portId)) magnet = this.findPortElem(portId, selector) || root;
		else {
			if (!selector) selector = terminal.selector;
			if (!selector && portId != null) selector = `[port="${portId}"]`;
			magnet = this.findOne(selector, root, this.selectors);
		}
		return magnet;
	}
	hasTools(name) {
		const tools = this.tools;
		if (tools == null) return false;
		if (name == null) return true;
		return tools.name === name;
	}
	addTools(config) {
		this.removeTools();
		if (config) {
			if (!this.can("toolsAddable")) return this;
			const tools = ToolsView.isToolsView(config) ? config : new ToolsView(config);
			this.tools = tools;
			tools.config({ view: this });
			tools.mount();
		}
		return this;
	}
	updateTools(options = {}) {
		if (this.tools) this.tools.update(options);
		return this;
	}
	removeTools() {
		if (this.tools) {
			this.tools.remove();
			this.tools = null;
		}
		return this;
	}
	hideTools() {
		if (this.tools) this.tools.hide();
		return this;
	}
	showTools() {
		if (this.tools) this.tools.show();
		return this;
	}
	renderTools() {
		const tools = this.cell.getTools();
		this.addTools(tools);
		return this;
	}
	notify(name, args) {
		this.trigger(name, args);
		this.graph.trigger(name, args);
		return this;
	}
	getEventArgs(e, x, y) {
		const view = this;
		const cell = view.cell;
		if (x == null || y == null) return {
			e,
			view,
			cell
		};
		return {
			e,
			x,
			y,
			view,
			cell
		};
	}
	onClick(e, x, y) {
		this.notify("cell:click", this.getEventArgs(e, x, y));
	}
	onDblClick(e, x, y) {
		this.notify("cell:dblclick", this.getEventArgs(e, x, y));
	}
	onContextMenu(e, x, y) {
		this.notify("cell:contextmenu", this.getEventArgs(e, x, y));
	}
	onMouseDown(e, x, y) {
		if (this.cell.model) {
			this.cachedModelForMouseEvent = this.cell.model;
			this.cachedModelForMouseEvent.startBatch("mouse");
		}
		this.notify("cell:mousedown", this.getEventArgs(e, x, y));
	}
	onMouseUp(e, x, y) {
		this.notify("cell:mouseup", this.getEventArgs(e, x, y));
		if (this.cachedModelForMouseEvent) {
			this.cachedModelForMouseEvent.stopBatch("mouse", { cell: this.cell });
			this.cachedModelForMouseEvent = null;
		}
	}
	onMouseMove(e, x, y) {
		this.notify("cell:mousemove", this.getEventArgs(e, x, y));
	}
	onMouseOver(e) {
		this.notify("cell:mouseover", this.getEventArgs(e));
	}
	onMouseOut(e) {
		this.notify("cell:mouseout", this.getEventArgs(e));
	}
	onMouseEnter(e) {
		this.notify("cell:mouseenter", this.getEventArgs(e));
	}
	onMouseLeave(e) {
		this.notify("cell:mouseleave", this.getEventArgs(e));
	}
	onMouseWheel(e, x, y, delta) {
		this.notify("cell:mousewheel", Object.assign({ delta }, this.getEventArgs(e, x, y)));
	}
	onCustomEvent(e, name, x, y) {
		this.notify("cell:customevent", Object.assign({ name }, this.getEventArgs(e, x, y)));
		this.notify(name, Object.assign({}, this.getEventArgs(e, x, y)));
	}
	onMagnetMouseDown(e, magnet, x, y) {}
	onMagnetDblClick(e, magnet, x, y) {}
	onMagnetContextMenu(e, magnet, x, y) {}
	onLabelMouseDown(e, x, y) {}
	checkMouseleave(e) {
		const target = this.getEventTarget(e, { fromPoint: true });
		const view = this.graph.findViewByElem(target);
		if (view === this) return;
		this.onMouseLeave(e);
		if (!view) return;
		view.onMouseEnter(e);
	}
	dispose() {
		this.cell.off("changed", this.onCellChanged, this);
	}
};
CellView.defaults = {
	isSvgElement: true,
	rootSelector: "root",
	priority: 0,
	bootstrap: [],
	actions: {}
};
__decorate$27([CellView.dispose()], CellView.prototype, "dispose", null);
(function(CellView) {
	CellView.Flag = FlagManager;
	CellView.Attr = AttrManager;
})(CellView || (CellView = {}));
(function(CellView) {
	CellView.toStringTag = `X6.${CellView.name}`;
	function isCellView(instance) {
		if (instance == null) return false;
		if (instance instanceof CellView) return true;
		const tag = instance[Symbol.toStringTag];
		const view = instance;
		if ((tag == null || tag === CellView.toStringTag) && typeof view.isNodeView === "function" && typeof view.isEdgeView === "function" && typeof view.confirmUpdate === "function") return true;
		return false;
	}
	CellView.isCellView = isCellView;
})(CellView || (CellView = {}));
(function(CellView) {
	function priority(value) {
		return function(ctor) {
			ctor.config({ priority: value });
		};
	}
	CellView.priority = priority;
	function bootstrap(actions) {
		return function(ctor) {
			ctor.config({ bootstrap: actions });
		};
	}
	CellView.bootstrap = bootstrap;
})(CellView || (CellView = {}));
(function(CellView) {
	CellView.registry = Registry.create({ type: "view" });
})(CellView || (CellView = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/view/tool.js
var ToolsView = class ToolsView extends View {
	get name() {
		return this.options.name;
	}
	get graph() {
		return this.cellView.graph;
	}
	get cell() {
		return this.cellView.cell;
	}
	get [Symbol.toStringTag]() {
		return ToolsView.toStringTag;
	}
	constructor(options = {}) {
		super();
		this.svgContainer = this.createContainer(true, options);
		this.htmlContainer = this.createContainer(false, options);
		this.config(options);
	}
	createContainer(svg, options) {
		const container = svg ? View.createElement("g", true) : View.createElement("div", false);
		addClass(container, this.prefixClassName("cell-tools"));
		if (options.className) addClass(container, options.className);
		return container;
	}
	config(options) {
		this.options = Object.assign(Object.assign({}, this.options), options);
		if (!CellView.isCellView(options.view) || options.view === this.cellView) return this;
		this.cellView = options.view;
		if (this.cell.isEdge()) {
			addClass(this.svgContainer, this.prefixClassName("edge-tools"));
			addClass(this.htmlContainer, this.prefixClassName("edge-tools"));
		} else if (this.cell.isNode()) {
			addClass(this.svgContainer, this.prefixClassName("node-tools"));
			addClass(this.htmlContainer, this.prefixClassName("node-tools"));
		}
		this.svgContainer.setAttribute("data-cell-id", this.cell.id);
		this.htmlContainer.setAttribute("data-cell-id", this.cell.id);
		if (this.name) {
			this.svgContainer.setAttribute("data-tools-name", this.name);
			this.htmlContainer.setAttribute("data-tools-name", this.name);
		}
		const tools = this.options.items;
		if (!Array.isArray(tools)) return this;
		this.tools = [];
		const normalizedTools = [];
		tools.forEach((meta) => {
			if (ToolsView.ToolItem.isToolItem(meta)) if (meta.name === "vertices") normalizedTools.unshift(meta);
			else normalizedTools.push(meta);
			else if ((typeof meta === "object" ? meta.name : meta) === "vertices") normalizedTools.unshift(meta);
			else normalizedTools.push(meta);
		});
		for (let i = 0; i < normalizedTools.length; i += 1) {
			const meta = normalizedTools[i];
			let tool;
			if (ToolsView.ToolItem.isToolItem(meta)) tool = meta;
			else {
				const name = typeof meta === "object" ? meta.name : meta;
				const args = typeof meta === "object" ? meta.args || {} : {};
				if (name) {
					if (this.cell.isNode()) {
						const ctor = NodeTool.registry.get(name);
						if (ctor) tool = new ctor(args);
						else return NodeTool.registry.onNotFound(name);
					} else if (this.cell.isEdge()) {
						const ctor = EdgeTool.registry.get(name);
						if (ctor) tool = new ctor(args);
						else return EdgeTool.registry.onNotFound(name);
					}
				}
			}
			if (tool) {
				tool.config(this.cellView, this);
				tool.render();
				(tool.options.isSVGElement !== false ? this.svgContainer : this.htmlContainer).appendChild(tool.container);
				this.tools.push(tool);
			}
		}
		return this;
	}
	update(options = {}) {
		const tools = this.tools;
		if (tools) tools.forEach((tool) => {
			if (options.toolId !== tool.cid && tool.isVisible()) tool.update();
		});
		return this;
	}
	focus(focusedTool) {
		const tools = this.tools;
		if (tools) tools.forEach((tool) => {
			if (focusedTool === tool) tool.show();
			else tool.hide();
		});
		return this;
	}
	blur(blurredTool) {
		const tools = this.tools;
		if (tools) tools.forEach((tool) => {
			if (tool !== blurredTool && !tool.isVisible()) {
				tool.show();
				tool.update();
			}
		});
		return this;
	}
	hide() {
		return this.focus(null);
	}
	show() {
		return this.blur(null);
	}
	remove() {
		const tools = this.tools;
		if (tools) {
			tools.forEach((tool) => tool.remove());
			this.tools = null;
		}
		remove(this.svgContainer);
		remove(this.htmlContainer);
		return super.remove();
	}
	mount() {
		const tools = this.tools;
		const cellView = this.cellView;
		if (cellView && tools) {
			const hasSVG = tools.some((tool) => tool.options.isSVGElement !== false);
			const hasHTML = tools.some((tool) => tool.options.isSVGElement === false);
			if (hasSVG) (this.options.local ? cellView.container : cellView.graph.view.decorator).appendChild(this.svgContainer);
			if (hasHTML) this.graph.container.appendChild(this.htmlContainer);
		}
		return this;
	}
};
(function(ToolsView) {
	ToolsView.toStringTag = `X6.${ToolsView.name}`;
	function isToolsView(instance) {
		if (instance == null) return false;
		if (instance instanceof ToolsView) return true;
		const tag = instance[Symbol.toStringTag];
		const view = instance;
		if ((tag == null || tag === ToolsView.toStringTag) && view.graph != null && view.cell != null && typeof view.config === "function" && typeof view.update === "function" && typeof view.focus === "function" && typeof view.blur === "function" && typeof view.show === "function" && typeof view.hide === "function") return true;
		return false;
	}
	ToolsView.isToolsView = isToolsView;
})(ToolsView || (ToolsView = {}));
(function(ToolsView) {
	class ToolItem extends View {
		static getDefaults() {
			return this.defaults;
		}
		static config(options) {
			this.defaults = this.getOptions(options);
		}
		static getOptions(options) {
			return merge(cloneDeep(this.getDefaults()), options);
		}
		get graph() {
			return this.cellView.graph;
		}
		get cell() {
			return this.cellView.cell;
		}
		get name() {
			return this.options.name;
		}
		get [Symbol.toStringTag]() {
			return ToolItem.toStringTag;
		}
		constructor(options = {}) {
			super();
			this.visible = true;
			this.options = this.getOptions(options);
			this.container = View.createElement(this.options.tagName || "g", this.options.isSVGElement !== false);
			addClass(this.container, this.prefixClassName("cell-tool"));
			if (typeof this.options.className === "string") addClass(this.container, this.options.className);
			this.init();
		}
		init() {}
		getOptions(options) {
			return this.constructor.getOptions(options);
		}
		delegateEvents() {
			if (this.options.events) super.delegateEvents(this.options.events);
			return this;
		}
		config(view, toolsView) {
			this.cellView = view;
			this.parent = toolsView;
			this.stamp(this.container);
			if (this.cell.isEdge()) addClass(this.container, this.prefixClassName("edge-tool"));
			else if (this.cell.isNode()) addClass(this.container, this.prefixClassName("node-tool"));
			if (this.name) this.container.setAttribute("data-tool-name", this.name);
			this.delegateEvents();
			return this;
		}
		render() {
			this.empty();
			const markup = this.options.markup;
			if (markup) {
				const meta = Markup.parseJSONMarkup(markup);
				this.container.appendChild(meta.fragment);
				this.childNodes = meta.selectors;
			}
			this.onRender();
			return this;
		}
		onRender() {}
		update() {
			return this;
		}
		stamp(elem) {
			if (elem) elem.setAttribute("data-cell-id", this.cellView.cell.id);
		}
		show() {
			this.container.style.display = "";
			this.visible = true;
			return this;
		}
		hide() {
			this.container.style.display = "none";
			this.visible = false;
			return this;
		}
		isVisible() {
			return this.visible;
		}
		focus() {
			const opacity = this.options.focusOpacity;
			if (opacity != null && Number.isFinite(opacity)) this.container.style.opacity = `${opacity}`;
			this.parent.focus(this);
			return this;
		}
		blur() {
			this.container.style.opacity = "";
			this.parent.blur(this);
			return this;
		}
		guard(evt) {
			if (this.graph == null || this.cellView == null) return true;
			return this.graph.view.guard(evt, this.cellView);
		}
	}
	ToolItem.defaults = {
		isSVGElement: true,
		tagName: "g"
	};
	ToolsView.ToolItem = ToolItem;
	(function(ToolItem) {
		let counter = 0;
		function getClassName(name) {
			if (name) return pascalCase(name);
			counter += 1;
			return `CustomTool${counter}`;
		}
		function define(options) {
			const tool = createClass(getClassName(options.name), this);
			tool.config(options);
			return tool;
		}
		ToolItem.define = define;
	})(ToolItem = ToolsView.ToolItem || (ToolsView.ToolItem = {}));
	(function(ToolItem) {
		ToolItem.toStringTag = `X6.${ToolItem.name}`;
		function isToolItem(instance) {
			if (instance == null) return false;
			if (instance instanceof ToolItem) return true;
			const tag = instance[Symbol.toStringTag];
			const view = instance;
			if ((tag == null || tag === ToolItem.toStringTag) && view.graph != null && view.cell != null && typeof view.config === "function" && typeof view.update === "function" && typeof view.focus === "function" && typeof view.blur === "function" && typeof view.show === "function" && typeof view.hide === "function" && typeof view.isVisible === "function") return true;
			return false;
		}
		ToolItem.isToolItem = isToolItem;
	})(ToolItem = ToolsView.ToolItem || (ToolsView.ToolItem = {}));
})(ToolsView || (ToolsView = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-strategy/noop.js
var noop = (terminal) => terminal;
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-strategy/pin.js
function toPercentage(value, max) {
	if (max === 0) return "0%";
	return `${Math.round(value / max * 100)}%`;
}
function pin(relative) {
	const strategy = (terminal, view, magnet, coords) => {
		return view.isEdgeElement(magnet) ? pinEdgeTerminal(relative, terminal, view, magnet, coords) : pinNodeTerminal(relative, terminal, view, magnet, coords);
	};
	return strategy;
}
function pinNodeTerminal(relative, data, view, magnet, coords) {
	const node = view.cell;
	const angle = node.getAngle();
	const bbox = view.getUnrotatedBBoxOfElement(magnet);
	const center = node.getBBox().getCenter();
	const pos = Point.create(coords).rotate(angle, center);
	let dx = pos.x - bbox.x;
	let dy = pos.y - bbox.y;
	if (relative) {
		dx = toPercentage(dx, bbox.width);
		dy = toPercentage(dy, bbox.height);
	}
	data.anchor = {
		name: "topLeft",
		args: {
			dx,
			dy,
			rotate: true
		}
	};
	return data;
}
function pinEdgeTerminal(relative, end, view, magnet, coords) {
	const connection = view.getConnection();
	if (!connection) return end;
	const length = connection.closestPointLength(coords);
	if (relative) end.anchor = {
		name: "ratio",
		args: { ratio: length / connection.length() }
	};
	else end.anchor = {
		name: "length",
		args: { length }
	};
	return end;
}
var pinRelative = pin(true);
var pinAbsolute = pin(false);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-strategy/main.js
var main_exports$5 = /* @__PURE__ */ __exportAll({
	noop: () => noop,
	pinAbsolute: () => pinAbsolute,
	pinRelative: () => pinRelative
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-strategy/index.js
var ConnectionStrategy;
(function(ConnectionStrategy) {
	ConnectionStrategy.presets = main_exports$5;
	ConnectionStrategy.registry = Registry.create({ type: "connection strategy" });
	ConnectionStrategy.registry.register(ConnectionStrategy.presets, true);
})(ConnectionStrategy || (ConnectionStrategy = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/tool/util.js
function getAnchor(pos, terminalView, terminalMagnet, type) {
	return call$1(ConnectionStrategy.presets.pinRelative, this.graph, {}, terminalView, terminalMagnet, pos, this.cell, type, {}).anchor;
}
function getViewBBox(view, quick) {
	if (quick) return view.cell.getBBox();
	return view.cell.isEdge() ? view.getConnection().bbox() : view.getUnrotatedBBoxOfElement(view.container);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/tool/button.js
var Button = class extends ToolsView.ToolItem {
	onRender() {
		addClass(this.container, this.prefixClassName("cell-tool-button"));
		this.update();
	}
	update() {
		this.updatePosition();
		return this;
	}
	updatePosition() {
		const matrix = this.cellView.cell.isEdge() ? this.getEdgeMatrix() : this.getNodeMatrix();
		transform(this.container, matrix, { absolute: true });
	}
	getNodeMatrix() {
		const view = this.cellView;
		const options = this.options;
		let { x = 0, y = 0 } = options;
		const { offset, useCellGeometry, rotate } = options;
		let bbox = getViewBBox(view, useCellGeometry);
		const angle = view.cell.getAngle();
		if (!rotate) bbox = bbox.bbox(angle);
		let offsetX = 0;
		let offsetY = 0;
		if (typeof offset === "number") {
			offsetX = offset;
			offsetY = offset;
		} else if (typeof offset === "object") {
			offsetX = offset.x;
			offsetY = offset.y;
		}
		x = normalizePercentage(x, bbox.width);
		y = normalizePercentage(y, bbox.height);
		let matrix = createSVGMatrix().translate(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
		if (rotate) matrix = matrix.rotate(angle);
		matrix = matrix.translate(x + offsetX - bbox.width / 2, y + offsetY - bbox.height / 2);
		return matrix;
	}
	getEdgeMatrix() {
		const view = this.cellView;
		const { offset = 0, distance = 0, rotate } = this.options;
		let tangent;
		let position;
		let angle;
		const d = normalizePercentage(distance, 1);
		if (d >= 0 && d <= 1) tangent = view.getTangentAtRatio(d);
		else tangent = view.getTangentAtLength(d);
		if (tangent) {
			position = tangent.start;
			angle = tangent.vector().vectorAngle(new Point(1, 0)) || 0;
		} else {
			position = view.getConnection().start;
			angle = 0;
		}
		let matrix = createSVGMatrix().translate(position.x, position.y).rotate(angle);
		if (typeof offset === "object") matrix = matrix.translate(offset.x || 0, offset.y || 0);
		else matrix = matrix.translate(0, offset);
		if (!rotate) matrix = matrix.rotate(-angle);
		return matrix;
	}
	onMouseDown(e) {
		if (this.guard(e)) return;
		e.stopPropagation();
		e.preventDefault();
		const onClick = this.options.onClick;
		if (typeof onClick === "function") call$1(onClick, this.cellView, {
			e,
			view: this.cellView,
			cell: this.cellView.cell,
			btn: this
		});
	}
};
(function(Button) {
	Button.config({
		name: "button",
		useCellGeometry: true,
		events: {
			mousedown: "onMouseDown",
			touchstart: "onMouseDown"
		}
	});
})(Button || (Button = {}));
(function(Button) {
	Button.Remove = Button.define({
		name: "button-remove",
		markup: [{
			tagName: "circle",
			selector: "button",
			attrs: {
				r: 7,
				fill: "#FF1D00",
				cursor: "pointer"
			}
		}, {
			tagName: "path",
			selector: "icon",
			attrs: {
				d: "M -3 -3 3 3 M -3 3 3 -3",
				fill: "none",
				stroke: "#FFFFFF",
				"stroke-width": 2,
				"pointer-events": "none"
			}
		}],
		distance: 60,
		offset: 0,
		useCellGeometry: true,
		onClick({ view, btn }) {
			btn.parent.remove();
			view.cell.remove({
				ui: true,
				toolId: btn.cid
			});
		}
	});
})(Button || (Button = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/tool/boundary.js
var __rest$18 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var Boundary = class extends ToolsView.ToolItem {
	onRender() {
		addClass(this.container, this.prefixClassName("cell-tool-boundary"));
		if (this.options.attrs) {
			const _a = this.options.attrs, { class: className } = _a, attrs = __rest$18(_a, ["class"]);
			attr(this.container, kebablizeAttrs(attrs));
			if (className) addClass(this.container, className);
		}
		this.update();
	}
	update() {
		const view = this.cellView;
		const options = this.options;
		const { useCellGeometry, rotate } = options;
		const padding = normalizeSides(options.padding);
		let bbox = getViewBBox(view, useCellGeometry).moveAndExpand({
			x: -padding.left,
			y: -padding.top,
			width: padding.left + padding.right,
			height: padding.top + padding.bottom
		});
		const cell = view.cell;
		if (cell.isNode()) {
			const angle = cell.getAngle();
			if (angle) if (rotate) {
				const origin = cell.getBBox().getCenter();
				rotate$1(this.container, angle, origin.x, origin.y, { absolute: true });
			} else bbox = bbox.bbox(angle);
		}
		attr(this.container, bbox.toJSON());
		return this;
	}
};
(function(Boundary) {
	Boundary.config({
		name: "boundary",
		tagName: "rect",
		padding: 10,
		useCellGeometry: true,
		attrs: {
			fill: "none",
			stroke: "#333",
			"stroke-width": .5,
			"stroke-dasharray": "5, 5",
			"pointer-events": "none"
		}
	});
})(Boundary || (Boundary = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/tool/vertices.js
var Vertices = class extends ToolsView.ToolItem {
	constructor() {
		super(...arguments);
		this.handles = [];
	}
	get vertices() {
		return this.cellView.cell.getVertices();
	}
	onRender() {
		this.addClass(this.prefixClassName("edge-tool-vertices"));
		if (this.options.addable) this.updatePath();
		this.resetHandles();
		this.renderHandles();
		return this;
	}
	update() {
		if (this.vertices.length === this.handles.length) this.updateHandles();
		else {
			this.resetHandles();
			this.renderHandles();
		}
		if (this.options.addable) this.updatePath();
		return this;
	}
	resetHandles() {
		const handles = this.handles;
		this.handles = [];
		if (handles) handles.forEach((handle) => {
			this.stopHandleListening(handle);
			handle.remove();
		});
	}
	renderHandles() {
		const vertices = this.vertices;
		for (let i = 0, l = vertices.length; i < l; i += 1) {
			const vertex = vertices[i];
			const createHandle = this.options.createHandle;
			const processHandle = this.options.processHandle;
			const handle = createHandle({
				index: i,
				graph: this.graph,
				guard: (evt) => this.guard(evt),
				attrs: this.options.attrs || {}
			});
			if (processHandle) processHandle(handle);
			handle.updatePosition(vertex.x, vertex.y);
			this.stamp(handle.container);
			this.container.appendChild(handle.container);
			this.handles.push(handle);
			this.startHandleListening(handle);
		}
	}
	updateHandles() {
		const vertices = this.vertices;
		for (let i = 0, l = vertices.length; i < l; i += 1) {
			const vertex = vertices[i];
			const handle = this.handles[i];
			if (handle) handle.updatePosition(vertex.x, vertex.y);
		}
	}
	updatePath() {
		const connection = this.childNodes.connection;
		if (connection) connection.setAttribute("d", this.cellView.getConnectionPathData());
	}
	startHandleListening(handle) {
		const edgeView = this.cellView;
		if (edgeView.can("vertexMovable")) {
			handle.on("change", this.onHandleChange, this);
			handle.on("changing", this.onHandleChanging, this);
			handle.on("changed", this.onHandleChanged, this);
		}
		if (edgeView.can("vertexDeletable")) handle.on("remove", this.onHandleRemove, this);
	}
	stopHandleListening(handle) {
		const edgeView = this.cellView;
		if (edgeView.can("vertexMovable")) {
			handle.off("change", this.onHandleChange, this);
			handle.off("changing", this.onHandleChanging, this);
			handle.off("changed", this.onHandleChanged, this);
		}
		if (edgeView.can("vertexDeletable")) handle.off("remove", this.onHandleRemove, this);
	}
	getNeighborPoints(index) {
		const edgeView = this.cellView;
		const vertices = this.vertices;
		const prev = index > 0 ? vertices[index - 1] : edgeView.sourceAnchor;
		const next = index < vertices.length - 1 ? vertices[index + 1] : edgeView.targetAnchor;
		return {
			prev: Point.create(prev),
			next: Point.create(next)
		};
	}
	getMouseEventArgs(evt) {
		const e = this.normalizeEvent(evt);
		const { x, y } = this.graph.snapToGrid(e.clientX, e.clientY);
		return {
			e,
			x,
			y
		};
	}
	onHandleChange({ e }) {
		this.focus();
		const edgeView = this.cellView;
		edgeView.cell.startBatch("move-vertex", {
			ui: true,
			toolId: this.cid
		});
		if (!this.options.stopPropagation) {
			const { e: evt, x, y } = this.getMouseEventArgs(e);
			this.eventData(evt, { start: {
				x,
				y
			} });
			edgeView.notifyMouseDown(evt, x, y);
		}
	}
	onHandleChanging({ handle, e }) {
		const edgeView = this.cellView;
		const index = handle.options.index;
		const { e: evt, x, y } = this.getMouseEventArgs(e);
		const vertex = {
			x,
			y
		};
		this.snapVertex(vertex, index);
		edgeView.cell.setVertexAt(index, vertex, {
			ui: true,
			toolId: this.cid
		});
		handle.updatePosition(vertex.x, vertex.y);
		if (!this.options.stopPropagation) edgeView.notifyMouseMove(evt, x, y);
	}
	stopBatch(vertexAdded) {
		this.cell.stopBatch("move-vertex", {
			ui: true,
			toolId: this.cid
		});
		if (vertexAdded) this.cell.stopBatch("add-vertex", {
			ui: true,
			toolId: this.cid
		});
	}
	onHandleChanged({ e }) {
		const options = this.options;
		const edgeView = this.cellView;
		if (options.addable) this.updatePath();
		if (!options.removeRedundancies) {
			this.stopBatch(this.eventData(e).vertexAdded);
			return;
		}
		if (edgeView.removeRedundantLinearVertices({
			ui: true,
			toolId: this.cid
		})) this.render();
		this.blur();
		this.stopBatch(this.eventData(e).vertexAdded);
		const { e: evt, x, y } = this.getMouseEventArgs(e);
		if (!this.options.stopPropagation) {
			edgeView.notifyMouseUp(evt, x, y);
			const { start } = this.eventData(evt);
			if (start) {
				const { x: startX, y: startY } = start;
				if (startX === x && startY === y) edgeView.onClick(evt, x, y);
			}
		}
		edgeView.checkMouseleave(evt);
		options.onChanged && options.onChanged({
			edge: edgeView.cell,
			edgeView
		});
	}
	snapVertex(vertex, index) {
		const snapRadius = this.options.snapRadius || 0;
		if (snapRadius > 0) {
			const neighbors = this.getNeighborPoints(index);
			const prev = neighbors.prev;
			const next = neighbors.next;
			if (Math.abs(vertex.x - prev.x) < snapRadius) vertex.x = prev.x;
			else if (Math.abs(vertex.x - next.x) < snapRadius) vertex.x = next.x;
			if (Math.abs(vertex.y - prev.y) < snapRadius) vertex.y = neighbors.prev.y;
			else if (Math.abs(vertex.y - next.y) < snapRadius) vertex.y = next.y;
		}
	}
	onHandleRemove({ handle, e }) {
		if (this.options.removable) {
			const index = handle.options.index;
			const edgeView = this.cellView;
			edgeView.cell.removeVertexAt(index, { ui: true });
			if (this.options.addable) this.updatePath();
			edgeView.checkMouseleave(this.normalizeEvent(e));
		}
	}
	allowAddVertex(e) {
		const guard = this.guard(e);
		const addable = this.options.addable && this.cellView.can("vertexAddable");
		const matchModifiers = this.options.modifiers ? ModifierKey.isMatch(e, this.options.modifiers) : true;
		return !guard && addable && matchModifiers;
	}
	onPathMouseDown(evt) {
		const edgeView = this.cellView;
		if (!this.allowAddVertex(evt)) return;
		evt.stopPropagation();
		evt.preventDefault();
		const e = this.normalizeEvent(evt);
		const vertex = this.graph.snapToGrid(e.clientX, e.clientY).toJSON();
		edgeView.cell.startBatch("add-vertex", {
			ui: true,
			toolId: this.cid
		});
		const index = edgeView.getVertexIndex(vertex.x, vertex.y);
		this.snapVertex(vertex, index);
		edgeView.cell.insertVertex(vertex, index, {
			ui: true,
			toolId: this.cid
		});
		this.render();
		const handle = this.handles[index];
		this.eventData(e, { vertexAdded: true });
		handle.onMouseDown(e);
	}
	onRemove() {
		this.resetHandles();
	}
};
(function(Vertices) {
	class Handle extends View {
		get graph() {
			return this.options.graph;
		}
		constructor(options) {
			super();
			this.options = options;
			this.render();
			this.delegateEvents({
				mousedown: "onMouseDown",
				touchstart: "onMouseDown",
				dblclick: "onDoubleClick"
			});
		}
		render() {
			this.container = View.createElement("circle", true);
			const attrs = this.options.attrs;
			if (typeof attrs === "function") {
				const defaults = Vertices.getDefaults();
				this.setAttrs(Object.assign(Object.assign({}, defaults.attrs), attrs(this)));
			} else this.setAttrs(attrs);
			this.addClass(this.prefixClassName("edge-tool-vertex"));
		}
		updatePosition(x, y) {
			this.setAttrs({
				cx: x,
				cy: y
			});
		}
		onMouseDown(evt) {
			if (this.options.guard(evt)) return;
			evt.stopPropagation();
			evt.preventDefault();
			this.graph.view.undelegateEvents();
			this.delegateDocumentEvents({
				mousemove: "onMouseMove",
				touchmove: "onMouseMove",
				mouseup: "onMouseUp",
				touchend: "onMouseUp",
				touchcancel: "onMouseUp"
			}, evt.data);
			this.emit("change", {
				e: evt,
				handle: this
			});
		}
		onMouseMove(evt) {
			this.emit("changing", {
				e: evt,
				handle: this
			});
		}
		onMouseUp(evt) {
			this.emit("changed", {
				e: evt,
				handle: this
			});
			this.undelegateDocumentEvents();
			this.graph.view.delegateEvents();
		}
		onDoubleClick(evt) {
			this.emit("remove", {
				e: evt,
				handle: this
			});
		}
	}
	Vertices.Handle = Handle;
})(Vertices || (Vertices = {}));
(function(Vertices) {
	const pathClassName = Config.prefix("edge-tool-vertex-path");
	Vertices.config({
		name: "vertices",
		snapRadius: 20,
		addable: true,
		removable: true,
		removeRedundancies: true,
		stopPropagation: true,
		attrs: {
			r: 6,
			fill: "#333",
			stroke: "#fff",
			cursor: "move",
			"stroke-width": 2
		},
		createHandle: (options) => new Vertices.Handle(options),
		markup: [{
			tagName: "path",
			selector: "connection",
			className: pathClassName,
			attrs: {
				fill: "none",
				stroke: "transparent",
				"stroke-width": 10,
				cursor: "pointer"
			}
		}],
		events: {
			[`mousedown .${pathClassName}`]: "onPathMouseDown",
			[`touchstart .${pathClassName}`]: "onPathMouseDown"
		}
	});
})(Vertices || (Vertices = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/tool/segments.js
var Segments = class extends ToolsView.ToolItem {
	constructor() {
		super(...arguments);
		this.handles = [];
	}
	get vertices() {
		return this.cellView.cell.getVertices();
	}
	update() {
		this.render();
		return this;
	}
	onRender() {
		addClass(this.container, this.prefixClassName("edge-tool-segments"));
		this.resetHandles();
		const edgeView = this.cellView;
		const vertices = [...this.vertices];
		vertices.unshift(edgeView.sourcePoint);
		vertices.push(edgeView.targetPoint);
		for (let i = 0, l = vertices.length; i < l - 1; i += 1) {
			const vertex = vertices[i];
			const nextVertex = vertices[i + 1];
			const handle = this.renderHandle(vertex, nextVertex, i);
			this.stamp(handle.container);
			this.handles.push(handle);
		}
		return this;
	}
	renderHandle(vertex, nextVertex, index) {
		const handle = this.options.createHandle({
			index,
			graph: this.graph,
			guard: (evt) => this.guard(evt),
			attrs: this.options.attrs || {}
		});
		if (this.options.processHandle) this.options.processHandle(handle);
		this.updateHandle(handle, vertex, nextVertex);
		this.container.appendChild(handle.container);
		this.startHandleListening(handle);
		return handle;
	}
	startHandleListening(handle) {
		handle.on("change", this.onHandleChange, this);
		handle.on("changing", this.onHandleChanging, this);
		handle.on("changed", this.onHandleChanged, this);
	}
	stopHandleListening(handle) {
		handle.off("change", this.onHandleChange, this);
		handle.off("changing", this.onHandleChanging, this);
		handle.off("changed", this.onHandleChanged, this);
	}
	resetHandles() {
		const handles = this.handles;
		this.handles = [];
		if (handles) handles.forEach((handle) => {
			this.stopHandleListening(handle);
			handle.remove();
		});
	}
	shiftHandleIndexes(delta) {
		const handles = this.handles;
		for (let i = 0, n = handles.length; i < n; i += 1) handles[i].options.index += delta;
	}
	resetAnchor(type, anchor) {
		const edge = this.cellView.cell;
		const options = {
			ui: true,
			toolId: this.cid
		};
		if (anchor) edge.prop([type, "anchor"], anchor, options);
		else edge.removeProp([type, "anchor"], options);
	}
	snapHandle(handle, position, data) {
		const axis = handle.options.axis;
		const index = handle.options.index;
		const vertices = this.cellView.cell.getVertices();
		const prev = vertices[index - 2] || data.sourceAnchor;
		const next = vertices[index + 1] || data.targetAnchor;
		const snapRadius = this.options.snapRadius;
		if (Math.abs(position[axis] - prev[axis]) < snapRadius) position[axis] = prev[axis];
		else if (Math.abs(position[axis] - next[axis]) < snapRadius) position[axis] = next[axis];
		return position;
	}
	onHandleChanging({ handle, e }) {
		const graph = this.graph;
		const options = this.options;
		const edgeView = this.cellView;
		const anchorFn = options.anchor;
		const axis = handle.options.axis;
		const index = handle.options.index - 1;
		const data = this.getEventData(e);
		const evt = this.normalizeEvent(e);
		const coords = graph.snapToGrid(evt.clientX, evt.clientY);
		const position = this.snapHandle(handle, coords.clone(), data);
		const vertices = cloneDeep(this.vertices);
		let vertex = vertices[index];
		let nextVertex = vertices[index + 1];
		const sourceView = edgeView.sourceView;
		const sourceBBox = edgeView.sourceBBox;
		let changeSourceAnchor = false;
		let deleteSourceAnchor = false;
		if (!vertex) {
			vertex = edgeView.sourceAnchor.toJSON();
			vertex[axis] = position[axis];
			if (sourceBBox.containsPoint(vertex)) changeSourceAnchor = true;
			else {
				vertices.unshift(vertex);
				this.shiftHandleIndexes(1);
				deleteSourceAnchor = true;
			}
		} else if (index === 0) if (sourceBBox.containsPoint(vertex)) {
			vertices.shift();
			this.shiftHandleIndexes(-1);
			changeSourceAnchor = true;
		} else {
			vertex[axis] = position[axis];
			deleteSourceAnchor = true;
		}
		else vertex[axis] = position[axis];
		if (typeof anchorFn === "function" && sourceView) {
			if (changeSourceAnchor) {
				const sourceAnchorPosition = data.sourceAnchor.clone();
				sourceAnchorPosition[axis] = position[axis];
				const sourceAnchor = call$1(anchorFn, edgeView, sourceAnchorPosition, sourceView, edgeView.sourceMagnet || sourceView.container, "source", edgeView, this);
				this.resetAnchor("source", sourceAnchor);
			}
			if (deleteSourceAnchor) this.resetAnchor("source", data.sourceAnchorDef);
		}
		const targetView = edgeView.targetView;
		const targetBBox = edgeView.targetBBox;
		let changeTargetAnchor = false;
		let deleteTargetAnchor = false;
		if (!nextVertex) {
			nextVertex = edgeView.targetAnchor.toJSON();
			nextVertex[axis] = position[axis];
			if (targetBBox.containsPoint(nextVertex)) changeTargetAnchor = true;
			else {
				vertices.push(nextVertex);
				deleteTargetAnchor = true;
			}
		} else if (index === vertices.length - 2) if (targetBBox.containsPoint(nextVertex)) {
			vertices.pop();
			changeTargetAnchor = true;
		} else {
			nextVertex[axis] = position[axis];
			deleteTargetAnchor = true;
		}
		else nextVertex[axis] = position[axis];
		if (typeof anchorFn === "function" && targetView) {
			if (changeTargetAnchor) {
				const targetAnchorPosition = data.targetAnchor.clone();
				targetAnchorPosition[axis] = position[axis];
				const targetAnchor = call$1(anchorFn, edgeView, targetAnchorPosition, targetView, edgeView.targetMagnet || targetView.container, "target", edgeView, this);
				this.resetAnchor("target", targetAnchor);
			}
			if (deleteTargetAnchor) this.resetAnchor("target", data.targetAnchorDef);
		}
		if (!Point.equalPoints(vertices, this.vertices)) this.cellView.cell.setVertices(vertices, {
			ui: true,
			toolId: this.cid
		});
		this.updateHandle(handle, vertex, nextVertex, 0);
		if (!options.stopPropagation) edgeView.notifyMouseMove(evt, coords.x, coords.y);
	}
	onHandleChange({ handle, e }) {
		const options = this.options;
		const handles = this.handles;
		const edgeView = this.cellView;
		const index = handle.options.index;
		if (!Array.isArray(handles)) return;
		for (let i = 0, n = handles.length; i < n; i += 1) if (i !== index) handles[i].hide();
		this.focus();
		this.setEventData(e, {
			sourceAnchor: edgeView.sourceAnchor.clone(),
			targetAnchor: edgeView.targetAnchor.clone(),
			sourceAnchorDef: cloneDeep(this.cell.prop(["source", "anchor"])),
			targetAnchorDef: cloneDeep(this.cell.prop(["target", "anchor"]))
		});
		this.cell.startBatch("move-segment", {
			ui: true,
			toolId: this.cid
		});
		if (!options.stopPropagation) {
			const normalizedEvent = this.normalizeEvent(e);
			const coords = this.graph.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
			edgeView.notifyMouseDown(normalizedEvent, coords.x, coords.y);
		}
	}
	onHandleChanged({ e }) {
		const options = this.options;
		const edgeView = this.cellView;
		if (options.removeRedundancies) edgeView.removeRedundantLinearVertices({
			ui: true,
			toolId: this.cid
		});
		const normalizedEvent = this.normalizeEvent(e);
		const coords = this.graph.snapToGrid(normalizedEvent.clientX, normalizedEvent.clientY);
		this.render();
		this.blur();
		this.cell.stopBatch("move-segment", {
			ui: true,
			toolId: this.cid
		});
		if (!options.stopPropagation) edgeView.notifyMouseUp(normalizedEvent, coords.x, coords.y);
		edgeView.checkMouseleave(normalizedEvent);
		options.onChanged && options.onChanged({
			edge: edgeView.cell,
			edgeView
		});
	}
	updateHandle(handle, vertex, nextVertex, offset = 0) {
		const precision = this.options.precision || 0;
		const vertical = Math.abs(vertex.x - nextVertex.x) < precision;
		const horizontal = Math.abs(vertex.y - nextVertex.y) < precision;
		if (vertical || horizontal) {
			const segmentLine = new Line(vertex, nextVertex);
			if (segmentLine.length() < this.options.threshold) handle.hide();
			else {
				const position = segmentLine.getCenter();
				const axis = vertical ? "x" : "y";
				position[axis] += offset || 0;
				const angle = segmentLine.vector().vectorAngle(new Point(1, 0));
				handle.updatePosition(position.x, position.y, angle, this.cellView);
				handle.show();
				handle.options.axis = axis;
			}
		} else handle.hide();
	}
	onRemove() {
		this.resetHandles();
	}
};
(function(Segments) {
	class Handle extends View {
		constructor(options) {
			super();
			this.options = options;
			this.render();
			this.delegateEvents({
				mousedown: "onMouseDown",
				touchstart: "onMouseDown"
			});
		}
		render() {
			this.container = View.createElement("rect", true);
			const attrs = this.options.attrs;
			if (typeof attrs === "function") {
				const defaults = Segments.getDefaults();
				this.setAttrs(Object.assign(Object.assign({}, defaults.attrs), attrs(this)));
			} else this.setAttrs(attrs);
			this.addClass(this.prefixClassName("edge-tool-segment"));
		}
		updatePosition(x, y, angle, view) {
			const p = view.getClosestPoint(new Point(x, y)) || new Point(x, y);
			let matrix = createSVGMatrix().translate(p.x, p.y);
			if (!p.equals({
				x,
				y
			})) {
				let deg = new Line(x, y, p.x, p.y).vector().vectorAngle(new Point(1, 0));
				if (deg !== 0) deg += 90;
				matrix = matrix.rotate(deg);
			} else matrix = matrix.rotate(angle);
			this.setAttrs({
				transform: matrixToTransformString(matrix),
				cursor: angle % 180 === 0 ? "row-resize" : "col-resize"
			});
		}
		onMouseDown(evt) {
			if (this.options.guard(evt)) return;
			this.trigger("change", {
				e: evt,
				handle: this
			});
			evt.stopPropagation();
			evt.preventDefault();
			this.options.graph.view.undelegateEvents();
			this.delegateDocumentEvents({
				mousemove: "onMouseMove",
				touchmove: "onMouseMove",
				mouseup: "onMouseUp",
				touchend: "onMouseUp",
				touchcancel: "onMouseUp"
			}, evt.data);
		}
		onMouseMove(evt) {
			this.emit("changing", {
				e: evt,
				handle: this
			});
		}
		onMouseUp(evt) {
			this.emit("changed", {
				e: evt,
				handle: this
			});
			this.undelegateDocumentEvents();
			this.options.graph.view.delegateEvents();
		}
		show() {
			this.container.style.display = "";
		}
		hide() {
			this.container.style.display = "none";
		}
	}
	Segments.Handle = Handle;
})(Segments || (Segments = {}));
(function(Segments) {
	Segments.config({
		name: "segments",
		precision: .5,
		threshold: 40,
		snapRadius: 10,
		stopPropagation: true,
		removeRedundancies: true,
		attrs: {
			width: 20,
			height: 8,
			x: -10,
			y: -4,
			rx: 4,
			ry: 4,
			fill: "#333",
			stroke: "#fff",
			"stroke-width": 2
		},
		createHandle: (options) => new Segments.Handle(options),
		anchor: getAnchor
	});
})(Segments || (Segments = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/tool/anchor.js
var Anchor = class extends ToolsView.ToolItem {
	get type() {
		return this.options.type;
	}
	onRender() {
		addClass(this.container, this.prefixClassName(`edge-tool-${this.type}-anchor`));
		this.toggleArea(false);
		this.update();
	}
	update() {
		const type = this.type;
		if (this.cellView.getTerminalView(type)) {
			this.updateAnchor();
			this.updateArea();
			this.container.style.display = "";
		} else this.container.style.display = "none";
		return this;
	}
	updateAnchor() {
		const childNodes = this.childNodes;
		if (!childNodes) return;
		const anchorNode = childNodes.anchor;
		if (!anchorNode) return;
		const type = this.type;
		const edgeView = this.cellView;
		const options = this.options;
		const position = edgeView.getTerminalAnchor(type);
		const customAnchor = edgeView.cell.prop([type, "anchor"]);
		anchorNode.setAttribute("transform", `translate(${position.x}, ${position.y})`);
		const anchorAttrs = customAnchor ? options.customAnchorAttrs : options.defaultAnchorAttrs;
		if (anchorAttrs) Object.keys(anchorAttrs).forEach((attrName) => {
			anchorNode.setAttribute(attrName, anchorAttrs[attrName]);
		});
	}
	updateArea() {
		const childNodes = this.childNodes;
		if (!childNodes) return;
		const areaNode = childNodes.area;
		if (!areaNode) return;
		const type = this.type;
		const edgeView = this.cellView;
		const terminalView = edgeView.getTerminalView(type);
		if (terminalView) {
			const terminalCell = terminalView.cell;
			const magnet = edgeView.getTerminalMagnet(type);
			let padding = this.options.areaPadding || 0;
			if (!Number.isFinite(padding)) padding = 0;
			let bbox;
			let angle;
			let center;
			if (terminalView.isEdgeElement(magnet)) {
				bbox = terminalView.getBBox();
				angle = 0;
				center = bbox.getCenter();
			} else {
				bbox = terminalView.getUnrotatedBBoxOfElement(magnet);
				angle = terminalCell.getAngle();
				center = bbox.getCenter();
				if (angle) center.rotate(-angle, terminalCell.getBBox().getCenter());
			}
			bbox.inflate(padding);
			attr(areaNode, {
				x: -bbox.width / 2,
				y: -bbox.height / 2,
				width: bbox.width,
				height: bbox.height,
				transform: `translate(${center.x}, ${center.y}) rotate(${angle})`
			});
		}
	}
	toggleArea(visible) {
		if (this.childNodes) {
			const elem = this.childNodes.area;
			if (elem) elem.style.display = visible ? "" : "none";
		}
	}
	onMouseDown(evt) {
		if (this.guard(evt)) return;
		evt.stopPropagation();
		evt.preventDefault();
		this.graph.view.undelegateEvents();
		if (this.options.documentEvents) this.delegateDocumentEvents(this.options.documentEvents);
		this.focus();
		this.toggleArea(this.options.restrictArea);
		this.cell.startBatch("move-anchor", {
			ui: true,
			toolId: this.cid
		});
	}
	resetAnchor(anchor) {
		const type = this.type;
		const cell = this.cell;
		if (anchor) cell.prop([type, "anchor"], anchor, {
			rewrite: true,
			ui: true,
			toolId: this.cid
		});
		else cell.removeProp([type, "anchor"], {
			ui: true,
			toolId: this.cid
		});
	}
	onMouseMove(evt) {
		const terminalType = this.type;
		const edgeView = this.cellView;
		const terminalView = edgeView.getTerminalView(terminalType);
		if (terminalView == null) return;
		const e = this.normalizeEvent(evt);
		const terminalCell = terminalView.cell;
		const terminalMagnet = edgeView.getTerminalMagnet(terminalType);
		let coords = this.graph.coord.clientToLocalPoint(e.clientX, e.clientY);
		const snapFn = this.options.snap;
		if (typeof snapFn === "function") {
			const tmp = call$1(snapFn, edgeView, coords, terminalView, terminalMagnet, terminalType, edgeView, this);
			coords = Point.create(tmp);
		}
		if (this.options.restrictArea) if (terminalView.isEdgeElement(terminalMagnet)) {
			const pointAtConnection = terminalView.getClosestPoint(coords);
			if (pointAtConnection) coords = pointAtConnection;
		} else {
			const bbox = terminalView.getUnrotatedBBoxOfElement(terminalMagnet);
			const angle = terminalCell.getAngle();
			const origin = terminalCell.getBBox().getCenter();
			const rotatedCoords = coords.clone().rotate(angle, origin);
			if (!bbox.containsPoint(rotatedCoords)) coords = bbox.getNearestPointToPoint(rotatedCoords).rotate(-angle, origin);
		}
		let anchor;
		const anchorFn = this.options.anchor;
		if (typeof anchorFn === "function") anchor = call$1(anchorFn, edgeView, coords, terminalView, terminalMagnet, terminalType, edgeView, this);
		this.resetAnchor(anchor);
		this.update();
	}
	onMouseUp(evt) {
		this.graph.view.delegateEvents();
		this.undelegateDocumentEvents();
		this.blur();
		this.toggleArea(false);
		const edgeView = this.cellView;
		if (this.options.removeRedundancies) edgeView.removeRedundantLinearVertices({
			ui: true,
			toolId: this.cid
		});
		this.cell.stopBatch("move-anchor", {
			ui: true,
			toolId: this.cid
		});
	}
	onDblClick() {
		const anchor = this.options.resetAnchor;
		if (anchor) this.resetAnchor(anchor === true ? void 0 : anchor);
		this.update();
	}
};
(function(Anchor) {
	Anchor.config({
		tagName: "g",
		markup: [{
			tagName: "circle",
			selector: "anchor",
			attrs: { cursor: "pointer" }
		}, {
			tagName: "rect",
			selector: "area",
			attrs: {
				"pointer-events": "none",
				fill: "none",
				stroke: "#33334F",
				"stroke-dasharray": "2,4",
				rx: 5,
				ry: 5
			}
		}],
		events: {
			mousedown: "onMouseDown",
			touchstart: "onMouseDown",
			dblclick: "onDblClick"
		},
		documentEvents: {
			mousemove: "onMouseMove",
			touchmove: "onMouseMove",
			mouseup: "onMouseUp",
			touchend: "onMouseUp",
			touchcancel: "onMouseUp"
		},
		customAnchorAttrs: {
			"stroke-width": 4,
			stroke: "#33334F",
			fill: "#FFFFFF",
			r: 5
		},
		defaultAnchorAttrs: {
			"stroke-width": 2,
			stroke: "#FFFFFF",
			fill: "#33334F",
			r: 6
		},
		areaPadding: 6,
		snapRadius: 10,
		resetAnchor: true,
		restrictArea: true,
		removeRedundancies: true,
		anchor: getAnchor,
		snap(pos, terminalView, terminalMagnet, terminalType, edgeView, toolView) {
			const snapRadius = toolView.options.snapRadius || 0;
			const isSource = terminalType === "source";
			const refIndex = isSource ? 0 : -1;
			const ref = this.cell.getVertexAt(refIndex) || this.getTerminalAnchor(isSource ? "target" : "source");
			if (ref) {
				if (Math.abs(ref.x - pos.x) < snapRadius) pos.x = ref.x;
				if (Math.abs(ref.y - pos.y) < snapRadius) pos.y = ref.y;
			}
			return pos;
		}
	});
})(Anchor || (Anchor = {}));
var SourceAnchor = Anchor.define({
	name: "source-anchor",
	type: "source"
});
var TargetAnchor = Anchor.define({
	name: "target-anchor",
	type: "target"
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/tool/arrowhead.js
var __rest$17 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var Arrowhead = class extends ToolsView.ToolItem {
	get type() {
		return this.options.type;
	}
	get ratio() {
		return this.options.ratio;
	}
	init() {
		if (this.options.attrs) {
			const _a = this.options.attrs, { class: className } = _a, attrs = __rest$17(_a, ["class"]);
			this.setAttrs(attrs, this.container);
			if (className) addClass(this.container, className);
		}
	}
	onRender() {
		addClass(this.container, this.prefixClassName(`edge-tool-${this.type}-arrowhead`));
		this.update();
	}
	update() {
		const ratio = this.ratio;
		const edgeView = this.cellView;
		const tangent = edgeView.getTangentAtRatio(ratio);
		const position = tangent ? tangent.start : edgeView.getPointAtRatio(ratio);
		const angle = tangent && tangent.vector().vectorAngle(new Point(1, 0)) || 0;
		if (!position) return this;
		const matrix = createSVGMatrix().translate(position.x, position.y).rotate(angle);
		transform(this.container, matrix, { absolute: true });
		return this;
	}
	onMouseDown(evt) {
		if (this.guard(evt)) return;
		evt.stopPropagation();
		evt.preventDefault();
		const edgeView = this.cellView;
		if (edgeView.can("arrowheadMovable")) {
			edgeView.cell.startBatch("move-arrowhead", {
				ui: true,
				toolId: this.cid
			});
			const coords = this.graph.snapToGrid(evt.clientX, evt.clientY);
			const data = edgeView.prepareArrowheadDragging(this.type, {
				x: coords.x,
				y: coords.y,
				options: Object.assign(Object.assign({}, this.options), { toolId: this.cid })
			});
			this.cellView.setEventData(evt, data);
			this.delegateDocumentEvents(this.options.documentEvents, evt.data);
			edgeView.graph.view.undelegateEvents();
			this.container.style.pointerEvents = "none";
		}
		this.focus();
	}
	onMouseMove(evt) {
		const e = this.normalizeEvent(evt);
		const coords = this.graph.snapToGrid(e.clientX, e.clientY);
		this.cellView.onMouseMove(e, coords.x, coords.y);
		this.update();
	}
	onMouseUp(evt) {
		this.undelegateDocumentEvents();
		const e = this.normalizeEvent(evt);
		const edgeView = this.cellView;
		const coords = this.graph.snapToGrid(e.clientX, e.clientY);
		edgeView.onMouseUp(e, coords.x, coords.y);
		this.graph.view.delegateEvents();
		this.blur();
		this.container.style.pointerEvents = "";
		edgeView.cell.stopBatch("move-arrowhead", {
			ui: true,
			toolId: this.cid
		});
	}
};
(function(Arrowhead) {
	Arrowhead.config({
		tagName: "path",
		isSVGElement: true,
		events: {
			mousedown: "onMouseDown",
			touchstart: "onMouseDown"
		},
		documentEvents: {
			mousemove: "onMouseMove",
			touchmove: "onMouseMove",
			mouseup: "onMouseUp",
			touchend: "onMouseUp",
			touchcancel: "onMouseUp"
		}
	});
})(Arrowhead || (Arrowhead = {}));
var SourceArrowhead = Arrowhead.define({
	name: "source-arrowhead",
	type: "source",
	ratio: 0,
	attrs: {
		d: "M 10 -8 -10 0 10 8 Z",
		fill: "#333",
		stroke: "#fff",
		"stroke-width": 2,
		cursor: "move"
	}
});
var TargetArrowhead = Arrowhead.define({
	name: "target-arrowhead",
	type: "target",
	ratio: 1,
	attrs: {
		d: "M -10 -8 10 0 -10 8 Z",
		fill: "#333",
		stroke: "#fff",
		"stroke-width": 2,
		cursor: "move"
	}
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/tool/editor.js
var CellEditor = class extends ToolsView.ToolItem {
	constructor() {
		super(...arguments);
		this.labelIndex = -1;
		this.distance = .5;
		this.dblClick = this.onCellDblClick.bind(this);
	}
	onRender() {
		const cellView = this.cellView;
		if (cellView) cellView.on("cell:dblclick", this.dblClick);
	}
	createElement() {
		const classNames = [this.prefixClassName(`${this.cell.isEdge() ? "edge" : "node"}-tool-editor`), this.prefixClassName("cell-tool-editor")];
		this.editor = ToolsView.createElement("div", false);
		this.addClass(classNames, this.editor);
		this.editor.contentEditable = "true";
		this.container.appendChild(this.editor);
	}
	removeElement() {
		this.undelegateDocumentEvents();
		if (this.editor) {
			this.container.removeChild(this.editor);
			this.editor = null;
		}
	}
	updateEditor() {
		const { cell, editor } = this;
		if (!editor) return;
		const { style } = editor;
		if (cell.isNode()) this.updateNodeEditorTransform();
		else if (cell.isEdge()) this.updateEdgeEditorTransform();
		const { attrs } = this.options;
		style.fontSize = `${attrs.fontSize}px`;
		style.fontFamily = attrs.fontFamily;
		style.color = attrs.color;
		style.backgroundColor = attrs.backgroundColor;
		editor.innerText = this.getCellText() || "";
		this.setCellText("");
		return this;
	}
	updateNodeEditorTransform() {
		const { graph, cell, editor } = this;
		if (!editor) return;
		let pos = Point.create();
		let minWidth = 20;
		let translate = "";
		let { x, y } = this.options;
		const { width, height } = this.options;
		if (typeof x !== "undefined" && typeof y !== "undefined") {
			const bbox = cell.getBBox();
			x = normalizePercentage(x, bbox.width);
			y = normalizePercentage(y, bbox.height);
			pos = bbox.topLeft.translate(x, y);
			minWidth = bbox.width - x * 2;
		} else {
			const bbox = cell.getBBox();
			pos = bbox.center;
			minWidth = bbox.width - 4;
			translate = "translate(-50%, -50%)";
		}
		const scale = graph.scale();
		const { style } = editor;
		pos = graph.localToGraph(pos);
		style.left = `${pos.x}px`;
		style.top = `${pos.y}px`;
		style.transform = `scale(${scale.sx}, ${scale.sy}) ${translate}`;
		style.minWidth = `${minWidth}px`;
		if (typeof width === "number") style.width = `${width}px`;
		if (typeof height === "number") style.height = `${height}px`;
	}
	updateEdgeEditorTransform() {
		if (!this.event) return;
		const { graph, editor } = this;
		if (!editor) return;
		let pos = Point.create();
		let minWidth = 20;
		const { style } = editor;
		const target = this.event.target;
		const parent = target.parentElement;
		if (parent && hasClass(parent, this.prefixClassName("edge-label"))) {
			const index = parent.getAttribute("data-index") || "0";
			this.labelIndex = parseInt(index, 10);
			const { translation } = parseTransformString(parent.getAttribute("transform"));
			pos = new Point(translation.tx, translation.ty);
			minWidth = Util$2.getBBox(target).width;
		} else {
			if (!this.options.labelAddable) return this;
			pos = graph.clientToLocal(Point.create(this.event.clientX, this.event.clientY));
			const d = this.cellView.path.closestPointLength(pos);
			this.distance = d;
			this.labelIndex = -1;
		}
		pos = graph.localToGraph(pos);
		const scale = graph.scale();
		style.left = `${pos.x}px`;
		style.top = `${pos.y}px`;
		style.minWidth = `${minWidth}px`;
		style.transform = `scale(${scale.sx}, ${scale.sy}) translate(-50%, -50%)`;
	}
	onDocumentMouseUp(e) {
		if (this.editor && e.target !== this.editor) {
			const value = this.editor.innerText.replace(/\n$/, "") || "";
			this.setCellText(value !== "" ? value : null);
			this.removeElement();
		}
	}
	onCellDblClick({ e }) {
		if (!this.editor) {
			e.stopPropagation();
			this.removeElement();
			this.event = e;
			this.createElement();
			this.updateEditor();
			this.autoFocus();
			this.delegateDocumentEvents(this.options.documentEvents);
		}
	}
	onMouseDown(e) {
		e.stopPropagation();
	}
	autoFocus() {
		setTimeout(() => {
			if (this.editor) {
				this.editor.focus();
				this.selectText();
			}
		});
	}
	selectText() {
		if (window.getSelection && this.editor) {
			const range = document.createRange();
			const selection = window.getSelection();
			range.selectNodeContents(this.editor);
			selection.removeAllRanges();
			selection.addRange(range);
		}
	}
	getCellText() {
		const { getText } = this.options;
		if (typeof getText === "function") return call$1(getText, this.cellView, {
			cell: this.cell,
			index: this.labelIndex
		});
		if (typeof getText === "string") {
			if (this.cell.isNode()) return this.cell.attr(getText);
			if (this.cell.isEdge()) {
				if (this.labelIndex !== -1) return this.cell.prop(`labels/${this.labelIndex}/attrs/${getText}`);
			}
		}
	}
	setCellText(value) {
		const setText = this.options.setText;
		if (typeof setText === "function") {
			call$1(setText, this.cellView, {
				cell: this.cell,
				value,
				index: this.labelIndex,
				distance: this.distance
			});
			return;
		}
		if (typeof setText === "string") {
			if (this.cell.isNode()) {
				if (value !== null) this.cell.attr(setText, value);
				return;
			}
			if (this.cell.isEdge()) {
				const edge = this.cell;
				if (this.labelIndex === -1) {
					if (value) {
						const newLabel = {
							position: { distance: this.distance },
							attrs: {}
						};
						setByPath(newLabel, `attrs/${setText}`, value);
						edge.appendLabel(newLabel);
					}
				} else if (value !== null) edge.prop(`labels/${this.labelIndex}/attrs/${setText}`, value);
				else if (typeof this.labelIndex === "number") edge.removeLabelAt(this.labelIndex);
			}
		}
	}
	onRemove() {
		const cellView = this.cellView;
		if (cellView) cellView.off("cell:dblclick", this.dblClick);
		this.removeElement();
	}
};
(function(CellEditor) {
	CellEditor.config({
		tagName: "div",
		isSVGElement: false,
		events: {
			mousedown: "onMouseDown",
			touchstart: "onMouseDown"
		},
		documentEvents: {
			mouseup: "onDocumentMouseUp",
			touchend: "onDocumentMouseUp",
			touchcancel: "onDocumentMouseUp"
		}
	});
})(CellEditor || (CellEditor = {}));
(function(CellEditor) {
	CellEditor.NodeEditor = CellEditor.define({
		attrs: {
			fontSize: 14,
			fontFamily: "Arial, helvetica, sans-serif",
			color: "#000",
			backgroundColor: "#fff"
		},
		getText: "text/text",
		setText: "text/text"
	});
	CellEditor.EdgeEditor = CellEditor.define({
		attrs: {
			fontSize: 14,
			fontFamily: "Arial, helvetica, sans-serif",
			color: "#000",
			backgroundColor: "#fff"
		},
		labelAddable: true,
		getText: "label/text",
		setText: "label/text"
	});
})(CellEditor || (CellEditor = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/tool/index.js
var __rest$16 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var NodeTool;
(function(NodeTool) {
	NodeTool.presets = {
		boundary: Boundary,
		button: Button,
		"button-remove": Button.Remove,
		"node-editor": CellEditor.NodeEditor
	};
	NodeTool.registry = Registry.create({
		type: "node tool",
		process(name, options) {
			if (typeof options === "function") return options;
			let parent = ToolsView.ToolItem;
			const { inherit } = options, others = __rest$16(options, ["inherit"]);
			if (inherit) {
				const base = this.get(inherit);
				if (base == null) this.onNotFound(inherit, "inherited");
				else parent = base;
			}
			if (others.name == null) others.name = name;
			return parent.define.call(parent, others);
		}
	});
	NodeTool.registry.register(NodeTool.presets, true);
})(NodeTool || (NodeTool = {}));
var EdgeTool;
(function(EdgeTool) {
	EdgeTool.presets = {
		boundary: Boundary,
		vertices: Vertices,
		segments: Segments,
		button: Button,
		"button-remove": Button.Remove,
		"source-anchor": SourceAnchor,
		"target-anchor": TargetAnchor,
		"source-arrowhead": SourceArrowhead,
		"target-arrowhead": TargetArrowhead,
		"edge-editor": CellEditor.EdgeEditor
	};
	EdgeTool.registry = Registry.create({
		type: "edge tool",
		process(name, options) {
			if (typeof options === "function") return options;
			let parent = ToolsView.ToolItem;
			const { inherit } = options, others = __rest$16(options, ["inherit"]);
			if (inherit) {
				const base = this.get(inherit);
				if (base == null) this.onNotFound(inherit, "inherited");
				else parent = base;
			}
			if (others.name == null) others.name = name;
			return parent.define.call(parent, others);
		}
	});
	EdgeTool.registry.register(EdgeTool.presets, true);
})(EdgeTool || (EdgeTool = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/node-anchor/bbox.js
var center = createBBoxAnchor("center");
var top = createBBoxAnchor("topCenter");
var bottom = createBBoxAnchor("bottomCenter");
var left = createBBoxAnchor("leftMiddle");
var right = createBBoxAnchor("rightMiddle");
var topLeft = createBBoxAnchor("topLeft");
var topRight = createBBoxAnchor("topRight");
var bottomLeft = createBBoxAnchor("bottomLeft");
var bottomRight = createBBoxAnchor("bottomRight");
function createBBoxAnchor(method) {
	return function(view, magnet, ref, options = {}) {
		let bbox;
		if (view.cell.visible) bbox = options.rotate ? view.getUnrotatedBBoxOfElement(magnet) : view.getBBoxOfElement(magnet);
		else bbox = view.cell.getBBox();
		const result = bbox[method];
		result.x += normalizePercentage(options.dx, bbox.width);
		result.y += normalizePercentage(options.dy, bbox.height);
		const cell = view.cell;
		return options.rotate ? result.rotate(-cell.getAngle(), cell.getBBox().getCenter()) : result;
	};
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/node-anchor/util.js
function resolve$1(fn) {
	return function(view, magnet, ref, options) {
		if (ref instanceof Element) {
			const refView = this.graph.findViewByElem(ref);
			let refPoint;
			if (refView) if (refView.isEdgeElement(ref)) refPoint = getPointAtEdge(refView, options.fixedAt != null ? options.fixedAt : "50%");
			else refPoint = refView.getBBoxOfElement(ref).getCenter();
			else refPoint = new Point();
			return fn.call(this, view, magnet, refPoint, options);
		}
		return fn.apply(this, arguments);
	};
}
function getPointAtEdge(edgeView, value) {
	const isPercentage$1 = isPercentage(value);
	const num = typeof value === "string" ? parseFloat(value) : value;
	if (isPercentage$1) return edgeView.getPointAtRatio(num / 100);
	return edgeView.getPointAtLength(num);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/node-anchor/orth.js
var orthogonal$1 = function(view, magnet, refPoint, options) {
	const angle = Angle.normalize(view.cell.getAngle());
	const bbox = view.cell.visible ? view.getBBoxOfElement(magnet) : view.cell.getBBox();
	const result = bbox.getCenter();
	const topLeft = bbox.getTopLeft();
	const bottomRight = bbox.getBottomRight();
	let padding = options.padding;
	if (!Number.isFinite(padding)) padding = 0;
	if (topLeft.y + padding <= refPoint.y && refPoint.y <= bottomRight.y - padding) {
		const dy = refPoint.y - result.y;
		result.x += angle === 0 || angle === 180 ? 0 : dy * 1 / Math.tan(Angle.toRad(angle));
		result.y += dy;
	} else if (topLeft.x + padding <= refPoint.x && refPoint.x <= bottomRight.x - padding) {
		const dx = refPoint.x - result.x;
		result.y += angle === 90 || angle === 270 ? 0 : dx * Math.tan(Angle.toRad(angle));
		result.x += dx;
	}
	return result;
};
/**
* Tries to place the anchor of the edge inside the view bbox so that the
* edge is made orthogonal. The anchor is placed along two line segments
* inside the view bbox (between the centers of the top and bottom side and
* between the centers of the left and right sides). If it is not possible
* to place the anchor so that the edge would be orthogonal, the anchor is
* placed at the center of the view bbox instead.
*/
var orth$2 = resolve$1(orthogonal$1);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/node-anchor/node-center.js
/**
* Places the anchor of the edge at center of the node bbox.
*/
var nodeCenter = function(view, magnet, ref, options, endType) {
	const result = view.cell.getConnectionPoint(this.cell, endType);
	if (options.dx || options.dy) result.translate(options.dx || 0, options.dy || 0);
	return result;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/node-anchor/middle-side.js
var middleSide = function(view, magnet, refPoint, options) {
	let bbox;
	let angle = 0;
	let center;
	const node = view.cell;
	if (options.rotate) {
		bbox = view.getUnrotatedBBoxOfElement(magnet);
		center = node.getBBox().getCenter();
		angle = node.getAngle();
	} else if (node.visible) bbox = view.getBBoxOfElement(magnet);
	else bbox = view.cell.getBBox();
	const padding = options.padding;
	if (padding != null && Number.isFinite(padding)) bbox.inflate(padding);
	if (options.rotate) refPoint.rotate(angle, center);
	const side = bbox.getNearestSideToPoint(refPoint);
	let result;
	switch (side) {
		case "left":
			result = bbox.getLeftMiddle();
			break;
		case "right":
			result = bbox.getRightMiddle();
			break;
		case "top":
			result = bbox.getTopCenter();
			break;
		case "bottom": result = bbox.getBottomCenter();
	}
	const direction = options.direction;
	if (direction === "H") {
		if (side === "top" || side === "bottom") if (refPoint.x <= bbox.x + bbox.width) result = bbox.getLeftMiddle();
		else result = bbox.getRightMiddle();
	} else if (direction === "V") if (refPoint.y <= bbox.y + bbox.height) result = bbox.getTopCenter();
	else result = bbox.getBottomCenter();
	return options.rotate ? result.rotate(-angle, center) : result;
};
/**
* Places the anchor of the edge in the middle of the side of view bbox
* closest to the other endpoint.
*/
var midSide = resolve$1(middleSide);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/node-anchor/main.js
var main_exports$4 = /* @__PURE__ */ __exportAll({
	bottom: () => bottom,
	bottomLeft: () => bottomLeft,
	bottomRight: () => bottomRight,
	center: () => center,
	left: () => left,
	midSide: () => midSide,
	nodeCenter: () => nodeCenter,
	orth: () => orth$2,
	right: () => right,
	top: () => top,
	topLeft: () => topLeft,
	topRight: () => topRight
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/node-anchor/index.js
var NodeAnchor;
(function(NodeAnchor) {
	NodeAnchor.presets = main_exports$4;
	NodeAnchor.registry = Registry.create({ type: "node endpoint" });
	NodeAnchor.registry.register(NodeAnchor.presets, true);
})(NodeAnchor || (NodeAnchor = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/edge-anchor/ratio.js
var ratio = function(view, magnet, ref, options) {
	let ratio = options.ratio != null ? options.ratio : .5;
	if (ratio > 1) ratio /= 100;
	return view.getPointAtRatio(ratio);
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/edge-anchor/length.js
var length = function(view, magnet, ref, options) {
	const length = options.length != null ? options.length : 20;
	return view.getPointAtLength(length);
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/edge-anchor/closest.js
var getClosestPoint = function(view, magnet, refPoint, options) {
	const closestPoint = view.getClosestPoint(refPoint);
	return closestPoint != null ? closestPoint : new Point();
};
var closest = resolve$1(getClosestPoint);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/edge-anchor/orth.js
var orthogonal = function(view, magnet, refPoint, options) {
	const OFFSET = 1e6;
	const path = view.getConnection();
	const segmentSubdivisions = view.getConnectionSubdivisions();
	const vLine = new Line(refPoint.clone().translate(0, OFFSET), refPoint.clone().translate(0, -1e6));
	const hLine = new Line(refPoint.clone().translate(OFFSET, 0), refPoint.clone().translate(-1e6, 0));
	const vIntersections = vLine.intersect(path, { segmentSubdivisions });
	const hIntersections = hLine.intersect(path, { segmentSubdivisions });
	const intersections = [];
	if (vIntersections) intersections.push(...vIntersections);
	if (hIntersections) intersections.push(...hIntersections);
	if (intersections.length > 0) return refPoint.closest(intersections);
	if (options.fallbackAt != null) return getPointAtEdge(view, options.fallbackAt);
	return call$1(getClosestPoint, this, view, magnet, refPoint, options);
};
var orth$1 = resolve$1(orthogonal);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/edge-anchor/main.js
var main_exports$3 = /* @__PURE__ */ __exportAll({
	closest: () => closest,
	length: () => length,
	orth: () => orth$1,
	ratio: () => ratio
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/edge-anchor/index.js
var EdgeAnchor;
(function(EdgeAnchor) {
	EdgeAnchor.presets = main_exports$3;
	EdgeAnchor.registry = Registry.create({ type: "edge endpoint" });
	EdgeAnchor.registry.register(EdgeAnchor.presets, true);
})(EdgeAnchor || (EdgeAnchor = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-point/util.js
function offset(p1, p2, offset) {
	let tx;
	if (typeof offset === "object") {
		if (Number.isFinite(offset.y)) {
			const { start, end } = new Line(p2, p1).parallel(offset.y);
			p2 = start;
			p1 = end;
		}
		tx = offset.x;
	} else tx = offset;
	if (tx == null || !Number.isFinite(tx)) return p1;
	const length = p1.distance(p2);
	if (tx === 0 && length > 0) return p1;
	return p1.move(p2, -Math.min(tx, length - 1));
}
function getStrokeWidth(magnet) {
	const stroke = magnet.getAttribute("stroke-width");
	if (stroke === null) return 0;
	return parseFloat(stroke) || 0;
}
function findShapeNode(magnet) {
	if (magnet == null) return null;
	let node = magnet;
	do {
		let tagName = node.tagName;
		if (typeof tagName !== "string") return null;
		tagName = tagName.toUpperCase();
		if (tagName === "G") node = node.firstElementChild;
		else if (tagName === "TITLE") node = node.nextElementSibling;
		else break;
	} while (node);
	return node;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-point/bbox.js
/**
* Places the connection point at the intersection between the edge
* path end segment and the target node bbox.
*/
var bbox = function(line, view, magnet, options) {
	const bbox = view.getBBoxOfElement(magnet);
	if (options.stroked) bbox.inflate(getStrokeWidth(magnet) / 2);
	const intersections = line.intersect(bbox);
	return offset(intersections && intersections.length ? line.start.closest(intersections) : line.end, line.start, options.offset);
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-point/rect.js
/**
* Places the connection point at the intersection between the
* link path end segment and the element's unrotated bbox.
*/
var rect = function(line, view, magnet, options, type) {
	const cell = view.cell;
	const angle = cell.isNode() ? cell.getAngle() : 0;
	if (angle === 0) return call$1(bbox, this, line, view, magnet, options, type);
	const bboxRaw = view.getUnrotatedBBoxOfElement(magnet);
	if (options.stroked) bboxRaw.inflate(getStrokeWidth(magnet) / 2);
	const center = bboxRaw.getCenter();
	const lineRaw = line.clone().rotate(angle, center);
	const intersections = lineRaw.setLength(1e6).intersect(bboxRaw);
	return offset(intersections && intersections.length ? lineRaw.start.closest(intersections).rotate(-angle, center) : line.end, line.start, options.offset);
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-point/boundary.js
/**
* Places the connection point at the intersection between the
* edge path end segment and the actual shape of the target magnet.
*/
var boundary = function(line, view, magnet, options) {
	let node;
	let intersection;
	const anchor = line.end;
	const selector = options.selector;
	if (typeof selector === "string") node = view.findOne(selector);
	else if (Array.isArray(selector)) node = getByPath(magnet, selector);
	else node = findShapeNode(magnet);
	if (!isSVGGraphicsElement(node)) {
		if (node === magnet || !isSVGGraphicsElement(magnet)) return anchor;
		node = magnet;
	}
	const localShape = view.getShapeOfElement(node);
	const magnetMatrix = view.getMatrixOfElement(node);
	const translateMatrix = view.getRootTranslatedMatrix();
	const rotateMatrix = view.getRootRotatedMatrix();
	const targetMatrix = translateMatrix.multiply(rotateMatrix).multiply(magnetMatrix);
	const localMatrix = targetMatrix.inverse();
	const localLine = Util$2.transformLine(line, localMatrix);
	const localRef = localLine.start.clone();
	const data = view.getDataOfElement(node);
	if (options.insideout === false) {
		if (data.shapeBBox == null) data.shapeBBox = localShape.bbox();
		const localBBox = data.shapeBBox;
		if (localBBox != null && localBBox.containsPoint(localRef)) return anchor;
	}
	if (options.extrapolate === true) localLine.setLength(1e6);
	let pathOptions;
	if (Path$1.isPath(localShape)) {
		const precision = options.precision || 2;
		if (data.segmentSubdivisions == null) data.segmentSubdivisions = localShape.getSegmentSubdivisions({ precision });
		pathOptions = {
			precision,
			segmentSubdivisions: data.segmentSubdivisions
		};
		intersection = localLine.intersect(localShape, pathOptions);
	} else intersection = localLine.intersect(localShape);
	if (intersection) {
		if (Array.isArray(intersection)) intersection = localRef.closest(intersection);
	} else if (options.sticky === true) if (Rectangle.isRectangle(localShape)) intersection = localShape.getNearestPointToPoint(localRef);
	else if (Ellipse$1.isEllipse(localShape)) intersection = localShape.intersectsWithLineFromCenterToPoint(localRef);
	else intersection = localShape.closestPoint(localRef, pathOptions);
	const cp = intersection ? Util$2.transformPoint(intersection, targetMatrix) : anchor;
	let cpOffset = options.offset || 0;
	if (options.stroked !== false) if (typeof cpOffset === "object") {
		cpOffset = Object.assign({}, cpOffset);
		if (cpOffset.x == null) cpOffset.x = 0;
		cpOffset.x += getStrokeWidth(node) / 2;
	} else cpOffset += getStrokeWidth(node) / 2;
	return offset(cp, line.start, cpOffset);
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-point/anchor.js
function alignLine(line, type, offset = 0) {
	const { start, end } = line;
	let a;
	let b;
	let direction;
	let coordinate;
	switch (type) {
		case "left":
			coordinate = "x";
			a = end;
			b = start;
			direction = -1;
			break;
		case "right":
			coordinate = "x";
			a = start;
			b = end;
			direction = 1;
			break;
		case "top":
			coordinate = "y";
			a = end;
			b = start;
			direction = -1;
			break;
		case "bottom":
			coordinate = "y";
			a = start;
			b = end;
			direction = 1;
			break;
		default: return;
	}
	if (start[coordinate] < end[coordinate]) a[coordinate] = b[coordinate];
	else b[coordinate] = a[coordinate];
	if (Number.isFinite(offset)) {
		a[coordinate] += direction * offset;
		b[coordinate] += direction * offset;
	}
}
/**
* Places the connection point at the edge's endpoint.
*/
var anchor = function(line, view, magnet, options) {
	const { alignOffset, align } = options;
	if (align) alignLine(line, align, alignOffset);
	return offset(line.end, line.start, options.offset);
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-point/main.js
var main_exports$2 = /* @__PURE__ */ __exportAll({
	anchor: () => anchor,
	bbox: () => bbox,
	boundary: () => boundary,
	rect: () => rect
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connection-point/index.js
var ConnectionPoint;
(function(ConnectionPoint) {
	ConnectionPoint.presets = main_exports$2;
	ConnectionPoint.registry = Registry.create({ type: "connection point" });
	ConnectionPoint.registry.register(ConnectionPoint.presets, true);
})(ConnectionPoint || (ConnectionPoint = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/normal.js
var normal$1 = function(vertices) {
	return [...vertices];
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/oneside.js
/**
* Routes the edge always to/from a certain side
*/
var oneSide = function(vertices, options, edgeView) {
	const side = options.side || "bottom";
	const padding = normalizeSides(options.padding || 40);
	const sourceBBox = edgeView.sourceBBox;
	const targetBBox = edgeView.targetBBox;
	const sourcePoint = sourceBBox.getCenter();
	const targetPoint = targetBBox.getCenter();
	let coord;
	let dim;
	let factor;
	switch (side) {
		case "top":
			factor = -1;
			coord = "y";
			dim = "height";
			break;
		case "left":
			factor = -1;
			coord = "x";
			dim = "width";
			break;
		case "right":
			factor = 1;
			coord = "x";
			dim = "width";
			break;
		default:
			factor = 1;
			coord = "y";
			dim = "height";
	}
	sourcePoint[coord] += factor * (sourceBBox[dim] / 2 + padding[side]);
	targetPoint[coord] += factor * (targetBBox[dim] / 2 + padding[side]);
	if (factor * (sourcePoint[coord] - targetPoint[coord]) > 0) targetPoint[coord] = sourcePoint[coord];
	else sourcePoint[coord] = targetPoint[coord];
	return [
		sourcePoint.toJSON(),
		...vertices,
		targetPoint.toJSON()
	];
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/util.js
function getPointBBox(p) {
	return new Rectangle(p.x, p.y, 0, 0);
}
function getPaddingBox(options = {}) {
	const sides = normalizeSides(options.padding || 20);
	return {
		x: -sides.left,
		y: -sides.top,
		width: sides.left + sides.right,
		height: sides.top + sides.bottom
	};
}
function getSourceBBox$1(view, options = {}) {
	return view.sourceBBox.clone().moveAndExpand(getPaddingBox(options));
}
function getTargetBBox$1(view, options = {}) {
	return view.targetBBox.clone().moveAndExpand(getPaddingBox(options));
}
function getSourceAnchor(view, options = {}) {
	if (view.sourceAnchor) return view.sourceAnchor;
	return getSourceBBox$1(view, options).getCenter();
}
function getTargetAnchor(view, options = {}) {
	if (view.targetAnchor) return view.targetAnchor;
	return getTargetBBox$1(view, options).getCenter();
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/orth.js
/**
* Returns a route with orthogonal line segments.
*/
var orth = function(vertices, options, edgeView) {
	let sourceBBox = getSourceBBox$1(edgeView, options);
	let targetBBox = getTargetBBox$1(edgeView, options);
	const sourceAnchor = getSourceAnchor(edgeView, options);
	const targetAnchor = getTargetAnchor(edgeView, options);
	sourceBBox = sourceBBox.union(getPointBBox(sourceAnchor));
	targetBBox = targetBBox.union(getPointBBox(targetAnchor));
	const points = vertices.map((p) => Point.create(p));
	points.unshift(sourceAnchor);
	points.push(targetAnchor);
	let bearing = null;
	const result = [];
	for (let i = 0, len = points.length - 1; i < len; i += 1) {
		let route = null;
		const from = points[i];
		const to = points[i + 1];
		const isOrthogonal = Private$1.getBearing(from, to) != null;
		if (i === 0) {
			if (i + 1 === len) {
				if (sourceBBox.intersectsWithRect(targetBBox.clone().inflate(1))) route = Private$1.insideNode(from, to, sourceBBox, targetBBox);
				else if (!isOrthogonal) route = Private$1.nodeToNode(from, to, sourceBBox, targetBBox);
			} else if (sourceBBox.containsPoint(to)) route = Private$1.insideNode(from, to, sourceBBox, getPointBBox(to).moveAndExpand(getPaddingBox(options)));
			else if (!isOrthogonal) route = Private$1.nodeToVertex(from, to, sourceBBox);
		} else if (i + 1 === len) {
			const isOrthogonalLoop = isOrthogonal && Private$1.getBearing(to, from) === bearing;
			if (targetBBox.containsPoint(from) || isOrthogonalLoop) route = Private$1.insideNode(from, to, getPointBBox(from).moveAndExpand(getPaddingBox(options)), targetBBox, bearing);
			else if (!isOrthogonal) route = Private$1.vertexToNode(from, to, targetBBox, bearing);
		} else if (!isOrthogonal) route = Private$1.vertexToVertex(from, to, bearing);
		if (route) {
			result.push(...route.points);
			bearing = route.direction;
		} else bearing = Private$1.getBearing(from, to);
		if (i + 1 < len) result.push(to);
	}
	return result;
};
var Private$1;
(function(Private) {
	/**
	* Bearing to opposite bearing map
	*/
	const opposites = {
		N: "S",
		S: "N",
		E: "W",
		W: "E"
	};
	/**
	* Bearing to radians map
	*/
	const radians = {
		N: -Math.PI / 2 * 3,
		S: -Math.PI / 2,
		E: 0,
		W: Math.PI
	};
	/**
	* Returns a point `p` where lines p,p1 and p,p2 are perpendicular
	* and p is not contained in the given box
	*/
	function freeJoin(p1, p2, bbox) {
		let p = new Point(p1.x, p2.y);
		if (bbox.containsPoint(p)) p = new Point(p2.x, p1.y);
		return p;
	}
	/**
	* Returns either width or height of a bbox based on the given bearing.
	*/
	function getBBoxSize(bbox, bearing) {
		return bbox[bearing === "W" || bearing === "E" ? "width" : "height"];
	}
	Private.getBBoxSize = getBBoxSize;
	function getBearing(from, to) {
		if (from.x === to.x) return from.y > to.y ? "N" : "S";
		if (from.y === to.y) return from.x > to.x ? "W" : "E";
		return null;
	}
	Private.getBearing = getBearing;
	function vertexToVertex(from, to, bearing) {
		const p1 = new Point(from.x, to.y);
		const p2 = new Point(to.x, from.y);
		const d1 = getBearing(from, p1);
		const d2 = getBearing(from, p2);
		const opposite = bearing ? opposites[bearing] : null;
		const p = d1 === bearing || d1 !== opposite && (d2 === opposite || d2 !== bearing) ? p1 : p2;
		return {
			points: [p],
			direction: getBearing(p, to)
		};
	}
	Private.vertexToVertex = vertexToVertex;
	function nodeToVertex(from, to, fromBBox) {
		const p = freeJoin(from, to, fromBBox);
		return {
			points: [p],
			direction: getBearing(p, to)
		};
	}
	Private.nodeToVertex = nodeToVertex;
	function vertexToNode(from, to, toBBox, bearing) {
		const points = [new Point(from.x, to.y), new Point(to.x, from.y)];
		const freePoints = points.filter((p) => !toBBox.containsPoint(p));
		const freeBearingPoints = freePoints.filter((p) => getBearing(p, from) !== bearing);
		let p;
		if (freeBearingPoints.length > 0) {
			p = freeBearingPoints.filter((p) => getBearing(from, p) === bearing).pop();
			p = p || freeBearingPoints[0];
			return {
				points: [p],
				direction: getBearing(p, to)
			};
		}
		{
			p = difference(points, freePoints)[0];
			const p2 = Point.create(to).move(p, -getBBoxSize(toBBox, bearing) / 2);
			return {
				points: [freeJoin(p2, from, toBBox), p2],
				direction: getBearing(p2, to)
			};
		}
	}
	Private.vertexToNode = vertexToNode;
	function nodeToNode(from, to, fromBBox, toBBox) {
		let route = nodeToVertex(to, from, toBBox);
		const p1 = route.points[0];
		if (fromBBox.containsPoint(p1)) {
			route = nodeToVertex(from, to, fromBBox);
			const p2 = route.points[0];
			if (toBBox.containsPoint(p2)) {
				const fromBorder = Point.create(from).move(p2, -getBBoxSize(fromBBox, getBearing(from, p2)) / 2);
				const toBorder = Point.create(to).move(p1, -getBBoxSize(toBBox, getBearing(to, p1)) / 2);
				const mid = new Line(fromBorder, toBorder).getCenter();
				const startRoute = nodeToVertex(from, mid, fromBBox);
				const endRoute = vertexToVertex(mid, to, startRoute.direction);
				route.points = [startRoute.points[0], endRoute.points[0]];
				route.direction = endRoute.direction;
			}
		}
		return route;
	}
	Private.nodeToNode = nodeToNode;
	function insideNode(from, to, fromBBox, toBBox, bearing) {
		const boundary = fromBBox.union(toBBox).inflate(1);
		const center = boundary.getCenter();
		const reversed = center.distance(to) > center.distance(from);
		const start = reversed ? to : from;
		const end = reversed ? from : to;
		let p1;
		let p2;
		let p3;
		if (bearing) {
			p1 = Point.fromPolar(boundary.width + boundary.height, radians[bearing], start);
			p1 = boundary.getNearestPointToPoint(p1).move(p1, -1);
		} else p1 = boundary.getNearestPointToPoint(start).move(start, 1);
		p2 = freeJoin(p1, end, boundary);
		let points;
		if (p1.round().equals(p2.round())) {
			p2 = Point.fromPolar(boundary.width + boundary.height, Angle.toRad(p1.theta(start)) + Math.PI / 2, end);
			p2 = boundary.getNearestPointToPoint(p2).move(end, 1).round();
			p3 = freeJoin(p1, p2, boundary);
			points = reversed ? [
				p2,
				p3,
				p1
			] : [
				p1,
				p3,
				p2
			];
		} else points = reversed ? [p2, p1] : [p1, p2];
		const direction = reversed ? getBearing(p1, to) : getBearing(p2, to);
		return {
			points,
			direction
		};
	}
	Private.insideNode = insideNode;
})(Private$1 || (Private$1 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/manhattan/options.js
var defaults$1 = {
	step: 10,
	maxLoopCount: 2e3,
	precision: 1,
	maxDirectionChange: 90,
	perpendicular: true,
	excludeTerminals: [],
	excludeNodes: [],
	excludeShapes: [],
	startDirections: [
		"top",
		"right",
		"bottom",
		"left"
	],
	endDirections: [
		"top",
		"right",
		"bottom",
		"left"
	],
	directionMap: {
		top: {
			x: 0,
			y: -1
		},
		right: {
			x: 1,
			y: 0
		},
		bottom: {
			x: 0,
			y: 1
		},
		left: {
			x: -1,
			y: 0
		}
	},
	cost() {
		return resolve(this.step, this);
	},
	directions() {
		const step = resolve(this.step, this);
		const cost = resolve(this.cost, this);
		return [
			{
				cost,
				offsetX: step,
				offsetY: 0
			},
			{
				cost,
				offsetX: -step,
				offsetY: 0
			},
			{
				cost,
				offsetX: 0,
				offsetY: step
			},
			{
				cost,
				offsetX: 0,
				offsetY: -step
			}
		];
	},
	penalties() {
		const step = resolve(this.step, this);
		return {
			0: 0,
			45: step / 2,
			90: step / 2
		};
	},
	paddingBox() {
		const step = resolve(this.step, this);
		return {
			x: -step,
			y: -step,
			width: 2 * step,
			height: 2 * step
		};
	},
	fallbackRouter: orth,
	draggingRouter: null,
	snapToGrid: true
};
function resolve(input, options) {
	if (typeof input === "function") return input.call(options);
	return input;
}
function resolveOptions(options) {
	const result = Object.keys(options).reduce((memo, key) => {
		const ret = memo;
		if (key === "fallbackRouter" || key === "draggingRouter" || key === "fallbackRoute") ret[key] = options[key];
		else ret[key] = resolve(options[key], options);
		return memo;
	}, {});
	if (result.padding) {
		const sides = normalizeSides(result.padding);
		result.paddingBox = {
			x: -sides.left,
			y: -sides.top,
			width: sides.left + sides.right,
			height: sides.top + sides.bottom
		};
	}
	result.directions.forEach((direction) => {
		const point1 = new Point(0, 0);
		const point2 = new Point(direction.offsetX, direction.offsetY);
		direction.angle = Angle.normalize(point1.theta(point2));
	});
	return result;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/manhattan/sorted-set.js
var OPEN = 1;
var CLOSE = 2;
var SortedSet = class {
	constructor() {
		this.items = [];
		this.hash = {};
		this.values = {};
	}
	add(item, value) {
		if (this.hash[item]) this.items.splice(this.items.indexOf(item), 1);
		else this.hash[item] = OPEN;
		this.values[item] = value;
		const index = sortedIndexBy(this.items, item, (key) => this.values[key]);
		this.items.splice(index, 0, item);
	}
	pop() {
		const item = this.items.shift();
		if (item) this.hash[item] = CLOSE;
		return item;
	}
	isOpen(item) {
		return this.hash[item] === OPEN;
	}
	isClose(item) {
		return this.hash[item] === CLOSE;
	}
	isEmpty() {
		return this.items.length === 0;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/manhattan/obstacle-map.js
/**
* Helper structure to identify whether a point lies inside an obstacle.
*/
var ObstacleMap = class {
	constructor(options) {
		this.options = options;
		this.mapGridSize = 100;
		this.map = {};
	}
	/**
	* Builds a map of all nodes for quicker obstacle queries i.e. is a point
	* contained in any obstacle?
	*
	* A simplified grid search.
	*/
	build(model, edge) {
		const options = this.options;
		const excludedTerminals = options.excludeTerminals.reduce((memo, type) => {
			const terminal = edge[type];
			if (terminal) {
				const cell = model.getCell(terminal.cell);
				if (cell) memo.push(cell);
			}
			return memo;
		}, []);
		let excludedAncestors = [];
		const source = model.getCell(edge.getSourceCellId());
		if (source) excludedAncestors = union(excludedAncestors, source.getAncestors().map((cell) => cell.id));
		const target = model.getCell(edge.getTargetCellId());
		if (target) excludedAncestors = union(excludedAncestors, target.getAncestors().map((cell) => cell.id));
		const mapGridSize = this.mapGridSize;
		model.getNodes().reduce((map, node) => {
			const excludedTerminal = excludedTerminals.some((cell) => cell.id === node.id);
			const excludedShape = node.shape ? options.excludeShapes.includes(node.shape) : false;
			const excludedNode = options.excludeNodes.some((item) => {
				if (typeof item === "string") return node.id === item;
				return item === node;
			});
			const excludedAncestor = excludedAncestors.includes(node.id);
			const excluded = excludedShape || excludedTerminal || excludedNode || excludedAncestor;
			if (node.isVisible() && !excluded) {
				const bbox = node.getBBox().moveAndExpand(options.paddingBox);
				const origin = bbox.getOrigin().snapToGrid(mapGridSize);
				const corner = bbox.getCorner().snapToGrid(mapGridSize);
				for (let x = origin.x; x <= corner.x; x += mapGridSize) for (let y = origin.y; y <= corner.y; y += mapGridSize) {
					const key = new Point(x, y).toString();
					if (map[key] == null) map[key] = [];
					map[key].push(bbox);
				}
			}
			return map;
		}, this.map);
		return this;
	}
	isAccessible(point) {
		const key = point.clone().snapToGrid(this.mapGridSize).toString();
		const rects = this.map[key];
		return rects ? rects.every((rect) => !rect.containsPoint(point)) : true;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/manhattan/util.js
function getSourceBBox(view, options) {
	const bbox = view.sourceBBox.clone();
	if (options && options.paddingBox) return bbox.moveAndExpand(options.paddingBox);
	return bbox;
}
function getTargetBBox(view, options) {
	const bbox = view.targetBBox.clone();
	if (options && options.paddingBox) return bbox.moveAndExpand(options.paddingBox);
	return bbox;
}
function getSourceEndpoint(view, options) {
	if (view.sourceAnchor) return view.sourceAnchor;
	return getSourceBBox(view, options).getCenter();
}
function getTargetEndpoint(view, options) {
	if (view.targetAnchor) return view.targetAnchor;
	return getTargetBBox(view, options).getCenter();
}
function getDirectionAngle(start, end, directionCount, grid, options) {
	const quadrant = 360 / directionCount;
	const angleTheta = start.theta(fixAngleEnd(start, end, grid, options));
	const normalizedAngle = Angle.normalize(angleTheta + quadrant / 2);
	return quadrant * Math.floor(normalizedAngle / quadrant);
}
function fixAngleEnd(start, end, grid, options) {
	const step = options.step;
	const diffX = end.x - start.x;
	const diffY = end.y - start.y;
	const gridStepsX = diffX / grid.x;
	const gridStepsY = diffY / grid.y;
	const distanceX = gridStepsX * step;
	const distanceY = gridStepsY * step;
	return new Point(start.x + distanceX, start.y + distanceY);
}
/**
* Returns the change in direction between two direction angles.
*/
function getDirectionChange(angle1, angle2) {
	const change = Math.abs(angle1 - angle2);
	return change > 180 ? 360 - change : change;
}
function getGridOffsets(grid, options) {
	const step = options.step;
	options.directions.forEach((direction) => {
		direction.gridOffsetX = direction.offsetX / step * grid.x;
		direction.gridOffsetY = direction.offsetY / step * grid.y;
	});
	return options.directions;
}
function getGrid(step, source, target) {
	return {
		source: source.clone(),
		x: getGridDimension(target.x - source.x, step),
		y: getGridDimension(target.y - source.y, step)
	};
}
function getGridDimension(diff, step) {
	if (!diff) return step;
	const abs = Math.abs(diff);
	const count = Math.round(abs / step);
	if (!count) return abs;
	return step + (abs - count * step) / count;
}
function snapGrid(point, grid) {
	const source = grid.source;
	const x = GeometryUtil.snapToGrid(point.x - source.x, grid.x) + source.x;
	const y = GeometryUtil.snapToGrid(point.y - source.y, grid.y) + source.y;
	return new Point(x, y);
}
function round(point, precision) {
	return point.round(precision);
}
function align(point, grid, precision) {
	return round(snapGrid(point.clone(), grid), precision);
}
function getKey(point) {
	return point.toString();
}
function normalizePoint(point) {
	return new Point(point.x === 0 ? 0 : Math.abs(point.x) / point.x, point.y === 0 ? 0 : Math.abs(point.y) / point.y);
}
function getCost(from, anchors) {
	let min = Infinity;
	for (let i = 0, len = anchors.length; i < len; i += 1) {
		const dist = from.manhattanDistance(anchors[i]);
		if (dist < min) min = dist;
	}
	return min;
}
function getRectPoints(anchor, bbox, directionList, grid, options) {
	const precision = options.precision;
	const directionMap = options.directionMap;
	const centerVector = anchor.diff(bbox.getCenter());
	const rectPoints = Object.keys(directionMap).reduce((res, key) => {
		if (directionList.includes(key)) {
			const direction = directionMap[key];
			const ending = new Point(anchor.x + direction.x * (Math.abs(centerVector.x) + bbox.width), anchor.y + direction.y * (Math.abs(centerVector.y) + bbox.height));
			const intersections = new Line(anchor, ending).intersect(bbox) || [];
			let farthestIntersectionDistance;
			let farthestIntersection = null;
			for (let i = 0; i < intersections.length; i += 1) {
				const intersection = intersections[i];
				const distance = anchor.squaredDistance(intersection);
				if (farthestIntersectionDistance == null || distance > farthestIntersectionDistance) {
					farthestIntersectionDistance = distance;
					farthestIntersection = intersection;
				}
			}
			if (farthestIntersection) {
				let target = align(farthestIntersection, grid, precision);
				if (bbox.containsPoint(target)) target = align(target.translate(direction.x * grid.x, direction.y * grid.y), grid, precision);
				res.push(target);
			}
		}
		return res;
	}, []);
	if (!bbox.containsPoint(anchor)) rectPoints.push(align(anchor, grid, precision));
	return rectPoints;
}
function reconstructRoute(parents, points, tailPoint, from, to) {
	const route = [];
	let prevDiff = normalizePoint(to.diff(tailPoint));
	let currentKey = getKey(tailPoint);
	let parent = parents[currentKey];
	let point;
	while (parent) {
		point = points[currentKey];
		const diff = normalizePoint(point.diff(parent));
		if (!diff.equals(prevDiff)) {
			route.unshift(point);
			prevDiff = diff;
		}
		currentKey = getKey(parent);
		parent = parents[currentKey];
	}
	const leadPoint = points[currentKey];
	if (!normalizePoint(leadPoint.diff(from)).equals(prevDiff)) route.unshift(leadPoint);
	return route;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/manhattan/router.js
/**
* Finds the route between two points (`from`, `to`).
*/
function findRoute(edgeView, from, to, map, options) {
	const precision = options.precision;
	let sourceEndpoint;
	let targetEndpoint;
	if (Rectangle.isRectangle(from)) sourceEndpoint = round(getSourceEndpoint(edgeView, options).clone(), precision);
	else sourceEndpoint = round(from.clone(), precision);
	if (Rectangle.isRectangle(to)) targetEndpoint = round(getTargetEndpoint(edgeView, options).clone(), precision);
	else targetEndpoint = round(to.clone(), precision);
	const grid = getGrid(options.step, sourceEndpoint, targetEndpoint);
	const startPoint = sourceEndpoint;
	const endPoint = targetEndpoint;
	let startPoints;
	let endPoints;
	if (Rectangle.isRectangle(from)) startPoints = getRectPoints(startPoint, from, options.startDirections, grid, options);
	else startPoints = [startPoint];
	if (Rectangle.isRectangle(to)) endPoints = getRectPoints(targetEndpoint, to, options.endDirections, grid, options);
	else endPoints = [endPoint];
	startPoints = startPoints.filter((p) => map.isAccessible(p));
	endPoints = endPoints.filter((p) => map.isAccessible(p));
	if (startPoints.length > 0 && endPoints.length > 0) {
		const openSet = new SortedSet();
		const points = {};
		const parents = {};
		const costs = {};
		for (let i = 0, n = startPoints.length; i < n; i += 1) {
			const startPoint = startPoints[i];
			const key = getKey(startPoint);
			openSet.add(key, getCost(startPoint, endPoints));
			points[key] = startPoint;
			costs[key] = 0;
		}
		const previousRouteDirectionAngle = options.previousDirectionAngle;
		const isPathBeginning = previousRouteDirectionAngle === void 0;
		let direction;
		let directionChange;
		const directions = getGridOffsets(grid, options);
		const numDirections = directions.length;
		const endPointsKeys = endPoints.reduce((res, endPoint) => {
			const key = getKey(endPoint);
			res.push(key);
			return res;
		}, []);
		const sameStartEndPoints = Point.equalPoints(startPoints, endPoints);
		let loopsRemaining = options.maxLoopCount;
		while (!openSet.isEmpty() && loopsRemaining > 0) {
			const currentKey = openSet.pop();
			const currentPoint = points[currentKey];
			const currentParent = parents[currentKey];
			const currentCost = costs[currentKey];
			const isStartPoint = currentPoint.equals(startPoint);
			const isRouteBeginning = currentParent == null;
			let previousDirectionAngle;
			if (!isRouteBeginning) previousDirectionAngle = getDirectionAngle(currentParent, currentPoint, numDirections, grid, options);
			else if (!isPathBeginning) previousDirectionAngle = previousRouteDirectionAngle;
			else if (!isStartPoint) previousDirectionAngle = getDirectionAngle(startPoint, currentPoint, numDirections, grid, options);
			else previousDirectionAngle = null;
			if (!(isRouteBeginning && sameStartEndPoints) && endPointsKeys.indexOf(currentKey) >= 0) {
				options.previousDirectionAngle = previousDirectionAngle;
				return reconstructRoute(parents, points, currentPoint, startPoint, endPoint);
			}
			for (let i = 0; i < numDirections; i += 1) {
				direction = directions[i];
				const directionAngle = direction.angle;
				directionChange = getDirectionChange(previousDirectionAngle, directionAngle);
				if (!(isPathBeginning && isStartPoint) && directionChange > options.maxDirectionChange) continue;
				const neighborPoint = align(currentPoint.clone().translate(direction.gridOffsetX || 0, direction.gridOffsetY || 0), grid, precision);
				const neighborKey = getKey(neighborPoint);
				if (openSet.isClose(neighborKey) || !map.isAccessible(neighborPoint)) continue;
				if (endPointsKeys.indexOf(neighborKey) >= 0) {
					if (!neighborPoint.equals(endPoint)) {
						if (getDirectionChange(directionAngle, getDirectionAngle(neighborPoint, endPoint, numDirections, grid, options)) > options.maxDirectionChange) continue;
					}
				}
				const neighborCost = direction.cost;
				const neighborPenalty = isStartPoint ? 0 : options.penalties[directionChange];
				const costFromStart = currentCost + neighborCost + neighborPenalty;
				if (!openSet.isOpen(neighborKey) || costFromStart < costs[neighborKey]) {
					points[neighborKey] = neighborPoint;
					parents[neighborKey] = currentPoint;
					costs[neighborKey] = costFromStart;
					openSet.add(neighborKey, costFromStart + getCost(neighborPoint, endPoints));
				}
			}
			loopsRemaining -= 1;
		}
	}
	if (options.fallbackRoute) return call$1(options.fallbackRoute, this, startPoint, endPoint, options);
	return null;
}
function snap(vertices, gridSize = 10) {
	if (vertices.length <= 1) return vertices;
	for (let i = 0, len = vertices.length; i < len - 1; i += 1) {
		const first = vertices[i];
		const second = vertices[i + 1];
		if (first.x === second.x) {
			const x = gridSize * Math.round(first.x / gridSize);
			if (first.x !== x) {
				first.x = x;
				second.x = x;
			}
		} else if (first.y === second.y) {
			const y = gridSize * Math.round(first.y / gridSize);
			if (first.y !== y) {
				first.y = y;
				second.y = y;
			}
		}
	}
	return vertices;
}
var router = function(vertices, optionsRaw, edgeView) {
	const options = resolveOptions(optionsRaw);
	const sourceBBox = getSourceBBox(edgeView, options);
	const targetBBox = getTargetBBox(edgeView, options);
	const sourceEndpoint = getSourceEndpoint(edgeView, options);
	const map = new ObstacleMap(options).build(edgeView.graph.model, edgeView.cell);
	const oldVertices = vertices.map((p) => Point.create(p));
	const newVertices = [];
	let tailPoint = sourceEndpoint;
	let from;
	let to;
	for (let i = 0, len = oldVertices.length; i <= len; i += 1) {
		let partialRoute = null;
		from = to || sourceBBox;
		to = oldVertices[i];
		if (to == null) {
			to = targetBBox;
			const edge = edgeView.cell;
			if ((edge.getSourceCellId() == null || edge.getTargetCellId() == null) && typeof options.draggingRouter === "function") {
				const dragFrom = from === sourceBBox ? sourceEndpoint : from;
				const dragTo = to.getOrigin();
				partialRoute = call$1(options.draggingRouter, edgeView, dragFrom, dragTo, options);
			}
		}
		if (partialRoute == null) partialRoute = findRoute(edgeView, from, to, map, options);
		if (partialRoute === null) {
			console.warn(`Unable to execute manhattan algorithm, use orth instead`);
			return call$1(options.fallbackRouter, this, vertices, options, edgeView);
		}
		const leadPoint = partialRoute[0];
		if (leadPoint && leadPoint.equals(tailPoint)) partialRoute.shift();
		tailPoint = partialRoute[partialRoute.length - 1] || tailPoint;
		newVertices.push(...partialRoute);
	}
	if (options.snapToGrid) return snap(newVertices, edgeView.graph.grid.getGridSize());
	return newVertices;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/manhattan/index.js
var manhattan = function(vertices, options, edgeView) {
	return call$1(router, this, vertices, Object.assign(Object.assign({}, defaults$1), options), edgeView);
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/metro.js
var defaults = {
	maxDirectionChange: 45,
	directions() {
		const step = resolve(this.step, this);
		const cost = resolve(this.cost, this);
		const diagonalCost = Math.ceil(Math.sqrt(step * step << 1));
		return [
			{
				cost,
				offsetX: step,
				offsetY: 0
			},
			{
				cost: diagonalCost,
				offsetX: step,
				offsetY: step
			},
			{
				cost,
				offsetX: 0,
				offsetY: step
			},
			{
				cost: diagonalCost,
				offsetX: -step,
				offsetY: step
			},
			{
				cost,
				offsetX: -step,
				offsetY: 0
			},
			{
				cost: diagonalCost,
				offsetX: -step,
				offsetY: -step
			},
			{
				cost,
				offsetX: 0,
				offsetY: -step
			},
			{
				cost: diagonalCost,
				offsetX: step,
				offsetY: -step
			}
		];
	},
	fallbackRoute(from, to, options) {
		const theta = from.theta(to);
		const route = [];
		let a = {
			x: to.x,
			y: from.y
		};
		let b = {
			x: from.x,
			y: to.y
		};
		if (theta % 180 > 90) {
			const t = a;
			a = b;
			b = t;
		}
		const p1 = theta % 90 < 45 ? a : b;
		const l1 = new Line(from, p1);
		const alpha = 90 * Math.ceil(theta / 90);
		const p2 = Point.fromPolar(l1.squaredLength(), Angle.toRad(alpha + 135), p1);
		const l2 = new Line(to, p2);
		const intersectionPoint = l1.intersectsWithLine(l2);
		const point = intersectionPoint || to;
		const directionFrom = intersectionPoint ? point : from;
		const quadrant = 360 / options.directions.length;
		const angleTheta = directionFrom.theta(to);
		const normalizedAngle = Angle.normalize(angleTheta + quadrant / 2);
		options.previousDirectionAngle = quadrant * Math.floor(normalizedAngle / quadrant);
		if (point) route.push(point.round());
		route.push(to);
		return route;
	}
};
var metro = function(vertices, options, linkView) {
	return call$1(manhattan, this, vertices, Object.assign(Object.assign({}, defaults), options), linkView);
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/er.js
var er = function(vertices, options, edgeView) {
	const offsetRaw = options.offset || 32;
	const min = options.min == null ? 16 : options.min;
	let offset = 0;
	let direction = options.direction;
	const sourceBBox = edgeView.sourceBBox;
	const targetBBox = edgeView.targetBBox;
	const sourcePoint = sourceBBox.getCenter();
	const targetPoint = targetBBox.getCenter();
	if (typeof offsetRaw === "number") offset = offsetRaw;
	if (direction == null) {
		let dx = targetBBox.left - sourceBBox.right;
		let dy = targetBBox.top - sourceBBox.bottom;
		if (dx >= 0 && dy >= 0) direction = dx >= dy ? "L" : "T";
		else if (dx <= 0 && dy >= 0) {
			dx = sourceBBox.left - targetBBox.right;
			if (dx >= 0) direction = dx >= dy ? "R" : "T";
			else direction = "T";
		} else if (dx >= 0 && dy <= 0) {
			dy = sourceBBox.top - targetBBox.bottom;
			if (dy >= 0) direction = dx >= dy ? "L" : "B";
			else direction = "L";
		} else {
			dx = sourceBBox.left - targetBBox.right;
			dy = sourceBBox.top - targetBBox.bottom;
			if (dx >= 0 && dy >= 0) direction = dx >= dy ? "R" : "B";
			else if (dx <= 0 && dy >= 0) direction = "B";
			else if (dx >= 0 && dy <= 0) direction = "R";
			else direction = Math.abs(dx) > Math.abs(dy) ? "R" : "B";
		}
	}
	if (direction === "H") direction = targetPoint.x - sourcePoint.x >= 0 ? "L" : "R";
	else if (direction === "V") direction = targetPoint.y - sourcePoint.y >= 0 ? "T" : "B";
	if (offsetRaw === "center") {
		if (direction === "L") offset = (targetBBox.left - sourceBBox.right) / 2;
		else if (direction === "R") offset = (sourceBBox.left - targetBBox.right) / 2;
		else if (direction === "T") offset = (targetBBox.top - sourceBBox.bottom) / 2;
		else if (direction === "B") offset = (sourceBBox.top - targetBBox.bottom) / 2;
	}
	let coord;
	let dim;
	let factor;
	const horizontal = direction === "L" || direction === "R";
	if (horizontal) {
		if (targetPoint.y === sourcePoint.y) return [...vertices];
		factor = direction === "L" ? 1 : -1;
		coord = "x";
		dim = "width";
	} else {
		if (targetPoint.x === sourcePoint.x) return [...vertices];
		factor = direction === "T" ? 1 : -1;
		coord = "y";
		dim = "height";
	}
	const source = sourcePoint.clone();
	const target = targetPoint.clone();
	source[coord] += factor * (sourceBBox[dim] / 2 + offset);
	target[coord] -= factor * (targetBBox[dim] / 2 + offset);
	if (horizontal) {
		const sourceX = source.x;
		const targetX = target.x;
		const sourceDelta = sourceBBox.width / 2 + min;
		const targetDelta = targetBBox.width / 2 + min;
		if (targetPoint.x > sourcePoint.x) {
			if (targetX <= sourceX) {
				source.x = Math.max(targetX, sourcePoint.x + sourceDelta);
				target.x = Math.min(sourceX, targetPoint.x - targetDelta);
			}
		} else if (targetX >= sourceX) {
			source.x = Math.min(targetX, sourcePoint.x - sourceDelta);
			target.x = Math.max(sourceX, targetPoint.x + targetDelta);
		}
	} else {
		const sourceY = source.y;
		const targetY = target.y;
		const sourceDelta = sourceBBox.height / 2 + min;
		const targetDelta = targetBBox.height / 2 + min;
		if (targetPoint.y > sourcePoint.y) {
			if (targetY <= sourceY) {
				source.y = Math.max(targetY, sourcePoint.y + sourceDelta);
				target.y = Math.min(sourceY, targetPoint.y - targetDelta);
			}
		} else if (targetY >= sourceY) {
			source.y = Math.min(targetY, sourcePoint.y - sourceDelta);
			target.y = Math.max(sourceY, targetPoint.y + targetDelta);
		}
	}
	return [
		source.toJSON(),
		...vertices,
		target.toJSON()
	];
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/loop.js
function rollup(points, merge) {
	if (merge != null && merge !== false) {
		const amount = typeof merge === "boolean" ? 0 : merge;
		if (amount > 0) {
			const center1 = Point.create(points[1]).move(points[2], amount);
			const center2 = Point.create(points[1]).move(points[0], amount);
			return [
				center1.toJSON(),
				...points,
				center2.toJSON()
			];
		}
		{
			const center = points[1];
			return [
				Object.assign({}, center),
				...points,
				Object.assign({}, center)
			];
		}
	}
	return points;
}
var loop$1 = function(vertices, options, edgeView) {
	const width = options.width || 50;
	const halfHeight = (options.height || 80) / 2;
	const angle = options.angle || "auto";
	const sourceAnchor = edgeView.sourceAnchor;
	const targetAnchor = edgeView.targetAnchor;
	const sourceBBox = edgeView.sourceBBox;
	const targetBBox = edgeView.targetBBox;
	if (sourceAnchor.equals(targetAnchor)) {
		const getVertices = (angle) => {
			const rad = Angle.toRad(angle);
			const sin = Math.sin(rad);
			const cos = Math.cos(rad);
			const center = new Point(sourceAnchor.x + cos * width, sourceAnchor.y + sin * width);
			const ref = new Point(center.x - cos * halfHeight, center.y - sin * halfHeight);
			const p1 = ref.clone().rotate(-90, center);
			const p2 = ref.clone().rotate(90, center);
			return [
				p1.toJSON(),
				center.toJSON(),
				p2.toJSON()
			];
		};
		const validate = (end) => {
			const start = sourceAnchor.clone().move(end, -1);
			const line = new Line(start, end);
			return !sourceBBox.containsPoint(end) && !sourceBBox.intersectsWithLine(line);
		};
		const angles = [
			0,
			90,
			180,
			270,
			45,
			135,
			225,
			315
		];
		if (typeof angle === "number") return rollup(getVertices(angle), options.merge);
		const center = sourceBBox.getCenter();
		if (center.equals(sourceAnchor)) return rollup(getVertices(0), options.merge);
		const deg = center.angleBetween(sourceAnchor, center.clone().translate(1, 0));
		let ret = getVertices(deg);
		if (validate(ret[1])) return rollup(ret, options.merge);
		for (let i = 1, l = angles.length; i < l; i += 1) {
			ret = getVertices(deg + angles[i]);
			if (validate(ret[1])) return rollup(ret, options.merge);
		}
		return rollup(ret, options.merge);
	}
	{
		const line = new Line(sourceAnchor, targetAnchor);
		let parallel = line.parallel(-width);
		let center = parallel.getCenter();
		let p1 = parallel.start.clone().move(parallel.end, halfHeight);
		let p2 = parallel.end.clone().move(parallel.start, halfHeight);
		const ref = line.parallel(-1);
		const line1 = new Line(ref.start, center);
		const line2 = new Line(ref.end, center);
		if (sourceBBox.containsPoint(center) || targetBBox.containsPoint(center) || sourceBBox.intersectsWithLine(line1) || sourceBBox.intersectsWithLine(line2) || targetBBox.intersectsWithLine(line1) || targetBBox.intersectsWithLine(line2)) {
			parallel = line.parallel(width);
			center = parallel.getCenter();
			p1 = parallel.start.clone().move(parallel.end, halfHeight);
			p2 = parallel.end.clone().move(parallel.start, halfHeight);
		}
		if (options.merge) {
			const line = new Line(sourceAnchor, targetAnchor);
			const normal = new Line(center, line.center).setLength(Number.MAX_SAFE_INTEGER);
			const intersects1 = sourceBBox.intersectsWithLine(normal);
			const intersects2 = targetBBox.intersectsWithLine(normal);
			const intersects = intersects1 ? Array.isArray(intersects1) ? intersects1 : [intersects1] : [];
			if (intersects2) if (Array.isArray(intersects2)) intersects.push(...intersects2);
			else intersects.push(intersects2);
			const anchor = line.center.closest(intersects);
			if (anchor) {
				edgeView.sourceAnchor = anchor.clone();
				edgeView.targetAnchor = anchor.clone();
			} else {
				edgeView.sourceAnchor = line.center.clone();
				edgeView.targetAnchor = line.center.clone();
			}
		}
		return rollup([
			p1.toJSON(),
			center.toJSON(),
			p2.toJSON()
		], options.merge);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/main.js
var main_exports$1 = /* @__PURE__ */ __exportAll({
	er: () => er,
	loop: () => loop$1,
	manhattan: () => manhattan,
	metro: () => metro,
	normal: () => normal$1,
	oneSide: () => oneSide,
	orth: () => orth
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/router/index.js
var Router;
(function(Router) {
	Router.presets = main_exports$1;
	Router.registry = Registry.create({ type: "router" });
	Router.registry.register(Router.presets, true);
})(Router || (Router = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connector/normal.js
var normal = function(sourcePoint, targetPoint, routePoints, options = {}) {
	const points = [
		sourcePoint,
		...routePoints,
		targetPoint
	];
	const polyline = new Polyline$1(points);
	const path = new Path$1(polyline);
	return options.raw ? path : path.serialize();
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connector/loop.js
var loop = function(sourcePoint, targetPoint, routePoints, options = {}) {
	const fix = routePoints.length === 3 ? 0 : 1;
	const p1 = Point.create(routePoints[0 + fix]);
	const p2 = Point.create(routePoints[2 + fix]);
	const center = Point.create(routePoints[1 + fix]);
	if (!Point.equals(sourcePoint, targetPoint)) {
		const middle = new Point((sourcePoint.x + targetPoint.x) / 2, (sourcePoint.y + targetPoint.y) / 2);
		const angle = middle.angleBetween(Point.create(sourcePoint).rotate(90, middle), center);
		if (angle > 1) {
			p1.rotate(180 - angle, middle);
			p2.rotate(180 - angle, middle);
			center.rotate(180 - angle, middle);
		}
	}
	const pathData = `
     M ${sourcePoint.x} ${sourcePoint.y}
     Q ${p1.x} ${p1.y} ${center.x} ${center.y}
     Q ${p2.x} ${p2.y} ${targetPoint.x} ${targetPoint.y}
  `;
	return options.raw ? Path$1.parse(pathData) : pathData;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connector/rounded.js
var rounded = function(sourcePoint, targetPoint, routePoints, options = {}) {
	const path = new Path$1();
	path.appendSegment(Path$1.createSegment("M", sourcePoint));
	const f13 = 1 / 3;
	const f23 = 2 / 3;
	const radius = options.radius || 10;
	let prevDistance;
	let nextDistance;
	for (let i = 0, ii = routePoints.length; i < ii; i += 1) {
		const curr = Point.create(routePoints[i]);
		const prev = routePoints[i - 1] || sourcePoint;
		const next = routePoints[i + 1] || targetPoint;
		prevDistance = nextDistance || curr.distance(prev) / 2;
		nextDistance = curr.distance(next) / 2;
		const startMove = -Math.min(radius, prevDistance);
		const endMove = -Math.min(radius, nextDistance);
		const roundedStart = curr.clone().move(prev, startMove).round();
		const roundedEnd = curr.clone().move(next, endMove).round();
		const control1 = new Point(f13 * roundedStart.x + f23 * curr.x, f23 * curr.y + f13 * roundedStart.y);
		const control2 = new Point(f13 * roundedEnd.x + f23 * curr.x, f23 * curr.y + f13 * roundedEnd.y);
		path.appendSegment(Path$1.createSegment("L", roundedStart));
		path.appendSegment(Path$1.createSegment("C", control1, control2, roundedEnd));
	}
	path.appendSegment(Path$1.createSegment("L", targetPoint));
	return options.raw ? path : path.serialize();
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connector/smooth.js
var smooth = function(sourcePoint, targetPoint, routePoints, options = {}) {
	let path;
	let direction = options.direction;
	if (routePoints && routePoints.length !== 0) {
		const points = [
			sourcePoint,
			...routePoints,
			targetPoint
		];
		const curves = Curve.throughPoints(points);
		path = new Path$1(curves);
	} else {
		path = new Path$1();
		path.appendSegment(Path$1.createSegment("M", sourcePoint));
		if (!direction) direction = Math.abs(sourcePoint.x - targetPoint.x) >= Math.abs(sourcePoint.y - targetPoint.y) ? "H" : "V";
		if (direction === "H") {
			const controlPointX = (sourcePoint.x + targetPoint.x) / 2;
			path.appendSegment(Path$1.createSegment("C", controlPointX, sourcePoint.y, controlPointX, targetPoint.y, targetPoint.x, targetPoint.y));
		} else {
			const controlPointY = (sourcePoint.y + targetPoint.y) / 2;
			path.appendSegment(Path$1.createSegment("C", sourcePoint.x, controlPointY, targetPoint.x, controlPointY, targetPoint.x, targetPoint.y));
		}
	}
	return options.raw ? path : path.serialize();
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connector/jumpover.js
var CLOSE_PROXIMITY_PADDING = 1;
var F13 = 1 / 3;
var F23 = 2 / 3;
function setupUpdating(view) {
	let updateList = view.graph._jumpOverUpdateList;
	if (updateList == null) {
		updateList = view.graph._jumpOverUpdateList = [];
		view.graph.on("cell:mouseup", () => {
			const list = view.graph._jumpOverUpdateList;
			setTimeout(() => {
				for (let i = 0; i < list.length; i += 1) list[i].update();
			});
		});
		view.graph.on("model:reseted", () => {
			updateList = view.graph._jumpOverUpdateList = [];
		});
	}
	if (updateList.indexOf(view) < 0) {
		updateList.push(view);
		const clean = () => updateList.splice(updateList.indexOf(view), 1);
		view.cell.once("change:connector", clean);
		view.cell.once("removed", clean);
	}
}
function createLines(sourcePoint, targetPoint, route = []) {
	const points = [
		sourcePoint,
		...route,
		targetPoint
	];
	const lines = [];
	points.forEach((point, idx) => {
		const next = points[idx + 1];
		if (next != null) lines.push(new Line(point, next));
	});
	return lines;
}
function findLineIntersections(line, crossCheckLines) {
	const intersections = [];
	crossCheckLines.forEach((crossCheckLine) => {
		const intersection = line.intersectsWithLine(crossCheckLine);
		if (intersection) {
			const { x, y } = intersection;
			const { start, end } = crossCheckLine;
			const startIsIntersection = Math.round(start.x) === Math.round(x) && Math.round(start.y) === Math.round(y);
			const endIsIntersection = Math.round(end.x) === Math.round(x) && Math.round(end.y) === Math.round(y);
			if (startIsIntersection || endIsIntersection) return;
			intersections.push(intersection);
		}
	});
	return intersections;
}
function getDistence(p1, p2) {
	return new Line(p1, p2).squaredLength();
}
/**
* Split input line into multiple based on intersection points.
*/
function createJumps(line, intersections, jumpSize) {
	return intersections.reduce((memo, point, idx) => {
		if (skippedPoints.includes(point)) return memo;
		const lastLine = memo.pop() || line;
		const jumpStart = Point.create(point).move(lastLine.start, -jumpSize);
		let jumpEnd = Point.create(point).move(lastLine.start, +jumpSize);
		const nextPoint = intersections[idx + 1];
		if (nextPoint != null) {
			const distance = jumpEnd.distance(nextPoint);
			if (distance <= jumpSize) {
				jumpEnd = nextPoint.move(lastLine.start, distance);
				skippedPoints.push(nextPoint);
			}
		} else if (jumpStart.distance(lastLine.end) < jumpSize * 2 + CLOSE_PROXIMITY_PADDING) {
			memo.push(lastLine);
			return memo;
		}
		if (jumpEnd.distance(lastLine.start) < jumpSize * 2 + CLOSE_PROXIMITY_PADDING) {
			memo.push(lastLine);
			return memo;
		}
		const jumpLine = new Line(jumpStart, jumpEnd);
		jumppedLines.push(jumpLine);
		memo.push(new Line(lastLine.start, jumpStart), jumpLine, new Line(jumpEnd, lastLine.end));
		return memo;
	}, []);
}
function buildPath(lines, jumpSize, jumpType, radius) {
	const path = new Path$1();
	let segment;
	segment = Path$1.createSegment("M", lines[0].start);
	path.appendSegment(segment);
	lines.forEach((line, index) => {
		if (jumppedLines.includes(line)) {
			let angle;
			let diff;
			let control1;
			let control2;
			if (jumpType === "arc") {
				angle = -90;
				diff = line.start.diff(line.end);
				if (diff.x < 0 || diff.x === 0 && diff.y < 0) angle += 180;
				const center = line.getCenter();
				const centerLine = new Line(center, line.end).rotate(angle, center);
				let halfLine;
				halfLine = new Line(line.start, center);
				control1 = halfLine.pointAt(2 / 3).rotate(angle, line.start);
				control2 = centerLine.pointAt(1 / 3).rotate(-angle, centerLine.end);
				segment = Path$1.createSegment("C", control1, control2, centerLine.end);
				path.appendSegment(segment);
				halfLine = new Line(center, line.end);
				control1 = centerLine.pointAt(1 / 3).rotate(angle, centerLine.end);
				control2 = halfLine.pointAt(1 / 3).rotate(-angle, line.end);
				segment = Path$1.createSegment("C", control1, control2, line.end);
				path.appendSegment(segment);
			} else if (jumpType === "gap") {
				segment = Path$1.createSegment("M", line.end);
				path.appendSegment(segment);
			} else if (jumpType === "cubic") {
				angle = line.start.theta(line.end);
				const xOffset = jumpSize * .6;
				let yOffset = jumpSize * 1.35;
				diff = line.start.diff(line.end);
				if (diff.x < 0 || diff.x === 0 && diff.y < 0) yOffset *= -1;
				control1 = new Point(line.start.x + xOffset, line.start.y + yOffset).rotate(angle, line.start);
				control2 = new Point(line.end.x - xOffset, line.end.y + yOffset).rotate(angle, line.end);
				segment = Path$1.createSegment("C", control1, control2, line.end);
				path.appendSegment(segment);
			}
		} else {
			const nextLine = lines[index + 1];
			if (radius === 0 || !nextLine || jumppedLines.includes(nextLine)) {
				segment = Path$1.createSegment("L", line.end);
				path.appendSegment(segment);
			} else buildRoundedSegment(radius, path, line.end, line.start, nextLine.end);
		}
	});
	return path;
}
function buildRoundedSegment(offset, path, curr, prev, next) {
	const prevDistance = curr.distance(prev) / 2;
	const nextDistance = curr.distance(next) / 2;
	const startMove = -Math.min(offset, prevDistance);
	const endMove = -Math.min(offset, nextDistance);
	const roundedStart = curr.clone().move(prev, startMove).round();
	const roundedEnd = curr.clone().move(next, endMove).round();
	const control1 = new Point(F13 * roundedStart.x + F23 * curr.x, F23 * curr.y + F13 * roundedStart.y);
	const control2 = new Point(F13 * roundedEnd.x + F23 * curr.x, F23 * curr.y + F13 * roundedEnd.y);
	let segment;
	segment = Path$1.createSegment("L", roundedStart);
	path.appendSegment(segment);
	segment = Path$1.createSegment("C", control1, control2, roundedEnd);
	path.appendSegment(segment);
}
var jumppedLines;
var skippedPoints;
var jumpover = function(sourcePoint, targetPoint, routePoints, options = {}) {
	jumppedLines = [];
	skippedPoints = [];
	setupUpdating(this);
	const jumpSize = options.size || 5;
	const jumpType = options.type || "arc";
	const radius = options.radius || 0;
	const ignoreConnectors = options.ignoreConnectors || ["smooth"];
	const graph = this.graph;
	const allLinks = graph.model.getEdges();
	if (allLinks.length === 1) return buildPath(createLines(sourcePoint, targetPoint, routePoints), jumpSize, jumpType, radius);
	const edge = this.cell;
	const thisIndex = allLinks.indexOf(edge);
	const defaultConnector = graph.options.connecting.connector || {};
	const edges = allLinks.filter((link, idx) => {
		const connector = link.getConnector() || defaultConnector;
		if (ignoreConnectors.includes(connector.name)) return false;
		if (idx > thisIndex) return connector.name !== "jumpover";
		return true;
	});
	const linkViews = edges.map((edge) => {
		return graph.findViewByCell(edge);
	});
	const thisLines = createLines(sourcePoint, targetPoint, routePoints);
	const linkLines = linkViews.map((linkView) => {
		if (linkView == null) return [];
		if (linkView === this) return thisLines;
		return createLines(linkView.sourcePoint, linkView.targetPoint, linkView.routePoints);
	});
	const jumpingLines = [];
	thisLines.forEach((line) => {
		const intersections = edges.reduce((memo, link, i) => {
			if (link !== edge) {
				const lineIntersections = findLineIntersections(line, linkLines[i]);
				memo.push(...lineIntersections);
			}
			return memo;
		}, []).sort((a, b) => getDistence(line.start, a) - getDistence(line.start, b));
		if (intersections.length > 0) jumpingLines.push(...createJumps(line, intersections, jumpSize));
		else jumpingLines.push(line);
	});
	const path = buildPath(jumpingLines, jumpSize, jumpType, radius);
	jumppedLines = [];
	skippedPoints = [];
	return options.raw ? path : path.serialize();
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connector/main.js
var main_exports = /* @__PURE__ */ __exportAll({
	jumpover: () => jumpover,
	loop: () => loop,
	normal: () => normal,
	rounded: () => rounded,
	smooth: () => smooth
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/registry/connector/index.js
var Connector;
(function(Connector) {
	Connector.presets = main_exports;
	Connector.registry = Registry.create({ type: "connector" });
	Connector.registry.register(Connector.presets, true);
})(Connector || (Connector = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/model/store.js
var __decorate$26 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Store = class extends Basecoat {
	constructor(data = {}) {
		super();
		this.pending = false;
		this.changing = false;
		this.data = {};
		this.mutate(cloneDeep(data));
		this.changed = {};
	}
	mutate(data, options = {}) {
		const unset = options.unset === true;
		const silent = options.silent === true;
		const changes = [];
		const changing = this.changing;
		this.changing = true;
		if (!changing) {
			this.previous = cloneDeep(this.data);
			this.changed = {};
		}
		const current = this.data;
		const previous = this.previous;
		const changed = this.changed;
		Object.keys(data).forEach((k) => {
			const key = k;
			const newValue = data[key];
			if (!isEqual(current[key], newValue)) changes.push(key);
			if (!isEqual(previous[key], newValue)) changed[key] = newValue;
			else delete changed[key];
			if (unset) delete current[key];
			else current[key] = newValue;
		});
		if (!silent && changes.length > 0) {
			this.pending = true;
			this.pendingOptions = options;
			changes.forEach((key) => {
				this.emit("change:*", {
					key,
					options,
					store: this,
					current: current[key],
					previous: previous[key]
				});
			});
		}
		if (changing) return this;
		if (!silent) while (this.pending) {
			this.pending = false;
			this.emit("changed", {
				current,
				previous,
				store: this,
				options: this.pendingOptions
			});
		}
		this.pending = false;
		this.changing = false;
		this.pendingOptions = null;
		return this;
	}
	get(key, defaultValue) {
		if (key == null) return this.data;
		const ret = this.data[key];
		return ret == null ? defaultValue : ret;
	}
	getPrevious(key) {
		if (this.previous) {
			const ret = this.previous[key];
			return ret == null ? void 0 : ret;
		}
	}
	set(key, value, options) {
		if (key != null) if (typeof key === "object") this.mutate(key, value);
		else this.mutate({ [key]: value }, options);
		return this;
	}
	remove(key, options) {
		const empty = void 0;
		const subset = {};
		let opts;
		if (typeof key === "string") {
			subset[key] = empty;
			opts = options;
		} else if (Array.isArray(key)) {
			key.forEach((k) => subset[k] = empty);
			opts = options;
		} else {
			for (const key in this.data) subset[key] = empty;
			opts = key;
		}
		this.mutate(subset, Object.assign(Object.assign({}, opts), { unset: true }));
		return this;
	}
	getByPath(path) {
		return getByPath(this.data, path, "/");
	}
	setByPath(path, value, options = {}) {
		const delim = "/";
		const pathArray = Array.isArray(path) ? [...path] : path.split(delim);
		const pathString = Array.isArray(path) ? path.join(delim) : path;
		const property = pathArray[0];
		const pathArrayLength = pathArray.length;
		options.propertyPath = pathString;
		options.propertyValue = value;
		options.propertyPathArray = pathArray;
		if (pathArrayLength === 1) this.set(property, value, options);
		else {
			const update = {};
			let diver = update;
			let nextKey = property;
			for (let i = 1; i < pathArrayLength; i += 1) {
				const key = pathArray[i];
				const isArrayIndex = Number.isFinite(Number(key));
				diver = diver[nextKey] = isArrayIndex ? [] : {};
				nextKey = key;
			}
			setByPath(update, pathArray, value, delim);
			const data = cloneDeep(this.data);
			if (options.rewrite) unsetByPath(data, path, delim);
			const merged = merge(data, update);
			this.set(property, merged[property], options);
		}
		return this;
	}
	removeByPath(path, options) {
		const keys = Array.isArray(path) ? path : path.split("/");
		const key = keys[0];
		if (keys.length === 1) this.remove(key, options);
		else {
			const paths = keys.slice(1);
			const prop = cloneDeep(this.get(key));
			if (prop) unsetByPath(prop, paths);
			this.set(key, prop, options);
		}
		return this;
	}
	hasChanged(key) {
		if (key == null) return Object.keys(this.changed).length > 0;
		return key in this.changed;
	}
	/**
	* Returns an object containing all the data that have changed,
	* or `null` if there are no changes. Useful for determining what
	* parts of a view need to be updated.
	*/
	getChanges(diff) {
		if (diff == null) return this.hasChanged() ? cloneDeep(this.changed) : null;
		const old = this.changing ? this.previous : this.data;
		const changed = {};
		let hasChanged;
		for (const key in diff) {
			const val = diff[key];
			if (!isEqual(old[key], val)) {
				changed[key] = val;
				hasChanged = true;
			}
		}
		return hasChanged ? cloneDeep(changed) : null;
	}
	/**
	* Returns a copy of the store's `data` object.
	*/
	toJSON() {
		return cloneDeep(this.data);
	}
	clone() {
		const constructor = this.constructor;
		return new constructor(this.data);
	}
	dispose() {
		this.off();
		this.data = {};
		this.previous = {};
		this.changed = {};
		this.pending = false;
		this.changing = false;
		this.pendingOptions = null;
		this.trigger("disposed", { store: this });
	}
};
__decorate$26([Basecoat.dispose()], Store.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/model/animation.js
var Animation = class Animation {
	constructor(cell) {
		this.cell = cell;
		this.ids = {};
		this.cache = {};
	}
	get() {
		return Object.keys(this.ids);
	}
	start(path, targetValue, options = {}, delim = "/") {
		const startValue = this.cell.getPropByPath(path);
		const localOptions = defaults$3(options, Animation.defaultOptions);
		const timing = this.getTiming(localOptions.timing);
		const interpolate = this.getInterp(localOptions.interp, startValue, targetValue);
		let startTime = 0;
		const key = Array.isArray(path) ? path.join(delim) : path;
		const paths = Array.isArray(path) ? path : path.split(delim);
		const iterate = () => {
			const now = (/* @__PURE__ */ new Date()).getTime();
			if (startTime === 0) startTime = now;
			let progress = (now - startTime) / localOptions.duration;
			if (progress < 1) this.ids[key] = requestAnimationFrame(iterate);
			else progress = 1;
			const currentValue = interpolate(timing(progress));
			this.cell.setPropByPath(paths, currentValue);
			if (options.progress) options.progress(Object.assign({
				progress,
				currentValue
			}, this.getArgs(key)));
			if (progress === 1) {
				this.cell.notify("transition:complete", this.getArgs(key));
				options.complete && options.complete(this.getArgs(key));
				this.cell.notify("transition:finish", this.getArgs(key));
				options.finish && options.finish(this.getArgs(key));
				this.clean(key);
			}
		};
		setTimeout(() => {
			this.stop(path, void 0, delim);
			this.cache[key] = {
				startValue,
				targetValue,
				options: localOptions
			};
			this.ids[key] = requestAnimationFrame(iterate);
			this.cell.notify("transition:start", this.getArgs(key));
			options.start && options.start(this.getArgs(key));
		}, options.delay);
		return this.stop.bind(this, path, delim, options);
	}
	stop(path, options = {}, delim = "/") {
		const paths = Array.isArray(path) ? path : path.split(delim);
		Object.keys(this.ids).filter((key) => isEqual(paths, key.split(delim).slice(0, paths.length))).forEach((key) => {
			cancelAnimationFrame(this.ids[key]);
			const data = this.cache[key];
			const commonArgs = this.getArgs(key);
			const localOptions = Object.assign(Object.assign({}, data.options), options);
			const jumpedToEnd = localOptions.jumpedToEnd;
			if (jumpedToEnd && data.targetValue != null) {
				this.cell.setPropByPath(key, data.targetValue);
				this.cell.notify("transition:end", Object.assign({}, commonArgs));
				this.cell.notify("transition:complete", Object.assign({}, commonArgs));
				localOptions.complete && localOptions.complete(Object.assign({}, commonArgs));
			}
			const stopArgs = Object.assign({ jumpedToEnd }, commonArgs);
			this.cell.notify("transition:stop", Object.assign({}, stopArgs));
			localOptions.stop && localOptions.stop(Object.assign({}, stopArgs));
			this.cell.notify("transition:finish", Object.assign({}, commonArgs));
			localOptions.finish && localOptions.finish(Object.assign({}, commonArgs));
			this.clean(key);
		});
		return this;
	}
	clean(key) {
		delete this.ids[key];
		delete this.cache[key];
	}
	getTiming(timing) {
		return typeof timing === "string" ? Timing[timing] : timing;
	}
	getInterp(interp, startValue, targetValue) {
		if (interp) return interp(startValue, targetValue);
		if (typeof targetValue === "number") return Interp.number(startValue, targetValue);
		if (typeof targetValue === "string") {
			if (targetValue[0] === "#") return Interp.color(startValue, targetValue);
			return Interp.unit(startValue, targetValue);
		}
		return Interp.object(startValue, targetValue);
	}
	getArgs(key) {
		const data = this.cache[key];
		return {
			path: key,
			startValue: data.startValue,
			targetValue: data.targetValue,
			cell: this.cell
		};
	}
};
(function(Animation) {
	Animation.defaultOptions = {
		delay: 10,
		duration: 100,
		timing: "linear"
	};
})(Animation || (Animation = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/model/cell.js
var __decorate$25 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest$15 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var Cell = class Cell extends Basecoat {
	static config(presets) {
		const { markup, propHooks, attrHooks } = presets, others = __rest$15(presets, [
			"markup",
			"propHooks",
			"attrHooks"
		]);
		if (markup != null) this.markup = markup;
		if (propHooks) {
			this.propHooks = this.propHooks.slice();
			if (Array.isArray(propHooks)) this.propHooks.push(...propHooks);
			else if (typeof propHooks === "function") this.propHooks.push(propHooks);
			else Object.values(propHooks).forEach((hook) => {
				if (typeof hook === "function") this.propHooks.push(hook);
			});
		}
		if (attrHooks) this.attrHooks = Object.assign(Object.assign({}, this.attrHooks), attrHooks);
		this.defaults = merge({}, this.defaults, others);
	}
	static getMarkup() {
		return this.markup;
	}
	static getDefaults(raw) {
		return raw ? this.defaults : cloneDeep(this.defaults);
	}
	static getAttrHooks() {
		return this.attrHooks;
	}
	static applyPropHooks(cell, metadata) {
		return this.propHooks.reduce((memo, hook) => {
			return hook ? call$1(hook, cell, memo) : memo;
		}, metadata);
	}
	get [Symbol.toStringTag]() {
		return Cell.toStringTag;
	}
	constructor(metadata = {}) {
		super();
		const defaults = this.constructor.getDefaults(true);
		const props = merge({}, this.preprocess(defaults), this.preprocess(metadata));
		this.id = props.id || uuid();
		this.store = new Store(props);
		this.animation = new Animation(this);
		this.setup();
		this.init();
		this.postprocess(metadata);
	}
	init() {}
	get model() {
		return this._model;
	}
	set model(model) {
		if (this._model !== model) this._model = model;
	}
	preprocess(metadata, ignoreIdCheck) {
		const id = metadata.id;
		const props = this.constructor.applyPropHooks(this, metadata);
		if (id == null && ignoreIdCheck !== true) props.id = uuid();
		return props;
	}
	postprocess(metadata) {}
	setup() {
		this.store.on("change:*", (metadata) => {
			const { key, current, previous, options } = metadata;
			this.notify("change:*", {
				key,
				options,
				current,
				previous,
				cell: this
			});
			this.notify(`change:${key}`, {
				options,
				current,
				previous,
				cell: this
			});
			const type = key;
			if (type === "source" || type === "target") this.notify(`change:terminal`, {
				type,
				current,
				previous,
				options,
				cell: this
			});
		});
		this.store.on("changed", ({ options }) => this.notify("changed", {
			options,
			cell: this
		}));
	}
	notify(name, args) {
		this.trigger(name, args);
		const model = this.model;
		if (model) {
			model.notify(`cell:${name}`, args);
			if (this.isNode()) model.notify(`node:${name}`, Object.assign(Object.assign({}, args), { node: this }));
			else if (this.isEdge()) model.notify(`edge:${name}`, Object.assign(Object.assign({}, args), { edge: this }));
		}
		return this;
	}
	isNode() {
		return false;
	}
	isEdge() {
		return false;
	}
	isSameStore(cell) {
		return this.store === cell.store;
	}
	get view() {
		return this.store.get("view");
	}
	get shape() {
		return this.store.get("shape", "");
	}
	getProp(key, defaultValue) {
		if (key == null) return this.store.get();
		return this.store.get(key, defaultValue);
	}
	setProp(key, value, options) {
		if (typeof key === "string") this.store.set(key, value, options);
		else {
			const props = this.preprocess(key, true);
			this.store.set(merge({}, this.getProp(), props), value);
			this.postprocess(key);
		}
		return this;
	}
	removeProp(key, options) {
		if (typeof key === "string" || Array.isArray(key)) this.store.removeByPath(key, options);
		else this.store.remove(options);
		return this;
	}
	hasChanged(key) {
		return key == null ? this.store.hasChanged() : this.store.hasChanged(key);
	}
	getPropByPath(path) {
		return this.store.getByPath(path);
	}
	setPropByPath(path, value, options = {}) {
		if (this.model) {
			if (path === "children") this._children = value ? value.map((id) => this.model.getCell(id)).filter((child) => child != null) : null;
			else if (path === "parent") this._parent = value ? this.model.getCell(value) : null;
		}
		this.store.setByPath(path, value, options);
		return this;
	}
	removePropByPath(path, options = {}) {
		const paths = Array.isArray(path) ? path : path.split("/");
		if (paths[0] === "attrs") options.dirty = true;
		this.store.removeByPath(paths, options);
		return this;
	}
	prop(key, value, options) {
		if (key == null) return this.getProp();
		if (typeof key === "string" || Array.isArray(key)) {
			if (arguments.length === 1) return this.getPropByPath(key);
			if (value == null) return this.removePropByPath(key, options || {});
			return this.setPropByPath(key, value, options || {});
		}
		return this.setProp(key, value || {});
	}
	previous(name) {
		return this.store.getPrevious(name);
	}
	get zIndex() {
		return this.getZIndex();
	}
	set zIndex(z) {
		if (z == null) this.removeZIndex();
		else this.setZIndex(z);
	}
	getZIndex() {
		return this.store.get("zIndex");
	}
	setZIndex(z, options = {}) {
		this.store.set("zIndex", z, options);
		return this;
	}
	removeZIndex(options = {}) {
		this.store.remove("zIndex", options);
		return this;
	}
	toFront(options = {}) {
		const model = this.model;
		if (model) {
			let z = model.getMaxZIndex();
			let cells;
			if (options.deep) {
				cells = this.getDescendants({
					deep: true,
					breadthFirst: true
				});
				cells.unshift(this);
			} else cells = [this];
			z = z - cells.length + 1;
			const count = model.total();
			let changed = model.indexOf(this) !== count - cells.length;
			if (!changed) changed = cells.some((cell, index) => cell.getZIndex() !== z + index);
			if (changed) this.batchUpdate("to-front", () => {
				z += cells.length;
				cells.forEach((cell, index) => {
					cell.setZIndex(z + index, options);
				});
			});
		}
		return this;
	}
	toBack(options = {}) {
		const model = this.model;
		if (model) {
			let z = model.getMinZIndex();
			let cells;
			if (options.deep) {
				cells = this.getDescendants({
					deep: true,
					breadthFirst: true
				});
				cells.unshift(this);
			} else cells = [this];
			let changed = model.indexOf(this) !== 0;
			if (!changed) changed = cells.some((cell, index) => cell.getZIndex() !== z + index);
			if (changed) this.batchUpdate("to-back", () => {
				z -= cells.length;
				cells.forEach((cell, index) => {
					cell.setZIndex(z + index, options);
				});
			});
		}
		return this;
	}
	get markup() {
		return this.getMarkup();
	}
	set markup(value) {
		if (value == null) this.removeMarkup();
		else this.setMarkup(value);
	}
	getMarkup() {
		let markup = this.store.get("markup");
		if (markup == null) markup = this.constructor.getMarkup();
		return markup;
	}
	setMarkup(markup, options = {}) {
		this.store.set("markup", markup, options);
		return this;
	}
	removeMarkup(options = {}) {
		this.store.remove("markup", options);
		return this;
	}
	get attrs() {
		return this.getAttrs();
	}
	set attrs(value) {
		if (value == null) this.removeAttrs();
		else this.setAttrs(value);
	}
	getAttrs() {
		const result = this.store.get("attrs");
		return result ? Object.assign({}, result) : {};
	}
	setAttrs(attrs, options = {}) {
		if (attrs == null) this.removeAttrs(options);
		else {
			const set = (attrs) => this.store.set("attrs", attrs, options);
			if (options.overwrite === true) set(attrs);
			else {
				const prev = this.getAttrs();
				if (options.deep === false) set(Object.assign(Object.assign({}, prev), attrs));
				else set(merge({}, prev, attrs));
			}
		}
		return this;
	}
	replaceAttrs(attrs, options = {}) {
		return this.setAttrs(attrs, Object.assign(Object.assign({}, options), { overwrite: true }));
	}
	updateAttrs(attrs, options = {}) {
		return this.setAttrs(attrs, Object.assign(Object.assign({}, options), { deep: false }));
	}
	removeAttrs(options = {}) {
		this.store.remove("attrs", options);
		return this;
	}
	getAttrDefinition(attrName) {
		if (!attrName) return null;
		const hooks = this.constructor.getAttrHooks() || {};
		let definition = hooks[attrName] || Attr.registry.get(attrName);
		if (!definition) {
			const name = camelCase(attrName);
			definition = hooks[name] || Attr.registry.get(name);
		}
		return definition || null;
	}
	getAttrByPath(path) {
		if (path == null || path === "") return this.getAttrs();
		return this.getPropByPath(this.prefixAttrPath(path));
	}
	setAttrByPath(path, value, options = {}) {
		this.setPropByPath(this.prefixAttrPath(path), value, options);
		return this;
	}
	removeAttrByPath(path, options = {}) {
		this.removePropByPath(this.prefixAttrPath(path), options);
		return this;
	}
	prefixAttrPath(path) {
		return Array.isArray(path) ? ["attrs"].concat(path) : `attrs/${path}`;
	}
	attr(path, value, options) {
		if (path == null) return this.getAttrByPath();
		if (typeof path === "string" || Array.isArray(path)) {
			if (arguments.length === 1) return this.getAttrByPath(path);
			if (value == null) return this.removeAttrByPath(path, options || {});
			return this.setAttrByPath(path, value, options || {});
		}
		return this.setAttrs(path, value || {});
	}
	get visible() {
		return this.isVisible();
	}
	set visible(value) {
		this.setVisible(value);
	}
	setVisible(visible, options = {}) {
		this.store.set("visible", visible, options);
		return this;
	}
	isVisible() {
		return this.store.get("visible") !== false;
	}
	show(options = {}) {
		if (!this.isVisible()) this.setVisible(true, options);
		return this;
	}
	hide(options = {}) {
		if (this.isVisible()) this.setVisible(false, options);
		return this;
	}
	toggleVisible(isVisible, options = {}) {
		const visible = typeof isVisible === "boolean" ? isVisible : !this.isVisible();
		const localOptions = typeof isVisible === "boolean" ? options : isVisible;
		if (visible) this.show(localOptions);
		else this.hide(localOptions);
		return this;
	}
	get data() {
		return this.getData();
	}
	set data(val) {
		this.setData(val);
	}
	getData() {
		return this.store.get("data");
	}
	setData(data, options = {}) {
		if (data == null) this.removeData(options);
		else {
			const set = (data) => this.store.set("data", data, options);
			if (options.overwrite === true) set(data);
			else {
				const prev = this.getData();
				if (options.deep === false) set(typeof data === "object" ? Object.assign(Object.assign({}, prev), data) : data);
				else set(merge({}, prev, data));
			}
		}
		return this;
	}
	replaceData(data, options = {}) {
		return this.setData(data, Object.assign(Object.assign({}, options), { overwrite: true }));
	}
	updateData(data, options = {}) {
		return this.setData(data, Object.assign(Object.assign({}, options), { deep: false }));
	}
	removeData(options = {}) {
		this.store.remove("data", options);
		return this;
	}
	get parent() {
		return this.getParent();
	}
	get children() {
		return this.getChildren();
	}
	getParentId() {
		return this.store.get("parent");
	}
	getParent() {
		const parentId = this.getParentId();
		if (parentId && this.model) {
			const parent = this.model.getCell(parentId);
			this._parent = parent;
			return parent;
		}
		return null;
	}
	getChildren() {
		const childrenIds = this.store.get("children");
		if (childrenIds && childrenIds.length && this.model) {
			const children = childrenIds.map((id) => {
				var _a;
				return (_a = this.model) === null || _a === void 0 ? void 0 : _a.getCell(id);
			}).filter((cell) => cell != null);
			this._children = children;
			return [...children];
		}
		return null;
	}
	hasParent() {
		return this.parent != null;
	}
	isParentOf(child) {
		return child != null && child.getParent() === this;
	}
	isChildOf(parent) {
		return parent != null && this.getParent() === parent;
	}
	eachChild(iterator, context) {
		if (this.children) this.children.forEach(iterator, context);
		return this;
	}
	filterChild(filter, context) {
		return this.children ? this.children.filter(filter, context) : [];
	}
	getChildCount() {
		return this.children == null ? 0 : this.children.length;
	}
	getChildIndex(child) {
		return this.children == null ? -1 : this.children.indexOf(child);
	}
	getChildAt(index) {
		return this.children != null && index >= 0 ? this.children[index] : null;
	}
	getAncestors(options = {}) {
		const ancestors = [];
		let parent = this.getParent();
		while (parent) {
			ancestors.push(parent);
			parent = options.deep !== false ? parent.getParent() : null;
		}
		return ancestors;
	}
	getDescendants(options = {}) {
		if (options.deep !== false) {
			if (options.breadthFirst) {
				const cells = [];
				const queue = this.getChildren() || [];
				while (queue.length > 0) {
					const parent = queue.shift();
					const children = parent.getChildren();
					cells.push(parent);
					if (children) queue.push(...children);
				}
				return cells;
			}
			{
				const cells = this.getChildren() || [];
				cells.forEach((cell) => {
					cells.push(...cell.getDescendants(options));
				});
				return cells;
			}
		}
		return this.getChildren() || [];
	}
	isDescendantOf(ancestor, options = {}) {
		if (ancestor == null) return false;
		if (options.deep !== false) {
			let current = this.getParent();
			while (current) {
				if (current === ancestor) return true;
				current = current.getParent();
			}
			return false;
		}
		return this.isChildOf(ancestor);
	}
	isAncestorOf(descendant, options = {}) {
		if (descendant == null) return false;
		return descendant.isDescendantOf(this, options);
	}
	contains(cell) {
		return this.isAncestorOf(cell);
	}
	getCommonAncestor(...cells) {
		return Cell.getCommonAncestor(this, ...cells);
	}
	setParent(parent, options = {}) {
		this._parent = parent;
		if (parent) this.store.set("parent", parent.id, options);
		else this.store.remove("parent", options);
		return this;
	}
	setChildren(children, options = {}) {
		this._children = children;
		if (children != null) this.store.set("children", children.map((child) => child.id), options);
		else this.store.remove("children", options);
		return this;
	}
	unembed(child, options = {}) {
		const children = this.children;
		if (children != null && child != null) {
			const index = this.getChildIndex(child);
			if (index !== -1) {
				children.splice(index, 1);
				child.setParent(null, options);
				this.setChildren(children, options);
			}
		}
		return this;
	}
	embed(child, options = {}) {
		child.addTo(this, options);
		return this;
	}
	addTo(target, options = {}) {
		if (Cell.isCell(target)) target.addChild(this, options);
		else target.addCell(this, options);
		return this;
	}
	insertTo(parent, index, options = {}) {
		parent.insertChild(this, index, options);
		return this;
	}
	addChild(child, options = {}) {
		return this.insertChild(child, void 0, options);
	}
	insertChild(child, index, options = {}) {
		if (child != null && child !== this) {
			const oldParent = child.getParent();
			const changed = this !== oldParent;
			let pos = index;
			if (pos == null) {
				pos = this.getChildCount();
				if (!changed) pos -= 1;
			}
			if (oldParent) {
				const children = oldParent.getChildren();
				if (children) {
					const index = children.indexOf(child);
					if (index >= 0) {
						child.setParent(null, options);
						children.splice(index, 1);
						oldParent.setChildren(children, options);
					}
				}
			}
			let children = this.children;
			if (children == null) {
				children = [];
				children.push(child);
			} else children.splice(pos, 0, child);
			child.setParent(this, options);
			this.setChildren(children, options);
			if (changed && this.model) {
				const incomings = this.model.getIncomingEdges(this);
				const outgoings = this.model.getOutgoingEdges(this);
				if (incomings) incomings.forEach((edge) => edge.updateParent(options));
				if (outgoings) outgoings.forEach((edge) => edge.updateParent(options));
			}
			if (this.model) this.model.addCell(child, options);
		}
		return this;
	}
	removeFromParent(options = {}) {
		const parent = this.getParent();
		if (parent != null) {
			const index = parent.getChildIndex(this);
			parent.removeChildAt(index, options);
		}
		return this;
	}
	removeChild(child, options = {}) {
		const index = this.getChildIndex(child);
		return this.removeChildAt(index, options);
	}
	removeChildAt(index, options = {}) {
		const child = this.getChildAt(index);
		if (this.children != null && child != null) {
			this.unembed(child, options);
			child.remove(options);
		}
		return child;
	}
	remove(options = {}) {
		this.batchUpdate("remove", () => {
			const parent = this.getParent();
			if (parent) parent.removeChild(this, options);
			if (options.deep !== false) this.eachChild((child) => child.remove(options));
			if (this.model) this.model.removeCell(this, options);
		});
		return this;
	}
	transition(path, target, options = {}, delim = "/") {
		return this.animation.start(path, target, options, delim);
	}
	stopTransition(path, options, delim = "/") {
		this.animation.stop(path, options, delim);
		return this;
	}
	getTransitions() {
		return this.animation.get();
	}
	translate(tx, ty, options) {
		return this;
	}
	scale(sx, sy, origin, options) {
		return this;
	}
	addTools(items, obj, options) {
		const toolItems = Array.isArray(items) ? items : [items];
		const name = typeof obj === "string" ? obj : null;
		const config = typeof obj === "object" ? obj : typeof options === "object" ? options : {};
		if (config.reset) return this.setTools({
			name,
			items: toolItems,
			local: config.local
		}, config);
		let tools = cloneDeep(this.getTools());
		if (tools == null || name == null || tools.name === name) {
			if (tools == null) tools = {};
			if (!tools.items) tools.items = [];
			tools.name = name;
			tools.items = [...tools.items, ...toolItems];
			return this.setTools(Object.assign({}, tools), config);
		}
	}
	setTools(tools, options = {}) {
		if (tools == null) this.removeTools();
		else this.store.set("tools", Cell.normalizeTools(tools), options);
		return this;
	}
	getTools() {
		return this.store.get("tools");
	}
	removeTools(options = {}) {
		this.store.remove("tools", options);
		return this;
	}
	hasTools(name) {
		const tools = this.getTools();
		if (tools == null) return false;
		if (name == null) return true;
		return tools.name === name;
	}
	hasTool(name) {
		const tools = this.getTools();
		if (tools == null) return false;
		return tools.items.some((item) => typeof item === "string" ? item === name : item.name === name);
	}
	removeTool(nameOrIndex, options = {}) {
		const tools = cloneDeep(this.getTools());
		if (tools) {
			let updated = false;
			const items = tools.items.slice();
			const remove = (index) => {
				items.splice(index, 1);
				updated = true;
			};
			if (typeof nameOrIndex === "number") remove(nameOrIndex);
			else for (let i = items.length - 1; i >= 0; i -= 1) {
				const item = items[i];
				if (typeof item === "string" ? item === nameOrIndex : item.name === nameOrIndex) remove(i);
			}
			if (updated) {
				tools.items = items;
				this.setTools(tools, options);
			}
		}
		return this;
	}
	getBBox(options) {
		return new Rectangle();
	}
	getConnectionPoint(edge, type) {
		return new Point();
	}
	toJSON(options = {}) {
		const props = Object.assign({}, this.store.get());
		const toString = Object.prototype.toString;
		const cellType = this.isNode() ? "node" : this.isEdge() ? "edge" : "cell";
		if (!props.shape) {
			const ctor = this.constructor;
			throw new Error(`Unable to serialize ${cellType} missing "shape" prop, check the ${cellType} "${ctor.name || toString.call(ctor)}"`);
		}
		const ctor = this.constructor;
		const diff = options.diff === true;
		const attrs = props.attrs || {};
		const presets = ctor.getDefaults(true);
		const defaults = diff ? this.preprocess(presets, true) : presets;
		const defaultAttrs = defaults.attrs || {};
		const finalAttrs = {};
		Object.entries(props).forEach(([key, val]) => {
			if (val != null && !Array.isArray(val) && typeof val === "object" && !isPlainObject(val)) throw new Error(`Can only serialize ${cellType} with plain-object props, but got a "${toString.call(val)}" type of key "${key}" on ${cellType} "${this.id}"`);
			if (key !== "attrs" && key !== "shape" && diff) {
				const preset = defaults[key];
				if (isEqual(val, preset)) delete props[key];
			}
		});
		Object.keys(attrs).forEach((key) => {
			const attr = attrs[key];
			const defaultAttr = defaultAttrs[key];
			Object.keys(attr).forEach((name) => {
				const value = attr[name];
				const defaultValue = defaultAttr ? defaultAttr[name] : null;
				if (value != null && typeof value === "object" && !Array.isArray(value)) Object.keys(value).forEach((subName) => {
					const subValue = value[subName];
					if (defaultAttr == null || defaultValue == null || !isObject(defaultValue) || !isEqual(defaultValue[subName], subValue)) {
						if (finalAttrs[key] == null) finalAttrs[key] = {};
						if (finalAttrs[key][name] == null) finalAttrs[key][name] = {};
						const tmp = finalAttrs[key][name];
						tmp[subName] = subValue;
					}
				});
				else if (defaultAttr == null || !isEqual(defaultValue, value)) {
					if (finalAttrs[key] == null) finalAttrs[key] = {};
					finalAttrs[key][name] = value;
				}
			});
		});
		const finalProps = Object.assign(Object.assign({}, props), { attrs: isEmpty(finalAttrs) ? void 0 : finalAttrs });
		if (finalProps.attrs == null) delete finalProps.attrs;
		const ret = finalProps;
		if (ret.angle === 0) delete ret.angle;
		return cloneDeep(ret);
	}
	clone(options = {}) {
		if (!options.deep) {
			const data = Object.assign({}, this.store.get());
			if (!options.keepId) delete data.id;
			delete data.parent;
			delete data.children;
			const ctor = this.constructor;
			return new ctor(data);
		}
		return Cell.deepClone(this)[this.id];
	}
	findView(graph) {
		return graph.findViewByCell(this);
	}
	startBatch(name, data = {}, model = this.model) {
		this.notify("batch:start", {
			name,
			data,
			cell: this
		});
		if (model) model.startBatch(name, Object.assign(Object.assign({}, data), { cell: this }));
		return this;
	}
	stopBatch(name, data = {}, model = this.model) {
		if (model) model.stopBatch(name, Object.assign(Object.assign({}, data), { cell: this }));
		this.notify("batch:stop", {
			name,
			data,
			cell: this
		});
		return this;
	}
	batchUpdate(name, execute, data) {
		const model = this.model;
		this.startBatch(name, data, model);
		const result = execute();
		this.stopBatch(name, data, model);
		return result;
	}
	dispose() {
		this.removeFromParent();
		this.store.dispose();
	}
};
Cell.defaults = {};
Cell.attrHooks = {};
Cell.propHooks = [];
__decorate$25([Basecoat.dispose()], Cell.prototype, "dispose", null);
(function(Cell) {
	function normalizeTools(raw) {
		if (typeof raw === "string") return { items: [raw] };
		if (Array.isArray(raw)) return { items: raw };
		if (raw.items) return raw;
		return { items: [raw] };
	}
	Cell.normalizeTools = normalizeTools;
})(Cell || (Cell = {}));
(function(Cell) {
	Cell.toStringTag = `X6.${Cell.name}`;
	function isCell(instance) {
		if (instance == null) return false;
		if (instance instanceof Cell) return true;
		const tag = instance[Symbol.toStringTag];
		const cell = instance;
		if ((tag == null || tag === Cell.toStringTag) && typeof cell.isNode === "function" && typeof cell.isEdge === "function" && typeof cell.prop === "function" && typeof cell.attr === "function") return true;
		return false;
	}
	Cell.isCell = isCell;
})(Cell || (Cell = {}));
(function(Cell) {
	function getCommonAncestor(...cells) {
		const ancestors = cells.filter((cell) => cell != null).map((cell) => cell.getAncestors()).sort((a, b) => {
			return a.length - b.length;
		});
		return ancestors.shift().find((cell) => ancestors.every((item) => item.includes(cell))) || null;
	}
	Cell.getCommonAncestor = getCommonAncestor;
	function getCellsBBox(cells, options = {}) {
		let bbox = null;
		for (let i = 0, ii = cells.length; i < ii; i += 1) {
			const cell = cells[i];
			let rect = cell.getBBox(options);
			if (rect) {
				if (cell.isNode()) {
					const angle = cell.getAngle();
					if (angle != null && angle !== 0) rect = rect.bbox(angle);
				}
				bbox = bbox == null ? rect : bbox.union(rect);
			}
		}
		return bbox;
	}
	Cell.getCellsBBox = getCellsBBox;
	function deepClone(cell) {
		const cells = [cell, ...cell.getDescendants({ deep: true })];
		return Cell.cloneCells(cells);
	}
	Cell.deepClone = deepClone;
	function cloneCells(cells) {
		const inputs = uniq(cells);
		const cloneMap = inputs.reduce((map, cell) => {
			map[cell.id] = cell.clone();
			return map;
		}, {});
		inputs.forEach((cell) => {
			const clone = cloneMap[cell.id];
			if (clone.isEdge()) {
				const sourceId = clone.getSourceCellId();
				const targetId = clone.getTargetCellId();
				if (sourceId && cloneMap[sourceId]) clone.setSource(Object.assign(Object.assign({}, clone.getSource()), { cell: cloneMap[sourceId].id }));
				if (targetId && cloneMap[targetId]) clone.setTarget(Object.assign(Object.assign({}, clone.getTarget()), { cell: cloneMap[targetId].id }));
			}
			const parent = cell.getParent();
			if (parent && cloneMap[parent.id]) clone.setParent(cloneMap[parent.id]);
			const children = cell.getChildren();
			if (children && children.length) {
				const embeds = children.reduce((memo, child) => {
					if (cloneMap[child.id]) memo.push(cloneMap[child.id]);
					return memo;
				}, []);
				if (embeds.length > 0) clone.setChildren(embeds);
			}
		});
		return cloneMap;
	}
	Cell.cloneCells = cloneCells;
})(Cell || (Cell = {}));
(function(Cell) {
	Cell.config({ propHooks(_a) {
		var { tools } = _a, metadata = __rest$15(_a, ["tools"]);
		if (tools) metadata.tools = Cell.normalizeTools(tools);
		return metadata;
	} });
})(Cell || (Cell = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/model/registry.js
var ShareRegistry;
(function(ShareRegistry) {
	let edgeRegistry;
	let nodeRegistry;
	function exist(name, isNode) {
		return isNode ? edgeRegistry != null && edgeRegistry.exist(name) : nodeRegistry != null && nodeRegistry.exist(name);
	}
	ShareRegistry.exist = exist;
	function setEdgeRegistry(registry) {
		edgeRegistry = registry;
	}
	ShareRegistry.setEdgeRegistry = setEdgeRegistry;
	function setNodeRegistry(registry) {
		nodeRegistry = registry;
	}
	ShareRegistry.setNodeRegistry = setNodeRegistry;
})(ShareRegistry || (ShareRegistry = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/model/port.js
var PortManager = class {
	constructor(data) {
		this.ports = [];
		this.groups = {};
		this.init(cloneDeep(data));
	}
	getPorts() {
		return this.ports;
	}
	getGroup(groupName) {
		return groupName != null ? this.groups[groupName] : null;
	}
	getPortsByGroup(groupName) {
		return this.ports.filter((p) => p.group === groupName || p.group == null && groupName == null);
	}
	getPortsLayoutByGroup(groupName, elemBBox) {
		const ports = this.getPortsByGroup(groupName);
		const group = groupName ? this.getGroup(groupName) : null;
		const groupPosition = group ? group.position : null;
		const groupPositionName = groupPosition ? groupPosition.name : null;
		let layoutFn;
		if (groupPositionName != null) {
			const fn = PortLayout.registry.get(groupPositionName);
			if (fn == null) return PortLayout.registry.onNotFound(groupPositionName);
			layoutFn = fn;
		} else layoutFn = PortLayout.presets.left;
		const portsArgs = ports.map((port) => port && port.position && port.position.args || {});
		const groupArgs = groupPosition && groupPosition.args || {};
		return layoutFn(portsArgs, elemBBox, groupArgs).map((portLayout, index) => {
			const port = ports[index];
			return {
				portLayout,
				portId: port.id,
				portSize: port.size,
				portAttrs: port.attrs,
				labelSize: port.label.size,
				labelLayout: this.getPortLabelLayout(port, Point.create(portLayout.position), elemBBox)
			};
		});
	}
	init(data) {
		const { groups, items } = data;
		if (groups != null) Object.keys(groups).forEach((key) => {
			this.groups[key] = this.parseGroup(groups[key]);
		});
		if (Array.isArray(items)) items.forEach((item) => {
			this.ports.push(this.parsePort(item));
		});
	}
	parseGroup(group) {
		return Object.assign(Object.assign({}, group), {
			label: this.getLabel(group, true),
			position: this.getPortPosition(group.position, true)
		});
	}
	parsePort(port) {
		const result = Object.assign({}, port);
		const group = this.getGroup(port.group) || {};
		result.markup = result.markup || group.markup;
		result.attrs = merge({}, group.attrs, result.attrs);
		result.position = this.createPosition(group, result);
		result.label = merge({}, group.label, this.getLabel(result));
		result.zIndex = this.getZIndex(group, result);
		result.size = Object.assign(Object.assign({}, group.size), result.size);
		return result;
	}
	getZIndex(group, port) {
		if (typeof port.zIndex === "number") return port.zIndex;
		if (typeof group.zIndex === "number" || group.zIndex === "auto") return group.zIndex;
		return "auto";
	}
	createPosition(group, port) {
		return merge({
			name: "left",
			args: {}
		}, group.position, { args: port.args });
	}
	getPortPosition(position, setDefault = false) {
		if (position == null) {
			if (setDefault) return {
				name: "left",
				args: {}
			};
		} else {
			if (typeof position === "string") return {
				name: position,
				args: {}
			};
			if (Array.isArray(position)) return {
				name: "absolute",
				args: {
					x: position[0],
					y: position[1]
				}
			};
			if (typeof position === "object") return position;
		}
		return { args: {} };
	}
	getPortLabelPosition(position, setDefault = false) {
		if (position == null) {
			if (setDefault) return {
				name: "left",
				args: {}
			};
		} else {
			if (typeof position === "string") return {
				name: position,
				args: {}
			};
			if (typeof position === "object") return position;
		}
		return { args: {} };
	}
	getLabel(item, setDefaults = false) {
		const label = item.label || {};
		label.position = this.getPortLabelPosition(label.position, setDefaults);
		return label;
	}
	getPortLabelLayout(port, portPosition, elemBBox) {
		const name = port.label.position.name || "left";
		const args = port.label.position.args || {};
		const layoutFn = PortLabelLayout.registry.get(name) || PortLabelLayout.presets.left;
		if (layoutFn) return layoutFn(portPosition, elemBBox, args);
		return null;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/model/node.js
var __rest$14 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var Node$1 = class Node$1 extends Cell {
	get [Symbol.toStringTag]() {
		return Node$1.toStringTag;
	}
	constructor(metadata = {}) {
		super(metadata);
		this.initPorts();
	}
	preprocess(metadata, ignoreIdCheck) {
		const { x, y, width, height } = metadata, others = __rest$14(metadata, [
			"x",
			"y",
			"width",
			"height"
		]);
		if (x != null || y != null) {
			const position = others.position;
			others.position = Object.assign(Object.assign({}, position), {
				x: x != null ? x : position ? position.x : 0,
				y: y != null ? y : position ? position.y : 0
			});
		}
		if (width != null || height != null) {
			const size = others.size;
			others.size = Object.assign(Object.assign({}, size), {
				width: width != null ? width : size ? size.width : 0,
				height: height != null ? height : size ? size.height : 0
			});
		}
		return super.preprocess(others, ignoreIdCheck);
	}
	isNode() {
		return true;
	}
	size(width, height, options) {
		if (width === void 0) return this.getSize();
		if (typeof width === "number") return this.setSize(width, height, options);
		return this.setSize(width, height);
	}
	getSize() {
		const size = this.store.get("size");
		return size ? Object.assign({}, size) : {
			width: 1,
			height: 1
		};
	}
	setSize(width, height, options) {
		if (typeof width === "object") this.resize(width.width, width.height, height);
		else this.resize(width, height, options);
		return this;
	}
	resize(width, height, options = {}) {
		this.startBatch("resize", options);
		const direction = options.direction;
		if (direction) {
			const currentSize = this.getSize();
			switch (direction) {
				case "left":
				case "right":
					height = currentSize.height;
					break;
				case "top":
				case "bottom": width = currentSize.width;
			}
			let quadrant = {
				right: 0,
				"top-right": 0,
				top: 1,
				"top-left": 1,
				left: 2,
				"bottom-left": 2,
				bottom: 3,
				"bottom-right": 3
			}[direction];
			const angle = Angle.normalize(this.getAngle() || 0);
			if (options.absolute) {
				quadrant += Math.floor((angle + 45) / 90);
				quadrant %= 4;
			}
			const bbox = this.getBBox();
			let fixedPoint;
			if (quadrant === 0) fixedPoint = bbox.getBottomLeft();
			else if (quadrant === 1) fixedPoint = bbox.getCorner();
			else if (quadrant === 2) fixedPoint = bbox.getTopRight();
			else fixedPoint = bbox.getOrigin();
			const imageFixedPoint = fixedPoint.clone().rotate(-angle, bbox.getCenter());
			const radius = Math.sqrt(width * width + height * height) / 2;
			let alpha = quadrant * Math.PI / 2;
			alpha += Math.atan(quadrant % 2 === 0 ? height / width : width / height);
			alpha -= Angle.toRad(angle);
			const origin = Point.fromPolar(radius, alpha, imageFixedPoint).clone().translate(width / -2, height / -2);
			this.store.set("size", {
				width,
				height
			}, options);
			this.setPosition(origin.x, origin.y, options);
		} else this.store.set("size", {
			width,
			height
		}, options);
		this.stopBatch("resize", options);
		return this;
	}
	scale(sx, sy, origin, options = {}) {
		const scaledBBox = this.getBBox().scale(sx, sy, origin == null ? void 0 : origin);
		this.startBatch("scale", options);
		this.setPosition(scaledBBox.x, scaledBBox.y, options);
		this.resize(scaledBBox.width, scaledBBox.height, options);
		this.stopBatch("scale");
		return this;
	}
	position(arg0, arg1, arg2) {
		if (typeof arg0 === "number") return this.setPosition(arg0, arg1, arg2);
		return this.getPosition(arg0);
	}
	getPosition(options = {}) {
		if (options.relative) {
			const parent = this.getParent();
			if (parent != null && parent.isNode()) {
				const currentPosition = this.getPosition();
				const parentPosition = parent.getPosition();
				return {
					x: currentPosition.x - parentPosition.x,
					y: currentPosition.y - parentPosition.y
				};
			}
		}
		const pos = this.store.get("position");
		return pos ? Object.assign({}, pos) : {
			x: 0,
			y: 0
		};
	}
	setPosition(arg0, arg1, arg2 = {}) {
		let x;
		let y;
		let options;
		if (typeof arg0 === "object") {
			x = arg0.x;
			y = arg0.y;
			options = arg1 || {};
		} else {
			x = arg0;
			y = arg1;
			options = arg2 || {};
		}
		if (options.relative) {
			const parent = this.getParent();
			if (parent != null && parent.isNode()) {
				const parentPosition = parent.getPosition();
				x += parentPosition.x;
				y += parentPosition.y;
			}
		}
		if (options.deep) {
			const currentPosition = this.getPosition();
			this.translate(x - currentPosition.x, y - currentPosition.y, options);
		} else this.store.set("position", {
			x,
			y
		}, options);
		return this;
	}
	translate(tx = 0, ty = 0, options = {}) {
		if (tx === 0 && ty === 0) return this;
		options.translateBy = options.translateBy || this.id;
		const position = this.getPosition();
		if (options.restrict != null && options.translateBy === this.id) {
			const bbox = this.getBBox({ deep: true });
			const ra = options.restrict;
			const dx = position.x - bbox.x;
			const dy = position.y - bbox.y;
			const x = Math.max(ra.x + dx, Math.min(ra.x + ra.width + dx - bbox.width, position.x + tx));
			const y = Math.max(ra.y + dy, Math.min(ra.y + ra.height + dy - bbox.height, position.y + ty));
			tx = x - position.x;
			ty = y - position.y;
		}
		const translatedPosition = {
			x: position.x + tx,
			y: position.y + ty
		};
		options.tx = tx;
		options.ty = ty;
		if (options.transition) {
			if (typeof options.transition !== "object") options.transition = {};
			this.transition("position", translatedPosition, Object.assign(Object.assign({}, options.transition), { interp: Interp.object }));
			this.eachChild((child) => {
				var _a;
				if (!((_a = options.exclude) === null || _a === void 0 ? void 0 : _a.includes(child))) child.translate(tx, ty, options);
			});
		} else {
			this.startBatch("translate", options);
			this.store.set("position", translatedPosition, options);
			this.eachChild((child) => {
				var _a;
				if (!((_a = options.exclude) === null || _a === void 0 ? void 0 : _a.includes(child))) child.translate(tx, ty, options);
			});
			this.stopBatch("translate", options);
		}
		return this;
	}
	angle(val, options) {
		if (val == null) return this.getAngle();
		return this.rotate(val, options);
	}
	getAngle() {
		return this.store.get("angle", 0);
	}
	rotate(angle, options = {}) {
		const currentAngle = this.getAngle();
		if (options.center) {
			const size = this.getSize();
			const position = this.getPosition();
			const center = this.getBBox().getCenter();
			center.rotate(currentAngle - angle, options.center);
			const dx = center.x - size.width / 2 - position.x;
			const dy = center.y - size.height / 2 - position.y;
			this.startBatch("rotate", {
				angle,
				options
			});
			this.setPosition(position.x + dx, position.y + dy, options);
			this.rotate(angle, Object.assign(Object.assign({}, options), { center: null }));
			this.stopBatch("rotate");
		} else this.store.set("angle", options.absolute ? angle : (currentAngle + angle) % 360, options);
		return this;
	}
	getBBox(options = {}) {
		if (options.deep) {
			const cells = this.getDescendants({
				deep: true,
				breadthFirst: true
			});
			cells.push(this);
			return Cell.getCellsBBox(cells);
		}
		return Rectangle.fromPositionAndSize(this.getPosition(), this.getSize());
	}
	getConnectionPoint(edge, type) {
		const bbox = this.getBBox();
		const center = bbox.getCenter();
		const terminal = edge.getTerminal(type);
		if (terminal == null) return center;
		const portId = terminal.port;
		if (!portId || !this.hasPort(portId)) return center;
		const port = this.getPort(portId);
		if (!port || !port.group) return center;
		const position = this.getPortsPosition(port.group)[portId].position;
		const portCenter = Point.create(position).translate(bbox.getOrigin());
		const angle = this.getAngle();
		if (angle) portCenter.rotate(-angle, center);
		return portCenter;
	}
	/**
	* Sets cell's size and position based on the children bbox and given padding.
	*/
	fit(options = {}) {
		const embeds = (this.getChildren() || []).filter((cell) => cell.isNode());
		if (embeds.length === 0) return this;
		this.startBatch("fit-embeds", options);
		if (options.deep) embeds.forEach((cell) => cell.fit(options));
		let { x, y, width, height } = Cell.getCellsBBox(embeds);
		const padding = normalizeSides(options.padding);
		x -= padding.left;
		y -= padding.top;
		width += padding.left + padding.right;
		height += padding.bottom + padding.top;
		this.store.set({
			position: {
				x,
				y
			},
			size: {
				width,
				height
			}
		}, options);
		this.stopBatch("fit-embeds");
		return this;
	}
	get portContainerMarkup() {
		return this.getPortContainerMarkup();
	}
	set portContainerMarkup(markup) {
		this.setPortContainerMarkup(markup);
	}
	getDefaultPortContainerMarkup() {
		return this.store.get("defaultPortContainerMarkup") || Markup.getPortContainerMarkup();
	}
	getPortContainerMarkup() {
		return this.store.get("portContainerMarkup") || this.getDefaultPortContainerMarkup();
	}
	setPortContainerMarkup(markup, options = {}) {
		this.store.set("portContainerMarkup", Markup.clone(markup), options);
		return this;
	}
	get portMarkup() {
		return this.getPortMarkup();
	}
	set portMarkup(markup) {
		this.setPortMarkup(markup);
	}
	getDefaultPortMarkup() {
		return this.store.get("defaultPortMarkup") || Markup.getPortMarkup();
	}
	getPortMarkup() {
		return this.store.get("portMarkup") || this.getDefaultPortMarkup();
	}
	setPortMarkup(markup, options = {}) {
		this.store.set("portMarkup", Markup.clone(markup), options);
		return this;
	}
	get portLabelMarkup() {
		return this.getPortLabelMarkup();
	}
	set portLabelMarkup(markup) {
		this.setPortLabelMarkup(markup);
	}
	getDefaultPortLabelMarkup() {
		return this.store.get("defaultPortLabelMarkup") || Markup.getPortLabelMarkup();
	}
	getPortLabelMarkup() {
		return this.store.get("portLabelMarkup") || this.getDefaultPortLabelMarkup();
	}
	setPortLabelMarkup(markup, options = {}) {
		this.store.set("portLabelMarkup", Markup.clone(markup), options);
		return this;
	}
	get ports() {
		const res = this.store.get("ports", { items: [] });
		if (res.items == null) res.items = [];
		return res;
	}
	getPorts() {
		return cloneDeep(this.ports.items);
	}
	getPortsByGroup(groupName) {
		return this.getPorts().filter((port) => port.group === groupName);
	}
	getPort(portId) {
		return cloneDeep(this.ports.items.find((port) => port.id && port.id === portId));
	}
	getPortAt(index) {
		return this.ports.items[index] || null;
	}
	hasPorts() {
		return this.ports.items.length > 0;
	}
	hasPort(portId) {
		return this.getPortIndex(portId) !== -1;
	}
	getPortIndex(port) {
		const portId = typeof port === "string" ? port : port.id;
		return portId != null ? this.ports.items.findIndex((item) => item.id === portId) : -1;
	}
	getPortsPosition(groupName) {
		const size = this.getSize();
		return this.port.getPortsLayoutByGroup(groupName, new Rectangle(0, 0, size.width, size.height)).reduce((memo, item) => {
			const layout = item.portLayout;
			memo[item.portId] = {
				position: Object.assign({}, layout.position),
				angle: layout.angle || 0
			};
			return memo;
		}, {});
	}
	getPortProp(portId, path) {
		return this.getPropByPath(this.prefixPortPath(portId, path));
	}
	setPortProp(portId, arg1, arg2, arg3) {
		if (typeof arg1 === "string" || Array.isArray(arg1)) {
			const path = this.prefixPortPath(portId, arg1);
			const value = arg2;
			return this.setPropByPath(path, value, arg3);
		}
		const path = this.prefixPortPath(portId);
		const value = arg1;
		return this.setPropByPath(path, value, arg2);
	}
	removePortProp(portId, path, options) {
		if (typeof path === "string" || Array.isArray(path)) return this.removePropByPath(this.prefixPortPath(portId, path), options);
		return this.removePropByPath(this.prefixPortPath(portId), path);
	}
	portProp(portId, path, value, options) {
		if (path == null) return this.getPortProp(portId);
		if (typeof path === "string" || Array.isArray(path)) {
			if (arguments.length === 2) return this.getPortProp(portId, path);
			if (value == null) return this.removePortProp(portId, path, options);
			return this.setPortProp(portId, path, value, options);
		}
		return this.setPortProp(portId, path, value);
	}
	prefixPortPath(portId, path) {
		const index = this.getPortIndex(portId);
		if (index === -1) throw new Error(`Unable to find port with id: "${portId}"`);
		if (path == null || path === "") return [
			"ports",
			"items",
			`${index}`
		];
		if (Array.isArray(path)) return [
			"ports",
			"items",
			`${index}`,
			...path
		];
		return `ports/items/${index}/${path}`;
	}
	addPort(port, options) {
		const ports = [...this.ports.items];
		ports.push(port);
		this.setPropByPath("ports/items", ports, options);
		return this;
	}
	addPorts(ports, options) {
		this.setPropByPath("ports/items", [...this.ports.items, ...ports], options);
		return this;
	}
	insertPort(index, port, options) {
		const ports = [...this.ports.items];
		ports.splice(index, 0, port);
		this.setPropByPath("ports/items", ports, options);
		return this;
	}
	removePort(port, options = {}) {
		return this.removePortAt(this.getPortIndex(port), options);
	}
	removePortAt(index, options = {}) {
		if (index >= 0) {
			const ports = [...this.ports.items];
			ports.splice(index, 1);
			options.rewrite = true;
			this.setPropByPath("ports/items", ports, options);
		}
		return this;
	}
	removePorts(portsForRemoval, opt) {
		let options;
		if (Array.isArray(portsForRemoval)) {
			options = opt || {};
			if (portsForRemoval.length) {
				options.rewrite = true;
				const remainingPorts = [...this.ports.items].filter((cp) => !portsForRemoval.some((p) => {
					const id = typeof p === "string" ? p : p.id;
					return cp.id === id;
				}));
				this.setPropByPath("ports/items", remainingPorts, options);
			}
		} else {
			options = portsForRemoval || {};
			options.rewrite = true;
			this.setPropByPath("ports/items", [], options);
		}
		return this;
	}
	getParsedPorts() {
		return this.port.getPorts();
	}
	getParsedGroups() {
		return this.port.groups;
	}
	getPortsLayoutByGroup(groupName, bbox) {
		return this.port.getPortsLayoutByGroup(groupName, bbox);
	}
	initPorts() {
		this.updatePortData();
		this.on("change:ports", () => {
			this.processRemovedPort();
			this.updatePortData();
		});
	}
	processRemovedPort() {
		const current = this.ports;
		const currentItemsMap = {};
		current.items.forEach((item) => {
			if (item.id) currentItemsMap[item.id] = true;
		});
		const removed = {};
		(this.store.getPrevious("ports") || { items: [] }).items.forEach((item) => {
			if (item.id && !currentItemsMap[item.id]) removed[item.id] = true;
		});
		const model = this.model;
		if (model && !isEmpty(removed)) {
			model.getConnectedEdges(this, { incoming: true }).forEach((edge) => {
				const portId = edge.getTargetPortId();
				if (portId && removed[portId]) edge.remove();
			});
			model.getConnectedEdges(this, { outgoing: true }).forEach((edge) => {
				const portId = edge.getSourcePortId();
				if (portId && removed[portId]) edge.remove();
			});
		}
	}
	validatePorts() {
		const ids = {};
		const errors = [];
		this.ports.items.forEach((p) => {
			if (typeof p !== "object") errors.push(`Invalid port ${p}.`);
			if (p.id == null) p.id = this.generatePortId();
			if (ids[p.id]) errors.push("Duplicitied port id.");
			ids[p.id] = true;
		});
		return errors;
	}
	generatePortId() {
		return uuid();
	}
	updatePortData() {
		const err = this.validatePorts();
		if (err.length > 0) {
			this.store.set("ports", this.store.getPrevious("ports"));
			throw new Error(err.join(" "));
		}
		const prev = this.port ? this.port.getPorts() : null;
		this.port = new PortManager(this.ports);
		const curr = this.port.getPorts();
		const added = prev ? curr.filter((item) => {
			if (!prev.find((prevPort) => prevPort.id === item.id)) return item;
			return null;
		}) : [...curr];
		const removed = prev ? prev.filter((item) => {
			if (!curr.find((curPort) => curPort.id === item.id)) return item;
			return null;
		}) : [];
		if (added.length > 0) this.notify("ports:added", {
			added,
			cell: this,
			node: this
		});
		if (removed.length > 0) this.notify("ports:removed", {
			removed,
			cell: this,
			node: this
		});
	}
};
Node$1.defaults = {
	angle: 0,
	position: {
		x: 0,
		y: 0
	},
	size: {
		width: 1,
		height: 1
	}
};
(function(Node) {
	Node.toStringTag = `X6.${Node.name}`;
	function isNode(instance) {
		if (instance == null) return false;
		if (instance instanceof Node) return true;
		const tag = instance[Symbol.toStringTag];
		const node = instance;
		if ((tag == null || tag === Node.toStringTag) && typeof node.isNode === "function" && typeof node.isEdge === "function" && typeof node.prop === "function" && typeof node.attr === "function" && typeof node.size === "function" && typeof node.position === "function") return true;
		return false;
	}
	Node.isNode = isNode;
})(Node$1 || (Node$1 = {}));
(function(Node) {
	Node.config({ propHooks(_a) {
		var { ports } = _a, metadata = __rest$14(_a, ["ports"]);
		if (ports) metadata.ports = Array.isArray(ports) ? { items: ports } : ports;
		return metadata;
	} });
})(Node$1 || (Node$1 = {}));
(function(Node) {
	Node.registry = Registry.create({
		type: "node",
		process(shape, options) {
			if (ShareRegistry.exist(shape, true)) throw new Error(`Node with name '${shape}' was registered by anthor Edge`);
			if (typeof options === "function") {
				options.config({ shape });
				return options;
			}
			let parent = Node;
			const { inherit } = options, config = __rest$14(options, ["inherit"]);
			if (inherit) if (typeof inherit === "string") {
				const base = this.get(inherit);
				if (base == null) this.onNotFound(inherit, "inherited");
				else parent = base;
			} else parent = inherit;
			if (config.constructorName == null) config.constructorName = shape;
			const ctor = parent.define.call(parent, config);
			ctor.config({ shape });
			return ctor;
		}
	});
	ShareRegistry.setNodeRegistry(Node.registry);
})(Node$1 || (Node$1 = {}));
(function(Node) {
	let counter = 0;
	function getClassName(name) {
		if (name) return pascalCase(name);
		counter += 1;
		return `CustomNode${counter}`;
	}
	function define(config) {
		const { constructorName, overwrite } = config, others = __rest$14(config, ["constructorName", "overwrite"]);
		const ctor = createClass(getClassName(constructorName || others.shape), this);
		ctor.config(others);
		if (others.shape) Node.registry.register(others.shape, ctor, overwrite);
		return ctor;
	}
	Node.define = define;
	function create(options) {
		const shape = options.shape || "rect";
		const Ctor = Node.registry.get(shape);
		if (Ctor) return new Ctor(options);
		return Node.registry.onNotFound(shape);
	}
	Node.create = create;
})(Node$1 || (Node$1 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/model/edge.js
var __rest$13 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var Edge$1 = class Edge$1 extends Cell {
	get [Symbol.toStringTag]() {
		return Edge$1.toStringTag;
	}
	constructor(metadata = {}) {
		super(metadata);
	}
	preprocess(metadata, ignoreIdCheck) {
		const { source, sourceCell, sourcePort, sourcePoint, target, targetCell, targetPort, targetPoint } = metadata;
		const data = __rest$13(metadata, [
			"source",
			"sourceCell",
			"sourcePort",
			"sourcePoint",
			"target",
			"targetCell",
			"targetPort",
			"targetPoint"
		]);
		const isValidId = (val) => typeof val === "string" || typeof val === "number";
		if (source != null) if (Cell.isCell(source)) data.source = { cell: source.id };
		else if (isValidId(source)) data.source = { cell: source };
		else if (Point.isPoint(source)) data.source = source.toJSON();
		else if (Array.isArray(source)) data.source = {
			x: source[0],
			y: source[1]
		};
		else {
			const cell = source.cell;
			if (Cell.isCell(cell)) data.source = Object.assign(Object.assign({}, source), { cell: cell.id });
			else data.source = source;
		}
		if (sourceCell != null || sourcePort != null) {
			let terminal = data.source;
			if (sourceCell != null) {
				const id = isValidId(sourceCell) ? sourceCell : sourceCell.id;
				if (terminal) terminal.cell = id;
				else terminal = data.source = { cell: id };
			}
			if (sourcePort != null && terminal) terminal.port = sourcePort;
		} else if (sourcePoint != null) data.source = Point.create(sourcePoint).toJSON();
		if (target != null) if (Cell.isCell(target)) data.target = { cell: target.id };
		else if (isValidId(target)) data.target = { cell: target };
		else if (Point.isPoint(target)) data.target = target.toJSON();
		else if (Array.isArray(target)) data.target = {
			x: target[0],
			y: target[1]
		};
		else {
			const cell = target.cell;
			if (Cell.isCell(cell)) data.target = Object.assign(Object.assign({}, target), { cell: cell.id });
			else data.target = target;
		}
		if (targetCell != null || targetPort != null) {
			let terminal = data.target;
			if (targetCell != null) {
				const id = isValidId(targetCell) ? targetCell : targetCell.id;
				if (terminal) terminal.cell = id;
				else terminal = data.target = { cell: id };
			}
			if (targetPort != null && terminal) terminal.port = targetPort;
		} else if (targetPoint != null) data.target = Point.create(targetPoint).toJSON();
		return super.preprocess(data, ignoreIdCheck);
	}
	setup() {
		super.setup();
		this.on("change:labels", (args) => this.onLabelsChanged(args));
		this.on("change:vertices", (args) => this.onVertexsChanged(args));
	}
	isEdge() {
		return true;
	}
	disconnect(options = {}) {
		this.store.set({
			source: {
				x: 0,
				y: 0
			},
			target: {
				x: 0,
				y: 0
			}
		}, options);
		return this;
	}
	get source() {
		return this.getSource();
	}
	set source(data) {
		this.setSource(data);
	}
	getSource() {
		return this.getTerminal("source");
	}
	getSourceCellId() {
		return this.source.cell;
	}
	getSourcePortId() {
		return this.source.port;
	}
	setSource(source, args, options = {}) {
		return this.setTerminal("source", source, args, options);
	}
	get target() {
		return this.getTarget();
	}
	set target(data) {
		this.setTarget(data);
	}
	getTarget() {
		return this.getTerminal("target");
	}
	getTargetCellId() {
		return this.target.cell;
	}
	getTargetPortId() {
		return this.target.port;
	}
	setTarget(target, args, options = {}) {
		return this.setTerminal("target", target, args, options);
	}
	getTerminal(type) {
		return Object.assign({}, this.store.get(type));
	}
	setTerminal(type, terminal, args, options = {}) {
		if (Cell.isCell(terminal)) {
			this.store.set(type, merge({}, args, { cell: terminal.id }), options);
			return this;
		}
		const p = terminal;
		if (Point.isPoint(terminal) || p.x != null && p.y != null) {
			this.store.set(type, merge({}, args, {
				x: p.x,
				y: p.y
			}), options);
			return this;
		}
		this.store.set(type, cloneDeep(terminal), options);
		return this;
	}
	getSourcePoint() {
		return this.getTerminalPoint("source");
	}
	getTargetPoint() {
		return this.getTerminalPoint("target");
	}
	getTerminalPoint(type) {
		const terminal = this[type];
		if (Point.isPointLike(terminal)) return Point.create(terminal);
		const cell = this.getTerminalCell(type);
		if (cell) return cell.getConnectionPoint(this, type);
		return new Point();
	}
	getSourceCell() {
		return this.getTerminalCell("source");
	}
	getTargetCell() {
		return this.getTerminalCell("target");
	}
	getTerminalCell(type) {
		if (this.model) {
			const cellId = type === "source" ? this.getSourceCellId() : this.getTargetCellId();
			if (cellId) return this.model.getCell(cellId);
		}
		return null;
	}
	getSourceNode() {
		return this.getTerminalNode("source");
	}
	getTargetNode() {
		return this.getTerminalNode("target");
	}
	getTerminalNode(type) {
		let cell = this;
		const visited = {};
		while (cell && cell.isEdge()) {
			if (visited[cell.id]) return null;
			visited[cell.id] = true;
			cell = cell.getTerminalCell(type);
		}
		return cell && cell.isNode() ? cell : null;
	}
	get router() {
		return this.getRouter();
	}
	set router(data) {
		if (data == null) this.removeRouter();
		else this.setRouter(data);
	}
	getRouter() {
		return this.store.get("router");
	}
	setRouter(name, args, options) {
		if (typeof name === "object") this.store.set("router", name, args);
		else this.store.set("router", {
			name,
			args
		}, options);
		return this;
	}
	removeRouter(options = {}) {
		this.store.remove("router", options);
		return this;
	}
	get connector() {
		return this.getConnector();
	}
	set connector(data) {
		if (data == null) this.removeConnector();
		else this.setConnector(data);
	}
	getConnector() {
		return this.store.get("connector");
	}
	setConnector(name, args, options) {
		if (typeof name === "object") this.store.set("connector", name, args);
		else this.store.set("connector", {
			name,
			args
		}, options);
		return this;
	}
	removeConnector(options = {}) {
		return this.store.remove("connector", options);
	}
	getDefaultLabel() {
		const ctor = this.constructor;
		const defaults = this.store.get("defaultLabel") || ctor.defaultLabel || {};
		return cloneDeep(defaults);
	}
	get labels() {
		return this.getLabels();
	}
	set labels(labels) {
		this.setLabels(labels);
	}
	getLabels() {
		return [...this.store.get("labels", [])].map((item) => this.parseLabel(item));
	}
	setLabels(labels, options = {}) {
		this.store.set("labels", Array.isArray(labels) ? labels : [labels], options);
		return this;
	}
	insertLabel(label, index, options = {}) {
		const labels = this.getLabels();
		const len = labels.length;
		let idx = index != null && Number.isFinite(index) ? index : len;
		if (idx < 0) idx = len + idx + 1;
		labels.splice(idx, 0, this.parseLabel(label));
		return this.setLabels(labels, options);
	}
	appendLabel(label, options = {}) {
		return this.insertLabel(label, -1, options);
	}
	getLabelAt(index) {
		const labels = this.getLabels();
		if (index != null && Number.isFinite(index)) return this.parseLabel(labels[index]);
		return null;
	}
	setLabelAt(index, label, options = {}) {
		if (index != null && Number.isFinite(index)) {
			const labels = this.getLabels();
			labels[index] = this.parseLabel(label);
			this.setLabels(labels, options);
		}
		return this;
	}
	removeLabelAt(index, options = {}) {
		const labels = this.getLabels();
		const idx = index != null && Number.isFinite(index) ? index : -1;
		const removed = labels.splice(idx, 1);
		this.setLabels(labels, options);
		return removed.length ? removed[0] : null;
	}
	parseLabel(label) {
		if (typeof label === "string") return this.constructor.parseStringLabel(label);
		return label;
	}
	onLabelsChanged({ previous, current }) {
		const added = previous && current ? current.filter((label1) => {
			if (!previous.find((label2) => label1 === label2 || isEqual(label1, label2))) return label1;
			return null;
		}) : current ? [...current] : [];
		const removed = previous && current ? previous.filter((label1) => {
			if (!current.find((label2) => label1 === label2 || isEqual(label1, label2))) return label1;
			return null;
		}) : previous ? [...previous] : [];
		if (added.length > 0) this.notify("labels:added", {
			added,
			cell: this,
			edge: this
		});
		if (removed.length > 0) this.notify("labels:removed", {
			removed,
			cell: this,
			edge: this
		});
	}
	get vertices() {
		return this.getVertices();
	}
	set vertices(vertices) {
		this.setVertices(vertices);
	}
	getVertices() {
		return [...this.store.get("vertices", [])];
	}
	setVertices(vertices, options = {}) {
		const points = Array.isArray(vertices) ? vertices : [vertices];
		this.store.set("vertices", points.map((p) => Point.toJSON(p)), options);
		return this;
	}
	insertVertex(vertice, index, options = {}) {
		const vertices = this.getVertices();
		const len = vertices.length;
		let idx = index != null && Number.isFinite(index) ? index : len;
		if (idx < 0) idx = len + idx + 1;
		vertices.splice(idx, 0, Point.toJSON(vertice));
		return this.setVertices(vertices, options);
	}
	appendVertex(vertex, options = {}) {
		return this.insertVertex(vertex, -1, options);
	}
	getVertexAt(index) {
		if (index != null && Number.isFinite(index)) return this.getVertices()[index];
		return null;
	}
	setVertexAt(index, vertice, options = {}) {
		if (index != null && Number.isFinite(index)) {
			const vertices = this.getVertices();
			vertices[index] = vertice;
			this.setVertices(vertices, options);
		}
		return this;
	}
	removeVertexAt(index, options = {}) {
		const vertices = this.getVertices();
		const idx = index != null && Number.isFinite(index) ? index : -1;
		vertices.splice(idx, 1);
		return this.setVertices(vertices, options);
	}
	onVertexsChanged({ previous, current }) {
		const added = previous && current ? current.filter((p1) => {
			if (!previous.find((p2) => Point.equals(p1, p2))) return p1;
			return null;
		}) : current ? [...current] : [];
		const removed = previous && current ? previous.filter((p1) => {
			if (!current.find((p2) => Point.equals(p1, p2))) return p1;
			return null;
		}) : previous ? [...previous] : [];
		if (added.length > 0) this.notify("vertexs:added", {
			added,
			cell: this,
			edge: this
		});
		if (removed.length > 0) this.notify("vertexs:removed", {
			removed,
			cell: this,
			edge: this
		});
	}
	getDefaultMarkup() {
		return this.store.get("defaultMarkup") || Markup.getEdgeMarkup();
	}
	getMarkup() {
		return super.getMarkup() || this.getDefaultMarkup();
	}
	/**
	* Translate the edge vertices (and source and target if they are points)
	* by `tx` pixels in the x-axis and `ty` pixels in the y-axis.
	*/
	translate(tx, ty, options = {}) {
		options.translateBy = options.translateBy || this.id;
		options.tx = tx;
		options.ty = ty;
		return this.applyToPoints((p) => ({
			x: (p.x || 0) + tx,
			y: (p.y || 0) + ty
		}), options);
	}
	/**
	* Scales the edge's points (vertices) relative to the given origin.
	*/
	scale(sx, sy, origin, options = {}) {
		return this.applyToPoints((p) => {
			return Point.create(p).scale(sx, sy, origin).toJSON();
		}, options);
	}
	applyToPoints(worker, options = {}) {
		const attrs = {};
		const source = this.getSource();
		const target = this.getTarget();
		if (Point.isPointLike(source)) attrs.source = worker(source);
		if (Point.isPointLike(target)) attrs.target = worker(target);
		const vertices = this.getVertices();
		if (vertices.length > 0) attrs.vertices = vertices.map(worker);
		this.store.set(attrs, options);
		return this;
	}
	getBBox() {
		return this.getPolyline().bbox();
	}
	getConnectionPoint() {
		return this.getPolyline().pointAt(.5);
	}
	getPolyline() {
		const points = [
			this.getSourcePoint(),
			...this.getVertices().map((vertice) => Point.create(vertice)),
			this.getTargetPoint()
		];
		return new Polyline$1(points);
	}
	updateParent(options) {
		let newParent = null;
		const source = this.getSourceCell();
		const target = this.getTargetCell();
		const prevParent = this.getParent();
		if (source && target) if (source === target || source.isDescendantOf(target)) newParent = target;
		else if (target.isDescendantOf(source)) newParent = source;
		else newParent = Cell.getCommonAncestor(source, target);
		if (prevParent && newParent && newParent.id !== prevParent.id) prevParent.unembed(this, options);
		if (newParent && (!prevParent || prevParent.id !== newParent.id)) newParent.embed(this, options);
		return newParent;
	}
	hasLoop(options = {}) {
		const source = this.getSource();
		const target = this.getTarget();
		const sourceId = source.cell;
		const targetId = target.cell;
		if (!sourceId || !targetId) return false;
		let loop = sourceId === targetId;
		if (!loop && options.deep && this._model) {
			const sourceCell = this.getSourceCell();
			const targetCell = this.getTargetCell();
			if (sourceCell && targetCell) loop = sourceCell.isAncestorOf(targetCell, options) || targetCell.isAncestorOf(sourceCell, options);
		}
		return loop;
	}
	getFragmentAncestor() {
		const cells = [
			this,
			this.getSourceNode(),
			this.getTargetNode()
		].filter((item) => item != null);
		return this.getCommonAncestor(...cells);
	}
	isFragmentDescendantOf(cell) {
		const ancestor = this.getFragmentAncestor();
		return !!ancestor && (ancestor.id === cell.id || ancestor.isDescendantOf(cell));
	}
};
Edge$1.defaults = {};
(function(Edge) {
	function equalTerminals(a, b) {
		const a1 = a;
		const b1 = b;
		if (a1.cell === b1.cell) return a1.port === b1.port || a1.port == null && b1.port == null;
		return false;
	}
	Edge.equalTerminals = equalTerminals;
})(Edge$1 || (Edge$1 = {}));
(function(Edge) {
	Edge.defaultLabel = {
		markup: [{
			tagName: "rect",
			selector: "body"
		}, {
			tagName: "text",
			selector: "label"
		}],
		attrs: {
			text: {
				fill: "#000",
				fontSize: 14,
				textAnchor: "middle",
				textVerticalAnchor: "middle",
				pointerEvents: "none"
			},
			rect: {
				ref: "label",
				fill: "#fff",
				rx: 3,
				ry: 3,
				refWidth: 1,
				refHeight: 1,
				refX: 0,
				refY: 0
			}
		},
		position: { distance: .5 }
	};
	function parseStringLabel(text) {
		return { attrs: { label: { text } } };
	}
	Edge.parseStringLabel = parseStringLabel;
})(Edge$1 || (Edge$1 = {}));
(function(Edge) {
	Edge.toStringTag = `X6.${Edge.name}`;
	function isEdge(instance) {
		if (instance == null) return false;
		if (instance instanceof Edge) return true;
		const tag = instance[Symbol.toStringTag];
		const edge = instance;
		if ((tag == null || tag === Edge.toStringTag) && typeof edge.isNode === "function" && typeof edge.isEdge === "function" && typeof edge.prop === "function" && typeof edge.attr === "function" && typeof edge.disconnect === "function" && typeof edge.getSource === "function" && typeof edge.getTarget === "function") return true;
		return false;
	}
	Edge.isEdge = isEdge;
})(Edge$1 || (Edge$1 = {}));
(function(Edge) {
	Edge.registry = Registry.create({
		type: "edge",
		process(shape, options) {
			if (ShareRegistry.exist(shape, false)) throw new Error(`Edge with name '${shape}' was registered by anthor Node`);
			if (typeof options === "function") {
				options.config({ shape });
				return options;
			}
			let parent = Edge;
			const { inherit = "edge" } = options, others = __rest$13(options, ["inherit"]);
			if (typeof inherit === "string") {
				const base = this.get(inherit || "edge");
				if (base == null && inherit) this.onNotFound(inherit, "inherited");
				else parent = base;
			} else parent = inherit;
			if (others.constructorName == null) others.constructorName = shape;
			const ctor = parent.define.call(parent, others);
			ctor.config({ shape });
			return ctor;
		}
	});
	ShareRegistry.setEdgeRegistry(Edge.registry);
})(Edge$1 || (Edge$1 = {}));
(function(Edge) {
	let counter = 0;
	function getClassName(name) {
		if (name) return pascalCase(name);
		counter += 1;
		return `CustomEdge${counter}`;
	}
	function define(config) {
		const { constructorName, overwrite } = config, others = __rest$13(config, ["constructorName", "overwrite"]);
		const ctor = createClass(getClassName(constructorName || others.shape), this);
		ctor.config(others);
		if (others.shape) Edge.registry.register(others.shape, ctor, overwrite);
		return ctor;
	}
	Edge.define = define;
	function create(options) {
		const shape = options.shape || "edge";
		const Ctor = Edge.registry.get(shape);
		if (Ctor) return new Ctor(options);
		return Edge.registry.onNotFound(shape);
	}
	Edge.create = create;
})(Edge$1 || (Edge$1 = {}));
(function(Edge) {
	const shape = "basic.edge";
	Edge.config({
		shape,
		propHooks(metadata) {
			const { label, vertices } = metadata, others = __rest$13(metadata, ["label", "vertices"]);
			if (label) {
				if (others.labels == null) others.labels = [];
				const formated = typeof label === "string" ? Edge.parseStringLabel(label) : label;
				others.labels.push(formated);
			}
			if (vertices) {
				if (Array.isArray(vertices)) others.vertices = vertices.map((item) => Point.create(item).toJSON());
			}
			return others;
		}
	});
	Edge.registry.register(shape, Edge);
})(Edge$1 || (Edge$1 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/model/collection.js
var __decorate$24 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Collection = class extends Basecoat {
	constructor(cells, options = {}) {
		super();
		this.length = 0;
		this.comparator = options.comparator || "zIndex";
		this.clean();
		if (cells) this.reset(cells, { silent: true });
	}
	toJSON() {
		return this.cells.map((cell) => cell.toJSON());
	}
	add(cells, index, options) {
		let localIndex;
		let localOptions;
		if (typeof index === "number") {
			localIndex = index;
			localOptions = Object.assign({ merge: false }, options);
		} else {
			localIndex = this.length;
			localOptions = Object.assign({ merge: false }, index);
		}
		if (localIndex > this.length) localIndex = this.length;
		if (localIndex < 0) localIndex += this.length + 1;
		const entities = Array.isArray(cells) ? cells : [cells];
		const sortable = this.comparator && typeof index !== "number" && localOptions.sort !== false;
		const sortAttr = this.comparator || null;
		let sort = false;
		const added = [];
		const merged = [];
		entities.forEach((cell) => {
			const existing = this.get(cell);
			if (existing) {
				if (localOptions.merge && !cell.isSameStore(existing)) {
					existing.setProp(cell.getProp(), options);
					merged.push(existing);
					if (sortable && !sort) if (sortAttr == null || typeof sortAttr === "function") sort = existing.hasChanged();
					else if (typeof sortAttr === "string") sort = existing.hasChanged(sortAttr);
					else sort = sortAttr.some((key) => existing.hasChanged(key));
				}
			} else {
				added.push(cell);
				this.reference(cell);
			}
		});
		if (added.length) {
			if (sortable) sort = true;
			this.cells.splice(localIndex, 0, ...added);
			this.length = this.cells.length;
		}
		if (sort) this.sort({ silent: true });
		if (!localOptions.silent) {
			added.forEach((cell, i) => {
				const args = {
					cell,
					index: localIndex + i,
					options: localOptions
				};
				this.trigger("added", args);
				if (!localOptions.dryrun) cell.notify("added", Object.assign({}, args));
			});
			if (sort) this.trigger("sorted");
			if (added.length || merged.length) this.trigger("updated", {
				added,
				merged,
				removed: [],
				options: localOptions
			});
		}
		return this;
	}
	remove(cells, options = {}) {
		const arr = Array.isArray(cells) ? cells : [cells];
		const removed = this.removeCells(arr, options);
		if (!options.silent && removed.length > 0) this.trigger("updated", {
			options,
			removed,
			added: [],
			merged: []
		});
		return Array.isArray(cells) ? removed : removed[0];
	}
	removeCells(cells, options) {
		const removed = [];
		for (let i = 0; i < cells.length; i += 1) {
			const cell = this.get(cells[i]);
			if (cell == null) continue;
			const index = this.cells.indexOf(cell);
			this.cells.splice(index, 1);
			this.length -= 1;
			delete this.map[cell.id];
			removed.push(cell);
			this.unreference(cell);
			if (!options.dryrun) cell.remove();
			if (!options.silent) {
				this.trigger("removed", {
					cell,
					index,
					options
				});
				if (!options.dryrun) cell.notify("removed", {
					cell,
					index,
					options
				});
			}
		}
		return removed;
	}
	reset(cells, options = {}) {
		const previous = this.cells.slice();
		previous.forEach((cell) => this.unreference(cell));
		this.clean();
		this.add(cells, Object.assign({ silent: true }, options));
		if (!options.silent) {
			const current = this.cells.slice();
			this.trigger("reseted", {
				options,
				previous,
				current
			});
			const added = [];
			const removed = [];
			current.forEach((a) => {
				if (!previous.some((b) => b.id === a.id)) added.push(a);
			});
			previous.forEach((a) => {
				if (!current.some((b) => b.id === a.id)) removed.push(a);
			});
			this.trigger("updated", {
				options,
				added,
				removed,
				merged: []
			});
		}
		return this;
	}
	push(cell, options) {
		return this.add(cell, this.length, options);
	}
	pop(options) {
		const cell = this.at(this.length - 1);
		return this.remove(cell, options);
	}
	unshift(cell, options) {
		return this.add(cell, 0, options);
	}
	shift(options) {
		const cell = this.at(0);
		return this.remove(cell, options);
	}
	get(cell) {
		if (cell == null) return null;
		const id = typeof cell === "string" || typeof cell === "number" ? cell : cell.id;
		return this.map[id] || null;
	}
	has(cell) {
		return this.get(cell) != null;
	}
	at(index) {
		if (index < 0) index += this.length;
		return this.cells[index] || null;
	}
	first() {
		return this.at(0);
	}
	last() {
		return this.at(-1);
	}
	indexOf(cell) {
		return this.cells.indexOf(cell);
	}
	toArray() {
		return this.cells.slice();
	}
	sort(options = {}) {
		if (this.comparator != null) {
			this.cells = sortBy(this.cells, this.comparator);
			if (!options.silent) this.trigger("sorted");
		}
		return this;
	}
	clone() {
		const constructor = this.constructor;
		return new constructor(this.cells.slice(), { comparator: this.comparator });
	}
	reference(cell) {
		this.map[cell.id] = cell;
		cell.on("*", this.notifyCellEvent, this);
	}
	unreference(cell) {
		cell.off("*", this.notifyCellEvent, this);
		delete this.map[cell.id];
	}
	notifyCellEvent(name, args) {
		const cell = args.cell;
		this.trigger(`cell:${name}`, args);
		if (cell) {
			if (cell.isNode()) this.trigger(`node:${name}`, Object.assign(Object.assign({}, args), { node: cell }));
			else if (cell.isEdge()) this.trigger(`edge:${name}`, Object.assign(Object.assign({}, args), { edge: cell }));
		}
	}
	clean() {
		this.length = 0;
		this.cells = [];
		this.map = {};
	}
	dispose() {
		this.reset([]);
	}
};
__decorate$24([Collection.dispose()], Collection.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/model/model.js
var __decorate$23 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Model = class Model extends Basecoat {
	get [Symbol.toStringTag]() {
		return Model.toStringTag;
	}
	constructor(cells = []) {
		super();
		this.batches = {};
		this.addings = /* @__PURE__ */ new WeakMap();
		this.nodes = {};
		this.edges = {};
		this.outgoings = {};
		this.incomings = {};
		this.collection = new Collection(cells);
		this.setup();
	}
	notify(name, args) {
		this.trigger(name, args);
		const graph = this.graph;
		if (graph) if (name === "sorted" || name === "reseted" || name === "updated") graph.trigger(`model:${name}`, args);
		else graph.trigger(name, args);
		return this;
	}
	setup() {
		const collection = this.collection;
		collection.on("sorted", () => this.notify("sorted", null));
		collection.on("updated", (args) => this.notify("updated", args));
		collection.on("cell:change:zIndex", () => this.sortOnChangeZ());
		collection.on("added", ({ cell }) => {
			this.onCellAdded(cell);
		});
		collection.on("removed", (args) => {
			const cell = args.cell;
			this.onCellRemoved(cell, args.options);
			this.notify("cell:removed", args);
			if (cell.isNode()) this.notify("node:removed", Object.assign(Object.assign({}, args), { node: cell }));
			else if (cell.isEdge()) this.notify("edge:removed", Object.assign(Object.assign({}, args), { edge: cell }));
		});
		collection.on("reseted", (args) => {
			this.onReset(args.current);
			this.notify("reseted", args);
		});
		collection.on("edge:change:source", ({ edge }) => this.onEdgeTerminalChanged(edge, "source"));
		collection.on("edge:change:target", ({ edge }) => {
			this.onEdgeTerminalChanged(edge, "target");
		});
	}
	sortOnChangeZ() {
		this.collection.sort();
	}
	onCellAdded(cell) {
		const cellId = cell.id;
		if (cell.isEdge()) {
			cell.updateParent();
			this.edges[cellId] = true;
			this.onEdgeTerminalChanged(cell, "source");
			this.onEdgeTerminalChanged(cell, "target");
		} else this.nodes[cellId] = true;
	}
	onCellRemoved(cell, options) {
		const cellId = cell.id;
		if (cell.isEdge()) {
			delete this.edges[cellId];
			const source = cell.getSource();
			const target = cell.getTarget();
			if (source && source.cell) {
				const cache = this.outgoings[source.cell];
				const index = cache ? cache.indexOf(cellId) : -1;
				if (index >= 0) {
					cache.splice(index, 1);
					if (cache.length === 0) delete this.outgoings[source.cell];
				}
			}
			if (target && target.cell) {
				const cache = this.incomings[target.cell];
				const index = cache ? cache.indexOf(cellId) : -1;
				if (index >= 0) {
					cache.splice(index, 1);
					if (cache.length === 0) delete this.incomings[target.cell];
				}
			}
		} else delete this.nodes[cellId];
		if (!options.clear) if (options.disconnectEdges) this.disconnectConnectedEdges(cell, options);
		else this.removeConnectedEdges(cell, options);
		if (cell.model === this) cell.model = null;
	}
	onReset(cells) {
		this.nodes = {};
		this.edges = {};
		this.outgoings = {};
		this.incomings = {};
		cells.forEach((cell) => this.onCellAdded(cell));
	}
	onEdgeTerminalChanged(edge, type) {
		const ref = type === "source" ? this.outgoings : this.incomings;
		const prev = edge.previous(type);
		if (prev && prev.cell) {
			const cellId = Cell.isCell(prev.cell) ? prev.cell.id : prev.cell;
			const cache = ref[cellId];
			const index = cache ? cache.indexOf(edge.id) : -1;
			if (index >= 0) {
				cache.splice(index, 1);
				if (cache.length === 0) delete ref[cellId];
			}
		}
		const terminal = edge.getTerminal(type);
		if (terminal && terminal.cell) {
			const terminalId = Cell.isCell(terminal.cell) ? terminal.cell.id : terminal.cell;
			const cache = ref[terminalId] || [];
			if (cache.indexOf(edge.id) === -1) cache.push(edge.id);
			ref[terminalId] = cache;
		}
	}
	prepareCell(cell, options) {
		if (!cell.model && (!options || !options.dryrun)) cell.model = this;
		if (cell.zIndex == null) cell.setZIndex(this.getMaxZIndex() + 1, { silent: true });
		return cell;
	}
	resetCells(cells, options = {}) {
		cells.map((cell) => this.prepareCell(cell, Object.assign(Object.assign({}, options), { dryrun: true })));
		this.collection.reset(cells, options);
		cells.map((cell) => this.prepareCell(cell, { options }));
		return this;
	}
	clear(options = {}) {
		const raw = this.getCells();
		if (raw.length === 0) return this;
		const localOptions = Object.assign(Object.assign({}, options), { clear: true });
		this.batchUpdate("clear", () => {
			const cells = raw.sort((a, b) => {
				return (a.isEdge() ? 1 : 2) - (b.isEdge() ? 1 : 2);
			});
			while (cells.length > 0) {
				const cell = cells.shift();
				if (cell) cell.remove(localOptions);
			}
		}, localOptions);
		return this;
	}
	addNode(metadata, options = {}) {
		const node = Node$1.isNode(metadata) ? metadata : this.createNode(metadata);
		this.addCell(node, options);
		return node;
	}
	updateNode(metadata, options = {}) {
		const node = this.createNode(metadata);
		const prop = node.getProp();
		node.dispose();
		return this.updateCell(prop, options);
	}
	createNode(metadata) {
		return Node$1.create(metadata);
	}
	addEdge(metadata, options = {}) {
		const edge = Edge$1.isEdge(metadata) ? metadata : this.createEdge(metadata);
		this.addCell(edge, options);
		return edge;
	}
	createEdge(metadata) {
		return Edge$1.create(metadata);
	}
	updateEdge(metadata, options = {}) {
		const edge = this.createEdge(metadata);
		const prop = edge.getProp();
		edge.dispose();
		return this.updateCell(prop, options);
	}
	addCell(cell, options = {}) {
		if (Array.isArray(cell)) return this.addCells(cell, options);
		if (!this.collection.has(cell) && !this.addings.has(cell)) {
			this.addings.set(cell, true);
			this.collection.add(this.prepareCell(cell, options), options);
			cell.eachChild((child) => this.addCell(child, options));
			this.addings.delete(cell);
		}
		return this;
	}
	addCells(cells, options = {}) {
		const count = cells.length;
		if (count === 0) return this;
		const localOptions = Object.assign(Object.assign({}, options), {
			position: count - 1,
			maxPosition: count - 1
		});
		this.startBatch("add", Object.assign(Object.assign({}, localOptions), { cells }));
		cells.forEach((cell) => {
			this.addCell(cell, localOptions);
			localOptions.position -= 1;
		});
		this.stopBatch("add", Object.assign(Object.assign({}, localOptions), { cells }));
		return this;
	}
	updateCell(prop, options = {}) {
		const existing = prop.id && this.getCell(prop.id);
		if (existing) return this.batchUpdate("update", () => {
			Object.entries(prop).forEach(([key, val]) => existing.setProp(key, val, options));
			return true;
		}, prop);
		return false;
	}
	removeCell(obj, options = {}) {
		const cell = typeof obj === "string" ? this.getCell(obj) : obj;
		if (cell && this.has(cell)) return this.collection.remove(cell, options);
		return null;
	}
	updateCellId(cell, newId) {
		if (cell.id === newId) return;
		this.startBatch("update", { id: newId });
		cell.prop("id", newId);
		const newCell = cell.clone({ keepId: true });
		this.addCell(newCell);
		this.getConnectedEdges(cell).forEach((edge) => {
			const sourceCell = edge.getSourceCell();
			const targetCell = edge.getTargetCell();
			if (sourceCell === cell) edge.setSource(Object.assign(Object.assign({}, edge.getSource()), { cell: newId }));
			if (targetCell === cell) edge.setTarget(Object.assign(Object.assign({}, edge.getTarget()), { cell: newId }));
		});
		this.removeCell(cell);
		this.stopBatch("update", { id: newId });
		return newCell;
	}
	removeCells(cells, options = {}) {
		if (cells.length) return this.batchUpdate("remove", () => {
			return cells.map((cell) => this.removeCell(cell, options));
		});
		return [];
	}
	removeConnectedEdges(cell, options = {}) {
		const edges = this.getConnectedEdges(cell);
		edges.forEach((edge) => {
			edge.remove(options);
		});
		return edges;
	}
	disconnectConnectedEdges(cell, options = {}) {
		const cellId = typeof cell === "string" ? cell : cell.id;
		this.getConnectedEdges(cell).forEach((edge) => {
			const sourceCellId = edge.getSourceCellId();
			const targetCellId = edge.getTargetCellId();
			if (sourceCellId === cellId) edge.setSource({
				x: 0,
				y: 0
			}, options);
			if (targetCellId === cellId) edge.setTarget({
				x: 0,
				y: 0
			}, options);
		});
	}
	has(obj) {
		return this.collection.has(obj);
	}
	total() {
		return this.collection.length;
	}
	indexOf(cell) {
		return this.collection.indexOf(cell);
	}
	/**
	* Returns a cell from the graph by its id.
	*/
	getCell(id) {
		return this.collection.get(id);
	}
	/**
	* Returns all the nodes and edges in the graph.
	*/
	getCells() {
		return this.collection.toArray();
	}
	/**
	* Returns the first cell (node or edge) in the graph. The first cell is
	* defined as the cell with the lowest `zIndex`.
	*/
	getFirstCell() {
		return this.collection.first();
	}
	/**
	* Returns the last cell (node or edge) in the graph. The last cell is
	* defined as the cell with the highest `zIndex`.
	*/
	getLastCell() {
		return this.collection.last();
	}
	/**
	* Returns the lowest `zIndex` value in the graph.
	*/
	getMinZIndex() {
		const first = this.collection.first();
		return first ? first.getZIndex() || 0 : 0;
	}
	/**
	* Returns the highest `zIndex` value in the graph.
	*/
	getMaxZIndex() {
		const last = this.collection.last();
		return last ? last.getZIndex() || 0 : 0;
	}
	getCellsFromCache(cache) {
		return cache ? Object.keys(cache).map((id) => this.getCell(id)).filter((cell) => cell != null) : [];
	}
	/**
	* Returns all the nodes in the graph.
	*/
	getNodes() {
		return this.getCellsFromCache(this.nodes);
	}
	/**
	* Returns all the edges in the graph.
	*/
	getEdges() {
		return this.getCellsFromCache(this.edges);
	}
	/**
	* Returns all outgoing edges for the node.
	*/
	getOutgoingEdges(cell) {
		const cellId = typeof cell === "string" ? cell : cell.id;
		const cellIds = this.outgoings[cellId];
		return cellIds ? cellIds.map((id) => this.getCell(id)).filter((cell) => cell && cell.isEdge()) : null;
	}
	/**
	* Returns all incoming edges for the node.
	*/
	getIncomingEdges(cell) {
		const cellId = typeof cell === "string" ? cell : cell.id;
		const cellIds = this.incomings[cellId];
		return cellIds ? cellIds.map((id) => this.getCell(id)).filter((cell) => cell && cell.isEdge()) : null;
	}
	/**
	* Returns edges connected with cell.
	*/
	getConnectedEdges(cell, options = {}) {
		const result = [];
		const node = typeof cell === "string" ? this.getCell(cell) : cell;
		if (node == null) return result;
		const cache = {};
		const indirect = options.indirect;
		let incoming = options.incoming;
		let outgoing = options.outgoing;
		if (incoming == null && outgoing == null) incoming = outgoing = true;
		const collect = (cell, isOutgoing) => {
			const edges = isOutgoing ? this.getOutgoingEdges(cell) : this.getIncomingEdges(cell);
			if (edges != null) edges.forEach((edge) => {
				if (cache[edge.id]) return;
				result.push(edge);
				cache[edge.id] = true;
				if (indirect) {
					if (incoming) collect(edge, false);
					if (outgoing) collect(edge, true);
				}
			});
			if (indirect && cell.isEdge()) {
				const terminal = isOutgoing ? cell.getTargetCell() : cell.getSourceCell();
				if (terminal && terminal.isEdge()) {
					if (!cache[terminal.id]) {
						result.push(terminal);
						collect(terminal, isOutgoing);
					}
				}
			}
		};
		if (outgoing) collect(node, true);
		if (incoming) collect(node, false);
		if (options.deep) {
			const descendants = node.getDescendants({ deep: true });
			const embedsCache = {};
			descendants.forEach((cell) => {
				if (cell.isNode()) embedsCache[cell.id] = true;
			});
			const collectSub = (cell, isOutgoing) => {
				const edges = isOutgoing ? this.getOutgoingEdges(cell.id) : this.getIncomingEdges(cell.id);
				if (edges != null) edges.forEach((edge) => {
					if (!cache[edge.id]) {
						const sourceCell = edge.getSourceCell();
						const targetCell = edge.getTargetCell();
						if (!options.enclosed && sourceCell && embedsCache[sourceCell.id] && targetCell && embedsCache[targetCell.id]) return;
						result.push(edge);
						cache[edge.id] = true;
					}
				});
			};
			descendants.forEach((cell) => {
				if (cell.isEdge()) return;
				if (outgoing) collectSub(cell, true);
				if (incoming) collectSub(cell, false);
			});
		}
		return result;
	}
	isBoundary(cell, isOrigin) {
		const node = typeof cell === "string" ? this.getCell(cell) : cell;
		const arr = isOrigin ? this.getIncomingEdges(node) : this.getOutgoingEdges(node);
		return arr == null || arr.length === 0;
	}
	getBoundaryNodes(isOrigin) {
		const result = [];
		Object.keys(this.nodes).forEach((nodeId) => {
			if (this.isBoundary(nodeId, isOrigin)) {
				const node = this.getCell(nodeId);
				if (node) result.push(node);
			}
		});
		return result;
	}
	/**
	* Returns an array of all the roots of the graph.
	*/
	getRoots() {
		return this.getBoundaryNodes(true);
	}
	/**
	* Returns an array of all the leafs of the graph.
	*/
	getLeafs() {
		return this.getBoundaryNodes(false);
	}
	/**
	* Returns `true` if the node is a root node, i.e. there is no edges
	* coming to the node.
	*/
	isRoot(cell) {
		return this.isBoundary(cell, true);
	}
	/**
	* Returns `true` if the node is a leaf node, i.e. there is no edges
	* going out from the node.
	*/
	isLeaf(cell) {
		return this.isBoundary(cell, false);
	}
	/**
	* Returns all the neighbors of node in the graph. Neighbors are all
	* the nodes connected to node via either incoming or outgoing edge.
	*/
	getNeighbors(cell, options = {}) {
		let incoming = options.incoming;
		let outgoing = options.outgoing;
		if (incoming == null && outgoing == null) incoming = outgoing = true;
		const map = this.getConnectedEdges(cell, options).reduce((memo, edge) => {
			const hasLoop = edge.hasLoop(options);
			const sourceCell = edge.getSourceCell();
			const targetCell = edge.getTargetCell();
			if (incoming && sourceCell && sourceCell.isNode() && !memo[sourceCell.id]) {
				if (hasLoop || sourceCell !== cell && (!options.deep || !sourceCell.isDescendantOf(cell))) memo[sourceCell.id] = sourceCell;
			}
			if (outgoing && targetCell && targetCell.isNode() && !memo[targetCell.id]) {
				if (hasLoop || targetCell !== cell && (!options.deep || !targetCell.isDescendantOf(cell))) memo[targetCell.id] = targetCell;
			}
			return memo;
		}, {});
		if (cell.isEdge()) {
			if (incoming) {
				const sourceCell = cell.getSourceCell();
				if (sourceCell && sourceCell.isNode() && !map[sourceCell.id]) map[sourceCell.id] = sourceCell;
			}
			if (outgoing) {
				const targetCell = cell.getTargetCell();
				if (targetCell && targetCell.isNode() && !map[targetCell.id]) map[targetCell.id] = targetCell;
			}
		}
		return Object.keys(map).map((id) => map[id]);
	}
	/**
	* Returns `true` if `cell2` is a neighbor of `cell1`.
	*/
	isNeighbor(cell1, cell2, options = {}) {
		let incoming = options.incoming;
		let outgoing = options.outgoing;
		if (incoming == null && outgoing == null) incoming = outgoing = true;
		return this.getConnectedEdges(cell1, options).some((edge) => {
			const sourceCell = edge.getSourceCell();
			const targetCell = edge.getTargetCell();
			if (incoming && sourceCell && sourceCell.id === cell2.id) return true;
			if (outgoing && targetCell && targetCell.id === cell2.id) return true;
			return false;
		});
	}
	getSuccessors(cell, options = {}) {
		const successors = [];
		this.search(cell, (curr, distance) => {
			if (curr !== cell && this.matchDistance(distance, options.distance)) successors.push(curr);
		}, Object.assign(Object.assign({}, options), { outgoing: true }));
		return successors;
	}
	/**
	* Returns `true` if `cell2` is a successor of `cell1`.
	*/
	isSuccessor(cell1, cell2, options = {}) {
		let result = false;
		this.search(cell1, (curr, distance) => {
			if (curr === cell2 && curr !== cell1 && this.matchDistance(distance, options.distance)) {
				result = true;
				return false;
			}
		}, Object.assign(Object.assign({}, options), { outgoing: true }));
		return result;
	}
	getPredecessors(cell, options = {}) {
		const predecessors = [];
		this.search(cell, (curr, distance) => {
			if (curr !== cell && this.matchDistance(distance, options.distance)) predecessors.push(curr);
		}, Object.assign(Object.assign({}, options), { incoming: true }));
		return predecessors;
	}
	/**
	* Returns `true` if `cell2` is a predecessor of `cell1`.
	*/
	isPredecessor(cell1, cell2, options = {}) {
		let result = false;
		this.search(cell1, (curr, distance) => {
			if (curr === cell2 && curr !== cell1 && this.matchDistance(distance, options.distance)) {
				result = true;
				return false;
			}
		}, Object.assign(Object.assign({}, options), { incoming: true }));
		return result;
	}
	matchDistance(distance, preset) {
		if (preset == null) return true;
		if (typeof preset === "function") return preset(distance);
		if (Array.isArray(preset) && preset.includes(distance)) return true;
		return distance === preset;
	}
	/**
	* Returns the common ancestor of the passed cells.
	*/
	getCommonAncestor(...cells) {
		const arr = [];
		cells.forEach((item) => {
			if (item) if (Array.isArray(item)) arr.push(...item);
			else arr.push(item);
		});
		return Cell.getCommonAncestor(...arr);
	}
	/**
	* Returns an array of cells that result from finding nodes/edges that
	* are connected to any of the cells in the cells array. This function
	* loops over cells and if the current cell is a edge, it collects its
	* source/target nodes; if it is an node, it collects its incoming and
	* outgoing edges if both the edge terminal (source/target) are in the
	* cells array.
	*/
	getSubGraph(cells, options = {}) {
		const subgraph = [];
		const cache = {};
		const nodes = [];
		const edges = [];
		const collect = (cell) => {
			if (!cache[cell.id]) {
				subgraph.push(cell);
				cache[cell.id] = cell;
				if (cell.isEdge()) edges.push(cell);
				if (cell.isNode()) nodes.push(cell);
			}
		};
		cells.forEach((cell) => {
			collect(cell);
			if (options.deep) cell.getDescendants({ deep: true }).forEach((descendant) => collect(descendant));
		});
		edges.forEach((edge) => {
			const sourceCell = edge.getSourceCell();
			const targetCell = edge.getTargetCell();
			if (sourceCell && !cache[sourceCell.id]) {
				subgraph.push(sourceCell);
				cache[sourceCell.id] = sourceCell;
				if (sourceCell.isNode()) nodes.push(sourceCell);
			}
			if (targetCell && !cache[targetCell.id]) {
				subgraph.push(targetCell);
				cache[targetCell.id] = targetCell;
				if (targetCell.isNode()) nodes.push(targetCell);
			}
		});
		nodes.forEach((node) => {
			this.getConnectedEdges(node, options).forEach((edge) => {
				const sourceCell = edge.getSourceCell();
				const targetCell = edge.getTargetCell();
				if (!cache[edge.id] && sourceCell && cache[sourceCell.id] && targetCell && cache[targetCell.id]) {
					subgraph.push(edge);
					cache[edge.id] = edge;
				}
			});
		});
		return subgraph;
	}
	/**
	* Clones the whole subgraph (including all the connected links whose
	* source/target is in the subgraph). If `options.deep` is `true`, also
	* take into account all the embedded cells of all the subgraph cells.
	*
	* Returns a map of the form: { [original cell ID]: [clone] }.
	*/
	cloneSubGraph(cells, options = {}) {
		const subgraph = this.getSubGraph(cells, options);
		return this.cloneCells(subgraph);
	}
	cloneCells(cells) {
		return Cell.cloneCells(cells);
	}
	getNodesFromPoint(x, y) {
		const p = typeof x === "number" ? {
			x,
			y: y || 0
		} : x;
		return this.getNodes().filter((node) => {
			return node.getBBox().containsPoint(p);
		});
	}
	getNodesInArea(x, y, w, h, options) {
		const rect = typeof x === "number" ? new Rectangle(x, y, w, h) : Rectangle.create(x);
		const opts = typeof x === "number" ? options : y;
		const strict = opts && opts.strict;
		return this.getNodes().filter((node) => {
			const bbox = node.getBBox();
			return strict ? rect.containsRect(bbox) : rect.isIntersectWithRect(bbox);
		});
	}
	getEdgesInArea(x, y, w, h, options) {
		const rect = typeof x === "number" ? new Rectangle(x, y, w, h) : Rectangle.create(x);
		const opts = typeof x === "number" ? options : y;
		const strict = opts && opts.strict;
		return this.getEdges().filter((edge) => {
			const bbox = edge.getBBox();
			if (bbox.width === 0) bbox.inflate(1, 0);
			else if (bbox.height === 0) bbox.inflate(0, 1);
			return strict ? rect.containsRect(bbox) : rect.isIntersectWithRect(bbox);
		});
	}
	getNodesUnderNode(node, options = {}) {
		const bbox = node.getBBox();
		return (options.by == null || options.by === "bbox" ? this.getNodesInArea(bbox) : this.getNodesFromPoint(bbox[options.by])).filter((curr) => node.id !== curr.id && !curr.isDescendantOf(node));
	}
	/**
	* Returns the bounding box that surrounds all cells in the graph.
	*/
	getAllCellsBBox() {
		return this.getCellsBBox(this.getCells());
	}
	/**
	* Returns the bounding box that surrounds all the given cells.
	*/
	getCellsBBox(cells, options = {}) {
		return Cell.getCellsBBox(cells, options);
	}
	search(cell, iterator, options = {}) {
		if (options.breadthFirst) this.breadthFirstSearch(cell, iterator, options);
		else this.depthFirstSearch(cell, iterator, options);
	}
	breadthFirstSearch(cell, iterator, options = {}) {
		const queue = [];
		const visited = {};
		const distance = {};
		queue.push(cell);
		distance[cell.id] = 0;
		while (queue.length > 0) {
			const next = queue.shift();
			if (next == null || visited[next.id]) continue;
			visited[next.id] = true;
			if (call$1(iterator, this, next, distance[next.id]) === false) continue;
			this.getNeighbors(next, options).forEach((neighbor) => {
				distance[neighbor.id] = distance[next.id] + 1;
				queue.push(neighbor);
			});
		}
	}
	depthFirstSearch(cell, iterator, options = {}) {
		const queue = [];
		const visited = {};
		const distance = {};
		queue.push(cell);
		distance[cell.id] = 0;
		while (queue.length > 0) {
			const next = queue.pop();
			if (next == null || visited[next.id]) continue;
			visited[next.id] = true;
			if (call$1(iterator, this, next, distance[next.id]) === false) continue;
			const neighbors = this.getNeighbors(next, options);
			const lastIndex = queue.length;
			neighbors.forEach((neighbor) => {
				distance[neighbor.id] = distance[next.id] + 1;
				queue.splice(lastIndex, 0, neighbor);
			});
		}
	}
	/** *
	* Returns an array of IDs of nodes on the shortest
	* path between source and target.
	*/
	getShortestPath(source, target, options = {}) {
		const adjacencyList = {};
		this.getEdges().forEach((edge) => {
			const sourceId = edge.getSourceCellId();
			const targetId = edge.getTargetCellId();
			if (sourceId && targetId) {
				if (!adjacencyList[sourceId]) adjacencyList[sourceId] = [];
				if (!adjacencyList[targetId]) adjacencyList[targetId] = [];
				adjacencyList[sourceId].push(targetId);
				if (!options.directed) adjacencyList[targetId].push(sourceId);
			}
		});
		const sourceId = typeof source === "string" ? source : source.id;
		const previous = Dijkstra.run(adjacencyList, sourceId, options.weight);
		const path = [];
		let targetId = typeof target === "string" ? target : target.id;
		if (previous[targetId]) path.push(targetId);
		while (targetId = previous[targetId]) path.unshift(targetId);
		return path;
	}
	/**
	* Translate all cells in the graph by `tx` and `ty` pixels.
	*/
	translate(tx, ty, options) {
		this.getCells().filter((cell) => !cell.hasParent()).forEach((cell) => cell.translate(tx, ty, options));
		return this;
	}
	resize(width, height, options) {
		return this.resizeCells(width, height, this.getCells(), options);
	}
	resizeCells(width, height, cells, options = {}) {
		const bbox = this.getCellsBBox(cells);
		if (bbox) {
			const sx = Math.max(width / bbox.width, 0);
			const sy = Math.max(height / bbox.height, 0);
			const origin = bbox.getOrigin();
			cells.forEach((cell) => cell.scale(sx, sy, origin, options));
		}
		return this;
	}
	toJSON(options = {}) {
		return Model.toJSON(this.getCells(), options);
	}
	parseJSON(data) {
		return Model.fromJSON(data);
	}
	fromJSON(data, options = {}) {
		const cells = this.parseJSON(data);
		this.resetCells(cells, options);
		return this;
	}
	startBatch(name, data = {}) {
		this.batches[name] = (this.batches[name] || 0) + 1;
		this.notify("batch:start", {
			name,
			data
		});
		return this;
	}
	stopBatch(name, data = {}) {
		this.batches[name] = (this.batches[name] || 0) - 1;
		this.notify("batch:stop", {
			name,
			data
		});
		return this;
	}
	batchUpdate(name, execute, data = {}) {
		this.startBatch(name, data);
		const result = execute();
		this.stopBatch(name, data);
		return result;
	}
	hasActiveBatch(name = Object.keys(this.batches)) {
		return (Array.isArray(name) ? name : [name]).some((batch) => this.batches[batch] > 0);
	}
	dispose() {
		this.collection.dispose();
	}
};
__decorate$23([Model.dispose()], Model.prototype, "dispose", null);
(function(Model) {
	Model.toStringTag = `X6.${Model.name}`;
	function isModel(instance) {
		if (instance == null) return false;
		if (instance instanceof Model) return true;
		const tag = instance[Symbol.toStringTag];
		const model = instance;
		if ((tag == null || tag === Model.toStringTag) && typeof model.addNode === "function" && typeof model.addEdge === "function" && model.collection != null) return true;
		return false;
	}
	Model.isModel = isModel;
})(Model || (Model = {}));
(function(Model) {
	function toJSON(cells, options = {}) {
		return { cells: cells.map((cell) => cell.toJSON(options)) };
	}
	Model.toJSON = toJSON;
	function fromJSON(data) {
		const cells = [];
		if (Array.isArray(data)) cells.push(...data);
		else {
			if (data.cells) cells.push(...data.cells);
			if (data.nodes) data.nodes.forEach((node) => {
				if (node.shape == null) node.shape = "rect";
				cells.push(node);
			});
			if (data.edges) data.edges.forEach((edge) => {
				if (edge.shape == null) edge.shape = "edge";
				cells.push(edge);
			});
		}
		return cells.map((cell) => {
			const type = cell.shape;
			if (type) {
				if (Node$1.registry.exist(type)) return Node$1.create(cell);
				if (Edge$1.registry.exist(type)) return Edge$1.create(cell);
			}
			throw new Error("The `shape` should be specified when creating a node/edge instance");
		});
	}
	Model.fromJSON = fromJSON;
})(Model || (Model = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/shape/base.js
var __rest$12 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var Base$1 = class extends Node$1 {
	get label() {
		return this.getLabel();
	}
	set label(val) {
		this.setLabel(val);
	}
	getLabel() {
		return this.getAttrByPath("text/text");
	}
	setLabel(label, options) {
		if (label == null) this.removeLabel();
		else this.setAttrByPath("text/text", label, options);
		return this;
	}
	removeLabel() {
		this.removeAttrByPath("text/text");
		return this;
	}
};
(function(Base) {
	Base.bodyAttr = {
		fill: "#ffffff",
		stroke: "#333333",
		strokeWidth: 2
	};
	Base.labelAttr = {
		fontSize: 14,
		fill: "#000000",
		refX: .5,
		refY: .5,
		textAnchor: "middle",
		textVerticalAnchor: "middle",
		fontFamily: "Arial, helvetica, sans-serif"
	};
	Base.config({
		attrs: { text: Object.assign({}, Base.labelAttr) },
		propHooks(metadata) {
			const { label } = metadata, others = __rest$12(metadata, ["label"]);
			if (label) setByPath(others, "attrs/text/text", label);
			return others;
		},
		visible: true
	});
})(Base$1 || (Base$1 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/shape/util.js
var __rest$11 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
function getMarkup(tagName, selector = "body") {
	return [{
		tagName,
		selector
	}, {
		tagName: "text",
		selector: "label"
	}];
}
function getImageUrlHook(attrName = "xlink:href") {
	const hook = (metadata) => {
		const { imageUrl, imageWidth, imageHeight } = metadata, others = __rest$11(metadata, [
			"imageUrl",
			"imageWidth",
			"imageHeight"
		]);
		if (imageUrl != null || imageWidth != null || imageHeight != null) {
			const apply = () => {
				if (others.attrs) {
					const image = others.attrs.image;
					if (imageUrl != null) image[attrName] = imageUrl;
					if (imageWidth != null) image.width = imageWidth;
					if (imageHeight != null) image.height = imageHeight;
					others.attrs.image = image;
				}
			};
			if (others.attrs) {
				if (others.attrs.image == null) others.attrs.image = {};
				apply();
			} else {
				others.attrs = { image: {} };
				apply();
			}
		}
		return others;
	};
	return hook;
}
function createShape(shape, config, options = {}) {
	const defaults = {
		constructorName: shape,
		markup: getMarkup(shape, options.selector),
		attrs: { [shape]: Object.assign({}, Base$1.bodyAttr) }
	};
	return (options.parent || Base$1).define(merge(defaults, config, { shape }));
}
createShape("rect", { attrs: { body: {
	refWidth: "100%",
	refHeight: "100%"
} } });
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/shape/edge.js
var Edge = Edge$1.define({
	shape: "edge",
	markup: [{
		tagName: "path",
		selector: "wrap",
		groupSelector: "lines",
		attrs: {
			fill: "none",
			cursor: "pointer",
			stroke: "transparent",
			strokeLinecap: "round"
		}
	}, {
		tagName: "path",
		selector: "line",
		groupSelector: "lines",
		attrs: {
			fill: "none",
			pointerEvents: "none"
		}
	}],
	attrs: {
		lines: {
			connection: true,
			strokeLinejoin: "round"
		},
		wrap: { strokeWidth: 10 },
		line: {
			stroke: "#333",
			strokeWidth: 2,
			targetMarker: "classic"
		}
	}
});
createShape("ellipse", { attrs: { body: {
	refCx: "50%",
	refCy: "50%",
	refRx: "50%",
	refRy: "50%"
} } });
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/shape/poly.js
var __rest$10 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var Poly = class Poly extends Base$1 {
	get points() {
		return this.getPoints();
	}
	set points(pts) {
		this.setPoints(pts);
	}
	getPoints() {
		return this.getAttrByPath("body/refPoints");
	}
	setPoints(points, options) {
		if (points == null) this.removePoints();
		else this.setAttrByPath("body/refPoints", Poly.pointsToString(points), options);
		return this;
	}
	removePoints() {
		this.removeAttrByPath("body/refPoints");
		return this;
	}
};
(function(Poly) {
	function pointsToString(points) {
		return typeof points === "string" ? points : points.map((p) => {
			if (Array.isArray(p)) return p.join(",");
			if (Point.isPointLike(p)) return `${p.x}, ${p.y}`;
			return "";
		}).join(" ");
	}
	Poly.pointsToString = pointsToString;
	Poly.config({ propHooks(metadata) {
		const { points } = metadata, others = __rest$10(metadata, ["points"]);
		if (points) {
			const data = pointsToString(points);
			if (data) setByPath(others, "attrs/body/refPoints", data);
		}
		return others;
	} });
})(Poly || (Poly = {}));
createShape("polygon", {}, { parent: Poly });
createShape("polyline", {}, { parent: Poly });
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/shape/path.js
var __rest$9 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
Base$1.define({
	shape: "path",
	markup: [
		{
			tagName: "rect",
			selector: "bg"
		},
		{
			tagName: "path",
			selector: "body"
		},
		{
			tagName: "text",
			selector: "label"
		}
	],
	attrs: {
		bg: {
			refWidth: "100%",
			refHeight: "100%",
			fill: "none",
			stroke: "none",
			pointerEvents: "all"
		},
		body: {
			fill: "none",
			stroke: "#000",
			strokeWidth: 2
		}
	},
	propHooks(metadata) {
		const { path } = metadata, others = __rest$9(metadata, ["path"]);
		if (path) setByPath(others, "attrs/body/refD", path);
		return others;
	}
});
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/shape/text-block.js
var __rest$8 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
Base$1.define({
	shape: "text-block",
	markup: [{
		tagName: "rect",
		selector: "body"
	}, Platform.SUPPORT_FOREIGNOBJECT ? {
		tagName: "foreignObject",
		selector: "foreignObject",
		children: [{
			tagName: "div",
			ns: ns.xhtml,
			selector: "label",
			style: {
				width: "100%",
				height: "100%",
				position: "static",
				backgroundColor: "transparent",
				textAlign: "center",
				margin: 0,
				padding: "0px 5px",
				boxSizing: "border-box",
				display: "flex",
				alignItems: "center",
				justifyContent: "center"
			}
		}]
	} : {
		tagName: "text",
		selector: "label",
		attrs: { textAnchor: "middle" }
	}],
	attrs: {
		body: Object.assign(Object.assign({}, Base$1.bodyAttr), {
			refWidth: "100%",
			refHeight: "100%"
		}),
		foreignObject: {
			refWidth: "100%",
			refHeight: "100%"
		},
		label: { style: { fontSize: 14 } }
	},
	propHooks(metadata) {
		const { text } = metadata, others = __rest$8(metadata, ["text"]);
		if (text) setByPath(others, "attrs/label/text", text);
		return others;
	},
	attrHooks: { text: {
		set(text, { cell, view, refBBox, elem, attrs }) {
			if (elem instanceof HTMLElement) elem.textContent = text;
			else {
				const style = attrs.style || {};
				const wrapValue = {
					text,
					width: -5,
					height: "100%"
				};
				const wrapAttrs = Object.assign({ textVerticalAnchor: "middle" }, style);
				const textWrap = Attr.presets.textWrap;
				call$1(textWrap.set, this, wrapValue, {
					cell,
					view,
					elem,
					refBBox,
					attrs: wrapAttrs
				});
				return { fill: style.color || null };
			}
		},
		position(text, { refBBox, elem }) {
			if (elem instanceof SVGElement) return refBBox.getCenter();
		}
	} }
});
createShape("image", {
	attrs: { image: {
		refWidth: "100%",
		refHeight: "100%"
	} },
	propHooks: getImageUrlHook()
}, { selector: "image" });
createShape("circle", { attrs: { body: {
	refCx: "50%",
	refCy: "50%",
	refR: "50%"
} } });
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/view/node.js
var NodeView = class NodeView extends CellView {
	constructor() {
		super(...arguments);
		this.portsCache = {};
	}
	get [Symbol.toStringTag]() {
		return NodeView.toStringTag;
	}
	getContainerClassName() {
		const classList = [super.getContainerClassName(), this.prefixClassName("node")];
		if (!this.can("nodeMovable")) classList.push(this.prefixClassName("node-immovable"));
		return classList.join(" ");
	}
	updateClassName(e) {
		const target = e.target;
		if (target.hasAttribute("magnet")) {
			const className = this.prefixClassName("port-unconnectable");
			if (this.can("magnetConnectable")) removeClass(target, className);
			else addClass(target, className);
		} else {
			const className = this.prefixClassName("node-immovable");
			if (this.can("nodeMovable")) this.removeClass(className);
			else this.addClass(className);
		}
	}
	isNodeView() {
		return true;
	}
	confirmUpdate(flag, options = {}) {
		let ret = flag;
		if (this.hasAction(ret, "ports")) {
			this.removePorts();
			this.cleanPortsCache();
		}
		if (this.hasAction(ret, "render")) {
			this.render();
			ret = this.removeAction(ret, [
				"render",
				"update",
				"resize",
				"translate",
				"rotate",
				"ports",
				"tools"
			]);
		} else {
			ret = this.handleAction(ret, "resize", () => this.resize(), "update");
			ret = this.handleAction(ret, "update", () => this.update(), Config.useCSSSelector ? "ports" : null);
			ret = this.handleAction(ret, "translate", () => this.translate());
			ret = this.handleAction(ret, "rotate", () => this.rotate());
			ret = this.handleAction(ret, "ports", () => this.renderPorts());
			ret = this.handleAction(ret, "tools", () => {
				if (this.getFlag("tools") === flag) this.renderTools();
				else this.updateTools(options);
			});
		}
		return ret;
	}
	update(partialAttrs) {
		this.cleanCache();
		if (Config.useCSSSelector) this.removePorts();
		const node = this.cell;
		const size = node.getSize();
		const attrs = node.getAttrs();
		this.updateAttrs(this.container, attrs, {
			attrs: partialAttrs === attrs ? null : partialAttrs,
			rootBBox: new Rectangle(0, 0, size.width, size.height),
			selectors: this.selectors
		});
		if (Config.useCSSSelector) this.renderPorts();
	}
	renderMarkup() {
		const markup = this.cell.markup;
		if (markup) {
			if (typeof markup === "string") throw new TypeError("Not support string markup.");
			return this.renderJSONMarkup(markup);
		}
		throw new TypeError("Invalid node markup.");
	}
	renderJSONMarkup(markup) {
		const ret = this.parseJSONMarkup(markup, this.container);
		this.selectors = ret.selectors;
		this.container.appendChild(ret.fragment);
	}
	render() {
		this.empty();
		this.renderMarkup();
		this.resize();
		this.updateTransform();
		if (!Config.useCSSSelector) this.renderPorts();
		this.renderTools();
		return this;
	}
	resize() {
		if (this.cell.getAngle()) this.rotate();
		this.update();
	}
	translate() {
		this.updateTransform();
	}
	rotate() {
		this.updateTransform();
	}
	getTranslationString() {
		const position = this.cell.getPosition();
		return `translate(${position.x},${position.y})`;
	}
	getRotationString() {
		const angle = this.cell.getAngle();
		if (angle) {
			const size = this.cell.getSize();
			return `rotate(${angle},${size.width / 2},${size.height / 2})`;
		}
	}
	updateTransform() {
		let transform = this.getTranslationString();
		const rot = this.getRotationString();
		if (rot) transform += ` ${rot}`;
		this.container.setAttribute("transform", transform);
	}
	findPortElem(portId, selector) {
		const cache = portId ? this.portsCache[portId] : null;
		if (!cache) return null;
		const portRoot = cache.portContentElement;
		const portSelectors = cache.portContentSelectors || {};
		return this.findOne(selector, portRoot, portSelectors);
	}
	cleanPortsCache() {
		this.portsCache = {};
	}
	removePorts() {
		Object.values(this.portsCache).forEach((cached) => {
			remove(cached.portElement);
		});
	}
	renderPorts() {
		const container = this.container;
		const references = [];
		container.childNodes.forEach((child) => {
			references.push(child);
		});
		const portsGropsByZ = groupBy(this.cell.getParsedPorts(), "zIndex");
		const autoZIndexKey = "auto";
		if (portsGropsByZ[autoZIndexKey]) portsGropsByZ[autoZIndexKey].forEach((port) => {
			const portElement = this.getPortElement(port);
			container.append(portElement);
			references.push(portElement);
		});
		Object.keys(portsGropsByZ).forEach((key) => {
			if (key !== autoZIndexKey) {
				const zIndex = parseInt(key, 10);
				this.appendPorts(portsGropsByZ[key], zIndex, references);
			}
		});
		this.updatePorts();
	}
	appendPorts(ports, zIndex, refs) {
		const elems = ports.map((p) => this.getPortElement(p));
		if (refs[zIndex] || zIndex < 0) before(refs[Math.max(zIndex, 0)], elems);
		else append(this.container, elems);
	}
	getPortElement(port) {
		const cached = this.portsCache[port.id];
		if (cached) return cached.portElement;
		return this.createPortElement(port);
	}
	createPortElement(port) {
		let renderResult = Markup.renderMarkup(this.cell.getPortContainerMarkup());
		const portElement = renderResult.elem;
		if (portElement == null) throw new Error("Invalid port container markup.");
		renderResult = Markup.renderMarkup(this.getPortMarkup(port));
		const portContentElement = renderResult.elem;
		const portContentSelectors = renderResult.selectors;
		if (portContentElement == null) throw new Error("Invalid port markup.");
		this.setAttrs({
			port: port.id,
			"port-group": port.group
		}, portContentElement);
		let portClass = "x6-port";
		if (port.group) portClass += ` x6-port-${port.group}`;
		addClass(portElement, portClass);
		addClass(portElement, "x6-port");
		addClass(portContentElement, "x6-port-body");
		portElement.appendChild(portContentElement);
		let portSelectors = portContentSelectors;
		let portLabelElement;
		let portLabelSelectors;
		if (this.existPortLabel(port)) {
			renderResult = Markup.renderMarkup(this.getPortLabelMarkup(port.label));
			portLabelElement = renderResult.elem;
			portLabelSelectors = renderResult.selectors;
			if (portLabelElement == null) throw new Error("Invalid port label markup.");
			if (portContentSelectors && portLabelSelectors) {
				for (const key in portLabelSelectors) if (portContentSelectors[key] && key !== this.rootSelector) throw new Error("Selectors within port must be unique.");
				portSelectors = Object.assign(Object.assign({}, portContentSelectors), portLabelSelectors);
			}
			addClass(portLabelElement, "x6-port-label");
			portElement.appendChild(portLabelElement);
		}
		this.portsCache[port.id] = {
			portElement,
			portSelectors,
			portLabelElement,
			portLabelSelectors,
			portContentElement,
			portContentSelectors
		};
		if (this.graph.options.onPortRendered) this.graph.options.onPortRendered({
			port,
			node: this.cell,
			container: portElement,
			selectors: portSelectors,
			labelContainer: portLabelElement,
			labelSelectors: portLabelSelectors,
			contentContainer: portContentElement,
			contentSelectors: portContentSelectors
		});
		return portElement;
	}
	updatePorts() {
		const groups = this.cell.getParsedGroups();
		const groupList = Object.keys(groups);
		if (groupList.length === 0) this.updatePortGroup();
		else groupList.forEach((groupName) => this.updatePortGroup(groupName));
	}
	updatePortGroup(groupName) {
		const bbox = Rectangle.fromSize(this.cell.getSize());
		const metrics = this.cell.getPortsLayoutByGroup(groupName, bbox);
		for (let i = 0, n = metrics.length; i < n; i += 1) {
			const metric = metrics[i];
			const portId = metric.portId;
			const cached = this.portsCache[portId] || {};
			const portLayout = metric.portLayout;
			this.applyPortTransform(cached.portElement, portLayout);
			if (metric.portAttrs != null) {
				const options = { selectors: cached.portSelectors || {} };
				if (metric.portSize) options.rootBBox = Rectangle.fromSize(metric.portSize);
				this.updateAttrs(cached.portElement, metric.portAttrs, options);
			}
			const labelLayout = metric.labelLayout;
			if (labelLayout && cached.portLabelElement) {
				this.applyPortTransform(cached.portLabelElement, labelLayout, -(portLayout.angle || 0));
				if (labelLayout.attrs) {
					const options = { selectors: cached.portLabelSelectors || {} };
					if (metric.labelSize) options.rootBBox = Rectangle.fromSize(metric.labelSize);
					this.updateAttrs(cached.portLabelElement, labelLayout.attrs, options);
				}
			}
		}
	}
	applyPortTransform(element, layout, initialAngle = 0) {
		const angle = layout.angle;
		const position = layout.position;
		transform(element, createSVGMatrix().rotate(initialAngle).translate(position.x || 0, position.y || 0).rotate(angle || 0), { absolute: true });
	}
	getPortMarkup(port) {
		return port.markup || this.cell.portMarkup;
	}
	getPortLabelMarkup(label) {
		return label.markup || this.cell.portLabelMarkup;
	}
	existPortLabel(port) {
		return port.attrs && port.attrs.text;
	}
	getEventArgs(e, x, y) {
		const view = this;
		const node = view.cell;
		const cell = node;
		if (x == null || y == null) return {
			e,
			view,
			node,
			cell
		};
		return {
			e,
			x,
			y,
			view,
			node,
			cell
		};
	}
	getPortEventArgs(e, port, pos) {
		const view = this;
		const node = view.cell;
		const cell = node;
		if (pos) return {
			e,
			x: pos.x,
			y: pos.y,
			view,
			node,
			cell,
			port
		};
		return {
			e,
			view,
			node,
			cell,
			port
		};
	}
	notifyMouseDown(e, x, y) {
		super.onMouseDown(e, x, y);
		this.notify("node:mousedown", this.getEventArgs(e, x, y));
	}
	notifyMouseMove(e, x, y) {
		super.onMouseMove(e, x, y);
		this.notify("node:mousemove", this.getEventArgs(e, x, y));
	}
	notifyMouseUp(e, x, y) {
		super.onMouseUp(e, x, y);
		this.notify("node:mouseup", this.getEventArgs(e, x, y));
	}
	notifyPortEvent(name, e, pos) {
		const port = this.findAttr("port", e.target);
		if (port) {
			const originType = e.type;
			if (name === "node:port:mouseenter") e.type = "mouseenter";
			else if (name === "node:port:mouseleave") e.type = "mouseleave";
			this.notify(name, this.getPortEventArgs(e, port, pos));
			e.type = originType;
		}
	}
	onClick(e, x, y) {
		super.onClick(e, x, y);
		this.notify("node:click", this.getEventArgs(e, x, y));
		this.notifyPortEvent("node:port:click", e, {
			x,
			y
		});
	}
	onDblClick(e, x, y) {
		super.onDblClick(e, x, y);
		this.notify("node:dblclick", this.getEventArgs(e, x, y));
		this.notifyPortEvent("node:port:dblclick", e, {
			x,
			y
		});
	}
	onContextMenu(e, x, y) {
		super.onContextMenu(e, x, y);
		this.notify("node:contextmenu", this.getEventArgs(e, x, y));
		this.notifyPortEvent("node:port:contextmenu", e, {
			x,
			y
		});
	}
	onMouseDown(e, x, y) {
		if (this.isPropagationStopped(e)) return;
		this.notifyMouseDown(e, x, y);
		this.notifyPortEvent("node:port:mousedown", e, {
			x,
			y
		});
		this.startNodeDragging(e, x, y);
	}
	onMouseMove(e, x, y) {
		const data = this.getEventData(e);
		const action = data.action;
		if (action === "magnet") this.dragMagnet(e, x, y);
		else {
			if (action === "move") {
				const view = data.targetView || this;
				view.dragNode(e, x, y);
				view.notify("node:moving", {
					e,
					x,
					y,
					view,
					cell: view.cell,
					node: view.cell
				});
			}
			this.notifyMouseMove(e, x, y);
			this.notifyPortEvent("node:port:mousemove", e, {
				x,
				y
			});
		}
		this.setEventData(e, data);
	}
	onMouseUp(e, x, y) {
		const data = this.getEventData(e);
		const action = data.action;
		if (action === "magnet") this.stopMagnetDragging(e, x, y);
		else {
			this.notifyMouseUp(e, x, y);
			this.notifyPortEvent("node:port:mouseup", e, {
				x,
				y
			});
			if (action === "move") (data.targetView || this).stopNodeDragging(e, x, y);
		}
		const magnet = data.targetMagnet;
		if (magnet) this.onMagnetClick(e, magnet, x, y);
		this.checkMouseleave(e);
	}
	onMouseOver(e) {
		super.onMouseOver(e);
		this.notify("node:mouseover", this.getEventArgs(e));
		this.notifyPortEvent("node:port:mouseenter", e);
		this.notifyPortEvent("node:port:mouseover", e);
	}
	onMouseOut(e) {
		super.onMouseOut(e);
		this.notify("node:mouseout", this.getEventArgs(e));
		this.notifyPortEvent("node:port:mouseleave", e);
		this.notifyPortEvent("node:port:mouseout", e);
	}
	onMouseEnter(e) {
		this.updateClassName(e);
		super.onMouseEnter(e);
		this.notify("node:mouseenter", this.getEventArgs(e));
	}
	onMouseLeave(e) {
		super.onMouseLeave(e);
		this.notify("node:mouseleave", this.getEventArgs(e));
	}
	onMouseWheel(e, x, y, delta) {
		super.onMouseWheel(e, x, y, delta);
		this.notify("node:mousewheel", Object.assign({ delta }, this.getEventArgs(e, x, y)));
	}
	onMagnetClick(e, magnet, x, y) {
		const graph = this.graph;
		if (graph.view.getMouseMovedCount(e) > graph.options.clickThreshold) return;
		this.notify("node:magnet:click", Object.assign({ magnet }, this.getEventArgs(e, x, y)));
	}
	onMagnetDblClick(e, magnet, x, y) {
		this.notify("node:magnet:dblclick", Object.assign({ magnet }, this.getEventArgs(e, x, y)));
	}
	onMagnetContextMenu(e, magnet, x, y) {
		this.notify("node:magnet:contextmenu", Object.assign({ magnet }, this.getEventArgs(e, x, y)));
	}
	onMagnetMouseDown(e, magnet, x, y) {
		this.startMagnetDragging(e, x, y);
	}
	onCustomEvent(e, name, x, y) {
		this.notify("node:customevent", Object.assign({ name }, this.getEventArgs(e, x, y)));
		super.onCustomEvent(e, name, x, y);
	}
	prepareEmbedding(e) {
		const graph = this.graph;
		const node = this.getEventData(e).cell || this.cell;
		const view = graph.findViewByCell(node);
		const localPoint = graph.snapToGrid(e.clientX, e.clientY);
		this.notify("node:embed", {
			e,
			node,
			view,
			cell: node,
			x: localPoint.x,
			y: localPoint.y,
			currentParent: node.getParent()
		});
	}
	processEmbedding(e, data) {
		const cell = data.cell || this.cell;
		const graph = data.graph || this.graph;
		const options = graph.options.embedding;
		const findParent = options.findParent;
		let candidates = typeof findParent === "function" ? call$1(findParent, graph, {
			view: this,
			node: this.cell
		}).filter((c) => {
			return Cell.isCell(c) && this.cell.id !== c.id && !c.isDescendantOf(this.cell);
		}) : graph.model.getNodesUnderNode(cell, { by: findParent });
		if (options.frontOnly) {
			if (candidates.length > 0) {
				const zIndexMap = groupBy(candidates, "zIndex");
				const maxZIndex = max(Object.keys(zIndexMap).map((z) => parseInt(z, 10)));
				if (maxZIndex) candidates = zIndexMap[maxZIndex];
			}
		}
		candidates = candidates.filter((candidate) => candidate.visible);
		let newCandidateView = null;
		const prevCandidateView = data.candidateEmbedView;
		const validateEmbeding = options.validate;
		for (let i = candidates.length - 1; i >= 0; i -= 1) {
			const candidate = candidates[i];
			if (prevCandidateView && prevCandidateView.cell.id === candidate.id) {
				newCandidateView = prevCandidateView;
				break;
			} else {
				const view = candidate.findView(graph);
				if (validateEmbeding && call$1(validateEmbeding, graph, {
					child: this.cell,
					parent: view.cell,
					childView: this,
					parentView: view
				})) {
					newCandidateView = view;
					break;
				}
			}
		}
		this.clearEmbedding(data);
		if (newCandidateView) newCandidateView.highlight(null, { type: "embedding" });
		data.candidateEmbedView = newCandidateView;
		const localPoint = graph.snapToGrid(e.clientX, e.clientY);
		this.notify("node:embedding", {
			e,
			cell,
			node: cell,
			view: graph.findViewByCell(cell),
			x: localPoint.x,
			y: localPoint.y,
			currentParent: cell.getParent(),
			candidateParent: newCandidateView ? newCandidateView.cell : null
		});
	}
	clearEmbedding(data) {
		const candidateView = data.candidateEmbedView;
		if (candidateView) {
			candidateView.unhighlight(null, { type: "embedding" });
			data.candidateEmbedView = null;
		}
	}
	finalizeEmbedding(e, data) {
		this.graph.startBatch("embedding");
		const cell = data.cell || this.cell;
		const graph = data.graph || this.graph;
		const view = graph.findViewByCell(cell);
		const parent = cell.getParent();
		const candidateView = data.candidateEmbedView;
		if (candidateView) {
			candidateView.unhighlight(null, { type: "embedding" });
			data.candidateEmbedView = null;
			if (parent == null || parent.id !== candidateView.cell.id) candidateView.cell.insertChild(cell, void 0, { ui: true });
		} else if (parent) parent.unembed(cell, { ui: true });
		graph.model.getConnectedEdges(cell, { deep: true }).forEach((edge) => {
			edge.updateParent({ ui: true });
		});
		if (view && candidateView) {
			const localPoint = graph.snapToGrid(e.clientX, e.clientY);
			view.notify("node:embedded", {
				e,
				cell,
				x: localPoint.x,
				y: localPoint.y,
				node: cell,
				view: graph.findViewByCell(cell),
				previousParent: parent,
				currentParent: cell.getParent()
			});
		}
		this.graph.stopBatch("embedding");
	}
	getDelegatedView() {
		let cell = this.cell;
		let view = this;
		while (view) {
			if (cell.isEdge()) break;
			if (!cell.hasParent() || view.can("stopDelegateOnDragging")) return view;
			cell = cell.getParent();
			view = this.graph.findViewByCell(cell);
		}
		return null;
	}
	validateMagnet(cellView, magnet, e) {
		if (magnet.getAttribute("magnet") !== "passive") {
			const validate = this.graph.options.connecting.validateMagnet;
			if (validate) return call$1(validate, this.graph, {
				e,
				magnet,
				view: cellView,
				cell: cellView.cell
			});
			return true;
		}
		return false;
	}
	startMagnetDragging(e, x, y) {
		if (!this.can("magnetConnectable")) return;
		e.stopPropagation();
		const magnet = e.currentTarget;
		const graph = this.graph;
		this.setEventData(e, { targetMagnet: magnet });
		if (this.validateMagnet(this, magnet, e)) {
			if (graph.options.magnetThreshold <= 0) this.startConnectting(e, magnet, x, y);
			this.setEventData(e, { action: "magnet" });
			this.stopPropagation(e);
		} else this.onMouseDown(e, x, y);
		graph.view.delegateDragEvents(e, this);
	}
	startConnectting(e, magnet, x, y) {
		this.graph.model.startBatch("add-edge");
		const edgeView = this.createEdgeFromMagnet(magnet, x, y);
		edgeView.setEventData(e, edgeView.prepareArrowheadDragging("target", {
			x,
			y,
			isNewEdge: true,
			fallbackAction: "remove"
		}));
		this.setEventData(e, { edgeView });
		edgeView.notifyMouseDown(e, x, y);
	}
	getDefaultEdge(sourceView, sourceMagnet) {
		let edge;
		const create = this.graph.options.connecting.createEdge;
		if (create) edge = call$1(create, this.graph, {
			sourceMagnet,
			sourceView,
			sourceCell: sourceView.cell
		});
		return edge;
	}
	createEdgeFromMagnet(magnet, x, y) {
		const graph = this.graph;
		const model = graph.model;
		const edge = this.getDefaultEdge(this, magnet);
		edge.setSource(Object.assign(Object.assign({}, edge.getSource()), this.getEdgeTerminal(magnet, x, y, edge, "source")));
		edge.setTarget(Object.assign(Object.assign({}, edge.getTarget()), {
			x,
			y
		}));
		edge.addTo(model, {
			async: false,
			ui: true
		});
		return edge.findView(graph);
	}
	dragMagnet(e, x, y) {
		const data = this.getEventData(e);
		const edgeView = data.edgeView;
		if (edgeView) {
			edgeView.onMouseMove(e, x, y);
			this.autoScrollGraph(e.clientX, e.clientY);
		} else {
			const graph = this.graph;
			const magnetThreshold = graph.options.magnetThreshold;
			const currentTarget = this.getEventTarget(e);
			const targetMagnet = data.targetMagnet;
			if (magnetThreshold === "onleave") {
				if (targetMagnet === currentTarget || targetMagnet.contains(currentTarget)) return;
			} else if (graph.view.getMouseMovedCount(e) <= magnetThreshold) return;
			this.startConnectting(e, targetMagnet, x, y);
		}
	}
	stopMagnetDragging(e, x, y) {
		const edgeView = this.eventData(e).edgeView;
		if (edgeView) {
			edgeView.onMouseUp(e, x, y);
			this.graph.model.stopBatch("add-edge");
		}
	}
	notifyUnhandledMouseDown(e, x, y) {
		this.notify("node:unhandled:mousedown", {
			e,
			x,
			y,
			view: this,
			cell: this.cell,
			node: this.cell
		});
	}
	notifyNodeMove(name, e, x, y, cell) {
		let cells = [cell];
		const selection = this.graph.getPlugin("selection");
		if (selection && selection.isSelectionMovable()) {
			const selectedCells = selection.getSelectedCells();
			if (selectedCells.includes(cell)) cells = selectedCells.filter((c) => c.isNode());
		}
		cells.forEach((c) => {
			this.notify(name, {
				e,
				x,
				y,
				cell: c,
				node: c,
				view: c.findView(this.graph)
			});
		});
	}
	getRestrictArea(view) {
		const restrict = this.graph.options.translating.restrict;
		const area = typeof restrict === "function" ? call$1(restrict, this.graph, view) : restrict;
		if (typeof area === "number") return this.graph.transform.getGraphArea().inflate(area);
		if (area === true) return this.graph.transform.getGraphArea();
		return area || null;
	}
	startNodeDragging(e, x, y) {
		const targetView = this.getDelegatedView();
		if (targetView == null || !targetView.can("nodeMovable")) return this.notifyUnhandledMouseDown(e, x, y);
		this.setEventData(e, {
			targetView,
			action: "move"
		});
		const position = Point.create(targetView.cell.getPosition());
		targetView.setEventData(e, {
			moving: false,
			offset: position.diff(x, y),
			restrict: this.getRestrictArea(targetView)
		});
	}
	dragNode(e, x, y) {
		const node = this.cell;
		const graph = this.graph;
		const gridSize = graph.getGridSize();
		const data = this.getEventData(e);
		const offset = data.offset;
		const restrict = data.restrict;
		if (!data.moving) {
			data.moving = true;
			this.addClass("node-moving");
			this.notifyNodeMove("node:move", e, x, y, this.cell);
		}
		this.autoScrollGraph(e.clientX, e.clientY);
		const posX = GeometryUtil.snapToGrid(x + offset.x, gridSize);
		const posY = GeometryUtil.snapToGrid(y + offset.y, gridSize);
		node.setPosition(posX, posY, {
			restrict,
			deep: true,
			ui: true
		});
		if (graph.options.embedding.enabled) {
			if (!data.embedding) {
				this.prepareEmbedding(e);
				data.embedding = true;
			}
			this.processEmbedding(e, data);
		}
	}
	autoOffsetNode() {
		const node = this.cell;
		const graph = this.graph;
		const nodePosition = Object.assign({ id: node.id }, node.getPosition());
		const restNodePositions = graph.getNodes().map((node) => {
			const pos = node.getPosition();
			return {
				id: node.id,
				x: pos.x,
				y: pos.y
			};
		}).filter((pos) => {
			return pos.id !== nodePosition.id;
		});
		/** offset directions: right bottom, right top, left bottom, left top */
		const directions = [
			[1, 1],
			[1, -1],
			[-1, 1],
			[-1, -1]
		];
		let step = graph.getGridSize();
		const hasSamePosition = (position) => restNodePositions.some((pos) => {
			return pos.x === position.x && pos.y === position.y;
		});
		while (hasSamePosition(nodePosition)) {
			let found = false;
			for (let i = 0; i < directions.length; i += 1) {
				const dir = directions[i];
				if (!hasSamePosition({
					x: nodePosition.x + dir[0] * step,
					y: nodePosition.y + dir[1] * step
				})) {
					node.translate(dir[0] * step, dir[1] * step);
					found = true;
					break;
				}
			}
			if (found) break;
			step += graph.getGridSize();
		}
	}
	stopNodeDragging(e, x, y) {
		const data = this.getEventData(e);
		const graph = this.graph;
		if (data.embedding) this.finalizeEmbedding(e, data);
		if (data.moving) {
			if (graph.options.translating.autoOffset) this.autoOffsetNode();
			this.removeClass("node-moving");
			this.notifyNodeMove("node:moved", e, x, y, this.cell);
		}
		data.moving = false;
		data.embedding = false;
	}
	autoScrollGraph(x, y) {
		const scroller = this.graph.getPlugin("scroller");
		if (scroller) scroller.autoScroll(x, y);
	}
};
(function(NodeView) {
	NodeView.toStringTag = `X6.${NodeView.name}`;
	function isNodeView(instance) {
		if (instance == null) return false;
		if (instance instanceof NodeView) return true;
		const tag = instance[Symbol.toStringTag];
		const view = instance;
		if ((tag == null || tag === NodeView.toStringTag) && typeof view.isNodeView === "function" && typeof view.isEdgeView === "function" && typeof view.confirmUpdate === "function" && typeof view.update === "function" && typeof view.findPortElem === "function" && typeof view.resize === "function" && typeof view.rotate === "function" && typeof view.translate === "function") return true;
		return false;
	}
	NodeView.isNodeView = isNodeView;
})(NodeView || (NodeView = {}));
NodeView.config({
	isSvgElement: true,
	priority: 0,
	bootstrap: ["render"],
	actions: {
		view: ["render"],
		markup: ["render"],
		attrs: ["update"],
		size: [
			"resize",
			"ports",
			"tools"
		],
		angle: ["rotate", "tools"],
		position: ["translate", "tools"],
		ports: ["ports"],
		tools: ["tools"]
	}
});
NodeView.registry.register("node", NodeView, true);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/view/edge.js
var __rest$7 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var EdgeView = class EdgeView extends CellView {
	constructor() {
		super(...arguments);
		this.POINT_ROUNDING = 2;
		this.labelDestroyFn = {};
	}
	get [Symbol.toStringTag]() {
		return EdgeView.toStringTag;
	}
	getContainerClassName() {
		return [super.getContainerClassName(), this.prefixClassName("edge")].join(" ");
	}
	get sourceBBox() {
		const sourceView = this.sourceView;
		if (!sourceView) {
			const sourceDef = this.cell.getSource();
			return new Rectangle(sourceDef.x, sourceDef.y);
		}
		const sourceMagnet = this.sourceMagnet;
		if (sourceView.isEdgeElement(sourceMagnet)) return new Rectangle(this.sourceAnchor.x, this.sourceAnchor.y);
		return sourceView.getBBoxOfElement(sourceMagnet || sourceView.container);
	}
	get targetBBox() {
		const targetView = this.targetView;
		if (!targetView) {
			const targetDef = this.cell.getTarget();
			return new Rectangle(targetDef.x, targetDef.y);
		}
		const targetMagnet = this.targetMagnet;
		if (targetView.isEdgeElement(targetMagnet)) return new Rectangle(this.targetAnchor.x, this.targetAnchor.y);
		return targetView.getBBoxOfElement(targetMagnet || targetView.container);
	}
	isEdgeView() {
		return true;
	}
	confirmUpdate(flag, options = {}) {
		let ref = flag;
		if (this.hasAction(ref, "source")) {
			if (!this.updateTerminalProperties("source")) return ref;
			ref = this.removeAction(ref, "source");
		}
		if (this.hasAction(ref, "target")) {
			if (!this.updateTerminalProperties("target")) return ref;
			ref = this.removeAction(ref, "target");
		}
		if (this.hasAction(ref, "render")) {
			this.render();
			ref = this.removeAction(ref, [
				"render",
				"update",
				"labels",
				"tools"
			]);
			return ref;
		}
		ref = this.handleAction(ref, "update", () => this.update(options));
		ref = this.handleAction(ref, "labels", () => this.onLabelsChange(options));
		ref = this.handleAction(ref, "tools", () => this.renderTools());
		return ref;
	}
	render() {
		this.empty();
		this.renderMarkup();
		this.labelContainer = null;
		this.renderLabels();
		this.update();
		this.renderTools();
		return this;
	}
	renderMarkup() {
		const markup = this.cell.markup;
		if (markup) {
			if (typeof markup === "string") throw new TypeError("Not support string markup.");
			return this.renderJSONMarkup(markup);
		}
		throw new TypeError("Invalid edge markup.");
	}
	renderJSONMarkup(markup) {
		const ret = this.parseJSONMarkup(markup, this.container);
		this.selectors = ret.selectors;
		this.container.append(ret.fragment);
	}
	customizeLabels() {
		if (this.labelContainer) {
			const edge = this.cell;
			const labels = edge.labels;
			for (let i = 0, n = labels.length; i < n; i += 1) {
				const label = labels[i];
				const container = this.labelCache[i];
				const selectors = this.labelSelectors[i];
				const onEdgeLabelRendered = this.graph.options.onEdgeLabelRendered;
				if (onEdgeLabelRendered) {
					const fn = onEdgeLabelRendered({
						edge,
						label,
						container,
						selectors
					});
					if (fn) this.labelDestroyFn[i] = fn;
				}
			}
		}
	}
	destroyCustomizeLabels() {
		const labels = this.cell.labels;
		if (this.labelCache && this.labelSelectors && this.labelDestroyFn) for (let i = 0, n = labels.length; i < n; i += 1) {
			const fn = this.labelDestroyFn[i];
			const container = this.labelCache[i];
			const selectors = this.labelSelectors[i];
			if (fn && container && selectors) fn({
				edge: this.cell,
				label: labels[i],
				container,
				selectors
			});
		}
		this.labelDestroyFn = {};
	}
	renderLabels() {
		const edge = this.cell;
		const labels = edge.getLabels();
		const count = labels.length;
		let container = this.labelContainer;
		this.labelCache = {};
		this.labelSelectors = {};
		if (count <= 0) {
			if (container && container.parentNode) container.parentNode.removeChild(container);
			return this;
		}
		if (container) this.empty(container);
		else {
			container = createSvgElement("g");
			this.addClass(this.prefixClassName("edge-labels"), container);
			this.labelContainer = container;
		}
		for (let i = 0, ii = labels.length; i < ii; i += 1) {
			const label = labels[i];
			const normalized = this.normalizeLabelMarkup(this.parseLabelMarkup(label.markup));
			let labelNode;
			let selectors;
			if (normalized) {
				labelNode = normalized.node;
				selectors = normalized.selectors;
			} else {
				const defaultLabel = edge.getDefaultLabel();
				const normalized = this.normalizeLabelMarkup(this.parseLabelMarkup(defaultLabel.markup));
				labelNode = normalized.node;
				selectors = normalized.selectors;
			}
			labelNode.setAttribute("data-index", `${i}`);
			container.appendChild(labelNode);
			const rootSelector = this.rootSelector;
			if (selectors[rootSelector]) throw new Error("Ambiguous label root selector.");
			selectors[rootSelector] = labelNode;
			this.labelCache[i] = labelNode;
			this.labelSelectors[i] = selectors;
		}
		if (container.parentNode == null) this.container.appendChild(container);
		this.updateLabels();
		this.customizeLabels();
		return this;
	}
	onLabelsChange(options = {}) {
		this.destroyCustomizeLabels();
		if (this.shouldRerenderLabels(options)) this.renderLabels();
		else this.updateLabels();
		this.updateLabelPositions();
	}
	shouldRerenderLabels(options = {}) {
		const previousLabels = this.cell.previous("labels");
		if (previousLabels == null) return true;
		if ("propertyPathArray" in options && "propertyValue" in options) {
			const pathArray = options.propertyPathArray || [];
			const pathLength = pathArray.length;
			if (pathLength > 1) {
				if (previousLabels[pathArray[1]]) {
					if (pathLength === 2) return typeof options.propertyValue === "object" && has(options.propertyValue, "markup");
					if (pathArray[2] !== "markup") return false;
				}
			}
		}
		return true;
	}
	parseLabelMarkup(markup) {
		if (markup) {
			if (typeof markup === "string") return this.parseLabelStringMarkup(markup);
			return this.parseJSONMarkup(markup);
		}
		return null;
	}
	parseLabelStringMarkup(labelMarkup) {
		const children = Vector.createVectors(labelMarkup);
		const fragment = document.createDocumentFragment();
		for (let i = 0, n = children.length; i < n; i += 1) {
			const currentChild = children[i].node;
			fragment.appendChild(currentChild);
		}
		return {
			fragment,
			selectors: {}
		};
	}
	normalizeLabelMarkup(markup) {
		if (markup == null) return;
		const fragment = markup.fragment;
		if (!(fragment instanceof DocumentFragment) || !fragment.hasChildNodes()) throw new Error("Invalid label markup.");
		let vel;
		const childNodes = fragment.childNodes;
		if (childNodes.length > 1 || childNodes[0].nodeName.toUpperCase() !== "G") vel = Vector.create("g").append(fragment);
		else vel = Vector.create(childNodes[0]);
		vel.addClass(this.prefixClassName("edge-label"));
		return {
			node: vel.node,
			selectors: markup.selectors
		};
	}
	updateLabels() {
		if (this.labelContainer) {
			const edge = this.cell;
			const labels = edge.labels;
			const canLabelMove = this.can("edgeLabelMovable");
			const defaultLabel = edge.getDefaultLabel();
			for (let i = 0, n = labels.length; i < n; i += 1) {
				const elem = this.labelCache[i];
				const selectors = this.labelSelectors[i];
				elem.setAttribute("cursor", canLabelMove ? "move" : "default");
				const label = labels[i];
				const attrs = merge({}, defaultLabel.attrs, label.attrs);
				this.updateAttrs(elem, attrs, {
					selectors,
					rootBBox: label.size ? Rectangle.fromSize(label.size) : void 0
				});
			}
		}
	}
	renderTools() {
		const tools = this.cell.getTools();
		this.addTools(tools);
		return this;
	}
	update(options = {}) {
		this.cleanCache();
		this.updateConnection(options);
		const _a = this.cell.getAttrs(), { text } = _a, attrs = __rest$7(_a, ["text"]);
		if (attrs != null) this.updateAttrs(this.container, attrs, { selectors: this.selectors });
		this.updateLabelPositions();
		this.updateTools(options);
		return this;
	}
	removeRedundantLinearVertices(options = {}) {
		const edge = this.cell;
		const vertices = edge.getVertices();
		const routePoints = [
			this.sourceAnchor,
			...vertices,
			this.targetAnchor
		];
		const rawCount = routePoints.length;
		const polyline = new Polyline$1(routePoints);
		polyline.simplify({ threshold: .01 });
		const simplifiedPoints = polyline.points.map((point) => point.toJSON());
		const simplifiedCount = simplifiedPoints.length;
		if (rawCount === simplifiedCount) return 0;
		edge.setVertices(simplifiedPoints.slice(1, simplifiedCount - 1), options);
		return rawCount - simplifiedCount;
	}
	getTerminalView(type) {
		switch (type) {
			case "source": return this.sourceView || null;
			case "target": return this.targetView || null;
			default: throw new Error(`Unknown terminal type '${type}'`);
		}
	}
	getTerminalAnchor(type) {
		switch (type) {
			case "source": return Point.create(this.sourceAnchor);
			case "target": return Point.create(this.targetAnchor);
			default: throw new Error(`Unknown terminal type '${type}'`);
		}
	}
	getTerminalConnectionPoint(type) {
		switch (type) {
			case "source": return Point.create(this.sourcePoint);
			case "target": return Point.create(this.targetPoint);
			default: throw new Error(`Unknown terminal type '${type}'`);
		}
	}
	getTerminalMagnet(type, options = {}) {
		switch (type) {
			case "source": {
				if (options.raw) return this.sourceMagnet;
				const sourceView = this.sourceView;
				if (!sourceView) return null;
				return this.sourceMagnet || sourceView.container;
			}
			case "target": {
				if (options.raw) return this.targetMagnet;
				const targetView = this.targetView;
				if (!targetView) return null;
				return this.targetMagnet || targetView.container;
			}
			default: throw new Error(`Unknown terminal type '${type}'`);
		}
	}
	updateConnection(options = {}) {
		const edge = this.cell;
		if (options.translateBy && edge.isFragmentDescendantOf(options.translateBy)) {
			const tx = options.tx || 0;
			const ty = options.ty || 0;
			this.routePoints = new Polyline$1(this.routePoints).translate(tx, ty).points;
			this.translateConnectionPoints(tx, ty);
			this.path.translate(tx, ty);
		} else {
			const vertices = edge.getVertices();
			const anchors = this.findAnchors(vertices);
			this.sourceAnchor = anchors.source;
			this.targetAnchor = anchors.target;
			this.routePoints = this.findRoutePoints(vertices);
			const connectionPoints = this.findConnectionPoints(this.routePoints, this.sourceAnchor, this.targetAnchor);
			this.sourcePoint = connectionPoints.source;
			this.targetPoint = connectionPoints.target;
			const markerPoints = this.findMarkerPoints(this.routePoints, this.sourcePoint, this.targetPoint);
			this.path = this.findPath(this.routePoints, markerPoints.source || this.sourcePoint, markerPoints.target || this.targetPoint);
		}
		this.cleanCache();
	}
	findAnchors(vertices) {
		const edge = this.cell;
		const source = edge.source;
		const target = edge.target;
		const firstVertex = vertices[0];
		const lastVertex = vertices[vertices.length - 1];
		if (target.priority && !source.priority) return this.findAnchorsOrdered("target", lastVertex, "source", firstVertex);
		return this.findAnchorsOrdered("source", firstVertex, "target", lastVertex);
	}
	findAnchorsOrdered(firstType, firstPoint, secondType, secondPoint) {
		let firstAnchor;
		let secondAnchor;
		const edge = this.cell;
		const firstTerminal = edge[firstType];
		const secondTerminal = edge[secondType];
		const firstView = this.getTerminalView(firstType);
		const secondView = this.getTerminalView(secondType);
		const firstMagnet = this.getTerminalMagnet(firstType);
		const secondMagnet = this.getTerminalMagnet(secondType);
		if (firstView) {
			let firstRef;
			if (firstPoint) firstRef = Point.create(firstPoint);
			else if (secondView) firstRef = secondMagnet;
			else firstRef = Point.create(secondTerminal);
			firstAnchor = this.getAnchor(firstTerminal.anchor, firstView, firstMagnet, firstRef, firstType);
		} else firstAnchor = Point.create(firstTerminal);
		if (secondView) {
			const secondRef = Point.create(secondPoint || firstAnchor);
			secondAnchor = this.getAnchor(secondTerminal.anchor, secondView, secondMagnet, secondRef, secondType);
		} else secondAnchor = Point.isPointLike(secondTerminal) ? Point.create(secondTerminal) : new Point();
		return {
			[firstType]: firstAnchor,
			[secondType]: secondAnchor
		};
	}
	getAnchor(def, cellView, magnet, ref, terminalType) {
		const isEdge = cellView.isEdgeElement(magnet);
		const connecting = this.graph.options.connecting;
		let config = typeof def === "string" ? { name: def } : def;
		if (!config) {
			const defaults = isEdge ? (terminalType === "source" ? connecting.sourceEdgeAnchor : connecting.targetEdgeAnchor) || connecting.edgeAnchor : (terminalType === "source" ? connecting.sourceAnchor : connecting.targetAnchor) || connecting.anchor;
			config = typeof defaults === "string" ? { name: defaults } : defaults;
		}
		if (!config) throw new Error(`Anchor should be specified.`);
		let anchor;
		const name = config.name;
		if (isEdge) {
			const fn = EdgeAnchor.registry.get(name);
			if (typeof fn !== "function") return EdgeAnchor.registry.onNotFound(name);
			anchor = call$1(fn, this, cellView, magnet, ref, config.args || {}, terminalType);
		} else {
			const fn = NodeAnchor.registry.get(name);
			if (typeof fn !== "function") return NodeAnchor.registry.onNotFound(name);
			anchor = call$1(fn, this, cellView, magnet, ref, config.args || {}, terminalType);
		}
		return anchor ? anchor.round(this.POINT_ROUNDING) : new Point();
	}
	findRoutePoints(vertices = []) {
		const defaultRouter = this.graph.options.connecting.router || Router.presets.normal;
		const router = this.cell.getRouter() || defaultRouter;
		let routePoints;
		if (typeof router === "function") routePoints = call$1(router, this, vertices, {}, this);
		else {
			const name = typeof router === "string" ? router : router.name;
			const args = typeof router === "string" ? {} : router.args || {};
			const fn = name ? Router.registry.get(name) : Router.presets.normal;
			if (typeof fn !== "function") return Router.registry.onNotFound(name);
			routePoints = call$1(fn, this, vertices, args, this);
		}
		return routePoints == null ? vertices.map((p) => Point.create(p)) : routePoints.map((p) => Point.create(p));
	}
	findConnectionPoints(routePoints, sourceAnchor, targetAnchor) {
		const edge = this.cell;
		const connecting = this.graph.options.connecting;
		const sourceTerminal = edge.getSource();
		const targetTerminal = edge.getTarget();
		const sourceView = this.sourceView;
		const targetView = this.targetView;
		const firstRoutePoint = routePoints[0];
		const lastRoutePoint = routePoints[routePoints.length - 1];
		let sourcePoint;
		if (sourceView && !sourceView.isEdgeElement(this.sourceMagnet)) {
			const sourceMagnet = this.sourceMagnet || sourceView.container;
			const sourceLine = new Line(firstRoutePoint || targetAnchor, sourceAnchor);
			const connectionPointDef = sourceTerminal.connectionPoint || connecting.sourceConnectionPoint || connecting.connectionPoint;
			sourcePoint = this.getConnectionPoint(connectionPointDef, sourceView, sourceMagnet, sourceLine, "source");
		} else sourcePoint = sourceAnchor;
		let targetPoint;
		if (targetView && !targetView.isEdgeElement(this.targetMagnet)) {
			const targetMagnet = this.targetMagnet || targetView.container;
			const targetConnectionPointDef = targetTerminal.connectionPoint || connecting.targetConnectionPoint || connecting.connectionPoint;
			const targetLine = new Line(lastRoutePoint || sourceAnchor, targetAnchor);
			targetPoint = this.getConnectionPoint(targetConnectionPointDef, targetView, targetMagnet, targetLine, "target");
		} else targetPoint = targetAnchor;
		return {
			source: sourcePoint,
			target: targetPoint
		};
	}
	getConnectionPoint(def, view, magnet, line, endType) {
		const anchor = line.end;
		if (def == null) return anchor;
		const name = typeof def === "string" ? def : def.name;
		const args = typeof def === "string" ? {} : def.args;
		const fn = ConnectionPoint.registry.get(name);
		if (typeof fn !== "function") return ConnectionPoint.registry.onNotFound(name);
		const connectionPoint = call$1(fn, this, line, view, magnet, args || {}, endType);
		return connectionPoint ? connectionPoint.round(this.POINT_ROUNDING) : anchor;
	}
	findMarkerPoints(routePoints, sourcePoint, targetPoint) {
		const getLineWidth = (type) => {
			const attrs = this.cell.getAttrs();
			const keys = Object.keys(attrs);
			for (let i = 0, l = keys.length; i < l; i += 1) {
				const attr = attrs[keys[i]];
				if (attr[`${type}Marker`] || attr[`${type}-marker`]) {
					const strokeWidth = attr.strokeWidth || attr["stroke-width"];
					if (strokeWidth) return parseFloat(strokeWidth);
					break;
				}
			}
			return null;
		};
		const firstRoutePoint = routePoints[0];
		const lastRoutePoint = routePoints[routePoints.length - 1];
		let sourceMarkerPoint;
		let targetMarkerPoint;
		const sourceStrokeWidth = getLineWidth("source");
		if (sourceStrokeWidth) sourceMarkerPoint = sourcePoint.clone().move(firstRoutePoint || targetPoint, -sourceStrokeWidth);
		const targetStrokeWidth = getLineWidth("target");
		if (targetStrokeWidth) targetMarkerPoint = targetPoint.clone().move(lastRoutePoint || sourcePoint, -targetStrokeWidth);
		this.sourceMarkerPoint = sourceMarkerPoint || sourcePoint.clone();
		this.targetMarkerPoint = targetMarkerPoint || targetPoint.clone();
		return {
			source: sourceMarkerPoint,
			target: targetMarkerPoint
		};
	}
	findPath(routePoints, sourcePoint, targetPoint) {
		const def = this.cell.getConnector() || this.graph.options.connecting.connector;
		let name;
		let args;
		let fn;
		if (typeof def === "string") name = def;
		else {
			name = def.name;
			args = def.args;
		}
		if (name) {
			const method = Connector.registry.get(name);
			if (typeof method !== "function") return Connector.registry.onNotFound(name);
			fn = method;
		} else fn = Connector.presets.normal;
		const path = call$1(fn, this, sourcePoint, targetPoint, routePoints, Object.assign(Object.assign({}, args), { raw: true }), this);
		return typeof path === "string" ? Path$1.parse(path) : path;
	}
	translateConnectionPoints(tx, ty) {
		this.sourcePoint.translate(tx, ty);
		this.targetPoint.translate(tx, ty);
		this.sourceAnchor.translate(tx, ty);
		this.targetAnchor.translate(tx, ty);
		this.sourceMarkerPoint.translate(tx, ty);
		this.targetMarkerPoint.translate(tx, ty);
	}
	updateLabelPositions() {
		if (this.labelContainer == null) return this;
		if (!this.path) return this;
		const edge = this.cell;
		const labels = edge.getLabels();
		if (labels.length === 0) return this;
		const defaultLabel = edge.getDefaultLabel();
		const defaultPosition = this.normalizeLabelPosition(defaultLabel.position);
		for (let i = 0, ii = labels.length; i < ii; i += 1) {
			const label = labels[i];
			const labelNode = this.labelCache[i];
			if (!labelNode) continue;
			const labelPosition = this.normalizeLabelPosition(label.position);
			const pos = merge({}, defaultPosition, labelPosition);
			const matrix = this.getLabelTransformationMatrix(pos);
			labelNode.setAttribute("transform", matrixToTransformString(matrix));
		}
		return this;
	}
	updateTerminalProperties(type) {
		const edge = this.cell;
		const graph = this.graph;
		const terminal = edge[type];
		const nodeId = terminal && terminal.cell;
		const viewKey = `${type}View`;
		if (!nodeId) {
			this[viewKey] = null;
			this.updateTerminalMagnet(type);
			return true;
		}
		const terminalCell = graph.getCellById(nodeId);
		if (!terminalCell) throw new Error(`Edge's ${type} node with id "${nodeId}" not exists`);
		const endView = terminalCell.findView(graph);
		if (!endView) return false;
		this[viewKey] = endView;
		this.updateTerminalMagnet(type);
		return true;
	}
	updateTerminalMagnet(type) {
		const propName = `${type}Magnet`;
		const terminalView = this.getTerminalView(type);
		if (terminalView) {
			let magnet = terminalView.getMagnetFromEdgeTerminal(this.cell[type]);
			if (magnet === terminalView.container) magnet = null;
			this[propName] = magnet;
		} else this[propName] = null;
	}
	getLabelPositionAngle(idx) {
		const label = this.cell.getLabelAt(idx);
		if (label && label.position && typeof label.position === "object") return label.position.angle || 0;
		return 0;
	}
	getLabelPositionArgs(idx) {
		const label = this.cell.getLabelAt(idx);
		if (label && label.position && typeof label.position === "object") return label.position.options;
	}
	getDefaultLabelPositionArgs() {
		const defaultLabel = this.cell.getDefaultLabel();
		if (defaultLabel && defaultLabel.position && typeof defaultLabel.position === "object") return defaultLabel.position.options;
	}
	mergeLabelPositionArgs(labelPositionArgs, defaultLabelPositionArgs) {
		if (labelPositionArgs === null) return null;
		if (labelPositionArgs === void 0) {
			if (defaultLabelPositionArgs === null) return null;
			return defaultLabelPositionArgs;
		}
		return merge({}, defaultLabelPositionArgs, labelPositionArgs);
	}
	getConnection() {
		return this.path != null ? this.path.clone() : null;
	}
	getConnectionPathData() {
		if (this.path == null) return "";
		const cache = this.cache.pathCache;
		if (!has(cache, "data")) cache.data = this.path.serialize();
		return cache.data || "";
	}
	getConnectionSubdivisions() {
		if (this.path == null) return null;
		const cache = this.cache.pathCache;
		if (!has(cache, "segmentSubdivisions")) cache.segmentSubdivisions = this.path.getSegmentSubdivisions();
		return cache.segmentSubdivisions;
	}
	getConnectionLength() {
		if (this.path == null) return 0;
		const cache = this.cache.pathCache;
		if (!has(cache, "length")) cache.length = this.path.length({ segmentSubdivisions: this.getConnectionSubdivisions() });
		return cache.length;
	}
	getPointAtLength(length) {
		if (this.path == null) return null;
		return this.path.pointAtLength(length, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getPointAtRatio(ratio) {
		if (this.path == null) return null;
		if (isPercentage(ratio)) ratio = parseFloat(ratio) / 100;
		return this.path.pointAt(ratio, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getTangentAtLength(length) {
		if (this.path == null) return null;
		return this.path.tangentAtLength(length, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getTangentAtRatio(ratio) {
		if (this.path == null) return null;
		return this.path.tangentAt(ratio, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getClosestPoint(point) {
		if (this.path == null) return null;
		return this.path.closestPoint(point, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getClosestPointLength(point) {
		if (this.path == null) return null;
		return this.path.closestPointLength(point, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getClosestPointRatio(point) {
		if (this.path == null) return null;
		return this.path.closestPointNormalizedLength(point, { segmentSubdivisions: this.getConnectionSubdivisions() });
	}
	getLabelPosition(x, y, p3, p4) {
		const pos = { distance: 0 };
		let angle = 0;
		let options;
		if (typeof p3 === "number") {
			angle = p3;
			options = p4;
		} else options = p3;
		if (options != null) pos.options = options;
		const isOffsetAbsolute = options && options.absoluteOffset;
		const isDistanceRelative = !(options && options.absoluteDistance);
		const isDistanceAbsoluteReverse = options && options.absoluteDistance && options.reverseDistance;
		const path = this.path;
		const pathOptions = { segmentSubdivisions: this.getConnectionSubdivisions() };
		const labelPoint = new Point(x, y);
		const t = path.closestPointT(labelPoint, pathOptions);
		const totalLength = this.getConnectionLength() || 0;
		let labelDistance = path.lengthAtT(t, pathOptions);
		if (isDistanceRelative) labelDistance = totalLength > 0 ? labelDistance / totalLength : 0;
		if (isDistanceAbsoluteReverse) labelDistance = -1 * (totalLength - labelDistance) || 1;
		pos.distance = labelDistance;
		let tangent;
		if (!isOffsetAbsolute) tangent = path.tangentAtT(t);
		let labelOffset;
		if (tangent) labelOffset = tangent.pointOffset(labelPoint);
		else {
			const closestPoint = path.pointAtT(t);
			const labelOffsetDiff = labelPoint.diff(closestPoint);
			labelOffset = {
				x: labelOffsetDiff.x,
				y: labelOffsetDiff.y
			};
		}
		pos.offset = labelOffset;
		pos.angle = angle;
		return pos;
	}
	normalizeLabelPosition(pos) {
		if (typeof pos === "number") return { distance: pos };
		return pos;
	}
	getLabelTransformationMatrix(labelPosition) {
		const pos = this.normalizeLabelPosition(labelPosition);
		const options = pos.options || {};
		const labelAngle = pos.angle || 0;
		const labelDistance = pos.distance;
		const isDistanceRelative = labelDistance > 0 && labelDistance <= 1;
		let labelOffset = 0;
		const offsetCoord = {
			x: 0,
			y: 0
		};
		const offset = pos.offset;
		if (offset) if (typeof offset === "number") labelOffset = offset;
		else {
			if (offset.x != null) offsetCoord.x = offset.x;
			if (offset.y != null) offsetCoord.y = offset.y;
		}
		const isOffsetAbsolute = offsetCoord.x !== 0 || offsetCoord.y !== 0 || labelOffset === 0;
		const isKeepGradient = options.keepGradient;
		const isEnsureLegibility = options.ensureLegibility;
		const path = this.path;
		const pathOpt = { segmentSubdivisions: this.getConnectionSubdivisions() };
		const distance = isDistanceRelative ? labelDistance * this.getConnectionLength() : labelDistance;
		const tangent = path.tangentAtLength(distance, pathOpt);
		let translation;
		let angle = labelAngle;
		if (tangent) {
			if (isOffsetAbsolute) {
				translation = tangent.start;
				translation.translate(offsetCoord);
			} else {
				const normal = tangent.clone();
				normal.rotate(-90, tangent.start);
				normal.setLength(labelOffset);
				translation = normal.end;
			}
			if (isKeepGradient) {
				angle = tangent.angle() + labelAngle;
				if (isEnsureLegibility) angle = Angle.normalize((angle + 90) % 180 - 90);
			}
		} else {
			translation = path.start;
			if (isOffsetAbsolute) translation.translate(offsetCoord);
		}
		return createSVGMatrix().translate(translation.x, translation.y).rotate(angle);
	}
	getVertexIndex(x, y) {
		const vertices = this.cell.getVertices();
		const vertexLength = this.getClosestPointLength(new Point(x, y));
		let index = 0;
		if (vertexLength != null) for (const ii = vertices.length; index < ii; index += 1) {
			const currentVertex = vertices[index];
			const currentLength = this.getClosestPointLength(currentVertex);
			if (currentLength != null && vertexLength < currentLength) break;
		}
		return index;
	}
	getEventArgs(e, x, y) {
		const view = this;
		const edge = view.cell;
		const cell = edge;
		if (x == null || y == null) return {
			e,
			view,
			edge,
			cell
		};
		return {
			e,
			x,
			y,
			view,
			edge,
			cell
		};
	}
	notifyUnhandledMouseDown(e, x, y) {
		this.notify("edge:unhandled:mousedown", {
			e,
			x,
			y,
			view: this,
			cell: this.cell,
			edge: this.cell
		});
	}
	notifyMouseDown(e, x, y) {
		super.onMouseDown(e, x, y);
		this.notify("edge:mousedown", this.getEventArgs(e, x, y));
	}
	notifyMouseMove(e, x, y) {
		super.onMouseMove(e, x, y);
		this.notify("edge:mousemove", this.getEventArgs(e, x, y));
	}
	notifyMouseUp(e, x, y) {
		super.onMouseUp(e, x, y);
		this.notify("edge:mouseup", this.getEventArgs(e, x, y));
	}
	onClick(e, x, y) {
		super.onClick(e, x, y);
		this.notify("edge:click", this.getEventArgs(e, x, y));
	}
	onDblClick(e, x, y) {
		super.onDblClick(e, x, y);
		this.notify("edge:dblclick", this.getEventArgs(e, x, y));
	}
	onContextMenu(e, x, y) {
		super.onContextMenu(e, x, y);
		this.notify("edge:contextmenu", this.getEventArgs(e, x, y));
	}
	onMouseDown(e, x, y) {
		this.notifyMouseDown(e, x, y);
		this.startEdgeDragging(e, x, y);
	}
	onMouseMove(e, x, y) {
		const data = this.getEventData(e);
		switch (data.action) {
			case "drag-label":
				this.dragLabel(e, x, y);
				break;
			case "drag-arrowhead":
				this.dragArrowhead(e, x, y);
				break;
			case "drag-edge": this.dragEdge(e, x, y);
		}
		this.notifyMouseMove(e, x, y);
		return data;
	}
	onMouseUp(e, x, y) {
		const data = this.getEventData(e);
		switch (data.action) {
			case "drag-label":
				this.stopLabelDragging(e, x, y);
				break;
			case "drag-arrowhead":
				this.stopArrowheadDragging(e, x, y);
				break;
			case "drag-edge": this.stopEdgeDragging(e, x, y);
		}
		this.notifyMouseUp(e, x, y);
		this.checkMouseleave(e);
		return data;
	}
	onMouseOver(e) {
		super.onMouseOver(e);
		this.notify("edge:mouseover", this.getEventArgs(e));
	}
	onMouseOut(e) {
		super.onMouseOut(e);
		this.notify("edge:mouseout", this.getEventArgs(e));
	}
	onMouseEnter(e) {
		super.onMouseEnter(e);
		this.notify("edge:mouseenter", this.getEventArgs(e));
	}
	onMouseLeave(e) {
		super.onMouseLeave(e);
		this.notify("edge:mouseleave", this.getEventArgs(e));
	}
	onMouseWheel(e, x, y, delta) {
		super.onMouseWheel(e, x, y, delta);
		this.notify("edge:mousewheel", Object.assign({ delta }, this.getEventArgs(e, x, y)));
	}
	onCustomEvent(e, name, x, y) {
		if (findParentByClass(e.target, "edge-tool", this.container)) {
			e.stopPropagation();
			if (this.can("useEdgeTools")) {
				if (name === "edge:remove") {
					this.cell.remove({ ui: true });
					return;
				}
				this.notify("edge:customevent", Object.assign({ name }, this.getEventArgs(e, x, y)));
			}
			this.notifyMouseDown(e, x, y);
		} else {
			this.notify("edge:customevent", Object.assign({ name }, this.getEventArgs(e, x, y)));
			super.onCustomEvent(e, name, x, y);
		}
	}
	onLabelMouseDown(e, x, y) {
		this.notifyMouseDown(e, x, y);
		this.startLabelDragging(e, x, y);
		if (this.getEventData(e).stopPropagation) e.stopPropagation();
	}
	startEdgeDragging(e, x, y) {
		if (!this.can("edgeMovable")) {
			this.notifyUnhandledMouseDown(e, x, y);
			return;
		}
		this.setEventData(e, {
			x,
			y,
			moving: false,
			action: "drag-edge"
		});
	}
	dragEdge(e, x, y) {
		const data = this.getEventData(e);
		if (!data.moving) {
			data.moving = true;
			this.addClass("edge-moving");
			this.notify("edge:move", {
				e,
				x,
				y,
				view: this,
				cell: this.cell,
				edge: this.cell
			});
		}
		this.cell.translate(x - data.x, y - data.y, { ui: true });
		this.setEventData(e, {
			x,
			y
		});
		this.notify("edge:moving", {
			e,
			x,
			y,
			view: this,
			cell: this.cell,
			edge: this.cell
		});
	}
	stopEdgeDragging(e, x, y) {
		const data = this.getEventData(e);
		if (data.moving) {
			this.removeClass("edge-moving");
			this.notify("edge:moved", {
				e,
				x,
				y,
				view: this,
				cell: this.cell,
				edge: this.cell
			});
		}
		data.moving = false;
	}
	prepareArrowheadDragging(type, options) {
		const magnet = this.getTerminalMagnet(type);
		const data = {
			action: "drag-arrowhead",
			x: options.x,
			y: options.y,
			isNewEdge: options.isNewEdge === true,
			terminalType: type,
			initialMagnet: magnet,
			initialTerminal: clone(this.cell[type]),
			fallbackAction: options.fallbackAction || "revert",
			getValidateConnectionArgs: this.createValidateConnectionArgs(type),
			options: options.options
		};
		this.beforeArrowheadDragging(data);
		return data;
	}
	createValidateConnectionArgs(type) {
		const args = [];
		args[4] = type;
		args[5] = this;
		let opposite;
		let i = 0;
		let j = 0;
		if (type === "source") {
			i = 2;
			opposite = "target";
		} else {
			j = 2;
			opposite = "source";
		}
		const terminal = this.cell[opposite];
		const cellId = terminal.cell;
		if (cellId) {
			let magnet;
			const view = args[i] = this.graph.findViewByCell(cellId);
			if (view) {
				magnet = view.getMagnetFromEdgeTerminal(terminal);
				if (magnet === view.container) magnet = void 0;
			}
			args[i + 1] = magnet;
		}
		return (cellView, magnet) => {
			args[j] = cellView;
			args[j + 1] = cellView.container === magnet ? void 0 : magnet;
			return args;
		};
	}
	beforeArrowheadDragging(data) {
		data.zIndex = this.cell.zIndex;
		this.cell.toFront();
		const style = this.container.style;
		data.pointerEvents = style.pointerEvents;
		style.pointerEvents = "none";
		if (this.graph.options.connecting.highlight) this.highlightAvailableMagnets(data);
	}
	afterArrowheadDragging(data) {
		if (data.zIndex != null) {
			this.cell.setZIndex(data.zIndex, { ui: true });
			data.zIndex = null;
		}
		const container = this.container;
		container.style.pointerEvents = data.pointerEvents || "";
		if (this.graph.options.connecting.highlight) this.unhighlightAvailableMagnets(data);
	}
	validateConnection(sourceView, sourceMagnet, targetView, targetMagnet, terminalType, edgeView, candidateTerminal) {
		const options = this.graph.options.connecting;
		const allowLoop = options.allowLoop;
		const allowNode = options.allowNode;
		const allowEdge = options.allowEdge;
		const allowPort = options.allowPort;
		const allowMulti = options.allowMulti;
		const validate = options.validateConnection;
		const edge = edgeView ? edgeView.cell : null;
		const terminalView = terminalType === "target" ? targetView : sourceView;
		const terminalMagnet = terminalType === "target" ? targetMagnet : sourceMagnet;
		let valid = true;
		const doValidate = (validate) => {
			const sourcePort = terminalType === "source" ? candidateTerminal ? candidateTerminal.port : null : edge ? edge.getSourcePortId() : null;
			const targetPort = terminalType === "target" ? candidateTerminal ? candidateTerminal.port : null : edge ? edge.getTargetPortId() : null;
			return call$1(validate, this.graph, {
				edge,
				edgeView,
				sourceView,
				targetView,
				sourcePort,
				targetPort,
				sourceMagnet,
				targetMagnet,
				sourceCell: sourceView ? sourceView.cell : null,
				targetCell: targetView ? targetView.cell : null,
				type: terminalType
			});
		};
		if (allowLoop != null) if (typeof allowLoop === "boolean") {
			if (!allowLoop && sourceView === targetView) valid = false;
		} else valid = doValidate(allowLoop);
		if (valid && allowPort != null) if (typeof allowPort === "boolean") {
			if (!allowPort && terminalMagnet) valid = false;
		} else valid = doValidate(allowPort);
		if (valid && allowEdge != null) if (typeof allowEdge === "boolean") {
			if (!allowEdge && EdgeView.isEdgeView(terminalView)) valid = false;
		} else valid = doValidate(allowEdge);
		if (valid && allowNode != null && terminalMagnet == null) if (typeof allowNode === "boolean") {
			if (!allowNode && NodeView.isNodeView(terminalView)) valid = false;
		} else valid = doValidate(allowNode);
		if (valid && allowMulti != null && edgeView) {
			const edge = edgeView.cell;
			const source = terminalType === "source" ? candidateTerminal : edge.getSource();
			const target = terminalType === "target" ? candidateTerminal : edge.getTarget();
			const terminalCell = candidateTerminal ? this.graph.getCellById(candidateTerminal.cell) : null;
			if (source && target && source.cell && target.cell && terminalCell) if (typeof allowMulti === "function") valid = doValidate(allowMulti);
			else {
				const connectedEdges = this.graph.model.getConnectedEdges(terminalCell, {
					outgoing: terminalType === "source",
					incoming: terminalType === "target"
				});
				if (connectedEdges.length) {
					if (allowMulti === "withPort") {
						if (connectedEdges.some((link) => {
							const s = link.getSource();
							const t = link.getTarget();
							return s && t && s.cell === source.cell && t.cell === target.cell && s.port != null && s.port === source.port && t.port != null && t.port === target.port;
						})) valid = false;
					} else if (!allowMulti) {
						if (connectedEdges.some((link) => {
							const s = link.getSource();
							const t = link.getTarget();
							return s && t && s.cell === source.cell && t.cell === target.cell;
						})) valid = false;
					}
				}
			}
		}
		if (valid && validate != null) valid = doValidate(validate);
		return valid;
	}
	allowConnectToBlank(edge) {
		const graph = this.graph;
		const allowBlank = graph.options.connecting.allowBlank;
		if (typeof allowBlank !== "function") return !!allowBlank;
		const edgeView = graph.findViewByCell(edge);
		const sourceCell = edge.getSourceCell();
		const targetCell = edge.getTargetCell();
		return call$1(allowBlank, graph, {
			edge,
			edgeView,
			sourceCell,
			targetCell,
			sourceView: graph.findViewByCell(sourceCell),
			targetView: graph.findViewByCell(targetCell),
			sourcePort: edge.getSourcePortId(),
			targetPort: edge.getTargetPortId(),
			sourceMagnet: edgeView.sourceMagnet,
			targetMagnet: edgeView.targetMagnet
		});
	}
	validateEdge(edge, type, initialTerminal) {
		const graph = this.graph;
		if (!this.allowConnectToBlank(edge)) {
			const sourceId = edge.getSourceCellId();
			const targetId = edge.getTargetCellId();
			if (!(sourceId && targetId)) return false;
		}
		const validate = graph.options.connecting.validateEdge;
		if (validate) return call$1(validate, graph, {
			edge,
			type,
			previous: initialTerminal
		});
		return true;
	}
	arrowheadDragging(target, x, y, data) {
		data.x = x;
		data.y = y;
		if (data.currentTarget !== target) {
			if (data.currentMagnet && data.currentView) data.currentView.unhighlight(data.currentMagnet, { type: "magnetAdsorbed" });
			data.currentView = this.graph.findViewByElem(target);
			if (data.currentView) {
				data.currentMagnet = data.currentView.findMagnet(target);
				if (data.currentMagnet && this.validateConnection(...data.getValidateConnectionArgs(data.currentView, data.currentMagnet), data.currentView.getEdgeTerminal(data.currentMagnet, x, y, this.cell, data.terminalType))) data.currentView.highlight(data.currentMagnet, { type: "magnetAdsorbed" });
				else data.currentMagnet = null;
			} else data.currentMagnet = null;
		}
		data.currentTarget = target;
		this.cell.prop(data.terminalType, {
			x,
			y
		}, Object.assign(Object.assign({}, data.options), { ui: true }));
	}
	arrowheadDragged(data, x, y) {
		const view = data.currentView;
		const magnet = data.currentMagnet;
		if (!magnet || !view) return;
		view.unhighlight(magnet, { type: "magnetAdsorbed" });
		const type = data.terminalType;
		const terminal = view.getEdgeTerminal(magnet, x, y, this.cell, type);
		this.cell.setTerminal(type, terminal, { ui: true });
	}
	snapArrowhead(x, y, data) {
		const graph = this.graph;
		const { snap, allowEdge } = graph.options.connecting;
		const radius = typeof snap === "object" && snap.radius || 50;
		const anchor = typeof snap === "object" && snap.anchor || "center";
		const views = graph.renderer.findViewsInArea({
			x: x - radius,
			y: y - radius,
			width: 2 * radius,
			height: 2 * radius
		}, { nodeOnly: true });
		if (allowEdge) {
			const edgeViews = graph.renderer.findEdgeViewsFromPoint({
				x,
				y
			}, radius).filter((view) => {
				return view !== this;
			});
			views.push(...edgeViews);
		}
		const prevView = data.closestView || null;
		const prevMagnet = data.closestMagnet || null;
		data.closestView = null;
		data.closestMagnet = null;
		let distance;
		let minDistance = Number.MAX_SAFE_INTEGER;
		const pos = new Point(x, y);
		views.forEach((view) => {
			if (view.container.getAttribute("magnet") !== "false") {
				if (view.isNodeView()) distance = anchor === "center" ? view.cell.getBBox().getCenter().distance(pos) : view.cell.getBBox().getNearestPointToPoint(pos).distance(pos);
				else if (view.isEdgeView()) {
					const point = view.getClosestPoint(pos);
					if (point) distance = point.distance(pos);
					else distance = Number.MAX_SAFE_INTEGER;
				}
				if (distance < radius && distance < minDistance) {
					if (prevMagnet === view.container || this.validateConnection(...data.getValidateConnectionArgs(view, null), view.getEdgeTerminal(view.container, x, y, this.cell, data.terminalType))) {
						minDistance = distance;
						data.closestView = view;
						data.closestMagnet = view.container;
					}
				}
			}
			view.container.querySelectorAll("[magnet]").forEach((magnet) => {
				if (magnet.getAttribute("magnet") !== "false") {
					const bbox = view.getBBoxOfElement(magnet);
					distance = pos.distance(bbox.getCenter());
					if (distance < radius && distance < minDistance) {
						if (prevMagnet === magnet || this.validateConnection(...data.getValidateConnectionArgs(view, magnet), view.getEdgeTerminal(magnet, x, y, this.cell, data.terminalType))) {
							minDistance = distance;
							data.closestView = view;
							data.closestMagnet = magnet;
						}
					}
				}
			});
		});
		let terminal;
		const type = data.terminalType;
		const closestView = data.closestView;
		const closestMagnet = data.closestMagnet;
		const changed = prevMagnet !== closestMagnet;
		if (prevView && changed) prevView.unhighlight(prevMagnet, { type: "magnetAdsorbed" });
		if (closestView) {
			if (!changed) return;
			closestView.highlight(closestMagnet, { type: "magnetAdsorbed" });
			terminal = closestView.getEdgeTerminal(closestMagnet, x, y, this.cell, type);
		} else terminal = {
			x,
			y
		};
		this.cell.setTerminal(type, terminal, {}, Object.assign(Object.assign({}, data.options), { ui: true }));
	}
	snapArrowheadEnd(data) {
		const closestView = data.closestView;
		const closestMagnet = data.closestMagnet;
		if (closestView && closestMagnet) {
			closestView.unhighlight(closestMagnet, { type: "magnetAdsorbed" });
			data.currentMagnet = closestView.findMagnet(closestMagnet);
		}
		data.closestView = null;
		data.closestMagnet = null;
	}
	finishEmbedding(data) {
		if (this.graph.options.embedding.enabled && this.cell.updateParent()) data.zIndex = null;
	}
	fallbackConnection(data) {
		switch (data.fallbackAction) {
			case "remove":
				this.cell.remove({ ui: true });
				break;
			default: this.cell.prop(data.terminalType, data.initialTerminal, { ui: true });
		}
	}
	notifyConnectionEvent(data, e) {
		const terminalType = data.terminalType;
		const initialTerminal = data.initialTerminal;
		const currentTerminal = this.cell[terminalType];
		if (currentTerminal && !Edge$1.equalTerminals(initialTerminal, currentTerminal)) {
			const graph = this.graph;
			const previous = initialTerminal;
			const previousCell = previous.cell ? graph.getCellById(previous.cell) : null;
			const previousPort = previous.port;
			const previousView = previousCell ? graph.findViewByCell(previousCell) : null;
			const previousPoint = previousCell || data.isNewEdge ? null : Point.create(initialTerminal).toJSON();
			const current = currentTerminal;
			const currentCell = current.cell ? graph.getCellById(current.cell) : null;
			const currentPort = current.port;
			const currentView = currentCell ? graph.findViewByCell(currentCell) : null;
			const currentPoint = currentCell ? null : Point.create(currentTerminal).toJSON();
			this.notify("edge:connected", {
				e,
				previousCell,
				previousPort,
				previousView,
				previousPoint,
				currentCell,
				currentView,
				currentPort,
				currentPoint,
				previousMagnet: data.initialMagnet,
				currentMagnet: data.currentMagnet,
				edge: this.cell,
				view: this,
				type: terminalType,
				isNew: data.isNewEdge
			});
		}
	}
	highlightAvailableMagnets(data) {
		const graph = this.graph;
		const cells = graph.model.getCells();
		data.marked = {};
		for (let i = 0, ii = cells.length; i < ii; i += 1) {
			const view = graph.findViewByCell(cells[i]);
			if (!view || view.cell.id === this.cell.id) continue;
			const magnets = Array.prototype.slice.call(view.container.querySelectorAll("[magnet]"));
			if (view.container.getAttribute("magnet") !== "false") magnets.push(view.container);
			const availableMagnets = magnets.filter((magnet) => this.validateConnection(...data.getValidateConnectionArgs(view, magnet), view.getEdgeTerminal(magnet, data.x, data.y, this.cell, data.terminalType)));
			if (availableMagnets.length > 0) {
				for (let j = 0, jj = availableMagnets.length; j < jj; j += 1) view.highlight(availableMagnets[j], { type: "magnetAvailable" });
				view.highlight(null, { type: "nodeAvailable" });
				data.marked[view.cell.id] = availableMagnets;
			}
		}
	}
	unhighlightAvailableMagnets(data) {
		const marked = data.marked || {};
		Object.keys(marked).forEach((id) => {
			const view = this.graph.findViewByCell(id);
			if (view) {
				marked[id].forEach((magnet) => {
					view.unhighlight(magnet, { type: "magnetAvailable" });
				});
				view.unhighlight(null, { type: "nodeAvailable" });
			}
		});
		data.marked = null;
	}
	startArrowheadDragging(e, x, y) {
		if (!this.can("arrowheadMovable")) {
			this.notifyUnhandledMouseDown(e, x, y);
			return;
		}
		const type = e.target.getAttribute("data-terminal");
		const data = this.prepareArrowheadDragging(type, {
			x,
			y
		});
		this.setEventData(e, data);
	}
	dragArrowhead(e, x, y) {
		const data = this.getEventData(e);
		if (this.graph.options.connecting.snap) this.snapArrowhead(x, y, data);
		else this.arrowheadDragging(this.getEventTarget(e), x, y, data);
	}
	stopArrowheadDragging(e, x, y) {
		const graph = this.graph;
		const data = this.getEventData(e);
		if (graph.options.connecting.snap) this.snapArrowheadEnd(data);
		else this.arrowheadDragged(data, x, y);
		if (this.validateEdge(this.cell, data.terminalType, data.initialTerminal)) {
			this.finishEmbedding(data);
			this.notifyConnectionEvent(data, e);
		} else this.fallbackConnection(data);
		this.afterArrowheadDragging(data);
	}
	startLabelDragging(e, x, y) {
		if (this.can("edgeLabelMovable")) {
			const target = e.currentTarget;
			const index = parseInt(target.getAttribute("data-index"), 10);
			const positionAngle = this.getLabelPositionAngle(index);
			const labelPositionArgs = this.getLabelPositionArgs(index);
			const defaultLabelPositionArgs = this.getDefaultLabelPositionArgs();
			const positionArgs = this.mergeLabelPositionArgs(labelPositionArgs, defaultLabelPositionArgs);
			this.setEventData(e, {
				index,
				positionAngle,
				positionArgs,
				stopPropagation: true,
				action: "drag-label"
			});
		} else this.setEventData(e, { stopPropagation: true });
		this.graph.view.delegateDragEvents(e, this);
	}
	dragLabel(e, x, y) {
		const data = this.getEventData(e);
		const originLabel = this.cell.getLabelAt(data.index);
		const label = merge({}, originLabel, { position: this.getLabelPosition(x, y, data.positionAngle, data.positionArgs) });
		this.cell.setLabelAt(data.index, label);
	}
	stopLabelDragging(e, x, y) {}
};
(function(EdgeView) {
	EdgeView.toStringTag = `X6.${EdgeView.name}`;
	function isEdgeView(instance) {
		if (instance == null) return false;
		if (instance instanceof EdgeView) return true;
		const tag = instance[Symbol.toStringTag];
		const view = instance;
		if ((tag == null || tag === EdgeView.toStringTag) && typeof view.isNodeView === "function" && typeof view.isEdgeView === "function" && typeof view.confirmUpdate === "function" && typeof view.update === "function" && typeof view.getConnection === "function") return true;
		return false;
	}
	EdgeView.isEdgeView = isEdgeView;
})(EdgeView || (EdgeView = {}));
EdgeView.config({
	isSvgElement: true,
	priority: 1,
	bootstrap: [
		"render",
		"source",
		"target"
	],
	actions: {
		view: ["render"],
		markup: ["render"],
		attrs: ["update"],
		source: ["source", "update"],
		target: ["target", "update"],
		router: ["update"],
		connector: ["update"],
		labels: ["labels"],
		defaultLabel: ["labels"],
		tools: ["tools"],
		vertices: ["vertices", "update"]
	}
});
EdgeView.registry.register("edge", EdgeView, true);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/view.js
var __decorate$22 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GraphView = class GraphView extends View {
	/** Graph's `this.container` is from outer, should not dispose */
	get disposeContainer() {
		return false;
	}
	get options() {
		return this.graph.options;
	}
	constructor(graph) {
		super();
		this.graph = graph;
		const { selectors, fragment } = Markup.parseJSONMarkup(GraphView.markup);
		this.background = selectors.background;
		this.grid = selectors.grid;
		this.svg = selectors.svg;
		this.defs = selectors.defs;
		this.viewport = selectors.viewport;
		this.primer = selectors.primer;
		this.stage = selectors.stage;
		this.decorator = selectors.decorator;
		this.overlay = selectors.overlay;
		this.container = this.options.container;
		this.restore = GraphView.snapshoot(this.container);
		addClass(this.container, this.prefixClassName("graph"));
		append(this.container, fragment);
		this.delegateEvents();
	}
	delegateEvents() {
		const ctor = this.constructor;
		super.delegateEvents(ctor.events);
		return this;
	}
	/**
	* Guard the specified event. If the event is not interesting, it
	* returns `true`, otherwise returns `false`.
	*/
	guard(e, view) {
		if (e.type === "mousedown" && e.button === 2) return true;
		if (this.options.guard && this.options.guard(e, view)) return true;
		if (e.data && e.data.guarded !== void 0) return e.data.guarded;
		if (view && view.cell && Cell.isCell(view.cell)) return false;
		if (this.svg === e.target || this.container === e.target || this.svg.contains(e.target)) return false;
		return true;
	}
	findView(elem) {
		return this.graph.findViewByElem(elem);
	}
	onDblClick(evt) {
		if (this.options.preventDefaultDblClick) evt.preventDefault();
		const e = this.normalizeEvent(evt);
		const view = this.findView(e.target);
		if (this.guard(e, view)) return;
		const localPoint = this.graph.snapToGrid(e.clientX, e.clientY);
		if (view) view.onDblClick(e, localPoint.x, localPoint.y);
		else this.graph.trigger("blank:dblclick", {
			e,
			x: localPoint.x,
			y: localPoint.y
		});
	}
	onClick(evt) {
		if (this.getMouseMovedCount(evt) <= this.options.clickThreshold) {
			const e = this.normalizeEvent(evt);
			const view = this.findView(e.target);
			if (this.guard(e, view)) return;
			const localPoint = this.graph.snapToGrid(e.clientX, e.clientY);
			if (view) view.onClick(e, localPoint.x, localPoint.y);
			else this.graph.trigger("blank:click", {
				e,
				x: localPoint.x,
				y: localPoint.y
			});
		}
	}
	isPreventDefaultContextMenu(view) {
		let preventDefaultContextMenu = this.options.preventDefaultContextMenu;
		if (typeof preventDefaultContextMenu === "function") preventDefaultContextMenu = call$1(preventDefaultContextMenu, this.graph, { view });
		return preventDefaultContextMenu;
	}
	onContextMenu(evt) {
		const e = this.normalizeEvent(evt);
		const view = this.findView(e.target);
		if (this.isPreventDefaultContextMenu(view)) evt.preventDefault();
		if (this.guard(e, view)) return;
		const localPoint = this.graph.snapToGrid(e.clientX, e.clientY);
		if (view) view.onContextMenu(e, localPoint.x, localPoint.y);
		else this.graph.trigger("blank:contextmenu", {
			e,
			x: localPoint.x,
			y: localPoint.y
		});
	}
	delegateDragEvents(e, view) {
		if (e.data == null) e.data = {};
		this.setEventData(e, {
			currentView: view || null,
			mouseMovedCount: 0,
			startPosition: {
				x: e.clientX,
				y: e.clientY
			}
		});
		const ctor = this.constructor;
		this.delegateDocumentEvents(ctor.documentEvents, e.data);
		this.undelegateEvents();
	}
	getMouseMovedCount(e) {
		return this.getEventData(e).mouseMovedCount || 0;
	}
	onMouseDown(evt) {
		const e = this.normalizeEvent(evt);
		const view = this.findView(e.target);
		if (this.guard(e, view)) return;
		if (this.options.preventDefaultMouseDown) evt.preventDefault();
		const localPoint = this.graph.snapToGrid(e.clientX, e.clientY);
		if (view) view.onMouseDown(e, localPoint.x, localPoint.y);
		else {
			if (this.options.preventDefaultBlankAction && ["touchstart"].includes(e.type)) evt.preventDefault();
			this.graph.trigger("blank:mousedown", {
				e,
				x: localPoint.x,
				y: localPoint.y
			});
		}
		this.delegateDragEvents(e, view);
	}
	onMouseMove(evt) {
		const data = this.getEventData(evt);
		const startPosition = data.startPosition;
		if (startPosition && startPosition.x === evt.clientX && startPosition.y === evt.clientY) return;
		if (data.mouseMovedCount == null) data.mouseMovedCount = 0;
		data.mouseMovedCount += 1;
		if (data.mouseMovedCount <= this.options.moveThreshold) return;
		const e = this.normalizeEvent(evt);
		const localPoint = this.graph.snapToGrid(e.clientX, e.clientY);
		const view = data.currentView;
		if (view) view.onMouseMove(e, localPoint.x, localPoint.y);
		else this.graph.trigger("blank:mousemove", {
			e,
			x: localPoint.x,
			y: localPoint.y
		});
		this.setEventData(e, data);
	}
	onMouseUp(e) {
		this.undelegateDocumentEvents();
		const normalized = this.normalizeEvent(e);
		const localPoint = this.graph.snapToGrid(normalized.clientX, normalized.clientY);
		const view = this.getEventData(e).currentView;
		if (view) view.onMouseUp(normalized, localPoint.x, localPoint.y);
		else this.graph.trigger("blank:mouseup", {
			e: normalized,
			x: localPoint.x,
			y: localPoint.y
		});
		if (!e.isPropagationStopped()) {
			const ev = new EventObject(e, {
				type: "click",
				data: e.data
			});
			this.onClick(ev);
		}
		e.stopImmediatePropagation();
		this.delegateEvents();
	}
	onMouseOver(evt) {
		const e = this.normalizeEvent(evt);
		const view = this.findView(e.target);
		if (this.guard(e, view)) return;
		if (view) view.onMouseOver(e);
		else {
			if (this.container === e.target) return;
			this.graph.trigger("blank:mouseover", { e });
		}
	}
	onMouseOut(evt) {
		const e = this.normalizeEvent(evt);
		const view = this.findView(e.target);
		if (this.guard(e, view)) return;
		if (view) view.onMouseOut(e);
		else {
			if (this.container === e.target) return;
			this.graph.trigger("blank:mouseout", { e });
		}
	}
	onMouseEnter(evt) {
		const e = this.normalizeEvent(evt);
		const view = this.findView(e.target);
		if (this.guard(e, view)) return;
		const relatedView = this.graph.findViewByElem(e.relatedTarget);
		if (view) {
			if (relatedView === view) return;
			view.onMouseEnter(e);
		} else {
			if (relatedView) return;
			this.graph.trigger("graph:mouseenter", { e });
		}
	}
	onMouseLeave(evt) {
		const e = this.normalizeEvent(evt);
		const view = this.findView(e.target);
		if (this.guard(e, view)) return;
		const relatedView = this.graph.findViewByElem(e.relatedTarget);
		if (view) {
			if (relatedView === view) return;
			view.onMouseLeave(e);
		} else {
			if (relatedView) return;
			this.graph.trigger("graph:mouseleave", { e });
		}
	}
	onMouseWheel(evt) {
		const e = this.normalizeEvent(evt);
		const view = this.findView(e.target);
		if (this.guard(e, view)) return;
		const originalEvent = e.originalEvent;
		const localPoint = this.graph.snapToGrid(originalEvent.clientX, originalEvent.clientY);
		const delta = Math.max(-1, Math.min(1, originalEvent.wheelDelta || -originalEvent.detail));
		if (view) view.onMouseWheel(e, localPoint.x, localPoint.y, delta);
		else this.graph.trigger("blank:mousewheel", {
			e,
			delta,
			x: localPoint.x,
			y: localPoint.y
		});
	}
	onCustomEvent(evt) {
		const elem = evt.currentTarget;
		const event = elem.getAttribute("event") || elem.getAttribute("data-event");
		if (event) {
			const view = this.findView(elem);
			if (view) {
				const e = this.normalizeEvent(evt);
				if (this.guard(e, view)) return;
				const localPoint = this.graph.snapToGrid(e.clientX, e.clientY);
				view.onCustomEvent(e, event, localPoint.x, localPoint.y);
			}
		}
	}
	handleMagnetEvent(evt, handler) {
		const magnetElem = evt.currentTarget;
		const magnetValue = magnetElem.getAttribute("magnet");
		if (magnetValue && magnetValue.toLowerCase() !== "false") {
			const view = this.findView(magnetElem);
			if (view) {
				const e = this.normalizeEvent(evt);
				if (this.guard(e, view)) return;
				const localPoint = this.graph.snapToGrid(e.clientX, e.clientY);
				call$1(handler, this.graph, view, e, magnetElem, localPoint.x, localPoint.y);
			}
		}
	}
	onMagnetMouseDown(e) {
		this.handleMagnetEvent(e, (view, e, magnet, x, y) => {
			view.onMagnetMouseDown(e, magnet, x, y);
		});
	}
	onMagnetDblClick(e) {
		this.handleMagnetEvent(e, (view, e, magnet, x, y) => {
			view.onMagnetDblClick(e, magnet, x, y);
		});
	}
	onMagnetContextMenu(e) {
		const view = this.findView(e.target);
		if (this.isPreventDefaultContextMenu(view)) e.preventDefault();
		this.handleMagnetEvent(e, (view, e, magnet, x, y) => {
			view.onMagnetContextMenu(e, magnet, x, y);
		});
	}
	onLabelMouseDown(evt) {
		const labelNode = evt.currentTarget;
		const view = this.findView(labelNode);
		if (view) {
			const e = this.normalizeEvent(evt);
			if (this.guard(e, view)) return;
			const localPoint = this.graph.snapToGrid(e.clientX, e.clientY);
			view.onLabelMouseDown(e, localPoint.x, localPoint.y);
		}
	}
	onImageDragStart() {
		return false;
	}
	dispose() {
		this.undelegateEvents();
		this.undelegateDocumentEvents();
		this.restore();
		this.restore = () => {};
	}
};
__decorate$22([View.dispose()], GraphView.prototype, "dispose", null);
(function(GraphView) {
	const prefixCls = `${Config.prefixCls}-graph`;
	GraphView.markup = [
		{
			ns: ns.xhtml,
			tagName: "div",
			selector: "background",
			className: `${prefixCls}-background`
		},
		{
			ns: ns.xhtml,
			tagName: "div",
			selector: "grid",
			className: `${prefixCls}-grid`
		},
		{
			ns: ns.svg,
			tagName: "svg",
			selector: "svg",
			className: `${prefixCls}-svg`,
			attrs: {
				width: "100%",
				height: "100%",
				"xmlns:xlink": ns.xlink
			},
			children: [{
				tagName: "defs",
				selector: "defs"
			}, {
				tagName: "g",
				selector: "viewport",
				className: `${prefixCls}-svg-viewport`,
				children: [
					{
						tagName: "g",
						selector: "primer",
						className: `${prefixCls}-svg-primer`
					},
					{
						tagName: "g",
						selector: "stage",
						className: `${prefixCls}-svg-stage`
					},
					{
						tagName: "g",
						selector: "decorator",
						className: `${prefixCls}-svg-decorator`
					},
					{
						tagName: "g",
						selector: "overlay",
						className: `${prefixCls}-svg-overlay`
					}
				]
			}]
		}
	];
	function snapshoot(elem) {
		const cloned = elem.cloneNode();
		elem.childNodes.forEach((child) => cloned.appendChild(child));
		return () => {
			empty(elem);
			while (elem.attributes.length > 0) elem.removeAttribute(elem.attributes[0].name);
			for (let i = 0, l = cloned.attributes.length; i < l; i += 1) {
				const attr = cloned.attributes[i];
				elem.setAttribute(attr.name, attr.value);
			}
			cloned.childNodes.forEach((child) => elem.appendChild(child));
		};
	}
	GraphView.snapshoot = snapshoot;
})(GraphView || (GraphView = {}));
(function(GraphView) {
	const prefixCls = Config.prefixCls;
	GraphView.events = {
		dblclick: "onDblClick",
		contextmenu: "onContextMenu",
		touchstart: "onMouseDown",
		mousedown: "onMouseDown",
		mouseover: "onMouseOver",
		mouseout: "onMouseOut",
		mouseenter: "onMouseEnter",
		mouseleave: "onMouseLeave",
		mousewheel: "onMouseWheel",
		DOMMouseScroll: "onMouseWheel",
		[`mouseenter  .${prefixCls}-cell`]: "onMouseEnter",
		[`mouseleave  .${prefixCls}-cell`]: "onMouseLeave",
		[`mouseenter  .${prefixCls}-cell-tools`]: "onMouseEnter",
		[`mouseleave  .${prefixCls}-cell-tools`]: "onMouseLeave",
		[`mousedown   .${prefixCls}-cell [event]`]: "onCustomEvent",
		[`touchstart  .${prefixCls}-cell [event]`]: "onCustomEvent",
		[`mousedown   .${prefixCls}-cell [data-event]`]: "onCustomEvent",
		[`touchstart  .${prefixCls}-cell [data-event]`]: "onCustomEvent",
		[`dblclick    .${prefixCls}-cell [magnet]`]: "onMagnetDblClick",
		[`contextmenu .${prefixCls}-cell [magnet]`]: "onMagnetContextMenu",
		[`mousedown   .${prefixCls}-cell [magnet]`]: "onMagnetMouseDown",
		[`touchstart  .${prefixCls}-cell [magnet]`]: "onMagnetMouseDown",
		[`dblclick    .${prefixCls}-cell [data-magnet]`]: "onMagnetDblClick",
		[`contextmenu .${prefixCls}-cell [data-magnet]`]: "onMagnetContextMenu",
		[`mousedown   .${prefixCls}-cell [data-magnet]`]: "onMagnetMouseDown",
		[`touchstart  .${prefixCls}-cell [data-magnet]`]: "onMagnetMouseDown",
		[`dragstart   .${prefixCls}-cell image`]: "onImageDragStart",
		[`mousedown   .${prefixCls}-edge .${prefixCls}-edge-label`]: "onLabelMouseDown",
		[`touchstart  .${prefixCls}-edge .${prefixCls}-edge-label`]: "onLabelMouseDown"
	};
	GraphView.documentEvents = {
		mousemove: "onMouseMove",
		touchmove: "onMouseMove",
		mouseup: "onMouseUp",
		touchend: "onMouseUp",
		touchcancel: "onMouseUp"
	};
})(GraphView || (GraphView = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/style/raw.js
/**
* Auto generated file, do not modify it!
*/
var content$3 = `.x6-graph {
  position: relative;
  overflow: hidden;
  outline: none;
  touch-action: none;
}
.x6-graph-background,
.x6-graph-grid,
.x6-graph-svg {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}
.x6-graph-background-stage,
.x6-graph-grid-stage,
.x6-graph-svg-stage {
  user-select: none;
}
.x6-graph.x6-graph-pannable {
  cursor: grab;
  cursor: -moz-grab;
  cursor: -webkit-grab;
}
.x6-graph.x6-graph-panning {
  cursor: grabbing;
  cursor: -moz-grabbing;
  cursor: -webkit-grabbing;
  user-select: none;
}
.x6-node {
  cursor: move;
  /* stylelint-disable-next-line */
}
.x6-node.x6-node-immovable {
  cursor: default;
}
.x6-node * {
  -webkit-user-drag: none;
}
.x6-node .scalable * {
  vector-effect: non-scaling-stroke;
}
.x6-node [magnet='true'] {
  cursor: crosshair;
  transition: opacity 0.3s;
}
.x6-node [magnet='true']:hover {
  opacity: 0.7;
}
.x6-node foreignObject {
  display: block;
  overflow: visible;
  background-color: transparent;
}
.x6-node foreignObject > body {
  position: static;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: visible;
  background-color: transparent;
}
.x6-edge .source-marker,
.x6-edge .target-marker {
  vector-effect: non-scaling-stroke;
}
.x6-edge .connection {
  stroke-linejoin: round;
  fill: none;
}
.x6-edge .connection-wrap {
  cursor: move;
  opacity: 0;
  fill: none;
  stroke: #000;
  stroke-width: 15;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.x6-edge .connection-wrap:hover {
  opacity: 0.4;
  stroke-opacity: 0.4;
}
.x6-edge .vertices {
  cursor: move;
  opacity: 0;
}
.x6-edge .vertices .vertex {
  fill: #1abc9c;
}
.x6-edge .vertices .vertex :hover {
  fill: #34495e;
  stroke: none;
}
.x6-edge .vertices .vertex-remove {
  cursor: pointer;
  fill: #fff;
}
.x6-edge .vertices .vertex-remove-area {
  cursor: pointer;
  opacity: 0.1;
}
.x6-edge .vertices .vertex-group:hover .vertex-remove-area {
  opacity: 1;
}
.x6-edge .arrowheads {
  cursor: move;
  opacity: 0;
}
.x6-edge .arrowheads .arrowhead {
  fill: #1abc9c;
}
.x6-edge .arrowheads .arrowhead :hover {
  fill: #f39c12;
  stroke: none;
}
.x6-edge .tools {
  cursor: pointer;
  opacity: 0;
}
.x6-edge .tools .tool-options {
  display: none;
}
.x6-edge .tools .tool-remove circle {
  fill: #f00;
}
.x6-edge .tools .tool-remove path {
  fill: #fff;
}
.x6-edge:hover .vertices,
.x6-edge:hover .arrowheads,
.x6-edge:hover .tools {
  opacity: 1;
}
.x6-highlight-opacity {
  opacity: 0.3;
}
.x6-cell-tool-editor {
  position: relative;
  display: inline-block;
  min-height: 1em;
  margin: 0;
  padding: 0;
  line-height: 1;
  white-space: normal;
  text-align: center;
  vertical-align: top;
  overflow-wrap: normal;
  outline: none;
  transform-origin: 0 0;
  -webkit-user-drag: none;
}
.x6-edge-tool-editor {
  border: 1px solid #275fc5;
  border-radius: 2px;
}
`;
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/base.js
var Base = class extends Disposable {
	get options() {
		return this.graph.options;
	}
	get model() {
		return this.graph.model;
	}
	get view() {
		return this.graph.view;
	}
	constructor(graph) {
		super();
		this.graph = graph;
		this.init();
	}
	init() {}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/css.js
var __decorate$21 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CSSManager = class extends Base {
	init() {
		if (Config.autoInsertCSS) ensure("core", content$3);
	}
	dispose() {
		clean("core");
	}
};
__decorate$21([CSSManager.dispose()], CSSManager.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/options.js
var __rest$6 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var Options;
(function(Options) {
	function get(options) {
		const { grid, panning, mousewheel, embedding } = options, others = __rest$6(options, [
			"grid",
			"panning",
			"mousewheel",
			"embedding"
		]);
		const container = options.container;
		if (container != null) {
			if (others.width == null) others.width = container.clientWidth;
			if (others.height == null) others.height = container.clientHeight;
		} else throw new Error(`Ensure the container of the graph is specified and valid`);
		const result = merge({}, Options.defaults, others);
		const defaultGrid = {
			size: 10,
			visible: false
		};
		if (typeof grid === "number") result.grid = {
			size: grid,
			visible: false
		};
		else if (typeof grid === "boolean") result.grid = Object.assign(Object.assign({}, defaultGrid), { visible: grid });
		else result.grid = Object.assign(Object.assign({}, defaultGrid), grid);
		[
			"panning",
			"mousewheel",
			"embedding"
		].forEach((key) => {
			const val = options[key];
			if (typeof val === "boolean") result[key].enabled = val;
			else result[key] = Object.assign(Object.assign({}, result[key]), val);
		});
		return result;
	}
	Options.get = get;
})(Options || (Options = {}));
(function(Options) {
	Options.defaults = {
		x: 0,
		y: 0,
		scaling: {
			min: .01,
			max: 16
		},
		grid: {
			size: 10,
			visible: false
		},
		background: false,
		panning: {
			enabled: false,
			eventTypes: ["leftMouseDown"]
		},
		mousewheel: {
			enabled: false,
			factor: 1.2,
			zoomAtMousePosition: true
		},
		highlighting: {
			default: {
				name: "stroke",
				args: { padding: 3 }
			},
			nodeAvailable: {
				name: "className",
				args: { className: Config.prefix("available-node") }
			},
			magnetAvailable: {
				name: "className",
				args: { className: Config.prefix("available-magnet") }
			}
		},
		connecting: {
			snap: false,
			allowLoop: true,
			allowNode: true,
			allowEdge: false,
			allowPort: true,
			allowBlank: true,
			allowMulti: true,
			highlight: false,
			anchor: "center",
			edgeAnchor: "ratio",
			connectionPoint: "boundary",
			router: "normal",
			connector: "normal",
			validateConnection({ type, sourceView, targetView }) {
				return (type === "target" ? targetView : sourceView) != null;
			},
			createEdge() {
				return new Edge();
			}
		},
		translating: { restrict: false },
		embedding: {
			enabled: false,
			findParent: "bbox",
			frontOnly: true,
			validate: () => true
		},
		moveThreshold: 0,
		clickThreshold: 0,
		magnetThreshold: 0,
		preventDefaultDblClick: true,
		preventDefaultMouseDown: false,
		preventDefaultContextMenu: true,
		preventDefaultBlankAction: true,
		interacting: { edgeLabelMovable: false },
		async: true,
		virtual: false,
		guard: () => false
	};
})(Options || (Options = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/grid.js
var __decorate$20 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest$5 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var GridManager = class extends Base {
	get elem() {
		return this.view.grid;
	}
	get grid() {
		return this.options.grid;
	}
	init() {
		this.startListening();
		this.draw(this.grid);
	}
	startListening() {
		this.graph.on("scale", this.update, this);
		this.graph.on("translate", this.update, this);
	}
	stopListening() {
		this.graph.off("scale", this.update, this);
		this.graph.off("translate", this.update, this);
	}
	setVisible(visible) {
		if (this.grid.visible !== visible) {
			this.grid.visible = visible;
			this.update();
		}
	}
	getGridSize() {
		return this.grid.size;
	}
	setGridSize(size) {
		this.grid.size = Math.max(size, 1);
		this.update();
	}
	show() {
		this.setVisible(true);
		this.update();
	}
	hide() {
		this.setVisible(false);
		this.update();
	}
	clear() {
		this.elem.style.backgroundImage = "";
	}
	draw(options) {
		this.clear();
		this.instance = null;
		Object.assign(this.grid, options);
		this.patterns = this.resolveGrid(options);
		this.update();
	}
	update(options = {}) {
		const gridSize = this.grid.size;
		if (gridSize <= 1 || !this.grid.visible) return this.clear();
		const ctm = this.graph.matrix();
		const grid = this.getInstance();
		const items = Array.isArray(options) ? options : [options];
		this.patterns.forEach((settings, index) => {
			const id = `pattern_${index}`;
			const sx = ctm.a || 1;
			const sy = ctm.d || 1;
			const { update, markup } = settings, others = __rest$5(settings, ["update", "markup"]);
			const options = Object.assign(Object.assign(Object.assign({}, others), items[index]), {
				sx,
				sy,
				ox: ctm.e || 0,
				oy: ctm.f || 0,
				width: gridSize * sx,
				height: gridSize * sy
			});
			if (!grid.has(id)) grid.add(id, Vector.create("pattern", {
				id,
				patternUnits: "userSpaceOnUse"
			}, Vector.createVectors(markup)).node);
			const patternElem = grid.get(id);
			if (typeof update === "function") update(patternElem.childNodes[0], options);
			let x = options.ox % options.width;
			if (x < 0) x += options.width;
			let y = options.oy % options.height;
			if (y < 0) y += options.height;
			attr(patternElem, {
				x,
				y,
				width: options.width,
				height: options.height
			});
		});
		const base64 = new XMLSerializer().serializeToString(grid.root);
		const url = `url(data:image/svg+xml;base64,${btoa(base64)})`;
		this.elem.style.backgroundImage = url;
	}
	getInstance() {
		if (!this.instance) this.instance = new Grid();
		return this.instance;
	}
	resolveGrid(options) {
		if (!options) return [];
		const type = options.type;
		if (type == null) return [Object.assign(Object.assign({}, Grid.presets.dot), options.args)];
		const items = Grid.registry.get(type);
		if (items) {
			let args = options.args || [];
			if (!Array.isArray(args)) args = [args];
			return Array.isArray(items) ? items.map((item, index) => Object.assign(Object.assign({}, item), args[index])) : [Object.assign(Object.assign({}, items), args[0])];
		}
		return Grid.registry.onNotFound(type);
	}
	dispose() {
		this.stopListening();
		this.clear();
	}
};
__decorate$20([Base.dispose()], GridManager.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/transform.js
var TransformManager = class extends Base {
	get container() {
		return this.graph.view.container;
	}
	get viewport() {
		return this.graph.view.viewport;
	}
	get stage() {
		return this.graph.view.stage;
	}
	init() {
		this.resize();
	}
	/**
	* Returns the current transformation matrix of the graph.
	*/
	getMatrix() {
		const transform = this.viewport.getAttribute("transform");
		if (transform !== this.viewportTransformString) {
			this.viewportMatrix = this.viewport.getCTM();
			this.viewportTransformString = transform;
		}
		return createSVGMatrix(this.viewportMatrix);
	}
	/**
	* Sets new transformation with the given `matrix`
	*/
	setMatrix(matrix) {
		const ctm = createSVGMatrix(matrix);
		ctm.a = Number.isFinite(ctm.a) ? ctm.a : 1;
		ctm.b = Number.isFinite(ctm.b) ? ctm.b : 0;
		ctm.c = Number.isFinite(ctm.c) ? ctm.c : 0;
		ctm.d = Number.isFinite(ctm.d) ? ctm.d : 1;
		ctm.e = Number.isFinite(ctm.e) ? ctm.e : 0;
		ctm.f = Number.isFinite(ctm.f) ? ctm.f : 0;
		const transform = matrixToTransformString(ctm);
		this.viewport.setAttribute("transform", transform);
		this.viewportMatrix = ctm;
		this.viewportTransformString = transform;
	}
	resize(width, height) {
		let w = width === void 0 ? this.options.width : width;
		let h = height === void 0 ? this.options.height : height;
		this.options.width = w;
		this.options.height = h;
		if (typeof w === "number") w = Math.round(w);
		if (typeof h === "number") h = Math.round(h);
		this.container.style.width = w == null ? "" : `${w}px`;
		this.container.style.height = h == null ? "" : `${h}px`;
		const size = this.getComputedSize();
		this.graph.trigger("resize", Object.assign({}, size));
		return this;
	}
	getComputedSize() {
		let w = this.options.width;
		let h = this.options.height;
		if (!isNumber(w)) w = this.container.clientWidth;
		if (!isNumber(h)) h = this.container.clientHeight;
		return {
			width: w,
			height: h
		};
	}
	getScale() {
		return matrixToScale(this.getMatrix());
	}
	scale(sx, sy = sx, ox = 0, oy = 0) {
		sx = this.clampScale(sx);
		sy = this.clampScale(sy);
		if (ox || oy) {
			const ts = this.getTranslation();
			const tx = ts.tx - ox * (sx - 1);
			const ty = ts.ty - oy * (sy - 1);
			if (tx !== ts.tx || ty !== ts.ty) this.translate(tx, ty);
		}
		const matrix = this.getMatrix();
		const nextSX = Number.isFinite(sx) ? sx : 1;
		const nextSY = Number.isFinite(sy) ? sy : 1;
		matrix.a = nextSX;
		matrix.d = nextSY;
		this.setMatrix(matrix);
		this.graph.trigger("scale", {
			sx: nextSX,
			sy: nextSY,
			ox,
			oy
		});
		return this;
	}
	clampScale(scale) {
		const range = this.graph.options.scaling;
		return clamp(scale, range.min || .01, range.max || 16);
	}
	getZoom() {
		return this.getScale().sx;
	}
	zoom(factor, options) {
		options = options || {};
		let sx = factor;
		let sy = factor;
		const scale = this.getScale();
		const clientSize = this.getComputedSize();
		let cx = clientSize.width / 2;
		let cy = clientSize.height / 2;
		if (!options.absolute) {
			sx += scale.sx;
			sy += scale.sy;
		}
		if (options.scaleGrid) {
			sx = Math.round(sx / options.scaleGrid) * options.scaleGrid;
			sy = Math.round(sy / options.scaleGrid) * options.scaleGrid;
		}
		if (options.maxScale) {
			sx = Math.min(options.maxScale, sx);
			sy = Math.min(options.maxScale, sy);
		}
		if (options.minScale) {
			sx = Math.max(options.minScale, sx);
			sy = Math.max(options.minScale, sy);
		}
		if (options.center) {
			cx = options.center.x;
			cy = options.center.y;
		}
		sx = this.clampScale(sx);
		sy = this.clampScale(sy);
		sx = Number.isFinite(sx) ? sx : scale.sx;
		sy = Number.isFinite(sy) ? sy : scale.sy;
		if (cx || cy) {
			const ts = this.getTranslation();
			const denomX = scale.sx === 0 ? 1 : scale.sx;
			const denomY = scale.sy === 0 ? 1 : scale.sy;
			const tx = cx - (cx - ts.tx) * (sx / denomX);
			const ty = cy - (cy - ts.ty) * (sy / denomY);
			if (tx !== ts.tx || ty !== ts.ty) this.translate(tx, ty);
		}
		this.scale(sx, sy);
		return this;
	}
	getRotation() {
		return matrixToRotation(this.getMatrix());
	}
	rotate(angle, cx, cy) {
		if (cx == null || cy == null) {
			const bbox = Util$2.getBBox(this.stage);
			cx = bbox.width / 2;
			cy = bbox.height / 2;
		}
		const ctm = this.getMatrix().translate(cx, cy).rotate(angle).translate(-cx, -cy);
		this.setMatrix(ctm);
		return this;
	}
	getTranslation() {
		return matrixToTranslation(this.getMatrix());
	}
	translate(tx, ty) {
		const matrix = this.getMatrix();
		matrix.e = Number.isFinite(tx) ? tx : 0;
		matrix.f = Number.isFinite(ty) ? ty : 0;
		this.setMatrix(matrix);
		const ts = this.getTranslation();
		this.options.x = ts.tx;
		this.options.y = ts.ty;
		this.graph.trigger("translate", Object.assign({}, ts));
		return this;
	}
	setOrigin(ox, oy) {
		return this.translate(ox || 0, oy || 0);
	}
	fitToContent(gridWidth, gridHeight, padding, options) {
		if (typeof gridWidth === "object") {
			const opts = gridWidth;
			gridWidth = opts.gridWidth || 1;
			gridHeight = opts.gridHeight || 1;
			padding = opts.padding || 0;
			options = opts;
		} else {
			gridWidth = gridWidth || 1;
			gridHeight = gridHeight || 1;
			padding = padding || 0;
			if (options == null) options = {};
		}
		const paddings = normalizeSides(padding);
		const border = options.border || 0;
		const contentArea = options.contentArea ? Rectangle.create(options.contentArea) : this.getContentArea(options);
		if (border > 0) contentArea.inflate(border);
		const scale = this.getScale();
		const translate = this.getTranslation();
		const sx = scale.sx;
		const sy = scale.sy;
		contentArea.x *= sx;
		contentArea.y *= sy;
		contentArea.width *= sx;
		contentArea.height *= sy;
		let width = Math.max(Math.ceil((contentArea.width + contentArea.x) / gridWidth), 1) * gridWidth;
		let height = Math.max(Math.ceil((contentArea.height + contentArea.y) / gridHeight), 1) * gridHeight;
		let tx = 0;
		let ty = 0;
		if (options.allowNewOrigin === "negative" && contentArea.x < 0 || options.allowNewOrigin === "positive" && contentArea.x >= 0 || options.allowNewOrigin === "any") {
			tx = Math.ceil(-contentArea.x / gridWidth) * gridWidth;
			tx += paddings.left;
			width += tx;
		}
		if (options.allowNewOrigin === "negative" && contentArea.y < 0 || options.allowNewOrigin === "positive" && contentArea.y >= 0 || options.allowNewOrigin === "any") {
			ty = Math.ceil(-contentArea.y / gridHeight) * gridHeight;
			ty += paddings.top;
			height += ty;
		}
		width += paddings.right;
		height += paddings.bottom;
		width = Math.max(width, options.minWidth || 0);
		height = Math.max(height, options.minHeight || 0);
		width = Math.min(width, options.maxWidth || Number.MAX_SAFE_INTEGER);
		height = Math.min(height, options.maxHeight || Number.MAX_SAFE_INTEGER);
		const size = this.getComputedSize();
		const sizeChanged = width !== size.width || height !== size.height;
		if (tx !== translate.tx || ty !== translate.ty) this.translate(tx, ty);
		if (sizeChanged) this.resize(width, height);
		return new Rectangle(-tx / sx, -ty / sy, width / sx, height / sy);
	}
	scaleContentToFit(options = {}) {
		this.scaleContentToFitImpl(options);
	}
	scaleContentToFitImpl(options = {}, translate = true) {
		let contentBBox;
		let contentLocalOrigin;
		if (options.contentArea) {
			const contentArea = options.contentArea;
			contentBBox = this.graph.localToGraph(contentArea);
			contentLocalOrigin = Point.create(contentArea);
		} else {
			contentBBox = this.getContentBBox(options);
			contentLocalOrigin = this.graph.graphToLocal(contentBBox);
		}
		if (!contentBBox.width || !contentBBox.height) return;
		const padding = normalizeSides(options.padding);
		const minScale = options.minScale || 0;
		const maxScale = options.maxScale || Number.MAX_SAFE_INTEGER;
		const minScaleX = options.minScaleX || minScale;
		const maxScaleX = options.maxScaleX || maxScale;
		const minScaleY = options.minScaleY || minScale;
		const maxScaleY = options.maxScaleY || maxScale;
		let fittingBox;
		if (options.viewportArea) fittingBox = options.viewportArea;
		else {
			const computedSize = this.getComputedSize();
			const currentTranslate = this.getTranslation();
			fittingBox = {
				x: currentTranslate.tx,
				y: currentTranslate.ty,
				width: computedSize.width,
				height: computedSize.height
			};
		}
		fittingBox = Rectangle.create(fittingBox).moveAndExpand({
			x: padding.left,
			y: padding.top,
			width: -padding.left - padding.right,
			height: -padding.top - padding.bottom
		});
		const currentScale = this.getScale();
		let newSX = fittingBox.width / contentBBox.width * currentScale.sx;
		let newSY = fittingBox.height / contentBBox.height * currentScale.sy;
		if (options.preserveAspectRatio !== false) newSX = newSY = Math.min(newSX, newSY);
		const gridSize = options.scaleGrid;
		if (gridSize) {
			newSX = gridSize * Math.floor(newSX / gridSize);
			newSY = gridSize * Math.floor(newSY / gridSize);
		}
		newSX = clamp(newSX, minScaleX, maxScaleX);
		newSY = clamp(newSY, minScaleY, maxScaleY);
		this.scale(newSX, newSY);
		if (translate) {
			const origin = this.options;
			const newOX = fittingBox.x - contentLocalOrigin.x * newSX - origin.x;
			const newOY = fittingBox.y - contentLocalOrigin.y * newSY - origin.y;
			this.translate(newOX, newOY);
		}
	}
	getContentArea(options = {}) {
		if (options.useCellGeometry !== false) return this.model.getAllCellsBBox() || new Rectangle();
		return Util$2.getBBox(this.stage);
	}
	getContentBBox(options = {}) {
		return this.graph.localToGraph(this.getContentArea(options));
	}
	getGraphArea() {
		const rect = Rectangle.fromSize(this.getComputedSize());
		return this.graph.graphToLocal(rect);
	}
	zoomToRect(rect, options = {}) {
		const area = Rectangle.create(rect);
		const graph = this.graph;
		options.contentArea = area;
		if (options.viewportArea == null) options.viewportArea = {
			x: graph.options.x,
			y: graph.options.y,
			width: this.options.width,
			height: this.options.height
		};
		this.scaleContentToFitImpl(options, false);
		const center = area.getCenter();
		this.centerPoint(center.x, center.y);
		return this;
	}
	zoomToFit(options = {}) {
		return this.zoomToRect(this.getContentArea(options), options);
	}
	centerPoint(x, y) {
		const clientSize = this.getComputedSize();
		const scale = this.getScale();
		const ts = this.getTranslation();
		const cx = clientSize.width / 2;
		const cy = clientSize.height / 2;
		x = typeof x === "number" ? x : cx;
		y = typeof y === "number" ? y : cy;
		x = cx - x * scale.sx;
		y = cy - y * scale.sy;
		if (ts.tx !== x || ts.ty !== y) this.translate(x, y);
	}
	centerContent(options) {
		const center = this.graph.getContentArea(options).getCenter();
		this.centerPoint(center.x, center.y);
	}
	centerCell(cell) {
		return this.positionCell(cell, "center");
	}
	positionPoint(point, x, y) {
		const clientSize = this.getComputedSize();
		x = normalizePercentage(x, Math.max(0, clientSize.width));
		if (x < 0) x = clientSize.width + x;
		y = normalizePercentage(y, Math.max(0, clientSize.height));
		if (y < 0) y = clientSize.height + y;
		const ts = this.getTranslation();
		const scale = this.getScale();
		const dx = x - point.x * scale.sx;
		const dy = y - point.y * scale.sy;
		if (ts.tx !== dx || ts.ty !== dy) this.translate(dx, dy);
	}
	positionRect(rect, pos) {
		const bbox = Rectangle.create(rect);
		switch (pos) {
			case "center": return this.positionPoint(bbox.getCenter(), "50%", "50%");
			case "top": return this.positionPoint(bbox.getTopCenter(), "50%", 0);
			case "top-right": return this.positionPoint(bbox.getTopRight(), "100%", 0);
			case "right": return this.positionPoint(bbox.getRightMiddle(), "100%", "50%");
			case "bottom-right": return this.positionPoint(bbox.getBottomRight(), "100%", "100%");
			case "bottom": return this.positionPoint(bbox.getBottomCenter(), "50%", "100%");
			case "bottom-left": return this.positionPoint(bbox.getBottomLeft(), 0, "100%");
			case "left": return this.positionPoint(bbox.getLeftMiddle(), 0, "50%");
			case "top-left": return this.positionPoint(bbox.getTopLeft(), 0, 0);
			default: return this;
		}
	}
	positionCell(cell, pos) {
		const bbox = cell.getBBox();
		return this.positionRect(bbox, pos);
	}
	positionContent(pos, options) {
		const rect = this.graph.getContentArea(options);
		return this.positionRect(rect, pos);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/background.js
var __decorate$19 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var BackgroundManager = class extends Base {
	get elem() {
		return this.view.background;
	}
	init() {
		this.startListening();
		if (this.options.background) this.draw(this.options.background);
	}
	startListening() {
		this.graph.on("scale", this.update, this);
		this.graph.on("translate", this.update, this);
	}
	stopListening() {
		this.graph.off("scale", this.update, this);
		this.graph.off("translate", this.update, this);
	}
	updateBackgroundImage(options = {}) {
		let backgroundSize = options.size || "auto auto";
		let backgroundPosition = options.position || "center";
		const scale = this.graph.transform.getScale();
		const ts = this.graph.translate();
		if (typeof backgroundPosition === "object") backgroundPosition = `${ts.tx + scale.sx * (backgroundPosition.x || 0)}px ${ts.ty + scale.sy * (backgroundPosition.y || 0)}px`;
		if (typeof backgroundSize === "object") {
			backgroundSize = Rectangle.fromSize(backgroundSize).scale(scale.sx, scale.sy);
			backgroundSize = `${backgroundSize.width}px ${backgroundSize.height}px`;
		}
		this.elem.style.backgroundSize = backgroundSize;
		this.elem.style.backgroundPosition = backgroundPosition;
	}
	drawBackgroundImage(img, options = {}) {
		if (!(img instanceof HTMLImageElement)) {
			this.elem.style.backgroundImage = "";
			return;
		}
		const cache = this.optionsCache;
		if (cache && cache.image !== options.image) return;
		let uri;
		const opacity = options.opacity;
		const backgroundSize = options.size;
		let backgroundRepeat = options.repeat || "no-repeat";
		const pattern = Background.registry.get(backgroundRepeat);
		if (typeof pattern === "function") {
			const quality = options.quality || 1;
			img.width *= quality;
			img.height *= quality;
			const canvas = pattern(img, options);
			if (!(canvas instanceof HTMLCanvasElement)) throw new Error("Background pattern must return an HTML Canvas instance");
			uri = canvas.toDataURL("image/png");
			if (options.repeat && backgroundRepeat !== options.repeat) backgroundRepeat = options.repeat;
			else backgroundRepeat = "repeat";
			if (typeof backgroundSize === "object") {
				backgroundSize.width *= canvas.width / img.width;
				backgroundSize.height *= canvas.height / img.height;
			} else if (backgroundSize === void 0) options.size = {
				width: canvas.width / quality,
				height: canvas.height / quality
			};
		} else {
			uri = img.src;
			if (backgroundSize === void 0) options.size = {
				width: img.width,
				height: img.height
			};
		}
		if (cache != null && typeof options.size === "object" && options.image === cache.image && options.repeat === cache.repeat && options.quality === cache.quality) cache.size = clone(options.size);
		const style = this.elem.style;
		style.backgroundImage = `url(${uri})`;
		style.backgroundRepeat = backgroundRepeat;
		style.opacity = opacity == null || opacity >= 1 ? "" : `${opacity}`;
		this.updateBackgroundImage(options);
	}
	updateBackgroundColor(color) {
		this.elem.style.backgroundColor = color || "";
	}
	updateBackgroundOptions(options) {
		this.graph.options.background = options;
	}
	update() {
		if (this.optionsCache) this.updateBackgroundImage(this.optionsCache);
	}
	draw(options) {
		const opts = options || {};
		this.updateBackgroundOptions(options);
		this.updateBackgroundColor(opts.color);
		if (opts.image) {
			this.optionsCache = clone(opts);
			const img = document.createElement("img");
			img.onload = () => this.drawBackgroundImage(img, options);
			img.setAttribute("crossorigin", "anonymous");
			img.src = opts.image;
		} else {
			this.drawBackgroundImage(null);
			this.optionsCache = null;
		}
	}
	clear() {
		this.draw();
	}
	dispose() {
		this.clear();
		this.stopListening();
	}
};
__decorate$19([Base.dispose()], BackgroundManager.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/panning.js
var __decorate$18 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PanningManager = class extends Base {
	get widgetOptions() {
		return this.options.panning;
	}
	get pannable() {
		return this.widgetOptions && this.widgetOptions.enabled === true;
	}
	init() {
		this.onRightMouseDown = this.onRightMouseDown.bind(this);
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.startListening();
		this.updateClassName();
	}
	startListening() {
		this.graph.on("blank:mousedown", this.onMouseDown, this);
		this.graph.on("node:unhandled:mousedown", this.onMouseDown, this);
		this.graph.on("edge:unhandled:mousedown", this.onMouseDown, this);
		Event.on(this.graph.container, "mousedown", this.onRightMouseDown);
		Event.on(document.body, {
			keydown: this.onKeyDown,
			keyup: this.onKeyUp
		});
		this.mousewheelHandle = new MouseWheelHandle(this.graph.container, this.onMouseWheel.bind(this), this.allowMouseWheel.bind(this));
		this.mousewheelHandle.enable();
	}
	stopListening() {
		this.graph.off("blank:mousedown", this.onMouseDown, this);
		this.graph.off("node:unhandled:mousedown", this.onMouseDown, this);
		this.graph.off("edge:unhandled:mousedown", this.onMouseDown, this);
		Event.off(this.graph.container, "mousedown", this.onRightMouseDown);
		Event.off(document.body, {
			keydown: this.onKeyDown,
			keyup: this.onKeyUp
		});
		if (this.mousewheelHandle) this.mousewheelHandle.disable();
	}
	allowPanning(e, strict) {
		e.spaceKey = this.isSpaceKeyPressed;
		return this.pannable && ModifierKey.isMatch(e, this.widgetOptions.modifiers, strict);
	}
	startPanning(evt) {
		const e = this.view.normalizeEvent(evt);
		this.clientX = e.clientX;
		this.clientY = e.clientY;
		this.panning = true;
		this.updateClassName(evt);
		Event.on(document.body, {
			"mousemove.panning touchmove.panning": this.pan.bind(this),
			"mouseup.panning touchend.panning": this.stopPanning.bind(this),
			"mouseleave.panning": this.stopPanning.bind(this)
		});
		Event.on(window, "mouseup.panning", this.stopPanning.bind(this));
	}
	pan(evt) {
		const e = this.view.normalizeEvent(evt);
		const dx = e.clientX - this.clientX;
		const dy = e.clientY - this.clientY;
		this.clientX = e.clientX;
		this.clientY = e.clientY;
		this.graph.translateBy(dx, dy);
	}
	stopPanning(e) {
		this.panning = false;
		this.updateClassName(e);
		Event.off(document.body, ".panning");
		Event.off(window, ".panning");
	}
	updateClassName(e) {
		const eventTypes = this.widgetOptions.eventTypes;
		if ((eventTypes === null || eventTypes === void 0 ? void 0 : eventTypes.length) === 1 && eventTypes.includes("mouseWheel")) return;
		const container = this.view.container;
		const panning = this.view.prefixClassName("graph-panning");
		const pannable = this.view.prefixClassName("graph-pannable");
		const selection = this.graph.getPlugin("selection");
		const allowRubberband = selection && selection.allowRubberband(e, true);
		const allowRightMouseRubberband = (eventTypes === null || eventTypes === void 0 ? void 0 : eventTypes.includes("leftMouseDown")) && !allowRubberband;
		if (this.allowPanning(e !== null && e !== void 0 ? e : {}, true) || this.allowPanning(e !== null && e !== void 0 ? e : {}) && allowRightMouseRubberband) if (this.panning) {
			addClass(container, panning);
			removeClass(container, pannable);
		} else {
			removeClass(container, panning);
			addClass(container, pannable);
		}
		else if (!this.panning) {
			removeClass(container, panning);
			removeClass(container, pannable);
		}
	}
	onMouseDown({ e }) {
		if (!this.allowBlankMouseDown(e)) return;
		const selection = this.graph.getPlugin("selection");
		const allowRubberband = selection && selection.allowRubberband(e, true);
		if (this.allowPanning(e, true) || this.allowPanning(e) && !allowRubberband) this.startPanning(e);
	}
	onRightMouseDown(e) {
		const eventTypes = this.widgetOptions.eventTypes;
		if (!((eventTypes === null || eventTypes === void 0 ? void 0 : eventTypes.includes("rightMouseDown")) && e.button === 2)) return;
		if (this.allowPanning(e, true)) this.startPanning(e);
	}
	onMouseWheel(e, deltaX, deltaY) {
		this.graph.translateBy(-deltaX, -deltaY);
	}
	onKeyDown(e) {
		if (e.which === 32) this.isSpaceKeyPressed = true;
		this.updateClassName(e);
	}
	onKeyUp(e) {
		if (e.which === 32) this.isSpaceKeyPressed = false;
		this.updateClassName(e);
	}
	allowBlankMouseDown(e) {
		const eventTypes = this.widgetOptions.eventTypes;
		return (eventTypes === null || eventTypes === void 0 ? void 0 : eventTypes.includes("leftMouseDown")) && e.button === 0 || (eventTypes === null || eventTypes === void 0 ? void 0 : eventTypes.includes("mouseWheelDown")) && e.button === 1;
	}
	allowMouseWheel(e) {
		var _a;
		return this.pannable && !e.ctrlKey && ((_a = this.widgetOptions.eventTypes) === null || _a === void 0 ? void 0 : _a.includes("mouseWheel"));
	}
	autoPanning(x, y) {
		const buffer = 10;
		const graphArea = this.graph.getGraphArea();
		let dx = 0;
		let dy = 0;
		if (x <= graphArea.left + buffer) dx = -10;
		if (y <= graphArea.top + buffer) dy = -10;
		if (x >= graphArea.right - buffer) dx = buffer;
		if (y >= graphArea.bottom - buffer) dy = buffer;
		if (dx !== 0 || dy !== 0) this.graph.translateBy(-dx, -dy);
	}
	enablePanning() {
		if (!this.pannable) {
			this.widgetOptions.enabled = true;
			this.updateClassName();
		}
	}
	disablePanning() {
		if (this.pannable) {
			this.widgetOptions.enabled = false;
			this.updateClassName();
		}
	}
	dispose() {
		this.stopListening();
	}
};
__decorate$18([Base.dispose()], PanningManager.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/mousewheel.js
var __decorate$17 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MouseWheel = class extends Base {
	constructor() {
		super(...arguments);
		this.cumulatedFactor = 1;
	}
	get widgetOptions() {
		return this.options.mousewheel;
	}
	init() {
		this.container = this.graph.container;
		this.target = this.widgetOptions.global ? document : this.container;
		this.mousewheelHandle = new MouseWheelHandle(this.target, this.onMouseWheel.bind(this), this.allowMouseWheel.bind(this));
		if (this.widgetOptions.enabled) this.enable(true);
	}
	get disabled() {
		return this.widgetOptions.enabled !== true;
	}
	enable(force) {
		if (this.disabled || force) {
			this.widgetOptions.enabled = true;
			this.mousewheelHandle.enable();
		}
	}
	disable() {
		if (!this.disabled) {
			this.widgetOptions.enabled = false;
			this.mousewheelHandle.disable();
		}
	}
	allowMouseWheel(e) {
		const guard = this.widgetOptions.guard;
		return (guard == null || guard(e)) && ModifierKey.isMatch(e, this.widgetOptions.modifiers);
	}
	onMouseWheel(e) {
		const guard = this.widgetOptions.guard;
		if ((guard == null || guard(e)) && ModifierKey.isMatch(e, this.widgetOptions.modifiers)) {
			const factor = this.widgetOptions.factor || 1.2;
			if (this.currentScale == null) {
				this.startPos = {
					x: e.clientX,
					y: e.clientY
				};
				this.currentScale = this.graph.transform.getScale().sx;
			}
			if (e.deltaY < 0) {
				if (this.currentScale < .15) this.cumulatedFactor = (this.currentScale + .01) / this.currentScale;
				else this.cumulatedFactor = Math.round(this.currentScale * factor * 20) / 20 / this.currentScale;
				if (this.cumulatedFactor <= 1) this.cumulatedFactor = 1.05;
			} else {
				if (this.currentScale <= .15) this.cumulatedFactor = (this.currentScale - .01) / this.currentScale;
				else this.cumulatedFactor = Math.round(this.currentScale * (1 / factor) * 20) / 20 / this.currentScale;
				if (this.cumulatedFactor >= 1) this.cumulatedFactor = .95;
			}
			this.cumulatedFactor = Math.max(.01, Math.min(this.currentScale * this.cumulatedFactor, 160) / this.currentScale);
			const currentScale = this.currentScale;
			let targetScale = this.graph.transform.clampScale(currentScale * this.cumulatedFactor);
			const minScale = this.widgetOptions.minScale || Number.MIN_SAFE_INTEGER;
			const maxScale = this.widgetOptions.maxScale || Number.MAX_SAFE_INTEGER;
			targetScale = clamp(targetScale, minScale, maxScale);
			if (targetScale !== currentScale) if (this.widgetOptions.zoomAtMousePosition) {
				const origin = !!this.graph.getPlugin("scroller") ? this.graph.clientToLocal(this.startPos) : this.graph.clientToGraph(this.startPos);
				this.graph.zoom(targetScale, {
					absolute: true,
					center: origin.clone()
				});
			} else this.graph.zoom(targetScale, { absolute: true });
			this.currentScale = null;
			this.cumulatedFactor = 1;
		}
	}
	dispose() {
		this.disable();
	}
};
__decorate$17([Disposable.dispose()], MouseWheel.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/virtual-render.js
var __decorate$16 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var VirtualRenderManager = class extends Base {
	init() {
		this.resetRenderArea = throttle(this.resetRenderArea, 200, { leading: true });
		this.resetRenderArea();
		this.startListening();
	}
	startListening() {
		this.graph.on("translate", this.resetRenderArea, this);
		this.graph.on("scale", this.resetRenderArea, this);
		this.graph.on("resize", this.resetRenderArea, this);
	}
	stopListening() {
		this.graph.off("translate", this.resetRenderArea, this);
		this.graph.off("scale", this.resetRenderArea, this);
		this.graph.off("resize", this.resetRenderArea, this);
	}
	enableVirtualRender() {
		this.options.virtual = true;
		this.resetRenderArea();
	}
	disableVirtualRender() {
		this.options.virtual = false;
		this.graph.renderer.setRenderArea(void 0);
	}
	resetRenderArea() {
		if (this.options.virtual) {
			const renderArea = this.graph.getGraphArea();
			this.graph.renderer.setRenderArea(renderArea);
		}
	}
	dispose() {
		this.stopListening();
	}
};
__decorate$16([Base.dispose()], VirtualRenderManager.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/renderer/queueJob.js
var JobQueue = class {
	constructor() {
		this.isFlushing = false;
		this.isFlushPending = false;
		this.scheduleId = 0;
		this.queue = [];
		this.frameInterval = 33;
		this.initialTime = Date.now();
	}
	queueJob(job) {
		if (job.priority & JOB_PRIORITY.PRIOR) job.cb();
		else {
			const index = this.findInsertionIndex(job);
			if (index >= 0) this.queue.splice(index, 0, job);
		}
	}
	queueFlush() {
		if (!this.isFlushing && !this.isFlushPending) {
			this.isFlushPending = true;
			this.scheduleJob();
		}
	}
	queueFlushSync() {
		if (!this.isFlushing && !this.isFlushPending) {
			this.isFlushPending = true;
			this.flushJobsSync();
		}
	}
	clearJobs() {
		this.queue.length = 0;
		this.isFlushing = false;
		this.isFlushPending = false;
		this.cancelScheduleJob();
	}
	flushJobs() {
		this.isFlushPending = false;
		this.isFlushing = true;
		const startTime = this.getCurrentTime();
		let job;
		while (job = this.queue.shift()) {
			job.cb();
			if (this.getCurrentTime() - startTime >= this.frameInterval) break;
		}
		this.isFlushing = false;
		if (this.queue.length) this.queueFlush();
	}
	flushJobsSync() {
		this.isFlushPending = false;
		this.isFlushing = true;
		let job;
		while (job = this.queue.shift()) try {
			job.cb();
		} catch (error) {
			console.log(error);
		}
		this.isFlushing = false;
	}
	findInsertionIndex(job) {
		let left = 0;
		let ins = this.queue.length;
		let right = ins - 1;
		const priority = job.priority;
		while (left <= right) {
			const mid = (right - left >> 1) + left;
			if (priority <= this.queue[mid].priority) left = mid + 1;
			else {
				ins = mid;
				right = mid - 1;
			}
		}
		return ins;
	}
	scheduleJob() {
		if ("requestIdleCallback" in window) {
			if (this.scheduleId) this.cancelScheduleJob();
			this.scheduleId = window.requestIdleCallback(this.flushJobs.bind(this), { timeout: 100 });
		} else {
			if (this.scheduleId) this.cancelScheduleJob();
			this.scheduleId = window.setTimeout(this.flushJobs.bind(this));
		}
	}
	cancelScheduleJob() {
		if ("cancelIdleCallback" in window) {
			if (this.scheduleId) window.cancelIdleCallback(this.scheduleId);
			this.scheduleId = 0;
		} else {
			if (this.scheduleId) clearTimeout(this.scheduleId);
			this.scheduleId = 0;
		}
	}
	getCurrentTime() {
		if (typeof performance === "object" && typeof performance.now === "function") return performance.now();
		return Date.now() - this.initialTime;
	}
};
var JOB_PRIORITY;
(function(JOB_PRIORITY) {
	JOB_PRIORITY[JOB_PRIORITY["Update"] = 2] = "Update";
	JOB_PRIORITY[JOB_PRIORITY["RenderEdge"] = 4] = "RenderEdge";
	JOB_PRIORITY[JOB_PRIORITY["RenderNode"] = 8] = "RenderNode";
	JOB_PRIORITY[JOB_PRIORITY["PRIOR"] = 1048576] = "PRIOR";
})(JOB_PRIORITY || (JOB_PRIORITY = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/renderer/scheduler.js
var __decorate$15 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Scheduler = class Scheduler extends Disposable {
	get model() {
		return this.graph.model;
	}
	get container() {
		return this.graph.view.stage;
	}
	constructor(graph) {
		super();
		this.views = {};
		this.willRemoveViews = {};
		this.queue = new JobQueue();
		this.graph = graph;
		this.init();
	}
	init() {
		this.startListening();
		this.renderViews(this.model.getCells());
	}
	startListening() {
		this.model.on("reseted", this.onModelReseted, this);
		this.model.on("cell:added", this.onCellAdded, this);
		this.model.on("cell:removed", this.onCellRemoved, this);
		this.model.on("cell:change:zIndex", this.onCellZIndexChanged, this);
		this.model.on("cell:change:visible", this.onCellVisibleChanged, this);
	}
	stopListening() {
		this.model.off("reseted", this.onModelReseted, this);
		this.model.off("cell:added", this.onCellAdded, this);
		this.model.off("cell:removed", this.onCellRemoved, this);
		this.model.off("cell:change:zIndex", this.onCellZIndexChanged, this);
		this.model.off("cell:change:visible", this.onCellVisibleChanged, this);
	}
	onModelReseted({ options }) {
		this.queue.clearJobs();
		this.removeZPivots();
		this.resetViews();
		const cells = this.model.getCells();
		this.renderViews(cells, Object.assign(Object.assign({}, options), { queue: cells.map((cell) => cell.id) }));
	}
	onCellAdded({ cell, options }) {
		this.renderViews([cell], options);
	}
	onCellRemoved({ cell }) {
		this.removeViews([cell]);
	}
	onCellZIndexChanged({ cell, options }) {
		const viewItem = this.views[cell.id];
		if (viewItem) this.requestViewUpdate(viewItem.view, Scheduler.FLAG_INSERT, options, JOB_PRIORITY.Update, true);
	}
	onCellVisibleChanged({ cell, current }) {
		this.toggleVisible(cell, !!current);
	}
	requestViewUpdate(view, flag, options = {}, priority = JOB_PRIORITY.Update, flush = true) {
		const id = view.cell.id;
		const viewItem = this.views[id];
		if (!viewItem) return;
		viewItem.flag = flag;
		viewItem.options = options;
		if (view.hasAction(flag, [
			"translate",
			"resize",
			"rotate"
		]) || options.async === false) {
			priority = JOB_PRIORITY.PRIOR;
			flush = false;
		}
		this.queue.queueJob({
			id,
			priority,
			cb: () => {
				this.renderViewInArea(view, flag, options);
				const queue = options.queue;
				if (queue) {
					const index = queue.indexOf(view.cell.id);
					if (index >= 0) queue.splice(index, 1);
					if (queue.length === 0) this.graph.trigger("render:done");
				}
			}
		});
		this.getEffectedEdges(view).forEach((edge) => {
			this.requestViewUpdate(edge.view, edge.flag, options, priority, false);
		});
		if (flush) this.flush();
	}
	setRenderArea(area) {
		this.renderArea = area;
		this.flushWaitingViews();
	}
	isViewMounted(view) {
		if (view == null) return false;
		const viewItem = this.views[view.cell.id];
		if (!viewItem) return false;
		return viewItem.state === Scheduler.ViewState.MOUNTED;
	}
	renderViews(cells, options = {}) {
		cells.sort((c1, c2) => {
			if (c1.isNode() && c2.isEdge()) return -1;
			return 0;
		});
		cells.forEach((cell) => {
			const id = cell.id;
			const views = this.views;
			let flag = 0;
			let viewItem = views[id];
			if (viewItem) flag = Scheduler.FLAG_INSERT;
			else {
				const cellView = this.createCellView(cell);
				if (cellView) {
					cellView.graph = this.graph;
					flag = Scheduler.FLAG_INSERT | cellView.getBootstrapFlag();
					viewItem = {
						view: cellView,
						flag,
						options,
						state: Scheduler.ViewState.CREATED
					};
					this.views[id] = viewItem;
				}
			}
			if (viewItem) this.requestViewUpdate(viewItem.view, flag, options, this.getRenderPriority(viewItem.view), false);
		});
		this.flush();
	}
	renderViewInArea(view, flag, options = {}) {
		const cell = view.cell;
		const id = cell.id;
		const viewItem = this.views[id];
		if (!viewItem) return;
		let result = 0;
		if (this.isUpdatable(view)) {
			result = this.updateView(view, flag, options);
			viewItem.flag = result;
		} else if (viewItem.state === Scheduler.ViewState.MOUNTED) {
			result = this.updateView(view, flag, options);
			viewItem.flag = result;
		} else viewItem.state = Scheduler.ViewState.WAITING;
		if (result) {
			if (cell.isEdge() && (result & view.getFlag(["source", "target"])) === 0) this.queue.queueJob({
				id,
				priority: JOB_PRIORITY.RenderEdge,
				cb: () => {
					this.updateView(view, flag, options);
				}
			});
		}
	}
	removeViews(cells) {
		cells.forEach((cell) => {
			const id = cell.id;
			const viewItem = this.views[id];
			if (viewItem) {
				this.willRemoveViews[id] = viewItem;
				delete this.views[id];
				this.queue.queueJob({
					id,
					priority: this.getRenderPriority(viewItem.view),
					cb: () => {
						this.removeView(viewItem.view);
					}
				});
			}
		});
		this.flush();
	}
	flush() {
		this.graph.options.async ? this.queue.queueFlush() : this.queue.queueFlushSync();
	}
	flushWaitingViews() {
		Object.values(this.views).forEach((viewItem) => {
			if (viewItem && viewItem.state === Scheduler.ViewState.WAITING) {
				const { view, flag, options } = viewItem;
				this.requestViewUpdate(view, flag, options, this.getRenderPriority(view), false);
			}
		});
		this.flush();
	}
	updateView(view, flag, options = {}) {
		if (view == null) return 0;
		if (CellView.isCellView(view)) {
			if (flag & Scheduler.FLAG_REMOVE) {
				this.removeView(view.cell);
				return 0;
			}
			if (flag & Scheduler.FLAG_INSERT) {
				this.insertView(view);
				flag ^= Scheduler.FLAG_INSERT;
			}
		}
		if (!flag) return 0;
		return view.confirmUpdate(flag, options);
	}
	insertView(view) {
		const viewItem = this.views[view.cell.id];
		if (viewItem) {
			const zIndex = view.cell.getZIndex();
			const pivot = this.addZPivot(zIndex);
			this.container.insertBefore(view.container, pivot);
			if (!view.cell.isVisible()) this.toggleVisible(view.cell, false);
			viewItem.state = Scheduler.ViewState.MOUNTED;
			this.graph.trigger("view:mounted", { view });
		}
	}
	resetViews() {
		this.willRemoveViews = Object.assign(Object.assign({}, this.views), this.willRemoveViews);
		Object.values(this.willRemoveViews).forEach((viewItem) => {
			if (viewItem) this.removeView(viewItem.view);
		});
		this.views = {};
		this.willRemoveViews = {};
	}
	removeView(view) {
		const cell = view.cell;
		const viewItem = this.willRemoveViews[cell.id];
		if (viewItem && view) {
			viewItem.view.remove();
			delete this.willRemoveViews[cell.id];
			this.graph.trigger("view:unmounted", { view });
		}
	}
	toggleVisible(cell, visible) {
		const edges = this.model.getConnectedEdges(cell);
		for (let i = 0, len = edges.length; i < len; i += 1) {
			const edge = edges[i];
			if (visible) {
				const source = edge.getSourceCell();
				const target = edge.getTargetCell();
				if (source && !source.isVisible() || target && !target.isVisible()) continue;
				this.toggleVisible(edge, true);
			} else this.toggleVisible(edge, false);
		}
		const viewItem = this.views[cell.id];
		if (viewItem) css(viewItem.view.container, { display: visible ? "unset" : "none" });
	}
	addZPivot(zIndex = 0) {
		if (this.zPivots == null) this.zPivots = {};
		const pivots = this.zPivots;
		let pivot = pivots[zIndex];
		if (pivot) return pivot;
		pivot = pivots[zIndex] = document.createComment(`z-index:${zIndex + 1}`);
		let neighborZ = -Infinity;
		for (const key in pivots) {
			const currentZ = +key;
			if (currentZ < zIndex && currentZ > neighborZ) {
				neighborZ = currentZ;
				if (neighborZ === zIndex - 1) continue;
			}
		}
		const layer = this.container;
		if (neighborZ !== -Infinity) {
			const neighborPivot = pivots[neighborZ];
			layer.insertBefore(pivot, neighborPivot.nextSibling);
		} else layer.insertBefore(pivot, layer.firstChild);
		return pivot;
	}
	removeZPivots() {
		if (this.zPivots) Object.values(this.zPivots).forEach((elem) => {
			if (elem && elem.parentNode) elem.parentNode.removeChild(elem);
		});
		this.zPivots = {};
	}
	createCellView(cell) {
		const options = { graph: this.graph };
		const createViewHook = this.graph.options.createCellView;
		if (createViewHook) {
			const ret = call$1(createViewHook, this.graph, cell);
			if (ret) return new ret(cell, options);
			if (ret === null) return null;
		}
		const view = cell.view;
		if (view != null && typeof view === "string") {
			const def = CellView.registry.get(view);
			if (def) return new def(cell, options);
			return CellView.registry.onNotFound(view);
		}
		if (cell.isNode()) return new NodeView(cell, options);
		if (cell.isEdge()) return new EdgeView(cell, options);
		return null;
	}
	getEffectedEdges(view) {
		const effectedEdges = [];
		const cell = view.cell;
		const edges = this.model.getConnectedEdges(cell);
		for (let i = 0, n = edges.length; i < n; i += 1) {
			const edge = edges[i];
			const viewItem = this.views[edge.id];
			if (!viewItem) continue;
			const edgeView = viewItem.view;
			if (!this.isViewMounted(edgeView)) continue;
			const flagLabels = ["update"];
			if (edge.getTargetCell() === cell) flagLabels.push("target");
			if (edge.getSourceCell() === cell) flagLabels.push("source");
			effectedEdges.push({
				id: edge.id,
				view: edgeView,
				flag: edgeView.getFlag(flagLabels)
			});
		}
		return effectedEdges;
	}
	isUpdatable(view) {
		if (view.isNodeView()) {
			if (this.renderArea) return this.renderArea.isIntersectWithRect(view.cell.getBBox());
			return true;
		}
		if (view.isEdgeView()) {
			const edge = view.cell;
			const sourceCell = edge.getSourceCell();
			const targetCell = edge.getTargetCell();
			if (this.renderArea && sourceCell && targetCell) return this.renderArea.isIntersectWithRect(sourceCell.getBBox()) || this.renderArea.isIntersectWithRect(targetCell.getBBox());
		}
		return true;
	}
	getRenderPriority(view) {
		return view.cell.isNode() ? JOB_PRIORITY.RenderNode : JOB_PRIORITY.RenderEdge;
	}
	dispose() {
		this.stopListening();
		Object.keys(this.views).forEach((id) => {
			this.views[id].view.dispose();
		});
		this.views = {};
	}
};
__decorate$15([Disposable.dispose()], Scheduler.prototype, "dispose", null);
(function(Scheduler) {
	Scheduler.FLAG_INSERT = 1 << 30;
	Scheduler.FLAG_REMOVE = 1 << 29;
	Scheduler.FLAG_RENDER = (1 << 26) - 1;
})(Scheduler || (Scheduler = {}));
(function(Scheduler) {
	(function(ViewState) {
		ViewState[ViewState["CREATED"] = 0] = "CREATED";
		ViewState[ViewState["MOUNTED"] = 1] = "MOUNTED";
		ViewState[ViewState["WAITING"] = 2] = "WAITING";
	})(Scheduler.ViewState || (Scheduler.ViewState = {}));
})(Scheduler || (Scheduler = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/renderer/renderer.js
var __decorate$14 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Renderer = class extends Base {
	constructor() {
		super(...arguments);
		this.schedule = new Scheduler(this.graph);
	}
	requestViewUpdate(view, flag, options = {}) {
		this.schedule.requestViewUpdate(view, flag, options);
	}
	isViewMounted(view) {
		return this.schedule.isViewMounted(view);
	}
	setRenderArea(area) {
		this.schedule.setRenderArea(area);
	}
	findViewByElem(elem) {
		if (elem == null) return null;
		const container = this.options.container;
		const target = typeof elem === "string" ? container.querySelector(elem) : elem instanceof Element ? elem : elem[0];
		if (target) {
			const id = this.graph.view.findAttr("data-cell-id", target);
			if (id) {
				const views = this.schedule.views;
				if (views[id]) return views[id].view;
			}
		}
		return null;
	}
	findViewByCell(cell) {
		if (cell == null) return null;
		const id = Cell.isCell(cell) ? cell.id : cell;
		const views = this.schedule.views;
		if (views[id]) return views[id].view;
		return null;
	}
	findViewsFromPoint(p) {
		const ref = {
			x: p.x,
			y: p.y
		};
		return this.model.getCells().map((cell) => this.findViewByCell(cell)).filter((view) => {
			if (view != null) return Util$2.getBBox(view.container, { target: this.view.stage }).containsPoint(ref);
			return false;
		});
	}
	findEdgeViewsFromPoint(p, threshold = 5) {
		return this.model.getEdges().map((edge) => this.findViewByCell(edge)).filter((view) => {
			if (view != null) {
				const point = view.getClosestPoint(p);
				if (point) return point.distance(p) <= threshold;
			}
			return false;
		});
	}
	findViewsInArea(rect, options = {}) {
		const area = Rectangle.create(rect);
		return this.model.getCells().map((cell) => this.findViewByCell(cell)).filter((view) => {
			if (view) {
				if (options.nodeOnly && !view.isNodeView()) return false;
				const bbox = Util$2.getBBox(view.container, { target: this.view.stage });
				if (bbox.width === 0) bbox.inflate(1, 0);
				else if (bbox.height === 0) bbox.inflate(0, 1);
				return options.strict ? area.containsRect(bbox) : area.isIntersectWithRect(bbox);
			}
			return false;
		});
	}
	dispose() {
		this.schedule.dispose();
	}
};
__decorate$14([Base.dispose()], Renderer.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/defs.js
var __rest$4 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var DefsManager = class extends Base {
	get cid() {
		return this.graph.view.cid;
	}
	get svg() {
		return this.view.svg;
	}
	get defs() {
		return this.view.defs;
	}
	isDefined(id) {
		return this.svg.getElementById(id) != null;
	}
	filter(options) {
		let filterId = options.id;
		const name = options.name;
		if (!filterId) filterId = `filter-${name}-${this.cid}-${hashcode(JSON.stringify(options))}`;
		if (!this.isDefined(filterId)) {
			const fn = Filter.registry.get(name);
			if (fn == null) return Filter.registry.onNotFound(name);
			const markup = fn(options.args || {});
			const attrs = Object.assign(Object.assign({
				x: -1,
				y: -1,
				width: 3,
				height: 3,
				filterUnits: "objectBoundingBox"
			}, options.attrs), { id: filterId });
			Vector.create(Markup.sanitize(markup), attrs).appendTo(this.defs);
		}
		return filterId;
	}
	gradient(options) {
		let id = options.id;
		const type = options.type;
		if (!id) id = `gradient-${type}-${this.cid}-${hashcode(JSON.stringify(options))}`;
		if (!this.isDefined(id)) {
			const markup = `<${type}>${options.stops.map((stop) => {
				const opacity = stop.opacity != null && Number.isFinite(stop.opacity) ? stop.opacity : 1;
				return `<stop offset="${stop.offset}" stop-color="${stop.color}" stop-opacity="${opacity}"/>`;
			}).join("")}</${type}>`;
			const attrs = Object.assign({ id }, options.attrs);
			Vector.create(markup, attrs).appendTo(this.defs);
		}
		return id;
	}
	marker(options) {
		const { id, refX, refY, markerUnits, markerOrient, tagName, children } = options, attrs = __rest$4(options, [
			"id",
			"refX",
			"refY",
			"markerUnits",
			"markerOrient",
			"tagName",
			"children"
		]);
		let markerId = id;
		if (!markerId) markerId = `marker-${this.cid}-${hashcode(JSON.stringify(options))}`;
		if (!this.isDefined(markerId)) {
			if (tagName !== "path") delete attrs.d;
			const pathMarker = Vector.create("marker", {
				refX,
				refY,
				id: markerId,
				overflow: "visible",
				orient: markerOrient != null ? markerOrient : "auto",
				markerUnits: markerUnits || "userSpaceOnUse"
			}, children ? children.map((_a) => {
				var { tagName } = _a, other = __rest$4(_a, ["tagName"]);
				return Vector.create(`${tagName}` || "path", kebablizeAttrs(Object.assign(Object.assign({}, attrs), other)));
			}) : [Vector.create(tagName || "path", kebablizeAttrs(attrs))]);
			this.defs.appendChild(pathMarker.node);
		}
		return markerId;
	}
	remove(id) {
		const elem = this.svg.getElementById(id);
		if (elem && elem.parentNode) elem.parentNode.removeChild(elem);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/coord.js
var CoordManager = class extends Base {
	getClientMatrix() {
		return createSVGMatrix(this.view.stage.getScreenCTM());
	}
	/**
	* Returns coordinates of the graph viewport, relative to the window.
	*/
	getClientOffset() {
		const rect = this.view.svg.getBoundingClientRect();
		return new Point(rect.left, rect.top);
	}
	/**
	* Returns coordinates of the graph viewport, relative to the document.
	*/
	getPageOffset() {
		return this.getClientOffset().translate(window.scrollX, window.scrollY);
	}
	snapToGrid(x, y) {
		return (typeof x === "number" ? this.clientToLocalPoint(x, y) : this.clientToLocalPoint(x.x, x.y)).snapToGrid(this.graph.getGridSize());
	}
	localToGraphPoint(x, y) {
		const localPoint = Point.create(x, y);
		return Util$2.transformPoint(localPoint, this.graph.matrix());
	}
	localToClientPoint(x, y) {
		const localPoint = Point.create(x, y);
		return Util$2.transformPoint(localPoint, this.getClientMatrix());
	}
	localToPagePoint(x, y) {
		return (typeof x === "number" ? this.localToGraphPoint(x, y) : this.localToGraphPoint(x)).translate(this.getPageOffset());
	}
	localToGraphRect(x, y, width, height) {
		const localRect = Rectangle.create(x, y, width, height);
		return Util$2.transformRectangle(localRect, this.graph.matrix());
	}
	localToClientRect(x, y, width, height) {
		const localRect = Rectangle.create(x, y, width, height);
		return Util$2.transformRectangle(localRect, this.getClientMatrix());
	}
	localToPageRect(x, y, width, height) {
		return (typeof x === "number" ? this.localToGraphRect(x, y, width, height) : this.localToGraphRect(x)).translate(this.getPageOffset());
	}
	graphToLocalPoint(x, y) {
		const graphPoint = Point.create(x, y);
		return Util$2.transformPoint(graphPoint, this.graph.matrix().inverse());
	}
	clientToLocalPoint(x, y) {
		const clientPoint = Point.create(x, y);
		return Util$2.transformPoint(clientPoint, this.getClientMatrix().inverse());
	}
	clientToGraphPoint(x, y) {
		const clientPoint = Point.create(x, y);
		return Util$2.transformPoint(clientPoint, this.graph.matrix().multiply(this.getClientMatrix().inverse()));
	}
	pageToLocalPoint(x, y) {
		const graphPoint = Point.create(x, y).diff(this.getPageOffset());
		return this.graphToLocalPoint(graphPoint);
	}
	graphToLocalRect(x, y, width, height) {
		const graphRect = Rectangle.create(x, y, width, height);
		return Util$2.transformRectangle(graphRect, this.graph.matrix().inverse());
	}
	clientToLocalRect(x, y, width, height) {
		const clientRect = Rectangle.create(x, y, width, height);
		return Util$2.transformRectangle(clientRect, this.getClientMatrix().inverse());
	}
	clientToGraphRect(x, y, width, height) {
		const clientRect = Rectangle.create(x, y, width, height);
		return Util$2.transformRectangle(clientRect, this.graph.matrix().multiply(this.getClientMatrix().inverse()));
	}
	pageToLocalRect(x, y, width, height) {
		const graphRect = Rectangle.create(x, y, width, height);
		const pageOffset = this.getPageOffset();
		graphRect.x -= pageOffset.x;
		graphRect.y -= pageOffset.y;
		return this.graphToLocalRect(graphRect);
	}
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/highlight.js
var __decorate$13 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HighlightManager = class extends Base {
	constructor() {
		super(...arguments);
		this.highlights = {};
	}
	init() {
		this.startListening();
	}
	startListening() {
		this.graph.on("cell:highlight", this.onCellHighlight, this);
		this.graph.on("cell:unhighlight", this.onCellUnhighlight, this);
	}
	stopListening() {
		this.graph.off("cell:highlight", this.onCellHighlight, this);
		this.graph.off("cell:unhighlight", this.onCellUnhighlight, this);
	}
	onCellHighlight({ view: cellView, magnet, options = {} }) {
		const resolved = this.resolveHighlighter(options);
		if (!resolved) return;
		const key = this.getHighlighterId(magnet, resolved);
		if (!this.highlights[key]) {
			const highlighter = resolved.highlighter;
			highlighter.highlight(cellView, magnet, Object.assign({}, resolved.args));
			this.highlights[key] = {
				cellView,
				magnet,
				highlighter,
				args: resolved.args
			};
		}
	}
	onCellUnhighlight({ magnet, options = {} }) {
		const resolved = this.resolveHighlighter(options);
		if (!resolved) return;
		const id = this.getHighlighterId(magnet, resolved);
		this.unhighlight(id);
	}
	resolveHighlighter(options) {
		const graphOptions = this.options;
		let highlighterDef = options.highlighter;
		if (highlighterDef == null) {
			const type = options.type;
			highlighterDef = type && graphOptions.highlighting[type] || graphOptions.highlighting.default;
		}
		if (highlighterDef == null) return null;
		const def = typeof highlighterDef === "string" ? { name: highlighterDef } : highlighterDef;
		const name = def.name;
		const highlighter = Highlighter.registry.get(name);
		if (highlighter == null) return Highlighter.registry.onNotFound(name);
		Highlighter.check(name, highlighter);
		return {
			name,
			highlighter,
			args: def.args || {}
		};
	}
	getHighlighterId(magnet, options) {
		ensureId(magnet);
		return options.name + magnet.id + JSON.stringify(options.args);
	}
	unhighlight(id) {
		const highlight = this.highlights[id];
		if (highlight) {
			highlight.highlighter.unhighlight(highlight.cellView, highlight.magnet, highlight.args);
			delete this.highlights[id];
		}
	}
	dispose() {
		Object.keys(this.highlights).forEach((id) => this.unhighlight(id));
		this.stopListening();
	}
};
__decorate$13([HighlightManager.dispose()], HighlightManager.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/size.js
var __decorate$12 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SizeManager = class extends Base {
	getScroller() {
		const scroller = this.graph.getPlugin("scroller");
		if (scroller && scroller.options.enabled) return scroller;
		return null;
	}
	getContainer() {
		const scroller = this.getScroller();
		if (scroller) return scroller.container.parentElement;
		return this.graph.container.parentElement;
	}
	getSensorTarget() {
		const autoResize = this.options.autoResize;
		if (autoResize) {
			if (typeof autoResize === "boolean") return this.getContainer();
			return autoResize;
		}
	}
	init() {
		if (this.options.autoResize) {
			const target = this.getSensorTarget();
			if (target) SizeSensor.bind(target, () => {
				const width = target.offsetWidth;
				const height = target.offsetHeight;
				this.resize(width, height);
			});
		}
	}
	resize(width, height) {
		const scroller = this.getScroller();
		if (scroller) scroller.resize(width, height);
		else this.graph.transform.resize(width, height);
	}
	dispose() {
		SizeSensor.clear(this.graph.container);
	}
};
__decorate$12([Base.dispose()], SizeManager.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/graph/graph.js
var __decorate$11 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Graph = class Graph extends Basecoat {
	get container() {
		return this.options.container;
	}
	get [Symbol.toStringTag]() {
		return Graph.toStringTag;
	}
	constructor(options) {
		super();
		this.installedPlugins = /* @__PURE__ */ new Set();
		this.options = Options.get(options);
		this.css = new CSSManager(this);
		this.view = new GraphView(this);
		this.defs = new DefsManager(this);
		this.coord = new CoordManager(this);
		this.transform = new TransformManager(this);
		this.highlight = new HighlightManager(this);
		this.grid = new GridManager(this);
		this.background = new BackgroundManager(this);
		if (this.options.model) this.model = this.options.model;
		else {
			this.model = new Model();
			this.model.graph = this;
		}
		this.renderer = new Renderer(this);
		this.panning = new PanningManager(this);
		this.mousewheel = new MouseWheel(this);
		this.virtualRender = new VirtualRenderManager(this);
		this.size = new SizeManager(this);
	}
	isNode(cell) {
		return cell.isNode();
	}
	isEdge(cell) {
		return cell.isEdge();
	}
	resetCells(cells, options = {}) {
		this.model.resetCells(cells, options);
		return this;
	}
	clearCells(options = {}) {
		this.model.clear(options);
		return this;
	}
	toJSON(options = {}) {
		return this.model.toJSON(options);
	}
	parseJSON(data) {
		return this.model.parseJSON(data);
	}
	fromJSON(data, options = {}) {
		this.model.fromJSON(data, options);
		return this;
	}
	getCellById(id) {
		return this.model.getCell(id);
	}
	addNode(node, options = {}) {
		return this.model.addNode(node, options);
	}
	addNodes(nodes, options = {}) {
		return this.addCell(nodes.map((node) => Node$1.isNode(node) ? node : this.createNode(node)), options);
	}
	createNode(metadata) {
		return this.model.createNode(metadata);
	}
	removeNode(node, options = {}) {
		return this.model.removeCell(node, options);
	}
	addEdge(edge, options = {}) {
		return this.model.addEdge(edge, options);
	}
	addEdges(edges, options = {}) {
		return this.addCell(edges.map((edge) => Edge$1.isEdge(edge) ? edge : this.createEdge(edge)), options);
	}
	removeEdge(edge, options = {}) {
		return this.model.removeCell(edge, options);
	}
	createEdge(metadata) {
		return this.model.createEdge(metadata);
	}
	addCell(cell, options = {}) {
		this.model.addCell(cell, options);
		return this;
	}
	removeCell(cell, options = {}) {
		return this.model.removeCell(cell, options);
	}
	removeCells(cells, options = {}) {
		return this.model.removeCells(cells, options);
	}
	removeConnectedEdges(cell, options = {}) {
		return this.model.removeConnectedEdges(cell, options);
	}
	disconnectConnectedEdges(cell, options = {}) {
		this.model.disconnectConnectedEdges(cell, options);
		return this;
	}
	hasCell(cell) {
		return this.model.has(cell);
	}
	getCells() {
		return this.model.getCells();
	}
	getCellCount() {
		return this.model.total();
	}
	/**
	* Returns all the nodes in the graph.
	*/
	getNodes() {
		return this.model.getNodes();
	}
	/**
	* Returns all the edges in the graph.
	*/
	getEdges() {
		return this.model.getEdges();
	}
	/**
	* Returns all outgoing edges for the node.
	*/
	getOutgoingEdges(cell) {
		return this.model.getOutgoingEdges(cell);
	}
	/**
	* Returns all incoming edges for the node.
	*/
	getIncomingEdges(cell) {
		return this.model.getIncomingEdges(cell);
	}
	/**
	* Returns edges connected with cell.
	*/
	getConnectedEdges(cell, options = {}) {
		return this.model.getConnectedEdges(cell, options);
	}
	/**
	* Returns an array of all the roots of the graph.
	*/
	getRootNodes() {
		return this.model.getRoots();
	}
	/**
	* Returns an array of all the leafs of the graph.
	*/
	getLeafNodes() {
		return this.model.getLeafs();
	}
	/**
	* Returns `true` if the node is a root node, i.e.
	* there is no  edges coming to the node.
	*/
	isRootNode(cell) {
		return this.model.isRoot(cell);
	}
	/**
	* Returns `true` if the node is a leaf node, i.e.
	* there is no edges going out from the node.
	*/
	isLeafNode(cell) {
		return this.model.isLeaf(cell);
	}
	/**
	* Returns all the neighbors of node in the graph. Neighbors are all
	* the nodes connected to node via either incoming or outgoing edge.
	*/
	getNeighbors(cell, options = {}) {
		return this.model.getNeighbors(cell, options);
	}
	/**
	* Returns `true` if `cell2` is a neighbor of `cell1`.
	*/
	isNeighbor(cell1, cell2, options = {}) {
		return this.model.isNeighbor(cell1, cell2, options);
	}
	getSuccessors(cell, options = {}) {
		return this.model.getSuccessors(cell, options);
	}
	/**
	* Returns `true` if `cell2` is a successor of `cell1`.
	*/
	isSuccessor(cell1, cell2, options = {}) {
		return this.model.isSuccessor(cell1, cell2, options);
	}
	getPredecessors(cell, options = {}) {
		return this.model.getPredecessors(cell, options);
	}
	/**
	* Returns `true` if `cell2` is a predecessor of `cell1`.
	*/
	isPredecessor(cell1, cell2, options = {}) {
		return this.model.isPredecessor(cell1, cell2, options);
	}
	getCommonAncestor(...cells) {
		return this.model.getCommonAncestor(...cells);
	}
	/**
	* Returns an array of cells that result from finding nodes/edges that
	* are connected to any of the cells in the cells array. This function
	* loops over cells and if the current cell is a edge, it collects its
	* source/target nodes; if it is an node, it collects its incoming and
	* outgoing edges if both the edge terminal (source/target) are in the
	* cells array.
	*/
	getSubGraph(cells, options = {}) {
		return this.model.getSubGraph(cells, options);
	}
	/**
	* Clones the whole subgraph (including all the connected links whose
	* source/target is in the subgraph). If `options.deep` is `true`, also
	* take into account all the embedded cells of all the subgraph cells.
	*
	* Returns a map of the form: { [original cell ID]: [clone] }.
	*/
	cloneSubGraph(cells, options = {}) {
		return this.model.cloneSubGraph(cells, options);
	}
	cloneCells(cells) {
		return this.model.cloneCells(cells);
	}
	getNodesFromPoint(x, y) {
		return this.model.getNodesFromPoint(x, y);
	}
	getNodesInArea(x, y, w, h, options) {
		return this.model.getNodesInArea(x, y, w, h, options);
	}
	getNodesUnderNode(node, options = {}) {
		return this.model.getNodesUnderNode(node, options);
	}
	searchCell(cell, iterator, options = {}) {
		this.model.search(cell, iterator, options);
		return this;
	}
	/** *
	* Returns an array of IDs of nodes on the shortest
	* path between source and target.
	*/
	getShortestPath(source, target, options = {}) {
		return this.model.getShortestPath(source, target, options);
	}
	/**
	* Returns the bounding box that surrounds all cells in the graph.
	*/
	getAllCellsBBox() {
		return this.model.getAllCellsBBox();
	}
	/**
	* Returns the bounding box that surrounds all the given cells.
	*/
	getCellsBBox(cells, options = {}) {
		return this.model.getCellsBBox(cells, options);
	}
	startBatch(name, data = {}) {
		this.model.startBatch(name, data);
	}
	stopBatch(name, data = {}) {
		this.model.stopBatch(name, data);
	}
	batchUpdate(arg1, arg2, arg3) {
		const name = typeof arg1 === "string" ? arg1 : "update";
		const execute = typeof arg1 === "string" ? arg2 : arg1;
		const data = typeof arg2 === "function" ? arg3 : arg2;
		this.startBatch(name, data);
		const result = execute();
		this.stopBatch(name, data);
		return result;
	}
	updateCellId(cell, newId) {
		return this.model.updateCellId(cell, newId);
	}
	findView(ref) {
		if (Cell.isCell(ref)) return this.findViewByCell(ref);
		return this.findViewByElem(ref);
	}
	findViews(ref) {
		if (Rectangle.isRectangleLike(ref)) return this.findViewsInArea(ref);
		if (Point.isPointLike(ref)) return this.findViewsFromPoint(ref);
		return [];
	}
	findViewByCell(cell) {
		return this.renderer.findViewByCell(cell);
	}
	findViewByElem(elem) {
		return this.renderer.findViewByElem(elem);
	}
	findViewsFromPoint(x, y) {
		const p = typeof x === "number" ? {
			x,
			y
		} : x;
		return this.renderer.findViewsFromPoint(p);
	}
	findViewsInArea(x, y, width, height, options) {
		const rect = typeof x === "number" ? {
			x,
			y,
			width,
			height
		} : x;
		const localOptions = typeof x === "number" ? options : y;
		return this.renderer.findViewsInArea(rect, localOptions);
	}
	matrix(mat) {
		if (typeof mat === "undefined") return this.transform.getMatrix();
		this.transform.setMatrix(mat);
		return this;
	}
	resize(width, height) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.resize(width, height);
		else this.transform.resize(width, height);
		return this;
	}
	scale(sx, sy = sx, cx = 0, cy = 0) {
		if (typeof sx === "undefined") return this.transform.getScale();
		this.transform.scale(sx, sy, cx, cy);
		return this;
	}
	zoom(factor, options) {
		const scroller = this.getPlugin("scroller");
		if (scroller) {
			if (typeof factor === "undefined") return scroller.zoom();
			scroller.zoom(factor, options);
		} else {
			if (typeof factor === "undefined") return this.transform.getZoom();
			this.transform.zoom(factor, options);
		}
		return this;
	}
	zoomTo(factor, options = {}) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.zoom(factor, Object.assign(Object.assign({}, options), { absolute: true }));
		else this.transform.zoom(factor, Object.assign(Object.assign({}, options), { absolute: true }));
		return this;
	}
	zoomToRect(rect, options = {}) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.zoomToRect(rect, options);
		else this.transform.zoomToRect(rect, options);
		return this;
	}
	zoomToFit(options = {}) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.zoomToFit(options);
		else this.transform.zoomToFit(options);
		return this;
	}
	rotate(angle, cx, cy) {
		if (typeof angle === "undefined") return this.transform.getRotation();
		this.transform.rotate(angle, cx, cy);
		return this;
	}
	translate(tx, ty) {
		if (typeof tx === "undefined") return this.transform.getTranslation();
		this.transform.translate(tx, ty);
		return this;
	}
	translateBy(dx, dy) {
		const ts = this.translate();
		const tx = ts.tx + dx;
		const ty = ts.ty + dy;
		return this.translate(tx, ty);
	}
	getGraphArea() {
		return this.transform.getGraphArea();
	}
	getContentArea(options = {}) {
		return this.transform.getContentArea(options);
	}
	getContentBBox(options = {}) {
		return this.transform.getContentBBox(options);
	}
	fitToContent(gridWidth, gridHeight, padding, options) {
		return this.transform.fitToContent(gridWidth, gridHeight, padding, options);
	}
	scaleContentToFit(options = {}) {
		this.transform.scaleContentToFit(options);
		return this;
	}
	/**
	* Position the center of graph to the center of the viewport.
	*/
	center(options) {
		return this.centerPoint(options);
	}
	centerPoint(x, y, options) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.centerPoint(x, y, options);
		else this.transform.centerPoint(x, y);
		return this;
	}
	centerContent(options) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.centerContent(options);
		else this.transform.centerContent(options);
		return this;
	}
	centerCell(cell, options) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.centerCell(cell, options);
		else this.transform.centerCell(cell);
		return this;
	}
	positionPoint(point, x, y, options = {}) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.positionPoint(point, x, y, options);
		else this.transform.positionPoint(point, x, y);
		return this;
	}
	positionRect(rect, direction, options) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.positionRect(rect, direction, options);
		else this.transform.positionRect(rect, direction);
		return this;
	}
	positionCell(cell, direction, options) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.positionCell(cell, direction, options);
		else this.transform.positionCell(cell, direction);
		return this;
	}
	positionContent(pos, options) {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.positionContent(pos, options);
		else this.transform.positionContent(pos, options);
		return this;
	}
	snapToGrid(x, y) {
		return this.coord.snapToGrid(x, y);
	}
	pageToLocal(x, y, width, height) {
		if (Rectangle.isRectangleLike(x)) return this.coord.pageToLocalRect(x);
		if (typeof x === "number" && typeof y === "number" && typeof width === "number" && typeof height === "number") return this.coord.pageToLocalRect(x, y, width, height);
		return this.coord.pageToLocalPoint(x, y);
	}
	localToPage(x, y, width, height) {
		if (Rectangle.isRectangleLike(x)) return this.coord.localToPageRect(x);
		if (typeof x === "number" && typeof y === "number" && typeof width === "number" && typeof height === "number") return this.coord.localToPageRect(x, y, width, height);
		return this.coord.localToPagePoint(x, y);
	}
	clientToLocal(x, y, width, height) {
		if (Rectangle.isRectangleLike(x)) return this.coord.clientToLocalRect(x);
		if (typeof x === "number" && typeof y === "number" && typeof width === "number" && typeof height === "number") return this.coord.clientToLocalRect(x, y, width, height);
		return this.coord.clientToLocalPoint(x, y);
	}
	localToClient(x, y, width, height) {
		if (Rectangle.isRectangleLike(x)) return this.coord.localToClientRect(x);
		if (typeof x === "number" && typeof y === "number" && typeof width === "number" && typeof height === "number") return this.coord.localToClientRect(x, y, width, height);
		return this.coord.localToClientPoint(x, y);
	}
	localToGraph(x, y, width, height) {
		if (Rectangle.isRectangleLike(x)) return this.coord.localToGraphRect(x);
		if (typeof x === "number" && typeof y === "number" && typeof width === "number" && typeof height === "number") return this.coord.localToGraphRect(x, y, width, height);
		return this.coord.localToGraphPoint(x, y);
	}
	graphToLocal(x, y, width, height) {
		if (Rectangle.isRectangleLike(x)) return this.coord.graphToLocalRect(x);
		if (typeof x === "number" && typeof y === "number" && typeof width === "number" && typeof height === "number") return this.coord.graphToLocalRect(x, y, width, height);
		return this.coord.graphToLocalPoint(x, y);
	}
	clientToGraph(x, y, width, height) {
		if (Rectangle.isRectangleLike(x)) return this.coord.clientToGraphRect(x);
		if (typeof x === "number" && typeof y === "number" && typeof width === "number" && typeof height === "number") return this.coord.clientToGraphRect(x, y, width, height);
		return this.coord.clientToGraphPoint(x, y);
	}
	defineFilter(options) {
		return this.defs.filter(options);
	}
	defineGradient(options) {
		return this.defs.gradient(options);
	}
	defineMarker(options) {
		return this.defs.marker(options);
	}
	getGridSize() {
		return this.grid.getGridSize();
	}
	setGridSize(gridSize) {
		this.grid.setGridSize(gridSize);
		return this;
	}
	showGrid() {
		this.grid.show();
		return this;
	}
	hideGrid() {
		this.grid.hide();
		return this;
	}
	clearGrid() {
		this.grid.clear();
		return this;
	}
	drawGrid(options) {
		this.grid.draw(options);
		return this;
	}
	updateBackground() {
		this.background.update();
		return this;
	}
	drawBackground(options, onGraph) {
		const scroller = this.getPlugin("scroller");
		if (scroller != null && (this.options.background == null || !onGraph)) scroller.drawBackground(options, onGraph);
		else this.background.draw(options);
		return this;
	}
	clearBackground(onGraph) {
		const scroller = this.getPlugin("scroller");
		if (scroller != null && (this.options.background == null || !onGraph)) scroller.clearBackground(onGraph);
		else this.background.clear();
		return this;
	}
	enableVirtualRender() {
		this.virtualRender.enableVirtualRender();
		return this;
	}
	disableVirtualRender() {
		this.virtualRender.disableVirtualRender();
		return this;
	}
	isMouseWheelEnabled() {
		return !this.mousewheel.disabled;
	}
	enableMouseWheel() {
		this.mousewheel.enable();
		return this;
	}
	disableMouseWheel() {
		this.mousewheel.disable();
		return this;
	}
	toggleMouseWheel(enabled) {
		if (enabled == null) if (this.isMouseWheelEnabled()) this.disableMouseWheel();
		else this.enableMouseWheel();
		else if (enabled) this.enableMouseWheel();
		else this.disableMouseWheel();
		return this;
	}
	isPannable() {
		const scroller = this.getPlugin("scroller");
		if (scroller) return scroller.isPannable();
		return this.panning.pannable;
	}
	enablePanning() {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.enablePanning();
		else this.panning.enablePanning();
		return this;
	}
	disablePanning() {
		const scroller = this.getPlugin("scroller");
		if (scroller) scroller.disablePanning();
		else this.panning.disablePanning();
		return this;
	}
	togglePanning(pannable) {
		if (pannable == null) if (this.isPannable()) this.disablePanning();
		else this.enablePanning();
		else if (pannable !== this.isPannable()) if (pannable) this.enablePanning();
		else this.disablePanning();
		return this;
	}
	use(plugin, ...options) {
		if (!this.installedPlugins.has(plugin)) {
			this.installedPlugins.add(plugin);
			plugin.init(this, ...options);
		}
		return this;
	}
	getPlugin(pluginName) {
		return Array.from(this.installedPlugins).find((plugin) => plugin.name === pluginName);
	}
	getPlugins(pluginName) {
		return Array.from(this.installedPlugins).filter((plugin) => pluginName.includes(plugin.name));
	}
	enablePlugins(plugins) {
		let postPlugins = plugins;
		if (!Array.isArray(postPlugins)) postPlugins = [postPlugins];
		const aboutToChangePlugins = this.getPlugins(postPlugins);
		aboutToChangePlugins === null || aboutToChangePlugins === void 0 || aboutToChangePlugins.forEach((plugin) => {
			var _a;
			(_a = plugin === null || plugin === void 0 ? void 0 : plugin.enable) === null || _a === void 0 || _a.call(plugin);
		});
		return this;
	}
	disablePlugins(plugins) {
		let postPlugins = plugins;
		if (!Array.isArray(postPlugins)) postPlugins = [postPlugins];
		const aboutToChangePlugins = this.getPlugins(postPlugins);
		aboutToChangePlugins === null || aboutToChangePlugins === void 0 || aboutToChangePlugins.forEach((plugin) => {
			var _a;
			(_a = plugin === null || plugin === void 0 ? void 0 : plugin.disable) === null || _a === void 0 || _a.call(plugin);
		});
		return this;
	}
	isPluginEnabled(pluginName) {
		var _a;
		const pluginIns = this.getPlugin(pluginName);
		return (_a = pluginIns === null || pluginIns === void 0 ? void 0 : pluginIns.isEnabled) === null || _a === void 0 ? void 0 : _a.call(pluginIns);
	}
	disposePlugins(plugins) {
		let postPlugins = plugins;
		if (!Array.isArray(postPlugins)) postPlugins = [postPlugins];
		const aboutToChangePlugins = this.getPlugins(postPlugins);
		aboutToChangePlugins === null || aboutToChangePlugins === void 0 || aboutToChangePlugins.forEach((plugin) => {
			plugin.dispose();
			this.installedPlugins.delete(plugin);
		});
		return this;
	}
	dispose(clean = true) {
		if (clean) this.model.dispose();
		this.css.dispose();
		this.defs.dispose();
		this.grid.dispose();
		this.coord.dispose();
		this.transform.dispose();
		this.highlight.dispose();
		this.background.dispose();
		this.mousewheel.dispose();
		this.panning.dispose();
		this.view.dispose();
		this.renderer.dispose();
		this.installedPlugins.forEach((plugin) => {
			plugin.dispose();
		});
	}
};
__decorate$11([Basecoat.dispose()], Graph.prototype, "dispose", null);
(function(Graph) {
	Graph.View = GraphView;
	Graph.Renderer = Renderer;
	Graph.MouseWheel = MouseWheel;
	Graph.DefsManager = DefsManager;
	Graph.GridManager = GridManager;
	Graph.CoordManager = CoordManager;
	Graph.TransformManager = TransformManager;
	Graph.HighlightManager = HighlightManager;
	Graph.BackgroundManager = BackgroundManager;
	Graph.PanningManager = PanningManager;
})(Graph || (Graph = {}));
(function(Graph) {
	Graph.toStringTag = `X6.${Graph.name}`;
	function isGraph(instance) {
		if (instance == null) return false;
		if (instance instanceof Graph) return true;
		const tag = instance[Symbol.toStringTag];
		if (tag == null || tag === Graph.toStringTag) return true;
		return false;
	}
	Graph.isGraph = isGraph;
})(Graph || (Graph = {}));
(function(Graph) {
	function render(options, data) {
		const graph = options instanceof HTMLElement ? new Graph({ container: options }) : new Graph(options);
		if (data != null) graph.fromJSON(data);
		return graph;
	}
	Graph.render = render;
})(Graph || (Graph = {}));
(function(Graph) {
	Graph.registerNode = Node$1.registry.register;
	Graph.registerEdge = Edge$1.registry.register;
	Graph.registerView = CellView.registry.register;
	Graph.registerAttr = Attr.registry.register;
	Graph.registerGrid = Grid.registry.register;
	Graph.registerFilter = Filter.registry.register;
	Graph.registerNodeTool = NodeTool.registry.register;
	Graph.registerEdgeTool = EdgeTool.registry.register;
	Graph.registerBackground = Background.registry.register;
	Graph.registerHighlighter = Highlighter.registry.register;
	Graph.registerPortLayout = PortLayout.registry.register;
	Graph.registerPortLabelLayout = PortLabelLayout.registry.register;
	Graph.registerMarker = Marker.registry.register;
	Graph.registerRouter = Router.registry.register;
	Graph.registerConnector = Connector.registry.register;
	Graph.registerAnchor = NodeAnchor.registry.register;
	Graph.registerEdgeAnchor = EdgeAnchor.registry.register;
	Graph.registerConnectionPoint = ConnectionPoint.registry.register;
})(Graph || (Graph = {}));
(function(Graph) {
	Graph.unregisterNode = Node$1.registry.unregister;
	Graph.unregisterEdge = Edge$1.registry.unregister;
	Graph.unregisterView = CellView.registry.unregister;
	Graph.unregisterAttr = Attr.registry.unregister;
	Graph.unregisterGrid = Grid.registry.unregister;
	Graph.unregisterFilter = Filter.registry.unregister;
	Graph.unregisterNodeTool = NodeTool.registry.unregister;
	Graph.unregisterEdgeTool = EdgeTool.registry.unregister;
	Graph.unregisterBackground = Background.registry.unregister;
	Graph.unregisterHighlighter = Highlighter.registry.unregister;
	Graph.unregisterPortLayout = PortLayout.registry.unregister;
	Graph.unregisterPortLabelLayout = PortLabelLayout.registry.unregister;
	Graph.unregisterMarker = Marker.registry.unregister;
	Graph.unregisterRouter = Router.registry.unregister;
	Graph.unregisterConnector = Connector.registry.unregister;
	Graph.unregisterAnchor = NodeAnchor.registry.unregister;
	Graph.unregisterEdgeAnchor = EdgeAnchor.registry.unregister;
	Graph.unregisterConnectionPoint = ConnectionPoint.registry.unregister;
})(Graph || (Graph = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6@2.19.2/node_modules/@antv/x6/es/shape/html.js
var __decorate$10 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest$3 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var HTML = class extends Node$1 {};
(function(HTML) {
	class View extends NodeView {
		init() {
			super.init();
			this.cell.on("change:*", this.onCellChangeAny, this);
		}
		onCellChangeAny({ key }) {
			const content = HTML.shapeMaps[this.cell.shape];
			if (content) {
				const { effect } = content;
				if (!effect || effect.includes(key)) this.renderHTMLComponent();
			}
		}
		confirmUpdate(flag) {
			const ret = super.confirmUpdate(flag);
			return this.handleAction(ret, View.action, () => this.renderHTMLComponent());
		}
		renderHTMLComponent() {
			const container = this.selectors && this.selectors.foContent;
			if (container) {
				empty(container);
				const content = HTML.shapeMaps[this.cell.shape];
				if (!content) return;
				let { html } = content;
				if (typeof html === "function") html = html(this.cell);
				if (html) if (typeof html === "string") container.innerHTML = html;
				else append(container, html);
			}
		}
		dispose() {
			this.cell.off("change:*", this.onCellChangeAny, this);
		}
	}
	__decorate$10([View.dispose()], View.prototype, "dispose", null);
	HTML.View = View;
	(function(View) {
		View.action = "html";
		View.config({
			bootstrap: [View.action],
			actions: { html: View.action }
		});
		NodeView.registry.register("html-view", View, true);
	})(View = HTML.View || (HTML.View = {}));
})(HTML || (HTML = {}));
(function(HTML) {
	HTML.config({
		view: "html-view",
		markup: [
			{
				tagName: "rect",
				selector: "body"
			},
			Object.assign({}, Markup.getForeignObjectMarkup()),
			{
				tagName: "text",
				selector: "label"
			}
		],
		attrs: {
			body: {
				fill: "none",
				stroke: "none",
				refWidth: "100%",
				refHeight: "100%"
			},
			fo: {
				refWidth: "100%",
				refHeight: "100%"
			}
		}
	});
	Node$1.registry.register("html", HTML, true);
})(HTML || (HTML = {}));
(function(HTML) {
	HTML.shapeMaps = {};
	function register(config) {
		const { shape, html, effect, inherit } = config, others = __rest$3(config, [
			"shape",
			"html",
			"effect",
			"inherit"
		]);
		if (!shape) throw new Error("should specify shape in config");
		HTML.shapeMaps[shape] = {
			html,
			effect
		};
		Graph.registerNode(shape, Object.assign({ inherit: inherit || "html" }, others), true);
	}
	HTML.register = register;
})(HTML || (HTML = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-snapline@2.1.7_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-snapline/es/snapline.js
var __decorate$9 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest$2 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var SnaplineImpl = class extends View {
	get model() {
		return this.graph.model;
	}
	get containerClassName() {
		return this.prefixClassName("widget-snapline");
	}
	get verticalClassName() {
		return `${this.containerClassName}-vertical`;
	}
	get horizontalClassName() {
		return `${this.containerClassName}-horizontal`;
	}
	constructor(options) {
		super();
		const { graph } = options, others = __rest$2(options, ["graph"]);
		this.graph = graph;
		this.options = Object.assign({}, others);
		this.offset = {
			x: 0,
			y: 0
		};
		this.render();
		if (!this.disabled) this.startListening();
	}
	get disabled() {
		return this.options.enabled !== true;
	}
	enable() {
		if (this.disabled) {
			this.options.enabled = true;
			this.startListening();
		}
	}
	disable() {
		if (!this.disabled) {
			this.options.enabled = false;
			this.stopListening();
		}
	}
	setFilter(filter) {
		this.options.filter = filter;
	}
	render() {
		const container = this.containerWrapper = new Vector("svg");
		const horizontal = this.horizontal = new Vector("line");
		const vertical = this.vertical = new Vector("line");
		container.addClass(this.containerClassName);
		horizontal.addClass(this.horizontalClassName);
		vertical.addClass(this.verticalClassName);
		container.setAttribute("width", "100%");
		container.setAttribute("height", "100%");
		horizontal.setAttribute("display", "none");
		vertical.setAttribute("display", "none");
		container.append([horizontal, vertical]);
		if (this.options.className) container.addClass(this.options.className);
		this.container = this.containerWrapper.node;
	}
	startListening() {
		this.stopListening();
		this.graph.on("node:mousedown", this.captureCursorOffset, this);
		this.graph.on("node:mousemove", this.snapOnMoving, this);
		this.model.on("batch:stop", this.onBatchStop, this);
		this.delegateDocumentEvents({
			mouseup: "hide",
			touchend: "hide"
		});
	}
	stopListening() {
		this.graph.off("node:mousedown", this.captureCursorOffset, this);
		this.graph.off("node:mousemove", this.snapOnMoving, this);
		this.model.off("batch:stop", this.onBatchStop, this);
		this.undelegateDocumentEvents();
	}
	onBatchStop({ name, data }) {
		if (name === "resize") this.snapOnResizing(data.cell, data);
	}
	captureCursorOffset({ view, x, y }) {
		const targetView = view.getDelegatedView();
		if (targetView && this.isNodeMovable(targetView)) {
			const pos = view.cell.getPosition();
			this.offset = {
				x: x - pos.x,
				y: y - pos.y
			};
		}
	}
	isNodeMovable(view) {
		return view && view.cell.isNode() && view.can("nodeMovable");
	}
	getRestrictArea(view) {
		const restrict = this.graph.options.translating.restrict;
		const area = typeof restrict === "function" ? call$1(restrict, this.graph, view) : restrict;
		if (typeof area === "number") return this.graph.transform.getGraphArea().inflate(area);
		if (area === true) return this.graph.transform.getGraphArea();
		return area || null;
	}
	snapOnResizing(node, options) {
		if (this.options.resizing && !options.snapped && options.ui && options.direction && options.trueDirection) {
			const view = this.graph.renderer.findViewByCell(node);
			if (view && view.cell.isNode()) {
				const nodeBbox = node.getBBox();
				const nodeBBoxRotated = nodeBbox.bbox(node.getAngle());
				const nodeTopLeft = nodeBBoxRotated.getTopLeft();
				const nodeBottomRight = nodeBBoxRotated.getBottomRight();
				const angle = Angle.normalize(node.getAngle());
				const tolerance = this.options.tolerance || 0;
				let verticalLeft;
				let verticalTop;
				let verticalHeight;
				let horizontalTop;
				let horizontalLeft;
				let horizontalWidth;
				const snapOrigin = {
					vertical: 0,
					horizontal: 0
				};
				const direction = options.direction;
				const trueDirection = options.trueDirection;
				const relativeDirection = options.relativeDirection;
				if (trueDirection.indexOf("right") !== -1) snapOrigin.vertical = nodeBottomRight.x;
				else snapOrigin.vertical = nodeTopLeft.x;
				if (trueDirection.indexOf("bottom") !== -1) snapOrigin.horizontal = nodeBottomRight.y;
				else snapOrigin.horizontal = nodeTopLeft.y;
				this.model.getNodes().some((cell) => {
					if (this.isIgnored(node, cell)) return false;
					const snapBBox = cell.getBBox().bbox(cell.getAngle());
					const snapTopLeft = snapBBox.getTopLeft();
					const snapBottomRight = snapBBox.getBottomRight();
					const groups = {
						vertical: [snapTopLeft.x, snapBottomRight.x],
						horizontal: [snapTopLeft.y, snapBottomRight.y]
					};
					const distances = {};
					Object.keys(groups).forEach((k) => {
						const key = k;
						const list = groups[key].map((value) => ({
							position: value,
							distance: Math.abs(value - snapOrigin[key])
						})).filter((item) => item.distance <= tolerance);
						distances[key] = sortBy(list, (item) => item.distance);
					});
					if (verticalLeft == null && distances.vertical.length > 0) {
						verticalLeft = distances.vertical[0].position;
						verticalTop = Math.min(nodeBBoxRotated.y, snapBBox.y);
						verticalHeight = Math.max(nodeBottomRight.y, snapBottomRight.y) - verticalTop;
					}
					if (horizontalTop == null && distances.horizontal.length > 0) {
						horizontalTop = distances.horizontal[0].position;
						horizontalLeft = Math.min(nodeBBoxRotated.x, snapBBox.x);
						horizontalWidth = Math.max(nodeBottomRight.x, snapBottomRight.x) - horizontalLeft;
					}
					return verticalLeft != null && horizontalTop != null;
				});
				this.hide();
				let dx = 0;
				let dy = 0;
				if (horizontalTop != null || verticalLeft != null) {
					if (verticalLeft != null) dx = trueDirection.indexOf("right") !== -1 ? verticalLeft - nodeBottomRight.x : nodeTopLeft.x - verticalLeft;
					if (horizontalTop != null) dy = trueDirection.indexOf("bottom") !== -1 ? horizontalTop - nodeBottomRight.y : nodeTopLeft.y - horizontalTop;
				}
				let dWidth = 0;
				let dHeight = 0;
				if (angle % 90 === 0) if (angle === 90 || angle === 270) {
					dWidth = dy;
					dHeight = dx;
				} else {
					dWidth = dx;
					dHeight = dy;
				}
				else {
					const quadrant = angle >= 0 && angle < 90 ? 1 : angle >= 90 && angle < 180 ? 4 : angle >= 180 && angle < 270 ? 3 : 2;
					if (horizontalTop != null && verticalLeft != null) if (dx < dy) {
						dy = 0;
						horizontalTop = void 0;
					} else {
						dx = 0;
						verticalLeft = void 0;
					}
					const rad = Angle.toRad(angle % 90);
					if (dx) dWidth = quadrant === 3 ? dx / Math.cos(rad) : dx / Math.sin(rad);
					if (dy) dHeight = quadrant === 3 ? dy / Math.cos(rad) : dy / Math.sin(rad);
					const quadrant13 = quadrant === 1 || quadrant === 3;
					switch (relativeDirection) {
						case "top":
						case "bottom":
							dHeight = dy ? dy / (quadrant13 ? Math.cos(rad) : Math.sin(rad)) : dx / (quadrant13 ? Math.sin(rad) : Math.cos(rad));
							break;
						case "left":
						case "right": dWidth = dx ? dx / (quadrant13 ? Math.cos(rad) : Math.sin(rad)) : dy / (quadrant13 ? Math.sin(rad) : Math.cos(rad));
					}
				}
				switch (relativeDirection) {
					case "top":
					case "bottom":
						dWidth = 0;
						break;
					case "left":
					case "right": dHeight = 0;
				}
				const gridSize = this.graph.getGridSize();
				let newWidth = Math.max(nodeBbox.width + dWidth, gridSize);
				let newHeight = Math.max(nodeBbox.height + dHeight, gridSize);
				if (options.minWidth && options.minWidth > gridSize) newWidth = Math.max(newWidth, options.minWidth);
				if (options.minHeight && options.minHeight > gridSize) newHeight = Math.max(newHeight, options.minHeight);
				if (options.maxWidth) newWidth = Math.min(newWidth, options.maxWidth);
				if (options.maxHeight) newHeight = Math.min(newHeight, options.maxHeight);
				if (options.preserveAspectRatio) if (dHeight < dWidth) newHeight = newWidth * (nodeBbox.height / nodeBbox.width);
				else newWidth = newHeight * (nodeBbox.width / nodeBbox.height);
				if (newWidth !== nodeBbox.width || newHeight !== nodeBbox.height) {
					node.resize(newWidth, newHeight, {
						direction,
						relativeDirection,
						trueDirection,
						snapped: true,
						snaplines: this.cid,
						restrict: this.getRestrictArea(view)
					});
					if (verticalHeight) verticalHeight += newHeight - nodeBbox.height;
					if (horizontalWidth) horizontalWidth += newWidth - nodeBbox.width;
				}
				const newRotatedBBox = node.getBBox().bbox(angle);
				if (verticalLeft && Math.abs(newRotatedBBox.x - verticalLeft) > 1 && Math.abs(newRotatedBBox.width + newRotatedBBox.x - verticalLeft) > 1) verticalLeft = void 0;
				if (horizontalTop && Math.abs(newRotatedBBox.y - horizontalTop) > 1 && Math.abs(newRotatedBBox.height + newRotatedBBox.y - horizontalTop) > 1) horizontalTop = void 0;
				this.update({
					verticalLeft,
					verticalTop,
					verticalHeight,
					horizontalTop,
					horizontalLeft,
					horizontalWidth
				});
			}
		}
	}
	snapOnMoving({ view, e, x, y }) {
		const targetView = view.getEventData(e).delegatedView || view;
		if (!this.isNodeMovable(targetView)) return;
		const node = targetView.cell;
		const size = node.getSize();
		const position = node.getPosition();
		const cellBBox = new Rectangle(x - this.offset.x, y - this.offset.y, size.width, size.height);
		const angle = node.getAngle();
		const nodeCenter = cellBBox.getCenter();
		const nodeBBoxRotated = cellBBox.bbox(angle);
		const nodeTopLeft = nodeBBoxRotated.getTopLeft();
		const nodeBottomRight = nodeBBoxRotated.getBottomRight();
		const distance = this.options.tolerance || 0;
		let verticalLeft;
		let verticalTop;
		let verticalHeight;
		let horizontalTop;
		let horizontalLeft;
		let horizontalWidth;
		let verticalFix = 0;
		let horizontalFix = 0;
		this.model.getNodes().some((targetNode) => {
			if (this.isIgnored(node, targetNode)) return false;
			const snapBBox = targetNode.getBBox().bbox(targetNode.getAngle());
			const snapCenter = snapBBox.getCenter();
			const snapTopLeft = snapBBox.getTopLeft();
			const snapBottomRight = snapBBox.getBottomRight();
			if (verticalLeft == null) {
				if (Math.abs(snapCenter.x - nodeCenter.x) < distance) {
					verticalLeft = snapCenter.x;
					verticalFix = .5;
				} else if (Math.abs(snapTopLeft.x - nodeTopLeft.x) < distance) {
					verticalLeft = snapTopLeft.x;
					verticalFix = 0;
				} else if (Math.abs(snapTopLeft.x - nodeBottomRight.x) < distance) {
					verticalLeft = snapTopLeft.x;
					verticalFix = 1;
				} else if (Math.abs(snapBottomRight.x - nodeBottomRight.x) < distance) {
					verticalLeft = snapBottomRight.x;
					verticalFix = 1;
				} else if (Math.abs(snapBottomRight.x - nodeTopLeft.x) < distance) verticalLeft = snapBottomRight.x;
				if (verticalLeft != null) {
					verticalTop = Math.min(nodeBBoxRotated.y, snapBBox.y);
					verticalHeight = Math.max(nodeBottomRight.y, snapBottomRight.y) - verticalTop;
				}
			}
			if (horizontalTop == null) {
				if (Math.abs(snapCenter.y - nodeCenter.y) < distance) {
					horizontalTop = snapCenter.y;
					horizontalFix = .5;
				} else if (Math.abs(snapTopLeft.y - nodeTopLeft.y) < distance) horizontalTop = snapTopLeft.y;
				else if (Math.abs(snapTopLeft.y - nodeBottomRight.y) < distance) {
					horizontalTop = snapTopLeft.y;
					horizontalFix = 1;
				} else if (Math.abs(snapBottomRight.y - nodeBottomRight.y) < distance) {
					horizontalTop = snapBottomRight.y;
					horizontalFix = 1;
				} else if (Math.abs(snapBottomRight.y - nodeTopLeft.y) < distance) horizontalTop = snapBottomRight.y;
				if (horizontalTop != null) {
					horizontalLeft = Math.min(nodeBBoxRotated.x, snapBBox.x);
					horizontalWidth = Math.max(nodeBottomRight.x, snapBottomRight.x) - horizontalLeft;
				}
			}
			return verticalLeft != null && horizontalTop != null;
		});
		this.hide();
		if (horizontalTop != null || verticalLeft != null) {
			if (horizontalTop != null) nodeBBoxRotated.y = horizontalTop - horizontalFix * nodeBBoxRotated.height;
			if (verticalLeft != null) nodeBBoxRotated.x = verticalLeft - verticalFix * nodeBBoxRotated.width;
			const newCenter = nodeBBoxRotated.getCenter();
			const newX = newCenter.x - cellBBox.width / 2;
			const newY = newCenter.y - cellBBox.height / 2;
			const dx = newX - position.x;
			const dy = newY - position.y;
			if (dx !== 0 || dy !== 0) {
				node.translate(dx, dy, {
					snapped: true,
					restrict: this.getRestrictArea(targetView)
				});
				if (horizontalWidth) horizontalWidth += dx;
				if (verticalHeight) verticalHeight += dy;
			}
			this.update({
				verticalLeft,
				verticalTop,
				verticalHeight,
				horizontalTop,
				horizontalLeft,
				horizontalWidth
			});
		}
	}
	isIgnored(snapNode, targetNode) {
		return targetNode.id === snapNode.id || targetNode.isDescendantOf(snapNode) || !this.filter(targetNode);
	}
	filter(node) {
		const filter = this.options.filter;
		if (Array.isArray(filter)) return filter.some((item) => {
			if (typeof item === "string") return node.shape === item;
			return node.id === item.id;
		});
		if (typeof filter === "function") return call$1(filter, this.graph, node);
		return true;
	}
	update(metadata) {
		if (metadata.horizontalTop) {
			const start = this.graph.localToGraph(new Point(metadata.horizontalLeft, metadata.horizontalTop));
			const end = this.graph.localToGraph(new Point(metadata.horizontalLeft + metadata.horizontalWidth, metadata.horizontalTop));
			this.horizontal.setAttributes({
				x1: this.options.sharp ? `${start.x}` : "0",
				y1: `${start.y}`,
				x2: this.options.sharp ? `${end.x}` : "100%",
				y2: `${end.y}`,
				display: "inherit"
			});
		} else this.horizontal.setAttribute("display", "none");
		if (metadata.verticalLeft) {
			const start = this.graph.localToGraph(new Point(metadata.verticalLeft, metadata.verticalTop));
			const end = this.graph.localToGraph(new Point(metadata.verticalLeft, metadata.verticalTop + metadata.verticalHeight));
			this.vertical.setAttributes({
				x1: `${start.x}`,
				y1: this.options.sharp ? `${start.y}` : "0",
				x2: `${end.x}`,
				y2: this.options.sharp ? `${end.y}` : "100%",
				display: "inherit"
			});
		} else this.vertical.setAttribute("display", "none");
		this.show();
	}
	resetTimer() {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	}
	show() {
		this.resetTimer();
		if (this.container.parentNode == null) this.graph.container.appendChild(this.container);
		return this;
	}
	hide() {
		this.resetTimer();
		this.vertical.setAttribute("display", "none");
		this.horizontal.setAttribute("display", "none");
		const clean = this.options.clean;
		const delay = typeof clean === "number" ? clean : clean !== false ? 3e3 : 0;
		if (delay > 0) this.timer = window.setTimeout(() => {
			if (this.container.parentNode !== null) this.unmount();
		}, delay);
		return this;
	}
	onRemove() {
		this.stopListening();
		this.hide();
	}
	dispose() {
		this.remove();
	}
};
__decorate$9([View.dispose()], SnaplineImpl.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-snapline@2.1.7_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-snapline/es/style/raw.js
/**
* Auto generated file, do not modify it!
*/
var content$2 = `.x6-widget-snapline {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  pointer-events: none;
}
.x6-widget-snapline-vertical,
.x6-widget-snapline-horizontal {
  stroke: #2ecc71;
  stroke-width: 1px;
}
`;
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-snapline@2.1.7_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-snapline/es/api.js
Graph.prototype.isSnaplineEnabled = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) return snapline.isEnabled();
	return false;
};
Graph.prototype.enableSnapline = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.enable();
	return this;
};
Graph.prototype.disableSnapline = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.disable();
	return this;
};
Graph.prototype.toggleSnapline = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.toggleEnabled();
	return this;
};
Graph.prototype.hideSnapline = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.hide();
	return this;
};
Graph.prototype.setSnaplineFilter = function(filter) {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.setFilter(filter);
	return this;
};
Graph.prototype.isSnaplineOnResizingEnabled = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) return snapline.isOnResizingEnabled();
	return false;
};
Graph.prototype.enableSnaplineOnResizing = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.enableOnResizing();
	return this;
};
Graph.prototype.disableSnaplineOnResizing = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.disableOnResizing();
	return this;
};
Graph.prototype.toggleSnaplineOnResizing = function(enableOnResizing) {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.toggleOnResizing(enableOnResizing);
	return this;
};
Graph.prototype.isSharpSnapline = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) return snapline.isSharp();
	return false;
};
Graph.prototype.enableSharpSnapline = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.enableSharp();
	return this;
};
Graph.prototype.disableSharpSnapline = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.disableSharp();
	return this;
};
Graph.prototype.toggleSharpSnapline = function(sharp) {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.toggleSharp(sharp);
	return this;
};
Graph.prototype.getSnaplineTolerance = function() {
	const snapline = this.getPlugin("snapline");
	if (snapline) return snapline.getTolerance();
};
Graph.prototype.setSnaplineTolerance = function(tolerance) {
	const snapline = this.getPlugin("snapline");
	if (snapline) snapline.setTolerance(tolerance);
	return this;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-snapline@2.1.7_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-snapline/es/index.js
var __decorate$8 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Snapline = class extends Disposable {
	constructor(options = {}) {
		super();
		this.name = "snapline";
		this.options = Object.assign({
			enabled: true,
			tolerance: 10
		}, options);
		ensure(this.name, content$2);
	}
	init(graph) {
		this.snaplineImpl = new SnaplineImpl(Object.assign(Object.assign({}, this.options), { graph }));
	}
	isEnabled() {
		return !this.snaplineImpl.disabled;
	}
	enable() {
		this.snaplineImpl.enable();
	}
	disable() {
		this.snaplineImpl.disable();
	}
	toggleEnabled(enabled) {
		if (enabled != null) {
			if (enabled !== this.isEnabled()) if (enabled) this.enable();
			else this.disable();
		} else {
			if (this.isEnabled()) this.disable();
			else this.enable();
			return this;
		}
	}
	hide() {
		this.snaplineImpl.hide();
		return this;
	}
	setFilter(filter) {
		this.snaplineImpl.setFilter(filter);
		return this;
	}
	isOnResizingEnabled() {
		return this.snaplineImpl.options.resizing === true;
	}
	enableOnResizing() {
		this.snaplineImpl.options.resizing = true;
		return this;
	}
	disableOnResizing() {
		this.snaplineImpl.options.resizing = false;
		return this;
	}
	toggleOnResizing(enableOnResizing) {
		if (enableOnResizing != null) {
			if (enableOnResizing !== this.isOnResizingEnabled()) if (enableOnResizing) this.enableOnResizing();
			else this.disableOnResizing();
		} else if (this.isOnResizingEnabled()) this.disableOnResizing();
		else this.enableOnResizing();
		return this;
	}
	isSharp() {
		return this.snaplineImpl.options.sharp === true;
	}
	enableSharp() {
		this.snaplineImpl.options.sharp = true;
		return this;
	}
	disableSharp() {
		this.snaplineImpl.options.sharp = false;
		return this;
	}
	toggleSharp(sharp) {
		if (sharp != null) {
			if (sharp !== this.isSharp()) if (sharp) this.enableSharp();
			else this.disableSharp();
		} else if (this.isSharp()) this.disableSharp();
		else this.enableSharp();
		return this;
	}
	getTolerance() {
		return this.snaplineImpl.options.tolerance;
	}
	setTolerance(tolerance) {
		this.snaplineImpl.options.tolerance = tolerance;
		return this;
	}
	captureCursorOffset(e) {
		this.snaplineImpl.captureCursorOffset(e);
	}
	snapOnMoving(args) {
		this.snaplineImpl.snapOnMoving(args);
	}
	dispose() {
		this.snaplineImpl.dispose();
		clean(this.name);
	}
};
__decorate$8([Disposable.dispose()], Snapline.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-selection@2.2.2_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-selection/es/selection.js
var __decorate$7 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SelectionImpl = class extends View {
	get graph() {
		return this.options.graph;
	}
	get boxClassName() {
		return this.prefixClassName(Private.classNames.box);
	}
	get $boxes() {
		return children(this.container, this.boxClassName);
	}
	get handleOptions() {
		return this.options;
	}
	constructor(options) {
		super();
		this.options = options;
		if (this.options.model) this.options.collection = this.options.model.collection;
		if (this.options.collection) this.collection = this.options.collection;
		else {
			this.collection = new Collection([], { comparator: Private.depthComparator });
			this.options.collection = this.collection;
		}
		this.boxCount = 0;
		this.createContainer();
		this.startListening();
	}
	startListening() {
		const graph = this.graph;
		const collection = this.collection;
		this.delegateEvents({
			[`mousedown .${this.boxClassName}`]: "onSelectionBoxMouseDown",
			[`touchstart .${this.boxClassName}`]: "onSelectionBoxMouseDown"
		}, true);
		graph.on("scale", this.onGraphTransformed, this);
		graph.on("translate", this.onGraphTransformed, this);
		graph.model.on("updated", this.onModelUpdated, this);
		collection.on("added", this.onCellAdded, this);
		collection.on("removed", this.onCellRemoved, this);
		collection.on("reseted", this.onReseted, this);
		collection.on("updated", this.onCollectionUpdated, this);
		collection.on("node:change:position", this.onNodePositionChanged, this);
		collection.on("cell:changed", this.onCellChanged, this);
	}
	stopListening() {
		const graph = this.graph;
		const collection = this.collection;
		this.undelegateEvents();
		graph.off("scale", this.onGraphTransformed, this);
		graph.off("translate", this.onGraphTransformed, this);
		graph.model.off("updated", this.onModelUpdated, this);
		collection.off("added", this.onCellAdded, this);
		collection.off("removed", this.onCellRemoved, this);
		collection.off("reseted", this.onReseted, this);
		collection.off("updated", this.onCollectionUpdated, this);
		collection.off("node:change:position", this.onNodePositionChanged, this);
		collection.off("cell:changed", this.onCellChanged, this);
	}
	onRemove() {
		this.stopListening();
	}
	onGraphTransformed() {
		this.updateSelectionBoxes();
	}
	onCellChanged() {
		this.updateSelectionBoxes();
	}
	onNodePositionChanged({ node, options }) {
		const { showNodeSelectionBox, pointerEvents } = this.options;
		const { ui, selection, translateBy, snapped } = options;
		const allowTranslating = (showNodeSelectionBox !== true || pointerEvents && this.getPointerEventsValue(pointerEvents) === "none") && !this.translating && !selection;
		const translateByUi = ui && translateBy && node.id === translateBy;
		if (allowTranslating && (translateByUi || snapped)) {
			this.translating = true;
			const current = node.position();
			const previous = node.previous("position");
			const dx = current.x - previous.x;
			const dy = current.y - previous.y;
			if (dx !== 0 || dy !== 0) this.translateSelectedNodes(dx, dy, node, options);
			this.translating = false;
		}
	}
	onModelUpdated({ removed }) {
		if (removed && removed.length) this.unselect(removed);
	}
	isEmpty() {
		return this.length <= 0;
	}
	isSelected(cell) {
		return this.collection.has(cell);
	}
	get length() {
		return this.collection.length;
	}
	get cells() {
		return this.collection.toArray();
	}
	select(cells, options = {}) {
		options.dryrun = true;
		const items = this.filter(Array.isArray(cells) ? cells : [cells]);
		this.collection.add(items, options);
		return this;
	}
	unselect(cells, options = {}) {
		options.dryrun = true;
		this.collection.remove(Array.isArray(cells) ? cells : [cells], options);
		return this;
	}
	reset(cells, options = {}) {
		if (cells) {
			if (options.batch) {
				const filterCells = this.filter(Array.isArray(cells) ? cells : [cells]);
				this.collection.reset(filterCells, Object.assign(Object.assign({}, options), { ui: true }));
				return this;
			}
			const prev = this.cells;
			const next = this.filter(Array.isArray(cells) ? cells : [cells]);
			const prevMap = {};
			const nextMap = {};
			prev.forEach((cell) => prevMap[cell.id] = cell);
			next.forEach((cell) => nextMap[cell.id] = cell);
			const added = [];
			const removed = [];
			next.forEach((cell) => {
				if (!prevMap[cell.id]) added.push(cell);
			});
			prev.forEach((cell) => {
				if (!nextMap[cell.id]) removed.push(cell);
			});
			if (removed.length) this.unselect(removed, Object.assign(Object.assign({}, options), { ui: true }));
			if (added.length) this.select(added, Object.assign(Object.assign({}, options), { ui: true }));
			if (removed.length === 0 && added.length === 0) this.updateContainer();
			return this;
		}
		return this.clean(options);
	}
	clean(options = {}) {
		if (this.length) if (options.batch === false) this.unselect(this.cells, options);
		else this.collection.reset([], Object.assign(Object.assign({}, options), { ui: true }));
		return this;
	}
	setFilter(filter) {
		this.options.filter = filter;
	}
	setContent(content) {
		this.options.content = content;
	}
	startSelecting(evt) {
		evt = this.normalizeEvent(evt);
		this.clean();
		let x;
		let y;
		const graphContainer = this.graph.container;
		if (evt.offsetX != null && evt.offsetY != null && graphContainer.contains(evt.target)) {
			x = evt.offsetX;
			y = evt.offsetY;
		} else {
			const offset = offset$1(graphContainer);
			const scrollLeft = graphContainer.scrollLeft;
			const scrollTop = graphContainer.scrollTop;
			x = evt.clientX - offset.left + window.pageXOffset + scrollLeft;
			y = evt.clientY - offset.top + window.pageYOffset + scrollTop;
		}
		css(this.container, {
			top: y,
			left: x,
			width: 1,
			height: 1
		});
		this.setEventData(evt, {
			action: "selecting",
			clientX: evt.clientX,
			clientY: evt.clientY,
			offsetX: x,
			offsetY: y,
			scrollerX: 0,
			scrollerY: 0,
			moving: false
		});
		this.delegateDocumentEvents(Private.documentEvents, evt.data);
	}
	filter(cells) {
		const filter = this.options.filter;
		return cells.filter((cell) => {
			if (Array.isArray(filter)) return filter.some((item) => {
				if (typeof item === "string") return cell.shape === item;
				return cell.id === item.id;
			});
			if (typeof filter === "function") return call$1(filter, this.graph, cell);
			return true;
		});
	}
	stopSelecting(evt) {
		const graph = this.graph;
		const eventData = this.getEventData(evt);
		switch (eventData.action) {
			case "selecting": {
				let width$1 = width(this.container);
				let height$1 = height(this.container);
				const offset = offset$1(this.container);
				const origin = graph.pageToLocal(offset.left, offset.top);
				const scale = graph.transform.getScale();
				width$1 /= scale.sx;
				height$1 /= scale.sy;
				const rect = new Rectangle(origin.x, origin.y, width$1, height$1);
				const cells = this.getCellViewsInArea(rect).map((view) => view.cell);
				this.reset(cells, { batch: true });
				this.hideRubberband();
				break;
			}
			case "translating": {
				const client = graph.snapToGrid(evt.clientX, evt.clientY);
				if (!this.options.following) {
					const data = eventData;
					this.updateSelectedNodesPosition({
						dx: data.clientX - data.originX,
						dy: data.clientY - data.originY
					});
				}
				this.graph.model.stopBatch("move-selection");
				this.notifyBoxEvent("box:mouseup", evt, client.x, client.y);
				break;
			}
			default: this.clean();
		}
	}
	onMouseUp(evt) {
		if (this.getEventData(evt).action) {
			this.stopSelecting(evt);
			this.undelegateDocumentEvents();
		}
	}
	onSelectionBoxMouseDown(evt) {
		if (!this.options.following) evt.stopPropagation();
		const e = this.normalizeEvent(evt);
		if (this.options.movable) this.startTranslating(e);
		const activeView = this.getCellViewFromElem(e.target);
		this.setEventData(e, { activeView });
		const client = this.graph.snapToGrid(e.clientX, e.clientY);
		this.notifyBoxEvent("box:mousedown", e, client.x, client.y);
		this.delegateDocumentEvents(Private.documentEvents, e.data);
	}
	startTranslating(evt) {
		this.graph.model.startBatch("move-selection");
		const client = this.graph.snapToGrid(evt.clientX, evt.clientY);
		this.setEventData(evt, {
			action: "translating",
			clientX: client.x,
			clientY: client.y,
			originX: client.x,
			originY: client.y
		});
	}
	getRestrictArea() {
		const restrict = this.graph.options.translating.restrict;
		const area = typeof restrict === "function" ? call$1(restrict, this.graph, null) : restrict;
		if (typeof area === "number") return this.graph.transform.getGraphArea().inflate(area);
		if (area === true) return this.graph.transform.getGraphArea();
		return area || null;
	}
	getSelectionOffset(client, data) {
		let dx = client.x - data.clientX;
		let dy = client.y - data.clientY;
		const restrict = this.getRestrictArea();
		if (restrict) {
			const cells = this.collection.toArray();
			const totalBBox = Cell.getCellsBBox(cells, { deep: true }) || Rectangle.create();
			const minDx = restrict.x - totalBBox.x;
			const minDy = restrict.y - totalBBox.y;
			const maxDx = restrict.x + restrict.width - (totalBBox.x + totalBBox.width);
			const maxDy = restrict.y + restrict.height - (totalBBox.y + totalBBox.height);
			if (dx < minDx) dx = minDx;
			if (dy < minDy) dy = minDy;
			if (maxDx < dx) dx = maxDx;
			if (maxDy < dy) dy = maxDy;
			if (!this.options.following) {
				const offsetX = client.x - data.originX;
				const offsetY = client.y - data.originY;
				dx = offsetX <= minDx || offsetX >= maxDx ? 0 : dx;
				dy = offsetY <= minDy || offsetY >= maxDy ? 0 : dy;
			}
		}
		return {
			dx,
			dy
		};
	}
	updateElementPosition(elem, dLeft, dTop) {
		const strLeft = css(elem, "left");
		const strTop = css(elem, "top");
		const left = strLeft ? parseFloat(strLeft) : 0;
		const top = strTop ? parseFloat(strTop) : 0;
		css(elem, "left", left + dLeft);
		css(elem, "top", top + dTop);
	}
	updateSelectedNodesPosition(offset) {
		const { dx, dy } = offset;
		if (dx || dy) if (this.translateSelectedNodes(dx, dy), this.boxesUpdated) {
			if (this.collection.length > 1) this.updateSelectionBoxes();
		} else {
			const scale = this.graph.transform.getScale();
			for (let i = 0, $boxes = this.$boxes, len = $boxes.length; i < len; i += 1) this.updateElementPosition($boxes[i], dx * scale.sx, dy * scale.sy);
			this.updateElementPosition(this.selectionContainer, dx * scale.sx, dy * scale.sy);
		}
	}
	autoScrollGraph(x, y) {
		const scroller = this.graph.getPlugin("scroller");
		if (scroller) return scroller.autoScroll(x, y);
		return {
			scrollerX: 0,
			scrollerY: 0
		};
	}
	adjustSelection(evt) {
		const e = this.normalizeEvent(evt);
		const eventData = this.getEventData(e);
		switch (eventData.action) {
			case "selecting": {
				const data = eventData;
				if (data.moving !== true) {
					appendTo(this.container, this.graph.container);
					this.showRubberband();
					data.moving = true;
				}
				const { scrollerX, scrollerY } = this.autoScrollGraph(e.clientX, e.clientY);
				data.scrollerX += scrollerX;
				data.scrollerY += scrollerY;
				const dx = e.clientX - data.clientX + data.scrollerX;
				const dy = e.clientY - data.clientY + data.scrollerY;
				const left = parseInt(css(this.container, "left") || "0", 10);
				const top = parseInt(css(this.container, "top") || "0", 10);
				css(this.container, {
					left: dx < 0 ? data.offsetX + dx : left,
					top: dy < 0 ? data.offsetY + dy : top,
					width: Math.abs(dx),
					height: Math.abs(dy)
				});
				break;
			}
			case "translating": {
				const client = this.graph.snapToGrid(e.clientX, e.clientY);
				const data = eventData;
				const offset = this.getSelectionOffset(client, data);
				if (this.options.following) this.updateSelectedNodesPosition(offset);
				else this.updateContainerPosition(offset);
				if (offset.dx) data.clientX = client.x;
				if (offset.dy) data.clientY = client.y;
				this.notifyBoxEvent("box:mousemove", evt, client.x, client.y);
				break;
			}
		}
		this.boxesUpdated = false;
	}
	translateSelectedNodes(dx, dy, exclude, otherOptions) {
		const map = {};
		const excluded = [];
		if (exclude) map[exclude.id] = true;
		this.collection.toArray().forEach((cell) => {
			cell.getDescendants({ deep: true }).forEach((child) => {
				map[child.id] = true;
			});
		});
		if (otherOptions && otherOptions.translateBy) {
			const currentCell = this.graph.getCellById(otherOptions.translateBy);
			if (currentCell) {
				map[currentCell.id] = true;
				currentCell.getDescendants({ deep: true }).forEach((child) => {
					map[child.id] = true;
				});
				excluded.push(currentCell);
			}
		}
		this.collection.toArray().forEach((cell) => {
			if (!map[cell.id]) {
				const options = Object.assign(Object.assign({}, otherOptions), {
					selection: this.cid,
					exclude: excluded
				});
				cell.translate(dx, dy, options);
				this.graph.model.getConnectedEdges(cell).forEach((edge) => {
					if (!map[edge.id]) {
						edge.translate(dx, dy, options);
						map[edge.id] = true;
					}
				});
			}
		});
	}
	getCellViewsInArea(rect) {
		const graph = this.graph;
		const options = { strict: this.options.strict };
		let views = [];
		if (this.options.rubberNode) views = views.concat(graph.model.getNodesInArea(rect, options).map((node) => graph.renderer.findViewByCell(node)).filter((view) => view != null));
		if (this.options.rubberEdge) views = views.concat(graph.model.getEdgesInArea(rect, options).map((edge) => graph.renderer.findViewByCell(edge)).filter((view) => view != null));
		return views;
	}
	notifyBoxEvent(name, e, x, y) {
		const view = this.getEventData(e).activeView;
		this.trigger(name, {
			e,
			view,
			x,
			y,
			cell: view.cell
		});
	}
	getSelectedClassName(cell) {
		return this.prefixClassName(`${cell.isNode() ? "node" : "edge"}-selected`);
	}
	addCellSelectedClassName(cell) {
		const view = this.graph.renderer.findViewByCell(cell);
		if (view) view.addClass(this.getSelectedClassName(cell));
	}
	removeCellUnSelectedClassName(cell) {
		const view = this.graph.renderer.findViewByCell(cell);
		if (view) view.removeClass(this.getSelectedClassName(cell));
	}
	destroySelectionBox(cell) {
		this.removeCellUnSelectedClassName(cell);
		if (this.canShowSelectionBox(cell)) {
			remove(this.container.querySelector(`[data-cell-id="${cell.id}"]`));
			if (this.$boxes.length === 0) this.hide();
			this.boxCount = Math.max(0, this.boxCount - 1);
		}
	}
	destroyAllSelectionBoxes(cells) {
		cells.forEach((cell) => this.removeCellUnSelectedClassName(cell));
		this.hide();
		remove(this.$boxes);
		this.boxCount = 0;
	}
	hide() {
		removeClass(this.container, this.prefixClassName(Private.classNames.rubberband));
		removeClass(this.container, this.prefixClassName(Private.classNames.selected));
	}
	showRubberband() {
		addClass(this.container, this.prefixClassName(Private.classNames.rubberband));
	}
	hideRubberband() {
		removeClass(this.container, this.prefixClassName(Private.classNames.rubberband));
	}
	showSelected() {
		removeAttribute(this.container, "style");
		addClass(this.container, this.prefixClassName(Private.classNames.selected));
	}
	createContainer() {
		this.container = document.createElement("div");
		addClass(this.container, this.prefixClassName(Private.classNames.root));
		if (this.options.className) addClass(this.container, this.options.className);
		this.selectionContainer = document.createElement("div");
		addClass(this.selectionContainer, this.prefixClassName(Private.classNames.inner));
		this.selectionContent = document.createElement("div");
		addClass(this.selectionContent, this.prefixClassName(Private.classNames.content));
		append(this.selectionContainer, this.selectionContent);
		attr(this.selectionContainer, "data-selection-length", this.collection.length);
		prepend(this.container, this.selectionContainer);
	}
	updateContainerPosition(offset) {
		if (offset.dx || offset.dy) this.updateElementPosition(this.selectionContainer, offset.dx, offset.dy);
	}
	updateContainer() {
		const origin = {
			x: Infinity,
			y: Infinity
		};
		const corner = {
			x: 0,
			y: 0
		};
		this.collection.toArray().filter((cell) => this.canShowSelectionBox(cell)).forEach((cell) => {
			const view = this.graph.renderer.findViewByCell(cell);
			if (view) {
				const bbox = view.getBBox({ useCellGeometry: true });
				origin.x = Math.min(origin.x, bbox.x);
				origin.y = Math.min(origin.y, bbox.y);
				corner.x = Math.max(corner.x, bbox.x + bbox.width);
				corner.y = Math.max(corner.y, bbox.y + bbox.height);
			}
		});
		css(this.selectionContainer, {
			position: "absolute",
			pointerEvents: "none",
			left: origin.x,
			top: origin.y,
			width: corner.x - origin.x,
			height: corner.y - origin.y
		});
		attr(this.selectionContainer, "data-selection-length", this.collection.length);
		const boxContent = this.options.content;
		if (boxContent) if (typeof boxContent === "function") {
			const content = call$1(boxContent, this.graph, this, this.selectionContent);
			if (content) this.selectionContent.innerHTML = content;
		} else this.selectionContent.innerHTML = boxContent;
		if (this.collection.length > 0 && !this.container.parentNode) appendTo(this.container, this.graph.container);
		else if (this.collection.length <= 0 && this.container.parentNode) this.container.parentNode.removeChild(this.container);
	}
	canShowSelectionBox(cell) {
		return cell.isNode() && this.options.showNodeSelectionBox === true || cell.isEdge() && this.options.showEdgeSelectionBox === true;
	}
	getPointerEventsValue(pointerEvents) {
		return typeof pointerEvents === "string" ? pointerEvents : pointerEvents(this.cells);
	}
	createSelectionBox(cell) {
		this.addCellSelectedClassName(cell);
		if (this.canShowSelectionBox(cell)) {
			const view = this.graph.renderer.findViewByCell(cell);
			if (view) {
				const bbox = view.getBBox({ useCellGeometry: true });
				const className = this.boxClassName;
				const box = document.createElement("div");
				const pointerEvents = this.options.pointerEvents;
				addClass(box, className);
				addClass(box, `${className}-${cell.isNode() ? "node" : "edge"}`);
				attr(box, "data-cell-id", cell.id);
				css(box, {
					position: "absolute",
					left: bbox.x,
					top: bbox.y,
					width: bbox.width,
					height: bbox.height,
					pointerEvents: pointerEvents ? this.getPointerEventsValue(pointerEvents) : "auto"
				});
				appendTo(box, this.container);
				this.showSelected();
				this.boxCount += 1;
			}
		}
	}
	updateSelectionBoxes() {
		if (this.collection.length > 0) {
			this.boxesUpdated = true;
			this.confirmUpdate();
		}
	}
	confirmUpdate() {
		if (this.boxCount) {
			this.hide();
			for (let i = 0, $boxes = this.$boxes, len = $boxes.length; i < len; i += 1) {
				const box = $boxes[i];
				const cellId = attr(box, "data-cell-id");
				remove(box);
				this.boxCount -= 1;
				const cell = this.collection.get(cellId);
				if (cell) this.createSelectionBox(cell);
			}
			this.updateContainer();
		}
		return 0;
	}
	getCellViewFromElem(elem) {
		const id = elem.getAttribute("data-cell-id");
		if (id) {
			const cell = this.collection.get(id);
			if (cell) return this.graph.renderer.findViewByCell(cell);
		}
		return null;
	}
	onCellRemoved({ cell }) {
		this.destroySelectionBox(cell);
		this.updateContainer();
	}
	onReseted({ previous, current }) {
		this.destroyAllSelectionBoxes(previous);
		current.forEach((cell) => {
			this.listenCellRemoveEvent(cell);
			this.createSelectionBox(cell);
		});
		this.updateContainer();
	}
	onCellAdded({ cell }) {
		this.listenCellRemoveEvent(cell);
		this.createSelectionBox(cell);
		this.updateContainer();
	}
	listenCellRemoveEvent(cell) {
		cell.off("removed", this.onCellRemoved, this);
		cell.on("removed", this.onCellRemoved, this);
	}
	onCollectionUpdated({ added, removed, options }) {
		added.forEach((cell) => {
			this.trigger("cell:selected", {
				cell,
				options
			});
			if (cell.isNode()) this.trigger("node:selected", {
				cell,
				options,
				node: cell
			});
			else if (cell.isEdge()) this.trigger("edge:selected", {
				cell,
				options,
				edge: cell
			});
		});
		removed.forEach((cell) => {
			this.trigger("cell:unselected", {
				cell,
				options
			});
			if (cell.isNode()) this.trigger("node:unselected", {
				cell,
				options,
				node: cell
			});
			else if (cell.isEdge()) this.trigger("edge:unselected", {
				cell,
				options,
				edge: cell
			});
		});
		const args = {
			added,
			removed,
			options,
			selected: this.cells.filter((cell) => !!this.graph.getCellById(cell.id))
		};
		this.trigger("selection:changed", args);
	}
	dispose() {
		this.clean();
		this.remove();
		this.off();
	}
};
__decorate$7([View.dispose()], SelectionImpl.prototype, "dispose", null);
var Private;
(function(Private) {
	const base = "widget-selection";
	Private.classNames = {
		root: base,
		inner: `${base}-inner`,
		box: `${base}-box`,
		content: `${base}-content`,
		rubberband: `${base}-rubberband`,
		selected: `${base}-selected`
	};
	Private.documentEvents = {
		mousemove: "adjustSelection",
		touchmove: "adjustSelection",
		mouseup: "onMouseUp",
		touchend: "onMouseUp",
		touchcancel: "onMouseUp"
	};
	function depthComparator(cell) {
		return cell.getAncestors().length;
	}
	Private.depthComparator = depthComparator;
})(Private || (Private = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-selection@2.2.2_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-selection/es/style/raw.js
/**
* Auto generated file, do not modify it!
*/
var content$1 = `.x6-widget-selection {
  position: absolute;
  top: 0;
  left: 0;
  display: none;
  width: 0;
  height: 0;
  touch-action: none;
}
.x6-widget-selection-rubberband {
  display: block;
  overflow: visible;
  opacity: 0.3;
}
.x6-widget-selection-selected {
  display: block;
}
.x6-widget-selection-box {
  cursor: move;
}
.x6-widget-selection-inner[data-selection-length='0'],
.x6-widget-selection-inner[data-selection-length='1'] {
  display: none;
}
.x6-widget-selection-content {
  position: absolute;
  top: 100%;
  right: -20px;
  left: -20px;
  margin-top: 30px;
  padding: 6px;
  line-height: 14px;
  text-align: center;
  border-radius: 6px;
}
.x6-widget-selection-content:empty {
  display: none;
}
.x6-widget-selection-rubberband {
  background-color: #3498db;
  border: 2px solid #2980b9;
}
.x6-widget-selection-box {
  box-sizing: content-box !important;
  margin-top: -4px;
  margin-left: -4px;
  padding-right: 4px;
  padding-bottom: 4px;
  border: 2px dashed #feb663;
  box-shadow: 2px 2px 5px #d3d3d3;
}
.x6-widget-selection-inner {
  box-sizing: content-box !important;
  margin-top: -8px;
  margin-left: -8px;
  padding-right: 12px;
  padding-bottom: 12px;
  border: 2px solid #feb663;
  box-shadow: 2px 2px 5px #d3d3d3;
}
.x6-widget-selection-content {
  color: #fff;
  font-size: 10px;
  background-color: #6a6b8a;
}
`;
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-selection@2.2.2_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-selection/es/api.js
Graph.prototype.isSelectionEnabled = function() {
	const selection = this.getPlugin("selection");
	if (selection) return selection.isEnabled();
	return false;
};
Graph.prototype.enableSelection = function() {
	const selection = this.getPlugin("selection");
	if (selection) selection.enable();
	return this;
};
Graph.prototype.disableSelection = function() {
	const selection = this.getPlugin("selection");
	if (selection) selection.disable();
	return this;
};
Graph.prototype.toggleSelection = function(enabled) {
	const selection = this.getPlugin("selection");
	if (selection) selection.toggleEnabled(enabled);
	return this;
};
Graph.prototype.isMultipleSelection = function() {
	const selection = this.getPlugin("selection");
	if (selection) return selection.isMultipleSelection();
	return false;
};
Graph.prototype.enableMultipleSelection = function() {
	const selection = this.getPlugin("selection");
	if (selection) selection.enableMultipleSelection();
	return this;
};
Graph.prototype.disableMultipleSelection = function() {
	const selection = this.getPlugin("selection");
	if (selection) selection.disableMultipleSelection();
	return this;
};
Graph.prototype.toggleMultipleSelection = function(multiple) {
	const selection = this.getPlugin("selection");
	if (selection) selection.toggleMultipleSelection(multiple);
	return this;
};
Graph.prototype.isSelectionMovable = function() {
	const selection = this.getPlugin("selection");
	if (selection) return selection.isSelectionMovable();
	return false;
};
Graph.prototype.enableSelectionMovable = function() {
	const selection = this.getPlugin("selection");
	if (selection) selection.enableSelectionMovable();
	return this;
};
Graph.prototype.disableSelectionMovable = function() {
	const selection = this.getPlugin("selection");
	if (selection) selection.disableSelectionMovable();
	return this;
};
Graph.prototype.toggleSelectionMovable = function(movable) {
	const selection = this.getPlugin("selection");
	if (selection) selection.toggleSelectionMovable(movable);
	return this;
};
Graph.prototype.isRubberbandEnabled = function() {
	const selection = this.getPlugin("selection");
	if (selection) return selection.isRubberbandEnabled();
	return false;
};
Graph.prototype.enableRubberband = function() {
	const selection = this.getPlugin("selection");
	if (selection) selection.enableRubberband();
	return this;
};
Graph.prototype.disableRubberband = function() {
	const selection = this.getPlugin("selection");
	if (selection) selection.disableRubberband();
	return this;
};
Graph.prototype.toggleRubberband = function(enabled) {
	const selection = this.getPlugin("selection");
	if (selection) selection.toggleRubberband(enabled);
	return this;
};
Graph.prototype.isStrictRubberband = function() {
	const selection = this.getPlugin("selection");
	if (selection) return selection.isStrictRubberband();
	return false;
};
Graph.prototype.enableStrictRubberband = function() {
	const selection = this.getPlugin("selection");
	if (selection) selection.enableStrictRubberband();
	return this;
};
Graph.prototype.disableStrictRubberband = function() {
	const selection = this.getPlugin("selection");
	if (selection) selection.disableStrictRubberband();
	return this;
};
Graph.prototype.toggleStrictRubberband = function(strict) {
	const selection = this.getPlugin("selection");
	if (selection) selection.toggleStrictRubberband(strict);
	return this;
};
Graph.prototype.setRubberbandModifiers = function(modifiers) {
	const selection = this.getPlugin("selection");
	if (selection) selection.setRubberbandModifiers(modifiers);
	return this;
};
Graph.prototype.setSelectionFilter = function(filter) {
	const selection = this.getPlugin("selection");
	if (selection) selection.setSelectionFilter(filter);
	return this;
};
Graph.prototype.setSelectionDisplayContent = function(content) {
	const selection = this.getPlugin("selection");
	if (selection) selection.setSelectionDisplayContent(content);
	return this;
};
Graph.prototype.isSelectionEmpty = function() {
	const selection = this.getPlugin("selection");
	if (selection) return selection.isEmpty();
	return true;
};
Graph.prototype.cleanSelection = function(options) {
	const selection = this.getPlugin("selection");
	if (selection) selection.clean(options);
	return this;
};
Graph.prototype.resetSelection = function(cells, options) {
	const selection = this.getPlugin("selection");
	if (selection) selection.reset(cells, options);
	return this;
};
Graph.prototype.getSelectedCells = function() {
	const selection = this.getPlugin("selection");
	if (selection) return selection.getSelectedCells();
	return [];
};
Graph.prototype.getSelectedCellCount = function() {
	const selection = this.getPlugin("selection");
	if (selection) return selection.getSelectedCellCount();
	return 0;
};
Graph.prototype.isSelected = function(cell) {
	const selection = this.getPlugin("selection");
	if (selection) return selection.isSelected(cell);
	return false;
};
Graph.prototype.select = function(cells, options) {
	const selection = this.getPlugin("selection");
	if (selection) selection.select(cells, options);
	return this;
};
Graph.prototype.unselect = function(cells, options) {
	const selection = this.getPlugin("selection");
	if (selection) selection.unselect(cells, options);
	return this;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-selection@2.2.2_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-selection/es/index.js
var __decorate$6 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Selection = class Selection extends Basecoat {
	get rubberbandDisabled() {
		return this.options.enabled !== true || this.options.rubberband !== true;
	}
	get disabled() {
		return this.options.enabled !== true;
	}
	get length() {
		return this.selectionImpl.length;
	}
	get cells() {
		return this.selectionImpl.cells;
	}
	constructor(options = {}) {
		super();
		this.name = "selection";
		this.movedMap = /* @__PURE__ */ new WeakMap();
		this.unselectMap = /* @__PURE__ */ new WeakMap();
		this.options = Object.assign(Object.assign({ enabled: true }, Selection.defaultOptions), options);
		ensure(this.name, content$1);
	}
	init(graph) {
		this.graph = graph;
		this.selectionImpl = new SelectionImpl(Object.assign(Object.assign({}, this.options), { graph }));
		this.setup();
		this.startListening();
	}
	isEnabled() {
		return !this.disabled;
	}
	enable() {
		if (this.disabled) this.options.enabled = true;
	}
	disable() {
		if (!this.disabled) this.options.enabled = false;
	}
	toggleEnabled(enabled) {
		if (enabled != null) {
			if (enabled !== this.isEnabled()) if (enabled) this.enable();
			else this.disable();
		} else if (this.isEnabled()) this.disable();
		else this.enable();
		return this;
	}
	isMultipleSelection() {
		return this.isMultiple();
	}
	enableMultipleSelection() {
		this.enableMultiple();
		return this;
	}
	disableMultipleSelection() {
		this.disableMultiple();
		return this;
	}
	toggleMultipleSelection(multiple) {
		if (multiple != null) {
			if (multiple !== this.isMultipleSelection()) if (multiple) this.enableMultipleSelection();
			else this.disableMultipleSelection();
		} else if (this.isMultipleSelection()) this.disableMultipleSelection();
		else this.enableMultipleSelection();
		return this;
	}
	isSelectionMovable() {
		return this.options.movable !== false;
	}
	enableSelectionMovable() {
		this.selectionImpl.options.movable = true;
		return this;
	}
	disableSelectionMovable() {
		this.selectionImpl.options.movable = false;
		return this;
	}
	toggleSelectionMovable(movable) {
		if (movable != null) {
			if (movable !== this.isSelectionMovable()) if (movable) this.enableSelectionMovable();
			else this.disableSelectionMovable();
		} else if (this.isSelectionMovable()) this.disableSelectionMovable();
		else this.enableSelectionMovable();
		return this;
	}
	isRubberbandEnabled() {
		return !this.rubberbandDisabled;
	}
	enableRubberband() {
		if (this.rubberbandDisabled) this.options.rubberband = true;
		return this;
	}
	disableRubberband() {
		if (!this.rubberbandDisabled) this.options.rubberband = false;
		return this;
	}
	toggleRubberband(enabled) {
		if (enabled != null) {
			if (enabled !== this.isRubberbandEnabled()) if (enabled) this.enableRubberband();
			else this.disableRubberband();
		} else if (this.isRubberbandEnabled()) this.disableRubberband();
		else this.enableRubberband();
		return this;
	}
	isStrictRubberband() {
		return this.selectionImpl.options.strict === true;
	}
	enableStrictRubberband() {
		this.selectionImpl.options.strict = true;
		return this;
	}
	disableStrictRubberband() {
		this.selectionImpl.options.strict = false;
		return this;
	}
	toggleStrictRubberband(strict) {
		if (strict != null) {
			if (strict !== this.isStrictRubberband()) if (strict) this.enableStrictRubberband();
			else this.disableStrictRubberband();
		} else if (this.isStrictRubberband()) this.disableStrictRubberband();
		else this.enableStrictRubberband();
		return this;
	}
	setRubberbandModifiers(modifiers) {
		this.setModifiers(modifiers);
	}
	setSelectionFilter(filter) {
		this.setFilter(filter);
		return this;
	}
	setSelectionDisplayContent(content) {
		this.setContent(content);
		return this;
	}
	isEmpty() {
		return this.length <= 0;
	}
	clean(options = {}) {
		this.selectionImpl.clean(options);
		return this;
	}
	reset(cells, options = {}) {
		this.selectionImpl.reset(cells ? this.getCells(cells) : [], options);
		return this;
	}
	getSelectedCells() {
		return this.cells;
	}
	getSelectedCellCount() {
		return this.length;
	}
	isSelected(cell) {
		return this.selectionImpl.isSelected(cell);
	}
	select(cells, options = {}) {
		const selected = this.getCells(cells);
		if (selected.length) if (this.isMultiple()) this.selectionImpl.select(selected, options);
		else this.reset(selected.slice(0, 1), options);
		return this;
	}
	unselect(cells, options = {}) {
		this.selectionImpl.unselect(this.getCells(cells), options);
		return this;
	}
	setup() {
		this.selectionImpl.on("*", (name, args) => {
			this.trigger(name, args);
			this.graph.trigger(name, args);
		});
	}
	startListening() {
		this.graph.on("blank:mousedown", this.onBlankMouseDown, this);
		this.graph.on("blank:click", this.onBlankClick, this);
		this.graph.on("cell:mousemove", this.onCellMouseMove, this);
		this.graph.on("cell:mouseup", this.onCellMouseUp, this);
		this.selectionImpl.on("box:mousedown", this.onBoxMouseDown, this);
	}
	stopListening() {
		this.graph.off("blank:mousedown", this.onBlankMouseDown, this);
		this.graph.off("blank:click", this.onBlankClick, this);
		this.graph.off("cell:mousemove", this.onCellMouseMove, this);
		this.graph.off("cell:mouseup", this.onCellMouseUp, this);
		this.selectionImpl.off("box:mousedown", this.onBoxMouseDown, this);
	}
	onBlankMouseDown({ e }) {
		if (!this.allowBlankMouseDown(e)) return;
		const allowGraphPanning = this.graph.panning.allowPanning(e, true);
		const scroller = this.graph.getPlugin("scroller");
		const allowScrollerPanning = scroller && scroller.allowPanning(e, true);
		if (this.allowRubberband(e, true) || this.allowRubberband(e) && !allowScrollerPanning && !allowGraphPanning) this.startRubberband(e);
	}
	allowBlankMouseDown(e) {
		const eventTypes = this.options.eventTypes;
		return (eventTypes === null || eventTypes === void 0 ? void 0 : eventTypes.includes("leftMouseDown")) && e.button === 0 || (eventTypes === null || eventTypes === void 0 ? void 0 : eventTypes.includes("mouseWheelDown")) && e.button === 1;
	}
	onBlankClick() {
		this.clean();
	}
	allowRubberband(e, strict) {
		return !this.rubberbandDisabled && ModifierKey.isMatch(e, this.options.modifiers, strict);
	}
	allowMultipleSelection(e) {
		return this.isMultiple() && ModifierKey.isMatch(e, this.options.multipleSelectionModifiers);
	}
	onCellMouseMove({ cell }) {
		this.movedMap.set(cell, true);
	}
	onCellMouseUp({ e, cell }) {
		const options = this.options;
		let disabled = this.disabled;
		if (!disabled && this.movedMap.has(cell)) {
			disabled = options.selectCellOnMoved === false;
			if (!disabled) disabled = options.selectNodeOnMoved === false && cell.isNode();
			if (!disabled) disabled = options.selectEdgeOnMoved === false && cell.isEdge();
		}
		if (!disabled) if (!this.allowMultipleSelection(e)) this.reset(cell);
		else if (this.unselectMap.has(cell)) this.unselectMap.delete(cell);
		else if (this.isSelected(cell)) this.unselect(cell);
		else this.select(cell);
		this.movedMap.delete(cell);
	}
	onBoxMouseDown({ e, cell }) {
		if (!this.disabled) {
			if (this.allowMultipleSelection(e)) {
				this.unselect(cell);
				this.unselectMap.set(cell, true);
			}
		}
	}
	getCells(cells) {
		return (Array.isArray(cells) ? cells : [cells]).map((cell) => typeof cell === "string" ? this.graph.getCellById(cell) : cell).filter((cell) => cell != null);
	}
	startRubberband(e) {
		if (!this.rubberbandDisabled) this.selectionImpl.startSelecting(e);
		return this;
	}
	isMultiple() {
		return this.options.multiple !== false;
	}
	enableMultiple() {
		this.options.multiple = true;
		return this;
	}
	disableMultiple() {
		this.options.multiple = false;
		return this;
	}
	setModifiers(modifiers) {
		this.options.modifiers = modifiers;
		return this;
	}
	setContent(content) {
		this.selectionImpl.setContent(content);
		return this;
	}
	setFilter(filter) {
		this.selectionImpl.setFilter(filter);
		return this;
	}
	dispose() {
		this.stopListening();
		this.off();
		this.selectionImpl.dispose();
		clean(this.name);
	}
};
__decorate$6([Basecoat.dispose()], Selection.prototype, "dispose", null);
(function(Selection) {
	Selection.defaultOptions = {
		rubberband: false,
		rubberNode: true,
		rubberEdge: false,
		pointerEvents: "auto",
		multiple: true,
		multipleSelectionModifiers: ["ctrl", "meta"],
		movable: true,
		strict: false,
		selectCellOnMoved: false,
		selectNodeOnMoved: false,
		selectEdgeOnMoved: false,
		following: true,
		content: null,
		eventTypes: ["leftMouseDown", "mouseWheelDown"]
	};
})(Selection || (Selection = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-keyboard@2.2.3_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-keyboard/es/keyboard.js
var import_mousetrap = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	/**
	* Copyright 2012-2017 Craig Campbell
	*
	* Licensed under the Apache License, Version 2.0 (the "License");
	* you may not use this file except in compliance with the License.
	* You may obtain a copy of the License at
	*
	* http://www.apache.org/licenses/LICENSE-2.0
	*
	* Unless required by applicable law or agreed to in writing, software
	* distributed under the License is distributed on an "AS IS" BASIS,
	* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	* See the License for the specific language governing permissions and
	* limitations under the License.
	*
	* Mousetrap is a simple keyboard shortcut library for Javascript with
	* no external dependencies
	*
	* @version 1.6.5
	* @url craig.is/killing/mice
	*/
	(function(window, document, undefined) {
		if (!window) return;
		/**
		* mapping of special keycodes to their corresponding keys
		*
		* everything in this dictionary cannot use keypress events
		* so it has to be here to map to the correct keycodes for
		* keyup/keydown events
		*
		* @type {Object}
		*/
		var _MAP = {
			8: "backspace",
			9: "tab",
			13: "enter",
			16: "shift",
			17: "ctrl",
			18: "alt",
			20: "capslock",
			27: "esc",
			32: "space",
			33: "pageup",
			34: "pagedown",
			35: "end",
			36: "home",
			37: "left",
			38: "up",
			39: "right",
			40: "down",
			45: "ins",
			46: "del",
			91: "meta",
			93: "meta",
			224: "meta"
		};
		/**
		* mapping for special characters so they can support
		*
		* this dictionary is only used incase you want to bind a
		* keyup or keydown event to one of these keys
		*
		* @type {Object}
		*/
		var _KEYCODE_MAP = {
			106: "*",
			107: "+",
			109: "-",
			110: ".",
			111: "/",
			186: ";",
			187: "=",
			188: ",",
			189: "-",
			190: ".",
			191: "/",
			192: "`",
			219: "[",
			220: "\\",
			221: "]",
			222: "'"
		};
		/**
		* this is a mapping of keys that require shift on a US keypad
		* back to the non shift equivelents
		*
		* this is so you can use keyup events with these keys
		*
		* note that this will only work reliably on US keyboards
		*
		* @type {Object}
		*/
		var _SHIFT_MAP = {
			"~": "`",
			"!": "1",
			"@": "2",
			"#": "3",
			"$": "4",
			"%": "5",
			"^": "6",
			"&": "7",
			"*": "8",
			"(": "9",
			")": "0",
			"_": "-",
			"+": "=",
			":": ";",
			"\"": "'",
			"<": ",",
			">": ".",
			"?": "/",
			"|": "\\"
		};
		/**
		* this is a list of special strings you can use to map
		* to modifier keys when you specify your keyboard shortcuts
		*
		* @type {Object}
		*/
		var _SPECIAL_ALIASES = {
			"option": "alt",
			"command": "meta",
			"return": "enter",
			"escape": "esc",
			"plus": "+",
			"mod": /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? "meta" : "ctrl"
		};
		/**
		* variable to store the flipped version of _MAP from above
		* needed to check if we should use keypress or not when no action
		* is specified
		*
		* @type {Object|undefined}
		*/
		var _REVERSE_MAP;
		/**
		* loop through the f keys, f1 to f19 and add them to the map
		* programatically
		*/
		for (var i = 1; i < 20; ++i) _MAP[111 + i] = "f" + i;
		/**
		* loop through to map numbers on the numeric keypad
		*/
		for (i = 0; i <= 9; ++i) _MAP[i + 96] = i.toString();
		/**
		* cross browser add event method
		*
		* @param {Element|HTMLDocument} object
		* @param {string} type
		* @param {Function} callback
		* @returns void
		*/
		function _addEvent(object, type, callback) {
			if (object.addEventListener) {
				object.addEventListener(type, callback, false);
				return;
			}
			object.attachEvent("on" + type, callback);
		}
		/**
		* takes the event and returns the key character
		*
		* @param {Event} e
		* @return {string}
		*/
		function _characterFromEvent(e) {
			if (e.type == "keypress") {
				var character = String.fromCharCode(e.which);
				if (!e.shiftKey) character = character.toLowerCase();
				return character;
			}
			if (_MAP[e.which]) return _MAP[e.which];
			if (_KEYCODE_MAP[e.which]) return _KEYCODE_MAP[e.which];
			return String.fromCharCode(e.which).toLowerCase();
		}
		/**
		* checks if two arrays are equal
		*
		* @param {Array} modifiers1
		* @param {Array} modifiers2
		* @returns {boolean}
		*/
		function _modifiersMatch(modifiers1, modifiers2) {
			return modifiers1.sort().join(",") === modifiers2.sort().join(",");
		}
		/**
		* takes a key event and figures out what the modifiers are
		*
		* @param {Event} e
		* @returns {Array}
		*/
		function _eventModifiers(e) {
			var modifiers = [];
			if (e.shiftKey) modifiers.push("shift");
			if (e.altKey) modifiers.push("alt");
			if (e.ctrlKey) modifiers.push("ctrl");
			if (e.metaKey) modifiers.push("meta");
			return modifiers;
		}
		/**
		* prevents default for this event
		*
		* @param {Event} e
		* @returns void
		*/
		function _preventDefault(e) {
			if (e.preventDefault) {
				e.preventDefault();
				return;
			}
			e.returnValue = false;
		}
		/**
		* stops propogation for this event
		*
		* @param {Event} e
		* @returns void
		*/
		function _stopPropagation(e) {
			if (e.stopPropagation) {
				e.stopPropagation();
				return;
			}
			e.cancelBubble = true;
		}
		/**
		* determines if the keycode specified is a modifier key or not
		*
		* @param {string} key
		* @returns {boolean}
		*/
		function _isModifier(key) {
			return key == "shift" || key == "ctrl" || key == "alt" || key == "meta";
		}
		/**
		* reverses the map lookup so that we can look for specific keys
		* to see what can and can't use keypress
		*
		* @return {Object}
		*/
		function _getReverseMap() {
			if (!_REVERSE_MAP) {
				_REVERSE_MAP = {};
				for (var key in _MAP) {
					if (key > 95 && key < 112) continue;
					if (_MAP.hasOwnProperty(key)) _REVERSE_MAP[_MAP[key]] = key;
				}
			}
			return _REVERSE_MAP;
		}
		/**
		* picks the best action based on the key combination
		*
		* @param {string} key - character for key
		* @param {Array} modifiers
		* @param {string=} action passed in
		*/
		function _pickBestAction(key, modifiers, action) {
			if (!action) action = _getReverseMap()[key] ? "keydown" : "keypress";
			if (action == "keypress" && modifiers.length) action = "keydown";
			return action;
		}
		/**
		* Converts from a string key combination to an array
		*
		* @param  {string} combination like "command+shift+l"
		* @return {Array}
		*/
		function _keysFromString(combination) {
			if (combination === "+") return ["+"];
			combination = combination.replace(/\+{2}/g, "+plus");
			return combination.split("+");
		}
		/**
		* Gets info for a specific key combination
		*
		* @param  {string} combination key combination ("command+s" or "a" or "*")
		* @param  {string=} action
		* @returns {Object}
		*/
		function _getKeyInfo(combination, action) {
			var keys;
			var key;
			var i;
			var modifiers = [];
			keys = _keysFromString(combination);
			for (i = 0; i < keys.length; ++i) {
				key = keys[i];
				if (_SPECIAL_ALIASES[key]) key = _SPECIAL_ALIASES[key];
				if (action && action != "keypress" && _SHIFT_MAP[key]) {
					key = _SHIFT_MAP[key];
					modifiers.push("shift");
				}
				if (_isModifier(key)) modifiers.push(key);
			}
			action = _pickBestAction(key, modifiers, action);
			return {
				key,
				modifiers,
				action
			};
		}
		function _belongsTo(element, ancestor) {
			if (element === null || element === document) return false;
			if (element === ancestor) return true;
			return _belongsTo(element.parentNode, ancestor);
		}
		function Mousetrap(targetElement) {
			var self = this;
			targetElement = targetElement || document;
			if (!(self instanceof Mousetrap)) return new Mousetrap(targetElement);
			/**
			* element to attach key events to
			*
			* @type {Element}
			*/
			self.target = targetElement;
			/**
			* a list of all the callbacks setup via Mousetrap.bind()
			*
			* @type {Object}
			*/
			self._callbacks = {};
			/**
			* direct map of string combinations to callbacks used for trigger()
			*
			* @type {Object}
			*/
			self._directMap = {};
			/**
			* keeps track of what level each sequence is at since multiple
			* sequences can start out with the same sequence
			*
			* @type {Object}
			*/
			var _sequenceLevels = {};
			/**
			* variable to store the setTimeout call
			*
			* @type {null|number}
			*/
			var _resetTimer;
			/**
			* temporary state where we will ignore the next keyup
			*
			* @type {boolean|string}
			*/
			var _ignoreNextKeyup = false;
			/**
			* temporary state where we will ignore the next keypress
			*
			* @type {boolean}
			*/
			var _ignoreNextKeypress = false;
			/**
			* are we currently inside of a sequence?
			* type of action ("keyup" or "keydown" or "keypress") or false
			*
			* @type {boolean|string}
			*/
			var _nextExpectedAction = false;
			/**
			* resets all sequence counters except for the ones passed in
			*
			* @param {Object} doNotReset
			* @returns void
			*/
			function _resetSequences(doNotReset) {
				doNotReset = doNotReset || {};
				var activeSequences = false, key;
				for (key in _sequenceLevels) {
					if (doNotReset[key]) {
						activeSequences = true;
						continue;
					}
					_sequenceLevels[key] = 0;
				}
				if (!activeSequences) _nextExpectedAction = false;
			}
			/**
			* finds all callbacks that match based on the keycode, modifiers,
			* and action
			*
			* @param {string} character
			* @param {Array} modifiers
			* @param {Event|Object} e
			* @param {string=} sequenceName - name of the sequence we are looking for
			* @param {string=} combination
			* @param {number=} level
			* @returns {Array}
			*/
			function _getMatches(character, modifiers, e, sequenceName, combination, level) {
				var i;
				var callback;
				var matches = [];
				var action = e.type;
				if (!self._callbacks[character]) return [];
				if (action == "keyup" && _isModifier(character)) modifiers = [character];
				for (i = 0; i < self._callbacks[character].length; ++i) {
					callback = self._callbacks[character][i];
					if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) continue;
					if (action != callback.action) continue;
					if (action == "keypress" && !e.metaKey && !e.ctrlKey || _modifiersMatch(modifiers, callback.modifiers)) {
						var deleteCombo = !sequenceName && callback.combo == combination;
						var deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
						if (deleteCombo || deleteSequence) self._callbacks[character].splice(i, 1);
						matches.push(callback);
					}
				}
				return matches;
			}
			/**
			* actually calls the callback function
			*
			* if your callback function returns false this will use the jquery
			* convention - prevent default and stop propogation on the event
			*
			* @param {Function} callback
			* @param {Event} e
			* @returns void
			*/
			function _fireCallback(callback, e, combo, sequence) {
				if (self.stopCallback(e, e.target || e.srcElement, combo, sequence)) return;
				if (callback(e, combo) === false) {
					_preventDefault(e);
					_stopPropagation(e);
				}
			}
			/**
			* handles a character key event
			*
			* @param {string} character
			* @param {Array} modifiers
			* @param {Event} e
			* @returns void
			*/
			self._handleKey = function(character, modifiers, e) {
				var callbacks = _getMatches(character, modifiers, e);
				var i;
				var doNotReset = {};
				var maxLevel = 0;
				var processedSequenceCallback = false;
				for (i = 0; i < callbacks.length; ++i) if (callbacks[i].seq) maxLevel = Math.max(maxLevel, callbacks[i].level);
				for (i = 0; i < callbacks.length; ++i) {
					if (callbacks[i].seq) {
						if (callbacks[i].level != maxLevel) continue;
						processedSequenceCallback = true;
						doNotReset[callbacks[i].seq] = 1;
						_fireCallback(callbacks[i].callback, e, callbacks[i].combo, callbacks[i].seq);
						continue;
					}
					if (!processedSequenceCallback) _fireCallback(callbacks[i].callback, e, callbacks[i].combo);
				}
				var ignoreThisKeypress = e.type == "keypress" && _ignoreNextKeypress;
				if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) _resetSequences(doNotReset);
				_ignoreNextKeypress = processedSequenceCallback && e.type == "keydown";
			};
			/**
			* handles a keydown event
			*
			* @param {Event} e
			* @returns void
			*/
			function _handleKeyEvent(e) {
				if (typeof e.which !== "number") e.which = e.keyCode;
				var character = _characterFromEvent(e);
				if (!character) return;
				if (e.type == "keyup" && _ignoreNextKeyup === character) {
					_ignoreNextKeyup = false;
					return;
				}
				self.handleKey(character, _eventModifiers(e), e);
			}
			/**
			* called to set a 1 second timeout on the specified sequence
			*
			* this is so after each key press in the sequence you have 1 second
			* to press the next key before you have to start over
			*
			* @returns void
			*/
			function _resetSequenceTimer() {
				clearTimeout(_resetTimer);
				_resetTimer = setTimeout(_resetSequences, 1e3);
			}
			/**
			* binds a key sequence to an event
			*
			* @param {string} combo - combo specified in bind call
			* @param {Array} keys
			* @param {Function} callback
			* @param {string=} action
			* @returns void
			*/
			function _bindSequence(combo, keys, callback, action) {
				_sequenceLevels[combo] = 0;
				/**
				* callback to increase the sequence level for this sequence and reset
				* all other sequences that were active
				*
				* @param {string} nextAction
				* @returns {Function}
				*/
				function _increaseSequence(nextAction) {
					return function() {
						_nextExpectedAction = nextAction;
						++_sequenceLevels[combo];
						_resetSequenceTimer();
					};
				}
				/**
				* wraps the specified callback inside of another function in order
				* to reset all sequence counters as soon as this sequence is done
				*
				* @param {Event} e
				* @returns void
				*/
				function _callbackAndReset(e) {
					_fireCallback(callback, e, combo);
					if (action !== "keyup") _ignoreNextKeyup = _characterFromEvent(e);
					setTimeout(_resetSequences, 10);
				}
				for (var i = 0; i < keys.length; ++i) {
					var wrappedCallback = i + 1 === keys.length ? _callbackAndReset : _increaseSequence(action || _getKeyInfo(keys[i + 1]).action);
					_bindSingle(keys[i], wrappedCallback, action, combo, i);
				}
			}
			/**
			* binds a single keyboard combination
			*
			* @param {string} combination
			* @param {Function} callback
			* @param {string=} action
			* @param {string=} sequenceName - name of sequence if part of sequence
			* @param {number=} level - what part of the sequence the command is
			* @returns void
			*/
			function _bindSingle(combination, callback, action, sequenceName, level) {
				self._directMap[combination + ":" + action] = callback;
				combination = combination.replace(/\s+/g, " ");
				var sequence = combination.split(" ");
				var info;
				if (sequence.length > 1) {
					_bindSequence(combination, sequence, callback, action);
					return;
				}
				info = _getKeyInfo(combination, action);
				self._callbacks[info.key] = self._callbacks[info.key] || [];
				_getMatches(info.key, info.modifiers, { type: info.action }, sequenceName, combination, level);
				self._callbacks[info.key][sequenceName ? "unshift" : "push"]({
					callback,
					modifiers: info.modifiers,
					action: info.action,
					seq: sequenceName,
					level,
					combo: combination
				});
			}
			/**
			* binds multiple combinations to the same callback
			*
			* @param {Array} combinations
			* @param {Function} callback
			* @param {string|undefined} action
			* @returns void
			*/
			self._bindMultiple = function(combinations, callback, action) {
				for (var i = 0; i < combinations.length; ++i) _bindSingle(combinations[i], callback, action);
			};
			_addEvent(targetElement, "keypress", _handleKeyEvent);
			_addEvent(targetElement, "keydown", _handleKeyEvent);
			_addEvent(targetElement, "keyup", _handleKeyEvent);
		}
		/**
		* binds an event to mousetrap
		*
		* can be a single key, a combination of keys separated with +,
		* an array of keys, or a sequence of keys separated by spaces
		*
		* be sure to list the modifier keys first to make sure that the
		* correct key ends up getting bound (the last key in the pattern)
		*
		* @param {string|Array} keys
		* @param {Function} callback
		* @param {string=} action - 'keypress', 'keydown', or 'keyup'
		* @returns void
		*/
		Mousetrap.prototype.bind = function(keys, callback, action) {
			var self = this;
			keys = keys instanceof Array ? keys : [keys];
			self._bindMultiple.call(self, keys, callback, action);
			return self;
		};
		/**
		* unbinds an event to mousetrap
		*
		* the unbinding sets the callback function of the specified key combo
		* to an empty function and deletes the corresponding key in the
		* _directMap dict.
		*
		* TODO: actually remove this from the _callbacks dictionary instead
		* of binding an empty function
		*
		* the keycombo+action has to be exactly the same as
		* it was defined in the bind method
		*
		* @param {string|Array} keys
		* @param {string} action
		* @returns void
		*/
		Mousetrap.prototype.unbind = function(keys, action) {
			var self = this;
			return self.bind.call(self, keys, function() {}, action);
		};
		/**
		* triggers an event that has already been bound
		*
		* @param {string} keys
		* @param {string=} action
		* @returns void
		*/
		Mousetrap.prototype.trigger = function(keys, action) {
			var self = this;
			if (self._directMap[keys + ":" + action]) self._directMap[keys + ":" + action]({}, keys);
			return self;
		};
		/**
		* resets the library back to its initial state.  this is useful
		* if you want to clear out the current keyboard shortcuts and bind
		* new ones - for example if you switch to another page
		*
		* @returns void
		*/
		Mousetrap.prototype.reset = function() {
			var self = this;
			self._callbacks = {};
			self._directMap = {};
			return self;
		};
		/**
		* should we stop this event before firing off callbacks
		*
		* @param {Event} e
		* @param {Element} element
		* @return {boolean}
		*/
		Mousetrap.prototype.stopCallback = function(e, element) {
			var self = this;
			if ((" " + element.className + " ").indexOf(" mousetrap ") > -1) return false;
			if (_belongsTo(element, self.target)) return false;
			if ("composedPath" in e && typeof e.composedPath === "function") {
				var initialEventTarget = e.composedPath()[0];
				if (initialEventTarget !== e.target) element = initialEventTarget;
			}
			return element.tagName == "INPUT" || element.tagName == "SELECT" || element.tagName == "TEXTAREA" || element.isContentEditable;
		};
		/**
		* exposes _handleKey publicly so it can be overwritten by extensions
		*/
		Mousetrap.prototype.handleKey = function() {
			var self = this;
			return self._handleKey.apply(self, arguments);
		};
		/**
		* allow custom key mappings
		*/
		Mousetrap.addKeycodes = function(object) {
			for (var key in object) if (object.hasOwnProperty(key)) _MAP[key] = object[key];
			_REVERSE_MAP = null;
		};
		/**
		* Init the global mousetrap functions
		*
		* This method is needed to allow the global mousetrap functions to work
		* now that mousetrap is a constructor function.
		*/
		Mousetrap.init = function() {
			var documentMousetrap = Mousetrap(document);
			for (var method in documentMousetrap) if (method.charAt(0) !== "_") Mousetrap[method] = function(method) {
				return function() {
					return documentMousetrap[method].apply(documentMousetrap, arguments);
				};
			}(method);
		};
		Mousetrap.init();
		window.Mousetrap = Mousetrap;
		if (typeof module !== "undefined" && module.exports) module.exports = Mousetrap;
		if (typeof define === "function" && define.amd) define(function() {
			return Mousetrap;
		});
	})(typeof window !== "undefined" ? window : null, typeof window !== "undefined" ? document : null);
})))());
var __decorate$5 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var KeyboardImpl = class KeyboardImpl extends Disposable {
	get graph() {
		return this.options.graph;
	}
	constructor(options) {
		super();
		this.options = options;
		const scroller = this.graph.getPlugin("scroller");
		this.container = scroller ? scroller.container : this.graph.container;
		if (options.global) this.target = document;
		else {
			this.target = this.container;
			if (!this.disabled) this.target.setAttribute("tabindex", "-1");
			this.graph.on("cell:mouseup", this.focus, this);
			this.graph.on("blank:mouseup", this.focus, this);
		}
		this.mousetrap = KeyboardImpl.createMousetrap(this);
	}
	get disabled() {
		return this.options.enabled !== true;
	}
	enable() {
		if (this.disabled) {
			this.options.enabled = true;
			if (this.target instanceof HTMLElement) this.target.setAttribute("tabindex", "-1");
		}
	}
	disable() {
		if (!this.disabled) {
			this.options.enabled = false;
			if (this.target instanceof HTMLElement) this.target.removeAttribute("tabindex");
		}
	}
	on(keys, callback, action) {
		this.mousetrap.bind(this.getKeys(keys), callback, action);
	}
	off(keys, action) {
		this.mousetrap.unbind(this.getKeys(keys), action);
	}
	clear() {
		this.mousetrap.reset();
	}
	trigger(key, action) {
		this.mousetrap.trigger(key, action);
	}
	focus(e) {
		if (this.isInputEvent(e.e)) return;
		this.target.focus({ preventScroll: true });
	}
	getKeys(keys) {
		return (Array.isArray(keys) ? keys : [keys]).map((key) => this.formatkey(key));
	}
	formatkey(key) {
		const formated = key.toLocaleLowerCase().replace(/\s/g, "").replace("delete", "del").replace("cmd", "command").replace("arrowup", "up").replace("arrowright", "right").replace("arrowdown", "down").replace("arrowleft", "left");
		const formatFn = this.options.format;
		if (formatFn) return call$1(formatFn, this.graph, formated);
		return formated;
	}
	isGraphEvent(e) {
		const target = e.target;
		const currentTarget = e.currentTarget;
		if (target) {
			if (target === this.target || currentTarget === this.target || target === document.body) return true;
			return contains(this.container, target);
		}
		return false;
	}
	isInputEvent(e) {
		var _a;
		const target = e.target;
		const tagName = (_a = target === null || target === void 0 ? void 0 : target.tagName) === null || _a === void 0 ? void 0 : _a.toLowerCase();
		let isInput = ["input", "textarea"].includes(tagName);
		if (attr(target, "contenteditable") === "true") isInput = true;
		return isInput;
	}
	isEnabledForEvent(e) {
		const allowed = !this.disabled && this.isGraphEvent(e);
		const isInputEvent = this.isInputEvent(e);
		if (allowed) {
			if (isInputEvent && (e.key === "Backspace" || e.key === "Delete")) return false;
			if (this.options.guard) return call$1(this.options.guard, this.graph, e);
		}
		return allowed;
	}
	dispose() {
		this.mousetrap.reset();
	}
};
__decorate$5([Disposable.dispose()], KeyboardImpl.prototype, "dispose", null);
(function(KeyboardImpl) {
	function createMousetrap(keyboard) {
		const mousetrap = new import_mousetrap.default(keyboard.target);
		const stopCallback = mousetrap.stopCallback;
		mousetrap.stopCallback = (e, elem, combo) => {
			if (keyboard.isEnabledForEvent(e)) {
				if (stopCallback) return stopCallback.call(mousetrap, e, elem, combo);
				return false;
			}
			return true;
		};
		return mousetrap;
	}
	KeyboardImpl.createMousetrap = createMousetrap;
})(KeyboardImpl || (KeyboardImpl = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-keyboard@2.2.3_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-keyboard/es/api.js
Graph.prototype.isKeyboardEnabled = function() {
	const keyboard = this.getPlugin("keyboard");
	if (keyboard) return keyboard.isEnabled();
	return false;
};
Graph.prototype.enableKeyboard = function() {
	const keyboard = this.getPlugin("keyboard");
	if (keyboard) keyboard.enable();
	return this;
};
Graph.prototype.disableKeyboard = function() {
	const keyboard = this.getPlugin("keyboard");
	if (keyboard) keyboard.disable();
	return this;
};
Graph.prototype.toggleKeyboard = function(enabled) {
	const keyboard = this.getPlugin("keyboard");
	if (keyboard) keyboard.toggleEnabled(enabled);
	return this;
};
Graph.prototype.bindKey = function(keys, callback, action) {
	const keyboard = this.getPlugin("keyboard");
	if (keyboard) keyboard.bindKey(keys, callback, action);
	return this;
};
Graph.prototype.unbindKey = function(keys, action) {
	const keyboard = this.getPlugin("keyboard");
	if (keyboard) keyboard.unbindKey(keys, action);
	return this;
};
Graph.prototype.clearKeys = function() {
	const keyboard = this.getPlugin("keyboard");
	if (keyboard) keyboard.clear();
	return this;
};
Graph.prototype.triggerKey = function(key, action) {
	const keyboard = this.getPlugin("keyboard");
	if (keyboard) keyboard.trigger(key, action);
	return this;
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-keyboard@2.2.3_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-keyboard/es/index.js
var __decorate$4 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Keyboard = class extends Disposable {
	constructor(options = {}) {
		super();
		this.name = "keyboard";
		this.options = Object.assign({ enabled: true }, options);
	}
	init(graph) {
		this.keyboardImpl = new KeyboardImpl(Object.assign(Object.assign({}, this.options), { graph }));
	}
	isEnabled() {
		return !this.keyboardImpl.disabled;
	}
	enable() {
		this.keyboardImpl.enable();
	}
	disable() {
		this.keyboardImpl.disable();
	}
	toggleEnabled(enabled) {
		if (enabled != null) {
			if (enabled !== this.isEnabled()) if (enabled) this.enable();
			else this.disable();
		} else if (this.isEnabled()) this.disable();
		else this.enable();
		return this;
	}
	bindKey(keys, callback, action) {
		this.keyboardImpl.on(keys, callback, action);
		return this;
	}
	trigger(key, action) {
		this.keyboardImpl.trigger(key, action);
		return this;
	}
	clear() {
		this.keyboardImpl.clear();
		return this;
	}
	unbindKey(keys, action) {
		this.keyboardImpl.off(keys, action);
		return this;
	}
	dispose() {
		this.keyboardImpl.dispose();
	}
};
__decorate$4([Disposable.dispose()], Keyboard.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-clipboard@2.1.6_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-clipboard/es/clipboard.js
var ClipboardImpl = class {
	constructor() {
		this.cells = [];
	}
	copy(cells, graph, options = {}) {
		this.options = Object.assign({}, options);
		const cloned = (Model.isModel(graph) ? graph : graph.model).cloneSubGraph(cells, options);
		this.cells = sortBy(Object.keys(cloned).map((key) => cloned[key]), (cell) => cell.isEdge() ? 2 : 1);
		this.serialize(options);
	}
	cut(cells, graph, options = {}) {
		this.copy(cells, graph, options);
		(Graph.isGraph(graph) ? graph.model : graph).batchUpdate("cut", () => {
			cells.forEach((cell) => cell.remove());
		});
	}
	paste(graph, options = {}) {
		const localOptions = Object.assign(Object.assign({}, this.options), options);
		const { offset, edgeProps, nodeProps } = localOptions;
		let dx = 20;
		let dy = 20;
		if (offset) {
			dx = typeof offset === "number" ? offset : offset.dx;
			dy = typeof offset === "number" ? offset : offset.dy;
		}
		this.deserialize(localOptions);
		const cells = this.cells;
		cells.forEach((cell) => {
			cell.model = null;
			cell.removeProp("zIndex");
			if (dx || dy) cell.translate(dx, dy);
			if (nodeProps && cell.isNode()) cell.prop(nodeProps);
			if (edgeProps && cell.isEdge()) cell.prop(edgeProps);
		});
		const model = Graph.isGraph(graph) ? graph.model : graph;
		model.batchUpdate("paste", () => {
			model.addCells(this.cells);
		});
		this.copy(cells, graph, options);
		return cells;
	}
	serialize(options) {
		if (options.useLocalStorage !== false) Storage.save(this.cells);
	}
	deserialize(options) {
		if (options.useLocalStorage) {
			const cells = Storage.fetch();
			if (cells) this.cells = cells;
		}
	}
	isEmpty(options = {}) {
		if (options.useLocalStorage) this.deserialize(options);
		return this.cells.length <= 0;
	}
	clean() {
		this.options = {};
		this.cells = [];
		Storage.clean();
	}
};
var Storage;
(function(Storage) {
	const LOCAL_STORAGE_KEY = `${Config.prefixCls}.clipboard.cells`;
	function save(cells) {
		if (window.localStorage) {
			const data = cells.map((cell) => cell.toJSON());
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
		}
	}
	Storage.save = save;
	function fetch() {
		if (window.localStorage) {
			const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
			const cells = raw ? JSON.parse(raw) : [];
			if (cells) return Model.fromJSON(cells);
		}
	}
	Storage.fetch = fetch;
	function clean() {
		if (window.localStorage) localStorage.removeItem(LOCAL_STORAGE_KEY);
	}
	Storage.clean = clean;
})(Storage || (Storage = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-clipboard@2.1.6_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-clipboard/es/api.js
Graph.prototype.isClipboardEnabled = function() {
	const clipboard = this.getPlugin("clipboard");
	if (clipboard) return clipboard.isEnabled();
	return false;
};
Graph.prototype.enableClipboard = function() {
	const clipboard = this.getPlugin("clipboard");
	if (clipboard) clipboard.enable();
	return this;
};
Graph.prototype.disableClipboard = function() {
	const clipboard = this.getPlugin("clipboard");
	if (clipboard) clipboard.disable();
	return this;
};
Graph.prototype.toggleClipboard = function(enabled) {
	const clipboard = this.getPlugin("clipboard");
	if (clipboard) clipboard.toggleEnabled(enabled);
	return this;
};
Graph.prototype.isClipboardEmpty = function(options) {
	const clipboard = this.getPlugin("clipboard");
	if (clipboard) return clipboard.isEmpty(options);
	return true;
};
Graph.prototype.getCellsInClipboard = function() {
	const clipboard = this.getPlugin("clipboard");
	if (clipboard) return clipboard.getCellsInClipboard();
	return [];
};
Graph.prototype.cleanClipboard = function() {
	const clipboard = this.getPlugin("clipboard");
	if (clipboard) clipboard.clean();
	return this;
};
Graph.prototype.copy = function(cells, options) {
	const clipboard = this.getPlugin("clipboard");
	if (clipboard) clipboard.copy(cells, options);
	return this;
};
Graph.prototype.cut = function(cells, options) {
	const clipboard = this.getPlugin("clipboard");
	if (clipboard) clipboard.cut(cells, options);
	return this;
};
Graph.prototype.paste = function(options, graph) {
	const clipboard = this.getPlugin("clipboard");
	if (clipboard) return clipboard.paste(options, graph);
	return [];
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-clipboard@2.1.6_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-clipboard/es/index.js
var __decorate$3 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __rest$1 = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var Clipboard = class extends Basecoat {
	get disabled() {
		return this.options.enabled !== true;
	}
	get cells() {
		return this.clipboardImpl.cells;
	}
	constructor(options = {}) {
		super();
		this.name = "clipboard";
		this.options = Object.assign({ enabled: true }, options);
	}
	init(graph) {
		this.graph = graph;
		this.clipboardImpl = new ClipboardImpl();
		this.clipboardImpl.deserialize(this.options);
	}
	isEnabled() {
		return !this.disabled;
	}
	enable() {
		if (this.disabled) this.options.enabled = true;
	}
	disable() {
		if (!this.disabled) this.options.enabled = false;
	}
	toggleEnabled(enabled) {
		if (enabled != null) {
			if (enabled !== this.isEnabled()) if (enabled) this.enable();
			else this.disable();
		} else if (this.isEnabled()) this.disable();
		else this.enable();
		return this;
	}
	isEmpty(options = {}) {
		return this.clipboardImpl.isEmpty(options);
	}
	getCellsInClipboard() {
		return this.cells;
	}
	clean(force) {
		if (!this.disabled || force) {
			this.clipboardImpl.clean();
			this.notify("clipboard:changed", { cells: [] });
		}
		return this;
	}
	copy(cells, options = {}) {
		if (!this.disabled) {
			this.clipboardImpl.copy(cells, this.graph, Object.assign(Object.assign({}, this.commonOptions), options));
			this.notify("clipboard:changed", { cells });
		}
		return this;
	}
	cut(cells, options = {}) {
		if (!this.disabled) {
			this.clipboardImpl.cut(cells, this.graph, Object.assign(Object.assign({}, this.commonOptions), options));
			this.notify("clipboard:changed", { cells });
		}
		return this;
	}
	paste(options = {}, graph = this.graph) {
		if (!this.disabled) return this.clipboardImpl.paste(graph, Object.assign(Object.assign({}, this.commonOptions), options));
		return [];
	}
	get commonOptions() {
		const _a = this.options, { enabled } = _a;
		return __rest$1(_a, ["enabled"]);
	}
	notify(name, args) {
		this.trigger(name, args);
		this.graph.trigger(name, args);
	}
	dispose() {
		this.clean(true);
		this.off();
	}
};
__decorate$3([Basecoat.dispose()], Clipboard.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-history@2.2.4_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-history/es/api.js
Graph.prototype.isHistoryEnabled = function() {
	const history = this.getPlugin("history");
	if (history) return history.isEnabled();
	return false;
};
Graph.prototype.enableHistory = function() {
	const history = this.getPlugin("history");
	if (history) history.enable();
	return this;
};
Graph.prototype.disableHistory = function() {
	const history = this.getPlugin("history");
	if (history) history.disable();
	return this;
};
Graph.prototype.toggleHistory = function(enabled) {
	const history = this.getPlugin("history");
	if (history) history.toggleEnabled(enabled);
	return this;
};
Graph.prototype.undo = function(options) {
	const history = this.getPlugin("history");
	if (history) history.undo(options);
	return this;
};
Graph.prototype.redo = function(options) {
	const history = this.getPlugin("history");
	if (history) history.redo(options);
	return this;
};
Graph.prototype.undoAndCancel = function(options) {
	const history = this.getPlugin("history");
	if (history) history.cancel(options);
	return this;
};
Graph.prototype.canUndo = function() {
	const history = this.getPlugin("history");
	if (history) return history.canUndo();
	return false;
};
Graph.prototype.canRedo = function() {
	const history = this.getPlugin("history");
	if (history) return history.canRedo();
	return false;
};
Graph.prototype.cleanHistory = function(options) {
	const history = this.getPlugin("history");
	if (history) history.clean(options);
	return this;
};
Graph.prototype.getHistoryStackSize = function() {
	return this.getPlugin("history").getSize();
};
Graph.prototype.getUndoStackSize = function() {
	return this.getPlugin("history").getUndoSize();
};
Graph.prototype.getRedoStackSize = function() {
	return this.getPlugin("history").getRedoSize();
};
Graph.prototype.getUndoRemainSize = function() {
	return this.getPlugin("history").getUndoRemainSize();
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-history@2.2.4_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-history/es/index.js
var __decorate$2 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var History = class History extends Basecoat {
	constructor(options = {}) {
		super();
		this.name = "history";
		this.batchCommands = null;
		this.batchLevel = 0;
		this.lastBatchIndex = -1;
		this.freezed = false;
		this.stackSize = 0;
		this.handlers = [];
		const { stackSize = 0 } = options;
		this.stackSize = stackSize;
		this.options = Util$1.getOptions(options);
		this.validator = new History.Validator({
			history: this,
			cancelInvalid: this.options.cancelInvalid
		});
	}
	init(graph) {
		this.graph = graph;
		this.model = this.graph.model;
		this.clean();
		this.startListening();
	}
	isEnabled() {
		return !this.disabled;
	}
	enable() {
		if (this.disabled) this.options.enabled = true;
	}
	disable() {
		if (!this.disabled) this.options.enabled = false;
	}
	toggleEnabled(enabled) {
		if (enabled != null) {
			if (enabled !== this.isEnabled()) if (enabled) this.enable();
			else this.disable();
		} else if (this.isEnabled()) this.disable();
		else this.enable();
		return this;
	}
	undo(options = {}) {
		if (!this.disabled) {
			const cmd = this.undoStack.pop();
			if (cmd) {
				this.revertCommand(cmd, options);
				this.redoStack.push(cmd);
				this.notify("undo", cmd, options);
			}
		}
		return this;
	}
	redo(options = {}) {
		if (!this.disabled) {
			const cmd = this.redoStack.pop();
			if (cmd) {
				this.applyCommand(cmd, options);
				this.undoStackPush(cmd);
				this.notify("redo", cmd, options);
			}
		}
		return this;
	}
	/**
	* Same as `undo()` but does not store the undo-ed command to the
	* `redoStack`. Canceled command therefore cannot be redo-ed.
	*/
	cancel(options = {}) {
		if (!this.disabled) {
			const cmd = this.undoStack.pop();
			if (cmd) {
				this.revertCommand(cmd, options);
				this.redoStack = [];
				this.notify("cancel", cmd, options);
			}
		}
		return this;
	}
	getSize() {
		return this.stackSize;
	}
	getUndoRemainSize() {
		const ul = this.undoStack.length;
		return this.stackSize - ul;
	}
	getUndoSize() {
		return this.undoStack.length;
	}
	getRedoSize() {
		return this.redoStack.length;
	}
	canUndo() {
		return !this.disabled && this.undoStack.length > 0;
	}
	canRedo() {
		return !this.disabled && this.redoStack.length > 0;
	}
	clean(options = {}) {
		this.undoStack = [];
		this.redoStack = [];
		this.notify("clean", null, options);
		return this;
	}
	get disabled() {
		return this.options.enabled !== true;
	}
	validate(events, ...callbacks) {
		this.validator.validate(events, ...callbacks);
		return this;
	}
	startListening() {
		this.model.on("batch:start", this.initBatchCommand, this);
		this.model.on("batch:stop", this.storeBatchCommand, this);
		if (this.options.eventNames) this.options.eventNames.forEach((name, index) => {
			this.handlers[index] = this.addCommand.bind(this, name);
			this.model.on(name, this.handlers[index]);
		});
		this.validator.on("invalid", (args) => this.trigger("invalid", args));
	}
	stopListening() {
		this.model.off("batch:start", this.initBatchCommand, this);
		this.model.off("batch:stop", this.storeBatchCommand, this);
		if (this.options.eventNames) {
			this.options.eventNames.forEach((name, index) => {
				this.model.off(name, this.handlers[index]);
			});
			this.handlers.length = 0;
		}
		this.validator.off("invalid");
	}
	createCommand(options) {
		return {
			batch: options ? options.batch : false,
			data: {}
		};
	}
	revertCommand(cmd, options) {
		this.freezed = true;
		const cmds = Array.isArray(cmd) ? Util$1.sortBatchCommands(cmd) : [cmd];
		for (let i = cmds.length - 1; i >= 0; i -= 1) {
			const cmd = cmds[i];
			const localOptions = Object.assign(Object.assign({}, options), pick(cmd.options, this.options.revertOptionsList || []));
			this.executeCommand(cmd, true, localOptions);
		}
		this.freezed = false;
	}
	applyCommand(cmd, options) {
		this.freezed = true;
		const cmds = Array.isArray(cmd) ? Util$1.sortBatchCommands(cmd) : [cmd];
		for (let i = 0; i < cmds.length; i += 1) {
			const cmd = cmds[i];
			const localOptions = Object.assign(Object.assign({}, options), pick(cmd.options, this.options.applyOptionsList || []));
			this.executeCommand(cmd, false, localOptions);
		}
		this.freezed = false;
	}
	executeCommand(cmd, revert, options) {
		const model = this.model;
		const cell = model.getCell(cmd.data.id);
		const event = cmd.event;
		if (Util$1.isAddEvent(event) && revert || Util$1.isRemoveEvent(event) && !revert) cell && cell.remove(options);
		else if (Util$1.isAddEvent(event) && !revert || Util$1.isRemoveEvent(event) && revert) {
			const data = cmd.data;
			if (data.node) model.addNode(data.props, options);
			else if (data.edge) model.addEdge(data.props, options);
		} else if (Util$1.isChangeEvent(event)) {
			const data = cmd.data;
			const key = data.key;
			if (key && cell) {
				const value = revert ? data.prev[key] : data.next[key];
				if (data.key === "attrs") {
					if (this.ensureUndefinedAttrs(value, revert ? data.next[key] : data.prev[key])) options.dirty = true;
				}
				cell.prop(key, value, options);
			}
		} else {
			const executeCommand = this.options.executeCommand;
			if (executeCommand) call$1(executeCommand, this, cmd, revert, options);
		}
	}
	addCommand(event, args) {
		if (this.freezed || this.disabled) return;
		const eventArgs = args;
		const options = eventArgs.options || {};
		if (options.dryrun) return;
		if (Util$1.isAddEvent(event) && this.options.ignoreAdd || Util$1.isRemoveEvent(event) && this.options.ignoreRemove || Util$1.isChangeEvent(event) && this.options.ignoreChange) return;
		const before = this.options.beforeAddCommand;
		if (before != null && call$1(before, this, event, args) === false) return;
		if (event === "cell:change:*") event = `cell:change:${eventArgs.key}`;
		const cell = eventArgs.cell;
		const isModelChange = Model.isModel(cell);
		let cmd;
		if (this.batchCommands) {
			cmd = this.batchCommands[Math.max(this.lastBatchIndex, 0)];
			const diffId = isModelChange && !cmd.modelChange || cmd.data.id !== cell.id;
			const diffName = cmd.event !== event;
			if (this.lastBatchIndex >= 0 && (diffId || diffName)) {
				const index = this.batchCommands.findIndex((cmd) => (isModelChange && cmd.modelChange || cmd.data.id === cell.id) && cmd.event === event);
				if (index < 0 || Util$1.isAddEvent(event) || Util$1.isRemoveEvent(event)) cmd = this.createCommand({ batch: true });
				else {
					cmd = this.batchCommands[index];
					this.batchCommands.splice(index, 1);
				}
				this.batchCommands.push(cmd);
				this.lastBatchIndex = this.batchCommands.length - 1;
			}
		} else cmd = this.createCommand({ batch: false });
		if (Util$1.isAddEvent(event) || Util$1.isRemoveEvent(event)) {
			const data = cmd.data;
			cmd.event = event;
			cmd.options = options;
			data.id = cell.id;
			data.props = cloneDeep(cell.toJSON());
			if (cell.isEdge()) data.edge = true;
			else if (cell.isNode()) data.node = true;
			return this.push(cmd, options);
		}
		if (Util$1.isChangeEvent(event)) {
			const key = args.key;
			const data = cmd.data;
			if (!cmd.batch || !cmd.event) {
				cmd.event = event;
				cmd.options = options;
				data.key = key;
				if (data.prev == null) data.prev = {};
				data.prev[key] = cloneDeep(cell.previous(key));
				if (isModelChange) cmd.modelChange = true;
				else data.id = cell.id;
			}
			if (data.next == null) data.next = {};
			data.next[key] = cloneDeep(cell.prop(key));
			return this.push(cmd, options);
		}
		const afterAddCommand = this.options.afterAddCommand;
		if (afterAddCommand) call$1(afterAddCommand, this, event, args, cmd);
		this.push(cmd, options);
	}
	/**
	* Gather multiple changes into a single command. These commands could
	* be reverted with single `undo()` call. From the moment the function
	* is called every change made on model is not stored into the undoStack.
	* Changes are temporarily kept until `storeBatchCommand()` is called.
	*/
	initBatchCommand(options) {
		if (this.freezed) return;
		if (this.batchCommands) this.batchLevel += 1;
		else {
			this.batchCommands = [this.createCommand({ batch: true })];
			this.batchLevel = 0;
			this.lastBatchIndex = -1;
		}
	}
	/**
	* Store changes temporarily kept in the undoStack. You have to call this
	* function as many times as `initBatchCommand()` been called.
	*/
	storeBatchCommand(options) {
		if (this.freezed) return;
		if (this.batchCommands && this.batchLevel <= 0) {
			const cmds = this.filterBatchCommand(this.batchCommands);
			if (cmds.length > 0) {
				this.redoStack = [];
				this.undoStackPush(cmds);
				this.consolidateCommands();
				this.notify("add", cmds, options);
			}
			this.batchCommands = null;
			this.lastBatchIndex = -1;
			this.batchLevel = 0;
		} else if (this.batchCommands && this.batchLevel > 0) this.batchLevel -= 1;
	}
	filterBatchCommand(batchCommands) {
		let cmds = batchCommands.slice();
		const result = [];
		while (cmds.length > 0) {
			const cmd = cmds.shift();
			const evt = cmd.event;
			const id = cmd.data.id;
			if (evt != null && (id != null || cmd.modelChange)) {
				if (Util$1.isAddEvent(evt)) {
					const index = cmds.findIndex((c) => Util$1.isRemoveEvent(c.event) && c.data.id === id);
					if (index >= 0) {
						cmds = cmds.filter((c, i) => index < i || c.data.id !== id);
						continue;
					}
				} else if (Util$1.isRemoveEvent(evt)) {
					const index = cmds.findIndex((c) => Util$1.isAddEvent(c.event) && c.data.id === id);
					if (index >= 0) {
						cmds.splice(index, 1);
						continue;
					}
				} else if (Util$1.isChangeEvent(evt)) {
					const data = cmd.data;
					if (isEqual(data.prev, data.next)) continue;
				}
				result.push(cmd);
			}
		}
		return result;
	}
	notify(event, cmd, options) {
		const cmds = cmd == null ? null : Array.isArray(cmd) ? cmd : [cmd];
		this.emit(event, {
			cmds,
			options
		});
		this.graph.trigger(`history:${event}`, {
			cmds,
			options
		});
		this.emit("change", {
			cmds,
			options
		});
		this.graph.trigger("history:change", {
			cmds,
			options
		});
	}
	push(cmd, options) {
		this.redoStack = [];
		if (cmd.batch) {
			this.lastBatchIndex = Math.max(this.lastBatchIndex, 0);
			this.emit("batch", {
				cmd,
				options
			});
		} else {
			this.undoStackPush(cmd);
			this.consolidateCommands();
			this.notify("add", cmd, options);
		}
	}
	/**
	* Conditionally combine multiple undo items into one.
	*
	* Currently this is only used combine a `cell:changed:position` event
	* followed by multiple `cell:change:parent` and `cell:change:children`
	* events, such that a "move + embed" action can be undone in one step.
	*
	* See https://github.com/antvis/X6/issues/2421
	*
	* This is an ugly WORKAROUND. It does not solve deficiencies in the batch
	* system itself.
	*/
	consolidateCommands() {
		var _a;
		const lastCommandGroup = this.undoStack[this.undoStack.length - 1];
		const penultimateCommandGroup = this.undoStack[this.undoStack.length - 2];
		if (!Array.isArray(lastCommandGroup)) return;
		const eventTypes = new Set(lastCommandGroup.map((cmd) => cmd.event));
		if (eventTypes.size !== 2 || !eventTypes.has("cell:change:parent") || !eventTypes.has("cell:change:children")) return;
		if (!lastCommandGroup.every((cmd) => {
			var _a;
			return cmd.batch && ((_a = cmd.options) === null || _a === void 0 ? void 0 : _a.ui);
		})) return;
		if (!Array.isArray(penultimateCommandGroup) || penultimateCommandGroup.length !== 1) return;
		const maybePositionChange = penultimateCommandGroup[0];
		if (maybePositionChange.event !== "cell:change:position" || !((_a = maybePositionChange.options) === null || _a === void 0 ? void 0 : _a.ui)) return;
		penultimateCommandGroup.push(...lastCommandGroup);
		this.undoStack.pop();
	}
	undoStackPush(cmd) {
		if (this.stackSize === 0) {
			this.undoStack.push(cmd);
			return;
		}
		if (this.undoStack.length >= this.stackSize) this.undoStack.shift();
		this.undoStack.push(cmd);
	}
	ensureUndefinedAttrs(newAttrs, oldAttrs) {
		let hasUndefinedAttr = false;
		if (newAttrs !== null && oldAttrs !== null && typeof newAttrs === "object" && typeof oldAttrs === "object") Object.keys(oldAttrs).forEach((key) => {
			if (newAttrs[key] === void 0 && oldAttrs[key] !== void 0) {
				newAttrs[key] = void 0;
				hasUndefinedAttr = true;
			} else if (typeof newAttrs[key] === "object" && typeof oldAttrs[key] === "object") hasUndefinedAttr = this.ensureUndefinedAttrs(newAttrs[key], oldAttrs[key]);
		});
		return hasUndefinedAttr;
	}
	dispose() {
		this.validator.dispose();
		this.clean();
		this.stopListening();
		this.off();
	}
};
__decorate$2([Basecoat.dispose()], History.prototype, "dispose", null);
(function(History) {
	/**
	* Runs a set of callbacks to determine if a command is valid. This is
	* useful for checking if a certain action in your application does
	* lead to an invalid state of the graph.
	*/
	class Validator extends Basecoat {
		constructor(options) {
			super();
			this.map = {};
			this.command = options.history;
			this.cancelInvalid = options.cancelInvalid !== false;
			this.command.on("add", this.onCommandAdded, this);
		}
		onCommandAdded({ cmds }) {
			return Array.isArray(cmds) ? cmds.every((cmd) => this.isValidCommand(cmd)) : this.isValidCommand(cmds);
		}
		isValidCommand(cmd) {
			if (cmd.options && cmd.options.validation === false) return true;
			const callbacks = cmd.event && this.map[cmd.event] || [];
			let handoverErr = null;
			callbacks.forEach((routes) => {
				let i = 0;
				const rollup = (err) => {
					const fn = routes[i];
					i += 1;
					try {
						if (fn) fn(err, cmd, rollup);
						else {
							handoverErr = err;
							return;
						}
					} catch (err) {
						rollup(err);
					}
				};
				rollup(handoverErr);
			});
			if (handoverErr) {
				if (this.cancelInvalid) this.command.cancel();
				this.emit("invalid", { err: handoverErr });
				return false;
			}
			return true;
		}
		validate(events, ...callbacks) {
			const evts = Array.isArray(events) ? events : events.split(/\s+/);
			callbacks.forEach((callback) => {
				if (typeof callback !== "function") throw new Error(`${evts.join(" ")} requires callback functions.`);
			});
			evts.forEach((event) => {
				if (this.map[event] == null) this.map[event] = [];
				this.map[event].push(callbacks);
			});
			return this;
		}
		dispose() {
			this.command.off("add", this.onCommandAdded, this);
		}
	}
	__decorate$2([Basecoat.dispose()], Validator.prototype, "dispose", null);
	History.Validator = Validator;
})(History || (History = {}));
var Util$1;
(function(Util) {
	function isAddEvent(event) {
		return event === "cell:added";
	}
	Util.isAddEvent = isAddEvent;
	function isRemoveEvent(event) {
		return event === "cell:removed";
	}
	Util.isRemoveEvent = isRemoveEvent;
	function isChangeEvent(event) {
		return event != null && event.startsWith("cell:change:");
	}
	Util.isChangeEvent = isChangeEvent;
	function getOptions(options) {
		const reservedNames = [
			"cell:added",
			"cell:removed",
			"cell:change:*"
		];
		const batchEvents = ["batch:start", "batch:stop"];
		const eventNames = options.eventNames ? options.eventNames.filter((event) => !(Util.isChangeEvent(event) || reservedNames.includes(event) || batchEvents.includes(event))) : reservedNames;
		return Object.assign(Object.assign({ enabled: true }, options), {
			eventNames,
			applyOptionsList: options.applyOptionsList || ["propertyPath"],
			revertOptionsList: options.revertOptionsList || ["propertyPath"]
		});
	}
	Util.getOptions = getOptions;
	function sortBatchCommands(cmds) {
		const results = [];
		for (let i = 0, ii = cmds.length; i < ii; i += 1) {
			const cmd = cmds[i];
			let index = null;
			if (Util.isAddEvent(cmd.event)) {
				const id = cmd.data.id;
				for (let j = 0; j < i; j += 1) if (cmds[j].data.id === id) {
					index = j;
					break;
				}
			}
			if (index !== null) results.splice(index, 0, cmd);
			else results.push(cmd);
		}
		return results;
	}
	Util.sortBatchCommands = sortBatchCommands;
})(Util$1 || (Util$1 = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-minimap@2.0.7_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-minimap/es/style/raw.js
/**
* Auto generated file, do not modify it!
*/
var content = `.x6-widget-minimap {
  position: relative;
  display: table-cell;
  box-sizing: border-box;
  overflow: hidden;
  text-align: center;
  vertical-align: middle;
  background-color: #fff;
  user-select: none;
}
.x6-widget-minimap .x6-graph {
  display: inline-block;
  box-shadow: 0 0 4px 0 #eee;
  cursor: pointer;
}
.x6-widget-minimap .x6-graph > svg {
  pointer-events: none;
  shape-rendering: optimizespeed;
}
.x6-widget-minimap .x6-graph .x6-node * {
  /* stylelint-disable-next-line */
  vector-effect: initial;
}
.x6-widget-minimap-viewport {
  position: absolute;
  box-sizing: content-box !important;
  margin: -2px 0 0 -2px;
  border: 2px solid #31d0c6;
  cursor: move;
}
.x6-widget-minimap-viewport-zoom {
  position: absolute;
  right: 0;
  bottom: 0;
  box-sizing: border-box;
  width: 12px;
  height: 12px;
  margin: 0 -6px -6px 0;
  background-color: #fff;
  border: 2px solid #31d0c6;
  border-radius: 50%;
  cursor: nwse-resize;
}
`;
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-minimap@2.0.7_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-minimap/es/index.js
var __decorate$1 = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MiniMap = class extends View {
	get scroller() {
		return this.graph.getPlugin("scroller");
	}
	get graphContainer() {
		if (this.scroller) return this.scroller.container;
		return this.graph.container;
	}
	constructor(options) {
		super();
		this.name = "minimap";
		this.options = Object.assign(Object.assign({}, Util.defaultOptions), options);
		ensure(this.name, content);
	}
	init(graph) {
		this.graph = graph;
		this.updateViewport = debounce$1(this.updateViewport.bind(this), 0);
		this.container = document.createElement("div");
		addClass(this.container, this.prefixClassName(ClassName.root));
		const graphContainer = document.createElement("div");
		this.container.appendChild(graphContainer);
		this.viewport = document.createElement("div");
		addClass(this.viewport, this.prefixClassName(ClassName.viewport));
		if (this.options.scalable) {
			this.zoomHandle = document.createElement("div");
			addClass(this.zoomHandle, this.prefixClassName(ClassName.zoom));
			appendTo(this.zoomHandle, this.viewport);
		}
		append(this.container, this.viewport);
		css(this.container, {
			width: this.options.width,
			height: this.options.height,
			padding: this.options.padding
		});
		if (this.options.container) this.options.container.appendChild(this.container);
		this.sourceGraph = this.graph;
		const targetGraphOptions = Object.assign(Object.assign({}, this.options.graphOptions), {
			container: graphContainer,
			model: this.sourceGraph.model,
			interacting: false,
			grid: false,
			background: false,
			embedding: false
		});
		this.targetGraph = this.options.createGraph ? this.options.createGraph(targetGraphOptions) : new Graph(targetGraphOptions);
		this.updatePaper(this.sourceGraph.options.width, this.sourceGraph.options.height);
		this.startListening();
	}
	startListening() {
		if (this.scroller) Event.on(this.graphContainer, `scroll${this.getEventNamespace()}`, this.updateViewport);
		else {
			this.sourceGraph.on("translate", this.onTransform, this);
			this.sourceGraph.on("scale", this.onTransform, this);
			this.sourceGraph.on("model:updated", this.onModelUpdated, this);
		}
		this.sourceGraph.on("resize", this.updatePaper, this);
		this.delegateEvents({
			mousedown: "startAction",
			touchstart: "startAction",
			[`mousedown .${this.prefixClassName("graph")}`]: "scrollTo",
			[`touchstart .${this.prefixClassName("graph")}`]: "scrollTo"
		});
	}
	stopListening() {
		if (this.scroller) Event.off(this.graphContainer, this.getEventNamespace());
		else {
			this.sourceGraph.off("translate", this.onTransform, this);
			this.sourceGraph.off("scale", this.onTransform, this);
			this.sourceGraph.off("model:updated", this.onModelUpdated, this);
		}
		this.sourceGraph.off("resize", this.updatePaper, this);
		this.undelegateEvents();
	}
	onRemove() {
		this.stopListening();
		this.targetGraph.dispose(false);
	}
	onTransform(options) {
		if (options.ui || this.targetGraphTransforming || !this.scroller) this.updateViewport();
	}
	onModelUpdated() {
		this.targetGraph.zoomToFit();
	}
	updatePaper(w, h) {
		let width;
		let height;
		if (typeof w === "object") {
			width = w.width;
			height = w.height;
		} else {
			width = w;
			height = h;
		}
		const origin = this.sourceGraph.options;
		const scale = this.sourceGraph.transform.getScale();
		const maxWidth = this.options.width - 2 * this.options.padding;
		const maxHeight = this.options.height - 2 * this.options.padding;
		width /= scale.sx;
		height /= scale.sy;
		this.ratio = Math.min(maxWidth / width, maxHeight / height);
		const ratio = this.ratio;
		const x = origin.x * ratio / scale.sx;
		const y = origin.y * ratio / scale.sy;
		width *= ratio;
		height *= ratio;
		this.targetGraph.resize(width, height);
		this.targetGraph.translate(x, y);
		if (this.scroller) this.targetGraph.scale(ratio, ratio);
		else this.targetGraph.zoomToFit();
		this.updateViewport();
		return this;
	}
	updateViewport() {
		const sourceGraphScale = this.sourceGraph.transform.getScale();
		const targetGraphScale = this.targetGraph.transform.getScale();
		let origin = null;
		if (this.scroller) origin = this.scroller.clientToLocalPoint(0, 0);
		else origin = this.graph.graphToLocal(0, 0);
		const position$1 = position(this.targetGraph.container);
		const translation = this.targetGraph.translate();
		translation.ty = translation.ty || 0;
		this.geometry = {
			top: position$1.top + origin.y * targetGraphScale.sy + translation.ty,
			left: position$1.left + origin.x * targetGraphScale.sx + translation.tx,
			width: this.graphContainer.clientWidth * targetGraphScale.sx / sourceGraphScale.sx,
			height: this.graphContainer.clientHeight * targetGraphScale.sy / sourceGraphScale.sy
		};
		css(this.viewport, this.geometry);
	}
	startAction(evt) {
		const e = this.normalizeEvent(evt);
		const action = e.target === this.zoomHandle ? "zooming" : "panning";
		const { tx, ty } = this.sourceGraph.translate();
		const eventData = {
			action,
			clientX: e.clientX,
			clientY: e.clientY,
			scrollLeft: this.graphContainer.scrollLeft,
			scrollTop: this.graphContainer.scrollTop,
			zoom: this.sourceGraph.zoom(),
			scale: this.sourceGraph.transform.getScale(),
			geometry: this.geometry,
			translateX: tx,
			translateY: ty
		};
		this.targetGraphTransforming = true;
		this.delegateDocumentEvents(Util.documentEvents, eventData);
	}
	doAction(evt) {
		const e = this.normalizeEvent(evt);
		const clientX = e.clientX;
		const clientY = e.clientY;
		const data = e.data;
		switch (data.action) {
			case "panning": {
				const scale = this.sourceGraph.transform.getScale();
				const rx = (clientX - data.clientX) * scale.sx;
				const ry = (clientY - data.clientY) * scale.sy;
				if (this.scroller) {
					this.graphContainer.scrollLeft = data.scrollLeft + rx / this.ratio;
					this.graphContainer.scrollTop = data.scrollTop + ry / this.ratio;
				} else this.sourceGraph.translate(data.translateX - rx / this.ratio, data.translateY - ry / this.ratio);
				break;
			}
			case "zooming": {
				const startScale = data.scale;
				const startGeometry = data.geometry;
				const delta = 1 + (data.clientX - clientX) / startGeometry.width / startScale.sx;
				if (data.frameId) cancelAnimationFrame(data.frameId);
				data.frameId = requestAnimationFrame(() => {
					this.sourceGraph.zoom(delta * data.zoom, {
						absolute: true,
						minScale: this.options.minScale,
						maxScale: this.options.maxScale
					});
				});
				break;
			}
		}
	}
	stopAction() {
		this.undelegateDocumentEvents();
		this.targetGraphTransforming = false;
	}
	scrollTo(evt) {
		const e = this.normalizeEvent(evt);
		let x;
		let y;
		const ts = this.targetGraph.translate();
		ts.ty = ts.ty || 0;
		if (e.offsetX == null) {
			const offset = offset$1(this.targetGraph.container);
			x = e.pageX - offset.left;
			y = e.pageY - offset.top;
		} else {
			x = e.offsetX;
			y = e.offsetY;
		}
		const cx = (x - ts.tx) / this.ratio;
		const cy = (y - ts.ty) / this.ratio;
		this.sourceGraph.centerPoint(cx, cy);
	}
	dispose() {
		this.remove();
		clean(this.name);
	}
};
__decorate$1([View.dispose()], MiniMap.prototype, "dispose", null);
var ClassName;
(function(ClassName) {
	ClassName.root = "widget-minimap";
	ClassName.viewport = `${ClassName.root}-viewport`;
	ClassName.zoom = `${ClassName.viewport}-zoom`;
})(ClassName || (ClassName = {}));
var Util;
(function(Util) {
	Util.defaultOptions = {
		width: 300,
		height: 200,
		padding: 10,
		scalable: true,
		minScale: .01,
		maxScale: 16,
		graphOptions: {},
		createGraph: (options) => new Graph(options)
	};
	Util.documentEvents = {
		mousemove: "doAction",
		touchmove: "doAction",
		mouseup: "stopAction",
		touchend: "stopAction"
	};
})(Util || (Util = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-export@2.1.6_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-export/es/api.js
Graph.prototype.toSVG = function(callback, options) {
	const instance = this.getPlugin("export");
	if (instance) instance.toSVG(callback, options);
};
Graph.prototype.toPNG = function(callback, options) {
	const instance = this.getPlugin("export");
	if (instance) instance.toPNG(callback, options);
};
Graph.prototype.toJPEG = function(callback, options) {
	const instance = this.getPlugin("export");
	if (instance) instance.toJPEG(callback, options);
};
Graph.prototype.exportPNG = function(fileName, options) {
	const instance = this.getPlugin("export");
	if (instance) instance.exportPNG(fileName, options);
};
Graph.prototype.exportJPEG = function(fileName, options) {
	const instance = this.getPlugin("export");
	if (instance) instance.exportJPEG(fileName, options);
};
Graph.prototype.exportSVG = function(fileName, options) {
	const instance = this.getPlugin("export");
	if (instance) instance.exportSVG(fileName, options);
};
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-plugin-export@2.1.6_@antv+x6@2.19.2/node_modules/@antv/x6-plugin-export/es/index.js
var __decorate = function(decorators, target, key, desc) {
	var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
	if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
	else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
	return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Export = class extends Basecoat {
	constructor() {
		super();
		this.name = "export";
	}
	get view() {
		return this.graph.view;
	}
	init(graph) {
		this.graph = graph;
	}
	exportPNG(fileName = "chart", options = {}) {
		this.toPNG((dataUri) => {
			DataUri.downloadDataUri(dataUri, fileName);
		}, options);
	}
	exportJPEG(fileName = "chart", options = {}) {
		this.toPNG((dataUri) => {
			DataUri.downloadDataUri(dataUri, fileName);
		}, options);
	}
	exportSVG(fileName = "chart", options = {}) {
		this.toSVG((svg) => {
			DataUri.downloadDataUri(DataUri.svgToDataUrl(svg), fileName);
		}, options);
	}
	toSVG(callback, options = {}) {
		this.notify("before:export", options);
		const rawSVG = this.view.svg;
		const vSVG = Vector.create(rawSVG).clone();
		let clonedSVG = vSVG.node;
		const vStage = vSVG.findOne(`.${this.view.prefixClassName("graph-svg-stage")}`);
		const viewBox = options.viewBox || this.graph.graphToLocal(this.graph.getContentBBox());
		const dimension = options.preserveDimensions;
		if (dimension) {
			const size = typeof dimension === "boolean" ? viewBox : dimension;
			vSVG.attr({
				width: size.width,
				height: size.height
			});
		}
		vSVG.removeAttribute("style").attr("viewBox", [
			viewBox.x,
			viewBox.y,
			viewBox.width,
			viewBox.height
		].join(" "));
		vStage.removeAttribute("transform");
		if (options.copyStyles !== false) {
			const document = rawSVG.ownerDocument;
			const raws = Array.from(rawSVG.querySelectorAll("*"));
			const clones = Array.from(clonedSVG.querySelectorAll("*"));
			const styleSheetCount = document.styleSheets.length;
			const styleSheetsCopy = [];
			for (let k = styleSheetCount - 1; k >= 0; k -= 1) {
				styleSheetsCopy[k] = document.styleSheets[k];
				document.styleSheets[k].disabled = true;
			}
			const defaultComputedStyles = {};
			raws.forEach((elem, index) => {
				const computedStyle = window.getComputedStyle(elem, null);
				const defaultComputedStyle = {};
				Object.keys(computedStyle).forEach((property) => {
					defaultComputedStyle[property] = computedStyle.getPropertyValue(property);
				});
				defaultComputedStyles[index] = defaultComputedStyle;
			});
			if (styleSheetCount !== document.styleSheets.length) styleSheetsCopy.forEach((copy, index) => {
				document.styleSheets[index] = copy;
			});
			for (let i = 0; i < styleSheetCount; i += 1) document.styleSheets[i].disabled = false;
			const customStyles = {};
			raws.forEach((elem, index) => {
				const computedStyle = window.getComputedStyle(elem, null);
				const defaultComputedStyle = defaultComputedStyles[index];
				const customStyle = {};
				Object.keys(computedStyle).forEach((property) => {
					if (!isNumber(property) && computedStyle.getPropertyValue(property) !== defaultComputedStyle[property]) customStyle[property] = computedStyle.getPropertyValue(property);
				});
				customStyles[index] = customStyle;
			});
			clones.forEach((elem, index) => {
				css(elem, customStyles[index]);
			});
		}
		const stylesheet = options.stylesheet;
		if (typeof stylesheet === "string") {
			const cDATASection = rawSVG.ownerDocument.implementation.createDocument(null, "xml", null).createCDATASection(stylesheet);
			vSVG.prepend(Vector.create("style", { type: "text/css" }, [cDATASection]));
		}
		const format = () => {
			const beforeSerialize = options.beforeSerialize;
			if (typeof beforeSerialize === "function") {
				const ret = call$1(beforeSerialize, this.graph, clonedSVG);
				if (ret instanceof SVGSVGElement) clonedSVG = ret;
			}
			const dataUri = new XMLSerializer().serializeToString(clonedSVG).replace(/&nbsp;/g, "\xA0");
			this.notify("after:export", options);
			callback(dataUri);
		};
		if (options.serializeImages) {
			const deferrals = vSVG.find("image").map((vImage) => {
				return new Promise((resolve) => {
					const url = vImage.attr("xlink:href") || vImage.attr("href");
					DataUri.imageToDataUri(url, (err, dataUri) => {
						if (!err && dataUri) vImage.attr("xlink:href", dataUri);
						resolve();
					});
				});
			});
			Promise.all(deferrals).then(format);
		} else format();
	}
	toDataURL(callback, options) {
		let viewBox = options.viewBox || this.graph.getContentBBox();
		const padding = normalizeSides(options.padding);
		if (options.width && options.height) {
			if (padding.left + padding.right >= options.width) padding.left = padding.right = 0;
			if (padding.top + padding.bottom >= options.height) padding.top = padding.bottom = 0;
		}
		const expanding = new Rectangle(-padding.left, -padding.top, padding.left + padding.right, padding.top + padding.bottom);
		if (options.width && options.height) {
			const width = viewBox.width + padding.left + padding.right;
			const height = viewBox.height + padding.top + padding.bottom;
			expanding.scale(width / options.width, height / options.height);
		}
		viewBox = Rectangle.create(viewBox).moveAndExpand(expanding);
		const rawSize = typeof options.width === "number" && typeof options.height === "number" ? {
			width: options.width,
			height: options.height
		} : viewBox;
		let scale = options.ratio ? parseFloat(options.ratio) : 1;
		if (!Number.isFinite(scale) || scale === 0) scale = 1;
		const size = {
			width: Math.max(Math.round(rawSize.width * scale), 1),
			height: Math.max(Math.round(rawSize.height * scale), 1)
		};
		{
			const imgDataCanvas = document.createElement("canvas");
			const context2D = imgDataCanvas.getContext("2d");
			imgDataCanvas.width = size.width;
			imgDataCanvas.height = size.height;
			const x = size.width - 1;
			const y = size.height - 1;
			context2D.fillStyle = "rgb(1,1,1)";
			context2D.fillRect(x, y, 1, 1);
			const data = context2D.getImageData(x, y, 1, 1).data;
			if (data[0] !== 1 || data[1] !== 1 || data[2] !== 1) throw new Error("size exceeded");
		}
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = size.width;
			canvas.height = size.height;
			const context = canvas.getContext("2d");
			context.fillStyle = options.backgroundColor || "white";
			context.fillRect(0, 0, size.width, size.height);
			try {
				context.drawImage(img, 0, 0, size.width, size.height);
				callback(canvas.toDataURL(options.type, options.quality));
			} catch (error) {}
		};
		this.toSVG((dataUri) => {
			img.src = `data:image/svg+xml,${encodeURIComponent(dataUri)}`;
		}, Object.assign(Object.assign({}, options), {
			viewBox,
			serializeImages: true,
			preserveDimensions: Object.assign({}, size)
		}));
	}
	toPNG(callback, options = {}) {
		this.toDataURL(callback, Object.assign(Object.assign({}, options), { type: "image/png" }));
	}
	toJPEG(callback, options = {}) {
		this.toDataURL(callback, Object.assign(Object.assign({}, options), { type: "image/jpeg" }));
	}
	notify(name, args) {
		this.trigger(name, args);
		this.graph.trigger(name, args);
	}
	dispose() {
		this.off();
	}
};
__decorate([Basecoat.dispose()], Export.prototype, "dispose", null);
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-vue-shape@2.1.2_@antv+x6@2.19.2_vue@3.5.40_typescript@5.9.3_/node_modules/@antv/x6-vue-shape/es/node.js
var VueShape = class extends Node$1 {};
(function(VueShape) {
	function getMarkup(primer) {
		const markup = [];
		const content = Markup.getForeignObjectMarkup();
		if (primer) markup.push(...[{
			tagName: primer,
			selector: "body"
		}, content]);
		else markup.push(content);
		return markup;
	}
	VueShape.config({
		view: "vue-shape-view",
		markup: getMarkup(),
		attrs: {
			body: {
				fill: "none",
				stroke: "none",
				refWidth: "100%",
				refHeight: "100%"
			},
			fo: {
				refWidth: "100%",
				refHeight: "100%"
			}
		},
		propHooks(metadata) {
			if (metadata.markup == null) {
				const primer = metadata.primer;
				if (primer) {
					metadata.markup = getMarkup(primer);
					let attrs = {};
					switch (primer) {
						case "circle":
							attrs = {
								refCx: "50%",
								refCy: "50%",
								refR: "50%"
							};
							break;
						case "ellipse": attrs = {
							refCx: "50%",
							refCy: "50%",
							refRx: "50%",
							refRy: "50%"
						};
					}
					metadata.attrs = merge({}, { body: Object.assign({
						refWidth: null,
						refHeight: null
					}, attrs) }, metadata.attrs || {});
				}
			}
			return metadata;
		}
	});
	Node$1.registry.register("vue-shape", VueShape, true);
})(VueShape || (VueShape = {}));
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-vue-shape@2.1.2_@antv+x6@2.19.2_vue@3.5.40_typescript@5.9.3_/node_modules/@antv/x6-vue-shape/es/registry.js
var __rest = function(s, e) {
	var t = {};
	for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
	if (s != null && typeof Object.getOwnPropertySymbols === "function") {
		for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
	}
	return t;
};
var shapeMaps = {};
function register(config) {
	const { shape, component, inherit } = config, others = __rest(config, [
		"shape",
		"component",
		"inherit"
	]);
	if (!shape) throw new Error("should specify shape in config");
	shapeMaps[shape] = { component };
	Graph.registerNode(shape, Object.assign({ inherit: inherit || "vue-shape" }, others), true);
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-vue-shape@2.1.2_@antv+x6@2.19.2_vue@3.5.40_typescript@5.9.3_/node_modules/@antv/x6-vue-shape/es/teleport.js
var active = false;
var items = reactive({});
function connect(id, component, container, node, graph) {
	if (active) items[id] = markRaw(defineComponent({
		render: () => h(Teleport, { to: container }, [h(component, {
			node,
			graph
		})]),
		provide: () => ({
			getNode: () => node,
			getGraph: () => graph
		})
	}));
}
function disconnect(id) {
	if (active) delete items[id];
}
function isActive() {
	return active;
}
//#endregion
//#region ../../node_modules/.pnpm/@antv+x6-vue-shape@2.1.2_@antv+x6@2.19.2_vue@3.5.40_typescript@5.9.3_/node_modules/@antv/x6-vue-shape/es/view.js
var VueShapeView = class VueShapeView extends NodeView {
	getComponentContainer() {
		return this.selectors && this.selectors.foContent;
	}
	confirmUpdate(flag) {
		const ret = super.confirmUpdate(flag);
		return this.handleAction(ret, VueShapeView.action, () => {
			this.renderVueComponent();
		});
	}
	targetId() {
		return `${this.graph.view.cid}:${this.cell.id}`;
	}
	renderVueComponent() {
		this.unmountVueComponent();
		const root = this.getComponentContainer();
		const node = this.cell;
		const graph = this.graph;
		if (root) {
			const { component } = shapeMaps[node.shape];
			if (component) if (isActive()) connect(this.targetId(), component, root, node, graph);
			else {
				this.vm = createApp({
					render() {
						return h(component, {
							node,
							graph
						});
					},
					provide() {
						return {
							getNode: () => node,
							getGraph: () => graph
						};
					}
				});
				this.vm.mount(root);
			}
		}
	}
	unmountVueComponent() {
		const root = this.getComponentContainer();
		if (this.vm) {
			this.vm.unmount();
			this.vm = null;
		}
		if (root) root.innerHTML = "";
		return root;
	}
	onMouseDown(e, x, y) {
		const target = e.target;
		if (target.tagName.toLowerCase() === "input") {
			const type = target.getAttribute("type");
			if (type == null || [
				"text",
				"password",
				"number",
				"email",
				"search",
				"tel",
				"url"
			].includes(type)) return;
		}
		super.onMouseDown(e, x, y);
	}
	unmount() {
		if (isActive()) disconnect(this.targetId());
		this.unmountVueComponent();
		super.unmount();
		return this;
	}
};
(function(VueShapeView) {
	VueShapeView.action = "vue";
	VueShapeView.config({
		bootstrap: [VueShapeView.action],
		actions: { component: VueShapeView.action }
	});
	NodeView.registry.register("vue-shape-view", VueShapeView, true);
})(VueShapeView || (VueShapeView = {}));
//#endregion
export { call$1 as A, remove as C, toggleClass as D, removeClass as E, isAsync as O, appendTo as S, hasClass as T, ensure as _, Clipboard as a, attr as b, Snapline as c, Model as d, Node$1 as f, clean as g, GeometryUtil as h, History as i, toDeferredBoolean as k, Graph as l, Rectangle as m, Export as n, Keyboard as o, View as p, MiniMap as r, Selection as s, register as t, Edge as u, offset$1 as v, addClass as w, append as x, css as y };
