import { t as baseSet } from "./_baseSet-CMSvwkCM.js";
import { t as get } from "./get-cR0zxN0m.js";
//#region ../../node_modules/.pnpm/lodash-es@4.18.1/node_modules/lodash-es/set.js
/**
* Sets the value at `path` of `object`. If a portion of `path` doesn't exist,
* it's created. Arrays are created for missing index properties while objects
* are created for all other missing properties. Use `_.setWith` to customize
* `path` creation.
*
* **Note:** This method mutates `object`.
*
* @static
* @memberOf _
* @since 3.7.0
* @category Object
* @param {Object} object The object to modify.
* @param {Array|string} path The path of the property to set.
* @param {*} value The value to set.
* @returns {Object} Returns `object`.
* @example
*
* var object = { 'a': [{ 'b': { 'c': 3 } }] };
*
* _.set(object, 'a[0].b.c', 4);
* console.log(object.a[0].b.c);
* // => 4
*
* _.set(object, ['x', '0', 'y', 'z'], 5);
* console.log(object.x[0].y.z);
* // => 5
*/
function set(object, path, value) {
	return object == null ? object : baseSet(object, path, value);
}
//#endregion
//#region ../../node_modules/.pnpm/element-plus@2.14.3_vue@3.5.40_typescript@5.9.3_/node_modules/element-plus/es/utils/objects.mjs
var keysOf = (arr) => Object.keys(arr);
var entriesOf = (arr) => Object.entries(arr);
var getProp = (obj, path, defaultValue) => {
	return {
		get value() {
			return get(obj, path, defaultValue);
		},
		set value(val) {
			set(obj, path, val);
		}
	};
};
//#endregion
export { getProp as n, keysOf as r, entriesOf as t };
