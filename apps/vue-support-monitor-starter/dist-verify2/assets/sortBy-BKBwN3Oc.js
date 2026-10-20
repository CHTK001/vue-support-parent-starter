import { n as isSymbol } from "./isObject-CBh4bHyD.js";
import { _ as isArray, d as eq, t as baseGet, v as arrayMap } from "./_baseGet-DmmfCxUg.js";
import { o as identity, t as baseFlatten } from "./_baseFlatten-D6objHuc.js";
import { h as baseUnary } from "./_Uint8Array-Cf2dnQh6.js";
import { o as keysIn } from "./_baseClone-CR0xuNh7.js";
import { t as baseIteratee } from "./_baseIteratee-0zvAcVIj.js";
import { n as baseRest } from "./isArrayLikeObject-CeWRLNuC.js";
import { a as isIterateeCall, n as baseMap } from "./merge-DIljS_69.js";
import { n as hasPath } from "./hasIn-COufhDdn.js";
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_hasUnicode.js
/** Used to detect strings with [zero-width joiners or code points from the astral planes](http://eev.ee/blog/2015/09/12/dark-corners-of-unicode/). */
var reHasUnicode = RegExp("[\\u200d\\ud800-\\udfff\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff\\ufe0e\\ufe0f]");
/**
* Checks if `string` contains Unicode symbols.
*
* @private
* @param {string} string The string to inspect.
* @returns {boolean} Returns `true` if a symbol is found, else `false`.
*/
function hasUnicode(string) {
	return reHasUnicode.test(string);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/defaults.js
/** Used for built-in method references. */
var objectProto = Object.prototype;
/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto.hasOwnProperty;
/**
* Assigns own and inherited enumerable string keyed properties of source
* objects to the destination object for all destination properties that
* resolve to `undefined`. Source objects are applied from left to right.
* Once a property is set, additional values of the same property are ignored.
*
* **Note:** This method mutates `object`.
*
* @static
* @since 0.1.0
* @memberOf _
* @category Object
* @param {Object} object The destination object.
* @param {...Object} [sources] The source objects.
* @returns {Object} Returns `object`.
* @see _.defaultsDeep
* @example
*
* _.defaults({ 'a': 1 }, { 'b': 2 }, { 'a': 3 });
* // => { 'a': 1, 'b': 2 }
*/
var defaults = baseRest(function(object, sources) {
	object = Object(object);
	var index = -1;
	var length = sources.length;
	var guard = length > 2 ? sources[2] : void 0;
	if (guard && isIterateeCall(sources[0], sources[1], guard)) length = 1;
	while (++index < length) {
		var source = sources[index];
		var props = keysIn(source);
		var propsIndex = -1;
		var propsLength = props.length;
		while (++propsIndex < propsLength) {
			var key = props[propsIndex];
			var value = object[key];
			if (value === void 0 || eq(value, objectProto[key]) && !hasOwnProperty$1.call(object, key)) object[key] = source[key];
		}
	}
	return object;
});
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseGt.js
/**
* The base implementation of `_.gt` which doesn't coerce arguments.
*
* @private
* @param {*} value The value to compare.
* @param {*} other The other value to compare.
* @returns {boolean} Returns `true` if `value` is greater than `other`,
*  else `false`.
*/
function baseGt(value, other) {
	return value > other;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseHas.js
/** Used to check objects for own properties. */
var hasOwnProperty = Object.prototype.hasOwnProperty;
/**
* The base implementation of `_.has` without support for deep paths.
*
* @private
* @param {Object} [object] The object to query.
* @param {Array|string} key The key to check.
* @returns {boolean} Returns `true` if `key` exists, else `false`.
*/
function baseHas(object, key) {
	return object != null && hasOwnProperty.call(object, key);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/has.js
/**
* Checks if `path` is a direct property of `object`.
*
* @static
* @since 0.1.0
* @memberOf _
* @category Object
* @param {Object} object The object to query.
* @param {Array|string} path The path to check.
* @returns {boolean} Returns `true` if `path` exists, else `false`.
* @example
*
* var object = { 'a': { 'b': 2 } };
* var other = _.create({ 'a': _.create({ 'b': 2 }) });
*
* _.has(object, 'a');
* // => true
*
* _.has(object, 'a.b');
* // => true
*
* _.has(object, ['a', 'b']);
* // => true
*
* _.has(other, 'a');
* // => false
*/
function has(object, path) {
	return object != null && hasPath(object, path, baseHas);
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseExtremum.js
/**
* The base implementation of methods like `_.max` and `_.min` which accepts a
* `comparator` to determine the extremum value.
*
* @private
* @param {Array} array The array to iterate over.
* @param {Function} iteratee The iteratee invoked per iteration.
* @param {Function} comparator The comparator used to compare values.
* @returns {*} Returns the extremum value.
*/
function baseExtremum(array, iteratee, comparator) {
	var index = -1, length = array.length;
	while (++index < length) {
		var value = array[index], current = iteratee(value);
		if (current != null && (computed === void 0 ? current === current && !isSymbol(current) : comparator(current, computed))) var computed = current, result = value;
	}
	return result;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/max.js
/**
* Computes the maximum value of `array`. If `array` is empty or falsey,
* `undefined` is returned.
*
* @static
* @since 0.1.0
* @memberOf _
* @category Math
* @param {Array} array The array to iterate over.
* @returns {*} Returns the maximum value.
* @example
*
* _.max([4, 2, 8, 6]);
* // => 8
*
* _.max([]);
* // => undefined
*/
function max(array) {
	return array && array.length ? baseExtremum(array, identity, baseGt) : void 0;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseSortBy.js
/**
* The base implementation of `_.sortBy` which uses `comparer` to define the
* sort order of `array` and replaces criteria objects with their corresponding
* values.
*
* @private
* @param {Array} array The array to sort.
* @param {Function} comparer The function to define sort order.
* @returns {Array} Returns `array`.
*/
function baseSortBy(array, comparer) {
	var length = array.length;
	array.sort(comparer);
	while (length--) array[length] = array[length].value;
	return array;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_compareAscending.js
/**
* Compares values to sort them in ascending order.
*
* @private
* @param {*} value The value to compare.
* @param {*} other The other value to compare.
* @returns {number} Returns the sort order indicator for `value`.
*/
function compareAscending(value, other) {
	if (value !== other) {
		var valIsDefined = value !== void 0, valIsNull = value === null, valIsReflexive = value === value, valIsSymbol = isSymbol(value);
		var othIsDefined = other !== void 0, othIsNull = other === null, othIsReflexive = other === other, othIsSymbol = isSymbol(other);
		if (!othIsNull && !othIsSymbol && !valIsSymbol && value > other || valIsSymbol && othIsDefined && othIsReflexive && !othIsNull && !othIsSymbol || valIsNull && othIsDefined && othIsReflexive || !valIsDefined && othIsReflexive || !valIsReflexive) return 1;
		if (!valIsNull && !valIsSymbol && !othIsSymbol && value < other || othIsSymbol && valIsDefined && valIsReflexive && !valIsNull && !valIsSymbol || othIsNull && valIsDefined && valIsReflexive || !othIsDefined && valIsReflexive || !othIsReflexive) return -1;
	}
	return 0;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_compareMultiple.js
/**
* Used by `_.orderBy` to compare multiple properties of a value to another
* and stable sort them.
*
* If `orders` is unspecified, all values are sorted in ascending order. Otherwise,
* specify an order of "desc" for descending or "asc" for ascending sort order
* of corresponding values.
*
* @private
* @param {Object} object The object to compare.
* @param {Object} other The other object to compare.
* @param {boolean[]|string[]} orders The order to sort by for each property.
* @returns {number} Returns the sort order indicator for `object`.
*/
function compareMultiple(object, other, orders) {
	var index = -1, objCriteria = object.criteria, othCriteria = other.criteria, length = objCriteria.length, ordersLength = orders.length;
	while (++index < length) {
		var result = compareAscending(objCriteria[index], othCriteria[index]);
		if (result) {
			if (index >= ordersLength) return result;
			return result * (orders[index] == "desc" ? -1 : 1);
		}
	}
	return object.index - other.index;
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/_baseOrderBy.js
/**
* The base implementation of `_.orderBy` without param guards.
*
* @private
* @param {Array|Object} collection The collection to iterate over.
* @param {Function[]|Object[]|string[]} iteratees The iteratees to sort by.
* @param {string[]} orders The sort orders of `iteratees`.
* @returns {Array} Returns the new sorted array.
*/
function baseOrderBy(collection, iteratees, orders) {
	if (iteratees.length) iteratees = arrayMap(iteratees, function(iteratee) {
		if (isArray(iteratee)) return function(value) {
			return baseGet(value, iteratee.length === 1 ? iteratee[0] : iteratee);
		};
		return iteratee;
	});
	else iteratees = [identity];
	var index = -1;
	iteratees = arrayMap(iteratees, baseUnary(baseIteratee));
	return baseSortBy(baseMap(collection, function(value, key, collection) {
		return {
			"criteria": arrayMap(iteratees, function(iteratee) {
				return iteratee(value);
			}),
			"index": ++index,
			"value": value
		};
	}), function(object, other) {
		return compareMultiple(object, other, orders);
	});
}
//#endregion
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/sortBy.js
/**
* Creates an array of elements, sorted in ascending order by the results of
* running each element in a collection thru each iteratee. This method
* performs a stable sort, that is, it preserves the original sort order of
* equal elements. The iteratees are invoked with one argument: (value).
*
* @static
* @memberOf _
* @since 0.1.0
* @category Collection
* @param {Array|Object} collection The collection to iterate over.
* @param {...(Function|Function[])} [iteratees=[_.identity]]
*  The iteratees to sort by.
* @returns {Array} Returns the new sorted array.
* @example
*
* var users = [
*   { 'user': 'fred',   'age': 48 },
*   { 'user': 'barney', 'age': 36 },
*   { 'user': 'fred',   'age': 30 },
*   { 'user': 'barney', 'age': 34 }
* ];
*
* _.sortBy(users, [function(o) { return o.user; }]);
* // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 30]]
*
* _.sortBy(users, ['user', 'age']);
* // => objects for [['barney', 34], ['barney', 36], ['fred', 30], ['fred', 48]]
*/
var sortBy = baseRest(function(collection, iteratees) {
	if (collection == null) return [];
	var length = iteratees.length;
	if (length > 1 && isIterateeCall(collection, iteratees[0], iteratees[1])) iteratees = [];
	else if (length > 2 && isIterateeCall(iteratees[0], iteratees[1], iteratees[2])) iteratees = [iteratees[0]];
	return baseOrderBy(collection, baseFlatten(iteratees, 1), []);
});
//#endregion
export { defaults as a, has as i, max as n, hasUnicode as o, baseExtremum as r, sortBy as t };
